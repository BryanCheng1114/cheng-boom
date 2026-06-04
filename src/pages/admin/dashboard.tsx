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
  ChevronRight,
  Calendar,
  X,
  PackageOpen,
  AlertTriangle
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLanguage } from '../../context/LanguageContext';

const DashboardPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const locale = router.locale || 'en';
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [soldOutItems, setSoldOutItems] = useState<any[]>([]);
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

        // Setup Welcome Modal
        const lowStock = products.filter((p: any) => p.stock > 0 && p.stock < 5);
        const soldOut = products.filter((p: any) => p.stock === 0);
        
        setLowStockItems(lowStock);
        setSoldOutItems(soldOut);

        if (!sessionStorage.getItem('admin_welcome_shown') && (lowStock.length > 0 || soldOut.length > 0)) {
          setShowWelcomeModal(true);
          sessionStorage.setItem('admin_welcome_shown', 'true');
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const kpis = [
    { label: t('total_revenue'), value: `RM ${stats.totalRevenue.toLocaleString()}`, sub: t('completed_sales'), icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-500/10', href: '/admin/revenue' },
    { label: t('live_inventory'), value: stats.liveProducts, sub: t('active_products'), icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10', href: '/admin/product' },
    { label: t('total_orders'), value: stats.totalOrders, sub: t('all_transactions'), icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-500/10', href: '/admin/orders' },
    { label: t('registered_customers'), value: stats.totalCustomers, sub: t('growth_members'), icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10', href: '/admin/customer' },
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
              onClick={() => stat.href && router.push(stat.href)}
              className="dark:bg-zinc-900/40 bg-white border dark:border-white/5 border-zinc-100 rounded-[32px] p-7 transition-all duration-500 group shadow-lg hover:shadow-xl hover:-translate-y-1 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-[20px] ${stat.bg} ${stat.color}`}>
                  <stat.icon size={24} strokeWidth={2.5} />
                </div>
                <ArrowUpRight size={20} className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-all group-hover:-translate-y-1 group-hover:translate-x-1" />
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

        {/* Recent Orders - Visual Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Clock size={16} /> {t('recent_transactions')}
            </h3>
            <Link href="/admin/orders" className="text-[10px] font-black uppercase tracking-widest text-yellow-500 hover:gap-2 flex items-center gap-1 transition-all">
              {t('view_more') || 'More Orders'} <ChevronRight size={14} />
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
                    <tr><td colSpan={4} className="p-10 text-center text-zinc-500 font-bold uppercase text-[10px]">{t('no_recent_orders_found')}</td></tr>
                  ) : stats.recentOrders.map((order: any) => (
                    <tr key={order.id} className="group hover:bg-zinc-500/5 transition-colors cursor-pointer" onClick={() => router.push(`/admin/orders/${order.id}`)}>
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
      </div>

      {/* Admin Welcome Info Modal */}
      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-3 text-yellow-500">
                  <h3 className="text-xl font-black text-foreground uppercase tracking-wider">
                    {locale === 'zh' ? '欢迎回来' : locale === 'ms' ? 'Selamat Kembali' : 'Welcome Back'}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowWelcomeModal(false)}
                  className="text-zinc-400 hover:text-foreground transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                {/* Date */}
                <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                  <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{locale === 'zh' ? '今天的日期' : locale === 'ms' ? 'Tarikh Hari Ini' : 'Today\'s Date'}</p>
                    <p className="text-lg font-black text-foreground">
                      {new Intl.DateTimeFormat(locale === 'ms' ? 'ms-MY' : locale === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
                    </p>
                  </div>
                </div>

                {/* Sold Out */}
                {soldOutItems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <AlertTriangle size={16} /> {locale === 'zh' ? '已售罄商品' : locale === 'ms' ? 'Item Habis Dijual' : 'Sold Out Items'} ({soldOutItems.length})
                    </h4>
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                      <ul className="space-y-2">
                        {soldOutItems.map(p => (
                          <li key={p.id} className="flex items-start gap-2">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{p.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Low Stock */}
                {lowStockItems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <PackageOpen size={16} /> {locale === 'zh' ? '库存紧张 (< 5)' : locale === 'ms' ? 'Stok Rendah (< 5)' : 'Low Stock (< 5)'} ({lowStockItems.length})
                    </h4>
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                      <ul className="space-y-2">
                        {lowStockItems.map(p => (
                          <li key={p.id} className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{p.name}</span>
                            </div>
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg shrink-0">
                              {p.stock} left
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-zinc-100 dark:border-zinc-800/50">
                <button
                  onClick={() => setShowWelcomeModal(false)}
                  className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl font-black uppercase tracking-widest transition-colors shadow-lg shadow-yellow-500/20"
                >
                  {locale === 'zh' ? '继续' : locale === 'ms' ? 'Teruskan' : 'Continue'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default DashboardPage;
