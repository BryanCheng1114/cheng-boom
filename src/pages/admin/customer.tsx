import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical, 
  Users,
  UserCheck,
  Shield,
  Phone,
  Calendar,
  BadgeDollarSign,
  X,
  Mail,
  UserRound
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../utils/cn';

const CustomerPage = () => {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Management States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: '', direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/customers');
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Filtering Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (c.phone && c.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
                             (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                             c.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'All' || c.role === roleFilter;

      let matchesMonth = true;
      if (monthFilter && c.createdAt) {
        const joinMonth = new Date(c.createdAt).toISOString().slice(0, 7);
        matchesMonth = joinMonth === monthFilter;
      }

      return matchesSearch && matchesRole && matchesMonth;
    });
  }, [customers, searchTerm, roleFilter, monthFilter]);

  // Sorting Logic
  const sortedCustomers = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredCustomers;

    return [...filteredCustomers].sort((a: any, b: any) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (sortConfig.key === 'totalSpent') {
        aVal = a.totalSpent || 0;
        bVal = b.totalSpent || 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCustomers, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedCustomers.slice(start, start + itemsPerPage);
  }, [sortedCustomers, currentPage]);

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
    if (sortConfig.key !== column) return <ArrowUpDown size={12} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronRight size={12} className="rotate-[-90deg] text-sky-700" /> : <ChevronRight size={12} className="rotate-[90deg] text-sky-700" />;
  };

  // KPI Calculations
  const sellerCount = customers.filter(c => c.role === 'Seller').length;
  const memberCount = customers.filter(c => c.role === 'Member').length;
  const guestCount = customers.filter(c => c.role === 'Guest').length;
  const totalCount = customers.length;

  return (
    <AdminLayout title={t('customers')} hideTitle>
      <div className="space-y-5 text-slate-700">
        <header className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h1 className="text-[26px] font-normal leading-tight tracking-tight text-slate-800">{t('customers')}</h1>
            <span className="text-xs font-normal text-slate-700">[ Access ]</span>
          </div>
          <p className="text-xs text-slate-600">Customer Information /</p>
        </header>
        
        {/* Customer summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div 
            onClick={() => { setRoleFilter('All'); setCurrentPage(1); }}
            className={`bg-white border ${roleFilter === 'All' ? 'border-sky-700 shadow-sm' : 'border-slate-200'} p-5 flex min-h-[142px] flex-col justify-between transition-all duration-200 group hover:shadow-sm cursor-pointer hover:border-sky-500`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-sky-100 bg-sky-50 text-sky-800">
                  <Users size={18} strokeWidth={1.9} />
                </div>
                <span className="text-sm font-medium tracking-wide text-slate-700">{t('total_customers')}</span>
              </div>
              <MoreVertical size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-2xl font-semibold text-slate-900 tracking-tight leading-none">
                {totalCount}
              </h3>
              <p className="text-xs font-medium text-slate-500 pb-0.5 flex items-center gap-1">
                +12% <span>{t('this_month_label')}</span>
              </p>
            </div>
          </div>

          <div 
            onClick={() => { setRoleFilter('Seller'); setCurrentPage(1); }}
            className={`bg-white border ${roleFilter === 'Seller' ? 'border-sky-700 shadow-sm' : 'border-slate-200'} p-5 flex min-h-[142px] flex-col justify-between transition-all duration-200 group hover:shadow-sm cursor-pointer hover:border-sky-500`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-sky-100 bg-sky-50 text-sky-800">
                  <Shield size={18} strokeWidth={1.9} />
                </div>
                <span className="text-sm font-medium tracking-wide text-slate-700">{t('seller_account')}</span>
              </div>
              <MoreVertical size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-2xl font-semibold text-slate-900 tracking-tight leading-none">
                {sellerCount}
              </h3>
              <p className="text-xs font-medium text-slate-500 pb-0.5 flex items-center gap-1">
                +3 <span>{t('new_label')}</span>
              </p>
            </div>
          </div>

          <div 
            onClick={() => { setRoleFilter('Member'); setCurrentPage(1); }}
            className={`bg-white border ${roleFilter === 'Member' ? 'border-sky-700 shadow-sm' : 'border-slate-200'} p-5 flex min-h-[142px] flex-col justify-between transition-all duration-200 group hover:shadow-sm cursor-pointer hover:border-sky-500`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-sky-100 bg-sky-50 text-sky-800">
                  <UserCheck size={18} strokeWidth={1.9} />
                </div>
                <span className="text-sm font-medium tracking-wide text-slate-700">{t('members_account')}</span>
              </div>
              <MoreVertical size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-2xl font-semibold text-slate-900 tracking-tight leading-none">
                {memberCount}
              </h3>
              <p className="text-xs font-medium text-slate-500 pb-0.5 flex items-center gap-1">
                +8% <span>{t('this_month_label')}</span>
              </p>
            </div>
          </div>

          <div 
            onClick={() => { setRoleFilter('Guest'); setCurrentPage(1); }}
            className={`bg-white border ${roleFilter === 'Guest' ? 'border-sky-700 shadow-sm' : 'border-slate-200'} p-5 flex min-h-[142px] flex-col justify-between transition-all duration-200 group hover:shadow-sm cursor-pointer hover:border-sky-500`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-slate-200 bg-slate-100 text-slate-600">
                  <Users size={18} strokeWidth={1.9} />
                </div>
                <span className="text-sm font-medium tracking-wide text-slate-700">{t('guests_account')}</span>
              </div>
              <MoreVertical size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-2xl font-semibold text-slate-900 tracking-tight leading-none">
                {guestCount}
              </h3>
              <p className="text-xs font-medium text-slate-500 pb-0.5 flex items-center gap-1">
                +24 <span>{t('active_label')}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Unified Table Section */}
        <div className="mt-2">
          <h3 className="mb-3 text-base font-semibold tracking-tight text-slate-800">{t('customer_list')}</h3>
          
          <div className="flex flex-col overflow-hidden border border-slate-200 bg-white shadow-sm">
            
            {/* Top Toolbar */}
            <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 p-5 pb-4 lg:flex-row lg:items-center">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'All', label: t('all_filter'), count: totalCount },
                  { id: 'Seller', label: t('seller'), count: sellerCount },
                  { id: 'Member', label: t('member'), count: memberCount },
                  { id: 'Guest', label: t('guest'), count: guestCount },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => { setRoleFilter(filter.id); setCurrentPage(1); }}
                    className={`border px-3 py-2 text-xs font-medium transition-colors ${
                      roleFilter === filter.id
                        ? 'border-sky-800 bg-sky-800 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    {filter.label} <span className="opacity-70 font-medium ml-1">({filter.count})</span>
                  </button>
                ))}
              </div>

              {/* Right side: Search & Date Filter */}
              <div className="flex w-full flex-1 items-center gap-3 lg:w-auto lg:flex-none">
                <div className="relative min-w-0 flex-1 lg:w-64 lg:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                  placeholder={t('search_customer_placeholder')}
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full border border-slate-300 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-sky-700 focus:ring-1 focus:ring-sky-700"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center border transition-colors",
                      monthFilter || showCalendar
                        ? "border-sky-800 bg-sky-800 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
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
                            <h4 className="text-sm font-semibold text-slate-800">{t('filter_by_join_month')}</h4>
                            <button onClick={() => setShowCalendar(false)} className="text-slate-400 hover:text-slate-700">
                              <X size={16} />
                            </button>
                          </div>
                          
                          <input 
                            type="month"
                            value={monthFilter}
                            onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
                            className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-sky-700 focus:ring-1 focus:ring-sky-700 cursor-pointer"
                          />

                          <div className="mt-4 flex gap-2">
                            <button 
                              onClick={() => { setMonthFilter(''); setCurrentPage(1); setShowCalendar(false); }}
                              className="flex-1 border border-slate-300 bg-white py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              {t('clear')}
                            </button>
                            <button 
                              onClick={() => setShowCalendar(false)}
                              className="flex-1 border border-sky-800 bg-sky-800 py-2 text-xs font-medium text-white hover:bg-sky-900 transition-colors"
                            >
                              {t('apply')}
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100">
                    <th 
                      onClick={() => handleSort('id')}
                      className="cursor-pointer px-5 py-3 text-xs font-semibold text-slate-700 group hover:bg-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">{t('id_label')} <SortIndicator column="id" /></div>
                    </th>
                    <th 
                      onClick={() => handleSort('name')}
                      className="cursor-pointer px-5 py-3 text-xs font-semibold text-slate-700 group hover:bg-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">{t('customer_name')} <SortIndicator column="name" /></div>
                    </th>
                    <th 
                      onClick={() => handleSort('email')}
                      className="cursor-pointer px-5 py-3 text-xs font-semibold text-slate-700 group hover:bg-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">{t('email_address_label')} <SortIndicator column="email" /></div>
                    </th>
                    <th 
                      onClick={() => handleSort('phone')}
                      className="cursor-pointer px-5 py-3 text-xs font-semibold text-slate-700 group hover:bg-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">{t('phone_number')} <SortIndicator column="phone" /></div>
                    </th>
                    <th 
                      onClick={() => handleSort('role')}
                      className="cursor-pointer px-5 py-3 text-xs font-semibold text-slate-700 group hover:bg-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">{t('role')} <SortIndicator column="role" /></div>
                    </th>
                    <th 
                      onClick={() => handleSort('totalSpent')}
                      className="cursor-pointer px-5 py-3 text-xs font-semibold text-slate-700 group hover:bg-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">{t('total_spent')} <SortIndicator column="totalSpent" /></div>
                    </th>
                    <th 
                      onClick={() => handleSort('createdAt')}
                      className="cursor-pointer px-5 py-3 text-xs font-semibold text-slate-700 group hover:bg-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">{t('join_date')} <SortIndicator column="createdAt" /></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-6 h-6 border-2 border-zinc-200 border-t-blue-500 rounded-full animate-spin"></div>
                          <p className="text-sm font-medium text-zinc-500">{t('loading_customers')}</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-20 text-center">
                        <p className="text-sm font-medium text-zinc-500">{t('no_customers_found')}</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((c) => (
                      <tr 
                        key={c.id}
                        onClick={() => router.push(`/admin/customer/${c.id}`)}
                        className="group cursor-pointer transition-colors odd:bg-white even:bg-slate-50 hover:bg-sky-50"
                      >
                        <td className="py-4 px-6">
                          <span className="border border-slate-200 bg-slate-100 px-2 py-1 font-mono text-xs font-medium text-slate-700">
                            #{c.id.substring(c.id.length - 6).toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-semibold text-slate-900">{c.name || 'Guest'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-zinc-400" />
                            <span className="text-[13px] font-medium text-zinc-600">{c.email || '-'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-zinc-400" />
                            <span className="text-[13px] font-medium text-zinc-600">{c.phone || '-'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className={cn(
                            "inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-medium transition-colors",
                            c.role === 'Seller' ? "border-sky-200 bg-sky-50 text-sky-800" :
                            c.role === 'Member' ? "border-blue-200 bg-blue-50 text-blue-800" :
                            c.role === 'Guest' ? "border-slate-200 bg-slate-100 text-slate-700" :
                            "border-slate-200 bg-slate-100 text-slate-700"
                          )}>
                            {c.role === 'Seller' ? <Shield size={12} strokeWidth={2.5} /> :
                             c.role === 'Member' ? <UserCheck size={12} strokeWidth={2.5} /> :
                             c.role === 'Guest' ? <UserRound size={12} strokeWidth={2.5} /> :
                             <Users size={12} strokeWidth={2.5} />}
                            {c.role === 'Seller' ? t('seller') :
                             c.role === 'Member' ? t('member') :
                             c.role === 'Guest' ? t('guest') : c.role}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            <BadgeDollarSign size={14} className="text-zinc-400" />
                            <span className="text-[13px] font-bold text-zinc-800">
                              RM {(c.totalSpent || 0).toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-zinc-400" />
                            <span className="text-[13px] font-medium text-zinc-600">
                              {new Date(c.createdAt).toLocaleDateString(
                                language === 'zh' ? 'zh-CN' : language === 'ms' ? 'ms-MY' : 'en-US',
                                { year: 'numeric', month: 'short', day: 'numeric' }
                              )}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row">
              <p className="text-[13px] font-medium text-zinc-500">
                {t('showing')} <span className="font-bold text-zinc-800">{sortedCustomers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> {t('to')} <span className="font-bold text-zinc-800">{Math.min(currentPage * itemsPerPage, sortedCustomers.length)}</span> {t('of')} <span className="font-bold text-zinc-800">{sortedCustomers.length}</span> {t('records')}
              </p>
              
              <div className="flex items-center gap-1.5">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="border border-slate-300 bg-white p-2 text-slate-500 transition-colors hover:border-sky-700 hover:text-sky-800 disabled:opacity-40"
                  title="First Page"
                >
                  <ChevronsLeft size={16} strokeWidth={2.5} />
                </button>
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="border border-slate-300 bg-white p-2 text-slate-500 transition-colors hover:border-sky-700 hover:text-sky-800 disabled:opacity-40"
                  title="Previous Page"
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </button>

                <div className="flex gap-1 px-2">
                  {[...Array(totalPages)].map((_, i) => {
                    // Show max 5 page buttons
                    if (
                      totalPages > 5 && 
                      i !== 0 && 
                      i !== totalPages - 1 && 
                      Math.abs(currentPage - 1 - i) > 1
                    ) {
                      if (i === 1 && currentPage > 3) return <span key={i} className="text-zinc-400 px-1">...</span>;
                      if (i === totalPages - 2 && currentPage < totalPages - 2) return <span key={i} className="text-zinc-400 px-1">...</span>;
                      return null;
                    }
                    return (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`flex h-8 min-w-[32px] items-center justify-center border px-2 text-xs font-medium transition-colors ${
                          currentPage === i + 1
                            ? 'border-sky-800 bg-sky-800 text-white'
                            : 'border-slate-300 bg-white text-slate-600 hover:border-sky-700 hover:text-sky-800'
                        }`}
                      >
                        {i + 1}
                      </button>
                    )
                  })}
                </div>

                <button 
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="border border-slate-300 bg-white p-2 text-slate-500 transition-colors hover:border-sky-700 hover:text-sky-800 disabled:opacity-40"
                  title="Next Page"
                >
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
                <button 
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(totalPages)}
                  className="border border-slate-300 bg-white p-2 text-slate-500 transition-colors hover:border-sky-700 hover:text-sky-800 disabled:opacity-40"
                  title="Last Page"
                >
                  <ChevronsRight size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CustomerPage;
