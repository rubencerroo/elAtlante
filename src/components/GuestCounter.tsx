interface GuestCounterProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
}

export default function GuestCounter({ 
  value, 
  onChange, 
  min = 1, 
  max = 100, 
  label = 'Persona', 
  className = '' 
}: GuestCounterProps) {
  const pluralLabel = label.endsWith('a') ? label + 's' : label + 'es';

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <button
        type="button"
        aria-label="Reducir comensales"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-10 h-10 flex items-center justify-center rounded-xl border border-current opacity-40 hover:opacity-100 transition-all text-xl font-light leading-none disabled:opacity-10 active:scale-90"
      >
        −
      </button>
      
      <div className="flex flex-col items-center min-w-[5rem]">
        <span className="text-2xl font-bold leading-none">
          {value}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1">
          {value === 1 ? label : pluralLabel}
        </span>
      </div>

      <button
        type="button"
        aria-label="Aumentar comensales"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-10 h-10 flex items-center justify-center rounded-xl border border-current opacity-40 hover:opacity-100 transition-all text-xl font-light leading-none disabled:opacity-10 active:scale-90"
      >
        +
      </button>
    </div>
  );
}
