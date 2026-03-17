import { useState } from 'react';

interface TableSelectorProps {
  occupiedTables: number[];
  reservedTables?: number[];
  selectedTable?: number | null;
  onSelect: (tableNumber: number) => void;
  onClose?: () => void;
}

export default function TableSelector({ 
  occupiedTables, 
  reservedTables = [],
  selectedTable,
  onSelect,
  onClose 
}: TableSelectorProps) {
  const [hoveredTable, setHoveredTable] = useState<number | null>(null);
  
  // Logic to auto-select tab if a table is already selected
  const getInitialTab = () => {
    if (!selectedTable) return 0;
    if (selectedTable <= 15) return 0;
    if (selectedTable <= 30) return 1;
    return 2;
  };
  
  const [activeSection, setActiveSection] = useState(getInitialTab());

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
        return `${base} bg-white/5 border-white/5 text-slate-500 cursor-not-allowed opacity-40`;
      case 'reserved':
        return `${base} bg-amber-500/10 border-amber-500/30 text-amber-400 cursor-pointer hover:border-amber-400 hover:scale-105`;
      default:
        return `${base} bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-pointer hover:border-emerald-400 hover:scale-105 hover:bg-emerald-500/20`;
    }
  };

  const sections = [
    { label: 'Interior', range: [1, 15] },
    { label: 'Mesas Altas', range: [16, 30] },
    { label: 'Exterior', range: [31, 45] },
  ];

  const currentSection = sections[activeSection];

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Asignar Mesa</h3>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xs">✕</button>
        )}
      </div>

      {/* Section Tabs */}
      <div className="flex bg-white/5 p-1 rounded-xl">
        {sections.map((section, idx) => (
          <button
            key={section.label}
            onClick={() => setActiveSection(idx)}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeSection === idx ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Grid for Active Section */}
      <div className="grid grid-cols-5 gap-2 animate-in fade-in duration-300">
        {Array.from({ length: currentSection.range[1] - currentSection.range[0] + 1 }, (_, i) => currentSection.range[0] + i).map(num => (
          <button
            key={num}
            onClick={() => getTableStatus(num) !== 'occupied' && onSelect(num)}
            onMouseEnter={() => setHoveredTable(num)}
            onMouseLeave={() => setHoveredTable(null)}
            className={getTableStyles(num)}
            disabled={getTableStatus(num) === 'occupied'}
          >
            <span className="text-sm font-black">{num}</span>
            {hoveredTable === num && getTableStatus(num) === 'occupied' && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
            {selectedTable === num && (
               <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[8px] h-4 w-4 rounded-full flex items-center justify-center font-bold">✓</div>
            )}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-between items-center pt-2 border-t border-white/5">
        <div className="flex gap-3 text-[9px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500/40 border border-emerald-500/50"></span>Libre</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-white/10 border border-white/20"></span>Ocupada</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-500/40 border border-amber-500/50"></span>Reserva</span>
        </div>
        <span className="text-[9px] text-slate-600 uppercase tracking-tighter">Mesas {currentSection.range[0]}-{currentSection.range[1]}</span>
      </div>
    </div>
  );
}
