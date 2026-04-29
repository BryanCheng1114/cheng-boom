import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical, 
  User,
  Shield,
  UserCheck,
  Phone,
  Calendar,
  Check,
  Trash2,
  MessageSquare
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useLanguage } from '../../context/LanguageContext';

const CustomerPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Management States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: '', direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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

  // Filtering Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             c.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'All' || c.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [customers, searchTerm, roleFilter]);

  // Sorting Logic
  const sortedCustomers = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredCustomers;

    return [...filteredCustomers].sort((a: any, b: any) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

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

  return (
    <AdminLayout title={t('customers')}>
      <div className="space-y-8">
        {/* Header Stats */}
        <div className="flex flex-col xl:flex-row gap-6 items-start justify-between">
          <div className="flex flex-wrap gap-10">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('total_customers')}</p>
              <h4 className="text-4xl font-black italic dark:text-white text-zinc-900 leading-none">{customers.length}</h4>
            </div>
            <div className="pl-10 border-l border-zinc-500/10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('sellers')}</p>
              <h4 className="text-4xl font-black italic text-blue-500 leading-none">
                {customers.filter(c => c.role === 'Seller').length}
              </h4>
            </div>
            <div className="pl-10 border-l border-zinc-500/10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('members')}</p>
              <h4 className="text-4xl font-black italic text-yellow-500 leading-none">
                {customers.filter(c => c.role === 'Member').length}
              </h4>
            </div>
            <div className="pl-10 border-l border-zinc-500/10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{t('guests')}</p>
              <h4 className="text-4xl font-black italic text-zinc-400 leading-none">
                {customers.filter(c => c.role === 'Guest').length}
              </h4>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 p-5 bg-zinc-500/5 rounded-[32px] border border-zinc-500/10 backdrop-blur-sm shadow-inner">
          <div className="flex-1 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder={t('search_customers_placeholder')}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-14 pr-6 py-4 bg-zinc-500/5 border border-zinc-500/10 rounded-2xl outline-none focus:border-yellow-500/50 transition-all dark:text-white font-bold text-sm shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2 px-6 py-4 bg-zinc-500/5 border border-zinc-500/10 rounded-2xl relative shadow-sm">
            <Filter size={18} className="text-zinc-500" />
            <select 
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent outline-none dark:text-white text-zinc-900 font-bold text-sm pr-10 appearance-none cursor-pointer"
            >
              <option value="All" className="dark:bg-zinc-900 bg-white">{t('all_roles')}</option>
              <option value="Seller" className="dark:bg-zinc-900 bg-white">{t('sellers')}</option>
              <option value="Member" className="dark:bg-zinc-900 bg-white">{t('members')}</option>
              <option value="Guest" className="dark:bg-zinc-900 bg-white">{t('guests')}</option>
            </select>
            <div className="absolute right-5 pointer-events-none text-zinc-500">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>

        {/* Customer Table */}
        <div className="border dark:border-white/10 border-zinc-100 rounded-[48px] overflow-hidden shadow-2xl dark:bg-zinc-900/40 bg-white group/table">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b dark:border-white/5 border-zinc-100 bg-zinc-500/5">
                  <th 
                    onClick={() => handleSort('name')}
                    className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer group hover:text-yellow-500 transition-colors"
                  >
                    <div className="flex items-center gap-2">{t('customer')} <SortIndicator column="name" /></div>
                  </th>
                  <th className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('phone')}</th>
                  <th 
                    onClick={() => handleSort('role')}
                    className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer group hover:text-yellow-500 transition-colors"
                  >
                    <div className="flex items-center gap-2">{t('role')} <SortIndicator column="role" /></div>
                  </th>
                  <th 
                    onClick={() => handleSort('createdAt')}
                    className="p-8 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer group hover:text-yellow-500 transition-colors"
                  >
                    <div className="flex items-center gap-2">{t('join_date')} <SortIndicator column="createdAt" /></div>
                  </th>
                  <th className="p-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-500/5">
                {isLoading ? (
                   <tr>
                    <td colSpan={5} className="p-32 text-center text-zinc-500 font-black uppercase tracking-widest text-xs animate-pulse">Synchronizing Profiles...</td>
                  </tr>
                ) : paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-32 text-center text-zinc-500 font-black uppercase tracking-widest text-xs">No matching customer profiles found.</td>
                  </tr>
                ) : paginatedCustomers.map((c) => (
                  <tr 
                    key={c.id} 
                    className="group/row hover:bg-zinc-500/5 transition-all duration-300 cursor-pointer"
                    onClick={() => router.push(`/admin/customer/${c.id}`)}
                  >
                    <td className="p-8">
                      <div className="flex flex-col">
                        <span className="font-bold text-base dark:text-white text-zinc-900 group-hover/row:text-yellow-500 transition-colors">{c.name}</span>
                        <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">ID: {c.id}</span>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        <Phone size={14} className="text-zinc-500" />
                        {c.phone}
                      </div>
                    </td>
                    <td className="p-8">
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                        c.role === 'Seller' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                      }`}>
                        {c.role === 'Seller' ? <Shield size={10} /> : <UserCheck size={10} />}
                        {t(c.role.toLowerCase()) || c.role}
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-2 text-xs font-black text-zinc-400">
                        <Calendar size={14} />
                        {new Date(c.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-8 text-right relative">
                      {/* Actions removed as requested */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-8 border-t dark:border-white/5 border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-500/5">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              {t('showing')} {sortedCustomers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} {t('to')} {Math.min(currentPage * itemsPerPage, sortedCustomers.length)} {t('of')} {customers.length} {t('records')}
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

export default CustomerPage;
