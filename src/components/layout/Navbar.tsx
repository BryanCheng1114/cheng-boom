import Link from 'next/link';
import { useCart } from '../cart/CartProvider';
import { ShoppingCart, ChevronDown, Menu, X, User, ChevronRight, Search, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { cn } from '../../utils/cn';
import { useTranslation } from '../../hooks/useTranslation';
import { useState, useEffect, useRef } from 'react';
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
  // transparentImage?: string | null;
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
  const [mobileLangExpanded, setMobileLangExpanded] = useState(false);
  const [shopExpanded, setShopExpanded] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [user, setUser] = useState<NavbarUser | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isShopHovered, setIsShopHovered] = useState(false);

  const logoutTranslations = {
    title: { en: 'Log Out', zh: '登出', ms: 'Log Keluar' },
    message: { en: 'Are you sure you want to log out from your account?', zh: '您确定要退出您的帐户吗？', ms: 'Adakah anda pasti ingin log keluar dari akaun anda?' },
    confirm: { en: 'Yes, log out', zh: '是的，登出', ms: 'Ya, log keluar' },
    cancel: { en: 'Cancel', zh: '取消', ms: 'Batal' }
  };

  const searchTranslations = {
    search: { en: 'Search', zh: '搜索', ms: 'Cari' },
    cancel: { en: 'Cancel', zh: '取消', ms: 'Batal' },
    popular: { en: 'Popular Search Terms', zh: '热门搜索词', ms: 'Istilah Carian Popular' },
    recent: { en: 'Recent searches', zh: '最近搜索', ms: 'Carian Terkini' },
    categories: { en: 'Categories', zh: '分类', ms: 'Kategori' },
    products: { en: 'Products', zh: '产品', ms: 'Produk' },
    noResults: { en: 'No results found for', zh: '找不到相关结果:', ms: 'Tiada hasil untuk' }
  };
  const st = (key: keyof typeof searchTranslations) => searchTranslations[key][locale as 'en'|'zh'|'ms'] || searchTranslations[key].en;

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
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      // Load history from localStorage when opening
      try {
        const stored = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        setSearchHistory(stored);
      } catch {}
    }
    if (!searchOpen) setSearchQuery('');
  }, [searchOpen]);

  // Fetch products for suggestions (once)
  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => setAllProducts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Close search on route change
  useEffect(() => {
    setSearchOpen(false);
  }, [router.pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      // Save to history
      const updated = [q, ...searchHistory.filter(h => h !== q)].slice(0, 6);
      setSearchHistory(updated);
      localStorage.setItem('searchHistory', JSON.stringify(updated));
      router.push(`/shop?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/shop');
    }
    setSearchOpen(false);
  };

  const removeHistory = (item: string) => {
    const updated = searchHistory.filter(h => h !== item);
    setSearchHistory(updated);
    localStorage.setItem('searchHistory', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const pickSuggestion = (term: string) => {
    const updated = [term, ...searchHistory.filter(h => h !== term)].slice(0, 6);
    setSearchHistory(updated);
    localStorage.setItem('searchHistory', JSON.stringify(updated));
    router.push(`/shop?q=${encodeURIComponent(term)}`);
    setSearchOpen(false);
  };

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSearchOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
        if (data.length > 0) setCategories(data.filter((c: any) => c.status !== 'Hold'));
      })
      .catch(() => {});
  }, []);

  const selectedFont = settings?.businessFont || 'Impact';
  const fontFamily = FONT_MAP[selectedFont] || FONT_MAP['Impact'];
  const businessName = settings?.businessName || 'Cheng-BOOM';
  const profileInitial = user?.name?.trim().charAt(0).toUpperCase() || 'U';
  // Make the navbar fixed on the home page so the background image slides under it.
  const isTransparentHeroPage = router.pathname === '/';
  const isTransparent = false;
  return (
    <>
      <nav 
        className={cn(
          "top-0 z-[100] w-full transition-all duration-300",
          isTransparentHeroPage ? "fixed" : "sticky",
          isTransparent
            ? "bg-transparent text-white border-b border-transparent shadow-none"
            : "bg-white text-zinc-900 border-b border-zinc-200 shadow-sm"
        )}
      >
      <div className="mx-auto w-full max-w-[1600px] px-6 md:px-10 lg:px-16">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">

          {/* ---- Left Side: Brand + Desktop Nav ---- */}
          <div className="flex flex-1 justify-start items-center h-full gap-8 lg:gap-14">
            
            {/* Brand */}
            <Link href="/" className="flex shrink-0 items-center h-full cursor-pointer py-1" aria-label={`${businessName} home`}>
              {settings?.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                  src={settings.logoUrl} 
                  alt={businessName} 
                  className="max-h-[32px] sm:max-h-[200px] max-w-[200px] object-contain"
                />
              ) : (
                <span
                  className={cn(
                    "block whitespace-nowrap text-[22px] sm:text-[26px] font-medium leading-none tracking-tight pr-2",
                    isTransparent ? "text-white" : "text-zinc-900"
                  )}
                  style={{ fontFamily }}
                  title={businessName}
                >
                  {businessName}
                </span>
              )}
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex shrink-0 items-center gap-6 lg:gap-8 h-full">


            {/* Shop — with mega menu dropdown */}
            <div 
              className="group/shop h-full flex items-center"
              onMouseEnter={() => setIsShopHovered(true)}
              onMouseLeave={() => setIsShopHovered(false)}
            >
              <Link
                href="/shop"
                className={cn(
                  'relative h-full flex items-center gap-1 font-sans text-[15px] font-medium tracking-normal transition-colors duration-300',
                  isTransparent
                    ? 'text-white group-hover/shop:text-white/80'
                    : 'text-zinc-600 group-hover/shop:text-zinc-900'
                )}
              >
                {t.nav.shop} <ChevronDown size={14} className="ml-0.5 opacity-60" />
              </Link>
              
              {/* Dropdown Mega Menu (Full Width) */}
              <div className="absolute top-[63px] left-0 w-full invisible opacity-0 group-hover/shop:visible group-hover/shop:opacity-100 transition-all duration-300">
                <div className={cn(
                  "w-full pb-4 pt-1 transition-all duration-300",
                  isTransparent 
                    ? "bg-transparent border-transparent" 
                    : "bg-white border-b border-zinc-200 shadow-xl"
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
                            <div className="flex h-[60px] w-[60px] sm:h-[72px] sm:w-[72px] lg:h-[88px] lg:w-[88px] items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={category.image || '/example.png'} 
                                alt={label} 
                                className="max-h-full max-w-full object-contain opacity-85 transition-all duration-300 group-hover/cat:opacity-100 group-hover/cat:scale-110 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                              />
                            </div>
                            <span className={cn(
                              "font-sans text-[14px] lg:text-[15px] font-medium tracking-normal transition-colors",
                              isTransparent ? "text-white/72 group-hover/cat:text-white" : "text-zinc-600 group-hover/cat:text-zinc-900"
                            )}>
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
                'relative h-full flex items-center font-sans text-[15px] font-medium tracking-normal transition-colors duration-300',
                isTransparent ? 'text-white hover:text-white/80' : 'text-zinc-600 hover:text-zinc-900'
              )}
            >
              {t.nav.aboutUs}
            </Link>

            {/* Contact Us */}
            <Link
              href="/contact"
              className={cn(
                'relative h-full flex items-center font-sans text-[15px] font-medium tracking-normal transition-colors duration-300',
                isTransparent ? 'text-white hover:text-white/80' : 'text-zinc-600 hover:text-zinc-900'
              )}
            >
              {t.nav.contact}
            </Link>

            {/* Safety Guide */}
            <Link
              href="/safety"
              className={cn(
                'relative h-full flex items-center font-sans text-[15px] font-medium tracking-normal transition-colors duration-300',
                isTransparent ? 'text-white hover:text-white/80' : 'text-zinc-600 hover:text-zinc-900'
              )}
            >
              {locale === 'zh' ? '安全指南' : locale === 'ms' ? 'Panduan Keselamatan' : 'Safety Guide'}
            </Link>
          </div>
        </div>

          {/* ---- Right Actions ---- */}
          <div className="flex flex-1 justify-end items-center gap-1 sm:gap-3 h-full">

            {/* Search Icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className={cn(
                "flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all duration-300 group",
                isTransparent ? "text-white/82 hover:bg-white/10 hover:text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
              aria-label="Search"
            >
              <Search strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            </button>

            {/* Cart */}
            <Link
              id="navbar-cart-btn"
              href="/cart"
              className={cn(
                "relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all duration-300 group",
                isTransparent ? "text-white/82 hover:bg-white/10 hover:text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
              aria-label="Cart"
            >
              <motion.div
                animate={isWiggling ? {
                  x: [0, -5, 5, -5, 5, 0],
                  rotate: [0, -10, 10, -10, 10, 0],
                } : {}}
                transition={{ duration: 0.4 }}
              >
                <ShoppingCart strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
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
                    className={cn(
                      "absolute top-1.5 right-1.5 sm:top-1.5 sm:right-1.5 inline-flex h-4 w-4 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-yellow-400 text-[9px] sm:text-[10px] font-black text-zinc-950 ring-2",
                      isTransparent ? "ring-zinc-900/50" : "ring-white"
                    )}
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Profile Link */}
            <div className="flex items-center relative">
              {user ? (
                <>
                  <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className={cn(
                      "relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all duration-300",
                      isTransparent ? "text-white/82 hover:bg-white/10 hover:text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                      isProfileMenuOpen ? (isTransparent ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-900") : ""
                    )}
                    aria-label={`${user.name} profile`}
                    title={user.name}
                  >
                    <User strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className={cn(
                      "absolute top-2 right-2 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 rounded-full ring-2",
                      isTransparent ? "ring-zinc-900/50" : "ring-white"
                    )} />
                  </button>
                  
                  {/* Dropdown Menu (Click instead of Hover) */}
                  <div className={cn(
                    "absolute top-[110%] right-0 pt-2 w-56 transition-all duration-300 z-50",
                    isProfileMenuOpen ? "visible opacity-100" : "invisible opacity-0 translate-y-2"
                  )}>
                    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-100 py-2 overflow-hidden flex flex-col">
                      <div className="px-4 py-3 border-b border-zinc-100">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">
                          {locale === 'zh' ? '登录身份' : locale === 'ms' ? 'Dilog masuk sebagai' : 'Signed in as'}
                        </p>
                        <p className="text-sm font-medium text-zinc-900 truncate">{user.name}</p>
                      </div>
                      <Link 
                        href="/profile" 
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="px-4 py-3 text-[15px] font-bold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors flex items-center gap-3"
                      >
                        <User size={16} />
                        {t.nav?.profile?.account || (locale === 'zh' ? '账号概览' : 'Account Overview')}
                      </Link>
                      <button 
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsLogoutModalOpen(true);
                        }}
                        className="px-4 py-3 text-[15px] font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 text-left"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        {logoutTranslations.title[locale as 'en'|'zh'|'ms'] || 'Log Out'}
                      </button>
                    </div>
                  </div>

                  {/* Backdrop for click outside */}
                  {isProfileMenuOpen && (
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileMenuOpen(false)}
                    />
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className={cn(
                    "flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all duration-300 group",
                    isTransparent ? "text-white/82 hover:bg-white/10 hover:text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                  title="Sign In"
                >
                  <User strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                "ml-0.5 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-all duration-300 md:hidden",
                isTransparent ? "text-white/82 hover:bg-white/10 hover:text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              {mobileOpen ? <X strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu strokeWidth={1.5} className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>

        {/* ---- Mobile Menu Drawer (Xiaomi Style) ---- */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.35 }}
              style={{ transformOrigin: 'calc(100% - 28px) 32px' }}
              className="fixed inset-0 z-[200] flex flex-col bg-white md:hidden"
            >
              {/* Top Header (Matches exactly with Mobile Navbar Header Size) */}
              <div className="flex h-16 shrink-0 items-center justify-between px-3 sm:px-5 border-b border-zinc-100">
                {settings?.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img 
                    src={settings.logoUrl} 
                    alt={businessName} 
                    className="max-h-[28px] sm:max-h-[32px] max-w-[120px] object-contain"
                  />
                ) : (
                  <span
                    className="block whitespace-nowrap text-[19px] sm:text-[22px] font-black italic leading-none tracking-wider text-zinc-900 py-1 pr-1"
                    style={{ fontFamily }}
                  >
                    {businessName}
                  </span>
                )}
                
                <div className="flex shrink-0 items-center gap-1 sm:gap-3">
                  {user ? (
                    <Link 
                      href="/profile" 
                      onClick={() => setMobileOpen(false)} 
                      className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all"
                      title={user.name}
                    >
                      <User className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                    </Link>
                  ) : (
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all">
                      <User className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                    </Link>
                  )}
                  <button onClick={() => setMobileOpen(false)} className="ml-0.5 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all">
                    <X className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col">
                {/* Shop Expandable */}
                <div className="flex flex-col">
                  <button
                    onClick={() => setShopExpanded(!shopExpanded)}
                    className="flex w-full items-center justify-between py-5 text-left text-[18px] font-semibold text-zinc-900 transition-colors"
                  >
                    <span>{t.nav.shop}</span>
                    <motion.div animate={{ rotate: shopExpanded ? 90 : 0 }}>
                      <ChevronRight size={20} className="text-zinc-400" />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {shopExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col pb-4">
                          <span className="py-2 pl-2 mb-1 text-[12px] font-bold tracking-widest text-zinc-400 uppercase">
                            {locale === 'zh' ? '商品类别' : 'Categories'}
                          </span>
                          <Link
                            href="/shop"
                            onClick={() => setMobileOpen(false)}
                            className="py-3 pl-2 text-[16px] font-semibold text-zinc-900 hover:text-zinc-700 transition-colors"
                          >
                            {locale === 'zh' ? '所有分类' : 'All Categories'}
                          </Link>
                          {(categories.length > 0 ? categories : []).map((category) => {
                            const key = category.code || category.key || category.name.toLowerCase().replace(/\s+/g, '');
                            let label = category.name;
                            if (locale === 'zh' && category.nameZh) label = category.nameZh;
                            else if (locale === 'ms' && category.nameMs) label = category.nameMs;
                            else label = (t.shopCategories as Record<string, string>)[key] || category.name;

                            return (
                              <Link
                                key={category.id}
                                href={`/shop?category=${key}`}
                                onClick={() => setMobileOpen(false)}
                                className="py-3 pl-2 text-[16px] text-zinc-500 hover:text-zinc-900 transition-colors"
                              >
                                {label}
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* End Line Spacer */}
                <div className="my-4 h-px w-full bg-zinc-100" />

                {/* About Us */}
                <Link
                  href="/about"
                  onClick={() => setMobileOpen(false)}
                  className="py-5 text-[18px] font-semibold text-zinc-900 transition-colors block w-full text-left"
                >
                  {t.nav.aboutUs}
                </Link>

                {/* Contact Us */}
                <Link
                  href="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="py-5 text-[18px] font-semibold text-zinc-900 transition-colors block w-full text-left"
                >
                  {t.nav.contact}
                </Link>

                {/* Safety Guide */}
                <Link
                  href="/safety"
                  onClick={() => setMobileOpen(false)}
                  className="py-5 text-[18px] font-semibold text-zinc-900 transition-colors block w-full text-left"
                >
                  {locale === 'zh' ? '安全指南' : locale === 'ms' ? 'Panduan Keselamatan' : 'Safety Guide'}
                </Link>

                <div className="my-2 h-px w-full bg-zinc-100" />

                {/* My Account */}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    router.push(user ? '/profile' : '/login');
                  }}
                  className="py-5 text-[18px] font-semibold text-zinc-900 transition-colors flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <User size={20} />
                    {t.nav?.profile?.account || (locale === 'zh' ? '账号概览' : 'Account Overview')}
                  </div>
                  <ChevronRight size={20} className="opacity-50" />
                </button>

                {user && (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                    className="py-5 text-[18px] font-semibold text-red-600 transition-colors flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                      {logoutTranslations.title[locale as 'en'|'zh'|'ms'] || 'Log Out'}
                    </div>
                  </button>
                )}

                {/* Language Switcher */}
                <div className="flex flex-col">
                  <button
                    onClick={() => setMobileLangExpanded(!mobileLangExpanded)}
                    className="py-5 text-[18px] font-semibold text-zinc-900 transition-colors flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Globe size={20} />
                      {locale === 'zh' ? '马来西亚 / 中文' : 'Malaysia / English'}
                    </div>
                    <ChevronRight size={20} className={`opacity-50 transition-transform ${mobileLangExpanded ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {mobileLangExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            const newLocale = locale === 'zh' ? 'en' : 'zh';
                            router.push(router.pathname, router.asPath, { locale: newLocale });
                            setMobileOpen(false);
                            setMobileLangExpanded(false);
                          }}
                          className="py-3 pl-8 text-[16px] font-medium text-zinc-400 hover:text-zinc-900 transition-colors w-full text-left flex items-center justify-between"
                        >
                          {locale === 'zh' ? 'Malaysia / English' : '马来西亚 / 中文'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* ── Search Overlay (Nike Style) ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && (() => {
          const q = searchQuery.trim().toLowerCase();

          // Live suggestions
          const suggestedProducts = q
            ? allProducts
                .filter(p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
                .slice(0, 5)
            : [];
          const suggestedCategories = q
            ? categories.filter(c => c.name?.toLowerCase().includes(q)).slice(0, 3)
            : [];

          // Top trend words shown when no query (for "Popular Search Terms")
          const trendingWords = !q
            ? Array.from(new Set([
                ...categories.slice(0, 3).map(c => c.name),
                ...allProducts.filter(p => p.status === 'Live').slice(0, 5).map(p => p.name)
              ])).slice(0, 8)
            : [];

          const hasHistory = !q && searchHistory.length > 0;
          const hasRecommended = !q && trendingWords.length > 0;

          return (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="fixed inset-0 z-[190] bg-black/50"
                onClick={() => setSearchOpen(false)}
              />

              {/* Drawer */}
              <motion.div
                initial={{ y: '-100%' }}
                animate={{ y: 0 }}
                exit={{ y: '-100%', transition: { duration: 0.25 } }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-0 inset-x-0 z-[200] bg-white text-zinc-900 flex flex-col max-h-[55vh] shadow-[0_10px_50px_-10px_rgba(0,0,0,0.15)] rounded-b-[2.5rem] border-b border-zinc-100"
              >
              {/* Top Bar (matches Nike) */}
              <div className="flex h-16 items-center justify-between px-3 sm:px-5 lg:px-6">
                {/* Brand */}
                <div className="hidden sm:flex shrink-0 items-center w-[120px] py-1">
                  {settings?.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={settings.logoUrl} 
                      alt={businessName} 
                      className="max-h-[250px] object-contain"
                    />
                  ) : (
                    <span
                      className="block whitespace-nowrap text-[22px] font-medium leading-none tracking-tight text-zinc-900"
                      style={{ fontFamily }}
                    >
                      {businessName}
                    </span>
                  )}
                </div>

                {/* Search Input Container */}
                <div className="flex-1 max-w-2xl sm:px-4">
                  <form onSubmit={handleSearchSubmit} className="relative w-full group">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-700 transition-colors"
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={st('search')}
                      className="w-full pl-11 pr-11 py-3 text-[16px] sm:text-[17px] font-medium bg-transparent border-none text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                      >
                        <X size={16} strokeWidth={2} />
                      </button>
                    )}
                  </form>
                </div>

                {/* Cancel Button */}
                <div className="flex shrink-0 items-center justify-end sm:w-[120px] ml-3 sm:ml-0">
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors p-1 -mr-1 sm:p-0 sm:mr-0"
                    aria-label="Cancel"
                  >
                    <span className="hidden sm:block text-[15px] font-semibold">{st('cancel')}</span>
                    <X className="block sm:hidden w-6 h-6" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="max-w-2xl mx-auto w-full">
                  
                  {/* Empty State / Default View */}
                  {!q && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                      
                      {/* Popular Search Terms */}
                      {hasRecommended && (
                        <div>
                          <h3 className="text-[13px] sm:text-[14px] font-medium text-zinc-400 mb-3">{st('popular')}</h3>
                          <div className="flex flex-wrap gap-x-3 gap-y-2">
                            {trendingWords.map((word, idx) => (
                              <button
                                key={`trend-${idx}`}
                                onClick={() => pickSuggestion(word)}
                                className="py-1.5 text-zinc-600 hover:text-zinc-900 text-[14px] sm:text-[15px] font-medium transition-colors"
                              >
                                {word}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Searches */}
                      {hasHistory && (
                        <div>
                          <h3 className="text-[13px] sm:text-[14px] font-medium text-zinc-400 mb-3">{st('recent')}</h3>
                          <div className="flex flex-col">
                            {searchHistory.map((item, idx) => (
                              <div key={`hist-${idx}`} className="flex items-center justify-between py-3 group/hist">
                                <button
                                  onClick={() => pickSuggestion(item)}
                                  className="flex-1 text-left text-[16px] sm:text-[18px] font-medium text-zinc-800 hover:text-zinc-900 transition-colors"
                                >
                                  {item}
                                </button>
                                <button
                                  onClick={() => removeHistory(item)}
                                  className="p-2 text-zinc-300 hover:text-zinc-700 transition-colors sm:opacity-0 group-hover/hist:opacity-100"
                                >
                                  <X size={18} strokeWidth={1.5} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Typing / Live Results View */}
                  {q && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                      
                      {suggestedCategories.length > 0 && (
                        <div>
                          <h3 className="text-[13px] sm:text-[14px] font-medium text-zinc-400 mb-2">{st('categories')}</h3>
                          <div className="flex flex-col">
                            {suggestedCategories.map(cat => {
                              const key = cat.code || cat.key || cat.name.toLowerCase().replace(/\s+/g, '');
                              return (
                                <button
                                  key={cat.id}
                                  onClick={() => {
                                    setSearchOpen(false);
                                    router.push(`/shop?category=${key}`);
                                  }}
                                  className="flex items-center gap-3 sm:gap-4 py-2.5 hover:bg-zinc-50 rounded-xl px-2 -mx-2 transition-colors text-left"
                                >
                                  {(cat.image) && (
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-100 rounded-lg flex items-center justify-center p-1.5 shrink-0">
                                      <img src={cat.image || undefined} alt={cat.name} className="max-w-full max-h-full object-contain drop-shadow-sm" />
                                    </div>
                                  )}
                                  <span className="text-[15px] sm:text-[16px] font-medium text-zinc-800">{cat.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {suggestedProducts.length > 0 && (
                        <div>
                          <h3 className="text-[13px] sm:text-[14px] font-medium text-zinc-400 mb-2">{st('products')}</h3>
                          <div className="flex flex-col">
                            {suggestedProducts.map(p => (
                              <button
                                key={p.id}
                                onClick={() => pickSuggestion(p.name)}
                                className="flex items-center gap-3 sm:gap-4 py-2.5 hover:bg-zinc-50 rounded-xl px-2 -mx-2 transition-colors text-left"
                              >
                                {p.images?.[0] ? (
                                  <img src={p.images[0]} alt={p.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover bg-zinc-100 shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-zinc-100 shrink-0 flex items-center justify-center"><Search size={16} className="text-zinc-400" /></div>
                                )}
                                <div className="flex flex-col overflow-hidden">
                                  <span className="text-[15px] sm:text-[16px] font-medium text-zinc-800 truncate">{p.name}</span>
                                  {p.category && <span className="text-[12px] sm:text-[13px] text-zinc-400 truncate">{p.category}</span>}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {suggestedProducts.length === 0 && suggestedCategories.length === 0 && (
                        <div className="py-12 text-center text-zinc-400 text-[15px] sm:text-[16px]">
                          {st('noResults')} "{searchQuery}"
                        </div>
                      )}
                    </motion.div>
                  )}

                </div>
              </div>
            </motion.div>
            </>
          );
        })()}
      </AnimatePresence>
    </nav>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 text-center relative"
            >
              <div className="mx-auto w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </div>

              <h3 className="text-2xl font-black text-zinc-900 mb-2">
                {logoutTranslations.title[locale as 'en' | 'zh' | 'ms'] || logoutTranslations.title.en}
              </h3>
              
              <p className="text-[15px] text-zinc-500 font-medium whitespace-normal mb-8 leading-relaxed">
                {logoutTranslations.message[locale as 'en' | 'zh' | 'ms'] || logoutTranslations.message.en}
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setIsLogoutModalOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-3.5 rounded-full font-bold text-[15px] bg-black hover:bg-zinc-800 text-white transition-all shadow-sm"
                >
                  {logoutTranslations.confirm[locale as 'en' | 'zh' | 'ms'] || logoutTranslations.confirm.en}
                </button>
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="w-full py-3.5 rounded-full font-bold text-[15px] bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 transition-all shadow-sm"
                >
                  {logoutTranslations.cancel[locale as 'en' | 'zh' | 'ms'] || logoutTranslations.cancel.en}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
