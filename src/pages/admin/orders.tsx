import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Activity,
  ShoppingBag,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../utils/cn';

const OrdersPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Management States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState(''); // e.g. "2023-10"
  const [todayFilter, setTodayFilter] = useState(false); // filter for today's orders
  const [showCalendar, setShowCalendar] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return orders.filter(o => {
      const customerName = o.customer?.name || '';
      const orderId = o.id || '';
      const phone = o.customer?.phone || '';
      const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            phone.includes(searchTerm);
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;

      let matchesMonth = true;
      if (monthFilter && o.createdAt) {
        const orderMonth = new Date(o.createdAt).toISOString().slice(0, 7);
        matchesMonth = orderMonth === monthFilter;
      }

      let matchesToday = true;
      if (todayFilter && o.createdAt) {
        const orderTime = new Date(o.createdAt).getTime();
        matchesToday = orderTime >= todayStart.getTime() && orderTime <= todayEnd.getTime();
      }

      return matchesSearch && matchesStatus && matchesMonth && matchesToday;
    });
  }, [orders, searchTerm, statusFilter, monthFilter, todayFilter]);

  // Sorting Logic
  const sortedOrders = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredOrders;

    return [...filteredOrders].sort((a: any, b: any) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedOrders.slice(start, start + itemsPerPage);
  }, [sortedOrders, currentPage]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const SortIndicator = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={12} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronRight size={12} className="rotate-[-90deg] text-blue-500" /> : <ChevronRight size={12} className="rotate-[90deg] text-blue-500" />;
  };

  // KPI Statistics Calculation
  const kpiStats = useMemo(() => {
    const now = new Date();

    // Today boundaries
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;

    // Month boundaries
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

    const stats = {
      thisMonthOrders: 0,
      lastMonthOrders: 0,

      completedThisMonth: 0,
      completedLastMonth: 0,
      completedTotal: 0,

      inProcessThisMonth: 0,
      inProcessLastMonth: 0,
      inProcessTotal: 0,

      pendingThisMonth: 0,
      pendingLastMonth: 0,
      pendingTotal: 0,

      cancelledThisMonth: 0,
      cancelledLastMonth: 0,
      cancelledTotal: 0,

      deliveringThisMonth: 0,
      deliveringLastMonth: 0,
      deliveringTotal: 0,
    };

    orders.forEach(o => {
      if (!o.createdAt) return;
      const time = new Date(o.createdAt).getTime();

      // Total orders tracking
      const isThisMonthLocal = time >= startOfThisMonth;
      const isLastMonthLocal = time >= startOfLastMonth && time < startOfThisMonth;
      if (isThisMonthLocal) stats.thisMonthOrders++;
      if (isLastMonthLocal) stats.lastMonthOrders++;

      // This Month vs Last Month
      const isThisMonth = time >= startOfThisMonth;
      const isLastMonth = time >= startOfLastMonth && time < startOfThisMonth;

      if (o.status === 'Completed') {
        stats.completedTotal++;
        if (isThisMonth) stats.completedThisMonth++;
        if (isLastMonth) stats.completedLastMonth++;
      } else if (o.status === 'In Process') {
        stats.inProcessTotal++;
        if (isThisMonth) stats.inProcessThisMonth++;
        if (isLastMonth) stats.inProcessLastMonth++;
      } else if (o.status === 'Pending') {
        stats.pendingTotal++;
        if (isThisMonth) stats.pendingThisMonth++;
        if (isLastMonth) stats.pendingLastMonth++;
      } else if (o.status === 'Cancelled') {
        stats.cancelledTotal++;
        if (isThisMonth) stats.cancelledThisMonth++;
        if (isLastMonth) stats.cancelledLastMonth++;
      } else if (o.status === 'Delivering') {
        stats.deliveringTotal++;
        if (isThisMonth) stats.deliveringThisMonth++;
        if (isLastMonth) stats.deliveringLastMonth++;
      }
    });

    const calculateGain = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return [
      {
        id: 'all',
        label: t('total_all_orders') || 'Total All Orders',
        value: orders.length,
        gain: calculateGain(stats.thisMonthOrders, stats.lastMonthOrders),
        icon: ShoppingBag,
        color: '#3b82f6',
        filterValue: 'All',
        filterToday: false
      },
      {
        id: 'completed',
        label: t('order_completed_kpi') || 'Order Completed',
        value: stats.completedTotal,
        gain: calculateGain(stats.completedThisMonth, stats.completedLastMonth),
        icon: CheckCircle2,
        color: '#10b981',
        filterValue: 'Completed'
      },
      {
        id: 'inProcess',
        label: t('in_process_order') || 'In-Process Order',
        value: stats.inProcessTotal,
        gain: calculateGain(stats.inProcessThisMonth, stats.inProcessLastMonth),
        icon: Activity,
        color: '#f59e0b',
        filterValue: 'In Process'
      },
      {
        id: 'pending',
        label: t('pending_order') || 'Pending Order',
        value: stats.pendingTotal,
        gain: calculateGain(stats.pendingThisMonth, stats.pendingLastMonth),
        icon: Clock,
        color: '#8b5cf6',
        filterValue: 'Pending'
      },
      {
        id: 'cancelled',
        label: t('cancelled_order_kpi') || 'Cancelled Order',
        value: stats.cancelledTotal,
        gain: calculateGain(stats.cancelledThisMonth, stats.cancelledLastMonth),
        icon: AlertCircle,
        color: '#ef4444',
        filterValue: 'Cancelled'
      },
      {
        id: 'delivering',
        label: t('delivering_order') || 'Delivering Order',
        value: stats.deliveringTotal,
        gain: calculateGain(stats.deliveringThisMonth, stats.deliveringLastMonth),
        icon: Truck,
        color: '#0ea5e9',
        filterValue: 'Delivering'
      }
    ];
  }, [orders, t]);

  // Payment Methods Calculation
  const paymentMethodData = useMemo(() => {
    let cod = 0, bank = 0, qr = 0;
    orders.forEach(o => {
      const pm = (o.paymentMethod || '').toLowerCase();
      if (pm.includes('cash') || pm.includes('cod') || pm.includes('delivery')) cod++;
      else if (pm.includes('bank') || pm.includes('transfer')) bank++;
      else if (pm.includes('duitnow') || pm.includes('qr')) qr++;
      else {
        // fallback: treat unmatched as Cash On Delivery
        cod++;
      }
    });

    const total = cod + bank + qr;
    if (total === 0) return [];

    // Compute percentages that add up to exactly 100
    const rawBank = (bank / total) * 100;
    const rawQr = (qr / total) * 100;
    const rawCod = (cod / total) * 100;
    const pBank = Math.round(rawBank);
    const pQr = Math.round(rawQr);
    const pCod = 100 - pBank - pQr; // ensure sum is exactly 100

    return [
      { name: t('bank_transfer') || 'Bank Transfer', value: bank, color: '#1e1b4b', percent: pBank },
      { name: t('qr_code') || 'DuitNow QR Code', value: qr, color: '#818cf8', percent: pQr },
      { name: t('cash_on_delivery') || 'Cash On Delivery', value: cod, color: '#c7d2fe', percent: pCod },
    ].filter(item => item.value > 0);
  }, [orders, t]);

  return (
    <AdminLayout title={t('orders') || 'Orders'} hideTitle>
      <div className="space-y-6">
        <header className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h1 className="text-[26px] font-normal leading-tight tracking-tight text-slate-800">{t('orders') || 'Orders'}</h1>
            <span className="text-xs font-normal text-slate-700">[ Access ]</span>
          </div>
          <p className="text-xs text-slate-600">Order Management /</p>
        </header>

        {/* Top Section: KPI & Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left: KPI Grid (2 columns, 3 rows) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {kpiStats.map((stat) => (
              <div
                key={stat.id}
                onClick={() => {
                  setStatusFilter(stat.filterValue);
                  setCurrentPage(1);
                  if (stat.filterToday) {
                    setTodayFilter(true);
                    setMonthFilter('');
                  } else {
                    setTodayFilter(false);
                  }
                  document.getElementById('orders-table-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="flex cursor-pointer items-center justify-between border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                style={{ borderColor: statusFilter === stat.filterValue && (stat.filterToday ? todayFilter : !todayFilter || stat.filterValue !== 'All') ? '#0284c7' : undefined }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-500">
                    <stat.icon size={19} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium leading-tight text-slate-700">{stat.label}</h3>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <h4 className="text-2xl font-semibold leading-none tracking-tight text-slate-900">
                    {stat.value}
                  </h4>
                  {/* Gain Indicator without frame */}
                  <div
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-semibold",
                      stat.gain >= 0 ? "text-emerald-600" : "text-rose-600"
                    )}
                    title="Compared to last month"
                  >
                    {stat.gain >= 0 ? <ArrowUp size={11} strokeWidth={2.5} /> : <ArrowDown size={11} strokeWidth={2.5} />}
                    {Math.abs(stat.gain)}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Payment Methods Chart - Enhanced */}
          <div className="flex flex-col overflow-hidden border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="px-6 pt-6 pb-2">
              <h3 className="text-sm font-semibold text-slate-800">{t('payment_methods') || 'Payment Methods'}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{t('payment_methods_desc') || 'Breakdown of all order payment types'}</p>
            </div>

            {/* Body */}
            <div className="flex flex-1 p-6 gap-4">

              {/* Donut chart */}
              <div className="relative flex-1 min-h-[220px] flex items-center justify-center">
                {paymentMethodData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          innerRadius="55%"
                          outerRadius="80%"
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                          label={({ cx, cy, midAngle, outerRadius, percent }: any) => {
                            const RADIAN = Math.PI / 180;
                            const radius = outerRadius * 1.22;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            if (percent < 5) return null;
                            return (
                              <text x={x} y={y} fill="#6b7280" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10" fontWeight="800">
                                {`${Math.round(percent)}%`}
                              </text>
                            );
                          }}
                        >
                          {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontWeight: 'bold', fontSize: '12px' }}
                          itemStyle={{ fontWeight: 'bold', color: '#18181b' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Total Text */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                      <span className="text-2xl font-extrabold text-zinc-900 leading-none">
                        {paymentMethodData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{t('total') || 'Total'}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-bold text-zinc-400">{t('no_payment_data') || 'No payment data'}</p>
                )}
              </div>

              {/* Right stats panel */}
              {paymentMethodData.length > 0 && (
                <div className="flex flex-col justify-center gap-4 w-[160px] shrink-0">
                  {paymentMethodData.map((entry, index) => (
                    <div key={index} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-[11px] font-bold text-zinc-500 truncate" title={entry.name}>{entry.name}</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-[20px] font-extrabold text-zinc-900 leading-none">{entry.value.toLocaleString()}</span>
                        <span
                          className="text-[11px] font-extrabold px-1.5 py-0.5 rounded-md leading-none mb-0.5"
                          style={{ backgroundColor: entry.color + '33', color: entry.color === '#c7d2fe' ? '#4338ca' : entry.color }}
                        >{entry.percent}%</span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(entry.percent, 100)}%`, backgroundColor: entry.color }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Unified Table Section */}
        <div id="orders-table-section" className="mt-6 scroll-mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">{t('orders') || 'Orders List'}</h2>
            <span className="text-xs text-slate-500">{filteredOrders.length} records</span>
          </div>

          <div className="flex flex-col overflow-hidden border border-slate-200 bg-white shadow-sm">

            {/* Top Toolbar */}
            <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between md:p-5">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'All', label: t('all_filter') || 'All', count: orders.length },
                  { id: 'Pending', label: t('pending_filter') || 'Pending', count: orders.filter(o => o.status === 'Pending').length },
                  { id: 'In Process', label: t('in_process_filter') || 'In-Process', count: orders.filter(o => o.status === 'In Process').length },
                  { id: 'Delivering', label: t('delivering_filter') || 'Delivering', count: orders.filter(o => o.status === 'Delivering').length },
                  { id: 'Completed', label: t('completed_filter') || 'Completed', count: orders.filter(o => o.status === 'Completed').length },
                  { id: 'Cancelled', label: t('cancelled_filter') || 'Cancelled', count: orders.filter(o => o.status === 'Cancelled').length },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => { setStatusFilter(filter.id); setCurrentPage(1); }}
                    className={`border px-3 py-2 text-xs font-medium transition-colors ${
                      statusFilter === filter.id
                        ? 'border-sky-700 bg-sky-700 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-sky-600 hover:bg-sky-50 hover:text-sky-800'
                    }`}
                  >
                    {filter.label} <span className="opacity-70 font-medium ml-1">({filter.count})</span>
                  </button>
                ))}
              </div>

              {/* Right side: Search & Date Filter */}
              <div className="flex flex-1 lg:flex-none items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-sky-700" size={16} />
                  <input
                    type="text"
                    placeholder={t('search_orders_placeholder') || 'Search Order ID, Name, Phone...'}
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition-colors focus:border-sky-600 focus:bg-white focus:ring-1 focus:ring-sky-600"
                  />
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center border transition-colors",
                      monthFilter || showCalendar
                        ? "border-sky-700 bg-sky-700 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:border-sky-600 hover:bg-sky-50"
                    )}
                    title="Filter by Month"
                  >
                    <Calendar size={18} />
                  </button>

                  <AnimatePresence>
                    {showCalendar && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowCalendar(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full z-20 mt-2 w-[280px] border border-slate-200 bg-white p-4 shadow-xl"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-zinc-800">{t('filter_by_month') || 'Filter by Month'}</h4>
                            <button onClick={() => setShowCalendar(false)} className="text-zinc-400 hover:text-zinc-600">
                              <X size={16} />
                            </button>
                          </div>

                          <input
                            type="month"
                            value={monthFilter}
                            onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
                            className="w-full border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-sky-600 focus:bg-white focus:ring-1 focus:ring-sky-600"
                          />

                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => { setMonthFilter(''); setCurrentPage(1); setShowCalendar(false); }}
                              className="flex-1 border border-slate-300 bg-white py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                              {t('clear') || 'Clear'}
                            </button>
                            <button
                              onClick={() => setShowCalendar(false)}
                              className="flex-1 bg-sky-700 py-2 text-xs font-medium text-white transition-colors hover:bg-sky-800"
                            >
                              {t('apply') || 'Apply'}
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto min-h-[500px]">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100">
                    <th onClick={() => handleSort('id')} className="cursor-pointer whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-700 transition-colors hover:text-sky-700 group/header">
                      <div className="flex items-center gap-2">{t('order_id') || 'Order ID'} <SortIndicator column="id" /></div>
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-700">{t('customer_name') || 'Customer Name'}</th>
                    <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-700">{t('phone_number') || 'Phone Number'}</th>
                    <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-700">{t('items') || 'Items'}</th>
                    <th onClick={() => handleSort('totalAmount')} className="cursor-pointer whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-700 transition-colors hover:text-sky-700 group/header">
                      <div className="flex items-center gap-2">{t('total_amount') || 'Total Amount'} <SortIndicator column="totalAmount" /></div>
                    </th>
                    <th onClick={() => handleSort('status')} className="cursor-pointer whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-700 transition-colors hover:text-sky-700 group/header">
                      <div className="flex items-center gap-2">{t('status') || 'Status'} <SortIndicator column="status" /></div>
                    </th>
                    <th onClick={() => handleSort('createdAt')} className="cursor-pointer whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-700 transition-colors hover:text-sky-700 group/header">
                      <div className="flex items-center gap-2">{t('date') || 'Date'} <SortIndicator column="createdAt" /></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                          <p className="text-sm font-bold text-zinc-400">{t('loading_orders') || 'Loading Orders...'}</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Package size={32} className="text-zinc-300" />
                          <p className="text-sm font-bold text-zinc-400">{t('no_order_records') || 'No order records found.'}</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                      className="group cursor-pointer odd:bg-white even:bg-slate-50 transition-colors hover:bg-sky-50"
                    >
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-sm font-medium text-slate-800">#{order.id?.slice(-8).toUpperCase()}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-slate-800">{order.customer?.name || '-'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-600">{order.customer?.phone || '-'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-700">
                          {order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0} {t('items') || 'items'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-slate-900">RM {order.totalAmount?.toFixed(2)}</span>
                      </td>
                      <td className="p-4 px-6">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                          order.status === 'Completed' ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                          order.status === 'Pending' ? "border-slate-300 bg-slate-50 text-slate-700" :
                          order.status === 'In Process' ? "border-amber-200 bg-amber-50 text-amber-700" :
                          order.status === 'Delivering' ? "border-blue-200 bg-blue-50 text-blue-700" :
                          order.status === 'Cancelled' ? "border-red-200 bg-red-50 text-red-700" :
                          "border-slate-200 bg-slate-50 text-slate-700"
                        )}>
                          {order.status === 'Completed' ? <CheckCircle2 size={12} /> :
                           order.status === 'Pending' ? <Clock size={12} /> :
                           order.status === 'In Process' ? <Activity size={12} /> :
                           order.status === 'Delivering' ? <Truck size={12} /> :
                           order.status === 'Cancelled' ? <AlertCircle size={12} /> : <Activity size={12} />}
                          {order.status === 'Completed' ? (t('completed_filter') || 'Completed') :
                           order.status === 'Pending' ? (t('pending_filter') || 'Pending') :
                           order.status === 'In Process' ? (t('in_process_filter') || 'In Process') :
                           order.status === 'Delivering' ? (t('delivering_filter') || 'Delivering') :
                           order.status === 'Cancelled' ? (t('cancelled_filter') || 'Cancelled') : order.status}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-700">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer - Pagination */}
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row">
              <p className="text-xs text-slate-600">
                Showing <span className="font-medium text-slate-900">{paginatedOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of <span className="font-medium text-slate-900">{filteredOrders.length}</span> records
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="border border-slate-300 bg-white p-2 text-slate-600 transition-colors hover:border-sky-600 hover:text-sky-700 disabled:opacity-40"
                  title="First Page"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="border border-slate-300 bg-white p-2 text-slate-600 transition-colors hover:border-sky-600 hover:text-sky-700 disabled:opacity-40"
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex gap-1 px-2">
                  {[...Array(totalPages)].map((_, i) => {
                    if (
                      i + 1 === 1 ||
                      i + 1 === totalPages ||
                      (i + 1 >= currentPage - 1 && i + 1 <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`h-8 w-8 border text-xs font-medium transition-colors ${
                            currentPage === i + 1
                              ? 'border-sky-700 bg-sky-700 text-white'
                              : 'border-slate-300 bg-white text-slate-700 hover:border-sky-600 hover:text-sky-700'
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    } else if (
                      (i + 1 === currentPage - 2) ||
                      (i + 1 === currentPage + 2)
                    ) {
                      return <span key={i} className="text-zinc-400 px-1 flex items-center">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="border border-slate-300 bg-white p-2 text-slate-600 transition-colors hover:border-sky-600 hover:text-sky-700 disabled:opacity-40"
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(totalPages)}
                  className="border border-slate-300 bg-white p-2 text-slate-600 transition-colors hover:border-sky-600 hover:text-sky-700 disabled:opacity-40"
                  title="Last Page"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default OrdersPage;
