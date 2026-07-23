import { useState } from 'react';
import { Search, ChevronRight, MessageCircle, Coins, School, ShoppingBag, GraduationCap, ArrowLeft } from 'lucide-react';

const TOPICS = [
  {
    key: 'earn-points', icon: Coins, question: 'How to earn points',
    answer: 'You earn $READS points by completing lessons, passing quizzes, maintaining your daily streak, and taking part in tournaments. Points are added to your wallet automatically as soon as an activity is marked complete.',
  },
  {
    key: 'join-school', icon: School, question: 'How to join a school',
    answer: 'Go to More → My School and enter the join code your school gave you, or search for your school by name. Once approved by your school, you\'ll see your classes, fees, and assignments there.',
  },
  {
    key: 'buy-marketplace', icon: ShoppingBag, question: 'How to buy on marketplace',
    answer: 'Open the Marketplace tab, browse or search for a resource, and tap Buy Now. The price is deducted from your $READS wallet balance and the resource unlocks immediately.',
  },
  {
    key: 'book-tutor', icon: GraduationCap, question: 'How to book a tutor',
    answer: 'Go to More → Tutors, browse by subject, and tap a tutor\'s profile to see their rate and availability. Tap Book Session to reserve a slot — payment is held securely until the session is completed.',
  },
];

export default function HelpModule({ onNavigate }) {
  const [search, setSearch] = useState('');
  const [openTopic, setOpenTopic] = useState(null);

  const filtered = TOPICS.filter((t) =>
    !search || t.question.toLowerCase().includes(search.toLowerCase())
  );

  if (openTopic) {
    return (
      <div className="px-4 pt-4 pb-8 animate-fade-in">
        <button onClick={() => setOpenTopic(null)} className="flex items-center gap-1.5 text-reads-muted text-sm font-semibold mb-4">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="w-11 h-11 bg-reads-green-bg rounded-2xl flex items-center justify-center mb-3">
          <openTopic.icon size={20} className="text-reads-green" />
        </div>
        <h1 className="font-display font-black text-reads-navy text-xl mb-3">{openTopic.question}</h1>
        <p className="text-reads-navy text-sm leading-relaxed">{openTopic.answer}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-8 animate-fade-in">
      <h1 className="font-display font-black text-reads-navy text-2xl mb-1">Hi there! 👋</h1>
      <p className="text-reads-muted text-sm mb-4">How can we help you today?</p>

      <div className="relative mb-5">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-reads-muted-light" />
        <input className="reads-input pl-10" placeholder="Search help articles…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <p className="font-black text-reads-navy text-sm mb-2">Popular Topics</p>
      <div className="reads-card px-4 divide-y divide-gray-50 mb-5">
        {filtered.length === 0 ? (
          <p className="text-reads-muted text-sm py-4 text-center">No articles match your search.</p>
        ) : (
          filtered.map((t) => (
            <button key={t.key} onClick={() => setOpenTopic(t)}
              className="flex items-center gap-3 w-full py-3.5 text-left active:scale-98 transition-transform">
              <div className="w-9 h-9 bg-reads-green-bg rounded-xl flex items-center justify-center flex-shrink-0">
                <t.icon size={16} className="text-reads-green" />
              </div>
              <span className="text-reads-navy font-semibold text-sm flex-1">{t.question}</span>
              <ChevronRight size={16} className="text-reads-muted-light flex-shrink-0" />
            </button>
          ))
        )}
      </div>

      <div className="reads-card p-4">
        <p className="font-black text-reads-navy text-sm mb-1">Still need help?</p>
        <p className="text-reads-muted text-xs mb-3">Chat with our support team.</p>
        <button onClick={() => onNavigate?.('contact')}
          className="flex items-center gap-2 text-reads-green font-bold text-sm">
          <MessageCircle size={16} /> Start Chat
        </button>
      </div>
    </div>
  );
}
