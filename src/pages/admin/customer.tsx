import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Eye, 
  Mail, 
  Percent,
  ChevronLeft
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

const CustomerPage = () => {
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false);

  return (
    <AdminLayout title="Customer">
      <div className="space-y-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <button className="px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-500 text-zinc-950 shadow-lg">All History</button>
            <button className="px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border dark:border-white/10 border-zinc-200 text-zinc-500">Members</button>
            <button className="px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border dark:border-white/10 border-zinc-200 text-zinc-500">Guests</button>
          </div>
          <button onClick={() => setIsCreateAccountModalOpen(true)} className="flex items-center gap-2 px-6 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-xl transition-all">
            <UserPlus size={16} />
            Create Seller Account
          </button>
        </div>

        {/* Customer Table */}
        <div className="border dark:border-white/10 border-zinc-100 rounded-[48px] overflow-hidden shadow-2xl dark:bg-zinc-900/20 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b dark:border-white/5 border-zinc-100">
                <th className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Customer / ID</th>
                <th className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Type</th>
                <th className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Order Total</th>
                <th className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Date</th>
                <th className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-500/5">
              {[
                { id: 'ORD-8291', name: 'Bryan Cheng', email: 'bryan@example.com', type: 'Member', total: 'RM 1,240.00', status: 'Completed', date: 'Oct 24, 2026' },
                { id: 'ORD-8292', name: 'Guest User', email: 'guest_12@gmail.com', type: 'Guest', total: 'RM 450.00', status: 'Processing', date: 'Oct 25, 2026' },
                { id: 'ORD-8293', name: 'Sarah Wong', email: 'sarah.w@shop.my', type: 'Seller', total: 'RM 8,900.00', status: 'Shipped', date: 'Oct 25, 2026' },
              ].map((order) => (
                <tr key={order.id} className="hover:bg-zinc-500/5 transition-colors">
                  <td className="p-8">
                    <p className="font-black text-sm dark:text-white text-zinc-900">{order.name}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">{order.email}</p>
                  </td>
                  <td className="p-8">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      order.type === 'Member' ? 'border-yellow-500/20 text-yellow-500' :
                      order.type === 'Seller' ? 'border-blue-500/20 text-blue-500' :
                      'border-zinc-500/20 text-zinc-500'
                    }`}>{order.type}</span>
                  </td>
                  <td className="p-8 text-sm font-black italic text-zinc-400">{order.total}</td>
                  <td className="p-8">
                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                      order.status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                      order.status === 'Processing' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {order.status}
                    </div>
                  </td>
                  <td className="p-8 text-[10px] font-bold text-zinc-500 uppercase">{order.date}</td>
                  <td className="p-8 text-right">
                    <button className="p-2 rounded-xl transition-all dark:hover:bg-white/5 hover:bg-zinc-100 text-zinc-400"><Eye size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isCreateAccountModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateAccountModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-xl rounded-[48px] p-12 dark:bg-zinc-900 bg-white border dark:border-white/10 border-zinc-100 shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black italic uppercase tracking-tight dark:text-white text-zinc-900">New Seller / Member</h3>
                <button onClick={() => setIsCreateAccountModalOpen(false)} className="p-3 text-zinc-500"><ChevronLeft className="rotate-90" /></button>
              </div>
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsCreateAccountModalOpen(false); }}>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Account Type</label><div className="flex gap-4"><button type="button" className="flex-1 py-3 bg-yellow-500 text-zinc-950 rounded-xl font-black text-[10px] uppercase tracking-widest">Seller</button><button type="button" className="flex-1 py-3 dark:bg-zinc-800 bg-zinc-100 text-zinc-400 rounded-xl font-black text-[10px] uppercase tracking-widest">Member</button></div></div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Identity Name</label><div className="relative"><Users className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} /><input type="text" className="w-full pl-14 pr-6 py-4 rounded-2xl outline-none font-bold border transition-all dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500" placeholder="Full Name" /></div></div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email Address</label><div className="relative"><Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} /><input type="email" className="w-full pl-14 pr-6 py-4 rounded-2xl outline-none font-bold border transition-all dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500" placeholder="account@example.com" /></div></div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Preset Promotion</label><div className="relative"><Percent className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} /><input type="text" className="w-full pl-14 pr-6 py-4 rounded-2xl outline-none font-bold border transition-all dark:bg-zinc-950 bg-zinc-100 dark:border-white/5 border-zinc-200 dark:text-white text-zinc-900 focus:border-yellow-500" placeholder="20% discount" /></div></div>
                <button type="submit" className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-[28px] font-black uppercase tracking-[0.3em] text-[10px] mt-6 shadow-2xl">Generate Identity Node</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default CustomerPage;
