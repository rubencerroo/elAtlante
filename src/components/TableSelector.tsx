import { useState } from 'react';

interface TableSelectorProps {
  totalTables?: number;
  occupiedTables: number[];
  reservedTables?: number[];
  selectedTable?: number | null;
  onSelect: (tableNumber: number) => void;
  onClose?: () => void;
}

export default function TableSelector({ 
  totalTables = 15, 
  occupiedTables, 
  reservedTables = [],
  selectedTable,
  onSelect,
  onClose 
}: TableSelectorProps) {
  const [hoveredTable, setHoveredTable] = useState<number | null>(null);

  const getTableStatus = (num: number) => {
    if (occupiedTables.includes(num)) return 'occupied';
    if (reservedTables.includes(num)) return 'reserved';
    return 'free';
  };

  const getTableStyles = (num: number) => {
    const status = getTableStatus(num);
    const isSelected = selectedTable === num;
    const base = 'relative w-full aspect-square rounded-xl font-bold text-sm transition-all duration-200 border-2 flex flex-col items-center justify-center gap-0.5';
    
    if (isSelected) return `${base} bg-primary/20 border-primary text-primary scale-105 shadow-lg shadow-primary/20`;
    
    switch (status) {
      case 'occupied':
        return `${base} bg-red-500/10 border-red-500/30 text-red-400 cursor-not-allowed opacity-60`;
      case 'reserved':
        return `${base} bg-amber-500/10 border-amber-500/30 text-amber-400 cursor-pointer hover:border-amber-400 hover:scale-105`;
      default:
        return `${base} bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-pointer hover:border-emerald-400 hover:scale-105 hover:bg-emerald-500/20`;
    }
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Seleccionar Mesa</h3>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xs">✕</button>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-500/50"></span>Libre</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-red-500/40 border border-red-500/50"></span>Ocupada</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500/40 border border-amber-500/50"></span>Reservada</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: totalTables }, (_, i) => i + 1).map(num => (
          <button
            key={num}
            onClick={() => getTableStatus(num) !== 'occupied' && onSelect(num)}
            onMouseEnter={() => setHoveredTable(num)}
            onMouseLeave={() => setHoveredTable(null)}
            className={getTableStyles(num)}
            disabled={getTableStatus(num) === 'occupied'}
          >
            <span className="text-base font-black">{num}</span>
            {hoveredTable === num && getTableStatus(num) === 'occupied' && (
              <span className="text-[8px] opacity-80">En uso</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
