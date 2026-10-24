import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, CheckCircle2, AlertCircle, Activity, Clock, Truck, XCircle,
  Save, Mail, X, FileText, FileDown, Edit
} from 'lucide-react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { useLanguage } from '../../../context/LanguageContext';
import { useBusiness } from '../../../context/BusinessContext';
import { cn } from '../../../utils/cn';
import { jsPDF } from 'jspdf';

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

  // Email template state
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Order update');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');

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

  const getDisplayOrderNumber = (orderRecord: any) => {
    const createdAt = new Date(orderRecord.createdAt);
    const compactDate = `${String(createdAt.getFullYear()).slice(-2)}${String(createdAt.getMonth() + 1).padStart(2, '0')}${String(createdAt.getDate()).padStart(2, '0')}`;
    return `CB-${compactDate}-${String(orderRecord.id).slice(-6).toUpperCase()}`;
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
    if (!editAddressText.trim() || !isDeliveryOrder) return;
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
    if (!emailBody.trim() || !emailSubject.trim() || !order?.customer?.email) return;
    setIsSendingEmail(true);
    try {
      const res = await fetch(`/api/orders/${id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: emailSubject.trim(), message: emailBody.trim() })
      });
      if (res.ok) {
        setEmailSuccess('Email sent successfully!');
        setIsEmailComposerOpen(false);
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

  const openEmailComposer = () => {
    setEmailSubject('Order update');
    setEmailBody(`We’re writing to share an update about your order.\n\nOrder status: ${getTranslatedStatus(order.status)}\n\nIf you have any questions, please reply to this email.\n\nThank you,\n${settings?.businessName || 'Cheng-BOOM'}`);
    setIsEmailComposerOpen(true);
  };

  const handleDownloadReceipt = async () => {
    if (!order) return;
    if (order.status === 'Cancelled') {
      alert('A receipt cannot be generated for a cancelled order.');
      return;
    }
    setIsGeneratingPdf(true);
    try {
      const { default: autoTable } = await import('jspdf-autotable');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const left = 10;
      const right = pageWidth - 10;
      const businessName = settings?.businessName || 'CHENG-BOOM';
      const createdAt = new Date(order.createdAt);
      const date = createdAt.toLocaleDateString('en-MY', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      });
      const orderNumber = getDisplayOrderNumber(order);
      const time = createdAt.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true });
      const isSelfCollect = /self|collect/i.test(`${order.deliveryMode || ''} ${order.address || ''} ${order.customer?.address || ''}`);
      const address = isSelfCollect
        ? 'Self Collect'
        : (order.address || order.customer?.address || '');

      let watermarkData: string | null = null;
      let watermarkWidth = 0;
      let watermarkHeight = 0;
      if (settings?.logoUrl) {
        try {
          const logoResponse = await fetch(settings.logoUrl);
          if (logoResponse.ok) {
            const logoBitmap = await createImageBitmap(await logoResponse.blob());
            const colorCanvas = document.createElement('canvas');
            colorCanvas.width = logoBitmap.width;
            colorCanvas.height = logoBitmap.height;
            colorCanvas.getContext('2d')?.drawImage(logoBitmap, 0, 0);
            const logoScale = Math.min(24 / logoBitmap.width, 16 / logoBitmap.height);
            const logoWidth = logoBitmap.width * logoScale;
            const logoHeight = logoBitmap.height * logoScale;
            pdf.addImage(colorCanvas.toDataURL('image/png'), 'PNG', (pageWidth - logoWidth) / 2, 4 + (16 - logoHeight) / 2, logoWidth, logoHeight);
            const watermarkCanvas = document.createElement('canvas');
            watermarkCanvas.width = logoBitmap.width;
            watermarkCanvas.height = logoBitmap.height;
            const watermarkContext = watermarkCanvas.getContext('2d');
            if (watermarkContext) {
              watermarkContext.filter = 'grayscale(100%)';
              watermarkContext.drawImage(logoBitmap, 0, 0);
            }
            watermarkData = watermarkCanvas.toDataURL('image/png');
            const watermarkScale = Math.min(70 / logoBitmap.width, 70 / logoBitmap.height);
            watermarkWidth = logoBitmap.width * watermarkScale;
            watermarkHeight = logoBitmap.height * watermarkScale;
            logoBitmap.close();
          }
        } catch (logoError) {
          console.warn('Business logo could not be added to the receipt:', logoError);
        }
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      pdf.text(String(businessName).toUpperCase(), pageWidth / 2, 32, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      let headerY = 38;
      const businessAddress = settings?.address?.trim() || '';
      if (businessAddress) {
        const addressLines = pdf.splitTextToSize(businessAddress, right - left);
        pdf.text(addressLines, pageWidth / 2, headerY, { align: 'center' });
        headerY += addressLines.length * 4;
      }
      const contactDetails = [
        settings?.phone?.trim() ? `Tel: ${settings.phone.trim()}` : '',
        settings?.email?.trim() ? `Email: ${settings.email.trim()}` : '',
      ].filter(Boolean).join('   ');
      if (contactDetails) {
        pdf.text(contactDetails, pageWidth / 2, headerY, { align: 'center' });
        headerY += 5;
      }
      pdf.setDrawColor(130);
      const dividerY = headerY + 1;
      pdf.line(left, dividerY, right, dividerY);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      const salesOrderY = dividerY + 8;
      pdf.text('Sales Order', pageWidth / 2, salesOrderY, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const detailsTop = salesOrderY + 8;
      const columnGap = 6;
      const columnWidth = (right - left - columnGap * 2) / 3;
      const middleX = left + columnWidth + columnGap;
      const rightX = middleX + columnWidth + columnGap;
      const billLines = pdf.splitTextToSize(`Bill to:\n${address}`, columnWidth);
      const shipLines = pdf.splitTextToSize(`Ship to:\n${address}`, columnWidth);
      pdf.text(billLines, left, detailsTop);
      pdf.text(shipLines, middleX, detailsTop);
      const buyerDetails = pdf.splitTextToSize(
        `Order No: ${orderNumber}\nDate: ${date}\nTime: ${time}\nBuyer: ${order.customer?.name || ''}\nPhone: ${order.customer?.phone || ''}\nStatus: ${order.status || 'Pending'}`,
        columnWidth,
      );
      pdf.text(buyerDetails, rightX, detailsTop);
      const tableTop = detailsTop + Math.max(billLines.length, shipLines.length, buyerDetails.length) * 4 + 7;

      const rows = (order.items || []).map((item: any, index: number) => {
        const unit = item.variant === 'Box' ? 'Box' : item.variant === 'Bundle' ? 'Bundle' : 'Single';
        const price = Number(item.price) || 0;
        const amount = price * (Number(item.quantity) || 0);
        return [
          String(index + 1), item.code || '-', item.name || '-', String(item.quantity || 0), unit,
          price.toFixed(2), '', amount.toFixed(2),
        ];
      });
      autoTable(pdf, {
        startY: tableTop,
        head: [['No', 'Item Code', 'Item Name', 'QTY', 'UOM', 'Price (RM)', 'Disc (Promo)', 'Amount (RM)']],
        body: rows,
        theme: 'plain',
        margin: { left, right: 10, bottom: 42 },
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.2, textColor: 25, overflow: 'linebreak' },
        headStyles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: 20, lineWidth: { bottom: 0.3 }, lineColor: [100, 100, 100] },
        columnStyles: {
          0: { cellWidth: 12, minCellWidth: 12 }, 1: { cellWidth: 25 }, 2: { cellWidth: 'auto' }, 3: { cellWidth: 12, halign: 'right' },
          4: { cellWidth: 14 }, 5: { cellWidth: 18, halign: 'right' }, 6: { cellWidth: 20, halign: 'right' }, 7: { cellWidth: 21, halign: 'right' },
        },
      });

      const finalY = (pdf as any).lastAutoTable?.finalY || tableTop;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let totalsY = finalY + 10;
      if (totalsY > pageHeight - 42) {
        pdf.addPage();
        totalsY = 20;
      }
      const subtotal = rows.reduce((sum: number, row: any[]) => sum + Number(row[7] || 0), 0);
      pdf.setDrawColor(130);
      pdf.line(left, totalsY - 4, right, totalsY - 4);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Subtotal (RM):  ${subtotal.toFixed(2)}`, right, totalsY + 2, { align: 'right' });
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Grand Total (RM):  ${Number(order.totalAmount || 0).toFixed(2)}`, right, totalsY + 12, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
      pdf.text('Signature: ______________________________', left, pageHeight - 21);
      const pageCount = pdf.getNumberOfPages();
      for (let page = 1; page <= pageCount; page++) {
        pdf.setPage(page);
        if (watermarkData) {
          const watermarkY = (pdf.internal.pageSize.getHeight() - watermarkHeight) / 2;
          pdf.setGState(pdf.GState({ opacity: 0.08 }));
          pdf.addImage(watermarkData, 'PNG', (pageWidth - watermarkWidth) / 2, watermarkY, watermarkWidth, watermarkHeight);
          pdf.setGState(pdf.GState({ opacity: 1 }));
        }
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(`Page ${page}:${pageCount}`, pageWidth / 2, pdf.internal.pageSize.getHeight() - 8, { align: 'center' });
      }
      pdf.save(`Receipt_${orderNumber}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF receipt. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const statusOptions = ['Pending', 'In Process', 'Delivering', 'Completed', 'Cancelled'];

  const getStatusIndex = (status: string) => {
    const orderIndex = ['Pending', 'In Process', 'Delivering', 'Completed'];
    return orderIndex.indexOf(status);
  };

  const progressSteps = [
    { value: 'Pending', label: t('pending_filter') || 'Pending', icon: Clock },
    { value: 'In Process', label: t('in_process_filter') || 'In Process', icon: Activity },
    { value: 'Delivering', label: t('delivering_filter') || 'Delivering', icon: Truck },
    { value: 'Completed', label: t('completed_filter') || 'Completed', icon: CheckCircle2 },
  ];

  const isStatusDisabled = (statusValue: string) => {
    if (order.status === 'Cancelled' || order.status === 'Completed') {
      return statusValue !== order.status;
    }
    if (statusValue === 'Cancelled') return false;
    const currentIndex = getStatusIndex(order.status);
    const targetIndex = getStatusIndex(statusValue);
    return targetIndex !== currentIndex + 1 && targetIndex !== currentIndex;
  };

  const isSelfCollectOrder = /self|collect/i.test(`${order?.deliveryMode || ''} ${order?.address || ''} ${order?.customer?.address || ''}`);
  const isDeliveryOrder = /delivery/i.test(String(order?.deliveryMode || '')) && !isSelfCollectOrder;

  if (isLoading) return (
    <AdminLayout title={t('order_contents')}>
      <div className="p-32 text-center text-slate-500 font-black uppercase tracking-widest text-xs animate-pulse">{t('scanning_order_records')}</div>
    </AdminLayout>
  );

  if (!order) return (
    <AdminLayout title={t('order_contents')}>
      <div className="p-32 text-center text-slate-500 font-black uppercase tracking-widest text-xs">{t('order_record_not_found')}</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title={t('order_contents')} hideTitle={true}>
      <div className="w-full space-y-5 text-slate-700">
        <header className="border-b border-slate-200 pb-5">
          <div>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h1 className="text-2xl font-medium tracking-tight text-slate-900">Order Details</h1>
              <span className="text-sm font-medium text-slate-600">[ Access ]</span>
            </div>
            <p className="mt-1 text-xs text-slate-600">{t('orders') || 'Orders'} /</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => viewOnly && customerId ? router.push(`/admin/customer/${customerId}`) : router.push('/admin/orders')}
              className="inline-flex items-center gap-2 border border-slate-400 bg-transparent px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-sky-700 hover:bg-sky-50 hover:text-sky-800"
            ><ArrowLeft size={15} /> {viewOnly && customerId ? 'Back to Customer' : 'Back to Orders'}</button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadReceipt}
                disabled={isGeneratingPdf || order.status === 'Cancelled'}
                title={order.status === 'Cancelled' ? 'Receipts cannot be generated for cancelled orders.' : undefined}
                className="inline-flex items-center justify-center gap-2 border border-sky-800 bg-sky-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGeneratingPdf ? <Activity size={16} className="animate-spin" /> : <FileDown size={16} />}
                {t('generate_receipt') || 'Generate Receipt'}
              </button>
              <button
                onClick={() => setIsCancelModalOpen(true)}
                disabled={order.status === 'Cancelled' || order.status === 'Completed'}
                className="inline-flex items-center justify-center gap-2 border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:border-rose-500 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
              ><AlertCircle size={16} /> Cancel Order</button>
            </div>
          </div>
          {order.status !== 'Cancelled' && order.status !== 'Completed' && (
            <p className="mt-2 text-right text-xs leading-5 text-slate-500">If payment has already been collected, arrange a refund with the customer after cancellation.</p>
          )}
        </header>

        {success && (
          <div role="status" className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 size={17} /> {success}
          </div>
        )}

        <section aria-label="Order status progress" className="py-1">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="text-sm font-semibold text-slate-800">Order Progress</h2>
            <p className="text-sm text-slate-500">
              Current status: <span className={cn('font-semibold', order.status === 'Cancelled' ? 'text-rose-700' : order.status === 'Completed' ? 'text-emerald-700' : 'text-sky-800')}>{getTranslatedStatus(order.status)}</span>
            </p>
          </div>
          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-[700px] items-start">
              {progressSteps.map((step, index) => {
                const currentIndex = getStatusIndex(order.status);
                const isCurrent = order.status === step.value;
                const isComplete = order.status !== 'Cancelled' && currentIndex > index;
                const StepIcon = isComplete ? CheckCircle2 : step.icon;

                return (
                  <React.Fragment key={step.value}>
                    <div className="flex w-[108px] shrink-0 flex-col items-center text-center">
                      <span
                        aria-current={isCurrent ? 'step' : undefined}
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                          isCurrent ? 'border-sky-800 bg-sky-800 text-white ring-4 ring-sky-100' :
                          isComplete ? 'border-sky-700 bg-sky-700 text-white' :
                          'border-slate-300 bg-white text-slate-400'
                        )}
                      ><StepIcon size={18} /></span>
                      <span className={cn('mt-2 text-xs', isCurrent ? 'font-semibold text-sky-900' : isComplete ? 'font-medium text-slate-700' : 'text-slate-500')}>{step.label}</span>
                      {isCurrent && <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-700">Current</span>}
                    </div>
                    {index < progressSteps.length - 1 && (
                      <div className={cn('mt-5 h-0.5 min-w-4 flex-1', order.status !== 'Cancelled' && currentIndex > index ? 'bg-sky-700' : 'bg-slate-200')} />
                    )}
                  </React.Fragment>
                );
              })}

              <div aria-hidden="true" className="mx-2 mt-4 shrink-0 border-l border-dashed border-slate-300 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">or</div>
              <div className="flex w-[108px] shrink-0 flex-col items-center text-center">
                <span
                  aria-current={order.status === 'Cancelled' ? 'step' : undefined}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                    order.status === 'Cancelled' ? 'border-rose-700 bg-rose-700 text-white ring-4 ring-rose-100' : 'border-slate-300 bg-white text-slate-400'
                  )}
                ><XCircle size={18} /></span>
                <span className={cn('mt-2 text-xs', order.status === 'Cancelled' ? 'font-semibold text-rose-800' : 'text-slate-500')}>{t('cancelled_filter') || 'Cancelled'}</span>
                {order.status === 'Cancelled' && <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-rose-700">Current</span>}
              </div>
            </div>
          </div>
        </section>

        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Order Details</h2>
              <p className="mt-1 text-sm text-slate-500">Reference {getDisplayOrderNumber(order)}</p>
            </div>
            <span className="text-xs text-slate-500">{order.items?.length || 0} product lines</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="px-5 py-5 lg:border-r lg:border-slate-200">
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Order Information</h3>
              <dl className="divide-y divide-slate-100">
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4"><dt className="text-sm text-slate-500">Order number</dt><dd className="break-all text-sm font-medium text-slate-800">{getDisplayOrderNumber(order)}</dd></div>
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4"><dt className="text-sm text-slate-500">Full Order ID</dt><dd className="break-all font-mono text-xs text-slate-700">{order.id}</dd></div>
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4"><dt className="text-sm text-slate-500">Date placed</dt><dd className="text-sm font-medium text-slate-800">{new Date(order.createdAt).toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</dd></div>
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4"><dt className="text-sm text-slate-500">Last updated</dt><dd className="text-sm font-medium text-slate-800">{new Date(order.updatedAt || order.createdAt).toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</dd></div>
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4"><dt className="text-sm text-slate-500">Order status</dt><dd className={cn('text-sm font-semibold', order.status === 'Cancelled' ? 'text-rose-700' : order.status === 'Completed' ? 'text-emerald-700' : 'text-sky-800')}>{getTranslatedStatus(order.status)}</dd></div>
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4"><dt className="text-sm text-slate-500">Items</dt><dd className="text-sm font-medium text-slate-800">{order.items?.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0) || 0} items across {order.items?.length || 0} products</dd></div>
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4"><dt className="text-sm text-slate-500">Payment method</dt><dd className="text-sm font-medium text-slate-800">{getTranslatedPaymentMethod(order.paymentMethod)}{order.paymentReceiptUrl && <button onClick={() => setIsReceiptModalOpen(true)} className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-sky-800 hover:underline"><FileText size={13} />{t('view_receipt') || 'View receipt'}</button>}</dd></div>
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4"><dt className="text-sm text-slate-500">Fulfillment</dt><dd className="text-sm font-medium text-slate-800">{getTranslatedDeliveryMode(order.deliveryMode)}</dd></div>
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4"><dt className="text-sm font-semibold text-slate-700">Total amount</dt><dd className="text-base font-semibold text-slate-900">RM {Number(order.totalAmount || 0).toFixed(2)}</dd></div>
                {order.notes && <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4"><dt className="text-sm text-slate-500">Order notes</dt><dd className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{order.notes}</dd></div>}
              </dl>
            </div>

            <div className="px-5 py-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Customer & Address</h3>
              <dl className="divide-y divide-slate-100">
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4"><dt className="text-sm text-slate-500">Customer</dt><dd className="text-sm font-medium text-slate-800">{order.customer?.name || 'Customer'}</dd></div>
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4"><dt className="text-sm text-slate-500">Phone</dt><dd className="text-sm font-medium text-slate-800">{order.customer?.phone || 'No phone number'}</dd></div>
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4"><dt className="text-sm text-slate-500">Email</dt><dd className="break-all text-sm font-medium text-slate-800">{order.customer?.email || 'No email address'}</dd></div>
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-sm text-slate-500">{isSelfCollectOrder ? (t('self_collect') || 'Collection') : (t('shipping_address') || 'Shipping address')}</dt>
                  <dd className="text-sm leading-6 text-slate-800">
                    <span>{isSelfCollectOrder ? (t('self_collect') || 'Self Collect') : (order.address || order.customer?.address || (t('no_address_provided') || 'No address provided'))}</span>
                    {isDeliveryOrder && <button onClick={() => { setEditAddressText(order.address || order.customer?.address || ''); setIsEditAddressModalOpen(true); }} className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-sky-800 hover:underline"><Edit size={13} /> Edit address</button>}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="border-t border-slate-200">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Item Summary</h3>
              <span className="text-xs text-slate-500">{order.items?.length || 0} product lines</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-800 text-xs font-semibold uppercase tracking-wide text-white">
                  <tr><th className="px-5 py-3">Item Code</th><th className="px-5 py-3">Product</th><th className="px-5 py-3">Type</th><th className="px-5 py-3 text-right">Unit Price</th><th className="px-5 py-3 text-center">Qty</th><th className="px-5 py-3 text-right">Total</th></tr>
                </thead>
                <tbody>
                  {order.items?.map((item: any, index: number) => (
                    <tr key={item.id} className={cn('border-t border-slate-300 bg-white', index % 2 === 1 && 'bg-slate-100')}>
                      <td className="px-5 py-4 text-slate-800">{item.code || '—'}</td>
                      <td className="px-5 py-4 font-medium text-slate-900">{language === 'zh' ? item.product?.nameZh || item.nameZh || item.name : language === 'ms' ? item.product?.nameMs || item.nameMs || item.name : item.name}</td>
                      <td className="px-5 py-4 text-slate-800">{item.variant || 'Single'}</td>
                      <td className="px-5 py-4 text-right text-slate-800">RM {Number(item.price || 0).toFixed(2)}</td>
                      <td className="px-5 py-4 text-center text-slate-800">{item.quantity}</td>
                      <td className="px-5 py-4 text-right font-semibold text-slate-900">RM {(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!order.items || order.items.length === 0) && <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">No items found for this order.</td></tr>}
                </tbody>
                <tfoot className="border-t border-slate-300 bg-slate-50">
                  <tr><td colSpan={5} className="px-5 py-3 text-right text-sm text-slate-500">Subtotal</td><td className="px-5 py-3 text-right text-sm font-medium text-slate-800">RM {Number(order.totalAmount || 0).toFixed(2)}</td></tr>
                  <tr><td colSpan={5} className="px-5 pb-4 text-right text-sm font-semibold text-slate-900">{t('total_amount') || 'Grand Total'}</td><td className="px-5 pb-4 text-right text-base font-semibold text-slate-900">RM {Number(order.totalAmount || 0).toFixed(2)}</td></tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>
        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Order Status</h2>
              <p className="mt-1 text-sm text-slate-500">Check the current status or move the order to its next available stage.</p>
            </div>
            <span className={cn(
              'inline-flex w-fit border px-3 py-1.5 text-sm font-semibold',
              order.status === 'Pending' ? 'border-slate-300 bg-slate-50 text-slate-700' :
              order.status === 'In Process' ? 'border-sky-200 bg-sky-50 text-sky-800' :
              order.status === 'Delivering' ? 'border-indigo-200 bg-indigo-50 text-indigo-800' :
              order.status === 'Completed' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' :
              'border-rose-200 bg-rose-50 text-rose-800'
            )}>{getTranslatedStatus(order.status)}</span>
          </div>
          <div className="flex flex-col gap-3 p-5 md:flex-row md:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="order-status-select" className="mb-1.5 block text-xs font-semibold text-slate-600">Update status</label>
              <select
                id="order-status-select"
                value={newStatus}
                onChange={(event) => setNewStatus(event.target.value)}
                disabled={order.status === 'Cancelled' || order.status === 'Completed'}
                className="w-full border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-700 focus:ring-1 focus:ring-sky-700 disabled:bg-slate-100 disabled:text-slate-500 md:max-w-xl"
              >
                {statusOptions.filter((status) => status !== 'Cancelled').map((status) => (
                  <option key={status} value={status} disabled={isStatusDisabled(status)}>
                    {status === 'Completed' ? (t('completed_filter') || 'Completed') : status === 'Pending' ? (t('pending_filter') || 'Pending') : status === 'In Process' ? (t('in_process_filter') || 'In Process') : status === 'Delivering' ? (t('delivering_filter') || 'Delivering') : status}
                  </option>
                ))}
              </select>
              {(order.status === 'Cancelled' || order.status === 'Completed') && <p className="mt-1.5 text-xs text-slate-500">This order is in a final status and can no longer be changed.</p>}
            </div>
            <button
              onClick={handleUpdateStatus}
              disabled={isUpdating || newStatus === order.status || order.status === 'Cancelled' || order.status === 'Completed'}
              className="inline-flex items-center justify-center gap-2 border border-sky-800 bg-sky-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
            >{isUpdating ? <Activity size={15} className="animate-spin" /> : <Save size={15} />}{isUpdating ? (t('saving') || 'Saving...') : (t('save_changes') || 'Save status')}</button>
          </div>
        </section>

        <section className="flex flex-col gap-4 border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-sky-100 bg-sky-50 text-sky-800"><Mail size={18} /></span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900">Customer Email</h2>
              <p className="mt-1 break-all text-sm text-slate-600">{order.customer?.email || 'No email address available'}</p>
              <p className="mt-1 text-xs text-slate-500">Write a custom message or resend the order confirmation.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={openEmailComposer}
              disabled={!order.customer?.email}
              className="inline-flex items-center justify-center gap-2 border border-sky-800 bg-sky-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
            ><Mail size={15} /> Open Email Template</button>
            <button
              onClick={handleResendEmail}
              disabled={isResendingEmail || !order.customer?.email}
              className="inline-flex items-center justify-center gap-2 border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-sky-600 hover:bg-sky-50 hover:text-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
            >{isResendingEmail ? <Activity size={15} className="animate-spin" /> : <Mail size={15} />}{isResendingEmail ? (t('sending') || 'Sending...') : (t('resend_confirmation') || 'Resend Confirmation')}</button>
          </div>
        </section>
      </div>
      {/* Email Template Modal */}
      <AnimatePresence>
        {isEmailComposerOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4"
            onClick={() => setIsEmailComposerOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-2xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Write to customer</h2>
                  <p className="mt-0.5 text-sm text-slate-500">An order update template is ready for you to edit.</p>
                </div>
                <button onClick={() => setIsEmailComposerOpen(false)} className="flex h-9 w-9 items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800" aria-label="Close email composer"><X size={18} /></button>
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">To</label>
                  <div className="border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">{order.customer?.email}</div>
                </div>
                <div>
                  <label htmlFor="order-email-subject" className="mb-1.5 block text-xs font-semibold text-slate-600">Subject</label>
                  <input id="order-email-subject" value={emailSubject} onChange={(event) => setEmailSubject(event.target.value)} className="w-full border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-sky-700 focus:ring-1 focus:ring-sky-700" />
                </div>
                <div>
                  <label htmlFor="order-email-body" className="mb-1.5 block text-xs font-semibold text-slate-600">Message</label>
                  <textarea id="order-email-body" value={emailBody} onChange={(event) => setEmailBody(event.target.value)} rows={8} className="w-full resize-y border border-slate-300 px-3 py-3 text-sm leading-6 text-slate-800 outline-none focus:border-sky-700 focus:ring-1 focus:ring-sky-700" />
                  <p className="mt-1.5 text-xs text-slate-500">The order number and date are included automatically in the email.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button onClick={() => setIsEmailComposerOpen(false)} className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
                <button onClick={handleSendEmail} disabled={isSendingEmail || !emailSubject.trim() || !emailBody.trim()} className="inline-flex items-center gap-2 border border-sky-800 bg-sky-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50">
                  {isSendingEmail ? <Activity size={15} className="animate-spin" /> : <Mail size={15} />}{isSendingEmail ? (t('sending') || 'Sending...') : 'Send Email'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {isReceiptModalOpen && order?.paymentReceiptUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4 md:p-8"
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
              className="relative max-w-4xl max-h-full  overflow-hidden shadow-2xl"
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

      {/* Email Success Modal */}
      <AnimatePresence>
        {emailSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white  p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
              <div className="w-16 h-16 bg-green-50  flex items-center justify-center text-green-500 mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-2">{t('success_exclaim') || 'Success!'}</h2>
              <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">
                {emailSuccess}
              </p>
              <button
                onClick={() => setEmailSuccess('')}
                className="w-full py-3 bg-sky-800 text-white  font-bold text-xs uppercase tracking-widest hover:bg-sky-900 transition-colors"
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white  p-8 max-w-md w-full shadow-2xl flex flex-col relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">{t('edit_shipping_address') || 'Edit Shipping Address'}</h2>
                <button onClick={() => setIsEditAddressModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4">{t('update_address_desc') || 'Update the delivery address for this order.'}</p>
              <textarea
                value={editAddressText}
                onChange={(e) => setEditAddressText(e.target.value)}
                className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200  focus:outline-none focus:ring-2 focus:ring-zinc-900/10 text-sm text-slate-800 resize-none mb-6"
                placeholder="Enter new shipping address..."
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditAddressModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600  font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleSaveAddress}
                  disabled={isSavingAddress || !editAddressText.trim()}
                  className="flex-1 py-3 bg-sky-800 text-white  font-bold text-sm hover:bg-sky-900 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white  p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden border border-red-100"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
              <div className="w-16 h-16 bg-red-50  flex items-center justify-center text-red-500 mb-6">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-lg font-black text-slate-900 mb-2">{t('cancel_order_q') || 'Cancel Order?'}</h2>
              <p className="mb-4 text-sm font-medium leading-relaxed text-slate-600">
                {t('cancel_order_confirm') || 'Are you sure you want to cancel this order?'} <strong className="text-rose-700">{t('cancel_order_desc1') || 'The product stock will be automatically restored to your inventory.'}</strong> {t('cancel_order_desc2') || 'This action cannot be undone.'}
              </p>
              <div className="mb-6 flex w-full items-start gap-2 border border-rose-200 bg-rose-50 p-3 text-left text-xs leading-5 text-rose-800">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>If payment has already been collected, arrange a refund with the customer separately. Cancelling this order does not process a refund.</span>
              </div>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600  font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={isUpdating}
                  className="flex-1 py-3 bg-red-600 text-white  font-bold text-xs uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
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
