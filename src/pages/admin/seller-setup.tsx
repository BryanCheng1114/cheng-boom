import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Award, Users, Plus, Edit, Trash2, Shield, Loader2, ArrowRight, HelpCircle, X, ChevronRight, Info, BarChart2, Search, Filter, Download, MoreVertical, ChevronDown, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from 'next/router';
// Force recompile

const SellerSetupPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [levels, setLevels] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [levelFilter, setLevelFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Level Form
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [levelForm, setLevelForm] = useState({ name: '', description: '', discountPercent: 0, freeShipping: false });
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  return (
    <AdminLayout title={t('seller_setup')} hideTitle={true}>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[28px] font-black text-zinc-900 tracking-tight">Seller Setup</h1>
            <p className="text-sm font-medium text-zinc-500 mt-1">Manage seller levels, discounts and monitor seller performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowTutorial(true)}
              className="px-5 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
            >
              <HelpCircle size={16} className="text-zinc-400" /> Help Guide
            </button>
            <button 
              onClick={() => openLevelModal()}
              className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <Plus size={16} /> Add Level
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-yellow-500" size={32} />
          </div>
        ) : (
          <div className="space-y-12">
            {/* Seller Levels */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {levels.map((level, index) => {
                const isSilver = level.name.toLowerCase().includes('silver');
                const isGold = level.name.toLowerCase().includes('gold');
                const isPlatinum = level.name.toLowerCase().includes('platinum');
                
                let iconBg = 'bg-zinc-100 text-zinc-400';
                if (isSilver) iconBg = 'bg-zinc-100 text-zinc-400';
                else if (isGold) iconBg = 'bg-yellow-100 text-yellow-500';
                else if (isPlatinum) iconBg = 'bg-purple-100 text-purple-500';

                let description = level.description || 'For new sellers getting started.';

                const levelSellers = sellers.filter(s => s.sellerLevelId === level.id);
                const activeSellers = levelSellers.filter(s => s.isActive).length;

                return (
                  <div key={level.id} className="bg-white border border-zinc-200 rounded-[24px] p-6 shadow-sm relative flex flex-col justify-between group">
                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <button onClick={() => openLevelModal(level)} className="w-7 h-7 rounded-md bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => openDeleteModal(level.id)} className="w-7 h-7 rounded-md bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
                        <Award size={28} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-black text-zinc-900 tracking-tight">{level.name}</h3>
                        </div>
                        <p className="text-xs font-medium text-zinc-500 max-w-[200px] truncate">{description}</p>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-zinc-100 grid grid-cols-4 gap-4">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Discount</span>
                        <span className="text-sm font-black text-green-500">{level.discountPercent}%</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 whitespace-nowrap">Free Shipping</span>
                        <span className={`text-sm font-black ${level.freeShipping ? 'text-green-500' : 'text-zinc-900'}`}>{level.freeShipping ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Sellers</span>
                        <span className="text-sm font-black text-zinc-900">{levelSellers.length}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Active</span>
                        <span className="text-sm font-black text-green-500">{activeSellers}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info Banner */}
            <div className="w-full rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Info size={20} className="text-blue-500" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm text-zinc-800 font-medium">Discount is applied to all orders placed by sellers at their respective tier level.</p>
                  <p className="text-sm text-zinc-500">You can create, edit or delete tiers to match your business needs.</p>
                </div>
              </div>
              <button onClick={() => router.push('/admin/seller-performance')} className="shrink-0 whitespace-nowrap px-4 py-2 bg-white border border-zinc-200 text-zinc-700 text-sm font-bold rounded-xl flex items-center gap-2 hover:bg-zinc-50 transition-colors shadow-sm">
                <BarChart2 size={16} className="text-zinc-400" /> View Performance Report
              </button>
            </div>
            
            {/* Seller List Table */}
            <div className="bg-white border border-zinc-200 rounded-[24px] shadow-sm flex flex-col">
              <div className="p-6 border-b border-zinc-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Sellers List</h2>
                  <p className="text-sm text-zinc-500 font-medium mt-1">Manage all seller accounts and their level assignments.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <select 
                      value={levelFilter}
                      onChange={(e) => setLevelFilter(e.target.value)}
                      className="appearance-none bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold pl-4 pr-10 py-2.5 rounded-xl focus:outline-none focus:border-zinc-400 transition-colors shadow-sm cursor-pointer"
                    >
                      <option value="all">All Levels</option>
                      {levels.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input type="text" placeholder="Search by name, email or phone..." className="pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium w-64 focus:outline-none focus:border-yellow-500 transition-colors shadow-sm placeholder:text-zinc-400" />
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Seller</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Contact</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Joined Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                        <div className="flex items-center gap-1">Performance (30 Days) <Info size={12} className="text-zinc-400" /></div>
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Current Level</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {sellers.filter(s => levelFilter === 'all' || s.sellerLevelId === levelFilter).map((seller, idx) => {
                      const initials = seller.name ? seller.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '??';
                      const colorVariants = ['bg-orange-100 text-orange-600', 'bg-green-100 text-green-600', 'bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600'];
                      const avatarClass = colorVariants[idx % colorVariants.length];
                      
                      const trendUp = idx % 2 === 0;
                      const trendVal = ((idx * 3.4) % 20 + 2.1).toFixed(1);

                      const sellerLevel = levels.find(l => l.id === seller.sellerLevelId);
                      const isSilver = sellerLevel?.name.toLowerCase().includes('silver');
                      const isGold = sellerLevel?.name.toLowerCase().includes('gold');
                      const isPlatinum = sellerLevel?.name.toLowerCase().includes('platinum');
                      
                      let levelIconClass = 'text-zinc-400';
                      if (isSilver) levelIconClass = 'text-zinc-400';
                      if (isGold) levelIconClass = 'text-yellow-500';
                      if (isPlatinum) levelIconClass = 'text-purple-500';

                      return (
                        <tr 
                          key={seller.id} 
                          onClick={() => router.push(`/admin/customer/${seller.id}?from=seller`)}
                          className="hover:bg-zinc-50/50 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${avatarClass}`}>
                                {initials}
                              </div>
                              <div>
                                <div className="font-bold text-sm text-zinc-900 leading-tight">{seller.name}</div>
                                <div className="text-xs text-zinc-400 mt-0.5 font-medium">ID: CUS-00012{idx + 3}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-zinc-700">{seller.phone || '-'}</div>
                            <div className="text-xs text-zinc-500 mt-0.5">{seller.email || '-'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-zinc-700">{new Date(seller.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            <div className="text-[11px] text-zinc-400 font-medium mt-0.5">{new Date(seller.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-zinc-900">RM {seller.totalSpent.toFixed(2)}</span>
                              <span className={`text-[10px] font-bold ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                                {trendUp ? '↑' : '↓'} {trendVal}%
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 font-medium mt-0.5">vs last 30 days</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative inline-block w-40">
                              <select
                                value={seller.sellerLevelId || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  updateSeller(seller.id, { sellerLevelId: e.target.value || null });
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="appearance-none w-full bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold pl-10 pr-8 py-2 rounded-xl focus:outline-none focus:border-zinc-400 transition-colors cursor-pointer relative z-10"
                              >
                                <option value="">No Level</option>
                                {levels.map(l => (
                                  <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                              </select>
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                                <Award size={16} strokeWidth={2.5} className={levelIconClass} />
                              </div>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-20" />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateSeller(seller.id, { isActive: !seller.isActive });
                              }}
                              className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors relative z-10 ${
                                seller.isActive ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-500'
                              }`}
                            >
                              {seller.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 relative z-10">
                              <button onClick={(e) => { e.stopPropagation(); router.push(`/admin/customer/${seller.id}`); }} className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent hover:border-zinc-200 hover:bg-zinc-50 text-zinc-400 transition-colors">
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {sellers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 text-sm font-medium">
                          No sellers found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="p-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs font-medium text-zinc-500">
                  Showing 1 to {Math.min(sellers.length, 5)} of {sellers.length} sellers
                </span>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <select className="appearance-none bg-white border border-zinc-200 text-zinc-700 text-xs font-bold pl-3 pr-8 py-1.5 rounded-lg focus:outline-none cursor-pointer">
                      <option>10 per page</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 transition-colors"><ChevronLeft size={14}/></button>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-yellow-600 bg-yellow-50 font-bold text-xs border border-yellow-200">1</button>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 font-bold text-xs hover:bg-zinc-100 transition-colors">2</button>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 font-bold text-xs hover:bg-zinc-100 transition-colors">3</button>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 font-bold text-xs hover:bg-zinc-100 transition-colors">4</button>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 font-bold text-xs hover:bg-zinc-100 transition-colors">5</button>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 transition-colors"><ChevronRightIcon size={14}/></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Level Modal */}
      {showLevelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white  border border-zinc-200  rounded-[40px] p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-black italic mb-6 ">{editingLevel ? t('edit_level') : t('new_seller_level')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">{t('level_name')}</label>
                <input type="text" value={levelForm.name} onChange={e => setLevelForm({...levelForm, name: e.target.value})} placeholder="e.g. Gold Tier" className="w-full bg-zinc-500/5 border border-zinc-500/20 rounded-2xl px-4 py-3 text-sm font-bold focus:border-yellow-500 outline-none " />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Description</label>
                <textarea value={levelForm.description} onChange={e => setLevelForm({...levelForm, description: e.target.value})} placeholder="e.g. Top tier for high performing sellers." className="w-full bg-zinc-500/5 border border-zinc-500/20 rounded-2xl px-4 py-3 text-sm font-bold focus:border-yellow-500 outline-none resize-none h-20" />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">{t('discount_percentage')}</label>
                <input type="number" min="0" max="100" value={levelForm.discountPercent} onChange={e => setLevelForm({...levelForm, discountPercent: Number(e.target.value)})} className="w-full bg-zinc-500/5 border border-zinc-500/20 rounded-2xl px-4 py-3 text-sm font-bold focus:border-yellow-500 outline-none " />
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-500/5 rounded-2xl border border-zinc-500/10">
                <span className="text-xs font-bold ">{t('free_shipping_eligibility')}</span>
                <input type="checkbox" checked={levelForm.freeShipping} onChange={e => setLevelForm({...levelForm, freeShipping: e.target.checked})} className="w-5 h-5 accent-yellow-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowLevelModal(false)} className="px-6 py-3 rounded-2xl text-xs font-bold text-zinc-500 hover:bg-zinc-500/10">{t('cancel')}</button>
              <button onClick={handleSaveLevel} className="px-6 py-3 bg-yellow-500 text-zinc-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110">{t('save_level')}</button>
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
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white  border border-zinc-200  rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-100 ">
                <h3 className="text-lg font-black text-zinc-900 ">
                  {t('delete')}
                </h3>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="text-zinc-400 hover:text-zinc-900 :text-white transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 text-left">
                <p className="text-zinc-600  font-medium">
                  {t('delete_level_confirm')}
                </p>
                
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200  :bg-zinc-700 text-zinc-900  transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleDeleteLevel}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20"
                  >
                    {t('delete')}
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white  border border-zinc-200  rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black italic tracking-tight  text-zinc-900">
                    {t('seller_setup_guide')}
                  </h3>
                  <button
                    onClick={() => setShowTutorial(false)}
                    className="w-8 h-8 rounded-full bg-zinc-100  flex items-center justify-center text-zinc-500 hover:text-zinc-900 :text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Step 1 */}
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div 
                      className="w-full md:w-1/2 bg-zinc-100  rounded-2xl border border-zinc-200  flex items-center justify-center relative overflow-hidden p-2 cursor-pointer hover:border-yellow-500 transition-colors group"
                      onClick={() => setSelectedImage("/seller%20guide/silver.png")}
                    >
                      <img src="/seller%20guide/silver.png" alt="Silver Tier Example" className="w-full h-auto object-contain rounded-xl shadow-md group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500 font-black text-xs mb-2">1</div>
                      <h4 className="text-lg font-bold  text-zinc-900">{t('silver_tier')}</h4>
                      <p className="text-sm text-zinc-500 ">{t('silver_tier_desc')} <span className="font-bold text-green-500">{t('five_percent_discount')}</span>{t('on_all_products_without_fs')}</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col md:flex-row-reverse gap-6 items-center">
                    <div 
                      className="w-full md:w-1/2 bg-zinc-100  rounded-2xl border border-zinc-200  flex items-center justify-center relative overflow-hidden p-2 cursor-pointer hover:border-yellow-500 transition-colors group"
                      onClick={() => setSelectedImage("/seller%20guide/gold.png")}
                    >
                      <img src="/seller%20guide/gold.png" alt="Gold Tier Example" className="w-full h-auto object-contain rounded-xl shadow-md group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 font-black text-xs mb-2">2</div>
                      <h4 className="text-lg font-bold  text-zinc-900">{t('gold_tier')}</h4>
                      <p className="text-sm text-zinc-500 ">{t('gold_tier_desc')} <span className="font-bold text-green-500">{t('ten_percent_discount')}</span>{t('on_all_products')}</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div 
                      className="w-full md:w-1/2 bg-zinc-100  rounded-2xl border border-zinc-200  flex items-center justify-center relative overflow-hidden p-2 cursor-pointer hover:border-yellow-500 transition-colors group"
                      onClick={() => setSelectedImage("/seller%20guide/platinum.png")}
                    >
                      <img src="/seller%20guide/platinum.png" alt="Platinum Tier Example" className="w-full h-auto object-contain rounded-xl shadow-md group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 font-black text-xs mb-2">3</div>
                      <h4 className="text-lg font-bold  text-zinc-900">{t('platinum_tier')}</h4>
                      <p className="text-sm text-zinc-500 ">{t('platinum_tier_desc')} <span className="font-bold text-green-500">{t('fifteen_percent_discount')}</span>{t('and_enable')}<span className="font-bold text-blue-500">{t('free_shipping')}</span>.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={() => setShowTutorial(false)}
                    className="px-8 py-3.5 bg-yellow-500 text-zinc-900 rounded-full font-black uppercase tracking-widest text-xs hover:brightness-110 shadow-lg shadow-yellow-500/20 transition-all flex items-center gap-2"
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
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              src={selectedImage}
              alt="Preview"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
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
