import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getReservations, updateReservation, deleteReservation, getStats,
  getOccupancyByHour, getStatusDistribution, getWeeklyComparison, getNoShowRate,
  getClientProfiles, addWalkIn, getOccupiedTables, generateCSV,
  type Reservation, type ReservationStatus, type ClientProfile, type ReservationStats
} from '../services/reservationStore';
import TableSelector from '../components/TableSelector';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ── Status config ──
const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  'pending':   { label: 'Pendiente',  color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/20' },
  'confirmed': { label: 'Confirmada', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  'seated':    { label: 'Sentados',   color: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/20' },
  'completed': { label: 'Completada', color: 'text-slate-400',   bg: 'bg-slate-400/10 border-slate-400/20' },
  'cancelled': { label: 'Cancelada',  color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/20' },
  'no-show':   { label: 'No Show',    color: 'text-orange-400',  bg: 'bg-orange-400/10 border-orange-400/20' },
};

type AdminTab = 'kanban' | 'dashboard' | 'crm' | 'walkins';

const KANBAN_COLUMNS: { status: ReservationStatus; label: string; icon: string; color: string }[] = [
  { status: 'pending', label: 'Pendientes', icon: '⏳', color: 'border-t-amber-400' },
  { status: 'confirmed', label: 'Confirmadas', icon: '✅', color: 'border-t-emerald-400' },
  { status: 'seated', label: 'Sentados', icon: '🪑', color: 'border-t-blue-400' },
  { status: 'completed', label: 'Completadas', icon: '✓', color: 'border-t-slate-500' },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('kanban');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [showTableSelector, setShowTableSelector] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  // Stats and data states
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [occupancyData, setOccupancyData] = useState<{ hour: string; guests: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [weeklyComp, setWeeklyComp] = useState<{ thisWeek: number; lastWeek: number; change: number }>({ thisWeek: 0, lastWeek: 0, change: 0 });
  const [noShowRate, setNoShowRate] = useState(0);
  const [clientProfiles, setClientProfiles] = useState<ClientProfile[]>([]);
  const [occupiedTables, setOccupiedTables] = useState<number[]>([]);

  // Walk-in state
  const [walkInGuests, setWalkInGuests] = useState(2);
  const [walkInName, setWalkInName] = useState('');
  const [walkInTable, setWalkInTable] = useState<number | null>(null);
  const [showWalkInForm, setShowWalkInForm] = useState(false);

  // CRM state
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [crmSearch, setCrmSearch] = useState('');

  // Wait list
  const [waitList, setWaitList] = useState<{ id: string; name: string; guests: number; addedAt: string }[]>([]);

  useEffect(() => {
    if (sessionStorage.getItem('admin_role') !== 'owner') navigate('/admin');
  }, [navigate]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const [resData, statsData, occData, distData, weeklyData, nsRate, profiles, occTables] = await Promise.all([
      getReservations(),
      getStats(filterDate),
      getOccupancyByHour(filterDate === 'all' ? new Date().toISOString().split('T')[0] : filterDate),
      getStatusDistribution(filterDate === 'all' ? new Date().toISOString().split('T')[0] : filterDate),
      getWeeklyComparison(),
      getNoShowRate(),
      getClientProfiles(),
      getOccupiedTables(filterDate === 'all' ? new Date().toISOString().split('T')[0] : filterDate)
    ]);

    setReservations(resData);
    setStats(statsData);
    setOccupancyData(occData);
    setStatusData(distData);
    setWeeklyComp(weeklyData);
    setNoShowRate(nsRate);
    setClientProfiles(profiles);
    setOccupiedTables(occTables);
    setLoading(false);
  }, [filterDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const reload = useCallback(() => fetchDashboardData(), [fetchDashboardData]);

  const filtered = useMemo(() => {
    return reservations
      .filter(r => filterDate === 'all' || r.date === filterDate)
      .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase()) || r.phone.includes(search))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [reservations, filterDate, search]);

  const handleStatus = async (id: string, status: ReservationStatus) => {
    await updateReservation(id, { status });
    reload();
  };

  const handleDelete = async (id: string) => {
    await deleteReservation(id);
    reload();
  };

  const handleAssignTable = async (id: string, tableNumber: number) => {
    await updateReservation(id, { tableNumber });
    setShowTableSelector(null);
    reload();
  };

  const handleWalkIn = async () => {
    if (walkInTable && walkInGuests > 0) {
      await addWalkIn(walkInGuests, walkInTable, walkInName || undefined);
      setWalkInGuests(2);
      setWalkInName('');
      setWalkInTable(null);
      setShowWalkInForm(false);
      reload();
    }
  };

  const addToWaitList = (name: string, guests: number) => {
    setWaitList(prev => [...prev, { id: Date.now().toString(), name, guests, addedAt: new Date().toISOString() }]);
  };

  const removeFromWaitList = (id: string) => {
    setWaitList(prev => prev.filter(w => w.id !== id));
  };

  const exportCSV = async () => {
    const csv = await generateCSV(filterDate);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservas_${filterDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const dayReservations = filtered.filter(r => r.status !== 'cancelled');
    printWindow.document.write(`
      <html><head><title>Reservas El Atlante - ${filterDate}</title>
      <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1e293b; }
        h1 { font-size: 24px; border-bottom: 2px solid #1e293b; padding-bottom: 8px; }
        h2 { font-size: 14px; color: #64748b; margin-top: -8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #475569; border-bottom: 2px solid #e2e8f0; }
        td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        tr:nth-child(even) { background: #f8fafc; }
        .status { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
        .pending { background: #fef3c7; color: #92400e; }
        .confirmed { background: #d1fae5; color: #065f46; }
        .seated { background: #dbeafe; color: #1e40af; }
        .completed { background: #e2e8f0; color: #475569; }
        .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
      </style></head><body>
      <h1>🍽 Reservas El Atlante</h1>
      <h2>${filterDate} · ${dayReservations.length} reservas · ${dayReservations.reduce((s, r) => s + r.guests, 0)} comensales</h2>
      <table>
        <tr><th>Hora</th><th>Nombre</th><th>Comensales</th><th>Mesa</th><th>Preferencia</th><th>Estado</th><th>Notas</th></tr>
        ${dayReservations.map(r => `<tr>
          <td><strong>${r.time}</strong></td>
          <td>${r.name}${r.hasPet ? ' 🐾' : ''}</td>
          <td>${r.guests}</td>
          <td>${r.tableNumber || '—'}</td>
          <td>${r.preference}</td>
          <td><span class="status ${r.status}">${STATUS_CONFIG[r.status].label}</span></td>
          <td>${r.notes || '—'}</td>
        </tr>`).join('')}
      </table>
      <div class="footer">Generado automáticamente · El Atlante Panel de Administración</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // ── Drag & Drop handlers ──
  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragEnd = () => setDraggedId(null);
  const handleDrop = (targetStatus: ReservationStatus) => {
    if (draggedId) {
      handleStatus(draggedId, targetStatus);
      setDraggedId(null);
    }
  };

  const logout = () => { sessionStorage.removeItem('admin_role'); navigate('/admin'); };

  const tabs: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'kanban', label: 'Reservas', icon: '📋' },
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'crm', label: 'Clientes', icon: '👥' },
    { key: 'walkins', label: 'Walk-ins', icon: '🚶' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 -960 960 960"><path d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-350Z"/></svg>
            </div>
            <div>
              <h1 className="text-sm font-bold">Panel Dueño</h1>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest">El Atlante</p>
            </div>
          </div>
          
          {/* Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-xl p-1">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === t.key ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
                <span className="mr-1.5">{t.icon}</span>{t.label}
              </button>
            ))}
          </nav>

          <button onClick={logout} className="text-slate-400 hover:text-red-400 text-sm flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg>
            Salir
          </button>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex border-t border-white/5">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-3 text-center text-xs font-medium transition-all ${activeTab === t.key ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}>
              <span className="block text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* KPI Cards - always visible */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Hoy', value: stats?.totalToday || 0, accent: 'text-white' },
            { label: 'Confirmadas', value: stats?.confirmed || 0, accent: 'text-emerald-400' },
            { label: 'Pendientes', value: stats?.pending || 0, accent: 'text-amber-400' },
            { label: 'Invitados', value: stats?.totalGuestsToday || 0, accent: 'text-blue-400' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-2">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{kpi.label}</p>
              <p className={`text-3xl font-black ${kpi.accent}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center mb-8">
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
          <input type="text" placeholder="Buscar nombre, email, teléfono…" value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50" />
          <button onClick={() => setFilterDate('all' as string)} className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">Ver todo</button>
          <div className="ml-auto flex gap-2">
            <button onClick={exportPDF} className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2">
              📄 PDF
            </button>
            <button onClick={exportCSV} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2">
              📊 CSV
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'kanban' && <KanbanView filtered={filtered} handleStatus={handleStatus} handleDelete={handleDelete} handleAssignTable={handleAssignTable} showTableSelector={showTableSelector} setShowTableSelector={setShowTableSelector} occupiedTables={occupiedTables} draggedId={draggedId} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDrop={handleDrop} />}
        {activeTab === 'dashboard' && <DashboardView reservations={reservations} occupancyData={occupancyData} statusData={statusData} weeklyComp={weeklyComp} noShowRate={noShowRate} />}
        {activeTab === 'crm' && <CRMView search={crmSearch} setSearch={setCrmSearch} selectedClient={selectedClient} setSelectedClient={setSelectedClient} clientProfiles={clientProfiles} />}
        {activeTab === 'walkins' && <WalkInsView showForm={showWalkInForm} setShowForm={setShowWalkInForm} guests={walkInGuests} setGuests={setWalkInGuests} name={walkInName} setName={setWalkInName} table={walkInTable} setTable={setWalkInTable} occupiedTables={occupiedTables} onSubmit={handleWalkIn} waitList={waitList} addToWaitList={addToWaitList} removeFromWaitList={removeFromWaitList} />}

        {loading && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Actualizando datos...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// KANBAN VIEW
// ═══════════════════════════════════════════════

function KanbanView({ filtered, handleStatus, handleDelete, handleAssignTable, showTableSelector, setShowTableSelector, occupiedTables, draggedId, onDragStart, onDragEnd, onDrop }: {
  filtered: Reservation[];
  handleStatus: (id: string, s: ReservationStatus) => void;
  handleDelete: (id: string) => void;
  handleAssignTable: (id: string, t: number) => void;
  showTableSelector: string | null;
  setShowTableSelector: (id: string | null) => void;
  occupiedTables: number[];
  draggedId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (status: ReservationStatus) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {KANBAN_COLUMNS.map(col => {
        const cards = filtered.filter(r => r.status === col.status);
        return (
          <div key={col.status}
            className={`bg-white/[0.02] rounded-2xl border border-white/5 border-t-4 ${col.color} min-h-[300px] transition-colors ${draggedId ? 'ring-1 ring-white/10' : ''}`}
            onDragOver={e => e.preventDefault()}
            onDrop={() => onDrop(col.status)}
          >
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <span>{col.icon}</span>
                <span className="text-sm font-semibold">{col.label}</span>
              </div>
              <span className="bg-white/10 rounded-full px-2.5 py-0.5 text-xs font-bold">{cards.length}</span>
            </div>
            <div className="p-3 space-y-2">
              {cards.map(r => (
                <KanbanCard key={r.id} reservation={r} handleStatus={handleStatus} handleDelete={handleDelete} handleAssignTable={handleAssignTable} showTableSelector={showTableSelector} setShowTableSelector={setShowTableSelector} occupiedTables={occupiedTables} onDragStart={onDragStart} onDragEnd={onDragEnd} />
              ))}
              {cards.length === 0 && (
                <div className="text-center py-8 text-slate-600 text-xs">
                  Arrastra aquí una reserva
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ reservation: r, handleStatus, handleDelete, handleAssignTable, showTableSelector, setShowTableSelector, occupiedTables, onDragStart, onDragEnd }: {
  reservation: Reservation;
  handleStatus: (id: string, s: ReservationStatus) => void;
  handleDelete: (id: string) => void;
  handleAssignTable: (id: string, t: number) => void;
  showTableSelector: string | null;
  setShowTableSelector: (id: string | null) => void;
  occupiedTables: number[];
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(r.id)}
      onDragEnd={onDragEnd}
      className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 group"
    >
      <button onClick={() => setExpanded(!expanded)} className="w-full px-4 py-3 text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{r.name}</span>
            {r.isWalkIn && <span className="text-[9px] bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full px-1.5 py-0.5 font-bold">WALK-IN</span>}
            {r.hasPet && <span className="text-xs">🐾</span>}
          </div>
          <svg className={`w-4 h-4 text-slate-600 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 -960 960 960"><path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"/></svg>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          <span className="font-mono">{r.time}</span>
          <span>👥 {r.guests}</span>
          <span>{r.preference === 'Terraza exterior' ? '☀️' : r.preference === 'Interior' ? '🏠' : '🔄'}</span>
          {r.tableNumber && <span className="text-primary font-bold">M{r.tableNumber}</span>}
        </div>
        {r.notes && <p className="text-[11px] text-amber-300/70 mt-1.5 truncate">📝 {r.notes}</p>}
      </button>

      {expanded && (
        <div className="px-4 pb-3 border-t border-white/5 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span className="text-slate-500">📧 </span>{r.email || '—'}</div>
            <div><span className="text-slate-500">📞 </span>{r.phone || '—'}</div>
            <div><span className="text-slate-500">📅 </span>{r.date}</div>
            <div><span className="text-slate-500">🕐 </span>{new Date(r.createdAt).toLocaleString('es-ES')}</div>
          </div>

          {/* Table selector */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowTableSelector(showTableSelector === r.id ? null : r.id); }}
            className="text-xs text-primary hover:underline">
            {r.tableNumber ? `Mesa ${r.tableNumber} (cambiar)` : '🪑 Asignar mesa'}
          </button>

          {showTableSelector === r.id && (
            <TableSelector occupiedTables={occupiedTables} selectedTable={r.tableNumber} onSelect={(t) => handleAssignTable(r.id, t)} onClose={() => setShowTableSelector(null)} />
          )}

          {/* Quick actions */}
          <div className="flex flex-wrap gap-1.5">
            {r.status === 'pending' && (
              <button onClick={() => handleStatus(r.id, 'confirmed')} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-all">✓ Confirmar</button>
            )}
            {(r.status === 'confirmed' || r.status === 'pending') && (
              <button onClick={() => handleStatus(r.id, 'seated')} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-all">🪑 Sentar</button>
            )}
            {r.status === 'seated' && (
              <button onClick={() => handleStatus(r.id, 'completed')} className="bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 border border-slate-500/20 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-all">✓ Completar</button>
            )}
            {r.status !== 'cancelled' && r.status !== 'completed' && (
              <>
                <button onClick={() => handleStatus(r.id, 'cancelled')} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-all">✕ Cancelar</button>
                <button onClick={() => handleStatus(r.id, 'no-show')} className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-all">👻 No Show</button>
              </>
            )}
            <button onClick={() => { if (confirm('¿Eliminar esta reserva permanentemente?')) handleDelete(r.id); }}
              className="ml-auto text-red-400/40 hover:text-red-400 text-[10px] transition-colors">🗑</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// DASHBOARD VIEW
// ═══════════════════════════════════════════════

function DashboardView({ reservations, occupancyData, statusData, weeklyComp, noShowRate }: { 
  reservations: Reservation[];
  occupancyData: { hour: string; guests: number }[];
  statusData: { name: string; value: number; color: string }[];
  weeklyComp: { thisWeek: number; lastWeek: number; change: number };
  noShowRate: number;
}) {

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
          <p className="text-slate-500 text-xs uppercase tracking-wider">No Show Rate</p>
          <p className={`text-3xl font-black ${noShowRate > 15 ? 'text-red-400' : 'text-emerald-400'}`}>{noShowRate}%</p>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Esta semana</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-white">{weeklyComp.thisWeek}</p>
            <span className={`text-sm font-bold mb-1 ${weeklyComp.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {weeklyComp.change >= 0 ? '↑' : '↓'}{Math.abs(weeklyComp.change)}%
            </span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Semana pasada</p>
          <p className="text-3xl font-black text-slate-400">{weeklyComp.lastWeek}</p>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Media comensales</p>
          <p className="text-3xl font-black text-blue-400">
            {reservations.filter(r => r.status !== 'cancelled' && r.status !== 'no-show').length 
              ? (reservations.filter(r => r.status !== 'cancelled' && r.status !== 'no-show').reduce((s, r) => s + r.guests, 0) / 
                 reservations.filter(r => r.status !== 'cancelled' && r.status !== 'no-show').length).toFixed(1) 
              : '0'}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy by hour */}
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-4">Ocupación por hora</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={occupancyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Bar dataKey="guests" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Comensales" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-4">Estado de reservas</h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {statusData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }}></span>
                      <span className="text-slate-400">{d.name}</span>
                    </div>
                    <span className="font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-600 text-xs">Sin datos para esta fecha</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// CRM VIEW
// ═══════════════════════════════════════════════

function CRMView({ search, setSearch, selectedClient, setSelectedClient, clientProfiles }: {
  search: string;
  setSearch: (s: string) => void;
  selectedClient: ClientProfile | null;
  setSelectedClient: (c: ClientProfile | null) => void;
  clientProfiles: ClientProfile[];
}) {
  const filteredClients = useMemo(() => {
    if (!search) return clientProfiles;
    const q = search.toLowerCase();
    return clientProfiles.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q));
  }, [clientProfiles, search]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Client List */}
      <div className="lg:col-span-1 space-y-4">
        <input type="text" placeholder="Buscar cliente…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50" />
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {filteredClients.map(c => (
            <button key={c.phone || c.name} onClick={() => setSelectedClient(c)}
              className={`w-full text-left bg-white/[0.03] hover:bg-white/[0.06] border rounded-xl px-4 py-3 transition-all ${selectedClient?.phone === c.phone ? 'border-primary/30 bg-primary/5' : 'border-white/5'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{c.name}</span>
                  {c.isVIP && <span className="bg-amber-500/20 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-500/30">⭐ VIP</span>}
                  {c.isProblem && <span className="bg-red-500/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-red-500/30">⚠️</span>}
                </div>
                <span className="text-xs text-slate-500">{c.visitCount} visitas</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{c.phone} · Última: {c.lastVisit}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Client Detail */}
      <div className="lg:col-span-2">
        {selectedClient ? (
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{selectedClient.name}</h2>
                  {selectedClient.isVIP && <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-1 rounded-full border border-amber-500/30">⭐ VIP</span>}
                  {selectedClient.isProblem && <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-full border border-red-500/30">⚠️ Problemático</span>}
                </div>
                <p className="text-slate-500 text-sm mt-1">{selectedClient.email} · {selectedClient.phone}</p>
              </div>
              <button onClick={() => setSelectedClient(null)} className="text-slate-500 hover:text-white text-xs">✕</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-primary">{selectedClient.visitCount}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Visitas</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-red-400">{selectedClient.noShowCount}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">No Shows</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-amber-400">{selectedClient.favoriteTable || '—'}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Mesa favorita</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-lg font-bold text-emerald-400">{selectedClient.favoritePreference || '—'}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Preferencia</p>
              </div>
            </div>

            {selectedClient.allNotes.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Historial de notas</h3>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {selectedClient.allNotes.map((note, i) => (
                    <div key={i} className="bg-white/5 rounded-lg px-3 py-2 text-xs text-amber-300/80">📝 {note}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-600 text-sm">
            Selecciona un cliente para ver su perfil
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// WALK-INS VIEW
// ═══════════════════════════════════════════════

function WalkInsView({ showForm, setShowForm, guests, setGuests, name, setName, table, setTable, occupiedTables, onSubmit, waitList, addToWaitList, removeFromWaitList }: {
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  guests: number;
  setGuests: (n: number) => void;
  name: string;
  setName: (s: string) => void;
  table: number | null;
  setTable: (n: number | null) => void;
  occupiedTables: number[];
  onSubmit: () => void;
  waitList: { id: string; name: string; guests: number; addedAt: string }[];
  addToWaitList: (name: string, guests: number) => void;
  removeFromWaitList: (id: string) => void;
}) {
  const [waitName, setWaitName] = useState('');
  const [waitGuests, setWaitGuests] = useState(2);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Walk-in Form */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Walk-in Rápido</h2>
          <button onClick={() => setShowForm(!showForm)} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-5 py-2.5 text-sm font-bold transition-all shadow-lg shadow-primary/20">
            {showForm ? 'Cancelar' : '+ Nueva Mesa'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nombre (opcional)</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Walk-in"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Comensales</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <button key={n} onClick={() => setGuests(n)}
                    className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${guests === n ? 'bg-primary text-white' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mesa</label>
              <TableSelector occupiedTables={occupiedTables} selectedTable={table} onSelect={t => setTable(t)} />
            </div>
            <button onClick={onSubmit} disabled={!table}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20">
              🪑 Sentar ahora
            </button>
          </div>
        )}
      </div>

      {/* Wait List */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold">Lista de Espera</h2>
        
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex gap-2">
            <input type="text" value={waitName} onChange={e => setWaitName(e.target.value)} placeholder="Nombre"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50" />
            <select value={waitGuests} onChange={e => setWaitGuests(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none appearance-none cursor-pointer">
              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}p</option>)}
            </select>
            <button onClick={() => { if (waitName) { addToWaitList(waitName, waitGuests); setWaitName(''); } }}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl px-4 py-2.5 text-sm font-medium transition-all">
              + Añadir
            </button>
          </div>

          {waitList.length === 0 ? (
            <div className="text-center py-8 text-slate-600 text-xs">No hay nadie esperando 🎉</div>
          ) : (
            <div className="space-y-2">
              {waitList.map((w, idx) => (
                <div key={w.id} className="bg-white/[0.04] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="bg-amber-500/20 text-amber-400 rounded-lg w-8 h-8 flex items-center justify-center font-bold text-sm">{idx + 1}</span>
                    <div>
                      <p className="font-semibold text-sm">{w.name}</p>
                      <p className="text-xs text-slate-500">👥 {w.guests} · {new Date(w.addedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => removeFromWaitList(w.id)} className="text-slate-500 hover:text-red-400 text-xs transition-colors">Quitar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
