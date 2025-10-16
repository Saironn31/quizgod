'use client';

import { SelectHTMLAttributes } from 'react';

interface CustomSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  variant?: 'cyan' | 'violet' | 'emerald' | 'orange' | 'pink';
  fullWidth?: boolean;
}

export default function CustomSelect({ 
  label, 
  error, 
  variant = 'cyan',
  fullWidth = true,
  className = '',
  children,
  ...props 
}: CustomSelectProps) {
  
  const variantStyles = {
    cyan: 'focus:ring-cyan-400 focus:border-transparent',
    violet: 'focus:ring-violet-400 focus:border-transparent',
    emerald: 'focus:ring-emerald-400 focus:border-transparent',
    orange: 'focus:ring-orange-400 focus:border-transparent',
    pink: 'focus:ring-pink-400 focus:border-transparent',
  };

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-xs md:text-sm font-semibold text-white mb-2">
          {label}
        </label>
      )}
      <div className="relative group">
        <select
          className={`
            ${fullWidth ? 'w-full' : ''}
            p-2 md:p-3 text-sm md:text-base
            rounded-xl
            bg-white/10 backdrop-blur-sm
            border-2 border-white/20
            text-white placeholder-slate-400
            focus:outline-none focus:ring-2
            ${variantStyles[variant]}
            transition-all duration-200
            hover:bg-white/[0.12] hover:border-white/30
            active:scale-[0.99]
            cursor-pointer
            appearance-none
            [&>option]:bg-slate-800 
            [&>option]:text-white 
            [&>option]:py-2
            [&>option]:px-4
            [&>option]:font-normal
            animate-fade-in
            ${error ? 'border-red-400/50 focus:ring-red-400' : ''}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        
        {/* Custom dropdown arrow with gradient */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-200 group-hover:text-cyan-400">
          <svg 
            className="w-5 h-5 text-slate-300 group-hover:text-cyan-400 group-focus-within:text-cyan-400 transition-colors" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 9l-7 7-7-7" 
            />
          </svg>
        </div>

        {/* Subtle glow effect on focus */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/0 via-cyan-400/0 to-cyan-400/0 opacity-0 group-focus-within:opacity-10 blur-sm transition-opacity duration-300 pointer-events-none -z-10" />
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-red-400 animate-shake">
          {error}
        </p>
      )}
    </div>
  );
}

// Specialized select variants for common use cases
export function SubjectSelect(props: Omit<CustomSelectProps, 'variant' | 'label'>) {
  return <CustomSelect {...props} variant="cyan" label="Subject" />;
}

export function ClassSelect(props: Omit<CustomSelectProps, 'variant' | 'label'>) {
  return <CustomSelect {...props} variant="violet" label="Class" />;
}

export function FilterSelect(props: Omit<CustomSelectProps, 'variant'>) {
  return <CustomSelect {...props} variant="emerald" />;
}
