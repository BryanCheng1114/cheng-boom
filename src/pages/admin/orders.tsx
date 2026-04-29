import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Activity,
  ShoppingBag
} from 'lucide-react';
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

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const customerName = o.customer?.name || '';
      const orderId = o.id || '';
      const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            orderId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

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
    if (sortConfig.key !== column) return <ArrowUpDown size={12} className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronRight size={12} className="rotate-[-90deg] text-yellow-500" /> : <ChevronRight size={12} className="rotate-[90deg] text-yellow-500" />;
  };

  return (
    <AdminLayout title={t('orders')}>
      <div className="space-y-8">
        
        {/* Header Stats - Consistently Aligned with Customer Page */}
        <div className="flex flex-col xl:flex-row gap-6 items-start justify-between">
          <div className="flex flex-wrap gap-10">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('orders')}</p>
              <h4 className="text-4xl font-black italic dark:text-white text-zinc-900 leading-none">{orders.length}</h4>
            </div>
            <div className="pl-10 border-l border-zinc-500/10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('incoming')}</p>
              <h4 className="text-4xl font-black italic text-orange-500 leading-none">
                {orders.filter(o => o.status === 'Pending').length}
              </h4>
            </div>
            <div className="pl-10 border-l border-zinc-500/10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('active_action')}</p>
              <h4 className="text-4xl font-black italic text-blue-500 leading-none">
                {orders.filter(o => ['In Process', 'Delivering'].includes(o.status)).length}
              </h4>
            </div>
            <div className="pl-10 border-l border-zinc-500/10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('fulfilled')}</p>
              <h4 className="text-4xl font-black italic text-green-500 leading-none">
                {orders.filter(o => o.status === 'Completed').length}
              </h4>
            </div>
            <div className="pl-10 border-l border-zinc-500/10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('cancelled')}</p>
              <h4 className="text-4xl font-black italic text-red-500 leading-none">
                {orders.filter(o => o.status === 'Cancelled').length}
              </h4>
            </div>
          </div>
        </div>

        {/* Toolbar - Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 p-5 bg-zinc-500/5 rounded-[32px] border border-zinc-500/10 backdrop-blur-sm shadow-inner">
          <div className="flex-1 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-14 pr-6 py-4 bg-zinc-500/5 border border-zinc-500/10 rounded-2xl outline-none focus:border-yellow-500/50 transition-all dark:text-white font-bold text-sm shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 px-6 py-4 bg-zinc-500/5 border border-zinc-500/10 rounded-2xl relative shadow-sm">
            <Filter size={18} className="text-zinc-500" />
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent outline-none dark:text-white text-zinc-900 font-bold text-sm pr-10 appearance-none cursor-pointer"
            >
              <option value="All" className="dark:bg-zinc-900 bg-white">{t('orders')}</option>
              <option value="Pending" className="dark:bg-zinc-900 bg-white">{t('incoming')}</option>
              <option value="In Process" className="dark:bg-zinc-900 bg-white">{t('processing')}</option>
              <option value="Delivering" className="dark:bg-zinc-900 bg-white">{t('out_for_delivery')}</option>
              <option value="Completed" className="dark:bg-zinc-900 bg-white">{t('fulfilled')}</option>
              <option value="Cancelled" className="dark:bg-zinc-900 bg-white">{t('cancelled')}</option>
            </select>
            <div className="absolute right-5 pointer-events-none text-zinc-500">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-[48px] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b dark:border-white/5 border-zinc-100 bg-zinc-500/5">
                  <th onClick={() => handleSort('id')} className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-yellow-500 transition-colors">
                    <div className="flex items-center gap-2">{t('order_id')} <SortIndicator column="id" /></div>
                  </th>
                  <th className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('customers')}</th>
                  <th onClick={() => handleSort('totalAmount')} className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-yellow-500 transition-colors">
                    <div className="flex items-center gap-2">{t('total')} <SortIndicator column="totalAmount" /></div>
                  </th>
                  <th onClick={() => handleSort('status')} className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-yellow-500 transition-colors">
                    <div className="flex items-center gap-2">{t('status')} <SortIndicator column="status" /></div>
                  </th>
                  <th onClick={() => handleSort('createdAt')} className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-yellow-500 transition-colors text-right">
                    <div className="flex items-center justify-end gap-2">{t('date')} <SortIndicator column="createdAt" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-500/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-32 text-center text-zinc-500 font-black uppercase tracking-widest text-xs animate-pulse">Scanning Order Records...</td>
                  </tr>
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-32 text-center text-zinc-500 font-black uppercase tracking-widest text-xs">No order records found.</td>
                  </tr>
                ) : paginatedOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    className="group hover:bg-zinc-500/5 transition-all duration-300 cursor-pointer"
                  >
                    <td className="p-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-500/5 flex items-center justify-center text-zinc-500 group-hover:scale-110 group-hover:text-yellow-500 transition-all duration-300">
                          <Package size={22} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black dark:text-white text-zinc-900 font-mono">#{order.id.slice(-8).toUpperCase()}</span>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">{t('click_to_manage')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-bold dark:text-white text-zinc-900">{order.customer?.name}</span>
                        <span className="text-[10px] text-zinc-500 font-medium">{order.customer?.phone}</span>
                      </div>
                    </td>
                    <td className="p-8">
                      <span className="text-lg font-black text-yellow-500 italic">RM {order.totalAmount.toFixed(2)}</span>
                    </td>
                    <td className="p-8">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300",
                        order.status === 'Completed' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                        order.status === 'Pending' ? "bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse" :
                        order.status === 'Delivering' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                        order.status === 'Cancelled' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                        "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                      )}>
                        {order.status === 'Completed' ? <CheckCircle2 size={12} /> : 
                         order.status === 'Pending' ? <Clock size={12} /> : 
                         order.status === 'Delivering' ? <Truck size={12} /> : 
                         order.status === 'Cancelled' ? <AlertCircle size={12} /> : <Activity size={12} />}
                        {t(order.status.toLowerCase().replace(/ /g, '_')) || order.status}
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-xs font-black text-zinc-400">
                          <Calendar size={14} />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-medium mt-1">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer - Standardized Summary */}
          <div className="p-8 border-t dark:border-white/5 border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-500/5">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              {t('showing')} {paginatedOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} {t('to')} {Math.min(currentPage * itemsPerPage, sortedOrders.length)} {t('of')} {orders.length} {t('records')}
            </p>
            
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-3 rounded-2xl bg-zinc-500/10 text-zinc-500 hover:text-yellow-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-12 h-12 rounded-2xl text-[10px] font-black transition-all ${
                      currentPage === i + 1 
                        ? 'bg-yellow-500 text-zinc-900 shadow-lg shadow-yellow-500/20' 
                        : 'bg-zinc-500/5 text-zinc-500 hover:bg-zinc-500/10'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-3 rounded-2xl bg-zinc-500/10 text-zinc-500 hover:text-yellow-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrdersPage;
