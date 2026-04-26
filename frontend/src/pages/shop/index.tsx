import Head from 'next/head';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getProducts, categoriesData } from '../../utils/mockData';
import { ProductCard } from '../../components/ui/ProductCard';
import { useTranslation } from '../../hooks/useTranslation';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc';

export default function Shop() {
  const router = useRouter();
  const { t } = useTranslation();
  const allProducts = getProducts();

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery]       = useState('');
  const [sortBy, setSortBy]                 = useState<SortOption>('default');
  const [sortOpen, setSortOpen]             = useState(false);

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
      list = list.filter(p => p.category === activeCategory);
    }

    // 2. Search filter (name or category key, case-insensitive)
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
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
    'default':    'Default Order',
    'price-asc':  'Price: Low → High',
    'price-desc': 'Price: High → Low',
    'name-asc':   'Name: A → Z',
  };

  // @ts-ignore
  const activeCategoryLabel = activeCategory === 'all'
    ? t.shopCategories.all
    : (t.shopCategories as any)[activeCategory] || activeCategory;

  return (
    <>
      <Head>
        <title>{t.nav.shop} - Cheng-BOOM</title>
        <meta name="description" content="Browse our entire fireworks collection." />
      </Head>

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-0">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-4 border border-primary/20">
              🎆 {t.shop.categoriesTitle}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
              {activeCategoryLabel}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">{t.shop.categoriesDesc}</p>
          </div>

          {/* ── Category Tab Bar ─────────────────────────────────────────── */}
          <div className="relative">
            <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {/* "All" tab */}
              <button
                onClick={() => handleCategoryClick('all')}
                className={[
                  'relative shrink-0 flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-t-xl transition-all duration-200 whitespace-nowrap border-b-2',
                  activeCategory === 'all'
                    ? 'text-primary border-primary bg-primary/5 dark:bg-primary/10'
                    : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/5',
                ].join(' ')}
              >
                ✨ {t.shopCategories.all}
                <span className={[
                  'inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[10px] font-black transition-colors',
                  activeCategory === 'all'
                    ? 'bg-primary text-zinc-900'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300',
                ].join(' ')}>
                  {allProducts.length}
                </span>
              </button>

              {/* Category tabs */}
              {categoriesData.map(cat => {
                const label = (t.shopCategories as any)[cat.key] || cat.key;
                const count = allProducts.filter(p => p.category === cat.key).length;
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryClick(cat.key)}
                    className={[
                      'relative shrink-0 flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-t-xl transition-all duration-200 whitespace-nowrap border-b-2',
                      isActive
                        ? 'text-primary border-primary bg-primary/5 dark:bg-primary/10'
                        : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-foreground hover:bg-zinc-100 dark:hover:bg-white/5',
                    ].join(' ')}
                  >
                    {label}
                    <span className={[
                      'inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[10px] font-black transition-colors',
                      isActive
                        ? 'bg-primary text-zinc-900'
                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300',
                    ].join(' ')}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* tab underline rule */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
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
              placeholder="Search products…"
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
              <span className="sm:hidden">Sort</span>
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
            <span> for "<span className="font-semibold text-primary">{searchQuery}</span>"</span>
          )}
        </p>

        {filteredProducts.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-extrabold text-foreground mb-2">{t.shop.notFound}</h2>
            <p className="text-muted-foreground mb-6">Try a different keyword or browse all categories.</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-zinc-900 font-bold text-sm hover:brightness-110 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              ✨ {t.shopCategories.all}
            </button>
          </div>
        ) : (
          /* Flat grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 w-full">
            {filteredProducts.map(product => <ProductCard key={product.id} {...product} />)}
          </div>
        )}
      </div>
    </>
  );
}
