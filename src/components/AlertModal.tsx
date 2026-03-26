import { createPortal } from 'react-dom';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'info' | 'error' | 'success' | 'confirm';
  onConfirm: () => void;
  onCancel?: () => void;
}

export function AlertModal({ isOpen, title, message, type = 'info', onConfirm, onCancel }: AlertModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'error': return '⚠️';
      case 'success': return '✅';
      case 'confirm': return '❓';
      default: return 'ℹ️';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'success': return 'text-emerald-400';
      case 'confirm': return 'text-amber-400';
      default: return 'text-primary';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm animate-in fade-in duration-300" 
        style={{ background: 'var(--admin-overlay)' }}
        onClick={onCancel || onConfirm}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-sm border rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        style={{ background: 'var(--admin-modal-bg)', borderColor: 'var(--admin-border)' }}>
        <div className="text-center space-y-4">
          <div className={`text-4xl ${getTypeColor()}`}>
            {getIcon()}
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold" style={{ color: 'var(--admin-text)' }}>{title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--admin-text-secondary)' }}>{message}</p>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl border text-sm font-bold transition-colors"
              style={{ background: 'var(--admin-bg-hover)', borderColor: 'var(--admin-border)', color: 'var(--admin-text-secondary)' }}
            >
              Cancelar
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
              type === 'error' 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                : 'bg-primary hover:bg-primary/90 shadow-primary/20'
            } text-white`}
          >
            {type === 'confirm' ? 'Confirmar' : 'Aceptar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
