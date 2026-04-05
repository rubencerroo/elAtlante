import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { isDayClosed, type CalendarOverride } from '../utils/reservationUtils';

interface CalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  minDate?: string; // YYYY-MM-DD
  overrides?: CalendarOverride[];
}

export default function Calendar({ selectedDate, onSelect, minDate, overrides = [] }: CalendarProps) {
  const { t } = useTranslation();
  const [viewDate, setViewDate] = useState(() => {
    const initial = selectedDate || minDate || new Date().toISOString().split('T')[0];
    return new Date(initial + 'T12:00:00');
  });

  const months = t('reservas.form.calendar.months', { returnObjects: true }) as string[];
  const daysOfWeek = t('reservas.form.calendar.days', { returnObjects: true }) as string[];

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Adjust for Monday start (0 is Sunday in JS, we want 0 as Monday)
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) startDay = 6; // Sunday = 6
    
    const days = [];
    
    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        month: month - 1,
        year: year,
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true
      });
    }
    
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        month: month + 1,
        year: year,
        isCurrentMonth: false
      });
    }
    
    return days;
  }, [viewDate]);

  const isSelected = (d: number, m: number, y: number) => {
    const dateStr = `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    return selectedDate === dateStr;
  };

  const isDisabled = (d: number, m: number, y: number) => {
    const date = new Date(y, m, d, 12, 0, 0);
    const dateStr = date.toISOString().split('T')[0];
    
    // Past dates
    if (minDate && dateStr < minDate) return true;
    
    // Closed days
    return isDayClosed(dateStr, overrides);
  };

  const handleSelect = (d: number, m: number, y: number) => {
    if (isDisabled(d, m, y)) return;
    const dateStr = `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    onSelect(dateStr);
  };

  const changeMonth = (offset: number) => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  return (
    <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl border select-none"
      style={{ background: 'var(--admin-modal-bg)', borderColor: 'var(--admin-border)' }}>
      <div className="flex items-center justify-between mb-8 px-2">
        <h3 className="font-serif text-xl" style={{ color: 'var(--admin-text)' }}>
          {months[viewDate.getMonth()]} <span className="opacity-40">{viewDate.getFullYear()}</span>
        </h3>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
            style={{ color: 'var(--admin-text-secondary)' }}
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            type="button"
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
            style={{ color: 'var(--admin-text-secondary)' }}
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map(day => (
          <div key={day} className="text-[10px] font-bold uppercase tracking-widest text-center py-2" style={{ color: 'var(--admin-text-muted)' }}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        <AnimatePresence mode="wait">
          <motion.div 
            key={`${viewDate.getFullYear()}-${viewDate.getMonth()}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="contents"
          >
            {calendarDays.map((date, i) => {
              const disabled = isDisabled(date.day, date.month, date.year);
              const selected = isSelected(date.day, date.month, date.year);
              
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(date.day, date.month, date.year)}
                  className={`
                    relative h-10 w-full rounded-xl flex items-center justify-center text-sm transition-all
                    ${!date.isCurrentMonth ? 'opacity-20' : ''}
                    ${disabled ? 'cursor-not-allowed opacity-10 line-through' : 'hover:bg-black/5 dark:hover:bg-white/10'}
                    ${selected ? 'bg-primary text-white hover:bg-primary shadow-lg shadow-primary/20 scale-105' : ''}
                  `}
                  style={!selected ? { color: 'var(--admin-text-secondary)' } : undefined}
                >
                  {date.day}
                  {selected && (
                    <motion.div 
                      layoutId="activeDay"
                      className="absolute inset-0 bg-primary rounded-xl -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div className="mt-6 pt-6 border-t flex gap-4 text-[10px] font-medium px-2" style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}>
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-primary/20"></div>
          <span>{t('reservas.form.calendar.available')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-slate-200 line-through"></div>
          <span>{t('reservas.form.calendar.closed')}</span>
        </div>
      </div>
    </div>
  );
}
