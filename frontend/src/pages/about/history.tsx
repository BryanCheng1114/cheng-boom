import Head from 'next/head';
import { useTranslation } from '../../hooks/useTranslation';
import { Calendar, Award, Zap, ShieldCheck, Globe2, Sparkles, Milestone } from 'lucide-react';

export default function History() {
  const { t } = useTranslation();

  const milestones = [
    {
      year: '1982',
      title: 'The Genesis of Light',
      desc: 'In the heart of Liuyang, Master Cheng successfully synthesized the first stable "Golden Rain" formula, achieving a brilliance that set the foundation for the entire industry. This small family workshop would eventually redefine pyrotechnic art.',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'from-orange-500 to-yellow-500'
    },
    {
      year: '1995',
      title: 'International Debut',
      desc: 'Cheng-BOOM made its first appearance on the global stage at the Montreal Pyrotechnics Festival. Our display, "The Dragon’s Breath," won the Gold Jupiter award, signaling the arrival of a new powerhouse in the industry.',
      icon: <Award className="w-6 h-6" />,
      color: 'from-blue-500 to-indigo-500'
    },
    {
      year: '2005',
      title: 'Electronic Innovation',
      desc: 'We pioneered the first proprietary electronic firing system, allow for microsecond precision in multi-layer displays. This technology transitioned us from simple fireworks to complex synchronized aerial symphonies.',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500'
    },
    {
      year: '2015',
      title: 'Sustainable Skies Initiative',
      desc: 'Leading the industry toward environmental responsibility, we launched the first full line of sulfur-free, low-smoke fireworks. This marked our commitment to preserving the air while still coloring the heavens.',
      icon: <ShieldCheck className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500'
    },
    {
      year: '2024',
      title: 'Global Leadership',
      desc: 'With distribution centers in 45 countries and a legacy spanning four decades, Cheng-BOOM remains the gold standard for celebrations worldwide, continuing Master Cheng’s mission to light up the human spirit.',
      icon: <Globe2 className="w-6 h-6" />,
      color: 'from-primary to-orange-400'
    }
  ];

  return (
    <>
      <Head>
        <title>A Legacy of Excellence - Cheng-BOOM</title>
      </Head>
      
      <div className="relative pt-20 pb-32 overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-zinc-200 dark:bg-zinc-800 hidden md:block" />
        <div className="absolute top-10 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-black tracking-widest uppercase mb-6 border border-primary/20">
              <Milestone size={14} /> Our Journey
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tight mb-8">
              Four Decades <br />
              <span className="text-primary italic">of Illumination.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              From a humble hillside workshop to the world's most prestigious pyrotechnic stage. This is the timeline of how we conquered the night.
            </p>
          </div>

          {/* Timeline */}
          <div className="space-y-12 md:space-y-0">
            {milestones.map((item, idx) => (
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
          <div className="mt-20 text-center max-w-2xl mx-auto px-8 py-12 rounded-[40px] bg-zinc-100 dark:bg-white/5 border border-dashed border-zinc-300 dark:border-zinc-700">
            <p className="text-2xl font-serif italic text-zinc-600 dark:text-zinc-400">
              "The night is our canvas, and every explosion is a stroke of history. We continue to build because there are still heavens left to paint."
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="w-8 h-px bg-primary" />
              <span className="text-sm font-black uppercase tracking-widest text-foreground">Cheng-BOOM Leadership</span>
              <div className="w-8 h-px bg-primary" />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
