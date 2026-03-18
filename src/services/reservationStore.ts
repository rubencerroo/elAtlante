import { supabase } from './supabase';



export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show' | 'waiting';

export interface Reservation {
  id: string;
  bookingNumber: string;
  name: string;
  email: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  guests: number;
  preference: 'Indiferente' | 'Interior' | 'Mesas altas' | 'Terraza exterior';
  hasPet: boolean;
  notes: string;
  status: ReservationStatus;
  createdAt: string; // ISO
  tableNumber?: number;
  seatedAt?: string; // ISO – when seated
  isWalkIn?: boolean;

  // New tracking and operations fields
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  cancellationReason?: string;
  language?: string;
}

// ── Client CRM ──

export interface ClientProfile {
  name: string;
  phone: string;
  email: string;
  visitCount: number;
  noShowCount: number;
  lastVisit: string;
  isVIP: boolean;
  isProblem: boolean;
  favoriteTable?: number;
  favoritePreference?: string;
  allNotes: string[];
}

export interface ClientMeta {
  email: string;
  phone?: string;
  allergies?: string;
  favoriteWine?: string;
  customNotes?: string;
}

// ── Helpers ──

function generateBookingNumber(): string {
  const date = new Date();
  const datePart = date.toISOString().split('T')[0].replace(/-/g, '');
  const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ATL-${datePart}-${randPart}`;
}

function mapToReservation(data: any): Reservation {
  return {
    id: data.id,
    bookingNumber: data.booking_number,
    name: data.name,
    email: data.email || '',
    phone: data.phone,
    date: data.date,
    time: data.time?.substring(0, 5) || '',
    guests: data.guests,
    preference: data.preference,
    hasPet: data.has_pet,
    notes: data.notes || '',
    status: data.status,
    createdAt: data.created_at,
    tableNumber: data.table_number,
    seatedAt: data.seated_at,
    isWalkIn: data.is_walk_in,
    source: data.source,
    utmSource: data.utm_source,
    utmMedium: data.utm_medium,
    utmCampaign: data.utm_campaign,
    cancellationReason: data.cancellation_reason,
    language: data.language,
  };
}

// ── CRUD ──

export async function getReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) {
    console.error('Error fetching reservations:', error);
    return [];
  }
  return data.map(mapToReservation);
}

export async function getReservationById(id: string): Promise<Reservation | null> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching reservation by ID:', error);
    return null;
  }
  return mapToReservation(data);
}

export async function addReservation(r: Omit<Reservation, 'id' | 'bookingNumber' | 'status' | 'createdAt'> & { status?: ReservationStatus }): Promise<Reservation | null> {
  const newR = {
    booking_number: generateBookingNumber(),
    name: r.name,
    email: r.email,
    phone: r.phone,
    date: r.date,
    time: r.time,
    guests: r.guests,
    preference: r.preference,
    has_pet: r.hasPet,
    notes: r.notes,
    status: r.status || 'pending',
    table_number: r.tableNumber,
    is_walk_in: r.isWalkIn || false,
    source: r.source || 'website',
    utm_source: r.utmSource,
    utm_medium: r.utmMedium,
    utm_campaign: r.utmCampaign,
    language: r.language,
  };

  // Check for duplicate reservation (same person, same time, not cancelled)
  const { data: existing, error: checkError } = await supabase
    .from('reservations')
    .select('id')
    .eq('date', r.date)
    .eq('time', r.time)
    .or(`phone.eq.${r.phone},email.eq.${r.email}`)
    .not('status', 'eq', 'cancelled');

  if (checkError) {
    console.error('Error checking for duplicate reservation:', checkError);
  } else if (existing && existing.length > 0) {
    throw new Error('DUPLICATE_RESERVATION');
  }

  const { data, error } = await supabase
    .from('reservations')
    .insert([newR])
    .select()
    .single();

  if (error) {
    console.error('Error adding reservation:', error);
    return null;
  }

  const reservation = mapToReservation(data);

  // Auto-create client meta if phone exists but meta doesn't
  // Auto-create client meta if email exists but meta doesn't
  if (reservation.email && reservation.email !== 'Walk-in') {
    const existingMeta = await getClientMeta(reservation.email);
    if (!existingMeta) {
      await saveClientMeta({ email: reservation.email, phone: reservation.phone });
    }
  }

  // Trigger email confirmation flow via Cloudflare Pages Function (Brevo)
  if (!reservation.isWalkIn && reservation.email) {
    const workerUrl = import.meta.env.VITE_WORKER_URL;
    
    // Al estar en Cloudflare Pages, la function en /functions/send-confirmation.ts 
    // se monta en la misma raíz de la app web.
    // Usamos el path relativo por defecto, ignorando los URLs estáticos absolutos si fallan por DNS,
    // a menos que explícitamente se necesite workerUrl en local.
    const endpoint = workerUrl && workerUrl !== 'https://elatlantedesancristobal.com' ? `${workerUrl}/send-confirmation` : '/send-confirmation';
    
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservation),
    }).catch(err => console.error('Error triggering confirmation email:', err));
  }

  return reservation;
}

export async function addWalkIn(guests: number, tableNumber: number, name?: string): Promise<Reservation | null> {
  const now = new Date();
  const newR = {
    booking_number: generateBookingNumber(),
    name: name || `Walk-in ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`,
    phone: 'Walk-in',
    email: '',
    date: now.toISOString().split('T')[0],
    time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
    guests,
    preference: 'Indiferente',
    has_pet: false,
    status: 'seated',
    seated_at: now.toISOString(),
    table_number: tableNumber,
    is_walk_in: true,
  };

  const { data, error } = await supabase
    .from('reservations')
    .insert([newR])
    .select()
    .single();

  if (error) {
    console.error('Error adding walk-in:', error);
    return null;
  }

  // Auto-create client meta for walk-in if they share a phone (though walk-in default is 'Walk-in')
  return mapToReservation(data);
}

export async function addToWaitList(name: string, guests: number, phone?: string): Promise<Reservation | null> {
  const now = new Date();
  const newR = {
    booking_number: generateBookingNumber(),
    name: name,
    phone: phone || 'Walk-in',
    date: now.toISOString().split('T')[0],
    time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
    guests,
    preference: 'Indiferente',
    has_pet: false,
    status: 'waiting',
    is_walk_in: true,
  };

  const { data, error } = await supabase
    .from('reservations')
    .insert([newR])
    .select()
    .single();

  if (error) {
    console.error('Error adding to waitlist:', error);
    return null;
  }

  return mapToReservation(data);
}

export async function updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation | null> {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.time !== undefined) dbUpdates.time = updates.time;
  if (updates.guests !== undefined) dbUpdates.guests = updates.guests;
  if (updates.preference !== undefined) dbUpdates.preference = updates.preference;
  if (updates.hasPet !== undefined) dbUpdates.has_pet = updates.hasPet;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.tableNumber !== undefined) dbUpdates.table_number = updates.tableNumber;
  if (updates.seatedAt !== undefined) dbUpdates.seated_at = updates.seatedAt;
  if (updates.isWalkIn !== undefined) dbUpdates.is_walk_in = updates.isWalkIn;
  if (updates.cancellationReason !== undefined) dbUpdates.cancellation_reason = updates.cancellationReason;

  // Auto-set seatedAt when transitioning to seated
  if (updates.status === 'seated' && updates.seatedAt === undefined) {
    dbUpdates.seated_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('reservations')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating reservation:', error);
    return null;
  }
  return mapToReservation(data);
}

export async function deleteReservation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting reservation:', error);
    return false;
  }
  return true;
}

// ── Stats ──

export interface ReservationStats {
  totalToday: number;
  pending: number;
  confirmed: number;
  seated: number;
  completed: number;
  cancelled: number;
  noShow: number;
  totalGuestsToday: number;
}

export async function getStats(dateStr?: string): Promise<ReservationStats> {
  const today = dateStr || new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('date', today);

  if (error) {
    console.error('Error fetching stats:', error);
    return {
      totalToday: 0, pending: 0, confirmed: 0, seated: 0,
      completed: 0, cancelled: 0, noShow: 0, totalGuestsToday: 0
    };
  }

  const list = data.map(mapToReservation);
  return {
    totalToday: list.length,
    pending: list.filter(r => r.status === 'pending').length,
    confirmed: list.filter(r => r.status === 'confirmed').length,
    seated: list.filter(r => r.status === 'seated').length,
    completed: list.filter(r => r.status === 'completed').length,
    cancelled: list.filter(r => r.status === 'cancelled').length,
    noShow: list.filter(r => r.status === 'no-show').length,
    totalGuestsToday: list.filter(r => r.status !== 'cancelled' && r.status !== 'no-show').reduce((sum, r) => sum + r.guests, 0),
  };
}

export async function getReservationsForDate(dateStr: string): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('date', dateStr)
    .order('time', { ascending: true });

  if (error) {
    console.error('Error fetching reservations for date:', error);
    return [];
  }
  return data.map(mapToReservation);
}

// ── Analytics ──

export async function getOccupancyByHour(dateStr: string): Promise<{ hour: string; guests: number }[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('time, guests')
    .eq('date', dateStr)
    .not('status', 'in', '(cancelled,no-show)');

  if (error) return [];

  const hours: Record<string, number> = {};
  for (let h = 12; h <= 23; h++) {
    hours[`${h}:00`] = 0;
  }
  data.forEach(r => {
    const h = parseInt(r.time.split(':')[0]);
    const key = `${h}:00`;
    if (hours[key] !== undefined) hours[key] += r.guests;
  });
  return Object.entries(hours).map(([hour, guests]) => ({ hour, guests }));
}

export async function getStatusDistribution(dateStr: string): Promise<{ name: string; value: number; color: string }[]> {
  const stats = await getStats(dateStr);
  return [
    { name: 'Pendiente', value: stats.pending, color: '#fbbf24' },
    { name: 'Confirmada', value: stats.confirmed, color: '#34d399' },
    { name: 'Sentados', value: stats.seated, color: '#60a5fa' },
    { name: 'Completada', value: stats.completed, color: '#94a3b8' },
    { name: 'Cancelada', value: stats.cancelled, color: '#f87171' },
    { name: 'No Show', value: stats.noShow, color: '#fb923c' },
  ].filter(d => d.value > 0);
}

export async function getWeeklyComparison(): Promise<{ thisWeek: number; lastWeek: number; change: number }> {
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const startOfLastWeekStr = startOfLastWeek.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('reservations')
    .select('date, status')
    .gte('date', startOfLastWeekStr);

  if (error) return { thisWeek: 0, lastWeek: 0, change: 0 };

  const thisWeek = data.filter(r => {
    const d = new Date(r.date);
    return d >= startOfThisWeek && r.status !== 'cancelled';
  }).length;

  const lastWeek = data.filter(r => {
    const d = new Date(r.date);
    return d >= startOfLastWeek && d < startOfThisWeek && r.status !== 'cancelled';
  }).length;

  const change = lastWeek === 0 ? 100 : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  return { thisWeek, lastWeek, change };
}

export async function getNoShowRate(): Promise<number> {
  const lastMonth = new Date();
  lastMonth.setDate(lastMonth.getDate() - 30);
  const lastMonthStr = lastMonth.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('reservations')
    .select('status')
    .gte('date', lastMonthStr);

  if (error || !data.length) return 0;
  const noShows = data.filter(r => r.status === 'no-show').length;
  return Math.round((noShows / data.length) * 100);
}

// ── CRM ──

export async function getClientProfiles(): Promise<ClientProfile[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) return [];

  const map = new Map<string, any[]>();
  data.forEach(r => {
    // Use email as primary key, fallback to phone then name
    const key = r.email || r.phone || r.name.toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });

  return Array.from(map.entries()).map(([, reservations]) => {
    const completedOrSeated = reservations.filter(r => r.status === 'completed' || r.status === 'seated');
    const noShows = reservations.filter(r => r.status === 'no-show').length;
    const visitCount = completedOrSeated.length;

    // Find most used table
    const tableCounts: Record<number, number> = {};
    reservations.forEach(r => { if (r.table_number) tableCounts[r.table_number] = (tableCounts[r.table_number] || 0) + 1; });
    const favoriteTable = Object.entries(tableCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Most common preference
    const prefCounts: Record<string, number> = {};
    reservations.forEach(r => { prefCounts[r.preference] = (prefCounts[r.preference] || 0) + 1; });
    const favPref = Object.entries(prefCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      name: reservations[0].name,
      phone: reservations[0].phone,
      email: reservations[0].email || '',
      visitCount,
      noShowCount: noShows,
      lastVisit: reservations[0].date,
      isVIP: visitCount >= 5,
      isProblem: noShows >= 2,
      favoriteTable: favoriteTable ? parseInt(favoriteTable) : undefined,
      favoritePreference: favPref,
      allNotes: reservations.filter(r => r.notes).map(r => `${r.date}: ${r.notes}`),
    };
  }).sort((a, b) => b.visitCount - a.visitCount);
}

export async function getClientHistory(nameOrPhone: string): Promise<Reservation[]> {
  const q = nameOrPhone.toLowerCase();
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
    .order('date', { ascending: false });

  if (error) return [];
  return data.map(mapToReservation);
}

// ── Client Metadata ──

export async function getClientMeta(email: string): Promise<ClientMeta | null> {
  const { data, error } = await supabase
    .from('client_meta')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) return null;
  return {
    email: data.email,
    phone: data.phone,
    allergies: data.allergies,
    favoriteWine: data.favorite_wine,
    customNotes: data.custom_notes,
  };
}

export async function saveClientMeta(meta: ClientMeta): Promise<void> {
  const { error } = await supabase
    .from('client_meta')
    .upsert({
      email: meta.email,
      phone: meta.phone,
      allergies: meta.allergies,
      favorite_wine: meta.favoriteWine,
      custom_notes: meta.customNotes,
      updated_at: new Date().toISOString(),
    });

  if (error) console.error('Error saving client meta:', error);
}

// ── Occupied Tables ──

export async function getOccupiedTables(dateStr?: string): Promise<number[]> {
  const today = dateStr || new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('reservations')
    .select('table_number')
    .eq('date', today)
    .in('status', ['seated', 'confirmed'])
    .not('table_number', 'is', null);

  if (error) return [];
  return data.map(r => r.table_number as number);
}

// ── Feedback ──

export type FeedbackType = 'bug' | 'suggestion';
export type FeedbackRole = 'admin' | 'waiter';

export async function submitFeedback(type: FeedbackType, role: FeedbackRole, content: string, userEmail?: string): Promise<boolean> {
  const { error } = await supabase
    .from('feedback')
    .insert([{ type, role, content, user_email: userEmail }]);

  if (error) {
    console.error('Error submitting feedback:', error);
    return false;
  }
  return true;
}

export async function getFeedbacks(): Promise<any[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching feedback:', error);
    return [];
  }
  return data;
}

export async function updateFeedbackStatus(id: string, resolved: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('feedback')
    .update({ resolved })
    .eq('id', id);

  if (error) {
    console.error('Error updating feedback status:', error);
    return false;
  }
  return true;
}

export async function deleteFeedback(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('feedback')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting feedback:', error);
    return false;
  }
  return true;
}

export async function generateCSV(dateStr: string): Promise<string> {
  const list = await getReservationsForDate(dateStr);
  const header = 'Nombre,Email,Teléfono,Fecha,Hora,Comensales,Preferencia,Mascota,Mesa,Estado,Notas';
  const rows = list.map(r =>
    `"${r.name}","${r.email}","${r.phone}","${r.date}","${r.time}",${r.guests},"${r.preference}",${r.hasPet ? 'Sí' : 'No'},${r.tableNumber || '—'},"${r.status}","${r.notes}"`
  );
  return [header, ...rows].join('\n');
}

// ── Shift Notes ──

export interface ShiftNote {
  date: string;
  content: string;
  createdAt: string;
}

export async function getShiftNote(dateStr: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('shift_notes')
    .select('content')
    .eq('date', dateStr)
    .maybeSingle();

  if (error) return null;
  return data?.content || null;
}

export async function saveShiftNote(dateStr: string, content: string): Promise<void> {
  const { error } = await supabase
    .from('shift_notes')
    .upsert({
      date: dateStr,
      content,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving shift note:', error);
  }
}

