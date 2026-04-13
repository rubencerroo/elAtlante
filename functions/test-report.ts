/**
 * Daily Shift Report — Cloudflare Pages Function
 * GET /test-report  → triggers the report manually for testing
 * 
 * Before sending, checks if the restaurant was open today by consulting:
 *   1. Default OPENING_HOURS (closed on martes/miercoles)
 *   2. calendar_days table in Supabase (overrides per specific date)
 *
 * If the restaurant is closed today, the report is skipped.
 */

// ── Restaurant schedule (mirrored from src/utils/reservationUtils.ts) ──
const OPENING_HOURS = {
	standard: { start: '12:30', end: '23:00' },
	sunday:   { start: '12:30', end: '16:30' },
	closed: ['martes', 'miercoles']  // normalized day names, no accents
};

function normalizeDayName(date: Date): string {
	const day = date.toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'Atlantic/Canary' }).toLowerCase();
	return day.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getClosingTime(dayName: string): string {
	if (dayName === 'domingo') return OPENING_HOURS.sunday.end;
	return OPENING_HOURS.standard.end;
}

// ── Core report logic ──

interface ReportResult {
	success: boolean;
	skipped?: boolean;
	reason?: string;
	data?: any;
	error?: string;
}

async function buildAndSendReport(env: any, forceEvenIfClosed = false): Promise<ReportResult> {
	const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
	const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
	const brevoApiKey = env.BREVO_API_KEY || env.VITE_BREVO_API_KEY;

	if (!supabaseUrl || !supabaseKey) {
		return { success: false, error: 'Faltan credenciales de Supabase en el entorno' };
	}
	if (!brevoApiKey) {
		return { success: false, error: 'Falta BREVO_API_KEY en el entorno' };
	}

	const headers = {
		'apikey': supabaseKey,
		'Authorization': `Bearer ${supabaseKey}`,
		'Content-Type': 'application/json'
	};

	// ── 1. Fecha de hoy (Canarias) ──
	const canariasTimeStr = new Date().toLocaleString("en-US", { timeZone: "Atlantic/Canary" });
	const today = new Date(canariasTimeStr);
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, '0');
	const day = String(today.getDate()).padStart(2, '0');
	const todayDateStr = `${year}-${month}-${day}`;

	const dayName = normalizeDayName(today);
	const dow = today.getDay(); // 0=Sun

	const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
	const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
	const prettyDate = `${dayNames[dow]}, ${parseInt(day)} de ${monthNames[today.getMonth()]} ${year}`;

	// ── 2. Check if restaurant is open today ──
	// 2a. Check calendar_days overrides in Supabase
	const overrideQuery = `${supabaseUrl}/rest/v1/calendar_days?date=eq.${todayDateStr}&select=is_closed,slots`;
	const overrideFetch = await fetch(overrideQuery, { headers });
	
	let overrideFound = false;
	let overrideClosed = false;
	let overrideSlots: { start: string; end: string }[] | null = null;

	if (overrideFetch.ok) {
		const overrideData = await overrideFetch.json() as any[];
		if (overrideData.length > 0) {
			overrideFound = true;
			overrideClosed = overrideData[0].is_closed;
			overrideSlots = overrideData[0].slots;
		}
	}

	// 2b. Determine if closed
	let isClosed = false;
	if (overrideFound) {
		isClosed = overrideClosed;
	} else {
		isClosed = OPENING_HOURS.closed.includes(dayName);
	}

	if (isClosed && !forceEvenIfClosed) {
		return {
			success: true,
			skipped: true,
			reason: `Restaurante cerrado hoy (${prettyDate}). Reporte no enviado.`
		};
	}

	// 2c. Determine closing time for the subject line and cron check
	let closingTime = getClosingTime(dayName);
	if (overrideFound && !overrideClosed && overrideSlots && overrideSlots.length > 0) {
		// Use the latest slot end time as closing
		closingTime = overrideSlots.reduce((latest, slot) => 
			slot.end > latest ? slot.end : latest, overrideSlots[0].end);
	}

	// 2d. CRON time check: Ensure we are currently approx 30 minutes after closing time
	if (!forceEvenIfClosed) {
		const [cHours, cMins] = closingTime.split(':').map(Number);
		const expectedSendMins = cHours * 60 + cMins + 30; // 30 mins after closing
		const nowMins = today.getHours() * 60 + today.getMinutes();
		
		// If current time is not within a 15 min window of expected time, abort.
		if (Math.abs(nowMins - expectedSendMins) > 15) {
			return {
				success: true,
				skipped: true,
				reason: `Aún no es la hora de envío. Cierre hoy: ${closingTime}. Esperando a +30 mins. (Son las ${today.getHours()}:${today.getMinutes()} y espero enviar a las ${Math.floor(expectedSendMins/60)}:${expectedSendMins%60})`
			};
		}
	}

	// ── 3. Fetch all reservations for today ──
	const resQuery = `${supabaseUrl}/rest/v1/reservations?date=eq.${todayDateStr}&select=*`;
	const resFetch = await fetch(resQuery, { headers });
	if (!resFetch.ok) throw new Error(`Error Supabase Reservas: ${await resFetch.text()}`);
	const reservations = await resFetch.json() as any[];

	// ── 4. Fetch Shift Notes ──
	const notesQuery = `${supabaseUrl}/rest/v1/shift_notes?date=eq.${todayDateStr}&select=content`;
	const notesFetch = await fetch(notesQuery, { headers });
	let shiftNotes = "";
	if (notesFetch.ok) {
		const notesData = await notesFetch.json() as any[];
		if (notesData.length > 0 && notesData[0].content) {
			shiftNotes = notesData[0].content;
		}
	}

	// ── 5. Calculate metrics ──
	let totalCovers = 0;
	let totalReservations = 0;
	let noShows = 0;
	let noShowGuests = 0;
	let walkInCount = 0;
	let walkInGuests = 0;
	let cancelledCount = 0;
	let completedCount = 0;
	let seatedCount = 0;
	let confirmedCount = 0;
	let pendingCount = 0;
	let petsCount = 0;
	const hourBuckets: Record<string, number> = {};
	const zoneCounts: Record<string, number> = {};
	const tableSet = new Set<number>();

	reservations.forEach(r => {
		totalReservations++;

		if (r.status === 'no-show') {
			noShows++;
			noShowGuests += r.guests || 0;
		} else if (r.status === 'cancelled') {
			cancelledCount++;
		} else {
			totalCovers += r.guests || 0;

			if (r.status === 'completed') completedCount++;
			else if (r.status === 'seated') seatedCount++;
			else if (r.status === 'confirmed') confirmedCount++;
			else if (r.status === 'pending') pendingCount++;
		}

		if (r.is_walk_in && r.status !== 'cancelled' && r.status !== 'no-show') {
			walkInCount++;
			walkInGuests += r.guests || 0;
		}

		if (r.has_pet && r.status !== 'cancelled' && r.status !== 'no-show') {
			petsCount++;
		}

		if (r.status !== 'cancelled' && r.status !== 'no-show' && r.time) {
			const hour = r.time.substring(0, 2) + ':00';
			hourBuckets[hour] = (hourBuckets[hour] || 0) + (r.guests || 0);
		}

		if (r.status !== 'cancelled' && r.status !== 'no-show' && r.preference) {
			zoneCounts[r.preference] = (zoneCounts[r.preference] || 0) + 1;
		}

		if (r.table_number && r.status !== 'cancelled' && r.status !== 'no-show') {
			tableSet.add(r.table_number);
		}
	});

	const activeReservations = totalReservations - cancelledCount - noShows;
	const avgPartySize = activeReservations > 0 ? (totalCovers / activeReservations).toFixed(1) : '0';

	let peakHour = '—';
	let peakGuests = 0;
	Object.entries(hourBuckets).forEach(([hour, guests]) => {
		if (guests > peakGuests) { peakHour = hour; peakGuests = guests; }
	});

	const sortedHours = Object.entries(hourBuckets).sort((a, b) => a[0].localeCompare(b[0]));
	const maxGuests = Math.max(...Object.values(hourBuckets), 1);

	// ── 6. Yesterday comparison ──
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
	const yQuery = `${supabaseUrl}/rest/v1/reservations?date=eq.${yesterdayStr}&select=guests,status`;
	const yFetch = await fetch(yQuery, { headers });
	let yesterdayCovers = 0;
	if (yFetch.ok) {
		const yData = await yFetch.json() as any[];
		yData.forEach(r => {
			if (r.status !== 'cancelled' && r.status !== 'no-show') {
				yesterdayCovers += r.guests || 0;
			}
		});
	}

	const coversDiff = totalCovers - yesterdayCovers;
	const coversDiffStr = coversDiff > 0 ? `+${coversDiff}` : `${coversDiff}`;
	const coversDiffIcon = coversDiff > 0 ? '📈' : coversDiff < 0 ? '📉' : '➡️';

	// ── 7. Build the email HTML ──
	const hourBarsHtml = sortedHours.map(([hour, guests]) => {
		const pct = Math.round((guests / maxGuests) * 100);
		return `
			<tr>
				<td style="padding: 4px 8px; font-size: 13px; color: #64748b; width: 50px; text-align: right;">${hour}</td>
				<td style="padding: 4px 8px;">
					<div style="background-color: #e2e8f0; border-radius: 4px; overflow: hidden; height: 20px;">
						<div style="background-color: #1A365D; height: 100%; width: ${pct}%; border-radius: 4px; min-width: 2px;"></div>
					</div>
				</td>
				<td style="padding: 4px 8px; font-size: 13px; color: #334155; width: 40px;">${guests}</td>
			</tr>`;
	}).join('');

	const zoneHtml = Object.entries(zoneCounts).map(([zone, count]) =>
		`<span style="display: inline-block; background: #EDF2F7; border-radius: 12px; padding: 4px 12px; margin: 3px; font-size: 13px; color: #2D3748;">${zone}: <strong>${count}</strong></span>`
	).join('');

	const shiftNotesHtml = shiftNotes
		? `<div style="margin-top: 20px; padding: 16px; background-color: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 4px;">
				<p style="margin: 0 0 6px 0; font-weight: 700; color: #92400E; font-size: 14px;">📝 Notas del Turno</p>
				<p style="margin: 0; font-size: 14px; color: #78350F; line-height: 1.5; white-space: pre-wrap;">${shiftNotes}</p>
			</div>`
		: '';

	const htmlContent = `
		<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
			
			<!-- Header -->
			<div style="background: linear-gradient(135deg, #1A365D 0%, #2A4A7F 100%); padding: 28px 24px; text-align: center;">
				<h1 style="margin: 0 0 4px 0; color: white; font-size: 20px; font-weight: 600; letter-spacing: 0.5px;">Resumen del Día</h1>
				<p style="margin: 0; color: #93B5E0; font-size: 14px;">${prettyDate}</p>
				<p style="margin: 6px 0 0 0; color: #7BA3D4; font-size: 12px;">Horario: ${OPENING_HOURS.standard.start} – ${closingTime}</p>
			</div>

			<!-- Main Stats Cards -->
			<div style="padding: 24px;">
				<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
					<tr>
						<td width="50%" style="padding: 6px;">
							<div style="background: #F0FDF4; border-radius: 10px; padding: 16px; text-align: center; border: 1px solid #BBF7D0;">
								<p style="margin: 0; font-size: 28px; font-weight: 700; color: #166534;">🍽️ ${totalCovers}</p>
								<p style="margin: 4px 0 0 0; font-size: 12px; color: #15803D; text-transform: uppercase; letter-spacing: 0.5px;">Cubiertos</p>
								<p style="margin: 4px 0 0 0; font-size: 11px; color: #6B7280;">${coversDiffIcon} ${coversDiffStr} vs ayer</p>
							</div>
						</td>
						<td width="50%" style="padding: 6px;">
							<div style="background: #FEF2F2; border-radius: 10px; padding: 16px; text-align: center; border: 1px solid #FECACA;">
								<p style="margin: 0; font-size: 28px; font-weight: 700; color: #991B1B;">❌ ${noShows}</p>
								<p style="margin: 4px 0 0 0; font-size: 12px; color: #DC2626; text-transform: uppercase; letter-spacing: 0.5px;">No-Shows</p>
								<p style="margin: 4px 0 0 0; font-size: 11px; color: #6B7280;">${noShowGuests} comensales perdidos</p>
							</div>
						</td>
					</tr>
					<tr>
						<td width="50%" style="padding: 6px;">
							<div style="background: #EFF6FF; border-radius: 10px; padding: 16px; text-align: center; border: 1px solid #BFDBFE;">
								<p style="margin: 0; font-size: 28px; font-weight: 700; color: #1E40AF;">🚶 ${walkInGuests}</p>
								<p style="margin: 4px 0 0 0; font-size: 12px; color: #2563EB; text-transform: uppercase; letter-spacing: 0.5px;">Walk-ins</p>
								<p style="margin: 4px 0 0 0; font-size: 11px; color: #6B7280;">${walkInCount} mesas espontáneas</p>
							</div>
						</td>
						<td width="50%" style="padding: 6px;">
							<div style="background: #F5F3FF; border-radius: 10px; padding: 16px; text-align: center; border: 1px solid #DDD6FE;">
								<p style="margin: 0; font-size: 28px; font-weight: 700; color: #5B21B6;">📊 ${avgPartySize}</p>
								<p style="margin: 4px 0 0 0; font-size: 12px; color: #7C3AED; text-transform: uppercase; letter-spacing: 0.5px;">Media comensales</p>
								<p style="margin: 4px 0 0 0; font-size: 11px; color: #6B7280;">por reserva</p>
							</div>
						</td>
					</tr>
				</table>
			</div>

			<!-- Desglose de Estados -->
			<div style="padding: 0 24px 20px;">
				<h3 style="margin: 0 0 12px 0; font-size: 15px; color: #1A365D; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px;">📋 Desglose de Reservas</h3>
				<table width="100%" style="font-size: 14px; color: #334155; border-collapse: collapse;">
					<tr><td style="padding: 6px 0;">✅ Completadas</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${completedCount}</td></tr>
					<tr><td style="padding: 6px 0;">🪑 Sentados ahora</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${seatedCount}</td></tr>
					<tr><td style="padding: 6px 0;">🟢 Confirmadas</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${confirmedCount}</td></tr>
					<tr><td style="padding: 6px 0;">🟡 Pendientes</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${pendingCount}</td></tr>
					<tr><td style="padding: 6px 0;">🚫 Canceladas</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${cancelledCount}</td></tr>
					<tr><td style="padding: 6px 0;">🐾 Con mascota</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${petsCount}</td></tr>
					<tr style="border-top: 1px solid #E2E8F0;"><td style="padding: 8px 0; font-weight: 700; color: #1A365D;">Total reservas</td><td style="padding: 8px 0; text-align: right; font-weight: 700; color: #1A365D;">${totalReservations}</td></tr>
				</table>
			</div>

			<!-- Occupancy by Hour -->
			${sortedHours.length > 0 ? `
			<div style="padding: 0 24px 20px;">
				<h3 style="margin: 0 0 12px 0; font-size: 15px; color: #1A365D; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px;">⏰ Ocupación por Hora (cubiertos)</h3>
				<table width="100%" cellpadding="0" cellspacing="0">${hourBarsHtml}</table>
				<p style="margin: 10px 0 0 0; font-size: 13px; color: #64748b;">Hora punta: <strong>${peakHour}</strong> con <strong>${peakGuests}</strong> comensales</p>
			</div>` : ''}

			<!-- Zone Preferences -->
			${zoneHtml ? `
			<div style="padding: 0 24px 20px;">
				<h3 style="margin: 0 0 12px 0; font-size: 15px; color: #1A365D; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px;">📍 Zonas Solicitadas</h3>
				<div>${zoneHtml}</div>
			</div>` : ''}

			<!-- Tables info -->
			<div style="padding: 0 24px 20px;">
				<p style="font-size: 13px; color: #64748b; margin: 0;">🪑 <strong>${tableSet.size}</strong> mesas distintas utilizadas hoy</p>
			</div>

			<!-- Shift Notes -->
			${shiftNotesHtml ? `<div style="padding: 0 24px 10px;">${shiftNotesHtml}</div>` : ''}

			<!-- Footer -->
			<div style="background-color: #F8FAFC; padding: 16px 24px; text-align: center; border-top: 1px solid #E2E8F0;">
				<p style="margin: 0; font-size: 12px; color: #94a3b8;">
					Generado automáticamente · El Atlante de San Cristóbal
				</p>
			</div>
		</div>
	`;

	// ── 8. Send via Brevo ──
	const senderEmail = env.SENDER_EMAIL || 'reservas@elatlantedesancristobal.com';
	const senderName = env.SENDER_NAME || 'Sistema El Atlante';
	const ownerEmail = env.OWNER_EMAIL || 'dev@elatlantedesancristobal.com';

	const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
		method: 'POST',
		headers: {
			'api-key': brevoApiKey,
			'content-type': 'application/json',
		},
		body: JSON.stringify({
			sender: { name: senderName, email: senderEmail },
			to: [{ email: ownerEmail }],
			subject: `📊 Resumen del Día — ${prettyDate} (${totalCovers} cubiertos)`,
			htmlContent: htmlContent,
		}),
	});

	if (!brevoResponse.ok) {
		const errorText = await brevoResponse.text();
		throw new Error(`Error Brevo: ${errorText}`);
	}

	return {
		success: true,
		data: {
			date: todayDateStr,
			closingTime,
			totalCovers,
			totalReservations,
			noShows,
			walkInGuests,
			walkInCount,
			completedCount,
			cancelledCount,
			avgPartySize,
			peakHour,
			tablesUsed: tableSet.size,
			coversDiff: coversDiffStr,
		}
	};
}

// ── HTTP handler (GET /test-report) ──
// Manual test: always sends even if closed (forceEvenIfClosed=true)
export const onRequestGet = async (context: any) => {
	try {
		const result = await buildAndSendReport(context.env, true);
		return new Response(JSON.stringify(result), {
			status: result.success ? 200 : 500,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error: any) {
		console.error("Error en test-report:", error.message);
		return new Response(JSON.stringify({ success: false, error: error.message }), {
			status: 500, headers: { 'Content-Type': 'application/json' }
		});
	}
};

// ── CRON handler (called by scheduled trigger) ──
// Only sends if the restaurant was open today
export const onRequestPost = async (context: any) => {
	try {
		const result = await buildAndSendReport(context.env, false);
		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error: any) {
		console.error("Error en cron-report:", error.message);
		return new Response(JSON.stringify({ success: false, error: error.message }), {
			status: 500, headers: { 'Content-Type': 'application/json' }
		});
	}
};
