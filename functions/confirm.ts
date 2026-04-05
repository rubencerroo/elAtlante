
import { getLang, formatDateLocalized, confirmedEmail, ownerNewBookingEmail } from './_i18n';

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

async function hmacSign(secret: string, message: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
	return Array.from(new Uint8Array(signature))
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');
}

async function hmacVerify(secret: string, message: string, expectedHmac: string): Promise<boolean> {
	const computed = await hmacSign(secret, message);
	// Constant-time comparison
	if (computed.length !== expectedHmac.length) return false;
	let result = 0;
	for (let i = 0; i < computed.length; i++) {
		result |= computed.charCodeAt(i) ^ expectedHmac.charCodeAt(i);
	}
	return result === 0;
}

export const onRequestGet = async (context: any) => {
	const {
		request,
		env,
	} = context;

	const url = new URL(request.url);
	const id = url.searchParams.get('id');
	const token = url.searchParams.get('token');
	const exp = url.searchParams.get('exp');
	
	if (!id) return new Response('Missing reservation ID', { status: 400 });

	try {
		// Verify HMAC token
		const confirmSecret = env.CONFIRM_HMAC_SECRET || env.SUPABASE_SERVICE_ROLE_KEY;

		if (!token || !exp) {
			return new Response('Invalid or missing confirmation token', { status: 403 });
		}

		// Check expiration
		const expiry = parseInt(exp, 10);
		if (isNaN(expiry) || Math.floor(Date.now() / 1000) > expiry) {
			return new Response('Confirmation link has expired', { status: 403 });
		}

		// Verify signature
		const isValid = await hmacVerify(confirmSecret, `${id}|${exp}`, token);
		if (!isValid) {
			return new Response('Invalid confirmation token', { status: 403 });
		}

		const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
		const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
		if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
		if (!supabaseUrl) throw new Error('SUPABASE_URL not configured');
		
		// Get reservation details from Supabase using SERVICE ROLE
		const sbResponse = await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${id}`, {
			headers: {
				'apikey': serviceRoleKey,
				'Authorization': `Bearer ${serviceRoleKey}`,
			}
		});

		if (!sbResponse.ok) throw new Error('Failed to fetch reservation');
		const reservations = await sbResponse.json() as any[];
		if (reservations.length === 0) return new Response('Reservation not found', { status: 404 });

		const reservation = reservations[0];
		const alreadyConfirmed = reservation.status !== 'pending';

		if (!alreadyConfirmed) {
			// Update status in Supabase
			const updateResponse = await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${id}`, {
				method: 'PATCH',
				headers: {
					'apikey': serviceRoleKey,
					'Authorization': `Bearer ${serviceRoleKey}`,
					'Content-Type': 'application/json',
					'Prefer': 'return=representation',
				},
				body: JSON.stringify({ status: 'confirmed' }),
			});

			if (!updateResponse.ok) throw new Error('Failed to update reservation status');

			// ── Notify Owner (always in Spanish — internal use) ──────────────────
			const tOwner = ownerNewBookingEmail.es;
			const ownerEmailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
				method: 'POST',
				headers: {
					'api-key': env.BREVO_API_KEY || env.VITE_BREVO_API_KEY,
					'content-type': 'application/json',
				},
				body: JSON.stringify({
					sender: { 
						name: 'Sistema de Reservas', 
						email: env.SENDER_EMAIL || 'reservas@elatlantedesancristobal.com' 
					},
					to: [{ email: env.OWNER_EMAIL || 'dev@elatlantedesancristobal.com' }],
					subject: tOwner.subject(reservation.booking_number),
					htmlContent: `
						<div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
							<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
								<div style="background-color: #1A365D; padding: 30px; text-align: center;">
									<img src="${url.origin}/logowhite.png" alt="El Atlante" style="max-height: 60px; width: auto;" />
								</div>
								<div style="padding: 40px;">
									<h2 style="color: #1A365D; font-family: 'Lora', Georgia, serif; font-size: 22px; margin-top: 0; border-bottom: 2px solid #F0EAD6; padding-bottom: 15px; text-align: center;">${tOwner.h2}</h2>
									<table style="width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 15px; color: #334155;">
										<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b; width: 35%;">${tOwner.labelRef}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9;">${reservation.booking_number}</td></tr>
										<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${tOwner.labelClient}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9;">${escapeHtml(reservation.name)}</td></tr>
										<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${tOwner.labelEmail}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${escapeHtml(reservation.email || '')}" style="color: #1A365D; text-decoration: none;">${escapeHtml(reservation.email || '')}</a></td></tr>
										<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${tOwner.labelPhone}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9;"><a href="tel:${escapeHtml(reservation.phone || '')}" style="color: #1A365D; text-decoration: none;">${escapeHtml(reservation.phone || '')}</a></td></tr>
										<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${tOwner.labelDate}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1A365D;">${reservation.date}</td></tr>
										<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${tOwner.labelTime}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1A365D;">${reservation.time}</td></tr>
										<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${tOwner.labelGuests}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600;">${reservation.guests}</td></tr>
										<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${tOwner.labelZone}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9;">${escapeHtml(reservation.preference || '—')}</td></tr>
										<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${tOwner.labelPet}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9;">${reservation.has_pet ? tOwner.petYes : tOwner.petNo}</td></tr>
										<tr><td style="padding: 12px 8px; font-weight: 600; color: #1e293b;">${tOwner.labelNotes}</td><td style="padding: 12px 8px; font-style: italic;">${escapeHtml(reservation.notes || '—')}</td></tr>
									</table>
								</div>
							</div>
						</div>
					`,
				}),
			});

			if (!ownerEmailRes.ok) {
				const errorText = await ownerEmailRes.text();
				console.error('Brevo owner email error:', errorText);
				// Don't throw — still send client email
			}

			// ── Send confirmed reservation email to client (localized) ────────────
			if (reservation.email) {
				const lang = getLang(reservation.language);
				const t = confirmedEmail[lang];
				const formattedDate = formatDateLocalized(reservation.date, lang);
				const timeShort = (reservation.time as string).substring(0, 5);

				// Cancel link valid until 2 hours before the reservation datetime
				const [rHour, rMin] = (reservation.time as string).split(':').map(Number);
				const reservationDate = new Date(`${reservation.date}T${String(rHour).padStart(2,'0')}:${String(rMin).padStart(2,'0')}:00`);
				const cancelExpiry = Math.floor(reservationDate.getTime() / 1000) - (2 * 60 * 60);
				// Fallback: if the expiry is already in the past (reservation very soon), grant at minimum 30 minutes
				const now = Math.floor(Date.now() / 1000);
				const effectiveCancelExpiry = cancelExpiry > now ? cancelExpiry : now + (30 * 60);
				const cancelHmac = await hmacSign(confirmSecret, `cancel:${id}|${effectiveCancelExpiry}`);
				const cancelUrl = `${url.origin}/cancel?id=${id}&token=${cancelHmac}&exp=${effectiveCancelExpiry}`;

				const restaurantPhone = env.RESTAURANT_PHONE || '+34 928 000 000';

				const clientEmailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
					method: 'POST',
					headers: {
						'api-key': env.BREVO_API_KEY || env.VITE_BREVO_API_KEY,
						'content-type': 'application/json',
					},
					body: JSON.stringify({
						sender: { 
							name: env.SENDER_NAME || 'El Atlante', 
							email: env.SENDER_EMAIL || 'reservas@elatlantedesancristobal.com' 
						},
						to: [{ email: reservation.email, name: reservation.name }],
						subject: t.subject(reservation.booking_number),
						htmlContent: `
							<div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
								<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
									
									<!-- Header -->
									<div style="background-color: #1A365D; padding: 30px; text-align: center;">
										<img src="${url.origin}/logowhite.png" alt="El Atlante" style="max-height: 60px; width: auto;" />
									</div>

									<!-- Confirmation banner -->
									<div style="background-color: #f0fdf4; border-bottom: 1px solid #bbf7d0; padding: 20px 40px; text-align: center;">
										<p style="margin: 0; color: #16a34a; font-size: 16px; font-weight: 600;">${t.banner}</p>
									</div>
									
									<!-- Body -->
									<div style="padding: 40px;">
										<h1 style="color: #1A365D; font-family: 'Lora', Georgia, serif; font-size: 24px; margin-top: 0; text-align: center; font-weight: normal; margin-bottom: 8px;">${t.h1(escapeHtml(reservation.name))}</h1>
										<p style="color: #64748b; font-size: 15px; text-align: center; margin-top: 0; margin-bottom: 32px;">
											${t.subtitle}
										</p>

										<!-- Booking details card -->
										<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; margin-bottom: 32px;">
											<p style="margin: 0 0 16px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; font-weight: 600;">${t.sectionTitle}</p>
											
											<table style="width: 100%; border-collapse: collapse; font-size: 15px; color: #334155;">
												<tr>
													<td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; width: 40%;">${t.labelBookingNumber}</td>
													<td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #1A365D; font-size: 16px; letter-spacing: 0.05em;">${reservation.booking_number}</td>
												</tr>
												<tr>
													<td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">${t.labelDate}</td>
													<td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b; text-transform: capitalize;">${formattedDate}</td>
												</tr>
												<tr>
													<td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">${t.labelTime}</td>
													<td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">${timeShort} h</td>
												</tr>
												<tr>
													<td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">${t.labelGuests}</td>
													<td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">${reservation.guests} ${reservation.guests === 1 ? t.guestSingular : t.guestPlural}</td>
												</tr>
												<tr>
													<td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">${t.labelZone}</td>
													<td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${escapeHtml(reservation.preference || 'Indiferente')}</td>
												</tr>
												${reservation.has_pet ? `
												<tr>
													<td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">${t.labelPet}</td>
													<td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${t.petValue}</td>
												</tr>
												` : ''}
												${reservation.notes ? `
												<tr>
													<td style="padding: 10px 0; color: #64748b; vertical-align: top;">${t.labelNotes}</td>
													<td style="padding: 10px 0; color: #1e293b; font-style: italic;">${escapeHtml(reservation.notes)}</td>
												</tr>
												` : ''}
											</table>
										</div>

										<!-- Location info -->
										<div style="text-align: center; margin-bottom: 32px;">
											<p style="margin: 0 0 4px 0; font-size: 14px; color: #64748b;">${t.location1}</p>
											<p style="margin: 0; font-size: 14px; color: #64748b;">${t.location2(restaurantPhone)}</p>
										</div>

										<!-- Divider -->
										<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0 0 28px 0;" />

										<!-- Cancel section -->
										<p style="font-size: 14px; color: #64748b; text-align: center; margin: 0 0 16px 0;">
											${t.cancelIntro}
										</p>
										<div style="text-align: center; margin-bottom: 16px;">
											<a href="${cancelUrl}" style="display: inline-block; background-color: #fff; color: #dc2626; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-family: 'Inter', sans-serif; font-weight: 500; font-size: 15px; border: 1.5px solid #dc2626; letter-spacing: 0.3px;">
												${t.cancelButton}
											</a>
										</div>
										<p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0 0 20px 0;">
											${t.cancelValidity}
										</p>
										<!-- No-show warning -->
										<div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px; margin-bottom: 4px;">
											<p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.6;">
												⚠️ <strong>${t.noShowWarningTitle}</strong> ${t.noShowWarning}
											</p>
										</div>
									</div>

									<!-- Footer -->
									<div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
										<p style="font-size: 13px; color: #94a3b8; margin: 0; font-family: 'Lora', Georgia, serif;">
											${t.footer}
										</p>
									</div>
								</div>
							</div>
						`,
					}),
				});

				if (!clientEmailRes.ok) {
					const errorText = await clientEmailRes.text();
					console.error('Brevo client confirmed email error:', errorText);
					// Don't fail the confirmation just because the email failed
				}
			}
		}

		// Redirect to website
		return Response.redirect(env.CLIENT_REDIRECT_URL || `${url.origin}/reservar?confirmed=true&id=${id}`, 302);
	} catch (error: any) {
		return new Response(`Error: ${error.message}`, { status: 500 });
	}
};
