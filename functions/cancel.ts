
import { getLang, ownerCancelEmail } from './_i18n';

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
	if (computed.length !== expectedHmac.length) return false;
	let result = 0;
	for (let i = 0; i < computed.length; i++) {
		result |= computed.charCodeAt(i) ^ expectedHmac.charCodeAt(i);
	}
	return result === 0;
}

export const onRequestGet = async (context: any) => {
	const { request, env } = context;

	const url = new URL(request.url);
	const id = url.searchParams.get('id');
	const token = url.searchParams.get('token');
	const exp = url.searchParams.get('exp');

	if (!id) return new Response('Missing reservation ID', { status: 400 });
	if (!token || !exp) return new Response('Invalid or missing cancellation token', { status: 403 });

	try {
		const confirmSecret = env.CONFIRM_HMAC_SECRET || env.SUPABASE_SERVICE_ROLE_KEY;

		// Check expiration
		const expiry = parseInt(exp, 10);
		if (isNaN(expiry) || Math.floor(Date.now() / 1000) > expiry) {
			return Response.redirect(`${url.origin}/cancelada?error=expired&id=${id}`, 302);
		}

		// Verify HMAC signature using cancel-specific prefix
		const isValid = await hmacVerify(confirmSecret, `cancel:${id}|${exp}`, token);
		if (!isValid) {
			return Response.redirect(`${url.origin}/cancelada?error=invalid&id=${id}`, 302);
		}

		const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
		const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
		if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
		if (!supabaseUrl) throw new Error('SUPABASE_URL not configured');

		// Get reservation details
		const sbResponse = await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${id}`, {
			headers: {
				'apikey': serviceRoleKey,
				'Authorization': `Bearer ${serviceRoleKey}`,
			},
		});

		if (!sbResponse.ok) throw new Error('Failed to fetch reservation');
		const reservations = await sbResponse.json() as any[];
		if (reservations.length === 0) {
			return Response.redirect(`${url.origin}/cancelada?error=not-found&id=${id}`, 302);
		}

		const reservation = reservations[0];
		// Determine language for any future client-facing messaging
		const _lang = getLang(reservation.language);

		// If already cancelled, redirect to success (idempotent)
		if (reservation.status === 'cancelled') {
			return Response.redirect(`${url.origin}/cancelada?id=${id}&already=true`, 302);
		}

		// If the reservation is past (seated/completed/no-show), do not allow cancellation
		const nonCancellableStatuses = ['seated', 'completed', 'no-show'];
		if (nonCancellableStatuses.includes(reservation.status)) {
			return Response.redirect(`${url.origin}/cancelada?error=not-cancellable&id=${id}`, 302);
		}

		// Update status to cancelled
		const updateResponse = await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${id}`, {
			method: 'PATCH',
			headers: {
				'apikey': serviceRoleKey,
				'Authorization': `Bearer ${serviceRoleKey}`,
				'Content-Type': 'application/json',
				'Prefer': 'return=representation',
			},
			body: JSON.stringify({ status: 'cancelled', cancellation_reason: 'Cancelado por el cliente desde email' }),
		});

		if (!updateResponse.ok) throw new Error('Failed to cancel reservation');

		// Notify owner about cancellation (always in Spanish — internal)
		if (env.BREVO_API_KEY || env.VITE_BREVO_API_KEY) {
			try {
				const tOwner = ownerCancelEmail.es;
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
						subject: tOwner.subject(reservation.booking_number),
						htmlContent: `
							<div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
								<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
									<div style="background-color: #1A365D; padding: 30px; text-align: center;">
										<img src="${url.origin}/logowhite.png" alt="El Atlante" style="max-height: 60px; width: auto;" />
									</div>
									<div style="background-color: #fef2f2; border-bottom: 1px solid #fecaca; padding: 16px 40px; text-align: center;">
										<p style="margin: 0; color: #dc2626; font-size: 16px; font-weight: 600;">${tOwner.banner}</p>
									</div>
									<div style="padding: 40px;">
										<table style="width: 100%; border-collapse: collapse; font-size: 15px; color: #334155;">
											<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b; width: 35%;">${tOwner.labelRef}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9;">${reservation.booking_number}</td></tr>
											<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${tOwner.labelClient}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9;">${escapeHtml(reservation.name)}</td></tr>
											<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${tOwner.labelEmail}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${escapeHtml(reservation.email || '')}" style="color: #1A365D; text-decoration: none;">${escapeHtml(reservation.email || '')}</a></td></tr>
											<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${tOwner.labelPhone}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9;"><a href="tel:${escapeHtml(reservation.phone || '')}" style="color: #1A365D; text-decoration: none;">${escapeHtml(reservation.phone || '')}</a></td></tr>
											<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${tOwner.labelDate}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; color: #dc2626; font-weight: 600;">${reservation.date}</td></tr>
											<tr><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">${tOwner.labelTime}</td><td style="padding: 12px 8px; border-bottom: 1px solid #f1f5f9; color: #dc2626; font-weight: 600;">${reservation.time}</td></tr>
											<tr><td style="padding: 12px 8px; font-weight: 600; color: #1e293b;">${tOwner.labelGuests}</td><td style="padding: 12px 8px;">${reservation.guests}</td></tr>
										</table>
									</div>
								</div>
							</div>
						`,
					}),
				});
			} catch (e) {
				console.error('Failed to notify owner of cancellation:', e);
			}
		}

		return Response.redirect(`${url.origin}/cancelada?id=${id}`, 302);
	} catch (error: any) {
		console.error('Cancellation error:', error.message);
		return Response.redirect(`${url.origin}/cancelada?error=server&id=${id}`, 302);
	}
};
