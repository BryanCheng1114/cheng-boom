import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Award, Users, Plus, Edit, Trash2, Shield, Loader2, ArrowRight, HelpCircle, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SellerSetupPage = () => {
  const [activeTab, setActiveTab] = useState<'levels' | 'sellers'>('levels');
  const [levels, setLevels] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Level Form
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [levelForm, setLevelForm] = useState({ name: '', discountPercent: 0, freeShipping: false });
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'levels') {
        const res = await fetch('/api/seller-levels');
        if (res.ok) setLevels(await res.json());
      } else {
        const res = await fetch('/api/sellers');
        if (res.ok) setSellers(await res.json());
      }
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

  const handleDeleteLevel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this level? Sellers in this level will lose their benefits.')) return;
    try {
      const res = await fetch(`/api/seller-levels/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      alert('Failed to delete level');
    }
  };

  const openLevelModal = (level?: any) => {
    if (level) {
      setEditingLevel(level);
      setLevelForm(level);
    } else {
      setEditingLevel(null);
      setLevelForm({ name: '', discountPercent: 0, freeShipping: false });
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
    <AdminLayout title="Seller Setup">
      <div className="space-y-6">
        
        {/* Header Row: Toggle & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Sliding Tabs Toggle */}
          <div className="relative inline-flex p-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-full border border-zinc-200 dark:border-white/5 shadow-inner">
            {[
              { id: 'levels', label: 'Seller Levels', icon: Award },
              { id: 'sellers', label: 'Sellers List', icon: Users }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative z-10 flex items-center gap-2 px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-colors ${
                    isActive ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="sellerTabsToggle"
                      className="absolute inset-0 bg-yellow-500 rounded-full z-[-1] shadow-lg shadow-yellow-500/30"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          {activeTab === 'levels' && (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowTutorial(true)}
                className="w-11 h-11 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors shadow-inner"
              >
                <HelpCircle size={20} />
              </button>
              <button 
                onClick={() => openLevelModal()}
                className="flex items-center gap-2 px-6 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-xl w-full sm:w-auto justify-center"
              >
                <Plus size={16} /> Add Level
              </button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-yellow-500" size={32} />
          </div>
        ) : activeTab === 'levels' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {levels.map((level) => (
                <div key={level.id} className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-[32px] p-6 shadow-xl relative group">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <button onClick={() => openLevelModal(level)} className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-colors">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDeleteLevel(level.id)} className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white mb-6 shadow-lg shadow-yellow-500/20">
                    <Award size={32} />
                  </div>
                  <h3 className="text-2xl font-black italic dark:text-white text-zinc-900 mb-2">{level.name}</h3>
                  <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Discount</span>
                      <span className="text-sm font-black text-green-500">{level.discountPercent}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Free Shipping</span>
                      <span className={`text-sm font-black ${level.freeShipping ? 'text-blue-500' : 'text-zinc-500'}`}>{level.freeShipping ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-[40px] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b dark:border-white/10 bg-zinc-500/5">
                    <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Seller Name</th>
                    <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Contact</th>
                    <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Performance</th>
                    <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Current Level</th>
                    <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
                    <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-white/5 divide-zinc-100">
                  {sellers.map((seller) => (
                    <tr key={seller.id} className="hover:bg-zinc-500/5 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-zinc-500/10 flex items-center justify-center text-zinc-500 font-black italic">
                            {seller.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm dark:text-white text-zinc-900">{seller.name}</p>
                            <p className="text-xs text-zinc-500">Since {new Date(seller.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="text-sm font-bold dark:text-zinc-300 text-zinc-700">{seller.phone}</p>
                      </td>
                      <td className="p-6">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{seller.totalPurchases} Orders</p>
                        <p className="text-sm font-black text-yellow-500 italic">RM {seller.totalSpent.toFixed(2)}</p>
                      </td>
                      <td className="p-6">
                        <select
                          value={seller.sellerLevelId || ''}
                          onChange={(e) => updateSeller(seller.id, { sellerLevelId: e.target.value || null })}
                          className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-white text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:border-yellow-500"
                        >
                          <option value="" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">No Level</option>
                          {levels.map(l => (
                            <option key={l.id} value={l.id} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white">{l.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-6">
                        <button
                          onClick={() => updateSeller(seller.id, { isActive: !seller.isActive })}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                            seller.isActive ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                          }`}
                        >
                          {seller.isActive ? 'Active' : 'Suspended'}
                        </button>
                      </td>
                      <td className="p-6 text-right">
                        <button
                          onClick={() => updateSeller(seller.id, { role: 'Member', sellerLevelId: null })}
                          className="px-4 py-2 bg-zinc-500/10 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all"
                        >
                          Revoke Seller
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sellers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs">
                        No sellers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Level Modal */}
      {showLevelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#080a0f] border border-zinc-200 dark:border-white/10 rounded-[40px] p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-black italic mb-6 dark:text-white">{editingLevel ? 'Edit Level' : 'New Seller Level'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Level Name</label>
                <input type="text" value={levelForm.name} onChange={e => setLevelForm({...levelForm, name: e.target.value})} placeholder="e.g. Gold Tier" className="w-full bg-zinc-500/5 border border-zinc-500/20 rounded-2xl px-4 py-3 text-sm font-bold focus:border-yellow-500 outline-none dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Discount Percentage (%)</label>
                <input type="number" min="0" max="100" value={levelForm.discountPercent} onChange={e => setLevelForm({...levelForm, discountPercent: Number(e.target.value)})} className="w-full bg-zinc-500/5 border border-zinc-500/20 rounded-2xl px-4 py-3 text-sm font-bold focus:border-yellow-500 outline-none dark:text-white" />
              </div>
              <div className="flex items-center justify-between p-4 bg-zinc-500/5 rounded-2xl border border-zinc-500/10">
                <span className="text-xs font-bold dark:text-white">Free Shipping Eligibility</span>
                <input type="checkbox" checked={levelForm.freeShipping} onChange={e => setLevelForm({...levelForm, freeShipping: e.target.checked})} className="w-5 h-5 accent-yellow-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowLevelModal(false)} className="px-6 py-3 rounded-2xl text-xs font-bold text-zinc-500 hover:bg-zinc-500/10">Cancel</button>
              <button onClick={handleSaveLevel} className="px-6 py-3 bg-yellow-500 text-zinc-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110">Save Level</button>
            </div>
          </div>
        </div>
      )}

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
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black italic tracking-tight dark:text-white text-zinc-900">
                    Seller Setup Guide
                  </h3>
                  <button
                    onClick={() => setShowTutorial(false)}
                    className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Step 1 */}
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-full md:w-1/2 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center relative overflow-hidden p-2">
                      <img src="/seller%20guide/silver.png" alt="Silver Tier Example" className="w-full h-auto object-contain rounded-xl shadow-md" />
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-500 font-black text-xs mb-2">1</div>
                      <h4 className="text-lg font-bold dark:text-white text-zinc-900">Silver Tier (Level 1)</h4>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Set up an entry-level tier for your new sellers. Typically, you can offer a <span className="font-bold text-green-500">5% discount</span> on all products without free shipping.</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col md:flex-row-reverse gap-6 items-center">
                    <div className="w-full md:w-1/2 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center relative overflow-hidden p-2">
                      <img src="/seller%20guide/gold.png" alt="Gold Tier Example" className="w-full h-auto object-contain rounded-xl shadow-md" />
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 font-black text-xs mb-2">2</div>
                      <h4 className="text-lg font-bold dark:text-white text-zinc-900">Gold Tier (Level 2)</h4>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Create a mid-level tier to motivate your sellers. A good standard is a <span className="font-bold text-green-500">10% discount</span> on all products.</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-full md:w-1/2 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center relative overflow-hidden p-2">
                      <img src="/seller%20guide/platinum.png" alt="Platinum Tier Example" className="w-full h-auto object-contain rounded-xl shadow-md" />
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 font-black text-xs mb-2">3</div>
                      <h4 className="text-lg font-bold dark:text-white text-zinc-900">Platinum Tier (Level 3)</h4>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Reward your top-performing sellers with the highest tier. Set it to a <span className="font-bold text-green-500">15% discount</span> and enable <span className="font-bold text-blue-500">Free Shipping</span>.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={() => setShowTutorial(false)}
                    className="px-8 py-3.5 bg-yellow-500 text-zinc-900 rounded-full font-black uppercase tracking-widest text-xs hover:brightness-110 shadow-lg shadow-yellow-500/20 transition-all flex items-center gap-2"
                  >
                    Got it <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </AdminLayout>
  );
};

export default SellerSetupPage;
