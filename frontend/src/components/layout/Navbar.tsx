import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../cart/CartProvider';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ShoppingCart, ChevronDown, Flame, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { cn } from '../../utils/cn';
import { useTranslation } from '../../hooks/useTranslation';
import { useState, useEffect, useRef } from 'react';
import { useFlyToCart } from '../ui/FlyToCartProvider';

export function Navbar() {
  const { totalItems } = useCart();
  const { registerCelebrationTrigger } = useFlyToCart();
  const router = useRouter();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    registerCelebrationTrigger(() => {
      setIsWiggling(true);
      setShowConfetti(true);
      setTimeout(() => setIsWiggling(false), 500);
      setTimeout(() => setShowConfetti(false), 2000);
    });
  }, [registerCelebrationTrigger]);

  const isActive = (path: string) => router.pathname === path;
  const isActivePrefix = (prefix: string, exclude?: string) =>
    router.pathname.startsWith(prefix) && router.pathname !== exclude;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4">

          {/* ---- Brand ---- */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <Image
              src="/transparent-Background.png"
              alt="Cheng-BOOM Logo"
              width={38}
              height={38}
              className="drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-transform duration-300"
            />
            <span
              className="text-2xl font-black italic tracking-wider bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent group-hover:scale-110 group-hover:-rotate-2 transition-transform duration-300 origin-left inline-block pr-2"
              style={{ fontFamily: "'Impact', 'Arial Black', sans-serif" }}
            >
              Cheng-BOOM
            </span>
          </Link>

          {/* ---- Desktop Nav ---- */}
          <div className="hidden md:flex items-center gap-1">

            {/* Home Page */}
            <Link
              href="/"
              className={cn(
                'relative px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-white/5',
                isActive('/') ? 'text-primary' : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
              )}
            >
              {t.nav.home}
              {isActive('/') && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
              )}
            </Link>

            {/* Shop — with dropdown */}
            <div className="relative group">
              <Link
                href="/shop"
                className={cn(
                  'flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-white/5',
                  isActivePrefix('/shop') ? 'text-primary' : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                )}
              >
                {t.nav.shop}
                <ChevronDown size={13} className="group-hover:rotate-180 transition-transform duration-200 opacity-60" />
              </Link>
              {/* Dropdown */}
              <div className="absolute top-full left-0 pt-2 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-1 group-hover:translate-y-0 transition-all duration-200">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 py-2 overflow-hidden">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    Categories
                  </div>
                  {(['soundcloud','fountain','handheld','spinning','poppop','dragonpili','fireworks','firecrackers','skyline'] as const).map((cat) => (
                    <Link
                      key={cat}
                      href={`/shop?category=${cat}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-primary hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                      {(t.shopCategories as any)[cat]}
                    </Link>
                  ))}
                  <div className="border-t border-zinc-100 dark:border-zinc-800 mx-3 my-1" />
                  <Link
                    href="/shop"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
                  >
                    ✨ {t.shopCategories.all}
                  </Link>
                </div>
              </div>
            </div>

            {/* About Us — with dropdown */}
            <div className="relative group">
              <Link
                href="/about"
                className={cn(
                  'flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-white/5',
                  isActivePrefix('/about') ? 'text-primary' : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
                )}
              >
                {t.nav.aboutUs}
                <ChevronDown size={13} className="group-hover:rotate-180 transition-transform duration-200 opacity-60" />
              </Link>
              <div className="absolute top-full left-0 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-1 group-hover:translate-y-0 transition-all duration-200">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 py-2 overflow-hidden">
                  <Link href="/about/origin" className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-primary hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                    {t.aboutLinks.origin}
                  </Link>
                  <Link href="/about/history" className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-primary hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                    {t.aboutLinks.history}
                  </Link>
                  <div className="border-t border-zinc-100 dark:border-zinc-800 mx-3 my-1" />
                  <Link href="/about" className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                    📖 {t.nav.aboutUs}
                  </Link>
                </div>
              </div>
            </div>

            {/* Contact Us */}
            <Link
              href="/contact"
              className={cn(
                'relative px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-white/5',
                isActive('/contact') ? 'text-primary' : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
              )}
            >
              {t.nav.contact}
              {isActive('/contact') && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          </div>

          {/* ---- Right Actions ---- */}
          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle />

            {/* Cart */}
            <Link
              id="navbar-cart-btn"
              href="/cart"
              className="relative p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
            >
              <motion.div
                animate={isWiggling ? {
                  x: [0, -5, 5, -5, 5, 0],
                  rotate: [0, -10, 10, -10, 10, 0],
                } : {}}
                transition={{ duration: 0.4 }}
              >
                <ShoppingCart size={22} className={cn(isWiggling && "text-primary")} />
              </motion.div>

              {/* Confetti Burst */}
              <AnimatePresence>
                {showConfetti && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                        animate={{ 
                          opacity: 0, 
                          scale: [0, 1.5, 0.5],
                          x: (Math.random() - 0.5) * 100, 
                          y: (Math.random() - 0.5) * 100,
                          rotate: Math.random() * 360
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className={cn(
                          "absolute w-1.5 h-1.5 rounded-full",
                          ["bg-primary", "bg-yellow-400", "bg-orange-500", "bg-red-500"][i % 4]
                        )}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key="cart-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: isWiggling ? [1, 1.5, 1] : 1 }}
                    className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-5 h-5 text-[11px] font-black text-zinc-900 bg-primary rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* ---- Mobile Menu ---- */}
        {mobileOpen && (
          <div className="md:hidden border-t border-zinc-100 dark:border-zinc-800 py-4 space-y-1">
            {[
              { href: '/',        label: t.nav.home },
              { href: '/shop',    label: t.nav.shop },
              { href: '/about',   label: t.nav.aboutUs },
              { href: '/contact', label: t.nav.contact },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-4 py-3 rounded-xl text-sm font-semibold transition-colors',
                  router.pathname === href
                    ? 'bg-primary/10 text-primary'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5'
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
