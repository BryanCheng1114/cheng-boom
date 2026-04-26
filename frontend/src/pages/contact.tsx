import Head from 'next/head';
import { Mail, MessageCircle, MapPin, Phone, Send, Globe } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useState } from 'react';

export default function Contact() {
  const { t } = useTranslation();
  const WHATSAPP_NUMBER = '011-1226 9835';
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic for form submission
    alert('Message sent successfully! Our team will contact you shortly.');
    setFormState({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <>
      <Head>
        <title>Contact Us - Cheng-BOOM</title>
      </Head>
      
      <div className="relative overflow-hidden">
        
        {/* ---- HERO SECTION ---- */}
        <section className="bg-zinc-950 py-24 md:py-32 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.15),transparent_50%)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black tracking-widest uppercase mb-6 border border-primary/20">
              <Globe size={14} /> Reach Our Experts
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tight mb-8">
              Let's Light Up <br />
              <span className="text-primary italic">Your Night.</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Have questions about a display? Need bulk pricing? Or just want to talk pyrotechnics? Our master technicians are standing by.
            </p>
          </div>
        </section>

        {/* ---- CONTACT GRID ---- */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
            
            {/* LEFT: Contact Info */}
            <div className="lg:col-span-5 space-y-12">
              <div className="space-y-6">
                <h2 className="text-3xl font-black tracking-tight text-foreground">Get in Touch</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We pride ourselves on providing the highest level of service in the industry. Whether you're planning a wedding or a city-wide celebration, we're here to help.
                </p>
              </div>

              <div className="space-y-6">
                {/* WhatsApp */}
                <a 
                  href={`https://wa.me/601112269835`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-6 p-6 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-border hover:border-[#25D366] transition-all group hover:scale-[1.02]"
                >
                  <div className="w-14 h-14 bg-[#25D366]/10 rounded-2xl flex items-center justify-center text-[#25D366]">
                    <MessageCircle size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">WhatsApp Us</p>
                    <p className="text-lg font-bold group-hover:text-[#25D366] transition-colors">{WHATSAPP_NUMBER}</p>
                  </div>
                </a>

                {/* Email */}
                <a 
                  href="mailto:hello@cheng-boom.test"
                  className="flex items-center gap-6 p-6 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-border hover:border-primary transition-all group hover:scale-[1.02]"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Mail size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Send an Email</p>
                    <p className="text-lg font-bold group-hover:text-primary transition-colors">hello@cheng-boom.test</p>
                  </div>
                </a>

                {/* Address */}
                <div className="flex items-center gap-6 p-6 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-border transition-all">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                    <MapPin size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Our Studio</p>
                    <p className="text-sm font-bold text-foreground">Liuyang Industrial Park, Plot 88<br/>Pyrotechnics Avenue, 43200</p>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">Follow Our Displays</p>
                <div className="flex gap-4">
                  <a href="#" className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:border-primary hover:text-zinc-900 transition-all">
                    <Globe size={20} />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:border-primary hover:text-zinc-900 transition-all">
                    <MessageCircle size={20} />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:border-primary hover:text-zinc-900 transition-all">
                    <Mail size={20} />
                  </a>
                </div>
              </div>
            </div>

            {/* RIGHT: Contact Form */}
            <div className="lg:col-span-7">
              <div className="p-8 md:p-12 rounded-[40px] bg-zinc-50 dark:bg-white/5 border border-border shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                
                <h3 className="text-3xl font-black text-foreground mb-8">Send a Message</h3>
                
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                        placeholder="John Doe"
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email Address</label>
                      <input 
                        type="email" 
                        required
                        className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                        placeholder="john@example.com"
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Subject</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                      placeholder="Planning a wedding display..."
                      value={formState.subject}
                      onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Message</label>
                    <textarea 
                      required
                      rows={5}
                      className="w-full px-6 py-4 rounded-3xl bg-white dark:bg-zinc-900 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium resize-none"
                      placeholder="Tell us about your event..."
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-5 bg-primary text-zinc-900 rounded-2xl font-black text-xl hover:brightness-110 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    <Send size={24} strokeWidth={3} />
                    SEND MESSAGE
                  </button>
                </form>
              </div>
            </div>

          </div>
        </section>

      </div>
    </>
  );
}
