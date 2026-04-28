import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  FileSpreadsheet, 
  MoreVertical, 
  Image as ImageIcon,
  ChevronLeft,
  Download
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

const ProductPage = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  return (
    <AdminLayout title="Product">
      <div className="space-y-8">
        {/* Header Actions */}
        <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
          <div className="flex gap-10">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Items</p>
              <h4 className="text-3xl font-black italic dark:text-white text-zinc-900">1,284</h4>
            </div>
            <div className="pl-10 border-l border-zinc-500/10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Categories</p>
              <h4 className="text-3xl font-black italic dark:text-white text-zinc-900">12</h4>
            </div>
          </div>
          <div className="flex gap-4 w-full xl:w-auto">
            <button onClick={() => setIsBulkModalOpen(true)} className="flex-1 xl:flex-none flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all dark:bg-white/5 border dark:border-white/10 bg-zinc-100 border-zinc-200 dark:text-white text-zinc-600 hover:bg-zinc-200">
              <FileSpreadsheet size={16} />
              Bulk Upload
            </button>
            <button onClick={() => setIsUploadModalOpen(true)} className="flex-1 xl:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-yellow-500 text-zinc-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-xl shadow-yellow-500/20 transition-all">
              <Plus size={18} strokeWidth={3} />
              Add Product
            </button>
          </div>
        </div>

        {/* Product Table */}
        <div className="border dark:border-white/10 border-zinc-100 rounded-[48px] overflow-hidden shadow-2xl dark:bg-zinc-900/20 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b dark:border-white/5 border-zinc-100">
                <th className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Product</th>
                <th className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Category</th>
                <th className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Stock</th>
                <th className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Price</th>
                <th className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-500/5">
              {[
                { id: 1, name: 'Dragon Fire', cat: 'Sky Rocket', stock: 42, price: 'RM 85.00', status: 'Live' },
                { id: 2, name: 'Golden Shower', cat: 'Sparklers', stock: 120, price: 'RM 12.00', status: 'Live' },
                { id: 3, name: 'Thunder Clap', cat: 'Big Bang', stock: 5, price: 'RM 45.00', status: 'Low' },
                { id: 4, name: 'Night Pearl', cat: 'Roman Candle', stock: 0, price: 'RM 32.00', status: 'Draft' },
              ].map((p) => (
                <tr key={p.id} className="group hover:bg-zinc-500/5 transition-colors">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-500/10 rounded-xl flex items-center justify-center text-zinc-500"><ImageIcon size={20} /></div>
                      <span className="font-bold text-sm dark:text-white text-zinc-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-8 text-xs font-bold text-zinc-500 uppercase tracking-widest">{p.cat}</td>
                  <td className="p-8 text-xs font-black text-zinc-400">{p.stock} units</td>
                  <td className="p-8 text-sm font-black text-yellow-500 italic">{p.price}</td>
                  <td className="p-8">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      p.status === 'Live' ? 'bg-green-500/10 text-green-500' :
                      p.status === 'Low' ? 'bg-orange-500/10 text-orange-500' :
                      'bg-zinc-500/10 text-zinc-500'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${p.status === 'Live' ? 'bg-green-500' : p.status === 'Low' ? 'bg-orange-500' : 'bg-zinc-500'}`} />
                      {p.status}
                    </div>
                  </td>
                  <td className="p-8 text-right">
                    <button className="p-2 text-zinc-500 hover:text-white transition-colors"><MoreVertical size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-6 border-t border-zinc-500/5 text-center">
            <button className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] hover:text-yellow-500 transition-colors">Load More Inventory</button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUploadModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl rounded-[48px] p-10 md:p-14 overflow-y-auto max-h-[90vh] dark:bg-zinc-900 bg-white border dark:border-white/10 border-zinc-100 shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black italic uppercase tracking-tight dark:text-white text-zinc-900">Upload Product</h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="p-3 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-full transition-all"><ChevronLeft className="rotate-90" /></button>
              </div>
              <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                <div className="h-48 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-4 group cursor-pointer transition-all dark:bg-white/5 bg-zinc-50 dark:border-white/10 border-zinc-200 hover:border-yellow-500/50">
                  <div className="p-4 bg-zinc-950 rounded-2xl text-zinc-500 group-hover:text-yellow-500 transition-colors"><ImageIcon size={32} /></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Drag & Drop Product Visuals</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Name</label><input type="text" className="w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500" placeholder="Product Name" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Category</label><select className="w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500"><option>Sky Rocket</option><option>Big Bang</option><option>Sparklers</option></select></div>
                </div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</label><textarea className="w-full px-6 py-4 rounded-2xl border outline-none font-bold min-h-[120px] dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500" placeholder="Detail description..." /></div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Quantity</label><input type="number" className="w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Base Price</label><input type="text" className="w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Discounted</label><input type="text" className="w-full px-6 py-4 rounded-2xl border outline-none font-bold dark:bg-zinc-950 bg-zinc-100" /></div>
                </div>
                <button type="submit" onClick={() => setIsUploadModalOpen(false)} className="w-full py-6 bg-yellow-500 text-zinc-950 rounded-3xl font-black uppercase tracking-[0.4em] text-xs hover:brightness-110 transition-all shadow-xl shadow-yellow-500/20">Finalize & Deploy Product</button>
              </form>
            </motion.div>
          </div>
        )}

        {isBulkModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBulkModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-xl rounded-[48px] p-12 text-center dark:bg-zinc-900 bg-white border dark:border-white/10 border-zinc-100">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-[28px] flex items-center justify-center text-emerald-500 mx-auto mb-8 border border-emerald-500/20"><FileSpreadsheet size={40} /></div>
              <h3 className="text-3xl font-black italic uppercase tracking-tight mb-4 dark:text-white text-zinc-900">Bulk Import</h3>
              <p className="text-zinc-500 font-medium mb-10">Upload an Excel (.xlsx) file to import multiple products instantly.</p>
              <div className="p-8 border-2 border-dashed rounded-[32px] mb-8 dark:bg-zinc-950 bg-zinc-50 dark:border-white/5 border-zinc-200 hover:border-emerald-500/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Select or Drop Excel File</p>
                <button className="px-6 py-2 bg-emerald-500 text-zinc-950 rounded-full text-[9px] font-black uppercase tracking-widest">Browse Storage</button>
              </div>
              <div className="flex gap-4">
                <button className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border dark:border-white/10 border-zinc-200 text-zinc-500"><Download size={14} className="inline mr-2" /> Template</button>
                <button onClick={() => setIsBulkModalOpen(false)} className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest dark:bg-zinc-800 bg-zinc-100 text-zinc-400">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default ProductPage;
