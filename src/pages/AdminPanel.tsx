import { useState, useEffect, useMemo, useCallback } from 'react';
// removed GuestCounter import
import { useNavigate } from 'react-router-dom';
import {
  getReservations, updateReservation, getStats, deleteReservation,
  getOccupancyByHour, getStatusDistribution, getWeeklyComparison, getNoShowRate,
  getClientProfiles, getClientMeta, saveClientMeta, generateCSV, getOccupiedTables, getShiftNote, saveShiftNote, getFeedbacks, updateFeedbackStatus, deleteFeedback,
  type Reservation, type ReservationStatus, type ReservationStats, type ClientProfile, type ClientMeta
} from '../services/reservationStore';
import { signOut, getStaffRole, getSession, getStaffProfiles, inviteStaff, deleteStaff, updateStaffProfile, isTabletAuthorized, authorizeTablet, deauthorizeTablet, getActiveStaffId, type StaffProfile, type StaffRole } from '../services/authStore';

import StatsCards from './admin/StatsCards';
import StatusKanban from './admin/StatusKanban';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import FeedbackButton from '../components/FeedbackButton';
import logoWhite from '../assets/logowhite.png';
import { AlertModal } from '../components/AlertModal';
import ManualReservationModal from '../components/ManualReservationModal';

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

type AdminTab = 'kanban' | 'dashboard' | 'crm' | 'staff' | 'feedback';



export default function AdminPanel() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('kanban');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
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
  const [shiftNote, setShiftNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  // CRM state
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [crmSearch, setCrmSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'error' | 'success' | 'confirm';
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });

  const showAlert = (title: string, message: string, type: 'info' | 'error' | 'success' | 'confirm' = 'info', onConfirm?: () => void, onCancel?: () => void) => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => {
        onConfirm?.();
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: onCancel ? () => {
        onCancel?.();
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
      } : undefined
    });
  };
  
  useEffect(() => {
    (() => {
      try {
        const session = getSession();
        const activeStaffId = getActiveStaffId();
        const isAuthorized = isTabletAuthorized();

        if (!session && !(isAuthorized && activeStaffId)) {
          navigate('/admin', { replace: true });
          return;
        }

        if (session) {
          setCurrentUserEmail(session.email || null);
          const role = getStaffRole();
          if (role !== 'owner') {
            navigate('/admin', { replace: true });
            return;
          }
        }
        
        setAuthChecked(true);
      } catch (error: any) {
        console.error("Authentication error:", error);
        // Important: check if we are in authorized tablet mode before redirecting
        if (isTabletAuthorized() && getActiveStaffId()) {
            setAuthChecked(true);
            return;
        }
        showAlert('Error de Autenticación', error.message || 'Ocurrió un error inesperado durante la autenticación.', 'error', () => {
          navigate('/admin', { replace: true });
        });
      }
    })();
  }, [navigate]);

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const [resData, statsData, occData, distData, weeklyData, nsRate, profiles, occTables, note] = await Promise.all([
      getReservations(),
      getStats(filterDate),
      getOccupancyByHour(filterDate === 'all' ? new Date().toISOString().split('T')[0] : filterDate),
      getStatusDistribution(filterDate === 'all' ? new Date().toISOString().split('T')[0] : filterDate),
      getWeeklyComparison(),
      getNoShowRate(),
      getClientProfiles(),
      getOccupiedTables(filterDate === 'all' ? new Date().toISOString().split('T')[0] : filterDate),
      getShiftNote(filterDate === 'all' ? new Date().toISOString().split('T')[0] : filterDate)
    ]);

    setReservations(resData);
    setStats(statsData);
    setOccupancyData(occData);
    setStatusData(distData);
    setWeeklyComp(weeklyData);
    setNoShowRate(nsRate);
    setClientProfiles(profiles);
    setOccupiedTables(occTables);
    setShiftNote(note || '');
    
    // Fetch feedbacks separately or in parallel
    try {
      const fbData = await getFeedbacks();
      setFeedbacks(fbData);
    } catch (err: any) {
      console.error("Error fetching feedbacks:", err);
      // We'll rely on the debug info displayed in the FeedbackView
    }
    
    if (showLoading) setLoading(false);
  }, [filterDate]);

  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  const reload = useCallback(() => fetchDashboardData(false), [fetchDashboardData]);

  const filtered = useMemo(() => {
    return reservations
      .filter(r => filterDate === 'all' || r.date === filterDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [reservations, filterDate]);

  const handleStatus = async (id: string, status: ReservationStatus) => {
    let cancellationReason;
    if (status === 'cancelled') {
      const reason = prompt('Por favor, indica el motivo de la cancelación (o deja en blanco):');
      if (reason === null) return; // User clicked Cancel
      cancellationReason = reason;
    }
    await updateReservation(id, { status, ...(cancellationReason ? { cancellationReason } : {}) });
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
      ${shiftNote ? `
        <div style="margin-top: 30px; background: #fffbeb; border: 1px solid #fde68a; padding: 15px; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #92400e; letter-spacing: 0.5px;">💡 Notas del Turno</h3>
          <p style="margin: 0; font-size: 13px; white-space: pre-wrap; color: #78350f;">${shiftNote}</p>
        </div>
      ` : ''}
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
    { key: 'feedback', label: 'Feedback', icon: '💬' },
  ];

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleSaveNote = async () => {
    setSavingNote(true);
    await saveShiftNote(filterDate === 'all' ? new Date().toISOString().split('T')[0] : filterDate, shiftNote);
    setSavingNote(false);
  };

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
        <div className="md:hidden flex border-t border-white/5 overflow-x-auto no-scrollbar">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-3 px-2 text-center text-[10px] font-medium transition-all whitespace-nowrap ${activeTab === t.key ? 'text-primary border-b-2 border-primary bg-white/5' : 'text-slate-500'}`}>
              <span className="block text-lg mb-1">{t.icon}</span>
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
            className="bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50" />

          <div className="ml-auto flex gap-2">
            <button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-primary/90 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
              ➕ Nueva Reserva
            </button>
            <button onClick={exportPDF} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2">
              📄 PDF
            </button>
            <button onClick={exportCSV} className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2">
              📊 CSV
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'kanban' && <StatusKanban filtered={filtered} handleStatus={handleStatus} handleDelete={handleDelete} handleAssignTable={handleAssignTable} showTableSelector={showTableSelector} setShowTableSelector={setShowTableSelector} occupiedTables={occupiedTables} draggedId={draggedId} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDrop={handleDrop} />}
        {activeTab === 'dashboard' && <DashboardView filterDate={filterDate} setFilterDate={setFilterDate} reservations={reservations} occupancyData={occupancyData} statusData={statusData} weeklyComp={weeklyComp} noShowRate={noShowRate} shiftNote={shiftNote} setShiftNote={setShiftNote} handleSaveNote={handleSaveNote} savingNote={savingNote} />}
        {activeTab === 'crm' && <CRMView search={crmSearch} setSearch={setCrmSearch} selectedClient={selectedClient} setSelectedClient={setSelectedClient} clientProfiles={clientProfiles} />}
        {activeTab === 'staff' && <StaffView showAlert={showAlert} />}
        {activeTab === 'feedback' && <FeedbackView feedbacks={feedbacks} onReload={fetchDashboardData} currentUserEmail={currentUserEmail} showAlert={showAlert} />}

        {loading && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Actualizando datos...</p>
            </div>
          </div>
        )}

        {showAddModal && <ManualReservationModal onClose={() => setShowAddModal(false)} onSave={() => { setShowAddModal(false); reload(); }} />}

        <AlertModal 
          isOpen={alertConfig.isOpen}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onConfirm={alertConfig.onConfirm}
          onCancel={alertConfig.onCancel}
        />
      </div>
    </div>
  );
}



// ═══════════════════════════════════════════════
// DASHBOARD VIEW
// ═══════════════════════════════════════════════

function DashboardView({ 
  filterDate, setFilterDate, reservations, occupancyData, statusData, weeklyComp, noShowRate,
  shiftNote, setShiftNote, handleSaveNote, savingNote
}: { 
  filterDate: string;
  setFilterDate: (date: string) => void;
  reservations: Reservation[];
  occupancyData: { hour: string; guests: number }[];
  statusData: { name: string; value: number; color: string }[];
  weeklyComp: { thisWeek: number; lastWeek: number; change: number };
  noShowRate: number;
  shiftNote: string;
  setShiftNote: (note: string) => void;
  handleSaveNote: () => void;
  savingNote: boolean;
}) {
  const getSourceDistribution = () => {
    const list = reservations.filter(r => filterDate === 'all' ? true : r.date === filterDate);
    const data: Record<string, number> = {};
    const labelMap: Record<string, string> = {
      'walk-in': 'Walk-in',
      'website': 'Reserva por Web',
      'in-person': 'Reserva en Persona',
      'phone': 'Reserva por Teléfono'
    };

    list.forEach(r => {
      // If it's a walk-in or is_walk_in is true, force 'walk-in'
      const rawSrc = r.isWalkIn || r.source === 'walk-in' ? 'walk-in' : (r.source || 'website');
      // Use mapped label or fall back to 'Web' for any other legacy source
      const srcName = labelMap[rawSrc] || 'Reserva por Web';
      data[srcName] = (data[srcName] || 0) + 1;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  };

  const getForecast = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const result = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const count = reservations.filter(r => r.date === dStr && r.status !== 'cancelled').length;
      result.push({ date: d.toLocaleDateString('es-ES', { weekday: 'short' }), count });
    }
    return result;
  };

  const sourceData = getSourceDistribution();
  const forecastData = getForecast();

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
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '12px' }}
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
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '12px' }} />
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

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Sources */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-4">Orígenes</h3>
          {sourceData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][i % 5]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {sourceData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][i % 5] }}></span>
                      <span className="text-slate-400">{d.name}</span>
                    </div>
                    <span className="font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-600 text-xs">Sin datos</div>
          )}
        </div>

        {/* Forecast */}
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-4">Previsión 7 días (visión global)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '12px' }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} name="Reservas Esperadas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Shift Notes */}
      <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 mb-8 flex flex-col">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-semibold">Notas del Turno</h3>
            <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-lg px-2 py-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Día:</span>
              <input 
                type="date" 
                value={filterDate === 'all' ? new Date().toISOString().split('T')[0] : filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent border-none text-[11px] text-primary focus:outline-none p-0 cursor-pointer"
              />
            </div>
          </div>
          <button 
            onClick={handleSaveNote} 
            disabled={savingNote}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg px-4 py-1.5 text-xs font-bold transition-all disabled:opacity-50">
            {savingNote ? 'Guardando...' : 'Guardar Notas'}
          </button>
        </div>
        <textarea
          value={shiftNote}
          onChange={(e) => setShiftNote(e.target.value)}
          placeholder="Anota aquí las incidencias, clientes VIP que vienen hoy, o tareas pendientes para los camareros..."
          className="w-full h-32 bg-slate-900/50 border border-white/5 rounded-xl p-4 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-primary/50 resize-none"
        ></textarea>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
          <span>💡</span>
          <span>Puedes cambiar la fecha del filtro arriba para programar notas para días futuros.</span>
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
    if (selectedClient?.phone) {
      setLoadingMeta(true);
      getClientMeta(selectedClient.phone).then(m => {
        setMeta(m || { phone: selectedClient.phone, email: selectedClient.email });
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
    return clientProfiles.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email && c.email.toLowerCase().includes(q)));
  }, [clientProfiles, search]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Client List */}
      <div className="lg:col-span-1 space-y-4">
        <input type="text" placeholder="Buscar cliente…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50" />
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {filteredClients.map(c => (
            <button key={c.phone || c.email || c.name} onClick={() => setSelectedClient(c)}
              className={`w-full text-left bg-white/[0.03] hover:bg-white/[0.06] border rounded-xl px-4 py-3 transition-all ${selectedClient?.phone === c.phone && c.phone ? 'border-primary/30 bg-primary/5' : 'border-white/5'}`}>
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
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 h-20 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Notas de Preferencia</label>
                <textarea 
                  value={meta?.customNotes || ''} 
                  onChange={e => setMeta(prev => prev ? { ...prev, customNotes: e.target.value } : null)}
                  placeholder="Ej: Mesa cerca de ventana, vino preferido..."
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 h-20 resize-none"
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


// ═══════════════════════════════════════════════
// FEEDBACK VIEW
// ═══════════════════════════════════════════════

function FeedbackView({ feedbacks, onReload, currentUserEmail, showAlert }: { 
  feedbacks: any[], 
  onReload: () => void, 
  currentUserEmail: string | null,
  showAlert: (title: string, message: string, type?: 'info' | 'error' | 'success' | 'confirm', onConfirm?: () => void, onCancel?: () => void) => void
}) {
  const isDev = currentUserEmail === 'dev@elatlantedesancristobal.com';

  const sortedFeedbacks = useMemo(() => {
    return [...feedbacks].sort((a, b) => {
      // Unresolved first (resolved is boolean, false < true)
      if (a.resolved !== b.resolved) {
        return a.resolved ? 1 : -1;
      }
      // Then by date desc
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [feedbacks]);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const success = await updateFeedbackStatus(id, !currentStatus);
    if (success) {
      onReload();
    } else {
      showAlert('Error', 'No se pudo actualizar el estado del feedback.', 'error');
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    showAlert(
      '¿Eliminar feedback?', 
      '¿Estás seguro de que quieres eliminar este feedback? Esta acción no se puede deshacer.', 
      'confirm',
      async () => {
        const success = await deleteFeedback(id);
        if (success) {
          onReload();
        } else {
          showAlert('Error', 'No se pudo eliminar el feedback.', 'error');
        }
      },
      () => {} // Cancel
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4">
        <div>
          <h3 className="text-sm font-bold">Feedback del Sistema</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Informes de errores y sugerencias</p>
        </div>
        <button onClick={onReload} className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg px-4 py-1.5 text-xs font-bold transition-all">
          🔄 Actualizar
        </button>
      </div>
      
      {sortedFeedbacks.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-12 text-center">
          <span className="text-4xl block mb-4">🔇</span>
          <p className="text-slate-500 text-sm italic">No hay feedback registrado aún en el sistema.</p>
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Mensaje</th>
                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Usuario / Fecha</th>
                {isDev && <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider text-right">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedFeedbacks.map((f) => (
                <tr key={f.id} className={`group hover:bg-white/[0.02] transition-colors ${f.resolved ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    {f.resolved ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Resuelto
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] uppercase animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                      f.type === 'bug' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {f.type === 'bug' ? '🐞 Bug' : '💡 Sugerencia'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300 max-w-md">
                    <p className="line-clamp-2 italic">"{f.content}"</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-bold">{f.user_email || 'Anónimo'}</p>
                      <p className="text-[10px] text-slate-500 font-mono italic">{new Date(f.created_at).toLocaleDateString()}</p>
                    </div>
                  </td>
                  {isDev && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(f.id, f.resolved)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                            f.resolved 
                              ? 'bg-slate-500/10 border-slate-500/20 text-slate-400 hover:bg-slate-500/20' 
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {f.resolved ? 'Reabrir' : 'Resolver'}
                        </button>
                        <button
                          onClick={() => handleDeleteFeedback(f.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all"
                          title="Eliminar feedback"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// STAFF VIEW
// ═══════════════════════════════════════════════

function StaffView({ showAlert }: { 
  showAlert: (title: string, message: string, type?: 'info' | 'error' | 'success' | 'confirm', onConfirm?: () => void, onCancel?: () => void) => void 
}) {
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
      showAlert('Éxito', result.message, 'success');
      setInviteEmail('');
      setInvitePassword('');
      loadStaff();
    } catch (err: any) {
      showAlert('Error', err.message, 'error');
    }
    setInviting(false);
  };

  const handleDelete = async (id: string, email: string) => {
    if (email === 'dev@elatlantedesancristobal.com') {
      showAlert('Acción no permitida', 'Esta cuenta de desarrollador no puede ser eliminada desde el panel.', 'error');
      return;
    }
    
    showAlert(
      '¿Eliminar miembro?', 
      `¿Estás seguro de que quieres eliminar a ${email} del equipo?`, 
      'confirm',
      async () => {
        try {
          await deleteStaff(id);
          loadStaff();
        } catch (err: any) {
          showAlert('Error', 'No se pudo eliminar al miembro: ' + err.message, 'error');
        }
      },
      () => {} // Cancel
    );
  };

  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ display_name: '', pin: '' });

  const startEdit = (s: StaffProfile) => {
    setEditingStaff(s.id);
    setEditForm({ display_name: s.display_name || '', pin: '' });
  };

  const saveEdit = async (staffId: string) => {
    try {
      const updates: any = { display_name: editForm.display_name };
      if (editForm.pin) {
        if (!/^[0-9]{4}$/.test(editForm.pin)) {
          showAlert('Error', 'El PIN debe ser de 4 dígitos.', 'error');
          return;
        }
        updates.pin = editForm.pin;
      }
      
      await updateStaffProfile(staffId, updates);
      showAlert('Éxito', 'Perfil actualizado correctamente.', 'success');
      setEditingStaff(null);
      // Avoid reload() if it triggers infinite loop via useEffect
      const profiles = await getStaffProfiles();
      setStaff(profiles);
    } catch (err: any) {
      showAlert('Error', 'No se pudo actualizar: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Tablet Mode Toggle for Owners */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 -960 960 960"><path d="M480-440q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0-80q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0 440q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Zm0-400Z"/></svg>
            Modo Tablet (Acceso PIN)
          </h3>
          <p className="text-xs text-slate-400 mt-1">Autoriza este dispositivo para que el equipo pueda entrar con su PIN personal sin cerrar la sesión de administrador.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${isTabletAuthorized() ? 'text-primary' : 'text-slate-500'}`}>
            {isTabletAuthorized() ? 'Activado' : 'Desactivado'}
          </span>
          <button
            onClick={() => {
              if (isTabletAuthorized()) {
                deauthorizeTablet();
              } else {
                authorizeTablet();
              }
              loadStaff(); // Force re-render to reflect state change
            }}
            className={`w-14 h-7 rounded-full transition-all relative p-1 ${isTabletAuthorized() ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-800'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-all flex items-center justify-center shadow-sm ${isTabletAuthorized() ? 'translate-x-7' : 'translate-x-0'}`}>
                {isTabletAuthorized() && <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>}
            </div>
          </button>
        </div>
      </div>

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
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rol</label>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as StaffRole)}
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 appearance-none min-w-[140px]"
            >
              <option value="waiter">🍽 Camarero</option>
              <option value="owner">⭐ Dueño</option>
            </select>
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contraseña inicial</label>
            <input
              type="password"
              required
              minLength={6}
              value={invitePassword}
              onChange={e => setInvitePassword(e.target.value)}
              placeholder="Min. 6 caracteres"
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
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
          <div className="space-y-4">
            {staff.map(s => (
              <div key={s.id} className="flex flex-col bg-white/[0.04] border border-white/5 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                      s.role === 'owner' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {s.role === 'owner' ? '⭐' : '🍽'}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{s.email}</p>
                      <p className="text-xs text-slate-500">
                        {s.display_name || 'Sin nombre'} · {s.email === 'dev@elatlantedesancristobal.com' ? 'Desarrollador' : (s.role === 'owner' ? 'Dueño' : 'Camarero')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(s)}
                      className="text-slate-400 hover:text-white transition-colors p-2"
                      title="Editar perfil"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    {s.email !== 'dev@elatlantedesancristobal.com' && (
                      <button
                        onClick={() => handleDelete(s.id, s.email)}
                        className="text-slate-600 hover:text-red-400 transition-colors p-2"
                        title="Eliminar del equipo"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </div>

                {editingStaff === s.id && (
                  <div className="px-5 pb-5 pt-2 border-t border-white/5 bg-white/[0.02] grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nombre Display</label>
                      <input
                        type="text"
                        value={editForm.display_name}
                        onChange={e => setEditForm({ ...editForm, display_name: e.target.value })}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2 text-sm text-white"
                        placeholder="Ej: Juan C."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">PIN (4 dígitos)</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={editForm.pin}
                        onChange={e => setEditForm({ ...editForm, pin: e.target.value.replace(/\D/g, '') })}
                        className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2 text-sm text-white"
                        placeholder="••••"
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-2">
                      <button onClick={() => setEditingStaff(null)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">Cancelar</button>
                      <button onClick={() => saveEdit(s.id)} className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all">Guardar Cambios</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
