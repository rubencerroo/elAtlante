import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  disabled = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex justify-between items-center w-full bg-transparent text-left 
          text-base md:text-lg font-light
          border-b pb-2 md:pb-3 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
        `}
        style={{ color: 'var(--admin-text)', borderColor: 'var(--admin-border)' }}
      >
        <span style={!selectedOption ? { color: 'var(--admin-text-muted)' } : undefined}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg 
          className={`size-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl shadow-2xl border overflow-hidden max-h-64 overflow-y-auto"
            style={{ background: 'var(--admin-modal-bg)', borderColor: 'var(--admin-border)' }}
          >
            <div className="py-2">
              {options.length > 0 ? (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full text-left px-5 py-3 text-sm transition-colors
                      ${value === option.value 
                        ? 'bg-primary text-white font-medium' 
                        : 'hover:bg-black/5 dark:hover:bg-white/10'}
                    `}
                    style={value !== option.value ? { color: 'var(--admin-text-secondary)' } : undefined}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-5 py-3 text-sm italic" style={{ color: 'var(--admin-text-muted)' }}>
                  Sin opciones disponibles
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
