import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getReservationsForDate,
  getStats,
  getWaitAndMealMetrics,
  getWeeklyComparison,
  getNoShowRate,
  getClientProfiles,
  getForecastData,
  type Reservation,
  type ReservationStats,
  type WaitAndMealMetrics,
  type ClientProfile,
  type ForecastDay,
} from '../../services/reservationStore';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface SleepData {
  reservations: Reservation[];
  stats: ReservationStats | null;
  metrics: WaitAndMealMetrics | null;
  weeklyComp: { thisWeek: number; lastWeek: number; change: number };
  noShowRate: number;
  clientProfiles: ClientProfile[];
  forecast: ForecastDay[];
}

interface SleepModeScreenProps {
  role: 'owner' | 'waiter' | null;
  onWake: () => void;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function useCurrentTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function formatTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatDateES(d: Date) {
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getSeatedMinutes(seatedAt?: string): number {
  if (!seatedAt) return 0;
  return Math.floor((Date.now() - new Date(seatedAt).getTime()) / 60000);
}

// Read theme from localStorage - same key as AdminThemeContext
function getStoredTheme(): 'dark' | 'light' {
  try {
    const stored = localStorage.getItem('admin-theme');
    return stored === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

// ─────────────────────────────────────────────
// Theme tokens
// ─────────────────────────────────────────────

const DARK_THEME = {
  bg: 'radial-gradient(ellipse at 20% 50%, rgba(30,58,138,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(88,28,135,0.12) 0%, transparent 50%), #050811',
  orb1: 'rgba(37,99,235,0.07)',
  orb2: 'rgba(109,40,217,0.07)',
  clock: 'rgba(255,255,255,0.92)',
  clockShadow: '0 0 40px rgba(255,255,255,0.1)',
  date: '#64748b',
  roleLabel: '#334155',
  slideTitle: '#cbd5e1',
  slideSubLabel: '#334155',
  card: 'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(255,255,255,0.07)',
  dotActive: 'rgba(255,255,255,0.7)',
  dotInactive: 'rgba(255,255,255,0.12)',
  logoOpacity: 0.2,
  wakeHint: '#1e293b',
  divider: '#1e293b',
};

const LIGHT_THEME = {
  bg: 'radial-gradient(ellipse at 20% 50%, rgba(219,234,254,0.8) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(237,233,254,0.6) 0%, transparent 50%), #f0f4ff',
  orb1: 'rgba(59,130,246,0.08)',
  orb2: 'rgba(139,92,246,0.08)',
  clock: 'rgba(15,23,42,0.90)',
  clockShadow: '0 0 40px rgba(59,130,246,0.1)',
  date: '#64748b',
  roleLabel: '#94a3b8',
  slideTitle: '#1e293b',
  slideSubLabel: '#94a3b8',
  card: 'rgba(255,255,255,0.7)',
  cardBorder: 'rgba(203,213,225,0.6)',
  dotActive: 'rgba(30,41,59,0.7)',
  dotInactive: 'rgba(30,41,59,0.15)',
  logoOpacity: 0.15,
  wakeHint: '#94a3b8',
  divider: '#e2e8f0',
};

// ─────────────────────────────────────────────
// Stat helpers for slides
// ─────────────────────────────────────────────

interface SlideConfig {
  id: string;
  icon: string;
  title: string;
  content: (t: typeof DARK_THEME) => React.ReactNode;
}

function getWaiterSlides(data: SleepData, now: Date): SlideConfig[] {
  const today = now.toISOString().split('T')[0];
  const todayRes = data.reservations.filter(r => r.date === today);
  const currentMins = now.getHours() * 60 + now.getMinutes();

  const upcoming30 = todayRes.filter(r => {
    if (r.status !== 'pending' && r.status !== 'confirmed') return false;
    const [h, m] = r.time.split(':').map(Number);
    const rMins = h * 60 + m;
    return rMins >= currentMins && rMins <= currentMins + 30;
  }).sort((a, b) => a.time.localeCompare(b.time));

  const upcoming2h = todayRes.filter(r => {
    if (r.status !== 'pending' && r.status !== 'confirmed') return false;
    const [h, m] = r.time.split(':').map(Number);
    const rMins = h * 60 + m;
    return rMins >= currentMins && rMins <= currentMins + 120;
  });

  const seated = todayRes.filter(r => r.status === 'seated');
  const waitlist = todayRes.filter(r => r.status === 'waiting');
  const totalTables = 45;
  const occupiedSet = new Set<number>(
    seated.flatMap(r => r.assignedTables || (r.tableNumber ? [r.tableNumber] : []))
  );

  // Long-stay alerts (>100 min seated)
  const longStay = seated
    .map(r => ({ r, mins: getSeatedMinutes(r.seatedAt) }))
    .filter(x => x.mins > 100)
    .sort((a, b) => b.mins - a.mins);

  // Reservations with special needs
  const specials = todayRes.filter(r =>
    r.status !== 'cancelled' && r.status !== 'no-show' &&
    (r.notes?.trim() || r.hasPet)
  );

  // Guests currently in restaurant
  const guestsInside = seated.reduce((s, r) => s + r.guests, 0);

  // Hourly distribution for today
  const byHour: Record<string, number> = {};
  todayRes.filter(r => r.status !== 'cancelled' && r.status !== 'no-show').forEach(r => {
    const h = r.time.split(':')[0];
    byHour[h] = (byHour[h] || 0) + 1;
  });
  const hours = Object.entries(byHour).sort((a, b) => a[0].localeCompare(b[0]));
  const maxH = Math.max(...hours.map(h => h[1]), 1);

  return [
    // Slide 1: Próximas llegadas
    {
      id: 'upcoming-soon',
      icon: '⏰',
      title: 'Próximas llegadas',
      content: (t) => (
        <div className="flex flex-col items-center gap-5 w-full max-w-lg">
          <div className="flex items-end gap-4">
            <span className="text-[8rem] font-black leading-none" style={{ color: '#fbbf24', textShadow: '0 0 50px rgba(251,191,36,0.35)' }}>
              {upcoming30.length}
            </span>
            <div className="mb-5 text-left">
              <p className="text-2xl font-bold" style={{ color: t.slideTitle }}>en 30 min</p>
              <p style={{ color: t.date }} className="text-sm">{upcoming2h.length} en las próximas 2h</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center px-5 py-3 rounded-2xl" style={{ background: t.card, border: `1px solid ${t.cardBorder}` }}>
              <p className="text-3xl font-black text-amber-400">{upcoming30.reduce((s, r) => s + r.guests, 0)}</p>
              <p className="text-xs uppercase tracking-widest mt-1" style={{ color: t.date }}>comensales pronto</p>
            </div>
            <div className="text-center px-5 py-3 rounded-2xl" style={{ background: t.card, border: `1px solid ${t.cardBorder}` }}>
              <p className="text-3xl font-black text-sky-400">{upcoming2h.reduce((s, r) => s + r.guests, 0)}</p>
              <p className="text-xs uppercase tracking-widest mt-1" style={{ color: t.date }}>en 2 horas</p>
            </div>
          </div>
          {upcoming30.length > 0 && (
            <div className="space-y-2 w-full mt-1">
              {upcoming30.slice(0, 3).map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-2 rounded-xl"
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}>
                  <span className="text-amber-400 font-bold">{r.time}</span>
                  <span style={{ color: t.slideTitle }} className="flex-1 mx-3">{r.name}</span>
                  <span style={{ color: t.date }} className="text-sm">👥 {r.guests}{r.hasPet ? ' 🐾' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    // Slide 2: Sala en este momento
    {
      id: 'sala-ahora',
      icon: '🏠',
      title: 'Sala ahora mismo',
      content: (t) => (
        <div className="flex flex-col items-center gap-6 w-full max-w-lg">
          <div className="flex gap-8 items-center">
            <div className="text-center">
              <p className="text-[7rem] font-black leading-none text-emerald-400" style={{ textShadow: '0 0 50px rgba(52,211,153,0.35)' }}>
                {guestsInside}
              </p>
              <p className="text-sm uppercase tracking-widest mt-1" style={{ color: t.date }}>personas en sala</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-center px-5 py-3 rounded-2xl" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                <p className="text-2xl font-black text-red-400">{occupiedSet.size}</p>
                <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: t.date }}>mesas ocupadas</p>
              </div>
              <div className="text-center px-5 py-3 rounded-2xl" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)' }}>
                <p className="text-2xl font-black text-emerald-400">{Math.max(0, totalTables - occupiedSet.size)}</p>
                <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: t.date }}>libres</p>
              </div>
            </div>
          </div>
          {/* Occupancy bar */}
          <div className="w-full max-w-xs">
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(100,116,139,0.15)' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (occupiedSet.size / totalTables) * 100)}%`, background: occupiedSet.size / totalTables > 0.75 ? 'linear-gradient(90deg,#f87171,#ef4444)' : occupiedSet.size / totalTables > 0.5 ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#34d399,#10b981)' }} />
            </div>
            <p className="text-center text-xs mt-1 uppercase tracking-widest" style={{ color: t.date }}>{Math.round((occupiedSet.size / totalTables) * 100)}% capacidad · {waitlist.length > 0 ? `${waitlist.length} en espera` : 'sin espera'}</p>
          </div>
        </div>
      ),
    },
    // Slide 3: Alertas mesas largas + espera
    {
      id: 'alerts',
      icon: '🔔',
      title: 'Alertas del servicio',
      content: (t) => (
        <div className="flex flex-col items-center gap-5 w-full max-w-lg">
          {longStay.length === 0 && waitlist.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-6xl mb-3">✅</p>
              <p className="text-xl font-semibold" style={{ color: t.slideTitle }}>Servicio sin alertas</p>
              <p style={{ color: t.date }} className="text-sm mt-1">Todo en orden</p>
            </div>
          ) : (
            <>
              {longStay.length > 0 && (
                <div className="w-full">
                  <p className="text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: '#f87171' }}>⏱ Mesas con mucho tiempo</p>
                  <div className="space-y-2">
                    {longStay.slice(0, 3).map(({ r, mins }) => (
                      <div key={r.id} className="flex justify-between items-center px-4 py-2 rounded-xl"
                        style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                        <span style={{ color: t.slideTitle }}>{r.name}</span>
                        <span className={`font-bold text-sm ${mins > 150 ? 'text-red-400' : 'text-orange-400'}`}>{Math.floor(mins / 60)}h {mins % 60}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {waitlist.length > 0 && (
                <div className="w-full">
                  <p className="text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: '#a78bfa' }}>⏳ Lista de espera</p>
                  <div className="space-y-2">
                    {waitlist.slice(0, 3).map((r, i) => (
                      <div key={r.id} className="flex justify-between items-center px-4 py-2 rounded-xl"
                        style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
                        <span className="text-purple-400 font-bold w-5">#{i + 1}</span>
                        <span style={{ color: t.slideTitle }} className="flex-1 mx-2">{r.name}</span>
                        <span style={{ color: t.date }} className="text-sm">👥 {r.guests}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ),
    },
    // Slide 4: Métricas del turno
    {
      id: 'metrics',
      icon: '⏱️',
      title: 'Métricas del turno',
      content: (t) => (
        <div className="flex flex-col items-center gap-7 w-full max-w-lg">
          <div className="grid grid-cols-2 gap-6 w-full">
            <div className="text-center py-5 rounded-3xl" style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.15)' }}>
              <p className="text-[5rem] font-black leading-none text-amber-400" style={{ textShadow: '0 0 40px rgba(251,191,36,0.25)' }}>
                {data.metrics?.avgWaitTime || 0}
              </p>
              <p className="text-xs uppercase tracking-widest mt-2" style={{ color: t.date }}>min espera media</p>
            </div>
            <div className="text-center py-5 rounded-3xl" style={{ background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.15)' }}>
              <p className="text-[5rem] font-black leading-none text-purple-400" style={{ textShadow: '0 0 40px rgba(167,139,250,0.25)' }}>
                {data.metrics?.avgMealDuration || 0}
              </p>
              <p className="text-xs uppercase tracking-widest mt-2" style={{ color: t.date }}>min comida media</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400">{seated.length}</p>
              <p className="text-xs uppercase tracking-wider mt-1" style={{ color: t.date }}>en mesa ahora</p>
            </div>
            <div className="w-px" style={{ background: t.divider }} />
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-400">{data.stats?.completed || 0}</p>
              <p className="text-xs uppercase tracking-wider mt-1" style={{ color: t.date }}>completadas hoy</p>
            </div>
          </div>
          <p style={{ color: t.date }} className="text-sm text-center">
            {(data.metrics?.avgWaitTime || 0) < 10 ? '✅ Servicio muy fluido hoy' :
              (data.metrics?.avgWaitTime || 0) < 20 ? '🟡 Tiempos de espera moderados' : '🔴 Tiempos elevados — revisar flujo'}
          </p>
        </div>
      ),
    },
    // Slide 5: Especiales y notas del día
    {
      id: 'specials',
      icon: '📝',
      title: 'Notas especiales hoy',
      content: (t) => (
        <div className="flex flex-col items-center gap-5 w-full max-w-lg">
          {specials.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-6xl mb-3">😊</p>
              <p className="text-xl font-semibold" style={{ color: t.slideTitle }}>Sin notas especiales hoy</p>
            </div>
          ) : (
            <>
              <div className="flex gap-5">
                <div className="text-center px-5 py-3 rounded-2xl" style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.12)' }}>
                  <p className="text-3xl font-black text-amber-400">{todayRes.filter(r => r.hasPet && r.status !== 'cancelled').length}</p>
                  <p className="text-xs uppercase tracking-widest mt-1" style={{ color: t.date }}>🐾 con mascota</p>
                </div>
                <div className="text-center px-5 py-3 rounded-2xl" style={{ background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.12)' }}>
                  <p className="text-3xl font-black text-blue-400">{specials.filter(r => r.notes?.trim()).length}</p>
                  <p className="text-xs uppercase tracking-widest mt-1" style={{ color: t.date }}>📝 con notas</p>
                </div>
              </div>
              <div className="space-y-2 w-full">
                {specials.filter(r => r.notes?.trim()).slice(0, 4).map(r => (
                  <div key={r.id} className="flex gap-3 items-start px-4 py-2 rounded-xl" style={{ background: t.card, border: `1px solid ${t.cardBorder}` }}>
                    <span className="text-amber-400 font-bold shrink-0 text-sm">{r.time}</span>
                    <span style={{ color: t.slideTitle }} className="font-medium shrink-0 text-sm">{r.name}</span>
                    <span style={{ color: t.date }} className="text-xs truncate">{r.notes}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ),
    },
    // Slide 6: Distribución por hora
    {
      id: 'hourly',
      icon: '📊',
      title: 'Reservas por hora · hoy',
      content: (t) => (
        <div className="flex flex-col items-center gap-5 w-full max-w-lg">
          {hours.length === 0 ? (
            <p style={{ color: t.date }}>Sin datos aún</p>
          ) : (
            <div className="flex items-end gap-2 w-full h-36">
              {hours.map(([h, count]) => (
                <div key={h} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative rounded-t-lg overflow-hidden" style={{ height: `${Math.max(8, (count / maxH) * 110)}px`, background: 'linear-gradient(180deg, rgba(56,189,248,0.8), rgba(56,189,248,0.3))' }} />
                  <span className="text-[9px] font-bold" style={{ color: t.slideTitle }}>{count}</span>
                  <span className="text-[8px]" style={{ color: t.date }}>{h}h</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-5 mt-1">
            <div className="text-center">
              <p className="text-2xl font-black" style={{ color: t.slideTitle }}>{data.stats?.totalToday || 0}</p>
              <p className="text-xs uppercase tracking-wider" style={{ color: t.date }}>reservas totales</p>
            </div>
            <div className="w-px" style={{ background: t.divider }} />
            <div className="text-center">
              <p className="text-2xl font-black" style={{ color: t.slideTitle }}>{data.stats?.totalGuestsToday || 0}</p>
              <p className="text-xs uppercase tracking-wider" style={{ color: t.date }}>comensales</p>
            </div>
          </div>
        </div>
      ),
    },
  ];
}

function getOwnerSlides(data: SleepData, now: Date): SlideConfig[] {
  const today = now.toISOString().split('T')[0];
  const todayRes = data.reservations.filter(r => r.date === today);
  const validRes = todayRes.filter(r => r.status !== 'cancelled' && r.status !== 'no-show');

  // Peak hour
  const hourGuests: Record<string, number> = {};
  validRes.forEach(r => {
    const h = r.time.split(':')[0];
    hourGuests[h] = (hourGuests[h] || 0) + r.guests;
  });
  const peakEntry = Object.entries(hourGuests).sort((a, b) => b[1] - a[1])[0];
  const peakHour = peakEntry ? `${peakEntry[0]}:00` : '—';
  const peakGuests = peakEntry ? peakEntry[1] : 0;

  // Avg guests
  const avgGuests = validRes.length > 0
    ? (validRes.reduce((s, r) => s + r.guests, 0) / validRes.length).toFixed(1)
    : '0';

  // Forecast
  const forecast: { label: string; count: number }[] = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dStr = d.toISOString().split('T')[0];
    const count = data.reservations.filter(r => r.date === dStr && r.status !== 'cancelled').length;
    forecast.push({ label: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }), count });
  }

  // Status dist
  const statusDist = [
    { label: 'Completadas', count: data.stats?.completed || 0, color: '#94a3b8' },
    { label: 'Sentados', count: data.stats?.seated || 0, color: '#60a5fa' },
    { label: 'Confirmadas', count: data.stats?.confirmed || 0, color: '#34d399' },
    { label: 'Pendientes', count: data.stats?.pending || 0, color: '#fbbf24' },
    { label: 'Canceladas', count: data.stats?.cancelled || 0, color: '#f87171' },
    { label: 'No shows', count: data.stats?.noShow || 0, color: '#fb923c' },
  ].filter(d => d.count > 0);
  const totalStatus = statusDist.reduce((s, d) => s + d.count, 0);

  // Preference distribution
  const prefCounts: Record<string, number> = {};
  validRes.forEach(r => {
    prefCounts[r.preference] = (prefCounts[r.preference] || 0) + 1;
  });
  const prefData = Object.entries(prefCounts).sort((a, b) => b[1] - a[1]);
  const prefColors: Record<string, string> = { 'Interior': '#60a5fa', 'Terraza exterior': '#34d399', 'Mesas altas': '#fbbf24', 'Indiferente': '#a78bfa' };

  // VIP clients today
  const vipToday = data.clientProfiles
    .filter(p => p.isVIP && todayRes.some(r => r.phone === p.phone || (r.email && r.email === p.email)))
    .slice(0, 5);

  // Funnel: pending → confirmed → seated → completed
  const funnelData = [
    { label: 'Pendientes', count: data.stats?.pending || 0, color: '#fbbf24' },
    { label: 'Confirmadas', count: data.stats?.confirmed || 0, color: '#34d399' },
    { label: 'Sentados', count: data.stats?.seated || 0, color: '#60a5fa' },
    { label: 'Completadas', count: data.stats?.completed || 0, color: '#94a3b8' },
  ];

  return [
    // Slide 1: Weekly comparison
    {
      id: 'weekly',
      icon: '📈',
      title: 'Esta semana vs semana pasada',
      content: (t) => (
        <div className="flex flex-col items-center gap-7 w-full max-w-lg">
          <div className="flex gap-10 items-center">
            <div className="text-center">
              <p className="text-[7rem] font-black leading-none text-sky-400" style={{ textShadow: '0 0 60px rgba(56,189,248,0.35)' }}>
                {data.weeklyComp.thisWeek}
              </p>
              <p className="text-xs uppercase tracking-widest mt-2" style={{ color: t.date }}>esta semana</p>
            </div>
            <div className="text-center">
              <p className={`text-4xl font-black ${data.weeklyComp.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {data.weeklyComp.change >= 0 ? '↑' : '↓'}{Math.abs(data.weeklyComp.change)}%
              </p>
              <p className="text-xs uppercase tracking-widest mt-1" style={{ color: t.date }}>variación</p>
            </div>
            <div className="text-center">
              <p className="text-[7rem] font-black leading-none" style={{ color: t.date }}>
                {data.weeklyComp.lastWeek}
              </p>
              <p className="text-xs uppercase tracking-widest mt-2" style={{ color: t.roleLabel }}>sem. pasada</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center px-4 py-2 rounded-xl" style={{ background: t.card, border: `1px solid ${t.cardBorder}` }}>
              <p className="text-2xl font-black" style={{ color: t.slideTitle }}>{data.stats?.totalToday || 0}</p>
              <p className="text-xs uppercase tracking-wider mt-1" style={{ color: t.date }}>hoy</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl" style={{ background: t.card, border: `1px solid ${t.cardBorder}` }}>
              <p className="text-2xl font-black" style={{ color: t.slideTitle }}>{data.stats?.totalGuestsToday || 0}</p>
              <p className="text-xs uppercase tracking-wider mt-1" style={{ color: t.date }}>comensales hoy</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl" style={{ background: t.card, border: `1px solid ${t.cardBorder}` }}>
              <p className="text-2xl font-black" style={{ color: t.slideTitle }}>{avgGuests}</p>
              <p className="text-xs uppercase tracking-wider mt-1" style={{ color: t.date }}>media/reserva</p>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 2: KPIs 30 días
    {
      id: 'kpis',
      icon: '📊',
      title: 'KPIs · últimos 30 días',
      content: (t) => (
        <div className="flex flex-col items-center gap-7 w-full max-w-lg">
          <div className="grid grid-cols-2 gap-6 w-full">
            <div className="text-center py-5 rounded-3xl" style={{ background: `rgba(${data.noShowRate > 15 ? '248,113,113' : '52,211,153'},0.07)`, border: `1px solid rgba(${data.noShowRate > 15 ? '248,113,113' : '52,211,153'},0.15)` }}>
              <p className={`text-[5rem] font-black leading-none ${data.noShowRate > 15 ? 'text-red-400' : 'text-emerald-400'}`} style={{ textShadow: `0 0 40px rgba(${data.noShowRate > 15 ? '248,113,113' : '52,211,153'},0.25)` }}>
                {data.noShowRate}%
              </p>
              <p className="text-xs uppercase tracking-widest mt-2" style={{ color: t.date }}>no-show rate</p>
            </div>
            <div className="text-center py-5 rounded-3xl" style={{ background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.15)' }}>
              <p className="text-[5rem] font-black leading-none text-sky-400" style={{ textShadow: '0 0 40px rgba(56,189,248,0.25)' }}>
                {avgGuests}
              </p>
              <p className="text-xs uppercase tracking-widest mt-2" style={{ color: t.date }}>media comensales</p>
            </div>
          </div>
          <p style={{ color: t.date }} className="text-sm">
            {data.noShowRate < 5 ? '✅ Excelente fidelidad de clientes' :
              data.noShowRate < 15 ? '🟡 Tasa de no-shows aceptable' : '⚠️ Alta tasa — considera confirmaciones SMS'}
          </p>
        </div>
      ),
    },
    // Slide 3: Previsión 7 días
    {
      id: 'forecast',
      icon: '🔮',
      title: 'Previsión · próximos 7 días',
      content: (t) => {
        const fcst = data.forecast || [];
        const maxEst = Math.max(...fcst.map(f => f.projected), 1);
        const totalProj = fcst.reduce((s, f) => s + f.projected, 0);
        const totalAct = fcst.reduce((s, f) => s + f.actual, 0);

        return (
          <div className="flex flex-col items-center gap-5 w-full max-w-lg">
            {fcst.length === 0 ? (
              <p style={{ color: t.date }}>Calculando modelo predictivo...</p>
            ) : (
              <>
                <div className="flex items-end gap-2 w-full h-36">
                  {fcst.map((f, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Expected ghost bar */}
                      <div className="w-full relative rounded-t-lg flex flex-col justify-end"
                        style={{
                          height: `${Math.max(8, (f.projected / maxEst) * 110)}px`,
                          background: 'rgba(56,189,248,0.15)',
                          border: '1px dashed rgba(56,189,248,0.3)',
                          borderBottom: 'none'
                        }}>
                        {/* Actual solid bar embedded inside */}
                        <div className="w-full rounded-t-lg transition-all"
                          style={{
                            height: `${(f.actual / Math.max(f.projected, 1)) * 100}%`,
                            background: i === 0 ? 'linear-gradient(180deg,#38bdf8,#0284c7)' : 'linear-gradient(180deg,rgba(56,189,248,0.7),rgba(56,189,248,0.3))',
                            boxShadow: i === 0 ? '0 -4px 16px rgba(56,189,248,0.3)' : 'none',
                          }}
                        />
                      </div>
                      <span className="text-[9px]" style={{ color: t.slideTitle }}>
                        {f.actual > 0 ? <strong className="text-sky-400">{f.actual}</strong> : 0}
                        <span style={{ color: t.date, opacity: 0.6 }}>/{f.projected}</span>
                      </span>
                      <span className="text-[8px] text-center leading-tight flex items-center justify-center gap-0.5" style={{ color: t.date }}>
                        {f.label}
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: f.confidence === 'high' ? '#34d399' : f.confidence === 'medium' ? '#fbbf24' : '#f87171' }} title={`Confianza: ${f.confidence}`} />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="w-full text-center mt-1">
                  <p className="text-sm" style={{ color: t.date }}>
                    <span className="text-sky-400 font-bold">{totalAct}</span> confirmadas → cierre est. en <strong style={{ color: t.slideTitle }}>{totalProj}</strong>
                  </p>
                  <p className="text-[9px] mt-1 uppercase tracking-widest opacity-60" style={{ color: t.date }}>
                    <span className="inline-block w-2 h-2 mr-1 rounded-sm" style={{ background: '#38bdf8' }} /> Actual
                    <span className="inline-block w-2 h-2 ml-3 mr-1 rounded-sm border border-dashed border-sky-400" style={{ background: 'rgba(56,189,248,0.15)' }} /> Estimado
                  </p>
                </div>
              </>
            )}
          </div>
        );
      },
    },
    // Slide 4: Distribución estados + funnel
    {
      id: 'status-funnel',
      icon: '🥧',
      title: 'Flujo de reservas · hoy',
      content: (t) => (
        <div className="flex flex-col items-center gap-5 w-full max-w-lg">
          {totalStatus === 0 ? (
            <p style={{ color: t.date }} className="text-xl">Sin datos para hoy todavía</p>
          ) : (
            <>
              {/* Color bar */}
              <div className="w-full h-6 rounded-2xl overflow-hidden flex">
                {statusDist.map((d, i) => (
                  <div key={i} style={{ width: `${(d.count / totalStatus) * 100}%`, background: d.color, opacity: 0.85 }} title={d.label} />
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {statusDist.map(d => (
                  <div key={d.label} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs" style={{ color: t.date }}>{d.label} <strong style={{ color: d.color }}>{d.count}</strong></span>
                  </div>
                ))}
              </div>
              {/* Mini funnel */}
              <div className="w-full space-y-1.5 mt-1">
                {funnelData.map(f => (
                  <div key={f.label} className="flex items-center gap-3">
                    <span className="text-xs w-20 text-right shrink-0" style={{ color: t.date }}>{f.label}</span>
                    <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'rgba(100,116,139,0.1)' }}>
                      <div className="h-full rounded-full" style={{ width: `${(f.count / Math.max(totalStatus, 1)) * 100}%`, background: f.color, opacity: 0.8 }} />
                    </div>
                    <span className="text-xs font-bold w-5 shrink-0" style={{ color: f.color }}>{f.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ),
    },
    // Slide 5: Hora pico
    {
      id: 'peak',
      icon: '🔥',
      title: 'Hora pico del día',
      content: (t) => (
        <div className="flex flex-col items-center gap-6 w-full max-w-lg">
          <div className="text-center">
            <p className="text-[8rem] font-black leading-none text-orange-400" style={{ textShadow: '0 0 80px rgba(251,146,60,0.4)' }}>
              {peakHour}
            </p>
            <p className="mt-2" style={{ color: t.date }}><span className="font-bold text-orange-300 text-xl">{peakGuests}</span> comensales en esa hora</p>
          </div>
          <div className="flex gap-5">
            <div className="text-center px-5 py-3 rounded-2xl" style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.12)' }}>
              <p className="text-3xl font-bold text-amber-400">{data.metrics?.avgWaitTime || 0}<span className="text-sm font-normal ml-1" style={{ color: t.date }}>min</span></p>
              <p className="text-xs uppercase tracking-widest mt-1" style={{ color: t.date }}>espera media</p>
            </div>
            <div className="text-center px-5 py-3 rounded-2xl" style={{ background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.12)' }}>
              <p className="text-3xl font-bold text-purple-400">{data.metrics?.avgMealDuration || 0}<span className="text-sm font-normal ml-1" style={{ color: t.date }}>min</span></p>
              <p className="text-xs uppercase tracking-widest mt-1" style={{ color: t.date }}>duración comida</p>
            </div>
          </div>
        </div>
      ),
    },
    // Slide 6: Preferencias de mesa
    {
      id: 'preferences',
      icon: '🗺️',
      title: 'Preferencias de mesa · hoy',
      content: (t) => (
        <div className="flex flex-col items-center gap-5 w-full max-w-lg">
          {prefData.length === 0 ? (
            <p style={{ color: t.date }}>Sin datos de preferencias</p>
          ) : (
            <>
              <div className="w-full space-y-3">
                {prefData.map(([pref, count]) => {
                  const pct = Math.round((count / Math.max(validRes.length, 1)) * 100);
                  const emoji = pref === 'Interior' ? '🏠' : pref === 'Terraza exterior' ? '☀️' : pref === 'Mesas altas' ? '🪑' : '🔄';
                  const color = prefColors[pref] || '#94a3b8';
                  return (
                    <div key={pref} className="flex items-center gap-3">
                      <span className="text-lg w-7 shrink-0">{emoji}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium" style={{ color: t.slideTitle }}>{pref}</span>
                          <span className="text-sm font-bold" style={{ color }}>{count} ({pct}%)</span>
                        </div>
                        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(100,116,139,0.12)' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, opacity: 0.85 }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p style={{ color: t.date }} className="text-sm">
                {prefData[0] ? `Más popular: ${prefData[0][0]}` : ''}
              </p>
            </>
          )}
        </div>
      ),
    },
    // Slide 7: VIP hoy
    {
      id: 'vip',
      icon: '⭐',
      title: 'Clientes VIP · hoy',
      content: (t) => (
        <div className="flex flex-col items-center gap-5 w-full max-w-lg">
          {vipToday.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-6xl mb-3">🎉</p>
              <p className="text-xl font-semibold" style={{ color: t.slideTitle }}>Sin VIPs registrados hoy</p>
              <p style={{ color: t.date }} className="text-sm mt-1">Clientes con 5+ visitas</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-1">
                <p className="text-[5rem] font-black leading-none text-yellow-400" style={{ textShadow: '0 0 40px rgba(250,204,21,0.35)' }}>
                  {vipToday.length}
                </p>
                <div>
                  <p className="text-xl font-semibold" style={{ color: t.slideTitle }}>VIP{vipToday.length !== 1 ? 's' : ''} hoy</p>
                  <p style={{ color: t.date }} className="text-sm">Trátalos con atención especial</p>
                </div>
              </div>
              <div className="space-y-2 w-full">
                {vipToday.map(p => (
                  <div key={p.phone} className="flex items-center justify-between px-4 py-2 rounded-xl"
                    style={{ background: 'rgba(250,204,21,0.07)', border: '1px solid rgba(250,204,21,0.15)' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">⭐</span>
                      <span className="font-medium" style={{ color: t.slideTitle }}>{p.name}</span>
                    </div>
                    <span style={{ color: t.date }} className="text-xs">{p.visitCount} visitas · {p.favoritePreference}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ),
    },
  ];
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function SleepModeScreen({ role, onWake }: SleepModeScreenProps) {
  const now = useCurrentTime();
  const [slideIndex, setSlideIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [isDark] = useState(() => getStoredTheme() === 'dark');
  const t = isDark ? DARK_THEME : LIGHT_THEME;

  const [data, setData] = useState<SleepData>({
    reservations: [],
    stats: null,
    metrics: null,
    weeklyComp: { thisWeek: 0, lastWeek: 0, change: 0 },
    noShowRate: 0,
    clientProfiles: [],
    forecast: [],
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const wakeCalledRef = useRef(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const isOwner = !role || role === 'owner';

      const promises: Promise<any>[] = [
        getReservationsForDate(today),
        getStats(today),
        getWaitAndMealMetrics(today),
      ];
      if (isOwner) {
        promises.push(getWeeklyComparison(), getNoShowRate(), getClientProfiles(), getForecastData());
      }

      const results = await Promise.all(promises);
      const [reservations, stats, metrics] = results;
      const weeklyComp = isOwner ? results[3] : { thisWeek: 0, lastWeek: 0, change: 0 };
      const noShowRate = isOwner ? results[4] : 0;
      const clientProfiles = isOwner ? results[5] : [];
      const forecast = isOwner ? (results[6] ?? []) : [];

      setData({ reservations, stats, metrics, weeklyComp, noShowRate, clientProfiles, forecast });
      setDataLoaded(true);
    } catch (err) {
      console.error('SleepMode: error fetching data', err);
      setDataLoaded(true);
    }
  }, [role]);

  useEffect(() => {
    fetchData();
    // Reduce polling frequency from every 60 seconds to once per hour (3,600,000 ms)
    const interval = setInterval(fetchData, 3_600_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Slides
  const slides = role === 'waiter' ? getWaiterSlides(data, now) : getOwnerSlides(data, now);

  // Auto-advance
  useEffect(() => {
    if (!dataLoaded) return;
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setSlideIndex(i => (i + 1) % slides.length);
        setFading(false);
      }, 500);
    }, 8_000);
    return () => clearInterval(t);
  }, [dataLoaded, slides.length]);

  // Wake on any interaction
  const handleWake = useCallback(() => {
    if (wakeCalledRef.current) return;
    wakeCalledRef.current = true;
    onWake();
  }, [onWake]);

  useEffect(() => {
    const events = ['mousedown', 'touchstart', 'keydown', 'pointerdown'];
    events.forEach(e => window.addEventListener(e, handleWake, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, handleWake));
  }, [handleWake]);

  const currentSlide = slides[slideIndex];

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between overflow-hidden select-none"
      style={{ background: t.bg }}
      onClick={handleWake}
    >
      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full"
          style={{ width: '650px', height: '650px', top: '-220px', left: '-170px', background: `radial-gradient(circle, ${t.orb1} 0%, transparent 70%)`, animation: 'sleepOrb1 22s ease-in-out infinite' }} />
        <div className="absolute rounded-full"
          style={{ width: '550px', height: '550px', bottom: '-170px', right: '-120px', background: `radial-gradient(circle, ${t.orb2} 0%, transparent 70%)`, animation: 'sleepOrb2 28s ease-in-out infinite' }} />
      </div>

      {/* Top: Clock */}
      <div className="relative z-10 pt-10 text-center flex-shrink-0">
        <p
          className="font-mono font-black tracking-tight tabular-nums"
          style={{ fontSize: 'clamp(3.5rem, 8vw, 6rem)', color: t.clock, textShadow: t.clockShadow, letterSpacing: '-2px' }}
        >
          {formatTime(now)}
        </p>
        <p className="text-sm tracking-widest capitalize mt-1" style={{ color: t.date }}>
          {formatDateES(now)}
        </p>
      </div>

      {/* Center: Stats slide */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full px-8 max-w-2xl mx-auto">
        {/* Slide card */}
        <div className="w-full rounded-3xl p-6 backdrop-blur-sm" style={{ background: t.card, border: `1px solid ${t.cardBorder}` }}>
          {/* Slide header */}
          <div className="mb-5 text-center" style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.5s ease' }}>
            <p className="text-[10px] uppercase tracking-[0.25em] mb-0.5" style={{ color: t.roleLabel }}>
              {role === 'waiter' ? '🍽️ Vista Camarero' : '👑 Vista Dueño'}
            </p>
            <h2 className="text-base font-semibold" style={{ color: t.slideTitle }}>
              <span className="mr-1.5">{currentSlide?.icon}</span>{currentSlide?.title}
            </h2>
          </div>

          {/* Slide content */}
          <div
            className="w-full flex items-center justify-center min-h-[240px]"
            style={{ opacity: fading ? 0 : 1, transform: fading ? 'translateY(10px)' : 'translateY(0)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}
          >
            {dataLoaded ? (
              currentSlide?.content(t)
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: `${t.cardBorder}`, borderTopColor: '#38bdf8' }} />
                <p className="text-sm" style={{ color: t.date }}>Cargando estadísticas...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Dots + logo */}
      <div className="relative z-10 pb-7 flex flex-col items-center gap-3 flex-shrink-0">
        {/* Slide dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-500 cursor-pointer"
              style={{ width: i === slideIndex ? '22px' : '6px', height: '6px', background: i === slideIndex ? t.dotActive : t.dotInactive }}
              onClick={(e) => { e.stopPropagation(); setFading(true); setTimeout(() => { setSlideIndex(i); setFading(false); }, 400); }}
            />
          ))}
        </div>
        <img src={isDark ? '/logowhite.png' : '/logoblack.png'} alt="El Atlante" style={{ height: '22px', opacity: t.logoOpacity }} />
        <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: t.wakeHint }}>Toca para volver</p>
      </div>

      <style>{`
        @keyframes sleepOrb1 {
          0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,45px) scale(1.1)} 66%{transform:translate(-30px,70px) scale(0.95)}
        }
        @keyframes sleepOrb2 {
          0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-80px,-55px) scale(1.15)}
        }
      `}</style>
    </div>
  );
}
