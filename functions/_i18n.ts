/**
 * Email i18n strings for Cloudflare Functions.
 * Cannot use react-i18next (server-side), so we define translations here.
 * Strings are selected based on `reservation.language` saved in the DB.
 */

export type Lang = 'es' | 'en';

export function getLang(raw: string | null | undefined): Lang {
	return raw === 'en' ? 'en' : 'es';
}

export function formatDateLocalized(dateStr: string, lang: Lang): string {
	const d = new Date(dateStr + 'T12:00:00');
	return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
}

// ─── Email: Confirmation request (send-confirmation.ts) ───────────────────────

export const confirmRequestEmail = {
	es: {
		subject: (bookingNumber: string) => `Confirma tu reserva en El Atlante — ${bookingNumber}`,
		h1: 'Confirmación de Reserva',
		intro: (name: string, date: string, time: string) =>
			`¡Hola <strong>${name}</strong>!<br>Gracias por elegir El Atlante. Hemos recibido tu solicitud de reserva para el día <strong>${date}</strong> a las <strong>${time}</strong>.`,
		ctaInstructions: 'Para asegurar tu mesa, por favor haz clic en el botón de abajo:',
		ctaButton: 'Confirmar Reserva',
		ignore: 'Si no has realizado esta solicitud, puedes ignorar este correo de forma segura.',
	},
	en: {
		subject: (bookingNumber: string) => `Confirm your reservation at El Atlante — ${bookingNumber}`,
		h1: 'Reservation Confirmation',
		intro: (name: string, date: string, time: string) =>
			`Hello <strong>${name}</strong>!<br>Thank you for choosing El Atlante. We have received your reservation request for <strong>${date}</strong> at <strong>${time}</strong>.`,
		ctaInstructions: 'To secure your table, please click the button below:',
		ctaButton: 'Confirm Reservation',
		ignore: 'If you did not make this request, you can safely ignore this email.',
	},
} as const;

// ─── Email: Confirmed reservation (confirm.ts → to client) ────────────────────

export const confirmedEmail = {
	es: {
		subject: (bookingNumber: string) => `✅ Reserva confirmada en El Atlante — ${bookingNumber}`,
		banner: '✅ Tu reserva está confirmada',
		h1: (name: string) => `¡Hasta pronto, ${name}!`,
		subtitle: 'Te esperamos en El Atlante. Aquí tienes los detalles de tu reserva.',
		sectionTitle: 'Detalles de la Reserva',
		labelBookingNumber: 'Localizador',
		labelDate: 'Fecha',
		labelTime: 'Hora',
		labelGuests: 'Comensales',
		labelZone: 'Preferencia de zona',
		labelPet: 'Mascota',
		petValue: '🐾 Incluida en la reserva',
		labelNotes: 'Notas',
		guestSingular: 'persona',
		guestPlural: 'personas',
		location1: '📍 Calle Marina, 81 · Barrio Marinero de San Cristóbal · Las Palmas de G.C.',
		location2: (phone: string) => `📞 <a href="tel:${phone}" style="color: #1A365D; text-decoration: none;">${phone}</a>`,
		cancelIntro: 'Si no puedes venir, por favor cancela con al menos <strong>2 horas de antelación</strong> para que podamos liberar la mesa.',
		cancelButton: 'Cancelar mi reserva',
		cancelValidity: 'Este enlace de cancelación es válido hasta 2 horas antes de tu reserva.',
		noShowWarningTitle: 'Importante:',
		noShowWarning: 'Si no puedes venir y no cancelas tu reserva, tu ausencia quedará registrada como <em>no presentado</em>. Los clientes con incidencias repetidas podrían ver limitada su capacidad para realizar futuras reservas online.',
		footer: 'Restaurante El Atlante<br>San Cristóbal · Las Palmas de G.C.',
	},
	en: {
		subject: (bookingNumber: string) => `✅ Reservation confirmed at El Atlante — ${bookingNumber}`,
		banner: '✅ Your reservation is confirmed',
		h1: (name: string) => `See you soon, ${name}!`,
		subtitle: 'We look forward to welcoming you at El Atlante. Here are your booking details.',
		sectionTitle: 'Booking Details',
		labelBookingNumber: 'Reference',
		labelDate: 'Date',
		labelTime: 'Time',
		labelGuests: 'Guests',
		labelZone: 'Seating preference',
		labelPet: 'Pet',
		petValue: '🐾 Included in reservation',
		labelNotes: 'Notes',
		guestSingular: 'person',
		guestPlural: 'people',
		location1: '📍 Calle Marina, 81 · San Cristóbal Seafront · Las Palmas de G.C.',
		location2: (phone: string) => `📞 <a href="tel:${phone}" style="color: #1A365D; text-decoration: none;">${phone}</a>`,
		cancelIntro: 'If you can\'t make it, please cancel at least <strong>2 hours in advance</strong> so we can free up the table.',
		cancelButton: 'Cancel my reservation',
		cancelValidity: 'This cancellation link is valid until 2 hours before your reservation.',
		noShowWarningTitle: 'Important:',
		noShowWarning: 'If you don\'t show up and haven\'t cancelled, your absence will be recorded as a <em>no-show</em>. Guests with repeated no-shows may have their ability to make future online reservations restricted.',
		footer: 'El Atlante Restaurant<br>San Cristóbal · Las Palmas de G.C.',
	},
} as const;

// ─── Email: Owner notification — new confirmed booking ────────────────────────

export const ownerNewBookingEmail = {
	es: {
		subject: (bookingNumber: string) => `Nueva Reserva Confirmada: ${bookingNumber}`,
		h2: 'Nueva Reserva Confirmada',
		labelRef: 'Referencia:',
		labelClient: 'Cliente:',
		labelEmail: 'Email:',
		labelPhone: 'Teléfono:',
		labelDate: 'Fecha:',
		labelTime: 'Hora:',
		labelGuests: 'Comensales:',
		labelZone: 'Preferencia:',
		labelPet: 'Mascota:',
		petYes: 'Sí',
		petNo: 'No',
		labelNotes: 'Notas:',
	},
	// Owner emails are always in Spanish (internal use), but we keep the key for consistency
	en: {
		subject: (bookingNumber: string) => `Nueva Reserva Confirmada: ${bookingNumber}`,
		h2: 'Nueva Reserva Confirmada',
		labelRef: 'Referencia:',
		labelClient: 'Cliente:',
		labelEmail: 'Email:',
		labelPhone: 'Teléfono:',
		labelDate: 'Fecha:',
		labelTime: 'Hora:',
		labelGuests: 'Comensales:',
		labelZone: 'Preferencia:',
		labelPet: 'Mascota:',
		petYes: 'Sí',
		petNo: 'No',
		labelNotes: 'Notas:',
	},
} as const;

// ─── Email: Owner notification — cancellation ─────────────────────────────────

export const ownerCancelEmail = {
	es: {
		subject: (bookingNumber: string) => `❌ Reserva Cancelada: ${bookingNumber}`,
		banner: '❌ Reserva cancelada por el cliente',
		labelRef: 'Referencia:',
		labelClient: 'Cliente:',
		labelEmail: 'Email:',
		labelPhone: 'Teléfono:',
		labelDate: 'Fecha:',
		labelTime: 'Hora:',
		labelGuests: 'Comensales:',
	},
	en: {
		subject: (bookingNumber: string) => `❌ Reserva Cancelada: ${bookingNumber}`,
		banner: '❌ Reserva cancelada por el cliente',
		labelRef: 'Referencia:',
		labelClient: 'Cliente:',
		labelEmail: 'Email:',
		labelPhone: 'Teléfono:',
		labelDate: 'Fecha:',
		labelTime: 'Hora:',
		labelGuests: 'Comensales:',
	},
} as const;
