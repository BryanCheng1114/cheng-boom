import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, ArrowUp, ChevronLeft, ChevronRight, FileCheck, ShieldCheck, Headphones, Truck, Search, ShoppingCart, CreditCard, PackageCheck, PartyPopper, Star, Zap, Clock, BadgeCheck, ThumbsUp, Heart, Diamond, Users, Award, MapPin, Navigation, Phone, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

import { useTranslation } from '../hooks/useTranslation';
import { useBusiness } from '../context/BusinessContext';
import { cn } from '../utils/cn';
import LightRays from '../components/ui/LightRays';
import { ProductCard } from '../components/ui/ProductCard';
// Pre-computed CNY gold spark positions (no Math.random — avoids SSR mismatch)
const CNY_SPARKS = [
  { bottom: '5%', left: '8%', delay: '0s', dur: '3.2s', size: 8, color: '#FCD34D' },
  { bottom: '12%', left: '20%', delay: '0.6s', dur: '4.1s', size: 6, color: '#F59E0B' },
  { bottom: '7%', left: '38%', delay: '1.2s', dur: '2.9s', size: 10, color: '#FBBF24' },
  { bottom: '15%', left: '55%', delay: '0.3s', dur: '3.7s', size: 7, color: '#FCD34D' },
  { bottom: '9%', left: '70%', delay: '1.8s', dur: '4.4s', size: 9, color: '#F59E0B' },
  { bottom: '18%', left: '85%', delay: '0.9s', dur: '3.0s', size: 6, color: '#FBBF24' },
  { bottom: '4%', left: '93%', delay: '2.1s', dur: '3.8s', size: 8, color: '#FCD34D' },
  { bottom: '22%', left: '3%', delay: '1.5s', dur: '4.8s', size: 5, color: '#F59E0B' },
  { bottom: '10%', left: '48%', delay: '2.7s', dur: '3.4s', size: 7, color: '#EF4444' },
  { bottom: '6%', left: '62%', delay: '0.4s', dur: '5.0s', size: 5, color: '#FCA5A5' },
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
        <line x1="28" y1="0" x2="28" y2="9" stroke="#F4A724" strokeWidth="1.5" />
        {/* Top ring */}
        <ellipse cx="28" cy="11" rx="10" ry="3.5" fill="#C41E3A" stroke="#F4A724" strokeWidth="1" />
        {/* Body */}
        <ellipse cx="28" cy="38" rx="20" ry="27" fill="#C41E3A" />
        {/* Inner warm glow */}
        <ellipse cx="28" cy="34" rx="13" ry="18" fill="#FF8C00" opacity="0.35" />
        {/* Ribs */}
        <ellipse cx="28" cy="22" rx="14" ry="2" fill="none" stroke="#F4A724" strokeWidth="0.7" opacity="0.7" />
        <ellipse cx="28" cy="33" rx="20" ry="2.5" fill="none" stroke="#F4A724" strokeWidth="0.7" opacity="0.5" />
        <ellipse cx="28" cy="44" rx="20" ry="2.5" fill="none" stroke="#F4A724" strokeWidth="0.7" opacity="0.5" />
        <ellipse cx="28" cy="55" rx="14" ry="2" fill="none" stroke="#F4A724" strokeWidth="0.7" opacity="0.7" />
        {/* Bottom ring */}
        <ellipse cx="28" cy="65" rx="10" ry="3.5" fill="#C41E3A" stroke="#F4A724" strokeWidth="1" />
        {/* Tassel strings */}
        <line x1="23" y1="68" x2="21" y2="84" stroke="#F4A724" strokeWidth="1.2" />
        <line x1="28" y1="68" x2="28" y2="84" stroke="#F4A724" strokeWidth="1.2" />
        <line x1="33" y1="68" x2="35" y2="84" stroke="#F4A724" strokeWidth="1.2" />
        {/* Outer flicker glow */}
        <ellipse cx="28" cy="38" rx="20" ry="27" fill="#FF6B00" opacity="0.12" />
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
      setCurrentHeroSlide(prev => (prev + 1) % 4);
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

  const nextHeroSlide = () => handleManualNavigation(() => setCurrentHeroSlide(prev => (prev + 1) % 4));
  const prevHeroSlide = () => handleManualNavigation(() => setCurrentHeroSlide(prev => (prev - 1 + 4) % 4));
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
  const [homeProducts, setHomeProducts] = useState<any[]>([]);
  const [homeCategories, setHomeCategories] = useState<any[]>([]);
  const [isLoadingHomeProducts, setIsLoadingHomeProducts] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadHomeProducts = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
        ]);
        const [products, categories] = await Promise.all([
          productsResponse.json(),
          categoriesResponse.json(),
        ]);
        if (cancelled) return;
        setHomeProducts((Array.isArray(products) ? products : [])
          .filter((product: any) =>
            !['Hold', 'Deactive', 'Inactive'].includes(product.status) && Number(product.stock) > 0
          )
          .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .slice(0, 10));
        setHomeCategories(Array.isArray(categories) ? categories : []);
      } catch (error) {
        console.error('Failed to load homepage products:', error);
      } finally {
        if (!cancelled) setIsLoadingHomeProducts(false);
      }
    };
    loadHomeProducts();
    return () => { cancelled = true; };
  }, []);

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
        className="relative w-full h-[540px] sm:h-[620px] md:h-auto md:aspect-[3360/1278] min-h-[460px] md:min-h-0 max-h-[750px] flex overflow-hidden bg-black group/slider"
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

        {/* Slide 0: New Banner (Default First Page) */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-700 bg-black flex items-center justify-center",
            currentHeroSlide === 0 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        >
          {/* Mobile Screen Image (< md) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/banner_new_1.png"
            alt="VIP Fireworks Mobile Banner"
            className="w-full h-full object-cover object-center block md:hidden"
          />

          {/* Desktop / Website View Image (>= md) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/banner_new_1.png"
            alt="VIP Fireworks Banner"
            className="w-full h-full object-cover object-center hidden md:block"
          />
        </div>

        {/* Slide 1: Chinese New Year */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            currentHeroSlide === 1 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        >
          <img src="/home.jpg" alt="Chinese New Year Fireworks" className="hero-drift absolute inset-0 z-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent z-[1]" />

          <div className="relative z-10 w-full max-w-[1200px] mx-auto h-full flex flex-col justify-center px-8 md:px-12 text-left">
            <h1 className="hero-anton-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-2 sm:mb-3">
              {locale === 'zh' ? '欢庆新年！' : locale === 'ms' ? 'RAIKAN TAHUN BARU!' : 'CELEBRATE NEW YEAR'}
            </h1>
            <p className="font-sans tracking-wide text-xs sm:text-sm md:text-base text-white/90 max-w-lg mb-6 sm:mb-8 leading-relaxed">
              {locale === 'zh' ? '优质烟花点亮您的庆典，带来安全、璀璨且难忘的记忆。' : locale === 'ms' ? 'Bunga api berkualiti premium untuk menerangi sambutan anda dengan keselamatan, kecemerlangan dan kenangan yang tidak dapat dilupakan.' : 'Premium quality fireworks to light up your celebrations with safety, brilliance and unforgettable memories.'}
            </p>
            <div>
              <Link href="/shop" className="inline-flex items-center justify-center px-8 py-2.5 bg-black border border-white/20 hover:border-white text-white hover:bg-white hover:text-black text-sm sm:text-base font-semibold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:scale-95 font-sans tracking-wide">
                {locale === 'zh' ? '立即选购' : locale === 'ms' ? 'BELI SEKARANG' : 'SHOP NOW'}
              </Link>
            </div>
          </div>
        </div>

        {/* Slide 2: Joining Us */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            currentHeroSlide === 2 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        >
          <img src="/home1.png" alt="Joining Us" className="hero-drift absolute inset-0 z-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/30 to-transparent z-[1]" />

          <div className="relative z-10 w-full max-w-[1200px] mx-auto h-full flex flex-col justify-center items-end px-8 md:px-12 text-right">
            <h1 className="hero-anton-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-3 sm:mb-5 text-right">
              {locale === 'zh' ? <>加入我们的<br />专属会员</> : locale === 'ms' ? <>SERTAI KELUARGA<br />EKSKLUSIF KAMI</> : <>JOIN OUR <br /> EXCLUSIVE FAMILY</>}
            </h1>
            <p className="font-sans tracking-wide text-xs sm:text-sm md:text-base text-white/90 max-w-lg mb-6 sm:mb-8 leading-relaxed text-right">
              {locale === 'zh' ? '成为注册会员，享受独家优惠并优先购买我们的优质烟花系列。' : locale === 'ms' ? 'Jadi ahli berdaftar dan nikmati tawaran eksklusif serta akses awal kepada koleksi bunga api premium kami.' : 'Become a registered member and enjoy exclusive deals and early access to our premium fireworks collection.'}
            </p>
            <div>
              <Link href="/login" className="inline-flex items-center justify-center px-8 py-2.5 bg-black border border-white/20 hover:border-white text-white hover:bg-white hover:text-black text-sm sm:text-base font-semibold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:scale-95 font-sans tracking-wide">
                {locale === 'zh' ? '立即注册' : locale === 'ms' ? 'DAFTAR SEKARANG' : 'REGISTER NOW'}
              </Link>
            </div>
          </div>
        </div>

        {/* Slide 3: Safety Warning */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            currentHeroSlide === 3 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        >
          <img src="/home2.png" alt="Safety Warning" className="hero-drift absolute inset-0 z-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent z-[1]" />

          <div className="relative z-10 w-full max-w-[1200px] mx-auto h-full flex flex-col justify-center px-8 md:px-12 text-left">
            <h1 className="hero-anton-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-3 sm:mb-5">
              {locale === 'zh' ? <>璀璨。<br />且安全。</> : locale === 'ms' ? <>SPEKTAKLAR.<br />DAN SELAMAT.</> : <>SPECTACULAR. <br /> AND SAFE.</>}
            </h1>
            <p className="font-sans tracking-wide text-xs sm:text-sm md:text-base text-white/90 max-w-lg mb-6 sm:mb-8 leading-relaxed">
              {locale === 'zh' ? '您的安全是我们的首要任务。阅读我们全面的安全指南，确保安全的烟花体验。' : locale === 'ms' ? 'Keselamatan anda adalah keutamaan kami. Baca panduan keselamatan komprehensif kami untuk memastikan pengalaman piroteknik yang selamat.' : 'Your safety is our priority. Read our comprehensive safety guide to ensure a secure pyrotechnic experience.'}
            </p>
            <div>
              <Link href="/safety" className="inline-flex items-center justify-center px-8 py-2.5 bg-black border border-white/20 hover:border-white text-white hover:bg-white hover:text-black text-sm sm:text-base font-semibold rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:scale-95 font-sans tracking-wide">
                {locale === 'zh' ? '安全指南' : locale === 'ms' ? 'PANDUAN KESELAMATAN' : 'SAFETY GUIDE'}
              </Link>
            </div>
          </div>
        </div>

        {/* Xiaomi-style Page Indicators */}
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
          {[0, 1, 2, 3].map(idx => (
            <button
              key={idx}
              onClick={() => jumpToSlide(idx)}
              className={cn(
                "h-[2.5px] transition-all duration-300",
                currentHeroSlide === idx ? "w-10 bg-white shadow-md" : "w-10 bg-white/40 hover:bg-white/70"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ===== SECTION 2: START SHOPPING ===== */}
      <section id="start-shopping" className="relative overflow-hidden bg-white px-4 pb-16 pt-16 sm:px-6 md:pb-24 md:pt-24">
        <div className="relative z-10 mx-auto max-w-[1440px]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10 text-center max-w-2xl mx-auto"
          >
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900 }} className="text-3xl tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
              {locale === 'zh' ? '开始选购' : locale === 'ms' ? 'Mula Membeli-belah' : 'Start Shopping'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">
              {locale === 'zh' ? '精选烟花，为您的下一场庆典带来难忘时刻。' : locale === 'ms' ? 'Pilihan bunga api untuk mencipta detik bermakna dalam sambutan anda.' : 'Discover customer favourites and find something special for your next celebration.'}
            </p>
          </motion.div>

          {isLoadingHomeProducts ? (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5 lg:gap-6">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="h-[280px] sm:h-[340px] animate-pulse rounded-2xl border border-zinc-100 bg-zinc-50 shadow-sm" />
              ))}
            </div>
          ) : homeProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5 lg:gap-6">
              {homeProducts.map((product, index) => {
                const category = homeCategories.find((item) => item.name === product.category);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.45, delay: (index % 5) * 0.05, ease: 'easeOut' }}
                    className="h-full w-full"
                  >
                    <ProductCard {...product} categoryZh={category?.nameZh} categoryMs={category?.nameMs} />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-100 bg-white px-6 py-14 text-center text-zinc-600 shadow-sm">
              {locale === 'zh' ? '商品即将上架，敬请期待。' : locale === 'ms' ? 'Produk akan datang tidak lama lagi.' : 'Products are coming soon. Please check back shortly.'}
            </div>
          )}

          <div className="mt-10 text-center md:mt-12">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 text-base sm:text-lg font-bold text-zinc-900 underline underline-offset-8 decoration-zinc-800 hover:text-red-600 hover:decoration-red-600 transition-colors"
            >
              <span>{locale === 'zh' ? '查看更多' : locale === 'ms' ? 'Terokai lagi' : 'Explore more'}</span>
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>


      {/* ===== SECTION 3: STORE LOCATION & MAP ===== */}
      {(() => {
        const storeAddress = settings?.address?.trim() || 'Bintulu, Sarawak, Malaysia';
        const isCustomLink = storeAddress.startsWith('http://') || storeAddress.startsWith('https://');
        const googleMapsSearchUrl = isCustomLink
          ? storeAddress
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeAddress)}`;
        const embedQuery = isCustomLink ? 'Bintulu, Sarawak, Malaysia' : storeAddress;
        const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(embedQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

        return (
          <section id="location" className="relative overflow-hidden border-t border-zinc-200 bg-white p-0">
            <div className="relative z-10 w-full">
              <div className="grid grid-cols-1 items-stretch gap-0 lg:grid-cols-12">

                {/* Store Info Card (Left) */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="flex flex-col justify-between rounded-none border-y border-l-0 border-r-0 border-zinc-200 bg-zinc-50/70 p-5 sm:p-6 lg:col-span-3 lg:border-r-0"
                >
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
                        {locale === 'zh' ? '欢迎莅临我们的店铺' : locale === 'ms' ? 'Kunjungi Lokasi Kami' : 'Visit Our Store'}
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                        {locale === 'zh' ? '实体店铺 / 服务据点' : locale === 'ms' ? 'Lokasi kedai kami' : 'Store details'}
                      </p>
                      <h3 className="mt-4 text-base font-semibold text-zinc-900">
                        {settings?.businessName || 'Cheng-BOOM'}
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {/* Address */}
                      <div className="flex items-start gap-3.5">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500">
                          <MapPin size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                            {locale === 'zh' ? '地址' : locale === 'ms' ? 'Alamat' : 'Address'}
                          </p>
                          <p className="text-sm font-semibold text-zinc-800 leading-snug mt-0.5">
                            {storeAddress}
                          </p>
                        </div>
                      </div>

                      {/* Opening Hours */}
                      <div className="flex items-start gap-3.5">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500">
                          <Clock size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                            {locale === 'zh' ? '营业时间' : locale === 'ms' ? 'Waktu Operasi' : 'Opening Hours'}
                          </p>
                          <p className="text-sm font-semibold text-zinc-800 leading-snug mt-0.5">
                            {settings?.operatingHours || (locale === 'zh' ? '周一至周日：上午 9:00 - 晚上 10:00' : 'Mon - Sun: 9:00 AM - 10:00 PM')}
                          </p>
                        </div>
                      </div>

                      {/* Contact */}
                      {(settings?.phone || settings?.whatsapp) && (
                        <div className="flex items-start gap-3.5">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500">
                            <Phone size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                              {locale === 'zh' ? '联络电话 / WhatsApp' : locale === 'ms' ? 'Telefon / WhatsApp' : 'Contact'}
                            </p>
                            <p className="text-sm font-semibold text-zinc-800 leading-snug mt-0.5">
                              {settings?.phone || settings?.whatsapp}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Open in Google Maps Button */}
                  <div className="mt-5 border-t border-zinc-200 pt-5">
                    <a
                      href={googleMapsSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
                    >
                      <Navigation size={17} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      <span>{locale === 'zh' ? '在 Google Maps 开启导航' : locale === 'ms' ? 'Buka dalam Google Maps' : 'Open in Google Maps'}</span>
                      <ExternalLink size={15} className="opacity-70 group-hover:opacity-100" />
                    </a>
                  </div>
                </motion.div>

                {/* Map Frame (Right) */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="relative flex min-h-[380px] overflow-hidden rounded-none border-y border-r-0 border-l-0 border-zinc-200 bg-zinc-100 sm:min-h-[460px] lg:col-span-9"
                >
                  <iframe
                    title="Store Location Google Map"
                    src={embedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: '380px' }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full min-h-[380px] sm:min-h-[460px]"
                  />

                  {/* Floating Action Badge on Map */}
                  <a
                    href={googleMapsSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-4 right-4 z-20 inline-flex items-center gap-2 rounded-xl border border-zinc-200/90 bg-white/95 px-3.5 py-2 text-xs font-bold text-zinc-900 shadow-md backdrop-blur-sm transition-all hover:bg-zinc-900 hover:text-white hover:border-zinc-900"
                    title={locale === 'zh' ? '在 Google Maps 查看大地图' : 'Open in Google Maps'}
                  >
                    <Navigation size={14} className="text-red-500" />
                    <span>{locale === 'zh' ? '开启导航' : locale === 'ms' ? 'Buka Peta Penuh' : 'View on Google Maps'}</span>
                    <ExternalLink size={13} />
                  </a>
                </motion.div>
              </div>
            </div>
          </section>
        );
      })()}


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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
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
