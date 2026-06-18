import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  BarChart3, 
  ShoppingBag, 
  Package, 
  Clock, 
  AlertCircle
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
      return (
        <div className="bg-white  border border-zinc-200  p-4 rounded-2xl shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
          <p className="text-lg font-black italic text-primary">
            RM {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const statCards = [
    { label: t('total_sales') || 'Total Sales', value: `RM ${metrics.totalRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: t('average_order_value') || 'Average Order Value', value: `RM ${metrics.avgOrderValue.toFixed(2)}`, icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: t('completed_sales') || 'Completed Sales', value: metrics.totalOrders, icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: t('units_sold') || 'Units Sold', value: metrics.unitsSold, icon: Package, color: 'text-purple-500', bg: 'bg-purple-500/10' },
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
              className=" bg-white border  border-zinc-100 rounded-[32px] p-7 transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-[20px] ${stat.bg} ${stat.color}`}>
                  <stat.icon size={24} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black italic tracking-tight mb-2  text-zinc-900">
                {isLoading ? '---' : stat.value}
              </h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white  border border-zinc-200  rounded-[40px] p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <BarChart3 size={16} /> {t('daily_revenue') || 'Daily Revenue'}
              </h3>
              
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-zinc-50  border border-zinc-200  text-sm font-bold text-zinc-700  rounded-xl px-4 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              >
                <option value="30days">{t('last_30_days') || 'Last 30 Days'}</option>
                {availableMonths.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            
            <div className="h-[350px] w-full">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                      tickFormatter={(value) => `RM${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#f59e0b" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorRev)" 
                      activeDot={{ r: 8, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white  border border-zinc-200  rounded-[40px] p-8 shadow-2xl flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-8 flex items-center gap-2">
              <TrendingUp size={16} /> {t('top_selling_products') || 'Top Selling Products'}
            </h3>

            <div className="flex-1 flex flex-col gap-6">
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : topProducts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                  <AlertCircle size={40} className="text-zinc-400 mb-4" />
                  <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{t('no_data') || 'No data available'}</p>
                </div>
              ) : (
                topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-zinc-100  flex items-center justify-center text-sm font-black text-zinc-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900  line-clamp-1 group-hover:text-primary transition-colors">
                          {product.name}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">
                          {product.qty} {t('units_sold') || 'Units Sold'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black italic text-primary">
                        RM {product.rev.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
