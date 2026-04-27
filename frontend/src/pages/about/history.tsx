import Head from 'next/head';
import { useTranslation } from '../../hooks/useTranslation';
import { Calendar, Award, Zap, ShieldCheck, Globe2, Sparkles, Milestone } from 'lucide-react';

export default function History() {
  const { t } = useTranslation();

  const milestones = (t.history.milestones as any[]).map((m: any, idx: number) => ({
    ...m,
    icon: idx === 0 ? <Sparkles className="w-6 h-6" /> :
          idx === 1 ? <Award className="w-6 h-6" /> :
          idx === 2 ? <Zap className="w-6 h-6" /> :
          idx === 3 ? <ShieldCheck className="w-6 h-6" /> :
          <Globe2 className="w-6 h-6" />,
    color: idx === 0 ? 'from-orange-500 to-yellow-500' :
           idx === 1 ? 'from-blue-500 to-indigo-500' :
           idx === 2 ? 'from-purple-500 to-pink-500' :
           idx === 3 ? 'from-green-500 to-emerald-500' :
           'from-primary to-orange-400'
  }));

  return (
    <>
      <Head>
        <title>{`${t.history.title} ${t.history.titleItalic} - Cheng-BOOM`}</title>
      </Head>
      
      <div className="relative pt-20 pb-32 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-zinc-200 dark:bg-zinc-800 hidden md:block" />
        <div className="absolute top-10 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tight mb-8">
              {t.history.title} <br />
              <span className="text-primary italic">{t.history.titleItalic}</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {t.history.desc}
            </p>
          </div>

          {/* Timeline */}
          <div className="space-y-12 md:space-y-0">
            {milestones.map((item: any, idx: number) => (
              <div key={idx} className={`relative flex flex-col md:flex-row items-center gap-8 mb-24 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                
                {/* Year Bubble (Center) */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-background border-4 border-zinc-200 dark:border-zinc-800 items-center justify-center z-10 shadow-xl group cursor-default">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.color} animate-pulse opacity-20 absolute`} />
                  <span className="text-sm font-black text-foreground">{item.year}</span>
                </div>

                {/* Content Card */}
                <div className="w-full md:w-[45%] group">
                  <div className="p-8 md:p-10 rounded-[40px] bg-white dark:bg-zinc-900 border border-border shadow-sm group-hover:shadow-2xl group-hover:border-primary/30 transition-all duration-500 relative overflow-hidden">
                    {/* Floating Glow */}
                    <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-500`} />
                    
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-lg`}>
                        {item.icon}
                      </div>
                      <div className="md:hidden text-2xl font-black text-primary">{item.year}</div>
                    </div>
                    
                    <h3 className="text-2xl md:text-3xl font-black text-foreground mb-4 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* Spacer for the other side */}
                <div className="hidden md:block w-[45%]" />
              </div>
            ))}
          </div>

          {/* Bottom Legacy Quote */}
          <div className="relative z-10 mt-20 text-center max-w-2xl mx-auto px-8 py-12 rounded-[40px] bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-300 dark:border-zinc-700">
            <p className="text-2xl font-serif italic text-zinc-600 dark:text-zinc-400">
              "{t.history.quote}"
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="w-8 h-px bg-primary" />
              <span className="text-sm font-black uppercase tracking-widest text-foreground">{t.history.leadership}</span>
              <div className="w-8 h-px bg-primary" />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
