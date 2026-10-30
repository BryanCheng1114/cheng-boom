import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Phone, 
  MapPin, 
  Calendar, 
  User,
  ShoppingBag,
  ArrowRight,
  X,
  Mail,
  Copy,
  Edit2,
  Wallet,
  Box,
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
  const { t, language: locale } = useLanguage();
  const isSellerDetails = router.pathname.startsWith('/admin/seller-setup/') || from === 'seller';
  const backUrl = '/admin/seller-setup';
  const backTitle = isSellerDetails ? t('back_to_seller_accounts') : (t('back_to_customers') || 'Back to Customers');
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);
  const [isSavingTemporaryPassword, setIsSavingTemporaryPassword] = useState(false);
  const [savedCredentials, setSavedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [credentialError, setCredentialError] = useState('');
  const [credentialCopied, setCredentialCopied] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [isSellerInfoExpanded, setIsSellerInfoExpanded] = useState(true);
  const [isSellerOverviewOpen, setIsSellerOverviewOpen] = useState(true);
  
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

  const copyToClipboard = async (text: string) => {
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedValue(text);
        window.setTimeout(() => setCopiedValue((value) => value === text ? null : value), 1600);
      } catch {
        setCredentialError(t('clipboard_error'));
      }
    }
  };

  const handleSetTemporaryPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || typeof id !== 'string') return;
    setCredentialError('');
    setIsSavingTemporaryPassword(true);
    try {
      const response = await fetch(`/api/admin/customers/${id}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: temporaryPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || t('could_not_update_password'));
      const credentials = { email: result.email || customer.email || '', password: temporaryPassword };
      setSavedCredentials(credentials);
      setCustomer((current: any) => ({ ...current, email: credentials.email }));
      setTemporaryPassword('');
    } catch (error) {
      setCredentialError(error instanceof Error ? error.message : t('could_not_update_password'));
    } finally {
      setIsSavingTemporaryPassword(false);
    }
  };

  const copySignInDetails = async () => {
    if (!savedCredentials) return;
    try {
      await navigator.clipboard.writeText(`Email: ${savedCredentials.email}\nPassword: ${savedCredentials.password}`);
      setCredentialCopied(true);
      window.setTimeout(() => setCredentialCopied(false), 1800);
    } catch {
      setCredentialError(t('clipboard_error'));
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

  const translateRole = (role: string) => {
    if (locale === 'zh') {
      if (role === 'Seller') return '卖家';
      if (role === 'Member') return '会员';
      if (role === 'Guest') return '游客';
    }
    if (locale === 'ms') {
      if (role === 'Seller') return 'Penjual';
      if (role === 'Member') return 'Ahli';
      if (role === 'Guest') return 'Tetamu';
    }
    return role;
  };

  const formatDate = (dateStr: string, options: Intl.DateTimeFormatOptions) => {
    if (!dateStr) return '-';
    const dateLocale = locale === 'zh' ? 'zh-CN' : locale === 'ms' ? 'ms-MY' : 'en-US';
    return new Date(dateStr).toLocaleDateString(dateLocale, options);
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const dateLocale = locale === 'zh' ? 'zh-CN' : locale === 'ms' ? 'ms-MY' : 'en-US';
    return new Date(dateStr).toLocaleTimeString(dateLocale, { hour: 'numeric', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <AdminLayout title={isSellerDetails ? t('seller_details_title') : t('customer_details_title')}>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-sky-100 border-t-sky-700" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t('retrieving_profile') || 'Retrieving Profile...'}</p>
        </div>
      </AdminLayout>
    );
  }

  if (!customer) {
    return (
      <AdminLayout title={isSellerDetails ? t('seller_not_found') : t('customer_not_found')}>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-zinc-500">{isSellerDetails ? t('seller_not_found') : (t('customer_not_found') || 'Customer Not Found')}</h2>
          <button 
            onClick={() => router.push(backUrl)}
            className="mx-auto mt-6 flex items-center gap-2 font-medium text-sky-800 transition-all hover:gap-3"
          >
            <ChevronLeft size={20} /> {backTitle}
          </button>
        </div>
      </AdminLayout>
    );
  }
  
  // Stats
  const totalOrders = customer.orders?.length || 0;
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
    <AdminLayout title={isSellerDetails ? t('seller_details_title') : t('customer_details_title')} hideTitle={true}>
      <div className="w-full space-y-5 text-slate-700">
        
        {/* Customer / Seller page title and actions */}
        <header className="space-y-1 border-b border-slate-200 pb-5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h1 className="text-[26px] font-normal leading-tight tracking-tight text-slate-800">{isSellerDetails ? t('seller_details_title') : customer.name}</h1>
            <span className="text-xs font-normal text-slate-700">[ {isSellerDetails ? customer.name : (t('access_badge') || 'Access')} ]</span>
          </div>
          <p className="text-xs text-slate-600">{isSellerDetails ? t('seller_details_breadcrumb') : t('customer_info_breadcrumb')}</p>
          <div className="flex items-center justify-between gap-3 pt-3">
            <button onClick={() => router.push(backUrl)} className="inline-flex items-center gap-2 border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50" title={backTitle}>
               <ChevronLeft size={15} /> {backTitle}
            </button>
            {isSellerDetails && customer.role === 'Seller' && (
              <button type="button" onClick={() => { setCredentialError(''); setIsCredentialsOpen(true); }} className="ml-auto inline-flex items-center gap-2 border border-sky-800 bg-sky-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-900">
                <User size={15} /> {t('manage_signin_details')}
              </button>
            )}
          </div>
        </header>

        <div className="space-y-5">
          {/* Seller information uses the same expandable section style as Dashboard System Overview. */}
          <section className="overflow-hidden border border-slate-200 bg-white shadow-sm">
            <div className="group flex items-stretch justify-between gap-3 border-b border-slate-200 bg-white text-slate-700">
              <button type="button" aria-expanded={isSellerInfoExpanded} aria-controls="seller-information-content" onClick={() => setIsSellerInfoExpanded((expanded) => !expanded)} className="flex min-h-12 flex-1 items-center gap-3 px-5 py-3 text-left text-sm font-semibold transition-colors hover:bg-sky-600 hover:text-white focus-visible:bg-sky-600 focus-visible:text-white focus-visible:outline-none">
                <ChevronDown size={17} className={`shrink-0 transition-transform duration-150 group-hover:text-white ${isSellerInfoExpanded ? '' : '-rotate-90'}`} />
                <span>{isSellerDetails ? t('seller_information_title') : (t('customer_info_breadcrumb').replace(' /', '') || 'Customer Information')}</span>
                {!isSellerInfoExpanded && <span className="truncate text-xs font-normal opacity-75">{customer.name}</span>}
              </button>
            </div>
            {isSellerInfoExpanded && <div id="seller-information-content" className="space-y-6 bg-slate-50/70 p-4">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-0.5 leading-tight">{customer.name}</h2>
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    ID: {customer.id} <Copy size={12} className="cursor-pointer hover:text-sky-800" onClick={() => copyToClipboard(customer.id)} />
                  </div>
                  <div className="inline-flex items-center border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-sky-800">
                    {translateRole(customer.role)}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">{t('contact_information')}</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-sm">
                      <Phone size={16} className="text-sky-700" />
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-0.5">{t('phone')}</div>
                        <div className="font-medium text-slate-900">{customer.phone || '-'}</div>
                      </div>
                    </div>
                    {customer.phone && (
                      <div className="flex h-8 w-8 cursor-pointer items-center justify-center border border-slate-200 bg-white text-slate-500 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800" onClick={() => window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`, '_blank')}>
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail size={16} className="text-sky-700" />
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-0.5">{t('email')}</div>
                        <div className="break-all font-medium text-slate-900">{customer.email || '-'}</div>
                      </div>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-1">
                        <button type="button" aria-label={copiedValue === customer.email ? t('email_copied') : t('copy_email')} title={copiedValue === customer.email ? t('email_copied') : t('copy_email')} className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-slate-500 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800" onClick={() => copyToClipboard(customer.email)}>
                          {copiedValue === customer.email ? <Check size={15} /> : <Copy size={15} />}
                        </button>
                        <button type="button" aria-label={t('email_seller')} title={t('email_seller')} className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-white text-slate-500 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800" onClick={() => window.open(`mailto:${customer.email}`)}>
                          <Mail size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal & Account Details */}
              <div className="border-t border-slate-200 pt-5">
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{t('personal_account_details')}</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-zinc-500 font-semibold">
                      <User size={14} /> {t('role')}
                    </div>
                    <div className="font-semibold text-zinc-900">{translateRole(customer.role)}</div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-zinc-500 font-semibold">
                      <User size={14} /> {t('col_seller_pricing') || 'Seller pricing'}
                    </div>
                    <div className="font-semibold text-zinc-900">{customer.role === 'Seller' ? (customer.sellerPricing ? `${locale === 'zh' ? '卖家 ' : 'Seller '}${customer.sellerPricing}` : t('not_assigned')) : '—'}</div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-zinc-500 font-semibold">
                      <Calendar size={14} /> {t('registered_since')}
                    </div>
                    <div className="font-semibold text-zinc-900">
                      {formatDate(customer.createdAt, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-start gap-3 text-zinc-500 font-semibold pt-0.5">
                      <Wallet size={14} /> 
                      <div className="flex flex-col">
                        <span>{t('preferred_payment')}</span>
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
              <div className="border-t border-slate-200 pt-5">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{t('address')}</h4>
                <div className="flex items-start justify-between group">
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin size={16} className="mt-0.5 text-sky-700" />
                    <div>
                      <div className="text-xs text-zinc-500 font-semibold mb-1">{t('address')}</div>
                      <div className="font-semibold text-zinc-900 leading-relaxed text-[13px]">{customer.address || '-'}</div>
                    </div>
                  </div>
                  {customer.address && (
                    <div className="flex h-8 w-8 cursor-pointer items-center justify-center border border-slate-200 bg-white text-slate-500 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800" onClick={() => copyToClipboard(customer.address)}>
                      <Copy size={14} />
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Details */}
              <div className="border-t border-slate-200 pt-5">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{t('delivery_details')}</h4>
                <div className="flex items-start justify-between group">
                  <div className="flex items-start gap-3 text-sm">
                    <Box size={16} className="text-zinc-400 mt-0.5" />
                    <div>
                      <div className="text-xs text-zinc-500 font-semibold mb-1">{t('default_method')}</div>
                      <div className="font-semibold text-zinc-900 leading-relaxed text-[13px]">{translateOrderMode(customer.orderMode) || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="border-t border-slate-200 pt-5">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{t('notes')}</h4>
                <div className="flex items-start justify-between group">
                  <div className="flex items-start gap-3 text-sm">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text text-zinc-400 mt-0.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><line x1="10" x2="8" y1="9" y2="9"></line></svg>
                    <div>
                      <div className="font-semibold text-zinc-500 leading-relaxed text-[13px]">{customer.notes || t('no_notes_added')}</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>}
            {isSellerDetails && customer.role === 'Seller' && (
              <AnimatePresence>
                {isCredentialsOpen && (
                  <>
                    <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4" onClick={() => setIsCredentialsOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.section role="dialog" aria-modal="true" aria-labelledby="seller-credentials-title" onClick={(event) => event.stopPropagation()} className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto border border-slate-200 bg-white p-6 shadow-2xl sm:p-8" initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}>
                <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:items-end">
                  <div>
                    <h2 id="seller-credentials-title" className="text-base font-semibold text-slate-900">{t('seller_signin_details_title')}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{t('manage_seller_login_desc')}</p>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500">{t('passwords_hashed_notice')}</p>
                </div>
                <button type="button" aria-label={t('close_image_preview') || "Close"} onClick={() => setIsCredentialsOpen(false)} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"><X size={19} /></button>

                <div className="flex flex-col gap-3 border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{t('email_address_label')}</div>
                    <div className="break-all text-sm font-semibold text-slate-900">{customer.email || t('no_email_address')}</div>
                  </div>
                  {customer.email && (
                    <button type="button" onClick={() => copyToClipboard(customer.email)} className="inline-flex shrink-0 items-center justify-center gap-2 border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-sky-600 hover:bg-sky-50 hover:text-sky-800">
                      {copiedValue === customer.email ? <Check size={14} /> : <Copy size={14} />}
                      {copiedValue === customer.email ? t('email_copied') : t('copy_email')}
                    </button>
                  )}
                </div>

                {savedCredentials ? (
                  <div className="space-y-4 border border-emerald-200 bg-emerald-50/50 p-4">
                    <div>
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{t('new_temp_password')}</div>
                      <code className="break-all text-sm font-bold text-slate-900">{savedCredentials.password}</code>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button type="button" onClick={() => copyToClipboard(savedCredentials.password)} className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-sky-600 hover:bg-sky-50 hover:text-sky-800">
                        {copiedValue === savedCredentials.password ? <Check size={14} /> : <Copy size={14} />}
                        {copiedValue === savedCredentials.password ? t('password_copied') : t('copy_password')}
                      </button>
                      <button type="button" onClick={copySignInDetails} className="inline-flex items-center justify-center gap-2 border border-sky-800 bg-sky-700 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-800">
                        {credentialCopied ? <Check size={14} /> : <Copy size={14} />}
                        {credentialCopied ? t('signin_details_copied') : t('copy_email_and_password')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSetTemporaryPassword} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label htmlFor="seller-temporary-password" className="min-w-0 flex-1">
                      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{t('set_temporary_password')}</span>
                      <span className="relative block">
                        <input
                          id="seller-temporary-password"
                          type={showTemporaryPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          autoComplete="new-password"
                          value={temporaryPassword}
                          onChange={(event) => setTemporaryPassword(event.target.value)}
                          placeholder={t('temp_password_req_placeholder')}
                          className="w-full border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                        />
                        <button type="button" onClick={() => setShowTemporaryPassword((visible) => !visible)} aria-label={showTemporaryPassword ? t('hide_password') : t('show_password')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800">
                          {showTemporaryPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </span>
                    </label>
                    <button type="submit" disabled={isSavingTemporaryPassword} className="inline-flex shrink-0 items-center justify-center gap-2 border border-sky-800 bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60">
                      {isSavingTemporaryPassword && <Loader2 size={15} className="animate-spin" />}
                      {isSavingTemporaryPassword ? t('saving_password') : t('save_password')}
                    </button>
                  </form>
                )}

                {credentialError && <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{credentialError}</p>}
                    </motion.section>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            )}
          </section>

            {/* Seller summary cards, styled like the Dashboard overview cards. */}
            <section className="overflow-hidden border border-slate-200 bg-white shadow-sm">
              <div className="group flex items-stretch justify-between gap-3 border-b border-slate-200 bg-white text-slate-700">
                <button type="button" aria-expanded={isSellerOverviewOpen} aria-controls="seller-overview-cards" onClick={() => setIsSellerOverviewOpen((open) => !open)} className="flex min-h-12 flex-1 items-center gap-3 px-5 py-3 text-left text-sm font-semibold transition-colors hover:bg-sky-600 hover:text-white focus-visible:bg-sky-600 focus-visible:text-white focus-visible:outline-none">
                  <ChevronDown size={17} className={`shrink-0 transition-transform duration-150 group-hover:text-white ${isSellerOverviewOpen ? '' : '-rotate-90'}`} />
                  {isSellerDetails ? t('seller_overview') : (t('customer_overview') || 'Customer Overview')}
                </button>
              </div>
              {isSellerOverviewOpen && <div id="seller-overview-cards" className="grid grid-cols-1 gap-4 bg-slate-50/70 p-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="flex min-h-[138px] flex-col justify-between border border-slate-100 bg-white p-5 shadow-sm transition-colors hover:border-sky-200 hover:bg-sky-50/50">
                <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{t('total_orders_label')}</span><span className="flex h-10 w-10 items-center justify-center bg-sky-50 text-sky-700"><Box size={19} /></span></div>
                <div><p className="text-2xl font-bold tracking-tight text-slate-900">{totalOrders}</p><p className="mt-1 text-xs text-slate-500">{t('orders_placed_desc')}</p></div>
              </div>

              <div className="flex min-h-[138px] flex-col justify-between border border-slate-100 bg-white p-5 shadow-sm transition-colors hover:border-sky-200 hover:bg-sky-50/50">
                <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{t('total_spent_label')}</span><span className="flex h-10 w-10 items-center justify-center bg-emerald-50 text-emerald-700"><Wallet size={19} /></span></div>
                <div><p className="text-2xl font-bold tracking-tight text-slate-900">RM {totalSpent.toFixed(2)}</p><p className="mt-1 text-xs text-slate-500">{t('excludes_cancelled_desc')}</p></div>
              </div>

              <div className="flex min-h-[138px] flex-col justify-between border border-slate-100 bg-white p-5 shadow-sm transition-colors hover:border-sky-200 hover:bg-sky-50/50">
                <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{t('avg_order_value')}</span><span className="flex h-10 w-10 items-center justify-center bg-violet-50 text-violet-700"><Package size={19} /></span></div>
                <div><p className="text-2xl font-bold tracking-tight text-slate-900">RM {averageOrderValue.toFixed(2)}</p><p className="mt-1 text-xs text-slate-500">{t('avg_order_value_desc')}</p></div>
              </div>

              <div className="flex min-h-[138px] flex-col justify-between border border-slate-100 bg-white p-5 shadow-sm transition-colors hover:border-sky-200 hover:bg-sky-50/50">
                <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{t('last_order')}</span><span className="flex h-10 w-10 items-center justify-center bg-amber-50 text-amber-700"><Calendar size={19} /></span></div>
                <div><p className="text-xl font-bold tracking-tight text-slate-900">{lastOrderDate ? formatDate(lastOrderDate.toISOString(), { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p><p className="mt-1 text-xs text-slate-500">{t('most_recent_order_desc')}</p></div>
              </div>
              </div>}
            </section>

            {/* Order History Table Section */}
            <div className="flex flex-col overflow-hidden border border-slate-200 bg-white shadow-sm">
              
              {/* Table Header area */}
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 xl:flex-row xl:items-center">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <h3 className="text-base font-semibold tracking-tight text-slate-800">{t('order_history_label')}</h3>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {['All Status', 'Pending', 'Processing', 'Completed', 'Cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`inline-flex items-center gap-2 border px-3 py-2 text-xs font-medium transition-colors ${
                          statusFilter === status
                            ? 'border-sky-800 bg-sky-800 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {status === 'All Status' ? t('all_status') : translateStatus(status)}
                        <span className={`flex items-center justify-center border px-1.5 py-0.5 text-[10px] leading-none ${statusFilter === status ? 'border-white/20 bg-white/15 text-white' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
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
                      "flex h-10 w-10 shrink-0 items-center justify-center border transition-colors",
                      monthFilter || showCalendar
                        ? "border-sky-800 bg-sky-800 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                    title={t('filter_by_month_title')}
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
                            <h4 className="text-sm font-semibold text-slate-800">{t('filter_by_month')}</h4>
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

              {/* Table Body */}
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-100">
                      <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-700">{t('table_no')}</th>
                      <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-700">{t('order_id')}</th>
                      <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-700">{t('item_count')}</th>
                      <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-700">{t('date')}</th>
                      <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-700">{t('order_mode')}</th>
                      <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-700">{t('status')}</th>
                      <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-700">{t('total')}</th>
                      <th className="whitespace-nowrap px-5 py-3 text-right text-xs font-semibold text-slate-700">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.length > 0 ? (
                      currentOrders.map((order: any, idx: number) => (
                        <tr 
                          key={order.id} 
                          className="group cursor-pointer border-b border-slate-300 odd:bg-white even:bg-slate-50 transition-colors hover:bg-sky-50"
                          onClick={() => router.push(`/admin/orders/${order.id}?viewOnly=true&customerId=${customer.id}`)}
                        >
                          <td className="px-5 py-4 text-sm text-slate-500">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                          <td className="px-6 py-4">
                            <div className="font-mono text-sm font-medium text-slate-900" title={order.id}>{`…${String(order.id).slice(-8).toUpperCase()}`}</div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-zinc-700">
                            {order.items?.length || 0} {locale === 'zh' ? '件商品' : order.items?.length !== 1 ? t('items_count_suffix') : t('item_count_suffix_single')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-zinc-700">{formatDate(order.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            <div className="text-[11px] text-zinc-400 font-medium mt-0.5">{formatTime(order.createdAt)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-zinc-700">
                              {translateOrderMode(order.deliveryMode)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-medium ${
                              order.status === 'Completed' ? 'text-emerald-700' :
                              order.status === 'Cancelled' ? 'text-slate-500' : 'text-sky-800'
                            }`}>
                              {translateStatus(order.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-zinc-900">RM {order.totalAmount.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end">
                              <ArrowRight size={18} className="text-slate-400 transition-colors group-hover:text-sky-800" />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500 text-sm font-medium">
                          {t('no_orders_yet') || 'No orders found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
                  <div className="text-zinc-500 font-medium">
                  {t('showing')} {(currentPage - 1) * itemsPerPage + 1} {t('to')} {Math.min(currentPage * itemsPerPage, filteredOrders.length)} {t('of')} {filteredOrders.length} {t('records')}
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex h-8 w-8 items-center justify-center border border-slate-300 text-slate-600 hover:border-sky-700 hover:text-sky-800 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button 
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`flex h-8 w-8 items-center justify-center border text-xs font-medium transition-colors ${currentPage === i + 1 ? 'border-sky-800 bg-sky-800 text-white' : 'border-slate-300 text-slate-600 hover:border-sky-700 hover:text-sky-800'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex h-8 w-8 items-center justify-center border border-slate-300 text-slate-600 hover:border-sky-700 hover:text-sky-800 disabled:opacity-50 transition-colors"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

        </div>
      </div>


    </AdminLayout>
  );
};

export default CustomerDetailsPage;
