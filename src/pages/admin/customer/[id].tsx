import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  User,
  ShoppingBag,
  ArrowRight,
  X,
  Mail,
  Copy,
  Edit2,
  Wallet,
  Box,
  Eye,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Package
} from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { useLanguage } from '../../../context/LanguageContext';
import { cn } from '../../../utils/cn';

const CustomerDetailsPage = () => {
  const router = useRouter();
  const { id, from } = router.query;
  const backUrl = from === 'seller' ? '/admin/seller-setup' : '/admin/customer';
  const backTitle = from === 'seller' ? 'Back to Sellers' : 'Back to Customers';
  const { t, language: locale } = useLanguage();
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  
  // Table pagination & filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [monthFilter, setMonthFilter] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const itemsPerPage = 15;

  useEffect(() => {
    if (!id) return;
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`/api/customers/${id}`);
        if (res.ok) {
          const data = await res.json();
          setCustomer(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  const handlePromoteToSeller = () => {
    setIsPromoteModalOpen(true);
  };

  const executePromote = async () => {
    setIsPromoting(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Seller' }),
      });
      if (res.ok) {
        setCustomer({ ...customer, role: 'Seller' });
        setIsPromoteModalOpen(false);
      } else {
        alert('Failed to promote customer.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to promote customer.');
    } finally {
      setIsPromoting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      // Optional: Add a subtle toast or visual feedback here
    }
  };

  const translatePayment = (payment: string) => {
    if (!payment) return '-';
    const p = payment.toLowerCase();
    if (locale === 'zh') {
      if (p.includes('cod') || p.includes('cash on delivery') || p.includes('cash')) return '货到付款';
      if (p.includes('duitnow') || p.includes('bank') || p.includes('transfer')) return 'DuitNow 及 银行转账';
    }
    return payment;
  };

  const translateOrderMode = (mode: string) => {
    if (!mode) return '-';
    const m = mode.toLowerCase();
    if (locale === 'zh') {
      if (m.includes('self') || m.includes('collect')) return '自取';
      if (m.includes('delivery')) return '配送';
    }
    return mode;
  };

  const translateStatus = (status: string) => {
    if (!status) return '-';
    if (locale === 'zh') {
      if (status === 'Pending') return '待处理';
      if (status === 'Completed') return '已完成';
      if (status === 'Cancelled') return '已取消';
      if (status === 'Processing') return '处理中';
    }
    return status;
  };

  if (isLoading) {
    return (
      <AdminLayout title="Customer Details">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">{t('retrieving_profile') || 'Retrieving Profile...'}</p>
        </div>
      </AdminLayout>
    );
  }

  if (!customer) {
    return (
      <AdminLayout title="Not Found">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-zinc-500">{t('customer_not_found') || 'Customer Not Found'}</h2>
          <button 
            onClick={() => router.push(backUrl)}
            className="mt-6 text-yellow-500 font-bold flex items-center gap-2 mx-auto hover:gap-3 transition-all"
          >
            <ChevronLeft size={20} /> {backTitle}
          </button>
        </div>
      </AdminLayout>
    );
  }
  
  // Stats
  const totalOrders = customer.orders?.length || 0;
  // Calculate total spent based on non-cancelled orders if preferred, or all orders. Using all as requested.
  const totalSpent = customer.orders?.reduce((sum: number, o: any) => sum + (o.status !== 'Cancelled' ? o.totalAmount : 0), 0) || 0;
  const averageOrderValue = totalOrders > 0 ? (totalSpent / totalOrders) : 0;
  const lastOrderDate = customer.orders && customer.orders.length > 0
    ? new Date(Math.max(...customer.orders.map((o: any) => new Date(o.createdAt).getTime())))
    : null;

  // Filters & Pagination for Order History
  const filteredOrders = (customer.orders || []).filter((order: any) => {
    let matchesStatus = true;
    if (statusFilter !== 'All Status') {
      matchesStatus = order.status === statusFilter;
    }
    
    let matchesMonth = true;
    if (monthFilter && order.createdAt) {
      const orderMonth = new Date(order.createdAt).toISOString().slice(0, 7);
      matchesMonth = orderMonth === monthFilter;
    }
    
    return matchesStatus && matchesMonth;
  }).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const currentOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const orderCounts = {
    'All Status': (customer.orders || []).length,
    'Pending': (customer.orders || []).filter((o: any) => o.status === 'Pending').length,
    'Processing': (customer.orders || []).filter((o: any) => o.status === 'Processing').length,
    'Completed': (customer.orders || []).filter((o: any) => o.status === 'Completed').length,
    'Cancelled': (customer.orders || []).filter((o: any) => o.status === 'Cancelled').length,
  };

  return (
    <AdminLayout title="Customer Details" hideTitle={true}>
      <div className="w-full space-y-6">
        
        {/* Header Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(backUrl)} className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors mr-1" title={backTitle}>
               <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-zinc-900">{customer.name}</h1>
            <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold border border-green-100">
              Active Customer
            </span>
          </div>
          <div className="flex items-center gap-3">
            {customer.role !== 'Seller' && (
              <button 
                onClick={handlePromoteToSeller}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 text-white font-bold text-sm hover:bg-yellow-600 transition-colors shadow-sm"
              >
                <Shield size={16} />
                Promote to Seller
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] gap-6">
          
          {/* ---- Left Sidebar: Profile Info ---- */}
          <div className="space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-400 font-black italic text-2xl border-2 border-orange-100 shrink-0">
                  {customer.name.charAt(0).toLowerCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 mb-0.5 leading-tight">{customer.name}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold mb-2">
                    ID: {customer.id} <Copy size={12} className="cursor-pointer hover:text-zinc-800" onClick={() => copyToClipboard(customer.id)} />
                  </div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-yellow-100 text-yellow-600">
                    {customer.role}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mb-6">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-3">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-sm">
                      <Phone size={16} className="text-zinc-400" />
                      <div>
                        <div className="text-xs text-zinc-500 font-semibold mb-0.5">Phone</div>
                        <div className="font-semibold text-zinc-900">{customer.phone || '-'}</div>
                      </div>
                    </div>
                    {customer.phone && (
                      <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 cursor-pointer hover:text-green-500 hover:bg-green-50 transition-colors" onClick={() => window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`, '_blank')}>
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail size={16} className="text-zinc-400" />
                      <div>
                        <div className="text-xs text-zinc-500 font-semibold mb-0.5">Email</div>
                        <div className="font-semibold text-zinc-900 break-all">{customer.email || '-'}</div>
                      </div>
                    </div>
                    {customer.email && (
                      <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 cursor-pointer hover:text-blue-500 hover:bg-blue-50 transition-colors" onClick={() => window.open(`mailto:${customer.email}`)}>
                        <Mail size={16} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal & Account Details */}
              <div className="mb-6 pt-6 border-t border-zinc-100">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-4">Personal & Account Details</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-zinc-500 font-semibold">
                      <User size={14} /> Role
                    </div>
                    <div className="font-semibold text-zinc-900">{customer.role}</div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-zinc-500 font-semibold">
                      <User size={14} /> Seller Level
                    </div>
                    <div className="font-semibold text-zinc-900">{customer.role === 'Seller' ? (customer.sellerLevel?.name || 'Level 1') : 'Not a Seller'}</div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-zinc-500 font-semibold">
                      <Calendar size={14} /> Registered Since
                    </div>
                    <div className="font-semibold text-zinc-900">
                      {new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-start gap-3 text-zinc-500 font-semibold pt-0.5">
                      <Wallet size={14} /> 
                      <div className="flex flex-col">
                        <span>Preferred Payment</span>
                        <span className="text-zinc-900 mt-1">{translatePayment(customer.preferredPayment) || '-'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-zinc-500 font-semibold">
                      <Box size={14} /> {translateOrderMode(customer.orderMode) || '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="mb-6 pt-6 border-t border-zinc-100">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-3">Address</h4>
                <div className="flex items-start justify-between group">
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin size={16} className="text-zinc-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-zinc-500 font-semibold mb-1">Address</div>
                      <div className="font-semibold text-zinc-900 leading-relaxed text-[13px]">{customer.address || '-'}</div>
                    </div>
                  </div>
                  {customer.address && (
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 cursor-pointer hover:text-zinc-700 hover:bg-zinc-100 transition-colors" onClick={() => copyToClipboard(customer.address)}>
                      <Copy size={14} />
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Details */}
              <div className="mb-6 pt-6 border-t border-zinc-100">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-3">Delivery Details</h4>
                <div className="flex items-start justify-between group">
                  <div className="flex items-start gap-3 text-sm">
                    <Box size={16} className="text-zinc-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-zinc-500 font-semibold mb-1">Default Method</div>
                      <div className="font-semibold text-zinc-900 leading-relaxed text-[13px]">{translateOrderMode(customer.orderMode) || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="pt-6 border-t border-zinc-100">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-3">Notes</h4>
                <div className="flex items-start justify-between group">
                  <div className="flex items-start gap-3 text-sm">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text text-zinc-400 mt-0.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><line x1="10" x2="8" y1="9" y2="9"></line></svg>
                    <div>
                      <div className="font-semibold text-zinc-500 leading-relaxed text-[13px]">{customer.notes || 'No notes added yet.'}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ---- Right Main Area: KPIs & Order History ---- */}
          <div className="space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <Box size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Orders</div>
                  <div className="text-lg font-bold text-zinc-900">{totalOrders}</div>
                </div>
              </div>
              
              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-green-50 text-green-500 flex items-center justify-center shrink-0">
                  <Wallet size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Spent</div>
                  <div className="text-lg font-bold text-zinc-900">RM {totalSpent.toFixed(2)}</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                  <Package size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Average Order Value</div>
                  <div className="text-lg font-bold text-zinc-900">RM {averageOrderValue.toFixed(2)}</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-zinc-100 p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                  <Calendar size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Last Order</div>
                  <div className="text-sm font-bold text-zinc-900">
                    {lastOrderDate ? lastOrderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Order History Table Section */}
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
              
              {/* Table Header area */}
              <div className="p-6 border-b border-zinc-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <h3 className="text-[15px] font-black italic uppercase tracking-wider text-zinc-900">Order History</h3>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {['All Status', 'Pending', 'Processing', 'Completed', 'Cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                          statusFilter === status
                            ? 'bg-zinc-900 text-white shadow-sm'
                            : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                        }`}
                      >
                        {status === 'All Status' ? 'All' : status}
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] leading-none flex items-center justify-center ${statusFilter === status ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                          {orderCounts[status as keyof typeof orderCounts]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative self-start xl:self-auto">
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0",
                      monthFilter || showCalendar
                        ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/20" 
                        : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
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
                              className="flex-1 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold shadow-md shadow-zinc-900/20 hover:brightness-110 transition-all"
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

              {/* Table Body */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Order ID</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Item Count</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Order Mode</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">Total</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.length > 0 ? (
                      currentOrders.map((order: any, idx: number) => (
                        <tr 
                          key={order.id} 
                          className="border-b border-zinc-50 hover:bg-zinc-50/80 transition-colors group cursor-pointer"
                          onClick={() => router.push(`/admin/orders/${order.id}?viewOnly=true&customerId=${customer.id}`)}
                        >
                          <td className="px-6 py-4">
                            <div className="font-bold text-zinc-900 text-sm">{order.id}</div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-zinc-700">
                            {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-zinc-700">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            <div className="text-[11px] text-zinc-400 font-medium mt-0.5">{new Date(order.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-zinc-700">
                              {translateOrderMode(order.deliveryMode)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                              order.status === 'Completed' ? 'bg-green-100 text-green-600' : 
                              order.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 
                              order.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {translateStatus(order.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-zinc-900">RM {order.totalAmount.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm">
                                <Eye size={14} />
                              </div>
                              <ArrowRight size={16} className="text-zinc-300 group-hover:text-zinc-600 transition-colors ml-1" />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 text-sm font-medium">
                          {t('no_orders_yet') || 'No orders found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-zinc-100 flex items-center justify-between text-sm">
                  <div className="text-zinc-500 font-medium">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button 
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${currentPage === i + 1 ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' : 'text-zinc-600 hover:bg-zinc-50'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ---- Promote to Seller Modal ---- */}
      <AnimatePresence>
        {isPromoteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white border border-zinc-200 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden relative"
            >
              <div className="p-6">
                <h3 className="text-lg font-bold text-zinc-900 mb-2">
                  {t('confirmation_dialog') || 'Confirmation'}
                </h3>
                
                <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                  {t('promote_confirm_1') || 'Are you sure you want to promote '}<span className="font-semibold text-zinc-900">{customer.name}</span>{t('promote_confirm_2') || ' to a Seller?'}
                </p>
                
                <div className="flex items-center justify-end gap-3 w-full">
                  <button
                    onClick={() => setIsPromoteModalOpen(false)}
                    disabled={isPromoting}
                    className="px-4 py-2 rounded-lg font-semibold text-sm bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {t('cancel') || 'Cancel'}
                  </button>
                  <button
                    onClick={executePromote}
                    disabled={isPromoting}
                    className="px-4 py-2 rounded-lg font-semibold text-sm bg-yellow-500 text-zinc-900 hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isPromoting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-zinc-900/20 border-t-zinc-900 rounded-full animate-spin" />
                        {t('processing_dot') || 'Processing...'}
                      </>
                    ) : (
                      t('confirm') || 'Confirm'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default CustomerDetailsPage;
