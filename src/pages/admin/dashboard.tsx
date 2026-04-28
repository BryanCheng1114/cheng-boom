import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Package, 
  Activity, 
  Users, 
  AlertCircle, 
  Check, 
  UserPlus 
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

const DashboardPage = () => {
  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-10">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Revenue', value: 'RM 24,150', sub: '+12% from last month', icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
            { label: 'Live Products', value: '156', sub: 'across 8 categories', icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Total Orders', value: '842', sub: '98% fulfillment rate', icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
            { label: 'Total Customers', value: '3,120', sub: '24% return rate', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="dark:bg-zinc-900/30 bg-white border dark:border-white/5 border-zinc-100 rounded-[32px] p-7 transition-all duration-500 group shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-3.5 rounded-[18px] ${stat.bg} ${stat.color}`}><stat.icon size={22} strokeWidth={2.5} /></div>
                <div className="px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest dark:bg-zinc-950 bg-zinc-50 dark:text-zinc-500 text-zinc-400">Live Update</div>
              </div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black italic tracking-tight mb-2 dark:text-white text-zinc-900">{stat.value}</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Stats Chart & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 border dark:border-white/10 border-zinc-100 rounded-[48px] p-8 shadow-2xl dark:bg-zinc-900/20 bg-white">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black italic uppercase tracking-tight dark:text-white text-zinc-900">Revenue Stream</h3>
              <select className="bg-transparent text-xs font-black uppercase tracking-widest border-none focus:ring-0 dark:text-zinc-400 text-zinc-500">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-64 flex items-end gap-3 px-4">
              {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: 0.5 + i * 0.1, duration: 1 }} className="flex-1 bg-gradient-to-t from-yellow-500/20 to-yellow-500 rounded-t-xl relative group">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {h}%
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between px-4 mt-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>

          <div className="border dark:border-white/10 border-zinc-100 rounded-[48px] p-8 shadow-2xl dark:bg-zinc-900/20 bg-white">
            <h3 className="text-xl font-black italic uppercase tracking-tight mb-8 dark:text-white text-zinc-900">Recent Activity</h3>
            <div className="space-y-6">
              {[
                { type: 'order', msg: 'New order #3412', time: '2m ago', icon: Activity },
                { type: 'product', msg: 'Product stock low: Thunder Clap', time: '15m ago', icon: AlertCircle },
                { type: 'user', msg: 'New seller account: Bryan Sales', time: '1h ago', icon: UserPlus },
                { type: 'system', msg: 'System backup completed', time: '4h ago', icon: Check },
              ].map((act, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="p-2 rounded-xl transition-colors dark:bg-white/5 bg-zinc-50 group-hover:bg-yellow-500/10">
                    <act.icon size={16} className="dark:text-zinc-500 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate dark:text-white text-zinc-900">{act.msg}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-10 py-4 bg-zinc-500/5 hover:bg-zinc-500/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 transition-all">View Full Logs</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
