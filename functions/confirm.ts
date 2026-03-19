
export const onRequestGet = async (context: any) => {
	const {
		request,
		env,
	} = context;

	const url = new URL(request.url);
	const id = url.searchParams.get('id');
	
	if (!id) return new Response('Missing reservation ID', { status: 400 });

	try {
		const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://sftdoiuqacbenefqewcr.supabase.co';
		const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;
		
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

		if (reservation.status !== 'pending') {
			return Response.redirect(env.CLIENT_REDIRECT_URL || `${url.origin}/reservar?confirmed=true&id=${id}`, 302);
		}

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

		// Notify Owner
		const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
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
				subject: `Nueva Reserva Confirmada: ${reservation.booking_number}`,
				htmlContent: `
					<div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
						<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
							<div style="background-color: #1A365D; padding: 30px; text-align: center;">
								<img src="${url.origin}/logowhite.png" alt="El Atlante" style="max-height: 60px; width: auto;" />
							</div>
							<div style="padding: 40px;">
								<h2 style="color: #1A365D; font-family: 'Lora', Georgia, serif; font-size: 22px; margin-top: 0; border-bottom: 2px solid #F0EAD6; padding-bottom: 15px; text-align: center;">Nueva Reserva Confirmada</h2>
								<table style="width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 15px; color: #334155;">
									<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b; width: 35%;">Referencia:</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9;">${reservation.booking_number}</td></tr>
									<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">Cliente:</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9;">${reservation.name}</td></tr>
									<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">Email:</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${reservation.email}" style="color: #1A365D; text-decoration: none;">${reservation.email}</a></td></tr>
									<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">Teléfono:</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9;"><a href="tel:${reservation.phone}" style="color: #1A365D; text-decoration: none;">${reservation.phone}</a></td></tr>
									<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">Fecha:</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1A365D;">${reservation.date}</td></tr>
									<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">Hora:</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1A365D;">${reservation.time}</td></tr>
									<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">Comensales:</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600;">${reservation.guests}</td></tr>
									<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">Preferencia:</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9;">${reservation.preference || '—'}</td></tr>
									<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">Mascota:</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9;">${reservation.has_pet ? 'Sí' : 'No'}</td></tr>
									<tr><td style="padding: 12px 8px; font-weight: 600; color: #1e293b;">Notas:</td><td style="padding: 12px 8px; font-style: italic;">${reservation.notes || '—'}</td></tr>
								</table>
							</div>
						</div>
					</div>
				`,
			}),
		});

		if (!emailRes.ok) {
			const errorText = await emailRes.text();
			console.error('Brevo error:', errorText);
			// Throw to prevent silently failing, maybe there was a syntax issue
			throw new Error('Failed to send owner notification email via Brevo');
		}

		// Redirect to website
		return Response.redirect(env.CLIENT_REDIRECT_URL || `${url.origin}/reservar?confirmed=true&id=${id}`, 302);
	} catch (error: any) {
		return new Response(`Error: ${error.message}`, { status: 500 });
	}
};
