import Head from 'next/head';
import { Flame, Star, Shield, History, Globe, Sparkles } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import Link from 'next/link';

export default function Origin() {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>{`${t.origin.title} - Cheng-BOOM`}</title>
      </Head>
      
      <div className="relative overflow-hidden pt-16 pb-24">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tight mb-8">
              {t.origin.title}.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {t.origin.desc}
            </p>
          </div>

          {/* ── OUR ORIGIN SECTION ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-8">
            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/20 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative rounded-[40px] overflow-hidden border-8 border-white dark:border-zinc-800 shadow-2xl aspect-[4/5]">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: 'url(/5b82645afa1bd4c1188322e304d9b70d.jpg)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-8 left-8">
                  <p className="text-white font-bold text-sm uppercase tracking-widest opacity-80 mb-2">{t.origin.heritageLabel}</p>
                  <h3 className="text-white text-3xl font-black leading-tight">{t.origin.heritageTitle}</h3>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-4 text-primary">
                <h2 className="text-4xl font-black tracking-tight text-foreground">{t.origin.journeyTitle}</h2>
              </div>
              
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  {t.origin.p1}
                </p>
                <p>
                  {t.origin.p2}
                </p>
                <p>
                  {t.origin.p3}
                </p>
              </div>


            </div>
          </div>




        </div>
      </div>
    </>
  );
}
