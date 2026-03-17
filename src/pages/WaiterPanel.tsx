import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReservationsForDate, updateReservation, addWalkIn, getOccupiedTables, type Reservation, type ReservationStatus } from '../services/reservationStore';
import TableSelector from '../components/TableSelector';
import FeedbackButton from '../components/FeedbackButton';

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
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInGuests, setWalkInGuests] = useState(2);
  const [walkInTable, setWalkInTable] = useState<number | null>(null);
  const [occupiedTables, setOccupiedTables] = useState<number[]>([]);
  const today = new Date().toISOString().split('T')[0];
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (sessionStorage.getItem('admin_role') !== 'waiter') navigate('/admin');
  }, [navigate]);

  const reload = useCallback(async () => {
    const data = await getReservationsForDate(today);
    const occTables = await getOccupiedTables(today);
    
    setReservations(data);
    setOccupiedTables(occTables);

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

  // Auto-reload every 30s
  useEffect(() => {
    const interval = setInterval(reload, 30000);
    return () => clearInterval(interval);
  }, [reload]);

  // Re-render every minute for time alerts
  const [, setTick] = useState(0);
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

  const handleStatus = async (id: string, status: ReservationStatus, tableNumber?: number) => {
    await updateReservation(id, { status, ...(tableNumber ? { tableNumber } : {}) });
    reload();
  };

  const handleWalkIn = async () => {
    if (walkInTable && walkInGuests > 0) {
      await addWalkIn(walkInGuests, walkInTable);
      setWalkInGuests(2);
      setWalkInTable(null);
      setShowWalkIn(false);
      reload();
    }
  };

  const addToWaitList = async (name: string, guests: number, phone?: string) => {
    await import('../services/reservationStore').then(s => s.addToWaitList(name, guests, phone));
    reload();
  };

  const removeFromWaitList = async (id: string) => {
    await updateReservation(id, { status: 'cancelled' });
    reload();
  };

  const handleSeatFromWaitlist = async (waitlistId: string, _guests: number, tableNumber: number) => {
    await updateReservation(waitlistId, { status: 'seated', tableNumber });
    reload();
  };

  const logout = () => { sessionStorage.removeItem('admin_role'); navigate('/admin'); };

  const now = new Date();
  const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const tabs: { key: Tab; label: string; count: number; color: string }[] = [
    { key: 'upcoming', label: 'Por llegar', count: grouped.upcoming.length, color: 'text-amber-400' },
    { key: 'seated', label: 'En mesa', count: grouped.seated.length, color: 'text-blue-400' },
    { key: 'waitlist', label: 'Espera', count: grouped.waitlist.length, color: 'text-purple-400' },
    { key: 'done', label: 'Finalizadas', count: grouped.done.length, color: 'text-slate-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 -960 960 960"><path d="M160-80q-33 0-56.5-23.5T80-160v-440q0-33 23.5-56.5T160-680h200v-120q0-33 23.5-56.5T440-880h80q33 0 56.5 23.5T600-800v120h200q33 0 56.5 23.5T880-600v440q0 33-23.5 56.5T800-80H160Zm280-600h80v-120h-80v120ZM160-160h640v-440H160v440Zm320-220Z"/></svg>
            </div>
            <div>
              <h1 className="text-sm font-bold">Camarero</h1>
              <p className="text-slate-500 text-[10px]">{today} · {currentTimeStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <FeedbackButton role="waiter" className="text-slate-500 hover:text-amber-400 text-xs flex items-center gap-1.5 transition-colors" />
            <button onClick={logout} className="text-slate-500 hover:text-red-400 text-xs transition-colors">Salir</button>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="grid grid-cols-4 gap-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`rounded-2xl py-3 px-1 text-center transition-all border ${tab === t.key ? 'bg-white/[0.06] border-white/10' : 'bg-white/[0.02] border-transparent hover:bg-white/[0.04]'}`}>
              <p className={`text-xl font-black ${t.color}`}>{t.count}</p>
              <p className="text-slate-500 text-[9px] font-medium uppercase tracking-wider mt-1">{t.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Reservation Cards */}
      <div className="max-w-3xl mx-auto px-4 pb-28 space-y-3">
        {tab === 'waitlist' ? (
          <WaitListView 
            waitList={grouped.waitlist} 
            addToWaitList={addToWaitList} 
            removeFromWaitList={removeFromWaitList}
            onSeat={handleSeatFromWaitlist}
            occupiedTables={occupiedTables}
          />
        ) : currentList.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm">No hay reservas en esta sección</p>
          </div>
        ) : (
          currentList.map(r => (
            <SwipeableCard key={r.id} reservation={r} handleStatus={handleStatus} occupiedTables={occupiedTables} />
          ))
        )}
      </div>

      {/* Walk-in Modal */}
      {showWalkIn && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end justify-center p-4 sm:items-center" onClick={() => setShowWalkIn(false)}>
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md space-y-5 animate-in max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between sticky top-0 bg-slate-900 py-1 z-10 font-bold">
              <h2 className="text-lg">+ Mesa Rápida</h2>
              <button onClick={() => setShowWalkIn(false)} className="text-slate-500 hover:text-white text-sm">✕</button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Comensales</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <button key={n} onClick={() => setWalkInGuests(n)}
                    className={`h-14 rounded-xl font-bold text-lg transition-all ${walkInGuests === n ? 'bg-primary text-white scale-105' : 'bg-white/5 border border-white/10 text-slate-400'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mesa</label>
              <TableSelector occupiedTables={occupiedTables} selectedTable={walkInTable} onSelect={t => setWalkInTable(t)} />
            </div>

            <button onClick={handleWalkIn} disabled={!walkInTable}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
              🪑 Sentar ahora
            </button>
          </div>
        </div>
      )}

      {/* FAB - Walk-in button */}
      <button onClick={() => setShowWalkIn(true)}
        className="fixed bottom-6 left-6 h-16 bg-emerald-500 hover:bg-emerald-400 rounded-2xl shadow-2xl shadow-emerald-500/30 flex items-center gap-3 px-5 transition-all active:scale-95 z-50">
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 -960 960 960"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>
        <span className="text-white font-bold text-sm">Mesa Rápida</span>
      </button>

      {/* Floating refresh */}
      <button onClick={reload}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-50">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 -960 960 960"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════
// WAIT LIST VIEW
// ═══════════════════════════════════════════════

function WaitListView({ waitList, addToWaitList, removeFromWaitList, onSeat, occupiedTables }: {
  waitList: Reservation[];
  addToWaitList: (name: string, guests: number, phone?: string) => void;
  removeFromWaitList: (id: string) => void;
  onSeat: (id: string, guests: number, table: number) => void;
  occupiedTables: number[];
}) {
  const [waitName, setWaitName] = useState('');
  const [waitPhone, setWaitPhone] = useState('');
  const [waitGuests, setWaitGuests] = useState(2);
  const [seatingId, setSeatingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={waitName} onChange={e => setWaitName(e.target.value)} placeholder="Nombre"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50" />
            <input type="tel" value={waitPhone} onChange={e => setWaitPhone(e.target.value)} placeholder="Teléfono"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50" />
          </div>
          
          <div className="flex gap-2">
            <select value={waitGuests} onChange={e => setWaitGuests(Number(e.target.value))}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:outline-none appearance-none cursor-pointer">
              {[1,2,3,4,5,6,7,8,9,10,12].map(n => <option key={n} value={n}>{n} personas</option>)}
            </select>
            <button onClick={() => { if (waitName) { addToWaitList(waitName, waitGuests, waitPhone); setWaitName(''); setWaitPhone(''); } }}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-3 text-sm font-bold transition-all shrink-0">
              + Añadir
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Clientes esperando</h3>
          
          {waitList.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <p className="text-sm italic">La lista está vacía</p>
            </div>
          ) : (
            <div className="space-y-3">
              {waitList.map((w, idx) => (
                <div key={w.id} className="bg-white/[0.04] border border-white/5 rounded-2xl px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="bg-primary/20 text-primary rounded-xl w-10 h-10 flex items-center justify-center font-black text-lg">{idx + 1}</span>
                    <div>
                      <p className="font-bold text-base">{w.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{w.phone !== 'Walk-in' && <span>📞 {w.phone} · </span>}👥 {w.guests} comensales · Esperando desde {new Date(w.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Seating Modal */}
      {seatingId && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-end justify-center p-4 sm:items-center" onClick={() => setSeatingId(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md space-y-5 animate-in max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between sticky top-0 bg-slate-900 py-1 z-10">
              <div>
                <h2 className="text-lg font-bold">Asignar Mesa</h2>
                <p className="text-slate-500 text-xs">Para {waitList.find(w => w.id === seatingId)?.name}</p>
              </div>
              <button onClick={() => setSeatingId(null)} className="text-slate-500 hover:text-white text-sm">✕</button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selecciona Mesa Disponible</label>
              <TableSelector 
                occupiedTables={occupiedTables} 
                onSelect={(table) => {
                  const item = waitList.find(w => w.id === seatingId);
                  if (item) onSeat(item.id, item.guests, table);
                  setSeatingId(null);
                }} 
              />
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

function SwipeableCard({ reservation: r, handleStatus, occupiedTables }: {
  reservation: Reservation;
  handleStatus: (id: string, status: ReservationStatus, tableNumber?: number) => void;
  occupiedTables: number[];
}) {
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [showTableSelector, setShowTableSelector] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);

  const sc = STATUS_BADGES[r.status];
  const seatedMinutes = getSeatedMinutes(r.seatedAt);
  const isTimeWarning = r.status === 'seated' && seatedMinutes > 120;
  const isTimeCritical = r.status === 'seated' && seatedMinutes > 150;

  const handleTouchStart = (e: React.TouchEvent) => {
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
        else if (r.status === 'confirmed') setShowTableSelector(true);
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
      <div className="absolute inset-0 flex">
        <div className={`flex-1 flex items-center justify-start pl-6 ${swipeX > 40 ? 'bg-emerald-500/20' : 'bg-transparent'} transition-colors rounded-l-2xl`}>
          {swipeX > 40 && <span className="text-emerald-400 font-bold text-sm">{r.status === 'pending' ? '✓ Confirmar' : '🪑 Sentar'}</span>}
        </div>
        <div className={`flex-1 flex items-center justify-end pr-6 ${swipeX < -40 && r.status !== 'seated' ? 'bg-orange-500/20' : 'bg-transparent'} transition-colors rounded-r-2xl`}>
          {swipeX < -40 && r.status !== 'seated' && <span className="text-orange-400 font-bold text-sm">👻 No Show</span>}
        </div>
      </div>

      {/* Card */}
      <div
        className={`relative border-l-4 ${STATUS_COLORS[r.status]} border border-white/5 rounded-2xl overflow-hidden transition-transform ${isTimeCritical ? 'ring-2 ring-red-500/50 animate-pulse' : isTimeWarning ? 'ring-2 ring-orange-500/40' : ''}`}
        style={{ transform: `translateX(${swipeX}px)`, transition: swiping ? 'none' : 'transform 0.3s ease' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="px-5 py-4 space-y-3 bg-slate-950">
          {/* Top info */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">{r.name}</span>
                {r.isWalkIn && <span className="text-[9px] bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full px-1.5 py-0.5 font-bold">WALK-IN</span>}
                {r.hasPet && <span title="Con mascota">🐾</span>}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                <span className="font-mono text-base">{r.time}</span>
                <span>👥 {r.guests}</span>
                <span>{r.preference === 'Terraza exterior' ? '☀️ Terraza' : r.preference === 'Interior' ? '🏠 Interior' : '🔄'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {r.tableNumber && (
                <span className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-2.5 py-1.5 text-sm font-bold">
                  Mesa {r.tableNumber}
                </span>
              )}
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${sc.color}`}>{sc.label}</span>
            </div>
          </div>

          {/* Seated time warning */}
          {r.status === 'seated' && r.seatedAt && (
            <div className={`flex items-center gap-2 text-xs rounded-xl px-3 py-2 ${isTimeCritical ? 'bg-red-500/10 text-red-400' : isTimeWarning ? 'bg-orange-500/10 text-orange-400' : 'bg-white/5 text-slate-400'}`}>
              <span>⏱</span>
              <span>Sentados hace {formatDuration(seatedMinutes)}</span>
              {/* Progress bar */}
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden ml-2">
                <div
                  className={`h-full rounded-full transition-all ${isTimeCritical ? 'bg-red-500' : isTimeWarning ? 'bg-orange-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, (seatedMinutes / 150) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          {r.notes && (
            <div className="bg-white/5 rounded-xl px-3 py-2 text-sm text-amber-300/80">
              📝 {r.notes}
            </div>
          )}

          {/* Table selector */}
          {showTableSelector && (
            <div>
              <TableSelector occupiedTables={occupiedTables} selectedTable={r.tableNumber} onSelect={(t) => { handleStatus(r.id, 'seated', t); setShowTableSelector(false); }} onClose={() => setShowTableSelector(false)} />
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
              <button onClick={() => setShowTableSelector(true)}
                className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl py-3 text-sm font-medium transition-all active:scale-95">
                🪑 Sentar en mesa
              </button>
            )}
            {r.status === 'seated' && (
              <button onClick={() => handleStatus(r.id, 'completed')}
                className="flex-1 bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 border border-slate-500/20 rounded-xl py-3 text-sm font-medium transition-all active:scale-95">
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
