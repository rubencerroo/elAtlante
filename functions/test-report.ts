export const onRequestGet = async (context: any) => {
	const { env, request } = context;

	// Use Supabase Service Role Key and REST API
	const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
	const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !supabaseKey) {
		return new Response(JSON.stringify({ error: 'Faltan credenciales de Supabase en el entorno' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
	}

	const brevoApiKey = env.BREVO_API_KEY || env.VITE_BREVO_API_KEY;
	if (!brevoApiKey) {
		return new Response(JSON.stringify({ error: 'Falta BREVO_API_KEY en el entorno' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
	}

	try {
        // 1. Obtener la fecha de hoy en Canarias
		const canariasTimeStr = new Date().toLocaleString("en-US", { timeZone: "Atlantic/Canary" });
		const today = new Date(canariasTimeStr);
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		const todayDateStr = `${year}-${month}-${day}`;

		// 2. Fetch Reservas de hoy
        const resQuery = `${supabaseUrl}/rest/v1/reservations?date=eq.${todayDateStr}&select=status,guests,is_walk_in`;
		const resFetch = await fetch(resQuery, {
			headers: {
				'apikey': supabaseKey,
				'Authorization': `Bearer ${supabaseKey}`,
				'Content-Type': 'application/json'
			}
		});

		if (!resFetch.ok) {
			throw new Error(`Error Supabase Reservas: ${await resFetch.text()}`);
		}
		const reservations = await resFetch.json() as any[];

        // 3. Fetch Shift Notes de hoy
        const notesQuery = `${supabaseUrl}/rest/v1/shift_notes?date=eq.${todayDateStr}&select=notes`;
		const notesFetch = await fetch(notesQuery, {
			headers: {
				'apikey': supabaseKey,
				'Authorization': `Bearer ${supabaseKey}`,
				'Content-Type': 'application/json'
			}
		});

		let shiftNotes = "Sin notas.";
		if (notesFetch.ok) {
			const notesData = await notesFetch.json() as any[];
			if (notesData.length > 0 && notesData[0].notes) {
				shiftNotes = notesData[0].notes;
			}
		}

		// 4. Calcular métricas
		let totalCovers = 0;
		let noShows = 0;
		let walkIns = 0;

		reservations.forEach(r => {
			if (r.status === 'no-show') {
				noShows += 1;
			} else if (r.status !== 'cancelled') {
				// Contamos confirmadas, seated, completed... todo menos canceladas y no-shows como cubiertos potenciales/reales
				totalCovers += r.guests || 0;
			}

			if (r.is_walk_in && r.status !== 'cancelled' && r.status !== 'no-show') {
				walkIns += r.guests || 0;
			}
		});

		// 5. Preparar correo
		const htmlContent = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
				<div style="background-color: #1A365D; padding: 20px; text-align: center; color: white;">
					<h2 style="margin: 0;">Resumen Diario: ${todayDateStr}</h2>
				</div>
				<div style="padding: 20px; background-color: #f8fafc; color: #333;">
					<p style="font-size: 16px;">Hola,</p>
					<p style="font-size: 16px;">Aquí tienes el reporte del turno de hoy:</p>
					
					<ul style="list-style-type: none; padding: 0; font-size: 16px;">
						<li style="margin-bottom: 10px;">🍱 <strong>Cubiertos totales:</strong> ${totalCovers}</li>
						<li style="margin-bottom: 10px;">❌ <strong>No-shows:</strong> ${noShows}</li>
						<li style="margin-bottom: 10px;">🚶 <strong>Walk-ins (comensales):</strong> ${walkIns}</li>
					</ul>
					
					<div style="margin-top: 20px; padding: 15px; background-color: #fff; border-left: 4px solid #1A365D; border-radius: 4px;">
						<p style="margin: 0; font-weight: bold; color: #1A365D;">📝 Shift Notes:</p>
						<p style="margin: 10px 0 0 0; font-style: italic;">${shiftNotes}</p>
					</div>

					<p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
						Reporte generado automáticamente por El Atlante.
					</p>
				</div>
			</div>
		`;

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
				subject: `Resumen del Turno - El Atlante (${todayDateStr})`,
				htmlContent: htmlContent,
			}),
		});

		if (!brevoResponse.ok) {
			const errorText = await brevoResponse.text();
			throw new Error(`Error Brevo: ${errorText}`);
		}

		return new Response(JSON.stringify({ 
			success: true, 
			message: 'Reporte procesado y enviado', 
			data: { todayDateStr, totalCovers, noShows, walkIns, shiftNotes }
		}), {
            headers: { 'Content-Type': 'application/json' }
        });

	} catch (error: any) {
		console.error("Error en test-report:", error.message);
		return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
	}
};

export const onRequestScheduled = onRequestGet; // Allow it to be triggered by CF Pages Cron
