
import { getLang, formatDateLocalized, confirmRequestEmail } from './_i18n';

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
		const lang = getLang(reservation.language);
		const t = confirmRequestEmail[lang];

		// Generate HMAC-signed confirmation link
		const url = new URL(request.url);
		const confirmSecret = env.CONFIRM_HMAC_SECRET || env.SUPABASE_SERVICE_ROLE_KEY;
		const expiry = Math.floor(Date.now() / 1000) + (72 * 60 * 60); // 72 hours
		const hmac = await hmacSign(confirmSecret, `${reservation.id}|${expiry}`);
		const confirmUrl = `${url.origin}/confirm?id=${reservation.id}&token=${hmac}&exp=${expiry}`;

		const formattedDate = formatDateLocalized(reservation.date, lang);
		const timeShort = (reservation.time as string).substring(0, 5);

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
				subject: t.subject(reservation.booking_number || reservation.bookingNumber || ''),
				htmlContent: `
					<div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
						<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
							<div style="background-color: #1A365D; padding: 30px; text-align: center;">
								<img src="${url.origin}/logowhite.png" alt="El Atlante" style="max-height: 60px; width: auto;" />
							</div>
							<div style="padding: 40px;">
								<h1 style="color: #1A365D; font-family: 'Lora', Georgia, serif; font-size: 24px; margin-top: 0; text-align: center; font-weight: normal;">${t.h1}</h1>
								
								<p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
									${t.intro(escapeHtml(reservation.name), formattedDate, timeShort)}
								</p>

								<div style="background-color: #F0EAD6; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
									<p style="margin: 0; color: #2D3748; font-size: 15px;">${t.ctaInstructions}</p>
								</div>
								
								<div style="text-align: center; margin: 30px 0;">
									<a href="${confirmUrl}" style="background-color: #1A365D; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-family: 'Inter', sans-serif; font-weight: 500; display: inline-block; letter-spacing: 0.5px; font-size: 16px;">${t.ctaButton}</a>
								</div>
								
								<p style="font-size: 14px; color: #64748b; text-align: center; line-height: 1.5; margin-top: 40px;">
									${t.ignore}
								</p>
							</div>
							<div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
								<p style="font-size: 13px; color: #94a3b8; margin: 0; font-family: 'Lora', Georgia, serif;">
									Restaurante El Atlante<br>San Cristóbal
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
