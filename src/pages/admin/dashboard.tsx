import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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
  AlertTriangle,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  CheckCircle2
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
  const [modalStep, setModalStep] = useState(1);
  const [todaysOrders, setTodaysOrders] = useState<any[]>([]);
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
    recentOrders: [] as any[],
    orderStatuses: { pending: 0, processing: 0, delivering: 0, completed: 0, cancelled: 0 }
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
          recentOrders: orders.slice(0, 6),
          orderStatuses: {
            pending: orders.filter((o: any) => o.status === 'Pending').length,
            processing: orders.filter((o: any) => o.status === 'Processing' || o.status === 'In Process').length,
            delivering: orders.filter((o: any) => o.status === 'Delivering' || o.status === 'Shipped').length,
            completed: orders.filter((o: any) => o.status === 'Completed' || o.status === 'Delivered').length,
            cancelled: orders.filter((o: any) => o.status === 'Cancelled').length,
          }
        });

        // Setup Welcome Modal
        const lowStock = products.filter((p: any) => p.stock > 0 && p.stock < 5);
        const soldOut = products.filter((p: any) => p.stock === 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const incomingToday = orders.filter((o: any) => new Date(o.createdAt) >= today);

        setLowStockItems(lowStock);
        setSoldOutItems(soldOut);
        setTodaysOrders(incomingToday);

        if (incomingToday.length > 0 || lowStock.length > 0 || soldOut.length > 0) {
          setShowWelcomeModal(true);
          setModalStep(incomingToday.length > 0 ? 1 : 2); // Start at stock if no orders today
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
    { 
      label: t('total_revenue') || 'Total Revenue', 
      value: `RM ${stats.totalRevenue.toLocaleString()}`, 
      sub: t('completed_sales') || 'Completed sales', 
      icon: TrendingUp, 
      solidBg: 'bg-[#4f46e5]', // Indigo
      pillBg: 'bg-emerald-500/10', pillText: 'text-emerald-500', pillIcon: ArrowUp, pillValue: '12%',
      href: '/admin/revenue' 
    },
    { 
      label: t('live_inventory') || 'Live Inventory', 
      value: stats.liveProducts, 
      sub: t('active_products') || 'Active products', 
      icon: Package, 
      solidBg: 'bg-[#f59e0b]', // Orange
      pillBg: 'bg-emerald-500/10', pillText: 'text-emerald-500', pillIcon: ArrowUp, pillValue: '5%',
      href: '/admin/product' 
    },
    { 
      label: t('total_orders') || 'Total Orders', 
      value: stats.totalOrders, 
      sub: t('all_transactions') || 'All transactions', 
      icon: ShoppingBag, 
      solidBg: 'bg-[#10b981]', // Green
      pillBg: 'bg-emerald-500/10', pillText: 'text-emerald-500', pillIcon: ArrowUp, pillValue: '18%',
      href: '/admin/orders' 
    },
    { 
      label: t('registered_customers') || 'Registered Customers', 
      value: stats.totalCustomers, 
      sub: t('growth_members') || 'Growth members', 
      icon: Users, 
      solidBg: 'bg-[#ef4444]', // Red
      pillBg: 'bg-red-500/10', pillText: 'text-red-500', pillIcon: ArrowDown, pillValue: '1.3%',
      href: '/admin/customer' 
    },
  ];

  return (
    <AdminLayout title={t('system_overview')}>
      <div className="space-y-10">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KPI 2x2 Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {kpis.map((stat, i) => (
              <motion.div 
                key={stat.label} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.1 }} 
                onClick={() => stat.href && router.push(stat.href)}
                className="bg-white border border-zinc-100 rounded-3xl p-6 transition-all duration-300 group shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg cursor-pointer"
              >
                {/* Top Row: Icon + Label + More */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white ${stat.solidBg}`}>
                      <stat.icon size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-[15px] font-bold text-zinc-800 tracking-wide">{stat.label}</span>
                  </div>
                  <MoreHorizontal size={20} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                </div>

                {/* Value & Subtext (Same Line) */}
                <div className="flex items-end justify-between mt-4">
                  <h3 className="text-3xl font-extrabold text-zinc-900 tracking-tight leading-none">
                    {isLoading ? '---' : stat.value}
                  </h3>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-bold ${stat.pillBg} ${stat.pillText}`}>
                      <stat.pillIcon size={10} strokeWidth={3} /> {stat.pillValue}
                    </div>
                    <p className="text-[12px] font-medium text-zinc-500">{stat.sub}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Donut Chart */}
          <div 
            onClick={() => router.push('/admin/orders')}
            className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg cursor-pointer transition-all duration-300 group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[18px] font-bold text-zinc-800 tracking-wide">Order Information</h3>
              <MoreHorizontal size={20} className="text-zinc-400 cursor-pointer hover:text-zinc-600 transition-colors" />
            </div>

            <div className="flex-1 relative flex items-center justify-center min-h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      [
                        { name: t('pending') || 'Pending', value: stats.orderStatuses?.pending || 0, color: '#f59e0b' },
                        { name: t('in_process') || 'In Process', value: stats.orderStatuses?.processing || 0, color: '#3b82f6' },
                        { name: t('delivering') || 'Delivering', value: stats.orderStatuses?.delivering || 0, color: '#8b5cf6' },
                        { name: t('completed') || 'Completed', value: stats.orderStatuses?.completed || 0, color: '#10b981' },
                        { name: t('cancelled') || 'Cancelled', value: stats.orderStatuses?.cancelled || 0, color: '#ef4444' }
                      ].filter(d => d.value > 0).length > 0 
                      ? [
                        { name: t('pending') || 'Pending', value: stats.orderStatuses?.pending || 0, color: '#f59e0b' },
                        { name: t('in_process') || 'In Process', value: stats.orderStatuses?.processing || 0, color: '#3b82f6' },
                        { name: t('delivering') || 'Delivering', value: stats.orderStatuses?.delivering || 0, color: '#8b5cf6' },
                        { name: t('completed') || 'Completed', value: stats.orderStatuses?.completed || 0, color: '#10b981' },
                        { name: t('cancelled') || 'Cancelled', value: stats.orderStatuses?.cancelled || 0, color: '#ef4444' }
                      ].filter(d => d.value > 0)
                      : [{ name: 'No Orders', value: 1, color: '#e4e4e7' }]
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={95}
                    cornerRadius={10}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {
                      (
                        [
                          { name: t('pending') || 'Pending', value: stats.orderStatuses?.pending || 0, color: '#f59e0b' },
                          { name: t('in_process') || 'In Process', value: stats.orderStatuses?.processing || 0, color: '#3b82f6' },
                          { name: t('delivering') || 'Delivering', value: stats.orderStatuses?.delivering || 0, color: '#8b5cf6' },
                          { name: t('completed') || 'Completed', value: stats.orderStatuses?.completed || 0, color: '#10b981' },
                          { name: t('cancelled') || 'Cancelled', value: stats.orderStatuses?.cancelled || 0, color: '#ef4444' }
                        ].filter(d => d.value > 0).length > 0 
                        ? [
                          { name: t('pending') || 'Pending', value: stats.orderStatuses?.pending || 0, color: '#f59e0b' },
                          { name: t('in_process') || 'In Process', value: stats.orderStatuses?.processing || 0, color: '#3b82f6' },
                          { name: t('delivering') || 'Delivering', value: stats.orderStatuses?.delivering || 0, color: '#8b5cf6' },
                          { name: t('completed') || 'Completed', value: stats.orderStatuses?.completed || 0, color: '#10b981' },
                          { name: t('cancelled') || 'Cancelled', value: stats.orderStatuses?.cancelled || 0, color: '#ef4444' }
                        ].filter(d => d.value > 0)
                        : [{ name: 'No Orders', value: 1, color: '#e4e4e7' }]
                      ).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))
                    }
                  </Pie>
                  <Tooltip 
                    cursor={false}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '8px 12px', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                    itemStyle={{ color: '#27272a', fontWeight: 'bold', fontSize: '12px', padding: 0 }}
                    labelStyle={{ display: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <h4 className="text-[28px] font-bold text-zinc-800 tracking-wide leading-none mb-1 mt-1">
                  {stats.totalOrders.toLocaleString()}
                </h4>
                <p className="text-[10px] font-bold text-zinc-500 capitalize tracking-wide text-center mt-0.5">
                  Total Order<br/>On This Week
                </p>
              </div>
            </div>

            {/* Legends */}
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
              {[
                { name: t('pending') || 'Pending', color: '#f59e0b' },
                { name: t('in_process') || 'In Process', color: '#3b82f6' },
                { name: t('delivering') || 'Delivering', color: '#8b5cf6' },
                { name: t('completed') || 'Completed', color: '#10b981' },
                { name: t('cancelled') || 'Cancelled', color: '#ef4444' }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-bold text-zinc-800 tracking-wide capitalize">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders - Visual Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-[18px] font-bold text-zinc-800 tracking-wide flex items-center gap-2">
              <Clock size={20} /> Recent Transactions
            </h3>
            <Link href="/admin/orders" className="text-[14px] font-bold tracking-wide text-yellow-500 hover:gap-2 flex items-center gap-1 transition-all">
              View More <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="bg-white  border border-zinc-200  rounded-[40px] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-500/5 border-b border-zinc-500/10">
                    <th className="px-5 py-4 text-[11px] font-bold text-zinc-800 uppercase tracking-wide">{locale === 'zh' ? '订单' : locale === 'ms' ? 'Pesanan' : 'Orders'}</th>
                    <th className="px-5 py-4 text-[11px] font-bold text-zinc-800 uppercase tracking-wide">{locale === 'zh' ? '客户' : locale === 'ms' ? 'Pelanggan' : 'Customers'}</th>
                    <th className="px-5 py-4 text-[11px] font-bold text-zinc-800 uppercase tracking-wide">{locale === 'zh' ? '总计' : locale === 'ms' ? 'Jumlah' : 'Total'}</th>
                    <th className="px-5 py-4 text-[11px] font-bold text-zinc-800 uppercase tracking-wide">{locale === 'zh' ? '支付方式' : locale === 'ms' ? 'Kaedah Pembayaran' : 'Payment Method'}</th>
                    <th className="px-5 py-4 text-[11px] font-bold text-zinc-800 uppercase tracking-wide">{locale === 'zh' ? '配送方式' : locale === 'ms' ? 'Mod Penghantaran' : 'Delivery Mode'}</th>
                    <th className="px-5 py-4 text-[11px] font-bold text-zinc-800 uppercase tracking-wide">{locale === 'zh' ? '状态' : locale === 'ms' ? 'Status' : 'Status'}</th>
                    <th className="px-5 py-4 text-[11px] font-bold text-zinc-800 uppercase tracking-wide">{locale === 'zh' ? '日期' : locale === 'ms' ? 'Tarikh' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-500/5">
                  {stats.recentOrders.length === 0 ? (
                    <tr><td colSpan={7} className="p-10 text-center text-zinc-500 font-bold uppercase text-[10px]">{t('no_recent_orders_found')}</td></tr>
                  ) : stats.recentOrders.map((order: any) => (
                    <tr key={order.id} className="group hover:bg-zinc-500/5 transition-colors cursor-pointer" onClick={() => router.push(`/admin/orders/${order.id}`)}>
                      <td className="px-5 py-3">
                        <span className="text-xs font-black  text-zinc-900 font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-bold  text-zinc-900">{order.customer?.name}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-bold text-zinc-900">RM {order.totalAmount.toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-bold text-zinc-700 capitalize">
                          {order.paymentMethod?.replace(/_/g, ' ') || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-bold text-zinc-700 capitalize">
                          {order.deliveryMode?.replace(/_/g, ' ') || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                          order.status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                          order.status === 'Pending' ? 'bg-orange-500/10 text-orange-500 animate-pulse' :
                          'bg-zinc-500/10 text-zinc-500'
                        }`}>
                          {t(order.status.toLowerCase().replace(/ /g, '_')) || order.status}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-medium text-zinc-500">
                          {new Date(order.createdAt).toLocaleDateString(locale === 'ms' ? 'ms-MY' : locale === 'zh' ? 'zh-CN' : 'en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </span>
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-zinc-100 shrink-0">
                <div className="flex items-center gap-3 text-yellow-500">
                  <h3 className="text-xl font-medium text-zinc-900">
                    {locale === 'zh' ? '欢迎回来' : locale === 'ms' ? 'Selamat Kembali' : 'Welcome Back'}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowWelcomeModal(false)}
                  className="text-zinc-400 hover:text-zinc-900 transition-colors p-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                
                {/* Step Indicators */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className={`h-1.5 w-12 rounded-full transition-colors ${modalStep === 1 ? 'bg-yellow-500' : 'bg-zinc-200'}`} />
                  <div className={`h-1.5 w-12 rounded-full transition-colors ${modalStep === 2 ? 'bg-yellow-500' : 'bg-zinc-200'}`} />
                </div>

                {modalStep === 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-4 p-5 bg-blue-50/50 border border-blue-100/50 rounded-2xl">
                      <div className="p-3.5 bg-blue-500/10 text-blue-600 rounded-xl">
                        <ShoppingBag size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600/80 mb-0.5">
                          {locale === 'zh' ? '今日新订单' : locale === 'ms' ? 'Pesanan Baru Hari Ini' : 'New Orders Today'}
                        </p>
                        <p className="text-2xl font-semibold text-blue-900">
                          {todaysOrders.length} {locale === 'zh' ? '单' : locale === 'ms' ? 'pesanan' : 'orders'}
                        </p>
                      </div>
                    </div>
                    
                    {todaysOrders.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-zinc-700 mb-3">
                          {locale === 'zh' ? '订单概览' : locale === 'ms' ? 'Gambaran Pesanan' : 'Order Overview'}
                        </h4>
                        <div className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-4 max-h-60 overflow-y-auto">
                          <ul className="space-y-3">
                            {todaysOrders.map(o => (
                              <li key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white border border-zinc-100 rounded-xl shadow-sm">
                                <div>
                                  <span className="text-xs text-zinc-500 font-mono block">#{o.id.slice(-6).toUpperCase()}</span>
                                  <span className="text-sm font-medium text-zinc-900">{o.customer?.name || 'Guest'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-zinc-900">RM {o.totalAmount.toFixed(2)}</span>
                                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                                    o.status === 'Pending' ? 'bg-orange-50 text-orange-600' : 'bg-zinc-50 text-zinc-600'
                                  }`}>
                                    {o.status}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {modalStep === 2 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {soldOutItems.length === 0 && lowStockItems.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 className="text-green-500" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-zinc-900 mb-2">All Stock Looks Good!</h3>
                        <p className="text-sm text-zinc-500">No sold out or low stock items at the moment.</p>
                      </div>
                    ) : (
                      <>
                        {/* Sold Out */}
                        {soldOutItems.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-red-600 mb-3 flex items-center gap-2">
                              <AlertTriangle size={16} /> {locale === 'zh' ? '已售罄商品' : locale === 'ms' ? 'Item Habis Dijual' : 'Sold Out Items'} ({soldOutItems.length})
                            </h4>
                            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 max-h-48 overflow-y-auto">
                              <ul className="space-y-2">
                                {soldOutItems.map(p => (
                                  <li key={p.id} className="flex items-start gap-2">
                                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                                    <span className="text-sm text-zinc-700">{p.name}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Low Stock */}
                        {lowStockItems.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-amber-600 mb-3 flex items-center gap-2">
                              <PackageOpen size={16} /> {locale === 'zh' ? '库存紧张 (< 5)' : locale === 'ms' ? 'Stok Rendah (< 5)' : 'Low Stock (< 5)'} ({lowStockItems.length})
                            </h4>
                            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 max-h-48 overflow-y-auto">
                              <ul className="space-y-2">
                                {lowStockItems.map(p => (
                                  <li key={p.id} className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2">
                                      <div className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                      <span className="text-sm text-zinc-700">{p.name}</span>
                                    </div>
                                    <span className="text-xs font-medium text-amber-700 bg-amber-100/50 px-2.5 py-1 rounded-full shrink-0">
                                      {p.stock} left
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="p-6 border-t border-zinc-100 flex gap-3 shrink-0">
                {modalStep === 1 ? (
                  <>
                    <button
                      onClick={() => setShowWelcomeModal(false)}
                      className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl font-medium transition-colors text-sm"
                    >
                      {locale === 'zh' ? '跳过' : locale === 'ms' ? 'Langkau' : 'Skip'}
                    </button>
                    <button
                      onClick={() => setModalStep(2)}
                      className="flex-[2] py-3 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 rounded-xl font-semibold transition-all text-sm flex items-center justify-center gap-2"
                    >
                      {locale === 'zh' ? '下一步：库存状态' : locale === 'ms' ? 'Seterusnya: Status Stok' : 'Next: Stock Info'}
                      <ArrowRight size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowWelcomeModal(false)}
                    className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-medium transition-all text-sm shadow-md shadow-zinc-900/10"
                  >
                    {locale === 'zh' ? '关闭并前往控制台' : locale === 'ms' ? 'Tutup & Ke Papan Pemuka' : 'Close & Go to Dashboard'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default DashboardPage;
