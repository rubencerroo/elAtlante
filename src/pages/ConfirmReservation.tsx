import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getReservationById, updateReservation } from '../services/reservationStore';

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
  </svg>
);

const XCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
  </svg>
);

const Loader2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

export default function ConfirmReservation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'not-found'>('loading');

  useEffect(() => {
    async function confirmIt() {
      if (!id) {
        setStatus('error');
        return;
      }

      try {
        const reservation = await getReservationById(id);
        if (!reservation) {
          setStatus('not-found');
          return;
        }

        if (reservation.status === 'confirmed') {
          // Already confirmed
          setStatus('success');
          return;
        }

        const updated = await updateReservation(id, { status: 'confirmed' });
        if (updated) {
          setStatus('success');
          
          // Notify owner via Cloudflare Pages Function
          try {
            const workerUrl = import.meta.env.VITE_WORKER_URL;
            const endpoint = workerUrl && workerUrl !== 'https://elatlantedesancristobal.com' ? `${workerUrl}/notify-owner` : '/notify-owner';
            fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(reservation),
            }).catch(err => console.error('Error triggering owner email:', err));
          } catch (e) {
            console.error('Error notifying owner:', e);
          }
          
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error('Error confirming reservation:', err);
        setStatus('error');
      }
    }

    confirmIt();
  }, [id]);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden p-8 text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">
              Confirmando Reserva...
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Por favor espera un momento.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-fade-in-up">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
              ¡Reserva Confirmada!
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-8">
              Tu reserva ha sido confirmada con éxito. Te esperamos en El Atlante.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors w-full"
            >
              Volver al Inicio
            </button>
          </div>
        )}

        {(status === 'error' || status === 'not-found') && (
          <div className="flex flex-col items-center animate-fade-in-up">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
              {status === 'not-found' ? 'Reserva no encontrada' : 'Error al confirmar'}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-8">
              {status === 'not-found' 
                ? 'El enlace parece ser inválido o la reserva no existe.' 
                : 'Ha ocurrido un error al intentar confirmar tu reserva. Por favor intenta de nuevo más tarde o contáctanos directamente.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors w-full"
            >
              Volver al Inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
