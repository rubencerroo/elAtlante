import type { ReservationStats } from '../../services/reservationStore';

interface StatsCardsProps {
  stats: ReservationStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-2">Total Reservas (Hoy)</p>
        <p className="text-3xl font-black text-white">{stats.totalToday}</p>
      </div>
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
        <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-2">Total Comensales</p>
        <p className="text-3xl font-black text-emerald-400">{stats.totalGuestsToday}</p>
      </div>
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
        <p className="text-blue-400 text-xs font-bold tracking-widest uppercase mb-2">Sentados</p>
        <p className="text-3xl font-black text-blue-400">{stats.seated}</p>
      </div>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
        <p className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-2">Pendientes</p>
        <p className="text-3xl font-black text-amber-400">{stats.pending}</p>
      </div>
    </div>
  );
}
