import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical, 
  Image as ImageIcon,
  Trash2,
  Edit,
  ExternalLink,
  X,
  Package,
  CheckCircle,
  Video as VideoIcon,
  AlertTriangle,
  Check
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';

const ProductPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Management States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: '', direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories')
      ]);
      const [prodData, catData] = await Promise.all([
        prodRes.json(),
        catRes.json()
      ]);
      setProducts(prodData);
      setCategories(catData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  // Sorting Logic
  const sortedProducts = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredProducts;

    return [...filteredProducts].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'price_active') {
        aVal = a.promotion && a.promotion < a.price ? a.promotion : a.price;
        bVal = b.promotion && b.promotion < b.price ? b.promotion : b.price;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProducts, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, currentPage]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedProducts.map(p => p.id));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    setIsBulkDeleting(true);
    try {
      const response = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (response.ok) {
        setProducts(products.filter(p => !selectedIds.includes(p.id)));
        setSelectedIds([]);
        setShowBulkDeleteModal(false);
      } else {
        alert('Failed to delete selected products');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setProducts(products.filter(p => p.id !== id));
        setSelectedIds(prev => prev.filter(i => i !== id));
      } else {
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const SortIndicator = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={12} className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronRight size={12} className="rotate-[-90deg] text-yellow-500" /> : <ChevronRight size={12} className="rotate-[90deg] text-yellow-500" />;
  };

  return (
    <AdminLayout title={t('inventory')}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
          <div className="flex gap-10">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t('total_products')}</p>
              <h4 className="text-3xl font-black italic dark:text-white text-zinc-900">{products.length}</h4>
            </div>
            <div className="pl-10 border-l border-zinc-500/10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t('live_products')}</p>
              <h4 className="text-3xl font-black italic text-green-500">
                {products.filter(p => p.status === 'Live').length}
              </h4>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 20 }}
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all"
                >
                  <Trash2 size={18} />
                  {t('delete_selected')} ({selectedIds.length})
                </motion.button>
              )}
            </AnimatePresence>
            <Link href="/admin/product/upload" className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-yellow-500 text-zinc-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-xl shadow-yellow-500/20 transition-all">
              <Plus size={18} strokeWidth={3} />
              {t('add_new_product')}
            </Link>
          </div>
        </div>

        {/* Toolbar: Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 p-4 bg-zinc-500/5 rounded-3xl border border-zinc-500/10 backdrop-blur-sm">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-12 pr-4 py-3 bg-zinc-500/5 border border-zinc-500/10 rounded-2xl outline-none focus:border-yellow-500/50 transition-all dark:text-white font-bold text-sm"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 bg-zinc-500/5 border border-zinc-500/10 rounded-2xl relative">
            <Filter size={16} className="text-zinc-500" />
            <select 
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent outline-none dark:text-white text-zinc-900 font-bold text-sm pr-8 appearance-none cursor-pointer"
            >
              <option value="All" className="dark:bg-zinc-900 bg-white">{t('all_categories')}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name} className="dark:bg-zinc-900 bg-white">
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 pointer-events-none text-zinc-500">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="border dark:border-white/10 border-zinc-100 rounded-[40px] overflow-hidden shadow-2xl dark:bg-zinc-900/20 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b dark:border-white/5 border-zinc-100 bg-zinc-500/5">
                  <th className="p-6 w-16">
                    <button 
                      onClick={handleSelectAll}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0
                          ? 'bg-yellow-500 border-yellow-500 text-zinc-900' 
                          : 'border-zinc-500/20 hover:border-zinc-500/50'
                      }`}
                    >
                      {selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0 && <Check size={14} strokeWidth={4} />}
                    </button>
                  </th>
                  <th 
                    onClick={() => handleSort('name')}
                    className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer group hover:text-yellow-500 transition-colors"
                  >
                    <div className="flex items-center gap-2">{t('products')} <SortIndicator column="name" /></div>
                  </th>
                  <th 
                    onClick={() => handleSort('category')}
                    className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer group hover:text-yellow-500 transition-colors"
                  >
                    <div className="flex items-center gap-2">{t('all_categories')} <SortIndicator column="category" /></div>
                  </th>
                  <th 
                    onClick={() => handleSort('stock')}
                    className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer group hover:text-yellow-500 transition-colors text-center"
                  >
                    <div className="flex items-center justify-center gap-2">{t('stock')} <SortIndicator column="stock" /></div>
                  </th>
                  <th 
                    onClick={() => handleSort('price_active')}
                    className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer group hover:text-yellow-500 transition-colors"
                  >
                    <div className="flex items-center gap-2">{t('price')} <SortIndicator column="price_active" /></div>
                  </th>
                  <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('status')}</th>
                  <th className="p-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-500/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-20 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Inventory...</td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-20 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs">No products match your filters.</td>
                  </tr>
                ) : paginatedProducts.map((p) => {
                  const hasPromotion = p.promotion !== null && p.promotion !== undefined && p.promotion < p.price;
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <tr 
                      key={p.id} 
                      className={`group hover:bg-zinc-500/5 transition-colors cursor-pointer ${isSelected ? 'bg-yellow-500/5' : ''}`} 
                      onClick={() => router.push(`/admin/product/${p.id}`)}
                    >
                      <td className="p-6" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => toggleSelect(p.id, e)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-yellow-500 border-yellow-500 text-zinc-900' 
                              : 'border-zinc-500/20 group-hover:border-zinc-500/50'
                          }`}
                        >
                          {isSelected && <Check size={14} strokeWidth={4} />}
                        </button>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-zinc-500/10 rounded-xl overflow-hidden flex items-center justify-center text-zinc-500 border border-white/5 shrink-0">
                            {p.images && p.images[0] ? (
                              <img src={p.images[0]} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={20} />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm dark:text-white text-zinc-900 group-hover:text-yellow-500 transition-colors line-clamp-1">{p.name}</span>
                            <span className="text-[9px] text-zinc-500 font-medium">ID: {p.id.slice(-6).toUpperCase()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="px-3 py-1 bg-zinc-500/10 rounded-full text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-6 text-center text-xs font-black text-zinc-400">{p.stock}</td>
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-yellow-500 italic">
                            RM {hasPromotion ? p.promotion.toFixed(2) : p.price.toFixed(2)}
                          </span>
                          {hasPromotion && (
                            <span className="text-[9px] text-zinc-500 line-through">RM {p.price.toFixed(2)}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          p.status === 'Live' ? 'bg-green-500/10 text-green-500' :
                          p.status === 'Low' ? 'bg-orange-500/10 text-orange-500' :
                          'bg-zinc-500/10 text-zinc-500'
                        }`}>
                          <div className={`w-1 h-1 rounded-full ${p.status === 'Live' ? 'bg-green-500' : p.status === 'Low' ? 'bg-orange-500' : 'bg-zinc-500'}`} />
                          {p.stock <= 0 ? 'Out of Stock' : p.stock < 10 ? 'Low Stock' : p.status}
                        </div>
                      </td>
                      <td className="p-6 text-right relative" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => setActiveDropdown(activeDropdown === p.id ? null : p.id)}
                          className="p-2 text-zinc-500 hover:text-white transition-colors"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        <AnimatePresence>
                          {activeDropdown === p.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-8 top-16 z-20 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl py-2 overflow-hidden text-left"
                              >
                                <Link href={`/admin/product/edit/${p.id}`} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-500/10 hover:text-white transition-colors">
                                  <Edit size={14} /> Edit Item
                                </Link>
                                <Link href={`/shop/${p.id}`} target="_blank" className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-500/10 hover:text-white transition-colors">
                                  <ExternalLink size={14} /> View Live
                                </Link>
                                <div className="h-px bg-zinc-500/5 my-1" />
                                <button 
                                  onClick={() => handleDelete(p.id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 size={14} /> Delete Product
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-6 border-t dark:border-white/5 border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-500/5">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              {t('showing')} {paginatedProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} {t('to')} {Math.min(currentPage * itemsPerPage, sortedProducts.length)} {t('of')} {products.length} {t('records')}
            </p>
            
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 rounded-xl bg-zinc-500/10 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                      currentPage === i + 1 
                        ? 'bg-yellow-500 text-zinc-900 shadow-lg shadow-yellow-500/20' 
                        : 'bg-zinc-500/5 text-zinc-500 hover:bg-zinc-500/10'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-2 rounded-xl bg-zinc-500/10 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Delete Confirmation Modal */}
      <AnimatePresence>
        {showBulkDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBulkDeleteModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[48px] p-12 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[28px] flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-3xl font-black italic uppercase tracking-tight mb-4 text-white">Permanent Deletion</h3>
              <p className="text-zinc-400 font-medium mb-10 leading-relaxed">
                You will forever delete <span className="text-white font-bold">{selectedIds.length} products</span> and won't be find back. All associated images will be permanently removed from storage.
              </p>
              
              <div className="flex gap-4">
                <button 
                  disabled={isBulkDeleting}
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-zinc-500 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={isBulkDeleting}
                  onClick={handleDeleteSelected}
                  className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isBulkDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Confirm Delete</>
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

export default ProductPage;
