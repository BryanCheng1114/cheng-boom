import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, ArrowUp, ChevronLeft, ChevronRight, FileCheck, ShieldCheck, Headphones, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

import { useTranslation } from '../hooks/useTranslation';
import { useBusiness } from '../context/BusinessContext';
import { cn } from '../utils/cn';

// Pre-computed CNY gold spark positions (no Math.random — avoids SSR mismatch)
const CNY_SPARKS = [
  { bottom: '5%',  left: '8%',  delay: '0s',    dur: '3.2s', size: 8,  color: '#FCD34D' },
  { bottom: '12%', left: '20%', delay: '0.6s',  dur: '4.1s', size: 6,  color: '#F59E0B' },
  { bottom: '7%',  left: '38%', delay: '1.2s',  dur: '2.9s', size: 10, color: '#FBBF24' },
  { bottom: '15%', left: '55%', delay: '0.3s',  dur: '3.7s', size: 7,  color: '#FCD34D' },
  { bottom: '9%',  left: '70%', delay: '1.8s',  dur: '4.4s', size: 9,  color: '#F59E0B' },
  { bottom: '18%', left: '85%', delay: '0.9s',  dur: '3.0s', size: 6,  color: '#FBBF24' },
  { bottom: '4%',  left: '93%', delay: '2.1s',  dur: '3.8s', size: 8,  color: '#FCD34D' },
  { bottom: '22%', left: '3%',  delay: '1.5s',  dur: '4.8s', size: 5,  color: '#F59E0B' },
  { bottom: '10%', left: '48%', delay: '2.7s',  dur: '3.4s', size: 7,  color: '#EF4444' },
  { bottom: '6%',  left: '62%', delay: '0.4s',  dur: '5.0s', size: 5,  color: '#FCA5A5' },
];

function CnySpark({ bottom, left, delay, dur, size, color }: {
  bottom: string; left: string; delay: string; dur: string; size: number; color: string;
}) {
  return (
    <span
      className="absolute rounded-full opacity-0 pointer-events-none z-[5]"
      style={{
        bottom, left, width: size, height: size,
        backgroundColor: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
        animationName: 'cnySparkRise',
        animationDuration: dur,
        animationTimingFunction: 'ease-out',
        animationIterationCount: 'infinite',
        animationDelay: delay,
      }}
    />
  );
}

function Lantern({ side, size = 1, delay = '0s' }: { side: 'left' | 'right'; size?: number; delay?: string }) {
  const w = Math.round(56 * size);
  const h = Math.round(84 * size);
  const swing = side === 'left' ? 'lanternSwing' : 'lanternSwingR';
  return (
    <div
      className="pointer-events-none select-none"
      style={{ animationName: swing, animationDuration: `${3.5 + size}s`, animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite', animationDelay: delay, transformOrigin: 'top center' }}
    >
      <svg width={w} height={h} viewBox="0 0 56 84" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* String */}
        <line x1="28" y1="0" x2="28" y2="9" stroke="#F4A724" strokeWidth="1.5"/>
        {/* Top ring */}
        <ellipse cx="28" cy="11" rx="10" ry="3.5" fill="#C41E3A" stroke="#F4A724" strokeWidth="1"/>
        {/* Body */}
        <ellipse cx="28" cy="38" rx="20" ry="27" fill="#C41E3A"/>
        {/* Inner warm glow */}
        <ellipse cx="28" cy="34" rx="13" ry="18" fill="#FF8C00" opacity="0.35"/>
        {/* Ribs */}
        <ellipse cx="28" cy="22" rx="14" ry="2" fill="none" stroke="#F4A724" strokeWidth="0.7" opacity="0.7"/>
        <ellipse cx="28" cy="33" rx="20" ry="2.5" fill="none" stroke="#F4A724" strokeWidth="0.7" opacity="0.5"/>
        <ellipse cx="28" cy="44" rx="20" ry="2.5" fill="none" stroke="#F4A724" strokeWidth="0.7" opacity="0.5"/>
        <ellipse cx="28" cy="55" rx="14" ry="2" fill="none" stroke="#F4A724" strokeWidth="0.7" opacity="0.7"/>
        {/* Bottom ring */}
        <ellipse cx="28" cy="65" rx="10" ry="3.5" fill="#C41E3A" stroke="#F4A724" strokeWidth="1"/>
        {/* Tassel strings */}
        <line x1="23" y1="68" x2="21" y2="84" stroke="#F4A724" strokeWidth="1.2"/>
        <line x1="28" y1="68" x2="28" y2="84" stroke="#F4A724" strokeWidth="1.2"/>
        <line x1="33" y1="68" x2="35" y2="84" stroke="#F4A724" strokeWidth="1.2"/>
        {/* Outer flicker glow */}
        <ellipse cx="28" cy="38" rx="20" ry="27" fill="#FF6B00" opacity="0.12"/>
        {/* 福 character */}
        <text x="28" y="43" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#F4A724" opacity="0.9" fontFamily="serif">福</text>
      </svg>
    </div>
  );
}

type Category = {
  id?: string;
  key?: string;
  code?: string;
  name?: string;
  nameZh?: string | null;
  nameMs?: string | null;
  image?: string | null;
  count?: number | null;
};

const tickerItems = [
  '🎆 Child Fireworks', '🎇 Fountains', '✨ Sparklers', '🚀 Skyline',
  '🔥 Dragon Pili', '💥 Firecrackers', '🌟 Spinning', '🎉 Huge Displays',
];

export default function Home() {
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentHeroSlide(prev => (prev + 1) % 3);
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleManualNavigation = useCallback((action: () => void) => {
    action();
    setIsAutoPlaying(false);
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
    }
    // Resume auto-play after 8 seconds of inactivity
    autoPlayTimeoutRef.current = setTimeout(() => {
      setIsAutoPlaying(true);
    }, 8000);
  }, []);

  const nextHeroSlide = () => handleManualNavigation(() => setCurrentHeroSlide(prev => (prev + 1) % 3));
  const prevHeroSlide = () => handleManualNavigation(() => setCurrentHeroSlide(prev => (prev - 1 + 3) % 3));
  const jumpToSlide = (idx: number) => handleManualNavigation(() => setCurrentHeroSlide(idx));

  const mapImageSrc = locale === 'zh' ? '/mapzh.png' : locale === 'ms' ? '/mapms.png' : '/map.png';

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <>
      <Head>
        <title>{`${settings?.businessName || 'Cheng-BOOM'} - Premium Fireworks`}</title>
        <meta name="description" content="Buy premium fireworks online." />
      </Head>

      {/* ===== SECTION 1: HERO CAROUSEL ===== */}
      <section className="relative h-[600px] md:h-[700px] lg:h-[800px] w-full flex overflow-hidden bg-zinc-900 group/slider">
        
        {/* Navigation Arrows */}
        <button 
          onClick={prevHeroSlide}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-all flex items-center justify-center opacity-0 group-hover/slider:opacity-100"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={nextHeroSlide}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-all flex items-center justify-center opacity-0 group-hover/slider:opacity-100"
        >
          <ChevronRight size={24} />
        </button>

        {/* Slide 0: Chinese New Year Default */}
        <div 
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            currentHeroSlide === 0 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        >
          <img src="/home.png" alt="Chinese New Year Fireworks" className="absolute inset-0 z-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent z-[1]" />
          
          <div className="relative z-10 w-full max-w-[1200px] mx-auto h-full flex flex-col justify-center px-8 md:px-12 text-left">
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-2 font-sans">
              {locale === 'zh' ? '欢庆新年！' : locale === 'ms' ? 'Raikan Tahun Baru!' : 'Celebrate New Year!'}
            </h1>
            <p className="text-xl md:text-2xl font-bold text-white/90 mb-5">
              {locale === 'zh' ? '2026 - 马年大吉' : locale === 'ms' ? '2026 - Tahun Kuda' : '2026 - Year of the Horse'}
            </p>
            <p className="text-lg md:text-xl text-white/80 max-w-lg mb-8 font-medium leading-relaxed">
              {locale === 'zh' ? '优质烟花点亮您的庆典，带来安全、璀璨且难忘的记忆。' : locale === 'ms' ? 'Bunga api berkualiti premium untuk menerangi sambutan anda dengan keselamatan, kecemerlangan dan kenangan yang tidak dapat dilupakan.' : 'Premium quality fireworks to light up your celebrations with safety, brilliance and unforgettable memories.'}
            </p>
            <div>
              <Link href="/shop" className="inline-flex items-center justify-center px-8 py-3 bg-[#111] hover:bg-black text-white text-[15px] font-semibold rounded-xl transition-colors border border-white/10">
                {locale === 'zh' ? '立即选购' : locale === 'ms' ? 'Beli Sekarang' : 'Shop Now'}
              </Link>
            </div>
          </div>
        </div>

        {/* Slide 1: Joining Us */}
        <div 
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            currentHeroSlide === 1 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        >
          <img src="/home1.png" alt="Joining Us" className="absolute inset-0 z-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/30 to-transparent z-[1]" />
          
          <div className="relative z-10 w-full max-w-[1200px] mx-auto h-full flex flex-col justify-center items-end px-8 md:px-12 text-right">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-5 font-sans">
              {locale === 'zh' ? <>加入我们的<br />专属会员</> : locale === 'ms' ? <>Sertai Keluarga<br />Eksklusif Kami</> : <>Join Our <br /> Exclusive Family</>}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-lg mb-8 font-medium">
              {locale === 'zh' ? '成为注册会员，享受独家优惠并优先购买我们的优质烟花系列。' : locale === 'ms' ? 'Jadi ahli berdaftar dan nikmati tawaran eksklusif serta akses awal kepada koleksi bunga api premium kami.' : 'Become a registered member and enjoy exclusive deals and early access to our premium fireworks collection.'}
            </p>
            <div>
              <Link href="/login" className="inline-flex items-center justify-center px-8 py-3 bg-[#111] hover:bg-black text-white text-[15px] font-semibold rounded-xl transition-colors border border-white/10">
                {locale === 'zh' ? '立即注册' : locale === 'ms' ? 'Daftar Sekarang' : 'Register Now'}
              </Link>
            </div>
          </div>
        </div>

        {/* Slide 2: Safety Warning */}
        <div 
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            currentHeroSlide === 2 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        >
          <img src="/home2.png" alt="Safety Warning" className="absolute inset-0 z-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent z-[1]" />
          
          <div className="relative z-10 w-full max-w-[1200px] mx-auto h-full flex flex-col justify-center px-8 md:px-12 text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-5 font-sans">
              {locale === 'zh' ? <>璀璨。<br />且安全。</> : locale === 'ms' ? <>Spektakular.<br />Dan Selamat.</> : <>Spectacular. <br /> And Safe.</>}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-lg mb-8 font-medium">
              {locale === 'zh' ? '您的安全是我们的首要任务。阅读我们全面的安全指南，确保安全的烟花体验。' : locale === 'ms' ? 'Keselamatan anda adalah keutamaan kami. Baca panduan keselamatan komprehensif kami untuk memastikan pengalaman piroteknik yang selamat.' : 'Your safety is our priority. Read our comprehensive safety guide to ensure a secure pyrotechnic experience.'}
            </p>
            <div>
              <Link href="/safety" className="inline-flex items-center justify-center px-8 py-3 bg-[#111] hover:bg-black text-white text-[15px] font-semibold rounded-xl transition-colors border border-white/10">
                {locale === 'zh' ? '安全指南' : locale === 'ms' ? 'Panduan Keselamatan' : 'Safety Guide'}
              </Link>
            </div>
          </div>
        </div>

        {/* Xiaomi-style Page Indicators */}
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
          {[0, 1, 2].map(idx => (
            <button
              key={idx}
              onClick={() => jumpToSlide(idx)}
              className={cn(
                "h-[2.5px] transition-all duration-300",
                currentHeroSlide === idx ? "w-10 bg-orange-500" : "w-10 bg-white/40 hover:bg-white/70"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>



      {/* ===== INFO CARDS (Coverage & Safety) - DJI Style ===== */}
      <section className="bg-white py-8 md:py-12">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6 md:gap-8">
          
          {/* Card 1: Coverage (Text Left, Image Right) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-[#F5F5F7] rounded-[32px] md:rounded-[40px] overflow-hidden flex flex-col md:flex-row h-auto min-h-[60vh] md:h-[75vh] lg:h-[85vh]"
          >
            {/* Text Left */}
            <div className="w-full md:w-[50%] p-8 sm:p-10 md:p-12 lg:p-16 flex flex-col justify-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-zinc-900 leading-[1.1] tracking-tight mb-4 md:mb-6 sm:whitespace-nowrap">
                {t.coverage?.title || 'Our Delivery Coverage.'}
              </h2>
              <p className="text-lg md:text-xl text-zinc-600 leading-relaxed font-medium">
                {t.coverage?.desc || 'We exclusively serve customers only in Bintulu. We bring premium fireworks directly to your local celebrations with reliable, safe delivery.'}
              </p>
            </div>
            
            {/* Image Right */}
            <div className="w-full md:w-[50%] relative min-h-[400px] md:min-h-full flex items-center justify-center p-8 md:p-12">
              <div 
                onClick={() => setLightboxSrc(mapImageSrc)}
                className="relative w-full h-full cursor-pointer"
              >
                <Image
                  src={mapImageSrc}
                  alt={t.coverage?.title || 'Bintulu Map'}
                  fill
                  className="object-contain object-center drop-shadow-2xl"
                  sizes="(max-width: 768px) 100vw, 60vw"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <img 
                    src={settings?.watermarkUrl || "/transparent-Background.png"} 
                    className="w-[30%] h-[30%] object-contain opacity-20 select-none mix-blend-multiply dark:mix-blend-screen transition-all duration-700" 
                    alt="" 
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Safety (Image Left, Text Right) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-[#F5F5F7] rounded-[32px] md:rounded-[40px] overflow-hidden flex flex-col md:flex-row h-auto min-h-[60vh] md:h-[75vh] lg:h-[85vh]"
          >
            {/* Image Left (Order 2 on mobile, Order 1 on desktop) */}
            <div className="w-full md:w-[50%] relative min-h-[400px] md:min-h-full flex items-center justify-center p-8 md:p-12 order-2 md:order-1">
              <div 
                onClick={() => setLightboxSrc(locale === 'zh' ? '/safe_guide_zh.png' : '/safe_guide.png')}
                className="relative w-full h-full cursor-pointer"
              >
                <Image
                  src={locale === 'zh' ? '/safe_guide_zh.png' : '/safe_guide.png'}
                  alt={t.safety?.title || 'Safety First, Always'}
                  fill
                  className="object-contain object-center drop-shadow-2xl"
                  sizes="(max-width: 768px) 100vw, 60vw"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <img 
                    src={settings?.watermarkUrl || "/transparent-Background.png"} 
                    className="w-[30%] h-[30%] object-contain opacity-20 select-none mix-blend-multiply dark:mix-blend-screen transition-all duration-700" 
                    alt="" 
                    draggable={false}
                  />
                </div>
              </div>
            </div>

            {/* Text Right (Order 1 on mobile, Order 2 on desktop) */}
            <div className="w-full md:w-[50%] p-8 sm:p-10 md:p-12 lg:p-16 flex flex-col justify-center order-1 md:order-2">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-zinc-900 leading-[1.1] tracking-tight mb-4 md:mb-6 sm:whitespace-nowrap">
                {t.safety?.title || 'Safety First, Always'}
              </h2>
              <p className="text-lg md:text-xl text-zinc-600 leading-relaxed font-medium">
                {t.safety?.desc || 'We deliver joy, but safety is our promise. All our fireworks are strictly tested and approved, ensuring you can enjoy a spectacular and secure celebration.'}
              </p>
            </div>
          </motion.div>

        </div>
      </section>
      {/* ===== SECTION 5: Feature Highlights ===== */}
      <section className="bg-[#F9F9F9] py-16 md:py-24 transition-colors duration-500">
        <div className="w-full mx-auto px-6 sm:px-12 md:px-16 lg:px-24">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif text-zinc-900 leading-tight tracking-tight">{t.features?.title || 'What We Guarantee'}</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-8 lg:gap-12 text-center">
            
            {/* Feature 1 */}
            <div className="flex flex-col items-center justify-center w-full mx-auto aspect-square md:aspect-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-white border border-zinc-200 rounded-2xl group transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 cursor-default">
              <div className="mb-2 md:mb-6 text-zinc-400 md:text-zinc-500 transition-colors duration-300 group-hover:text-zinc-800">
                <FileCheck strokeWidth={1.5} className="w-10 h-10 md:w-14 md:h-14" />
              </div>
              <h3 className="text-[13px] sm:text-sm md:text-[17px] font-bold text-zinc-900 mb-1 md:mb-3 tracking-tight leading-tight">
                {t.features?.licensed || 'Fully Licensed'}
              </h3>
              <p className="text-[11px] sm:text-xs md:text-[15px] text-zinc-500 leading-tight md:leading-relaxed max-w-[160px] md:max-w-[260px]">
                {t.features?.licensedDesc || '100% legal & certified'}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center justify-center w-full mx-auto aspect-square md:aspect-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-white border border-zinc-200 rounded-2xl group transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 cursor-default">
              <div className="mb-2 md:mb-6 text-zinc-400 md:text-zinc-500 transition-colors duration-300 group-hover:text-zinc-800">
                <ShieldCheck strokeWidth={1.5} className="w-10 h-10 md:w-14 md:h-14" />
              </div>
              <h3 className="text-[13px] sm:text-sm md:text-[17px] font-bold text-zinc-900 mb-1 md:mb-3 tracking-tight leading-tight">
                {t.features?.safety || 'Safety Approved'}
              </h3>
              <p className="text-[11px] sm:text-xs md:text-[15px] text-zinc-500 leading-tight md:leading-relaxed max-w-[160px] md:max-w-[260px]">
                {t.features?.safetyDesc || 'Tested & secure'}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center justify-center w-full mx-auto aspect-square md:aspect-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-white border border-zinc-200 rounded-2xl group transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 cursor-default">
              <div className="mb-2 md:mb-6 text-zinc-400 md:text-zinc-500 transition-colors duration-300 group-hover:text-zinc-800">
                <Headphones strokeWidth={1.5} className="w-10 h-10 md:w-14 md:h-14" />
              </div>
              <h3 className="text-[13px] sm:text-sm md:text-[17px] font-bold text-zinc-900 mb-1 md:mb-3 tracking-tight leading-tight">
                {t.features?.support || 'Expert Support'}
              </h3>
              <p className="text-[11px] sm:text-xs md:text-[15px] text-zinc-500 leading-tight md:leading-relaxed max-w-[160px] md:max-w-[260px]">
                {t.features?.supportDesc || 'Always here to help'}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col items-center justify-center w-full mx-auto aspect-square md:aspect-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-white border border-zinc-200 rounded-2xl group transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 cursor-default">
              <div className="mb-2 md:mb-6 text-zinc-400 md:text-zinc-500 transition-colors duration-300 group-hover:text-zinc-800">
                <Truck strokeWidth={1.5} className="w-10 h-10 md:w-14 md:h-14" />
              </div>
              <h3 className="text-[13px] sm:text-sm md:text-[17px] font-bold text-zinc-900 mb-1 md:mb-3 tracking-tight leading-tight">
                {t.features?.fastDelivery || 'Fast Delivery'}
              </h3>
              <p className="text-[11px] sm:text-xs md:text-[15px] text-zinc-500 leading-tight md:leading-relaxed max-w-[160px] md:max-w-[260px]">
                {t.features?.fastDeliveryDesc || 'Nationwide secure shipping'}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ===== LIGHTBOX MODAL ===== */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8"
          onClick={() => setLightboxSrc(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all duration-200 z-10"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          {/* Image container — stop click propagation so clicking image doesn't close */}
          <div
            className="relative w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightboxSrc}
              alt="Expanded view"
              width={1600}
              height={900}
              className="w-full h-auto object-contain"
              priority
            />

            {/* Centered Watermark Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <img 
                src={settings?.watermarkUrl || "/transparent-Background.png"} 
                className="w-[30%] h-[30%] object-contain opacity-30 select-none mix-blend-multiply dark:mix-blend-screen transition-all duration-700" 
                alt="" 
                draggable={false}
              />
            </div>
          </div>

          {/* ESC hint */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/40 font-medium">
            {t.coverage?.escHint || 'Click anywhere outside to close'}
          </p>
        </div>
      )}

      {/* Removed old floating scroll to top button */}
    </>
  );
}
