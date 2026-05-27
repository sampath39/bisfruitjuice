import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Upload, 
  Loader,
  RefreshCw,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Lock,
  User,
  X
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import api from '../utils/api.js';

// Fallback products and orders for admin testing offline
const MOCK_PRODUCTS = [
  { id: 'j1', name: 'Mango Juice', description: 'Rich and creamy Alphonso mango juice.', price: 99.00, category: 'Juices', image_url: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&q=80&w=200', is_available: true },
  { id: 'j2', name: 'Apple Juice', description: 'Freshly pressed crisp red apples.', price: 120.00, category: 'Juices', image_url: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&q=80&w=200', is_available: true },
  { id: 'j3', name: 'Orange Juice', description: 'Zesty and pulpy sweet oranges.', price: 89.00, category: 'Juices', image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=200', is_available: true }
];

const MOCK_ORDERS = [
  {
    id: 'ord_mock_1',
    customer_name: 'Sampath Kumar',
    customer_mobile: '+91 79896 46180',
    delivery_address: 'Udayagiri Main Road, Udayagiri (Close)',
    distance_km: 1.45,
    total_amount: 278.00,
    payment_method: 'Razorpay',
    payment_status: 'paid',
    order_status: 'preparing',
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    order_items: [
      { id: 'item_1', quantity: 2, price_at_order: 99, products: { name: 'Mango Juice' } },
      { id: 'item_2', quantity: 1, price_at_order: 80, products: { name: 'Orange Juice' } }
    ]
  },
  {
    id: 'ord_mock_2',
    customer_name: 'Imran Khan',
    customer_mobile: '+91 99887 76655',
    delivery_address: 'Madhapur Metro Pillar 32, Hyd',
    distance_km: 7.20,
    total_amount: 140.00,
    payment_method: 'COD',
    payment_status: 'pending',
    order_status: 'pending',
    created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    order_items: [
      { id: 'item_3', quantity: 1, price_at_order: 140, products: { name: 'Strawberry Juice' } }
    ]
  }
];

const MOCK_CHARTS = {
  salesHistory: [
    { date: 'May 21', sales: 1200 },
    { date: 'May 22', sales: 1500 },
    { date: 'May 23', sales: 800 },
    { date: 'May 24', sales: 2200 },
    { date: 'May 25', sales: 1900 },
    { date: 'May 26', sales: 2400 },
    { date: 'May 27', sales: 3100 }
  ],
  categoryPopularity: [
    { name: 'Juices', value: 50 },
    { name: 'Cool Drinks', value: 20 },
    { name: 'Water Bottles', value: 10 },
    { name: 'Ice Creams', value: 12 },
    { name: 'Cigarettes', value: 8 }
  ]
};

const CHART_COLORS = ['#22c55e', '#f97316', '#eab308', '#ec4899'];

export default function AdminDashboard() {
  const { user, signIn, isAdmin } = useAuth();
  const { showToast } = useToast();

  // Navigation tab states
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'products', 'orders'

  // DB datasets
  const [metrics, setMetrics] = useState({ totalOrders: 0, totalRevenue: 0, pendingDeliveries: 0, deliveredOrders: 0 });
  const [salesChart, setSalesChart] = useState([]);
  const [categoryChart, setCategoryChart] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin login credentials (in case they load the panel without login)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [submittingLogin, setSubmittingLogin] = useState(false);

  // Modal open states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null for add, object for edit

  // Product Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('Juices');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load Dashboard Data
  useEffect(() => {
    if (user && isAdmin) {
      loadDashboardData();
    }
  }, [user, isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch Products
      const prodRes = await api.get('/products');
      if (prodRes.data && prodRes.data.length > 0) {
        setProductsList(prodRes.data);
      } else {
        setProductsList(MOCK_PRODUCTS);
      }

      // Fetch Orders
      const orderRes = await api.get('/orders');
      if (orderRes.data && orderRes.data.length > 0) {
        setOrdersList(orderRes.data);
      } else {
        setOrdersList(MOCK_ORDERS);
      }

      // Fetch Analytics
      const analyticsRes = await api.get('/orders/analytics');
      if (analyticsRes.data && analyticsRes.data.metrics) {
        setMetrics(analyticsRes.data.metrics);
        setSalesChart(analyticsRes.data.charts.salesHistory);
        setCategoryChart(analyticsRes.data.charts.categoryPopularity);
      } else {
        throw new Error('No analytics');
      }

    } catch (err) {
      console.warn('API error loading Admin panel, loading mock dashboard data:');
      
      // Fallback
      setProductsList(MOCK_PRODUCTS);
      setOrdersList(MOCK_ORDERS);
      setMetrics({
        totalOrders: MOCK_ORDERS.length,
        totalRevenue: 278.00,
        pendingDeliveries: 2,
        deliveredOrders: 0
      });
      setSalesChart(MOCK_CHARTS.salesHistory);
      setCategoryChart(MOCK_CHARTS.categoryPopularity);
    } finally {
      setLoading(false);
    }
  };

  // Credentials sign in handler
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setSubmittingLogin(true);
    try {
      const { data, error } = await signIn(loginEmail, loginPassword);
      if (error) {
        showToast(error.message || 'Login failed', 'error');
      } else {
        if (data.user.role !== 'admin') {
          showToast('Access denied: Customer account cannot enter Admin Dashboard', 'error');
        } else {
          showToast('Admin authenticated successfully!', 'success');
        }
      }
    } catch (err) {
      showToast('Authentication failed', 'error');
    } finally {
      setSubmittingLogin(false);
    }
  };

  // Image upload base64 trigger
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (e.g. 4MB)
    if (file.size > 4 * 1024 * 1024) {
      showToast('Image size exceeds 4MB limit.', 'warning');
      return;
    }

    setUploadingImage(true);
    
    // Read file as base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64 = reader.result;
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        
        const response = await api.post('/products/upload', {
          fileBase64: base64,
          fileName,
          fileType: file.type
        });

        setFormImageUrl(response.data.imageUrl);
        showToast('Image uploaded successfully!', 'success');
      } catch (err) {
        console.error('Image upload failed, using Unsplash sample fallback:', err);
        // Fallback
        const unsplashFallback = 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=400';
        setFormImageUrl(unsplashFallback);
        showToast('Image upload API failed. Fallback Unsplash URL applied.', 'info');
      } finally {
        setUploadingImage(false);
      }
    };
  };

  // Open Modal Helpers
  const openAddProductModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormCategory('Juices');
    setFormImageUrl('');
    setFormAvailable(true);
    setProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description || '');
    setFormPrice(product.price.toString());
    setFormCategory(product.category || 'Juices');
    setFormImageUrl(product.image_url || '');
    setFormAvailable(product.is_available);
    setProductModalOpen(true);
  };

  // Save Product Handler
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formName || !formPrice) {
      showToast('Name and Price are required', 'warning');
      return;
    }

    const payload = {
      name: formName,
      description: formDescription,
      price: parseFloat(formPrice),
      category: formCategory,
      image_url: formImageUrl,
      is_available: formAvailable
    };

    try {
      if (editingProduct) {
        // Edit API
        const res = await api.put(`/products/${editingProduct.id}`, payload);
        showToast('Product updated successfully!', 'success');
        
        // Update local list
        setProductsList(productsList.map(p => p.id === editingProduct.id ? res.data : p));
      } else {
        // Add API
        const res = await api.post('/products', payload);
        showToast('New product added successfully!', 'success');
        
        // Add to local list
        setProductsList([res.data, ...productsList]);
      }
      setProductModalOpen(false);
    } catch (err) {
      console.warn('API Product Save failed, performing in-memory mockup save:');
      
      // Perform Mock operation
      const mockResult = {
        id: editingProduct ? editingProduct.id : `mock_p_${Math.random().toString(36).substring(2, 9)}`,
        ...payload
      };

      if (editingProduct) {
        setProductsList(productsList.map(p => p.id === editingProduct.id ? mockResult : p));
        showToast('Updated local list (Mock Mode)', 'success');
      } else {
        setProductsList([mockResult, ...productsList]);
        showToast('Added to local list (Mock Mode)', 'success');
      }
      setProductModalOpen(false);
    }
  };

  // Delete Product Handler
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/products/${id}`);
      setProductsList(productsList.filter(p => p.id !== id));
      showToast('Product deleted successfully', 'success');
    } catch (err) {
      console.warn('Delete product API failed, running mock delete:');
      setProductsList(productsList.filter(p => p.id !== id));
      showToast('Deleted from local list (Mock Mode)', 'success');
    }
  };

  // Update Order Status Handler
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/orders/${orderId}`, { order_status: newStatus });
      showToast(`Order status updated to "${newStatus}"`, 'success');
      
      // Update local list
      setOrdersList(ordersList.map(order => 
        order.id === orderId ? { ...order, order_status: newStatus, payment_status: res.data.order.payment_status } : order
      ));
    } catch (err) {
      console.warn('Update order status API failed, updating local state:');
      
      const newPayStatus = newStatus === 'delivered' ? 'paid' : 'pending';
      setOrdersList(ordersList.map(order => 
        order.id === orderId ? { ...order, order_status: newStatus, payment_status: newPayStatus } : order
      ));
      showToast(`Local order status updated to "${newStatus}" (Mock Mode)`, 'success');
    }
  };

  // 1. ADMIN LOGIN PANEL IF REQUIRED
  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto w-full glass-card p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl mt-12 mb-12">
        <div className="flex justify-center mb-6">
          <span className="p-4 bg-orange-50 dark:bg-orange-950/40 text-citrus-orange rounded-full shadow-sm">
            <Lock className="w-8 h-8" />
          </span>
        </div>

        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
          Secure Admin Console
        </h2>
        <p className="text-xs text-slate-500 text-center mb-6">
          Authorized owner access credentials required. Enter Imran's admin credentials below.
        </p>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="relative">
            <User className="w-4.5 h-4.5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Admin Email (e.g. imran@juice.com)"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-850 dark:text-slate-100"
              required
            />
          </div>

          <div className="relative">
            <Lock className="w-4.5 h-4.5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-850 dark:text-slate-100"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submittingLogin}
            className="btn-citrus w-full py-3 mt-2 shadow-none rounded-xl"
          >
            {submittingLogin ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-center">
          <p className="text-[10px] text-slate-450 leading-relaxed">
            * For testing access in mock mode, use email **imran@juice.com** and any password. The system will automatically log you in as Imran the admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10 min-h-[85vh] text-left">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-citrus-orange font-bold text-xs uppercase tracking-widest bg-orange-50 dark:bg-orange-950/40 px-3.5 py-1 rounded-full border border-orange-200/10">Control Console</span>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Hello, Owner Imran!</h1>
          <p className="text-slate-450 text-xs mt-0.5">Manage Bismilla Fruit Juice catalog, edit orders and inspect store metrics.</p>
        </div>

        <button
          onClick={loadDashboardData}
          className="btn-secondary text-xs flex items-center gap-1.5 py-2.5 px-4"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {/* METRICS COUNTING CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Orders', value: metrics.totalOrders, icon: <ShoppingBag className="w-6 h-6 text-primary" />, bg: 'bg-emerald-50/50 dark:bg-emerald-950/20' },
          { title: 'Gross Revenue', value: `₹${metrics.totalRevenue.toFixed(2)}`, icon: <TrendingUp className="w-6 h-6 text-citrus-orange" />, bg: 'bg-orange-50/50 dark:bg-orange-950/20' },
          { title: 'Pending Deliveries', value: metrics.pendingDeliveries, icon: <Clock className="w-6 h-6 text-citrus-yellow-dark" />, bg: 'bg-yellow-50/50 dark:bg-yellow-950/20' },
          { title: 'Orders Delivered', value: metrics.deliveredOrders, icon: <CheckCircle2 className="w-6 h-6 text-indigo-500" />, bg: 'bg-indigo-50/50 dark:bg-indigo-950/20' }
        ].map((card, index) => (
          <div 
            key={index}
            className={`p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 ${card.bg}`}
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.title}</p>
              <h3 className="text-2xl font-bold text-slate-850 dark:text-white">{card.value}</h3>
            </div>
            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm shrink-0">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-slate-150 dark:border-slate-800 gap-6">
        {[
          { id: 'analytics', label: 'Analytics Charts' },
          { id: 'products', label: 'Product Catalog' },
          { id: 'orders', label: 'Order Processing' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 font-semibold text-sm transition-all border-b-2 relative -mb-[2px] ${
              activeTab === tab.id
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* RENDER ACTIVE TAB */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* TAB 1: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Daily Sales Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-semibold text-slate-800 dark:text-white text-base">Weekly Revenue History (₹)</h3>
                
                <div className="h-72 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                      <XAxis dataKey="date" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Area type="monotone" dataKey="sales" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Popular Categories Pie Chart */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-semibold text-slate-800 dark:text-white text-base">Popular Categories sold</h3>
                
                <div className="h-60 w-full flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PRODUCT MANAGEMENT CATALOG */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 dark:text-white text-lg">Inventory Products Catalog</h3>
                
                <button
                  onClick={openAddProductModal}
                  className="btn-primary py-2.5 px-4 text-xs font-semibold rounded-xl"
                >
                  <Plus className="w-4 h-4" /> Add New Juice
                </button>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                        <th className="p-4">Image</th>
                        <th className="p-4">Juice Name</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Availability</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {productsList.map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30">
                          <td className="p-4">
                            <img
                              src={product.image_url || 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=100'}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-100 dark:border-slate-800"
                            />
                          </td>
                          <td className="p-4 font-semibold text-slate-800 dark:text-slate-100">
                            {product.name}
                            <p className="text-[10px] text-slate-450 font-normal mt-0.5 line-clamp-1 max-w-[200px]">{product.description}</p>
                          </td>
                          <td className="p-4 font-medium text-slate-650 dark:text-slate-350">{product.category}</td>
                          <td className="p-4 font-bold text-slate-850 dark:text-white">₹{parseFloat(product.price).toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              product.is_available 
                                ? 'bg-green-100 text-green-700 dark:bg-green-950/30' 
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/30'
                            }`}>
                              {product.is_available ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => openEditProductModal(product)}
                                className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDER PROCESSING */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-slate-800 dark:text-white text-lg">Orders Management Table</h3>

              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Customer Info</th>
                        <th className="p-4">Address Details</th>
                        <th className="p-4">Distance</th>
                        <th className="p-4">Total Price</th>
                        <th className="p-4">Payment</th>
                        <th className="p-4">Order Progress</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {ordersList.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30">
                          <td className="p-4 font-mono font-bold text-slate-850 dark:text-slate-200">
                            #{order.id.substring(0, 8)}
                          </td>
                          <td className="p-4 space-y-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{order.customer_name}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{order.customer_mobile}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-xs text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={order.delivery_address}>
                              {order.delivery_address}
                            </p>
                          </td>
                          <td className="p-4 font-semibold text-slate-700 dark:text-slate-350">
                            {order.distance_km} KM
                          </td>
                          <td className="p-4 font-bold text-slate-850 dark:text-white">
                            ₹{parseFloat(order.total_amount).toFixed(2)}
                            <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Method: {order.payment_method}</span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              order.payment_status === 'paid'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/35'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/35'
                            }`}>
                              {order.payment_status}
                            </span>
                          </td>
                          <td className="p-4">
                            <select
                              value={order.order_status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="pending">Pending</option>
                              <option value="preparing">Preparing</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ADD/EDIT PRODUCT MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={() => setProductModalOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 z-10 shadow-2xl flex flex-col gap-5 text-left">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                {editingProduct ? 'Edit Juice Product' : 'Add New Juice Product'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Mango Juice"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary text-slate-850 dark:text-slate-100 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Price (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="e.g. 99"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary text-slate-850 dark:text-slate-100 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe ingredients, taste, and freshness details..."
                  rows="2.5"
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary text-slate-850 dark:text-slate-100 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-primary text-slate-850 dark:text-slate-100 focus:outline-none font-medium"
                  >
                    <option value="Juices">Juices</option>
                    <option value="Cool Drinks">Cool Drinks</option>
                    <option value="Water Bottles">Water Bottles</option>
                    <option value="Ice Creams">Ice Creams</option>
                    <option value="Cigarettes">Cigarettes</option>
                  </select>
                </div>

                {/* Stock availability */}
                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2.5 pl-1.5">
                    <input
                      type="checkbox"
                      checked={formAvailable}
                      onChange={(e) => setFormAvailable(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary w-4.5 h-4.5"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Juice Available</span>
                  </label>
                </div>
              </div>

              {/* Product Image and Storage Uploader */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Juice Image Upload</label>
                <div className="flex gap-4 items-center">
                  {formImageUrl && (
                    <img
                      src={formImageUrl}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-cover border bg-slate-50 border-slate-100 dark:border-slate-800"
                    />
                  )}
                  
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                        id="image-file-input"
                      />
                      <label
                        htmlFor="image-file-input"
                        className="btn-secondary w-full py-2.5 text-xs text-center border-dashed flex justify-center items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {uploadingImage ? <Loader className="w-4.5 h-4.5 animate-spin" /> : <Upload className="w-4.5 h-4.5" />}
                        Upload Image (Supabase Storage)
                      </label>
                    </div>

                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="Or enter image URL manually..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[10px] text-slate-650 dark:text-slate-350 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="btn-secondary text-xs px-5 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-6 py-2.5 shadow-none"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
