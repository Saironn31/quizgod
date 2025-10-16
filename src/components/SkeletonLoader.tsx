'use client';

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'circle' | 'button' | 'image' | 'list';
  count?: number;
  className?: string;
}

export default function SkeletonLoader({ 
  variant = 'text', 
  count = 1,
  className = '' 
}: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'text':
        return <div className={`h-4 rounded skeleton ${className}`}></div>;
      
      case 'card':
        return (
          <div className={`glass-card rounded-2xl p-6 space-y-4 ${className}`}>
            <div className="h-6 w-3/4 rounded skeleton"></div>
            <div className="h-4 w-full rounded skeleton"></div>
            <div className="h-4 w-5/6 rounded skeleton"></div>
            <div className="flex gap-2 mt-4">
              <div className="h-10 w-24 rounded skeleton"></div>
              <div className="h-10 w-24 rounded skeleton"></div>
            </div>
          </div>
        );
      
      case 'circle':
        return <div className={`rounded-full skeleton ${className}`}></div>;
      
      case 'button':
        return <div className={`h-12 w-32 rounded-xl skeleton ${className}`}></div>;
      
      case 'image':
        return <div className={`w-full aspect-video rounded-xl skeleton ${className}`}></div>;
      
      case 'list':
        return (
          <div className={`space-y-3 ${className}`}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full skeleton"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 rounded skeleton"></div>
                  <div className="h-3 w-3/4 rounded skeleton"></div>
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-fade-in">
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
}

// Specific skeleton components for common use cases
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={`h-4 rounded skeleton ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        ></div>
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`glass-card rounded-2xl p-6 space-y-4 animate-fade-in ${className}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl skeleton"></div>
        <div className="flex-1">
          <div className="h-5 w-1/2 rounded skeleton mb-2"></div>
          <div className="h-3 w-3/4 rounded skeleton"></div>
        </div>
      </div>
      <div className="h-4 w-full rounded skeleton"></div>
      <div className="h-4 w-5/6 rounded skeleton"></div>
      <div className="flex gap-2 mt-4">
        <div className="h-10 w-24 rounded skeleton"></div>
        <div className="h-10 w-24 rounded skeleton"></div>
      </div>
    </div>
  );
}

export function SkeletonQuizCard({ className = '' }: { className?: string }) {
  return (
    <div className={`glass-card rounded-3xl p-6 space-y-4 animate-slide-up ${className}`}>
      <div className="flex items-center justify-between">
        <div className="h-6 w-1/3 rounded skeleton"></div>
        <div className="w-10 h-10 rounded-lg skeleton"></div>
      </div>
      <div className="h-4 w-full rounded skeleton"></div>
      <div className="h-4 w-2/3 rounded skeleton"></div>
      <div className="flex gap-3 mt-4">
        <div className="flex-1 h-12 rounded-xl skeleton"></div>
        <div className="flex-1 h-12 rounded-xl skeleton"></div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-6 h-6 rounded-full skeleton"></div>
        <div className="h-3 w-24 rounded skeleton"></div>
      </div>
    </div>
  );
}
