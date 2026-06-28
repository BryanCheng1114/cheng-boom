import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, ArrowUp, ChevronLeft, ChevronRight, FileCheck, ShieldCheck, Headphones, Truck, Search, ShoppingCart, CreditCard, PackageCheck, PartyPopper, Star, Zap, Clock, BadgeCheck, ThumbsUp, Sparkles, Heart, Diamond, Users, Award, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

import { useTranslation } from '../hooks/useTranslation';
import { useBusiness } from '../context/BusinessContext';
import { cn } from '../utils/cn';
import LightRays from '../components/ui/LightRays';
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

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

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

  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) nextHeroSlide();
    if (distance < -minSwipeDistance) prevHeroSlide();
  };

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
      <section 
        className="relative h-[600px] md:h-[700px] lg:h-[800px] w-full flex overflow-hidden bg-zinc-900 group/slider"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndHandler}
      >
        
        {/* Navigation Arrows */}
        <button 
          onClick={prevHeroSlide}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-all hidden md:flex items-center justify-center opacity-0 group-hover/slider:opacity-100"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={nextHeroSlide}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-all hidden md:flex items-center justify-center opacity-0 group-hover/slider:opacity-100"
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
                currentHeroSlide === idx ? "w-10 bg-black" : "w-10 bg-white/40 hover:bg-white/70"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ===== EXPERTISE / CATEGORIES ===== */}
      <section className="bg-white py-16 md:py-24 overflow-hidden border-b border-zinc-100">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8">
          
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 tracking-tight mb-4">
              {t.home.exploreExpertise}
            </h2>
            <p className="text-base sm:text-lg text-zinc-500 max-w-3xl mx-auto leading-relaxed">
              {t.home.exploreExpertiseDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            
            {/* Card 1 */}
            <div className="group flex flex-col w-full bg-white rounded-none overflow-hidden cursor-default shadow-md hover:shadow-2xl transition-shadow duration-500 border border-zinc-100">
              {/* Top: Image Section */}
              <div className="relative w-full h-[380px] sm:h-[460px] lg:h-[500px] overflow-hidden">
                <Image src="/expertise1.png" alt={t.home.festiveJoy} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-95" />
                
                <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3 tracking-wide drop-shadow-md">
                    {t.home.festiveJoy}
                  </h3>
                  <p className="text-[13px] sm:text-[15px] text-zinc-200 leading-relaxed max-w-[300px]">
                    {t.home.festiveJoyDesc}
                  </p>
                </div>
              </div>

              {/* Bottom: 3 Features (Black & White) */}
              <div className="grid grid-cols-3 gap-4 p-6 sm:p-12 bg-white">
                <div className="flex flex-col items-center text-center">
                  <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-800 mb-3" strokeWidth={1.25} />
                  <h4 className="text-[12px] sm:text-[14px] font-bold text-zinc-900 mb-1 sm:mb-2 leading-tight">{t.home.c1f1Title}</h4>
                  <p className="text-[11px] sm:text-[12px] text-zinc-500 leading-tight">{t.home.c1f1Desc}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-800 mb-3" strokeWidth={1.25} />
                  <h4 className="text-[12px] sm:text-[14px] font-bold text-zinc-900 mb-1 sm:mb-2 leading-tight">{t.home.c1f2Title}</h4>
                  <p className="text-[11px] sm:text-[12px] text-zinc-500 leading-tight">{t.home.c1f2Desc}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-800 mb-3" strokeWidth={1.25} />
                  <h4 className="text-[12px] sm:text-[14px] font-bold text-zinc-900 mb-1 sm:mb-2 leading-tight">{t.home.c1f3Title}</h4>
                  <p className="text-[11px] sm:text-[12px] text-zinc-500 leading-tight">{t.home.c1f3Desc}</p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group flex flex-col w-full bg-white rounded-none overflow-hidden cursor-default shadow-md hover:shadow-2xl transition-shadow duration-500 border border-zinc-100">
              {/* Top: Image Section */}
              <div className="relative w-full h-[380px] sm:h-[460px] lg:h-[500px] overflow-hidden">
                <Image src="/expertise2.png" alt={t.home.professionalEvent} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-95" />
                
                <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3 tracking-wide drop-shadow-md">
                    {t.home.professionalEvent}
                  </h3>
                  <p className="text-[13px] sm:text-[15px] text-zinc-200 leading-relaxed max-w-[300px]">
                    {t.home.professionalEventDesc}
                  </p>
                </div>
              </div>

              {/* Bottom: 3 Features (Black & White) */}
              <div className="grid grid-cols-3 gap-4 p-6 sm:p-12 bg-white">
                <div className="flex flex-col items-center text-center">
                  <Diamond className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-800 mb-3" strokeWidth={1.25} />
                  <h4 className="text-[12px] sm:text-[14px] font-bold text-zinc-900 mb-1 sm:mb-2 leading-tight">{t.home.c2f1Title}</h4>
                  <p className="text-[11px] sm:text-[12px] text-zinc-500 leading-tight">{t.home.c2f1Desc}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-800 mb-3" strokeWidth={1.25} />
                  <h4 className="text-[12px] sm:text-[14px] font-bold text-zinc-900 mb-1 sm:mb-2 leading-tight">{t.home.c2f2Title}</h4>
                  <p className="text-[11px] sm:text-[12px] text-zinc-500 leading-tight">{t.home.c2f2Desc}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Award className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-800 mb-3" strokeWidth={1.25} />
                  <h4 className="text-[12px] sm:text-[14px] font-bold text-zinc-900 mb-1 sm:mb-2 leading-tight">{t.home.c2f3Title}</h4>
                  <p className="text-[11px] sm:text-[12px] text-zinc-500 leading-tight">{t.home.c2f3Desc}</p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group flex flex-col w-full bg-white rounded-none overflow-hidden cursor-default shadow-md hover:shadow-2xl transition-shadow duration-500 border border-zinc-100">
              {/* Top: Image Section */}
              <div className="relative w-full h-[380px] sm:h-[460px] lg:h-[500px] overflow-hidden">
                <Image src="/expertise3.png" alt={t.home.fastDelivery} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-95" />
                
                <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3 tracking-wide drop-shadow-md">
                    {t.home.fastDelivery}
                  </h3>
                  <p className="text-[13px] sm:text-[15px] text-zinc-200 leading-relaxed max-w-[300px]">
                    {t.home.fastDeliveryDesc}
                  </p>
                </div>
              </div>

              {/* Bottom: 3 Features (Black & White) */}
              <div className="grid grid-cols-3 gap-4 p-6 sm:p-12 bg-white">
                <div className="flex flex-col items-center text-center">
                  <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-800 mb-3" strokeWidth={1.25} />
                  <h4 className="text-[12px] sm:text-[14px] font-bold text-zinc-900 mb-1 sm:mb-2 leading-tight">{t.home.c3f1Title}</h4>
                  <p className="text-[11px] sm:text-[12px] text-zinc-500 leading-tight">{t.home.c3f1Desc}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-800 mb-3" strokeWidth={1.25} />
                  <h4 className="text-[12px] sm:text-[14px] font-bold text-zinc-900 mb-1 sm:mb-2 leading-tight">{t.home.c3f2Title}</h4>
                  <p className="text-[11px] sm:text-[12px] text-zinc-500 leading-tight">{t.home.c3f2Desc}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-800 mb-3" strokeWidth={1.25} />
                  <h4 className="text-[12px] sm:text-[14px] font-bold text-zinc-900 mb-1 sm:mb-2 leading-tight">{t.home.c3f3Title}</h4>
                  <p className="text-[11px] sm:text-[12px] text-zinc-500 leading-tight">{t.home.c3f3Desc}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="bg-white py-20 md:py-28 overflow-hidden border-t border-zinc-100 relative">
        <div className="absolute inset-0 pointer-events-none opacity-30 z-0 mix-blend-multiply">
          <LightRays
            raysOrigin="top-center"
            raysColor="#a1a1aa" 
            raysSpeed={0.8}
            lightSpread={1.2}
            rayLength={1.5}
            followMouse={true}
            mouseInfluence={0.1}
            noiseAmount={0.05}
            distortion={0.03}
          />
        </div>
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 md:px-16 relative z-10">

          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center mb-16 md:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 leading-tight tracking-tight mb-4">
              {t.home.howItWorks}
            </h2>
            <p className="text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed">
              {t.home.howItWorksDesc}
            </p>
          </motion.div>

          {/* Horizontal Steps */}
          <div className="relative">
            {/* Background track */}
            <div className="hidden lg:block absolute top-[52px] left-[10%] right-[10%] h-[2px] bg-zinc-100 rounded-full" />
            {/* Animated fill line */}
            <motion.div
              className="hidden lg:block absolute top-[52px] left-[10%] h-[2px] rounded-full bg-zinc-900"
              style={{ right: '10%' }}
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />

            {/* Steps row */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-10 lg:gap-6">
              {[
                {
                  step: "01",
                  icon: <Search className="w-7 h-7" />,
                  title: t.home.step1Title,
                  desc: t.home.step1Desc,
                  delay: 0,
                },
                {
                  step: "02",
                  icon: <ShoppingCart className="w-7 h-7" />,
                  title: t.home.step2Title,
                  desc: t.home.step2Desc,
                  delay: 0.12,
                },
                {
                  step: "03",
                  icon: <FileCheck className="w-7 h-7" />,
                  title: t.home.step3Title,
                  desc: t.home.step3Desc,
                  delay: 0.24,
                },
                {
                  step: "04",
                  icon: <CreditCard className="w-7 h-7" />,
                  title: t.home.step4Title,
                  desc: t.home.step4Desc,
                  delay: 0.36,
                },
                {
                  step: "05",
                  icon: <PartyPopper className="w-7 h-7" />,
                  title: t.home.step5Title,
                  desc: t.home.step5Desc,
                  delay: 0.48,
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.55, delay: step.delay, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center text-center group"
                >
                  {/* Circle node wrapper */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 260, damping: 18, delay: step.delay + 0.18 }}
                    whileHover={{ y: -6 }}
                    className="relative w-[112px] h-[112px] flex items-center justify-center mb-6 z-10 cursor-default"
                  >
                    {/* Outer animated ring */}
                    <motion.div 
                      className="absolute inset-0 rounded-full border-[1.5px] border-zinc-200"
                      initial={{ scale: 1, borderColor: "#e4e4e7" }}
                      whileHover={{ scale: 1.08, borderColor: "#18181b" }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                    
                    {/* Core Solid Circle */}
                    <motion.div 
                      className="relative w-[76px] h-[76px] rounded-full bg-zinc-900 flex items-center justify-center text-white shadow-xl z-10"
                      whileHover={{ scale: 1.06 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
                    >
                      <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.5 }}>
                        {step.icon}
                      </motion.div>
                    </motion.div>

                    {/* Step badge */}
                    <span className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-zinc-200 text-zinc-900 text-[12px] font-black flex items-center justify-center shadow-sm z-20 group-hover:bg-zinc-900 group-hover:text-white group-hover:border-zinc-900 transition-colors duration-300">
                      {step.step}
                    </span>
                  </motion.div>

                  <h3 className="text-[15px] sm:text-base font-bold text-zinc-900 mb-1.5 leading-snug group-hover:text-black transition-colors">{step.title}</h3>
                  <p className="text-[12px] sm:text-[13px] text-zinc-500 leading-relaxed max-w-[140px] group-hover:text-zinc-700 transition-colors">{step.desc}</p>

                  {/* Mobile connector arrow */}
                  {i < 4 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: step.delay + 0.4 }}
                      className="sm:hidden mt-5 text-zinc-300 text-2xl"
                    >
                      ↓
                    </motion.div>
                  )}
                </motion.div>
              ))}
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
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all duration-200 z-10"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
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
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <img
                src={settings?.watermarkUrl || "/transparent-Background.png"}
                className="w-[30%] h-[30%] object-contain opacity-30 select-none mix-blend-multiply dark:mix-blend-screen transition-all duration-700"
                alt=""
                draggable={false}
              />
            </div>
          </div>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/40 font-medium">
            {t.coverage?.escHint || 'Click anywhere outside to close'}
          </p>
        </div>
      )}

    </>
  );
}
