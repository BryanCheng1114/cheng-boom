import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Award, Plus, Edit, Trash2, Loader2, HelpCircle, X, ChevronRight, Info, BarChart2, Search, UserX, ChevronDown, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from 'next/router';
// Force recompile

const SellerSetupPage = () => {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [levels, setLevels] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [levelFilter, setLevelFilter] = useState('all');
  const [sellerSearch, setSellerSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Level Form
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [levelForm, setLevelForm] = useState({ name: '', description: '', discountPercent: 0, freeShipping: false });
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Revoke seller state
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [sellerToRevoke, setSellerToRevoke] = useState<any>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [levelsRes, sellersRes] = await Promise.all([
        fetch('/api/seller-levels'),
        fetch('/api/sellers')
      ]);
      
      if (levelsRes.ok) setLevels(await levelsRes.json());
      if (sellersRes.ok) setSellers(await sellersRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLevel = async () => {
    try {
      const url = editingLevel ? `/api/seller-levels/${editingLevel.id}` : '/api/seller-levels';
      const method = editingLevel ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(levelForm),
      });
      if (res.ok) {
        setShowLevelModal(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to save level');
      }
    } catch (err) {
      alert('Error saving level');
    }
  };

  const handleDeleteLevel = async () => {
    if (!levelToDelete) return;
    try {
      const res = await fetch(`/api/seller-levels/${levelToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        setShowDeleteModal(false);
        setLevelToDelete(null);
      }
    } catch (err) {
      alert('Failed to delete level');
    }
  };

  const openDeleteModal = (id: string) => {
    setLevelToDelete(id);
    setShowDeleteModal(true);
  };

  const openLevelModal = (level?: any) => {
    if (level) {
      setEditingLevel(level);
      setLevelForm(level);
    } else {
      setEditingLevel(null);
      setLevelForm({ name: '', description: '', discountPercent: 0, freeShipping: false });
    }
    setShowLevelModal(true);
  };

  const updateSeller = async (sellerId: string, updates: any) => {
    try {
      const res = await fetch(`/api/sellers/${sellerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      alert('Failed to update seller');
    }
  };

  const handleRevokeSeller = async () => {
    if (!sellerToRevoke) return;
    setIsRevoking(true);
    try {
      const res = await fetch(`/api/customers/${sellerToRevoke.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Member', sellerLevelId: null }),
      });
      if (res.ok) {
        setShowRevokeModal(false);
        setSellerToRevoke(null);
        fetchData();
      } else {
        alert('Failed to revoke seller.');
      }
    } catch (err) {
      alert('Failed to revoke seller.');
    } finally {
      setIsRevoking(false);
    }
  };

  const filteredSellers = sellers.filter((seller) => {
    const matchesLevel = levelFilter === 'all' || seller.sellerLevelId === levelFilter;
    const query = sellerSearch.trim().toLowerCase();
    const matchesSearch = !query || [seller.name, seller.email, seller.phone, seller.id]
      .some(value => String(value || '').toLowerCase().includes(query));

    return matchesLevel && matchesSearch;
  });

  return (
    <AdminLayout title={t('seller_setup')} hideTitle={true}>
      <div className="space-y-6 text-slate-700">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-[26px] font-normal leading-tight tracking-tight text-slate-800">
              {t('seller_setup_title')} <span className="text-xs font-normal text-slate-600">[ Access ]</span>
            </h1>
            <p className="mt-1 text-xs text-slate-600">{t('seller_setup_desc')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setShowTutorial(true)}
              className="inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-sky-600 hover:bg-sky-50 hover:text-sky-800"
            >
              <HelpCircle size={16} className="text-sky-700" /> {t('help_guide')}
            </button>
            <button
              onClick={() => router.push('/admin/seller-performance')}
              className="inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-sky-600 hover:bg-sky-50 hover:text-sky-800"
            >
              <BarChart2 size={16} className="text-sky-700" /> {t('view_performance_report')}
            </button>
            <button 
              onClick={() => openLevelModal()}
              className="inline-flex items-center gap-2 border border-sky-800 bg-sky-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-800"
            >
              <Plus size={16} /> {t('add_level')}
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-sky-700" size={32} />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Seller Levels */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {levels.map((level) => {
                const iconBg = 'bg-sky-50 text-sky-700';

                const description = level.description || 'For new sellers getting started.';

                const levelSellers = sellers.filter(s => s.sellerLevelId === level.id);
                const activeSellers = levelSellers.filter(s => s.isActive).length;

                return (
                  <div key={level.id} className="group relative flex flex-col justify-between border border-slate-200 bg-white p-5 transition-colors hover:border-sky-300">
                    <div className="absolute right-5 top-5 flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <button onClick={() => openLevelModal(level)} className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-sky-700 transition-colors hover:border-sky-300 hover:bg-sky-50">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => openDeleteModal(level.id)} className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-red-600 transition-colors hover:border-red-200 hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center border border-sky-100 ${iconBg}`}>
                        <Award size={24} strokeWidth={2} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold tracking-tight text-slate-800">{level.name}</h3>
                        </div>
                        <p title={description} className="max-w-[240px] truncate text-xs text-slate-500">{description}</p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-slate-200 pt-5 sm:grid-cols-4">
                      <div className="flex flex-col items-center">
                        <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">{t('discount')}</span>
                        <span className="text-sm font-semibold text-sky-800">{level.discountPercent}%</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="mb-1 whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-slate-500">{t('free_shipping_label')}</span>
                        <span className={`text-sm font-semibold ${level.freeShipping ? 'text-sky-800' : 'text-slate-700'}`}>{level.freeShipping ? t('yes_label') : t('no_label')}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">{t('sellers_label')}</span>
                        <span className="text-sm font-semibold text-slate-800">{levelSellers.length}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">{t('active_count_label')}</span>
                        <span className="text-sm font-semibold text-slate-800">{activeSellers}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Seller List Table */}
            <div className="flex flex-col border border-slate-200 bg-white">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 xl:flex-row xl:items-center">
                <div>
                  <h2 className="text-lg font-medium tracking-tight text-slate-800">{t('sellers_list')}</h2>
                  <p className="mt-1 text-xs text-slate-500">{t('manage_sellers_desc')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <select 
                      value={levelFilter}
                      onChange={(e) => setLevelFilter(e.target.value)}
                      className="appearance-none border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-700 transition-colors focus:border-sky-600 focus:outline-none cursor-pointer"
                    >
                      <option value="all">{t('all_levels')}</option>
                      {levels.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={sellerSearch}
                      onChange={(e) => setSellerSearch(e.target.value)}
                      placeholder={t('search_seller_placeholder')}
                      className="w-full border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 transition-colors placeholder:text-slate-400 focus:border-sky-600 focus:outline-none sm:w-64"
                    />
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-100">
                      <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold text-slate-700">{t('seller_col')}</th>
                      <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold text-slate-700">{t('contact')}</th>
                      <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold text-slate-700">{t('joined_date')}</th>
                      <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold text-slate-700">
                        <div className="flex items-center gap-1">{t('performance_30_days')} <Info size={12} className="text-slate-500" /></div>
                      </th>
                      <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold text-slate-700">{t('current_level')}</th>
                      <th className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold text-slate-700">{t('status')}</th>
                      <th className="whitespace-nowrap px-5 py-3 text-right text-xs font-semibold text-slate-700">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredSellers.map((seller, idx) => {
                      const initials = seller.name ? seller.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '??';
                      const colorVariants = ['bg-sky-100 text-sky-800', 'bg-slate-100 text-slate-700', 'bg-blue-100 text-blue-800', 'bg-slate-100 text-slate-700'];
                      const avatarClass = colorVariants[idx % colorVariants.length];
                      
                      const trendUp = idx % 2 === 0;
                      const trendVal = ((idx * 3.4) % 20 + 2.1).toFixed(1);

                      const levelIconClass = 'text-sky-700';

                      return (
                        <tr 
                          key={seller.id} 
                          onClick={() => router.push(`/admin/customer/${seller.id}?from=seller`)}
                          className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} cursor-pointer transition-colors hover:bg-sky-50 group`}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${avatarClass}`}>
                                {initials}
                              </div>
                              <div>
                                <div className="text-sm font-semibold leading-tight text-slate-800">{seller.name}</div>
                                <div className="mt-0.5 text-xs text-slate-500">ID: CUS-00012{idx + 3}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-sm text-slate-700">{seller.phone || '-'}</div>
                            <div className="mt-0.5 text-xs text-slate-500">{seller.email || '-'}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-sm text-slate-700">
                              {new Date(seller.createdAt).toLocaleDateString(
                                language === 'zh' ? 'zh-CN' : language === 'ms' ? 'ms-MY' : 'en-US',
                                { month: 'short', day: 'numeric', year: 'numeric' }
                              )}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500">
                              {new Date(seller.createdAt).toLocaleTimeString(
                                language === 'zh' ? 'zh-CN' : language === 'ms' ? 'ms-MY' : 'en-US',
                                { hour: 'numeric', minute: '2-digit' }
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-800">RM {seller.totalSpent.toFixed(2)}</span>
                              <span className={`text-[10px] font-bold ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                                {trendUp ? '↑' : '↓'} {trendVal}%
                              </span>
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500">{t('vs_last_30_days')}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="relative inline-block w-40">
                              <select
                                value={seller.sellerLevelId || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  updateSeller(seller.id, { sellerLevelId: e.target.value || null });
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative z-10 w-full appearance-none border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm text-slate-700 transition-colors focus:border-sky-600 focus:outline-none cursor-pointer"
                              >
                                <option value="">{t('no_level')}</option>
                                {levels.map(l => (
                                  <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute left-3 top-1/2 z-20 -translate-y-1/2">
                                <Award size={15} strokeWidth={2} className={levelIconClass} />
                              </div>
                              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 z-20 -translate-y-1/2 text-slate-500" />
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateSeller(seller.id, { isActive: !seller.isActive });
                              }}
                              className={`relative z-10 inline-flex items-center border px-2.5 py-1 text-xs font-medium transition-colors ${
                                seller.isActive ? 'border-sky-200 bg-sky-50 text-sky-800' : 'border-slate-200 bg-slate-100 text-slate-600'
                              }`}
                            >
                              {seller.isActive ? t('active_status') : t('inactive_status')}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2 relative z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSellerToRevoke(seller);
                                  setShowRevokeModal(true);
                                }}
                                className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                title={t('revoke_seller')}
                              >
                                <UserX size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredSellers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                          {sellers.length === 0 ? t('no_sellers_found') : t('no_sellers_found')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 p-4 sm:flex-row">
                  <span className="text-xs text-slate-500">
                  {t('showing')} {filteredSellers.length ? 1 : 0} {t('to')} {filteredSellers.length} {t('of')} {filteredSellers.length} {t('sellers_label')}
                </span>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <select className="appearance-none border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-xs text-slate-700 focus:border-sky-600 focus:outline-none cursor-pointer">
                      <option>10 {t('per_page')}</option>
                    </select>
                    <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="flex h-8 w-8 items-center justify-center text-slate-500 transition-colors hover:bg-slate-100"><ChevronLeft size={14}/></button>
                    <button className="flex h-8 w-8 items-center justify-center border border-sky-700 bg-sky-700 text-xs font-medium text-white">1</button>
                    <button className="flex h-8 w-8 items-center justify-center text-xs text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-800">2</button>
                    <button className="flex h-8 w-8 items-center justify-center text-xs text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-800">3</button>
                    <button className="flex h-8 w-8 items-center justify-center text-xs text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-800">4</button>
                    <button className="flex h-8 w-8 items-center justify-center text-xs text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-800">5</button>
                    <button className="flex h-8 w-8 items-center justify-center text-slate-500 transition-colors hover:bg-slate-100"><ChevronRightIcon size={14}/></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Level Modal */}
      {showLevelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <h3 className="mb-6 text-xl font-semibold text-slate-800">{editingLevel ? t('edit_level') : t('new_seller_level')}</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-600">{t('level_name')}</label>
                <input type="text" value={levelForm.name} onChange={e => setLevelForm({...levelForm, name: e.target.value})} placeholder="e.g. Gold Tier" className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-sky-600" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-600">{t('description_label')}</label>
                <textarea value={levelForm.description} onChange={e => setLevelForm({...levelForm, description: e.target.value})} placeholder="e.g. Top tier for high performing sellers." className="h-20 w-full resize-none border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-sky-600" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-600">{t('discount_percentage')}</label>
                <input type="number" min="0" max="100" value={levelForm.discountPercent} onChange={e => setLevelForm({...levelForm, discountPercent: Number(e.target.value)})} className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-sky-600" />
              </div>
              <div className="flex items-center justify-between border border-slate-200 bg-slate-50 p-4">
                <span className="text-sm font-medium text-slate-700">{t('free_shipping_eligibility')}</span>
                <input type="checkbox" checked={levelForm.freeShipping} onChange={e => setLevelForm({...levelForm, freeShipping: e.target.checked})} className="h-5 w-5 accent-sky-700" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowLevelModal(false)} className="border border-slate-300 px-4 py-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">{t('cancel')}</button>
              <button onClick={handleSaveLevel} className="border border-sky-800 bg-sky-700 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-sky-800">{t('save_level')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Center Screen Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm overflow-hidden border border-slate-200 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <h3 className="text-lg font-semibold text-slate-800">
                  {t('delete')}
                </h3>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 text-slate-400 transition-colors hover:text-slate-800"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 text-left">
                <p className="text-sm text-slate-600">
                  {t('delete_level_confirm')}
                </p>
                
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleDeleteLevel}
                    className="flex-1 border border-red-700 bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revoke Confirmation Modal */}
      <AnimatePresence>
        {showRevokeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={() => setShowRevokeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm overflow-hidden border border-slate-200 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <h3 className="text-lg font-semibold text-slate-800">
                  {t('revoke_seller')}
                </h3>
                <button 
                  onClick={() => setShowRevokeModal(false)}
                  className="p-1 text-slate-400 transition-colors hover:text-slate-800"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 text-left">
                <p className="text-sm text-slate-600">
                  {t('revoke_seller_confirm')}
                </p>
                
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setShowRevokeModal(false)}
                    className="flex-1 border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleRevokeSeller}
                    disabled={isRevoking}
                    className="flex flex-1 items-center justify-center gap-2 border border-red-700 bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {isRevoking ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} />}
                    {t('revoke')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-slate-200 bg-white shadow-2xl"
            >
              <div className="p-8">
                <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
                  <h3 className="text-xl font-semibold tracking-tight text-slate-800">
                    {t('seller_setup_guide')}
                  </h3>
                  <button
                    onClick={() => setShowTutorial(false)}
                    className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Step 1 */}
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div 
                      className="relative flex w-full cursor-pointer items-center justify-center overflow-hidden border border-slate-200 bg-slate-50 p-2 transition-colors hover:border-sky-500 md:w-1/2 group"
                      onClick={() => setSelectedImage("/seller%20guide/silver.png")}
                    >
                      <img src="/seller%20guide/silver.png" alt="Silver Tier Example" className="w-full h-auto object-contain shadow-sm transition-transform duration-300 group-hover:scale-[1.02]" />
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                      <div className="mb-2 inline-flex h-8 w-8 items-center justify-center border border-sky-200 bg-sky-50 text-xs font-semibold text-sky-800">1</div>
                      <h4 className="text-base font-semibold text-slate-800">{t('silver_tier')}</h4>
                      <p className="text-sm text-slate-600">{t('silver_tier_desc')} <span className="font-semibold text-sky-800">{t('five_percent_discount')}</span>{t('on_all_products_without_fs')}</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col md:flex-row-reverse gap-6 items-center">
                    <div 
                      className="relative flex w-full cursor-pointer items-center justify-center overflow-hidden border border-slate-200 bg-slate-50 p-2 transition-colors hover:border-sky-500 md:w-1/2 group"
                      onClick={() => setSelectedImage("/seller%20guide/gold.png")}
                    >
                      <img src="/seller%20guide/gold.png" alt="Gold Tier Example" className="w-full h-auto object-contain shadow-sm transition-transform duration-300 group-hover:scale-[1.02]" />
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                      <div className="mb-2 inline-flex h-8 w-8 items-center justify-center border border-sky-200 bg-sky-50 text-xs font-semibold text-sky-800">2</div>
                      <h4 className="text-base font-semibold text-slate-800">{t('gold_tier')}</h4>
                      <p className="text-sm text-slate-600">{t('gold_tier_desc')} <span className="font-semibold text-sky-800">{t('ten_percent_discount')}</span>{t('on_all_products')}</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div 
                      className="relative flex w-full cursor-pointer items-center justify-center overflow-hidden border border-slate-200 bg-slate-50 p-2 transition-colors hover:border-sky-500 md:w-1/2 group"
                      onClick={() => setSelectedImage("/seller%20guide/platinum.png")}
                    >
                      <img src="/seller%20guide/platinum.png" alt="Platinum Tier Example" className="w-full h-auto object-contain shadow-sm transition-transform duration-300 group-hover:scale-[1.02]" />
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                      <div className="mb-2 inline-flex h-8 w-8 items-center justify-center border border-sky-200 bg-sky-50 text-xs font-semibold text-sky-800">3</div>
                      <h4 className="text-base font-semibold text-slate-800">{t('platinum_tier')}</h4>
                      <p className="text-sm text-slate-600">{t('platinum_tier_desc')} <span className="font-semibold text-sky-800">{t('fifteen_percent_discount')}</span>{t('and_enable')}<span className="font-semibold text-sky-800">{t('free_shipping')}</span>.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={() => setShowTutorial(false)}
                    className="inline-flex items-center gap-2 border border-sky-800 bg-sky-700 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-sky-800"
                  >
                    {t('got_it')} <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[1000] flex cursor-zoom-out items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm"
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              src={selectedImage}
              alt="Preview"
              className="max-h-[90vh] max-w-[90vw] border border-white/20 object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center border border-white/30 bg-slate-900/40 text-white transition-colors hover:bg-slate-800"
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </AdminLayout>
  );
};

export default SellerSetupPage;
