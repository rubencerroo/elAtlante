
function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

export const onRequestPost = async (context: any) => {
	const {
		request,
		env,
	} = context;

	// Helper to handle CORS
	const origin = request.headers.get('Origin') || '';
	const allowedOrigins = ['https://elatlantedesancristobal.com', 'https://www.elatlantedesancristobal.com'];
	const corsOrigin = allowedOrigins.includes(origin) ? origin : 'https://elatlantedesancristobal.com';

	const corsHeaders = {
		'Access-Control-Allow-Origin': corsOrigin,
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
	};

	if (request.method === 'OPTIONS') {
		return new Response(null, { headers: corsHeaders });
	}

	try {
		const reservation = await request.json() as any;
		
		// Generate confirmation link
		const url = new URL(request.url);
		const confirmUrl = `${url.origin}/confirm?id=${reservation.id}`;

		const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
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
				subject: 'Confirma tu reserva en El Atlante',
				htmlContent: `
					<div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
						<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
							<div style="background-color: #1A365D; padding: 30px; text-align: center;">
								<img src="${url.origin}/logowhite.png" alt="El Atlante" style="max-height: 60px; width: auto;" />
							</div>
							<div style="padding: 40px;">
								<h1 style="color: #1A365D; font-family: 'Lora', Georgia, serif; font-size: 24px; margin-top: 0; text-align: center; font-weight: normal;">Confirmación de Reserva</h1>
								
								<p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
									¡Hola <strong>${escapeHtml(reservation.name)}</strong>!<br>
									Gracias por elegir El Atlante. Hemos recibido tu solicitud de reserva para el día <strong>${reservation.date}</strong> a las <strong>${reservation.time}</strong>.
								</p>

								<div style="background-color: #F0EAD6; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
									<p style="margin: 0; color: #2D3748; font-size: 15px;">Para asegurar tu mesa, por favor haz clic en el botón de abajo:</p>
								</div>
								
								<div style="text-align: center; margin: 30px 0;">
									<a href="${confirmUrl}" style="background-color: #1A365D; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-family: 'Inter', sans-serif; font-weight: 500; display: inline-block; letter-spacing: 0.5px; font-size: 16px;">Confirmar Reserva</a>
								</div>
								
								<p style="font-size: 14px; color: #64748b; text-align: center; line-height: 1.5; margin-top: 40px;">
									Si no has realizado esta solicitud, puedes ignorar este correo de forma segura.
								</p>
							</div>
							<div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
								<p style="font-size: 13px; color: #94a3b8; margin: 0; font-family: 'Lora', Georgia, serif;">
									Restaurante El Atlante<br>
									San Cristóbal
								</p>
							</div>
						</div>
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
};
