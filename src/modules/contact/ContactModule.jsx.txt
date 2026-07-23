import { useState } from 'react';
import { Mail, Phone, MessageCircle, MapPin, Loader2, CheckCircle } from 'lucide-react';
import { api } from '../../services/api.js';
import { Toast } from '../../components/UI.jsx';

const ContactInfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3">
    <div className="w-9 h-9 bg-reads-green-bg rounded-xl flex items-center justify-center flex-shrink-0">
      <Icon size={16} className="text-reads-green" />
    </div>
    <div>
      <p className="text-reads-muted text-xs">{label}</p>
      <p className="text-reads-navy font-semibold text-sm">{value}</p>
    </div>
  </div>
);

export default function ContactModule() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const showToast = (msg, type = 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      return showToast('Please fill in all fields.');
    }
    setLoading(true);
    try {
      await api.support.sendMessage(form);
      setSent(true);
    } catch (e) {
      // Endpoint isn't live yet — be honest instead of pretending the message sent.
      showToast("We couldn't send your message right now — please email us directly instead.");
    } finally { setLoading(false); }
  };

  if (sent) {
    return (
      <div className="px-4 pt-16 text-center animate-fade-in">
        <CheckCircle size={48} className="text-reads-green mx-auto mb-4" />
        <p className="font-black text-reads-navy text-lg">Message Sent!</p>
        <p className="text-reads-muted text-sm mt-2">We'll get back to you as soon as we can.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-8 animate-fade-in">
      <h1 className="font-display font-black text-reads-navy text-2xl mb-1">Contact Us</h1>
      <p className="text-reads-muted text-sm mb-5">We're here to help! Reach out to us anytime.</p>

      <div className="reads-card px-4 mb-5 divide-y divide-gray-50">
        <ContactInfoRow icon={Mail} label="Email" value="support@reads.app" />
        <ContactInfoRow icon={Phone} label="Phone" value="+234 903 123 4567" />
        <ContactInfoRow icon={MessageCircle} label="Live Chat" value="Available 9AM – 6PM" />
        <ContactInfoRow icon={MapPin} label="Address" value="READS HQ, Abuja, Nigeria" />
      </div>

      <div className="reads-card p-4">
        <p className="font-black text-reads-navy text-sm mb-3">Send us a message</p>
        <div className="space-y-3">
          <input className="reads-input" placeholder="Your Name" value={form.name} onChange={set('name')} />
          <input className="reads-input" type="email" placeholder="Your Email" value={form.email} onChange={set('email')} />
          <textarea className="reads-input resize-none" rows={4} placeholder="Your Message"
            value={form.message} onChange={set('message')} />
          <button onClick={submit} disabled={loading}
            className="reads-btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />} Send Message
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
