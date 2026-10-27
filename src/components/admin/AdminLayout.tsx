import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, 
  ChevronDown,
  Globe,
  Search,
  Menu,
  UserRound,
  Clock3,
  KeyRound,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { useBusiness } from '../../context/BusinessContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  headerActions?: React.ReactNode;
  hideTitle?: boolean;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title, headerActions, hideTitle }) => {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const { settings } = useBusiness();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // When mounted on client, now we can show the UI
  useEffect(() => {
    setMounted(true);
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/admin/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.username) setAdminUsername(data.username);
          if (data.language && language !== data.language) setLanguage(data.language);
        }
      } catch (err) {}
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-[#f3f7fc]" />;
  }

  const navItems = [
    { name: t('dashboard') || 'Dashboard', key: 'dashboard', path: '/admin/dashboard', icon: '📊' },
    { name: t('revenue') || 'Revenue', key: 'revenue', path: '/admin/revenue', icon: '💹' },
    { name: t('category') || 'Category', key: 'category', path: '/admin/category', icon: '🏷️' },
    { name: t('inventory') || 'Inventory', path: '/admin/product', icon: '📦' },
    { name: t('orders') || 'Orders', path: '/admin/orders', icon: '🛍️' },
    { name: t('seller_setup') || 'Seller Accounts', key: 'seller-setup', path: '/admin/seller-setup', icon: '🛡️' },
    { name: t('business_setup') || 'Business Setup', key: 'business-setup', path: '/admin/business-setup', icon: '🏢' },
  ];

  const visibleNavItems = navItems.filter((item) => item.name.toLowerCase().includes(navSearch.trim().toLowerCase()));

  const handleLanguageChange = async () => {
    const nextLanguage = language === 'en' ? 'zh' : 'en';
    setLanguage(nextLanguage);
    try {
      await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: nextLanguage }),
      });
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordMessage('');
    if (newPassword.length < 8) {
      setPasswordMessage('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('The new passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to update password.');
      setPasswordSuccess(true);
      setPasswordMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordSuccess(false);
      setPasswordMessage(error.message || 'Unable to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await fetch('/api/admin/logout');
      router.push('/admin');
    } catch (error) {}
  };

  return (
    <div className="min-h-screen font-sans bg-[#f3f7fc] text-zinc-900 flex">
      <Head>
        <title>{`${title} | Cheng-BOOM Admin`}</title>
      </Head>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isCollapsed ? 0 : 264 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        aria-hidden={isCollapsed}
        className={`fixed left-0 top-0 h-full z-50 flex flex-col overflow-hidden bg-white ${isCollapsed ? 'border-r-0 shadow-none' : 'border-r border-blue-100 shadow-[2px_0_16px_rgba(15,39,71,0.04)]'}`}
      >
        {/* Brand */}
        <div className={`h-[72px] shrink-0 flex items-center justify-center border-b border-blue-50 px-2`}>
          {!isCollapsed && <span className="font-bold text-[19px] tracking-tight text-[#17365d]">Admin</span>}
        </div>

        {/* Sidebar Search */}
        <div className={`shrink-0 ${isCollapsed ? 'px-3 py-4' : 'px-4 py-5'}`}>
          {isCollapsed ? (
            <button onClick={() => setIsCollapsed(false)} aria-label="Expand sidebar search" title="Search menu" className="w-full h-10 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors">
              <Search size={18} />
            </button>
          ) : (
            <div className="relative group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-blue-500" />
              <input value={navSearch} onChange={(event) => setNavSearch(event.target.value)} placeholder={language === 'zh' ? '搜索菜单' : 'Search menu'} aria-label="Search admin menu" className="w-full rounded-xl border-0 bg-zinc-100/80 py-2.5 pl-9 pr-3 text-sm text-[#17365d] outline-none transition-colors placeholder:text-zinc-400 focus:bg-blue-50 focus:ring-0" />
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden pb-4 scrollbar-hide">
          <div>
          {visibleNavItems.map((item) => {
            const isActive = router.pathname.startsWith(item.path);
            return (
              <Link key={item.path} href={item.path} title={isCollapsed ? item.name : undefined} onClick={() => setAccountMenuOpen(false)}>
                <div className={`group relative flex min-h-11 items-center gap-3 px-5 py-2.5 transition-colors ${isCollapsed ? 'justify-center' : ''} ${isActive ? 'bg-[#3da2cc] text-white' : 'text-slate-700 hover:bg-[#3da2cc] hover:text-white'}`}>
                  <span aria-hidden="true" className="w-5 shrink-0 text-center text-[15px] leading-none">{item.icon}</span>
                  {!isCollapsed && <span className={`text-[13px] whitespace-nowrap ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>}
                </div>
              </Link>
            );
          })}
          {!isCollapsed && visibleNavItems.length === 0 && <p className="px-3 py-5 text-xs text-zinc-400">{language === 'zh' ? '没有匹配的菜单' : 'No matching menu items'}</p>}
          </div>
        </nav>

      </motion.aside>

      {/* Fixed Top Bar */}
      <motion.header initial={false} animate={{ left: isCollapsed ? 0 : 264 }} transition={{ duration: 0.18, ease: 'easeOut' }} className="fixed top-0 right-0 z-40 h-[60px] bg-[#35333f] text-white shadow-sm">
        <div className="h-12 flex items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button onClick={() => setIsCollapsed(!isCollapsed)} aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="w-10 h-10 rounded-xl flex items-center justify-center text-white/85 hover:text-white hover:bg-white/10 transition-colors shrink-0">
            <Menu size={21} strokeWidth={2} />
          </button>
          <span className="min-w-0 truncate text-sm font-semibold tracking-tight text-white">{settings?.businessName || 'Cheng-BOOM'}</span>
          <div className="flex-1" />

          <div className="relative">
            <button onClick={() => setAccountMenuOpen(!accountMenuOpen)} className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-white hover:bg-white/10 transition-colors" aria-expanded={accountMenuOpen} aria-label="Admin account menu">
              <span className="hidden sm:inline text-xs sm:text-sm font-medium text-white/80">Hi,</span>
              <span className="text-xs sm:text-sm font-bold text-white">{t('super_admin') || 'Super Admin'}</span>
              <ChevronDown size={15} className={`text-white/70 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {accountMenuOpen && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl shadow-zinc-900/10">
                <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                  <p className="text-xs font-bold text-zinc-900">{adminUsername}</p>
                  <p className="text-[11px] text-zinc-500">{t('super_admin') || 'Super Admin'}</p>
                </div>
                <button onClick={() => { setAccountMenuOpen(false); setPasswordMessage(''); setPasswordSuccess(false); setShowPasswordModal(true); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"><KeyRound size={16} className="text-zinc-400" />{language === 'zh' ? '更改密码' : 'Change password'}</button>
                <button onClick={handleLanguageChange} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"><span className="flex items-center gap-3"><Globe size={16} className="text-zinc-400" />{language === 'zh' ? '语言' : 'Language'}</span><span className="text-xs text-zinc-500">{language === 'en' ? 'English' : '中文'}</span></button>
              </motion.div>}
            </AnimatePresence>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-2 text-white/90 tabular-nums">
            <Clock3 size={16} className="text-white/70" />
            <span className="text-xs font-semibold">{currentTime.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
          <button onClick={handleLogout} aria-label="Sign out" title={language === 'zh' ? '退出登录' : 'Sign out'} className="w-10 h-10 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0">
            <LogOut size={18} />
          </button>
        </div>
        <div className="h-3 w-full bg-[#3da2cc]" />
      </motion.header>

      {/* Main Content Area */}
      <motion.main 
        animate={{ marginLeft: isCollapsed ? 0 : 264 }} 
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="flex-1 min-w-0 min-h-screen px-4 pb-10 pt-20 sm:px-6 lg:px-8 bg-[#f1f4fa]"
      >
        {!hideTitle && (
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{title}</h1>
            </motion.div>
            {headerActions && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {headerActions}
              </motion.div>
            )}
          </header>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full">
          {children}
        </motion.div>
      </motion.main>

      <motion.footer initial={false} animate={{ left: isCollapsed ? 0 : 264 }} transition={{ duration: 0.18, ease: 'easeOut' }} className="fixed bottom-0 right-0 z-30 h-5 bg-[#7b808a] text-white/95 shadow-[0_-1px_4px_rgba(15,23,42,0.04)]">
        <div className="h-full flex items-center justify-between px-3 sm:px-5 text-[9px] font-medium">
          <span>© 2026 {settings?.businessName || 'Cheng-BOOM'}. All rights reserved.</span>
          <span className="tabular-nums">v0.1.0</span>
        </div>
      </motion.footer>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/35 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowPasswordModal(false); }}>
            <motion.form onSubmit={handleChangePassword} initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-zinc-200" onMouseDown={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center"><KeyRound size={20} /></div>
                  <div><h3 className="text-lg font-bold text-zinc-900">{language === 'zh' ? '更改密码' : 'Change password'}</h3><p className="text-xs text-zinc-500 mt-0.5">{adminUsername}</p></div>
                </div>
                <button type="button" onClick={() => setShowPasswordModal(false)} aria-label="Close" className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800"><X size={18} /></button>
              </div>

              <div className="space-y-4">
                {[
                  { label: language === 'zh' ? '当前密码' : 'Current password', value: currentPassword, set: setCurrentPassword, autoComplete: 'current-password' },
                  { label: language === 'zh' ? '新密码' : 'New password', value: newPassword, set: setNewPassword, autoComplete: 'new-password' },
                  { label: language === 'zh' ? '确认新密码' : 'Confirm new password', value: confirmPassword, set: setConfirmPassword, autoComplete: 'new-password' },
                ].map((field) => <label key={field.label} className="block space-y-1.5"><span className="text-xs font-semibold text-zinc-700">{field.label}</span><span className="relative block"><input required type={showPasswords ? 'text' : 'password'} autoComplete={field.autoComplete} value={field.value} onChange={(event) => field.set(event.target.value)} disabled={isChangingPassword || passwordSuccess} className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 pr-11 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-zinc-50" /><button type="button" onClick={() => setShowPasswords(!showPasswords)} aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700">{showPasswords ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>)}
              </div>

              {passwordMessage && <div className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ${passwordSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{passwordSuccess ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}{passwordMessage}</div>}
              {newPassword.length > 0 && newPassword.length < 8 && <p className="mt-2 text-[11px] text-zinc-500">{language === 'zh' ? '密码至少需要 8 个字符。' : 'Use at least 8 characters for your new password.'}</p>}

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">{language === 'zh' ? '关闭' : 'Close'}</button>
                {!passwordSuccess && <button type="submit" disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword} className="flex-1 rounded-xl bg-blue-800 px-4 py-3 text-sm font-bold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50">{isChangingPassword ? (language === 'zh' ? '正在保存…' : 'Updating…') : (language === 'zh' ? '更新密码' : 'Update password')}</button>}
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={32} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">{t('confirm_logout') || 'Confirm Logout'}</h3>
              <p className="text-sm text-zinc-500 mb-8 font-medium">
                {t('logout_message') || 'Are you sure you want to log out of the admin panel? You will need to sign in again to access the dashboard.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-medium transition-colors text-sm"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors text-sm shadow-sm shadow-red-500/20"
                >
                  {t('yes_logout') || 'Yes, Log out'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        body { font-family: 'Outfit', sans-serif; background-color: #ffffff; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #e4e7ec; }
        ::-webkit-scrollbar-thumb { background: #b6bfcc; border-radius: 20px; }
        ::-webkit-scrollbar-thumb:hover { background: #98a4b5; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default AdminLayout;
