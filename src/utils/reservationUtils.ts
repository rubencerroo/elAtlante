/**
 * Utility functions for reservation logic (opening hours, time slots, etc.)
 */

export const RESTAURANT_TIMEZONE = 'Atlantic/Canary';

export const OPENING_HOURS = {
  // Monday, Thursday, Friday, Saturday
  standard: {
    lunch: { start: '13:00', end: '16:00' }, // Service ends around 16:00
    dinner: { start: '20:00', end: '23:00' }, // Service ends around 23:00
    fullRange: { start: '12:30', end: '23:00' }
  },
  sunday: {
    lunch: { start: '13:00', end: '16:30' },
    fullRange: { start: '12:30', end: '16:30' }
  },
  closed: ['martes', 'miercoles']
};

/**
 * Returns today's date in YYYY-MM-DD format for the restaurant's timezone
 */
export function getTodayDateString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: RESTAURANT_TIMEZONE });
}

/**
 * Returns current time in minutes from start of day in the restaurant's timezone
 */
export function getCurrentTimeMinutes(): number {
  const now = new Date();
  const optionsFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: RESTAURANT_TIMEZONE,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const parts = optionsFormatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  return hour * 60 + minute;
}

/**
 * Normalizes a day name to lowercase without accents
 */
export function normalizeDayName(date: Date): string {
  const day = date.toLocaleDateString('es-ES', { weekday: 'long', timeZone: RESTAURANT_TIMEZONE }).toLowerCase();
  return day.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Converts "HH:MM" to minutes from start of day
 */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Checks if the restaurant is open on a given date and time
 */
export function isDateValid(dateStr: string, timeStr: string): boolean {
  if (!dateStr || !timeStr) return false;
  
  const date = new Date(dateStr + 'T12:00:00');
  const normalizedDay = normalizeDayName(date);
  const currentMinutes = timeToMinutes(timeStr);

  if (OPENING_HOURS.closed.includes(normalizedDay)) {
    return false;
  }

  if (normalizedDay === 'domingo') {
    return currentMinutes >= timeToMinutes(OPENING_HOURS.sunday.fullRange.start) && 
           currentMinutes <= timeToMinutes(OPENING_HOURS.sunday.fullRange.end);
  }

  // Monday, Thursday, Friday, Saturday
  return currentMinutes >= timeToMinutes(OPENING_HOURS.standard.fullRange.start) && 
         currentMinutes <= timeToMinutes(OPENING_HOURS.standard.fullRange.end);
}

/**
 * Checks if a reservation time is at least 30 minutes in the future
 */
export function isReservationTimeValid(dateStr: string, timeStr: string): boolean {
  if (!dateStr || !timeStr) return false;
  
  const today = getTodayDateString();
  
  // If date is in the past, invalid
  if (dateStr < today) return false;
  
  // If date is today, check 30 minutes buffer
  if (dateStr === today) {
    const reservationMinutes = timeToMinutes(timeStr);
    const limitMinutes = getCurrentTimeMinutes() + 30;
    return reservationMinutes >= limitMinutes;
  }
  
  // Future dates are always valid (as long as they are within opening hours, which is checked by isDateValid)
  return true;
}

/**
 * Checks if a specific date is closed
 */
export function isDayClosed(dateStr: string): boolean {
  if (!dateStr) return true;
  const date = new Date(dateStr + 'T12:00:00');
  const normalizedDay = normalizeDayName(date);
  return OPENING_HOURS.closed.includes(normalizedDay);
}

/**
 * Generates available time slots for a given date
 */
export function getAvailableTimes(dateStr: string, intervalMinutes: number = 30): string[] {
  if (!dateStr) return [];
  
  const date = new Date(dateStr + 'T12:00:00');
  const normalizedDay = normalizeDayName(date);
  
  if (OPENING_HOURS.closed.includes(normalizedDay)) {
    return [];
  }

  const times: string[] = [];
  
  const generateRange = (startStr: string, endStr: string) => {
    let current = timeToMinutes(startStr);
    const end = timeToMinutes(endStr);
    while (current <= end) {
      const h = Math.floor(current / 60).toString().padStart(2, '0');
      const m = (current % 60).toString().padStart(2, '0');
      times.push(`${h}:${m}`);
      current += intervalMinutes;
    }
  };

  if (normalizedDay === 'domingo') {
    generateRange(OPENING_HOURS.sunday.lunch.start, OPENING_HOURS.sunday.lunch.end);
  } else {
    // Lunch
    generateRange(OPENING_HOURS.standard.lunch.start, OPENING_HOURS.standard.lunch.end);
    // Dinner
    generateRange(OPENING_HOURS.standard.dinner.start, OPENING_HOURS.standard.dinner.end);
  }

  // Filter for today's 30-minute buffer
  if (dateStr === getTodayDateString()) {
    const limitMinutes = getCurrentTimeMinutes() + 30;
    return times.filter(t => timeToMinutes(t) >= limitMinutes);
  }

  return times;
}
/**
 * Checks if the restaurant is open right now in the restaurant's timezone
 */
export function isRestaurantOpenNow(): boolean {
  try {
    const now = new Date();
    const optionsFormatter = new Intl.DateTimeFormat('es-ES', {
      timeZone: RESTAURANT_TIMEZONE,
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    
    const parts = optionsFormatter.formatToParts(now);
    const day = parts.find(p => p.type === 'weekday')?.value.toLowerCase();
    const hourStr = parts.find(p => p.type === 'hour')?.value;
    const minuteStr = parts.find(p => p.type === 'minute')?.value;
    
    if (!day || !hourStr || !minuteStr) return false;
    
    const currentMinutes = parseInt(hourStr) * 60 + parseInt(minuteStr);
    
    // remove accents for safe matching
    const normalizedDay = day.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    let start = '';
    let end = '';

    if (OPENING_HOURS.closed.includes(normalizedDay)) {
      return false;
    }

    if (normalizedDay === 'domingo') {
      start = OPENING_HOURS.sunday.fullRange.start;
      end = OPENING_HOURS.sunday.fullRange.end;
    } else {
      // Monday, Thursday, Friday, Saturday
      start = OPENING_HOURS.standard.fullRange.start;
      end = OPENING_HOURS.standard.fullRange.end;
    }

    return currentMinutes >= timeToMinutes(start) && currentMinutes <= timeToMinutes(end);
  } catch (error) {
    console.error("Error calculating open status", error);
    return false;
  }
}
