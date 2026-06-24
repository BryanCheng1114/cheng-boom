import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
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
 ChevronLeft,
 ChevronsLeft,
 ChevronsRight,
 MoreVertical,
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
 Search,
 Mail,
 Eye,
 EyeOff,
 Home
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useBusiness } from '../context/BusinessContext';

import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { ReceiptTemplate } from '../components/profile/ReceiptTemplate';

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
 const [currentPage, setCurrentPage] = useState(1);
 const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
 
 const ITEMS_PER_PAGE = 8;
 const receiptRef = React.useRef<HTMLDivElement>(null);
 const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

 const handleDownloadReceipt = async () => {
 if (!receiptRef.current || !selectedOrder) return;
 setIsGeneratingPdf(true);
 try {
 const element = receiptRef.current;
 const dataUrl = await toPng(element, {
 cacheBust: true,
 backgroundColor: '#ffffff',
 pixelRatio: 2,
 fontEmbedCSS: '',
 width: element.scrollWidth,
 height: element.scrollHeight
 });
 
 const aspect = element.scrollHeight / element.scrollWidth;
 
 const pdfWidth = 210;
 const pdfHeight = pdfWidth * aspect;
 const pdf = new jsPDF({
 orientation: 'portrait',
 unit: 'mm',
 format: [pdfWidth, pdfHeight]
 });
 pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
 pdf.save(`Receipt_${selectedOrder.id}.pdf`);
 } catch (err) {
 console.error('Failed to generate PDF:', err);
 alert('Failed to generate PDF receipt. Please try again.');
 } finally {
 setIsGeneratingPdf(false);
 }
 };

 const logoutTranslations = {
 title: { en: 'Log Out', zh: '登出', ms: 'Log Keluar' },
 message: { en: 'Are you sure you want to log out from your account?', zh: '您确定要退出您的帐户吗？', ms: 'Adakah anda pasti ingin log keluar dari akaun anda?' },
 confirm: { en: 'Yes, log out', zh: '是的，登出', ms: 'Ya, log keluar' },
 cancel: { en: 'Cancel', zh: '取消', ms: 'Batal' }
 };

 const statusTranslations: Record<string, Record<string, string>> = {
 'All': { en: 'All', zh: '全部', ms: 'Semua' },
 'Completed': { en: 'Completed', zh: '已完成', ms: 'Selesai' },
 'Pending': { en: 'Pending', zh: '待处理', ms: 'Menunggu' },
 'In Process': { en: 'In Process', zh: '处理中', ms: 'Sedang Diproses' },
 'Cancelled': { en: 'Cancelled', zh: '已取消', ms: 'Dibatalkan' },
 'Delivering': { en: 'Delivering', zh: '配送着', ms: 'Sedang Dihantar' }
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
 const [showNewPassword, setShowNewPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);

 const [error, setError] = useState('');
 const [success, setSuccess] = useState('');

 const translatePayment = (payment: string) => {
 if (!payment) return t.profilePage?.notSet || 'Not set';
 const p = payment.toLowerCase();
 if (locale === 'zh') {
 if (p.includes('cod') || p.includes('cash on delivery') || p.includes('cash')) return '货到付款';
 if (p.includes('duitnow') || p.includes('bank') || p.includes('transfer')) return 'DuitNow 及 银行转账';
 }
 return payment;
 };

 const translateOrderMode = (mode: string) => {
 if (!mode) return t.profilePage?.notSet || 'Not set';
 const m = mode.toLowerCase();
 if (locale === 'zh') {
 if (m.includes('self') || m.includes('collect')) return '自取';
 if (m.includes('delivery')) return '配送';
 }
 return mode;
 };

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
 setSuccess(locale === 'zh' ? '个人资料更新成功！' : 'Profile updated successfully!');
 } else {
 setError(locale === 'zh' ? '更新个人资料失败。' : 'Failed to update profile.');
 }
 } catch (err) {
 setError(locale === 'zh' ? '发生错误。' : 'An error occurred.');
 } finally {
 setIsSaving(false);
 }
 };

 const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
 const isPasswordFormValid = passwordRegex.test(passwordForm.newPassword) && passwordForm.newPassword === passwordForm.confirmPassword;

 const handleChangePassword = async (e: React.FormEvent) => {
 e.preventDefault();
 if (passwordForm.newPassword !== passwordForm.confirmPassword) {
 setError(t.login?.passwordsDoNotMatch || (locale === 'zh' ? '密码不匹配。' : 'Passwords do not match.'));
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
 setSuccess(locale === 'zh' ? '密码修改成功！' : 'Password changed successfully!');
 setPasswordForm({ newPassword: '', confirmPassword: '' });
 } else {
 setError(locale === 'zh' ? '修改密码失败。' : 'Failed to change password.');
 }
 } catch (err) {
 setError(locale === 'zh' ? '发生错误。' : 'An error occurred.');
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

 useEffect(() => {
 setCurrentPage(1);
 }, [searchQuery, statusFilter]);

 const filteredOrders = orders.filter((order: any) => {
 const searchLower = searchQuery.toLowerCase();
 const idMatch = order.id.toLowerCase().includes(searchLower);
 const dateMatch = new Date(order.createdAt).toLocaleDateString().toLowerCase().includes(searchLower);
 const matchesSearch = idMatch || dateMatch;
 
 if (statusFilter === 'All') return matchesSearch;
 return matchesSearch && order.status === statusFilter;
 });

 const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
 const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

 if (isLoading || !user) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-zinc-50">
 <Loader2 className="w-10 h-10 text-primary animate-spin" />
 </div>
 );
 }

 return (
 <>
 <Head>
 <title>{`${user.name}'s Profile - Cheng-BOOM`}</title>
 </Head>

 <div className="min-h-screen bg-zinc-50 relative overflow-hidden pb-20 text-left text-zinc-900">


 <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
 
 {/* Header Spacer */}
 <div className="w-full h-8 md:h-12"></div>

 {/* Breadcrumbs */}
 <div className="hidden md:flex items-center gap-2 text-zinc-400 text-sm font-medium mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide pb-2">
            <Link href="/" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
              <Home size={16} />
              {t.nav?.home || (locale === 'zh' ? '主页' : locale === 'ms' ? 'Laman Utama' : 'Home Page')}
            </Link>
            <ChevronRight size={14} className="text-zinc-600" />
            
            {activeTab ? (
              <>
                <button onClick={() => setActiveTab('')} className="hover:text-primary transition-colors">
                  {t.profilePage?.profileDetails || 'Profile Details'}
                </button>
                <ChevronRight size={14} className="text-zinc-600" />
                <span className="text-zinc-900 font-bold">
                  {activeTab === 'edit_profile' ? (t.profilePage?.editProfile || 'Edit Profile') :
                   activeTab === 'change_password' ? (t.profilePage?.changePassword || 'Change Password') :
                   activeTab === 'all_orders' ? (t.profilePage?.myOrders || 'My Orders') :
                   activeTab === 'view_profile' ? (t.profilePage?.myAccount || 'My Account') :
                   activeTab}
                </span>
              </>
            ) : (
              <span className="text-zinc-900 font-bold">{t.profilePage?.profileDetails || 'Profile Details'}</span>
            )}
          </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
 
 {/* Sidebar: Navigation (DJI Style) */}
 <div className="hidden lg:flex lg:col-span-3 flex-col min-h-[500px] bg-white rounded-2xl p-8 shadow-sm border border-zinc-100">
 <div className="flex flex-col flex-1">
 {/* Account Overview Header */}
 <button 
 onClick={() => setActiveTab('')}
 className={`text-left text-sm py-2 mb-6 transition-colors ${activeTab === '' ? 'text-zinc-900 font-medium' : 'text-zinc-400 hover:text-zinc-900'}`}
 >
 <div className="flex items-center gap-3">
 <User size={18} />
 <span className="text-base font-medium">{t.profilePage?.accountOverview || 'Account Overview'}</span>
 </div>
 </button>

 {/* Orders Section */}
 <div className="mb-6">
 <h4 className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3">{t.profilePage?.ordersHeader || 'Orders'}</h4>
 <button 
 onClick={() => setActiveTab('all_orders')}
 className={`flex items-center gap-3 w-full text-left text-sm py-2 transition-colors ${activeTab === 'all_orders' ? 'text-zinc-900 font-medium' : 'text-zinc-400 hover:text-zinc-900'}`}
 >
 <Receipt size={16} /> {t.profilePage?.myOrders || 'My Orders'}
 </button>
 </div>

 {/* Account Settings Section */}
 <div className="mb-6">
 <h4 className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3">{t.profilePage?.accountSettings || 'Account Settings'}</h4>
 <button 
 onClick={() => setActiveTab('edit_profile')}
 className={`flex items-center gap-3 w-full text-left text-sm py-2 transition-colors ${activeTab === 'edit_profile' ? 'text-zinc-900 font-medium' : 'text-zinc-400 hover:text-zinc-900'}`}
 >
 <Edit3 size={16} /> {t.profilePage?.editProfile || 'Edit Profile'}
 </button>
 <button 
 onClick={() => setActiveTab('change_password')}
 className={`flex items-center gap-3 w-full text-left text-sm py-2 transition-colors ${activeTab === 'change_password' ? 'text-zinc-900 font-medium' : 'text-zinc-400 hover:text-zinc-900'}`}
 >
 <Lock size={16} /> {t.profilePage?.changePassword || 'Change Password'}
 </button>
 </div>
 </div>

 {/* Logout Button at bottom */}
 <button 
 onClick={() => setIsLogoutModalOpen(true)}
 className="flex items-center gap-3 text-sm text-zinc-500 hover:text-red-500 transition-colors mt-8 pt-6 border-t border-zinc-200"
 >
 <LogOut size={16} />
 {t.profilePage?.logout || 'Logout'}
 </button>
 </div>

 {/* Main Content */}
 <div className="lg:col-span-9 space-y-8">
 
 <AnimatePresence mode="wait">
 {activeTab === 'edit_profile' && (
 /* ── EDIT PROFILE FORM ────────────────────────────────── */
 <motion.div 
 key="edit"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 className="bg-white rounded-2xl p-4 md:p-8 shadow-sm flex flex-col"
 >
 <div className="flex items-center gap-3 mb-6 shrink-0">
 <button onClick={() => {
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
 }} className="p-2 rounded-xl bg-zinc-500/5 hover:bg-primary/10 text-zinc-500 hover:text-primary transition-colors">
 <ArrowLeft size={18} />
 </button>
 <User size={20} className="text-zinc-400" />
 <h3 className="text-xl font-medium text-zinc-900 ">
 {t.profilePage?.editInformation || 'Edit Information'}
 </h3>
 </div>

 <form onSubmit={handleUpdateProfile} className="space-y-4 flex-1 flex flex-col justify-between">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.fullName || 'Full Name'}</label>
 <input 
 type="text"
 required
 className="w-full px-4 py-2 md:py-2.5 rounded-full bg-zinc-100 border border-zinc-200 focus:bg-zinc-200 focus:border-zinc-300 outline-none transition-all font-medium text-zinc-900 text-sm md:text-base"
 value={editForm.name}
 onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
 />
 </div>
 <div className="space-y-2">
 <div className="flex items-center justify-between ml-1 mb-2">
 <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ">{t.profilePage?.phoneNumber || 'Phone Number'}</label>
 <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1">
 <Shield size={8} /> {t.profilePage?.permanent || 'Permanent'}
 </span>
 </div>
 <input 
 type="tel"
 disabled
 className="w-full px-4 py-2 md:py-2.5 rounded-full bg-zinc-200 border border-zinc-300 outline-none transition-all font-medium text-zinc-500 cursor-not-allowed text-sm md:text-base"
 value={editForm.phone}
 />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.preferredPayment || 'Preferred Payment'}</label>
 <div className="relative">
 <select 
 required
 className="w-full px-4 py-2 md:py-2.5 rounded-full bg-zinc-100 border border-zinc-200 focus:bg-zinc-200 focus:border-zinc-300 outline-none transition-all font-medium appearance-none cursor-pointer text-zinc-900 text-sm md:text-base"
 value={editForm.preferredPayment}
 onChange={(e) => setEditForm({ ...editForm, preferredPayment: e.target.value })}
 >
 <option value="" className="">{t.profilePage?.selectMethod || 'Select Method'}</option>
 <option value="Cash on Delivery" className="">{locale === 'zh' ? '货到付款' : 'Cash on Delivery'}</option>
 <option value="DuitNow & Bank Transfer" className="">{locale === 'zh' ? 'DuitNow 及 银行转账' : 'DuitNow & Bank Transfer'}</option>
 </select>
 <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
 <ChevronDown size={16} />
 </div>
 </div>
 </div>
 <div className="space-y-2">
 <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.orderMode || 'Order Mode'}</label>
 <div className="relative">
 <select 
 required
 className="w-full px-4 py-2 md:py-2.5 rounded-full bg-zinc-100 border border-zinc-200 focus:bg-zinc-200 focus:border-zinc-300 outline-none transition-all font-medium appearance-none cursor-pointer text-zinc-900 text-sm md:text-base"
 value={editForm.orderMode}
 onChange={(e) => setEditForm({ ...editForm, orderMode: e.target.value })}
 >
 <option value="" className="">{t.profilePage?.selectMode || 'Select Mode'}</option>
 <option value="Self Collect" className="">{locale === 'zh' ? '自取' : 'Self Collect'}</option>
 <option value="Delivery" className="">{locale === 'zh' ? '配送' : 'Delivery'}</option>
 </select>
 <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
 <ChevronDown size={16} />
 </div>
 </div>
 </div>
 </div>

 <div className="space-y-2">
 <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.addressLabel || 'Delivery / Collection Address'}</label>
 <textarea 
 required={editForm.orderMode === 'Delivery'}
 className="w-full px-4 py-2 md:py-2.5 rounded-3xl bg-zinc-100 border border-zinc-200 focus:bg-zinc-200 focus:border-zinc-300 outline-none transition-all font-medium resize-none text-zinc-900 text-sm md:text-base"
 rows={2}
 value={editForm.address}
 onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
 />
 </div>

 <div className="space-y-2">
 <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.notesLabel || 'Default Order Notes (Optional)'}</label>
 <input 
 type="text"
 className="w-full px-4 py-2 md:py-2.5 rounded-full bg-zinc-100 border border-zinc-200 focus:bg-zinc-200 focus:border-zinc-300 outline-none transition-all font-medium text-zinc-900 text-sm md:text-base"
 value={editForm.notes}
 onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
 />
 </div>

 <div className="flex flex-row gap-4 pt-6 shrink-0 mt-4">
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
 className="px-6 py-3 bg-zinc-100 text-zinc-500 rounded-full font-medium hover:bg-zinc-200 transition-all flex items-center justify-center shrink-0 whitespace-nowrap"
 >
 {t.profilePage?.discardChanges || 'Discard'}
 </button>
 <button 
 type="submit"
 disabled={isSaving || !hasEditChanges}
 className={`flex-1 py-3 rounded-full font-medium transition-all flex items-center justify-center gap-2 ${
 !hasEditChanges || isSaving
 ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
 : 'bg-yellow-500 text-black hover:bg-yellow-600'
 }`}
 >
 {isSaving ? <Loader2 className="animate-spin" /> : null}
 {t.profilePage?.saveChanges || 'Save Changes'}
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
 className="bg-white rounded-2xl p-4 md:p-8 shadow-sm flex flex-col"
 >
 <div className="flex items-center gap-3 mb-10">
 <button onClick={() => {
 setPasswordForm({ newPassword: '', confirmPassword: '' });
 setShowNewPassword(false);
 setShowConfirmPassword(false);
 setActiveTab('');
 }} className="p-2 rounded-xl bg-zinc-500/5 hover:bg-primary/10 text-zinc-500 hover:text-primary transition-colors">
 <ArrowLeft size={18} />
 </button>
 <Lock size={20} className="text-zinc-400" />
 <h3 className="text-xl font-medium text-zinc-900 ">
 {t.profilePage?.securitySettings || 'Security Settings'}
 </h3>
 </div>

 <form onSubmit={handleChangePassword} className="space-y-6">
 <div className="space-y-2">
 <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.newPassword || 'New Password'}</label>
 <div className="relative">
 <input 
 type={showNewPassword ? 'text' : 'password'}
 required
 minLength={8}
 pattern="^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
 className="w-full px-4 py-2 md:py-2.5 rounded-full bg-zinc-100 border border-zinc-200 focus:bg-zinc-200 focus:border-zinc-300 outline-none transition-all font-medium text-zinc-900 text-sm md:text-base pr-12"
 placeholder="••••••••"
 value={passwordForm.newPassword}
 onInvalid={(e) => {
 const target = e.target as HTMLInputElement;
 target.setCustomValidity('');
 if (target.validity.tooShort || target.validity.patternMismatch) {
 target.setCustomValidity(t.profilePage?.passwordLengthHint || 'Password must be at least 8 characters, and include an uppercase letter, a number, and a symbol.');
 }
 }}
 onChange={(e) => {
 e.target.setCustomValidity('');
 setPasswordForm({ ...passwordForm, newPassword: e.target.value });
 }}
 />
 <button 
 type="button" 
 onClick={() => setShowNewPassword(!showNewPassword)}
 className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 :text-zinc-300 transition-colors"
 >
 {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
 </button>
 </div>
 {passwordForm.newPassword.length > 0 && !passwordRegex.test(passwordForm.newPassword) && (
 <p className="text-[11px] text-red-500 ml-1 mt-1 font-medium">
 {t.profilePage?.passwordLengthHint || 'Password must be at least 8 characters, and include an uppercase letter, a number, and a symbol.'}
 </p>
 )}
 </div>
 <div className="space-y-2">
 <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.confirmNewPassword || 'Confirm New Password'}</label>
 <div className="relative">
 <input 
 type={showConfirmPassword ? 'text' : 'password'}
 required
 className="w-full px-4 py-2 md:py-2.5 rounded-full bg-zinc-100 border border-zinc-200 focus:bg-zinc-200 focus:border-zinc-300 outline-none transition-all font-medium text-zinc-900 text-sm md:text-base pr-12"
 placeholder="••••••••"
 value={passwordForm.confirmPassword}
 onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
 />
 <button 
 type="button" 
 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
 className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 :text-zinc-300 transition-colors"
 >
 {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
 </button>
 </div>
 </div>

 <div className="flex flex-row gap-4 pt-6 mt-4">
 <button 
 type="button"
 onClick={() => {
 setPasswordForm({ newPassword: '', confirmPassword: '' });
 setActiveTab('');
 }}
 className="px-6 py-3 bg-zinc-100 text-zinc-500 rounded-full font-medium hover:bg-zinc-200 transition-all flex items-center justify-center shrink-0 whitespace-nowrap"
 >
 {t.profilePage?.discardChanges || 'Discard'}
 </button>
 <button 
 type="submit"
 disabled={isSaving || !isPasswordFormValid}
 className={`flex-1 py-3 rounded-full font-medium transition-all flex items-center justify-center gap-2 ${
 !isPasswordFormValid || isSaving
 ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
 : 'bg-yellow-500 text-black hover:bg-yellow-600'
 }`}
 >
 {isSaving ? <Loader2 className="animate-spin" /> : null}
 {t.profilePage?.updatePassword || 'Update Password'}
 </button>
 </div>
 </form>
 </motion.div>
 )}

 {activeTab === '' && (
 /* ── DEFAULT DASHBOARD VIEW (DJI Style) ───────────────────────────── */
 <motion.div
 key="default_dashboard"
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 className="flex flex-col gap-6"
 >
 {/* Mobile Dashboard Menu (< lg) */}
 <div className="flex flex-col lg:hidden w-full space-y-4 pb-8">
 <div className="flex flex-col items-center py-6">
 <div className="w-20 h-20 bg-zinc-200 rounded-full flex shrink-0 items-center justify-center text-3xl font-medium text-zinc-400 mb-4">
 {user.name.charAt(0).toUpperCase()}
 </div>
 <h2 className="text-xl font-medium text-zinc-900 mb-2">{user.name}</h2>
 <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm bg-zinc-50 px-4 py-2 rounded-full">
 <Mail size={14} className="opacity-70" />
 <span>{user.email || user.phone || '-'}</span>
 </div>
 </div>

 <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
 <button 
 onClick={() => setActiveTab('view_profile')}
 className="w-full flex items-center justify-between p-4 bg-white border-b border-zinc-100 hover:bg-zinc-50 :bg-white/5 transition-colors"
 >
 <div className="flex items-center gap-3">
 <User size={18} className="text-zinc-500" />
 <span className="text-sm font-medium text-zinc-900 ">{t.profilePage?.myAccount || 'My Account'}</span>
 </div>
 <ChevronRight size={16} className="text-zinc-400" />
 </button>
 <button 
 onClick={() => setActiveTab('all_orders')}
 className="w-full flex items-center justify-between p-4 bg-white hover:bg-zinc-50 :bg-white/5 transition-colors"
 >
 <div className="flex items-center gap-3">
 <Receipt size={18} className="text-zinc-500" />
 <span className="text-sm font-medium text-zinc-900 ">{t.profilePage?.myOrders || 'My Orders'}</span>
 </div>
 <ChevronRight size={16} className="text-zinc-400" />
 </button>
 </div>

 <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
 <button 
 onClick={() => setActiveTab('edit_profile')}
 className="w-full flex items-center justify-between p-4 bg-white border-b border-zinc-100 hover:bg-zinc-50 :bg-white/5 transition-colors"
 >
 <div className="flex items-center gap-3">
 <Edit3 size={18} className="text-zinc-500" />
 <span className="text-sm font-medium text-zinc-900 ">{t.profilePage?.editProfile || 'Edit Profile'}</span>
 </div>
 <ChevronRight size={16} className="text-zinc-400" />
 </button>
 <button 
 onClick={() => setActiveTab('change_password')}
 className="w-full flex items-center justify-between p-4 bg-white hover:bg-zinc-50 :bg-white/5 transition-colors"
 >
 <div className="flex items-center gap-3">
 <Lock size={18} className="text-zinc-500" />
 <span className="text-sm font-medium text-zinc-900 ">{t.profilePage?.changePassword || 'Change Password'}</span>
 </div>
 <ChevronRight size={16} className="text-zinc-400" />
 </button>
 </div>

 <button 
 onClick={() => setIsLogoutModalOpen(true)}
 className="w-full flex items-center justify-center p-4 bg-white rounded-2xl shadow-sm text-red-500 font-medium hover:bg-zinc-50 :bg-white/5 transition-colors mt-4"
 >
 {t.profilePage?.logout || 'Log Out'}
 </button>
 </div>

 {/* Desktop Dashboard View (lg and up) */}
 <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 gap-6">
 
 {/* Left: Profile Info */}
 <div className="bg-white rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
 <div className="w-20 h-20 bg-zinc-200 rounded-full flex shrink-0 items-center justify-center text-3xl font-medium text-zinc-400 ">
 {user.name.charAt(0).toUpperCase()}
 </div>
 <div className="flex flex-col text-center md:text-left">
 <h2 className="text-xl font-medium text-zinc-900 mb-2">{user.name}</h2>
 <div className="flex items-center justify-center md:justify-start gap-2 text-zinc-500 text-sm mb-4">
 <Mail size={14} className="opacity-70" />
 <span>{user.email || user.phone || '-'}</span>
 </div>
 <button 
 onClick={() => setActiveTab('view_profile')}
 className="text-zinc-900 hover:text-zinc-600 underline text-sm font-medium transition-colors flex items-center gap-1 justify-center md:justify-start"
 >
 {t.profilePage?.myAccount || 'My Account'} <ChevronRight size={14} />
 </button>
 </div>
 </div>

 {/* Right: Stats Info */}
 <div className="bg-white rounded-2xl p-8 flex flex-col justify-center shadow-sm">
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <p className="text-sm text-zinc-500 ">{t.profilePage?.totalOrders || 'Total Orders'}</p>
 <p className="text-2xl font-bold text-zinc-900 ">{orders.length}</p>
 </div>
 <div className="h-px bg-zinc-200 w-full" />
 <div className="flex items-center justify-between">
 <p className="text-sm text-zinc-500 ">{t.profilePage?.lifetimeInvestment || 'Total Spent'}</p>
 <p className="text-2xl font-bold text-zinc-900 ">RM {totalSpend.toFixed(2)}</p>
 </div>
 </div>
 </div>

 </div>

 {/* Bottom Section: Recent Orders */}
 <div className="hidden lg:flex bg-white rounded-2xl p-8 shadow-sm min-h-[400px] flex-col mt-4">
 <h3 className="text-xl font-medium text-zinc-900 mb-8">
 {t.profilePage?.recentOrders || 'Recent Orders'}
 </h3>

 {orders.length === 0 ? (
 <div className="flex-1 flex flex-col items-center justify-center text-center">
 <div className="w-24 h-24 bg-zinc-100 rounded-lg flex items-center justify-center mb-6">
 <Receipt size={48} className="text-zinc-300 " strokeWidth={1} />
 </div>
 <p className="text-lg text-zinc-800 font-medium mb-8">{t.profilePage?.noOrdersYet || 'No orders'}</p>
 <button 
 onClick={() => router.push('/shop')}
 className="bg-white border border-zinc-200 hover:bg-zinc-50 text-black px-8 py-3 rounded-full font-bold transition-colors shadow-sm"
 >
 {t.shop?.returnToShop || 'Shop Now'}
 </button>
 </div>
 ) : (
 <div className="space-y-4">
 {orders.slice(0, 3).map((order: any) => (
 <div 
 key={order.id}
 onClick={() => setSelectedOrder(order)}
 className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-zinc-50 :bg-white/5 transition-colors cursor-pointer border border-zinc-100 "
 >
 <div className="flex items-center gap-4 text-left">
 <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400">
 <ShoppingBag size={18} />
 </div>
 <div>
 <div className="text-sm text-zinc-900 font-medium">{t.profilePage?.orderHash || 'Order #'} {order.id}</div>
 <div className="text-xs text-zinc-500 mt-1">{new Date(order.createdAt).toLocaleDateString()}</div>
 </div>
 </div>
 <div className="flex items-center gap-6">
 <div className="text-right">
 <div className="text-sm text-zinc-900 font-medium">RM {order.totalAmount.toFixed(2)}</div>
 <div className={`text-xs mt-1 ${order.status === 'Completed' ? 'text-green-500' : 'text-zinc-500'}`}>
 {statusTranslations[order.status as string]?.[locale as string] || order.status}
 </div>
 </div>
 <ChevronRight size={16} className="text-zinc-400" />
 </div>
 </div>
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
 <div className="bg-white rounded-2xl p-4 md:p-8 shadow-sm">
 <div className="flex items-center gap-3 mb-6 md:mb-8">
 <button onClick={() => setActiveTab('')} className="p-2 rounded-xl bg-zinc-500/5 hover:bg-primary/10 text-zinc-500 hover:text-primary transition-colors">
 <ArrowLeft size={18} />
 </button>
 <User size={20} className="text-zinc-400" />
 <h3 className="text-xl font-medium text-zinc-900 ">
 {t.profilePage?.viewMyAccount || 'My Account'}
 </h3>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
 <div className="space-y-1.5 md:space-y-2">
 <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.fullName || 'Full Name'}</label>
 <p className="px-4 py-2 md:py-2.5 rounded-full bg-zinc-100 border border-zinc-200 font-medium text-zinc-900 text-sm md:text-base">
 {user.name || '-'}
 </p>
 </div>
 <div className="space-y-1.5 md:space-y-2">
 <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.phoneNumber || 'Phone Number'}</label>
 <p className="px-4 py-2 md:py-2.5 rounded-full bg-zinc-100 border border-zinc-200 font-medium text-zinc-900 text-sm md:text-base">
 {user.phone || '-'}
 </p>
 </div>
 <div className="space-y-1.5 md:space-y-2">
 <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.preferredPayment || 'Preferred Payment'}</label>
 <p className="px-4 py-2 md:py-2.5 rounded-full bg-zinc-100 border border-zinc-200 font-medium text-yellow-600 text-sm md:text-base">
 {translatePayment(user.preferredPayment)}
 </p>
 </div>
 <div className="space-y-1.5 md:space-y-2">
 <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.orderMode || 'Order Mode'}</label>
 <p className="px-4 py-2 md:py-2.5 rounded-full bg-zinc-100 border border-zinc-200 font-medium text-yellow-600 text-sm md:text-base">
 {translateOrderMode(user.orderMode)}
 </p>
 </div>
 </div>
 
 <div className="space-y-1.5 md:space-y-2 mt-4 md:mt-8">
 <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.addressLabel || 'Delivery / Collection Address'}</label>
 <p className="px-4 py-2 md:py-2.5 rounded-3xl bg-zinc-100 border border-zinc-200 font-medium text-zinc-900 min-h-[80px] md:min-h-[100px] whitespace-pre-wrap text-sm md:text-base">
 {user.address || '-'}
 </p>
 </div>
 <div className="space-y-1.5 md:space-y-2 mt-4 md:mt-8">
 <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.notesLabel || 'Default Order Notes (Optional)'}</label>
 <p className="px-4 py-2 md:py-2.5 rounded-3xl bg-zinc-100 border border-zinc-200 font-medium text-zinc-900 min-h-[60px] whitespace-pre-wrap text-sm md:text-base">
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
 <div className="bg-white rounded-2xl p-4 md:p-8 shadow-sm lg:h-[700px] flex flex-col">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8 shrink-0">
 <div className="flex items-center gap-3">
 <button onClick={() => setActiveTab('')} className="p-2 rounded-xl bg-zinc-500/5 hover:bg-primary/10 text-zinc-500 hover:text-primary transition-colors">
 <ArrowLeft size={18} />
 </button>
 <Package size={20} className="text-zinc-400" />
 <h3 className="text-xl font-medium text-zinc-900 ">
 {t.profilePage?.myOrders || 'My Orders'}
 </h3>
 </div>
 <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
 <div className="relative flex-1 sm:flex-none">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Search size={16} className="text-zinc-400" />
 </div>
 <input
 type="text"
 placeholder={searchPlaceholderTranslations[locale as string] || searchPlaceholderTranslations.en}
 className="w-full sm:w-64 pl-10 pr-10 py-3 rounded-xl bg-zinc-50 font-medium text-sm text-zinc-900 outline-none min-w-0 text-ellipsis"
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

 <div className="relative shrink-0">
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="px-4 py-3 rounded-xl bg-zinc-50 font-medium text-sm text-zinc-900 cursor-pointer appearance-none outline-none text-center"
 style={{ textAlignLast: 'center' }}
 >
 <option value="All" className="bg-white text-zinc-900 ">{statusTranslations['All']?.[locale as string] || statusTranslations['All'].en}</option>
 <option value="Completed" className="bg-white text-zinc-900 ">{statusTranslations['Completed']?.[locale as string] || statusTranslations['Completed'].en}</option>
 <option value="Pending" className="bg-white text-zinc-900 ">{statusTranslations['Pending']?.[locale as string] || statusTranslations['Pending'].en}</option>
 <option value="In Process" className="bg-white text-zinc-900 ">{statusTranslations['In Process']?.[locale as string] || statusTranslations['In Process'].en}</option>
 <option value="Cancelled" className="bg-white text-zinc-900 ">{statusTranslations['Cancelled']?.[locale as string] || statusTranslations['Cancelled'].en}</option>
 </select>
 </div>
 </div>
 </div>

 {filteredOrders.length === 0 ? (
 <div className="flex-1 flex flex-col items-center justify-center text-center min-h-[400px]">
 <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-300 ">
 {searchQuery ? <Search size={40} strokeWidth={1.5} /> : <Package size={40} strokeWidth={1.5} />}
 </div>
 <p className="text-lg font-medium text-zinc-500 max-w-sm mx-auto">
 {searchQuery ? (noOrdersSearchTranslations[locale as string] || noOrdersSearchTranslations.en) : (t.profilePage?.noOrdersYet || "You haven't placed any orders yet.")}
 </p>
 </div>
 ) : (
 <div className="space-y-4 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 min-h-0">
 {paginatedOrders.map((order: any) => (
 <div 
 key={order.id}
 onClick={() => setSelectedOrder(order)}
 className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-zinc-50 :bg-white/5 transition-colors cursor-pointer border border-zinc-100 "
 >
 <div className="flex items-center gap-3 md:gap-4 text-left">
 <div className="hidden md:flex w-10 h-10 rounded-lg bg-zinc-100 items-center justify-center text-zinc-400">
 <ShoppingBag size={18} />
 </div>
 <div>
 <div className="text-sm text-zinc-900 font-medium">
 <span className="md:hidden">{t.profilePage?.orderHash || 'Order #'} {order.id.substring(0, 6).toUpperCase()}</span>
 <span className="hidden md:inline">{t.profilePage?.orderHash || 'Order #'} {order.id}</span>
 </div>
 <div className="text-xs text-zinc-500 mt-1">{new Date(order.createdAt).toLocaleDateString()}</div>
 </div>
 </div>
 <div className="flex items-center gap-3 md:gap-6">
 <div className="text-right">
 <div className="text-sm text-zinc-900 font-medium">RM {order.totalAmount.toFixed(2)}</div>
 <div className={`text-[10px] md:text-xs mt-1 ${order.status === 'Completed' ? 'text-green-500' : 'text-zinc-500'}`}>
 {statusTranslations[order.status as string]?.[locale as string] || order.status}
 </div>
 </div>
 <ChevronRight size={16} className="text-zinc-400" />
 </div>
 </div>
 ))}
 
 {/* Pagination Controls */}
 {totalPages > 1 && (
 <div className="flex items-center justify-center gap-2 mt-8 pt-4 pb-4 border-t border-zinc-100 ">
 <button
 onClick={() => setCurrentPage(1)}
 disabled={currentPage === 1}
 className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 :bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-zinc-500 "
 >
 <ChevronsLeft size={16} />
 </button>
 <button
 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 :bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-zinc-500 "
 >
 <ChevronLeft size={16} />
 </button>
 <span className="text-sm font-medium text-zinc-500 px-4">
 {currentPage} / {totalPages}
 </span>
 <button
 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
 disabled={currentPage === totalPages}
 className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 :bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-zinc-500 "
 >
 <ChevronRight size={16} />
 </button>
 <button
 onClick={() => setCurrentPage(totalPages)}
 disabled={currentPage === totalPages}
 className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 :bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-zinc-500 "
 >
 <ChevronsRight size={16} />
 </button>
 </div>
 )}
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
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 lg:p-8">
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
 
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20 }} 
 animate={{ opacity: 1, scale: 1, y: 0 }} 
 exit={{ opacity: 0, scale: 0.95, y: 20 }} 
 className="relative w-full h-full md:h-auto max-w-5xl bg-[#121212] md:bg-zinc-50 md: rounded-none md:rounded-[48px] shadow-2xl overflow-y-auto md:overflow-hidden border-0 md:border border-zinc-200 flex flex-col md:flex-row max-h-none md:max-h-[90vh] lg:max-h-[85vh]"
 >
 {/* Mobile Header */}
 <div className="md:hidden sticky top-0 z-50 flex items-center px-4 py-4 bg-[#121212] border-b border-white/5">
 <button onClick={() => setSelectedOrder(null)} className="p-2 -ml-2 text-white absolute left-4">
 <ArrowLeft size={24} />
 </button>
 <h2 className="text-lg font-bold text-white w-full text-center">{t.profilePage?.orderDetails || 'Order Details'}</h2>
 </div>

 {/* Close Button (Desktop Only) */}
 <button data-html2canvas-ignore="true" onClick={() => setSelectedOrder(null)} className="hidden md:block absolute top-6 right-6 md:top-8 md:right-8 p-3 rounded-full bg-black/5 hover:bg-black/10 :bg-white/20 text-zinc-600 hover:text-zinc-900 :text-white transition-all z-30 backdrop-blur-md">
 <X size={20} strokeWidth={3} />
 </button>

 {/* Left Side: Order Info */}
 <div className="w-full md:w-1/2 lg:w-[55%] shrink-0 md:shrink bg-[#121212] md:bg-zinc-100/50 md: p-4 md:p-10 lg:p-12 flex flex-col border-b-0 md:border-b-0 md:border-r border-zinc-200 md:overflow-y-auto md:custom-scrollbar relative md:min-h-0">
 
 {/* Order ID & Tag (Card on Mobile) */}
 <div className="bg-[#1c1c1e] md:bg-transparent rounded-3xl md:rounded-none p-5 md:p-0 mb-4 md:mb-8 w-full min-w-0 shrink-0">
 <div className="space-y-2 mb-8 mt-0 w-full min-w-0">
 <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">{t.profilePage?.orderId || 'Order ID'}</p>
 <div className="flex items-center gap-3 w-full min-w-0">
 <h2 className="text-lg sm:text-2xl font-black text-zinc-900 tracking-tight truncate flex-1" title={selectedOrder.id.toUpperCase()}>#{selectedOrder.id.toUpperCase()}</h2>
 <button 
 onClick={() => {
 navigator.clipboard.writeText(selectedOrder.id.toUpperCase());
 alert('Order ID copied!');
 }} 
 className="text-zinc-400 hover:text-zinc-900 :text-white transition-colors shrink-0 mt-1 bg-white/5 p-2 rounded-lg md:bg-transparent md:p-0"
 >
 <Copy size={16} />
 </button>
 </div>
 </div>

 {/* Progress Tracker */}
 <div className="w-full relative">
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
 <p className="text-red-600 font-bold">{statusTranslations['Cancelled']?.[locale as string] || 'Cancelled'}</p>
 </div>
 );
 }

 return (
 <div className="relative flex justify-between items-start w-full px-2">
 {/* Connecting Line background */}
 <div className="absolute top-[18px] left-6 right-6 h-0.5 bg-zinc-200 -z-10" />
 
 {/* Active Line foreground */}
 <div 
 className="absolute top-[18px] left-6 h-0.5 bg-orange-500 transition-all duration-500 -z-10" 
 style={{ width: `calc(${currentStageIdx >= 0 ? (currentStageIdx / (stages.length - 1)) * 100 : 0}% - 48px)` }}
 />

 {stages.map((stage, idx) => {
 const isPast = currentStageIdx >= idx;
 const isCurrent = currentStageIdx === idx;
 return (
 <div key={idx} className="flex flex-col items-center z-10 relative w-12">
 <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center border-[3px] transition-all duration-300 ${
 isPast 
 ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30' 
 : 'bg-zinc-100 border-zinc-200 text-zinc-400'
 }`}>
 {stage.icon}
 </div>
 <div className="text-center mt-2 whitespace-nowrap">
 <p className={`text-[10px] font-bold ${isCurrent ? 'text-orange-600 ' : isPast ? 'text-zinc-900 ' : 'text-zinc-400'}`}>
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
 </div>

 {/* Order Info List */}
 <div className="bg-[#1c1c1e] md:bg-transparent rounded-3xl md:rounded-none p-5 md:p-0 space-y-6 md:mt-8 md:pt-8 md:border-t border-zinc-200 text-left shrink-0">
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-3 text-zinc-500 ">
 <Calendar size={16} />
 <span className="text-xs font-bold">{t.profilePage?.placedOn || 'Order Placed'}</span>
 </div>
 <span className="text-sm font-black text-zinc-900 ">
 {new Date(selectedOrder.createdAt).toLocaleString('en-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>

 <div className="flex justify-between items-center">
 <div className="flex items-center gap-3 text-zinc-500 ">
 <CreditCard size={16} />
 <span className="text-xs font-bold">{t.profilePage?.payment || 'Payment Method'}</span>
 </div>
 <span className="text-sm font-black text-zinc-900 ">{translatePayment(selectedOrder.paymentMethod)}</span>
 </div>

 <div className="flex justify-between items-center">
 <div className="flex items-center gap-3 text-zinc-500 ">
 <MapPin size={16} />
 <span className="text-xs font-bold">{t.profilePage?.fulfillment || 'Fulfillment Method'}</span>
 </div>
 <span className="text-sm font-black text-zinc-900 ">{translateOrderMode(selectedOrder.deliveryMode)}</span>
 </div>

 <div className="flex justify-between items-center">
 <div className="flex items-center gap-3 text-zinc-500 ">
 <Info size={16} />
 <span className="text-xs font-bold">{t.profilePage?.orderStatus || 'Order Status'}</span>
 </div>
 <span className="text-sm font-black text-orange-500">
 {statusTranslations[selectedOrder.status as string]?.[locale as string] || selectedOrder.status}
 </span>
 </div>

 <div className="hidden md:block pt-6 border-t border-zinc-200 mt-6">
 <button 
 onClick={handleDownloadReceipt}
 disabled={isGeneratingPdf}
 className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-black font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
 >
 {isGeneratingPdf ? <Loader2 className="animate-spin" size={18} /> : <Receipt size={18} />}
 {isGeneratingPdf ? (t.profilePage?.generatingPdf || 'Generating PDF...') : (t.profilePage?.downloadReceipt || 'Download Receipt')}
 </button>
 </div>
 </div>

 </div>

 {/* Right Side: Order Items */}
 <div className="w-full md:w-1/2 lg:w-[45%] shrink-0 md:shrink bg-[#121212] md:bg-white md: px-4 pb-4 md:p-6 sm:md:p-10 lg:p-12 flex flex-col md:min-h-0 relative">
 
 {/* Card 3: Order Items */}
 <div className="bg-[#1c1c1e] md:bg-transparent rounded-3xl md:rounded-none p-5 md:p-0 mb-4 md:mb-0 flex flex-col shrink-0 md:flex-1 md:min-h-0">
 <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-6 md:mb-8 shrink-0">
 {t.profilePage?.orderItems || 'Order Items'}
 </h3>

 {/* Items List */}
 <div className="space-y-0 shrink-0 md:flex-1 md:overflow-y-auto md:custom-scrollbar pr-0 md:pr-2 md:min-h-0">
 {selectedOrder.items?.map((item: any, idx: number) => (
 <div key={idx} className="flex items-center justify-between py-5 border-b border-white/5 last:border-0">
 <div className="flex-1 min-w-0 pr-6">
 <p className="text-sm font-bold text-zinc-900 line-clamp-2 leading-relaxed">{locale === 'zh' && item.nameZh ? item.nameZh : item.name}</p>
 </div>
 <div className="text-right shrink-0">
 <p className="text-base font-black text-zinc-900 ">RM {item.price.toFixed(2)}</p>
 <p className="text-xs font-medium text-zinc-500 mt-1.5">Qty: {item.quantity}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Card 4: Billing Summary */}
 <div className="bg-[#1c1c1e] md:bg-transparent rounded-3xl md:rounded-none p-5 md:p-0 mt-0 md:mt-8 md:pt-8 md:border-t border-zinc-200 space-y-3 shrink-0">
 <div className="flex justify-between items-center">
 <span className="text-sm font-bold text-zinc-500">{t.profilePage?.subtotalLabel || 'Subtotal'}</span>
 <span className="text-sm font-bold text-zinc-900 ">RM {
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
 <span className="text-sm font-bold text-zinc-900 ">RM 0.00</span>
 </div>

 <div className="flex justify-between items-center pt-6 mt-4 border-t border-dashed border-zinc-200 ">
 <span className="text-base font-black text-zinc-900 ">{t.profilePage?.totalAmountPaid || 'Total Amount Paid'}</span>
 <span className="text-2xl sm:text-3xl font-black text-orange-500 tracking-tighter">
 RM {selectedOrder.totalAmount.toFixed(2)}
 </span>
 </div>
 </div>

 {/* Mobile Download Receipt Button */}
 <div className="md:hidden mt-8 mb-8 shrink-0">
 <button 
 onClick={handleDownloadReceipt}
 disabled={isGeneratingPdf}
 className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-zinc-50 border border-zinc-200 text-black font-black rounded-full shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isGeneratingPdf ? <Loader2 className="animate-spin" size={18} /> : <Receipt size={18} />}
 {isGeneratingPdf ? (t.profilePage?.generatingPdf || 'Generating PDF...') : (t.profilePage?.downloadReceipt || 'Download Receipt')}
 </button>
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
 className="bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
 >
 <div className="flex justify-between items-center p-6 border-b border-zinc-100 ">
 <h3 className="text-lg font-black text-zinc-900">
 {logoutTranslations.title[locale as 'en' | 'zh' | 'ms'] || logoutTranslations.title.en}
 </h3>
 <button 
 onClick={() => setIsLogoutModalOpen(false)}
 className="text-zinc-400 hover:text-zinc-900 transition-colors p-1"
 >
 <X size={20} />
 </button>
 </div>
 
 <div className="p-6">
 <p className="text-zinc-600 font-medium">
 {logoutTranslations.message[locale as 'en' | 'zh' | 'ms'] || logoutTranslations.message.en}
 </p>
 
 <div className="mt-8 flex gap-3">
 <button
 onClick={() => setIsLogoutModalOpen(false)}
 className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-zinc-100 hover:bg-zinc-200 :bg-zinc-700 text-zinc-900 transition-colors"
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

 {/* Hidden Receipt Template for PDF Generation */}
 {selectedOrder && (
 <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', zIndex: -100 }}>
 <ReceiptTemplate 
 ref={receiptRef} 
 order={selectedOrder} 
 businessSettings={settings} 
 user={user} 
 />
 </div>
 )}
 {/* Success/Error Notification Modal */}
 <AnimatePresence>
 {(success || error) && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
 >
 <motion.div
 initial={{ scale: 0.95, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 exit={{ scale: 0.95, opacity: 0 }}
 className="bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
 >
 <div className="p-8 text-center flex flex-col items-center">
 <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${success ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
 {success ? <Check size={32} /> : <X size={32} />}
 </div>
 <h3 className="text-xl font-black text-zinc-900 mb-2">
 {success ? (locale === 'zh' ? '成功！' : 'Success!') : (locale === 'zh' ? '错误！' : 'Error!')}
 </h3>
 <p className="text-zinc-600 font-medium text-sm md:text-base mb-8">
 {success || error}
 </p>
 <button
 onClick={() => {
 setSuccess('');
 setError('');
 }}
 className="w-full py-4 rounded-full font-bold text-sm md:text-base bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-colors"
 >
 {locale === 'zh' ? '关闭' : 'Close'}
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 </div>
 </>
 );
}
