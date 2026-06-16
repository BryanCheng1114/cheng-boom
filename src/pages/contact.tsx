import Head from 'next/head';
import { Mail, MessageCircle, ArrowUpRight, Sparkles, Zap, Clock } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { motion } from 'framer-motion';
import { useBusiness } from '../context/BusinessContext';

export default function Contact() {
  const { t } = useTranslation();
  const { settings } = useBusiness();

  const WHATSAPP_NUMBER = settings?.whatsapp || '601112269835';
  const DISPLAY_NUMBER = settings?.phone || '+60 111-226-9835';
  const COMPANY_EMAIL = settings?.email || 'bryancheng3396@gmail.com';
  const BUSINESS_NAME = settings?.businessName || 'Cheng-BOOM';

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`, '_blank');
  };

  const handleEmail = () => {
    window.location.href = `mailto:${COMPANY_EMAIL}?subject=Enquiry%20from%20${encodeURIComponent(BUSINESS_NAME)}%20Website`;
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

      <div className="bg-[#0a0a0a] min-h-screen">

        {/* ── HERO / BACKGROUND ──────────────────────────────────────────────── */}
        <section className="relative h-[25vh] md:h-[55vh] flex items-center justify-center overflow-hidden pt-16 md:pt-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
            style={{ backgroundImage: 'url("/Firework_Photography_1024x.webp")' }}
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          {/* Smooth blend into the section below */}
          <div className="absolute inset-x-0 bottom-0 h-24 md:h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />
          
          <div className="relative z-20 text-center px-4 flex flex-col items-center gap-4 md:gap-6 mt-8 md:mt-16">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-8xl font-black text-white tracking-tighter drop-shadow-[0_10px_50px_rgba(0,0,0,0.5)] uppercase"
            >
              {t.nav.contact || 'CONTACT US'}
            </motion.h1>
          </div>
        </section>

        {/* ── CONTACT CARDS SECTION ─────────────────────────── */}
        <section className="bg-[#0a0a0a] py-12 md:py-24">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            
            {/* ── TWO CHANNEL CARDS ─────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-md md:max-w-none mx-auto" style={{ maxWidth: '1000px' }}>

              {/* WhatsApp */}
              <motion.button
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.35 }}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleWhatsApp}
                className="group relative text-left p-6 md:p-8 xl:p-10 rounded-[1.5rem] md:rounded-[2rem] border border-white/20 bg-white/10 backdrop-blur-xl hover:bg-white/20 hover:border-[#25D366]/50 transition-all duration-300 shadow-2xl hover:shadow-[0_20px_60px_rgba(37,211,102,0.2)] w-full"
              >
                {/* Shine sweep - uses a pseudo element so overflow is not needed on the button */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none rounded-[2rem]" />

                {/* Online dot */}
                <div className="absolute top-4 right-4 md:top-5 md:right-5 flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#25D366]" />
                  </span>
                  <span className="text-[9px] md:text-[10px] font-bold text-[#25D366] uppercase tracking-wider">Online</span>
                </div>

                <div className="flex flex-col gap-4 md:gap-6 h-full">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-[#25D366]/15 border border-[#25D366]/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#25D366]/25 transition-all duration-300">
                    <MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-[#25D366]" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1 md:mb-2">{t.contact.whatsappLabel}</p>
                    <p className="text-lg md:text-xl xl:text-2xl font-black text-white tracking-tight mb-2 md:mb-3 group-hover:text-[#25D366] transition-colors duration-300 break-words">{DISPLAY_NUMBER}</p>
                    <div className="flex items-center gap-2 text-white/60 text-[11px] md:text-xs">
                      <Zap size={12} className="text-[#25D366]" />
                      <span>{t.contact.whatsappSpeed}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 md:mt-0">
                    <span className="text-[#25D366] font-bold text-[13px] md:text-sm">{t.contact.openWhatsapp}</span>
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#25D366]/15 border border-[#25D366]/20 flex items-center justify-center group-hover:bg-[#25D366] group-hover:border-[#25D366] transition-all duration-300">
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
                className="group relative text-left p-6 md:p-8 xl:p-10 rounded-[1.5rem] md:rounded-[2rem] border border-white/20 bg-white/10 backdrop-blur-xl hover:bg-white/20 hover:border-primary/50 transition-all duration-300 shadow-2xl hover:shadow-[0_20px_60px_rgba(245,158,11,0.18)] w-full"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none rounded-[2rem]" />

                <div className="flex flex-col gap-4 md:gap-6 h-full">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/25 transition-all duration-300">
                    <Mail className="w-6 h-6 md:w-8 md:h-8 text-primary" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1 md:mb-2">{t.contact.emailLabel}</p>
                    <p className="text-[14px] sm:text-[15px] md:text-base xl:text-lg font-black text-white tracking-tight mb-2 md:mb-3 group-hover:text-[#FACC15] transition-colors duration-300 break-words line-clamp-1">{COMPANY_EMAIL}</p>
                    <div className="flex items-center gap-2 text-white/60 text-[11px] md:text-xs">
                      <Clock size={12} className="text-primary" />
                      <span>{t.contact.emailSpeed}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 md:mt-0">
                    <span className="text-primary font-bold text-[13px] md:text-sm">{t.contact.openEmail}</span>
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
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
              className="text-white/60 text-xs mt-12 md:mt-16 tracking-wide text-center"
            >
              {t.contact.channelNote}
            </motion.p>
          </div>
        </section>

      </div>
    </>
  );
}
