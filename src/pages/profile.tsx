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
 Globe2,
 Eye,
 EyeOff,
 Home
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useBusiness } from '../context/BusinessContext';

import { jsPDF } from 'jspdf';

export default function ProfilePage() {
 const router = useRouter();
 const { t, locale } = useTranslation();
 const { settings } = useBusiness();
 const { clearCart } = useCart();
 const [user, setUser] = useState<any>(null);
 const [orders, setOrders] = useState<any[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [profileLoadError, setProfileLoadError] = useState('');
 const [activeTab, setActiveTab] = useState<string>('');
 const [isSaving, setIsSaving] = useState(false);
 const [selectedOrder, setSelectedOrder] = useState<any>(null);
 const [searchQuery, setSearchQuery] = useState('');
 const [statusFilter, setStatusFilter] = useState('All');
 const [currentPage, setCurrentPage] = useState(1);
 const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
 const [isLanguagePickerOpen, setIsLanguagePickerOpen] = useState(false);
 
 const ITEMS_PER_PAGE = 8;
 const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

 const handleDownloadReceipt = async () => {
 if (!selectedOrder || selectedOrder.status === 'Cancelled') return;
 setIsGeneratingPdf(true);
 try {
 const { default: autoTable } = await import('jspdf-autotable');
 const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
 const pageWidth = pdf.internal.pageSize.getWidth();
 const left = 10;
 const right = pageWidth - 10;
 const businessName = settings?.businessName || 'CHENG-BOOM';
 const createdAt = new Date(selectedOrder.createdAt);
 const date = createdAt.toLocaleDateString('en-MY', { year: 'numeric', month: '2-digit', day: '2-digit' });
 const compactDate = `${String(createdAt.getFullYear()).slice(-2)}${String(createdAt.getMonth() + 1).padStart(2, '0')}${String(createdAt.getDate()).padStart(2, '0')}`;
 const orderNumber = `CB-${compactDate}-${String(selectedOrder.id).slice(-6).toUpperCase()}`;
 const time = createdAt.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true });
 const address = /self|collect/i.test(`${selectedOrder.deliveryMode || ''} ${selectedOrder.address || ''} ${selectedOrder.customer?.address || ''}`)
 ? 'Self Collect' : (selectedOrder.address || selectedOrder.customer?.address || '');

 let watermarkData: string | null = null;
 let watermarkWidth = 0;
 let watermarkHeight = 0;
 if (settings?.logoUrl) {
  try {
   const response = await fetch(settings.logoUrl);
   if (response.ok) {
    const bitmap = await createImageBitmap(await response.blob());
    const colorCanvas = document.createElement('canvas'); colorCanvas.width = bitmap.width; colorCanvas.height = bitmap.height;
    colorCanvas.getContext('2d')?.drawImage(bitmap, 0, 0);
    const headerScale = Math.min(24 / bitmap.width, 16 / bitmap.height);
    pdf.addImage(colorCanvas.toDataURL('image/png'), 'PNG', (pageWidth - bitmap.width * headerScale) / 2, 4 + (16 - bitmap.height * headerScale) / 2, bitmap.width * headerScale, bitmap.height * headerScale);
    const watermarkCanvas = document.createElement('canvas'); watermarkCanvas.width = bitmap.width; watermarkCanvas.height = bitmap.height;
    const context = watermarkCanvas.getContext('2d');
    if (context) { context.filter = 'grayscale(100%)'; context.drawImage(bitmap, 0, 0); }
    watermarkData = watermarkCanvas.toDataURL('image/png');
    const watermarkScale = Math.min(70 / bitmap.width, 70 / bitmap.height);
    watermarkWidth = bitmap.width * watermarkScale;
    watermarkHeight = bitmap.height * watermarkScale;
    bitmap.close();
   }
  } catch (error) { console.warn('Business logo could not be added to the receipt:', error); }
 }
 pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15); pdf.text(String(businessName).toUpperCase(), pageWidth / 2, 32, { align: 'center' });
 pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
 let headerY = 38;
 const businessAddress = settings?.address?.trim() || '';
 if (businessAddress) { const lines = pdf.splitTextToSize(businessAddress, right - left); pdf.text(lines, pageWidth / 2, headerY, { align: 'center' }); headerY += lines.length * 4; }
 const contact = [settings?.phone?.trim() ? `Tel: ${settings.phone.trim()}` : '', settings?.email?.trim() ? `Email: ${settings.email.trim()}` : ''].filter(Boolean).join('   ');
 if (contact) { pdf.text(contact, pageWidth / 2, headerY, { align: 'center' }); headerY += 5; }
 pdf.setDrawColor(130); const dividerY = headerY + 1; pdf.line(left, dividerY, right, dividerY);
 pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); const titleY = dividerY + 8; pdf.text('Sales Order', pageWidth / 2, titleY, { align: 'center' });
 pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
 const detailsTop = titleY + 8; const gap = 6; const colWidth = (right - left - gap * 2) / 3;
 const middleX = left + colWidth + gap; const rightX = middleX + colWidth + gap;
 const billLines = pdf.splitTextToSize(`Bill to:\n${address}`, colWidth);
 const shipLines = pdf.splitTextToSize(`Ship to:\n${address}`, colWidth);
 const buyerLines = pdf.splitTextToSize(`Order No: ${orderNumber}\nDate: ${date}\nTime: ${time}\nBuyer: ${selectedOrder.customer?.name || user?.name || ''}\nPhone: ${selectedOrder.customer?.phone || user?.phone || ''}\nStatus: ${selectedOrder.status || 'Pending'}`, colWidth);
 pdf.text(billLines, left, detailsTop); pdf.text(shipLines, middleX, detailsTop); pdf.text(buyerLines, rightX, detailsTop);
 const tableTop = detailsTop + Math.max(billLines.length, shipLines.length, buyerLines.length) * 4 + 7;
 const rows = (selectedOrder.items || []).map((item: any, index: number) => [String(index + 1), item.code || '-', item.name || '-', String(item.quantity || 0), item.variant === 'Box' || item.variant === 'Bundle' ? item.variant : 'Single', (Number(item.price) || 0).toFixed(2), '', ((Number(item.price) || 0) * (Number(item.quantity) || 0)).toFixed(2)]);
 autoTable(pdf, { startY: tableTop, head: [['No.', 'Item Code', 'Item Name', 'QTY', 'UOM', 'Price (RM)', 'Disc (Promo)', 'Amount (RM)']], body: rows, theme: 'plain', margin: { left, right: 10, bottom: 42 }, styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.2, textColor: 25, overflow: 'linebreak' }, headStyles: { fontStyle: 'bold', fillColor: [255,255,255], textColor: 20, lineWidth: { bottom: 0.3 }, lineColor: [100,100,100] }, columnStyles: { 0: { cellWidth: 12, minCellWidth: 12 }, 1: { cellWidth: 25 }, 2: { cellWidth: 'auto' }, 3: { cellWidth: 12, halign: 'right' }, 4: { cellWidth: 14 }, 5: { cellWidth: 18, halign: 'right' }, 6: { cellWidth: 20, halign: 'right' }, 7: { cellWidth: 21, halign: 'right' } } });
 const finalY = (pdf as any).lastAutoTable?.finalY || tableTop; const pageHeight = pdf.internal.pageSize.getHeight(); let totalsY = finalY + 10;
 if (totalsY > pageHeight - 42) { pdf.addPage(); totalsY = 20; }
 const subtotal = rows.reduce((sum: number, row: any[]) => sum + Number(row[7] || 0), 0);
 pdf.setDrawColor(130); pdf.line(left, totalsY - 4, right, totalsY - 4); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.text(`Subtotal (RM):  ${subtotal.toFixed(2)}`, right, totalsY + 2, { align: 'right' });
 pdf.setFont('helvetica', 'bold'); pdf.text(`Grand Total (RM):  ${Number(selectedOrder.totalAmount || 0).toFixed(2)}`, right, totalsY + 12, { align: 'right' });
 pdf.setFont('helvetica', 'normal'); pdf.text('Signature: ______________________________', left, pageHeight - 21);
 const pageCount = pdf.getNumberOfPages(); for (let page = 1; page <= pageCount; page++) { pdf.setPage(page); if (watermarkData) { const pageHeight = pdf.internal.pageSize.getHeight(); pdf.setGState(pdf.GState({ opacity: 0.08 })); pdf.addImage(watermarkData, 'PNG', (pageWidth - watermarkWidth) / 2, (pageHeight - watermarkHeight) / 2, watermarkWidth, watermarkHeight); pdf.setGState(pdf.GState({ opacity: 1 })); } pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text(`Page ${page}:${pageCount}`, pageWidth / 2, pdf.internal.pageSize.getHeight() - 8, { align: 'center' }); }
 pdf.save(`Receipt_${orderNumber}.pdf`);
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

 useEffect(() => {
  if (!router.isReady) return;
  const isOrdersTab = router.query.tab === 'orders';
  setActiveTab(isOrdersTab ? 'all_orders' : '');
  if (!isOrdersTab) setSelectedOrder(null);
 }, [router.isReady, router.query.tab]);

 const fetchProfile = async () => {
 try {
 const savedUser = localStorage.getItem('user');
 if (!savedUser) {
 router.replace('/login');
 return;
 }

 const { id } = JSON.parse(savedUser);
 if (!id || typeof id !== 'string') {
 localStorage.removeItem('user');
 localStorage.removeItem('user_role');
 window.dispatchEvent(new Event('user-updated'));
 router.replace('/login');
 return;
 }

 const res = await fetch(`/api/customers/${id}`);
 const data = await res.json().catch(() => null);
 if (!res.ok) {
 if (res.status === 404) {
 localStorage.removeItem('user');
 localStorage.removeItem('user_role');
 window.dispatchEvent(new Event('user-updated'));
 router.replace('/login');
 return;
 }
 throw new Error(data?.error || 'Unable to load your account. Please try again.');
 }

 if (data) {
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
 } else {
 throw new Error('Unable to load your account. Please try again.');
 }
 } catch (err) {
 console.error('Failed to fetch profile:', err);
 setProfileLoadError(err instanceof Error ? err.message : 'Unable to load your account. Please try again.');
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

 const updateData: any = { ...editForm };
 if (user?.phone) {
   delete updateData.phone;
 }

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
  const errData = await res.json().catch(() => ({}));
  if (errData.error === 'Phone number is already in use by another account.') {
    setError(locale === 'zh' ? '该电话号码已被其他帐户使用。' : 'Phone number is already in use by another account.');
  } else {
    setError(errData.error || (locale === 'zh' ? '更新个人资料失败。' : 'Failed to update profile.'));
  }
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

 if (isLoading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-zinc-50">
 <Loader2 className="w-10 h-10 text-primary animate-spin" />
 </div>
 );
 }

 if (!user) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
 <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
 <h1 className="text-lg font-bold text-zinc-900">Unable to load your profile</h1>
 <p className="mt-2 text-sm text-zinc-500">{profileLoadError || 'Please sign in again to continue.'}</p>
 <Link href="/login" className="mt-5 inline-flex rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white">Sign in</Link>
 </div>
 </div>
 );
 }

 return (
 <>
 <Head>
 <title>{`${user.name}'s Profile - Cheng-BOOM`}</title>
 </Head>

 {activeTab === 'all_orders' && !selectedOrder && (
  <div
   className="fixed inset-x-0 top-0 z-[120] flex items-center justify-center px-4 text-center text-white shadow-md"
   style={{
    height: 'calc(56px + env(safe-area-inset-top, 0px))',
    paddingTop: 'env(safe-area-inset-top, 0px)',
    boxSizing: 'border-box',
    background: 'linear-gradient(145deg, #e23a2b 0%, #d52b20 52%, #b51f26 100%)',
   }}
  >
   <span className="text-base font-semibold tracking-wide">{t.profilePage?.myOrders || 'My Orders'}</span>
  </div>
 )}

 <div className={`min-h-screen bg-zinc-50 relative overflow-hidden pb-0 md:pb-20 text-left text-zinc-900 ${activeTab === '' ? 'profile-dashboard-no-scroll' : ''}`}>
 <style jsx global>{`
  @media (max-width: 767px) {
    .profile-dashboard-no-scroll {
      height: 100dvh;
      min-height: 100dvh;
      overflow: hidden;
    }
  }
 `}</style>


 <div className={`max-w-6xl mx-auto px-4 relative z-10 ${activeTab === 'all_orders' ? 'py-0' : 'py-12'}`}>
 
 {/* Header Spacer */}
 <div className={`w-full h-8 md:h-12 ${activeTab === 'all_orders' ? 'hidden' : ''}`}></div>

 {/* Breadcrumbs */}
 {activeTab !== 'all_orders' && <div className="hidden md:flex items-center gap-2 text-zinc-400 text-sm font-medium mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide pb-2">
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
          </div>}

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
  className="space-y-6 -mt-16 md:mt-0"
  >
  {/* --- DESKTOP VIEW --- */}
  <div className="hidden md:flex bg-white rounded-2xl p-8 shadow-sm flex-col">
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
  className="w-full px-4 py-2.5 rounded-xl bg-white border border-zinc-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-zinc-900 text-base"
  value={editForm.name}
  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
  />
  </div>
  <div className="space-y-2">
  <div className="flex items-center justify-between ml-1 mb-2">
  <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ">{t.profilePage?.phoneNumber || 'Phone Number'}</label>
  {user?.phone ? (
  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1">
  <Shield size={8} /> {t.profilePage?.permanent || 'Permanent'}
  </span>
  ) : (
  <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
  {locale === 'zh' ? '仅可编辑一次' : 'Editable Once'}
  </span>
  )}
  </div>
  <input 
  type="tel"
  disabled={!!user?.phone}
  required={!user?.phone}
  className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all font-medium text-base ${user?.phone ? 'bg-zinc-50 border-zinc-200 text-zinc-500 cursor-not-allowed opacity-70' : 'bg-white border-zinc-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-zinc-900'}`}
  value={editForm.phone}
  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
  />
  </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="space-y-2">
  <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.preferredPayment || 'Preferred Payment'}</label>
  <div className="relative">
  <select 
  required
  className="w-full px-4 py-2.5 rounded-xl bg-white border border-zinc-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium appearance-none cursor-pointer text-zinc-900 text-base"
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
  className="w-full px-4 py-2.5 rounded-xl bg-white border border-zinc-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium appearance-none cursor-pointer text-zinc-900 text-base"
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
  className="w-full px-4 py-2.5 rounded-xl bg-white border border-zinc-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium resize-none text-zinc-900 text-base min-h-[100px]"
  value={editForm.address}
  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
  />
  </div>

  <div className="space-y-2">
  <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.notesLabel || 'Default Order Notes (Optional)'}</label>
  <input 
  type="text"
  className="w-full px-4 py-2.5 rounded-xl bg-white border border-zinc-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-zinc-900 text-base"
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
  : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md active:scale-95'
  }`}
  >
  {isSaving ? <Loader2 className="animate-spin" /> : null}
  {t.profilePage?.saveChanges || 'Save Changes'}
  </button>
  </div>
  </form>
  </div>

  {/* --- MOBILE VIEW --- */}
  <div className="block md:hidden pb-10">
    <form onSubmit={handleUpdateProfile} className="flex flex-col">
      {/* Mobile Header */}
      <div className="flex items-center gap-4 mb-6 pt-4" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))' }}>
        <button type="button" onClick={() => {
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
        }} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-zinc-900 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-zinc-100 shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h3 className="text-xl font-bold text-zinc-900">
            {t.profilePage?.editInformation || 'Edit Information'}
          </h3>
          <p className="text-[11px] text-zinc-500">{locale === 'zh' ? '更新您的账户详情' : 'Update your account details'}</p>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {/* Full Name */}
        <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-zinc-100 flex items-center gap-4 focus-within:border-zinc-300 transition-colors">
          <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-700 shrink-0">
            <User size={18} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold text-zinc-500 mb-0.5">{t.profilePage?.fullName || 'Full Name'}</div>
            <input 
              type="text" required
              className="w-full bg-transparent text-[13px] font-semibold text-zinc-900 outline-none"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </div>
        </div>

        {/* Phone Number */}
        <div className={`bg-white rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-zinc-100 flex items-center gap-4 ${user?.phone ? 'opacity-70' : 'focus-within:border-zinc-300 transition-colors'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${user?.phone ? 'bg-zinc-100 text-zinc-500' : 'bg-zinc-50 text-zinc-700'}`}>
            <Phone size={18} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
               <div className="text-[11px] font-bold text-zinc-500 mb-0.5">{t.profilePage?.phoneNumber || 'Phone Number'}</div>
               {user?.phone ? <Shield size={12} className="text-zinc-400" /> : <span className="text-[9px] font-bold text-blue-500">{locale === 'zh' ? '仅可编辑一次' : 'Editable Once'}</span>}
            </div>
            <input 
              type="tel" 
              disabled={!!user?.phone}
              required={!user?.phone}
              className={`w-full bg-transparent text-[13px] font-semibold outline-none ${user?.phone ? 'text-zinc-500' : 'text-zinc-900'}`}
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
          </div>
        </div>

        {/* Preferred Payment */}
        <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-zinc-100 flex items-center gap-4 focus-within:border-zinc-300 transition-colors">
          <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-700 shrink-0">
            <CreditCard size={18} />
          </div>
          <div className="flex-1 relative">
            <div className="text-[11px] font-bold text-zinc-500 mb-0.5">{t.profilePage?.preferredPayment || 'Preferred Payment'}</div>
            <select 
              required
              className="w-full bg-transparent text-[13px] font-semibold text-zinc-900 outline-none appearance-none pr-8"
              value={editForm.preferredPayment}
              onChange={(e) => setEditForm({ ...editForm, preferredPayment: e.target.value })}
            >
              <option value="">{t.profilePage?.selectMethod || 'Select Method'}</option>
              <option value="Cash on Delivery">{locale === 'zh' ? '货到付款' : 'Cash on Delivery'}</option>
              <option value="DuitNow & Bank Transfer">{locale === 'zh' ? 'DuitNow 及 银行转账' : 'DuitNow & Bank Transfer'}</option>
            </select>
            <ChevronDown size={16} className="absolute right-0 top-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Order Mode */}
        <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-zinc-100 flex items-center gap-4 focus-within:border-zinc-300 transition-colors">
          <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-700 shrink-0">
            <Package size={18} />
          </div>
          <div className="flex-1 relative">
            <div className="text-[11px] font-bold text-zinc-500 mb-0.5">{t.profilePage?.orderMode || 'Order Mode'}</div>
            <select 
              required
              className="w-full bg-transparent text-[13px] font-semibold text-zinc-900 outline-none appearance-none pr-8"
              value={editForm.orderMode}
              onChange={(e) => setEditForm({ ...editForm, orderMode: e.target.value })}
            >
              <option value="">{t.profilePage?.selectMode || 'Select Mode'}</option>
              <option value="Self Collect">{locale === 'zh' ? '自取' : 'Self Collect'}</option>
              <option value="Delivery">{locale === 'zh' ? '配送' : 'Delivery'}</option>
            </select>
            <ChevronDown size={16} className="absolute right-0 top-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-zinc-100 flex items-start gap-4 focus-within:border-zinc-300 transition-colors">
          <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-700 shrink-0">
            <MapPin size={18} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold text-zinc-500 mb-1">{t.profilePage?.addressLabel || 'Delivery / Collection Address'}</div>
            <textarea 
              required={editForm.orderMode === 'Delivery'}
              className="w-full bg-transparent text-[13px] font-semibold text-zinc-900 outline-none resize-none min-h-[60px]"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-zinc-100 flex items-center gap-4 focus-within:border-zinc-300 transition-colors">
          <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-700 shrink-0">
            <MessageSquare size={18} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold text-zinc-500 mb-0.5">{t.profilePage?.notesLabel || 'Default Order Notes (Optional)'}</div>
            <input 
              type="text"
              className="w-full bg-transparent text-[13px] font-semibold text-zinc-900 outline-none"
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-row gap-3 pt-2">
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
          className="px-6 py-3.5 bg-white border border-zinc-200 text-zinc-600 rounded-full font-bold text-[13px] hover:bg-zinc-50 transition-all flex items-center justify-center shrink-0"
        >
          {t.profilePage?.discardChanges || 'Discard'}
        </button>
        <button 
          type="submit"
          disabled={isSaving || !hasEditChanges}
          className={`flex-1 py-3.5 rounded-full font-bold text-[13px] transition-all flex items-center justify-center gap-2 ${
            !hasEditChanges || isSaving
              ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md active:scale-95'
          }`}
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
          {t.profilePage?.saveChanges || 'Save Changes'}
        </button>
      </div>
    </form>
  </div>
  </motion.div>
  )}
 
  {activeTab === 'change_password' && (
  /* ── CHANGE PASSWORD FORM ──────────────────────────────── */
  <motion.div 
  key="password"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  className="space-y-6 -mt-16 md:mt-0"
  >
  {/* --- DESKTOP VIEW --- */}
  <div className="hidden md:flex bg-white rounded-2xl p-8 shadow-sm flex-col">
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
  className="w-full px-4 py-2.5 rounded-xl bg-white border border-zinc-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-zinc-900 text-base pr-12"
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
  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
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
  className="w-full px-4 py-2.5 rounded-xl bg-white border border-zinc-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-zinc-900 text-base pr-12"
  placeholder="••••••••"
  value={passwordForm.confirmPassword}
  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
  />
  <button 
  type="button" 
  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
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
  : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md active:scale-95'
  }`}
  >
  {isSaving ? <Loader2 className="animate-spin" /> : null}
  {t.profilePage?.updatePassword || 'Update Password'}
  </button>
  </div>
  </form>
  </div>

  {/* --- MOBILE VIEW --- */}
  <div className="block md:hidden pb-10">
    <form onSubmit={handleChangePassword} className="flex flex-col">
      {/* Mobile Header */}
      <div className="flex items-center gap-4 mb-6 pt-4" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))' }}>
        <button type="button" onClick={() => {
          setPasswordForm({ newPassword: '', confirmPassword: '' });
          setShowNewPassword(false);
          setShowConfirmPassword(false);
          setActiveTab('');
        }} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-zinc-900 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-zinc-100 shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h3 className="text-xl font-bold text-zinc-900">
            {t.profilePage?.securitySettings || 'Security Settings'}
          </h3>
          <p className="text-[11px] text-zinc-500">{locale === 'zh' ? '更新您的密码' : 'Update your password'}</p>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {/* New Password */}
        <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-zinc-100 flex items-center gap-4 focus-within:border-zinc-300 transition-colors">
          <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-700 shrink-0">
            <Lock size={18} />
          </div>
          <div className="flex-1 relative">
            <div className="text-[11px] font-bold text-zinc-500 mb-0.5">{t.profilePage?.newPassword || 'New Password'}</div>
            <input 
              type={showNewPassword ? 'text' : 'password'} required minLength={8} pattern="^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
              className="w-full bg-transparent text-[13px] font-semibold text-zinc-900 outline-none pr-8"
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
            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 py-2">
              {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        {passwordForm.newPassword.length > 0 && !passwordRegex.test(passwordForm.newPassword) && (
          <p className="text-[11px] text-red-500 ml-2 font-medium">
            {t.profilePage?.passwordLengthHint || 'Password must be at least 8 characters, and include an uppercase letter, a number, and a symbol.'}
          </p>
        )}

        {/* Confirm New Password */}
        <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-zinc-100 flex items-center gap-4 focus-within:border-zinc-300 transition-colors">
          <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-700 shrink-0">
            <Lock size={18} />
          </div>
          <div className="flex-1 relative">
            <div className="text-[11px] font-bold text-zinc-500 mb-0.5">{t.profilePage?.confirmNewPassword || 'Confirm New Password'}</div>
            <input 
              type={showConfirmPassword ? 'text' : 'password'} required
              className="w-full bg-transparent text-[13px] font-semibold text-zinc-900 outline-none pr-8"
              placeholder="••••••••"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 py-2">
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-row gap-3 pt-2">
        <button 
          type="button"
          onClick={() => {
            setPasswordForm({ newPassword: '', confirmPassword: '' });
            setActiveTab('');
          }}
          className="px-6 py-3.5 bg-white border border-zinc-200 text-zinc-600 rounded-full font-bold text-[13px] hover:bg-zinc-50 transition-all flex items-center justify-center shrink-0"
        >
          {t.profilePage?.discardChanges || 'Discard'}
        </button>
        <button 
          type="submit"
          disabled={isSaving || !isPasswordFormValid}
          className={`flex-1 py-3.5 rounded-full font-bold text-[13px] transition-all flex items-center justify-center gap-2 ${
            !isPasswordFormValid || isSaving
              ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md active:scale-95'
          }`}
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
          {t.profilePage?.updatePassword || 'Update Password'}
        </button>
      </div>
    </form>
  </div>
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
 {/* Mobile Dashboard Menu (< lg) */}
  <div
    className="flex flex-col lg:hidden w-[calc(100%+2rem)] -ml-4 -mt-[80px] min-h-screen relative"
    style={{ background: 'linear-gradient(145deg, #e23a2b 0%, #d52b20 52%, #b51f26 100%)' }}
  >
 {/* Light Header Area */}
  <div className="flex flex-col items-center pb-10 px-6 relative" style={{ paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))' }}>
  <button
   type="button"
   onClick={() => setIsLogoutModalOpen(true)}
   aria-label={locale === 'zh' ? '登出' : locale === 'ms' ? 'Log keluar' : 'Log out'}
   className="absolute right-5 top-[calc(1rem+env(safe-area-inset-top,0px))] text-white transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
  >
   <LogOut size={22} strokeWidth={2} />
  </button>
 {/* Avatar */}
  <div className="w-[88px] h-[88px] bg-white/15 rounded-full flex items-center justify-center text-4xl font-bold text-white mb-3 border-[3px] border-white/80 ring-2 ring-white/30 shadow-lg">
 {user.name.charAt(0).toUpperCase()}
 </div>
 
 {/* Name & Email */}
  <h2 className="text-xl font-bold tracking-tight text-white mb-1">{user.name}</h2>
  <p className="text-white/85 text-[13px]">{user.email || user.phone || '-'}</p>
  <span className="mt-3 rounded-full border border-white/35 bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
   {user.role?.toLowerCase() === 'seller'
    ? (t.profilePage?.roles?.Seller || (locale === 'zh' ? '卖家' : 'Seller'))
    : user.role || (locale === 'zh' ? '会员' : 'Member')}
  </span>
 </div>
 
 {/* White Bottom Area */}
  <div className="flex-1 min-h-0 overflow-y-auto bg-white rounded-t-[32px] px-5 pt-7 pb-[calc(210px+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] flex flex-col">
 
  <div className="mb-2 flex items-center justify-between px-2">
   <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">{locale === 'zh' ? '账户' : 'Account'}</h3>
   <div className="relative">
    <button
     type="button"
     onClick={() => setIsLanguagePickerOpen((open) => !open)}
     aria-expanded={isLanguagePickerOpen}
     aria-label={locale === 'zh' ? '切换语言' : 'Change language'}
     className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 shadow-sm transition-colors hover:border-red-200 hover:text-red-700"
    >
     <Globe2 size={13} />{locale === 'zh' ? '中文' : 'English'}<ChevronDown size={12} className={`transition-transform ${isLanguagePickerOpen ? 'rotate-180' : ''}`} />
    </button>
    {isLanguagePickerOpen && (
     <div className="absolute right-0 top-full z-30 mt-2 min-w-[120px] overflow-hidden rounded-xl border border-zinc-100 bg-white p-1 shadow-lg">
      {[{ code: 'en', label: 'English' }, { code: 'zh', label: '中文' }].map((language) => (
       <button
        key={language.code}
        type="button"
        onClick={() => {
         setIsLanguagePickerOpen(false);
         if (locale !== language.code) void router.push(router.pathname, router.asPath, { locale: language.code });
        }}
        className={`block w-full rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-red-50 hover:text-red-700 ${locale === language.code ? 'font-bold text-red-700' : 'font-medium text-zinc-700'}`}
       >
        {language.label}{locale === language.code ? ' ✓' : ''}
       </button>
      ))}
     </div>
    )}
   </div>
  </div>
  {/* Tabs Group 1 */}
 <div className="bg-zinc-50 rounded-[24px] p-2 mb-4 space-y-1">
 <button onClick={() => setActiveTab('view_profile')} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-zinc-100/80 rounded-[16px] transition-colors">
 <div className="flex items-center gap-4">
 <div className="text-zinc-400"><User size={20} strokeWidth={2} /></div>
 <span className="text-[15px] font-bold text-zinc-800">{t.profilePage?.myAccount || 'My Account'}</span>
 </div>
 <ChevronRight size={18} className="text-zinc-300" />
 </button>
 <button onClick={() => setActiveTab('edit_profile')} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-zinc-100/80 rounded-[16px] transition-colors">
 <div className="flex items-center gap-4">
 <div className="text-zinc-400"><Edit3 size={20} strokeWidth={2} /></div>
 <span className="text-[15px] font-bold text-zinc-800">{t.profilePage?.editProfile || 'Edit Profile'}</span>
 </div>
 <ChevronRight size={18} className="text-zinc-300" />
 </button>
 <button onClick={() => setActiveTab('change_password')} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-zinc-100/80 rounded-[16px] transition-colors">
 <div className="flex items-center gap-4">
 <div className="text-zinc-400"><Lock size={20} strokeWidth={2} /></div>
 <span className="text-[15px] font-bold text-zinc-800">{t.profilePage?.changePassword || 'Change Password'}</span>
 </div>
 <ChevronRight size={18} className="text-zinc-300" />
 </button>
 </div>

  {/* Helpful store pages */}
  <div className="mb-4">
  <h3 className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">{locale === 'zh' ? '了解更多' : locale === 'ms' ? 'MAKLUMAT LANJUT' : 'More from us'}</h3>
  <div className="space-y-1 rounded-[24px] bg-zinc-50 p-2">
  <Link href="/about" className="flex items-center justify-between rounded-[16px] p-4 transition-colors hover:bg-white">
  <span className="flex items-center gap-4"><Info size={20} className="text-zinc-500" /><span className="text-[15px] font-semibold text-zinc-800">{locale === 'zh' ? '关于我们' : locale === 'ms' ? 'Tentang Kami' : 'About Us'}</span></span>
  <ChevronRight size={18} className="text-zinc-300" />
  </Link>
  <Link href="/contact" className="flex items-center justify-between rounded-[16px] p-4 transition-colors hover:bg-white">
  <span className="flex items-center gap-4"><Phone size={20} className="text-zinc-500" /><span className="text-[15px] font-semibold text-zinc-800">{locale === 'zh' ? '联系我们' : locale === 'ms' ? 'Hubungi Kami' : 'Contact Us'}</span></span>
  <ChevronRight size={18} className="text-zinc-300" />
  </Link>
  <Link href="/safety" className="flex items-center justify-between rounded-[16px] p-4 transition-colors hover:bg-white">
  <span className="flex items-center gap-4"><Shield size={20} className="text-zinc-500" /><span className="text-[15px] font-semibold text-zinc-800">{locale === 'zh' ? '安全指南' : locale === 'ms' ? 'Panduan Keselamatan' : 'Safety Guide'}</span></span>
  <ChevronRight size={18} className="text-zinc-300" />
  </Link>
  </div>
  </div>

 {/* Logout Button */}
  <div className="bg-red-50/50 rounded-[24px] p-2 mt-1 border border-red-100/70">
 <button onClick={() => setIsLogoutModalOpen(true)} className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-red-50 rounded-[16px] transition-colors">
 <div className="flex items-center gap-4">
 <div className="text-red-400"><LogOut size={20} strokeWidth={2} /></div>
 <span className="text-[15px] font-bold text-red-500">{t.profilePage?.logout || 'Log Out'}</span>
 </div>
 <ChevronRight size={18} className="text-red-200" />
 </button>
 </div>
 
 </div>
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
  /* ── VIEW PROFILE (ACCOUNT DETAILS) ────────────────────────────────── */
  <motion.div 
  key="view"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  className="space-y-6 -mt-16 md:mt-0"
  >
  {/* --- DESKTOP VIEW --- */}
  <div className="hidden md:flex bg-white rounded-2xl p-8 shadow-sm flex-col">
  <div className="flex items-center gap-3 mb-8">
  <button onClick={() => setActiveTab('')} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-zinc-900 transition-colors">
  <ArrowLeft size={18} />
  </button>
  <User size={20} className="text-zinc-700" />
  <h3 className="text-xl font-semibold text-zinc-900">
  {t.profilePage?.myAccount || 'My Account'}
  </h3>
  </div>

  <div className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
  <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.fullName || 'Full Name'}</label>
  <p className="px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-100 font-medium text-zinc-900 text-base flex items-center h-12">
  {user.name}
  </p>
  </div>
  <div>
  <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.phoneNumber || 'Phone Number'}</label>
  <p className="px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-100 font-medium text-zinc-900 text-base flex items-center h-12 opacity-80">
  {user.phone || '-'}
  </p>
  </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
  <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.preferredPayment || 'Preferred Payment'}</label>
  <p className="px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-100 font-medium text-zinc-900 text-base flex items-center h-12">
  {user.preferredPayment || '-'}
  </p>
  </div>
  <div>
  <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.orderMode || 'Order Mode'}</label>
  <p className="px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-100 font-medium text-zinc-900 text-base flex items-center h-12">
  {user.orderMode || '-'}
  </p>
  </div>
  </div>

  <div>
  <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.addressLabel || 'Delivery / Collection Address'}</label>
  <p className="px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-100 font-medium text-zinc-900 text-base min-h-[100px] whitespace-pre-wrap">
  {user.address || '-'}
  </p>
  </div>

  <div>
  <label className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">{t.profilePage?.notesLabel || 'Default Order Notes (Optional)'}</label>
  <p className="px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-100 font-medium text-zinc-900 text-base">
  {user.notes || '-'}
  </p>
  </div>
  </div>


  </div>

  {/* --- MOBILE VIEW (My Account) --- */}
  <div className="block md:hidden pb-[calc(160px+env(safe-area-inset-bottom))]">
    <div className="flex flex-col">
      {/* Mobile Header */}
      <div className="flex items-center gap-4 mb-6 pt-4" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))' }}>
        <button type="button" onClick={() => setActiveTab('')} className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-zinc-900 shadow-[0_2px_10px_rgba(220,38,38,0.12)] border border-red-100 shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h3 className="text-xl font-bold text-zinc-900">
            {t.profilePage?.myAccount || 'My Account'}
          </h3>
          <p className="text-[11px] text-zinc-500">{locale === 'zh' ? '管理您的帐户和偏好' : 'Manage your account and preferences'}</p>
        </div>
      </div>

      {/* Profile Hero Card */}
      <div className="relative rounded-[24px] p-5 mb-4 overflow-hidden shadow-[0_8px_32px_rgba(181,31,38,0.22)]" style={{ background: 'linear-gradient(145deg, #e23a2b 0%, #d52b20 52%, #b51f26 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-10 -right-2 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />

        {/* User info row */}
        <div className="flex items-center gap-4 mb-5 relative z-10">
          <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0 border-2 border-white/40">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-[17px] font-black text-white tracking-tight leading-tight">{user.name}</div>
            {user.role === 'seller' && user.sellerLevel ? (
              <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white border border-white/20 uppercase tracking-wider">
                <Award size={10} />
                Level {user.sellerLevel} Seller
              </div>
            ) : null}
          </div>
        </div>

        {/* Contact info row */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <div className="flex items-center gap-2.5 bg-white/10 rounded-[14px] px-3 py-2.5">
            <Phone size={13} className="text-zinc-300 shrink-0" />
            <div>
              <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{t.profilePage?.phoneNumber || (locale === 'zh' ? '电话号码' : 'Phone Number')}</div>
              <div className="text-[12px] font-bold text-white truncate">{user.phone || '-'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-white/10 rounded-[14px] px-3 py-2.5 overflow-hidden">
            <Mail size={13} className="text-zinc-300 shrink-0" />
            <div className="overflow-hidden">
              <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{locale === 'zh' ? '电子邮件' : 'Email Address'}</div>
              <div className="text-[12px] font-bold text-white truncate">{user.email || '-'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Order & Delivery Information */}
      <div className="mb-2">
          <div className="text-[13px] font-bold text-zinc-900 mb-3 ml-1">
          {t.profilePage?.orderAndDelivery || (locale === 'zh' ? '订单和送货信息' : 'Order & Delivery Information')}
        </div>

        <div className="space-y-2">
          {/* Preferred Payment */}
          <div className="bg-white rounded-[18px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-zinc-100 flex items-center px-4 py-3.5 gap-4">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-zinc-700 shrink-0">
              <CreditCard size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-zinc-400">{t.profilePage?.preferredPayment || 'Preferred Payment'}</div>
              <div className="text-[13px] font-bold text-zinc-900 truncate">{translatePayment(user.preferredPayment) || '-'}</div>
            </div>
          </div>

          {/* Order Mode */}
          <div className="bg-white rounded-[18px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-zinc-100 flex items-center px-4 py-3.5 gap-4">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-zinc-700 shrink-0">
              <Package size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-zinc-400">{t.profilePage?.orderMode || 'Order Mode'}</div>
              <div className="text-[13px] font-bold text-zinc-900 truncate">{translateOrderMode(user.orderMode) || '-'}</div>
            </div>
          </div>

          {/* Delivery / Collection Address */}
          <div className="bg-white rounded-[18px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-zinc-100 flex items-center px-4 py-3.5 gap-4">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-zinc-700 shrink-0">
              <MapPin size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-zinc-400">{t.profilePage?.addressLabel || 'Delivery / Collection Address'}</div>
              <div className="text-[13px] font-bold text-zinc-900 truncate">{user.address || '-'}</div>
            </div>
          </div>

          {/* Default Notes */}
          <div className="bg-white rounded-[18px] shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-zinc-100 flex items-center px-4 py-3.5 gap-4">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-zinc-700 shrink-0">
              <MessageSquare size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-zinc-400">{t.profilePage?.notesLabel || 'Default Order Notes (Optional)'}</div>
              <div className="text-[13px] font-bold text-zinc-900 truncate">{user.notes || '-'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information Card */}
      <div className="mt-4 bg-red-50/70 border border-red-100 rounded-[20px] p-5 flex items-center gap-4 shadow-[0_2px_10px_rgba(220,38,38,0.05)]">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-zinc-800 shrink-0">
          <UserCheck size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-zinc-900 mb-0.5">{t.profilePage?.accountInformation || (locale === 'zh' ? '账户信息' : 'Account Information')}</div>
          <div className="text-[11px] text-zinc-500">{locale === 'zh' ? '账户信息 - 保持您的信息最新，以确保购物体验顺畅安全。' : 'Keep your information up to date to ensure a smooth and secure shopping experience.'}</div>
        </div>
      </div>

      {/* Update Button */}
      <div className="mt-4">
        <button
          onClick={() => setActiveTab('edit_profile')}
          className="w-full py-4 text-white rounded-full font-bold text-[13px] shadow-[0_4px_14px_rgba(181,31,38,0.24)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(145deg, #e23a2b 0%, #d52b20 52%, #b51f26 100%)' }}
        >
          <Edit3 size={16} />
          {t.profilePage?.editProfile || (locale === 'zh' ? '更新信息' : 'Update Information')} ›
        </button>
      </div>
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
 style={{ paddingTop: 'calc(72px + env(safe-area-inset-top, 0px))' }}
 >

 {/* ── DESKTOP VIEW ── */}
 <div className="hidden md:flex bg-white rounded-2xl p-8 shadow-sm lg:h-[700px] flex-col">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4 mb-8 shrink-0">
 <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
 <div className="relative flex-1 sm:flex-none">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Search size={16} className="text-zinc-400" />
 </div>
 <input
 type="text"
 placeholder={searchPlaceholderTranslations[locale as string] || searchPlaceholderTranslations.en}
 className="w-full sm:w-64 pl-10 pr-10 py-3 rounded-xl bg-zinc-50 font-medium text-sm text-zinc-900 outline-none min-w-0 text-ellipsis border border-transparent focus:border-zinc-300 transition-colors"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 {searchQuery && (
 <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-red-500 transition-colors">
 <X size={16} />
 </button>
 )}
 </div>
 <div className="relative shrink-0">
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="px-4 py-3 rounded-xl bg-zinc-50 font-medium text-sm text-zinc-900 cursor-pointer appearance-none outline-none text-center focus:border-zinc-300 transition-colors"
 style={{ textAlignLast: 'center' }}
 >
 <option value="All">{statusTranslations['All']?.[locale as string] || statusTranslations['All'].en}</option>
 <option value="Completed">{statusTranslations['Completed']?.[locale as string] || statusTranslations['Completed'].en}</option>
 <option value="Pending">{statusTranslations['Pending']?.[locale as string] || statusTranslations['Pending'].en}</option>
 <option value="In Process">{statusTranslations['In Process']?.[locale as string] || statusTranslations['In Process'].en}</option>
 <option value="Cancelled">{statusTranslations['Cancelled']?.[locale as string] || statusTranslations['Cancelled'].en}</option>
 </select>
 </div>
 </div>
 </div>

 {filteredOrders.length === 0 ? (
 <div className="flex-1 flex flex-col items-center justify-center text-center">
 <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-300">
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
  className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer border border-zinc-100"
  >
  <div className="flex items-center gap-4 text-left">
  <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
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
 {totalPages > 1 && (
 <div className="flex items-center justify-center gap-2 mt-8 pt-4 pb-4 border-t border-zinc-100">
 <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-zinc-500"><ChevronsLeft size={16} /></button>
 <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-zinc-500"><ChevronLeft size={16} /></button>
 <span className="text-sm font-medium text-zinc-500 px-4">{currentPage} / {totalPages}</span>
 <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-zinc-500"><ChevronRight size={16} /></button>
 <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-zinc-500"><ChevronsRight size={16} /></button>
 </div>
 )}
 </div>
 )}
 </div>

 {/* ── MOBILE VIEW ── */}
 <div className="flex md:hidden flex-col pb-10">
 {/* Hero Stats Banner */}
 <div className="relative rounded-[24px] p-5 mb-5 overflow-hidden shadow-[0_8px_32px_rgba(181,31,38,0.22)]" style={{ background: 'linear-gradient(145deg, #e23a2b 0%, #d52b20 52%, #b51f26 100%)' }}>
 <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
 <div className="absolute -bottom-10 -right-2 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
 <div className="relative z-10">
 <div className="text-[11px] font-bold text-white/90 uppercase tracking-widest mb-3">{locale === 'zh' ? '订单摘要' : 'Order Summary'}</div>
 <div className="grid grid-cols-3 gap-3">
 <div className="bg-white/15 rounded-[14px] px-3 py-3 text-center">
 <div className="text-[22px] font-black text-white leading-none mb-1 drop-shadow-sm">{orders.length}</div>
 <div className="text-[9px] font-bold text-white/85 uppercase tracking-wider">{locale === 'zh' ? '总计' : 'Total'}</div>
 </div>
 <div className="bg-white/15 rounded-[14px] px-3 py-3 text-center">
 <div className="text-[22px] font-black text-white leading-none mb-1 drop-shadow-sm">{orders.filter((o: any) => o.status === 'Completed').length}</div>
 <div className="text-[9px] font-bold text-white/85 uppercase tracking-wider">{locale === 'zh' ? '已完成' : 'Done'}</div>
 </div>
 <div className="bg-white/15 rounded-[14px] px-2 py-3 text-center overflow-hidden">
 <div className="text-[9px] font-bold text-white/85 uppercase tracking-wider leading-none mb-0.5">RM</div>
 <div className="text-[18px] font-black text-white leading-none mb-1 truncate drop-shadow-sm">{orders.reduce((s: number, o: any) => s + o.totalAmount, 0).toFixed(0)}</div>
 <div className="text-[9px] font-bold text-white/85 uppercase tracking-wider">{locale === 'zh' ? '消费' : 'Spent'}</div>
 </div>
 </div>
 </div>
 </div>

 {/* Search + Filter Row */}
 <div className="flex gap-2 mb-4">
 <div className="relative flex-1">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
 <Search size={15} className="text-zinc-400" />
 </div>
 <input
 type="text"
 placeholder={locale === 'zh' ? '搜索订单...' : 'Search orders...'}
 className="w-full pl-10 pr-9 py-3 rounded-[16px] bg-white border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] font-semibold text-[13px] text-zinc-900 outline-none focus:border-zinc-300 transition-colors"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 {searchQuery && (
 <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400">
 <X size={15} />
 </button>
 )}
 </div>
 <div className="relative shrink-0">
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="h-full px-3 py-3 rounded-[16px] bg-white border border-zinc-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] font-semibold text-[12px] text-zinc-900 cursor-pointer appearance-none outline-none focus:border-zinc-300 transition-colors pr-7"
 >
 <option value="All">{locale === 'zh' ? '全部' : 'All'}</option>
 <option value="Completed">{locale === 'zh' ? '已完成' : 'Done'}</option>
 <option value="Pending">{locale === 'zh' ? '待处理' : 'Pending'}</option>
 <option value="In Process">{locale === 'zh' ? '处理中' : 'In Process'}</option>
 <option value="Cancelled">{locale === 'zh' ? '已取消' : 'Cancelled'}</option>
 </select>
 <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
 </div>
 </div>

 {/* Orders List */}
 {filteredOrders.length === 0 ? (
 <div className="flex flex-col items-center justify-center text-center py-16">
 <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-zinc-300">
 {searchQuery ? <Search size={32} strokeWidth={1.5} /> : <Package size={32} strokeWidth={1.5} />}
 </div>
 <p className="text-[14px] font-semibold text-zinc-500 max-w-[240px] mx-auto leading-relaxed">
 {searchQuery ? (noOrdersSearchTranslations[locale as string] || noOrdersSearchTranslations.en) : (t.profilePage?.noOrdersYet || "You haven't placed any orders yet.")}
 </p>
 </div>
 ) : (
 <div className="bg-white rounded-[20px] border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
 {/* Table Header */}
 <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
 <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{locale === 'zh' ? '订单' : 'Order'}</div>
 <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">{locale === 'zh' ? '金额' : 'Amount'}</div>
 <div className="w-4"></div>
 </div>

 {/* Table Rows */}
 <div className="divide-y divide-zinc-50">
 {paginatedOrders.map((order: any) => {
 const statusColor =
 order.status === 'Completed' ? 'text-green-600 bg-green-50' :
 order.status === 'Cancelled' ? 'text-red-500 bg-red-50' :
 order.status === 'In Process' ? 'text-blue-600 bg-blue-50' :
 'text-zinc-500 bg-zinc-100';
 return (
 <div
 key={order.id}
 onClick={() => setSelectedOrder(order)}
 className="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-4 py-3.5 active:bg-zinc-50 transition-colors cursor-pointer"
 >
 {/* Left: icon + info */}
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0">
 <ShoppingBag size={15} />
 </div>
 <div className="min-w-0">
 <div className="text-[13px] font-bold text-zinc-900 truncate">
 #{order.id.substring(0, 8).toUpperCase()}
 </div>
 <div className="flex items-center gap-1.5 mt-0.5">
 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusColor}`}>
 {statusTranslations[order.status as string]?.[locale as string] || order.status}
 </span>
 <span className="text-[10px] text-zinc-400">{new Date(order.createdAt).toLocaleDateString()}</span>
 </div>
 </div>
 </div>

 {/* Right: amount */}
 <div className="text-[14px] font-black text-zinc-900 whitespace-nowrap">
 RM {order.totalAmount.toFixed(2)}
 </div>

 {/* Chevron */}
 <ChevronRight size={14} className="text-zinc-300" />
 </div>
 );
 })}
 </div>

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 bg-zinc-50">
 <button
 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 className="flex items-center gap-1 text-[12px] font-bold text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed active:text-zinc-900 transition-colors"
 >
 <ChevronLeft size={14} /> Prev
 </button>
 <span className="text-[12px] font-semibold text-zinc-400">
 Page {currentPage} of {totalPages}
 </span>
 <button
 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
 disabled={currentPage === totalPages}
 className="flex items-center gap-1 text-[12px] font-bold text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed active:text-zinc-900 transition-colors"
 >
 Next <ChevronRight size={14} />
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
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-zinc-700/45 backdrop-blur-sm" />
 
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20 }} 
 animate={{ opacity: 1, scale: 1, y: 0 }} 
 exit={{ opacity: 0, scale: 0.95, y: 20 }} 
 className="relative w-full h-full md:h-auto max-w-6xl bg-zinc-50 rounded-none md:rounded-[32px] shadow-2xl overflow-y-auto md:overflow-hidden border-0 md:border border-white/20 flex flex-col md:flex-row max-h-none md:max-h-[90vh] lg:max-h-[88vh] pb-[calc(66px+env(safe-area-inset-bottom))] md:pb-0"
 >
 {/* Mobile Header */}
 <div
  className="md:hidden sticky top-0 z-50 flex shrink-0 items-center justify-center px-4 text-white shadow-md"
  style={{ height: 'calc(56px + env(safe-area-inset-top, 0px))', paddingTop: 'env(safe-area-inset-top, 0px)', boxSizing: 'border-box', background: 'linear-gradient(145deg, #e23a2b 0%, #d52b20 52%, #b51f26 100%)' }}
 >
 <button onClick={() => setSelectedOrder(null)} aria-label={locale === 'zh' ? '返回订单' : 'Back to orders'} className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15">
 <ArrowLeft size={24} />
 </button>
 <h2 className="w-full text-center text-base font-semibold tracking-wide">{t.profilePage?.orderDetails || (locale === 'zh' ? '订单详情' : 'Order Details')}</h2>
 </div>

 {/* Close Button (Desktop Only) */}
 <button data-html2canvas-ignore="true" onClick={() => setSelectedOrder(null)} className="hidden md:block absolute top-6 right-6 md:top-8 md:right-8 p-3 rounded-full bg-black/5 hover:bg-black/10 text-zinc-600 hover:text-zinc-900 transition-all z-30 backdrop-blur-md">
 <X size={20} strokeWidth={3} />
 </button>

 {/* Left Side: Order Info */}
 <div className="w-full md:w-[52%] shrink-0 md:shrink bg-gradient-to-b from-orange-50/70 via-zinc-50 to-zinc-50 p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col md:border-r border-zinc-200 md:overflow-y-auto md:custom-scrollbar relative md:min-h-0">
 
 {/* Order ID & Tag (Card on Mobile) */}
 <div className="bg-white rounded-3xl p-5 sm:p-6 mb-4 md:mb-6 w-full min-w-0 shrink-0 shadow-sm border border-zinc-200/80">
 <div className="space-y-2 mb-8 mt-0 w-full min-w-0">
 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.18em]">{t.profilePage?.orderId || 'Order Number'}</p>
 <div className="flex items-center gap-3 w-full min-w-0">
 <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight truncate flex-1" title={selectedOrder.id.toUpperCase()}>#{(() => { const d = new Date(selectedOrder.createdAt); return `CB-${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(selectedOrder.id).slice(-6).toUpperCase()}`; })()}</h2>
 <button 
 onClick={() => {
 const d = new Date(selectedOrder.createdAt);
 const orderNumber = `CB-${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(selectedOrder.id).slice(-6).toUpperCase()}`;
 navigator.clipboard.writeText(orderNumber);
 alert('Order number copied!');
 }} 
 aria-label="Copy order number"
 className="text-zinc-500 hover:text-zinc-900 transition-colors shrink-0 bg-zinc-100 hover:bg-zinc-200 p-2.5 rounded-xl"
 >
 <Copy size={16} />
 </button>
 </div>
 </div>

 {/* Progress Tracker */}
 <div className="w-full relative rounded-2xl bg-zinc-50 border border-zinc-100 px-3 py-5">
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
 <div className="bg-white rounded-3xl p-5 sm:p-6 space-y-0 text-left shrink-0 shadow-sm border border-zinc-200/80">
 <div className="flex justify-between items-center gap-4 py-3 border-b border-zinc-100">
 <div className="flex items-center gap-3 text-zinc-500 ">
 <Calendar size={16} />
 <span className="text-xs font-bold">{t.profilePage?.placedOn || 'Order Placed'}</span>
 </div>
 <span className="text-sm font-black text-zinc-900 ">
 {new Date(selectedOrder.createdAt).toLocaleString('en-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>

 <div className="flex justify-between items-center gap-4 py-3 border-b border-zinc-100">
 <div className="flex items-center gap-3 text-zinc-500 ">
 <CreditCard size={16} />
 <span className="text-xs font-bold">{t.profilePage?.payment || 'Payment Method'}</span>
 </div>
 <span className="text-sm font-black text-zinc-900 ">{translatePayment(selectedOrder.paymentMethod)}</span>
 </div>

 <div className="flex justify-between items-center gap-4 py-3 border-b border-zinc-100">
 <div className="flex items-center gap-3 text-zinc-500 ">
 <MapPin size={16} />
 <span className="text-xs font-bold">{t.profilePage?.fulfillment || 'Fulfillment Method'}</span>
 </div>
 <span className="text-sm font-black text-zinc-900 ">{translateOrderMode(selectedOrder.deliveryMode)}</span>
 </div>

 <div className="flex justify-between items-center gap-4 py-3">
 <div className="flex items-center gap-3 text-zinc-500 ">
 <Info size={16} />
 <span className="text-xs font-bold">{t.profilePage?.orderStatus || 'Order Status'}</span>
 </div>
 <span className={`text-xs font-black px-3 py-1.5 rounded-full ${selectedOrder.status === 'Completed' ? 'text-green-700 bg-green-50' : selectedOrder.status === 'Cancelled' ? 'text-red-700 bg-red-50' : 'text-orange-700 bg-orange-50'}`}>
 {statusTranslations[selectedOrder.status as string]?.[locale as string] || selectedOrder.status}
 </span>
 </div>

 <div className="hidden md:block pt-5 mt-3">
 <button 
 onClick={handleDownloadReceipt}
 disabled={isGeneratingPdf || selectedOrder.status === 'Cancelled'}
 className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-zinc-900/10"
 >
 {isGeneratingPdf ? <Loader2 className="animate-spin" size={18} /> : <Receipt size={18} />}
 {isGeneratingPdf ? (t.profilePage?.generatingPdf || 'Generating PDF...') : (t.profilePage?.downloadReceipt || 'Download Receipt')}
 </button>
 {selectedOrder.status === 'Cancelled' && <p className="text-center text-xs text-zinc-500 mt-3">Receipts are unavailable for cancelled orders.</p>}
 </div>
 </div>

 </div>

 {/* Right Side: Order Items */}
 <div className="w-full md:w-[48%] shrink-0 md:shrink bg-white px-4 py-5 sm:px-6 sm:py-6 md:p-8 lg:p-10 flex flex-col md:min-h-0 relative">
 
 {/* Card 3: Order Items */}
 <div className="bg-white rounded-3xl p-5 sm:p-6 mb-4 flex flex-col shrink-0 md:flex-1 md:min-h-0 border border-zinc-200/80 shadow-sm">
 <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-4 shrink-0 flex items-center justify-between">
 {t.profilePage?.orderItems || 'Order Items'}
 <span className="normal-case tracking-normal text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">
  {locale === 'zh'
   ? `${selectedOrder.items?.length || 0} 件商品`
   : `${selectedOrder.items?.length || 0} ${(selectedOrder.items?.length || 0) === 1 ? 'item' : 'items'}`}
 </span>
 </h3>

 {/* Items List */}
 <div className="space-y-0 shrink-0 md:flex-1 md:overflow-y-auto md:custom-scrollbar pr-0 md:pr-2 md:min-h-0">
 {selectedOrder.items?.map((item: any, idx: number) => (
 <div key={idx} className="flex items-center gap-3 py-4 border-b border-zinc-100 last:border-0">
 {item.image ? <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-cover bg-zinc-100 shrink-0" /> : <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0"><Package size={18} /></div>}
 <div className="flex-1 min-w-0">
 <p className="text-sm font-bold text-zinc-900 line-clamp-2 leading-snug">{locale === 'zh' && item.nameZh ? item.nameZh : item.name}</p>
 <p className="text-xs text-zinc-500 mt-1">RM {item.price.toFixed(2)} <span className="text-zinc-300">×</span> {item.quantity}</p>
 </div>
 <div className="text-right shrink-0">
 <p className="text-sm font-black text-zinc-900">RM {(item.price * item.quantity).toFixed(2)}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Card 4: Billing Summary */}
 <div className="mt-0 shrink-0 space-y-3 rounded-none border-0 bg-transparent p-0 md:rounded-3xl md:border md:border-zinc-200/80 md:bg-zinc-50 md:p-6">
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
 <span className="text-2xl sm:text-3xl font-black tracking-tighter text-zinc-900">
 RM {selectedOrder.totalAmount.toFixed(2)}
 </span>
 </div>
 </div>

 {/* Mobile Download Receipt Button */}
 <div className="md:hidden -mx-4 px-4 pt-3 pb-4 mt-2 shrink-0 bg-white/95 backdrop-blur border-t border-zinc-200">
 <button 
 onClick={handleDownloadReceipt}
 disabled={isGeneratingPdf || selectedOrder.status === 'Cancelled'}
 className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-2xl shadow-lg shadow-zinc-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isGeneratingPdf ? <Loader2 className="animate-spin" size={18} /> : <Receipt size={18} />}
 {isGeneratingPdf ? (t.profilePage?.generatingPdf || 'Generating PDF...') : (t.profilePage?.downloadReceipt || 'Download Receipt')}
 </button>
 {selectedOrder.status === 'Cancelled' && <p className="text-center text-xs text-zinc-500 mt-3">Receipts are unavailable for cancelled orders.</p>}
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
