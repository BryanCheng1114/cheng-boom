import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  TrendingUp, 
  ShoppingBag, 
  Activity,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  CalendarDays,
  X,
  PackageOpen,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLanguage } from '../../context/LanguageContext';

const DashboardPage = () => {
  const router = useRouter();
  const { t, language: locale } = useLanguage();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [todaysOrders, setTodaysOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [systemOverviewOpen, setSystemOverviewOpen] = useState(true);
  const [orderInformationOpen, setOrderInformationOpen] = useState(true);
  const [recentTransactionsOpen, setRecentTransactionsOpen] = useState(true);
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
        setAllOrders(Array.isArray(orders) ? orders : []);

        const revenue = orders.reduce((acc: number, o: any) => acc + (o.status === 'Completed' ? o.totalAmount : 0), 0);
        
        setStats({
          totalRevenue: revenue,
          liveProducts: products.filter((p: any) => p.status === 'Live').length,
          totalOrders: orders.length,
          totalCustomers: customers.length,
          pendingOrders: orders.filter((o: any) => o.status === 'Pending').length,
          lowStockCount: products.filter((p: any) => p.stock > 0 && p.stock < 10).length,
          sellerCount: customers.filter((c: any) => c.role === 'Seller').length,
          recentOrders: orders.slice(0, 10),
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

        const hasShownWelcome = sessionStorage.getItem('hasShownWelcome');
        if (!hasShownWelcome && (incomingToday.length > 0 || lowStock.length > 0 || soldOut.length > 0)) {
          setShowWelcomeModal(true);
          sessionStorage.setItem('hasShownWelcome', 'true');
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const dateKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const toInputDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const selectedDayOrders = allOrders.filter((order) => {
    const created = new Date(order.createdAt);
    return !Number.isNaN(created.getTime()) && dateKey(created) === dateKey(selectedDate);
  });
  const activeDayOrders = selectedDayOrders.filter((order) => order.status !== 'Cancelled');
  const daySales = activeDayOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const isToday = dateKey(selectedDate) === dateKey(new Date());
  const dateLabel = `${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}`;
  const statusData = [
    { name: t('pending') || 'Pending', count: selectedDayOrders.filter((o) => o.status === 'Pending').length, fill: '#f59e0b' },
    { name: t('in_process') || 'In Process', count: selectedDayOrders.filter((o) => ['Processing', 'In Process'].includes(o.status)).length, fill: '#3b82f6' },
    { name: t('delivering') || 'Delivering', count: selectedDayOrders.filter((o) => ['Delivering', 'Shipped'].includes(o.status)).length, fill: '#8b5cf6' },
    { name: t('completed') || 'Completed', count: selectedDayOrders.filter((o) => ['Completed', 'Delivered'].includes(o.status)).length, fill: '#10b981' },
    { name: t('cancelled') || 'Cancelled', count: selectedDayOrders.filter((o) => o.status === 'Cancelled').length, fill: '#ef4444' },
  ];
  const hourlySales = Array.from({ length: 12 }, (_, index) => ({ hour: `${String(index * 2).padStart(2, '0')}:00`, sales: 0 }));
  activeDayOrders.forEach((order) => {
    const hour = new Date(order.createdAt).getHours();
    const bucket = Math.floor(hour / 2);
    if (hourlySales[bucket]) hourlySales[bucket].sales += Number(order.totalAmount || 0);
  });
  const overviewCards = [
    { label: 'Sales', value: `RM ${daySales.toFixed(2)}`, helper: 'Excluding cancelled orders', icon: TrendingUp, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Orders', value: selectedDayOrders.length, helper: 'Orders placed', icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'In progress', value: selectedDayOrders.filter((o) => ['Pending', 'Processing', 'In Process', 'Delivering', 'Shipped'].includes(o.status)).length, helper: 'Need attention', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed', value: statusData[3].count, helper: 'Successfully fulfilled', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];
  const sectionHeader = (title: string, open: boolean, toggle: () => void, trailing?: React.ReactNode) => (
    <div className="group flex items-stretch justify-between gap-3 border-b border-slate-200 bg-white text-slate-700">
      <button type="button" onClick={toggle} className="flex min-h-12 flex-1 items-center gap-3 px-5 py-3 text-left text-sm font-semibold transition-colors hover:bg-sky-600 hover:text-white focus-visible:bg-sky-600 focus-visible:text-white focus-visible:outline-none">
        <ChevronDown size={17} className={`shrink-0 transition-transform duration-150 group-hover:text-white ${open ? '' : '-rotate-90'}`} />
        {title}
      </button>
      {trailing && <div className="flex items-center px-4 text-slate-600 [&_a]:text-slate-600 [&_a:hover]:text-sky-700">{trailing}</div>}
    </div>
  );

  return (
    <AdminLayout title={t('system_overview')} hideTitle>
      <div className="space-y-5 pb-6">
        <div className="flex justify-center">
          <div className="flex min-w-[250px] items-center justify-between border border-slate-200 bg-white px-2 py-2 shadow-sm">
            <button aria-label="Previous day" onClick={() => setSelectedDate((current) => { const next = new Date(current); next.setDate(next.getDate() - 1); return next; })} className="flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-700"><ChevronLeft size={19} /></button>
            <div className="flex items-center gap-2.5 px-2">
              <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center text-sky-600 hover:bg-sky-50" aria-label="Choose date">
                <CalendarDays size={17} />
                <input
                  type="date"
                  aria-label="Choose dashboard date"
                  value={toInputDate(selectedDate)}
                  max={toInputDate(new Date())}
                  onChange={(event) => {
                    const [year, month, day] = event.target.value.split('-').map(Number);
                    if (year && month && day) setSelectedDate(new Date(year, month - 1, day));
                  }}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
              <div className="text-center"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{isToday ? 'Today' : 'Selected date'}</p><p className="text-sm font-semibold tabular-nums text-slate-800">{dateLabel}</p></div>
            </div>
            <button aria-label="Next day" disabled={isToday} onClick={() => setSelectedDate((current) => { const next = new Date(current); next.setDate(next.getDate() + 1); return next; })} className="flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight size={19} /></button>
          </div>
        </div>

        <section className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          {sectionHeader('System Overview', systemOverviewOpen, () => setSystemOverviewOpen((open) => !open))}
          {systemOverviewOpen && <div className="grid grid-cols-1 gap-4 bg-slate-50/70 p-4 sm:grid-cols-2 xl:grid-cols-4">
            {overviewCards.map((card) => <div key={card.label} className="flex min-h-[138px] flex-col justify-between border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{card.label}</span><span className={`flex h-10 w-10 items-center justify-center ${card.bg} ${card.color}`}><card.icon size={19} /></span></div>
              <div><p className="text-2xl font-bold tracking-tight text-slate-900">{isLoading ? '—' : card.value}</p><p className="mt-1 text-xs text-slate-500">{card.helper}</p></div>
            </div>)}
          </div>}
        </section>

        <section className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          {sectionHeader('Order Information', orderInformationOpen, () => setOrderInformationOpen((open) => !open), <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900">Manage orders <ChevronRight size={15} /></Link>)}
          {orderInformationOpen && <div className="grid grid-cols-1 gap-4 bg-slate-50/70 p-4 xl:grid-cols-2">
            <div className="border border-slate-100 bg-white p-4">
              <div className="mb-3"><h3 className="text-sm font-semibold text-slate-800">Orders by status</h3><p className="text-xs text-slate-500">Daily workload overview</p></div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%"><BarChart data={statusData} layout="vertical" margin={{ top: 4, right: 18, left: 8, bottom: 4 }}>
                  <CartesianGrid stroke="#e8edf3" horizontal={false} /><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} /><YAxis type="category" dataKey="name" width={92} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} /><Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 0, border: '1px solid #e2e8f0' }} /><Bar dataKey="count" name="Orders" radius={[0, 0, 0, 0]} barSize={22} fill="#38a8d5" />
                </BarChart></ResponsiveContainer>
              </div>
            </div>
            <div className="border border-slate-100 bg-white p-4">
              <div className="mb-3"><h3 className="text-sm font-semibold text-slate-800">Sales throughout the day</h3><p className="text-xs text-slate-500">Two-hour intervals · RM</p></div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%"><BarChart data={hourlySales} margin={{ top: 8, right: 12, left: 2, bottom: 4 }}>
                  <CartesianGrid stroke="#e8edf3" vertical={false} /><XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} interval={1} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={48} /><Tooltip formatter={(value: any) => [`RM ${Number(value).toFixed(2)}`, 'Sales']} contentStyle={{ borderRadius: 0, border: '1px solid #e2e8f0' }} /><Bar dataKey="sales" name="Sales" fill="#38a8d5" radius={[0, 0, 0, 0]} barSize={18} />
                </BarChart></ResponsiveContainer>
              </div>
            </div>
          </div>}
        </section>

        <section className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          {sectionHeader('Recent Transaction Details', recentTransactionsOpen, () => setRecentTransactionsOpen((open) => !open), <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900">View all <ChevronRight size={15} /></Link>)}
          {recentTransactionsOpen && <div className="p-3 sm:p-4"><div className="overflow-x-auto border border-slate-200"><table className="w-full min-w-[850px] text-left text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><th className="px-4 py-3 font-semibold">Order No.</th><th className="px-4 py-3 font-semibold">Customer</th><th className="px-4 py-3 font-semibold">Total</th><th className="px-4 py-3 font-semibold">Payment</th><th className="px-4 py-3 font-semibold">Delivery</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Date</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{stats.recentOrders.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">No recent orders found.</td></tr> : stats.recentOrders.map((order: any, index: number) => <tr key={order.id} className={`cursor-pointer transition-colors hover:bg-sky-50/60 ${index % 2 ? 'bg-slate-50/50' : 'bg-white'}`} onClick={() => router.push(`/admin/orders/${order.id}`)}>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-sky-800">#{String(order.id).slice(-6).toUpperCase()}</td><td className="px-4 py-3 font-medium text-slate-800">{order.customer?.name || 'Guest'}</td><td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">RM {Number(order.totalAmount || 0).toFixed(2)}</td><td className="px-4 py-3 text-slate-600">{order.paymentMethod ? (t(order.paymentMethod.toLowerCase().replace(/ /g, '_')) || order.paymentMethod.replace(/_/g, ' ')) : '—'}</td><td className="px-4 py-3 text-slate-600">{order.deliveryMode ? (t(order.deliveryMode.toLowerCase().replace(/ /g, '_')) || order.deliveryMode.replace(/_/g, ' ')) : '—'}</td><td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${order.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : order.status === 'Cancelled' ? 'bg-rose-50 text-rose-700' : order.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'}`}>{t(order.status.toLowerCase().replace(/ /g, '_')) || order.status}</span></td><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString(locale === 'ms' ? 'ms-MY' : locale === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
            </tr>)}</tbody>
          </table></div></div>}
        </section>
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
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="space-y-6"
                >
                  {/* Today's Orders */}
                  {todaysOrders.length > 0 && (
                    <div className="space-y-4">
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
                    </div>
                  )}

                  {/* Stock Information */}
                  {(soldOutItems.length > 0 || lowStockItems.length > 0) && (
                    <div className="space-y-4">
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
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Footer Buttons */}
              <div className="p-6 border-t border-zinc-100 flex gap-3 shrink-0">
                <button
                  onClick={() => setShowWelcomeModal(false)}
                  className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-medium transition-all text-sm shadow-md shadow-zinc-900/10"
                >
                  {locale === 'zh' ? '关闭并前往控制台' : locale === 'ms' ? 'Tutup & Ke Papan Pemuka' : 'Close & Go to Dashboard'}
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
