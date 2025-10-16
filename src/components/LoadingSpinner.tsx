'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'gradient';
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  size = 'md', 
  variant = 'spinner',
  text,
  fullScreen = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div className={`${sizeClasses[size]} animate-spin`}>
            <div className="w-full h-full rounded-full border-4 border-slate-700 border-t-cyan-400 border-r-violet-500"></div>
          </div>
        );
      
      case 'dots':
        return (
          <div className="flex gap-2">
            <div className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-6 h-6'} rounded-full bg-cyan-400 animate-bounce`}></div>
            <div className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-6 h-6'} rounded-full bg-violet-500 animate-bounce`} style={{animationDelay: '0.1s'}}></div>
            <div className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-6 h-6'} rounded-full bg-pink-500 animate-bounce`} style={{animationDelay: '0.2s'}}></div>
          </div>
        );
      
      case 'pulse':
        return (
          <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 animate-pulse`}></div>
        );
      
      case 'gradient':
        return (
          <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 animate-spin`}>
            <div className="w-full h-full rounded-full backdrop-blur-sm flex items-center justify-center">
              <div className="w-3/4 h-3/4 rounded-full bg-slate-900"></div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {renderSpinner()}
      {text && (
        <p className={`${textSizeClasses[size]} text-slate-300 font-semibold animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm animate-fade-in">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full filter blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        </div>
        <div className="relative z-10">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
