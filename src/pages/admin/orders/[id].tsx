import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Package, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  Truck, 
  Calendar, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  MessageSquare,
  Save,
  Zap
} from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { useLanguage } from '../../../context/LanguageContext';
import { cn } from '../../../utils/cn';

const OrderDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useLanguage();
  
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    setSuccess('');
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrder({ ...order, status: newStatus });
        setSuccess('Order status updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
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
    const order = ['Pending', 'In Process', 'Delivering', 'Completed'];
    return order.indexOf(status);
  };

  const isStatusDisabled = (statusValue: string) => {
    if (statusValue === 'Cancelled') return false;
    if (order.status === 'Cancelled' || order.status === 'Completed') return true;
    
    const currentIndex = getStatusIndex(order.status);
    const targetIndex = getStatusIndex(statusValue);
    
    return targetIndex !== currentIndex + 1 && targetIndex !== currentIndex;
  };

  if (isLoading) return (
    <AdminLayout title={t('order_contents')}>
      <div className="p-32 text-center text-zinc-500 font-black uppercase tracking-widest text-xs animate-pulse">Accessing Secure Records...</div>
    </AdminLayout>
  );

  if (!order) return (
    <AdminLayout title={t('order_contents')}>
      <div className="p-32 text-center text-zinc-500 font-black uppercase tracking-widest text-xs">Order Record Not Found.</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title={`${t('orders')} #${order.id.slice(-8).toUpperCase()}`}>
      <div className="space-y-8">
        
        {/* Top Actions */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.push('/admin/orders')}
            className="flex items-center gap-2 text-zinc-500 hover:text-yellow-500 transition-colors font-black uppercase text-[10px] tracking-widest group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            {t('back_to_orders')}
          </button>

          <div className="flex items-center gap-4">
             <AnimatePresence>
              {success && (
                <motion.span 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-black text-green-500 uppercase tracking-widest"
                >
                  {success}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Main Content (Items & Info) */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* Items Card */}
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-[40px] shadow-xl overflow-hidden">
              <div className="p-8 border-b dark:border-white/5 border-zinc-100 flex items-center justify-between bg-zinc-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center text-zinc-900">
                    <Package size={20} />
                  </div>
                  <h3 className="text-xl font-black italic uppercase dark:text-white text-zinc-900">{t('order_contents')}</h3>
                </div>
                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">{order.items.length} {t('items')}</span>
              </div>

              <div className="p-8">
                <div className="space-y-6">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-6 group">
                      <div className="w-20 h-20 rounded-2xl bg-zinc-500/5 border border-zinc-500/10 flex items-center justify-center overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <Package size={24} className="text-zinc-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-black dark:text-white text-zinc-900 leading-tight">{item.name}</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                          RM {item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-yellow-500 italic">RM {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 pt-8 border-t border-zinc-100 dark:border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-zinc-500 uppercase font-black text-[10px] tracking-widest">
                    <span>{t('subtotal')}</span>
                    <span>RM {order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-2xl font-black italic dark:text-white text-zinc-900">
                    <span>{t('total_amount')}</span>
                    <span className="text-yellow-500">RM {order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer & Fulfillment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-[40px] p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-zinc-500/5 flex items-center justify-center text-zinc-500">
                    <User size={20} />
                  </div>
                  <h3 className="text-sm font-black italic uppercase dark:text-white text-zinc-900">{t('customer_info')}</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t('name')}</p>
                    <p className="font-bold text-zinc-900 dark:text-white">{order.customer?.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t('contact')}</p>
                    <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <Phone size={14} className="text-primary" /> {order.customer?.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t('shipping_address')}</p>
                    <p className="font-bold text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {order.deliveryAddress || order.customer?.address || 'No address provided'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-[40px] p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-zinc-500/5 flex items-center justify-center text-zinc-500">
                    <Truck size={20} />
                  </div>
                  <h3 className="text-sm font-black italic uppercase dark:text-white text-zinc-900">{t('fulfillment_details')}</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t('payment_method')}</p>
                    <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 capitalize">
                      <CreditCard size={14} className="text-primary" /> {order.paymentMethod || order.customer?.preferredPayment || 'Manual'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t('fulfillment_mode')}</p>
                    <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 capitalize">
                      <Package size={14} className="text-primary" /> {order.fulfillmentMode || order.customer?.orderMode || 'Delivery'}
                    </p>
                  </div>
                  {order.notes && (
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t('order_notes')}</p>
                      <div className="p-3 bg-zinc-500/5 rounded-xl border border-zinc-500/10 text-xs text-zinc-500 italic">
                        <MessageSquare size={12} className="inline mr-2" />
                        "{order.notes}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar (Status Management) */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-[40px] p-8 shadow-2xl sticky top-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-zinc-500/5 flex items-center justify-center text-zinc-500">
                  <Zap size={20} />
                </div>
                <h3 className="text-sm font-black italic uppercase dark:text-white text-zinc-900">{t('order_control')}</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">{t('current_status')}</p>
                  <div className="space-y-3">
                    {statusOptions.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => setNewStatus(status.value)}
                        disabled={isStatusDisabled(status.value)}
                        className={cn(
                          "w-full p-4 rounded-[20px] border transition-all flex items-center justify-between group",
                          newStatus === status.value 
                            ? "border-yellow-500 bg-yellow-500/5 shadow-lg shadow-yellow-500/5" 
                            : "border-zinc-500/10 hover:border-zinc-500/30 bg-transparent disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            newStatus === status.value ? status.bg : "bg-zinc-500/5"
                          )}>
                            <status.icon size={16} className={newStatus === status.value ? status.color : "text-zinc-500"} />
                          </div>
                          <span className={cn(
                            "text-xs font-black uppercase tracking-widest",
                            newStatus === status.value ? "text-zinc-900 dark:text-white" : "text-zinc-500"
                          )}>
                            {status.label}
                          </span>
                        </div>
                        {newStatus === status.value && (
                          <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleUpdateStatus}
                    disabled={isUpdating || newStatus === order.status}
                    className="w-full py-5 bg-yellow-500 text-zinc-900 rounded-[24px] font-black uppercase text-[10px] tracking-widest hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-yellow-500/20"
                  >
                    {isUpdating ? <Activity size={16} className="animate-spin" /> : <Save size={16} />}
                    {t('save_changes')}
                  </button>
                </div>

                <div className="pt-8 border-t border-zinc-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={14} className="text-zinc-500" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('order_placed')}</span>
                  </div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white ml-5">
                    {new Date(order.createdAt).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderDetailsPage;
