import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCalendarOverrides, setCalendarOverride, deleteCalendarOverride } from '../../services/reservationStore';
import type { CalendarOverride } from '../../utils/reservationUtils';
import { normalizeDayName, OPENING_HOURS } from '../../utils/reservationUtils';
import DaySettingsModal from '../../components/admin/DaySettingsModal';

export default function CalendarSettingsView() {
  const [overrides, setOverrides] = useState<CalendarOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const [viewDate, setViewDate] = useState(() => {
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12, 0, 0);
  });

  const fetchOverrides = async () => {
    setLoading(true);
    try {
      const data = await getCalendarOverrides();
      setOverrides(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOverrides();
  }, []);

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const daysOfWeek = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) startDay = 6;
    
    const days = [];
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, month: month - 1, year: year, isCurrentMonth: false });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ day: i, month: month, year: year, isCurrentMonth: true });
    }
    
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, month: month + 1, year: year, isCurrentMonth: false });
    }
    
    return days;
  }, [viewDate]);

  const changeMonth = (offset: number) => {
    setViewDate((prev: Date) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1, 12, 0, 0));
  };

  const getDayStatus = (d: number, m: number, y: number) => {
    const dateStr = `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const override = overrides.find((o: CalendarOverride) => o.date === dateStr);
    
    const date = new Date(y, m, d, 12, 0, 0);
    const normalizedDay = normalizeDayName(date);
    const isDefaultClosed = OPENING_HOURS.closed.includes(normalizedDay);
    
    if (override) {
      return {
        dateStr,
        isCustom: true,
        isClosed: override.isClosed,
        hasSlots: !!(override.slots && override.slots.length > 0)
      };
    }
    
    return {
      dateStr,
      isCustom: false,
      isClosed: isDefaultClosed,
      hasSlots: false
    };
  };

  const handleSaveDay = async (isClosed: boolean, slots: { start: string, end: string }[] | null) => {
    if (!selectedDate) return;
    await setCalendarOverride(selectedDate, isClosed, slots);
    await fetchOverrides();
  };

  const handleDeleteDay = async () => {
    if (!selectedDate) return;
    await deleteCalendarOverride(selectedDate);
    await fetchOverrides();
  };

  const selectedOverride = overrides.find(o => o.date === selectedDate);

  if (loading && overrides.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl" style={{ background: 'var(--admin-bg-card)', border: '1px solid var(--admin-border)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold" style={{ color: 'var(--admin-text)' }}>Calendario de Disponibilidad</h2>
            <p className="text-sm text-slate-500 mt-1">Configura excepciones de cierre y horarios especiales por día.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400/20 border border-emerald-400/40"></div>
              <span>Abierto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-slate-300 dark:border-white/10"></div>
              <span>Cerrado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <span>Modificado</span>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="font-serif text-xl" style={{ color: 'var(--admin-text)' }}>
              {months[viewDate.getMonth()]} <span className="opacity-40">{viewDate.getFullYear()}</span>
            </h3>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors" style={{ color: 'var(--admin-text-secondary)' }}>
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors" style={{ color: 'var(--admin-text-secondary)' }}>
                <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-3 mb-3">
            {daysOfWeek.map(day => (
              <div key={day} className="text-[10px] font-bold uppercase tracking-widest text-center py-2" style={{ color: 'var(--admin-text-muted)' }}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-3">
            <AnimatePresence mode="wait">
              <motion.div 
                key={`${viewDate.getFullYear()}-${viewDate.getMonth()}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="contents"
              >
                {calendarDays.map((date, i) => {
                  const status = getDayStatus(date.day, date.month, date.year);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedDate(status.dateStr)}
                      className={`
                        relative h-14 w-full rounded-2xl flex flex-col items-center justify-center text-sm transition-all hover:scale-105 active:scale-95 border
                        ${!date.isCurrentMonth ? 'opacity-10 cursor-default pointer-events-none' : 'cursor-pointer'}
                        ${status.isClosed 
                          ? 'border-slate-200 dark:border-white/5 opacity-40' 
                          : 'bg-emerald-400/5 text-emerald-600 dark:text-emerald-400 border-emerald-400/20 font-bold shadow-sm shadow-emerald-400/5'}
                      `}
                      style={status.isClosed ? { color: 'var(--admin-text-secondary)' } : undefined}
                    >
                      <span className={status.isClosed ? 'line-through' : ''}>{date.day}</span>
                      {status.isCustom && (
                        <div className={`mt-1 w-1 h-1 rounded-full ${status.hasSlots ? 'bg-primary w-2 h-0.5' : 'bg-amber-400'}`}></div>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedDate && (
          <DaySettingsModal 
            isOpen={!!selectedDate}
            onClose={() => setSelectedDate(null)}
            date={selectedDate}
            initialIsClosed={selectedOverride ? selectedOverride.isClosed : getDayStatus(
                parseInt(selectedDate.split('-')[2]), 
                parseInt(selectedDate.split('-')[1]) - 1, 
                parseInt(selectedDate.split('-')[0])
            ).isClosed}
            initialSlots={selectedOverride?.slots}
            hasOverride={!!selectedOverride}
            onSave={handleSaveDay}
            onDelete={handleDeleteDay}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
