import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  UserCheck, 
  ShoppingBag,
  Clock,
  CheckCircle2,
  Package,
  ArrowRight
} from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { useLanguage } from '../../../context/LanguageContext';

const CustomerDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useLanguage();
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handlePromoteToSeller = async () => {
    if (!confirm('Are you sure you want to promote this member to a Seller? They will receive supplier pricing benefits.')) return;
    
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Seller' }),
      });
      if (res.ok) {
        setCustomer({ ...customer, role: 'Seller' });
        alert('Customer promoted to Seller successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to promote customer.');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Customer Details">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4" />
          <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Retrieving Profile...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!customer) {
    return (
      <AdminLayout title="Not Found">
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-zinc-500">Customer not found.</h2>
          <button 
            onClick={() => router.push('/admin/customer')}
            className="mt-6 text-yellow-500 font-bold flex items-center gap-2 mx-auto hover:gap-3 transition-all"
          >
            <ChevronLeft size={20} /> Back to Customers
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={customer.name}>
      <div className="space-y-8">
        {/* Back Button */}
        <button 
          onClick={() => router.push('/admin/customer')}
          className="group flex items-center gap-2 text-zinc-500 hover:text-yellow-500 transition-colors font-bold text-sm uppercase tracking-widest"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-500/5 flex items-center justify-center group-hover:bg-yellow-500/10 transition-colors">
            <ChevronLeft size={18} />
          </div>
          Back to List
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ---- Left Sidebar: Profile Info ---- */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-[40px] p-8 shadow-xl">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-[32px] flex items-center justify-center text-yellow-500 border border-yellow-500/20 shadow-inner mb-6">
                  <span className="font-black italic text-4xl">{customer.name.charAt(0)}</span>
                </div>
                <h2 className="text-2xl font-black italic dark:text-white text-zinc-900 mb-1">{customer.name}</h2>
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                  customer.role === 'Seller' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                }`}>
                  {customer.role === 'Seller' ? <Shield size={12} /> : <UserCheck size={12} />}
                  {customer.role}
                </div>
              </div>

              <div className="space-y-6 border-t dark:border-white/5 border-zinc-100 pt-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-500/5 flex items-center justify-center text-zinc-500">
                    <Phone size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Phone</span>
                    <span className="text-sm font-bold dark:text-white text-zinc-900">{customer.phone}</span>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-500/5 flex items-center justify-center text-zinc-500 mt-1">
                    <MapPin size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Address</span>
                    <span className="text-sm font-bold dark:text-white text-zinc-900 leading-relaxed">
                      {customer.address || 'No address provided'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-500/5 flex items-center justify-center text-zinc-500">
                    <Calendar size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Registered Since</span>
                    <span className="text-sm font-bold dark:text-white text-zinc-900">
                      {new Date(customer.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {customer.role !== 'Seller' && (
                <button 
                  onClick={handlePromoteToSeller}
                  className="w-full mt-8 py-4 bg-yellow-500 text-zinc-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                >
                  <Shield size={16} />
                  Promote to Seller
                </button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-500/5 border border-zinc-500/10 rounded-[32px] p-6">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Orders</p>
                <h4 className="text-3xl font-black italic text-yellow-500">{customer.orders?.length || 0}</h4>
              </div>
              <div className="bg-zinc-500/5 border border-zinc-500/10 rounded-[32px] p-6">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Spent</p>
                <h4 className="text-3xl font-black italic text-green-500">
                  RM {customer.orders?.reduce((sum: number, o: any) => sum + o.totalAmount, 0).toFixed(2) || '0.00'}
                </h4>
              </div>
            </div>
          </div>

          {/* ---- Right Main Area: Order History ---- */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black italic uppercase tracking-tight dark:text-white text-zinc-900">Order History</h3>
              <div className="px-4 py-1.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-widest border border-yellow-500/20">
                Latest Activity
              </div>
            </div>

            <div className="space-y-4">
              {!customer.orders || customer.orders.length === 0 ? (
                <div className="bg-zinc-500/5 border border-dashed border-zinc-500/20 rounded-[40px] p-20 text-center">
                  <div className="w-16 h-16 bg-zinc-500/10 rounded-2xl flex items-center justify-center text-zinc-500 mx-auto mb-6">
                    <ShoppingBag size={32} />
                  </div>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">This customer hasn't placed any orders yet.</p>
                </div>
              ) : (
                customer.orders.map((order: any, idx: number) => (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-[32px] overflow-hidden shadow-lg group"
                  >
                    {/* Order Header */}
                    <div className="p-6 flex flex-wrap items-center justify-between gap-4 border-b dark:border-white/5 border-zinc-100 bg-zinc-500/5 group-hover:bg-zinc-500/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-yellow-500 flex items-center justify-center text-zinc-900 shadow-lg shadow-yellow-500/20">
                          <Package size={24} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Order ID</span>
                          <span className="text-sm font-bold dark:text-white text-zinc-900 font-mono">{order.id.slice(-8).toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Date</span>
                          <span className="text-xs font-bold dark:text-zinc-300 text-zinc-600">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status</span>
                          <div className={`inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            order.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 
                            order.status === 'Pending' ? 'bg-orange-500/10 text-orange-500' : 'bg-zinc-500/10 text-zinc-500'
                          }`}>
                            <div className={`w-1 h-1 rounded-full ${order.status === 'Completed' ? 'bg-green-500' : 'bg-orange-500'}`} />
                            {order.status}
                          </div>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total</span>
                          <span className="text-sm font-black text-yellow-500 italic">RM {order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-6 space-y-4">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-dashed dark:border-white/5 border-zinc-100 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-500/5 flex items-center justify-center text-zinc-500 font-bold text-[10px]">
                              {item.quantity}x
                            </div>
                            <span className="text-sm font-bold dark:text-zinc-300 text-zinc-700">{item.name}</span>
                          </div>
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">RM {item.price.toFixed(2)} / ea</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CustomerDetailsPage;
