import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
  ArrowLeft, Calendar, Download, RefreshCcw, Search, ChevronDown, 
  TrendingUp, Award, BarChart3, ShoppingBag, Tag, Star, ArrowUpRight, ArrowDownRight, Info, X
} from 'lucide-react';
import { useRouter } from 'next/router';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SellerPerformancePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showAllModal, setShowAllModal] = useState<'top' | 'lowest' | null>(null);

  // Filters State
  const [dateRange, setDateRange] = useState('last_30_days');
  const [sellerLevel, setSellerLevel] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  
  const [salesChartView, setSalesChartView] = useState('Daily');
  const [ordersChartView, setOrdersChartView] = useState('Daily');

  const fetchPerformanceData = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        dateRange,
        sellerLevel,
        status,
        search
      });
      const res = await fetch(`/api/admin/seller-performance?${query}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch performance data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const handleApplyFilters = () => {
    fetchPerformanceData();
  };

  const handleResetFilters = () => {
    setDateRange('last_30_days');
    setSellerLevel('all');
    setStatus('all');
    setSearch('');
    setTimeout(() => {
      // Trigger fetch in next tick after state updates
      const query = new URLSearchParams({ dateRange: 'last_30_days', sellerLevel: 'all', status: 'all', search: '' });
      fetch(`/api/admin/seller-performance?${query}`).then(r => r.json()).then(setData);
    }, 0);
  };

  if (!data && isLoading) {
    return (
      <AdminLayout title="Seller Performance" hideTitle={true}>
        <div className="flex h-[80vh] items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
        </div>
      </AdminLayout>
    );
  }

  const { metrics, chartData, tierPerformance, topSellers, lowestSellers, allSellers, levels } = data || {};

  const getGroupedChartData = (view: string) => {
    if (!chartData) return [];
    if (view === 'Daily') return chartData;
    
    // Group by week
    const weeklyData: any[] = [];
    let currentWeek: any = null;
    
    chartData.forEach((day: any, index: number) => {
      if (index % 7 === 0) {
        if (currentWeek) weeklyData.push(currentWeek);
        currentWeek = { date: day.date, sales: 0, orders: 0 };
      }
      if (currentWeek) {
        currentWeek.sales += day.sales;
        currentWeek.orders += day.orders;
      }
    });
    if (currentWeek) weeklyData.push(currentWeek);
    return weeklyData;
  };

  const salesData = getGroupedChartData(salesChartView);
  const ordersData = getGroupedChartData(ordersChartView);

  return (
    <AdminLayout title="Seller Performance" hideTitle={true}>
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <button 
            onClick={() => router.push('/admin/seller-setup')}
            className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
          >
            <ArrowLeft size={16} /> Back to Seller Setup
          </button>
          <h1 className="text-[28px] font-black text-zinc-900 tracking-tight">Seller Performance Report</h1>
          <p className="text-sm font-medium text-zinc-500 mt-1">Monitor seller performance and tier progress over time.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              value={dateRange}
              onChange={(e) => {
                const val = e.target.value;
                setDateRange(val);
                const query = new URLSearchParams({ dateRange: val, sellerLevel, status, search });
                fetch(`/api/admin/seller-performance?${query}`).then(r => r.json()).then(setData);
              }}
              className="appearance-none pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-sm font-bold flex items-center shadow-sm focus:outline-none cursor-pointer"
            >
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="all_time">All Time</option>
            </select>
            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT SIDEBAR */}
        <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-6">
          
          {/* Filters */}
          <div className="bg-white border border-zinc-200 rounded-[24px] p-6 shadow-sm">
            <h3 className="font-bold text-zinc-900 mb-5">Filters</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Date Range</label>
                <div className="relative">
                  <select 
                    value={dateRange} onChange={(e) => setDateRange(e.target.value)}
                    className="w-full appearance-none bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold pl-4 pr-10 py-2.5 rounded-xl focus:outline-none focus:border-zinc-400 transition-colors cursor-pointer"
                  >
                    <option value="last_7_days">Last 7 Days</option>
                    <option value="last_30_days">Last 30 Days</option>
                    <option value="all_time">All Time</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Seller Level</label>
                <div className="relative">
                  <select 
                    value={sellerLevel} onChange={(e) => setSellerLevel(e.target.value)}
                    className="w-full appearance-none bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold pl-4 pr-10 py-2.5 rounded-xl focus:outline-none focus:border-zinc-400 transition-colors cursor-pointer"
                  >
                    <option value="all">All Levels</option>
                    {levels?.map((l: any) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Seller Status</label>
                <div className="relative">
                  <select 
                    value={status} onChange={(e) => setStatus(e.target.value)}
                    className="w-full appearance-none bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold pl-4 pr-10 py-2.5 rounded-xl focus:outline-none focus:border-zinc-400 transition-colors cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5">Search Seller</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name, email or phone..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:border-zinc-400 transition-colors placeholder:text-zinc-400" 
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button 
                onClick={handleApplyFilters}
                className="flex-1 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors"
              >
                Apply Filters
              </button>
              <button 
                onClick={handleResetFilters}
                className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCcw size={14} className="text-zinc-400" /> Reset
              </button>
            </div>
          </div>

          {/* Summary Overview */}
          <div className="bg-white border border-zinc-200 rounded-[24px] p-6 shadow-sm flex-1 flex flex-col">
            <h3 className="font-bold text-zinc-900 mb-5">Summary Overview</h3>
            <div className="space-y-4 divide-y divide-zinc-100">
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-zinc-600">Total Sellers</span>
                <span className="text-sm font-black text-zinc-900">{metrics?.totalSellers}</span>
              </div>
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm font-medium text-zinc-600">Active Sellers</span>
                <span className="text-sm font-black text-green-500">{metrics?.activeSellers}</span>
              </div>
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm font-medium text-zinc-600">Inactive Sellers</span>
                <span className="text-sm font-black text-zinc-900">{metrics?.inactiveSellers}</span>
              </div>
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm font-medium text-zinc-600">Total Sales (30 Days)</span>
                <span className="text-sm font-black text-zinc-900">RM {metrics?.totalSales?.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm font-medium text-zinc-600">Total Orders (30 Days)</span>
                <span className="text-sm font-black text-zinc-900">{metrics?.totalOrders}</span>
              </div>
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm font-medium text-zinc-600">Average Order Value</span>
                <span className="text-sm font-black text-zinc-900">RM {metrics?.averageOrderValue?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT */}
        <div className="flex-1 space-y-6">
          
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Sales Card */}
            <div className="bg-white border border-zinc-200 rounded-[24px] p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Total Sales</div>
                  <div className="text-lg font-black text-zinc-900">RM {metrics?.totalSales?.toFixed(2)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                <span className="text-green-500 flex items-center gap-0.5"><ArrowUpRight size={14}/> {metrics?.salesTrend}%</span>
                <span>vs previous period</span>
              </div>
            </div>

            {/* Orders Card */}
            <div className="bg-white border border-zinc-200 rounded-[24px] p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Total Orders</div>
                  <div className="text-lg font-black text-zinc-900">{metrics?.totalOrders}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                <span className="text-green-500 flex items-center gap-0.5"><ArrowUpRight size={14}/> {metrics?.ordersTrend}%</span>
                <span>vs previous period</span>
              </div>
            </div>

            {/* AOV Card */}
            <div className="bg-white border border-zinc-200 rounded-[24px] p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Avg Order Value</div>
                  <div className="text-lg font-black text-zinc-900">RM {metrics?.averageOrderValue?.toFixed(2)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                <span className="text-green-500 flex items-center gap-0.5"><ArrowUpRight size={14}/> {metrics?.aovTrend}%</span>
                <span>vs previous period</span>
              </div>
            </div>

            {/* Discounts Card */}
            <div className="bg-white border border-zinc-200 rounded-[24px] p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                  <Tag size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Total Discounts Given</div>
                  <div className="text-lg font-black text-zinc-900">RM {metrics?.totalDiscounts?.toFixed(2)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                <span className="text-green-500 flex items-center gap-0.5"><ArrowUpRight size={14}/> {metrics?.discountsTrend}%</span>
                <span>vs previous period</span>
              </div>
            </div>

          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Sales Chart */}
            <div className="bg-white border border-zinc-200 rounded-[24px] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-zinc-900">Sales Performance</h3>
                <div className="relative">
                  <select 
                    value={salesChartView}
                    onChange={(e) => setSalesChartView(e.target.value)}
                    className="appearance-none bg-white border border-zinc-200 text-zinc-700 text-xs font-bold pl-3 pr-8 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
                    }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} tickFormatter={(val) => `RM ${val/1000}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [`RM ${Number(value || 0).toFixed(2)}`, 'Sales']}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Orders Chart */}
            <div className="bg-white border border-zinc-200 rounded-[24px] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-zinc-900">Orders Performance</h3>
                <div className="relative">
                  <select 
                    value={ordersChartView}
                    onChange={(e) => setOrdersChartView(e.target.value)}
                    className="appearance-none bg-white border border-zinc-200 text-zinc-700 text-xs font-bold pl-3 pr-8 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ordersData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
                    }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [Number(value || 0), 'Orders']}
                    />
                    <Area type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Bottom Tables Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* Performance By Tier (Spans 1 to 2 cols on big screens) */}
            <div className="xl:col-span-1 bg-white border border-zinc-200 rounded-[24px] shadow-sm flex flex-col">
              <div className="p-5 border-b border-zinc-100">
                <h3 className="font-bold text-zinc-900">Performance by Tier</h3>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100">
                        <th className="pb-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Tier Level</th>
                        <th className="pb-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap text-right">Sellers</th>
                        <th className="pb-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap text-right">Total Sales</th>
                        <th className="pb-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap text-right">Total Orders</th>
                        <th className="pb-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap text-right">Avg Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {tierPerformance?.map((tp: any) => {
                        const isSilver = tp.level.name.toLowerCase().includes('silver');
                        const isGold = tp.level.name.toLowerCase().includes('gold');
                        const isPlatinum = tp.level.name.toLowerCase().includes('platinum');
                        let levelIconClass = 'text-zinc-400';
                        if (isGold) levelIconClass = 'text-yellow-500';
                        if (isPlatinum) levelIconClass = 'text-purple-500';

                        return (
                          <tr key={tp.level.id}>
                            <td className="py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Award size={16} strokeWidth={2.5} className={levelIconClass} />
                                <span className="font-bold text-sm text-zinc-900">{tp.level.name}</span>
                              </div>
                            </td>
                            <td className="py-4 whitespace-nowrap text-right">
                              <div className="font-bold text-sm text-zinc-900">{tp.sellersCount}</div>
                              <div className="text-[10px] text-zinc-500 font-medium">({tp.sellersPercentage.toFixed(1)}%)</div>
                            </td>
                            <td className="py-4 whitespace-nowrap text-right">
                              <div className="font-bold text-sm text-zinc-900">RM {tp.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                              <div className="text-[10px] text-green-500 font-bold flex justify-end gap-0.5"><ArrowUpRight size={12}/> {tp.salesTrend}%</div>
                            </td>
                            <td className="py-4 whitespace-nowrap text-right">
                              <div className="font-bold text-sm text-zinc-900">{tp.totalOrders}</div>
                              <div className="text-[10px] text-green-500 font-bold flex justify-end gap-0.5"><ArrowUpRight size={12}/> {tp.ordersTrend}%</div>
                            </td>
                            <td className="py-4 whitespace-nowrap text-right">
                              <div className="font-bold text-sm text-zinc-900">RM {tp.averageOrderValue.toFixed(2)}</div>
                              <div className="text-[10px] text-green-500 font-bold flex justify-end gap-0.5"><ArrowUpRight size={12}/> {tp.aovTrend}%</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-auto pt-4">
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 flex items-start gap-2">
                    <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-700 font-medium leading-relaxed">Performance is calculated based on completed orders within the selected date range.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performing Sellers */}
            <div className="bg-white border border-zinc-200 rounded-[24px] shadow-sm flex flex-col">
              <div className="p-5 border-b border-zinc-100 flex items-center gap-2">
                <Star size={16} className="text-green-500 fill-green-500" />
                <h3 className="font-bold text-zinc-900">Top Performing Sellers</h3>
              </div>
              <div className="p-5 flex-1">
                <div className="space-y-4">
                  {topSellers?.map((ts: any, index: number) => {
                    return (
                      <div key={ts.seller.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${index < 3 ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-500'}`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-zinc-900 leading-tight">{ts.seller.name}</div>
                            <div className="text-[10px] font-medium text-zinc-500">{ts.seller.sellerLevel?.name || 'No Tier'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-zinc-900 leading-tight">RM {ts.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          <div className="text-[10px] font-medium text-zinc-500">{ts.totalOrders} orders</div>
                        </div>
                      </div>
                    );
                  })}
                  {topSellers?.length === 0 && (
                    <div className="text-center text-zinc-500 text-sm font-medium py-6">No data available</div>
                  )}
                </div>
                {topSellers?.length > 0 && (
                  <div className="mt-6 text-center">
                    <button onClick={() => setShowAllModal('top')} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">View All Top Sellers →</button>
                  </div>
                )}
              </div>
            </div>

            {/* Lowest Performing Sellers */}
            <div className="bg-white border border-zinc-200 rounded-[24px] shadow-sm flex flex-col">
              <div className="p-5 border-b border-zinc-100 flex items-center gap-2">
                <Star size={16} className="text-red-500 fill-red-500" />
                <h3 className="font-bold text-zinc-900">Lowest Performing Sellers</h3>
              </div>
              <div className="p-5 flex-1">
                <div className="space-y-4">
                  {lowestSellers?.map((ls: any, index: number) => {
                    return (
                      <div key={ls.seller.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${index < 3 ? 'bg-red-50 text-red-500' : 'bg-zinc-100 text-zinc-500'}`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-zinc-900 leading-tight">{ls.seller.name}</div>
                            <div className="text-[10px] font-medium text-zinc-500">{ls.seller.sellerLevel?.name || 'No Tier'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-zinc-900 leading-tight">RM {ls.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          <div className="text-[10px] font-medium text-zinc-500">{ls.totalOrders} orders</div>
                        </div>
                      </div>
                    );
                  })}
                  {lowestSellers?.length === 0 && (
                    <div className="text-center text-zinc-500 text-sm font-medium py-6">No data available</div>
                  )}
                </div>
                {lowestSellers?.length > 0 && (
                  <div className="mt-6 text-center">
                    <button onClick={() => setShowAllModal('lowest')} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">View All Lowest Sellers →</button>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-6 flex items-start gap-2 border-t border-zinc-200">
        <div className="w-5 h-5 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0 mt-0.5">
          <Info size={12} />
        </div>
        <p className="text-xs font-medium text-zinc-500">Use this report to evaluate seller performance and adjust tier levels accordingly.</p>
      </div>

      {/* View All Modal */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden relative">
            
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <Star size={20} className={showAllModal === 'top' ? 'text-green-500 fill-green-500' : 'text-red-500 fill-red-500'} />
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">
                    {showAllModal === 'top' ? 'All Top Performing Sellers' : 'All Lowest Performing Sellers'}
                  </h3>
                  <p className="text-sm text-zinc-500 font-medium mt-0.5">Full ranked list based on total sales</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAllModal(null)} 
                className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {(showAllModal === 'top' ? allSellers : [...(allSellers || [])].reverse())?.map((ts: any, index: number) => (
                  <div key={ts.seller.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-200">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${index < 3 && showAllModal === 'top' ? 'bg-green-100 text-green-600' : index < 3 && showAllModal === 'lowest' ? 'bg-red-50 text-red-500' : 'bg-zinc-100 text-zinc-500'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-base font-bold text-zinc-900 leading-tight">{ts.seller.name}</div>
                        <div className="text-xs font-medium text-zinc-500 flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-md font-bold">{ts.seller.sellerLevel?.name || 'No Tier'}</span>
                          <span>{ts.seller.email || ts.seller.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-zinc-900 leading-tight">RM {ts.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      <div className="text-xs font-medium text-zinc-500 mt-1">{ts.totalOrders} total orders</div>
                    </div>
                  </div>
                ))}
                {(!allSellers || allSellers.length === 0) && (
                  <div className="text-center text-zinc-500 text-sm font-medium py-10">No seller data available for this range.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </AdminLayout>
  );
}
