import React, { useState, useEffect, useRef } from 'react';
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
  Lock,
  User,
  X,
  Truck,
  ThumbsUp,
  CreditCard,
  Users,
  Smartphone,
  DollarSign,
  AlertCircle,
  Menu,
  CheckCircle
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

// Fallback catalog seed data for admin offline mode
const MOCK_PRODUCTS = [
  { id: 'j1', name: 'Mango Juice', description: 'Rich and creamy Alphonso mango juice.', price: 99.00, category: 'Juices', image_url: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&q=80&w=200', is_available: true },
  { id: 'j2', name: 'Apple Juice', description: 'Freshly pressed crisp red apples.', price: 120.00, category: 'Juices', image_url: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&q=80&w=200', is_available: true },
  { id: 'j3', name: 'Orange Juice', description: 'Zesty and pulpy sweet oranges.', price: 89.00, category: 'Juices', image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=200', is_available: true }
];

const CHART_COLORS = ['#22c55e', '#f97316', '#eab308', '#ec4899'];

export default function AdminDashboard() {
  const { user, signIn, isAdmin } = useAuth();
  const { showToast } = useToast();

  // Navigation sidebar & mobile states
  const [activeTab, setActiveTab] = useState('overview'); // Mapped to 10 sections + catalog
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // DB datasets
  const [metrics, setMetrics] = useState({ totalOrders: 0, totalRevenue: 0, pendingDeliveries: 0, deliveredOrders: 0 });
  const [salesChart, setSalesChart] = useState([]);
  const [categoryChart, setCategoryChart] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth panel states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [submittingLogin, setSubmittingLogin] = useState(false);

  // Modals & inputs
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [otpModalOrder, setOtpModalOrder] = useState(null); // Order object currently verifying OTP
  const [enteredOtp, setEnteredOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Real-time alert notifications
  const [newOrderPopup, setNewOrderPopup] = useState(null);

  // Product Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('Juices');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Synthesize double-chime welcome beep
  const playChimeSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // First high chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.35);

      // Second higher chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15); // A5
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio synthesis bypassed:', e);
    }
  };

  // Load Dashboard Data
  useEffect(() => {
    if (user && isAdmin) {
      loadDashboardData();
    }
  }, [user, isAdmin]);

  // WebSocket Subscription Setup
  useEffect(() => {
    if (!user || !isAdmin) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultHost = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
    const apiHost = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace(/^http(s)?:\/\//, '').split('/')[0]
      : defaultHost;
      
    const socketUrl = `${protocol}//${apiHost}`;
    console.log('🔌 Admin Dashboard subscribing to WebSocket:', socketUrl);

    let ws;
    let reconnectTimeout;

    const connect = () => {
      ws = new WebSocket(socketUrl);

      ws.onopen = () => {
        console.log('🔌 Admin WebSocket Connected!');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'NEW_ORDER') {
            console.log('🔔 Realtime: New Order Received!', data.order);
            playChimeSound();
            setNewOrderPopup(data.order);
            
            // Insert into local list
            setOrdersList((prev) => {
              const exists = prev.some(o => o.id === data.order.id);
              if (exists) return prev;
              return [data.order, ...prev];
            });

            // Adjust metrics
            setMetrics((prev) => ({
              ...prev,
              totalOrders: prev.totalOrders + 1,
              pendingDeliveries: prev.pendingDeliveries + 1
            }));
          }

          if (data.type === 'ORDER_UPDATED') {
            console.log('🔔 Realtime: Order Updated!', data.order);
            setOrdersList((prev) => 
              prev.map(o => o.id === data.order.id ? data.order : o)
            );
            
            // Reload analytics in background to keep metrics synced
            silentReloadMetrics();
          }
        } catch (err) {
          console.error('Error handling WebSocket message in Admin:', err);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [user, isAdmin]);

  // Periodic background check fallback (every 10 seconds)
  useEffect(() => {
    if (!user || !isAdmin) return;
    const interval = setInterval(() => {
      silentReloadMetrics();
      // Fetch fresh orders
      api.get('/orders').then((res) => {
        if (res.data) {
          setOrdersList((prev) => {
            // Merge lists cleanly to avoid losing new orders in real-time
            const merged = [...res.data];
            prev.forEach(item => {
              if (!merged.some(o => o.id === item.id)) {
                merged.push(item);
              }
            });
            // Sort by created_at descending
            return merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          });
        }
      }).catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, [user, isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch Products
      const prodRes = await api.get('/products');
      setProductsList(prodRes.data || MOCK_PRODUCTS);

      // Fetch Orders
      const orderRes = await api.get('/orders');
      setOrdersList(orderRes.data || []);

      // Fetch Analytics
      const analyticsRes = await api.get('/orders/analytics');
      if (analyticsRes.data && analyticsRes.data.metrics) {
        setMetrics(analyticsRes.data.metrics);
        setSalesChart(analyticsRes.data.charts.salesHistory);
        setCategoryChart(analyticsRes.data.charts.categoryPopularity);
      }
    } catch (err) {
      console.warn('API error loading Admin panel, operating in Mock Mode.');
      setProductsList(MOCK_PRODUCTS);
      setOrdersList([]);
    } finally {
      setLoading(false);
    }
  };

  const silentReloadMetrics = async () => {
    try {
      const analyticsRes = await api.get('/orders/analytics');
      if (analyticsRes.data && analyticsRes.data.metrics) {
        setMetrics(analyticsRes.data.metrics);
        setSalesChart(analyticsRes.data.charts.salesHistory);
        setCategoryChart(analyticsRes.data.charts.categoryPopularity);
      }
    } catch (err) {
      console.warn('Silent analytics metrics reload failed.');
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

    if (file.size > 4 * 1024 * 1024) {
      showToast('Image size exceeds 4MB limit.', 'warning');
      return;
    }

    setUploadingImage(true);
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
        const unsplashFallback = 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=400';
        setFormImageUrl(unsplashFallback);
        showToast('Image upload API failed. Fallback Unsplash URL applied.', 'info');
      } finally {
        setUploadingImage(false);
      }
    };
  };

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
        const res = await api.put(`/products/${editingProduct.id}`, payload);
        showToast('Product updated successfully!', 'success');
        setProductsList(productsList.map(p => p.id === editingProduct.id ? res.data : p));
      } else {
        const res = await api.post('/products', payload);
        showToast('New product added successfully!', 'success');
        setProductsList([res.data, ...productsList]);
      }
      setProductModalOpen(false);
    } catch (err) {
      const mockResult = {
        id: editingProduct ? editingProduct.id : `mock_p_${Math.random().toString(36).substring(2, 9)}`,
        ...payload
      };
      if (editingProduct) {
        setProductsList(productsList.map(p => p.id === editingProduct.id ? mockResult : p));
      } else {
        setProductsList([mockResult, ...productsList]);
      }
      showToast('Local inventory updated (Mock Mode)', 'success');
      setProductModalOpen(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProductsList(productsList.filter(p => p.id !== id));
      showToast('Product deleted successfully', 'success');
    } catch (err) {
      setProductsList(productsList.filter(p => p.id !== id));
      showToast('Deleted from local list (Mock Mode)', 'success');
    }
  };

  // Actions for Order Workflow
  const handleOrderStatusUpdate = async (orderId, status) => {
    try {
      const res = await api.put(`/orders/${orderId}`, { order_status: status });
      showToast(`Order status updated to: ${status.toUpperCase()}`, 'success');
      setOrdersList(ordersList.map(o => o.id === orderId ? res.data.order : o));
    } catch (err) {
      setOrdersList(ordersList.map(o => o.id === orderId ? { ...o, order_status: status } : o));
      showToast(`Local order status updated (Mock Mode)`, 'success');
    }
  };

  const handleSendOtp = async (orderId) => {
    try {
      const res = await api.post(`/orders/${orderId}/send-otp`);
      showToast(`OTP Code sent: ${res.data.otp_code}`, 'success');
      setOrdersList(ordersList.map(o => o.id === orderId ? res.data.order : o));
      
      // Open verification dialog immediately
      setEnteredOtp('');
      setOtpModalOrder(res.data.order);
    } catch (err) {
      // Mock flow
      const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
      setOrdersList(ordersList.map(o => 
        o.id === orderId ? { ...o, order_status: 'otp_pending', otp_code: mockOtp } : o
      ));
      showToast(`Mock OTP generated: ${mockOtp}`, 'success');
      
      const foundOrder = ordersList.find(o => o.id === orderId);
      if (foundOrder) {
        setOtpModalOrder({ ...foundOrder, order_status: 'otp_pending', otp_code: mockOtp });
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!enteredOtp) return;
    setVerifyingOtp(true);

    try {
      const res = await api.post(`/orders/${otpModalOrder.id}/verify-otp`, { otp: enteredOtp });
      showToast('OTP verified successfully! Order delivered.', 'success');
      setOrdersList(ordersList.map(o => o.id === otpModalOrder.id ? res.data.order : o));
      setOtpModalOrder(null);
    } catch (err) {
      if (otpModalOrder.otp_code === enteredOtp) {
        // Mock fallback success
        const updated = {
          ...otpModalOrder,
          order_status: 'delivered',
          otp_verified: true,
          delivered_at: new Date().toISOString(),
          payment_status: otpModalOrder.payment_method === 'COD' ? 'paid' : otpModalOrder.payment_status
        };
        setOrdersList(ordersList.map(o => o.id === otpModalOrder.id ? updated : o));
        setOtpModalOrder(null);
        showToast('OTP verified successfully! Order delivered (Mock Mode).', 'success');
      } else {
        showToast(err.response?.data?.error || 'Incorrect OTP code. Try again.', 'error');
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Compile Dynamic Customer details from orders list
  const getUniqueCustomers = () => {
    const customers = [];
    const customerMap = new Map();

    ordersList.forEach(order => {
      const key = `${order.customer_name}_${order.customer_mobile}`;
      if (!customerMap.has(key)) {
        customerMap.set(key, true);
        customers.push({
          name: order.customer_name,
          mobile: order.customer_mobile,
          address: order.delivery_address,
          totalSpent: parseFloat(order.total_amount),
          lastOrder: order.created_at
        });
      } else {
        const idx = customers.findIndex(c => c.name === order.customer_name && c.mobile === order.customer_mobile);
        if (idx !== -1) {
          customers[idx].totalSpent += parseFloat(order.total_amount);
          if (new Date(order.created_at) > new Date(customers[idx].lastOrder)) {
            customers[idx].lastOrder = order.created_at;
          }
        }
      }
    });
    return customers;
  };

  // Mappings for the 10 Filter Sections
  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'pending':
        return ordersList.filter(o => o.order_status === 'pending');
      case 'accepted':
        return ordersList.filter(o => o.order_status === 'accepted');
      case 'preparing':
        return ordersList.filter(o => o.order_status === 'preparing');
      case 'out_for_delivery':
        return ordersList.filter(o => o.order_status === 'out_for_delivery' || o.order_status === 'otp_pending');
      case 'delivered':
        return ordersList.filter(o => o.order_status === 'delivered');
      case 'cod_pending':
        return ordersList.filter(o => o.payment_method === 'COD' && o.payment_status === 'pending');
      case 'online_payments':
        return ordersList.filter(o => o.payment_method === 'Razorpay');
      default:
        return ordersList;
    }
  };

  // Sidebar Menu Definition
  const sidebarItems = [
    { section: 'DASHBOARD METRICS', items: [
      { id: 'overview', label: 'Orders Overview', icon: <ShoppingBag className="w-4 h-4" /> },
      { id: 'revenue', label: 'Revenue Analytics', icon: <TrendingUp className="w-4 h-4" /> }
    ]},
    { section: 'ACTIVE ORDERS', items: [
      { id: 'pending', label: 'Pending Orders', count: ordersList.filter(o => o.order_status === 'pending').length, icon: <Clock className="w-4 h-4" /> },
      { id: 'accepted', label: 'Accepted Orders', count: ordersList.filter(o => o.order_status === 'accepted').length, icon: <ThumbsUp className="w-4 h-4" /> },
      { id: 'preparing', label: 'Preparing Orders', count: ordersList.filter(o => o.order_status === 'preparing').length, icon: <Loader className="w-4 h-4" /> },
      { id: 'out_for_delivery', label: 'Out for Delivery', count: ordersList.filter(o => ['out_for_delivery', 'otp_pending'].includes(o.order_status)).length, icon: <Truck className="w-4 h-4" /> }
    ]},
    { section: 'ARCHIVE & PAYMENTS', items: [
      { id: 'delivered', label: 'Delivered Orders', icon: <CheckCircle2 className="w-4 h-4" /> },
      { id: 'cod_pending', label: 'COD Pending Payments', icon: <DollarSign className="w-4 h-4" />, count: ordersList.filter(o => o.payment_method === 'COD' && o.payment_status === 'pending').length },
      { id: 'online_payments', label: 'Online Payments', icon: <CreditCard className="w-4 h-4" /> }
    ]},
    { section: 'DIRECTORY & MENU', items: [
      { id: 'customers', label: 'Customer Details', icon: <Users className="w-4 h-4" /> },
      { id: 'products', label: 'Products Catalog', icon: <Plus className="w-4 h-4" /> }
    ]}
  ];

  // Secure login rendering
  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto w-full glass-card p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl mt-12 mb-12">
        <div className="flex justify-center mb-6">
          <span className="p-4 bg-orange-50 dark:bg-orange-950/40 text-citrus-orange rounded-full shadow-sm">
            <Lock className="w-8 h-8" />
          </span>
        </div>

        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
          Secure Owner Console
        </h2>
        <p className="text-xs text-slate-500 text-center mb-6">
          Authorized owner access credentials required. Enter Imran's admin credentials.
        </p>

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="relative">
            <User className="w-4.5 h-4.5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Admin Email (e.g. imran@juice.com)"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-slate-850 dark:text-slate-100"
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
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-slate-850 dark:text-slate-100"
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
            * Bypass mode: Enter email **imran@juice.com** and any password to access the panel instantly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col md:flex-row text-left font-sans transition-colors duration-300">
      
      {/* SIDEBAR NAVIGATION Panel */}
      <aside className={`w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shrink-0 md:sticky md:top-16 md:h-[calc(100vh-64px)] z-40 transition-transform ${
        sidebarOpen ? 'block' : 'hidden md:block'
      }`}>
        <div className="p-5 flex flex-col gap-6 h-full overflow-y-auto">
          {sidebarItems.map((group) => (
            <div key={group.section} className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-2">{group.section}</p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        active
                          ? 'bg-primary/10 text-primary dark:bg-primary/20'
                          : 'text-slate-600 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <span className="bg-citrus-orange text-white text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0">
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* MOBILE HEADER BAR */}
      <div className="md:hidden bg-white dark:bg-slate-900 px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center z-35">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-450"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-display font-extrabold text-sm text-slate-850 dark:text-white uppercase tracking-wider">Imran's Control Console</span>
        <button onClick={loadDashboardData} className="p-2 text-slate-500">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* MAIN CONTAINER CONTENT */}
      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-x-hidden">
        
        {/* UPPER TITLE HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-900 pb-5">
          <div>
            <span className="text-citrus-orange font-bold text-xs uppercase tracking-widest bg-orange-50 dark:bg-orange-950/40 px-3.5 py-1 rounded-full border border-orange-200/10">Console</span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 capitalize">
              {activeTab.replace(/_/g, ' ')}
            </h1>
            <p className="text-slate-450 text-xs mt-0.5">Control juices inventory catalog, verify OTP deliveries, and monitor metrics.</p>
          </div>
          <button
            onClick={loadDashboardData}
            className="hidden sm:flex btn-secondary text-xs items-center gap-1.5 py-2.5 px-4"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
          </button>
        </div>

        {/* 1. REAL-TIME NEW ORDER INCOMING POPUP ALERT */}
        {newOrderPopup && (
          <div className="bg-gradient-to-tr from-primary to-emerald-500 border border-white/20 p-5 rounded-2xl text-white shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slideDown">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide">Live Notification</span>
                <p className="font-semibold text-sm">New Order Received! 🍹</p>
              </div>
              <p className="text-xs text-white/90 leading-relaxed">
                Order **#{newOrderPopup.id.substring(0,8)}** by **{newOrderPopup.customer_name}** • Total Amount: **₹{parseFloat(newOrderPopup.total_amount).toFixed(2)}** ({newOrderPopup.payment_method})
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  handleOrderStatusUpdate(newOrderPopup.id, 'accepted');
                  setNewOrderPopup(null);
                }}
                className="flex-1 sm:flex-none bg-white text-primary font-bold text-xs px-4 py-2 rounded-xl shadow-md hover:bg-slate-50 transition-colors"
              >
                Accept Order
              </button>
              <button
                onClick={() => setNewOrderPopup(null)}
                className="p-2 bg-white/20 rounded-xl hover:bg-white/30 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* 2. TAB CONTENT DEFINITIONS */}
        
        {/* VIEW A: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Metric counters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Total Orders', value: metrics.totalOrders, icon: <ShoppingBag className="w-6 h-6 text-primary" />, bg: 'bg-emerald-50/50 dark:bg-emerald-950/20' },
                { title: 'Gross Revenue', value: `₹${metrics.totalRevenue.toFixed(2)}`, icon: <TrendingUp className="w-6 h-6 text-citrus-orange" />, bg: 'bg-orange-50/50 dark:bg-orange-950/20' },
                { title: 'Pending Deliveries', value: metrics.pendingDeliveries, icon: <Clock className="w-6 h-6 text-yellow-600" />, bg: 'bg-yellow-50/50 dark:bg-yellow-950/20' },
                { title: 'Orders Delivered', value: metrics.deliveredOrders, icon: <CheckCircle2 className="w-6 h-6 text-indigo-500" />, bg: 'bg-indigo-50/50 dark:bg-indigo-950/20' }
              ].map((card, idx) => (
                <div key={idx} className={`p-6 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center justify-between ${card.bg}`}>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.title}</p>
                    <h3 className="text-2xl font-bold text-slate-850 dark:text-white">{card.value}</h3>
                  </div>
                  <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm shrink-0">{card.icon}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-semibold text-slate-800 dark:text-white text-base">Weekly Revenue Analysis</h3>
                <div className="h-72 w-full text-xs">
                  {salesChart && salesChart.length > 0 ? (
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
                  ) : (
                    <div className="h-full flex justify-center items-center text-slate-400">No chart data compiled yet.</div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-semibold text-slate-800 dark:text-white text-base">Popular Juice Categories</h3>
                <div className="h-60 w-full flex justify-center items-center">
                  {categoryChart && categoryChart.length > 0 ? (
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
                  ) : (
                    <div className="h-full flex justify-center items-center text-slate-400">No category statistics.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW B: REVENUE ANALYTICS */}
        {activeTab === 'revenue' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Daily Gross Earnings Curve</h3>
              <div className="h-96 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={3} fill="#f97316" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* VIEW C: ORDER LISTS (Pending, Accepted, Preparing, Out for Delivery, Delivered, COD Pending, Online Payments) */}
        {['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cod_pending', 'online_payments'].includes(activeTab) && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Orders Listing ({getFilteredOrders().length})</h3>
            </div>

            {getFilteredOrders().length === 0 ? (
              <div className="p-12 border border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl text-center text-slate-400 text-xs">
                No orders match this filter criteria at the moment.
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* DESKTOP TABLE VIEW */}
                <div className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-550 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Customer Info</th>
                        <th className="p-4">Address & Map</th>
                        <th className="p-4">Payment</th>
                        <th className="p-4">Workflow Progress</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {getFilteredOrders().map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20">
                          <td className="p-4 font-mono font-bold text-slate-850 dark:text-slate-200">
                            #{order.id.substring(0, 8)}
                            <span className="block font-sans text-[9px] font-normal text-slate-450 mt-0.5">{new Date(order.created_at).toLocaleString()}</span>
                          </td>
                          <td className="p-4 space-y-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{order.customer_name}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{order.customer_mobile}</p>
                          </td>
                          <td className="p-4 space-y-1 max-w-[220px]">
                            <p className="text-xs text-slate-700 dark:text-slate-350 truncate" title={order.delivery_address}>{order.delivery_address}</p>
                            {order.latitude && order.longitude && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-bold"
                              >
                                Google Maps Pin
                              </a>
                            )}
                          </td>
                          <td className="p-4 space-y-1">
                            <p className="font-bold text-slate-850 dark:text-white">₹{parseFloat(order.total_amount).toFixed(2)}</p>
                            <div className="flex gap-1.5 items-center">
                              <span className="text-[9px] text-slate-450 uppercase font-semibold">{order.payment_method}</span>
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30'
                              }`}>
                                {order.payment_status}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              order.order_status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-950/30' :
                              order.order_status === 'pending' ? 'bg-slate-100 text-slate-650 dark:bg-slate-800' :
                              order.order_status === 'otp_pending' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/30' :
                              order.order_status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-950/30'
                            }`}>
                              {order.order_status.replace(/_/g, ' ')}
                            </span>
                            {order.order_status === 'otp_pending' && order.otp_code && (
                              <span className="block text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-1">OTP: {order.otp_code}</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              {order.order_status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleOrderStatusUpdate(order.id, 'accepted')}
                                    className="px-2.5 py-1.5 bg-primary text-white font-bold text-[10px] rounded-lg shadow-sm hover:bg-green-600 transition-all"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleOrderStatusUpdate(order.id, 'rejected')}
                                    className="px-2.5 py-1.5 bg-rose-500 text-white font-bold text-[10px] rounded-lg shadow-sm hover:bg-rose-600 transition-all"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {order.order_status === 'accepted' && (
                                <button
                                  onClick={() => handleOrderStatusUpdate(order.id, 'preparing')}
                                  className="px-2.5 py-1.5 bg-indigo-500 text-white font-bold text-[10px] rounded-lg shadow-sm hover:bg-indigo-600 transition-all"
                                >
                                  Start Preparing
                                </button>
                              )}

                              {order.order_status === 'preparing' && (
                                <button
                                  onClick={() => handleOrderStatusUpdate(order.id, 'out_for_delivery')}
                                  className="px-2.5 py-1.5 bg-orange-500 text-white font-bold text-[10px] rounded-lg shadow-sm hover:bg-orange-600 transition-all"
                                >
                                  Out for Delivery
                                </button>
                              )}

                              {order.order_status === 'out_for_delivery' && (
                                <button
                                  onClick={() => handleSendOtp(order.id)}
                                  className="px-2.5 py-1.5 bg-purple-600 text-white font-bold text-[10px] rounded-lg shadow-sm hover:bg-purple-700 transition-all"
                                >
                                  Send OTP
                                </button>
                              )}

                              {order.order_status === 'otp_pending' && (
                                <button
                                  onClick={() => {
                                    setEnteredOtp('');
                                    setOtpModalOrder(order);
                                  }}
                                  className="px-2.5 py-1.5 bg-amber-550 text-white font-bold text-[10px] rounded-lg shadow-sm hover:bg-amber-600 transition-all"
                                >
                                  Complete (Enter OTP)
                                </button>
                              )}

                              {order.order_status === 'delivered' && (
                                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Delivered Successful</span>
                              )}

                              {order.order_status === 'rejected' && (
                                <span className="text-[10px] text-rose-500 font-semibold block uppercase">Rejected Order</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARD VIEW LIST */}
                <div className="lg:hidden space-y-4">
                  {getFilteredOrders().map((order) => (
                    <div 
                      key={order.id} 
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-3.5 shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono font-bold text-slate-850 dark:text-slate-200">#{order.id.substring(0, 8)}</p>
                          <p className="text-[9px] text-slate-450 mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          order.payment_status === 'paid' ? 'bg-emerald-150 text-emerald-700' : 'bg-amber-150 text-amber-700'
                        }`}>
                          {order.payment_status}
                        </span>
                      </div>

                      <div className="text-xs space-y-1.5 border-t border-slate-50 dark:border-slate-800 pt-2.5">
                        <p className="text-slate-800 dark:text-slate-150"><strong className="text-slate-500">Customer:</strong> {order.customer_name} ({order.customer_mobile})</p>
                        <p className="text-slate-805 dark:text-slate-250 truncate"><strong className="text-slate-500">Address:</strong> {order.delivery_address}</p>
                        {order.latitude && order.longitude && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-[10px] text-primary font-bold hover:underline"
                          >
                            Open Google Maps Direction Link
                          </a>
                        )}
                        <p className="text-slate-850 dark:text-white font-bold"><strong className="text-slate-500 font-normal">Total Amount:</strong> ₹{parseFloat(order.total_amount).toFixed(2)} ({order.payment_method})</p>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-800 pt-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          order.order_status === 'delivered' ? 'bg-green-100 text-green-700' :
                          order.order_status === 'otp_pending' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {order.order_status}
                        </span>

                        <div className="flex gap-2">
                          {order.order_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleOrderStatusUpdate(order.id, 'accepted')}
                                className="bg-primary text-white font-bold text-[10px] px-3 py-1.5 rounded-lg"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleOrderStatusUpdate(order.id, 'rejected')}
                                className="bg-rose-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {order.order_status === 'accepted' && (
                            <button
                              onClick={() => handleOrderStatusUpdate(order.id, 'preparing')}
                              className="bg-indigo-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg"
                            >
                              Prepare
                            </button>
                          )}
                          {order.order_status === 'preparing' && (
                            <button
                              onClick={() => handleOrderStatusUpdate(order.id, 'out_for_delivery')}
                              className="bg-orange-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg"
                            >
                              Dispatch
                            </button>
                          )}
                          {order.order_status === 'out_for_delivery' && (
                            <button
                              onClick={() => handleSendOtp(order.id)}
                              className="bg-purple-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg"
                            >
                              Send OTP
                            </button>
                          )}
                          {order.order_status === 'otp_pending' && (
                            <button
                              onClick={() => {
                                setEnteredOtp('');
                                setOtpModalOrder(order);
                              }}
                              className="bg-amber-550 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg"
                            >
                              Enter OTP
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>
        )}

        {/* VIEW D: CUSTOMER DETAILS DIRECTORY */}
        {activeTab === 'customers' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="font-semibold text-slate-800 dark:text-white text-base">Customers Directory</h3>
            
            {getUniqueCustomers().length === 0 ? (
              <div className="p-12 border border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl text-center text-slate-400 text-xs">
                No customer directory entries logged yet.
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-550 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                        <th className="p-4">Customer Name</th>
                        <th className="p-4">Mobile Phone</th>
                        <th className="p-4">Default Landmark Address</th>
                        <th className="p-4">Last Order Time</th>
                        <th className="p-4 text-right">Cumulative Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {getUniqueCustomers().map((cust, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20">
                          <td className="p-4 font-semibold text-slate-800 dark:text-slate-150">{cust.name}</td>
                          <td className="p-4 font-mono font-medium text-slate-600 dark:text-slate-350">{cust.mobile}</td>
                          <td className="p-4 text-slate-500 max-w-[250px] truncate" title={cust.address}>{cust.address}</td>
                          <td className="p-4 text-slate-500">{new Date(cust.lastOrder).toLocaleDateString()}</td>
                          <td className="p-4 text-right font-bold text-slate-850 dark:text-white">₹{cust.totalSpent.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW E: PRODUCT CATALOG */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white text-base">Seeded Products Catalog</h3>
              <button
                onClick={openAddProductModal}
                className="btn-primary py-2 px-4 text-xs font-bold rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-550 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                      <th className="p-4">Image</th>
                      <th className="p-4">Juice Detail</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {productsList.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                        <td className="p-4">
                          <img
                            src={product.image_url || 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=100'}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-100 border dark:border-slate-800"
                          />
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-slate-850 dark:text-slate-100">{product.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal line-clamp-1 max-w-[220px]">{product.description}</p>
                        </td>
                        <td className="p-4 font-medium text-slate-500">{product.category}</td>
                        <td className="p-4 font-bold text-slate-850 dark:text-white">₹{parseFloat(product.price).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            product.is_available ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {product.is_available ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openEditProductModal(product)}
                              className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-850 rounded"
                            >
                              <Edit3 className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
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

      </main>

      {/* 3. OPTIONAL OTP VERIFICATION INPUT DIALOG MODAL */}
      {otpModalOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOtpModalOrder(null)} />
          
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 z-10 shadow-2xl space-y-5 text-center">
            <div className="flex justify-center">
              <span className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-full">
                <Smartphone className="w-8 h-8" />
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Delivery OTP Verification</h3>
              <p className="text-xs text-slate-500">Enter the 4-digit code provided by customer **{otpModalOrder.customer_name}**</p>
            </div>

            {/* Developer/Testing Helper note */}
            {otpModalOrder.otp_code && (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl text-[10px] text-slate-450 leading-normal text-left">
                <span className="font-bold text-amber-600 block uppercase tracking-wider mb-0.5">Mock SMS Gateway Tracker</span>
                The OTP code dispatched to mobile **{otpModalOrder.customer_mobile}** is **{otpModalOrder.otp_code}**. Use this code for verification.
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                maxLength="4"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="4-Digit Code"
                className="w-full text-center tracking-widest text-lg font-mono font-extrabold py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary text-slate-850 dark:text-slate-100"
                required
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOtpModalOrder(null)}
                  className="flex-1 btn-secondary text-xs py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingOtp}
                  className="flex-1 btn-primary text-xs py-2.5 rounded-xl"
                >
                  {verifyingOtp ? 'Verifying...' : 'Verify & Deliver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. SEED PRODUCTS POPUP MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setProductModalOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 z-10 shadow-2xl flex flex-col gap-5 text-left">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                {editingProduct ? 'Edit Juice Catalog Item' : 'Add New Juice Catalog Item'}
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-slate-850 dark:text-slate-100"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-slate-850 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ingredients, fresh pulps details..."
                  rows="2.5"
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-slate-850 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-950 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-slate-850 dark:text-slate-100 font-semibold"
                  >
                    <option value="Juices">Juices</option>
                    <option value="Cool Drinks">Cool Drinks</option>
                    <option value="Water Bottles">Water Bottles</option>
                    <option value="Ice Creams">Ice Creams</option>
                    <option value="Cigarettes">Cigarettes</option>
                  </select>
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2.5 pl-1.5">
                    <input
                      type="checkbox"
                      checked={formAvailable}
                      onChange={(e) => setFormAvailable(e.target.checked)}
                      className="rounded border-slate-350 text-primary focus:ring-primary w-4.5 h-4.5"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Juice Available</span>
                  </label>
                </div>
              </div>

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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-55 dark:bg-slate-950 text-[10px] text-slate-650 dark:text-slate-350 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

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
