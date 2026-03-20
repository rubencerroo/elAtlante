import { useTranslation } from 'react-i18next';

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
  className = '' 
}: GuestCounterProps) {
  const { t } = useTranslation();
  // No more manual plural logic, we use i18next strings

  return (
    <div className={`flex items-center justify-center gap-2 md:gap-4 ${className}`}>
      <button
        type="button"
        aria-label={t('reservas.form.guestCounter.decrement')}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl border border-current opacity-40 hover:opacity-100 transition-all text-xl font-light leading-none disabled:opacity-10 active:scale-90"
      >
        −
      </button>
      
      <div className="flex flex-col items-center min-w-[3rem] md:min-w-[5rem]">
        <span className="text-lg md:text-2xl font-bold leading-none">
          {value}
        </span>
        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1">
          {value === 1 ? t('reservas.form.guestCounter.person') : t('reservas.form.guestCounter.people')}
        </span>
      </div>

      <button
        type="button"
        aria-label={t('reservas.form.guestCounter.increment')}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl border border-current opacity-40 hover:opacity-100 transition-all text-xl font-light leading-none disabled:opacity-10 active:scale-90"
      >
        +
      </button>
    </div>
  );
}
