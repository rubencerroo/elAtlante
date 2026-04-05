import { useState } from 'react';
import type { Reservation, ReservationStatus } from '../../services/reservationStore';
import TableSelector from '../../components/TableSelector';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_GROUPS: { status: ReservationStatus; label: string; icon: string; color: string; defaultOpen: boolean }[] = [
  { status: 'waiting', label: 'En Espera', icon: '⏳', color: 'text-purple-400', defaultOpen: true },
  { status: 'pending', label: 'Pendientes', icon: '❓', color: 'text-amber-400', defaultOpen: true },
  { status: 'confirmed', label: 'Confirmadas', icon: '✅', color: 'text-emerald-400', defaultOpen: true },
  { status: 'seated', label: 'Sentados', icon: '🪑', color: 'text-blue-400', defaultOpen: true },
  { status: 'completed', label: 'Completadas', icon: '✓', color: 'text-slate-500', defaultOpen: true },
  { status: 'cancelled', label: 'Canceladas', icon: '✕', color: 'text-red-500', defaultOpen: false },
  { status: 'no-show', label: 'No Show', icon: '👻', color: 'text-orange-500', defaultOpen: false },
];

export default function StatusKanban({ filtered, handleStatus, handleDelete, handleAssignTable, showTableSelector, setShowTableSelector, occupiedTables }: {
  filtered: Reservation[];
  handleStatus: (id: string, s: ReservationStatus) => void;
  handleDelete: (id: string) => void;
  handleAssignTable: (id: string, t: number) => void;
  showTableSelector: string | null;
  setShowTableSelector: (id: string | null) => void;
  occupiedTables: number[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-8 gap-y-12 items-start">
      {STATUS_GROUPS.map(group => {
        const items = filtered.filter(r => r.status === group.status);
        if (items.length === 0 && !group.defaultOpen) return null;

        return (
          <StatusSection 
            key={group.status} 
            group={group} 
            items={items} 
            handleStatus={handleStatus} 
            handleDelete={handleDelete} 
            handleAssignTable={handleAssignTable} 
            showTableSelector={showTableSelector} 
            setShowTableSelector={setShowTableSelector} 
            occupiedTables={occupiedTables} 
          />
        );
      })}
    </div>
  );
}

function StatusSection({ group, items, handleStatus, handleDelete, handleAssignTable, showTableSelector, setShowTableSelector, occupiedTables }: any) {
  const [isOpen, setIsOpen] = useState(group.defaultOpen);

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header - Transparent and simple */}
      <div 
        className="flex items-center justify-between border-b-2 pb-4 mb-4" 
        style={{ borderColor: 'var(--admin-border)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{group.icon}</span>
          <span className={`text-[12px] font-black uppercase tracking-[0.2em] ${group.color}`}>{group.label}</span>
          <div className="px-2 py-0.5 rounded bg-slate-500/10 flex items-center justify-center">
            <span className="text-[10px] font-black text-slate-500">{items.length}</span>
          </div>
        </div>
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-full hover:bg-slate-500/10 transition-colors"
        >
          <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col divide-y divide-white/5"
            style={{ borderColor: 'var(--admin-border)' }}
          >
            {items.length > 0 ? (
              items.map((r: Reservation) => (
                <ReservationRow 
                  key={r.id} 
                  reservation={r} 
                  handleStatus={handleStatus} 
                  handleDelete={handleDelete} 
                  handleAssignTable={handleAssignTable} 
                  showTableSelector={showTableSelector} 
                  setShowTableSelector={setShowTableSelector} 
                  occupiedTables={occupiedTables} 
                />
              ))
            ) : (
              <div className="py-12 text-center text-slate-600 text-[11px] font-medium italic opacity-30">
                No hay reservas
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReservationRow({ reservation: r, handleStatus, handleDelete, handleAssignTable, showTableSelector, setShowTableSelector, occupiedTables }: any) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group transition-all hover:bg-white/[0.03] -mx-2 px-2 rounded-lg">
      {/* List Item Row */}
      <div 
        className="py-3 flex items-center justify-between gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[11px] font-mono font-bold text-primary shrink-0">{r.time}</span>
          <span className="text-[11px] font-bold truncate text-slate-200" title={r.name}>{r.name}</span>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          {r.hasPet && <span className="text-[10px]" title="Tiene mascota">🐾</span>}
          <span className="text-[10px] font-black text-slate-500">👥 {r.guests}</span>
          
          <svg className={`w-3 h-3 text-slate-600 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pb-4 space-y-4 overflow-hidden"
          >
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5 mx-1">
              <DetailItem label="Mesa" value={
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowTableSelector(showTableSelector === r.id ? null : r.id); }}
                    className={`text-[9px] font-black px-2 py-1 rounded border transition-all ${r.tableNumber || (r.assignedTables && r.assignedTables.length > 0) ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-slate-500/10 border-slate-500/10 text-slate-500 hover:border-slate-500/30'}`}
                  >
                    {r.assignedTables && r.assignedTables.length > 0 ? `Mesas ${r.assignedTables.join(', ')}` : r.tableNumber ? `Mesa ${r.tableNumber}` : 'Asignar'}
                  </button>
                  {showTableSelector === r.id && (
                    <div className="absolute top-8 left-0 z-[100] min-w-[180px]" onClick={e => e.stopPropagation()}>
                      <TableSelector 
                        occupiedTables={occupiedTables} 
                        selectedTables={r.assignedTables || (r.tableNumber ? [r.tableNumber] : [])} 
                        onSelect={(t: number) => handleAssignTable(r.id, t)} 
                        onClose={() => setShowTableSelector(null)} 
                      />
                    </div>
                  )}
                </div>
              } />
              <DetailItem label="Preferencia" value={r.preference || 'Cualquiera'} />
              <DetailItem label="Teléfono" value={r.phone} />
              <DetailItem label="Origen" value={r.source || 'web'} />
              {r.notes && (
                <div className="col-span-2 space-y-1 mt-1">
                  <p className="text-[8px] uppercase tracking-wider text-slate-600 font-black">Notas</p>
                  <p className="text-[10px] text-amber-400/80 font-medium leading-relaxed bg-amber-400/5 p-2 rounded border border-amber-400/10">
                    {r.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5 mx-1" onClick={e => e.stopPropagation()}>
              <StatusActions reservation={r} handleStatus={handleStatus} handleDelete={handleDelete} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailItem({ label, value }: any) {
  return (
    <div className="space-y-0.5">
      <p className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold">{label}</p>
      <div className="text-[10px] font-medium text-slate-300 truncate">{value || '—'}</div>
    </div>
  );
}

function StatusActions({ reservation: r, handleStatus, handleDelete }: any) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 w-full">
      {r.status === 'pending' && (
        <ActionButton onClick={() => handleStatus(r.id, 'confirmed')} icon="✓" label="Confirmar" color="emerald" />
      )}
      {(r.status === 'confirmed' || r.status === 'pending' || r.status === 'waiting') && (
        <ActionButton onClick={() => handleStatus(r.id, 'seated')} icon="🪑" label="Sentar" color="blue" />
      )}
      {r.status === 'seated' && (
        <ActionButton onClick={() => handleStatus(r.id, 'completed')} icon="✓" label="Completar" color="slate" />
      )}
      {r.status !== 'cancelled' && r.status !== 'completed' && (
        <>
          <ActionButton onClick={() => handleStatus(r.id, 'cancelled')} icon="✕" label="Cancelar" color="red" />
          <ActionButton onClick={() => handleStatus(r.id, 'no-show')} icon="👻" label="No Show" color="orange" />
        </>
      )}
      <button 
        onClick={() => { if (confirm('¿Eliminar esta reserva permanentemente?')) handleDelete(r.id); }}
        className="size-6 flex items-center justify-center rounded text-slate-700 hover:text-red-400 hover:bg-red-400/10 transition-colors ml-auto"
        title="Eliminar"
      >
        🗑
      </button>
    </div>
  );
}

function ActionButton({ onClick, icon, label, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20",
    slate: "bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 border-slate-500/20",
    red: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20",
    orange: "bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/20",
  };
  
  return (
    <button 
      onClick={onClick}
      className={`h-6 px-2 rounded border text-[8px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-1 ${colors[color]}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
