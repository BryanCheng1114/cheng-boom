import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil,
  Search,
  Package,
  ChevronLeft,
  Layers,
  Grid3x3,
  AlertTriangle,
  Trash2,
  ChevronRight,
  X
} from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import Link from 'next/link';
import { useLanguage } from '../../../context/LanguageContext';

const CategoryOverviewPage = () => {
  const router = useRouter();
  const { t, language: locale } = useLanguage();
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getLocalizedCategoryName = (cat: any) => {
    if (locale === 'zh' && cat.nameZh) return cat.nameZh;
    if (locale === 'ms' && cat.nameMs) return cat.nameMs;
    return cat.name || '-';
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products'),
        ]);
        const [catData, prodData] = await Promise.all([catRes.json(), prodRes.json()]);
        setCategories(Array.isArray(catData) ? catData : []);
        setProducts(Array.isArray(prodData) ? prodData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredAndSortedCategories = useMemo(() => {
    let result = categories;
    
    // Status Filter
    if (statusFilter !== 'All') {
      result = result.filter((cat) => cat.status === statusFilter);
    }
    
    // Search Term Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (cat) =>
          cat.name?.toLowerCase().includes(q) ||
          cat.code?.toLowerCase().includes(q) ||
          cat.nameZh?.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) =>
      Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0) ||
      String(a.name || '').localeCompare(String(b.name || ''))
    );
  }, [categories, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredAndSortedCategories.length / ITEMS_PER_PAGE);
  const paginatedCategories = filteredAndSortedCategories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDeleteSingle = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCategories(categories.filter((c) => c.id !== categoryToDelete.id));
        setCategoryToDelete(null);
        setShowDeleteModal(false);
      } else {
        alert('Failed to delete category');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const liveProducts = products.filter((p) => p.status === 'Live').length;
  const categoryRangeLabel = t('showing_categories_range')
    .replace('{start}', String((currentPage - 1) * ITEMS_PER_PAGE + 1))
    .replace('{end}', String(Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedCategories.length)))
    .replace('{total}', String(filteredAndSortedCategories.length));

  return (
    <AdminLayout title={t('category_overview') || 'Category Overview'} hideTitle>
      <div className="space-y-5">
        <header className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h1 className="text-[26px] font-normal leading-tight tracking-tight text-slate-800">{t('category_overview') || 'Category Overview'}</h1>
            <span className="text-xs font-normal text-slate-700">[ {t('access')} ]</span>
          </div>
          <p className="text-xs text-slate-600">{t('category_info')} /</p>
        </header>

        <div>
          <Link
            href="/admin/category/new"
            className="inline-flex items-center gap-2 border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Pencil size={14} />
            {t('new_entry')}
          </Link>
        </div>

        {/* ── KPI Summary Cards ───────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              label: t('total_categories') || 'Total Categories',
              value: categories.length,
              sub: t('organized_folders') || 'Organized folders',
              icon: <Layers size={18} strokeWidth={1.8} />,
            },
            {
              label: t('total_products') || 'Total Products',
              value: liveProducts,
              sub: t('across_all_categories') || 'Across all categories',
              icon: <Grid3x3 size={18} strokeWidth={1.8} />,
            },
            {
              label: t('on_hold_category') || 'On-Hold Category',
              value: categories.filter(c => c.status === 'Hold').length,
              sub: t('hidden_from_frontend') || 'Hidden from frontend',
              icon: <AlertTriangle size={18} strokeWidth={1.8} />,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-slate-200 p-5 min-h-[150px] flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-500">
                  {stat.icon}
                  <span className="text-sm font-medium text-slate-700">{stat.label}</span>
                </div>
              </div>
              <div className="flex items-end gap-3 mt-4">
                <h3 className="text-2xl font-semibold text-slate-900 tracking-tight leading-none">{stat.value}</h3>
                <p className="text-xs font-medium text-slate-500 pb-0.5">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search + Grid ───────────────────────────────── */}
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          {/* Top Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 pb-4 border-b border-slate-100">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'All', label: t('all') || 'All', count: categories.length },
                { id: 'Live', label: t('live') || 'Live', count: categories.filter(c => c.status === 'Live').length },
                { id: 'Hold', label: t('hold') || 'Hold', count: categories.filter(c => c.status === 'Hold').length },
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => { setStatusFilter(filter.id); setCurrentPage(1); }}
                  className={`px-4 py-2 text-[13px] font-medium transition-all ${
                    statusFilter === filter.id 
                      ? 'bg-sky-700 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {filter.label} <span className="opacity-70 font-medium ml-1">({filter.count})</span>
                </button>
              ))}
            </div>

            {/* Right side: Search */}
            <div className="relative w-full sm:w-64 group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors"
                size={15}
              />
              <input
                type="text"
                placeholder={locale === 'zh' ? '搜索分类...' : locale === 'ms' ? 'Cari kategori...' : 'Search categories...'}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 outline-none focus:border-sky-500 focus:bg-white transition-all text-[13px] font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-[11px] font-medium text-slate-500 uppercase tracking-wide">{t('category_id') || 'Category ID'}</th>
                  <th className="px-6 py-4 text-[11px] font-medium text-slate-500 uppercase tracking-wide">{t('category_name') || 'Category Name'}</th>
                  <th className="px-6 py-4 text-[11px] font-medium text-slate-500 uppercase tracking-wide text-center">{t('display_order') || 'Display Order'}</th>
                  <th className="px-6 py-4 text-[11px] font-medium text-slate-500 uppercase tracking-wide text-center">{t('total_items') || 'Total Items'}</th>
                  <th className="px-6 py-4 text-[11px] font-medium text-slate-500 uppercase tracking-wide text-center">{t('status') || 'Status'}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-20 text-center text-slate-500 font-medium text-xs animate-pulse">Loading Categories...</td>
                  </tr>
                ) : paginatedCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-20 text-center text-slate-500 font-medium text-xs">
                      {searchTerm ? 'No categories found' : 'No categories yet'}
                    </td>
                  </tr>
                ) : (
                  paginatedCategories.map((cat, index) => {
                    const count = products.filter((p) => p.category === cat.name).length;
                    return (
                      <tr 
                        key={cat.id}
                        onClick={() => router.push(`/admin/category/edit/${cat.id}`)}
                        className={`group transition-colors cursor-pointer hover:bg-sky-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                      >
                        <td className="px-4 py-5">
                          {cat.code && (
                            <span className="text-xs font-medium text-slate-500">#{cat.code}</span>
                          )}
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 overflow-hidden flex items-center justify-center text-slate-500 border border-slate-200 shrink-0">
                              {cat.image && cat.image !== '/example.png' ? (
                                <img src={cat.image} className="w-full h-full object-cover" />
                              ) : (
                                <Package size={20} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="block font-medium text-sm text-slate-800 group-hover:text-sky-700 transition-colors line-clamp-1">
                                {getLocalizedCategoryName(cat)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-center">
                          <span className="inline-flex min-w-9 items-center justify-center bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {cat.displayOrder ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-5 text-center text-xs font-medium text-slate-500">
                          {count}
                        </td>
                        <td className="px-4 py-5 text-center">
                          <div 
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-wide transition-all ${
                              cat.status === 'Live' ? 'bg-emerald-100 text-emerald-700' :
                              cat.status === 'Hold' ? 'bg-orange-100 text-orange-700' :
                              'bg-zinc-100 text-zinc-600'
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              cat.status === 'Live' ? 'bg-emerald-500' :
                              cat.status === 'Hold' ? 'bg-orange-500' :
                              'bg-zinc-400'
                            }`} />
                            {cat.status === 'Live' ? (t('live') || 'Live') : cat.status === 'Hold' ? (t('hold') || 'Hold') : 'Unknown'}
                          </div>
                        </td>
                        <td className="px-4 py-5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryToDelete(cat);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
              <p className="text-xs font-medium text-slate-500">
                {categoryRangeLabel}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 text-xs font-medium transition-all ${
                        currentPage === i + 1 
                          ? 'bg-sky-700 text-white shadow-sm'
                          : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm border border-transparent hover:border-slate-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
          </div>
        </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && categoryToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">{t('delete_category_title') || 'Delete Category?'}</h3>
              <p className="text-zinc-500 font-medium mb-8">
                {t('delete_category_q') || 'Are you sure you want to delete'} <span className="text-zinc-800 font-bold">"{getLocalizedCategoryName(categoryToDelete)}"</span>{t('delete_category_warn') || '? This action cannot be undone. All products under this category will lose their category association.'}
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold transition-colors"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button 
                  onClick={handleDeleteSingle}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={18} />
                      {t('delete_category_btn') || 'Delete Category'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AdminLayout>
  );
};

export default CategoryOverviewPage;
