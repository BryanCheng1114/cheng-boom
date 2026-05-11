import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../cart/CartProvider';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ShoppingCart, ChevronDown, Flame, Menu, X, User, Sparkles, ChevronRight } from 'lucide-react';
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
  const { t, locale } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(null);
      }
    };
    
    checkUser();
    // Listen for storage changes (for login/logout in other tabs)
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    setUser(null);
    window.location.href = '/';
  };

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

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) setCategories(data);
      })
      .catch(() => {});
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl border-b border-black/5 dark:border-white/5 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center gap-4">

          {/* ---- Brand ---- */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <Image
              src="/transparent-Background.png"
              alt="Cheng-BOOM Logo"
              width={42}
              height={42}
              className="drop-shadow-[0_0_12px_rgba(245,158,11,0.6)] group-hover:scale-110 transition-transform duration-300"
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
                'relative px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300',
                isActive('/') 
                  ? 'text-primary bg-primary/10' 
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10'
              )}
            >
              {t.nav.home}
            </Link>

            {/* Shop — with dropdown */}
            <div className="relative group">
              <Link
                href="/shop"
                className={cn(
                  'flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300',
                  isActivePrefix('/shop') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10'
                )}
              >
                {t.nav.shop}
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300 opacity-70" />
              </Link>
              {/* Dropdown */}
              <div className="absolute top-full left-0 pt-3 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 scale-95 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-300 ease-out origin-top-left z-50">
                <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-700/60 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 py-2 overflow-hidden">
                  <div className="px-4 py-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    Categories
                  </div>
                  {(categories.length > 0 ? categories : [
                    { id: '1', name: 'Soundcloud' },
                    { id: '2', name: 'Fountain' },
                    { id: '3', name: 'Handheld' },
                    { id: '4', name: 'Spinning' },
                    { id: '5', name: 'Pop Pop' },
                    { id: '6', name: 'Dragon Pili' },
                    { id: '7', name: 'Fireworks' },
                    { id: '8', name: 'Firecrackers' },
                    { id: '9', name: 'Skyline' },
                  ]).map((category) => {
                    const key = category.code || category.key || category.name.toLowerCase().replace(/\s+/g, '');
                    
                    let label = category.name;
                    if (locale === 'zh' && category.nameZh) {
                      label = category.nameZh;
                    } else if (locale === 'ms' && category.nameMs) {
                      label = category.nameMs;
                    } else {
                      label = (t.shopCategories as any)[key] || category.name;
                    }

                    return (
                      <Link
                        key={category.id}
                        href={`/shop?category=${key}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-primary hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                        {label}
                      </Link>
                    );
                  })}
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
                  'flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300',
                  isActivePrefix('/about') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10'
                )}
              >
                {t.nav.aboutUs}
                <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300 opacity-70" />
              </Link>
              <div className="absolute top-full left-0 pt-3 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 scale-95 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-300 ease-out origin-top-left z-50">
                <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-700/60 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 py-2 overflow-hidden">
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
                    {t.nav.aboutUs}
                  </Link>
                </div>
              </div>
            </div>

            {/* Contact Us */}
            <Link
              href="/contact"
              className={cn(
                'relative px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300',
                isActive('/contact') 
                  ? 'text-primary bg-primary/10' 
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10'
              )}
            >
              {t.nav.contact}
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
              className="relative p-2.5 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/10 transition-all duration-300"
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
            
            {/* Profile Dropdown */}
            <div className="relative group/profile ml-4 flex items-center">
              {user ? (
                <div className="flex items-center gap-3 cursor-pointer relative">
                  <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-1">{t.nav?.profile?.activeMember || 'Active Member'}</span>
                    <span className="text-sm font-bold text-foreground leading-none">{user.name}</span>
                  </div>
                  
                  {/* Icon Frame */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover/profile:text-primary group-hover/profile:bg-zinc-100 dark:group-hover/profile:bg-white/10 transition-all duration-300">
                    <User size={22} />
                  </div>

                  {/* Invisible Bridge to prevent hover gap */}
                  <div className="absolute -bottom-4 left-0 w-full h-4 z-10" />
                  
                  {/* Dropdown */}
                  <div className="absolute top-[calc(100%+8px)] right-0 w-56 opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible translate-y-2 scale-95 group-hover/profile:translate-y-0 group-hover/profile:scale-100 transition-all duration-300 ease-out origin-top-right z-50">
                    <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-700/60 rounded-[24px] shadow-2xl shadow-black/10 dark:shadow-black/40 py-3 overflow-hidden">
                      <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{t.nav?.profile?.account || 'Account'}</p>
                        <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                      </div>
                      <Link 
                        href="/profile" 
                        className="flex items-center gap-3 px-5 py-3 text-sm text-zinc-600 dark:text-zinc-300 hover:text-primary hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <User size={16} /> {t.nav?.profile?.myProfile || 'My Profile'}
                      </Link>
                      <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-3 my-2" />
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-500 hover:bg-red-500/5 transition-colors"
                      >
                        <X size={16} /> {t.nav?.profile?.logout || 'Logout'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="p-2.5 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-primary hover:bg-zinc-100 dark:hover:bg-white/10 transition-all duration-300 group"
                  title="Sign In"
                >
                  <User size={22} className="group-hover:scale-110 transition-transform" />
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2.5 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all duration-300"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* ---- Mobile Menu ---- */}
        {mobileOpen && (
          <div className="md:hidden border-t border-zinc-100 dark:border-zinc-800 py-4 space-y-1">
            {user && (
              <div className="px-4 py-4 mb-2 bg-primary/5 rounded-2xl mx-2 border border-primary/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{t.nav?.profile?.welcomeBack || 'Welcome Back'}</p>
                <p className="text-lg font-black italic text-foreground">{user.name}</p>
                <Link 
                  href="/profile" 
                  onClick={() => setMobileOpen(false)}
                  className="mt-3 flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl text-sm font-bold text-foreground border border-zinc-200 dark:border-white/5"
                >
                  {t.nav?.profile?.viewProfile || 'View Profile'} <ChevronRight size={14} />
                </Link>
              </div>
            )}
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
