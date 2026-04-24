import { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Coins, Award } from 'lucide-react';

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Smart Learning',
    desc: 'AI-powered lessons for JAMB, WAEC, NECO, BECE & more',
    color: 'bg-reads-green-bg text-reads-green',
  },
  {
    icon: Coins,
    title: 'Earn $READS Tokens',
    desc: 'Get rewarded with real crypto tokens for every lesson completed',
    color: 'bg-reads-gold/10 text-reads-gold-dark',
  },
  {
    icon: Award,
    title: 'NFT Certificates',
    desc: 'Earn blockchain-verified certificates on Cardano',
    color: 'bg-reads-navy/10 text-reads-navy',
  },
];

export default function WelcomePage({ onGetStarted }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div className="min-h-screen bg-reads-cream flex flex-col overflow-hidden">
      {/* Top gradient accent */}
      <div className="h-1.5 bg-gradient-to-r from-reads-gold via-reads-green to-reads-gold-light" />

      {/* Hero section */}
      <div className="flex-1 flex flex-col justify-between px-6 py-10 max-w-sm mx-auto w-full">
        {/* Logo & tagline */}
        <div className={`text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-24 h-24 bg-reads-navy rounded-3xl flex items-center justify-center shadow-reads-card">
                <span className="font-display font-black text-reads-gold text-4xl">₿</span>
              </div>
              {/* Floating coin */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-reads-gold rounded-full flex items-center justify-center shadow-reads-gold animate-bounce">
                <Coins size={16} className="text-reads-navy" />
              </div>
            </div>
          </div>
          <h1 className="font-display font-black text-reads-navy text-4xl leading-none mb-2">
            $READS
          </h1>
          <p className="text-reads-muted font-semibold tracking-widest text-xs uppercase">
            Learn · Earn · Excel
          </p>
        </div>

        {/* Feature cards */}
        <div className={`space-y-3 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
            <div
              key={title}
              className="flex items-start gap-4 bg-white rounded-2xl p-4 shadow-reads-card border border-gray-50"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="font-bold text-reads-navy text-sm">{title}</p>
                <p className="text-reads-muted text-xs mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={`transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button
            onClick={onGetStarted}
            className="reads-btn-gold w-full flex items-center justify-center gap-2 text-base py-4"
          >
            Get Started <ArrowRight size={20} />
          </button>
          <p className="text-center text-reads-muted text-xs mt-4">
            Nigeria's first blockchain-powered Learn-to-Earn platform
          </p>
        </div>
      </div>
    </div>
  );
}
