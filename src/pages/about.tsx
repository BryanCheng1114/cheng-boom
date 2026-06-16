import Head from 'next/head';
import Image from 'next/image';
import { Flame, Star, Shield, Award, Users, TrendingUp, Sparkles, Clock, Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function About() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'about' | 'history' | 'origin'>('about');

  return (
    <>
      <Head>
        <title>{`${t.nav.aboutUs} - Cheng-BOOM`}</title>
      </Head>
      
      <div className="bg-background">
        
        {/* ── NEW ENTRY HERO SECTION ───────────────────────────────────── */}
        <section className="relative h-[25vh] md:h-[55vh] flex items-center justify-center overflow-hidden pt-16 md:pt-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
            style={{ backgroundImage: 'url("/Fireworks GettyImages-636456028.avif")' }}
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
          {/* Smooth blend into the section below */}
          <div className="absolute inset-x-0 bottom-0 h-24 md:h-40 bg-gradient-to-t from-white dark:from-[#0a0a0a] to-transparent z-10" />
          
          <div className="relative z-20 text-center px-4 flex flex-col items-center gap-4 md:gap-6 mt-8 md:mt-16">
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl md:text-8xl font-black text-white tracking-tighter drop-shadow-[0_10px_50px_rgba(0,0,0,0.5)] uppercase"
            >
              {t.nav.aboutUs || 'ABOUT US'}
            </motion.h1>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="hidden md:flex flex-col items-center gap-4 text-white/80"
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

        {/* ── ABOUT TEXT SECTION ─────────────────────────── */}
        <section className="bg-white dark:bg-[#0a0a0a] py-12 md:py-32">
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 flex flex-col md:flex-row gap-8 md:gap-32">
            
            {/* Left Sidebar (Tabs) */}
            <div className="md:w-[200px] shrink-0">
              <div className="flex flex-col gap-4 md:gap-6">
                <button 
                  onClick={() => setActiveTab('about')}
                  className={`text-left flex items-center gap-4 font-medium text-[15px] transition-colors relative group ${activeTab === 'about' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                >
                  {activeTab === 'about' && <div className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-zinc-900 dark:bg-white rounded-full" />}
                  <span className={`pl-4 uppercase tracking-wide text-sm ${activeTab === 'about' ? 'font-bold' : 'font-medium'}`}>{t.about.aboutTab || 'About Us'}</span>
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`text-left flex items-center gap-4 font-medium text-[15px] transition-colors relative group ${activeTab === 'history' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                >
                  {activeTab === 'history' && <div className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-zinc-900 dark:bg-white rounded-full" />}
                  <span className={`pl-4 uppercase tracking-wide text-sm ${activeTab === 'history' ? 'font-bold' : 'font-medium'}`}>{t.about.historyTab || 'Our History'}</span>
                </button>
                <button 
                  onClick={() => setActiveTab('origin')}
                  className={`text-left flex items-center gap-4 font-medium text-[15px] transition-colors relative group ${activeTab === 'origin' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                >
                  {activeTab === 'origin' && <div className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-zinc-900 dark:bg-white rounded-full" />}
                  <span className={`pl-4 uppercase tracking-wide text-sm ${activeTab === 'origin' ? 'font-bold' : 'font-medium'}`}>{t.about.originTab || 'Our Origin'}</span>
                </button>
              </div>
            </div>

            {/* Right Content (Text) */}
            <div className="flex-1 text-zinc-700 dark:text-zinc-300 text-[14px] md:text-[16px] leading-[1.8] md:leading-[2] font-light max-w-4xl tracking-wide min-h-[400px]">
              <AnimatePresence mode="wait">
                {activeTab === 'about' && (
                  <motion.div
                    key="about"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    <p>{t.about.p1 || 'At Cheng-BOOM, every spark is a story and every celebration begins with a vision. We provide our customers with premium, hand-selected pyrotechnics to bring their most spectacular moments to life.'}</p>
                    <p>{t.about.p2 || 'Our expertly curated collection of fireworks empowers event planners, families, and professionals to capture the magic of the night sky. From vibrant handheld sparklers to grand finale aerial displays, our products are used to create treasured memories in every corner of the country.'}</p>
                    <p>{t.about.p3 || 'We achieve this through an unwavering commitment to safety, a culture of continuous innovation, and a focus on curating only the highest-quality pyrotechnic designs. Building on the ethos that safety and spectacle go hand-in-hand, our products combine advanced chemistry with mesmerizing visual effects.'}</p>
                    <p>{t.about.p4 || 'Headquartered in Malaysia, Cheng-BOOM benefits from direct access to top-tier manufacturers and a dedicated team of pyrotechnic experts. What started as a passion for celebrations has grown into a trusted provider for commercial and personal events. Today, Cheng-BOOM is redefining how people celebrate.'}</p>
                  </motion.div>
                )}
                {activeTab === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    <p>{t.about.hist_p1 || 'Founded over two decades ago, Cheng-BOOM started as a small family-run pyrotechnic supplier in a modest warehouse.'}</p>
                    <p>{t.about.hist_p2 || 'Through the years, our dedication to quality and safety earned us the trust of major event organizers.'}</p>
                    <p>{t.about.hist_p3 || 'Today, we stand as a leading name in the pyrotechnics industry. From intimate weddings to massive New Year\'s Eve city displays, our history is written in the skies above.'}</p>
                  </motion.div>
                )}
                {activeTab === 'origin' && (
                  <motion.div
                    key="origin"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    <p>{t.about.orig_p1 || 'The spark that started Cheng-BOOM was born from a deep fascination with the alchemy of fireworks.'}</p>
                    <p>{t.about.orig_p2 || 'In our early days, every product was hand-tested and meticulously selected. We believed that a firework wasn\'t just an explosive, but a medium for emotion.'}</p>
                    <p>{t.about.orig_p3 || 'That original passion remains the driving force of our company. The origin of Cheng-BOOM is a testament to what happens when you combine scientific precision with an unyielding love for the spectacular.'}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}


