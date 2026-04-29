import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  Users, 
  Clock, 
  ArrowRight,
  Activity,
  ArrowUpRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';

const DashboardPage = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    liveProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    lowStockCount: 0,
    sellerCount: 0,
    recentOrders: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [prodRes, orderRes, custRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/orders'),
          fetch('/api/customers')
        ]);

        const products = await prodRes.json();
        const orders = await orderRes.json();
        const customers = await custRes.json();

        const revenue = orders.reduce((acc: number, o: any) => acc + (o.status === 'Completed' ? o.totalAmount : 0), 0);
        
        setStats({
          totalRevenue: revenue,
          liveProducts: products.filter((p: any) => p.status === 'Live').length,
          totalOrders: orders.length,
          totalCustomers: customers.length,
          pendingOrders: orders.filter((o: any) => o.status === 'Pending').length,
          lowStockCount: products.filter((p: any) => p.stock > 0 && p.stock < 10).length,
          sellerCount: customers.filter((c: any) => c.role === 'Seller').length,
          recentOrders: orders.slice(0, 5)
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const kpis = [
    { label: t('total_revenue'), value: `RM ${stats.totalRevenue.toLocaleString()}`, sub: t('completed_sales'), icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: t('live_inventory'), value: stats.liveProducts, sub: t('active_products'), icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: t('total_orders'), value: stats.totalOrders, sub: t('all_transactions'), icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: t('registered_customers'), value: stats.totalCustomers, sub: t('growth_members'), icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <AdminLayout title={t('system_overview')}>
      <div className="space-y-10">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((stat, i) => (
            <motion.div 
              key={stat.label} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.1 }} 
              className="dark:bg-zinc-900/40 bg-white border dark:border-white/5 border-zinc-100 rounded-[32px] p-7 transition-all duration-500 group shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-[20px] ${stat.bg} ${stat.color}`}>
                  <stat.icon size={24} strokeWidth={2.5} />
                </div>
                <ArrowUpRight size={20} className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black italic tracking-tight mb-2 dark:text-white text-zinc-900">{isLoading ? '---' : stat.value}</h3>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stat.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Recent Orders - Visual Feed */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Clock size={16} /> {t('recent_transactions')}
              </h3>
              <Link href="/admin/orders" className="text-[10px] font-black uppercase tracking-widest text-yellow-500 hover:gap-2 flex items-center gap-1 transition-all">
                {t('orders')} <ChevronRight size={14} />
              </Link>
            </div>
            
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-500/5 border-b border-zinc-500/10">
                      <th className="p-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t('orders')}</th>
                      <th className="p-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t('customers')}</th>
                      <th className="p-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t('total')}</th>
                      <th className="p-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-500/5">
                    {stats.recentOrders.length === 0 ? (
                      <tr><td colSpan={4} className="p-10 text-center text-zinc-500 font-bold uppercase text-[10px]">No recent orders found.</td></tr>
                    ) : stats.recentOrders.map((order: any) => (
                      <tr key={order.id} className="group hover:bg-zinc-500/5 transition-colors cursor-pointer" onClick={() => (window.location.href = `/admin/orders/${order.id}`)}>
                        <td className="p-6">
                          <span className="text-xs font-black dark:text-white text-zinc-900 font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                        </td>
                        <td className="p-6">
                          <span className="text-xs font-bold dark:text-white text-zinc-900">{order.customer?.name}</span>
                        </td>
                        <td className="p-6">
                          <span className="text-sm font-black text-yellow-500 italic">RM {order.totalAmount.toFixed(2)}</span>
                        </td>
                        <td className="p-6">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                            order.status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                            order.status === 'Pending' ? 'bg-orange-500/10 text-orange-500 animate-pulse' :
                            'bg-zinc-500/10 text-zinc-500'
                          }`}>
                            {t(order.status.toLowerCase().replace(/ /g, '_')) || order.status}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Business Distribution & Insights */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-[40px] p-8 shadow-2xl">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-8 flex items-center gap-2">
                <Activity size={16} /> {t('market_split')}
              </h3>
              
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[10px] font-black uppercase text-zinc-400">{t('verified_sellers')}</span>
                    <span className="text-xl font-black italic text-white">{stats.sellerCount}</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-500/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${(stats.sellerCount / (stats.totalCustomers || 1)) * 100}%` }} 
                      className="h-full bg-yellow-500" 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[10px] font-black uppercase text-zinc-400">{t('regular_members')}</span>
                    <span className="text-xl font-black italic text-white">{stats.totalCustomers - stats.sellerCount}</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-500/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${((stats.totalCustomers - stats.sellerCount) / (stats.totalCustomers || 1)) * 100}%` }} 
                      className="h-full bg-zinc-500" 
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-500/10">
                   <Link href="/admin/customer" className="w-full py-4 bg-yellow-500/5 hover:bg-yellow-500/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-yellow-500 transition-all flex items-center justify-center gap-2">
                    {t('manage_customer_base')} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
