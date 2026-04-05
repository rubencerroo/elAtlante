import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import SEO from '../components/SEO';

const XCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
  </svg>
);

const AlertCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const Loader2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

type PageStatus = 'loading' | 'cancelled' | 'already-cancelled' | 'error-expired' | 'error-invalid' | 'error-not-cancellable' | 'error-not-found' | 'error-server';

const ERROR_MESSAGES: Record<string, PageStatus> = {
  expired: 'error-expired',
  invalid: 'error-invalid',
  'not-cancellable': 'error-not-cancellable',
  'not-found': 'error-not-found',
  server: 'error-server',
};

export default function CancelReservation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id');
  const error = searchParams.get('error');
  const already = searchParams.get('already');

  const [status, setStatus] = useState<PageStatus>('loading');
  const [reservation, setReservation] = useState<any>(null);

  useEffect(() => {
    async function loadReservation() {
      // Determine status from URL params first
      if (error) {
        setStatus(ERROR_MESSAGES[error] || 'error-server');
        return;
      }

      if (!id) {
        setStatus('error-not-found');
        return;
      }

      // Fetch reservation details to display
      try {
        const { data, error: sbError } = await supabase
          .from('reservations')
          .select('booking_number, name, date, time, guests, preference, status')
          .eq('id', id)
          .single();

        if (sbError || !data) {
          setStatus(already ? 'already-cancelled' : 'cancelled');
          return;
        }

        setReservation(data);
        setStatus(already ? 'already-cancelled' : 'cancelled');
      } catch {
        setStatus(already ? 'already-cancelled' : 'cancelled');
      }
    }

    loadReservation();
  }, [id, error, already]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isErrorState = status.startsWith('error-');
  const isCancelledState = status === 'cancelled' || status === 'already-cancelled';

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <SEO
        title="Cancelación de Reserva - El Atlante"
        description="Gestiona la cancelación de tu reserva en El Atlante de San Cristóbal."
        canonical="/cancelada"
      />
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden p-8 text-center">

        {/* Loading */}
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">
              Procesando cancelación...
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Por favor espera un momento.
            </p>
          </div>
        )}

        {/* Success — cancelled */}
        {isCancelledState && (
          <div className="flex flex-col items-center animate-fade-in-up w-full text-left">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6 mx-auto">
              <XCircle className="w-10 h-10 text-slate-500 dark:text-slate-300" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 text-center w-full">
              {status === 'already-cancelled' ? 'Reserva ya cancelada' : 'Reserva cancelada'}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mb-8 text-center w-full">
              {status === 'already-cancelled'
                ? 'Esta reserva ya había sido cancelada anteriormente.'
                : 'Tu reserva ha sido cancelada correctamente. Esperamos poder verte pronto en El Atlante.'}
            </p>

            {reservation && (
              <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 mb-8 space-y-4 border border-slate-100 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Localizador</p>
                    <p className="text-slate-900 dark:text-white font-medium line-through opacity-60">
                      {reservation.booking_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">A nombre de</p>
                    <p className="text-slate-900 dark:text-white font-medium">{reservation.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Fecha</p>
                    <p className="text-slate-900 dark:text-white font-medium capitalize">
                      {formatDate(reservation.date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Hora</p>
                    <p className="text-slate-900 dark:text-white font-medium">
                      {reservation.time?.substring(0, 5)} h
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Comensales:</span>
                    <span className="text-slate-900 dark:text-white font-medium">{reservation.guests}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Green banner — make another reservation */}
            <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mb-6 text-center">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                ¿Quieres reservar para otro día?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => navigate('/reservar')}
                className="flex-1 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors"
              >
                Nueva Reserva
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Inicio
              </button>
            </div>
          </div>
        )}

        {/* Error states */}
        {isErrorState && (
          <div className="flex flex-col items-center animate-fade-in-up">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
              {status === 'error-expired' && 'Enlace caducado'}
              {status === 'error-invalid' && 'Enlace no válido'}
              {status === 'error-not-cancellable' && 'No se puede cancelar'}
              {status === 'error-not-found' && 'Reserva no encontrada'}
              {status === 'error-server' && 'Error al cancelar'}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mb-8">
              {status === 'error-expired' &&
                'El enlace de cancelación ha caducado (válido 7 días). Si aún necesitas cancelar, contáctanos directamente.'}
              {status === 'error-invalid' &&
                'El enlace de cancelación no es válido. Por favor, utiliza el enlace original del email.'}
              {status === 'error-not-cancellable' &&
                'Esta reserva ya no puede cancelarse porque ya ha sido procesada. Si hay algún problema, contáctanos.'}
              {status === 'error-not-found' &&
                'No hemos encontrado la reserva. Es posible que ya haya sido cancelada o eliminada.'}
              {status === 'error-server' &&
                'Ha ocurrido un error. Por favor, inténtalo de nuevo más tarde o contáctanos directamente.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <a
                href="tel:+34928000000"
                className="flex-1 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors text-center"
              >
                Llamar al restaurante
              </a>
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Inicio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
