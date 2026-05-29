import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { 
  ShoppingBag, 
  Clock, 
  ThumbsUp, 
  Smartphone, 
  CheckCircle2, 
  CreditCard, 
  ArrowLeft,
  Loader,
  Lock,
  Check,
  ChevronDown,
  ChevronUp,
  XCircle
} from 'lucide-react';

export default function MyOrders() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [simOtpInputs, setSimOtpInputs] = useState({});
  const [retryingOrderId, setRetryingOrderId] = useState(null);

  // Sync / Fetch Orders
  const fetchMyOrders = async () => {
    try {
      setLoadingOrders(true);
      let url = '/orders/my';
      
      if (!user) {
        const savedIds = localStorage.getItem('bisfruitjuice_guest_orders');
        const guestOrderIds = savedIds ? JSON.parse(savedIds) : [];
        if (guestOrderIds.length === 0) {
          setMyOrders([]);
          setLoadingOrders(false);
          return;
        }
        url = `/orders/my?ids=${guestOrderIds.join(',')}`;
      }

      const res = await api.get(url);
      setMyOrders(res.data || []);
    } catch (err) {
      console.warn('Could not load orders history:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchMyOrders();
    }
  }, [user, loading]);

  // Real-time WebSocket Order Updates Syncing
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultHost = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
    const apiHost = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace(/^http(s)?:\/\//, '').split('/')[0]
      : defaultHost;
      
    const socketUrl = `${protocol}//${apiHost}`;
    console.log('🔌 MyOrders Page subscribing to WebSocket:', socketUrl);
    
    let ws;
    let reconnectTimeout;

    const connect = () => {
      ws = new WebSocket(socketUrl);

      ws.onopen = () => {
        console.log('🔌 WebSocket Connected successfully on MyOrders Page!');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'ORDER_UPDATED') {
            const updated = data.order;
            
            setMyOrders((prev) => {
              const exists = prev.some(o => o.id === updated.id);
              if (exists) {
                showToast(`Order #${updated.order_code || updated.id.substring(0, 8)} status updated to: ${updated.order_status.replace(/_/g, ' ').toUpperCase()}`, 'info');
                return prev.map(o => o.id === updated.id ? updated : o);
              }
              return prev;
            });
          }
          
          if (data.type === 'NEW_ORDER') {
            const isMyOrder = user ? (data.order.user_id === user.id) : true;
            if (isMyOrder) {
              setMyOrders((prev) => {
                const exists = prev.some(o => o.id === data.order.id);
                if (exists) return prev;
                return [data.order, ...prev];
              });
            }
          }
        } catch (err) {
          console.error('Error handling WS message:', err);
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
  }, [user]);

  // Status Mappings
  const getOrderStatusStep = (status) => {
    const steps = ['pending', 'accepted', 'otp_pending', 'delivered'];
    return steps.indexOf(status);
  };

  const handleUpdateSimulatedStatus = (orderId, newStatus) => {
    setMyOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      let updated = { ...o, order_status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === 'otp_pending') {
        updated.otp_code = '7777';
        showToast('Mock SMS: Verification OTP code is 7777', 'success');
      }
      if (newStatus === 'delivered') {
        updated.otp_verified = true;
        updated.payment_status = 'paid';
        updated.delivered_at = new Date().toISOString();
      }
      return updated;
    }));

    showToast(`Simulated status updated to: ${newStatus.toUpperCase()}`, 'info');
  };

  const handleVerifySimulatedOtp = (orderId) => {
    const codeEntered = simOtpInputs[orderId] || '';
    const targetOrder = myOrders.find(o => o.id === orderId);
    
    if (!targetOrder) {
      showToast('Order not found.', 'error');
      return;
    }
    
    if (codeEntered === targetOrder.otp_code || codeEntered === '7777') {
      showToast('OTP verified successfully! Order delivered. 🥳', 'success');
      
      setMyOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          order_status: 'delivered',
          payment_status: 'paid',
          otp_verified: true,
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }));
    } else {
      showToast('Invalid simulated OTP. Enter 7777 or click driver button.', 'error');
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRetryPayment = async (order) => {
    setRetryingOrderId(order.id);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast('Failed to load Razorpay scripts. Check connection.', 'error');
        setRetryingOrderId(null);
        return;
      }

      const rzpRes = await api.post('/payments/order', { orderId: order.id });
      const rzpData = rzpRes.data;

      const options = {
        key: rzpData.key,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'Bismilla Fruit Juice',
        description: `Payment Retry for Order #${order.order_code || order.id.substring(0, 8)}`,
        order_id: rzpData.id,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payments/verify', {
              orderId: order.id,
              razorpay_order_id: response.razorpay_order_id || rzpData.id,
              razorpay_payment_id: response.razorpay_payment_id || `pay_mock_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || 'mock_sig',
              isMock: rzpData.isMock
            });

            if (verifyRes.data.status === 'success') {
              showToast('Payment verified successfully! 🎉', 'success');
              fetchMyOrders();
            } else {
              showToast('Verification failed.', 'error');
            }
          } catch (err) {
            console.error('Error verifying payment retry:', err);
            showToast('Verification failed.', 'error');
          }
        },
        prefill: {
          name: order.customer_name,
          contact: order.customer_mobile
        },
        theme: {
          color: '#22c55e'
        },
        modal: {
          ondismiss: async () => {
            showToast('Payment retry dismissed.', 'warning');
            try {
              await api.post('/payments/cancelled', { orderId: order.id });
              fetchMyOrders();
            } catch (err) {
              console.error('Error recording cancellation:', err);
            }
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', async (response) => {
        showToast('Payment failed. Try again.', 'error');
        try {
          await api.post('/payments/failed', {
            orderId: order.id,
            failureReason: response.error?.description || 'Failed',
            razorpay_payment_id: response.error?.metadata?.payment_id,
            razorpay_order_id: response.error?.metadata?.order_id
          });
          fetchMyOrders();
        } catch (err) {
          console.error(err);
        }
      });

      rzpInstance.open();
    } catch (err) {
      console.error(err);
      showToast('Could not reload payment checkout portal.', 'error');
    } finally {
      setRetryingOrderId(null);
    }
  };

  const getPaymentStatusBadge = (order) => {
    const isPaid = order.payment_status === 'paid' || order.payment_status === 'PAYMENT COMPLETED';
    const isFailed = ['failed', 'FAILED', 'CANCELLED'].includes(order.payment_status);

    if (isPaid) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 border border-emerald-500/20">
          Paid Successfully
        </span>
      );
    }
    if (isFailed) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-450 border border-rose-500/20">
          {order.payment_status}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-450 border border-amber-500/20">
        Payment Pending
      </span>
    );
  };

  const getWhatsAppShareLink = (order) => {
    const itemsList = order.order_items?.map(item => `- ${item.products?.name} x ${item.quantity}`).join('%0A') || '';
    const text = `Hello Imran, Bismilla Fruit Juice!%0APlease check my Order status:%0A%0A*Order Code:* ${order.order_code || order.id.substring(0, 8)}%0A*Name:* ${order.customer_name}%0A*Mobile:* ${order.customer_mobile}%0A*Address:* ${order.delivery_address}%0A%0A*Items:*%0A${itemsList}%0A%0A*Total Amount:* ₹${order.total_amount}%0A*Payment Method:* ${order.payment_method}%0A*Status:* ${order.order_status}`;
    return `https://wa.me/917989646180?text=${text}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-8 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="space-y-1 text-left">
          <button 
            onClick={() => navigate('/products')}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Menu
          </button>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white pt-1">
            My Juice Orders
          </h2>
          <p className="text-xs text-slate-500">
            View details, payment statuses, and track active delivery workflows in real-time.
          </p>
        </div>

        <button 
          onClick={fetchMyOrders}
          className="btn-secondary py-1.5 px-4 text-xs font-bold shrink-0 self-end sm:self-center"
        >
          Refresh Feed
        </button>
      </div>

      {/* Orders Directory Listing */}
      {loadingOrders ? (
        <div className="flex flex-col justify-center items-center py-20 gap-3">
          <Loader className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Syncing database order timeline records...</p>
        </div>
      ) : myOrders.length === 0 ? (
        <div className="glass-card p-12 text-center border border-slate-100 dark:border-slate-800 shadow-md space-y-4">
          <div className="flex justify-center">
            <span className="p-4 bg-orange-50 dark:bg-orange-950/40 text-citrus-orange rounded-full">
              <ShoppingBag className="w-8 h-8" />
            </span>
          </div>
          <h3 className="font-bold text-lg text-slate-850 dark:text-white">No Orders Placed Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't ordered any premium Bismilla fresh fruit juices yet. Add some juices to your cart and place an order!
          </p>
          <button 
            onClick={() => navigate('/products')}
            className="btn-primary py-2 px-6 text-xs font-bold"
          >
            View Fresh Menu
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {myOrders.map((order) => {
            const currentStep = getOrderStatusStep(order.order_status);
            const isExpanded = expandedOrder === order.id;

            return (
              <div 
                key={order.id} 
                className={`glass-card p-6 rounded-3xl shadow-sm text-left hover:shadow-md transition-shadow flex flex-col gap-6 border ${
                  order.order_status === 'rejected'
                    ? 'border-rose-300/60 dark:border-rose-800/50 bg-rose-50/30 dark:bg-rose-950/10'
                    : 'border-slate-100 dark:border-slate-850'
                }`}
              >
                {/* Main Order Card Header */}
                <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b ${
                  order.order_status === 'rejected'
                    ? 'border-rose-200 dark:border-rose-900/40'
                    : 'border-slate-100 dark:border-slate-850'
                }`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-base font-extrabold text-slate-850 dark:text-slate-100 tracking-wider">
                        Order {order.order_code || `BFJ-2026-${order.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 4)}`}
                      </span>
                      {order.order_status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full uppercase tracking-wider border border-rose-200/30">
                          <XCircle className="w-2.5 h-2.5" /> Rejected Order
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-primary bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          <span className="w-1 h-1 bg-primary rounded-full animate-ping" /> Realtime
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-450 uppercase font-semibold">
                      Placed on {new Date(order.created_at).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'medium' })}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-extrabold text-slate-850 dark:text-slate-100 text-lg">
                        ₹{parseFloat(order.total_amount).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2">
                        {getPaymentStatusBadge(order)}
                        {order.payment_method === 'Razorpay' && 
                          ['FAILED', 'CANCELLED', 'failed'].includes(order.payment_status) && (
                          <button
                            onClick={() => handleRetryPayment(order)}
                            disabled={retryingOrderId === order.id}
                            className="bg-primary hover:bg-green-600 text-white text-[9px] font-extrabold px-3 py-1 rounded-full transition-all shadow-sm flex items-center gap-1 animate-pulse disabled:opacity-50"
                          >
                            <CreditCard className="w-2.5 h-2.5" /> 
                            {retryingOrderId === order.id ? 'Loading...' : 'Retry Pay'}
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Tracking Progress Timeline */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delivery Progress Timeline</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { key: 'pending', label: 'Order Placed', desc: 'Received by Bismilla shop' },
                      { key: 'accepted', label: 'Accepted by Shop', desc: 'Confirmed by Imran' },
                      { key: 'otp_pending', label: 'OTP Verification', desc: 'Tell OTP to partner' },
                      { key: 'delivered', label: 'Delivered', desc: 'Enjoy your fresh juice!' }
                    ].map((step, idx) => {
                      const isCompleted = idx < currentStep;
                      const isActive = idx === currentStep;
                      const isRejected = order.order_status === 'rejected';

                      return (
                        <div key={step.key} className="flex gap-3 text-xs relative text-left">
                          <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 shrink-0 z-10 transition-colors ${
                            isRejected && idx > 0
                              ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-300'
                              : isCompleted
                              ? 'border-primary bg-primary text-white'
                              : isActive
                              ? 'border-primary bg-white dark:bg-slate-900 text-primary'
                              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-300'
                          }`}>
                            {isCompleted ? (
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            ) : (
                              <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary animate-pulse' : 'bg-transparent'}`} />
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <p className={`font-bold leading-none ${
                              isRejected && idx > 0
                                ? 'text-slate-400 line-through'
                                : isActive
                                ? 'text-primary'
                                : isCompleted
                                ? 'text-slate-800 dark:text-slate-200'
                                : 'text-slate-400 dark:text-slate-550'
                            }`}>
                              {step.label}{isRejected && idx === 1 && <span className="ml-1 text-rose-600 font-bold not-italic no-underline">(REJECTED)</span>}
                            </p>
                            <p className="text-[10px] text-slate-450">{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rejected Order Alert Banner */}
                {order.order_status === 'rejected' && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-300/40 p-5 rounded-2xl flex flex-col gap-3 animate-fadeIn">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-xl shrink-0">
                        <XCircle className="w-6 h-6" />
                      </span>
                      <div>
                        <h4 className="font-bold text-rose-700 dark:text-rose-400 text-sm">Order Rejected!</h4>
                        <p className="text-[10px] text-rose-600 dark:text-rose-500 font-semibold uppercase tracking-wider">This order was not accepted by the shop</p>
                      </div>
                    </div>
                    <p className="text-xs text-rose-700 dark:text-rose-350 leading-relaxed">
                      Unfortunately, Imran at Bismilla Fruit Juice was unable to confirm or fulfill this order at this time.
                      If you paid online via Razorpay or UPI, your full amount will be <strong>refunded within 2–3 business days</strong> to your original payment source.
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      You can place a new order from our fresh menu, or reach us on WhatsApp for support.
                    </p>
                    <a
                      href={`https://wa.me/917989646180?text=Hello%20Imran!%20My%20Order%20${order.order_code || order.id.substring(0, 8)}%20was%20rejected.%20Please%20help!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="self-start bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] px-4 py-2 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <XCircle className="w-3 h-3" /> Contact Support on WhatsApp
                    </a>
                  </div>
                )}

                {/* OTP Verification details box */}
                {order.order_status === 'otp_pending' && order.otp_code && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/25 p-4.5 rounded-2xl flex flex-col gap-2.5 text-xs text-left animate-fadeIn">
                    <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                      <Lock className="w-4.5 h-4.5 shrink-0 text-amber-500" />
                      <span className="text-sm">Verify Delivery via OTP</span>
                    </div>
                    <p className="text-slate-550 dark:text-slate-400 leading-normal text-[11px]">
                      Please share the 4-digit code below with the Bismilla delivery partner when they arrive at your location to successfully verify & complete this transaction.
                    </p>
                    <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 border border-amber-200/40 p-3 rounded-xl w-fit shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Delivery OTP:</span>
                      <span className="font-mono text-lg font-extrabold text-amber-600 dark:text-amber-400 tracking-widest">{order.otp_code}</span>
                    </div>

                    {order.id.startsWith('ord_sim_') && (
                      <div className="mt-2 pt-3 border-t border-amber-200/20 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-amber-850 dark:text-amber-300 uppercase">Self-Verify Mock Delivery:</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength="4"
                            placeholder="Enter OTP"
                            value={simOtpInputs[order.id] || ''}
                            onChange={(e) => setSimOtpInputs({ ...simOtpInputs, [order.id]: e.target.value.replace(/\D/g, '') })}
                            className="w-32 px-3 py-1.5 rounded-lg border border-amber-200 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary text-slate-850 dark:text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleVerifySimulatedOtp(order.id)}
                            className="bg-primary hover:bg-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors"
                          >
                            Verify OTP
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Mock Workflow Controller (For simulated orders only) */}
                {order.id.startsWith('ord_sim_') && !['delivered', 'rejected'].includes(order.order_status) && (
                  <div className="bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/20 p-5 rounded-2xl text-left space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
                      <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 text-xs uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        Mock Timeline Controller (Manual Mode)
                      </div>
                      <span className="text-[9px] font-extrabold text-amber-600 bg-amber-100 dark:bg-amber-950/30 px-2 py-0.5 rounded-full uppercase">Offline Simulator</span>
                    </div>
                    <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-normal">
                      Because this order is simulated offline, you can manually trigger shop actions below to test how the timeline, notifications, and OTP widgets change!
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {order.order_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateSimulatedStatus(order.id, 'accepted')}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-lg transition-all shadow-sm"
                          >
                            Simulate Shop Accept
                          </button>
                          <button
                            onClick={() => handleUpdateSimulatedStatus(order.id, 'rejected')}
                            className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] rounded-lg transition-all shadow-sm"
                          >
                            Simulate Shop Reject
                          </button>
                        </>
                      )}
                      {order.order_status === 'accepted' && (
                        <button
                          onClick={() => handleUpdateSimulatedStatus(order.id, 'otp_pending')}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] rounded-lg transition-all shadow-sm"
                        >
                          Simulate Driver Send OTP
                        </button>
                      )}
                      {order.order_status === 'otp_pending' && (
                        <span className="text-[10px] font-semibold text-slate-400">Use the OTP input box above to verify code & complete delivery!</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-850 text-xs animate-fadeIn">
                    {/* Left: Ordered Juices List */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ordered Juices</span>
                      </div>

                      <div className="space-y-2">
                        {order.order_items?.map((item) => (
                          <div 
                            key={item.id} 
                            className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/10 p-2.5 rounded-xl text-slate-750 dark:text-slate-350"
                          >
                            <div className="space-y-0.5">
                              <p className="font-semibold">{item.products?.name || 'Premium Drink'}</p>
                              <p className="text-[9px] text-slate-450 uppercase font-bold tracking-wider">{item.products?.category || 'Juices'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-850 dark:text-slate-150">₹{(parseFloat(item.price_at_order) * item.quantity).toFixed(2)}</p>
                              <p className="text-[10px] text-slate-450 font-medium">₹{parseFloat(item.price_at_order).toFixed(2)} x {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Logistics details */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-citrus-orange" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delivery Details</span>
                        </div>
                        <div className="space-y-1.5 pl-2 leading-relaxed">
                          <p className="text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">Recipient Address</span>
                            {order.delivery_address}
                          </p>
                          <p className="text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">Recipient Details</span>
                            {order.customer_name} ({order.customer_mobile})
                          </p>
                          <p className="text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">Payment Method</span>
                            {order.payment_method}
                          </p>
                          {order.delivery_eta && (
                            <p className="text-slate-700 dark:text-slate-300">
                              <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">Delivery Time Limit</span>
                              {order.delivery_eta} (Approx)
                            </p>
                          )}
                        </div>
                      </div>

                      {/* WhatsApp Help / Share buttons */}
                      <div className="flex gap-2 pt-2">
                        <a
                          href={getWhatsAppShareLink(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] py-2 rounded-xl text-center shadow-sm block transition-colors"
                        >
                          Query Status on WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
