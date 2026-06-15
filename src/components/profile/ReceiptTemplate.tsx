import React from 'react';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import { 
  MapPin, Phone, Mail, Calendar, ClipboardList, 
  Wallet, Truck, User as UserIcon
} from 'lucide-react';

interface ReceiptTemplateProps {
  order: any;
  businessSettings: any;
  user: any;
}

export const ReceiptTemplate = React.forwardRef<HTMLDivElement, ReceiptTemplateProps>(({ order, businessSettings, user }, ref) => {
  // Safe defaults
  const bName = businessSettings?.businessName || 'CHENG-BOOM';
  const logo = businessSettings?.logoUrl || null;
  const address = businessSettings?.address || 'No. 123, Jalan Example, 81400\nSenai, Johor, Malaysia';
  const phone = businessSettings?.phone || '+60 12-345 6789';
  const email = businessSettings?.email || 'info@chengboom.com';
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-MY', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });
  };

  const calculateSubtotal = () => {
    return order.items?.reduce((sum: number, item: any) => sum + (item.originalPrice || item.price) * item.quantity, 0) || 0;
  };

  const actualTotal = order.items?.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) || 0;
  const subtotal = calculateSubtotal();
  const discount = (subtotal - actualTotal) + (actualTotal - order.totalAmount > 0 ? actualTotal - order.totalAmount : 0);

  return (
    <div 
      ref={ref} 
      className="bg-white w-[800px] mx-auto text-zinc-900 font-sans relative overflow-hidden"
      style={{ padding: '40px', boxSizing: 'border-box' }}
    >
      {/* 1. HEADER */}
      <div className="flex justify-between items-start mb-8 gap-6">
        <div className="flex items-center gap-4 w-[55%]">
          {logo ? (
            <img src={logo} alt={bName} className="w-24 h-24 object-contain shrink-0" crossOrigin="anonymous" />
          ) : (
            <div className="w-24 h-24 bg-orange-500 rounded-2xl flex items-center justify-center text-white font-black text-xl italic shrink-0">
              {bName.substring(0, 2)}
            </div>
          )}
          <div className="space-y-1 min-w-0">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-zinc-900 whitespace-nowrap truncate">{bName}</h1>
            <div className="text-xs text-zinc-600 flex items-start gap-2">
              <MapPin size={12} className="mt-0.5 shrink-0 text-orange-500" />
              <span className="whitespace-pre-wrap">{address}</span>
            </div>
            <div className="text-xs text-zinc-600 flex items-center gap-2 mt-1">
              <Phone size={12} className="text-orange-500" /> {phone}
            </div>
            <div className="text-xs text-zinc-600 flex items-center gap-2 mt-1">
              <Mail size={12} className="text-orange-500" /> {email}
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col items-end w-[40%] shrink-0">
          <h1 className="text-[48px] font-black text-orange-500 tracking-tighter uppercase leading-none">RECEIPT</h1>
          <div className="w-full flex items-center justify-center mt-2 mb-4">
            <div className="flex-1 h-0.5 bg-orange-200"></div>
            <div className="w-2 h-2 bg-orange-500 rotate-45 mx-2"></div>
            <div className="flex-1 h-0.5 bg-orange-200"></div>
          </div>

          <div className="border-2 border-dashed border-orange-200 rounded-2xl px-4 py-2 text-center bg-orange-50/50 w-full overflow-hidden">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Order ID</p>
            <p className="text-xs font-black text-zinc-900 mb-1 truncate">#{order.id.toUpperCase()}</p>
            <div className="flex justify-center w-full">
              <div className="origin-top scale-90">
                <Barcode value={order.id.toUpperCase()} displayValue={false} height={25} width={1} margin={0} background="transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-zinc-200 mb-6"></div>

      {/* 2. ORDER DATE & STATUS */}
      <div className="flex justify-between items-center mb-6 px-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Order Date</p>
            <p className="text-sm font-bold text-zinc-900">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="w-px h-10 bg-zinc-200"></div>

        <div className="flex items-center gap-4 w-[40%]">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
            <ClipboardList size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Order Status</p>
            <p className="text-sm font-bold text-orange-500">{order.status}</p>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-zinc-200 mb-8"></div>

      {/* 3. CUSTOMER & DELIVERY DETAILS */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Customer */}
        <div className="bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-200">
          <div className="bg-zinc-900 px-4 py-2 flex items-center gap-2">
            <UserIcon size={14} className="text-orange-500" />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Customer Details</h3>
          </div>
          <div className="p-4 space-y-3 text-xs">
            <div className="flex">
              <span className="w-20 text-zinc-500 font-bold">Name</span>
              <span className="w-4 text-zinc-400">:</span>
              <span className="flex-1 font-bold text-zinc-900">{user.name || order.customer?.name || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-20 text-zinc-500 font-bold">Phone</span>
              <span className="w-4 text-zinc-400">:</span>
              <span className="flex-1 font-bold text-zinc-900">{user.phone || order.customer?.phone || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-20 text-zinc-500 font-bold">Address</span>
              <span className="w-4 text-zinc-400">:</span>
              <span className="flex-1 font-medium text-zinc-900 whitespace-pre-wrap">{user.address || order.address || '-'}</span>
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-200">
          <div className="bg-zinc-900 px-4 py-2 flex items-center gap-2">
            <MapPin size={14} className="text-orange-500" />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Delivery Details</h3>
          </div>
          <div className="p-4 space-y-3 text-xs">
            <div className="flex">
              <span className="w-24 text-zinc-500 font-bold">Delivery Mode</span>
              <span className="w-4 text-zinc-400">:</span>
              <span className="flex-1 font-bold text-zinc-900">{order.deliveryMode || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500 font-bold">Address</span>
              <span className="w-4 text-zinc-400">:</span>
              <span className="flex-1 font-medium text-zinc-900 whitespace-pre-wrap">{order.address || user.address || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-500 font-bold">Notes</span>
              <span className="w-4 text-zinc-400">:</span>
              <span className="flex-1 font-medium text-zinc-900 whitespace-pre-wrap">{order.notes || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ITEMS TABLE */}
      <div className="mb-6 rounded-2xl overflow-hidden border border-zinc-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900 text-white font-bold uppercase tracking-widest">
            <tr>
              <th className="px-4 py-3 text-center w-12">No.</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3 text-center w-16">Qty</th>
              <th className="px-4 py-3 text-right w-24">Unit Price</th>
              <th className="px-4 py-3 text-right w-24">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {order.items?.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-dashed border-zinc-200 last:border-0">
                <td className="px-4 py-4 text-center font-bold text-zinc-900">{idx + 1}</td>
                <td className="px-4 py-4 flex items-center gap-3">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded bg-zinc-100 object-cover" crossOrigin="anonymous" />
                  )}
                  <div>
                    <p className="font-bold text-zinc-900">{item.name}</p>
                    {item.code && <p className="text-[10px] text-zinc-500 mt-0.5">Code: {item.code}</p>}
                    {item.variant && <p className="text-[10px] text-zinc-500 mt-0.5">Variant: {item.variant}</p>}
                  </div>
                </td>
                <td className="px-4 py-4 text-center font-bold text-zinc-900">{item.quantity}</td>
                <td className="px-4 py-4 text-right font-bold text-zinc-900">RM {item.price.toFixed(2)}</td>
                <td className="px-4 py-4 text-right font-bold text-zinc-900">RM {(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. BILLING SUMMARY */}
      <div className="flex justify-end mb-8">
        <div className="w-[360px] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-zinc-500">Subtotal</span>
            <span className="font-bold text-zinc-900">RM {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-zinc-500">Discount</span>
            <span className="font-bold text-green-500">- RM {discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-zinc-500">Delivery Fee</span>
            <span className="font-bold text-zinc-900">RM 0.00</span>
          </div>
          <div className="mt-4 pt-4 bg-orange-50 border-2 border-orange-200 rounded-xl p-4 flex justify-between items-center whitespace-nowrap gap-4">
            <span className="text-xs font-black text-zinc-900 uppercase tracking-widest shrink-0">Total Amount Paid</span>
            <span className="text-2xl font-black text-orange-500 tracking-tighter shrink-0">RM {order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 6. FOOTER INFO */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-dashed border-orange-200 rounded-xl p-3 flex items-center gap-3 bg-orange-50/30">
          <Wallet size={24} className="text-orange-500" />
          <div>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Payment Method</p>
            <p className="text-xs font-bold text-zinc-900">{order.paymentMethod || 'Not Set'}</p>
          </div>
        </div>
        <div className="border border-dashed border-orange-200 rounded-xl p-3 flex items-center gap-3 bg-orange-50/30">
          <Truck size={24} className="text-orange-500" />
          <div>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Fulfillment</p>
            <p className="text-xs font-bold text-zinc-900">{order.deliveryMode || 'Not Set'}</p>
          </div>
        </div>
        <div className="border border-dashed border-orange-200 rounded-xl p-3 flex items-center gap-3 bg-orange-50/30">
          <ClipboardList size={24} className="text-orange-500" />
          <div>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Placed On</p>
            <p className="text-xs font-bold text-zinc-900">{formatDate(order.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* 7. THANK YOU & SOCIAL */}
      <div className="flex items-center justify-between mt-12 mb-6">
        <div className="text-left">
          <h2 className="text-4xl font-bold text-orange-500" style={{ fontFamily: 'cursive' }}>Thank you <span className="text-orange-400">♡</span></h2>
          <p className="text-xl font-bold text-zinc-900 mt-1" style={{ fontFamily: 'cursive' }}>for your purchase!</p>
        </div>

        <div className="text-center flex flex-col items-center">
          <p className="text-sm font-black text-zinc-900 uppercase tracking-widest">{bName}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Quality Products, Trusted by You.</p>
          <div className="flex gap-2 mt-3 text-zinc-900">
            <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </div>
            <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </div>
            <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div className="flex flex-col items-end">
            <p className="text-xs text-zinc-600">Scan to view</p>
            <p className="text-xs text-zinc-600">order details</p>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-orange-500 mt-1 scale-x-[-1]">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="p-2 border-2 border-zinc-900 rounded-xl">
            <QRCodeSVG value={typeof window !== 'undefined' ? `${window.location.origin}/orders/${order.id}` : order.id} size={64} />
          </div>
        </div>
      </div>

      {/* 8. NEW DESIGNED BOTTOM BAR */}
      <div className="mt-12 bg-zinc-900 text-white p-6 rounded-2xl relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute -right-8 -top-12 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl"></div>
        <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-orange-500/20 rounded-full blur-xl"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-orange-500 uppercase tracking-widest">Light up the night!</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-[300px]">
              If you have any questions about this receipt, please contact our support at <span className="text-white font-bold">{email}</span>.
            </p>
          </div>
          <div className="text-right border-l border-white/10 pl-6">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Official Website</p>
            <p className="text-sm font-black text-white">www.cheng-boom.com</p>
          </div>
        </div>
        
        <div className="w-full h-px bg-white/10 my-4"></div>
        
        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold tracking-widest">
          <p>© {new Date().getFullYear()} {bName}. All rights reserved.</p>
          <p>COMPUTER GENERATED RECEIPT. NO SIGNATURE REQUIRED.</p>
        </div>
      </div>
      
      {/* Absolute Bottom Border Decor */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-orange-500 rounded-b-[40px]"></div>
    </div>
  );
});

ReceiptTemplate.displayName = 'ReceiptTemplate';

