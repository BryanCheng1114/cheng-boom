import Head from 'next/head';
import { Flame, Star, Shield, History, Globe, Sparkles } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import Link from 'next/link';

export default function Origin() {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>Our Origin - Cheng-BOOM</title>
      </Head>
      
      <div className="relative overflow-hidden pt-16 pb-24">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-black tracking-[0.2em] uppercase mb-6 border border-primary/20">
              <Sparkles size={14} /> The Legacy of Light
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tight mb-8">
              Our <span className="text-primary">Origin.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              At Cheng-BOOM, we don't just sell fireworks. We manufacture the moments that linger in your memories long after the last spark fades from the sky.
            </p>
          </div>

          {/* ── OUR ORIGIN SECTION ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/20 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative rounded-[40px] overflow-hidden border-8 border-white dark:border-zinc-800 shadow-2xl aspect-[4/5]">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: 'url(/5b82645afa1bd4c1188322e304d9b70d.jpg)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-8 left-8">
                  <p className="text-white font-bold text-sm uppercase tracking-widest opacity-80 mb-2">Heritage</p>
                  <h3 className="text-white text-3xl font-black leading-tight">Master Cheng in the <br />Original Workshop.</h3>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-4 text-primary">
                <History size={32} />
                <h2 className="text-4xl font-black tracking-tight text-foreground">A Journey Through Time</h2>
              </div>
              
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  The story of Cheng-BOOM began in a small, kerosene-lit workshop nestled in the quiet village of Liuyang. Our founder, Master Cheng, was a third-generation chemist who possessed an unusual obsession: he believed that every firework carried a specific emotion.
                </p>
                <p>
                  "A spark isn't just light," he would often say. "It's the heartbeat of a celebration." In 1982, with nothing but a handful of raw materials and a visionary's spirit, he perfected the <strong>'Imperial Gold Dragon'</strong>—a fountain so brilliant it caught the attention of regional authorities, eventually leading to the formation of what is now the most prestigious pyrotechnic brand in the region.
                </p>
                <p>
                  Decades later, we maintain that same artisanal spirit. While our manufacturing processes have evolved into a state-of-the-art global operation, the core philosophy remains unchanged: each unit is tested with the same rigor and passion as that first golden fountain four decades ago.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-8">
                <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-border">
                  <p className="text-4xl font-black text-primary mb-1">40+</p>
                  <p className="text-sm font-bold text-foreground">Years Experience</p>
                </div>
                <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-border">
                  <p className="text-4xl font-black text-primary mb-1">1M+</p>
                  <p className="text-sm font-bold text-foreground">Celebrations Lit</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── CORE VALUES ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-10 bg-card rounded-[40px] border border-border hover:border-primary/50 transition-all hover:-translate-y-2 hover:shadow-2xl shadow-primary/5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Flame size={32} />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-4">Unmatched Brilliance</h3>
              <p className="text-muted-foreground leading-relaxed">
                We use proprietary chemical blends to ensure our colors are more vibrant and our effects last longer than standard market alternatives.
              </p>
            </div>

            <div className="group p-10 bg-card rounded-[40px] border border-border hover:border-primary/50 transition-all hover:-translate-y-2 hover:shadow-2xl shadow-primary/5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Shield size={32} />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-4">Safety First</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every batch undergoes triple-redundancy safety testing. If it isn't safe enough for our own children to watch, it isn't safe enough for you.
              </p>
            </div>

            <div className="group p-10 bg-card rounded-[40px] border border-border hover:border-primary/50 transition-all hover:-translate-y-2 hover:shadow-2xl shadow-primary/5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Globe size={32} />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-4">Global Standards</h3>
              <p className="text-muted-foreground leading-relaxed">
                Operating with certifications across three continents, we meet and exceed international pyrotechnic quality and environmental regulations.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-32 p-12 md:p-20 rounded-[50px] bg-zinc-900 dark:bg-primary text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white dark:text-zinc-900 mb-8 tracking-tight">
                Ready to make your <br />night unforgettable?
              </h2>
              <Link 
                href="/shop" 
                className="inline-flex items-center gap-3 px-10 py-5 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-2xl"
              >
                Browse Our Collection <Globe size={20} />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
