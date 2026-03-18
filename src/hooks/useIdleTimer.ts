import { useEffect, useCallback, useRef } from 'react';

interface UseIdleTimerProps {
  timeout: number; // in milliseconds
  onIdle: () => void;
  enabled: boolean;
}

export function useIdleTimer({ timeout, onIdle, enabled }: UseIdleTimerProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (enabled) {
      timerRef.current = setTimeout(onIdle, timeout);
    }
  }, [onIdle, timeout, enabled]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    const handleEvent = () => resetTimer();

    events.forEach((event) => {
      document.addEventListener(event, handleEvent);
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleEvent);
      });
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, resetTimer]);

  return { resetTimer };
}
