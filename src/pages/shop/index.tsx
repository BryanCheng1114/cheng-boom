import Head from 'next/head';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { categoriesData } from '../../utils/mockData';
import { ProductCard } from '../../components/ui/ProductCard';
import { useTranslation } from '../../hooks/useTranslation';
import { Search, SlidersHorizontal, X, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';

export default function Shop() {
  const router = useRouter();
  const { t } = useTranslation();
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery]       = useState('');
  const [sortBy, setSortBy]                 = useState<SortOption>('default');
  const [sortOpen, setSortOpen]             = useState(false);
  const [categories, setCategories]         = useState<any[]>([]);

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
        setAllProducts(prodData);
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
      list = list.filter(p => {
        const productCatKey = (p.category || '').toLowerCase().replace(/\s+/g, '');
        return productCatKey === activeCategory;
      });
    }

    // 2. Search filter (name or category key, case-insensitive)
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    // 3. Sort
    const sorted = [...list];
    if (sortBy === 'price-asc')  sorted.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    if (sortBy === 'name-asc')   sorted.sort((a, b) => a.name.localeCompare(b.name));

    return sorted;
  }, [allProducts, activeCategory, searchQuery, sortBy]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleCategoryClick = (key: string) => {
    setActiveCategory(key);
    setSearchQuery('');
    // Update URL query param without full navigation
    router.replace(
      { pathname: '/shop', query: key === 'all' ? {} : { category: key } },
      undefined,
      { shallow: true, scroll: false }
    );
  };

  const sortLabels: Record<SortOption, string> = {
    'default':    t.shop.sortDefault,
    'price-asc':  t.shop.sortPriceAsc,
    'price-desc': t.shop.sortPriceDesc,
    'name-asc':   t.shop.sortNameAsc,
  };

  // @ts-ignore
  const activeCategoryLabel = activeCategory === 'all'
    ? t.shopCategories.all
    : (t.shopCategories as any)[activeCategory] || activeCategory;

  return (
    <>
      <Head>
        <title>{`${t.nav.shop} - Cheng-BOOM`}</title>
        <meta name="description" content="Browse our entire fireworks collection." />
      </Head>

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
              {activeCategoryLabel}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">{t.shop.categoriesDesc}</p>
          </div>

          {/* ── Category Tab Bar ─────────────────────────────────────────── */}
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {/* "All" tab */}
              <button
                onClick={() => handleCategoryClick('all')}
                className={[
                  'relative shrink-0 flex items-center gap-2 px-6 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap rounded-full',
                  activeCategory === 'all'
                    ? 'text-zinc-900'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/5',
                ].join(' ')}
              >
                <span className="relative z-10">{t.shopCategories.all}</span>
                <span className={[
                  'relative z-10 inline-flex items-center justify-center min-w-[24px] h-5 px-2 rounded-full text-[10px] font-black transition-colors shadow-sm',
                  activeCategory === 'all'
                    ? 'bg-white/90 text-zinc-900 border border-zinc-900/5'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
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
                const key = cat.key || cat.name.toLowerCase().replace(/\s+/g, '');
                const label = (t.shopCategories as any)[key] || cat.name;
                const count = allProducts.filter(p => (p.category || '').toLowerCase().replace(/\s+/g, '') === key).length;
                const isActive = activeCategory === key;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(key)}
                    className={[
                      'relative shrink-0 flex items-center gap-2 px-6 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap rounded-full',
                      isActive
                        ? 'text-zinc-900'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/5',
                    ].join(' ')}
                  >
                    <span className="relative z-10">{label}</span>
                    <span className={[
                      'relative z-10 inline-flex items-center justify-center min-w-[24px] h-5 px-2 rounded-full text-[10px] font-black transition-colors shadow-sm',
                      isActive
                        ? 'bg-white/90 text-zinc-900 border border-zinc-900/5'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
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
          </div>
        </div>
      </div>

      {/* ── Search + Sort Bar ─────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex gap-3 items-center">

          {/* Search input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              id="shop-search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t.shop.searchPlaceholder}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative shrink-0">
            <button
              id="shop-sort-btn"
              onClick={() => setSortOpen(o => !o)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-foreground hover:border-primary/50 transition-all"
            >
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline">{sortLabels[sortBy]}</span>
              <span className="sm:hidden">{t.shop.sortBy}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
            </button>

            {sortOpen && (
              <>
                {/* backdrop */}
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-20 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 py-2 overflow-hidden">
                  {(Object.entries(sortLabels) as [SortOption, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setSortBy(key); setSortOpen(false); }}
                      className={[
                        'w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                        sortBy === key
                          ? 'text-primary font-bold bg-primary/5 dark:bg-primary/10'
                          : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5',
                      ].join(' ')}
                    >
                      {sortBy === key && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      {sortBy !== key && <span className="w-1.5 h-1.5 shrink-0" />}
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Product Grid ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Result count */}
        <p className="text-sm text-muted-foreground mb-6">
          {t.shop.showing}&nbsp;
          <span className="font-bold text-foreground">{filteredProducts.length}</span>&nbsp;
          {t.shop.products}
          {searchQuery && (
            <span> {t.shop.for} "<span className="font-semibold text-primary">{searchQuery}</span>"</span>
          )}
        </p>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Syncing Inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">{t.shop.notFound}</h2>
            <p className="text-muted-foreground mb-6">{t.shop.noProductsTryAgain}</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-zinc-900 font-bold text-sm hover:brightness-110 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              ✨ {t.shopCategories.all}
            </button>
          </div>
        ) : (
          /* Flat grid */
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-5 gap-y-10 w-full"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.03,
                    ease: "easeOut"
                  }}
                >
                  <ProductCard {...product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </>
  );
}
