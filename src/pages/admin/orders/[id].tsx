import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Package, User, Phone, MapPin, CreditCard, Truck, 
  Calendar, Clock, CheckCircle2, AlertCircle, Activity, MessageSquare, 
  Save, Zap, ExternalLink, Mail, Smartphone, X, FileText, FileDown,
  Info, ArrowDown, ArrowRight, ChevronDown, Edit
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
  const { t } = useLanguage();
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
    { label: "Processing", text: "We have received your order and are currently processing it." },
    { label: "Out for Delivery", text: "Great news! Your order is out for delivery." },
    { label: "Ready for Pickup", text: "Your order is packed and ready for pickup!" },
    { label: "Delayed", text: "There is a slight delay with your order, we will keep you updated." },
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
              <h1 className="text-2xl font-bold text-zinc-900">Orders</h1>
              <span className="text-2xl font-black text-zinc-900">#{order.id.slice(-8).toUpperCase()}</span>
              <span className={cn(
                "px-2.5 py-1 text-xs font-bold uppercase rounded-md tracking-wider ml-2",
                order.status === 'Pending' ? "bg-yellow-100 text-yellow-700" :
                order.status === 'In Process' ? "bg-blue-100 text-blue-700" :
                order.status === 'Delivering' ? "bg-purple-100 text-purple-700" :
                order.status === 'Completed' ? "bg-green-100 text-green-700" :
                "bg-red-100 text-red-700"
              )}>
                {order.status}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <div className="relative">
              <button 
                onClick={() => setIsMoreActionsOpen(!isMoreActionsOpen)}
                className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 shadow-sm"
              >
                More actions <ChevronDown size={16} className={cn("transition-transform", isMoreActionsOpen && "rotate-180")} />
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
                        Edit Shipping Address
                      </button>
                      
                      <button 
                        onClick={handleResendEmail}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-3"
                      >
                        {isResendingEmail ? <Activity size={16} className="text-zinc-400 animate-spin" /> : <Mail size={16} className="text-zinc-400" />}
                        {isResendingEmail ? 'Sending...' : 'Resend Confirmation'}
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
                        Refund / Cancel Order
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
              Save changes
            </button>
          </div>
        </div>
        <div className="px-10 -mt-6 mb-6">
           <p className="text-xs font-medium text-zinc-500">Placed on {new Date(order.createdAt).toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Order Status */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Order Status</p>
              <p className="font-bold text-zinc-900">{order.status}</p>
            </div>
          </div>
          {/* Payment Method */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Payment Method</p>
              <p className="font-bold text-zinc-900">{order.paymentMethod || 'N/A'}</p>
            </div>
          </div>
          {/* Fulfillment Method */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Fulfillment Method</p>
              <p className="font-bold text-zinc-900">{order.deliveryMode || 'N/A'}</p>
            </div>
          </div>
          {/* Total Amount */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Amount</p>
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
                      <h3 className="font-bold text-sm text-zinc-800">Customer Information</h3>
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
                  <p className="text-[10px] uppercase font-bold text-zinc-400 mb-2">Shipping Address</p>
                  <div className="flex items-start gap-2 text-sm text-zinc-700">
                    <MapPin size={16} className="text-zinc-400 mt-0.5 shrink-0" />
                    <p>{order.address || order.customer?.address || 'No address provided'}</p>
                  </div>
                </div>
              </div>

              {/* Payment & Fulfillment Card */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col shadow-sm">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <CreditCard size={18} className="text-blue-500" />
                      <h3 className="font-bold text-sm text-zinc-800">Payment & Fulfillment</h3>
                    </div>
                    {order.paymentReceiptUrl && (
                      <button onClick={() => setIsReceiptModalOpen(true)} className="text-xs text-zinc-500 hover:text-zinc-800 font-medium transition-colors">View receipt</button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Payment Method</p>
                      <p className="text-sm font-semibold text-zinc-900">{order.paymentMethod || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Fulfillment Method</p>
                      <p className="text-sm font-semibold text-zinc-900">{order.deliveryMode || 'N/A'}</p>
                    </div>
                    {order.paymentReceiptUrl && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Payment Receipt</p>
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
                    Generate Receipt
                  </button>
                </div>
              </div>
            </div>

            {/* Order Contents Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-blue-500" />
                  <h3 className="font-bold text-sm text-zinc-800">Order Contents</h3>
                </div>
                <span className="text-xs font-bold text-zinc-500">{order.items?.length || 0} Item{order.items?.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="space-y-4">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-50/50 border border-zinc-100 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-400 shadow-sm">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-zinc-900">{item.name}</p>
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
                  <span>Subtotal</span>
                  <span>RM {order.totalAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-zinc-900">Total Amount</span>
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
                  <h3 className="font-bold text-sm text-zinc-800">Order Status</h3>
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
                            {status.value}
                          </span>
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] uppercase font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-md">
                            Current
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 p-3 bg-yellow-50/50 border border-yellow-100 rounded-lg flex gap-2 text-yellow-700">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">Update the status to keep your customer informed.</p>
              </div>
            </div>

            {/* Communication Card */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare size={18} className="text-blue-500" />
                <h3 className="font-bold text-sm text-zinc-800">Communication</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-zinc-700 mb-2">Quick Messages</p>
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
                    placeholder="Type a message to the customer..."
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
                    {isSendingEmail ? 'Sending...' : 'Email'}
                  </button>
                  <button
                    onClick={handleSendWhatsApp}
                    disabled={!messageText.trim() || !order.customer?.phone}
                    className="flex-1 py-2.5 px-4 bg-[#25D366] text-white rounded-lg font-bold text-xs hover:bg-[#20bd5a] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#25D366]/20"
                  >
                    <Smartphone size={14} />
                    WhatsApp
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
            <button 
              onClick={() => setIsTutorialModalOpen(false)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={24} />
            </button>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl bg-white rounded-[32px] overflow-hidden shadow-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-zinc-100">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                  <Info size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black italic uppercase text-zinc-900">Status Flow Tutorial</h2>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Understanding Order Progression</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                  Order statuses follow a strict sequential flow to ensure accurate tracking. You can only progress an order forward step-by-step.
                </p>
                
                <div className="relative w-full overflow-x-auto bg-zinc-50 rounded-2xl p-10 border border-zinc-200">
                  <div className="min-w-[800px]">
                    {/* Main Flow (Grid) */}
                    <div className="grid grid-cols-4 gap-8 relative z-10">
                      
                      {/* 1. Pending */}
                      <div className="relative flex justify-center">
                        <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.2)" className="w-full py-6 px-4 bg-orange-500/5 text-orange-600 rounded-2xl border border-orange-500/20 flex flex-col items-center gap-3 relative z-20 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <Clock size={28} />
                          <div className="text-center">
                             <span className="font-black text-xs uppercase tracking-widest block">Pending</span>
                             <p className="text-[10px] text-zinc-500 mt-2 font-medium leading-relaxed hidden sm:block">Order is received. Awaiting admin review or payment confirmation.</p>
                          </div>
                        </SpotlightCard>
                        {/* Horizontal Line connecting to next */}
                        <div className="absolute top-1/2 left-[50%] w-full h-[2px] bg-zinc-200 z-10 -translate-y-1/2"></div>
                        <ArrowRight size={24} className="absolute top-1/2 -translate-y-1/2 -right-5 text-zinc-400 z-30 bg-zinc-50 rounded-full p-1 border border-zinc-200" />
                      </div>

                      {/* 2. In Process */}
                      <div className="relative flex justify-center">
                        <SpotlightCard spotlightColor="rgba(59, 130, 246, 0.2)" className="w-full py-6 px-4 bg-blue-500/5 text-blue-600 rounded-2xl border border-blue-500/20 flex flex-col items-center gap-3 relative z-20 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <Activity size={28} />
                          <div className="text-center">
                             <span className="font-black text-xs uppercase tracking-widest block">In Process</span>
                             <p className="text-[10px] text-zinc-500 mt-2 font-medium leading-relaxed hidden sm:block">Order is confirmed. Items are being packed and prepared.</p>
                          </div>
                        </SpotlightCard>
                        <div className="absolute top-1/2 left-[50%] w-full h-[2px] bg-zinc-200 z-10 -translate-y-1/2"></div>
                        <ArrowRight size={24} className="absolute top-1/2 -translate-y-1/2 -right-5 text-zinc-400 z-30 bg-zinc-50 rounded-full p-1 border border-zinc-200" />
                      </div>

                      {/* 3. Delivering */}
                      <div className="relative flex justify-center">
                        <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.2)" className="w-full py-6 px-4 bg-purple-500/5 text-purple-600 rounded-2xl border border-purple-500/20 flex flex-col items-center gap-3 relative z-20 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <Truck size={28} />
                          <div className="text-center">
                             <span className="font-black text-xs uppercase tracking-widest block">Delivering</span>
                             <p className="text-[10px] text-zinc-500 mt-2 font-medium leading-relaxed hidden sm:block">Package is out for delivery or ready for customer pickup.</p>
                          </div>
                        </SpotlightCard>
                        <div className="absolute top-1/2 left-[50%] w-full h-[2px] bg-zinc-200 z-10 -translate-y-1/2"></div>
                        <ArrowRight size={24} className="absolute top-1/2 -translate-y-1/2 -right-5 text-zinc-400 z-30 bg-zinc-50 rounded-full p-1 border border-zinc-200" />
                      </div>

                      {/* 4. Completed */}
                      <div className="relative flex justify-center">
                        <SpotlightCard spotlightColor="rgba(34, 197, 94, 0.2)" className="w-full py-6 px-4 bg-green-500/5 text-green-600 rounded-2xl border border-green-500/20 flex flex-col items-center gap-3 relative z-20 bg-white shadow-sm shadow-green-500/10 hover:shadow-md transition-shadow">
                          <CheckCircle2 size={28} />
                          <div className="text-center">
                             <span className="font-black text-xs uppercase tracking-widest block">Completed</span>
                             <p className="text-[10px] text-green-600/70 mt-2 font-bold leading-relaxed hidden sm:block">Successfully fulfilled. No further actions can be taken.</p>
                          </div>
                        </SpotlightCard>
                      </div>
                    </div>

                    {/* Downward Arrows Row */}
                    <div className="grid grid-cols-4 gap-8 h-12 mt-4 relative">
                      <div className="flex justify-center border-r-2 border-dashed border-red-200 w-1/2 relative">
                        <ArrowDown size={16} className="absolute bottom-0 -right-[9px] text-red-400 bg-zinc-50" />
                      </div>
                      <div className="flex justify-center border-r-2 border-dashed border-red-200 w-1/2 relative">
                        <ArrowDown size={16} className="absolute bottom-0 -right-[9px] text-red-400 bg-zinc-50" />
                      </div>
                      <div className="flex justify-center border-r-2 border-dashed border-red-200 w-1/2 relative">
                        <ArrowDown size={16} className="absolute bottom-0 -right-[9px] text-red-400 bg-zinc-50" />
                      </div>
                      <div></div>
                    </div>

                    {/* Cancelled Block */}
                    <div className="grid grid-cols-4 gap-8 mt-4">
                      <div className="col-span-3">
                        <SpotlightCard spotlightColor="rgba(239, 68, 68, 0.2)" className="w-full py-5 px-6 bg-red-500/5 text-red-600 rounded-2xl border border-red-500/20 flex flex-col sm:flex-row items-center justify-center gap-3 bg-white relative z-20 shadow-sm shadow-red-500/5 hover:shadow-md transition-shadow">
                          <AlertCircle size={24} />
                          <div className="text-center sm:text-left">
                             <span className="font-black text-xs uppercase tracking-widest block">Cancelled</span>
                             <p className="text-[10px] text-red-500/80 mt-1 font-medium hidden sm:block">Order was cancelled before fulfillment. Stock may be returned.</p>
                          </div>
                        </SpotlightCard>
                      </div>
                      <div className="flex flex-col justify-center pl-4 border-l-4 border-red-100 rounded-lg">
                        <p className="text-xs font-black text-red-500 uppercase tracking-widest leading-relaxed">
                          Important Note:
                        </p>
                        <p className="text-[10px] font-medium text-zinc-500 mt-1 leading-relaxed">
                          Orders <strong className="text-red-500">cannot</strong> be cancelled once they reach the Completed state.
                        </p>
                      </div>
                    </div>
                  </div>
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
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-widest mb-2">Success!</h2>
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
                <h2 className="text-xl font-bold text-zinc-900">Edit Shipping Address</h2>
                <button onClick={() => setIsEditAddressModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-zinc-500 mb-4">Update the delivery address for this order.</p>
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
                  Cancel
                </button>
                <button
                  onClick={handleSaveAddress}
                  disabled={isSavingAddress || !editAddressText.trim()}
                  className="flex-1 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isSavingAddress ? <Activity size={16} className="animate-spin" /> : 'Save Address'}
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
              <h2 className="text-lg font-black text-zinc-900 mb-2">Cancel Order?</h2>
              <p className="text-sm font-medium text-zinc-500 leading-relaxed mb-6">
                Are you sure you want to cancel this order? <strong className="text-red-500">The product stock will be automatically restored to your inventory.</strong> This action cannot be undone.
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
                  {isUpdating ? <Activity size={16} className="animate-spin" /> : 'Cancel Order'}
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
