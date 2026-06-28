import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
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
  FileText,
  Table,
  HelpCircle,
  UploadCloud,
  FolderArchive
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
  const [editValues, setEditValues] = useState<{ stock?: number, price?: number }>({});
  const [isSavingFastAction, setIsSavingFastAction] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
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
      'Normal Price ($)': p.price != null ? Number(p.price).toFixed(2) : '-',
      'Agent Price ($)': p.sellerPrice != null && p.sellerPrice !== '' ? Number(p.sellerPrice).toFixed(2) : '-',
      'Promo Price ($)': p.promotion != null && p.promotion !== '' ? Number(p.promotion).toFixed(2) : '-',
      'Items Per Box': p.itemsPerBox ?? '-',
      'Box Price ($)': p.boxPrice != null ? Number(p.boxPrice).toFixed(2) : '-',
      'Box Agent Price ($)': p.boxSellerPrice != null ? Number(p.boxSellerPrice).toFixed(2) : '-',
      'Box Promo Price ($)': p.boxPromotion != null ? Number(p.boxPromotion).toFixed(2) : '-',
      'Items Per Bundle': p.bundleQuantity ?? '-',
      'Bundle Price ($)': p.bundlePrice != null ? Number(p.bundlePrice).toFixed(2) : '-',
      'Bundle Agent Price ($)': p.bundleSellerPrice != null ? Number(p.bundleSellerPrice).toFixed(2) : '-',
      'Bundle Promo Price ($)': p.bundlePromotion != null ? Number(p.bundlePromotion).toFixed(2) : '-',
      'Status': getTranslatedStatus(p.status),
      'Notes': '',
    }));
  };

  const downloadCSV = () => {
    const rows = buildRows();
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'inventory.csv'; a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
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

  const downloadBulkTemplate = async () => {
    const XLSX = await import('xlsx');
    const templateData = [{
      'Code*': 'FW001',
      'Name_EN*': 'Example Firework',
      'Name_ZH': '示例烟花',
      'Category*': 'Cakes',
      'Description_EN*': 'A beautiful 25 shot cake.',
      'Description_ZH': '美丽的25发烟花。',
      'Video_URL': 'https://youtube.com/watch?v=...',
      'Stock*': 100,
      'Price*': 99.90,
      'Promotion_Price': 89.90,
      'Seller_Price': 79.90,
      'Items_Per_Box': 24,
      'Box_Price': 2000.00,
      'Box_Seller_Price': 1800.00,
      'Box_Promotion_Price': 1900.00,
      'Status': 'Live',
      'Image_Filename*': 'firework1.png'
    }];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bulk Upload Template');
    XLSX.writeFile(wb, 'product_bulk_upload_template.xlsx');
    setShowAddMenu(false);
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
          'Normal Price ($)': p.price != null ? Number(p.price).toFixed(2) : '-',
          'Agent Price ($)': p.sellerPrice != null && p.sellerPrice !== '' ? Number(p.sellerPrice).toFixed(2) : '-',
          'Promo Price ($)': p.promotion != null && p.promotion !== '' ? Number(p.promotion).toFixed(2) : '-',
          'Items Per Box': p.itemsPerBox ?? '-',
          'Box Price ($)': p.boxPrice != null ? Number(p.boxPrice).toFixed(2) : '-',
          'Box Agent Price ($)': p.boxSellerPrice != null ? Number(p.boxSellerPrice).toFixed(2) : '-',
          'Box Promo Price ($)': p.boxPromotion != null ? Number(p.boxPromotion).toFixed(2) : '-',
          'Items Per Bundle': p.bundleQuantity ?? '-',
          'Bundle Price ($)': p.bundlePrice != null ? Number(p.bundlePrice).toFixed(2) : '-',
          'Bundle Agent Price ($)': p.bundleSellerPrice != null ? Number(p.bundleSellerPrice).toFixed(2) : '-',
          'Bundle Promo Price ($)': p.bundlePromotion != null ? Number(p.bundlePromotion).toFixed(2) : '-',
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
        17: { cellWidth: 40 }, // Give Notes column space for handwriting
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
        aVal = a.promotion && a.promotion < a.price ? a.promotion : a.price;
        bVal = b.promotion && b.promotion < b.price ? b.promotion : b.price;
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
    setEditValues({ stock: p.stock, price: p.price });
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
          price: editValues.price,
        }),
      });
      if (response.ok) {
        setProducts(products.map(prod => prod.id === p.id ? { ...prod, stock: editValues.stock, price: editValues.price } : prod));
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
    <div className="flex items-center gap-4 w-full md:w-auto">
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            onClick={() => setShowBulkDeleteModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-red-500 text-white rounded-full font-bold text-[14px] tracking-wide hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
          >
            <Trash2 size={16} />
            {t('delete_selected')} ({selectedIds.length})
          </motion.button>
        )}
      </AnimatePresence>
      {/* Add New Product Dropdown */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowBulkGuideModal(true)}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-zinc-100 text-zinc-500 hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors shadow-inner"
          title="Bulk Upload Guide"
        >
          <HelpCircle size={20} />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(v => !v)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-yellow-500 rounded-full text-[14px] font-bold text-zinc-800 tracking-wide hover:brightness-110 shadow-lg shadow-yellow-500/20 transition-all h-11"
          >
            <Plus size={16} strokeWidth={3} />
            {t('add_new_product')}
          </button>
          <AnimatePresence>
            {showAddMenu && (
              <>
                {/* Click-away backdrop */}
                <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-20 overflow-hidden"
              >
                <div className="flex flex-col">
                  <Link 
                    href="/admin/product/upload" 
                    onClick={() => setShowAddMenu(false)}
                    className="flex items-center gap-3 px-5 py-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors"
                  >
                    <Upload size={16} className="text-blue-500" /> Upload Single Item
                  </Link>
                  <Link 
                    href="/admin/product/bulk-upload" 
                    onClick={() => setShowAddMenu(false)}
                    className="flex items-center gap-3 px-5 py-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors"
                  >
                    <Package size={16} className="text-yellow-500" /> Bulk Upload
                  </Link>
                  <div className="h-px bg-zinc-100 my-1 mx-2"></div>
                  <button 
                    onClick={downloadBulkTemplate} 
                    className="w-full flex items-center gap-3 px-5 py-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors"
                  >
                    <Download size={16} className="text-emerald-500" /> Download Template
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* Download Button */}
      <div className="relative">
        <button
          onClick={() => setShowDownloadMenu(v => !v)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-zinc-900 rounded-full hover:bg-zinc-50 shadow-sm transition-all border border-zinc-200"
          title="Download Inventory"
        >
          <Download size={16} strokeWidth={3} />
        </button>
        <AnimatePresence>
          {showDownloadMenu && (
            <>
              {/* Click-away backdrop */}
              <div className="fixed inset-0 z-10" onClick={() => setShowDownloadMenu(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-52 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-20"
              >
                <button onClick={downloadCSV} className="w-full flex items-center gap-3 px-5 py-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors rounded-t-2xl">
                  <FileText size={16} className="text-blue-500" /> {t('export_csv')}
                </button>
                <button onClick={downloadExcel} className="w-full flex items-center gap-3 px-5 py-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors border-t border-zinc-100">
                  <Table size={16} className="text-green-500" /> {t('export_excel')}
                </button>
                <button onClick={downloadPDF} className="w-full flex items-center gap-3 px-5 py-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors border-t border-zinc-100 rounded-b-2xl">
                  <FileSpreadsheet size={16} className="text-red-500" /> 
                  <span className="flex-1 text-left">{t('export_pdf')}</span>
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowPdfTooltip(true)}
                    onMouseLeave={() => setShowPdfTooltip(false)}
                    onClick={e => e.stopPropagation()}
                  >
                    <HelpCircle size={14} className="text-zinc-400 hover:text-yellow-500 transition-colors" />
                    {showPdfTooltip && (
                      <div className="absolute bottom-full right-0 mb-2 w-56 bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-2xl z-50 pointer-events-none">
                        <p className="text-[10px] font-bold text-zinc-300 leading-relaxed">
                          {t('pdf_english_only')}
                        </p>
                      </div>
                    )}
                  </div>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <AdminLayout title={t('inventory')} headerActions={headerActions}>
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div 
            onClick={() => { setStatusFilter('Live'); setCurrentPage(1); }}
            className="bg-white border border-zinc-100 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 group shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg cursor-pointer hover:border-[#10b981]/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-[#10b981]">
                  <CheckCircle size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[14px] font-bold text-zinc-800 tracking-wide">{t('live_products')}</span>
              </div>
              <MoreVertical size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-3xl font-bold text-zinc-800 tracking-wide leading-none">
                {products.filter(p => p.status === 'Live').length}
              </h3>
              <p className="text-[12px] font-medium text-zinc-500 pb-0.5">Available on store</p>
            </div>
          </div>

          <div 
            onClick={() => { setStatusFilter('Hold'); setCurrentPage(1); }}
            className="bg-white border border-zinc-100 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 group shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg cursor-pointer hover:border-[#f59e0b]/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-[#f59e0b]">
                  <AlertTriangle size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[14px] font-bold text-zinc-800 tracking-wide">{t('hold')}</span>
              </div>
              <MoreVertical size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-3xl font-bold text-zinc-800 tracking-wide leading-none">
                {products.filter(p => p.status === 'Hold').length}
              </h3>
              <p className="text-[12px] font-medium text-zinc-500 pb-0.5">Awaiting action</p>
            </div>
          </div>

          <div 
            onClick={() => { setStatusFilter('Deactive'); setCurrentPage(1); }}
            className="bg-white border border-zinc-100 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 group shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg cursor-pointer hover:border-zinc-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-zinc-400">
                  <X size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[14px] font-bold text-zinc-800 tracking-wide">{t('deactive')}</span>
              </div>
              <MoreVertical size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-3xl font-bold text-zinc-800 tracking-wide leading-none">
                {products.filter(p => p.status === 'Deactive').length}
              </h3>
              <p className="text-[12px] font-medium text-zinc-500 pb-0.5">Unpublished items</p>
            </div>
          </div>

          <div 
            onClick={() => { setStatusFilter('Low Stock'); setCurrentPage(1); }}
            className="bg-white border border-zinc-100 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 group shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg cursor-pointer hover:border-orange-500/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-orange-500">
                  <AlertTriangle size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[14px] font-bold text-zinc-800 tracking-wide">Low Stock</span>
              </div>
              <MoreVertical size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-3xl font-bold text-zinc-800 tracking-wide leading-none">
                {products.filter(p => p.stock > 0 && p.stock < 10).length}
              </h3>
              <p className="text-[12px] font-medium text-zinc-500 pb-0.5">Below 10 items</p>
            </div>
          </div>

          <div 
            onClick={() => { setStatusFilter('Out of Stock'); setCurrentPage(1); }}
            className="bg-white border border-zinc-100 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 group shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg cursor-pointer hover:border-red-500/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-red-500">
                  <X size={18} strokeWidth={2.5} />
                </div>
                <span className="text-[14px] font-bold text-zinc-800 tracking-wide">Out of Stock</span>
              </div>
              <MoreVertical size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-3xl font-bold text-zinc-800 tracking-wide leading-none">
                {products.filter(p => p.stock <= 0).length}
              </h3>
              <p className="text-[12px] font-medium text-zinc-500 pb-0.5">0 items left</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          
          {/* Best & Least Selling Products */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[14px] font-bold text-zinc-800 tracking-wide">Best &amp; Least Selling Products</h3>
            </div>
            <p className="text-[12px] font-medium text-zinc-500 mb-8">See which products sold the most and the least this month</p>
            
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
                    <Bar dataKey="sold" radius={[6, 6, 6, 6]} barSize={24}>
                      {salesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === salesData.length - 1 ? '#4f46e5' : '#e0e7ff'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm font-bold text-zinc-400">No sales data for this month</p>
                </div>
              )}
            </div>
          </div>

          {/* Product Stock Overview */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[14px] font-bold text-zinc-800 tracking-wide">Product Stock Overview</h3>
            </div>
            <p className="text-[12px] font-medium text-zinc-500 mb-8">Monitor which products are available, running low, or sold out</p>
            
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
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total</span>
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
          <h3 className="text-xl font-bold text-zinc-800 tracking-wide px-2 mb-6">Inventory List</h3>
          
          <div className="bg-white border border-zinc-100 rounded-[40px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
            
            {/* Top Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between p-6 pb-4 border-b border-zinc-100">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'All', label: 'All', count: products.length },
                  { id: 'Live', label: 'Live', count: products.filter(p => p.status === 'Live' && p.stock >= 10).length },
                  { id: 'Hold', label: 'Hold', count: products.filter(p => p.status === 'Hold' && p.stock >= 10).length },
                  { id: 'Deactive', label: 'Deactive', count: products.filter(p => p.status === 'Deactive' && p.stock >= 10).length },
                  { id: 'Low Stock', label: 'Low stock', count: products.filter(p => p.stock > 0 && p.stock < 10).length },
                  { id: 'Out of Stock', label: 'Out of stock', count: products.filter(p => p.stock <= 0).length },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => { setStatusFilter(filter.id); setCurrentPage(1); }}
                    className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                      statusFilter === filter.id 
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
                        : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
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
                  className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-blue-500 hover:bg-blue-500/10 transition-colors shrink-0"
                  title="Quick Action Guide"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-full outline-none focus:border-blue-500 focus:bg-white transition-all text-[13px] font-bold text-zinc-700"
                  />
                </div>

                <div className="relative group">
                  <select 
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                    className="appearance-none bg-zinc-50 border border-zinc-200 text-[13px] font-bold text-zinc-700 rounded-full pl-5 pr-10 py-2.5 outline-none focus:border-blue-500 focus:bg-white hover:border-zinc-300 cursor-pointer transition-all"
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
              <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-100">
                  <th className="px-4 py-3 w-16">
                    <button 
                      onClick={handleSelectAll}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0
                          ? 'bg-yellow-500 border-yellow-500 text-zinc-900' 
                          : 'border-zinc-500/20 hover:border-zinc-500/50'
                      }`}
                    >
                      {selectedIds.length === paginatedProducts.length && paginatedProducts.length > 0 && <Check size={14} strokeWidth={4} />}
                    </button>
                  </th>
                  <th 
                    className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer group hover:text-yellow-500 transition-colors"
                  >
                    Product ID
                  </th>
                  <th 
                    onClick={() => handleSort('name')}
                    className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer group hover:text-yellow-500 transition-colors"
                  >
                    <div className="flex items-center gap-2">{t('products')} <SortIndicator column="name" /></div>
                  </th>
                  <th 
                    onClick={() => handleSort('category')}
                    className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer group hover:text-yellow-500 transition-colors"
                  >
                    <div className="flex items-center gap-2">{t('all_categories')} <SortIndicator column="category" /></div>
                  </th>
                  <th 
                    onClick={() => handleSort('stock')}
                    className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer group hover:text-yellow-500 transition-colors text-center"
                  >
                    <div className="flex items-center justify-center gap-2">{t('stock')} <SortIndicator column="stock" /></div>
                  </th>
                  <th 
                    onClick={() => handleSort('price_active')}
                    className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer group hover:text-yellow-500 transition-colors"
                  >
                    <div className="flex items-center gap-2">{t('price')} <SortIndicator column="price_active" /></div>
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="px-4 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer group hover:text-yellow-500 transition-colors"
                  >
                    <div className="flex items-center gap-2">{t('status')} <SortIndicator column="status" /></div>
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-500/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-20 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs animate-pulse">{t('loading_inventory')}</td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-20 text-center text-zinc-500 font-bold uppercase tracking-widest text-xs">{t('no_products_found')}</td>
                  </tr>
                ) : paginatedProducts.map((p) => {
                  const hasPromotion = p.promotion !== null && p.promotion !== undefined && p.promotion < p.price;
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <tr 
                      key={p.id} 
                      className={`group hover:bg-zinc-500/5 transition-colors cursor-pointer ${isSelected ? 'bg-yellow-500/5' : ''}`} 
                      onClick={() => router.push(`/admin/product/edit/${p.id}`)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => toggleSelect(p.id, e)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-yellow-500 border-yellow-500 text-zinc-900' 
                              : 'border-zinc-500/20 group-hover:border-zinc-500/50'
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
                          <div className="w-10 h-10 bg-zinc-500/10 rounded-xl overflow-hidden flex items-center justify-center text-zinc-500 border border-white/5 shrink-0">
                            {p.images && p.images[0] ? (
                              <img src={p.images[0]} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={20} />
                            )}
                          </div>
                          <span className="font-bold text-sm text-zinc-900 group-hover:text-yellow-500 transition-colors line-clamp-1">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-3 py-1 bg-zinc-500/10 rounded-full text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          {getLocalizedCategoryName(categories.find(c => c.name === p.category) ?? { name: p.category })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-black text-zinc-400" onDoubleClick={(e) => { e.stopPropagation(); handleEditStart(p); }} onClick={(e) => e.stopPropagation()}>
                        {editingProduct === p.id ? (
                          <input 
                            type="number" 
                            value={editValues.stock} 
                            onChange={e => setEditValues({ ...editValues, stock: parseInt(e.target.value) || 0 })}
                            className="w-20 bg-zinc-100  text-zinc-900  px-2 py-1 rounded text-center border border-zinc-300  outline-none focus:border-yellow-500 :border-yellow-500"
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
                              <span className="text-sm font-black text-yellow-500 italic">RM</span>
                              <input 
                                type="number" 
                                step="0.01"
                                value={editValues.price} 
                                onChange={e => setEditValues({ ...editValues, price: parseFloat(e.target.value) || 0 })}
                                className="w-24 bg-zinc-100  text-zinc-900  px-2 py-1 rounded border border-zinc-300  outline-none focus:border-yellow-500 :border-yellow-500 font-bold"
                              />
                            </div>
                            {hasPromotion && (
                              <span className="text-[9px] text-zinc-500 line-through">RM {p.price.toFixed(2)}</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-yellow-500 italic">
                              RM {hasPromotion ? p.promotion.toFixed(2) : p.price.toFixed(2)}
                            </span>
                            {hasPromotion && (
                              <span className="text-[9px] text-zinc-500 line-through">RM {p.price.toFixed(2)}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3" onDoubleClick={(e) => { e.stopPropagation(); setEditingStatusId(p.id); }} onClick={(e) => e.stopPropagation()}>
                        {editingStatusId === p.id ? (
                          <select
                            autoFocus
                            value={p.status}
                            onChange={(e) => handleStatusChange(p, e.target.value)}
                            onBlur={() => setEditingStatusId(null)}
                            onClick={e => e.stopPropagation()}
                            className="bg-zinc-100  text-zinc-900  px-2 py-1 rounded border border-zinc-300  outline-none text-[10px] font-black uppercase tracking-widest cursor-pointer"
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
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer hover:scale-105 hover:brightness-110 ${
                            p.stock <= 0 ? 'bg-red-500/10 text-red-600  border border-red-500/20' :
                            p.stock < 10 ? 'bg-yellow-500/10 text-yellow-600  border border-yellow-500/20' :
                            p.status === 'Live' ? 'bg-green-500/10 text-green-600  border border-green-500/20' :
                            p.status === 'Hold' ? 'bg-orange-500/10 text-orange-600  border border-orange-500/20' :
                            'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${
                              p.stock <= 0 ? 'bg-red-500 shadow-red-500/50' :
                              p.stock < 10 ? 'bg-yellow-500 shadow-yellow-500/50' :
                              p.status === 'Live' ? 'bg-green-500 shadow-green-500/50' :
                              p.status === 'Hold' ? 'bg-orange-500 shadow-orange-500/50' :
                              'bg-zinc-500 shadow-zinc-500/50'
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
                              className="px-4 py-2 bg-zinc-500/10 text-zinc-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-500/20 transition-all"
                            >
                              {t('cancel')}
                            </button>
                            <button 
                              onClick={(e) => handleFastActionSave(p, e)}
                              disabled={isSavingFastAction}
                              className="px-4 py-2 bg-yellow-500 text-zinc-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-lg shadow-yellow-500/20 transition-all flex items-center gap-2"
                            >
                              {isSavingFastAction ? (
                                <div className="w-3 h-3 border-2 border-zinc-900/20 border-t-zinc-900 rounded-full animate-spin" />
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
                            title="Delete Product"
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
          <div className="p-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-100">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              {t('showing')} {paginatedProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} {t('to')} {Math.min(currentPage * itemsPerPage, sortedProducts.length)} {t('of')} {products.length} {t('records')}
            </p>
            
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="p-2 rounded-xl bg-zinc-500/10 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="First Page"
              >
                <ChevronsLeft size={20} />
              </button>
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 rounded-xl bg-zinc-500/10 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Previous Page"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                      currentPage === i + 1 
                        ? 'bg-yellow-500 text-zinc-900 shadow-lg shadow-yellow-500/20' 
                        : 'bg-zinc-500/5 text-zinc-500 hover:bg-zinc-500/10'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-2 rounded-xl bg-zinc-500/10 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Next Page"
              >
                <ChevronRight size={20} />
              </button>
              <button 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(totalPages)}
                className="p-2 rounded-xl bg-zinc-500/10 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Last Page"
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
              <h3 className="text-3xl font-black italic uppercase tracking-tight mb-4 text-white">Permanent Deletion</h3>
              <p className="text-zinc-400 font-medium mb-10 leading-relaxed">
                You will forever delete <span className="text-white font-bold">{selectedIds.length} products</span> and won't be find back. All associated images will be permanently removed from storage.
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
              <h3 className="text-3xl font-black italic uppercase tracking-tight mb-4 text-white">Permanent Deletion</h3>
              <p className="text-zinc-400 font-medium mb-10 leading-relaxed">
                You will forever delete <span className="text-white font-bold">{getLocalizedName(productToDelete)}</span>. It won't be recoverable.
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
              <h3 className="text-3xl font-black italic uppercase tracking-tight mb-4  text-black">Success</h3>
              <p className="text-zinc-500  font-medium mb-10 leading-relaxed">
                You have successfully updated the info.
              </p>
              <button 
                onClick={() => setShowUpdateSuccessModal(false)}
                className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-yellow-500 text-zinc-950 hover:bg-yellow-400 shadow-xl shadow-yellow-500/20 transition-all"
              >
                OK
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
              className="bg-white border border-zinc-200 rounded-[32px] w-full max-w-4xl shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8 md:p-10">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 text-yellow-600 rounded-xl">
                      <HelpCircle size={24} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-black italic tracking-tight text-zinc-900">
                      Bulk Upload Guidance
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowBulkGuideModal(false)}
                    className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-12">
                  <div className="max-w-2xl text-zinc-600 font-medium">
                    <p>
                      Welcome to the Bulk Upload guide. Our bulk import system allows you to easily upload hundreds of products and their corresponding images simultaneously using a single ZIP archive. Follow these professional guidelines to ensure a flawless data import experience.
                    </p>
                  </div>

                  {/* Step 1 */}
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div 
                      className="w-full md:w-1/2 bg-zinc-100 rounded-2xl border border-zinc-200 flex items-center justify-center relative overflow-hidden p-2 cursor-pointer hover:border-yellow-500 transition-colors group"
                      onClick={() => setSelectedGuideImage("/excel.png")}
                    >
                      <img src="/excel.png" alt="Excel Template Example" className="w-full h-auto object-contain rounded-xl shadow-md group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                    
                    <div className="w-full md:w-1/2 space-y-3">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 font-black text-xs mb-2 shadow-sm border border-blue-500/20">1</div>
                      <h4 className="text-2xl font-black italic text-zinc-900">Prepare the Excel Template</h4>
                      <div className="text-sm text-zinc-500 space-y-3 font-medium">
                        <p>Begin by downloading the official template from the Products page.</p>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>Fill in all the required columns (marked with an asterisk <span className="text-red-500 font-bold">*</span>).</li>
                          <li>For the <span className="font-bold text-zinc-700">Image_Filename</span> column, input the exact filename of your image (e.g., <code className="bg-zinc-100 px-2 py-0.5 rounded text-xs text-pink-600 font-mono">firework-01.png</code>).</li>
                          <li>Ensure the spelling and file extension (.png, .jpg) matches your actual image file perfectly.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                    <div 
                      className="w-full md:w-1/2 bg-zinc-100 rounded-2xl border border-zinc-200 flex items-center justify-center relative overflow-hidden p-2 cursor-pointer hover:border-yellow-500 transition-colors group"
                      onClick={() => setSelectedGuideImage("/zip.png")}
                    >
                      <img src="/zip.png" alt="Folder Structure Example" className="w-full h-auto object-contain rounded-xl shadow-md group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                    
                    <div className="w-full md:w-1/2 space-y-3">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-600 font-black text-xs mb-2 shadow-sm border border-yellow-500/20">2</div>
                      <h4 className="text-2xl font-black italic text-zinc-900">Package the ZIP Archive</h4>
                      <div className="text-sm text-zinc-500 space-y-3 font-medium">
                        <p>Consolidate your filled template and all product images into a single folder.</p>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-800">
                          <span className="font-bold">Note on Folders:</span> Our system utilizes a smart-scan engine. Folder names do not matter. We automatically search all directories within your ZIP archive to match filenames perfectly.
                        </div>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>Create a new folder on your computer.</li>
                          <li>Move your completed `.xlsx` template and all related image files into this folder.</li>
                          <li>Right-click the folder and select <span className="font-bold text-zinc-700">Compress to ZIP file</span>.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div 
                      className="w-full md:w-1/2 bg-zinc-100 rounded-2xl border border-zinc-200 flex items-center justify-center relative overflow-hidden p-2 cursor-pointer hover:border-green-500 transition-colors group"
                      onClick={() => setSelectedGuideImage("/validation.png")}
                    >
                      <img src="/validation.png" alt="Validation Example" className="w-full h-auto object-contain rounded-xl shadow-md group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                    
                    <div className="w-full md:w-1/2 space-y-3">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-600 font-black text-xs mb-2 shadow-sm border border-green-500/20">3</div>
                      <h4 className="text-2xl font-black italic text-zinc-900">Upload and Verify</h4>
                      <div className="text-sm text-zinc-500 space-y-3 font-medium">
                        <p>Navigate to the Bulk Upload page and drop your newly created `.zip` package.</p>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>The system will extract and analyze your ZIP package locally.</li>
                          <li>A preview table will appear showing exactly how your products will look.</li>
                          <li>Review any validation errors highlighted in red.</li>
                          <li>Click <span className="font-bold text-zinc-700">Confirm Import</span> to permanently save the products to the database.</li>
                        </ul>
                      </div>
                      
                      <div className="pt-4">
                        <Link 
                          href="/admin/product/bulk-upload" 
                          onClick={() => setShowBulkGuideModal(false)}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-transform shadow-xl shadow-zinc-900/20"
                        >
                          <UploadCloud size={14} /> Go to Bulk Upload
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex justify-end">
                  <button 
                    onClick={() => setShowBulkGuideModal(false)}
                    className="px-8 py-3.5 bg-yellow-500 text-zinc-900 rounded-full font-black uppercase tracking-widest text-xs hover:brightness-110 shadow-lg shadow-yellow-500/20 transition-all flex items-center gap-2"
                  >
                    Got it
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
              className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <HelpCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-zinc-900">Quick Action Guide</h3>
                    <p className="text-sm font-medium text-zinc-500">Inline Editing Shortcuts</p>
                  </div>
                </div>
                
                <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
                  <div 
                    className="mb-6 bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm flex items-center justify-center p-2 cursor-pointer hover:border-blue-500 transition-colors group"
                    onClick={() => setSelectedGuideImage("/quickaction.png")}
                  >
                    <img src="/quickaction.png" alt="Quick Action Preview" className="w-full h-auto rounded-lg object-contain group-hover:scale-[1.02] transition-transform duration-300" />
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                    You don't need to leave this page to make simple updates. To quickly edit an item:
                  </p>
                  <ul className="mt-4 space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-black text-zinc-600">1</span>
                      </div>
                      <span className="text-sm text-zinc-700 font-medium"><strong className="text-zinc-900">Double-click</strong> directly on the <strong className="text-zinc-900">Stock, Price, or Status</strong> cells in the inventory table below.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-black text-zinc-600">2</span>
                      </div>
                      <span className="text-sm text-zinc-700 font-medium">Type your new value or select the new status from the dropdown.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-black text-zinc-600">3</span>
                      </div>
                      <span className="text-sm text-zinc-700 font-medium">Hit <strong className="text-zinc-900 bg-zinc-200 px-1.5 py-0.5 rounded text-xs">Enter</strong> or click the green Save icon to instantly apply your changes!</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={() => setShowQuickEditGuide(false)}
                    className="px-8 py-3.5 bg-blue-500 text-white rounded-full font-black uppercase tracking-widest text-xs hover:brightness-110 shadow-lg shadow-blue-500/20 transition-all"
                  >
                    Got it, Thanks!
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
