import Head from 'next/head';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { ProductCard } from '../../components/ui/ProductCard';
import { useTranslation } from '../../hooks/useTranslation';
import { Loader2, ChevronLeft, ChevronRight, X, ChevronDown, LayoutGrid, List, ArrowUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness } from '../../context/BusinessContext';

export default function Shop() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const updateBackToTop = () => {
      const scrollPosition = Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop);
      setShowBackToTop(scrollPosition > 48);
    };
    updateBackToTop();
    window.addEventListener('scroll', updateBackToTop, { passive: true });
    document.addEventListener('scroll', updateBackToTop, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', updateBackToTop);
      document.removeEventListener('scroll', updateBackToTop, true);
    };
  }, []);

  const sortTranslations = {
    sortBy: { en: 'Sort By:', zh: '排序：', ms: 'Susun mengikut:' },
    newest: { en: 'Newest Arrivals', zh: '最新上架', ms: 'Ketibaan Baru' },
    priceAsc: { en: 'Price: Low to High', zh: '价格：从低到高', ms: 'Harga: Rendah ke Tinggi' },
    priceDesc: { en: 'Price: High to Low', zh: '价格：从高到低', ms: 'Harga: Tinggi ke Rendah' },
    nameAsc: { en: 'Name: A to Z', zh: '名称：A 到 Z', ms: 'Nama: A ke Z' },
  };
  const st = (key: keyof typeof sortTranslations) => sortTranslations[key][locale as 'en'|'zh'|'ms'] || sortTranslations[key].en;

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories]         = useState<any[]>([]);
  const [sortBy, setSortBy]                 = useState<string>('newest');
  const [visibleProductCount, setVisibleProductCount] = useState(30);
  const [mobileView, setMobileView] = useState<'list' | 'grid'>('grid');
  const productsPerLoad = 30;

  // Read search query from URL (?q=)
  const searchQuery = (router.query.q as string) || '';
  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setVisibleProductCount(productsPerLoad);
  }, [activeCategory, searchQuery, searchInput]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftScroll(scrollLeft > 0);
    setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    setTimeout(handleScroll, 100);
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [categories, allProducts]);

  // Fetch from DB
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories')
        ]);
        const [prodData, catData] = await Promise.all([
          prodRes.json(),
          catRes.json()
        ]);

        const activeProducts = prodData.filter((p: any) =>
          p.status !== 'Hold' &&
          p.status !== 'Deactive' &&
          p.status !== 'Inactive' &&
          (p.stock !== undefined && p.stock > 0)
        );
        setAllProducts(activeProducts);
        setCategories(catData.filter((c: any) => c.status !== 'Hold' && c.showInCategoryBar !== false));
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sync category from URL query on mount / route change
  useEffect(() => {
    const cat = router.query.category as string | undefined;
    setActiveCategory(cat && cat !== '' ? cat : 'all');
  }, [router.query.category]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let list = allProducts;

    // 1. Category filter
    if (activeCategory !== 'all') {
      const activeCatObj = categories.find(c => {
        const key = c.code || c.key || c.name.toLowerCase().replace(/\s+/g, '');
        return key === activeCategory;
      });

      if (activeCatObj) {
        list = list.filter(p => p.category === activeCatObj.name);
      } else {
        list = list.filter(p => {
          const productCatKey = (p.category || '').toLowerCase().replace(/\s+/g, '');
          return productCatKey === activeCategory;
        });
      }
    }

    // 2. Search filter from URL ?q= param
    const q = searchInput.trim().toLowerCase();
    if (q) {
      list = list.filter(p =>
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.category || '').toLowerCase().includes(q) ||
        String(p.description || '').toLowerCase().includes(q)
      );
    }

    // 3. Sorting
    list = [...list];
    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-desc':
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'name-asc':
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      default: // 'newest'
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
    }

    return list;
  }, [allProducts, activeCategory, searchInput, sortBy]);

  const visibleProducts = filteredProducts.slice(0, visibleProductCount);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleCategoryClick = (key: string) => {
    setActiveCategory(key);
    // Preserve ?q= if active, update category
    const query: any = {};
    if (searchInput.trim()) query.q = searchInput.trim();
    if (key !== 'all') query.category = key;
    router.replace({ pathname: '/shop', query }, undefined, { shallow: true, scroll: false });
  };

  const clearSearch = () => {
    setSearchInput('');
    const query: any = {};
    if (activeCategory !== 'all') query.category = activeCategory;
    router.replace({ pathname: '/shop', query }, undefined, { shallow: true, scroll: false });
  };

  const handleProductSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query: any = {};
    const trimmedQuery = searchInput.trim();
    if (trimmedQuery) query.q = trimmedQuery;
    if (activeCategory !== 'all') query.category = activeCategory;
    router.replace({ pathname: '/shop', query }, undefined, { shallow: true, scroll: false });
  };

  // @ts-ignore
  const activeCatObj = useMemo(() => {
    return categories.find(c => {
      const key = c.code || c.key || c.name.toLowerCase().replace(/\s+/g, '');
      return key === activeCategory;
    });
  }, [categories, activeCategory]);

  const activeCategoryLabel = useMemo(() => {
    if (activeCategory === 'all') return t.shopCategories.all;
    if (activeCatObj) {
      if (locale === 'zh' && activeCatObj.nameZh) return activeCatObj.nameZh;
      if (locale === 'ms' && activeCatObj.nameMs) return activeCatObj.nameMs;
      return activeCatObj.name;
    }
    return (t.shopCategories as any)[activeCategory] || activeCategory;
  }, [activeCategory, activeCatObj, locale, t]);
  const allCategoryLabel = locale === 'zh' ? '全部分类' : locale === 'ms' ? 'Semua Kategori' : 'All Category';



  return (
    <div className="shop-page min-h-screen bg-white">
      <Head>
        <title>{`${t.nav.shop} - Cheng-BOOM`}</title>
        <meta name="description" content="Browse our entire fireworks collection." />
      </Head>



      {/* ── Page Header & Category Tab Bar ───────────────────────────────── */}
      <div className="bg-white">
        
        {/* ── HERO BANNER ────────────────────────────────────────────────── */}
        <section 
          className="shop-hero-banner relative flex flex-col items-center justify-center border-b border-zinc-100 bg-gradient-to-br from-[#e23a2b] via-[#d52b20] to-[#b51f26] bg-cover bg-top bg-no-repeat pt-5 pb-3 md:pt-12 md:pb-8 sm:bg-[length:100%_auto]"
        >
          <div className="shop-hero-mobile-summary relative z-20 mb-4 w-full px-4 pb-2 text-center md:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings?.watermarkUrl || '/transparent-Background.png'} alt={`${settings?.businessName || 'Cheng-BOOM'} transparent logo`} className="mx-auto h-12 max-w-[180px] object-contain drop-shadow-sm" />
          </div>
          <div className="relative z-20 mb-5 hidden w-full max-w-7xl mx-auto px-4 text-center sm:px-6 lg:px-8 md:block">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight drop-shadow-md"
            >
              {searchQuery ? `"${searchQuery}"` : activeCategoryLabel}
            </motion.h1>
            {!searchQuery && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto font-medium drop-shadow-sm"
              >
                {t.shop.categoriesInfo}
              </motion.p>
            )}
            {searchQuery && (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto font-medium drop-shadow-sm"
              >
                {t.shop.showing}&nbsp;
                <span className="font-bold text-white">{filteredProducts.length}</span>&nbsp;
                {t.shop.products}
                {' '}
                <button
                  onClick={clearSearch}
                  className="inline-flex items-center gap-1 ml-2 text-xs font-bold text-white/80 hover:underline opacity-80 hover:opacity-100 hover:text-white drop-shadow-sm"
                >
                  <X size={12} /> Clear search
                </button>
              </motion.p>
            )}
          </div>

          {/* ── Category Tab Bar ─────────────────────────────────────────── */}
          <div className="relative z-20 w-full">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 md:gap-4">

              {/* Left Scroll Button */}
              <div className="hidden md:flex items-center justify-center w-8 shrink-0">
                <AnimatePresence>
                  {showLeftScroll && (
                    <motion.button
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      onClick={() => {
                        scrollContainerRef.current?.scrollBy({ left: -250, behavior: 'smooth' });
                      }}
                      className="text-white/50 hover:text-white transition-colors focus:outline-none"
                    >
                      <ChevronLeft size={32} strokeWidth={1.5} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 flex gap-2 overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {/* "All" tab */}
                <button
                  onClick={() => handleCategoryClick('all')}
                  aria-pressed={activeCategory === 'all'}
                  className={[
                    'shop-category-tab relative shrink-0 flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap rounded-full drop-shadow-sm',
                    activeCategory === 'all'
                      ? 'text-zinc-900'
                      : 'text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm',
                  ].join(' ')}
                >
                  <span className="relative z-10">{allCategoryLabel}</span>
                  <span className={[
                    'relative z-10 inline-flex items-center justify-center min-w-[20px] sm:min-w-[24px] h-4 sm:h-5 px-1.5 sm:px-2 rounded-full text-[9px] sm:text-[10px] font-black transition-colors',
                    activeCategory === 'all'
                      ? 'bg-[#fff0ed] text-[#b51f26] shadow-sm'
                      : 'bg-white/20 text-white',
                  ].join(' ')}>
                    {allProducts.length}
                  </span>
                  {activeCategory === 'all' && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="shop-category-active absolute inset-0 rounded-full bg-primary shadow-[0_4px_15px_rgba(245,158,11,0.4)]"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>

                {/* Category tabs */}
                {categories.map(cat => {
                  const key = cat.code || cat.key || cat.name.toLowerCase().replace(/\s+/g, '');

                  let label = cat.name;
                  if (locale === 'zh' && cat.nameZh) {
                    label = cat.nameZh;
                  } else if (locale === 'ms' && cat.nameMs) {
                    label = cat.nameMs;
                  } else {
                    label = (t.shopCategories as any)[key] || cat.name;
                  }

                  const count = allProducts.filter(p => p.category === cat.name).length;
                  const isActive = activeCategory === key;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(key)}
                      aria-pressed={isActive}
                      className={[
                        'shop-category-tab relative shrink-0 flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap rounded-full drop-shadow-sm',
                        isActive
                          ? 'text-zinc-900'
                          : 'text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm',
                      ].join(' ')}
                    >
                      <span className="relative z-10">{label}</span>
                      <span className={[
                        'relative z-10 inline-flex items-center justify-center min-w-[20px] sm:min-w-[24px] h-4 sm:h-5 px-1.5 sm:px-2 rounded-full text-[9px] sm:text-[10px] font-black transition-colors',
                        isActive
                          ? 'bg-[#fff0ed] text-[#b51f26] shadow-sm'
                          : 'bg-white/20 text-white',
                      ].join(' ')}>
                        {count}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTabBackground"
                          className="shop-category-active absolute inset-0 rounded-full bg-primary shadow-[0_4px_15px_rgba(245,158,11,0.4)]"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right Scroll Button */}
              <div className="hidden md:flex items-center justify-center w-8 shrink-0">
                <AnimatePresence>
                  {showRightScroll && (
                    <motion.button
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 5 }}
                      onClick={() => {
                        scrollContainerRef.current?.scrollBy({ left: 250, behavior: 'smooth' });
                      }}
                      className="text-white/50 hover:text-white transition-colors focus:outline-none"
                    >
                      <ChevronRight size={32} strokeWidth={1.5} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </div>
      </section>
      </div>

      {/* ── Product Grid ──────────────────────────────────────────────────── */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-[calc(122px+env(safe-area-inset-bottom))] md:py-10">

        {/* Top Controls Row */}
        <div className="mb-5 flex w-full flex-row items-center gap-2 sm:mb-6 sm:justify-between sm:gap-5">
          <form onSubmit={handleProductSearch} role="search" className="relative flex min-w-0 flex-1 items-center max-w-[220px] sm:max-w-[520px]">
            <Search size={17} className="pointer-events-none absolute left-3 text-zinc-400" />
            <input
              type="text"
              inputMode="search"
              enterKeyHint="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={locale === 'zh' ? '搜索商品...' : locale === 'ms' ? 'Cari produk...' : 'Search products...'}
              aria-label={locale === 'zh' ? '搜索商品' : locale === 'ms' ? 'Cari produk' : 'Search products'}
              className="h-10 w-full min-w-0 rounded-full border border-zinc-200 bg-white py-2 pl-9 pr-4 text-xs text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-[#d92e20] focus:ring-2 focus:ring-[#d92e20]/10 sm:h-11 sm:text-sm"
            />
          </form>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setMobileView((view) => view === 'list' ? 'grid' : 'list')}
              aria-label={mobileView === 'list' ? 'Switch to grid view' : 'Switch to list view'}
              title={mobileView === 'list' ? 'Switch to grid view' : 'Switch to list view'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d92e20]/20 md:hidden"
            >
              {mobileView === 'list' ? <LayoutGrid size={17} /> : <List size={17} />}
            </button>
            <div className="flex min-w-0 items-center">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label={st('sortBy')}
                  className={`h-10 shrink-0 appearance-none rounded-full border border-zinc-200 bg-white py-2 pl-3 pr-7 text-xs font-bold text-zinc-900 whitespace-nowrap shadow-sm transition-colors hover:bg-zinc-50 focus:border-[#d92e20] focus:outline-none focus:ring-2 focus:ring-[#d92e20]/10 sm:w-auto sm:max-w-none sm:pl-4 sm:pr-10 sm:text-sm ${locale === 'ms' ? 'w-[180px]' : locale === 'zh' ? 'w-[140px]' : 'w-[148px]'}`}
                >
                  <option className="bg-white text-zinc-900" value="newest">{st('newest')}</option>
                  <option className="bg-white text-zinc-900" value="price-asc">{st('priceAsc')}</option>
                  <option className="bg-white text-zinc-900" value="price-desc">{st('priceDesc')}</option>
                  <option className="bg-white text-zinc-900" value="name-asc">{st('nameAsc')}</option>
                </select>
                <ChevronDown size={12} strokeWidth={2.5} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 sm:right-3.5 sm:h-[14px] sm:w-[14px]" />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-10 h-10 text-foreground/40 animate-spin mb-4" />
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">{locale === 'zh' ? '正在同步库存...' : locale === 'ms' ? 'Menyegerakkan Inventori...' : 'Syncing Inventory...'}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center min-h-[40vh] py-16 sm:py-32 px-4 text-center">
            <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">🔍</div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-zinc-900 mb-2">{t.shop.notFound}</h2>
            <p className="text-xs sm:text-base text-zinc-500 mb-6 max-w-[250px] sm:max-w-none mx-auto">{t.shop.noProductsTryAgain}</p>
          </div>
        ) : (
          /* Flat grid */
          <div className={`grid ${mobileView === 'list' ? 'grid-cols-1' : 'grid-cols-2'} gap-3.5 md:grid-cols-3 md:gap-5 lg:grid-cols-5 lg:gap-6`}>
            <AnimatePresence>
              {visibleProducts.map((product, index) => {
                const catObj = categories.find(c => c.name === product.category);
                return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.03,
                    ease: "easeOut"
                  }}
                  className="h-full w-full"
                >
                  <ProductCard {...product} categoryZh={catObj?.nameZh} categoryMs={catObj?.nameMs} mobileView={mobileView} />
                </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {!isLoading && visibleProducts.length < filteredProducts.length && (
          <div className="flex flex-col items-center pt-8 sm:pt-10">
            <p className="mb-3 text-xs font-medium text-zinc-500">
              {locale === 'zh'
                ? `已显示 ${visibleProducts.length} / ${filteredProducts.length} 件商品`
                : locale === 'ms'
                  ? `Menunjukkan ${visibleProducts.length} daripada ${filteredProducts.length} produk`
                  : `Showing ${visibleProducts.length} of ${filteredProducts.length} products`}
            </p>
            <button
              type="button"
              onClick={() => setVisibleProductCount((count) => Math.min(count + productsPerLoad, filteredProducts.length))}
              className="rounded-full bg-zinc-900 px-8 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
            >
              {locale === 'zh' ? '查看更多' : locale === 'ms' ? 'Lihat Lagi' : 'View More'}
            </button>
          </div>
        )}
      </div>
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            aria-label={locale === 'zh' ? '返回顶部' : 'Back to top'}
            title={locale === 'zh' ? '返回顶部' : 'Back to top'}
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            transition={{ duration: 0.18 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="shop-back-to-top fixed bottom-36 right-4 z-[160] flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-[#d92e20] text-white shadow-[0_8px_24px_rgba(120,20,20,0.28)] transition-colors hover:bg-[#b51f26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d92e20] focus-visible:ring-offset-2 md:hidden"
          >
            <ArrowUp size={21} strokeWidth={2.4} />
          </motion.button>
        )}
      </AnimatePresence>
      <style jsx global>{`
        .shop-hero-banner { background-image:linear-gradient(145deg,#e23a2b 0%,#d52b20 52%,#b51f26 100%) !important; }
        @media (min-width:768px) {
          .shop-hero-banner { background-image:linear-gradient(145deg,#e23a2b 0%,#d52b20 52%,#b51f26 100%) !important; }
          .shop-category-tab[aria-pressed="true"] { color:#b51f26 !important; }
          .shop-category-active { background:#fff !important; box-shadow:0 4px 15px rgba(105,20,22,.2) !important; }
        }
        @media (max-width:767px) {
          .shop-page { padding-top:calc(124px + max(20px,env(safe-area-inset-top))); }
          .shop-hero-banner { position:fixed !important; top:0; left:0; right:0; z-index:120; width:100%; padding-top:max(1.25rem,env(safe-area-inset-top)); }
          .shop-category-tab[aria-pressed="true"] { color:#b51f26 !important; }
          .shop-category-active { background:#fff !important; box-shadow:0 4px 14px rgba(105,20,22,.2) !important; }
        }
        @media (min-width:768px) { .shop-page { padding-top:0; } }
      `}</style>
    </div>
  );
}
