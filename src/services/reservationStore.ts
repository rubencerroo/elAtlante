// ── LocalStorage Reservation Store ──

export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';

export interface Reservation {
  id: string;
  bookingNumber: string;
  name: string;
  email: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  guests: number;
  preference: 'Indiferente' | 'Interior' | 'Terraza exterior';
  hasPet: boolean;
  notes: string;
  status: ReservationStatus;
  createdAt: string; // ISO
  tableNumber?: number;
  seatedAt?: string; // ISO – when seated
  isWalkIn?: boolean;
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

const STORAGE_KEY = 'elatlante_reservations';
const CLIENT_META_KEY = 'elatlante_client_meta';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function generateBookingNumber(): string {
  const date = new Date();
  const datePart = date.toISOString().split('T')[0].replace(/-/g, '');
  const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ATL-${datePart}-${randPart}`;
}

// ── CRUD ──

export function getReservations(): Reservation[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    seedDemoData();
    return JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  }
  return JSON.parse(data);
}

export function addReservation(r: Omit<Reservation, 'id' | 'bookingNumber' | 'status' | 'createdAt'>): Reservation {
  const list = getReservations();
  const newR: Reservation = {
    ...r,
    id: generateId(),
    bookingNumber: generateBookingNumber(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  list.push(newR);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return newR;
}

export function addWalkIn(guests: number, tableNumber: number, name?: string): Reservation {
  const list = getReservations();
  const now = new Date();
  const newR: Reservation = {
    id: generateId(),
    bookingNumber: generateBookingNumber(),
    name: name || `Walk-in ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`,
    email: '',
    phone: '',
    date: now.toISOString().split('T')[0],
    time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
    guests,
    preference: 'Indiferente',
    hasPet: false,
    notes: '',
    status: 'seated',
    createdAt: now.toISOString(),
    seatedAt: now.toISOString(),
    tableNumber,
    isWalkIn: true,
  };
  list.push(newR);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return newR;
}

export function updateReservation(id: string, updates: Partial<Reservation>): Reservation | null {
  const list = getReservations();
  const idx = list.findIndex(r => r.id === id);
  if (idx === -1) return null;
  // Auto-set seatedAt when transitioning to seated
  if (updates.status === 'seated' && list[idx].status !== 'seated') {
    updates.seatedAt = new Date().toISOString();
  }
  list[idx] = { ...list[idx], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list[idx];
}

export function deleteReservation(id: string): boolean {
  const list = getReservations();
  const filtered = list.filter(r => r.id !== id);
  if (filtered.length === list.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
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

export function getStats(dateStr?: string): ReservationStats {
  const today = dateStr || new Date().toISOString().split('T')[0];
  const list = getReservations().filter(r => r.date === today);
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

export function getReservationsForDate(dateStr: string): Reservation[] {
  return getReservations().filter(r => r.date === dateStr);
}

// ── Analytics ──

export function getOccupancyByHour(dateStr: string): { hour: string; guests: number }[] {
  const list = getReservations().filter(
    r => r.date === dateStr && r.status !== 'cancelled' && r.status !== 'no-show'
  );
  const hours: Record<string, number> = {};
  for (let h = 12; h <= 23; h++) {
    hours[`${h}:00`] = 0;
  }
  list.forEach(r => {
    const h = parseInt(r.time.split(':')[0]);
    const key = `${h}:00`;
    if (hours[key] !== undefined) hours[key] += r.guests;
  });
  return Object.entries(hours).map(([hour, guests]) => ({ hour, guests }));
}

export function getStatusDistribution(dateStr: string): { name: string; value: number; color: string }[] {
  const stats = getStats(dateStr);
  return [
    { name: 'Pendiente', value: stats.pending, color: '#fbbf24' },
    { name: 'Confirmada', value: stats.confirmed, color: '#34d399' },
    { name: 'Sentados', value: stats.seated, color: '#60a5fa' },
    { name: 'Completada', value: stats.completed, color: '#94a3b8' },
    { name: 'Cancelada', value: stats.cancelled, color: '#f87171' },
    { name: 'No Show', value: stats.noShow, color: '#fb923c' },
  ].filter(d => d.value > 0);
}

export function getWeeklyComparison(): { thisWeek: number; lastWeek: number; change: number } {
  const all = getReservations();
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const thisWeek = all.filter(r => {
    const d = new Date(r.date);
    return d >= startOfThisWeek && r.status !== 'cancelled';
  }).length;

  const lastWeek = all.filter(r => {
    const d = new Date(r.date);
    return d >= startOfLastWeek && d < startOfThisWeek && r.status !== 'cancelled';
  }).length;

  const change = lastWeek === 0 ? 100 : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  return { thisWeek, lastWeek, change };
}

export function getNoShowRate(): number {
  const all = getReservations();
  if (all.length === 0) return 0;
  const noShows = all.filter(r => r.status === 'no-show').length;
  return Math.round((noShows / all.length) * 100);
}

// ── CRM ──

export function getClientProfiles(): ClientProfile[] {
  const all = getReservations();
  const map = new Map<string, Reservation[]>();
  all.forEach(r => {
    const key = r.phone || r.name.toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });

  return Array.from(map.entries()).map(([, reservations]) => {
    const sorted = reservations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const completedOrSeated = reservations.filter(r => r.status === 'completed' || r.status === 'seated');
    const noShows = reservations.filter(r => r.status === 'no-show').length;
    const visitCount = completedOrSeated.length;

    // Find most used table
    const tableCounts: Record<number, number> = {};
    reservations.forEach(r => { if (r.tableNumber) tableCounts[r.tableNumber] = (tableCounts[r.tableNumber] || 0) + 1; });
    const favoriteTable = Object.entries(tableCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Most common preference
    const prefCounts: Record<string, number> = {};
    reservations.forEach(r => { prefCounts[r.preference] = (prefCounts[r.preference] || 0) + 1; });
    const favPref = Object.entries(prefCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      name: sorted[0].name,
      phone: sorted[0].phone,
      email: sorted[0].email,
      visitCount,
      noShowCount: noShows,
      lastVisit: sorted[0].date,
      isVIP: visitCount >= 5,
      isProblem: noShows >= 2,
      favoriteTable: favoriteTable ? parseInt(favoriteTable) : undefined,
      favoritePreference: favPref,
      allNotes: reservations.filter(r => r.notes).map(r => `${r.date}: ${r.notes}`),
    };
  }).sort((a, b) => b.visitCount - a.visitCount);
}

export function getClientHistory(nameOrPhone: string): Reservation[] {
  const all = getReservations();
  const q = nameOrPhone.toLowerCase();
  return all.filter(r =>
    r.name.toLowerCase().includes(q) || r.phone.includes(q)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ── Client Metadata (preferences, allergies etc.) ──

export interface ClientMeta {
  phone: string;
  allergies?: string;
  favoriteWine?: string;
  customNotes?: string;
}

export function getClientMeta(phone: string): ClientMeta | null {
  const data = localStorage.getItem(CLIENT_META_KEY);
  if (!data) return null;
  const all: ClientMeta[] = JSON.parse(data);
  return all.find(m => m.phone === phone) || null;
}

export function saveClientMeta(meta: ClientMeta): void {
  const data = localStorage.getItem(CLIENT_META_KEY);
  const all: ClientMeta[] = data ? JSON.parse(data) : [];
  const idx = all.findIndex(m => m.phone === meta.phone);
  if (idx >= 0) all[idx] = meta;
  else all.push(meta);
  localStorage.setItem(CLIENT_META_KEY, JSON.stringify(all));
}

// ── Occupied Tables ──

export function getOccupiedTables(dateStr?: string): number[] {
  const today = dateStr || new Date().toISOString().split('T')[0];
  return getReservations()
    .filter(r => r.date === today && (r.status === 'seated' || r.status === 'confirmed') && r.tableNumber)
    .map(r => r.tableNumber!);
}

// ── CSV Export ──

export function generateCSV(dateStr: string): string {
  const list = getReservations().filter(r => r.date === dateStr);
  const header = 'Nombre,Email,Teléfono,Fecha,Hora,Comensales,Preferencia,Mascota,Mesa,Estado,Notas';
  const rows = list.map(r =>
    `"${r.name}","${r.email}","${r.phone}","${r.date}","${r.time}",${r.guests},"${r.preference}",${r.hasPet ? 'Sí' : 'No'},${r.tableNumber || '—'},"${r.status}","${r.notes}"`
  );
  return [header, ...rows].join('\n');
}

// ── Demo Seed ──

function seedDemoData() {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const demo: Reservation[] = [
    { id: generateId(), bookingNumber: generateBookingNumber(), name: 'María García', email: 'maria@email.com', phone: '+34 612 345 678', date: today, time: '13:00', guests: 4, preference: 'Terraza exterior', hasPet: false, notes: 'Cumpleaños, traer tarta', status: 'confirmed', createdAt: new Date(Date.now() - 7200000).toISOString(), tableNumber: 5 },
    { id: generateId(), bookingNumber: generateBookingNumber(), name: 'Carlos Rodríguez', email: 'carlos@email.com', phone: '+34 623 456 789', date: today, time: '14:00', guests: 2, preference: 'Interior', hasPet: false, notes: '', status: 'pending', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: generateId(), bookingNumber: generateBookingNumber(), name: 'Ana López', email: 'ana@email.com', phone: '+34 634 567 890', date: today, time: '13:30', guests: 6, preference: 'Indiferente', hasPet: true, notes: 'Perro pequeño, alergia a mariscos', status: 'seated', createdAt: new Date(Date.now() - 10800000).toISOString(), tableNumber: 12, seatedAt: new Date(Date.now() - 10800000).toISOString() },
    { id: generateId(), bookingNumber: generateBookingNumber(), name: 'Pedro Sánchez', email: 'pedro@email.com', phone: '+34 645 678 901', date: today, time: '21:00', guests: 3, preference: 'Terraza exterior', hasPet: false, notes: 'Vegano uno de los comensales', status: 'pending', createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: generateId(), bookingNumber: generateBookingNumber(), name: 'Laura Martín', email: 'laura@email.com', phone: '+34 656 789 012', date: today, time: '20:30', guests: 2, preference: 'Interior', hasPet: false, notes: '', status: 'confirmed', createdAt: new Date(Date.now() - 14400000).toISOString(), tableNumber: 3 },
    { id: generateId(), bookingNumber: generateBookingNumber(), name: 'Diego Fernández', email: 'diego@email.com', phone: '+34 667 890 123', date: today, time: '14:30', guests: 5, preference: 'Terraza exterior', hasPet: false, notes: 'Celebración de empresa', status: 'completed', createdAt: new Date(Date.now() - 21600000).toISOString(), tableNumber: 8 },
    { id: generateId(), bookingNumber: generateBookingNumber(), name: 'Elena Torres', email: 'elena@email.com', phone: '+34 678 901 234', date: today, time: '13:00', guests: 2, preference: 'Interior', hasPet: false, notes: '', status: 'cancelled', createdAt: new Date(Date.now() - 28800000).toISOString() },
    { id: generateId(), bookingNumber: generateBookingNumber(), name: 'Roberto Díaz', email: 'roberto@email.com', phone: '+34 689 012 345', date: tomorrow, time: '14:00', guests: 4, preference: 'Terraza exterior', hasPet: true, notes: 'Gato en transportín', status: 'pending', createdAt: new Date().toISOString() },
    { id: generateId(), bookingNumber: generateBookingNumber(), name: 'Isabel Ruiz', email: 'isabel@email.com', phone: '+34 690 123 456', date: tomorrow, time: '21:30', guests: 8, preference: 'Interior', hasPet: false, notes: 'Mesa grande, cena de aniversario', status: 'confirmed', createdAt: new Date().toISOString() },
    // Extra historical data for CRM demo
    { id: generateId(), bookingNumber: generateBookingNumber(), name: 'María García', email: 'maria@email.com', phone: '+34 612 345 678', date: '2026-03-10', time: '14:00', guests: 2, preference: 'Terraza exterior', hasPet: false, notes: '', status: 'completed', createdAt: '2026-03-10T12:00:00Z', tableNumber: 5 },
    { id: generateId(), bookingNumber: generateBookingNumber(), name: 'María García', email: 'maria@email.com', phone: '+34 612 345 678', date: '2026-03-05', time: '21:00', guests: 4, preference: 'Terraza exterior', hasPet: false, notes: 'Celebración', status: 'completed', createdAt: '2026-03-05T18:00:00Z', tableNumber: 5 },
    { id: generateId(), bookingNumber: generateBookingNumber(), name: 'María García', email: 'maria@email.com', phone: '+34 612 345 678', date: '2026-02-28', time: '13:30', guests: 3, preference: 'Interior', hasPet: false, notes: '', status: 'completed', createdAt: '2026-02-28T11:00:00Z', tableNumber: 7 },
    { id: generateId(), bookingNumber: generateBookingNumber(), name: 'María García', email: 'maria@email.com', phone: '+34 612 345 678', date: '2026-02-20', time: '20:00', guests: 6, preference: 'Terraza exterior', hasPet: false, notes: 'Aniversario', status: 'completed', createdAt: '2026-02-20T17:00:00Z', tableNumber: 5 },
    { id: generateId(), bookingNumber: generateBookingNumber(), name: 'María García', email: 'maria@email.com', phone: '+34 612 345 678', date: '2026-02-14', time: '21:00', guests: 2, preference: 'Interior', hasPet: false, notes: 'San Valentín', status: 'completed', createdAt: '2026-02-14T18:00:00Z', tableNumber: 3 },
    { id: generateId(), bookingNumber: generateBookingNumber(), name: 'Carlos Rodríguez', email: 'carlos@email.com', phone: '+34 623 456 789', date: '2026-03-08', time: '13:00', guests: 2, preference: 'Interior', hasPet: false, notes: '', status: 'no-show', createdAt: '2026-03-08T10:00:00Z' },
    { id: generateId(), bookingNumber: generateBookingNumber(), name: 'Carlos Rodríguez', email: 'carlos@email.com', phone: '+34 623 456 789', date: '2026-02-25', time: '14:00', guests: 3, preference: 'Interior', hasPet: false, notes: '', status: 'no-show', createdAt: '2026-02-25T11:00:00Z' },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
}
