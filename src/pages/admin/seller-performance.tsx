import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { 
  ArrowLeft, RefreshCcw, Search, ChevronDown,
  TrendingUp, Award, BarChart3, ShoppingBag, Tag, Star, ArrowUpRight, Info, X
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useLanguage } from '../../context/LanguageContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SellerPerformancePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showAllModal, setShowAllModal] = useState(false);

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
      <AdminLayout title={t('seller_perf_title')} hideTitle={true}>
        <div className="flex h-[80vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-b-sky-700"></div>
        </div>
      </AdminLayout>
    );
  }

  const { metrics, chartData, tierPerformance, topSellers, allSellers, levels } = data || {};

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
    <AdminLayout title={t('seller_perf_title')} hideTitle={true}>
      
      {/* Top Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-[26px] font-normal leading-tight tracking-tight text-slate-800">
            {t('seller_perf_title')} <span className="text-xs font-normal text-slate-600">[ Report ]</span>
          </h1>
          <p className="mt-1 text-xs text-slate-600">{t('seller_perf_desc')}</p>
          <button 
            onClick={() => router.push('/admin/seller-setup')}
            className="mt-3 inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-sky-600 hover:bg-sky-50 hover:text-sky-800"
          >
            <ArrowLeft size={14} /> {t('back_to_seller_setup')}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT SIDEBAR */}
        <div className="flex w-full flex-shrink-0 flex-col gap-5 lg:w-[300px]">
          
          {/* Filters */}
          <div className="border border-slate-200 bg-white p-5">
            <h3 className="mb-5 border-b border-slate-200 pb-3 text-base font-medium text-slate-800">{t('filters')}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">{t('date_range')}</label>
                <div className="relative">
                  <select 
                    value={dateRange} onChange={(e) => setDateRange(e.target.value)}
                    className="w-full appearance-none border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-700 transition-colors focus:border-sky-600 focus:outline-none cursor-pointer"
                  >
                    <option value="last_7_days">{t('last_7_days')}</option>
                    <option value="last_30_days">{t('last_30_days')}</option>
                    <option value="all_time">{t('all_time')}</option>
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">{t('seller_level_label')}</label>
                <div className="relative">
                  <select 
                    value={sellerLevel} onChange={(e) => setSellerLevel(e.target.value)}
                    className="w-full appearance-none border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-700 transition-colors focus:border-sky-600 focus:outline-none cursor-pointer"
                  >
                    <option value="all">{t('all_levels')}</option>
                    {levels?.map((l: any) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">{t('seller_status')}</label>
                <div className="relative">
                  <select 
                    value={status} onChange={(e) => setStatus(e.target.value)}
                    className="w-full appearance-none border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-700 transition-colors focus:border-sky-600 focus:outline-none cursor-pointer"
                  >
                    <option value="all">{t('all_status')}</option>
                    <option value="active">{t('active_status')}</option>
                    <option value="inactive">{t('inactive_status')}</option>
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">{t('search_seller_label')}</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder={t('search_seller_placeholder')} 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 transition-colors placeholder:text-slate-400 focus:border-sky-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button 
                onClick={handleApplyFilters}
                className="flex-1 border border-sky-800 bg-sky-700 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-800"
              >
                {t('apply_filters')}
              </button>
              <button 
                onClick={handleResetFilters}
                className="flex flex-1 items-center justify-center gap-2 border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <RefreshCcw size={14} className="text-slate-400" /> {t('reset')}
              </button>
            </div>
          </div>

          {/* Summary Overview */}
          <div className="flex flex-1 flex-col border border-slate-200 bg-white p-5">
            <h3 className="mb-4 border-b border-slate-200 pb-3 text-base font-medium text-slate-800">{t('summary_overview')}</h3>
            <div className="space-y-4 divide-y divide-slate-100">
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-slate-600">{t('total_sellers')}</span>
                <span className="text-sm font-semibold text-slate-900">{metrics?.totalSellers}</span>
              </div>
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm font-medium text-slate-600">{t('active_sellers_count')}</span>
                <span className="text-sm font-semibold text-green-500">{metrics?.activeSellers}</span>
              </div>
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm font-medium text-slate-600">{t('inactive_sellers_count')}</span>
                <span className="text-sm font-semibold text-slate-900">{metrics?.inactiveSellers}</span>
              </div>
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm font-medium text-slate-600">{t('total_sales_30d')}</span>
                <span className="text-sm font-semibold text-slate-900">RM {metrics?.totalSales?.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm font-medium text-slate-600">{t('total_orders_30d')}</span>
                <span className="text-sm font-semibold text-slate-900">{metrics?.totalOrders}</span>
              </div>
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm font-medium text-slate-600">{t('avg_order_value')}</span>
                <span className="text-sm font-semibold text-slate-900">RM {metrics?.averageOrderValue?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT */}
        <div className="flex-1 space-y-6">
          
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Sales Card */}
            <div className="border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-sky-50 text-sky-700">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">{t('total_sales')}</div>
                  <div className="text-lg font-semibold text-slate-900">RM {metrics?.totalSales?.toFixed(2)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="text-green-500 flex items-center gap-0.5"><ArrowUpRight size={14}/> {metrics?.salesTrend}%</span>
                <span>{t('vs_previous_period')}</span>
              </div>
            </div>

            {/* Orders Card */}
            <div className="border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-sky-50 text-sky-700">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">{t('total_orders')}</div>
                  <div className="text-lg font-semibold text-slate-900">{metrics?.totalOrders}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="text-green-500 flex items-center gap-0.5"><ArrowUpRight size={14}/> {metrics?.ordersTrend}%</span>
                <span>{t('vs_previous_period')}</span>
              </div>
            </div>

            {/* AOV Card */}
            <div className="border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-sky-50 text-sky-700">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">{t('avg_order_value')}</div>
                  <div className="text-lg font-semibold text-slate-900">RM {metrics?.averageOrderValue?.toFixed(2)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="text-green-500 flex items-center gap-0.5"><ArrowUpRight size={14}/> {metrics?.aovTrend}%</span>
                <span>{t('vs_previous_period')}</span>
              </div>
            </div>

            {/* Discounts Card */}
            <div className="border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-sky-50 text-sky-700">
                  <Tag size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">{t('total_discounts_given')}</div>
                  <div className="text-lg font-semibold text-slate-900">RM {metrics?.totalDiscounts?.toFixed(2)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="text-green-500 flex items-center gap-0.5"><ArrowUpRight size={14}/> {metrics?.discountsTrend}%</span>
                <span>{t('vs_previous_period')}</span>
              </div>
            </div>

          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Sales Chart */}
            <div className="border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium text-slate-900">{t('sales_performance')}</h3>
                <div className="relative">
                  <select 
                    value={salesChartView}
                    onChange={(e) => setSalesChartView(e.target.value)}
                    className="appearance-none border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-xs text-slate-700 transition-colors focus:border-sky-600 focus:outline-none cursor-pointer"
                  >
                    <option value="Daily">{t('daily')}</option>
                    <option value="Weekly">{t('weekly')}</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0369a1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0369a1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => {
                      const d = new Date(val);
                      const locale = language === 'zh' ? 'zh-CN' : language === 'ms' ? 'ms-MY' : 'en-US';
                      return `${d.toLocaleString(locale, { month: 'short' })} ${d.getDate()}`;
                    }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `RM ${val/1000}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '0px', border: '1px solid #cbd5e1', boxShadow: 'none' }}
                      formatter={(value: any) => [`RM ${Number(value || 0).toFixed(2)}`, t('total_sales')]}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#0369a1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Orders Chart */}
            <div className="border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium text-slate-900">{t('orders_performance')}</h3>
                <div className="relative">
                  <select 
                    value={ordersChartView}
                    onChange={(e) => setOrdersChartView(e.target.value)}
                    className="appearance-none border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-xs text-slate-700 transition-colors focus:border-sky-600 focus:outline-none cursor-pointer"
                  >
                    <option value="Daily">{t('daily')}</option>
                    <option value="Weekly">{t('weekly')}</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ordersData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => {
                      const d = new Date(val);
                      const locale = language === 'zh' ? 'zh-CN' : language === 'ms' ? 'ms-MY' : 'en-US';
                      return `${d.toLocaleString(locale, { month: 'short' })} ${d.getDate()}`;
                    }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '0px', border: '1px solid #cbd5e1', boxShadow: 'none' }}
                      formatter={(value: any) => [Number(value || 0), t('orders_suffix')]}
                    />
                    <Area type="monotone" dataKey="orders" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Bottom Tables Area */}
          <div className="grid grid-cols-1 gap-6">
            
            {/* Performance By Tier */}
            <div className="flex flex-col border border-slate-200 bg-white">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-medium text-slate-900">{t('performance_by_tier')}</h3>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 bg-slate-100">
                        <th className="whitespace-nowrap px-2 py-3 text-left text-xs font-medium text-slate-700">{t('tier_level')}</th>
                        <th className="whitespace-nowrap px-2 py-3 text-right text-xs font-medium text-slate-700">{t('total_sellers')}</th>
                        <th className="whitespace-nowrap px-2 py-3 text-right text-xs font-medium text-slate-700">{t('total_sales')}</th>
                        <th className="whitespace-nowrap px-2 py-3 text-right text-xs font-medium text-slate-700">{t('total_orders')}</th>
                        <th className="whitespace-nowrap px-2 py-3 text-right text-xs font-medium text-slate-700">{t('avg_value')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {tierPerformance?.map((tp: any) => {
                        const levelIconClass = 'text-sky-700';

                        return (
                          <tr key={tp.level.id} className="transition-colors even:bg-slate-50 hover:bg-sky-50">
                            <td className="whitespace-nowrap px-2 py-3">
                              <div className="flex items-center gap-2">
                                <Award size={16} strokeWidth={2.5} className={levelIconClass} />
                                <span className="font-medium text-sm text-slate-900">{tp.level.name}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-2 py-3 text-right">
                              <div className="font-medium text-sm text-slate-900">{tp.sellersCount}</div>
                              <div className="text-[10px] text-slate-500 font-medium">({tp.sellersPercentage.toFixed(1)}%)</div>
                            </td>
                            <td className="whitespace-nowrap px-2 py-3 text-right">
                              <div className="font-medium text-sm text-slate-900">RM {tp.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                              <div className="text-[10px] text-green-500 font-medium flex justify-end gap-0.5"><ArrowUpRight size={12}/> {tp.salesTrend}%</div>
                            </td>
                            <td className="whitespace-nowrap px-2 py-3 text-right">
                              <div className="font-medium text-sm text-slate-900">{tp.totalOrders}</div>
                              <div className="text-[10px] text-green-500 font-medium flex justify-end gap-0.5"><ArrowUpRight size={12}/> {tp.ordersTrend}%</div>
                            </td>
                            <td className="whitespace-nowrap px-2 py-3 text-right">
                              <div className="font-medium text-sm text-slate-900">RM {tp.averageOrderValue.toFixed(2)}</div>
                              <div className="text-[10px] text-green-500 font-medium flex justify-end gap-0.5"><ArrowUpRight size={12}/> {tp.aovTrend}%</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-auto pt-4">
                  <div className="flex items-start gap-2 border border-sky-200 bg-sky-50 p-3">
                    <Info size={14} className="mt-0.5 shrink-0 text-sky-700" />
                    <p className="text-[11px] text-sky-700 font-medium leading-relaxed">{t('perf_calc_info')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performing Sellers */}
            <div className="bg-white border border-slate-200   flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                <Star size={16} className="text-sky-700" />
                <h3 className="font-medium text-slate-900">{t('top_performing_sellers')}</h3>
              </div>
              <div className="p-5 flex-1">
                <div className="space-y-4">
                  {topSellers?.map((ts: any, index: number) => {
                    return (
                      <div key={ts.seller.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-6 w-6 items-center justify-center border text-[10px] font-medium ${index < 3 ? 'border-sky-200 bg-sky-50 text-sky-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 leading-tight">{ts.seller.name}</div>
                            <div className="text-[10px] font-medium text-slate-500">{ts.seller.sellerLevel?.name || t('no_tier')}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-slate-900 leading-tight">RM {ts.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          <div className="text-[10px] font-medium text-slate-500">{ts.totalOrders} {t('orders_suffix')}</div>
                        </div>
                      </div>
                    );
                  })}
                  {topSellers?.length === 0 && (
                    <div className="text-center text-slate-500 text-sm font-medium py-6">{t('no_data_available')}</div>
                  )}
                </div>
                {topSellers?.length > 0 && (
                  <div className="mt-6 text-center">
                    <button onClick={() => setShowAllModal(true)} className="text-xs font-medium text-sky-700 transition-colors hover:text-sky-900">{t('view_all_top')}</button>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-6 flex items-start gap-2 border-t border-slate-200">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-sky-200 bg-sky-50 text-sky-700">
          <Info size={12} />
        </div>
        <p className="text-xs font-medium text-slate-500">{t('seller_eval_info')}</p>
      </div>

      {/* View All Modal */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl">
            
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <Star size={20} className="text-sky-700" />
                <div>
                  <h3 className="text-xl font-medium text-slate-900">
                    {t('all_top_sellers_title')}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">{t('full_ranked_list_desc')}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAllModal(false)}
                className="flex h-9 w-9 items-center justify-center border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {allSellers?.map((ts: any, index: number) => (
                  <div key={ts.seller.id} className="flex items-center justify-between border-b border-slate-200 p-4 transition-colors hover:bg-sky-50 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center border text-xs font-medium ${index < 3 ? 'border-sky-200 bg-sky-50 text-sky-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="text-base font-medium text-slate-900 leading-tight">{ts.seller.name}</div>
                        <div className="text-xs font-medium text-slate-500 flex items-center gap-2 mt-1">
                          <span className="border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700">{ts.seller.sellerLevel?.name || t('no_tier')}</span>
                          <span>{ts.seller.email || ts.seller.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-medium text-slate-900 leading-tight">RM {ts.totalSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      <div className="text-xs font-medium text-slate-500 mt-1">{ts.totalOrders} {t('total_orders_label')}</div>
                    </div>
                  </div>
                ))}
                {(!allSellers || allSellers.length === 0) && (
                  <div className="text-center text-slate-500 text-sm font-medium py-10">{t('no_seller_data_range')}</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </AdminLayout>
  );
}
