import type { ReservationStats } from '../../services/reservationStore';

interface StatsCardsProps {
  stats: ReservationStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mb-8">
      {/* Total Reservas */}
      <div className="relative group overflow-hidden backdrop-blur-md border rounded-2xl p-5 transition-all duration-300"
        style={{ background: 'var(--admin-bg-card)', borderColor: 'var(--admin-border)' }}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-3xl -mr-12 -mt-12 rounded-full group-hover:bg-primary/20 transition-colors"></div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-white/5 rounded-lg text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Reservas del día</p>
        </div>
        <p className="text-3xl font-black group-hover:scale-105 transition-transform origin-left" style={{ color: 'var(--admin-text)' }}>{stats.totalToday}</p>
      </div>

      {/* Total Comensales */}
      <div className="relative group overflow-hidden backdrop-blur-md border rounded-2xl p-5 transition-all duration-300"
        style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.05)' }}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-3xl -mr-12 -mt-12 rounded-full group-hover:bg-emerald-500/20 transition-colors"></div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </div>
          <p className="text-emerald-500/70 text-[10px] font-bold tracking-widest uppercase">Comensales</p>
        </div>
        <p className="text-3xl font-black text-emerald-400 group-hover:scale-105 transition-transform origin-left">{stats.totalGuestsToday}</p>
      </div>

  {/* Sentados */}
      <div className="relative group overflow-hidden backdrop-blur-md border rounded-2xl p-5 transition-all duration-300"
        style={{ background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.05)' }}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl -mr-12 -mt-12 rounded-full group-hover:bg-blue-500/20 transition-colors"></div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
          </div>
          <p className="text-blue-500/70 text-[10px] font-bold tracking-widest uppercase">Sentados</p>
        </div>
        <p className="text-3xl font-black text-blue-400 group-hover:scale-105 transition-transform origin-left">{stats.seated}</p>
      </div>

  {/* Pendientes */}
      <div className="relative group overflow-hidden backdrop-blur-md border rounded-2xl p-5 transition-all duration-300"
        style={{ background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.05)' }}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-3xl -mr-12 -mt-12 rounded-full group-hover:bg-amber-500/20 transition-colors"></div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <p className="text-amber-500/70 text-[10px] font-bold tracking-widest uppercase">Pendientes</p>
        </div>
        <p className="text-3xl font-black text-amber-400 group-hover:scale-105 transition-transform origin-left">{stats.pending}</p>
      </div>
    </div>
  );
}
