import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Package, User, Phone, MapPin, CreditCard, Truck, 
  Calendar, Clock, CheckCircle2, AlertCircle, Activity, MessageSquare, 
  Save, Zap, ExternalLink, Mail, Smartphone, X, FileText, FileDown,
  Info, ArrowDown, ArrowRight, ChevronDown, Edit, BookOpen, Bell, List, Shield, Check, XCircle, Flag
} from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { useLanguage } from '../../../context/LanguageContext';
import { useBusiness } from '../../../context/BusinessContext';
import { cn } from '../../../utils/cn';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { ReceiptTemplate } from '../../../components/profile/ReceiptTemplate';
import SpotlightCard from '../../../components/ui/SpotlightCard';

const OrderDetailsPage = () => {
  const router = useRouter();
  const { id, viewOnly, customerId } = router.query;
  const { t, language } = useLanguage();
  const { settings } = useBusiness();
  
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal & Receipt State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Communication State
  const [messageText, setMessageText] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');

  const quickMessages = [
    { label: t('qm_processing') || "Processing", text: t('qm_processing_text') || "We have received your order and are currently processing it." },
    { label: t('qm_out_for_delivery') || "Out for Delivery", text: t('qm_out_for_delivery_text') || "Great news! Your order is out for delivery." },
    { label: t('qm_ready_for_pickup') || "Ready for Pickup", text: t('qm_ready_for_pickup_text') || "Your order is packed and ready for pickup!" },
    { label: t('qm_delayed') || "Delayed", text: t('qm_delayed_text') || "There is a slight delay with your order, we will keep you updated." },
  ];

  // More Actions State
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isEditAddressModalOpen, setIsEditAddressModalOpen] = useState(false);
  const [editAddressText, setEditAddressText] = useState('');
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
          setNewStatus(data.status);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  
  
  const getTranslatedDeliveryMode = (mode: string) => {
    if (!mode) return 'N/A';
    const m = mode.toLowerCase();
    if (m.includes('self') || m.includes('collect')) return t('self_collect') || 'Self Collect';
    if (m.includes('delivery')) return t('delivery') || 'Delivery';
    return mode;
  };

  
  const getTranslatedStatus = (status: string) => {
    switch(status) {
      case 'Completed': return t('completed_filter') || 'Completed';
      case 'Pending': return t('pending_filter') || 'Pending';
      case 'In Process': return t('in_process_filter') || 'In Process';
      case 'Delivering': return t('delivering_filter') || 'Delivering';
      case 'Cancelled': return t('cancelled_filter') || 'Cancelled';
      default: return status;
    }
  };

  const getTranslatedPaymentMethod = (method: string) => {
    if (!method) return 'N/A';
    const pm = method.toLowerCase();
    if (pm.includes('cash') || pm.includes('cod') || pm.includes('delivery')) return t('cash_on_delivery') || 'Cash On Delivery';
    if (pm.includes('bank') || pm.includes('transfer')) return t('bank_transfer') || 'Bank Transfer';
    if (pm.includes('duitnow') || pm.includes('qr')) return t('qr_code') || 'DuitNow QR Code';
    return method;
  };

  const handleUpdateStatus = async (statusArg?: string | React.MouseEvent) => {
    const statusToSet = typeof statusArg === 'string' ? statusArg : newStatus;
    setIsUpdating(true);
    setSuccess('');
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusToSet }),
      });

      if (res.ok) {
        setOrder({ ...order, status: statusToSet });
        if (statusToSet !== order.status) setNewStatus(statusToSet);
        setSuccess(statusToSet === 'Cancelled' ? 'Order cancelled and stock restored successfully!' : 'Order status updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
      setIsCancelModalOpen(false);
    }
  };

  const handleCancelOrder = () => {
    handleUpdateStatus('Cancelled');
  };

  const handleResendEmail = async () => {
    setIsResendingEmail(true);
    setIsMoreActionsOpen(false);
    try {
      const res = await fetch(`/api/orders/${id}/resend`, { method: 'POST' });
      if (res.ok) {
        setEmailSuccess('Receipt resent to customer successfully!');
        setTimeout(() => setEmailSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResendingEmail(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!editAddressText.trim()) return;
    setIsSavingAddress(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: editAddressText }),
      });
      if (res.ok) {
        setOrder({ ...order, address: editAddressText });
        setIsEditAddressModalOpen(false);
        setSuccess('Shipping address updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSendEmail = async () => {
    if (!messageText.trim() || !order?.customer?.email) return;
    setIsSendingEmail(true);
    try {
      const res = await fetch(`/api/orders/${id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'Order Update', message: messageText })
      });
      if (res.ok) {
        setEmailSuccess('Email sent successfully!');
        setMessageText('');
        setTimeout(() => setEmailSuccess(''), 3000);
      } else {
        const errorData = await res.json();
        alert('Failed to send email: ' + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!messageText.trim() || !order?.customer?.phone) return;
    const phone = order.customer.phone.replace(/\D/g, '');
    const formattedPhone = phone.startsWith('60') ? phone : `60${phone.replace(/^0/, '')}`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(`Hi ${order.customer.name}, regarding Order #${order.id.slice(-8).toUpperCase()}:\n\n${messageText}`)}`;
    window.open(url, '_blank');
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current || !order) return;
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
      pdf.save(`Receipt_${order.id.slice(-8).toUpperCase()}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF receipt. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const statusOptions = [
    { value: 'Pending', label: t('incoming'), icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { value: 'In Process', label: t('processing'), icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { value: 'Delivering', label: t('out_for_delivery'), icon: Truck, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { value: 'Completed', label: t('fulfilled'), icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { value: 'Cancelled', label: t('cancelled'), icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  const getStatusIndex = (status: string) => {
    const orderIndex = ['Pending', 'In Process', 'Delivering', 'Completed'];
    return orderIndex.indexOf(status);
  };

  const isStatusDisabled = (statusValue: string) => {
    if (order.status === 'Cancelled' || order.status === 'Completed') {
      return statusValue !== order.status;
    }
    if (statusValue === 'Cancelled') return false;
    const currentIndex = getStatusIndex(order.status);
    const targetIndex = getStatusIndex(statusValue);
    return targetIndex !== currentIndex + 1 && targetIndex !== currentIndex;
  };

  if (isLoading) return (
    <AdminLayout title={t('order_contents')}>
      <div className="p-32 text-center text-zinc-500 font-black uppercase tracking-widest text-xs animate-pulse">{t('scanning_order_records')}</div>
    </AdminLayout>
  );

  if (!order) return (
    <AdminLayout title={t('order_contents')}>
      <div className="p-32 text-center text-zinc-500 font-black uppercase tracking-widest text-xs">{t('order_record_not_found')}</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title={t('order_contents')} hideTitle={true}>
      
      {/* Hidden PDF Receipt Renderer */}
      <div className="absolute left-[-9999px] top-[-9999px] z-[-1] overflow-hidden pointer-events-none">
        <div ref={receiptRef} className="w-[800px] bg-white text-black p-8">
          <ReceiptTemplate order={order} businessSettings={settings} user={{}} />
        </div>
      </div>

      <div className="w-full space-y-4">
        
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => viewOnly && customerId ? router.push(`/admin/customer/${customerId}`) : router.push('/admin/orders')}
              className="text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900">{t('orders') || 'Orders'}</h1>
              <span className="text-2xl font-black text-zinc-900">#{order.id.slice(-8).toUpperCase()}</span>
              <span className={cn(
                "px-2.5 py-1 text-xs font-bold uppercase rounded-md tracking-wider ml-2",
                order.status === 'Pending' ? "bg-yellow-100 text-yellow-700" :
                order.status === 'In Process' ? "bg-blue-100 text-blue-700" :
                order.status === 'Delivering' ? "bg-purple-100 text-purple-700" :
                order.status === 'Completed' ? "bg-green-100 text-green-700" :
                "bg-red-100 text-red-700"
              )}>
                {getTranslatedStatus(order.status)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <div className="relative">
              <button 
                onClick={() => setIsMoreActionsOpen(!isMoreActionsOpen)}
                className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 shadow-sm"
              >
                {t('more_actions') || 'More actions'} <ChevronDown size={16} className={cn("transition-transform", isMoreActionsOpen && "rotate-180")} />
              </button>
              
              <AnimatePresence>
                {isMoreActionsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMoreActionsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-zinc-200 z-50 py-2 overflow-hidden"
                    >
                      <button 
                        onClick={() => {
                          setIsMoreActionsOpen(false);
                          setEditAddressText(order.address || order.customer?.address || '');
                          setIsEditAddressModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-3"
                      >
                        <MapPin size={16} className="text-zinc-400" />
                        {t('edit_shipping_address') || 'Edit Shipping Address'}
                      </button>
                      
                      <button 
                        onClick={handleResendEmail}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-3"
                      >
                        {isResendingEmail ? <Activity size={16} className="text-zinc-400 animate-spin" /> : <Mail size={16} className="text-zinc-400" />}
                        {isResendingEmail ? (t('sending') || 'Sending...') : (t('resend_confirmation') || 'Resend Confirmation')}
                      </button>
                      
                      <div className="h-px bg-zinc-200 my-1 mx-2" />
                      
                      <button 
                        onClick={() => {
                          setIsMoreActionsOpen(false);
                          setIsCancelModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3"
                      >
                        <AlertCircle size={16} />
                        {t('refund_cancel_order') || 'Refund / Cancel Order'}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={handleUpdateStatus}
              disabled={isUpdating || newStatus === order.status}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-bold hover:bg-yellow-600 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              {isUpdating ? <Activity size={16} className="animate-spin" /> : <Save size={16} />}
              {t('save_changes') || 'Save changes'}
            </button>
          </div>
        </div>
        <div className="px-10 -mt-6 mb-6">
           <p className="text-xs font-medium text-zinc-500">{t('placed_on') || 'Placed on'} {new Date(order.createdAt).toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Order Status */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{t('order_status_title') || 'Order Status'}</p>
              <p className="font-bold text-zinc-900">{getTranslatedStatus(order.status)}</p>
            </div>
          </div>
          {/* Payment Method */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{t('payment_method_title') || 'Payment Method'}</p>
              <p className="font-bold text-zinc-900">{getTranslatedPaymentMethod(order.paymentMethod)}</p>
            </div>
          </div>
          {/* Fulfillment Method */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{t('fulfillment_method_title') || 'Fulfillment Method'}</p>
              <p className="font-bold text-zinc-900">{getTranslatedDeliveryMode(order.deliveryMode)}</p>
            </div>
          </div>
          {/* Total Amount */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{t('total_amount') || 'Total Amount'}</p>
              <p className="font-bold text-green-600 text-lg">RM {order.totalAmount?.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Info Card */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col shadow-sm">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <User size={18} className="text-blue-500" />
                      <h3 className="font-bold text-sm text-zinc-800">{t('customer_info') || 'Customer Information'}</h3>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 text-lg shrink-0">
                      {order.customer?.name?.substring(0, 2).toUpperCase() || 'NA'}
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-900">{order.customer?.name}</p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Phone size={12} /> <span>{order.customer?.phone}</span>
                      </div>
                      {order.customer?.email && (
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Mail size={12} /> <span>{order.customer?.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-zinc-100 pt-4">
                  <p className="text-[10px] uppercase font-bold text-zinc-400 mb-2">{t('shipping_address') || 'Shipping Address'}</p>
                  <div className="flex items-start gap-2 text-sm text-zinc-700">
                    <MapPin size={16} className="text-zinc-400 mt-0.5 shrink-0" />
                    <p>{(order.address === 'Self Collect' || order.customer?.address === 'Self Collect') ? (t('self_collect') || 'Self Collect') : (order.address || order.customer?.address || (t('no_address_provided') || 'No address provided'))}</p>
                  </div>
                </div>
              </div>

              {/* Payment & Fulfillment Card */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col shadow-sm">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <CreditCard size={18} className="text-blue-500" />
                      <h3 className="font-bold text-sm text-zinc-800">{t('payment_fulfillment') || 'Payment & Fulfillment'}</h3>
                    </div>
                    {order.paymentReceiptUrl && (
                      <button onClick={() => setIsReceiptModalOpen(true)} className="text-xs text-zinc-500 hover:text-zinc-800 font-medium transition-colors">{t('view_receipt') || 'View receipt'}</button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">{t('payment_method_title') || 'Payment Method'}</p>
                      <p className="text-sm font-semibold text-zinc-900">{getTranslatedPaymentMethod(order.paymentMethod)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">{t('fulfillment_method_title') || 'Fulfillment Method'}</p>
                      <p className="text-sm font-semibold text-zinc-900">{order.deliveryMode || 'N/A'}</p>
                    </div>
                    {order.paymentReceiptUrl && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">{t('payment_receipt') || 'Payment Receipt'}</p>
                        <button onClick={() => setIsReceiptModalOpen(true)} className="flex items-center gap-1 text-sm text-blue-500 hover:underline">
                          <FileText size={14} /> view receipt
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100">
                  <button 
                    onClick={handleDownloadReceipt}
                    disabled={isGeneratingPdf}
                    className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isGeneratingPdf ? <Activity size={16} className="animate-spin" /> : <FileDown size={16} />}
                    {t('generate_receipt') || 'Generate Receipt'}
                  </button>
                </div>
              </div>
            </div>

            {/* Order Contents Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-blue-500" />
                  <h3 className="font-bold text-sm text-zinc-800">{t('order_contents') || 'Order Contents'}</h3>
                </div>
                <span className="text-xs font-bold text-zinc-500">
                  {order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0} Item{(order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0) !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-4">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-50/50 border border-zinc-100 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-400 shadow-sm">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-zinc-900">{language === 'zh' ? item.product?.nameZh || item.nameZh || item.name : language === 'ms' ? item.product?.nameMs || item.nameMs || item.name : item.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">RM {item.price.toFixed(2)} × {item.quantity}</p>
                      </div>
                    </div>
                    <div className="font-bold text-sm text-zinc-900">
                      RM {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-100 space-y-3">
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>{t('subtotal') || 'Subtotal'}</span>
                  <span>RM {order.totalAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-zinc-900">{t('total_amount') || 'Total Amount'}</span>
                  <span className="text-xl font-bold text-green-600">RM {order.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>
          
          <div className="space-y-6">
            {/* Order Status Timeline Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-blue-500" />
                  <h3 className="font-bold text-sm text-zinc-800">{t('order_status_title') || 'Order Status'}</h3>
                </div>
                <button 
                  onClick={() => setIsTutorialModalOpen(true)}
                  className="text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-full transition-colors"
                >
                  <Info size={16} />
                </button>
              </div>
              
              <div className="space-y-3">
                {statusOptions.map((status, index) => {
                  const isActive = newStatus === status.value;
                  const isCurrent = order.status === status.value;
                  const disabled = isStatusDisabled(status.value);
                  
                  return (
                    <div key={status.value} className="relative flex items-center">
                      {/* Timeline Line */}
                      {index !== statusOptions.length - 1 && (
                        <div className="absolute left-2.5 top-8 bottom-[-16px] w-[2px] bg-zinc-100" />
                      )}
                      
                      <button
                        onClick={() => setNewStatus(status.value)}
                        disabled={disabled}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                          isActive ? "bg-yellow-50 border-yellow-200" : "bg-transparent border-transparent hover:bg-zinc-50",
                          disabled && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-colors",
                            isActive ? "border-yellow-500 bg-white" : "border-zinc-300 bg-white"
                          )}>
                            {isActive && <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />}
                          </div>
                          <span className={cn(
                            "text-sm font-semibold transition-colors",
                            isActive ? "text-yellow-700" : "text-zinc-600"
                          )}>
                            {status.value === 'Completed' ? (t('completed_filter') || 'Completed') :
                             status.value === 'Pending' ? (t('pending_filter') || 'Pending') :
                             status.value === 'In Process' ? (t('in_process_filter') || 'In Process') :
                             status.value === 'Delivering' ? (t('delivering_filter') || 'Delivering') :
                             status.value === 'Cancelled' ? (t('cancelled_filter') || 'Cancelled') : status.value}
                          </span>
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] uppercase font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-md">
                            {t('current') || 'Current'}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 p-3 bg-yellow-50/50 border border-yellow-100 rounded-lg flex gap-2 text-yellow-700">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{t('update_status_desc') || 'Update the status to keep your customer informed.'}</p>
              </div>
            </div>

            {/* Communication Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare size={18} className="text-blue-500" />
                <h3 className="font-bold text-sm text-zinc-800">{t('communication') || 'Communication'}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-zinc-700 mb-2">{t('quick_messages') || 'Quick Messages'}</p>
                  <div className="flex flex-wrap gap-2">
                    {quickMessages.map((msg, i) => (
                      <button
                        key={i}
                        onClick={() => setMessageText(msg.text)}
                        className="px-3 py-1.5 rounded-md border border-zinc-200 text-[10px] font-bold text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
                      >
                        {msg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={t('type_message_placeholder') || 'Type a message to the customer...'}
                    className="w-full min-h-[100px] p-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleSendEmail}
                    disabled={!messageText.trim() || isSendingEmail || !order.customer?.email}
                    className={cn(
                      "flex-1 py-2.5 px-4 text-white rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2",
                      isSendingEmail 
                        ? "bg-zinc-700 cursor-wait animate-pulse" 
                        : "bg-zinc-600 hover:bg-zinc-700 disabled:opacity-50"
                    )}
                  >
                    {isSendingEmail ? <Activity size={14} className="animate-spin" /> : <Mail size={14} />}
                    {isSendingEmail ? (t('sending') || 'Sending...') : (t('email') || 'Email')}
                  </button>
                  <button
                    onClick={handleSendWhatsApp}
                    disabled={!messageText.trim() || !order.customer?.phone}
                    className="flex-1 py-2.5 px-4 bg-[#25D366] text-white rounded-lg font-bold text-xs hover:bg-[#20bd5a] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#25D366]/20"
                  >
                    <Smartphone size={14} />
                    {t('whatsapp') || 'WhatsApp'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {isReceiptModalOpen && order?.paymentReceiptUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8"
            onClick={() => setIsReceiptModalOpen(false)}
          >
            <button 
              onClick={() => setIsReceiptModalOpen(false)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={24} />
            </button>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-full rounded-2xl overflow-hidden shadow-2xl"
            >
              <img 
                src={order.paymentReceiptUrl} 
                alt="Payment Receipt" 
                className="w-full h-auto max-h-[85vh] object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Modal */}
      <AnimatePresence>
        {isTutorialModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8"
              onClick={() => setIsTutorialModalOpen(false)}
            >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[1400px] bg-white rounded-[32px] overflow-hidden shadow-2xl p-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 pb-6 border-b border-zinc-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-zinc-900">{t('status_tutorial_title') || 'Status Flow Tutorial'}</h2>
                    <p className="text-sm text-zinc-500 mt-1">{t('status_flow_tutorial_subtitle') || 'Learn how orders move through each stage and the actions you can take.'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 max-w-sm hidden md:flex">
                    <Info size={20} className="text-orange-500 shrink-0" />
                    <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                      {t('status_flow_info') || 'Order statuses follow a strict sequential flow to ensure accurate tracking and smooth fulfillment.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsTutorialModalOpen(false)}
                    className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center hover:bg-zinc-200 transition-colors shrink-0"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-12">
                {/* Flowchart Container */}
                <div className="relative w-full overflow-x-auto custom-scrollbar pb-4">
                  <div className="min-w-fit px-6 pt-6 relative">
                    {/* Connection Arrows (horizontal) */}
                    <div className="absolute top-[136px] left-[12.5%] right-[12.5%] h-[2px] bg-zinc-200 z-0 hidden lg:block"></div>
                    
                    {/* Grid for main 4 steps */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
                      
                      {/* Step 1: Pending */}
                      <div className="relative">
                        <div className="absolute -top-3 -left-3 w-8 h-8 bg-white border-2 border-orange-500 text-orange-500 rounded-full flex items-center justify-center font-black text-xs z-20">01</div>
                        
                        <div className="bg-white border border-zinc-200 rounded-2xl p-6 h-full flex flex-col shadow-sm relative z-10">
                          <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4">
                              <Clock size={32} />
                            </div>
                            <h3 className="font-black text-lg text-zinc-900">{t('pending_filter') || 'Pending'}</h3>
                            <p className="text-xs text-zinc-500 mt-2 h-10">{t('pending_table_desc') || 'Awaiting confirmation or payment review.'}</p>
                          </div>
                          
                          <div className="mt-auto border-t border-zinc-100 pt-4">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t('actions_label') || 'ACTIONS'}</span>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-2.5 rounded-xl text-sm font-bold">
                                <CheckCircle2 size={16} className="text-green-500" />
                                {t('confirm_order_action') || 'Confirm Order'}
                              </div>
                              <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-4 py-2.5 rounded-xl text-sm font-bold">
                                <XCircle size={16} className="text-red-500" />
                                {t('cancel_order_action') || 'Cancel Order'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-28 -right-3 w-6 h-6 bg-white border border-zinc-200 text-zinc-400 rounded-full flex items-center justify-center z-20 hidden lg:flex">
                           <ArrowRight size={14} />
                        </div>
                      </div>

                      {/* Step 2: In Process */}
                      <div className="relative">
                        <div className="absolute -top-3 -left-3 w-8 h-8 bg-white border-2 border-blue-500 text-blue-500 rounded-full flex items-center justify-center font-black text-xs z-20">02</div>
                        
                        <div className="bg-white border border-zinc-200 rounded-2xl p-6 h-full flex flex-col shadow-sm relative z-10">
                          <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                              <Package size={32} />
                            </div>
                            <h3 className="font-black text-lg text-zinc-900">{t('in_process_filter') || 'In Process'}</h3>
                            <p className="text-xs text-zinc-500 mt-2 h-10">{t('in_process_table_desc') || 'Order is confirmed. Items are being packed and prepared.'}</p>
                          </div>
                          
                          <div className="mt-auto border-t border-zinc-100 pt-4">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t('actions_label') || 'ACTIONS'}</span>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 text-purple-700 px-4 py-2.5 rounded-xl text-sm font-bold">
                                <Truck size={16} className="text-purple-500" />
                                {t('start_delivery_action') || 'Start Delivery'}
                              </div>
                              <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-4 py-2.5 rounded-xl text-sm font-bold">
                                <XCircle size={16} className="text-red-500" />
                                {t('cancel_order_action') || 'Cancel Order'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-28 -right-3 w-6 h-6 bg-white border border-zinc-200 text-zinc-400 rounded-full flex items-center justify-center z-20 hidden lg:flex">
                           <ArrowRight size={14} />
                        </div>
                      </div>

                      {/* Step 3: Delivering */}
                      <div className="relative">
                        <div className="absolute -top-3 -left-3 w-8 h-8 bg-white border-2 border-purple-500 text-purple-500 rounded-full flex items-center justify-center font-black text-xs z-20">03</div>
                        
                        <div className="bg-white border border-zinc-200 rounded-2xl p-6 h-full flex flex-col shadow-sm relative z-10">
                          <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-4">
                              <Truck size={32} />
                            </div>
                            <h3 className="font-black text-lg text-zinc-900">{t('delivering_filter') || 'Delivering'}</h3>
                            <p className="text-xs text-zinc-500 mt-2 h-10">{t('delivering_table_desc') || 'Package is out for delivery or ready for customer pickup.'}</p>
                          </div>
                          
                          <div className="mt-auto border-t border-zinc-100 pt-4">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 block">{t('actions_label') || 'ACTIONS'}</span>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 px-4 py-2.5 rounded-xl text-sm font-bold">
                                <CheckCircle2 size={16} className="text-green-500" />
                                {t('mark_completed_action') || 'Mark Completed'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-28 -right-3 w-6 h-6 bg-white border border-zinc-200 text-zinc-400 rounded-full flex items-center justify-center z-20 hidden lg:flex">
                           <ArrowRight size={14} />
                        </div>
                      </div>

                      {/* Step 4: Completed */}
                      <div className="relative h-full flex flex-col">
                        <div className="absolute -top-3 -left-3 w-8 h-8 bg-white border-2 border-green-500 text-green-500 rounded-full flex items-center justify-center font-black text-xs z-20">04</div>
                        
                        <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex-1 flex flex-col shadow-sm relative z-10">
                          <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
                              <CheckCircle2 size={32} />
                            </div>
                            <h3 className="font-black text-lg text-zinc-900">{t('completed_filter') || 'Completed'}</h3>
                            <p className="text-xs text-zinc-500 mt-2">{t('completed_table_desc') || 'Order successfully fulfilled. No further actions required.'}</p>
                          </div>
                          
                          <div className="mt-auto flex justify-center pt-4">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                              {t('final_status') || 'FINAL STATUS'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Connecting Lines for Cancelled Block (Grid Overlay) */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative mt-[-10px] h-14 hidden lg:grid pointer-events-none z-0">
                      {/* Col 1: Pending Lines */}
                      <div className="relative">
                        {/* Vertical line down from center of Pending Cancel button */}
                        <div className="absolute top-0 left-1/2 w-px h-6 bg-red-300 -translate-x-1/2"></div>
                        {/* Horizontal line from center going right */}
                        <div className="absolute top-6 left-1/2 w-[35%] h-px bg-red-300"></div>
                        {/* Downward arrow */}
                        <div className="absolute top-6 left-[85%] w-px h-8 bg-red-300">
                          <div className="absolute -bottom-[2px] -left-[4px] border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-red-300"></div>
                        </div>
                      </div>

                      {/* Col 2: In Process Lines */}
                      <div className="relative">
                        {/* Vertical line down from center of In Process Cancel button */}
                        <div className="absolute top-0 left-1/2 w-px h-6 bg-red-300 -translate-x-1/2"></div>
                        {/* Horizontal line from center going left */}
                        <div className="absolute top-6 right-1/2 w-[35%] h-px bg-red-300"></div>
                        {/* Downward arrow */}
                        <div className="absolute top-6 left-[15%] w-px h-8 bg-red-300">
                          <div className="absolute -bottom-[2px] -left-[4px] border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-red-300"></div>
                        </div>
                      </div>
                    </div>

                    {/* Cancelled Block */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-[2.5rem] relative z-10">
                      <div className="col-start-1 lg:col-span-2 flex justify-center">
                        <div className="w-[85%] bg-white border-2 border-red-200 border-dashed rounded-2xl p-6 shadow-sm flex items-center gap-6 relative">
                          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center shrink-0">
                            <X size={24} />
                          </div>
                          <div>
                            <h3 className="font-black text-lg text-red-600">{t('cancelled_filter') || 'Cancelled'}</h3>
                            <p className="text-xs text-zinc-500 mt-1">{t('cancelled_table_desc') || 'Order was cancelled before fulfillment.'}</p>
                          </div>
                          <div className="ml-auto">
                            <span className="bg-red-50 text-red-700 border border-red-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                              {t('terminal_status') || 'TERMINAL STATUS'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer Notifications Box (Full width below cards) */}
                    <div className="mt-8 relative z-10">
                      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                          <Bell size={18} className="text-zinc-600" />
                          <h4 className="font-bold text-sm text-zinc-900">{t('customer_notifications') || 'Customer Notifications'}</h4>
                        </div>
                        <div className="flex items-start justify-between">
                          {[
                            { icon: Mail, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', text: t('pending_filter') || 'Pending', msg: t('notif_pending') || '"Your order has been received."' },
                            { icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', text: t('in_process_filter') || 'In Process', msg: t('notif_in_process') || '"We\'re preparing your order."' },
                            { icon: Mail, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', text: t('delivering_filter') || 'Delivering', msg: t('notif_delivering') || '"Your order is on the way."' },
                            { icon: Mail, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100', text: t('completed_filter') || 'Completed', msg: t('notif_completed') || '"Your order has been delivered."' },
                            { icon: Mail, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', text: t('cancelled_filter') || 'Cancelled', msg: t('notif_cancelled') || '"Your order was cancelled."' }
                          ].map((item, idx, arr) => (
                            <div key={idx} className="flex flex-col items-center w-[72px] text-center relative flex-1">
                              <div className={`w-10 h-10 rounded-full border ${item.border} ${item.bg} ${item.color} flex items-center justify-center mb-2 mx-auto`}>
                                <item.icon size={16} />
                              </div>
                              <span className="font-bold text-[10px] text-zinc-900 mb-1 leading-tight">{item.text}</span>
                              <span className="text-[9px] text-zinc-500 leading-tight block px-2">{item.msg}</span>
                              {idx < arr.length - 1 && (
                                <ArrowRight size={14} className="text-zinc-300 absolute top-3 -right-3 hidden md:block" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Bottom Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Status Overview Table */}
                  <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50">
                      <List size={18} className="text-orange-500" />
                      <h4 className="font-bold text-sm text-zinc-900">{t('status_overview') || 'Status Overview'}</h4>
                    </div>
                    <div className="p-4 flex-1 overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="text-zinc-500 border-b border-zinc-100">
                            <th className="pb-3 font-bold">{t('status_col') || 'Status'}</th>
                            <th className="pb-3 font-bold">{t('desc_col') || 'Description'}</th>
                            <th className="pb-3 font-bold">{t('allowed_actions_col') || 'Allowed Actions'}</th>
                            <th className="pb-3 font-bold">{t('type_col') || 'Type'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                          {[
                            { status: t('pending_filter') || 'Pending', desc: t('pending_table_desc'), actions: t('action_confirm_cancel'), type: t('type_active'), dot: 'bg-orange-500', tColor: 'text-orange-700', bg: 'bg-orange-50' },
                            { status: t('in_process_filter') || 'In Process', desc: t('in_process_table_desc'), actions: t('action_start_cancel'), type: t('type_active'), dot: 'bg-blue-500', tColor: 'text-blue-700', bg: 'bg-blue-50' },
                            { status: t('delivering_filter') || 'Delivering', desc: t('delivering_table_desc'), actions: t('action_mark_complete'), type: t('type_active'), dot: 'bg-purple-500', tColor: 'text-purple-700', bg: 'bg-purple-50' },
                            { status: t('completed_filter') || 'Completed', desc: t('completed_table_desc'), actions: t('action_none'), type: t('type_terminal'), dot: 'bg-green-500', tColor: 'text-green-700', bg: 'bg-green-50' },
                            { status: t('cancelled_filter') || 'Cancelled', desc: t('cancelled_table_desc'), actions: t('action_none'), type: t('type_terminal'), dot: 'bg-red-500', tColor: 'text-red-700', bg: 'bg-red-50' }
                          ].map((row, i) => (
                            <tr key={i} className="text-zinc-600">
                              <td className="py-3 pr-3 font-bold text-zinc-900 flex items-center gap-1.5 whitespace-nowrap">
                                <span className={`w-1.5 h-1.5 rounded-full ${row.dot}`}></span>
                                {row.status}
                              </td>
                              <td className="py-3 pr-3 leading-snug">{row.desc}</td>
                              <td className="py-3 pr-3">{row.actions}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.tColor} ${row.bg}`}>
                                  {row.type}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* System Rules */}
                  <div className="bg-white border border-zinc-200 rounded-2xl flex flex-col shadow-sm">
                    <div className="p-4 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50 rounded-t-2xl">
                      <Shield size={18} className="text-orange-500" />
                      <h4 className="font-bold text-sm text-zinc-900">{t('system_rules') || 'System Rules'}</h4>
                    </div>
                    <div className="p-5 flex-1">
                      <ul className="space-y-3.5">
                        {[
                          t('rule_1') || 'Orders can only move forward to the next status.',
                          t('rule_2') || 'You cannot skip any status.',
                          t('rule_3') || 'Cancellation is only allowed before delivery begins.',
                          t('rule_4') || 'Completed and Cancelled orders are terminal and cannot be changed.',
                          t('rule_5') || 'Every status update automatically notifies the customer.',
                          t('rule_6') || 'Inventory is reserved after confirmation.',
                          t('rule_7') || 'Cancelled orders automatically restore inventory.',
                          t('rule_8') || 'All actions are recorded in the order timeline.'
                        ].map((rule, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-zinc-600">
                            <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                            <span className="leading-snug">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* What Happens When You Take Action? */}
                  <div className="bg-white border border-zinc-200 rounded-2xl flex flex-col shadow-sm">
                    <div className="p-4 border-b border-zinc-100 flex items-center gap-2 bg-zinc-50 rounded-t-2xl">
                      <Zap size={18} className="text-orange-500" />
                      <h4 className="font-bold text-sm text-zinc-900">{t('action_effects_title') || 'What Happens When You Take Action?'}</h4>
                    </div>
                    <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
                      <div className="space-y-5">
                        <div className="flex gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-50 text-green-600 shrink-0">
                            <Check size={12} />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-green-700">{t('confirm_order_action')}</span>
                            <ul className="list-disc list-outside ml-3 text-[10px] text-zinc-600 mt-1 space-y-0.5">
                              <li>{t('effect_confirm_1')}</li>
                              <li>{t('effect_confirm_2')}</li>
                              <li>{t('effect_confirm_3')}</li>
                            </ul>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-50 text-purple-600 shrink-0">
                            <Truck size={12} />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-purple-700">{t('start_delivery_action')}</span>
                            <ul className="list-disc list-outside ml-3 text-[10px] text-zinc-600 mt-1 space-y-0.5">
                              <li>{t('effect_start_1')}</li>
                              <li>{t('effect_start_2')}</li>
                              <li>{t('effect_start_3')}</li>
                            </ul>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-50 text-green-600 shrink-0">
                            <CheckCircle2 size={12} />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-green-700">{t('mark_completed_action')}</span>
                            <ul className="list-disc list-outside ml-3 text-[10px] text-zinc-600 mt-1 space-y-0.5">
                              <li>{t('effect_complete_1')}</li>
                              <li>{t('effect_complete_2')}</li>
                              <li>{t('effect_complete_3')}</li>
                            </ul>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-red-600 shrink-0">
                            <X size={12} />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-red-700">{t('cancel_order_action')}</span>
                            <ul className="list-disc list-outside ml-3 text-[10px] text-zinc-600 mt-1 space-y-0.5">
                              <li>{t('effect_cancel_1')}</li>
                              <li>{t('effect_cancel_2')}</li>
                              <li>{t('effect_cancel_3')}</li>
                              <li>{t('effect_cancel_4')}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tip Footer */}
                <div className="bg-[#fff9eb] border border-[#ffe099] rounded-xl p-4 flex items-center gap-3">
                  <div className="text-orange-500 shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                  </div>
                  <p className="text-xs text-orange-900 font-medium">
                    {t('tutorial_tip') || 'Tip: Keeping the status updated helps build customer trust and improves overall order management.'}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Success Modal */}
      <AnimatePresence>
        {emailSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-widest mb-2">{t('success_exclaim') || 'Success!'}</h2>
              <p className="text-sm font-medium text-zinc-500 leading-relaxed mb-6">
                {emailSuccess}
              </p>
              <button
                onClick={() => setEmailSuccess('')}
                className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-colors"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Address Modal */}
      <AnimatePresence>
        {isEditAddressModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-zinc-900">{t('edit_shipping_address') || 'Edit Shipping Address'}</h2>
                <button onClick={() => setIsEditAddressModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-zinc-500 mb-4">{t('update_address_desc') || 'Update the delivery address for this order.'}</p>
              <textarea
                value={editAddressText}
                onChange={(e) => setEditAddressText(e.target.value)}
                className="w-full min-h-[120px] p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 text-sm text-zinc-800 resize-none mb-6"
                placeholder="Enter new shipping address..."
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditAddressModalOpen(false)}
                  className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleSaveAddress}
                  disabled={isSavingAddress || !editAddressText.trim()}
                  className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isSavingAddress ? <Activity size={16} className="animate-spin" /> : (t('save_address') || 'Save Address')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Order Modal */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden border border-red-100"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-lg font-black text-zinc-900 mb-2">{t('cancel_order_q') || 'Cancel Order?'}</h2>
              <p className="text-sm font-medium text-zinc-500 leading-relaxed mb-6">
                {t('cancel_order_confirm') || 'Are you sure you want to cancel this order?'} <strong className="text-red-500">{t('cancel_order_desc1') || 'The product stock will be automatically restored to your inventory.'}</strong> {t('cancel_order_desc2') || 'This action cannot be undone.'}
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  className="flex-1 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={isUpdating}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isUpdating ? <Activity size={16} className="animate-spin" /> : (t('cancel_order') || 'Cancel Order')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </AdminLayout>
  );
};

export default OrderDetailsPage;
