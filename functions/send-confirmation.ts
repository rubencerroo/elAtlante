
export const onRequestPost = async (context: any) => {
	const {
		request,
		env,
	} = context;

	// Helper to handle CORS
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
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
				'api-key': env.BREVO_API_KEY,
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
};
