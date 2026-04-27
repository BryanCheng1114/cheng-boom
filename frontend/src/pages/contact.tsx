import Head from 'next/head';
import { Mail, MessageCircle, MapPin, Phone, Send, Globe, Sparkles } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Contact() {
  const { t } = useTranslation();
  const WHATSAPP_NUMBER = '011-1226 9835';
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t.contact.formSuccess);
    setFormState({ name: '', email: '', subject: '', message: '' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <>
      <Head>
        <title>{`${t.nav.contactUs} - Cheng-BOOM`}</title>
      </Head>
      
      <div className="bg-background min-h-screen">
        
        {/* ---- HERO SECTION ---- */}
        <section className="relative pt-32 pb-20 overflow-hidden bg-zinc-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.2),transparent_60%)]" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center"
          >
            <motion.h1 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-9xl font-black text-white tracking-tighter mb-8 leading-[0.8]"
            >
              {t.contact.heroTitle} <br />
              <span className="text-primary italic">{t.contact.heroTitleItalic}</span>
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
            >
              {t.contact.heroDesc}
            </motion.p>
          </motion.div>
        </section>

        {/* ---- CONTENT SECTION ---- */}
        <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12"
          >
            
            {/* LEFT: INFO */}
            <div className="lg:col-span-5 space-y-12">
              <motion.div variants={itemVariants} className="space-y-6">
                <h2 className="text-4xl font-black tracking-tight text-foreground">{t.contact.getInTouch}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t.contact.getInTouchDesc}
                </p>
              </motion.div>

              <div className="space-y-6">
                {/* WhatsApp */}
                <motion.a 
                  variants={itemVariants}
                  href={`https://wa.me/601112269835`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-5 p-6 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-border hover:border-[#25D366] transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[#25D366]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-14 h-14 bg-[#25D366]/10 rounded-xl flex items-center justify-center text-[#25D366] group-hover:scale-110 transition-transform">
                    <MessageCircle size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t.contact.whatsappLabel}</p>
                    <p className="text-lg font-bold text-foreground group-hover:text-[#25D366] transition-colors tracking-tight">{WHATSAPP_NUMBER}</p>
                  </div>
                </motion.a>

                {/* Email */}
                <motion.a 
                  variants={itemVariants}
                  href="mailto:hello@cheng-boom.test"
                  className="flex items-center gap-5 p-6 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-border hover:border-primary transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Mail size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t.contact.emailLabel}</p>
                    <p className="text-lg font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">hello@cheng-boom.test</p>
                  </div>
                </motion.a>

                {/* Studio */}
                <motion.div variants={itemVariants} className="flex items-center gap-5 p-6 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-border">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                    <MapPin size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t.contact.studioLabel}</p>
                    <p className="text-sm font-bold text-foreground leading-snug whitespace-pre-line">{t.contact.studioAddress}</p>
                  </div>
                </motion.div>
              </div>
            </div>


            {/* RIGHT: FORM */}
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-7"
            >
              <div className="p-8 md:p-10 rounded-[40px] bg-zinc-50 dark:bg-white/5 border border-border shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
                
                <h3 className="text-2xl font-black text-foreground mb-8 tracking-tight">{t.contact.sendMessage}</h3>
                
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.contact.formName}</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-6 py-4 rounded-xl bg-white dark:bg-zinc-900 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-foreground"
                        placeholder={t.contact.formNamePlaceholder}
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.contact.formEmail}</label>
                      <input 
                        type="email" 
                        required
                        className="w-full px-6 py-4 rounded-xl bg-white dark:bg-zinc-900 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-foreground"
                        placeholder={t.contact.formEmailPlaceholder}
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.contact.formSubject}</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-6 py-4 rounded-xl bg-white dark:bg-zinc-900 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-foreground"
                      placeholder={t.contact.formSubjectPlaceholder}
                      value={formState.subject}
                      onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.contact.formMessage}</label>
                    <textarea 
                      required
                      rows={5}
                      className="w-full px-6 py-4 rounded-[20px] bg-white dark:bg-zinc-900 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-foreground resize-none"
                      placeholder={t.contact.formMessagePlaceholder}
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    />
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    className="w-full py-5 bg-primary text-zinc-900 rounded-xl font-black text-lg hover:brightness-110 transition-all shadow-2xl flex items-center justify-center gap-3 group"
                  >
                    <Send size={24} strokeWidth={3} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    {t.contact.formSubmit}
                  </motion.button>
                </form>
              </div>
            </motion.div>

          </motion.div>
        </section>
      </div>
    </>
  );
}
