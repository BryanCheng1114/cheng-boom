import Head from 'next/head';
import Image from 'next/image';
import { Flame, Star, Shield, Award, Users, TrendingUp, Sparkles, Clock, Globe } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import Link from 'next/link';

export default function About() {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>About Us - Cheng-BOOM</title>
      </Head>
      
      <div className="bg-background">
        
        {/* ── HERO SECTION ─────────────────────────────────────────────── */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05),transparent_70%)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-black tracking-widest uppercase mb-8 border border-primary/20">
              <Flame size={14} /> The Art of Pyrotechnics
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-foreground tracking-tighter mb-8 leading-[0.9]">
              PRESERVING TRADITION. <br />
              <span className="text-primary italic">IGNITING INNOVATION.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground leading-relaxed">
              For over four decades, Cheng-BOOM has been the invisible hand behind the world's most breathtaking celebrations, bridging the gap between ancient craftsmanship and future technology.
            </p>
          </div>
        </section>

        {/* ── THE EVOLUTION (PAST VS PRESENT) ─────────────────────────── */}
        <section className="py-24 bg-zinc-50 dark:bg-zinc-900/30 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              
              {/* VINTAGE SIDE */}
              <div className="space-y-8">
                <div className="flex items-center gap-3 text-zinc-400">
                  <Clock size={20} />
                  <span className="text-sm font-black tracking-widest uppercase">The Heritage (1982)</span>
                </div>
                <h2 className="text-4xl font-black tracking-tight text-foreground">Where It All Began</h2>
                <div className="relative rounded-3xl overflow-hidden shadow-2xl group border-4 border-white dark:border-zinc-800">
                  <div 
                    className="aspect-[16/10] bg-cover bg-center transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                    style={{ backgroundImage: 'url(/vintage-fireworks-06.avif)' }}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Our early days were defined by hand-rolled paper tubes and meticulously mixed black powder formulas passed down through generations. The 1980s saw us perfecting the foundational chemistry that remains the standard for safe, vibrant combustion today.
                </p>
              </div>

              {/* MODERN SIDE */}
              <div className="space-y-8 lg:mt-32">
                <div className="flex items-center gap-3 text-primary">
                  <Sparkles size={20} />
                  <span className="text-sm font-black tracking-widest uppercase">The Future (Today)</span>
                </div>
                <h2 className="text-4xl font-black tracking-tight text-foreground">The Modern Standard</h2>
                <div className="relative rounded-3xl overflow-hidden shadow-2xl group border-4 border-white dark:border-zinc-800">
                  <div 
                    className="aspect-[16/10] bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: 'url(/Roman-Candles-min-1-scaled.jpg)' }}
                  />
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Today, we utilize satellite-synchronized ignition systems and eco-friendly, bismuth-based compositions. Our modern Roman candles are a testament to what happens when master craftsmanship meets aerospace-grade precision engineering.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ── CORE STATS / DATA ───────────────────────────────────────── */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-border text-center">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-6">
                  <Award size={24} />
                </div>
                <div className="text-4xl font-black text-foreground mb-1">127+</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Industry Awards</div>
              </div>
              <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-border text-center">
                  <Globe size={24} />
                <div className="text-4xl font-black text-foreground mb-1">45</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Countries Served</div>
              </div>
              <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-border text-center">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6">
                  <Users size={24} />
                </div>
                <div className="text-4xl font-black text-foreground mb-1">10M+</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Smiling Faces</div>
              </div>
              <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-white/5 border border-border text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto mb-6">
                  <TrendingUp size={24} />
                </div>
                <div className="text-4xl font-black text-foreground mb-1">99.9%</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Safety Rating</div>
              </div>
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
             <h2 className="text-4xl md:text-6xl font-black mb-16 tracking-tighter italic leading-tight">
               "We don't just sell fireworks; we build the bridges between the earth and the heavens, <span className="text-primary">one spark at a time.</span>"
             </h2>
             <div className="flex flex-wrap justify-center gap-16">
                <div className="flex flex-col items-center gap-5 max-w-[220px] group">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Shield size={32} />
                  </div>
                  <h4 className="font-black uppercase tracking-[0.2em] text-sm">Certified Safe</h4>
                  <p className="text-xs text-zinc-300 text-center leading-relaxed font-medium">Meeting all international pyrotechnic safety standards with 100% compliance.</p>
                </div>
                <div className="flex flex-col items-center gap-5 max-w-[220px] group">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Flame size={32} />
                  </div>
                  <h4 className="font-black uppercase tracking-[0.2em] text-sm">Pure Color</h4>
                  <p className="text-xs text-zinc-300 text-center leading-relaxed font-medium">Using high-purity minerals to ensure deep, saturated reds and electric blues.</p>
                </div>
                <div className="flex flex-col items-center gap-5 max-w-[220px] group">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Star size={32} />
                  </div>
                  <h4 className="font-black uppercase tracking-[0.2em] text-sm">Pro Support</h4>
                  <p className="text-xs text-zinc-300 text-center leading-relaxed font-medium">Our experts are available 24/7 to help you design the perfect display.</p>
                </div>
             </div>
           </div>
        </section>

      </div>
    </>
  );
}


