import Head from 'next/head';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { ProductCard } from '../../components/ui/ProductCard';
import { useTranslation } from '../../hooks/useTranslation';
import { Loader2, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { SharedCheckoutModal } from '../../components/checkout/SharedCheckoutModal';

export default function Shop() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Read search query from URL (?q=)
  const searchQuery = (router.query.q as string) || '';

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
        setCategories(catData);
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
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
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
  }, [allProducts, activeCategory, searchQuery, sortBy]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleCategoryClick = (key: string) => {
    setActiveCategory(key);
    // Preserve ?q= if active, update category
    const query: any = {};
    if (searchQuery) query.q = searchQuery;
    if (key !== 'all') query.category = key;
    router.replace({ pathname: '/shop', query }, undefined, { shallow: true, scroll: false });
  };

  const clearSearch = () => {
    const query: any = {};
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

  // Sync checkout modal from URL query (derived state)
  const checkoutProductId = router.isReady ? (router.query.buy as string) : null;
  const checkoutProduct = checkoutProductId ? allProducts.find(p => p.id === checkoutProductId) : null;

  return (
    <>
      <Head>
        <title>{`${t.nav.shop} - Cheng-BOOM`}</title>
        <meta name="description" content="Browse our entire fireworks collection." />
      </Head>

      {checkoutProduct && (
        <SharedCheckoutModal
          mode="single"
          product={checkoutProduct}
          onClose={() => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { buy, ...restQuery } = router.query;
            router.push({ pathname: '/shop', query: restQuery }, undefined, { shallow: true, scroll: false });
          }}
        />
      )}

      {/* ── Page Header & Category Tab Bar ───────────────────────────────── */}
      <div className="bg-black">
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-48 pb-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
              {searchQuery ? `"${searchQuery}"` : activeCategoryLabel}
            </h1>
            {searchQuery && (
              <p className="mt-4 text-white/80 text-sm">
                {t.shop.showing}&nbsp;
                <span className="font-bold text-white">{filteredProducts.length}</span>&nbsp;
                {t.shop.products}
                {' '}
                <button
                  onClick={clearSearch}
                  className="inline-flex items-center gap-1 ml-2 text-xs font-bold text-white hover:underline opacity-70 hover:opacity-100"
                >
                  <X size={12} /> Clear search
                </button>
              </p>
            )}
            {!searchQuery && (
              <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto drop-shadow-md">{t.shop.categoriesDesc}</p>
            )}
          </div>
        </div>

        {/* ── Category Tab Bar ─────────────────────────────────────────── */}
        <div className="relative bg-transparent border-y border-white/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                  className={[
                    'relative shrink-0 flex items-center gap-2 px-6 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap rounded-full drop-shadow-md',
                    activeCategory === 'all'
                      ? 'text-zinc-900'
                      : 'text-white/90 hover:text-white hover:bg-white/10',
                  ].join(' ')}
                >
                  <span className="relative z-10">{t.shopCategories.all}</span>
                  <span className={[
                    'relative z-10 inline-flex items-center justify-center min-w-[24px] h-5 px-2 rounded-full text-[10px] font-black transition-colors shadow-sm',
                    activeCategory === 'all'
                      ? 'bg-white/90 text-zinc-900 border border-zinc-900/5'
                      : 'bg-white/10 text-white/70',
                  ].join(' ')}>
                    {allProducts.length}
                  </span>
                  {activeCategory === 'all' && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 bg-primary rounded-full shadow-[0_4px_15px_rgba(245,158,11,0.4)]"
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
                      className={[
                        'relative shrink-0 flex items-center gap-2 px-6 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap rounded-full drop-shadow-md',
                        isActive
                          ? 'text-zinc-900'
                          : 'text-white/90 hover:text-white hover:bg-white/10',
                      ].join(' ')}
                    >
                      <span className="relative z-10">{label}</span>
                      <span className={[
                        'relative z-10 inline-flex items-center justify-center min-w-[24px] h-5 px-2 rounded-full text-[10px] font-black transition-colors shadow-sm',
                        isActive
                          ? 'bg-white/90 text-zinc-900 border border-zinc-900/5'
                          : 'bg-white/10 text-white/70',
                      ].join(' ')}>
                        {count}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTabBackground"
                          className="absolute inset-0 bg-primary rounded-full shadow-[0_4px_15px_rgba(245,158,11,0.4)]"
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
      </div>

      {/* ── Product Grid ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Top Controls Row */}
        {filteredProducts.length > 0 && !isLoading && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <p className="text-sm text-muted-foreground">
              {t.shop.showing}&nbsp;
              <span className="font-bold text-foreground">{filteredProducts.length}</span>&nbsp;
              {t.shop.products}
            </p>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-1 font-medium">{st('sortBy')}</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-transparent hover:text-foreground/80 text-foreground text-sm font-bold py-1 pl-2 pr-6 transition-colors cursor-pointer outline-none focus:ring-0 focus:outline-none"
                >
                  <option className="bg-background text-foreground" value="newest">{st('newest')}</option>
                  <option className="bg-background text-foreground" value="price-asc">{st('priceAsc')}</option>
                  <option className="bg-background text-foreground" value="price-desc">{st('priceDesc')}</option>
                  <option className="bg-background text-foreground" value="name-asc">{st('nameAsc')}</option>
                </select>
                <ChevronDown size={14} strokeWidth={2.5} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-foreground" />
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-10 h-10 text-foreground/40 animate-spin mb-4" />
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Syncing Inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center min-h-[50vh] py-32 text-center">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">{t.shop.notFound}</h2>
            <p className="text-muted-foreground mb-6">{t.shop.noProductsTryAgain}</p>
          </div>
        ) : (
          /* Flat grid */
          <div
  className="
    grid
    grid-cols-1
    sm:grid-cols-2
    md:grid-cols-3
    lg:grid-cols-4
    gap-6
  "
>
            <AnimatePresence>
              {filteredProducts.map((product, index) => {
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
                 className="h-full w-full lg:w-[286px]"
                >
                  <ProductCard {...product} categoryZh={catObj?.nameZh} categoryMs={catObj?.nameMs} />
                </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );
}
