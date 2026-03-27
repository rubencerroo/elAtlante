import { useState } from 'react';
import { AREAS, getTablesInArea, getTableDef, type AreaId } from '../utils/tableConfig';

interface TableSelectorProps {
  occupiedTables: number[];
  reservedTables?: number[];
  selectedTables?: number[];
  onSelect: (tableNumber: number) => void;
  onClose?: () => void;
}

export default function TableSelector({ 
  occupiedTables, 
  reservedTables = [],
  selectedTables = [],
  onSelect,
  onClose 
}: TableSelectorProps) {
  const [hoveredTable, setHoveredTable] = useState<number | null>(null);
  
  // Auto-select tab based on first selected table's area
  const getInitialTab = (): number => {
    if (!selectedTables || selectedTables.length === 0) return 0;
    const def = getTableDef(selectedTables[0]);
    if (!def) return 0;
    return AREAS.findIndex(a => a.id === def.area);
  };
  
  const [activeSection, setActiveSection] = useState(getInitialTab());

  const getTableStatus = (num: number) => {
    if (occupiedTables.includes(num)) return 'occupied';
    if (reservedTables.includes(num)) return 'reserved';
    return 'free';
  };

  const getTableStyles = (num: number) => {
    const status = getTableStatus(num);
    const isSelected = selectedTables.includes(num);
    const base = 'relative w-full aspect-square rounded-xl font-bold text-sm transition-all duration-200 border-2 flex flex-col items-center justify-center gap-0.5';
    
    if (isSelected) return `${base} bg-primary/20 border-primary text-primary scale-105 shadow-lg shadow-primary/20`;
    
    switch (status) {
      case 'occupied':
        return `${base} admin-bg-card admin-border text-slate-500 cursor-not-allowed opacity-40`;
      case 'reserved':
        return `${base} bg-amber-500/10 border-amber-500/30 text-amber-400 cursor-pointer hover:border-amber-400 hover:scale-105`;
      default:
        return `${base} bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-pointer hover:border-emerald-400 hover:scale-105 hover:bg-emerald-500/20`;
    }
  };

  const currentArea = AREAS[activeSection];
  const currentTables = getTablesInArea(currentArea.id as AreaId);

  return (
    <div className="backdrop-blur-xl rounded-2xl border p-5 space-y-5" 
      style={{ background: 'var(--admin-table-selector-bg)', borderColor: 'var(--admin-border)' }}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm" style={{ color: 'var(--admin-text)' }}>Asignar Mesa</h3>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xs">✕</button>
        )}
      </div>

      {/* Section Tabs - scrollable for 6 areas */}
      <div className="flex p-1 rounded-xl overflow-x-auto gap-0.5 custom-scrollbar" style={{ background: 'var(--admin-bg-hover)' }}>
        {AREAS.map((area, idx) => (
          <button
            key={area.id}
            onClick={() => setActiveSection(idx)}
            className={`flex-shrink-0 py-2 px-2 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${activeSection === idx ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'}`}
          >
            {area.label}
          </button>
        ))}
      </div>

      {/* Grid for Active Section */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 animate-in fade-in duration-300">
        {currentTables.map(table => (
          <button
            key={table.id}
            onClick={() => getTableStatus(table.id) !== 'occupied' && onSelect(table.id)}
            onMouseEnter={() => setHoveredTable(table.id)}
            onMouseLeave={() => setHoveredTable(null)}
            className={getTableStyles(table.id)}
            disabled={getTableStatus(table.id) === 'occupied'}
          >
            <span className="text-sm font-black">{table.id}</span>
            <span className="text-[8px] opacity-60">{table.capacity}p</span>
            {hoveredTable === table.id && getTableStatus(table.id) === 'occupied' && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
            {selectedTables.includes(table.id) && (
               <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[8px] h-4 w-4 rounded-full flex items-center justify-center font-bold">✓</div>
            )}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'var(--admin-border)' }}>
        <div className="flex gap-3 text-[9px] font-medium" style={{ color: 'var(--admin-text-muted)' }}>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500/40 border border-emerald-500/50"></span>Libre</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded border" style={{ background: 'var(--admin-bg-hover)', borderColor: 'var(--admin-border-strong)' }}></span>Ocupada</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-500/40 border border-amber-500/50"></span>Reserva</span>
        </div>
        <span className="text-[9px] text-slate-600 uppercase tracking-tighter">{currentArea.label}</span>
      </div>
    </div>
  );
}
