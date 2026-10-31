import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pencil,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  MoreVertical, 
  Image as ImageIcon,
  Trash2,
  Edit,
  ExternalLink,
  X,
  Package,
  CheckCircle,
  Video as VideoIcon,
  AlertTriangle,
  Check,
  Upload,
  Download,
  FileSpreadsheet,
  Table,
  HelpCircle,
  UploadCloud,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ProductPage = () => {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Management States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: '', direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  // Fast Action States
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ stock?: number, sellerAPrice?: number, sellerBPrice?: number }>({});
  const [isSavingFastAction, setIsSavingFastAction] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showBulkGuideModal, setShowBulkGuideModal] = useState(false);
  const [showQuickEditGuide, setShowQuickEditGuide] = useState(false);
  const [selectedGuideImage, setSelectedGuideImage] = useState<string | null>(null);
  const [showPdfTooltip, setShowPdfTooltip] = useState(false);

  // Success Modal State
  const [showUpdateSuccessModal, setShowUpdateSuccessModal] = useState(false);

  // ── Localization helpers ──────────────────────────────────────────
  const getLocalizedName = (p: any) => {
    if (language === 'zh' && p.nameZh) return p.nameZh;
    if (language === 'ms' && p.nameMs) return p.nameMs;
    return p.name || '-';
  };

  const getLocalizedCategoryName = (cat: any) => {
    if (language === 'zh' && cat.nameZh) return cat.nameZh;
    if (language === 'ms' && cat.nameMs) return cat.nameMs;
    return cat.name || '-';
  };

  const getTranslatedStatus = (status: string) => {
    if (status === 'Live') return t('live_products');
    if (status === 'Hold') return t('hold');
    if (status === 'Deactive') return t('deactive');
    return status || '-';
  };

  const buildRows = () => {
    // Sort products by category first, then by code ascending (e.g., PO0001, PO0002)
    const sortedProducts = [...products].sort((a, b) => {
      const catCompare = (a.category || '').localeCompare(b.category || '');
      if (catCompare !== 0) return catCompare;
      return (a.code || '').localeCompare(b.code || '');
    });

    return sortedProducts.map((p, i) => ({
      'No.': i + 1,
      'Code': p.code || '-',
      'Name': getLocalizedName(p),
      'Category': p.category || '-',
      'Total Stock': p.stock ?? 0,
      'Seller A Single Price ($)': p.sellerAPrice != null ? Number(p.sellerAPrice).toFixed(2) : '-',
      'Seller B Single Price ($)': p.sellerBPrice != null ? Number(p.sellerBPrice).toFixed(2) : '-',
      'Items Per Box': p.itemsPerBox ?? '-',
      'Seller A Box Price ($)': p.sellerABoxPrice != null ? Number(p.sellerABoxPrice).toFixed(2) : '-',
      'Seller B Box Price ($)': p.sellerBBoxPrice != null ? Number(p.sellerBBoxPrice).toFixed(2) : '-',
      'Items Per Bundle': p.bundleQuantity ?? '-',
      'Seller A Bundle Price ($)': p.sellerABundlePrice != null ? Number(p.sellerABundlePrice).toFixed(2) : '-',
      'Seller B Bundle Price ($)': p.sellerBBundlePrice != null ? Number(p.sellerBBundlePrice).toFixed(2) : '-',
      'Status': getTranslatedStatus(p.status),
      'Notes': '',
    }));
  };

  const downloadExcel = async () => {
    const XLSX = await import('xlsx');
    const rows = buildRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, 'inventory.xlsx');
    setShowDownloadMenu(false);
  };

  const downloadPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    // PDF always exports in English — jsPDF's built-in fonts do not support
    // CJK characters, which causes garbled symbols. CSV/Excel support Unicode fine.
    const pdfRows = [...products]
      .sort((a, b) => {
        const catCompare = (a.category || '').localeCompare(b.category || '');
        if (catCompare !== 0) return catCompare;
        return (a.code || '').localeCompare(b.code || '');
      })
      .map((p, i) => {
        const cleanText = (str: any) => {
          if (!str) return '-';
          return String(str)
            .normalize('NFKC')
            .replace(/[^\x20-\x7E]/g, '') // Strip ALL non-ASCII characters (including Chinese) since jsPDF helvetica only supports standard ASCII
            .replace(/\s+/g, ' ') // Convert all spaces (including NBSP) to a regular space to allow autoTable to wrap
            .trim() || '-';
        };
        
        return {
          'No.': i + 1,
          'Code': cleanText(p.code),
          'Name': cleanText(p.name),
          'Category': cleanText(p.category),
          'Total Stock': p.stock ?? 0,
          'Seller A Single Price ($)': p.sellerAPrice != null ? Number(p.sellerAPrice).toFixed(2) : '-',
          'Seller B Single Price ($)': p.sellerBPrice != null ? Number(p.sellerBPrice).toFixed(2) : '-',
          'Items Per Box': p.itemsPerBox ?? '-',
          'Seller A Box Price ($)': p.sellerABoxPrice != null ? Number(p.sellerABoxPrice).toFixed(2) : '-',
          'Seller B Box Price ($)': p.sellerBBoxPrice != null ? Number(p.sellerBBoxPrice).toFixed(2) : '-',
          'Items Per Bundle': p.bundleQuantity ?? '-',
          'Seller A Bundle Price ($)': p.sellerABundlePrice != null ? Number(p.sellerABundlePrice).toFixed(2) : '-',
          'Seller B Bundle Price ($)': p.sellerBBundlePrice != null ? Number(p.sellerBBundlePrice).toFixed(2) : '-',
          'Status': p.status || '-',
          'Notes': '',
        };
      });

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Inventory Report', 14, 15);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}  |  Total Products: ${products.length}`, 14, 22);

    const headers = Object.keys(pdfRows[0] || {});
    autoTable(doc, {
      startY: 28,
      head: [headers],
      body: pdfRows.map(r => headers.map(h => (r as any)[h])),
      styles: { fontSize: 7, cellPadding: 2, textColor: 0, lineColor: 0, lineWidth: 0.1, valign: 'middle' },
      headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', valign: 'middle' },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 15 },
        2: { cellWidth: 40 }, // Force Name column to wrap if too long
        14: { cellWidth: 40 }, // Give Notes column space for handwriting
      },
      margin: { left: 10, right: 10 },
    });
    doc.save('inventory.pdf');
    setShowDownloadMenu(false);
  };
  // ─────────────────────────────────────────────────────────────────



  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, orderRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/orders')
      ]);
      const [prodData, catData, orderData] = await Promise.all([
        prodRes.json(),
        catRes.json(),
        orderRes.json()
      ]);
      setProducts(Array.isArray(prodData) ? prodData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setOrders(Array.isArray(orderData) ? orderData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Check for successful updates
  useEffect(() => {
    if (router.query.updated === 'category') {
      setShowUpdateSuccessModal(true);
      router.replace('/admin/product', undefined, { shallow: true });
    }
  }, [router.query.updated, router]);

  // Data processing for charts
  const stockData = useMemo(() => {
    let available = 0, lowStock = 0, outOfStock = 0;
    products.forEach(p => {
      if (p.stock >= 10) available++;
      else if (p.stock > 0 && p.stock < 10) lowStock++;
      else outOfStock++;
    });
    return [
      { name: t('available_products') || 'Available Products', value: available, color: '#1e1b4b' }, // very dark blue
      { name: t('low_stock') || 'Low Stock', value: lowStock, color: '#3b82f6' }, // blue
      { name: t('out_of_stock') || 'Out of Stock', value: outOfStock, color: '#93c5fd' }, // light blue
    ];
  }, [products, t]);

  const salesData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const salesMap: Record<string, { name: string, sold: number }> = {};
    
    // Initialize
    products.forEach(p => {
      salesMap[p.id] = { name: getLocalizedName(p), sold: 0 };
    });

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear && order.status !== 'Cancelled') {
        order.items?.forEach((item: any) => {
          if (salesMap[item.productId]) {
            salesMap[item.productId].sold += item.quantity;
          } else {
            salesMap[item.productId] = { name: item.name, sold: item.quantity };
          }
        });
      }
    });

    const sortedSales = Object.values(salesMap).sort((a, b) => b.sold - a.sold);
    
    // Get top 6
    return sortedSales.slice(0, 6).map(item => ({
      name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
      sold: item.sold
    })).reverse();
  }, [orders, products]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      
      let matchesStatus = true;
      if (statusFilter !== 'All') {
        if (statusFilter === 'Out of Stock') {
          matchesStatus = p.stock <= 0;
        } else if (statusFilter === 'Low Stock') {
          matchesStatus = p.stock > 0 && p.stock < 10;
        } else {
          matchesStatus = p.status === statusFilter && p.stock >= 10;
        }
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  // Sorting Logic
  const sortedProducts = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredProducts;

    return [...filteredProducts].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'price_active') {
        aVal = a.sellerAPrice;
        bVal = b.sellerAPrice;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProducts, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, currentPage]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedProducts.map(p => p.id));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    setIsBulkDeleting(true);
    try {
      const response = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (response.ok) {
        setProducts(products.filter(p => !selectedIds.includes(p.id)));
        setSelectedIds([]);
        setShowBulkDeleteModal(false);
      } else {
        setSelectedIds([]);
        setShowBulkDeleteModal(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteSingle = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [productToDelete.id] }),
      });
      if (response.ok) {
        setProducts(products.filter(p => p.id !== productToDelete.id));
        setProductToDelete(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditStart = (p: any) => {
    setEditingProduct(p.id);
    setEditValues({ stock: p.stock, sellerAPrice: p.sellerAPrice, sellerBPrice: p.sellerBPrice });
  };

  const handleFastActionSave = async (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSavingFastAction(true);
    try {
      const response = await fetch(`/api/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...p,
          stock: editValues.stock,
          sellerAPrice: editValues.sellerAPrice,
          sellerBPrice: editValues.sellerBPrice,
        }),
      });
      if (response.ok) {
        setProducts(products.map(prod => prod.id === p.id ? { ...prod, stock: editValues.stock, sellerAPrice: editValues.sellerAPrice, sellerBPrice: editValues.sellerBPrice } : prod));
        setEditingProduct(null);
      } else {
        alert('Failed to update product');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingFastAction(false);
    }
  };

  const handleStatusChange = async (p: any, newStatus: string) => {
    setEditingStatusId(null);
    if (p.status === newStatus) return;
    
    try {
      const response = await fetch(`/api/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...p,
          status: newStatus
        }),
      });
      if (response.ok) {
        setProducts(products.map(prod => prod.id === p.id ? { ...prod, status: newStatus } : prod));
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const SortIndicator = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={12} className="text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronRight size={12} className="rotate-[-90deg] text-yellow-500" /> : <ChevronRight size={12} className="rotate-[90deg] text-yellow-500" />;
  };

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Link href="/admin/product/upload" className="inline-flex items-center gap-2 border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-sky-600 hover:bg-sky-50 hover:text-sky-800">
        <Pencil size={14} />{t('inventory_new_entry')}
      </Link>
      <Link href="/admin/product/bulk-upload" className="inline-flex items-center gap-2 border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-sky-600 hover:bg-sky-50 hover:text-sky-800">
        <Upload size={14} />{t('inventory_import_excel')}
      </Link>
      <div className="relative">
        <button onClick={() => setShowDownloadMenu((value) => !value)} className="inline-flex items-center gap-2 border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-sky-600 hover:bg-sky-50 hover:text-sky-800" title={t('inventory_export_title')}>
          <Download size={14} />{t('inventory_export')}<ChevronDown size={13} />
        </button>
        <AnimatePresence>
          {showDownloadMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDownloadMenu(false)} />
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 top-full z-20 mt-2 w-44 border border-slate-200 bg-white shadow-xl">
                <button onClick={downloadExcel} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-sky-50">
                  <Table size={15} className="text-sky-700" />{t('inventory_export_excel')}
                </button>
                <button onClick={downloadPDF} className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-sky-50">
                  <FileSpreadsheet size={15} className="text-sky-700" />{t('inventory_export_pdf')}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      <button onClick={() => setShowBulkGuideModal(true)} className="inline-flex items-center gap-2 border border-slate-400 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-sky-600 hover:bg-sky-50 hover:text-sky-800">
        <HelpCircle size={14} />{t('inventory_tutorial')}
      </button>
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            onClick={() => setShowBulkDeleteModal(true)}
            className="flex items-center justify-center gap-2 border border-rose-700 bg-rose-700 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-rose-800"
          >
            <Trash2 size={15} />{t('delete_selected')} ({selectedIds.length})
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
  return (
    <AdminLayout title={t('inventory')} hideTitle>
      <div className="space-y-6">
        <header className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <h1 className="text-[26px] font-normal leading-tight tracking-tight text-slate-800">{t('inventory') || 'Inventory'}</h1>
            <span className="text-xs font-normal text-slate-700">[ {t('inventory_access')} ]</span>
          </div>
          <p className="text-xs text-slate-600">{t('inventory_product_information_breadcrumb')} /</p>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-3">{headerActions}</div>
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div 
            onClick={() => { setStatusFilter('Live'); setCurrentPage(1); }}
            className="flex min-h-[150px] cursor-pointer flex-col justify-between border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center text-slate-500">
                  <CheckCircle size={18} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-medium text-slate-700">{t('live_products')}</span>
              </div>
              <MoreVertical size={18} className="text-slate-300" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-2xl font-semibold leading-none tracking-tight text-slate-900">
                {products.filter(p => p.status === 'Live').length}
              </h3>
              <p className="pb-0.5 text-xs font-medium text-slate-500">{t('available_on_store') || 'Available on store'}</p>
            </div>
          </div>

          <div 
            onClick={() => { setStatusFilter('Hold'); setCurrentPage(1); }}
            className="flex min-h-[150px] cursor-pointer flex-col justify-between border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center text-slate-500">
                  <AlertTriangle size={18} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-medium text-slate-700">{t('hold')}</span>
              </div>
              <MoreVertical size={18} className="text-slate-300" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-2xl font-semibold leading-none tracking-tight text-slate-900">
                {products.filter(p => p.status === 'Hold').length}
              </h3>
              <p className="pb-0.5 text-xs font-medium text-slate-500">{t('awaiting_action') || 'Awaiting action'}</p>
            </div>
          </div>

          <div 
            onClick={() => { setStatusFilter('Deactive'); setCurrentPage(1); }}
            className="flex min-h-[150px] cursor-pointer flex-col justify-between border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center text-slate-500">
                  <X size={18} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-medium text-slate-700">{t('deactive')}</span>
              </div>
              <MoreVertical size={18} className="text-slate-300" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-2xl font-semibold leading-none tracking-tight text-slate-900">
                {products.filter(p => p.status === 'Deactive').length}
              </h3>
              <p className="pb-0.5 text-xs font-medium text-slate-500">{t('unpublished_items') || 'Unpublished items'}</p>
            </div>
          </div>

          <div 
            onClick={() => { setStatusFilter('Low Stock'); setCurrentPage(1); }}
            className="flex min-h-[150px] cursor-pointer flex-col justify-between border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center text-slate-500">
                  <AlertTriangle size={18} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-medium text-slate-700">{t('low_stock') || 'Low Stock'}</span>
              </div>
              <MoreVertical size={18} className="text-slate-300" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-2xl font-semibold leading-none tracking-tight text-slate-900">
                {products.filter(p => p.stock > 0 && p.stock < 10).length}
              </h3>
              <p className="pb-0.5 text-xs font-medium text-slate-500">{t('below_10_items') || 'Below 10 items'}</p>
            </div>
          </div>

          <div 
            onClick={() => { setStatusFilter('Out of Stock'); setCurrentPage(1); }}
            className="flex min-h-[150px] cursor-pointer flex-col justify-between border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center text-slate-500">
                  <X size={18} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-medium text-slate-700">{t('out_of_stock') || 'Out of Stock'}</span>
              </div>
              <MoreVertical size={18} className="text-slate-300" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-2xl font-semibold leading-none tracking-tight text-slate-900">
                {products.filter(p => p.stock <= 0).length}
              </h3>
              <p className="pb-0.5 text-xs font-medium text-slate-500">0 {t('items_left') || 'items left'}</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          
          {/* Best & Least Selling Products */}
          <div className="flex h-[400px] flex-col border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[14px] font-bold text-zinc-800 tracking-wide">{t('best_least_selling') || 'Best & Least Selling Products'}</h3>
            </div>
            <p className="text-[12px] font-medium text-zinc-500 mb-8">{t('see_which_products') || 'See which products sold the most and the least this month'}</p>
            
            <div className="flex-1 w-full relative">
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 600 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontWeight: 'bold' }}
                      labelStyle={{ color: '#52525b', marginBottom: '4px' }}
                    />
                    <Bar dataKey="sold" name={t('units_sold') || 'Sold'} radius={[6, 6, 6, 6]} barSize={24}>
                      {salesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === salesData.length - 1 ? '#4f46e5' : '#e0e7ff'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm font-bold text-zinc-400">{t('no_sales_data') || 'No sales data for this month'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Product Stock Overview */}
          <div className="flex h-[400px] flex-col border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[14px] font-bold text-zinc-800 tracking-wide">{t('product_stock_overview') || 'Product Stock Overview'}</h3>
            </div>
            <p className="text-[12px] font-medium text-zinc-500 mb-8">{t('monitor_products') || 'Monitor which products are available, running low, or sold out'}</p>
            
            <div className="flex-1 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockData}
                    cx="40%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {stockData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontWeight: 'bold' }}
                    itemStyle={{ fontWeight: 'bold', color: '#18181b' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Total inner text */}
              <div className="absolute left-[40%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-zinc-800 tracking-wide leading-none">
                  {products.length}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t('inventory_total_products')}</span>
              </div>

              {/* Legend */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-6">
                {stockData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-zinc-800">{entry.name}</span>
                      <span className="text-[14px] font-extrabold text-zinc-500">{entry.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        </div>

        {/* Unified Table Section */}
        <div className="mt-8">
          <h3 className="mb-4 px-1 text-lg font-medium text-slate-800">{t('inventory_list') || 'Inventory List'}</h3>
          
          <div className="flex flex-col overflow-hidden border border-slate-200 bg-white shadow-sm">
            
            {/* Top Toolbar */}
            <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 p-5 pb-4 lg:flex-row lg:items-center">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'All', label: t('all') || 'All', count: products.length },
                  { id: 'Live', label: t('live') || 'Live', count: products.filter(p => p.status === 'Live' && p.stock >= 10).length },
                  { id: 'Hold', label: t('hold') || 'Hold', count: products.filter(p => p.status === 'Hold' && p.stock >= 10).length },
                  { id: 'Deactive', label: t('deactive') || 'Deactive', count: products.filter(p => p.status === 'Deactive' && p.stock >= 10).length },
                  { id: 'Low Stock', label: t('low_stock') || 'Low stock', count: products.filter(p => p.stock > 0 && p.stock < 10).length },
                  { id: 'Out of Stock', label: t('out_of_stock') || 'Out of stock', count: products.filter(p => p.stock <= 0).length },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => { setStatusFilter(filter.id); setCurrentPage(1); }}
                    className={`border px-3 py-2 text-xs font-medium transition-colors ${
                      statusFilter === filter.id 
                        ? 'border-sky-700 bg-sky-700 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800'
                    }`}
                  >
                    {filter.label} <span className="opacity-70 font-medium ml-1">({filter.count})</span>
                  </button>
                ))}
              </div>

              {/* Right side: Search & Category */}
              <div className="flex flex-1 lg:flex-none items-center gap-3 w-full lg:w-auto">
                <button
                  onClick={() => setShowQuickEditGuide(true)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center border border-slate-300 bg-white text-slate-500 transition-colors hover:border-sky-600 hover:text-sky-700"
                            title={t('quick_action_guide')}
                >
                  <HelpCircle size={18} />
                </button>
                <div className="relative flex-1 lg:w-64 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                  <input 
                    type="text" 
                    placeholder={t('search_placeholder')}
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-[13px] font-medium text-slate-700 outline-none transition-colors focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div className="relative group">
                  <select 
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                    className="appearance-none border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-[13px] font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-sky-500 focus:bg-white"
                  >
                    <option value="All">{t('all_categories')}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>
                        {getLocalizedCategoryName(cat)}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 group-hover:text-zinc-600 transition-colors">
                    <ChevronDown size={14} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 w-16">
                    <button 
                      onClick={handleSelectAll}
                      className={`flex h-5 w-5 items-center justify-center border transition-colors ${
                        selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0
                          ? 'border-sky-700 bg-sky-700 text-white'
                          : 'border-slate-300 hover:border-sky-600'
                      }`}
                    >
                      {selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0 && <Check size={14} strokeWidth={4} />}
                    </button>
                  </th>
                  <th 
                    className="cursor-pointer px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-slate-500 transition-colors group hover:text-sky-700"
                  >
                    {t('product_id') || 'Product ID'}
                  </th>
                  <th 
                    onClick={() => handleSort('name')}
                    className="cursor-pointer px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-slate-500 transition-colors group hover:text-sky-700"
                  >
                    <div className="flex items-center gap-2">{t('product_name') || 'Product Name'} <SortIndicator column="name" /></div>
                  </th>
                  <th 
                    onClick={() => handleSort('category')}
                    className="cursor-pointer px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-slate-500 transition-colors group hover:text-sky-700"
                  >
                    <div className="flex items-center gap-2">{t('all_categories')} <SortIndicator column="category" /></div>
                  </th>
                  <th 
                    onClick={() => handleSort('stock')}
                    className="cursor-pointer px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500 transition-colors group hover:text-sky-700"
                  >
                    <div className="flex items-center justify-center gap-2">{t('stock')} <SortIndicator column="stock" /></div>
                  </th>
                  <th onClick={() => handleSort('price_active')} className="cursor-pointer px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-slate-500 transition-colors group hover:text-sky-700">
                    <div className="flex items-center gap-2">{t('inventory_seller_a')} <SortIndicator column="price_active" /></div>
                  </th>
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">{t('inventory_seller_b')}</th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="cursor-pointer px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-slate-500 transition-colors group hover:text-sky-700"
                  >
                    <div className="flex items-center gap-2">{t('status')} <SortIndicator column="status" /></div>
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="p-20 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs animate-pulse">{t('loading_inventory')}</td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-20 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs">{t('no_products_found')}</td>
                  </tr>
                ) : paginatedProducts.map((p, index) => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <tr 
                      key={p.id} 
                      className={`group cursor-pointer transition-colors hover:bg-sky-50 ${isSelected ? 'bg-sky-50' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                      onClick={() => router.push(`/admin/product/${encodeURIComponent(p.id)}`)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => toggleSelect(p.id, e)}
                          className={`flex h-5 w-5 items-center justify-center border transition-colors ${
                            isSelected 
                              ? 'border-sky-700 bg-sky-700 text-white'
                              : 'border-slate-300 group-hover:border-sky-600'
                          }`}
                        >
                          {isSelected && <Check size={14} strokeWidth={4} />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {p.code && (
                          <span className="text-[12px] font-bold text-zinc-500">#{p.code}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-slate-100 text-slate-500">
                            {p.images && p.images[0] ? (
                              <img src={p.images[0]} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={20} />
                            )}
                          </div>
                          <span className="line-clamp-1 text-sm font-medium text-slate-800 transition-colors group-hover:text-sky-700">{getLocalizedName(p)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                          {getLocalizedCategoryName(categories.find(c => c.name === p.category) ?? { name: p.category })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-black text-zinc-400" onDoubleClick={(e) => { e.stopPropagation(); handleEditStart(p); }} onClick={(e) => e.stopPropagation()}>
                        {editingProduct === p.id ? (
                          <input 
                            type="number" 
                            value={editValues.stock} 
                            onChange={e => setEditValues({ ...editValues, stock: parseInt(e.target.value) || 0 })}
                            className="w-20 border border-slate-300 bg-slate-50 px-2 py-1 text-center text-slate-900 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          p.stock
                        )}
                      </td>
                      <td className="px-4 py-3" onDoubleClick={(e) => { e.stopPropagation(); handleEditStart(p); }} onClick={(e) => e.stopPropagation()}>
                        {editingProduct === p.id ? (
                          <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium text-slate-900">RM</span>
                              <input 
                                type="number" 
                                step="0.01"
                                value={editValues.sellerAPrice}
                                onChange={e => setEditValues({ ...editValues, sellerAPrice: parseFloat(e.target.value) || 0 })}
                                className="w-24 border border-slate-300 bg-slate-50 px-2 py-1 font-medium text-slate-900 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-slate-900">{p.sellerAPrice != null ? `RM ${Number(p.sellerAPrice).toFixed(2)}` : '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3" onDoubleClick={(e) => { e.stopPropagation(); handleEditStart(p); }} onClick={(e) => e.stopPropagation()}>
                        {editingProduct === p.id ? (
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <span className="text-sm font-medium text-slate-900">RM</span>
                            <input type="number" step="0.01" value={editValues.sellerBPrice} onChange={e => setEditValues({ ...editValues, sellerBPrice: parseFloat(e.target.value) || 0 })} className="w-24 border border-slate-300 bg-slate-50 px-2 py-1 font-medium text-slate-900 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600" />
                          </div>
                        ) : <span className="text-sm font-medium text-slate-900">{p.sellerBPrice != null ? `RM ${Number(p.sellerBPrice).toFixed(2)}` : '—'}</span>}
                      </td>
                      <td className="px-4 py-3" onDoubleClick={(e) => { e.stopPropagation(); setEditingStatusId(p.id); }} onClick={(e) => e.stopPropagation()}>
                        {editingStatusId === p.id ? (
                          <select
                            autoFocus
                            value={p.status}
                            onChange={(e) => handleStatusChange(p, e.target.value)}
                            onBlur={() => setEditingStatusId(null)}
                            onClick={e => e.stopPropagation()}
                            className="cursor-pointer border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                          >
                            <option value="Live">{t('status_live')}</option>
                            <option value="Hold">{t('status_hold')}</option>
                            <option value="Deactive">{t('status_deactive')}</option>
                          </select>
                        ) : (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusFilter(p.stock <= 0 ? 'Out of Stock' : p.stock < 10 ? 'Low Stock' : p.status);
                              setCurrentPage(1);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer hover:scale-105 ${
                            p.stock <= 0 ? 'bg-red-100 text-red-700' :
                            p.stock < 10 ? 'bg-amber-100 text-amber-700' :
                            p.status === 'Live' ? 'bg-emerald-100 text-emerald-700' :
                            p.status === 'Hold' ? 'bg-orange-100 text-orange-700' :
                            'bg-zinc-100 text-zinc-600'
                          }`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${
                               p.stock <= 0 ? 'bg-red-500' :
                               p.stock < 10 ? 'bg-amber-500' :
                               p.status === 'Live' ? 'bg-emerald-500' :
                               p.status === 'Hold' ? 'bg-orange-500' :
                               'bg-zinc-400'
                             }`} />
                             {p.stock <= 0 ? t('out_of_stock') : p.stock < 10 ? t('low_stock') : 
                               p.status === 'Live' ? t('live_products') : p.status === 'Hold' ? t('hold') : t('deactive')
                             }
                           </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right relative" onClick={(e) => e.stopPropagation()}>
                        {editingProduct === p.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingProduct(null); }}
                              className="border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                              {t('cancel')}
                            </button>
                            <button 
                              onClick={(e) => handleFastActionSave(p, e)}
                              disabled={isSavingFastAction}
                              className="flex items-center gap-2 border border-sky-700 bg-sky-700 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isSavingFastAction ? (
                                <div className="h-3 w-3 animate-spin border-2 border-white/30 border-t-white" />
                              ) : (
                                <Check size={14} strokeWidth={4} />
                              )}
                              {t('confirm')}
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setProductToDelete(p); }}
                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title={t('confirm_delete_product')}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row">
            <p className="text-xs font-medium text-slate-500">
              {t('showing')} {paginatedProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} {t('to')} {Math.min(currentPage * itemsPerPage, sortedProducts.length)} {t('of')} {products.length} {t('records')}
            </p>
            
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:border-sky-600 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-30"
                title={t('inventory_first_page')}
              >
                <ChevronsLeft size={20} />
              </button>
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:border-sky-600 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-30"
                title={t('inventory_previous_page')}
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`h-9 min-w-9 border px-2 text-xs font-medium transition-colors ${
                      currentPage === i + 1 
                        ? 'border-sky-700 bg-sky-700 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:border-sky-600 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-30"
                title={t('inventory_next_page')}
              >
                <ChevronRight size={20} />
              </button>
              <button 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(totalPages)}
                className="border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:border-sky-600 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-30"
                title={t('inventory_last_page')}
              >
                <ChevronsRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Bulk Delete Confirmation Modal */}
      <AnimatePresence>
        {showBulkDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBulkDeleteModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[48px] p-12 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[28px] flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-3xl font-black italic uppercase tracking-tight mb-4 text-white">{t('permanent_deletion') || 'Permanent Deletion'}</h3>
              <p className="text-zinc-400 font-medium mb-10 leading-relaxed">
                {t('inventory_delete_multiple_desc').replace('{count}', String(selectedIds.length))}
              </p>
              
              <div className="flex gap-4">
                <button 
                  disabled={isBulkDeleting}
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-zinc-500 hover:bg-white/10 transition-all"
                >
                  {t('cancel')}
                </button>
                <button 
                  disabled={isBulkDeleting}
                  onClick={handleDeleteSelected}
                  className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isBulkDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>{t('confirm')}</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Single Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setProductToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[48px] p-12 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[28px] flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-3xl font-black italic uppercase tracking-tight mb-4 text-white">{t('permanent_deletion') || 'Permanent Deletion'}</h3>
              <p className="text-zinc-400 font-medium mb-10 leading-relaxed">
                {t('inventory_delete_single_desc').replace('{name}', getLocalizedName(productToDelete))}
              </p>
              
              <div className="flex gap-4">
                <button 
                  disabled={isDeleting}
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-zinc-500 hover:bg-white/10 transition-all"
                >
                  {t('cancel')}
                </button>
                <button 
                  disabled={isDeleting}
                  onClick={handleDeleteSingle}
                  className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>{t('confirm')}</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Category Overview Modal */}


      {/* Success Modal */}
      <AnimatePresence>
        {showUpdateSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowUpdateSuccessModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white  border  border-zinc-200 rounded-[48px] p-12 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-[28px] flex items-center justify-center mx-auto mb-8 border border-green-500/20">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-3xl font-black italic uppercase tracking-tight mb-4  text-black">{t('inventory_success_heading')}</h3>
              <p className="text-zinc-500  font-medium mb-10 leading-relaxed">
                {t('inventory_update_success_desc')}
              </p>
              <button 
                onClick={() => setShowUpdateSuccessModal(false)}
                className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-500 text-zinc-950 hover:bg-yellow-400 shadow-xl shadow-yellow-500/20 transition-all"
              >
                {t('inventory_ok')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Upload Guide Modal */}
      <AnimatePresence>
        {showBulkGuideModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto border border-slate-200 bg-white shadow-2xl"
            >
              <div className="p-8 md:p-10">
                <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center border border-sky-200 bg-sky-50 text-sky-700">
                      <HelpCircle size={21} strokeWidth={2} />
                    </div>
                    <h3 className="text-xl font-medium tracking-tight text-slate-800">{t('bulk_upload_guidance') || 'Bulk Upload Guidance'}</h3>
                  </div>
                  <button
                    onClick={() => setShowBulkGuideModal(false)}
                    className="flex h-9 w-9 items-center justify-center border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-10">
                  <div className="max-w-2xl text-sm leading-6 text-slate-600">
                    <p>{t('bulk_guide_intro') || 'Welcome to the Bulk Upload guide. Our bulk import system allows you to easily upload hundreds of products and their corresponding images simultaneously using a single ZIP archive. Follow these professional guidelines to ensure a flawless data import experience.'}</p>
                  </div>

                  {/* Step 1 */}
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div 
                      className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden border border-slate-200 bg-slate-50 p-2 transition-colors hover:border-sky-500 md:w-1/2"
                      onClick={() => setSelectedGuideImage("/excel.png")}
                    >
                      <img src="/excel.png" alt="Excel Template Example" className="h-auto w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]" />
                    </div>
                    
                    <div className="w-full md:w-1/2 space-y-3">
                      <div className="mb-2 inline-flex h-8 w-8 items-center justify-center border border-sky-200 bg-sky-50 text-xs font-semibold text-sky-800">1</div>
                      <h4 className="text-xl font-medium text-slate-800">{t('prep_excel_template') || 'Prepare the Excel Template'}</h4>
                      <div className="space-y-3 text-sm leading-6 text-slate-600">
                        <p>{t('prep_step1') || 'Begin by downloading the official template from the Products page.'}</p>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>{t('prep_step2_pt1') || 'Fill in all the required columns (marked with an asterisk'} <span className="text-red-500 font-bold">*</span>).</li>
                          <li>{t('for_the') || 'For the'} <span className="font-semibold text-slate-800">{t('image_filename') || 'Image_Filename'}</span> {t('column_input') || 'column, input the exact filename of your image (e.g.,'} <code className="border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-sky-800">{t('firework_png') || 'firework-01.png'}</code>).</li>
                          <li>{t('prep_step4') || 'Ensure the spelling and file extension (.png, .jpg) matches your actual image file perfectly.'}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                    <div 
                      className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden border border-slate-200 bg-slate-50 p-2 transition-colors hover:border-sky-500 md:w-1/2"
                      onClick={() => setSelectedGuideImage("/zip.png")}
                    >
                      <img src="/zip.png" alt="Folder Structure Example" className="h-auto w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]" />
                    </div>
                    
                    <div className="w-full md:w-1/2 space-y-3">
                      <div className="mb-2 inline-flex h-8 w-8 items-center justify-center border border-sky-200 bg-sky-50 text-xs font-semibold text-sky-800">2</div>
                      <h4 className="text-xl font-medium text-slate-800">{t('pack_zip_archive') || 'Package the ZIP Archive'}</h4>
                      <div className="space-y-3 text-sm leading-6 text-slate-600">
                        <p>{t('pack_step1') || 'Consolidate your filled template and all product images into a single folder.'}</p>
                        <div className="border border-sky-200 bg-sky-50 p-3 text-xs leading-5 text-sky-900">
                          <span className="font-semibold">{t('note_on_folders') || 'Note on Folders:'}</span> {t('do_not_place_images') || 'Our system utilizes a smart-scan engine. Folder names do not matter. We automatically search all directories within your ZIP archive to match filenames perfectly.'}
                        </div>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>{t('pack_step3') || 'Create a new folder on your computer.'}</li>
                          <li>{t('pack_step4') || 'Move your completed `.xlsx` template and all related image files into this folder.'}</li>
                          <li>{t('right_click_select') || 'Right-click the folder and select'} <span className="font-bold text-zinc-700">{t('compress_to_zip') || 'Compress to ZIP file'}</span>.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div 
                      className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden border border-slate-200 bg-slate-50 p-2 transition-colors hover:border-sky-500 md:w-1/2"
                      onClick={() => setSelectedGuideImage("/validation.png")}
                    >
                      <img src="/validation.png" alt="Validation Example" className="h-auto w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]" />
                    </div>
                    
                    <div className="w-full md:w-1/2 space-y-3">
                      <div className="mb-2 inline-flex h-8 w-8 items-center justify-center border border-sky-200 bg-sky-50 text-xs font-semibold text-sky-800">3</div>
                      <h4 className="text-xl font-medium text-slate-800">{t('upload_verify') || 'Upload and Verify'}</h4>
                      <div className="space-y-3 text-sm leading-6 text-slate-600">
                        <p>{t('upload_step1') || 'Navigate to the Bulk Upload page and drop your newly created `.zip` package.'}</p>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>{t('upload_step2') || 'The system will extract and analyze your ZIP package locally.'}</li>
                          <li>{t('upload_step3') || 'A preview table will appear showing exactly how your products will look.'}</li>
                          <li>{t('review_validation') || 'Review any validation errors highlighted in red.'}</li>
                          <li>{t('click') || 'Click'} <span className="font-bold text-zinc-700">{t('confirm_import') || 'Confirm Import'}</span> {t('to_permanently_save') || 'to permanently save the products to the database.'}</li>
                        </ul>
                      </div>
                      
                      <div className="pt-4">
                        <Link 
                          href="/admin/product/bulk-upload" 
                          onClick={() => setShowBulkGuideModal(false)}
                          className="inline-flex items-center justify-center gap-2 border border-sky-700 bg-sky-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-800"
                        >
                          <UploadCloud size={14} /> {t('go_to_bulk_upload') || 'Go to Bulk Upload'}</Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex justify-end">
                  <button 
                    onClick={() => setShowBulkGuideModal(false)}
                    className="inline-flex items-center gap-2 border border-slate-400 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-sky-600 hover:bg-sky-50 hover:text-sky-800"
                  >
                    {t('got_it') || 'Got it'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide Image Preview Modal */}
      <AnimatePresence>
        {selectedGuideImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedGuideImage(null)}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-[90vw] max-h-[90vh] bg-zinc-900 rounded-2xl overflow-hidden flex items-center justify-center border border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedGuideImage} alt="Preview" className="w-full h-full object-contain" />
            </motion.div>
            <button
              onClick={() => setSelectedGuideImage(null)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Edit Guide Modal */}
      <AnimatePresence>
        {showQuickEditGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowQuickEditGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-lg overflow-hidden border border-slate-200 bg-white shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-11 w-11 items-center justify-center border border-sky-200 bg-sky-50 text-sky-700">
                    <HelpCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-zinc-900">{t('quick_action_guide') || 'Quick Action Guide'}</h3>
                    <p className="text-sm font-medium text-zinc-500">{t('inline_editing_shortcuts') || 'Inline Editing Shortcuts'}</p>
                  </div>
                </div>
                
                <div className="border border-slate-200 bg-slate-50 p-5">
                  <div 
                    className="group mb-6 flex cursor-pointer items-center justify-center overflow-hidden border border-slate-200 bg-white p-2 shadow-sm transition-colors hover:border-sky-500"
                    onClick={() => setSelectedGuideImage("/quickaction.png")}
                  >
                    <img src="/quickaction.png" alt="Quick Action Preview" className="h-auto w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]" />
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                    {t('quick_action_subtitle') || "You don't need to leave this page to make simple updates. To quickly edit an item:"}
                  </p>
                  <ul className="mt-4 space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-sky-200 bg-sky-50">
                        <span className="text-[10px] font-semibold text-sky-800">1</span>
                      </div>
                      <span className="text-sm text-zinc-700 font-medium"><strong className="text-zinc-900">{t('double_click') || 'Double-click'}</strong>{t('directly_on_the') || 'directly on the'}<strong className="text-zinc-900">{t('stock_price_status') || 'Stock, Price, or Status'}</strong>{t('cells_in_inventory') || 'cells in the inventory table below.'}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-sky-200 bg-sky-50">
                        <span className="text-[10px] font-semibold text-sky-800">2</span>
                      </div>
                      <span className="text-sm text-zinc-700 font-medium">{t('quick_action_step2') || 'Type your new value or select the new status from the dropdown.'}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-sky-200 bg-sky-50">
                        <span className="text-[10px] font-semibold text-sky-800">3</span>
                      </div>
                      <span className="text-sm font-medium text-slate-700">{t('hit') || 'Hit'} <strong className="border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-800">{t('enter') || 'Enter'}</strong> {t('or_click_green_save') || 'or click the blue Save button to apply your changes.'}</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={() => setShowQuickEditGuide(false)}
                    className="border border-sky-700 bg-sky-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-800"
                  >
                    {t('got_it_thanks') || 'Got it, Thanks!'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </AdminLayout>
  );
};

export default ProductPage;
