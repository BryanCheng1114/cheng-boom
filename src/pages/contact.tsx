import Head from 'next/head';
import { Mail, MessageCircle, ArrowUpRight, Sparkles, Zap, Clock } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { motion } from 'framer-motion';

const WHATSAPP_NUMBER = '601112269835';
const COMPANY_EMAIL = 'bryancheng3396@gmail.com';

export default function Contact() {
  const { t } = useTranslation();

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank');
  };

  const handleEmail = () => {
    window.location.href = `mailto:${COMPANY_EMAIL}?subject=Enquiry%20from%20Cheng-BOOM%20Website`;
  };

  return (
    <>
      <Head>
        <title>{`${t.nav.contact} - Cheng-BOOM`}</title>
        <meta
          name="description"
          content="Contact Cheng-BOOM via WhatsApp or Email for fireworks enquiries, bulk pricing, and event planning."
        />
      </Head>

      <div className="min-h-screen bg-background flex flex-col">

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section className="relative flex-1 flex flex-col items-center justify-center pt-28 pb-16 overflow-hidden bg-white dark:bg-black transition-colors duration-300">

          <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-7xl md:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter leading-[0.88] mb-6 transition-colors duration-300"
            >
              {t.contact.heroTitle}
              <br />
              <span className="italic">{t.contact.heroTitleItalic}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22 }}
              className="text-zinc-600 dark:text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed mb-16 transition-colors duration-300"
            >
              {t.contact.heroDesc}
            </motion.p>

            {/* ── TWO CHANNEL CARDS ─────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">

              {/* WhatsApp */}
              <motion.button
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.35 }}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleWhatsApp}
                className="group relative text-left p-8 rounded-3xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 hover:bg-[#25D366]/10 hover:border-[#25D366]/50 transition-all duration-300 overflow-hidden shadow-xl hover:shadow-[0_20px_60px_rgba(37,211,102,0.2)]"
              >
                {/* Shine sweep */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent skew-x-12 pointer-events-none" />

                {/* Online dot */}
                <div className="absolute top-5 right-5 flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#25D366]" />
                  </span>
                  <span className="text-[10px] font-bold text-[#25D366] uppercase tracking-wider">Online</span>
                </div>

                <div className="flex flex-col gap-6 h-full">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#25D366]/25 transition-all duration-300">
                    <MessageCircle size={30} className="text-[#25D366]" strokeWidth={1.8} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">
                      {t.contact.whatsappLabel}
                    </p>
                    <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight mb-3 group-hover:text-[#25D366] transition-colors duration-300">
                      +60 111-226-9835
                    </p>
                    <div className="flex items-center gap-2 text-zinc-500 text-xs">
                      <Zap size={12} className="text-[#25D366]" />
                      <span>{t.contact.whatsappSpeed}</span>
                    </div>
                  </div>

                  {/* CTA row */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#25D366] font-bold text-sm">{t.contact.openWhatsapp}</span>
                    <div className="w-9 h-9 rounded-full bg-[#25D366]/15 border border-[#25D366]/20 flex items-center justify-center group-hover:bg-[#25D366] group-hover:border-[#25D366] transition-all duration-300">
                      <ArrowUpRight size={16} className="text-[#25D366] group-hover:text-zinc-900 transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </motion.button>

              {/* Email */}
              <motion.button
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.45 }}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleEmail}
                className="group relative text-left p-8 rounded-3xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 overflow-hidden shadow-xl hover:shadow-[0_20px_60px_rgba(245,158,11,0.18)]"
              >
                {/* Shine sweep */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent skew-x-12 pointer-events-none" />

                <div className="flex flex-col gap-6 h-full">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/25 transition-all duration-300">
                    <Mail size={30} className="text-primary" strokeWidth={1.8} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">
                      {t.contact.emailLabel}
                    </p>
                    <p className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-3 group-hover:text-primary transition-colors duration-300 break-all">
                      {COMPANY_EMAIL}
                    </p>
                    <div className="flex items-center gap-2 text-zinc-500 text-xs">
                      <Clock size={12} className="text-primary" />
                      <span>{t.contact.emailSpeed}</span>
                    </div>
                  </div>

                  {/* CTA row */}
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold text-sm">{t.contact.openEmail}</span>
                    <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                      <ArrowUpRight size={16} className="text-primary group-hover:text-zinc-900 transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </motion.button>

            </div>

            {/* Bottom note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="text-zinc-600 text-xs mt-10 tracking-wide"
            >
              {t.contact.channelNote}
            </motion.p>
          </div>
        </section>

      </div>
    </>
  );
}
