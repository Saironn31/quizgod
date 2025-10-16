/**
 * Animation Examples
 * Copy-paste examples for common animation patterns
 */

import LoadingSpinner from '@/components/LoadingSpinner';
import SkeletonLoader, { SkeletonCard, SkeletonQuizCard } from '@/components/SkeletonLoader';
import { useToast } from '@/components/NotificationToast';
import { 
  animateListStagger, 
  shakeElement, 
  pulseElement, 
  scrollToElement,
  createRipple 
} from '@/utils/animations';

// ============================================
// EXAMPLE 1: Animated Page Header
// ============================================
export function AnimatedPageHeader() {
  return (
    <div className="glass-card rounded-3xl p-8 md:p-12 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-2 border-white/10 animate-fade-in-down">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-6xl font-black mb-3 animate-fade-in-left">
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-slate-300 text-lg animate-fade-in-left" style={{ animationDelay: '0.1s' }}>
            Welcome back to your learning journey
          </p>
        </div>
        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold hover-lift active:scale-95 transition-all duration-300 shadow-glow animate-scale-in">
          Get Started
        </button>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 2: Animated Stats Grid
// ============================================
export function AnimatedStatsGrid() {
  const stats = [
    { label: 'Total Quizzes', value: 42, color: 'from-blue-500 to-indigo-500' },
    { label: 'Avg Score', value: '87%', color: 'from-emerald-500 to-green-500' },
    { label: 'Streak', value: 7, color: 'from-orange-500 to-amber-500' },
    { label: 'Rank', value: '#12', color: 'from-purple-500 to-violet-500' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="glass-card rounded-2xl p-6 animate-scale-in stagger-item hover-lift cursor-pointer"
        >
          <div className={`text-sm text-slate-400 mb-2`}>{stat.label}</div>
          <div className={`text-4xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// EXAMPLE 3: Loading States
// ============================================
export function LoadingStatesExample() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="space-y-6">
      {/* Full screen loading */}
      {loading && (
        <LoadingSpinner
          size="xl"
          variant="gradient"
          text="Loading your content..."
          fullScreen
        />
      )}

      {/* Inline loading */}
      <div className="glass-card rounded-2xl p-6">
        {loading ? (
          <LoadingSpinner size="md" variant="dots" text="Fetching data..." />
        ) : (
          <div className="animate-fade-in">Content loaded!</div>
        )}
      </div>

      {/* Skeleton loading */}
      <div className="glass-card rounded-2xl p-6">
        {loading ? (
          <SkeletonCard />
        ) : (
          <div className="animate-scale-in">
            <h3 className="text-xl font-bold mb-2">Card Title</h3>
            <p>Card content goes here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 4: Toast Notifications
// ============================================
export function ToastExample() {
  const { showToast, ToastContainer } = useToast();

  const handleSuccess = () => {
    showToast('Quiz saved successfully!', 'success');
  };

  const handleError = () => {
    showToast('Failed to save quiz. Please try again.', 'error');
  };

  const handleWarning = () => {
    showToast('Your session will expire in 5 minutes', 'warning');
  };

  const handleInfo = () => {
    showToast('New feature available! Check it out.', 'info');
  };

  return (
    <>
      <ToastContainer />
      <div className="space-x-4">
        <button onClick={handleSuccess} className="px-4 py-2 bg-green-500 text-white rounded-lg hover-lift">
          Success
        </button>
        <button onClick={handleError} className="px-4 py-2 bg-red-500 text-white rounded-lg hover-lift">
          Error
        </button>
        <button onClick={handleWarning} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover-lift">
          Warning
        </button>
        <button onClick={handleInfo} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover-lift">
          Info
        </button>
      </div>
    </>
  );
}

// ============================================
// EXAMPLE 5: Animated List with Stagger
// ============================================
export function AnimatedListExample() {
  const items = [
    { id: 1, title: 'Mathematics Quiz', score: 95 },
    { id: 2, title: 'Science Quiz', score: 88 },
    { id: 3, title: 'History Quiz', score: 92 },
    { id: 4, title: 'Geography Quiz', score: 85 },
  ];

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="glass-card rounded-xl p-4 flex items-center justify-between animate-fade-in-up stagger-item hover-lift cursor-pointer"
        >
          <div>
            <h3 className="font-bold text-white">{item.title}</h3>
            <p className="text-sm text-slate-400">Completed recently</p>
          </div>
          <div className="text-2xl font-black gradient-text">
            {item.score}%
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// EXAMPLE 6: Interactive Buttons
// ============================================
export function InteractiveButtonsExample() {
  return (
    <div className="space-y-4">
      {/* Primary action button */}
      <button className="
        px-8 py-4 rounded-2xl
        bg-gradient-to-r from-cyan-500 to-violet-500
        text-white font-bold text-lg
        hover-lift active:scale-95
        transition-all duration-300
        shadow-glow
      ">
        Start Quiz
      </button>

      {/* Secondary button with hover glow */}
      <button className="
        px-6 py-3 rounded-xl
        glass-card
        text-white font-semibold
        hover-glow hover-lift active:scale-95
        transition-all duration-300
      ">
        View Details
      </button>

      {/* Icon button with rotation */}
      <button className="
        w-14 h-14 rounded-full
        bg-gradient-to-br from-emerald-500 to-green-500
        flex items-center justify-center
        text-white text-2xl
        hover-rotate hover-lift active:scale-95
        transition-all duration-300
      ">
        +
      </button>

      {/* Button with ripple effect */}
      <button
        onClick={(e) => createRipple(e, 'rgba(139, 92, 246, 0.5)')}
        className="
          px-6 py-3 rounded-xl
          bg-violet-500
          text-white font-bold
          hover-lift active:scale-95
          transition-all duration-300
          relative overflow-hidden
        "
      >
        Click for Ripple
      </button>
    </div>
  );
}

// ============================================
// EXAMPLE 7: Form with Animations
// ============================================
export function AnimatedFormExample() {
  const { showToast, ToastContainer } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate and show error with shake
    const emailInput = document.getElementById('email') as HTMLElement;
    if (!emailInput.value) {
      shakeElement(emailInput.parentElement);
      setErrors({ email: 'Email is required' });
      return;
    }

    // Success
    showToast('Form submitted successfully!', 'success');
  };

  return (
    <>
      <ToastContainer />
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4 animate-scale-in">
        <h2 className="text-2xl font-bold text-white mb-4">Create Account</h2>
        
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
          <input
            id="email"
            type="email"
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-400 animate-shake">{errors.email}</p>
          )}
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
          <input
            type="password"
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold hover-lift active:scale-95 transition-all duration-300 shadow-glow animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          Create Account
        </button>
      </form>
    </>
  );
}

// ============================================
// EXAMPLE 8: Modal with Animations
// ============================================
export function AnimatedModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="px-6 py-3 bg-violet-500 text-white rounded-xl hover-lift">
        Open Modal
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative z-10 glass-card rounded-3xl p-8 max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black gradient-text animate-fade-in-left">
            Animated Modal
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-2xl transition-all hover-rotate"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-slate-300 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            This modal demonstrates entrance animations with scale and fade effects.
          </p>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setIsOpen(false)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold hover-lift active:scale-95 transition-all animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              Confirm
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="flex-1 py-3 rounded-xl glass-card text-white font-bold hover-lift active:scale-95 transition-all animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 9: Floating Background Orbs
// ============================================
export function FloatingBackgroundExample() {
  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-violet-500/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-500/10 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 p-8">
        <h1 className="text-6xl font-black gradient-text text-center">
          Beautiful Background
        </h1>
      </div>
    </div>
  );
}

// ============================================
// EXAMPLE 10: Quiz Card with Animations
// ============================================
export function AnimatedQuizCardExample() {
  return (
    <div className="glass-card rounded-3xl p-6 animate-slide-up hover-lift cursor-pointer group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white font-bold text-xl group-hover:rotate-12 transition-transform animate-bounce-in">
            M
          </div>
          <div>
            <h3 className="font-bold text-white group-hover:text-cyan-300 transition-colors">
              Mathematics Quiz
            </h3>
            <p className="text-sm text-slate-400">Advanced Calculus</p>
          </div>
        </div>
        <div className="text-2xl font-black gradient-text animate-pulse">
          15
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-300 mb-4">
        <span className="px-3 py-1 rounded-lg bg-white/10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          10 questions
        </span>
        <span className="px-3 py-1 rounded-lg bg-white/10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          15 min
        </span>
      </div>

      <button className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-glow">
        Start Quiz
      </button>
    </div>
  );
}

export default {
  AnimatedPageHeader,
  AnimatedStatsGrid,
  LoadingStatesExample,
  ToastExample,
  AnimatedListExample,
  InteractiveButtonsExample,
  AnimatedFormExample,
  AnimatedModalExample,
  FloatingBackgroundExample,
  AnimatedQuizCardExample,
};
