import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useCart } from '../components/cart/CartProvider';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  MapPin, 
  Shield, 
  UserCheck, 
  ArrowLeft, 
  LogOut, 
  Sparkles,
  ChevronRight,
  Package,
  Edit3,
  Check,
  ChevronDown,
  Copy,
  X,
  CreditCard,
  Truck,
  MessageSquare,
  Lock,
  Loader2,
  Calendar,
  ShoppingBag,
  Flame,
  Info,
  DollarSign,
  Receipt,
  Clock,
  TrendingUp,
  Award,
  Crown,
  Search
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useBusiness } from '../context/BusinessContext';

export default function ProfilePage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { settings } = useBusiness();
  const { clearCart } = useCart();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const logoutTranslations = {
    title: { en: 'Log Out', zh: '登出', ms: 'Log Keluar' },
    message: { en: 'Are you sure you want to log out from your account?', zh: '您确定要退出您的帐户吗？', ms: 'Adakah anda pasti ingin log keluar dari akaun anda?' },
    confirm: { en: 'Yes, log out', zh: '是的，登出', ms: 'Ya, log keluar' },
    cancel: { en: 'Cancel', zh: '取消', ms: 'Batal' }
  };

  const statusTranslations: Record<string, Record<string, string>> = {
    'All': { en: 'All Status', zh: '所有状态', ms: 'Semua Status' },
    'Completed': { en: 'Completed', zh: '已完成', ms: 'Selesai' },
    'Pending': { en: 'Pending', zh: '待处理', ms: 'Menunggu' },
    'In Process': { en: 'In Process', zh: '处理中', ms: 'Sedang Diproses' },
    'Cancelled': { en: 'Cancelled', zh: '已取消', ms: 'Dibatalkan' }
  };

  const searchPlaceholderTranslations: Record<string, string> = {
    en: 'Search by Order ID or Date...',
    zh: '按订单 ID 或日期搜索...',
    ms: 'Cari mengikut ID Pesanan atau Tarikh...'
  };
  
  const noOrdersSearchTranslations: Record<string, string> = {
    en: 'No orders match your search.',
    zh: '没有符合您搜索的订单。',
    ms: 'Tiada pesanan yang sepadan dengan carian anda.'
  };

  // Form States
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    preferredPayment: '',
    orderMode: '',
    deliveryDetails: '',
    notes: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
      return;
    }

    const { id } = JSON.parse(savedUser);
    try {
      const res = await fetch(`/api/customers/${id}`);
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setOrders(data.orders || []);
        setEditForm({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
          preferredPayment: data.preferredPayment || '',
          orderMode: data.orderMode || '',
          deliveryDetails: data.deliveryDetails || '',
          notes: data.notes || ''
        });
        // Update local storage in case role/name changed
        localStorage.setItem('user', JSON.stringify({ 
          id: data.id, 
          name: data.name, 
          phone: data.phone, 
          role: data.role,
          sellerLevel: data.sellerLevel 
        }));
        window.dispatchEvent(new Event('user-updated'));
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalSpend = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalSaved = orders.reduce((sum, order) => {
    const savings = order.items?.reduce((itemSum: number, item: any) => {
      if (item.originalPrice && item.originalPrice > item.price) {
        return itemSum + ((item.originalPrice - item.price) * item.quantity);
      }
      return itemSum;
    }, 0) || 0;
    return sum + savings;
  }, 0);

  const hasEditChanges = user && (
    editForm.name !== (user.name || '') ||
    editForm.phone !== (user.phone || '') ||
    editForm.address !== (user.address || '') ||
    editForm.preferredPayment !== (user.preferredPayment || '') ||
    editForm.orderMode !== (user.orderMode || '') ||
    editForm.notes !== (user.notes || '')
  );

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    const { phone: _, ...updateData } = editForm;

    try {
      const res = await fetch(`/api/customers/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        localStorage.setItem('user', JSON.stringify({ 
          id: updated.id, 
          name: updated.name, 
          phone: updated.phone, 
          role: updated.role,
          sellerLevel: updated.sellerLevel 
        }));
        window.dispatchEvent(new Event('user-updated'));
        setActiveTab('view_profile');
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to update profile.');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const isPasswordFormValid = passwordForm.newPassword.length > 0 && passwordForm.confirmPassword.length > 0;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/customers/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordForm.newPassword }),
      });

      if (res.ok) {
        setActiveTab('view_profile');
        setSuccess('Password changed successfully!');
        setPasswordForm({ newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to change password.');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    clearCart();
    window.location.href = '/';
  };

  const filteredOrders = orders.filter((order: any) => {
    const searchLower = searchQuery.toLowerCase();
    const idMatch = order.id.toLowerCase().includes(searchLower);
    const dateMatch = new Date(order.createdAt).toLocaleDateString().toLowerCase().includes(searchLower);
    const matchesSearch = idMatch || dateMatch;
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && order.status === statusFilter;
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{`${user.name}'s Profile - Cheng-BOOM`}</title>
      </Head>

      <div className="min-h-screen bg-background relative overflow-hidden dark:bg-zinc-950 pb-20 text-left text-foreground">


        <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-12">

            <div className="flex items-center gap-4">
               {success && <span className="text-xs font-black text-green-500 uppercase tracking-widest animate-pulse">{success}</span>}
               {error && <span className="text-xs font-black text-red-500 uppercase tracking-widest">{error}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar: Profile Summary */}
            <div className="lg:col-span-4 space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-[40px] p-8 shadow-2xl relative lg:h-[700px] overflow-y-auto overflow-x-hidden custom-scrollbar"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex flex-col items-center text-center mb-10 relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-[32px] flex items-center justify-center text-primary border border-primary/20 shadow-inner mb-6 ring-4 ring-primary/5">
                    <span className="font-black italic text-4xl">{user.name.charAt(0)}</span>
                  </div>
                  <h2 className="text-3xl font-black italic dark:text-white text-zinc-900 mb-2 leading-tight">{user.name}</h2>
                  <div className="group relative">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-default transition-all ${
                      user.role === 'Seller' ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.15)]' : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                    }`}>
                      {user.role === 'Seller' ? <Crown size={14} className="text-yellow-500 drop-shadow-md" /> : <UserCheck size={12} />}
                      {t.profilePage?.roles?.[user.role] || user.role} {t.profilePage?.status || 'Status'}
                    </div>
                    {user.role === 'Seller' && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-4 bg-zinc-900 dark:bg-zinc-800 border border-white/10 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-center pointer-events-none">
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 dark:bg-zinc-800 border-t border-l border-white/10 rotate-45" />
                        <div className="relative z-10 space-y-1">
                          <p className="text-sm font-black text-yellow-400 italic drop-shadow-md">
                            {user.sellerLevel ? user.sellerLevel.name : 'Normal Member'}
                          </p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                            {user.sellerLevel ? (
                                `${user.sellerLevel.discountPercent}% Discount${user.sellerLevel.freeShipping ? ' + Free Shipping' : ''}`
                            ) : (
                                (t.profilePage?.sellerActivatedDesc as string || 'Enjoy exclusive seller benefits.').replace(/CHENG-BOOM|Cheng-BOOM/i, settings?.businessName || 'Cheng-BOOM')
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t dark:border-white/5 border-zinc-100">
                  <button 
                    onClick={() => setActiveTab('view_profile')}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'view_profile' ? 'bg-primary text-zinc-900 shadow-lg shadow-primary/20' : 'bg-zinc-500/5 text-zinc-500 hover:bg-zinc-500/10'}`}
                  >
                    <div className="flex items-center gap-3">
                      <User size={18} />
                      {t.profilePage?.viewProfile || 'View Profile'}
                    </div>
                    {activeTab !== 'view_profile' && <ChevronRight size={16} />}
                  </button>
                  <button 
                    onClick={() => setActiveTab('edit_profile')}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'edit_profile' ? 'bg-primary text-zinc-900 shadow-lg shadow-primary/20' : 'bg-zinc-500/5 text-zinc-500 hover:bg-zinc-500/10'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Edit3 size={18} />
                      {t.profilePage?.editProfile || 'Edit Profile'}
                    </div>
                    {activeTab !== 'edit_profile' && <ChevronRight size={16} />}
                  </button>
                  <button 
                    onClick={() => setActiveTab('change_password')}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'change_password' ? 'bg-primary text-zinc-900 shadow-lg shadow-primary/20' : 'bg-zinc-500/5 text-zinc-500 hover:bg-zinc-500/10'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Lock size={18} />
                      {t.profilePage?.changePassword || 'Change Password'}
                    </div>
                    {activeTab !== 'change_password' && <ChevronRight size={16} />}
                  </button>
                  <button 
                    onClick={() => setActiveTab('all_orders')}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-sm ${activeTab === 'all_orders' ? 'bg-primary text-zinc-900 shadow-lg shadow-primary/20' : 'bg-zinc-500/5 text-zinc-500 hover:bg-zinc-500/10'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Package size={18} />
                      {t.profilePage?.allOrders || 'All Orders'}
                    </div>
                    {activeTab !== 'all_orders' && <ChevronRight size={16} />}
                  </button>
                  <button 
                    onClick={() => setIsLogoutModalOpen(true)}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm mt-4 border border-red-500/10"
                  >
                    <LogOut size={18} />
                    {t.profilePage?.logout || 'Logout'}
                  </button>
                </div>
              </motion.div>


            </div>

            {/* Main Content */}
            <div className="lg:col-span-8 space-y-8">
              
              <AnimatePresence mode="wait">
                {activeTab === 'edit_profile' && (
                  /* ── EDIT PROFILE FORM ────────────────────────────────── */
                  <motion.div 
                    key="edit"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white dark:bg-zinc-900 border border-border rounded-[40px] p-6 md:p-8 shadow-2xl lg:h-[700px] overflow-hidden flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-6 shrink-0">
                      <button onClick={() => setActiveTab('')} className="p-2 rounded-xl bg-zinc-500/5 hover:bg-primary/10 text-zinc-500 hover:text-primary transition-colors">
                        <ArrowLeft size={18} />
                      </button>
                      <User size={20} className="text-zinc-400" />
                      <h3 className="text-xl font-black italic uppercase tracking-tight">
                        {t.profilePage?.editInformation || 'Edit Information'}
                      </h3>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">{t.profilePage?.fullName || 'Full Name'}</label>
                          <input 
                            type="text"
                            required
                            className="w-full px-5 py-3 rounded-2xl bg-zinc-500/5 dark:bg-white/5 border border-zinc-500/10 dark:border-white/10 focus:border-primary outline-none transition-all font-bold text-foreground dark:text-white"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{t.profilePage?.phoneNumber || 'Phone Number'}</label>
                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                              <Shield size={8} /> {t.profilePage?.permanent || 'Permanent'}
                            </span>
                          </div>
                          <input 
                            type="tel"
                            disabled
                            className="w-full px-5 py-3 rounded-2xl bg-zinc-500/10 dark:bg-white/5 border border-zinc-500/10 dark:border-white/10 outline-none transition-all font-bold text-zinc-400 cursor-not-allowed"
                            value={editForm.phone}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">{t.profilePage?.preferredPayment || 'Preferred Payment'}</label>
                          <div className="relative">
                            <select 
                              required
                              className="w-full px-5 py-3 rounded-2xl bg-zinc-500/5 dark:bg-zinc-800 border border-zinc-500/10 dark:border-white/10 focus:border-primary outline-none transition-all font-bold appearance-none cursor-pointer text-foreground dark:text-white"
                              value={editForm.preferredPayment}
                              onChange={(e) => setEditForm({ ...editForm, preferredPayment: e.target.value })}
                            >
                              <option value="" className="dark:bg-zinc-900">{t.profilePage?.selectMethod || 'Select Method'}</option>
                              <option value="TNG e-wallet" className="dark:bg-zinc-900">TNG e-wallet</option>
                              <option value="bank transfer" className="dark:bg-zinc-900">Bank Transfer</option>
                              <option value="DuitNow qr" className="dark:bg-zinc-900">DuitNow QR</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                              <ChevronDown size={16} />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">{t.profilePage?.orderMode || 'Order Mode'}</label>
                          <div className="relative">
                            <select 
                              required
                              className="w-full px-5 py-3 rounded-2xl bg-zinc-500/5 dark:bg-zinc-800 border border-zinc-500/10 dark:border-white/10 focus:border-primary outline-none transition-all font-bold appearance-none cursor-pointer text-foreground dark:text-white"
                              value={editForm.orderMode}
                              onChange={(e) => setEditForm({ ...editForm, orderMode: e.target.value })}
                            >
                              <option value="" className="dark:bg-zinc-900">{t.profilePage?.selectMode || 'Select Mode'}</option>
                              <option value="Self Collect" className="dark:bg-zinc-900">Self Collect</option>
                              <option value="Delivery" className="dark:bg-zinc-900">Delivery</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                              <ChevronDown size={16} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">{t.profilePage?.addressLabel || 'Delivery / Collection Address'}</label>
                        <textarea 
                          required={editForm.orderMode === 'Delivery'}
                          className="w-full px-5 py-3 rounded-2xl bg-zinc-500/5 dark:bg-white/5 border border-zinc-500/10 dark:border-white/10 focus:border-primary outline-none transition-all font-bold resize-none text-foreground dark:text-white"
                          rows={2}
                          value={editForm.address}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">{t.profilePage?.notesLabel || 'Default Order Notes (Optional)'}</label>
                        <input 
                          type="text"
                          className="w-full px-5 py-3 rounded-2xl bg-zinc-500/5 border border-zinc-500/10 focus:border-primary outline-none transition-all font-bold text-foreground dark:text-white"
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center gap-4 pt-2 shrink-0">
                        <button 
                          type="submit"
                          disabled={isSaving || !hasEditChanges}
                          className={`flex-1 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                            !hasEditChanges || isSaving
                              ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                              : 'bg-primary text-zinc-900 hover:brightness-110 shadow-lg shadow-primary/20'
                          }`}
                        >
                          {isSaving ? <Loader2 className="animate-spin" /> : null}
                          {t.profilePage?.saveChanges || 'Save Changes'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            if (user) {
                              setEditForm({
                                name: user.name || '',
                                phone: user.phone || '',
                                address: user.address || '',
                                preferredPayment: user.preferredPayment || '',
                                orderMode: user.orderMode || '',
                                deliveryDetails: user.deliveryDetails || '',
                                notes: user.notes || ''
                              });
                            }
                            setActiveTab('');
                          }}
                          className="px-8 py-4 bg-zinc-500/10 text-zinc-500 rounded-2xl font-black text-lg hover:bg-zinc-500/20 transition-all flex items-center justify-center shrink-0"
                        >
                          Discard Changes
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
                
                {activeTab === 'change_password' && (
                  /* ── CHANGE PASSWORD FORM ──────────────────────────────── */
                  <motion.div 
                    key="password"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white dark:bg-zinc-900 border border-border rounded-[40px] p-8 md:p-12 shadow-2xl lg:h-[700px] overflow-y-auto overflow-x-hidden custom-scrollbar"
                  >
                    <div className="flex items-center gap-3 mb-10">
                      <button onClick={() => setActiveTab('')} className="p-2 rounded-xl bg-zinc-500/5 hover:bg-primary/10 text-zinc-500 hover:text-primary transition-colors">
                        <ArrowLeft size={18} />
                      </button>
                      <Lock size={20} className="text-zinc-400" />
                      <h3 className="text-xl font-black italic uppercase tracking-tight">
                        {t.profilePage?.securitySettings || 'Security Settings'}
                      </h3>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">{t.profilePage?.newPassword || 'New Password'}</label>
                        <input 
                          type="password"
                          required
                          minLength={6}
                          className="w-full px-5 py-4 rounded-2xl bg-zinc-500/5 border border-zinc-500/10 focus:border-primary outline-none transition-all font-bold text-foreground dark:text-white"
                          placeholder="••••••••"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">{t.profilePage?.confirmNewPassword || 'Confirm New Password'}</label>
                        <input 
                          type="password"
                          required
                          className="w-full px-5 py-4 rounded-2xl bg-zinc-500/5 border border-zinc-500/10 focus:border-primary outline-none transition-all font-bold text-foreground dark:text-white"
                          placeholder="••••••••"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center gap-4 pt-6">
                        <button 
                          type="submit"
                          disabled={isSaving || !isPasswordFormValid}
                          className={`flex-1 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                            !isPasswordFormValid || isSaving
                              ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                              : 'bg-primary text-zinc-900 hover:brightness-110 shadow-lg shadow-primary/20'
                          }`}
                        >
                          {isSaving ? <Loader2 className="animate-spin" /> : null}
                          {t.profilePage?.updatePassword || 'Update Password'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            setPasswordForm({ newPassword: '', confirmPassword: '' });
                            setActiveTab('');
                          }}
                          className="px-8 py-4 bg-zinc-500/10 text-zinc-500 rounded-2xl font-black text-lg hover:bg-zinc-500/20 transition-all flex items-center justify-center shrink-0"
                        >
                          Discard Changes
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {activeTab === '' && (
                  /* ── DEFAULT DASHBOARD VIEW ───────────────────────────── */
                  <motion.div
                    key="default_dashboard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col gap-6 lg:h-[700px] overflow-y-auto overflow-x-hidden custom-scrollbar pr-2"
                  >

                    {/* Top Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                      {/* Total Orders Card */}
                      <div className="group relative bg-white dark:bg-zinc-900 border border-border rounded-[32px] p-6 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:border-primary/20">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{t.profilePage?.totalOrders || 'Total Orders'}</p>
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                              <ShoppingBag size={20} strokeWidth={2.5} />
                            </div>
                          </div>
                          <div>
                            <p className="text-4xl font-black italic text-foreground tracking-tighter">{orders.length}</p>
                          </div>
                        </div>
                      </div>

                      {/* Total Spend Card */}
                      <div className="group relative bg-white dark:bg-zinc-900 border border-border rounded-[32px] p-6 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:border-primary/20">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
                        <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t.profilePage?.lifetimeInvestment || 'Total Spent'}</p>
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                              <DollarSign size={20} strokeWidth={2.5} />
                            </div>
                          </div>
                          <div>
                            <p className="text-3xl font-black italic text-foreground dark:text-white tracking-tighter">
                              RM<span className="text-primary">{totalSpend.toFixed(2).split('.')[0]}</span>
                              <span className="text-xl opacity-50 text-foreground dark:text-white">.{totalSpend.toFixed(2).split('.')[1]}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Recent Orders List */}
                    <div className="bg-white dark:bg-zinc-900 border border-border rounded-[40px] p-8 shadow-sm flex-1 flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <Package size={20} className="text-zinc-400" />
                          <h3 className="text-xl font-black italic uppercase tracking-tight">
                            {t.profilePage?.recentOrders || 'Recent Orders'}
                          </h3>
                        </div>
                        {orders.length > 3 && (
                          <button 
                            onClick={() => setActiveTab('all_orders')}
                            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline px-4 py-2 bg-primary/5 rounded-full flex items-center gap-1"
                          >
                            {t.profilePage?.viewAll || 'View All'} <ChevronRight size={12} />
                          </button>
                        )}
                      </div>

                      {orders.length === 0 ? (
                        <div className="py-12 text-center flex-1 flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-zinc-500/5 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-300">
                            <Package size={32} />
                          </div>
                          <p className="text-sm font-bold text-zinc-400">{t.profilePage?.noOrdersYet || "You haven't placed any orders yet."}</p>
                        </div>
                      ) : (
                        <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
                          {orders.slice(0, 3).map((order: any) => (
                            <button 
                              key={order.id}
                              onClick={() => setSelectedOrder(order)}
                              className="w-full group p-5 rounded-3xl bg-zinc-500/5 border border-transparent hover:border-primary/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-4 text-left">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-950 flex items-center justify-center text-primary shadow-sm border border-border">
                                  <ShoppingBag size={20} />
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] md:text-xs font-black text-foreground" title={order.id}>{t.profilePage?.orderHash || 'Order #'} {order.id}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight ${
                                      order.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                                    }`}>
                                      {statusTranslations[order.status as string]?.[locale as string] || order.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Calendar size={12} className="text-zinc-400" />
                                    <span className="text-[10px] text-zinc-500 font-bold">{new Date(order.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between md:justify-end gap-6">
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t.profilePage?.amount || 'Amount'}</span>
                                  <span className="text-lg font-black text-foreground">RM {order.totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Info size={20} strokeWidth={3} />
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'view_profile' && (
                  /* ── VIEW PROFILE (READ-ONLY) ─────────────────────────── */
                  <motion.div
                    key="view_profile"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="bg-white dark:bg-zinc-900 border border-border rounded-[40px] p-8 md:p-10 shadow-2xl lg:h-[700px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                      <div className="flex items-center gap-3 mb-8">
                        <button onClick={() => setActiveTab('')} className="p-2 rounded-xl bg-zinc-500/5 hover:bg-primary/10 text-zinc-500 hover:text-primary transition-colors">
                          <ArrowLeft size={18} />
                        </button>
                        <User size={20} className="text-zinc-400" />
                        <h3 className="text-xl font-black italic uppercase tracking-tight">
                          {t.profilePage?.viewProfile || 'View Profile'}
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">{t.profilePage?.fullName || 'Full Name'}</label>
                          <p className="px-5 py-4 rounded-2xl bg-zinc-500/5 dark:bg-white/5 border border-zinc-500/10 dark:border-white/10 font-bold text-foreground dark:text-white">
                            {user.name || '-'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">{t.profilePage?.phoneNumber || 'Phone Number'}</label>
                          <p className="px-5 py-4 rounded-2xl bg-zinc-500/5 dark:bg-white/5 border border-zinc-500/10 dark:border-white/10 font-bold text-foreground dark:text-white">
                            {user.phone || '-'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">{t.profilePage?.preferredPayment || 'Preferred Payment'}</label>
                          <p className="px-5 py-4 rounded-2xl bg-zinc-500/5 dark:bg-white/5 border border-zinc-500/10 dark:border-white/10 font-bold text-primary">
                            {user.preferredPayment || (t.profilePage?.notSet || 'Not set')}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">{t.profilePage?.orderMode || 'Order Mode'}</label>
                          <p className="px-5 py-4 rounded-2xl bg-zinc-500/5 dark:bg-white/5 border border-zinc-500/10 dark:border-white/10 font-bold text-primary">
                            {user.orderMode || (t.profilePage?.notSet || 'Not set')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mt-8">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">{t.profilePage?.addressLabel || 'Delivery / Collection Address'}</label>
                        <p className="px-5 py-4 rounded-2xl bg-zinc-500/5 dark:bg-white/5 border border-zinc-500/10 dark:border-white/10 font-bold text-foreground dark:text-white min-h-[100px] whitespace-pre-wrap">
                          {user.address || '-'}
                        </p>
                      </div>
                      <div className="space-y-2 mt-8">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">{t.profilePage?.notesLabel || 'Default Order Notes (Optional)'}</label>
                        <p className="px-5 py-4 rounded-2xl bg-zinc-500/5 dark:bg-white/5 border border-zinc-500/10 dark:border-white/10 font-bold text-foreground dark:text-white min-h-[60px] whitespace-pre-wrap">
                          {user.notes || '-'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'all_orders' && (
                  /* ── ALL ORDERS VIEW ──────────────────────────────────── */
                  <motion.div
                    key="all_orders"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    {/* All Orders List */}
                    <div className="bg-white dark:bg-zinc-900 border border-border rounded-[40px] p-8 shadow-sm lg:h-[700px] flex flex-col">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 shrink-0">
                        <div className="flex items-center gap-3">
                          <button onClick={() => setActiveTab('')} className="p-2 rounded-xl bg-zinc-500/5 hover:bg-primary/10 text-zinc-500 hover:text-primary transition-colors">
                            <ArrowLeft size={18} />
                          </button>
                          <Package size={20} className="text-zinc-400" />
                          <h3 className="text-xl font-black italic uppercase tracking-tight">
                            {t.profilePage?.allOrders || 'All Orders'}
                          </h3>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-zinc-500/5 dark:bg-zinc-900 border border-zinc-500/10 dark:border-white/10 focus:border-primary outline-none transition-all font-bold text-sm text-foreground dark:text-white cursor-pointer appearance-none"
                          >
                            <option value="All" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">{statusTranslations['All']?.[locale as string] || statusTranslations['All'].en}</option>
                            <option value="Completed" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">{statusTranslations['Completed']?.[locale as string] || statusTranslations['Completed'].en}</option>
                            <option value="Pending" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">{statusTranslations['Pending']?.[locale as string] || statusTranslations['Pending'].en}</option>
                            <option value="In Process" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">{statusTranslations['In Process']?.[locale as string] || statusTranslations['In Process'].en}</option>
                            <option value="Cancelled" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">{statusTranslations['Cancelled']?.[locale as string] || statusTranslations['Cancelled'].en}</option>
                          </select>

                          <div className="relative w-full sm:w-auto">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search size={16} className="text-zinc-400" />
                            </div>
                            <input
                              type="text"
                              placeholder={searchPlaceholderTranslations[locale as string] || searchPlaceholderTranslations.en}
                              className="w-full sm:w-64 pl-10 pr-10 py-3 rounded-2xl bg-zinc-500/5 dark:bg-white/5 border border-zinc-500/10 dark:border-white/10 focus:border-primary outline-none transition-all font-bold text-sm text-foreground dark:text-white"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                              <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-red-500 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {filteredOrders.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 bg-zinc-500/5 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-300">
                            {searchQuery ? <Search size={32} /> : <Package size={32} />}
                          </div>
                          <p className="text-sm font-bold text-zinc-400">
                            {searchQuery ? (noOrdersSearchTranslations[locale as string] || noOrdersSearchTranslations.en) : (t.profilePage?.noOrdersYet || "You haven't placed any orders yet.")}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 min-h-0">
                          {filteredOrders.map((order: any) => (
                            <button 
                              key={order.id}
                              onClick={() => setSelectedOrder(order)}
                              className="w-full group p-5 rounded-3xl bg-zinc-500/5 border border-transparent hover:border-primary/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-4 text-left">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-950 flex items-center justify-center text-primary shadow-sm border border-border">
                                  <ShoppingBag size={20} />
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] md:text-xs font-black text-foreground" title={order.id}>{t.profilePage?.orderHash || 'Order #'} {order.id}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight ${
                                      order.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                                    }`}>
                                      {statusTranslations[order.status as string]?.[locale as string] || order.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Calendar size={12} className="text-zinc-400" />
                                    <span className="text-[10px] text-zinc-500 font-bold">{new Date(order.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between md:justify-end gap-6">
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t.profilePage?.amount || 'Amount'}</span>
                                  <span className="text-lg font-black text-foreground">RM {order.totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Info size={20} strokeWidth={3} />
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>

        {/* ── ENHANCED ORDER DETAILS MODAL ────────────────────────────── */}
        <AnimatePresence>
          {selectedOrder && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                className="relative w-full max-w-5xl bg-zinc-50 dark:bg-zinc-950 rounded-[32px] sm:rounded-[48px] shadow-2xl overflow-hidden border border-zinc-200 dark:border-white/10 flex flex-col md:flex-row max-h-[90vh] lg:max-h-[85vh]"
              >
                {/* Close Button */}
                <button data-html2canvas-ignore="true" onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 md:top-8 md:right-8 p-3 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all z-30 backdrop-blur-md">
                  <X size={20} strokeWidth={3} />
                </button>

                {/* Left Side: Order Info */}
                <div className="w-full md:w-1/2 lg:w-[55%] bg-zinc-100/50 dark:bg-zinc-900/50 p-6 sm:p-10 lg:p-12 flex flex-col border-b md:border-b-0 md:border-r border-zinc-200 dark:border-white/10 overflow-y-auto custom-scrollbar relative">
                  
                  {/* Order ID & Tag */}
                  <div className="space-y-4 mb-10 mt-6 md:mt-0 w-full min-w-0">
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">{t.profilePage?.orderId || 'Order ID'}</p>
                    <div className="flex items-center gap-3 w-full min-w-0">
                      <h2 className="text-xl sm:text-2xl font-black text-foreground dark:text-white tracking-tight truncate flex-1" title={selectedOrder.id.toUpperCase()}>#{selectedOrder.id.toUpperCase()}</h2>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(selectedOrder.id.toUpperCase());
                          alert('Order ID copied!');
                        }} 
                        className="text-zinc-400 hover:text-foreground dark:hover:text-white transition-colors shrink-0 mt-1"
                      >
                        <Copy size={20} />
                      </button>
                    </div>
                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold ${
                        selectedOrder.status === 'Completed' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' 
                        : selectedOrder.status === 'Cancelled' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                      }`}>
                        {selectedOrder.status === 'Completed' ? <Check size={14} /> : selectedOrder.status === 'Cancelled' ? <X size={14} /> : <Clock size={14} />}
                        {statusTranslations[selectedOrder.status as string]?.[locale as string] || selectedOrder.status}
                    </div>
                  </div>

                  {/* Progress Tracker */}
                  <div className="mb-10 w-full relative">
                    {(() => {
                      const stages = [
                        { key: 'Pending', icon: <Clock size={14} /> },
                        { key: 'In Process', icon: <Package size={14} /> },
                        { key: 'Delivering', icon: <Truck size={14} /> },
                        { key: 'Completed', icon: <Check size={14} /> }
                      ];
                      
                      const getStageIndex = (s: string) => {
                        switch (s) {
                          case 'Pending': return 0;
                          case 'In Process': return 1;
                          case 'Delivering': return 2;
                          case 'Completed': return 3;
                          default: return -1;
                        }
                      };
                      
                      const currentStageIdx = getStageIndex(selectedOrder.status);
                      const isCancelled = selectedOrder.status === 'Cancelled';
                      
                      if (isCancelled) {
                        return (
                          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-3">
                              <X size={24} />
                            </div>
                            <p className="text-red-600 dark:text-red-400 font-bold">{statusTranslations['Cancelled']?.[locale as string] || 'Cancelled'}</p>
                          </div>
                        );
                      }

                      return (
                        <div className="relative flex justify-between items-start w-full px-2">
                          {/* Connecting Line background */}
                          <div className="absolute top-[18px] left-6 right-6 h-0.5 bg-zinc-200 dark:bg-zinc-800 -z-10" />
                          
                          {/* Active Line foreground */}
                          <div 
                            className="absolute top-[18px] left-6 h-0.5 bg-orange-500 transition-all duration-500 -z-10" 
                            style={{ width: `calc(${currentStageIdx >= 0 ? (currentStageIdx / (stages.length - 1)) * 100 : 0}% - 48px)` }}
                          />

                          {stages.map((stage, idx) => {
                            const isPast = currentStageIdx >= idx;
                            const isCurrent = currentStageIdx === idx;
                            return (
                              <div key={idx} className="flex flex-col items-center gap-2 z-10 relative w-12">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-[3px] transition-all duration-300 ${
                                  isPast 
                                    ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30' 
                                    : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                                }`}>
                                  {stage.icon}
                                </div>
                                <div className="text-center absolute top-11 whitespace-nowrap">
                                  <p className={`text-[10px] font-bold ${isCurrent ? 'text-orange-600 dark:text-orange-400' : isPast ? 'text-foreground dark:text-white' : 'text-zinc-400'}`}>
                                    {statusTranslations[stage.key]?.[locale as string] || stage.key}
                                  </p>
                                  {isCurrent && (
                                    <p className="text-[8px] text-zinc-500 mt-0.5">
                                      {new Date(selectedOrder.updatedAt || selectedOrder.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Order Info List */}
                  <div className="space-y-6 mt-16 pt-8 border-t border-zinc-200 dark:border-white/10 text-left flex-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                        <Calendar size={16} />
                        <span className="text-xs font-bold">{t.profilePage?.placedOn || 'Order Placed'}</span>
                      </div>
                      <span className="text-sm font-black text-foreground dark:text-white">
                        {new Date(selectedOrder.createdAt).toLocaleString('en-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                        <CreditCard size={16} />
                        <span className="text-xs font-bold">{t.profilePage?.payment || 'Payment Method'}</span>
                      </div>
                      <span className="text-sm font-black text-foreground dark:text-white">{selectedOrder.paymentMethod || '-'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                        <MapPin size={16} />
                        <span className="text-xs font-bold">{t.profilePage?.fulfillment || 'Fulfillment Method'}</span>
                      </div>
                      <span className="text-sm font-black text-foreground dark:text-white">{selectedOrder.deliveryMode || '-'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                        <Info size={16} />
                        <span className="text-xs font-bold">{t.profilePage?.orderStatus || 'Order Status'}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${
                        selectedOrder.status === 'Completed' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' 
                        : selectedOrder.status === 'Cancelled' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' 
                        : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                      }`}>
                        {statusTranslations[selectedOrder.status as string]?.[locale as string] || selectedOrder.status}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Right Side: Order Items */}
                <div className="w-full md:w-1/2 lg:w-[45%] bg-white dark:bg-zinc-900 p-6 sm:p-10 lg:p-12 flex flex-col h-full overflow-y-auto custom-scrollbar">
                  
                  <h3 className="text-sm font-black text-foreground dark:text-white uppercase tracking-widest flex items-center gap-2 mb-8">
                    <ShoppingBag size={18} className="text-primary" /> {t.profilePage?.orderItems || 'Order Items'}
                  </h3>

                  {/* Items List */}
                  <div className="space-y-4 flex-1">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-4 py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 group">
                        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center text-zinc-400 border border-zinc-200 dark:border-zinc-800 overflow-hidden shrink-0 shadow-sm group-hover:border-primary/30 transition-all">
                          {item.image ? (
                             <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                             <Flame size={24} className="text-primary opacity-50" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-foreground dark:text-white truncate">{item.name}</p>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                            <Flame size={10} className="text-orange-500" /> Premium Firework
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-foreground dark:text-white">RM {item.price.toFixed(2)}</p>
                          <p className="text-xs font-bold text-zinc-500 mt-1">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Billing Summary */}
                  <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-zinc-500">{t.profilePage?.subtotalLabel || 'Subtotal'}</span>
                      <span className="text-sm font-bold text-foreground dark:text-white">RM {
                        selectedOrder.items?.reduce((sum: number, i: any) => sum + (i.originalPrice || i.price) * i.quantity, 0).toFixed(2)
                      }</span>
                    </div>
                    
                    {/* Discount Calculation */}
                    {(() => {
                      const originalTotal = selectedOrder.items?.reduce((sum: number, i: any) => sum + (i.originalPrice || i.price) * i.quantity, 0) || 0;
                      const actualTotal = selectedOrder.items?.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0) || 0;
                      const discount = originalTotal - actualTotal;
                      const extraDiscount = actualTotal - selectedOrder.totalAmount;
                      const totalDiscount = discount + (extraDiscount > 0 ? extraDiscount : 0);
                      
                      return totalDiscount > 0 ? (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-zinc-500">{t.profilePage?.discount || 'Discount'}</span>
                          <span className="text-sm font-bold text-green-500">-RM {totalDiscount.toFixed(2)}</span>
                        </div>
                      ) : null;
                    })()}

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-zinc-500">{t.profilePage?.deliveryFee || 'Delivery Fee'}</span>
                      <span className="text-sm font-bold text-foreground dark:text-white">RM 0.00</span>
                    </div>

                    <div className="flex justify-between items-center pt-6 mt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                      <span className="text-base font-black text-foreground dark:text-white">{t.profilePage?.totalAmountPaid || 'Total Amount Paid'}</span>
                      <span className="text-2xl sm:text-3xl font-black text-orange-500 tracking-tighter">
                        RM {selectedOrder.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {isLogoutModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
              >
                <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800/50">
                  <h3 className="text-lg font-black text-foreground">
                    {logoutTranslations.title[locale as 'en' | 'zh' | 'ms'] || logoutTranslations.title.en}
                  </h3>
                  <button 
                    onClick={() => setIsLogoutModalOpen(false)}
                    className="text-zinc-400 hover:text-foreground transition-colors p-1"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6">
                  <p className="text-zinc-600 dark:text-zinc-300 font-medium">
                    {logoutTranslations.message[locale as 'en' | 'zh' | 'ms'] || logoutTranslations.message.en}
                  </p>
                  
                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={() => setIsLogoutModalOpen(false)}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white transition-colors"
                    >
                      {logoutTranslations.cancel[locale as 'en' | 'zh' | 'ms'] || logoutTranslations.cancel.en}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20"
                    >
                      {logoutTranslations.confirm[locale as 'en' | 'zh' | 'ms'] || logoutTranslations.confirm.en}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
