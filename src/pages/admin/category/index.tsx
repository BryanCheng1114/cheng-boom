import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Package,
  Edit,
  Image as ImageIcon,
  ChevronLeft,
  Layers,
  TrendingUp,
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
  const { t, language } = useLanguage();
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
    if (language === 'zh' && cat.nameZh) return cat.nameZh;
    if (language === 'ms' && cat.nameMs) return cat.nameMs;
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
    return result;
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

  const totalProducts = products.length;
  const liveProducts = products.filter((p) => p.status === 'Live').length;

  // Gradient palette to cycle through category cards
  const gradients = [
    'from-violet-500 to-indigo-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
    'from-sky-500 to-blue-600',
    'from-fuchsia-500 to-purple-600',
    'from-lime-500 to-green-600',
    'from-red-500 to-rose-600',
  ];

  const headerActions = (
    <Link
      href="/admin/category/new"
      className="flex items-center gap-2 px-6 py-2.5 bg-yellow-500 rounded-full text-[14px] font-bold text-zinc-800 tracking-wide hover:brightness-110 shadow-lg shadow-yellow-500/20 transition-all"
    >
      <Plus size={16} strokeWidth={3} />
      Add New Category
    </Link>
  );

  return (
    <AdminLayout title="Category Overview" headerActions={headerActions}>
      <div className="space-y-8">
        {/* ── KPI Summary Cards ───────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              label: 'Total Categories',
              value: categories.length,
              sub: 'Organized folders',
              icon: <Layers size={18} strokeWidth={2.5} />,
              color: 'bg-violet-500',
            },
            {
              label: 'Total Products',
              value: totalProducts,
              sub: 'Across all categories',
              icon: <Grid3x3 size={18} strokeWidth={2.5} />,
              color: 'bg-sky-500',
            },
            {
              label: 'On-Hold Category',
              value: categories.filter(c => c.status === 'Hold').length,
              sub: 'Hidden from frontend',
              icon: <AlertTriangle size={18} strokeWidth={2.5} />,
              color: 'bg-orange-500',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-zinc-100 rounded-3xl p-6 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <span className="text-[14px] font-bold text-zinc-800 tracking-wide">{stat.label}</span>
                </div>
              </div>
              <div className="flex items-end gap-3 mt-4">
                <h3 className="text-3xl font-bold text-zinc-800 tracking-wide leading-none">{stat.value}</h3>
                <p className="text-[12px] font-medium text-zinc-500 pb-0.5">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search + Grid ───────────────────────────────── */}
        <div className="bg-white border border-zinc-100 rounded-[40px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Top Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 pb-4 border-b border-zinc-100">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'All', label: 'All', count: categories.length },
                { id: 'Live', label: 'Live', count: categories.filter(c => c.status === 'Live').length },
                { id: 'Hold', label: 'Hold', count: categories.filter(c => c.status === 'Hold').length },
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => { setStatusFilter(filter.id); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                    statusFilter === filter.id 
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
                      : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                  }`}
                >
                  {filter.label} <span className="opacity-70 font-medium ml-1">({filter.count})</span>
                </button>
              ))}
            </div>

            {/* Right side: Search */}
            <div className="relative w-full sm:w-64 group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors"
                size={15}
              />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-full outline-none focus:border-blue-500 focus:bg-white transition-all text-[13px] font-bold text-zinc-700"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-100">
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Category ID
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Category Name
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">
                    Total Items
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-500/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Categories...</td>
                  </tr>
                ) : paginatedCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs">
                      {searchTerm ? 'No categories found' : 'No categories yet'}
                    </td>
                  </tr>
                ) : (
                  paginatedCategories.map((cat) => {
                    const count = products.filter((p) => p.category === cat.name).length;
                    return (
                      <tr 
                        key={cat.id}
                        onClick={() => router.push(`/admin/category/edit/${cat.id}`)}
                        className="group hover:bg-zinc-500/5 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-5">
                          {cat.code && (
                            <span className="text-[12px] font-bold text-zinc-500">#{cat.code}</span>
                          )}
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-zinc-500/10 rounded-xl overflow-hidden flex items-center justify-center text-zinc-500 border border-white/5 shrink-0">
                              {cat.image && cat.image !== '/example.png' ? (
                                <img src={cat.image} className="w-full h-full object-cover" />
                              ) : (
                                <Package size={20} />
                              )}
                            </div>
                            <span className="font-bold text-sm text-zinc-900 group-hover:text-yellow-500 transition-colors line-clamp-1">
                              {getLocalizedCategoryName(cat)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-center text-xs font-black text-zinc-400">
                          {count}
                        </td>
                        <td className="px-4 py-5">
                          <div 
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer hover:scale-105 hover:brightness-110 ${
                              cat.status === 'Live' ? 'bg-green-500/10 text-green-600  border border-green-500/20' :
                              cat.status === 'Hold' ? 'bg-orange-500/10 text-orange-600  border border-orange-500/20' :
                              'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${
                              cat.status === 'Live' ? 'bg-green-500 shadow-green-500/50' :
                              cat.status === 'Hold' ? 'bg-orange-500 shadow-orange-500/50' :
                              'bg-zinc-500 shadow-zinc-500/50'
                            }`} />
                            {cat.status === 'Live' ? 'Live' : cat.status === 'Hold' ? 'Hold' : 'Unknown'}
                          </div>
                        </td>
                        <td className="px-4 py-5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryToDelete(cat);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
              <p className="text-[12px] font-bold text-zinc-500">
                Showing <span className="text-zinc-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-zinc-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedCategories.length)}</span> of <span className="text-zinc-900">{filteredAndSortedCategories.length}</span> categories
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-white hover:text-zinc-900 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-xl text-[12px] font-bold transition-all ${
                        currentPage === i + 1 
                          ? 'bg-yellow-500 text-zinc-900 shadow-sm' 
                          : 'text-zinc-500 hover:bg-white hover:text-zinc-900 hover:shadow-sm border border-transparent hover:border-zinc-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-white hover:text-zinc-900 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
              <h3 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">Delete Category?</h3>
              <p className="text-zinc-500 font-medium mb-8">
                Are you sure you want to delete <span className="text-zinc-800 font-bold">"{categoryToDelete.name}"</span>? This action cannot be undone. All products under this category will lose their category association.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
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
                      Delete Category
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
