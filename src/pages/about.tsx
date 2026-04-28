import Head from 'next/head';
import Image from 'next/image';
import { Flame, Star, Shield, Award, Users, TrendingUp, Sparkles, Clock, Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function About() {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>{`${t.nav.aboutUs} - Cheng-BOOM`}</title>
      </Head>
      
      <div className="bg-background">
        
        {/* ── NEW ENTRY HERO SECTION ───────────────────────────────────── */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
            style={{ backgroundImage: 'url("/Fireworks GettyImages-636456028.avif")' }}
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
          
          <div className="relative z-10 text-center px-4 flex flex-col items-center gap-8">
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-[0_10px_50px_rgba(0,0,0,0.5)]"
            >
              {t.nav.aboutUs}
            </motion.h1>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="flex flex-col items-center gap-4 text-white/80"
            >
              <div className="w-[1px] h-16 bg-gradient-to-b from-primary via-primary/50 to-transparent" />
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center gap-2"
              >
                <span className="text-[10px] font-bold tracking-[0.4em] uppercase text-primary">{t.about.exploreStory}</span>
                <ChevronDown size={24} strokeWidth={2} className="text-primary" />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── PREVIOUS HERO SECTION ───────────────────────────────────── */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative py-32 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05),transparent_70%)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h2 className="text-5xl md:text-8xl font-black text-foreground tracking-tighter mb-8 leading-[0.9]">
              {t.about.heroTitle1} <br />
              <span className="text-primary italic">{t.about.heroTitle2}</span>
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground leading-relaxed">
              {t.about.heroDesc}
            </p>
          </div>
        </motion.section>

        {/* ── THE EVOLUTION (PAST VS PRESENT) ─────────────────────────── */}
        <section className="py-24 bg-zinc-50 dark:bg-zinc-900/30 border-y border-border overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
              
              {/* VINTAGE SIDE */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="space-y-8"
              >
                <div className="flex items-center gap-3 text-zinc-400">
                  <Clock size={20} />
                  <span className="text-sm font-black tracking-widest uppercase">{t.about.heritageTitle}</span>
                </div>
                <h2 className="text-4xl font-black tracking-tight text-foreground">{t.about.heritageSub}</h2>
                <div className="relative rounded-3xl overflow-hidden shadow-2xl group border-4 border-white dark:border-zinc-800">
                  <div 
                    className="aspect-[16/10] bg-cover bg-center transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                    style={{ backgroundImage: 'url(/vintage-fireworks-06.avif)' }}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t.about.heritageDesc}
                </p>
              </motion.div>

              {/* MODERN SIDE */}
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="space-y-8 lg:mt-48"
              >
                <div className="flex items-center gap-3 text-primary">
                  <Sparkles size={20} />
                  <span className="text-sm font-black tracking-widest uppercase">{t.about.futureTitle}</span>
                </div>
                <h2 className="text-4xl font-black tracking-tight text-foreground">{t.about.futureSub}</h2>
                <div className="relative rounded-3xl overflow-hidden shadow-2xl group border-4 border-white dark:border-zinc-800">
                  <div 
                    className="aspect-[16/10] bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: 'url(/Roman-Candles-min-1-scaled.jpg)' }}
                  />
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t.about.futureDesc}
                </p>
              </motion.div>

            </div>
          </div>
        </section>


        {/* ── OUR MISSION ─────────────────────────────────────────────── */}
        <section className="relative py-32 text-white overflow-hidden">
           {/* Background Image with Overlay */}
           <div 
             className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
             style={{ backgroundImage: 'url(/ray-hennessy-gdTxVSAE5sk-unsplash.webp)' }}
           />
           <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-[2px]" />
           <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-transparent to-zinc-950" />

           <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
             <motion.h2 
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               transition={{ duration: 1 }}
               className="text-4xl md:text-6xl font-black mb-16 tracking-tighter italic leading-tight"
             >
               "{t.about.missionQuote}"
             </motion.h2>
             <div className="flex flex-wrap justify-center gap-16">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center gap-5 max-w-[220px] group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Shield size={32} />
                  </div>
                  <h4 className="font-black uppercase tracking-[0.2em] text-sm">{t.about.feature1Title}</h4>
                  <p className="text-xs text-zinc-300 text-center leading-relaxed font-medium">{t.about.feature1Desc}</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col items-center gap-5 max-w-[220px] group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Flame size={32} />
                  </div>
                  <h4 className="font-black uppercase tracking-[0.2em] text-sm">{t.about.feature2Title}</h4>
                  <p className="text-xs text-zinc-300 text-center leading-relaxed font-medium">{t.about.feature2Desc}</p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col items-center gap-5 max-w-[220px] group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Star size={32} />
                  </div>
                  <h4 className="font-black uppercase tracking-[0.2em] text-sm">{t.about.feature3Title}</h4>
                  <p className="text-xs text-zinc-300 text-center leading-relaxed font-medium">{t.about.feature3Desc}</p>
                </motion.div>
             </div>
           </div>
        </section>

      </div>
    </>
  );
}


