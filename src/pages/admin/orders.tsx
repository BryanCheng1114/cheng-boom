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
      todayOrders: 0,
      yesterdayOrders: 0,
      
      completedThisMonth: 0,
      completedLastMonth: 0,
      
      inProcessThisMonth: 0,
      inProcessLastMonth: 0,
      
      pendingThisMonth: 0,
      pendingLastMonth: 0,
      
      cancelledThisMonth: 0,
      cancelledLastMonth: 0,
      
      deliveringThisMonth: 0,
      deliveringLastMonth: 0,
    };

    orders.forEach(o => {
      if (!o.createdAt) return;
      const time = new Date(o.createdAt).getTime();
      
      // Today vs Yesterday
      if (time >= startOfToday) stats.todayOrders++;
      else if (time >= startOfYesterday && time < startOfToday) stats.yesterdayOrders++;
      
      // This Month vs Last Month
      const isThisMonth = time >= startOfThisMonth;
      const isLastMonth = time >= startOfLastMonth && time < startOfThisMonth;

      if (o.status === 'Completed') {
        if (isThisMonth) stats.completedThisMonth++;
        if (isLastMonth) stats.completedLastMonth++;
      } else if (o.status === 'In Process') {
        if (isThisMonth) stats.inProcessThisMonth++;
        if (isLastMonth) stats.inProcessLastMonth++;
      } else if (o.status === 'Pending') {
        if (isThisMonth) stats.pendingThisMonth++;
        if (isLastMonth) stats.pendingLastMonth++;
      } else if (o.status === 'Cancelled') {
        if (isThisMonth) stats.cancelledThisMonth++;
        if (isLastMonth) stats.cancelledLastMonth++;
      } else if (o.status === 'Delivering') {
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
        id: 'today',
        label: 'Total Orders Today',
        value: stats.todayOrders,
        gain: calculateGain(stats.todayOrders, stats.yesterdayOrders),
        icon: ShoppingBag,
        color: '#3b82f6',
        filterValue: 'All',
        filterToday: true
      },
      {
        id: 'completed',
        label: 'Order Completed',
        value: stats.completedThisMonth,
        gain: calculateGain(stats.completedThisMonth, stats.completedLastMonth),
        icon: CheckCircle2,
        color: '#10b981',
        filterValue: 'Completed'
      },
      {
        id: 'inProcess',
        label: 'In-Process Order',
        value: stats.inProcessThisMonth,
        gain: calculateGain(stats.inProcessThisMonth, stats.inProcessLastMonth),
        icon: Activity,
        color: '#f59e0b',
        filterValue: 'In Process'
      },
      {
        id: 'pending',
        label: 'Pending Order',
        value: stats.pendingThisMonth,
        gain: calculateGain(stats.pendingThisMonth, stats.pendingLastMonth),
        icon: Clock,
        color: '#8b5cf6',
        filterValue: 'Pending'
      },
      {
        id: 'cancelled',
        label: 'Cancelled Order',
        value: stats.cancelledThisMonth,
        gain: calculateGain(stats.cancelledThisMonth, stats.cancelledLastMonth),
        icon: AlertCircle,
        color: '#ef4444',
        filterValue: 'Cancelled'
      },
      {
        id: 'delivering',
        label: 'Delivering Order',
        value: stats.deliveringThisMonth,
        gain: calculateGain(stats.deliveringThisMonth, stats.deliveringLastMonth),
        icon: Truck,
        color: '#0ea5e9',
        filterValue: 'Delivering'
      }
    ];
  }, [orders]);

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
      { name: 'Bank Transfer', value: bank, color: '#1e1b4b', percent: pBank },
      { name: 'DuitNow QR Code', value: qr, color: '#818cf8', percent: pQr },
      { name: 'Cash On Delivery', value: cod, color: '#c7d2fe', percent: pCod },
    ].filter(item => item.value > 0);
  }, [orders]);

  return (
    <AdminLayout title={t('orders') || 'Orders'}>
      <div className="space-y-8">
        
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
                className="bg-white border border-zinc-100 rounded-3xl p-6 flex items-center justify-between transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
                style={{ borderColor: (statusFilter === stat.filterValue && (stat.filterToday ? todayFilter : !todayFilter || stat.filterValue !== 'All')) ? stat.color + '60' : '' }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: stat.color }}>
                    <stat.icon size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-zinc-500 tracking-wide leading-tight">{stat.label}</h3>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1.5">
                  <h4 className="text-3xl font-extrabold text-zinc-900 leading-none">
                    {stat.value}
                  </h4>
                  {/* Pill Gain Indicator */}
                  <div 
                    className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold",
                      stat.gain >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                    )}
                    title={stat.id === 'today' ? "Compared to yesterday" : "Compared to last month"}
                  >
                    {stat.gain >= 0 ? <ArrowUp size={10} strokeWidth={3} /> : <ArrowDown size={10} strokeWidth={3} />}
                    {Math.abs(stat.gain)}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Payment Methods Chart - Enhanced */}
          <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden flex flex-col shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300">
            {/* Header */}
            <div className="px-6 pt-6 pb-2">
              <h3 className="text-[14px] font-bold text-zinc-800 tracking-wide">Payment Methods</h3>
              <p className="text-[12px] font-medium text-zinc-500 mt-0.5">Breakdown of all order payment types</p>
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
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">Total</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-bold text-zinc-400">No payment data</p>
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
        <div id="orders-table-section" className="mt-8">
          <div className="flex items-center gap-2 px-2 mb-6 relative">
            <h3 className="text-xl font-bold text-zinc-800 tracking-wide">{t('orders') || 'Orders List'}</h3>
          </div>
          
          <div className="bg-white border border-zinc-100 rounded-[40px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
            
            {/* Top Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between p-6 pb-4 border-b border-zinc-100">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'All', label: 'All', count: orders.length },
                  { id: 'Pending', label: 'Pending', count: orders.filter(o => o.status === 'Pending').length },
                  { id: 'In Process', label: 'In-Process', count: orders.filter(o => o.status === 'In Process').length },
                  { id: 'Delivering', label: 'Delivering', count: orders.filter(o => o.status === 'Delivering').length },
                  { id: 'Completed', label: 'Completed', count: orders.filter(o => o.status === 'Completed').length },
                  { id: 'Cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'Cancelled').length },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => { setStatusFilter(filter.id); setCurrentPage(1); }}
                    className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                      statusFilter === filter.id 
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
                        : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                    }`}
                  >
                    {filter.label} <span className="opacity-70 font-medium ml-1">({filter.count})</span>
                  </button>
                ))}
              </div>

              {/* Right side: Search & Date Filter */}
              <div className="flex flex-1 lg:flex-none items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search Order ID, Name, Phone..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-full outline-none focus:border-blue-500 focus:bg-white transition-all text-[13px] font-bold text-zinc-700"
                  />
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0",
                      monthFilter || showCalendar
                        ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" 
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
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
                          className="absolute right-0 top-full mt-2 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-20 p-4 w-[280px]"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-zinc-800">Filter by Month</h4>
                            <button onClick={() => setShowCalendar(false)} className="text-zinc-400 hover:text-zinc-600">
                              <X size={16} />
                            </button>
                          </div>
                          
                          <input 
                            type="month"
                            value={monthFilter}
                            onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
                            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-[13px] font-bold text-zinc-700 cursor-pointer"
                          />

                          <div className="mt-4 flex gap-2">
                            <button 
                              onClick={() => { setMonthFilter(''); setCurrentPage(1); setShowCalendar(false); }}
                              className="flex-1 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors"
                            >
                              Clear
                            </button>
                            <button 
                              onClick={() => setShowCalendar(false)}
                              className="flex-1 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 hover:brightness-110 transition-all"
                            >
                              Apply
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
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    <th onClick={() => handleSort('id')} className="p-4 px-6 text-[11px] font-black text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap group/header">
                      <div className="flex items-center gap-2">Order ID <SortIndicator column="id" /></div>
                    </th>
                    <th className="p-4 px-6 text-[11px] font-black text-zinc-400 uppercase tracking-wider whitespace-nowrap">Customer Name</th>
                    <th className="p-4 px-6 text-[11px] font-black text-zinc-400 uppercase tracking-wider whitespace-nowrap">Phone Number</th>
                    <th onClick={() => handleSort('totalAmount')} className="p-4 px-6 text-[11px] font-black text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap group/header">
                      <div className="flex items-center gap-2">Total Amount <SortIndicator column="totalAmount" /></div>
                    </th>
                    <th onClick={() => handleSort('status')} className="p-4 px-6 text-[11px] font-black text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap group/header">
                      <div className="flex items-center gap-2">Status <SortIndicator column="status" /></div>
                    </th>
                    <th onClick={() => handleSort('createdAt')} className="p-4 px-6 text-[11px] font-black text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-blue-500 transition-colors whitespace-nowrap group/header">
                      <div className="flex items-center gap-2">Date <SortIndicator column="createdAt" /></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                          <p className="text-sm font-bold text-zinc-400">Loading Orders...</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Package size={32} className="text-zinc-300" />
                          <p className="text-sm font-bold text-zinc-400">No order records found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                      className="group hover:bg-blue-50/50 transition-colors cursor-pointer"
                    >
                      <td className="p-4 px-6">
                        <span className="text-[14px] font-bold text-zinc-800 font-mono">#{order.id?.slice(-8).toUpperCase()}</span>
                      </td>
                      <td className="p-4 px-6">
                        <span className="text-[13px] font-bold text-zinc-800">{order.customer?.name || '-'}</span>
                      </td>
                      <td className="p-4 px-6">
                        <span className="text-[13px] font-medium text-zinc-600">{order.customer?.phone || '-'}</span>
                      </td>
                      <td className="p-4 px-6">
                        <span className="text-[15px] font-black text-black">RM {order.totalAmount?.toFixed(2)}</span>
                      </td>
                      <td className="p-4 px-6">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                          order.status === 'Completed' ? "bg-emerald-100 text-emerald-700" :
                          order.status === 'Pending' ? "bg-orange-100 text-orange-700 animate-pulse" :
                          order.status === 'In Process' ? "bg-amber-100 text-amber-700" :
                          order.status === 'Delivering' ? "bg-blue-100 text-blue-700" :
                          order.status === 'Cancelled' ? "bg-red-100 text-red-700" :
                          "bg-zinc-100 text-zinc-700"
                        )}>
                          {order.status === 'Completed' ? <CheckCircle2 size={12} /> : 
                           order.status === 'Pending' ? <Clock size={12} /> : 
                           order.status === 'In Process' ? <Activity size={12} /> :
                           order.status === 'Delivering' ? <Truck size={12} /> : 
                           order.status === 'Cancelled' ? <AlertCircle size={12} /> : <Activity size={12} />}
                          {order.status}
                        </div>
                      </td>
                      <td className="p-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-zinc-700">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-medium">
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
            <div className="p-4 px-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/50">
              <p className="text-[12px] font-semibold text-zinc-500">
                Showing <span className="text-zinc-900 font-bold">{paginatedOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="text-zinc-900 font-bold">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of <span className="text-zinc-900 font-bold">{filteredOrders.length}</span> records
              </p>
              
              <div className="flex items-center gap-1.5">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-500 hover:text-blue-500 hover:border-blue-200 disabled:opacity-40 disabled:hover:border-zinc-200 disabled:hover:text-zinc-500 transition-all shadow-sm"
                  title="First Page"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-500 hover:text-blue-500 hover:border-blue-200 disabled:opacity-40 disabled:hover:border-zinc-200 disabled:hover:text-zinc-500 transition-all shadow-sm"
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
                          className={`w-8 h-8 rounded-xl text-[12px] font-bold transition-all shadow-sm ${
                            currentPage === i + 1 
                              ? 'bg-blue-500 text-white border-blue-500 shadow-blue-500/20' 
                              : 'bg-white text-zinc-600 border border-zinc-200 hover:border-blue-300 hover:text-blue-600'
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
                  className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-500 hover:text-blue-500 hover:border-blue-200 disabled:opacity-40 disabled:hover:border-zinc-200 disabled:hover:text-zinc-500 transition-all shadow-sm"
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
                <button 
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(totalPages)}
                  className="p-2 rounded-xl bg-white border border-zinc-200 text-zinc-500 hover:text-blue-500 hover:border-blue-200 disabled:opacity-40 disabled:hover:border-zinc-200 disabled:hover:text-zinc-500 transition-all shadow-sm"
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
