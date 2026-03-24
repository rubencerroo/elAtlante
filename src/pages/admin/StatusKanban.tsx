import { useState } from 'react';
import type { Reservation, ReservationStatus } from '../../services/reservationStore';
import TableSelector from '../../components/TableSelector';

const KANBAN_COLUMNS: { status: ReservationStatus; label: string; icon: string; color: string }[] = [
  { status: 'waiting', label: 'En Espera', icon: '⏳', color: 'border-t-purple-400' },
  { status: 'pending', label: 'Pendientes', icon: '❓', color: 'border-t-amber-400' },
  { status: 'confirmed', label: 'Confirmadas', icon: '✅', color: 'border-t-emerald-400' },
  { status: 'seated', label: 'Sentados', icon: '🪑', color: 'border-t-blue-400' },
  { status: 'completed', label: 'Completadas', icon: '✓', color: 'border-t-slate-500' },
];

export default function StatusKanban({ filtered, handleStatus, handleDelete, handleAssignTable, showTableSelector, setShowTableSelector, occupiedTables, draggedId, onDragStart, onDragEnd, onDrop }: {
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
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
      className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 group relative"
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
          <span>{r.preference === 'Terraza exterior' ? '☀️' : r.preference === 'Interior' ? '🏠' : r.preference === 'Mesas altas' ? '🪑' : '🔄'}</span>
          {(r.assignedTables || r.tableNumber) && (
            <span className="text-primary font-bold">
              M{r.assignedTables && r.assignedTables.length > 0 ? r.assignedTables.join(', ') : r.tableNumber}
            </span>
          )}
        </div>
        {r.notes && <p className="text-[11px] text-amber-300/70 mt-1.5 truncate">📝 {r.notes}</p>}
      </button>

      {expanded && (
        <div className="px-4 pb-3 border-t border-white/5 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span className="text-slate-500">📧 </span>{r.email || '—'}</div>
            <div><span className="text-slate-500">📞 </span>{r.phone || '—'}</div>
            <div><span className="text-slate-500">📅 </span>{r.date}</div>
            <div><span className="text-slate-500">🕐 </span>{r.createdAt ? new Date(r.createdAt).toLocaleString('es-ES') : '—'}</div>
            <div><span className="text-slate-500">📍 Origen: </span>{r.source || 'website'}</div>
            <div><span className="text-slate-500">🌐 Idioma: </span>{r.language || '—'}</div>
          </div>

          {/* Table selector */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowTableSelector(showTableSelector === r.id ? null : r.id); }}
            className="text-xs text-primary hover:underline">
            {r.tableNumber ? `Mesa ${r.tableNumber} (cambiar)` : '🪑 Asignar mesa'}
          </button>

          {showTableSelector === r.id && (
            <TableSelector occupiedTables={occupiedTables} selectedTables={r.tableNumber ? [r.tableNumber] : []} onSelect={(t) => handleAssignTable(r.id, t)} onClose={() => setShowTableSelector(null)} />
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
