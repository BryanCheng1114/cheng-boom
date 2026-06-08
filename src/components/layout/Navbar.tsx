import Link from 'next/link';
import { useCart } from '../cart/CartProvider';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ShoppingBag, ShoppingCart, ChevronDown, Menu, X, User, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { cn } from '../../utils/cn';
import { useTranslation } from '../../hooks/useTranslation';
import { useState, useEffect } from 'react';
import { useFlyToCart } from '../ui/FlyToCartProvider';
import { useBusiness } from '../../context/BusinessContext';

type NavbarUser = {
  name: string;
};

type NavbarCategory = {
  id: string | number;
  name: string;
  nameZh?: string;
  nameMs?: string;
  code?: string;
  key?: string;
  count?: number;
  image?: string | null;
  transparentImage?: string | null;
};

const CONFETTI_BURST = [
  { x: -46, y: -54, rotate: 40 },
  { x: -12, y: -66, rotate: 95 },
  { x: 34, y: -58, rotate: 150 },
  { x: 58, y: -22, rotate: 210 },
  { x: 44, y: 28, rotate: 275 },
  { x: 12, y: 62, rotate: 330 },
  { x: -34, y: 50, rotate: 25 },
  { x: -58, y: 14, rotate: 120 },
  { x: -38, y: -18, rotate: 185 },
  { x: 8, y: -36, rotate: 245 },
  { x: 52, y: 8, rotate: 305 },
  { x: -8, y: 36, rotate: 355 },
];

const FONT_MAP: Record<string, string> = {
  'Impact': "Impact, 'Arial Black', sans-serif",
  'Playfair Display': "Georgia, 'Times New Roman', serif",
  'Bebas Neue': "'Arial Black', 'Arial Bold', sans-serif",
  'Pacifico': "'Comic Sans MS', 'Bradley Hand', cursive",
  'Montserrat': "'Trebuchet MS', 'Lucida Grande', sans-serif",
};

export function Navbar() {
  const { settings } = useBusiness();
  const { totalItems, clearCart } = useCart();
  const { registerCelebrationTrigger } = useFlyToCart();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [user, setUser] = useState<NavbarUser | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const logoutTranslations = {
    title: { en: 'Log Out', zh: '登出', ms: 'Log Keluar' },
    message: { en: 'Are you sure you want to log out from your account?', zh: '您确定要退出您的帐户吗？', ms: 'Adakah anda pasti ingin log keluar dari akaun anda?' },
    confirm: { en: 'Yes, log out', zh: '是的，登出', ms: 'Ya, log keluar' },
    cancel: { en: 'Cancel', zh: '取消', ms: 'Batal' }
  };

  useEffect(() => {
    const checkUser = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser) as NavbarUser);
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
    clearCart();
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => router.pathname === path;
  const isActivePrefix = (prefix: string, exclude?: string) =>
    router.pathname.startsWith(prefix) && router.pathname !== exclude;

  const [categories, setCategories] = useState<NavbarCategory[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const selectedFont = settings?.businessFont || 'Impact';
  const fontFamily = FONT_MAP[selectedFont] || FONT_MAP['Impact'];
  const businessName = settings?.businessName || 'Cheng-BOOM';
  const profileInitial = user?.name?.trim().charAt(0).toUpperCase() || 'U';

  const isHomePage = router.pathname === '/';
  const isTransparent = isHomePage && !isScrolled && !mobileOpen;

  return (
    <>
      <nav 
        className={cn(
          "top-0 z-50 w-full transition-all duration-300",
          isHomePage ? "fixed" : "sticky",
          isTransparent
            ? "bg-transparent text-white border-b border-transparent shadow-none"
            : "bg-[#161617] text-[#f5f5f7] border-b border-white/[0.08] shadow-sm"
        )}
      >
      <div className="mx-auto w-full max-w-[1180px] px-3 sm:px-5 lg:px-6">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">

          {/* ---- Brand ---- */}
          <Link href="/" className="group flex shrink-0 items-center" aria-label={`${businessName} home`}>
            <span
              className="block whitespace-nowrap text-[19px] sm:text-[22px] font-black italic leading-none tracking-wider bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent transition-transform duration-300 group-hover:scale-105 origin-left py-1 pr-1"
              style={{ fontFamily }}
              title={businessName}
            >
              {businessName}
            </span>
          </Link>

          {/* ---- Desktop Nav ---- */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-1 lg:gap-2">

            {/* Home Page */}
            <Link
              href="/"
              className={cn(
                'hidden',
                isActive('/') 
                  ? 'bg-white/10 text-white' 
                  : ''
              )}
            >
              {t.nav.home}
            </Link>

            {/* Shop — with mega menu dropdown */}
            <div className="group/shop h-full flex items-center">
              <Link
                href="/shop"
                className={cn(
                  'relative flex items-center gap-1 rounded-full px-3 py-2 font-sans text-[14px] font-medium tracking-wide text-white/82 transition-all duration-300 hover:bg-white/8 hover:text-white group-hover/shop:bg-white/8 group-hover/shop:text-white lg:px-4',
                  isActivePrefix('/shop') 
                    ? 'bg-white/10 text-white' 
                    : ''
                )}
              >
                {t.nav.shop}
              </Link>
              
              {/* Dropdown Mega Menu (Full Width) */}
              <div className="absolute top-[63px] left-0 w-full invisible opacity-0 group-hover/shop:visible group-hover/shop:opacity-100 transition-all duration-300">
                <div className={cn(
                  "w-full pb-4 pt-1 transition-all duration-300",
                  isTransparent 
                    ? "bg-transparent border-b border-transparent shadow-none" 
                    : "bg-[#161617] border-b border-white/[0.08] shadow-2xl"
                )}>
                  <div className="mx-auto w-full max-w-[1400px] overflow-x-auto scrollbar-hide px-4 py-6">
                    <div className="flex items-start justify-center gap-6 sm:gap-8 lg:gap-12 flex-nowrap min-w-max px-2">
                      {(categories.length > 0 ? categories : [
                        { id: '1', name: 'Soundcloud', image: '/example.png' },
                        { id: '2', name: 'Fountain', image: '/example.png' },
                        { id: '3', name: 'Handheld', image: '/example.png' },
                        { id: '4', name: 'Spinning', image: '/example.png' },
                        { id: '5', name: 'Pop Pop', image: '/example.png' },
                        { id: '6', name: 'Dragon Pili', image: '/example.png' },
                        { id: '7', name: 'Fireworks', image: '/example.png' },
                        { id: '8', name: 'Firecrackers', image: '/example.png' },
                        { id: '9', name: 'Skyline', image: '/example.png' },
                      ]).map((category) => {
                        const key = category.code || category.key || category.name.toLowerCase().replace(/\s+/g, '');
                        
                        let label = category.name;
                        if (locale === 'zh' && category.nameZh) {
                          label = category.nameZh;
                        } else if (locale === 'ms' && category.nameMs) {
                          label = category.nameMs;
                        } else {
                          label = (t.shopCategories as Record<string, string>)[key] || category.name;
                        }

                        return (
                          <Link
                            key={category.id}
                            href={`/shop?category=${key}`}
                            className="flex flex-col items-center justify-start gap-3 text-center transition-all group/cat hover:-translate-y-1"
                          >
                            <div className="flex h-[48px] w-[48px] sm:h-[60px] sm:w-[60px] lg:h-[72px] lg:w-[72px] items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={category.transparentImage || category.image || '/example.png'} 
                                alt={label} 
                                className="max-h-full max-w-full object-contain opacity-85 transition-all duration-300 group-hover/cat:opacity-100 group-hover/cat:scale-110 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                              />
                            </div>
                            <span className="text-[12px] lg:text-[13px] font-medium tracking-wide text-white/72 group-hover/cat:text-white transition-colors">
                              {label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* About Us */}
            <Link
              href="/about"
              className={cn(
                'relative rounded-full px-3 py-2 font-sans text-[14px] font-medium tracking-wide text-white/82 transition-all duration-300 hover:bg-white/8 hover:text-white lg:px-4',
                isActive('/about') 
                  ? 'bg-white/10 text-white' 
                  : ''
              )}
            >
              {t.nav.aboutUs}
            </Link>

            {/* Contact Us */}
            <Link
              href="/contact"
              className={cn(
                'relative rounded-full px-3 py-2 font-sans text-[14px] font-medium tracking-wide text-white/82 transition-all duration-300 hover:bg-white/8 hover:text-white lg:px-4',
                isActive('/contact') 
                  ? 'bg-white/10 text-white' 
                  : ''
              )}
            >
              {t.nav.contact}
            </Link>
          </div>

          {/* ---- Right Actions ---- */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            
            {/* Cart */}
            <Link
              id="navbar-cart-btn"
              href="/cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/82 transition-all duration-300 hover:bg-white/10 hover:text-white group"
              aria-label="Cart"
            >
              <motion.div
                animate={isWiggling ? {
                  x: [0, -5, 5, -5, 5, 0],
                  rotate: [0, -10, 10, -10, 10, 0],
                } : {}}
                transition={{ duration: 0.4 }}
              >
                <ShoppingCart strokeWidth={1.5} className="w-[18px] h-[18px] sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              </motion.div>

              {/* Confetti Burst */}
              <AnimatePresence>
                {showConfetti && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {CONFETTI_BURST.map((burst, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                        animate={{ 
                          opacity: 0, 
                          scale: [0, 1.5, 0.5],
                          x: burst.x,
                          y: burst.y,
                          rotate: burst.rotate
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
                    className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-black text-zinc-950 shadow-[0_2px_4px_rgba(0,0,0,0.24)]"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Profile Dropdown */}
            <div className="relative group/profile flex items-center">
              {user ? (
                <div className="flex items-center gap-2 cursor-pointer relative">
                  {/* Icon Frame */}
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-black text-white ring-1 ring-white/10 transition-all duration-300 group-hover/profile:-translate-y-0.5 group-hover/profile:bg-white/25"
                    aria-label={`${user.name} profile`}
                    title={user.name}
                  >
                    {profileInitial}
                  </div>

                  {/* Invisible Bridge to prevent hover gap */}
                  <div className="absolute -bottom-4 left-0 w-full h-4 z-10" />
                  
                  {/* Dropdown */}
                  <div className="absolute top-[calc(100%+8px)] right-0 w-56 opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible translate-y-2 scale-95 group-hover/profile:translate-y-0 group-hover/profile:scale-100 transition-all duration-300 ease-out origin-top-right z-50">
                    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#101819]/95 py-3 shadow-2xl shadow-black/35 backdrop-blur-xl">
                      <div className="mb-2 border-b border-white/10 px-5 py-3">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-white/45">{t.nav?.profile?.account || 'Account'}</p>
                        <p className="truncate text-sm font-bold text-white">{user.name}</p>
                      </div>
                      <Link 
                        href="/profile" 
                        className="flex items-center gap-3 px-5 py-3 text-sm text-white/72 hover:text-white hover:bg-white/8 transition-colors"
                      >
                        <User size={16} /> {t.nav?.profile?.myProfile || 'My Profile'}
                      </Link>
                      <div className="mx-3 my-2 h-px bg-white/10" />
                      <button 
                        onClick={() => setIsLogoutModalOpen(true)}
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
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white/82 transition-all duration-300 hover:bg-white/10 hover:text-white group"
                  title="Sign In"
                >
                  <User strokeWidth={1.5} className="w-[18px] h-[18px] sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                </Link>
              )}
            </div>

            {/* Site Settings: Language */}
            <div className="hidden sm:flex items-center gap-1 ml-3 sm:ml-4">
              <LanguageSwitcher />
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="ml-0.5 flex h-9 w-9 items-center justify-center rounded-full text-white/82 transition-all duration-300 hover:bg-white/10 hover:text-white md:hidden"
            >
              {mobileOpen ? <X strokeWidth={1.5} className="w-[18px] h-[18px]" /> : <Menu strokeWidth={1.5} className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>

        {/* ---- Mobile Menu ---- */}
        {mobileOpen && (
          <div className="space-y-1 border-t border-white/10 py-4 md:hidden">
            {user && (
              <div className="mx-2 mb-2 rounded-lg border border-white/10 bg-white/6 px-4 py-4">
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-white/48">{t.nav?.profile?.welcomeBack || 'Welcome Back'}</p>
                <p className="text-lg font-black italic text-white">{user.name}</p>
                <Link 
                  href="/profile" 
                  onClick={() => setMobileOpen(false)}
                  className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/8 p-3 text-sm font-bold text-white"
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
                  'block rounded-lg px-4 py-3 font-sans text-[14px] font-medium tracking-wide transition-colors',
                  router.pathname === href
                    ? 'bg-white/12 text-white'
                    : 'text-white/72 hover:bg-white/8 hover:text-white'
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>


    </nav>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800/50">
                <h3 className="text-lg font-black text-foreground">
                  {logoutTranslations.title[locale as 'en' | 'zh' | 'ms'] || logoutTranslations.title.en}
                </h3>
                <button 
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="text-zinc-400 hover:text-foreground transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-zinc-600 dark:text-zinc-300 font-medium whitespace-normal">
                  {logoutTranslations.message[locale as 'en' | 'zh' | 'ms'] || logoutTranslations.message.en}
                </p>
                
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setIsLogoutModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white transition-colors"
                  >
                    {logoutTranslations.cancel[locale as 'en' | 'zh' | 'ms'] || logoutTranslations.cancel.en}
                  </button>
                  <button
                    onClick={() => {
                      setIsLogoutModalOpen(false);
                      handleLogout();
                    }}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20"
                  >
                    {logoutTranslations.confirm[locale as 'en' | 'zh' | 'ms'] || logoutTranslations.confirm.en}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
