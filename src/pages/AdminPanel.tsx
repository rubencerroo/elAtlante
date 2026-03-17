import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getReservations, addReservation, updateReservation, getStats, deleteReservation,
  getOccupancyByHour, getStatusDistribution, getWeeklyComparison, getNoShowRate,
  getClientProfiles, getClientMeta, saveClientMeta, generateCSV, getOccupiedTables,
  type Reservation, type ReservationStatus, type ReservationStats, type ClientProfile, type ClientMeta
} from '../services/reservationStore';
import { signOut, getStaffRole, getSession, getStaffProfiles, inviteStaff, deleteStaff, type StaffProfile, type StaffRole } from '../services/authStore';
import StatsCards from './admin/StatsCards';
import StatusKanban from './admin/StatusKanban';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import FeedbackButton from '../components/FeedbackButton';
import logoWhite from '../assets/logowhite.png';

// ── Status config ──
const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  'pending':   { label: 'Pendiente',  color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/20' },
  'confirmed': { label: 'Confirmada', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  'seated':    { label: 'Sentados',   color: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/20' },
  'completed': { label: 'Completada', color: 'text-slate-400',   bg: 'bg-slate-400/10 border-slate-400/20' },
  'cancelled': { label: 'Cancelada',  color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/20' },
  'no-show':   { label: 'No Show',    color: 'text-orange-400',  bg: 'bg-orange-400/10 border-orange-400/20' },
  'waiting':   { label: 'En Espera', color: 'text-purple-400',  bg: 'bg-purple-400/10 border-purple-400/20' },
};

type AdminTab = 'kanban' | 'dashboard' | 'crm' | 'staff';



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

  // CRM state
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [crmSearch, setCrmSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    (async () => {
      try {
        const session = await getSession();
        if (!session) { navigate('/admin', { replace: true }); return; }
        const role = await getStaffRole();
        if (role !== 'owner') { navigate('/admin', { replace: true }); return; }
        setAuthChecked(true);
      } catch {
        navigate('/admin', { replace: true });
      }
    })();
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
        .header-logo { height: 60px; margin-bottom: 20px; }
      </style></head><body>
      <img src="${window.location.origin}/logoblack.png" alt="Logo" class="header-logo" />
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


  const logout = async () => { await signOut(); navigate('/admin'); };

  const tabs: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'kanban', label: 'Reservas', icon: '📋' },
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'crm', label: 'Clientes', icon: '👥' },
    { key: 'staff', label: 'Equipo', icon: '🔑' },
  ];

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 transition-transform hover:scale-105">
              <img src={logoWhite} alt="El Atlante" className="h-full w-auto object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-bold">Panel Dueño</h1>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest leading-none">Restaurante</p>
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

          <div className="flex items-center gap-6">
            <FeedbackButton role="admin" />
            <button onClick={logout} className="text-slate-400 hover:text-red-400 text-sm flex items-center gap-2 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg>
              Salir
            </button>
          </div>
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
        {stats && <StatsCards stats={stats} />}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center mb-8">
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />
          <input type="text" placeholder="Buscar nombre, email, teléfono…" value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50" />
          <button onClick={() => setFilterDate('all' as string)} className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">Ver todo</button>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
              ➕ Nueva Reserva
            </button>
            <button onClick={exportPDF} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2">
              📄 PDF
            </button>
            <button onClick={exportCSV} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2">
              📊 CSV
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'kanban' && <StatusKanban filtered={filtered} handleStatus={handleStatus} handleDelete={handleDelete} handleAssignTable={handleAssignTable} showTableSelector={showTableSelector} setShowTableSelector={setShowTableSelector} occupiedTables={occupiedTables} draggedId={draggedId} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDrop={handleDrop} />}
        {activeTab === 'dashboard' && <DashboardView reservations={reservations} occupancyData={occupancyData} statusData={statusData} weeklyComp={weeklyComp} noShowRate={noShowRate} />}
        {activeTab === 'crm' && <CRMView search={crmSearch} setSearch={setCrmSearch} selectedClient={selectedClient} setSelectedClient={setSelectedClient} clientProfiles={clientProfiles} />}
        {activeTab === 'staff' && <StaffView />}

        {loading && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Actualizando datos...</p>
            </div>
          </div>
        )}

        {showAddModal && <ManualReservationModal onClose={() => setShowAddModal(false)} onSave={() => { setShowAddModal(false); reload(); }} />}
      </div>
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
  const [meta, setMeta] = useState<ClientMeta | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);

  useEffect(() => {
    if (selectedClient?.email) {
      setLoadingMeta(true);
      getClientMeta(selectedClient.email).then(m => {
        setMeta(m || { email: selectedClient.email, phone: selectedClient.phone });
        setLoadingMeta(false);
      });
    } else {
      setMeta(null);
    }
  }, [selectedClient]);

  const handleSaveMeta = async () => {
    if (meta) {
      setSavingMeta(true);
      await saveClientMeta(meta);
      setSavingMeta(false);
    }
  };

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
            <button key={c.email || c.phone || c.name} onClick={() => setSelectedClient(c)}
              className={`w-full text-left bg-white/[0.03] hover:bg-white/[0.06] border rounded-xl px-4 py-3 transition-all ${selectedClient?.email === c.email && c.email ? 'border-primary/30 bg-primary/5' : 'border-white/5'}`}>
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

            {/* Client Meta (Allergies/Notes) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Alergias / Intolerancias</label>
                <textarea 
                  value={meta?.allergies || ''} 
                  onChange={e => setMeta(prev => prev ? { ...prev, allergies: e.target.value } : null)}
                  placeholder="Ej: Gluten, marisco..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 h-20 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Notas de Preferencia</label>
                <textarea 
                  value={meta?.customNotes || ''} 
                  onChange={e => setMeta(prev => prev ? { ...prev, customNotes: e.target.value } : null)}
                  placeholder="Ej: Mesa cerca de ventana, vino preferido..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 h-20 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleSaveMeta}
                disabled={savingMeta || loadingMeta}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
              >
                {savingMeta ? 'Guardando...' : 'Actualizar Perfil CRM'}
              </button>
            </div>

            {selectedClient.allNotes.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Historial de reservas</h3>
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-2">
                  {selectedClient.allNotes.map((note, i) => (
                    <div key={i} className="bg-white/5 rounded-lg px-3 py-2 text-xs text-amber-300/80">📅 {note}</div>
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
// MANUAL RESERVATION MODAL
// ═══════════════════════════════════════════════

function ManualReservationModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    time: '20:00',
    guests: 2,
    preference: 'Indiferente' as any,
    hasPet: false,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addReservation({
        ...formData,
        status: 'confirmed'
      });
      onSave();
    } catch (err: any) {
      alert(err.message === 'DUPLICATE_RESERVATION' 
        ? 'Ya existe una reserva para ese cliente en esa fecha/hora.' 
        : 'Error al crear la reserva.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h2 className="font-bold">Nueva Reserva Manual</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nombre</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Teléfono (opcional)</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fecha</label>
              <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hora</label>
              <input required type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Comensales</label>
              <input required type="number" min="1" value={formData.guests} onChange={e => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Preferencia</label>
              <select value={formData.preference} onChange={e => setFormData({ ...formData, preference: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50 appearance-none">
                <option value="Indiferente">Indiferente</option>
                <option value="Interior">Interior</option>
                <option value="Mesas altas">Mesas altas</option>
                <option value="Terraza exterior">Terraza exterior</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={formData.hasPet} onChange={e => setFormData({ ...formData, hasPet: e.target.checked })} className="sr-only peer" />
                <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <span className="text-xs font-semibold text-slate-400">¿Trae mascota? 🐾</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Notas internas</label>
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ej: Cliente VIP, aniversario..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50 h-20 resize-none" />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-sm font-bold hover:bg-white/5 transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// STAFF VIEW
// ═══════════════════════════════════════════════

function StaffView() {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffRole>('waiter');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadStaff = useCallback(async () => {
    setLoadingStaff(true);
    try {
      const profiles = await getStaffProfiles();
      setStaff(profiles);
    } catch (e) {
      console.error('Error loading staff:', e);
    }
    setLoadingStaff(false);
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteResult(null);
    try {
      const result = await inviteStaff(inviteEmail, inviteRole, invitePassword);
      setInviteResult({
        type: 'success',
        message: result.message,
      });
      setInviteEmail('');
      setInvitePassword('');
      loadStaff();
    } catch (err: any) {
      setInviteResult({ type: 'error', message: err.message });
    }
    setInviting(false);
  };

  const handleDelete = async (id: string, email: string) => {
    if (email === 'dev@elatlantedesancristobal.com') {
      alert('Esta cuenta de desarrollador no puede ser eliminada desde el panel.');
      return;
    }
    if (!confirm(`¿Eliminar a ${email} del equipo?`)) return;
    try {
      await deleteStaff(id);
      loadStaff();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Invite Form */}
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">➕ Invitar nuevo miembro</h3>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rol</label>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as StaffRole)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 appearance-none min-w-[140px]"
            >
              <option value="waiter">🍽 Camarero</option>
              <option value="owner">⭐ Dueño</option>
            </select>
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contraseña inicial</label>
            <input
              type="text"
              required
              minLength={6}
              value={invitePassword}
              onChange={e => setInvitePassword(e.target.value)}
              placeholder="Min. 6 caracteres"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={inviting || !inviteEmail || invitePassword.length < 6}
              className="bg-primary hover:bg-primary/90 disabled:opacity-30 text-white rounded-xl px-6 py-2.5 text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {inviting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Creando...</>
              ) : 'Crear Usuario'}
            </button>
          </div>
        </form>

        {inviteResult && (
          <div className={`mt-4 rounded-xl px-4 py-3 border ${
            inviteResult.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <p className={`text-sm ${inviteResult.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {inviteResult.message}
            </p>
          </div>
        )}
      </div>

      {/* Staff List */}
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">👥 Equipo actual</h3>
        {loadingStaff ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : staff.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-8">No hay miembros del equipo</p>
        ) : (
          <div className="space-y-2">
            {staff.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-white/[0.04] border border-white/5 rounded-xl px-5 py-4">
                <div className="flex items-center gap-4">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                    s.role === 'owner' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {s.role === 'owner' ? '⭐' : '🍽'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{s.email}</p>
                    <p className="text-xs text-slate-500">
                      {s.email === 'dev@elatlantedesancristobal.com' ? 'Desarrollador' : (s.role === 'owner' ? 'Dueño' : 'Camarero')} · Creado el {new Date(s.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
                {s.email !== 'dev@elatlantedesancristobal.com' ? (
                  <button
                    onClick={() => handleDelete(s.id, s.email)}
                    className="text-slate-600 hover:text-red-400 transition-colors p-2"
                    title="Eliminar del equipo"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                ) : (
                  <div className="w-9 h-9"></div> /* Placeholder for alignment */
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
