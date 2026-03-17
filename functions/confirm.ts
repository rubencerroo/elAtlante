
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
			return Response.redirect(env.CLIENT_REDIRECT_URL || `${url.origin}/reservar`, 302);
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
		await fetch('https://api.brevo.com/v3/smtp/email', {
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
					<div style="font-family: sans-serif; color: #1e293b;">
						<h2 style="color: #0f172a;">Nueva reserva confirmada</h2>
						<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
							<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Referencia:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${reservation.booking_number}</td></tr>
							<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Cliente:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${reservation.name}</td></tr>
							<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Email:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${reservation.email}</td></tr>
							<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Teléfono:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${reservation.phone}</td></tr>
							<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Fecha:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${reservation.date}</td></tr>
							<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Hora:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${reservation.time}</td></tr>
							<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Comensales:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${reservation.guests}</td></tr>
							<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Preferencia:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${reservation.preference}</td></tr>
							<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Mascota:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${reservation.has_pet ? 'Sí' : 'No'}</td></tr>
							<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Notas:</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${reservation.notes || '—'}</td></tr>
						</table>
					</div>
				`,
			}),
		});

		// Redirect to website
		return Response.redirect(env.CLIENT_REDIRECT_URL || `${url.origin}/reservar?confirmed=true`, 302);
	} catch (error: any) {
		return new Response(`Error: ${error.message}`, { status: 500 });
	}
};
