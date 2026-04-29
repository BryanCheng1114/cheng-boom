import React, { useState, useEffect } from 'react';
import Head from 'next/head';
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
  Zap
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showAllOrders, setShowAllOrders] = useState(false);

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
        localStorage.setItem('user', JSON.stringify({ id: data.id, name: data.name, phone: data.phone, role: data.role }));
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalSpend = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const displayedOrders = showAllOrders ? orders : orders.slice(0, 3);

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
        setIsEditing(false);
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
        setIsChangingPassword(false);
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
    window.location.href = '/';
  };

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
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <button 
              onClick={() => router.push('/')}
              className="group flex items-center gap-2 text-zinc-500 hover:text-primary transition-all font-bold text-sm uppercase tracking-widest"
            >
              <div className="w-10 h-10 rounded-2xl bg-zinc-500/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <ArrowLeft size={20} />
              </div>
              Back to Home
            </button>
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
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-[40px] p-8 shadow-2xl overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex flex-col items-center text-center mb-10 relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-[32px] flex items-center justify-center text-primary border border-primary/20 shadow-inner mb-6 ring-4 ring-primary/5">
                    <span className="font-black italic text-4xl">{user.name.charAt(0)}</span>
                  </div>
                  <h2 className="text-3xl font-black italic dark:text-white text-zinc-900 mb-2 leading-tight">{user.name}</h2>
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                    user.role === 'Seller' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                  }`}>
                    {user.role === 'Seller' ? <Shield size={12} /> : <UserCheck size={12} />}
                    {user.role} Status
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t dark:border-white/5 border-zinc-100">
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-sm ${isEditing ? 'bg-primary text-zinc-900 shadow-lg shadow-primary/20' : 'bg-zinc-500/5 text-zinc-500 hover:bg-zinc-500/10'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Edit3 size={18} />
                      {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                    </div>
                    {!isEditing && <ChevronRight size={16} />}
                  </button>
                  <button 
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-sm ${isChangingPassword ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-500/5 text-zinc-500 hover:bg-zinc-500/10'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Lock size={18} />
                      {isChangingPassword ? 'Cancel Change' : 'Change Password'}
                    </div>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </motion.div>

              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-1 gap-4">
                {/* Total Orders Card */}
                <div className="group relative bg-white dark:bg-zinc-900 border border-border rounded-[32px] p-8 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:border-primary/20">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Total Orders</p>
                      <p className="text-4xl font-black italic text-foreground tracking-tighter">{orders.length}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                        <Award size={12} /> Milestone Reached
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <ShoppingBag size={32} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>

                {/* Total Spend Card */}
                <div className="group relative bg-zinc-950 dark:bg-zinc-900 border border-white/5 rounded-[32px] p-8 shadow-2xl overflow-hidden transition-all hover:shadow-primary/10 hover:border-primary/20">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Lifetime Investment</p>
                      <p className="text-3xl font-black italic text-white tracking-tighter">
                        RM<span className="text-primary">{totalSpend.toFixed(2).split('.')[0]}</span>
                        <span className="text-xl opacity-50">.{totalSpend.toFixed(2).split('.')[1]}</span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-zinc-500 font-bold text-[10px] uppercase tracking-widest">
                        <TrendingUp size={12} className="text-green-500" /> Active Shopper
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                      <DollarSign size={32} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-8 space-y-8">
              
              <AnimatePresence mode="wait">
                {isEditing ? (
                  /* ── EDIT PROFILE FORM ────────────────────────────────── */
                  <motion.div 
                    key="edit"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white dark:bg-zinc-900 border border-border rounded-[40px] p-8 md:p-10 shadow-2xl"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <User size={24} />
                      </div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tight">Edit Information</h3>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Full Name</label>
                          <input 
                            type="text"
                            required
                            className="w-full px-5 py-4 rounded-2xl bg-zinc-500/5 dark:bg-white/5 border border-zinc-500/10 dark:border-white/10 focus:border-primary outline-none transition-all font-bold text-foreground dark:text-white"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Phone Number</label>
                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                              <Shield size={8} /> Permanent
                            </span>
                          </div>
                          <input 
                            type="tel"
                            disabled
                            className="w-full px-5 py-4 rounded-2xl bg-zinc-500/10 dark:bg-white/5 border border-zinc-500/10 dark:border-white/10 outline-none transition-all font-bold text-zinc-400 cursor-not-allowed"
                            value={editForm.phone}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Preferred Payment</label>
                          <select 
                            required
                            className="w-full px-5 py-4 rounded-2xl bg-zinc-500/5 dark:bg-zinc-800 border border-zinc-500/10 dark:border-white/10 focus:border-primary outline-none transition-all font-bold appearance-none cursor-pointer text-foreground dark:text-white"
                            value={editForm.preferredPayment}
                            onChange={(e) => setEditForm({ ...editForm, preferredPayment: e.target.value })}
                          >
                            <option value="" className="dark:bg-zinc-900">Select Method</option>
                            <option value="TNG e-wallet" className="dark:bg-zinc-900">TNG e-wallet</option>
                            <option value="bank transfer" className="dark:bg-zinc-900">Bank Transfer</option>
                            <option value="DuitNow qr" className="dark:bg-zinc-900">DuitNow QR</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Order Mode</label>
                          <select 
                            required
                            className="w-full px-5 py-4 rounded-2xl bg-zinc-500/5 dark:bg-zinc-800 border border-zinc-500/10 dark:border-white/10 focus:border-primary outline-none transition-all font-bold appearance-none cursor-pointer text-foreground dark:text-white"
                            value={editForm.orderMode}
                            onChange={(e) => setEditForm({ ...editForm, orderMode: e.target.value })}
                          >
                            <option value="" className="dark:bg-zinc-900">Select Mode</option>
                            <option value="Self Collect" className="dark:bg-zinc-900">Self Collect</option>
                            <option value="Delivery" className="dark:bg-zinc-900">Delivery</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Delivery / Collection Address</label>
                        <textarea 
                          required
                          className="w-full px-5 py-4 rounded-2xl bg-zinc-500/5 dark:bg-white/5 border border-zinc-500/10 dark:border-white/10 focus:border-primary outline-none transition-all font-bold resize-none text-foreground dark:text-white"
                          rows={3}
                          value={editForm.address}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Default Order Notes (Optional)</label>
                        <input 
                          type="text"
                          className="w-full px-5 py-4 rounded-2xl bg-zinc-500/5 border border-zinc-500/10 focus:border-primary outline-none transition-all font-bold text-foreground dark:text-white"
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center gap-4 pt-4">
                        <button 
                          type="submit"
                          disabled={isSaving}
                          className="flex-1 py-4 bg-primary text-zinc-900 rounded-2xl font-black text-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                        >
                          {isSaving ? <Loader2 className="animate-spin" /> : <Check size={20} strokeWidth={3} />}
                          Save Changes
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-8 py-4 bg-zinc-500/10 text-zinc-500 rounded-2xl font-bold hover:bg-zinc-500/20 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                ) : isChangingPassword ? (
                  /* ── CHANGE PASSWORD FORM ──────────────────────────────── */
                  <motion.div 
                    key="password"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white dark:bg-zinc-900 border border-border rounded-[40px] p-8 md:p-12 shadow-2xl"
                  >
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950">
                        <Lock size={24} />
                      </div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tight">Security Settings</h3>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">New Password</label>
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
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Confirm New Password</label>
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
                          disabled={isSaving}
                          className="flex-1 py-4 bg-zinc-950 text-white dark:bg-white dark:text-zinc-900 rounded-2xl font-black text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                          {isSaving ? <Loader2 className="animate-spin" /> : <Sparkles size={20} strokeWidth={3} />}
                          Update Password
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIsChangingPassword(false)}
                          className="px-8 py-4 bg-zinc-500/10 text-zinc-500 rounded-2xl font-bold hover:bg-zinc-500/20 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  /* ── DEFAULT VIEW ─────────────────────────────────────── */
                  <motion.div 
                    key="default"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-8"
                  >
                    {/* Seller Benefits Hub */}
                    {user.role === 'Seller' && (
                      <div className="group relative bg-zinc-950 dark:bg-black border border-yellow-500/20 rounded-[40px] p-8 md:p-10 shadow-2xl overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/20 transition-all duration-700" />
                        
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                          <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                              <div className="w-10 h-10 rounded-2xl bg-yellow-500 flex items-center justify-center text-zinc-900 shadow-lg shadow-yellow-500/20">
                                <Sparkles size={20} strokeWidth={2.5} />
                              </div>
                              <h3 className="text-2xl font-black italic text-white uppercase tracking-tight">Seller Exclusive Hub</h3>
                            </div>
                            <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-md">
                              As a verified <span className="text-yellow-500 font-bold">Cheng-BOOM Distributor</span>, you enjoy a permanent <span className="text-white font-black italic">15% discount</span> on all products. This is automatically applied to every order you place.
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative">
                              <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 animate-pulse" />
                              <div className="relative bg-zinc-900 border-2 border-yellow-500/50 rounded-[32px] px-10 py-6 flex flex-col items-center justify-center shadow-2xl">
                                <span className="text-5xl font-black italic text-yellow-500 tracking-tighter">15%</span>
                                <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mt-1">Auto-Discount</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent Orders Section */}
                    <div className="bg-white dark:bg-zinc-900 border border-border rounded-[40px] p-8 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <Package size={20} className="text-zinc-400" />
                          <h3 className="text-xl font-black italic uppercase tracking-tight">
                            {showAllOrders ? 'All Orders' : 'Recent Orders'}
                          </h3>
                        </div>
                        {orders.length > 3 && (
                          <button 
                            onClick={() => setShowAllOrders(!showAllOrders)}
                            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline px-4 py-2 bg-primary/5 rounded-full"
                          >
                            {showAllOrders ? 'Show Less' : 'View All'}
                          </button>
                        )}
                      </div>

                      {orders.length === 0 ? (
                        <div className="py-20 text-center">
                          <div className="w-16 h-16 bg-zinc-500/5 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-300">
                            <Package size={32} />
                          </div>
                          <p className="text-sm font-bold text-zinc-400">You haven't placed any orders yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {displayedOrders.map((order: any) => (
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
                                    <span className="text-sm font-black text-foreground">Order #{order.id.slice(-6).toUpperCase()}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight ${
                                      order.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                                    }`}>
                                      {order.status}
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
                                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Amount</span>
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

                    {/* Quick Prefs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      <div className="bg-white dark:bg-zinc-900 border border-border rounded-[40px] p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <CreditCard size={18} className="text-zinc-400" />
                          <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Payment preference</h4>
                        </div>
                        <p className="text-xs font-bold text-zinc-500 mb-2">Method:</p>
                        <p className="text-sm font-black text-primary">{user.preferredPayment || 'Not set'}</p>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 border border-border rounded-[40px] p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <Truck size={18} className="text-zinc-400" />
                          <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Order Mode</h4>
                        </div>
                        <p className="text-xs font-bold text-zinc-500 mb-2">Fulfillment:</p>
                        <p className="text-sm font-black text-primary">{user.orderMode || 'Not set'}</p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-border rounded-[40px] p-8 text-left">
                      <div className="flex items-center gap-3 mb-6">
                        <MapPin size={18} className="text-zinc-400" />
                        <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Address details</h4>
                      </div>
                      <p className="text-sm font-black text-foreground leading-relaxed">{user.address || 'No address provided'}</p>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                className="relative w-full max-w-3xl bg-zinc-50 dark:bg-zinc-900/50 rounded-[48px] shadow-2xl overflow-hidden border border-white/10 flex flex-col md:flex-row max-h-[90vh]"
              >
                {/* Close Button */}
                <button onClick={() => setSelectedOrder(null)} className="absolute top-8 right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-30 backdrop-blur-md">
                  <X size={20} strokeWidth={3} />
                </button>

                {/* Left Side: Receipt Styling */}
                <div className="w-full md:w-5/12 bg-white dark:bg-black p-8 sm:p-12 flex flex-col border-r border-border/50">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-zinc-900 shadow-lg shadow-primary/20">
                      <Receipt size={28} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground leading-none">Receipt</h2>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Official Record</p>
                    </div>
                  </div>

                  <div className="space-y-8 flex-1 text-left">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Transaction ID</p>
                      <p className="text-sm font-bold text-foreground font-mono">#{selectedOrder.id.toUpperCase()}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Order Status</p>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        selectedOrder.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedOrder.status === 'Completed' ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`} />
                        {selectedOrder.status}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Placed On</p>
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <Clock size={14} className="text-primary" />
                        {new Date(selectedOrder.createdAt).toLocaleString('en-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="pt-8 border-t border-dashed border-border/50 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Payment</span>
                        <span className="text-xs font-black text-foreground">{selectedOrder.paymentMethod || 'TNG e-wallet'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fulfillment</span>
                        <span className="text-xs font-black text-foreground">{selectedOrder.deliveryMode || 'Delivery'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-8">
                     <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Info size={10} /> Need Help?
                        </p>
                        <p className="text-[10px] font-medium text-zinc-400">Screenshot this receipt and contact our WhatsApp support.</p>
                     </div>
                  </div>
                </div>

                {/* Right Side: Order Items & Totals */}
                <div className="flex-1 p-8 sm:p-12 overflow-y-auto bg-zinc-50 dark:bg-zinc-900/30">
                  <div className="space-y-8 text-left">
                    {/* Delivery Section */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <MapPin size={12} className="text-primary" /> Delivery Info
                      </h4>
                      <div className="p-5 bg-white dark:bg-black/40 rounded-3xl border border-border shadow-sm">
                        <p className="text-sm font-bold text-foreground leading-relaxed">
                          {selectedOrder.address || 'Self Collect at HQ'}
                        </p>
                        {selectedOrder.notes && (
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Customer Note</p>
                            <p className="text-xs font-medium italic text-zinc-500">"{selectedOrder.notes}"</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Package size={12} className="text-primary" /> Items Purchased
                      </h4>
                      <div className="space-y-2">
                        {selectedOrder.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-4 p-4 bg-white dark:bg-black/20 rounded-3xl border border-border group hover:border-primary/30 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                              <Flame size={20} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-foreground truncate">{item.name}</p>
                              <p className="text-[10px] font-bold text-zinc-500">RM{item.price.toFixed(2)} × {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-foreground">RM{(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Final Billing */}
                    <div className="mt-12 space-y-4">
                      <div className="flex justify-between items-center px-4">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Net Total</span>
                        <span className="text-sm font-black text-foreground">RM {selectedOrder.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center px-4">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Service Fee</span>
                        <span className="text-sm font-black text-foreground">RM 0.00</span>
                      </div>
                      <div className="bg-zinc-900 dark:bg-primary p-8 rounded-[32px] flex justify-between items-center shadow-2xl">
                        <div>
                          <p className="text-[10px] font-black text-primary dark:text-zinc-900 uppercase tracking-[0.2em] mb-1">Total Amount Paid</p>
                          <p className="text-4xl font-black italic text-white dark:text-zinc-900 tracking-tighter">RM {selectedOrder.totalAmount.toFixed(2)}</p>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-white/10 dark:bg-zinc-900/10 flex items-center justify-center">
                          <Check size={32} className="text-primary dark:text-zinc-900" strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}
