import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Phone, BookOpen, ShoppingBag } from 'lucide-react';
import { getProducts, categoriesData } from '../utils/mockData';
import { ProductCard } from '../components/ui/ProductCard';
import { useTranslation } from '../hooks/useTranslation';

// Pre-computed spark data — no Math.random() to avoid SSR hydration mismatch
const SPARKS = [
  { bottom: '10%', left: '15%', animationDelay: '0s',   animationDuration: '3.5s' },
  { bottom: '15%', left: '30%', animationDelay: '0.8s',  animationDuration: '4.0s' },
  { bottom: '8%',  left: '50%', animationDelay: '1.4s',  animationDuration: '2.8s' },
  { bottom: '20%', left: '68%', animationDelay: '0.3s',  animationDuration: '3.8s' },
  { bottom: '12%', left: '82%', animationDelay: '1.9s',  animationDuration: '4.5s' },
  { bottom: '25%', left: '8%',  animationDelay: '2.2s',  animationDuration: '3.1s' },
  { bottom: '5%',  left: '92%', animationDelay: '0.6s',  animationDuration: '4.2s' },
];

// Spark particle — uses separate animation props to avoid React style warnings
function Spark({ bottom, left, animationDelay, animationDuration }: {
  bottom: string; left: string; animationDelay: string; animationDuration: string;
}) {
  return (
    <span
      className="absolute w-2 h-2 rounded-full bg-primary opacity-0 pointer-events-none"
      style={{ bottom, left, animationName: 'spark', animationDuration, animationTimingFunction: 'ease-out', animationIterationCount: 'infinite', animationDelay }}
    />
  );
}

const tickerItems = [
  '🎆 Child Fireworks', '🎇 Fountains', '✨ Sparklers', '🚀 Skyline',
  '🔥 Dragon Pili', '💥 Firecrackers', '🌟 Spinning', '🎉 Huge Displays',
];

export default function Home() {
  const featuredProducts = getProducts().slice(0, 3);
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>Cheng-BOOM - Premium Fireworks</title>
        <meta name="description" content="Buy premium fireworks online." />
      </Head>

      {/* ===== SECTION 1: Full-Screen Hero — ALWAYS DARK, no theme toggle ===== */}
      <section className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center overflow-hidden bg-zinc-950 px-4">

        {/* New Year background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 z-0 w-full h-full object-cover scale-105"
          style={{ filter: 'brightness(0.35) saturate(1.2)' }}
        >
          <source src="/video/firework3.mp4" type="video/mp4" />
        </video>

        {/* Dark gradient overlay — stronger at bottom for text readability */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-zinc-950/10" />

        {/* Radial amber glow behind the logo */}
        <div className="absolute inset-0 z-[3] flex items-center justify-center pointer-events-none">
          <div className="w-[550px] h-[550px] bg-primary/12 rounded-full blur-[120px] animate-pulse" />
        </div>

        {/* Floating spark particles */}
        {SPARKS.map((s, i) => <Spark key={i} {...s} />)}

        {/* Subtle dot grid texture */}
        <div
          className="absolute inset-0 z-[3] opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        {/* Bottom vignette fade */}
        <div className="absolute bottom-0 left-0 right-0 h-64 z-[4] pointer-events-none bg-gradient-to-t from-zinc-950 to-transparent" />

        {/* ---- Main Content ---- */}
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center">

          {/* Transparent logo with float + glow */}
          <div className="animate-float mb-10" style={{ filter: 'drop-shadow(0 0 40px rgba(245,158,11,0.65))' }}>
            <Image
              src="/transparent-Background.png"
              alt="Cheng-BOOM Logo"
              width={360}
              height={360}
              priority
            />
          </div>

          {/* Headline */}
          <div className="space-y-4" style={{ animation: 'fade-in-up 0.9s 0.15s ease both' }}>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-snug drop-shadow-xl">
              {t.home.heroTitle1}&nbsp;
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent font-extrabold">
                {t.home.heroTitle2}
              </span>
            </h1>
            <p className="text-sm md:text-base text-zinc-300/90 max-w-lg mx-auto leading-relaxed font-normal">
              {t.home.heroDesc}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center" style={{ animation: 'fade-in-up 0.9s 0.3s ease both' }}>

            {/* Primary — Shop All */}
            <Link
              href="/shop"
              className="group relative inline-flex items-center gap-2.5 px-8 py-3 rounded-2xl font-bold text-sm text-zinc-900 overflow-hidden transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 shadow-[0_4px_24px_rgba(245,158,11,0.45)] hover:shadow-[0_6px_32px_rgba(245,158,11,0.65)]"
              style={{ background: 'linear-gradient(135deg, #facc15 0%, #f97316 60%, #ef4444 100%)' }}
            >
              {/* Shine sweep */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-in-out" />
              <ShoppingBag size={17} className="relative z-10 shrink-0" />
              <span className="relative z-10 tracking-wide">{t.nav.shopAll}</span>
            </Link>

            {/* Divider dot */}
            <span className="hidden sm:block w-1 h-1 rounded-full bg-white/30" />

            {/* Secondary — Contact Us */}
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2.5 px-8 py-3 rounded-2xl font-bold text-sm text-white transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 border border-white/20 hover:border-white/40 hover:bg-white/10"
              style={{ backdropFilter: 'blur(12px)', background: 'rgba(255,255,255,0.07)' }}
            >
              <Phone size={17} className="shrink-0 group-hover:rotate-12 transition-transform duration-300" />
              <span className="tracking-wide">{t.nav.contact}</span>
            </Link>

          </div>
        </div>
      </section>

      {/* ===== TICKER — always bold, looks great in both modes ===== */}
      <div className="relative bg-primary py-3 overflow-hidden border-y border-primary/70">
        <div className="flex animate-marquee whitespace-nowrap gap-16">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="text-sm font-bold text-zinc-900 tracking-widest uppercase px-2">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ===== SECTION 2: Shop All Categories (Full Screen Video) ===== */}
      <section id="shop-categories" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black px-4 py-20">
        
        {/* Background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 z-0 w-full h-full object-cover scale-105"
          style={{ filter: 'brightness(0.3) saturate(1.2)' }}
        >
          <source src="/video/firework2.mp4" type="video/mp4" />
        </video>

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/80 via-black/40 to-black/80" />

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black/50 backdrop-blur-md text-primary text-sm font-bold tracking-widest uppercase mb-6 border border-primary/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              🎆 {t.shop.categoriesTitle}
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg">
              {t.shop.categoriesDesc}
            </h2>
          </div>

          <div className="flex flex-wrap justify-center max-w-5xl mx-auto gap-8 md:gap-14">
            {categoriesData.map((category) => {
              // @ts-ignore - Dynamic key access based on language dictionary
              const title = t.shopCategories[category.key];
              return (
                <Link
                  key={category.id}
                  href={`/shop?category=${category.key}`}
                  className="group flex flex-col items-center gap-4 cursor-pointer transition-all duration-300 hover:scale-[1.15] hover:-translate-y-3 z-0 hover:z-10"
                >
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-full overflow-hidden bg-black/50 backdrop-blur-sm border-4 border-white/10 group-hover:border-primary transition-all duration-300 shadow-xl group-hover:shadow-[0_10px_40px_rgba(245,158,11,0.7)]">
                    <div
                      className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700 ease-out"
                      style={{ backgroundImage: `url(${category.image})` }}
                    />
                    <div className="absolute inset-0 rounded-full border border-white/20 z-10 pointer-events-none" />
                  </div>
                  <span className="font-extrabold text-sm sm:text-base text-white/90 group-hover:text-primary transition-colors text-center uppercase tracking-widest leading-tight drop-shadow-md group-hover:drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">
                    {title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>


    </>
  );
}
