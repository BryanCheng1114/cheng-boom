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
  Mail
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../utils/cn';

const CustomerPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
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
    if (sortConfig.key !== column) return <ArrowUpDown size={12} className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronRight size={12} className="rotate-[-90deg] text-yellow-500" /> : <ChevronRight size={12} className="rotate-[90deg] text-yellow-500" />;
  };

  // KPI Calculations
  const sellerCount = customers.filter(c => c.role === 'Seller').length;
  const memberCount = customers.filter(c => c.role === 'Member').length;
  const guestCount = customers.filter(c => c.role === 'Guest').length;
  const totalCount = customers.length;

  return (
    <AdminLayout title={t('customers')}>
      <div className="space-y-6">
        
        {/* KPI Grid (Matching Product Page Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            onClick={() => { setRoleFilter('All'); setCurrentPage(1); }}
            className={`bg-white border ${roleFilter === 'All' ? 'border-blue-500/50 shadow-md' : 'border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'} rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 group hover:shadow-lg cursor-pointer hover:border-blue-500/30`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-blue-500">
                  <Users size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[14px] font-bold text-zinc-800 tracking-wide">Total Customer</span>
              </div>
              <MoreVertical size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-3xl font-bold text-zinc-800 tracking-wide leading-none">
                {totalCount}
              </h3>
              <p className="text-[12px] font-medium text-emerald-500 pb-0.5 flex items-center gap-1">
                +12% <span className="text-zinc-500">this month</span>
              </p>
            </div>
          </div>

          <div 
            onClick={() => { setRoleFilter('Seller'); setCurrentPage(1); }}
            className={`bg-white border ${roleFilter === 'Seller' ? 'border-[#8b5cf6]/50 shadow-md' : 'border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'} rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 group hover:shadow-lg cursor-pointer hover:border-[#8b5cf6]/30`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-[#8b5cf6]">
                  <Shield size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[14px] font-bold text-zinc-800 tracking-wide">Seller Account</span>
              </div>
              <MoreVertical size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-3xl font-bold text-zinc-800 tracking-wide leading-none">
                {sellerCount}
              </h3>
              <p className="text-[12px] font-medium text-emerald-500 pb-0.5 flex items-center gap-1">
                +3 <span className="text-zinc-500">new</span>
              </p>
            </div>
          </div>

          <div 
            onClick={() => { setRoleFilter('Member'); setCurrentPage(1); }}
            className={`bg-white border ${roleFilter === 'Member' ? 'border-[#10b981]/50 shadow-md' : 'border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'} rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 group hover:shadow-lg cursor-pointer hover:border-[#10b981]/30`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-[#10b981]">
                  <UserCheck size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[14px] font-bold text-zinc-800 tracking-wide">Members Account</span>
              </div>
              <MoreVertical size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-3xl font-bold text-zinc-800 tracking-wide leading-none">
                {memberCount}
              </h3>
              <p className="text-[12px] font-medium text-emerald-500 pb-0.5 flex items-center gap-1">
                +8% <span className="text-zinc-500">this month</span>
              </p>
            </div>
          </div>

          <div 
            onClick={() => { setRoleFilter('Guest'); setCurrentPage(1); }}
            className={`bg-white border ${roleFilter === 'Guest' ? 'border-zinc-400 shadow-md' : 'border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'} rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 group hover:shadow-lg cursor-pointer hover:border-zinc-400`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-600 bg-zinc-200">
                  <Users size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[14px] font-bold text-zinc-800 tracking-wide">Guests Account</span>
              </div>
              <MoreVertical size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-3xl font-bold text-zinc-800 tracking-wide leading-none">
                {guestCount}
              </h3>
              <p className="text-[12px] font-medium text-emerald-500 pb-0.5 flex items-center gap-1">
                +24 <span className="text-zinc-500">active</span>
              </p>
            </div>
          </div>
        </div>

        {/* Unified Table Section */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-zinc-800 tracking-wide px-2 mb-6">Customer List</h3>
          
          <div className="bg-white border border-zinc-100 rounded-[40px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
            
            {/* Top Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between p-6 pb-4 border-b border-zinc-100">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'All', label: 'All', count: totalCount },
                  { id: 'Seller', label: 'Seller', count: sellerCount },
                  { id: 'Member', label: 'Member', count: memberCount },
                  { id: 'Guest', label: 'Guest', count: guestCount },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => { setRoleFilter(filter.id); setCurrentPage(1); }}
                    className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                      roleFilter === filter.id 
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
                <div className="relative flex-1 lg:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search customer..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-full text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-zinc-400"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <MoreVertical size={14} className="rotate-45" />
                    </button>
                  )}
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
                            <h4 className="text-sm font-bold text-zinc-800">Filter by Join Month</h4>
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

            {/* Table */}
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50/50">
                    <th 
                      onClick={() => handleSort('id')}
                      className="py-4 px-6 text-[12px] font-bold text-zinc-500 cursor-pointer group hover:bg-zinc-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">ID <SortIndicator column="id" /></div>
                    </th>
                    <th 
                      onClick={() => handleSort('name')}
                      className="py-4 px-6 text-[12px] font-bold text-zinc-500 cursor-pointer group hover:bg-zinc-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">Customer Name <SortIndicator column="name" /></div>
                    </th>
                    <th 
                      onClick={() => handleSort('email')}
                      className="py-4 px-6 text-[12px] font-bold text-zinc-500 cursor-pointer group hover:bg-zinc-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">Email Address <SortIndicator column="email" /></div>
                    </th>
                    <th 
                      onClick={() => handleSort('phone')}
                      className="py-4 px-6 text-[12px] font-bold text-zinc-500 cursor-pointer group hover:bg-zinc-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">Phone Number <SortIndicator column="phone" /></div>
                    </th>
                    <th 
                      onClick={() => handleSort('role')}
                      className="py-4 px-6 text-[12px] font-bold text-zinc-500 cursor-pointer group hover:bg-zinc-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">Role <SortIndicator column="role" /></div>
                    </th>
                    <th 
                      onClick={() => handleSort('totalSpent')}
                      className="py-4 px-6 text-[12px] font-bold text-zinc-500 cursor-pointer group hover:bg-zinc-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">Total Spent <SortIndicator column="totalSpent" /></div>
                    </th>
                    <th 
                      onClick={() => handleSort('createdAt')}
                      className="py-4 px-6 text-[12px] font-bold text-zinc-500 cursor-pointer group hover:bg-zinc-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">Join Date <SortIndicator column="createdAt" /></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-6 h-6 border-2 border-zinc-200 border-t-blue-500 rounded-full animate-spin"></div>
                          <p className="text-sm font-medium text-zinc-500">Loading customers...</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <p className="text-sm font-medium text-zinc-500">No customers found.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((c) => (
                      <tr 
                        key={c.id}
                        onClick={() => router.push(`/admin/customer/${c.id}`)}
                        className="group hover:bg-zinc-50 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-6">
                          <span className="text-[12px] font-mono font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">
                            #{c.id.substring(c.id.length - 6).toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-[14px] font-bold text-zinc-800">{c.name || 'Guest'}</span>
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
                          {c.role === 'Seller' && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
                              <Shield size={12} strokeWidth={2.5} />
                              <span className="text-[11px] font-bold">Seller</span>
                            </div>
                          )}
                          {c.role === 'Member' && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                              <UserCheck size={12} strokeWidth={2.5} />
                              <span className="text-[11px] font-bold">Member</span>
                            </div>
                          )}
                          {c.role === 'Guest' && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-500 border border-zinc-200">
                              <Users size={12} strokeWidth={2.5} />
                              <span className="text-[11px] font-bold">Guest</span>
                            </div>
                          )}
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
                              {new Date(c.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
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
            <div className="p-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/50">
              <p className="text-[13px] font-medium text-zinc-500">
                Showing <span className="font-bold text-zinc-800">{sortedCustomers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-bold text-zinc-800">{Math.min(currentPage * itemsPerPage, sortedCustomers.length)}</span> of <span className="font-bold text-zinc-800">{sortedCustomers.length}</span> records
              </p>
              
              <div className="flex items-center gap-1.5">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-white border border-transparent hover:border-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all shadow-sm disabled:shadow-none"
                  title="First Page"
                >
                  <ChevronsLeft size={16} strokeWidth={2.5} />
                </button>
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-2 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-white border border-transparent hover:border-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all shadow-sm disabled:shadow-none"
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
                        className={`min-w-[32px] h-8 rounded-lg text-[13px] font-bold transition-all flex items-center justify-center ${
                          currentPage === i + 1 
                            ? 'bg-zinc-800 text-white shadow-md' 
                            : 'text-zinc-500 hover:bg-white hover:text-zinc-800 border border-transparent hover:border-zinc-200 hover:shadow-sm'
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
                  className="p-2 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-white border border-transparent hover:border-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all shadow-sm disabled:shadow-none"
                  title="Next Page"
                >
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
                <button 
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(totalPages)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-white border border-transparent hover:border-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent transition-all shadow-sm disabled:shadow-none"
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
