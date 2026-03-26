import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReservationsForDate, updateReservation, addWalkIn, getOccupiedTables, getShiftNote, getClientProfiles, addToWaitList, parseAssignedTables, getWaitAndMealMetrics, type Reservation, type ReservationStatus, type ClientProfile, type WaitAndMealMetrics } from '../services/reservationStore';
import { signOut, getStaffRole, getSession, isTabletAuthorized, getActiveStaffId } from '../services/authStore';
import TableSelector from '../components/TableSelector';
import GuestCounter from '../components/GuestCounter';
import FeedbackButton from '../components/FeedbackButton';
import logoWhite from '../assets/logowhite.png';
import logoBlack from '../assets/logoblack.png';
import ManualReservationModal from '../components/ManualReservationModal';
import { assignTablePure } from '../utils/tableAssignment';
import { getTableDef, getAreaDef } from '../utils/tableConfig';
import { AdminThemeProvider, useAdminTheme } from '../contexts/AdminThemeContext';
import ThemeToggle from '../components/admin/ThemeToggle';

const STATUS_COLORS: Record<ReservationStatus, string> = {
  'pending': 'border-l-amber-400 bg-amber-400/5',
  'confirmed': 'border-l-emerald-400 bg-emerald-400/5',
  'seated': 'border-l-blue-400 bg-blue-400/5',
  'completed': 'border-l-slate-500 bg-slate-500/5',
  'cancelled': 'border-l-red-400 bg-red-400/5',
  'no-show': 'border-l-orange-400 bg-orange-400/5',
  'waiting': 'border-l-purple-400 bg-purple-400/5',
};

const STATUS_BADGES: Record<ReservationStatus, { label: string; color: string }> = {
  'pending':   { label: 'Pendiente',  color: 'text-amber-400 bg-amber-400/10' },
  'confirmed': { label: 'Confirmada', color: 'text-emerald-400 bg-emerald-400/10' },
  'seated':    { label: 'Sentados',   color: 'text-blue-400 bg-blue-400/10' },
  'completed': { label: 'Completada', color: 'text-slate-400 bg-slate-400/10' },
  'cancelled': { label: 'Cancelada',  color: 'text-red-400 bg-red-400/10' },
  'no-show':   { label: 'No Show',    color: 'text-orange-400 bg-orange-400/10' },
  'waiting':   { label: 'En Espera', color: 'text-purple-400 bg-purple-400/10' },
};

type Tab = 'upcoming' | 'seated' | 'waitlist' | 'done';

// ── Sound helper ──
function playDing() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) { /* audio not available */ }
}

// ── Seated time helpers ──
function getSeatedMinutes(seatedAt?: string): number {
  if (!seatedAt) return 0;
  return Math.floor((Date.now() - new Date(seatedAt).getTime()) / 60000);
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function WaiterPanel() {
  return (
    <AdminThemeProvider>
      <WaiterPanelInner />
    </AdminThemeProvider>
  );
}

function WaiterPanelInner() {
  const navigate = useNavigate();
  const { isDark } = useAdminTheme();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInGuests, setWalkInGuests] = useState(2);
  const [walkInTables, setWalkInTables] = useState<number[]>([]);
  const [walkInPreference, setWalkInPreference] = useState<string>('Indiferente');
  const [walkInPet, setWalkInPet] = useState(false);
  const [walkInRecommendation, setWalkInRecommendation] = useState<{ tableNumber: number; combinedNote?: string; allTableIds?: number[] } | null>(null);
  const [occupiedTables, setOccupiedTables] = useState<number[]>([]);
  const [shiftNote, setShiftNote] = useState<string | null>(null);
  const [clientProfiles, setClientProfiles] = useState<ClientProfile[]>([]);
  const [metrics, setMetrics] = useState<WaitAndMealMetrics | null>(null);
  const today = new Date().toISOString().split('T')[0];
  const prevCountRef = useRef(0);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    try {
      const session = getSession();
      const activeStaffId = getActiveStaffId();
      const isAuthorized = isTabletAuthorized();

      if (!session && !(isAuthorized && activeStaffId)) {
        navigate('/admin', { replace: true });
        return;
      }

      // If we have a session, verify the role
      if (session) {
        const role = getStaffRole();
        if (role !== 'waiter' && role !== 'owner') {
          navigate('/admin', { replace: true });
          return;
        }
      }
      
      setAuthChecked(true);
    } catch {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const reload = useCallback(async () => {
    const [data, occTables, note, profiles, metricsData] = await Promise.all([
      getReservationsForDate(today),
      getOccupiedTables(today),
      getShiftNote(today),
      getClientProfiles(),
      getWaitAndMealMetrics(today)
    ]);
    
    setReservations(data);
    setOccupiedTables(occTables);
    setShiftNote(note);
    setClientProfiles(profiles);
    setMetrics(metricsData);

    // Sound notification if new reservations appeared
    const activeCount = data.filter(r => r.status !== 'cancelled' && r.status !== 'completed').length;
    if (prevCountRef.current > 0 && activeCount > prevCountRef.current) {
      playDing();
    }
    prevCountRef.current = activeCount;
  }, [today]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Auto-reload every 20s
  useEffect(() => {
    const interval = setInterval(reload, 20000);
    return () => clearInterval(interval);
  }, [reload]);

  // Reload on tab focus / device wake
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') reload();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [reload]);

  // Re-render every minute for time alerts
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const grouped = useMemo(() => ({
    upcoming: reservations.filter(r => r.status === 'pending' || r.status === 'confirmed').sort((a, b) => a.time.localeCompare(b.time)),
    seated: reservations.filter(r => r.status === 'seated').sort((a, b) => a.time.localeCompare(b.time)),
    waitlist: reservations.filter(r => r.status === 'waiting').sort((a, b) => a.time.localeCompare(b.time)),
    done: reservations.filter(r => r.status === 'completed' || r.status === 'cancelled' || r.status === 'no-show').sort((a, b) => a.time.localeCompare(b.time)),
  }), [reservations]);

  const currentList = grouped[tab];

  const handleStatus = async (id: string, status: ReservationStatus, tableNumber?: number, assignedTables?: number[]) => {
    const payload: Partial<Reservation> = { status };
    if (tableNumber) payload.tableNumber = tableNumber;
    if (assignedTables) payload.assignedTables = assignedTables;
    await updateReservation(id, payload);
    reload();
  };


  const handleWalkIn = async () => {
    if (walkInTables.length > 0 && walkInGuests > 0 && walkInName.trim()) {
      await addWalkIn(walkInGuests, walkInTables[0], walkInName.trim(), walkInTables);
      setWalkInName('');
      setWalkInGuests(2);
      setWalkInTables([]);
      setWalkInPreference('Indiferente');
      setWalkInPet(false);
      setWalkInRecommendation(null);
      setShowWalkIn(false);
      reload();
    }
  };

  const handleAddToWaitList = async (name: string, guests: number, phone?: string) => {
    await addToWaitList(name, guests, phone);
    reload();
  };

  const removeFromWaitList = async (id: string) => {
    await updateReservation(id, { status: 'cancelled' });
    reload();
  };

  const handleSeatFromWaitlist = async (waitlistId: string, _guests: number, tableNumber: number, assignedTables?: number[]) => {
    await updateReservation(waitlistId, { 
      status: 'seated', 
      tableNumber,
      assignedTables
    });
    reload();
  };

  const logout = async () => { await signOut(); navigate('/admin'); };

  const reservedTables = useMemo(() => {
    const d = new Date();
    const currentMins = d.getHours() * 60 + d.getMinutes();
    const tables = new Set<number>();
    
    grouped.upcoming.forEach(r => {
      if (r.tableNumber && (r.status === 'pending' || r.status === 'confirmed')) {
        const [h, m] = r.time.split(':').map(Number);
        const resMins = h * 60 + m;
        // Res is within 2 hours or late -> blocked
        if (resMins - currentMins <= 120) {
          const tids = parseAssignedTables(r.assignedTables);
          if (tids.length > 0) tids.forEach(tid => tables.add(tid));
          else tables.add(r.tableNumber);
        }
      }
    });
    return Array.from(tables);
  }, [grouped.upcoming, tick]);

  const allUnavailable = new Set([...occupiedTables, ...reservedTables]);

  // Auto-recommend table when walk-in params change
  useEffect(() => {
    if (!showWalkIn) return;
    const allUnavailableSet = new Set([...occupiedTables, ...reservedTables]);
    const result = assignTablePure(walkInGuests, walkInPreference, walkInPet, allUnavailableSet);
    if (result && result.allTableIds) {
      setWalkInRecommendation(result);
      setWalkInTables(parseAssignedTables(result.allTableIds));
    } else {
      setWalkInRecommendation(null);
      setWalkInTables([]);
    }
  }, [showWalkIn, walkInGuests, walkInPreference, walkInPet, occupiedTables, reservedTables]);
  const hasAvailableTable = allUnavailable.size < 45;
  const shouldBlinkWaitlist = grouped.waitlist.length > 0 && hasAvailableTable;

  const nowTime = new Date();
  const currentTimeStr = `${nowTime.getHours().toString().padStart(2, '0')}:${nowTime.getMinutes().toString().padStart(2, '0')}`;

  const tabs: { key: Tab; label: string; count: number; color: string; blink?: boolean }[] = [
    { key: 'upcoming', label: 'Por llegar', count: grouped.upcoming.length, color: 'text-amber-400' },
    { key: 'seated', label: 'En mesa', count: grouped.seated.length, color: 'text-blue-400' },
    { key: 'waitlist', label: 'Espera', count: grouped.waitlist.length, color: 'text-purple-400', blink: shouldBlinkWaitlist },
    { key: 'done', label: 'Finalizadas', count: grouped.done.length, color: 'text-slate-400' },
  ];

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--admin-bg)' }}>
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--admin-bg)', color: 'var(--admin-text)' }}>
      {/* Top Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: 'var(--admin-header-bg)', borderColor: 'var(--admin-border)' }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="h-7">
              <img src={isDark ? logoWhite : logoBlack} alt="El Atlante" className="h-full w-auto object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-bold" style={{ color: 'var(--admin-text)' }}>Camarero</h1>
              <p className="text-[10px] uppercase tracking-tight" style={{ color: 'var(--admin-text-muted)' }}>{today} · {currentTimeStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <FeedbackButton role="waiter" className="text-slate-500 text-xs flex items-center gap-1.5 transition-colors hover:text-amber-400" />
            <button onClick={logout} className="text-xs flex items-center gap-2 transition-colors hover:text-red-400" style={{ color: 'var(--admin-text-muted)' }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg>
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Quick Stats & Notes */}
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {shiftNote && (
          <div className="rounded-2xl p-4 flex gap-3" style={{ background: 'var(--admin-bg-elevated)', border: '1px solid var(--admin-border)' }}>
            <span className="text-amber-400 text-lg">💡</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">Notas del Turno</p>
              <p className="text-sm" style={{ color: 'var(--admin-text-secondary)' }}>{shiftNote}</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-4 gap-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`rounded-2xl py-3 px-1 text-center transition-all border ${tab === t.key ? '' : 'border-transparent'} ${t.blink ? 'animate-strong-blink text-purple-300' : ''}`}
              style={{ background: tab === t.key ? 'var(--admin-bg-elevated)' : 'var(--admin-bg-card)', borderColor: tab === t.key ? 'var(--admin-border)' : 'transparent' }}>
              <p className={`text-xl font-black ${t.color}`}>{t.count}</p>
              <p className="text-[9px] font-medium uppercase tracking-wider mt-1" style={{ color: 'var(--admin-text-muted)' }}>{t.label}</p>
            </button>
          ))}
        </div>

        {/* Global Stats bar for staff */}
        {metrics && (metrics.avgWaitTime > 0 || metrics.avgMealDuration > 0) && (
          <div className="flex gap-2 rounded-2xl p-2.5" style={{ background: 'var(--admin-bg-card)', border: '1px solid var(--admin-border)' }}>
            <div className="flex-1 flex items-center justify-center gap-2 border-r" style={{ borderColor: 'var(--admin-border)' }}>
              <span className="text-amber-400 text-sm">⏱</span>
              <div>
                <p className="text-[8px] uppercase tracking-widest font-bold leading-none" style={{ color: 'var(--admin-text-muted)' }}>Espera Media</p>
                <p className="text-sm font-black" style={{ color: 'var(--admin-text)' }}>{metrics.avgWaitTime} <span className="text-[10px] font-normal" style={{ color: 'var(--admin-text-muted)' }}>min</span></p>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center gap-2">
              <span className="text-purple-400 text-sm">🍽</span>
              <div>
                <p className="text-[8px] uppercase tracking-widest font-bold leading-none" style={{ color: 'var(--admin-text-muted)' }}>Comida Media</p>
                <p className="text-sm font-black" style={{ color: 'var(--admin-text)' }}>{metrics.avgMealDuration} <span className="text-[10px] font-normal" style={{ color: 'var(--admin-text-muted)' }}>min</span></p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reservation Cards */}
      <div className="max-w-3xl mx-auto px-4 pb-28 space-y-3">
        {tab === 'waitlist' ? (
          <WaitListView 
            waitList={grouped.waitlist} 
            addToWaitList={handleAddToWaitList} 
            removeFromWaitList={removeFromWaitList}
            onSeat={handleSeatFromWaitlist}
            occupiedTables={occupiedTables}
            reservedTables={reservedTables}
            clientProfiles={clientProfiles}
          />
        ) : currentList.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--admin-text-muted)' }}>
            <p className="text-sm">No hay reservas en esta sección</p>
          </div>
        ) : (
          currentList.map(r => (
            <SwipeableCard key={r.id} reservation={r} handleStatus={handleStatus} occupiedTables={occupiedTables} reservedTables={reservedTables} profile={clientProfiles.find(p => p.email === r.email || p.phone === r.phone)} />
          ))
        )}
      </div>

      {/* Walk-in Modal */}
      {showWalkIn && (
        <div className="fixed inset-0 z-[100] backdrop-blur-sm flex items-end justify-center p-4 sm:items-center" onClick={() => setShowWalkIn(false)} style={{ background: 'var(--admin-overlay)' }}>
          <div className="rounded-3xl p-6 w-full max-w-md space-y-5 animate-in max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()} style={{ background: 'var(--admin-modal-bg)', border: '1px solid var(--admin-border-strong)' }}>
            <div className="flex items-center justify-between sticky top-0 py-1 z-10 font-bold" style={{ background: 'var(--admin-modal-bg)' }}>
              <h2 className="text-lg">+ Mesa Rápida</h2>
              <button onClick={() => setShowWalkIn(false)} className="text-slate-500 hover:text-white text-sm">✕</button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nombre del cliente</label>
              <input 
                type="text" 
                value={walkInName} 
                onChange={e => setWalkInName(e.target.value)} 
                placeholder="Ej: Juan Pérez"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50"
                style={{ background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border-strong)', color: 'var(--admin-text)' }} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Comensales</label>
              <GuestCounter 
                value={walkInGuests} 
                onChange={setWalkInGuests} 
                max={20}
                className="justify-center py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Preferencia</label>
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border-strong)' }}>
                  <select value={walkInPreference} onChange={e => setWalkInPreference(e.target.value)}
                    className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none appearance-none cursor-pointer" style={{ color: 'var(--admin-text)' }}>
                    <option value="Indiferente">🔄 Indiferente</option>
                    <option value="Interior">🏠 Interior</option>
                    <option value="Terraza exterior">☀️ Terraza</option>
                    <option value="Mesas altas">🪑 Mesas altas</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mascota</label>
                <div 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                    walkInPet ? 'bg-amber-500/10 border-amber-500/30' : ''
                  }`}
                  style={walkInPet ? {} : { background: 'var(--admin-bg-input)', borderColor: 'var(--admin-border-strong)' }}
                  onClick={() => setWalkInPet(!walkInPet)}
                >
                  <div className={`w-8 h-4 rounded-full relative transition-colors flex-shrink-0 ${walkInPet ? 'bg-amber-500' : ''}`} style={{ background: !walkInPet ? 'var(--admin-bg-hover)' : undefined }}>
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-300 ${walkInPet ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--admin-text)' }}>🐾</span>
                </div>
              </div>
            </div>

            {/* Table Recommendation Banner */}
            {walkInRecommendation && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-emerald-400 text-lg">💡</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Mesa recomendada</p>
                  <p className="text-sm" style={{ color: 'var(--admin-text-secondary)' }}>
                    Mesa <strong className="text-emerald-500">{walkInRecommendation.tableNumber}</strong>
                    {(() => {
                      const tDef = getTableDef(walkInRecommendation.tableNumber);
                      if (!tDef) return null;
                      const aDef = getAreaDef(tDef.area);
                      return <> · {aDef.label} ({tDef.capacity}p)</>;
                    })()}
                    {walkInRecommendation.combinedNote && (
                      <span className="text-xs text-slate-400 ml-1">{walkInRecommendation.combinedNote}</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mesa {walkInRecommendation ? '(auto-seleccionada, puedes cambiar)' : ''}</label>
              <TableSelector 
                occupiedTables={occupiedTables} 
                reservedTables={reservedTables} 
                selectedTables={walkInTables} 
                onSelect={t => setWalkInTables(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} 
              />
            </div>

            <button onClick={handleWalkIn} disabled={walkInTables.length === 0 || !walkInName.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
              🪑 Sentar ahora
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 left-4 right-4 flex justify-between gap-3 z-50 pointer-events-none">
        <button onClick={() => setShowWalkIn(true)}
          className="pointer-events-auto flex-1 h-14 sm:h-16 bg-emerald-500 hover:bg-emerald-400 rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-2 sm:gap-3 px-2 sm:px-5 transition-all active:scale-95">
          <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white flex-shrink-0" fill="currentColor" viewBox="0 -960 960 960"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
          <span className="text-white font-bold text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">Mesa Rápida</span>
        </button>

        <button onClick={() => setShowAddModal(true)}
          className="pointer-events-auto flex-1 h-14 sm:h-16 bg-primary hover:bg-primary/90 rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-2 sm:gap-3 px-2 sm:px-5 transition-all active:scale-95">
          <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white flex-shrink-0" fill="currentColor" viewBox="0 -960 960 960"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
          <span className="text-white font-bold text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">Nueva Reserva</span>
        </button>
      </div>

      {showAddModal && <ManualReservationModal onClose={() => setShowAddModal(false)} onSave={() => { setShowAddModal(false); reload(); }} />}
    </div>
  );
}

// ═══════════════════════════════════════════════
// WAIT LIST VIEW
// ═══════════════════════════════════════════════

function WaitListView({ waitList, addToWaitList, removeFromWaitList, onSeat, occupiedTables, reservedTables, clientProfiles }: {
  waitList: Reservation[];
  addToWaitList: (name: string, guests: number, phone?: string, preference?: string, hasPet?: boolean) => void;
  removeFromWaitList: (id: string) => void;
  onSeat: (id: string, guests: number, tableNumber: number, assignedTables?: number[]) => void;
  occupiedTables: number[];
  reservedTables: number[];
  clientProfiles: ClientProfile[];
}) {
  const [waitName, setWaitName] = useState('');
  const [waitGuests, setWaitGuests] = useState(2);
  const [waitPreference, setWaitPreference] = useState<string>('Indiferente');
  const [waitPet, setWaitPet] = useState(false);
  const [seatingId, setSeatingId] = useState<string | null>(null);
  const [seatingTables, setSeatingTables] = useState<number[]>([]);
  const [seatingRecommendation, setSeatingRecommendation] = useState<{ tableNumber: number; combinedNote?: string; allTableIds?: number[] } | null>(null);

  // Auto-recommend table when seating modal opens
  useEffect(() => {
    if (!seatingId) {
      setSeatingRecommendation(null);
      setSeatingTables([]);
      return;
    }
    const item = waitList.find(w => w.id === seatingId);
    if (!item) return;

    const allUnavailableSet = new Set([...occupiedTables, ...reservedTables]);
    // Uses the item's preference and pet status, tracking unavailable tables.
    const result = assignTablePure(item.guests, item.preference || 'Indiferente', item.hasPet || false, allUnavailableSet);
    
    if (result && result.allTableIds) {
      setSeatingRecommendation(result);
      setSeatingTables(parseAssignedTables(result.allTableIds));
    } else {
      setSeatingRecommendation(null);
      setSeatingTables([]);
    }
  }, [seatingId, waitList, occupiedTables, reservedTables]);

  const allUnavailableSet = new Set([...occupiedTables, ...reservedTables]);

  const enrichedWaitList = waitList.map((w, idx) => {
    const result = assignTablePure(w.guests, w.preference || 'Indiferente', w.hasPet || false, allUnavailableSet);
    return {
      reservation: w,
      originalIndex: idx + 1,
      canSeat: !!result
    };
  });

  const sortedWaitList = [...enrichedWaitList].sort((a, b) => {
    if (a.canSeat && !b.canSeat) return -1;
    if (!a.canSeat && b.canSeat) return 1;
    return a.originalIndex - b.originalIndex;
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--admin-bg-card)', border: '1px solid var(--admin-border)' }}>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <input type="text" value={waitName} onChange={e => setWaitName(e.target.value)} placeholder="Nombre del cliente"
              className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50" 
              style={{ background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }} />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <GuestCounter 
              value={waitGuests} 
              onChange={setWaitGuests} 
              max={20}
              className="admin-bg-input admin-border rounded-xl px-4 py-2"
            />
            <select
              value={waitPreference}
              onChange={(e) => setWaitPreference(e.target.value)}
              className="rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50"
              style={{ background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
            >
              <option value="Indiferente">Indiferente</option>
              <option value="Interior">Interior</option>
              <option value="Terraza exterior">Terraza exterior</option>
              <option value="Mesas altas">Mesas altas</option>
            </select>
            <button
              onClick={() => setWaitPet(!waitPet)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all border ${waitPet ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : ''}`}
              style={waitPet ? {} : { background: 'var(--admin-bg-input)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-muted)' }}
              title="¿Lleva mascota?"
            >
              🐾 <span className="hidden sm:inline">Mascota</span>
            </button>
            <button onClick={() => { 
                if (waitName) { 
                  addToWaitList(waitName, waitGuests, '', waitPreference, waitPet); 
                  setWaitName(''); 
                  setWaitPreference('Indiferente');
                  setWaitPet(false);
                } 
              }}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-3 text-sm font-bold transition-all sm:ml-auto">
              + Añadir
            </button>
          </div>
        </div>

        <div className="pt-4 border-t" style={{ borderColor: 'var(--admin-border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--admin-text-muted)' }}>Clientes esperando</h3>
          
          {waitList.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <p className="text-sm italic">La lista está vacía</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedWaitList.map(({ reservation: w, originalIndex, canSeat }) => {
                const profile = clientProfiles.find(p => p.email === w.email || p.phone === w.phone);
                return (
                  <div key={w.id} className={`border rounded-2xl px-5 py-4 flex items-center justify-between transition-colors ${canSeat ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : ''}`}
                    style={{ background: 'var(--admin-bg-elevated)', borderColor: !canSeat ? 'var(--admin-border)' : undefined }}>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <span className={`rounded-xl w-10 h-10 flex items-center justify-center font-black text-lg ${canSeat ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/20 text-primary'}`}>{originalIndex}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-base" style={{ color: canSeat ? '#10b981' : 'var(--admin-text)' }}>{w.name}</p>
                          {profile?.isVIP && <span title="Cliente VIP" className="text-sm">⭐</span>}
                          {profile?.isProblem && <span title="Atención requerida" className="text-sm">⚠️</span>}
                          {canSeat && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full px-2 py-0.5 font-bold uppercase tracking-wide ml-1">¡Mesa Disponible!</span>}
                        </div>
                        <p className="text-xs font-medium" style={{ color: 'var(--admin-text-muted)' }}>
                          👥 {w.guests} · {w.preference === 'Terraza exterior' ? '☀️' : w.preference === 'Interior' ? '🏠' : w.preference === 'Mesas altas' ? '🪑' : '🔄'}
                          {w.hasPet && ' 🐾'} · {new Date(w.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSeatingId(w.id)} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl px-4 py-2 text-xs font-bold transition-all">
                        🪑 Sentar
                      </button>
                      <button onClick={() => removeFromWaitList(w.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Seating Modal */}
      {seatingId && (
        <div className="fixed inset-0 z-[110] backdrop-blur-sm flex items-end justify-center p-4 sm:items-center" 
          style={{ background: 'var(--admin-overlay)' }}
          onClick={() => setSeatingId(null)}>
          <div className="rounded-3xl p-6 w-full max-w-md space-y-5 animate-in max-h-[90vh] overflow-y-auto custom-scrollbar" 
            style={{ background: 'var(--admin-modal-bg)', border: '1px solid var(--admin-border-strong)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between sticky top-0 py-1 z-10"
              style={{ background: 'var(--admin-modal-bg)' }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--admin-text)' }}>Asignar Mesa</h2>
                <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>Para {waitList.find(w => w.id === seatingId)?.name}</p>
              </div>
              <button onClick={() => setSeatingId(null)} className="text-slate-500 hover:text-white text-sm">✕</button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Mesa {seatingRecommendation ? '(auto-seleccionada, puedes cambiar)' : ''}
              </label>
              {seatingRecommendation && seatingRecommendation.combinedNote && (
                <div className="mb-2 p-2 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary/80">
                  <span className="font-bold">Sugerencia múltiple:</span> {seatingRecommendation.combinedNote}
                </div>
              )}
              <TableSelector 
                occupiedTables={occupiedTables} 
                reservedTables={reservedTables}
                selectedTables={seatingTables}
                onSelect={(table) => setSeatingTables(prev => prev.includes(table) ? prev.filter(x => x !== table) : [...prev, table])} 
              />
              <button 
                onClick={() => {
                  const item = waitList.find(w => w.id === seatingId);
                  if (item && seatingTables.length > 0) {
                    onSeat(item.id, item.guests, seatingTables[0], seatingTables);
                  }
                  setSeatingId(null);
                  setSeatingTables([]);
                }}
                disabled={seatingTables.length === 0}
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                ✓ Aplicar y sentar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// SWIPEABLE RESERVATION CARD
// ═══════════════════════════════════════════════

export type SwipeableCardProps = {
  reservation: Reservation;
  handleStatus: (id: string, status: ReservationStatus, tableNumber?: number, assignedTables?: number[]) => void;
  occupiedTables: number[];
  reservedTables: number[];
  profile?: ClientProfile;
};

function SwipeableCard({ reservation: r, handleStatus, occupiedTables, reservedTables, profile }: SwipeableCardProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [showTableSelector, setShowTableSelector] = useState(false);
  const initialTables = r.assignedTables ? parseAssignedTables(r.assignedTables) : (r.tableNumber ? [r.tableNumber] : []);
  const [selectedChangeTables, setSelectedChangeTables] = useState<number[]>(initialTables);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);

  const sc = STATUS_BADGES[r.status];
  const seatedMinutes = getSeatedMinutes(r.seatedAt);
  const isTimeWarning = r.status === 'seated' && seatedMinutes > 120;
  const isTimeCritical = r.status === 'seated' && seatedMinutes > 150;

  // Track if we open selector to change tables or to seat the person
  const [selectorIntent, setSelectorIntent] = useState<'seating' | 'changing'>('changing');
  const [seatingRecommendation, setSeatingRecommendation] = useState<{ tableNumber: number; combinedNote?: string; allTableIds?: number[] } | null>(null);

  // Auto-recommend table when seating mode is activated and no tables are selected
  useEffect(() => {
    if (showTableSelector && selectorIntent === 'seating' && selectedChangeTables.length === 0) {
      const allUnavailableSet = new Set([...occupiedTables, ...reservedTables]);
      const result = assignTablePure(r.guests, r.preference || 'Indiferente', r.hasPet || false, allUnavailableSet);
      if (result && result.allTableIds) {
        setSeatingRecommendation(result);
        setSelectedChangeTables(parseAssignedTables(result.allTableIds));
      } else {
        setSeatingRecommendation(null);
      }
    } else if (!showTableSelector) {
      setSeatingRecommendation(null);
    }
  }, [showTableSelector, selectorIntent, r.guests, r.preference, r.hasPet, occupiedTables, reservedTables, selectedChangeTables.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow swipe for pending or confirmed reservations
    if (r.status !== 'pending' && r.status !== 'confirmed') return;
    
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = false;
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // Determine swipe direction on first significant move
    if (!isHorizontalSwipe.current && Math.abs(deltaX) > 10) {
      isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
    }
    
    if (isHorizontalSwipe.current) {
      setSwipeX(Math.max(-120, Math.min(120, deltaX)));
    }
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    if (Math.abs(swipeX) > 80) {
      if (swipeX > 0) {
        // Swipe right → Confirm or Seat
        if (r.status === 'pending') handleStatus(r.id, 'confirmed');
        else if (r.status === 'confirmed') {
          setSelectorIntent('seating');
          setShowTableSelector(true);
        }
      } else {
        // Swipe left → Cancel or No Show
        if (r.status !== 'completed' && r.status !== 'cancelled' && r.status !== 'no-show' && r.status !== 'seated') {
          handleStatus(r.id, 'no-show');
        }
      }
    }
    setSwipeX(0);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl ">
      {/* Swipe background hints */}
      {swiping && (r.status === 'pending' || r.status === 'confirmed') && (
        <div className="absolute inset-0 flex">
          <div className={`flex-1 flex items-center justify-start pl-6 ${swipeX > 40 ? 'bg-emerald-500/20' : 'bg-transparent'} transition-colors rounded-l-2xl`}>
            {swipeX > 40 && <span className="text-emerald-400 font-bold text-sm">{r.status === 'pending' ? '✓ Confirmar' : '🪑 Sentar'}</span>}
          </div>
          <div className={`flex-1 flex items-center justify-end pr-6 ${swipeX < -40 ? 'bg-orange-500/20' : 'bg-transparent'} transition-colors rounded-r-2xl`}>
            {swipeX < -40 && <span className="text-orange-400 font-bold text-sm">👻 No Show</span>}
          </div>
        </div>
      )}

      {/* Card */}
      <div
        className={`relative border-l-4 ${STATUS_COLORS[r.status]} border rounded-2xl overflow-hidden transition-transform ${isTimeCritical ? 'ring-2 ring-red-500/50 animate-pulse' : isTimeWarning ? 'ring-2 ring-orange-500/40' : ''}`}
        style={{ 
          transform: `translateX(${swipeX}px)`, 
          transition: swiping ? 'none' : 'transform 0.3s ease',
          background: 'var(--admin-bg-card)',
          borderColor: 'var(--admin-border)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="px-5 py-4 space-y-3" style={{ background: 'var(--admin-bg-card)' }}>
          {/* Top info */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base" style={{ color: 'var(--admin-text)' }}>{r.name}</span>
                {profile?.isVIP && <span title="Cliente VIP" className="text-sm">⭐</span>}
                {profile?.isProblem && <span title="Atención requerida" className="text-sm">⚠️</span>}
                {r.isWalkIn && <span className="text-[9px] bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full px-1.5 py-0.5 font-bold">WALK-IN</span>}
                {r.hasPet && <span title="Con mascota">🐾</span>}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                <span className="font-mono text-base">{r.time}</span>
                <span>👥 {r.guests}</span>
                <span>{r.preference === 'Terraza exterior' ? '☀️ Terraza' : r.preference === 'Interior' ? '🏠 Interior' : r.preference === 'Mesas altas' ? '🪑 Mesas Altas' : '🔄'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {(r.assignedTables || r.tableNumber) && (
                <button 
                  onClick={() => {
                    setSelectorIntent('changing');
                    setShowTableSelector(true);
                  }}
                  className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg px-2.5 py-1.5 text-sm font-bold transition-all active:scale-95"
                  title="Cambiar mesa"
                >
                  {r.assignedTables && r.assignedTables.length > 1 ? 'Mesas ' : 'Mesa '}{r.assignedTables ? r.assignedTables.join(', ') : r.tableNumber}
                </button>
              )}
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${sc.color}`}>{sc.label}</span>
            </div>
          </div>

          {/* Seated time warning */}
          {r.status === 'seated' && r.seatedAt && (
            <div className={`flex items-center gap-2 text-xs rounded-xl px-3 py-2 ${isTimeCritical ? 'bg-red-500/10 text-red-400' : isTimeWarning ? 'bg-orange-500/10 text-orange-400' : ''}`}
              style={{ background: !isTimeCritical && !isTimeWarning ? 'var(--admin-bg-input)' : undefined, color: !isTimeCritical && !isTimeWarning ? undefined : undefined }}>
              <span>⏱</span>
              <span style={{ color: !isTimeCritical && !isTimeWarning ? 'var(--admin-text-muted)' : undefined }}>Sentados hace {formatDuration(seatedMinutes)}</span>
              {/* Progress bar */}
              <div className="flex-1 h-1.5 rounded-full overflow-hidden ml-2" style={{ background: 'var(--admin-bg-elevated)' }}>
                <div
                  className={`h-full rounded-full transition-all ${isTimeCritical ? 'bg-red-500' : isTimeWarning ? 'bg-orange-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, (seatedMinutes / 150) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          {(r.notes || (profile && profile.allNotes.length > 0) || profile?.favoritePreference) && (
            <div className="rounded-xl px-3 py-2 text-sm space-y-1" style={{ background: 'var(--admin-bg-input)', color: 'var(--admin-text-secondary)' }}>
              {r.notes && <div>📝 {r.notes}</div>}
              {profile?.favoritePreference && <div className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>💡 Prefiere: {profile.favoritePreference}</div>}
              {profile && profile.allNotes.length > 0 && (
                <div className="text-[10px] pt-1 border-t mt-1" style={{ color: 'var(--admin-text-muted)', borderColor: 'var(--admin-border)' }}>
                  <strong>Historial CRM:</strong> {profile.allNotes.slice(0, 2).join(' | ')}
                  {profile.allNotes.length > 2 && ' ...'}
                </div>
              )}
            </div>
          )}

          {/* Table selector */}
          {showTableSelector && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                Mesa {seatingRecommendation ? '(auto-seleccionada, puedes cambiar)' : ''}
              </label>
              {seatingRecommendation && seatingRecommendation.combinedNote && (
                <div className="mb-2 p-2 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary/80">
                  <span className="font-bold">Sugerencia múltiple:</span> {seatingRecommendation.combinedNote}
                </div>
              )}
              <TableSelector 
                occupiedTables={occupiedTables.filter(t => !selectedChangeTables.includes(t))} 
                reservedTables={reservedTables.filter(t => !selectedChangeTables.includes(t))}
                selectedTables={selectedChangeTables} 
                onSelect={(t) => setSelectedChangeTables(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} 
                onClose={() => setShowTableSelector(false)} 
              />
              <button 
                onClick={() => {
                  if (selectedChangeTables.length > 0) {
                    const nextStatus = selectorIntent === 'seating' ? 'seated' : r.status;
                    handleStatus(r.id, nextStatus as ReservationStatus, selectedChangeTables[0], selectedChangeTables);
                  }
                  setShowTableSelector(false);
                }}
                disabled={selectedChangeTables.length === 0}
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                {selectorIntent === 'seating' ? '✓ Confirmar y sentar' : '✓ Aplicar cambios'}
              </button>
            </div>
          )}

          {/* Actions - larger touch targets */}
          <div className="flex flex-wrap gap-2">
            {r.status === 'pending' && (
              <button onClick={() => handleStatus(r.id, 'confirmed')}
                className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl py-3 text-sm font-medium transition-all active:scale-95">
                ✓ Confirmar
              </button>
            )}
            {(r.status === 'pending' || r.status === 'confirmed') && !showTableSelector && (
              <button onClick={() => {
                setSelectorIntent('seating');
                setShowTableSelector(true);
              }}
                className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl py-3 text-sm font-medium transition-all active:scale-95">
                🪑 Sentar en mesa
              </button>
            )}
            {r.status === 'seated' && (
              <button onClick={() => handleStatus(r.id, 'completed')}
                className="flex-1 bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/20 rounded-xl py-3 text-sm font-medium transition-all active:scale-95"
                style={{ color: 'var(--admin-text)' }}>
                ✓ Servicio completado
              </button>
            )}
            {r.status !== 'completed' && r.status !== 'cancelled' && r.status !== 'no-show' && r.status !== 'seated' && (
              <button onClick={() => handleStatus(r.id, 'no-show')}
                className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-xl py-3 px-5 text-sm font-medium transition-all active:scale-95">
                No Show
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
