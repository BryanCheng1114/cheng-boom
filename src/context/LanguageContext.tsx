import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'zh' | 'ms';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    inventory: 'Inventory',
    products: 'Products',
    settings: 'Settings',
    customers: 'Customers',
    orders: 'Orders',
    total_customers: 'Total Customers',
    sellers: 'Sellers',
    guests: 'Guests',
    total_products: 'Total Products',
    live_products: 'Live Products',
    total_orders: 'Total Orders',
    live_inventory: 'Live Inventory',
    active_products: 'Active Products',
    all_transactions: 'All Transactions',
    registered_customers: 'Registered Customers',
    growth_members: 'Growth & Members',
    add_new_product: 'Add New Product',
    search_placeholder: 'Search products...',
    all_categories: 'All Categories',
    stock: 'Stock',
    price: 'Price',
    status: 'Status',
    delete_selected: 'Delete Selected',
    appearance: 'Visual Appearance',
    midnight_protocol: 'Midnight Protocol',
    daylight_clarity: 'Daylight Clarity',
    language_pref: 'Language Preference',
    english: 'English',
    chinese: 'Chinese',
    malay: 'Malay',
    save_settings: 'Save Settings',
    syncing: 'Synchronizing with database...',
    synced: 'Settings are synced across all sessions.',
    system_overview: 'System Overview',
    total_revenue: 'Total Revenue',
    completed_sales: 'Completed Sales',
    recent_transactions: 'Recent Transactions',
    market_split: 'Market Split',
    verified_sellers: 'Verified Sellers',
    regular_members: 'Regular Members',
    manage_customer_base: 'Manage Customer Base',
    view_inventory: 'View Inventory',
    members: 'Members',
    incoming: 'Incoming',
    active_action: 'Active Action',
    fulfilled: 'Fulfilled',
    cancelled: 'Cancelled',
    order_id: 'Order ID',
    total: 'Total',
    date: 'Date',
    click_to_manage: 'Click to manage',
    showing: 'Showing',
    to: 'to',
    of: 'of',
    records: 'Records',
    page: 'Page',
    order_contents: 'Order Contents',
    customer_info: 'Customer Info',
    fulfillment_details: 'Fulfillment Details',
    order_control: 'Order Control',
    current_status: 'Current Status',
    save_changes: 'Save Changes',
    back_to_orders: 'Back to Orders',
    items: 'Items',
    subtotal: 'Subtotal',
    total_amount: 'Total Amount',
    processing: 'Processing',
    out_for_delivery: 'Out for Delivery',
    name: 'Name',
    contact: 'Contact',
    shipping_address: 'Shipping Address',
    payment_method: 'Payment Method',
    fulfillment_mode: 'Fulfillment Mode',
    order_notes: 'Order Notes',
    order_placed: 'Order Placed',
    logout: 'Logout',
    search_customers_placeholder: 'Search by name, phone or ID...',
    all_roles: 'All Roles',
    join_date: 'Join Date',
    phone: 'Phone',
    role: 'Role',
    customer: 'Customer'
  },
  zh: {
    dashboard: '仪表盘',
    inventory: '库存管理',
    products: '产品',
    settings: '设置',
    customers: '客户',
    orders: '订单管理',
    total_customers: '客户总数',
    sellers: '卖家',
    guests: '游客',
    total_products: '产品总数',
    live_products: '上架产品',
    total_orders: '订单总数',
    live_inventory: '实时库存',
    active_products: '活跃产品',
    all_transactions: '所有交易',
    registered_customers: '注册客户',
    growth_members: '增长与会员',
    add_new_product: '添加新产品',
    search_placeholder: '搜索产品...',
    all_categories: '所有类别',
    stock: '库存',
    price: '价格',
    status: '状态',
    delete_selected: '删除选中项',
    appearance: '视觉外观',
    midnight_protocol: '午夜模式',
    daylight_clarity: '白昼模式',
    language_pref: '语言偏好',
    english: '英文',
    chinese: '中文',
    malay: '马来文',
    save_settings: '保存设置',
    syncing: '正在同步到数据库...',
    synced: '设置已在所有会话中同步。',
    system_overview: '系统概览',
    total_revenue: '总收入',
    completed_sales: '已完成销售',
    recent_transactions: '最近交易',
    market_split: '市场分布',
    verified_sellers: '认证卖家',
    regular_members: '普通会员',
    manage_customer_base: '管理客户群',
    view_inventory: '查看库存',
    members: '会员',
    incoming: '待处理',
    active_action: '正在处理',
    fulfilled: '已完成',
    cancelled: '已取消',
    order_id: '订单编号',
    total: '总额',
    date: '日期',
    click_to_manage: '点击管理',
    showing: '显示',
    to: '至',
    of: '共',
    records: '条记录',
    page: '第',
    order_contents: '订单内容',
    customer_info: '客户信息',
    fulfillment_details: '履行详情',
    order_control: '订单控制',
    current_status: '当前状态',
    save_changes: '保存修改',
    back_to_orders: '返回订单列表',
    items: '件商品',
    subtotal: '小计',
    total_amount: '总金额',
    processing: '正在处理',
    out_for_delivery: '正在派送',
    name: '名称',
    contact: '联系方式',
    shipping_address: '收货地址',
    payment_method: '支付方式',
    fulfillment_mode: '履行模式',
    order_notes: '订单备注',
    order_placed: '下单时间',
    logout: '退出登录',
    search_customers_placeholder: '搜索名称、电话或ID...',
    all_roles: '所有角色',
    join_date: '加入日期',
    phone: '电话',
    role: '角色',
    customer: '客户'
  },
  ms: {
    dashboard: 'Papan Pemuka',
    inventory: 'Inventori',
    products: 'Produk',
    settings: 'Tetapan',
    customers: 'Pelanggan',
    orders: 'Pesanan',
    total_customers: 'Jumlah Pelanggan',
    sellers: 'Penjual',
    guests: 'Tetamu',
    total_products: 'Jumlah Produk',
    live_products: 'Produk Aktif',
    total_orders: 'Jumlah Pesanan',
    live_inventory: 'Inventori Langsung',
    active_products: 'Produk Aktif',
    all_transactions: 'Semua Transaksi',
    registered_customers: 'Pelanggan Berdaftar',
    growth_members: 'Pertumbuhan & Ahli',
    add_new_product: 'Tambah Produk Baru',
    search_placeholder: 'Cari produk...',
    all_categories: 'Semua Kategori',
    stock: 'Stok',
    price: 'Harga',
    status: 'Status',
    delete_selected: 'Padam Terpilih',
    appearance: 'Penampilan Visual',
    midnight_protocol: 'Protokol Tengah Malam',
    daylight_clarity: 'Kejelasan Siang',
    language_pref: 'Pilihan Bahasa',
    english: 'Inggeris',
    chinese: 'Cina',
    malay: 'Melayu',
    save_settings: 'Simpan Tetapan',
    syncing: 'Menyelaras dengan pangkalan data...',
    synced: 'Tetapan diselaraskan merentas semua sesi.',
    system_overview: 'Gambaran Keseluruhan Sistem',
    total_revenue: 'Jumlah Hasil',
    completed_sales: 'Jualan Selesai',
    recent_transactions: 'Transaksi Terkini',
    market_split: 'Pecahan Pasaran',
    verified_sellers: 'Penjual Disahkan',
    regular_members: 'Ahli Biasa',
    manage_customer_base: 'Urus Pangkalan Pelanggan',
    view_inventory: 'Lihat Inventori',
    members: 'Ahli',
    incoming: 'Masuk',
    active_action: 'Tindakan Aktif',
    fulfilled: 'Selesai',
    cancelled: 'Dibatalkan',
    order_id: 'ID Pesanan',
    total: 'Jumlah',
    date: 'Tarikh',
    click_to_manage: 'Klik untuk urus',
    showing: 'Menunjukkan',
    to: 'hingga',
    of: 'daripada',
    records: 'Rekod',
    page: 'Halaman',
    order_contents: 'Kandungan Pesanan',
    customer_info: 'Maklumat Pelanggan',
    fulfillment_details: 'Butiran Pemenuhan',
    order_control: 'Kawalan Pesanan',
    current_status: 'Status Semasa',
    save_changes: 'Simpan Perubahan',
    back_to_orders: 'Kembali ke Pesanan',
    items: 'Item',
    subtotal: 'Sub-jumlah',
    total_amount: 'Jumlah Besar',
    processing: 'Dalam Proses',
    out_for_delivery: 'Dalam Penghantaran',
    name: 'Nama',
    contact: 'Hubungi',
    shipping_address: 'Alamat Penghantaran',
    payment_method: 'Kaedah Pembayaran',
    fulfillment_mode: 'Mod Pemenuhan',
    order_notes: 'Nota Pesanan',
    order_placed: 'Pesanan Dibuat',
    logout: 'Log Keluar',
    search_customers_placeholder: 'Cari mengikut nama, telefon atau ID...',
    all_roles: 'Semua Peranan',
    join_date: 'Tarikh Sertai',
    phone: 'Telefon',
    role: 'Peranan',
    customer: 'Pelanggan'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // 1. Instantly retrieve saved preference from memory on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('admin_selected_language');
      if (savedLang && ['en', 'zh', 'ms'].includes(savedLang)) {
        setLanguageState(savedLang as Language);
      }
    }
  }, []);

  // 2. Custom setLanguage wrapper to update state & persist to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_selected_language', lang);
    }
  };

  // 3. Keep database preferences in sync if logged in as admin
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.language) {
            setLanguage(data.language as Language);
          }
        }
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
