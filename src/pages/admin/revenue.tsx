import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  BarChart3, 
  ShoppingBag, 
  Package, 
  Clock, 
  AlertCircle,
  MoreHorizontal,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useLanguage } from '../../context/LanguageContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function RevenuePage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    unitsSold: 0
  });

  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30days');
  const [availableMonths, setAvailableMonths] = useState<{label: string, value: string}[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        const completedOrders = data.filter((o: any) => o.status === 'Completed');
        setAllOrders(completedOrders);
        
        const months = new Set<string>();
        completedOrders.forEach((o: any) => {
           const d = new Date(o.createdAt);
           const yyyyMm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
           months.add(yyyyMm);
        });
        const monthOptions = Array.from(months).sort().reverse().map(m => {
           const d = new Date(m + '-01');
           return { label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), value: m };
        });
        setAvailableMonths(monthOptions);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    if (allOrders.length === 0 && !isLoading) return;

    let filteredOrders = allOrders;
    let datesToMap: string[] = [];
    
    if (selectedPeriod === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filteredOrders = allOrders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
      
      datesToMap = [...Array(30)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toISOString().split('T')[0];
      });
    } else {
      const [year, month] = selectedPeriod.split('-');
      filteredOrders = allOrders.filter(o => {
         const d = new Date(o.createdAt);
         return d.getFullYear() === parseInt(year) && (d.getMonth() + 1) === parseInt(month);
      });
      
      const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
      datesToMap = [...Array(daysInMonth)].map((_, i) => {
        return `${year}-${month}-${String(i + 1).padStart(2, '0')}`;
      });
    }

    const totalRev = filteredOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
    const totalOrd = filteredOrders.length;
    const avgValue = totalOrd > 0 ? totalRev / totalOrd : 0;
    
    let totalUnits = 0;
    const productSales: Record<string, { name: string, qty: number, rev: number }> = {};

    const dailyRevenue: Record<string, number> = {};
    datesToMap.forEach(date => { dailyRevenue[date] = 0; });

    filteredOrders.forEach((order: any) => {
      const dateString = new Date(order.createdAt).toISOString().split('T')[0];
      if (dailyRevenue[dateString] !== undefined) {
        dailyRevenue[dateString] += order.totalAmount;
      }
      order.items?.forEach((item: any) => {
        totalUnits += item.quantity;
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.name, qty: 0, rev: 0 };
        }
        productSales[item.productId].qty += item.quantity;
        productSales[item.productId].rev += (item.price * item.quantity);
      });
    });

    setMetrics({
      totalRevenue: totalRev,
      totalOrders: totalOrd,
      avgOrderValue: avgValue,
      unitsSold: totalUnits
    });

    const formattedChartData = datesToMap.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: dailyRevenue[date]
    }));
    setChartData(formattedChartData);

    const sortedProducts = Object.values(productSales)
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 5);
    setTopProducts(sortedProducts);
  }, [allOrders, selectedPeriod, isLoading]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const display = val >= 1000 ? (val / 1000).toFixed(1) + 'k' : `RM ${val.toFixed(2)}`;
      return (
        <div className="bg-zinc-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex flex-col items-center gap-0.5" style={{ minWidth: '80px' }}>
          <p className="text-[13px] font-extrabold tracking-wide">{display}</p>
          <p className="text-[10px] text-zinc-400 font-semibold">{label}</p>
          <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-900 rotate-45 rounded-sm"></div>
        </div>
      );
    }
    return null;
  };

  const statCards = [
    { 
      label: t('total_sales') || 'Total Sales', 
      value: `RM ${metrics.totalRevenue.toLocaleString()}`, 
      sub: 'Completed Sales', 
      icon: TrendingUp, 
      solidBg: 'bg-[#f59e0b]', // yellow/orange
      pillBg: 'bg-emerald-500/10', pillText: 'text-emerald-500', pillIcon: ArrowUp, pillValue: '12%'
    },
    { 
      label: t('average_order_value') || 'Average Order Value', 
      value: `RM ${metrics.avgOrderValue.toFixed(2)}`, 
      sub: 'Per Order', 
      icon: BarChart3, 
      solidBg: 'bg-[#3b82f6]', // blue
      pillBg: 'bg-emerald-500/10', pillText: 'text-emerald-500', pillIcon: ArrowUp, pillValue: '5%'
    },
    { 
      label: t('completed_sales') || 'Completed Sales', 
      value: metrics.totalOrders, 
      sub: 'All Transactions', 
      icon: ShoppingBag, 
      solidBg: 'bg-[#10b981]', // green
      pillBg: 'bg-emerald-500/10', pillText: 'text-emerald-500', pillIcon: ArrowUp, pillValue: '18%'
    },
    { 
      label: t('units_sold') || 'Units Sold', 
      value: metrics.unitsSold, 
      sub: 'Total Items', 
      icon: Package, 
      solidBg: 'bg-[#a855f7]', // purple
      pillBg: 'bg-emerald-500/10', pillText: 'text-emerald-500', pillIcon: ArrowUp, pillValue: '8%'
    },
  ];

  return (
    <AdminLayout title={t('revenue') || 'Revenue'}>
      <div className="space-y-10 pb-10">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {statCards.map((stat, i) => (
            <motion.div 
              key={stat.label} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.1 }} 
              className="bg-white border border-zinc-100 rounded-3xl p-8 min-h-[200px] flex flex-col justify-between transition-all duration-300 group shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg"
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

              {/* Middle Row: Large Value */}
              <h3 className="text-3xl font-extrabold text-zinc-900 mb-4 tracking-tight leading-none">
                {isLoading ? '---' : stat.value}
              </h3>

              {/* Bottom Row: Pill + Subtext */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-bold ${stat.pillBg} ${stat.pillText}`}>
                  <stat.pillIcon size={10} strokeWidth={3} /> {stat.pillValue}
                </div>
                <p className="text-[12px] font-medium text-zinc-500">{stat.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white border border-zinc-100 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
            {/* Card Header */}
            <div className="px-8 pt-7 pb-5 border-b border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-[18px] font-bold text-zinc-800 tracking-wide">
                  {t('daily_revenue') || 'Daily Revenue'}
                </h3>
                {!isLoading && (
                  <p className="text-[13px] text-zinc-500 font-medium mt-0.5">
                    Total: <span className="font-bold text-zinc-700">RM {metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </p>
                )}
              </div>
              <div className="relative inline-flex items-center group">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="appearance-none bg-zinc-50 border border-zinc-200 text-[13px] font-bold text-zinc-700 rounded-full pl-5 pr-10 py-2 outline-none hover:border-zinc-300 cursor-pointer transition-all"
                >
                  <option value="30days">{t('last_30_days') || 'Last 30 Days'}</option>
                  {availableMonths.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {/* Chart Body */}
            <div className="px-4 pb-6 pt-4">
              <div className="h-[320px] w-full">
                {isLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                          <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.7} />
                        </linearGradient>
                        <linearGradient id="barGradientActive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity={1} />
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f4" opacity={1} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 600 }}
                        dy={10}
                        minTickGap={30}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#a1a1aa', fontSize: 11, fontWeight: 600 }}
                        tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                        width={40}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(99,102,241,0.06)', radius: 8 }}
                        content={<CustomTooltip />}
                        position={{ y: 0 }}
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill="url(#barGradient)" 
                        radius={[8, 8, 4, 4]}
                        activeBar={{ fill: 'url(#barGradientActive)', stroke: 'none' }}
                        maxBarSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white border border-zinc-100 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-8 pt-7 pb-5 border-b border-zinc-100">
              <h3 className="text-[18px] font-bold text-zinc-800 tracking-wide">Top Selling Products</h3>
              <p className="text-[13px] text-zinc-500 font-medium mt-0.5">By revenue this period</p>
            </div>

            <div className="flex-1 flex flex-col px-8 py-6 gap-5">
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : topProducts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-10">
                  <AlertCircle size={40} className="text-zinc-300 mb-4" />
                  <p className="text-sm font-bold text-zinc-400">{t('no_data') || 'No data available'}</p>
                </div>
              ) : (() => {
                const maxRev = Math.max(...topProducts.map((p: any) => p.rev));
                const medals = ['🥇', '🥈', '🥉'];
                const barColors = [
                  'bg-gradient-to-r from-indigo-500 to-violet-500',
                  'bg-gradient-to-r from-sky-400 to-blue-500',
                  'bg-gradient-to-r from-emerald-400 to-teal-500',
                  'bg-gradient-to-r from-amber-400 to-orange-400',
                  'bg-gradient-to-r from-rose-400 to-pink-500',
                ];
                return topProducts.map((product: any, index: number) => (
                  <div key={index} className="group">
                    {/* Row top: rank + name + revenue */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[18px] leading-none">
                          {index < 3 ? medals[index] : (
                            <span className="inline-flex w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 text-[11px] font-black items-center justify-center">
                              {index + 1}
                            </span>
                          )}
                        </span>
                        <div>
                          <p className="text-[13px] font-bold text-zinc-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            {product.name}
                          </p>
                          <p className="text-[11px] text-zinc-400 font-medium">{product.qty} units sold</p>
                        </div>
                      </div>
                      <span className="text-[13px] font-extrabold text-zinc-900 tabular-nums">RM {product.rev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barColors[index % barColors.length]}`}
                        style={{ width: `${Math.max(4, (product.rev / maxRev) * 100)}%` }}
                      />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
