import { useState, useEffect } from 'react';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); return 100; }
        // Ease deceleration
        const inc = p < 60 ? 3 : p < 85 ? 1.5 : 0.5;
        return Math.min(100, p + inc);
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-reads-cream relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute w-72 h-72 bg-reads-green/8 rounded-full blur-3xl animate-pulse" />
      <div className="absolute w-48 h-48 bg-reads-gold/8 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: '500ms' }} />

      <div className="relative z-10 flex flex-col items-center gap-5">
        {/* Spinning rings + logo */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-36 h-36 rounded-full border-4 border-transparent border-t-reads-green border-r-reads-green/30 animate-spin" />
          <div
            className="absolute w-28 h-28 rounded-full border-4 border-transparent border-b-reads-gold border-l-reads-gold/30 animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}
          />
          <div className="w-20 h-20 bg-reads-navy rounded-2xl flex items-center justify-center shadow-reads-card">
            <img src="/assets/reads-logo.png" alt="$READS" className="w-12 h-12 object-contain" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-reads-navy font-display font-black text-2xl tracking-tight">$READS</p>
          <p className="text-reads-muted text-xs tracking-widest uppercase mt-1">Learn · Earn · Excel</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200">
        <div
          className="h-full bg-gradient-to-r from-reads-gold via-reads-green to-reads-green-light transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
