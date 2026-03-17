
export interface Env {
	BREVO_API_KEY: string;
	SUPABASE_URL: string;
	SUPABASE_SERVICE_ROLE_KEY: string;
	SENDER_EMAIL: string;
	SENDER_NAME: string;
	OWNER_EMAIL: string;
	CLIENT_REDIRECT_URL: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// Helper to handle CORS
		const origin = request.headers.get('Origin') || '';
		const allowedOrigins = ['https://elatlantedesancristobal.com', 'https://www.elatlantedesancristobal.com', 'http://localhost:5173'];
		const corsOrigin = allowedOrigins.includes(origin) ? origin : 'https://elatlantedesancristobal.com';

		const corsHeaders = {
			'Access-Control-Allow-Origin': corsOrigin,
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		// 1. Send Confirmation Email (Called from Frontend)
		if (url.pathname === '/send-confirmation' && request.method === 'POST') {
			try {
				const reservation = await request.json() as any;
				
				// Generate confirmation link
				// The worker URL itself + /confirm + id
				const confirmUrl = `${url.origin}/confirm?id=${reservation.id}`;

				const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
					method: 'POST',
					headers: {
						'api-key': env.BREVO_API_KEY,
						'content-type': 'application/json',
					},
					body: JSON.stringify({
						sender: { name: env.SENDER_NAME, email: env.SENDER_EMAIL },
						to: [{ email: reservation.email, name: reservation.name }],
						subject: 'Confirma tu reserva en El Atlante',
						htmlContent: `
							<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
								<h1 style="color: #0f172a;">¡Hola ${reservation.name}!</h1>
								<p>Gracias por tu reserva en El Atlante para el día <strong>${reservation.date}</strong> a las <strong>${reservation.time}</strong>.</p>
								<p>Para confirmar tu asistencia y verificar tu reserva, por favor haz clic en el siguiente botón:</p>
								<div style="text-align: center; margin: 30px 0;">
									<a href="${confirmUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Confirmar Reserva</a>
								</div>
								<p style="font-size: 0.875rem; color: #64748b;">Si no has realizado esta reserva, puedes ignorar este correo.</p>
								<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
								<p style="font-size: 0.75rem; color: #94a3b8;">Restaurante El Atlante - San Cristóbal</p>
							</div>
						`,
					}),
				});

				if (!brevoResponse.ok) {
					const errorText = await brevoResponse.text();
					console.error('Brevo error:', errorText);
					throw new Error('Failed to send email via Brevo');
				}

				return new Response(JSON.stringify({ success: true }), { 
					headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
				});
			} catch (error: any) {
				return new Response(JSON.stringify({ error: error.message }), { 
					status: 500, 
					headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
				});
			}
		}

		// 2. Confirm Reservation (Clicked from Email)
		if (url.pathname === '/confirm' && request.method === 'GET') {
			const id = url.searchParams.get('id');
			if (!id) return new Response('Missing reservation ID', { status: 400 });

			try {
				// Get reservation details from Supabase using SERVICE ROLE (to bypass RLS if necessary)
				const sbResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/reservations?id=eq.${id}`, {
					headers: {
						'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
						'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
					}
				});

				if (!sbResponse.ok) throw new Error('Failed to fetch reservation');
				const reservations = await sbResponse.json() as any[];
				if (reservations.length === 0) return new Response('Reservation not found', { status: 404 });

				const reservation = reservations[0];

				if (reservation.status === 'confirmed') {
					return Response.redirect(`${env.CLIENT_REDIRECT_URL}&id=${id}`, 302);
				}
				if (reservation.status === 'cancelled' || reservation.status === 'no-show') {
					return Response.redirect(`${env.CLIENT_REDIRECT_URL.replace('confirmed=true', 'confirmed=false')}&error=reservation_cancelled`, 302);
				}

				// Update status in Supabase
				const updateResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/reservations?id=eq.${id}`, {
					method: 'PATCH',
					headers: {
						'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
						'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
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
						'api-key': env.BREVO_API_KEY,
						'content-type': 'application/json',
					},
					body: JSON.stringify({
						sender: { name: 'Sistema de Reservas', email: env.SENDER_EMAIL },
						to: [{ email: env.OWNER_EMAIL }],
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

				// Redirect to website with ID
				return Response.redirect(`${env.CLIENT_REDIRECT_URL}&id=${id}`, 302);
			} catch (error: any) {
				console.error('Confirmation error:', error);
				return Response.redirect(`${env.CLIENT_REDIRECT_URL.replace('confirmed=true', 'confirmed=false')}&error=failed_to_confirm`, 302);
			}
		}

		return new Response('Not Found', { status: 404 });
	},
};
