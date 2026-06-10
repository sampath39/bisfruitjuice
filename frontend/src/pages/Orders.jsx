import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { 
  MapPin, 
  Phone, 
  ShoppingBag, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  ArrowRight,
  User,
  Mail,
  Lock,
  Loader,
  Share2,
  Check,
  ClipboardList,
  LogOut,
  X,
  Truck,
  ThumbsUp,
  Smartphone
} from 'lucide-react';
import api from '../utils/api.js';
import { calculateDistance, SHOP_LOCATION, reverseGeocode } from '../utils/location.js';

export default function Orders() {
  const { user, signIn, signUp, signOut, loading: authLoading } = useAuth();
  const { cartItems, cartTotal, clearCart, addToCart } = useCart();
  const { showToast } = useToast();
  const location = useLocation();

  // Auto-open auth modal when navigated with openAuth state (from Navbar Sign In button)
  useEffect(() => {
    if (location.state?.openAuth && !user) {
      setIsSignUp(false);
      setFormError('');
      setAuthModalOpen(true);
      // Clear the state so it doesn't re-trigger on re-renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state, user]);

  // Auth modal states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [submittingAuth, setSubmittingAuth] = useState(false);

  // Checkout states
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [deliveryValidation, setDeliveryValidation] = useState(null); // { distanceKm, isEligible }
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' or 'Razorpay'
  const [placingOrder, setPlacingOrder] = useState(false);
  
  // Order Confirmation State
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  
  // Orders history & tracking
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Coupon / Discount states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [activePageTab, setActivePageTab] = useState(cartItems?.length > 0 ? 'checkout' : 'tracking');

  const finalTotal = parseFloat(Math.max(0, cartTotal - discountAmount).toFixed(2));

  const handleApplyCoupon = (codeToApply) => {
    setCouponError('');
    setCouponSuccess('');
    
    const formattedCode = (codeToApply || couponCode).trim().toUpperCase();
    if (!formattedCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    
    if (formattedCode === 'FIRST20') {
      const discount = parseFloat((cartTotal * 0.2).toFixed(2));
      setDiscountAmount(discount);
      setAppliedCoupon('FIRST20');
      setCouponSuccess('Success! 20% discount applied to your order.');
      showToast('Coupon "FIRST20" applied! Save 20%.', 'success');
    } else {
      setCouponError('Invalid coupon code. Try FIRST20.');
      setDiscountAmount(0);
      setAppliedCoupon('');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
    setDiscountAmount(0);
    setCouponCode('');
    setCouponSuccess('');
    setCouponError('');
    showToast('Coupon removed.', 'info');
  };

  // Sync details on user sign in
  useEffect(() => {
    if (user) {
      setCustomerPhone(user.phone || '');
      setCustomerName(user.full_name || '');
      fetchMyOrders();
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      // In guest mode, still try to load in-memory orders placed in current session
      fetchMyOrders();
    }
  }, [user]);

  // Real-time WebSocket Order Updates Syncing
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultHost = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
    const apiHost = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace(/^http(s)?:\/\//, '').split('/')[0]
      : defaultHost;
      
    const socketUrl = `${protocol}//${apiHost}`;
    console.log('🔌 Connecting to WebSocket:', socketUrl);
    
    let ws;
    let reconnectTimeout;

    const getGuestOrderIds = () => {
      const savedIds = localStorage.getItem('bisfruitjuice_guest_orders');
      return savedIds ? JSON.parse(savedIds) : [];
    };

    const connect = () => {
      ws = new WebSocket(socketUrl);

      ws.onopen = () => {
        console.log('🔌 WebSocket Connected successfully!');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'ORDER_UPDATED') {
            const updated = data.order;
            
            // Verify ownership
            let isMyOrder = false;
            if (user) {
              isMyOrder = updated.user_id === user.id;
            } else {
              const guestOrderIds = getGuestOrderIds();
              isMyOrder = guestOrderIds.includes(updated.id);
            }

            if (isMyOrder) {
              setMyOrders((prev) => {
                const prevOrder = prev.find(o => o.id === updated.id);
                const exists = !!prevOrder;
                
                if (exists) {
                  // status-specific descriptive toasts
                  let statusMsg = `Order #${updated.id.substring(0, 8)} status is now ${updated.order_status.replace(/_/g, ' ').toUpperCase()}`;
                  if (updated.order_status === 'accepted') {
                    statusMsg = `Order #${updated.id.substring(0, 8)} accepted by Imran! 🍊`;
                  } else if (updated.order_status === 'otp_pending') {
                    statusMsg = `Delivery partner arrived! Please verify via OTP. 🔑`;
                  } else if (updated.order_status === 'delivered') {
                    statusMsg = `Order delivered! Enjoy your fresh fruit juice. 🎉`;
                  } else if (updated.order_status === 'rejected') {
                    statusMsg = `Order #${updated.id.substring(0, 8)} was rejected.`;
                  }

                  showToast(statusMsg, updated.order_status === 'rejected' ? 'error' : updated.order_status === 'delivered' ? 'success' : 'info');

                  if (updated.order_status === 'delivered' && prevOrder.order_status !== 'delivered') {
                    setActivePageTab('history');
                  }
                  
                  return prev.map(o => o.id === updated.id ? updated : o);
                }
                return [updated, ...prev];
              });

              // Also check if matches currently open tracking modal/confirmation
              setConfirmedOrder((prev) => {
                if (prev && prev.id === updated.id) {
                  return updated;
                }
                return prev;
              });
            }
          }
          
          if (data.type === 'NEW_ORDER') {
            const newOrder = data.order;
            let isMyOrder = false;
            if (user) {
              isMyOrder = newOrder.user_id === user.id;
            } else {
              const guestOrderIds = getGuestOrderIds();
              isMyOrder = guestOrderIds.includes(newOrder.id);
            }

            if (isMyOrder) {
              setMyOrders((prev) => {
                const exists = prev.some(o => o.id === newOrder.id);
                if (exists) return prev;
                return [newOrder, ...prev];
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

      ws.onerror = (err) => {
        ws.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [user]);

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
      setMyOrders(res.data);
    } catch (err) {
      console.warn('Could not load orders history:', err);
    } finally {
      setLoadingOrders(false);
    }
  };


  // Auth Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmittingAuth(true);

    try {
      if (isSignUp) {
        if (!authName || !authPhone) {
          setFormError('Please fill in Name and Phone Number');
          setSubmittingAuth(false);
          return;
        }
        const result = await signUp(authEmail, authPassword, authName, authPhone);
        if (result.error) {
          setFormError(result.error.message || 'Registration failed');
        } else if (result.requiresEmailConfirmation) {
          // Show confirmation message in the modal — keep modal open so user reads it
          setFormError(result.message || '✅ Check your email for a confirmation link before signing in.');
        } else {
          showToast('Account created! You are now signed in.', 'success');
          setAuthModalOpen(false);
        }
      } else {
        const { data, error } = await signIn(authEmail, authPassword);
        if (error) {
          setFormError(error.message || 'Login failed. Please check your email and password.');
        } else {
          showToast('Logged in successfully! 🎉', 'success');
          setAuthModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Auth submit error:', err);
      setFormError('Something went wrong. Please try again.');
    } finally {
      setSubmittingAuth(false);
    }
  };

  // Geolocation Handler
  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'warning');
      return;
    }

    setCheckingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoordinates({ lat, lng });

        let address = `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        try {
          if (window.google) {
            const resolved = await reverseGeocode(lat, lng, window.google);
            if (resolved) address = resolved;
          }
        } catch (err) {
          console.warn('Reverse geocoding address failed, using coordinates as label');
        }

        setDeliveryAddress(address);

        try {
          const res = await api.post('/orders/verify-distance', { latitude: lat, longitude: lng });
          setDeliveryValidation({
            distanceKm: res.data.distanceKm,
            isEligible: res.data.isEligible
          });
          if (res.data.isEligible) {
            showToast('Awesome! You are inside our delivery area.', 'success');
          } else {
            showToast('Sorry! We only deliver within 10KM radius.', 'error');
          }
        } catch (err) {
          const dist = calculateDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, lat, lng);
          const eligible = dist <= 10.0;
          setDeliveryValidation({
            distanceKm: parseFloat(dist.toFixed(2)),
            isEligible: eligible
          });
          if (eligible) {
            showToast('Inside delivery area (Haversine validated).', 'success');
          } else {
            showToast('Outside delivery area (Haversine validated).', 'error');
          }
        } finally {
          setCheckingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation fetch error:', error);
        showToast('Failed to fetch your location. Please allow location permission or use simulator buttons.', 'error');
        setCheckingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Helper to test coordinates instantly
  const handleTestCoordinates = (isClose) => {
    const lat = isClose ? 14.879 : 14.995;
    const lng = isClose ? 79.292 : 79.450;
    
    setCheckingLocation(true);
    setCoordinates({ lat, lng });
    setDeliveryAddress(isClose ? 'Dasarapalli Road near School, Udayagiri (Within 10KM Demo)' : 'Nellore Highway, outside Udayagiri (Outside 10KM Demo)');

    setTimeout(() => {
      const dist = calculateDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, lat, lng);
      const eligible = dist <= 10.0;
      setDeliveryValidation({
        distanceKm: parseFloat(dist.toFixed(2)),
        isEligible: eligible
      });
      showToast(eligible ? 'Demo Location: Inside 10KM' : 'Demo Location: Outside 10KM', eligible ? 'success' : 'error');
      setCheckingLocation(false);
    }, 600);
  };

  // Load Razorpay Script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Order placing handler
  const handlePlaceOrder = async () => {
    const finalName = customerName.trim() || user?.full_name || 'Guest Customer';
    if (!customerPhone.trim()) {
      showToast('Please enter your mobile number before placing the order.', 'warning');
      return;
    }

    if (!deliveryAddress.trim()) {
      showToast('Please enter your delivery address.', 'warning');
      return;
    }

    if (!coordinates) {
      showToast('Please select your location. Click "Locate Me (GPS)" or use the simulator keys.', 'warning');
      return;
    }

    if (deliveryValidation && !deliveryValidation.isEligible) {
      showToast('Delivery not available beyond 10KM.', 'error');
      return;
    }

    setPlacingOrder(true);

    try {
      // 1. Create order on Express backend
      const orderPayload = {
        customer_name: finalName,
        customer_mobile: customerPhone,
        delivery_address: deliveryAddress,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon || null,
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        user_id: user?.id || null
      };

      const res = await api.post('/orders', orderPayload);
      const createdOrder = res.data.order;

      // 2. COD flow
      if (paymentMethod === 'COD') {
        showToast('Order confirmed (Cash on Delivery)! 🎉', 'success');
        setConfirmedOrder(createdOrder);
        
        // Save guest order locally if guest
        if (!user) {
          const savedIds = localStorage.getItem('bisfruitjuice_guest_orders');
          const guestOrderIds = savedIds ? JSON.parse(savedIds) : [];
          if (!guestOrderIds.includes(createdOrder.id)) {
            guestOrderIds.push(createdOrder.id);
            localStorage.setItem('bisfruitjuice_guest_orders', JSON.stringify(guestOrderIds));
          }
        }

        // Instant local state sync
        setMyOrders((prev) => {
          const exists = prev.some(o => o.id === createdOrder.id);
          if (exists) return prev;
          return [createdOrder, ...prev];
        });

        clearCart();
        fetchMyOrders();
        setActivePageTab('tracking');
      } 
      // 3. Razorpay flow
      else {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          showToast('Failed to load Razorpay Payment Gateway. Check internet connection.', 'error');
          setPlacingOrder(false);
          return;
        }

        // Get Razorpay Order ID from backend
        const rzpRes = await api.post('/payments/order', { orderId: createdOrder.id });
        const rzpData = rzpRes.data;

        const options = {
          key: rzpData.key,
          amount: rzpData.amount,
          currency: rzpData.currency,
          name: 'Bismilla Fruit Juice',
          description: `Payment for Order #${createdOrder.id.substring(0, 8)}`,
          order_id: rzpData.id,
          handler: async (response) => {
            try {
              // Verify payment signature
              const verifyRes = await api.post('/payments/verify', {
                orderId: createdOrder.id,
                razorpay_order_id: response.razorpay_order_id || rzpData.id,
                razorpay_payment_id: response.razorpay_payment_id || `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
                razorpay_signature: response.razorpay_signature || 'mock_sig',
                isMock: rzpData.isMock
              });

              if (verifyRes.data.status === 'success') {
                showToast('Payment verified successfully!', 'success');
                
                // Get the updated order data
                const updatedOrder = { 
                  ...createdOrder, 
                  payment_status: 'paid', 
                  payment_id: response.razorpay_payment_id 
                };
                
                setConfirmedOrder(updatedOrder);

                // Save guest order locally if guest
                if (!user) {
                  const savedIds = localStorage.getItem('bisfruitjuice_guest_orders');
                  const guestOrderIds = savedIds ? JSON.parse(savedIds) : [];
                  if (!guestOrderIds.includes(updatedOrder.id)) {
                    guestOrderIds.push(updatedOrder.id);
                    localStorage.setItem('bisfruitjuice_guest_orders', JSON.stringify(guestOrderIds));
                  }
                }

                // Instant local state sync
                setMyOrders((prev) => {
                  const exists = prev.some(o => o.id === updatedOrder.id);
                  if (exists) return prev;
                  return [updatedOrder, ...prev];
                });

                clearCart();
                fetchMyOrders();
                setActivePageTab('tracking');
              } else {
                showToast('Payment verification failed.', 'error');
              }
            } catch (err) {
              console.error('Error verifying payment:', err);
              showToast('Payment verification failed.', 'error');
            }
          },
          prefill: {
            name: finalName,
            email: user?.email || 'guest@example.com',
            contact: customerPhone
          },
          theme: {
            color: '#22c55e'
          },
          modal: {
            ondismiss: async () => {
              showToast('Payment cancelled by customer.', 'warning');
              try {
                await api.post('/payments/cancelled', { orderId: createdOrder.id });
              } catch (err) {
                console.error('Error recording cancellation:', err);
              }
              setConfirmedOrder({
                ...createdOrder,
                payment_status: 'CANCELLED'
              });
              clearCart();
              fetchMyOrders();
              setActivePageTab('tracking');
            }
          }
        };

        const razorpayInstance = new window.Razorpay(options);
        
        razorpayInstance.on('payment.failed', async (response) => {
          showToast('Payment failed. Try another card or UPI app.', 'error');
          try {
            await api.post('/payments/failed', {
              orderId: createdOrder.id,
              failureReason: response.error?.description || 'Transaction failed',
              razorpay_payment_id: response.error?.metadata?.payment_id,
              razorpay_order_id: response.error?.metadata?.order_id
            });
          } catch (err) {
            console.error('Error recording failure:', err);
          }
          setConfirmedOrder({
            ...createdOrder,
            payment_status: 'FAILED'
          });
          clearCart();
          fetchMyOrders();
          setActivePageTab('tracking');
        });

        razorpayInstance.open();
      }
    } catch (err) {
      console.error('Failed to place order:', err);
      const message = err.response?.data?.error || err.response?.data?.message || 'Failed to place your order. Please check your connection and try again.';
      showToast(message, 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleRetryPayment = async (order) => {
    setPlacingOrder(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        showToast('Failed to load Razorpay Payment Gateway. Check internet connection.', 'error');
        setPlacingOrder(false);
        return;
      }

      // 1. Get Razorpay Order ID from backend
      const rzpRes = await api.post('/payments/order', { orderId: order.id });
      const rzpData = rzpRes.data;

      const options = {
        key: rzpData.key,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'Bismilla Fruit Juice',
        description: `Retry Payment for Order #${order.id.substring(0, 8)}`,
        order_id: rzpData.id,
        handler: async (response) => {
          try {
            // Verify payment signature
            const verifyRes = await api.post('/payments/verify', {
              orderId: order.id,
              razorpay_order_id: response.razorpay_order_id || rzpData.id,
              razorpay_payment_id: response.razorpay_payment_id || `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
              razorpay_signature: response.razorpay_signature || 'mock_sig',
              isMock: rzpData.isMock
            });

            if (verifyRes.data.status === 'success') {
              showToast('Payment verified successfully!', 'success');
              
              // Get the updated order data
              const updatedOrder = { 
                ...order, 
                payment_status: 'paid', 
                payment_id: response.razorpay_payment_id 
              };
              
              setConfirmedOrder(updatedOrder);

              // Instant local state sync
              setMyOrders((prev) => prev.map(o => o.id === order.id ? updatedOrder : o));

              fetchMyOrders();
            } else {
              showToast('Payment verification failed.', 'error');
            }
          } catch (err) {
            console.error('Error verifying payment:', err);
            showToast('Payment verification failed.', 'error');
          }
        },
        prefill: {
          name: order.customer_name || 'Customer',
          email: user?.email || 'guest@example.com',
          contact: order.customer_mobile
        },
        theme: {
          color: '#22c55e'
        },
        modal: {
          ondismiss: async () => {
            showToast('Payment retry cancelled by user.', 'warning');
            try {
              await api.post('/payments/cancelled', { orderId: order.id });
            } catch (err) {
              console.error('Error recording cancellation:', err);
            }
            setConfirmedOrder({
              ...order,
              payment_status: 'CANCELLED'
            });
            fetchMyOrders();
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      
      razorpayInstance.on('payment.failed', async (response) => {
        showToast('Payment failed. Try another card or UPI app.', 'error');
        try {
          await api.post('/payments/failed', {
            orderId: order.id,
            failureReason: response.error?.description || 'Transaction failed',
            razorpay_payment_id: response.error?.metadata?.payment_id,
            razorpay_order_id: response.error?.metadata?.order_id
          });
        } catch (err) {
          console.error('Error recording failure:', err);
        }
        setConfirmedOrder({
          ...order,
          payment_status: 'FAILED'
        });
        fetchMyOrders();
      });

      razorpayInstance.open();
    } catch (err) {
      console.error('Error retrying payment:', err);
      showToast('Failed to initiate payment retry.', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };



  const getWhatsAppShareLink = (order) => {
    const itemsList = order.order_items?.map(item => `- ${item.products?.name} x ${item.quantity}`).join('%0A') || '';
    const text = `Hello Imran, Bismilla Fruit Juice!%0APlease confirm my Order:%0A%0A*Order ID:* ${order.id.substring(0, 8)}%0A*Name:* ${order.customer_name}%0A*Mobile:* ${order.customer_mobile}%0A*Address:* ${order.delivery_address}%0A%0A*Items:*%0A${itemsList}%0A%0A*Total Amount:* ₹${order.total_amount}%0A*Payment Method:* ${order.payment_method}%0A*Status:* ${order.order_status}`;
    return `https://wa.me/917989646180?text=${text}`;
  };

  const getOrderStatusStep = (status) => {
    const steps = ['pending', 'accepted', 'otp_pending', 'delivered'];
    return steps.indexOf(status);
  };

  const getPaymentStatusBadge = (order) => {
    const isCOD = order.payment_method === 'COD';
    const isPaid = order.payment_status === 'paid' || order.payment_status === 'PAYMENT COMPLETED';
    const isFailed = order.payment_status === 'failed' || order.payment_status === 'FAILED';
    const isCancelled = order.payment_status === 'CANCELLED';

    let text = order.payment_status;
    let className = 'bg-amber-50 text-amber-705 border border-amber-200/20 dark:bg-amber-955/20 dark:text-amber-450';

    if (isCOD) {
      if (isPaid) {
        text = 'Payment Completed';
        className = 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 border border-emerald-500/20 dark:from-emerald-950/20 dark:to-teal-955/20 dark:text-emerald-400';
      } else {
        text = 'Payment Pending';
        className = 'bg-amber-50 text-amber-705 border border-amber-200/20 dark:bg-amber-955/20 dark:text-amber-450';
      }
    } else { // UPI / Razorpay
      if (isPaid) {
        text = 'Paid Successfully';
        className = 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 border border-emerald-500/20 dark:from-emerald-950/20 dark:to-teal-955/20 dark:text-emerald-400';
      } else if (isFailed) {
        text = 'Payment Failed';
        className = 'bg-gradient-to-r from-rose-500/10 to-pink-500/10 text-rose-600 border border-rose-500/25 dark:from-rose-950/20 dark:to-pink-950/20 dark:text-rose-400';
      } else if (isCancelled) {
        text = 'Payment Cancelled';
        className = 'bg-slate-100 text-slate-600 border border-slate-200/25 dark:bg-slate-900 dark:text-slate-400';
      } else {
        text = 'Payment Pending';
        className = 'bg-amber-50 text-amber-705 border border-amber-200/20 dark:bg-amber-955/20 dark:text-amber-450';
      }
    }

    return (
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide shrink-0 ${className}`}>
        {text}
      </span>
    );
  };

  const activeOrders = myOrders.filter(o => 
    ['pending', 'accepted', 'otp_pending'].includes(o.order_status)
  );
  const pastOrders = myOrders.filter(o => 
    ['delivered', 'rejected', 'cancelled'].includes(o.order_status)
  );

  const totalSpent = pastOrders
    .filter(o => o.order_status === 'delivered')
    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
  const totalDeliveries = pastOrders.filter(o => o.order_status === 'delivered').length;

  const handleReorder = (order) => {
    if (!order.order_items || order.order_items.length === 0) return;
    order.order_items.forEach(item => {
      if (item.products) {
        addToCart({
          id: item.products.id,
          name: item.products.name,
          price: item.price_at_order || item.products.price || 80,
          category: item.products.category
        }, item.quantity);
      }
    });
    setActivePageTab('checkout');
    showToast('Items added back to your cart! 🛍️', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-8 min-h-[85vh] text-left">
      
      {/* HEADER ROW WITH LOGIN STATUS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            Juice Bar Portal
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Place orders, track live status, and view your juice purchase history.
          </p>
        </div>

        {/* Guest vs Logged in header button */}
        {!user ? (
          <button
            onClick={() => {
              setIsSignUp(false);
              setFormError('');
              setAuthModalOpen(true);
            }}
            className="btn-secondary text-xs flex items-center gap-1.5 py-2 px-4 border-dashed hover:border-primary hover:text-primary"
          >
            <User className="w-3.5 h-3.5" /> Sign In for History
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-505 font-medium">Logged in as: <strong className="text-slate-800 dark:text-slate-200">{user.full_name}</strong></span>
            <button
              onClick={signOut}
              className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          </div>
        )}
      </div>

      {/* PAGE TABS NAVIGATOR */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setActivePageTab('checkout')}
          className={`flex items-center gap-2 py-3 px-5 border-b-2 font-medium text-xs sm:text-sm transition-all ${
            activePageTab === 'checkout'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Checkout & Place Order
          {cartItems.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-[9px] font-extrabold bg-primary text-white rounded-full">
              {cartItems.length}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setActivePageTab('tracking')}
          className={`flex items-center gap-2 py-3 px-5 border-b-2 font-medium text-xs sm:text-sm transition-all ${
            activePageTab === 'tracking'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          <Truck className="w-4 h-4" />
          Active Tracking
          {activeOrders.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-[9px] font-extrabold bg-blue-500 text-white rounded-full animate-pulse">
              {activeOrders.length}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setActivePageTab('history')}
          className={`flex items-center gap-2 py-3 px-5 border-b-2 font-medium text-xs sm:text-sm transition-all ${
            activePageTab === 'history'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Order History
          {pastOrders.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-[9px] font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-650 rounded-full">
              {pastOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: CHECKOUT & PLACE ORDER */}
      {activePageTab === 'checkout' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT/MID: CHECKOUT FORM */}
          <div className="lg:col-span-2 space-y-8">
            {cartItems.length === 0 ? (
              <div className="p-12 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-center flex flex-col items-center gap-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/40 text-primary flex items-center justify-center">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Your Cart is Empty</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-[280px] leading-relaxed">
                    Add fresh juices or milkshakes to your cart from our menu catalog to start checking out!
                  </p>
                </div>
                <a href="/products" className="btn-primary text-xs px-6 py-2.5">
                  Explore Fresh Menu
                </a>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-6">
                
                {/* Name fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer Name</label>
                    <div className="relative">
                      <User className="w-4.5 h-4.5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-850 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mobile Number</label>
                    <div className="relative">
                      <Phone className="w-4.5 h-4.5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Enter mobile number"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-850 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Location Picker Maps Validation */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Delivery Address</label>
                    <button
                      type="button"
                      onClick={handleFetchLocation}
                      disabled={checkingLocation}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      {checkingLocation ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                      Locate Me (GPS)
                    </button>
                  </div>
                  
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter full delivery address with landmark details..."
                    rows="2.5"
                    className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-850 dark:text-slate-105 resize-none"
                  />

                  {/* Manual Coordinates Toggle */}
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    <span className="text-[10px] text-slate-550 font-semibold mt-1">Quick Distance Check Simulator:</span>
                    <button
                      type="button"
                      onClick={() => handleTestCoordinates(true)}
                      className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/20 text-primary px-2.5 py-1 rounded text-[10px] font-bold hover:bg-emerald-100"
                    >
                      Within 10KM (Demo)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTestCoordinates(false)}
                      className="bg-rose-50 dark:bg-rose-955/40 border border-rose-200/20 text-rose-600 px-2.5 py-1 rounded text-[10px] font-bold hover:bg-rose-105"
                    >
                      Outside 10KM (Demo)
                    </button>
                  </div>

                  {/* Geolocation feedback alert */}
                  {deliveryValidation && (
                    <div className={`p-4.5 rounded-xl border text-xs flex gap-3 mt-2 ${
                      deliveryValidation.isEligible 
                        ? 'bg-emerald-50/70 dark:bg-emerald-955/20 border-emerald-200/30 text-emerald-800 dark:text-emerald-350'
                        : 'bg-rose-50/70 dark:bg-rose-955/20 border-rose-200/30 text-rose-805 dark:text-rose-350'
                    }`}>
                      <div className="mt-0.5 shrink-0">
                        {deliveryValidation.isEligible ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {deliveryValidation.isEligible ? 'Delivery Boundary Accepted! 🎉' : 'Delivery Boundary Exceeded'}
                        </p>
                        <p className="mt-0.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                          {deliveryValidation.isEligible
                            ? `Your location is ${deliveryValidation.distanceKm} KM from our permanent Udayagiri shop, which is within our 10 KM delivery radius.`
                            : `Your location is ${deliveryValidation.distanceKm} KM from our shop. Sorry, we cannot deliver beyond a 10 KM radius.`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* DYNAMIC PROGRESSION: PAYMENTS SECTION REVEALS ONLY IF DISTANCE IS BELOW 10KM */}
                {deliveryValidation?.isEligible ? (
                  <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-805 animate-fadeIn">
                    
                    {/* First Order Coupon Banner & Input */}
                    <div className="space-y-3 p-4 bg-orange-50/40 dark:bg-orange-950/15 border border-orange-200/20 rounded-2xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-205">First Order Discount Offer</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Use code <span className="font-bold text-orange-600 dark:text-orange-400">FIRST20</span> to get 20% OFF on all items!</p>
                        </div>
                        {!appliedCoupon && (
                          <button
                            type="button"
                            onClick={() => handleApplyCoupon('FIRST20')}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-2.5 py-1 rounded transition-colors"
                          >
                            Apply Instantly
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter coupon code (e.g. FIRST20)"
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-slate-850 dark:text-slate-100"
                          disabled={!!appliedCoupon}
                        />
                        {appliedCoupon ? (
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApplyCoupon()}
                            className="bg-primary hover:bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                      
                      {couponError && <p className="text-[10px] font-bold text-rose-500">{couponError}</p>}
                      {couponSuccess && <p className="text-[10px] font-bold text-emerald-605">{couponSuccess}</p>}
                    </div>

                    {/* Payment Select */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Payment Method</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        
                        {/* COD button */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('COD')}
                          className={`p-4 rounded-xl border flex items-center justify-between text-left transition-all ${
                            paymentMethod === 'COD'
                              ? 'border-primary bg-green-50/30 dark:bg-green-950/10 text-slate-900 dark:text-white font-semibold'
                              : 'border-slate-202 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-950'
                          }`}
                        >
                          <div>
                            <p className="text-sm">Cash on Delivery (COD)</p>
                            <p className="text-[10px] text-slate-450 font-normal mt-0.5">Pay at your doorstep on delivery</p>
                          </div>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            paymentMethod === 'COD' ? 'border-primary bg-primary text-white' : 'border-slate-300'
                          }`}>
                            {paymentMethod === 'COD' && <Check className="w-3 h-3" />}
                          </span>
                        </button>

                        {/* Razorpay online button */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('Razorpay')}
                          className={`p-4 rounded-xl border flex items-center justify-between text-left transition-all ${
                            paymentMethod === 'Razorpay'
                              ? 'border-primary bg-green-50/30 dark:bg-green-950/10 text-slate-900 dark:text-white font-semibold'
                              : 'border-slate-202 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-950'
                          }`}
                        >
                          <div>
                            <p className="text-sm">Online Razorpay Payment</p>
                            <p className="text-[10px] text-slate-450 font-normal mt-0.5">UPI, Cards, Netbanking secure gateway</p>
                          </div>
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            paymentMethod === 'Razorpay' ? 'border-primary bg-primary text-white' : 'border-slate-300'
                          }`}>
                            {paymentMethod === 'Razorpay' && <Check className="w-3 h-3" />}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Proceed to Pay button */}
                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={placingOrder}
                      className="btn-primary w-full py-4 text-sm sm:text-base font-semibold shadow-md rounded-2xl flex items-center justify-center gap-2"
                    >
                      {placingOrder ? (
                        <>Placing order...</>
                      ) : paymentMethod === 'COD' ? (
                        <>Confirm COD Order (₹{finalTotal.toFixed(2)}) <Check className="w-4.5 h-4.5" /></>
                      ) : (
                        <>Proceed to Pay (₹{finalTotal.toFixed(2)}) <CreditCard className="w-4.5 h-4.5" /></>
                      )}
                    </button>

                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 text-center text-xs text-slate-500 leading-relaxed pt-6 pb-6">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                    Please check delivery radius availability above to choose a payment option and proceed.
                  </div>
                )}

              </div>
            )}
          </div>

          {/* RIGHT SIDE: CART SUMMARY */}
          <div className="space-y-8">
            {cartItems.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-805 shadow-sm space-y-4">
                <h3 className="font-semibold text-slate-850 dark:text-white text-base">Order Summary</h3>
                <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                      <span className="truncate max-w-[180px] font-medium">{item.name} <span className="font-bold text-slate-800 dark:text-slate-300">x {item.quantity}</span></span>
                      <span>₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 dark:border-slate-805 pt-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Discount (20% OFF)</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold text-sm text-slate-850 dark:text-white pt-1 border-t border-dashed border-slate-200 dark:border-slate-800">
                    <span>Grand Total</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: ACTIVE TRACKING */}
      {activePageTab === 'tracking' && (
        <div className="space-y-6 max-w-4xl mx-auto w-full">
          
          {/* Confirmed Banner */}
          {confirmedOrder && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/30 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fadeIn">
              <div>
                <h3 className="font-bold text-emerald-805 dark:text-emerald-300 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  Order Placed Successfully! 🎉
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-405 mt-1 leading-relaxed">
                  Thank you for ordering with us. Your order <span className="font-mono font-bold">#{confirmedOrder.id.substring(0, 8)}</span> is active and is being prepared with 100% pure fresh fruits.
                </p>
              </div>
              <button
                onClick={() => setConfirmedOrder(null)}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
              >
                Dismiss Banner
              </button>
            </div>
          )}

          {loadingOrders ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="p-12 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-center flex flex-col items-center gap-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-955/40 text-blue-500 flex items-center justify-center">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-850 dark:text-white">No Active Orders</h3>
                <p className="text-xs text-slate-505 mt-1 max-w-xs leading-relaxed">
                  You don't have any active orders right now. Place an order in the checkout tab or browse our menu!
                </p>
              </div>
              <a href="/products" className="btn-secondary text-xs px-6 py-2.5 border-dashed">
                Go to Menu
              </a>
            </div>
          ) : (
            <div className="space-y-8">
              {activeOrders.map((order) => {
                const currentStep = getOrderStatusStep(order.order_status);
                const showETA = ['pending', 'accepted'].includes(order.order_status);
                const isNewlyPlaced = confirmedOrder && confirmedOrder.id === order.id;

                const steps = [
                  { key: 'pending', label: 'Order Placed', desc: 'Received by Bismilla shop' },
                  { key: 'accepted', label: 'Accepted by Shop', desc: 'Confirmed by Imran' },
                  { key: 'otp_pending', label: 'OTP Verification', desc: 'Tell OTP to partner' },
                  { key: 'delivered', label: 'Delivered', desc: 'Enjoy your fresh juice!' }
                ];

                return (
                  <div 
                    key={order.id} 
                    className={`border p-6 rounded-3xl bg-white dark:bg-slate-900 space-y-6 shadow-sm transition-all duration-305 ${
                      isNewlyPlaced 
                        ? 'border-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/40' 
                        : 'border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    {/* Order header row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-105 dark:border-slate-850 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-bold text-slate-850 dark:text-slate-205 text-base">#{order.id.substring(0, 8)}</p>
                          {isNewlyPlaced && (
                            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-305 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider animate-pulse">
                              Just Placed
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">
                          Placed: {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <div className="flex flex-col sm:items-end gap-1">
                        <span className="font-extrabold text-slate-855 dark:text-white text-base">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                        <div className="flex items-center gap-2">
                          {getPaymentStatusBadge(order)}
                          {order.payment_method === 'Razorpay' && 
                            ['FAILED', 'CANCELLED', 'failed'].includes(order.payment_status) && (
                            <button
                              onClick={() => handleRetryPayment(order)}
                              className="bg-primary hover:bg-green-600 text-white text-[9px] font-extrabold px-3 py-1 rounded-full transition-all shadow-sm flex items-center gap-1 animate-pulse"
                            >
                              <CreditCard className="w-2.5 h-2.5" /> Retry Pay
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order details panel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs bg-slate-50/50 dark:bg-slate-955/10 p-4 rounded-2xl border border-slate-105/50 dark:border-slate-800/40">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Delivery Address</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">{order.delivery_address}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Customer Details</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{order.customer_name} ({order.customer_mobile})</span>
                      </div>
                    </div>

                    {/* Ordered items */}
                    <div className="space-y-2 text-xs">
                      <p className="font-bold text-slate-455 uppercase text-[9px] tracking-wider">Juices Ordered</p>
                      <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="flex justify-between py-2 first:pt-0 last:pb-0 font-medium">
                            <span className="text-slate-705 dark:text-slate-300">
                              {item.products?.name || 'Fresh Juice'}{' '}
                              <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] ml-1">
                                x{item.quantity}
                              </span>
                            </span>
                            <span className="font-semibold text-slate-850 dark:text-slate-202">₹{(parseFloat(item.price_at_order) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ETA Countdown Alert */}
                    {showETA && (
                      <div className="bg-blue-50/40 dark:bg-blue-955/20 border border-blue-200/20 p-4 rounded-2xl flex items-center gap-3 text-xs text-blue-750 dark:text-blue-350">
                        <Clock className="w-5 h-5 shrink-0 animate-spin-slow text-primary" />
                        <div>
                          <p className="font-bold text-sm">Estimated Delivery: ~30 minutes</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {order.order_status === 'pending'
                              ? 'Waiting for Imran to accept and confirm the order.'
                              : 'Your fresh juices are being prepared! Out for delivery soon.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Timeline Tracker */}
                    <div className="border border-slate-105 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 p-5 rounded-2xl">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-105 dark:border-slate-850">
                        <h4 className="font-semibold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Live Delivery Tracker</h4>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-primary bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" /> Realtime Sync
                        </span>
                      </div>

                      <div className="space-y-4 pl-1 pt-3.5">
                        {steps.map((step, idx) => {
                          const isCompleted = idx < currentStep;
                          const isActive = idx === currentStep;
                          const isRejected = order.order_status === 'rejected';

                          return (
                            <div key={step.key} className="flex gap-3.5 text-xs relative">
                              {idx < steps.length - 1 && (
                                <div className={`w-0.5 absolute left-[8px] top-[18px] bottom-[-22px] -z-10 ${
                                  idx < currentStep ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'
                                }`} />
                              )}

                              <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 shrink-0 z-10 transition-colors ${
                                isRejected && idx > 0
                                  ? 'border-slate-200 bg-white dark:border-slate-805 dark:bg-slate-955 text-slate-350'
                                  : isCompleted
                                  ? 'border-primary bg-primary text-white'
                                  : isActive
                                  ? 'border-primary bg-white dark:bg-slate-900 text-primary'
                                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-955 text-slate-300'
                              }`}>
                                {isCompleted ? (
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                ) : (
                                  <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary animate-pulse' : 'bg-transparent'}`} />
                                )}
                              </div>

                              <div className="space-y-0.5">
                                <p className={`font-semibold text-xs ${
                                  isRejected && idx > 0
                                    ? 'text-slate-400 line-through'
                                    : isActive
                                    ? 'text-primary font-bold'
                                    : isCompleted
                                    ? 'text-slate-850 dark:text-slate-202'
                                    : 'text-slate-400 dark:text-slate-550'
                                }`}>
                                  {step.label} {isRejected && idx === 1 && <span className="text-rose-500 font-bold font-sans">(REJECTED)</span>}
                                </p>
                                <p className="text-[10px] text-slate-455 dark:text-slate-500">{step.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* OTP verification box */}
                    {order.order_status === 'otp_pending' && (
                      <div className="bg-amber-50 dark:bg-amber-955/20 border border-amber-250/25 p-4.5 rounded-2xl flex flex-col gap-2.5 text-xs">
                        <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                          <Lock className="w-4.5 h-4.5 shrink-0 text-amber-500" />
                          <span className="text-sm">Verify Delivery via OTP</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
                          Provide the 4-digit code below to the delivery partner to verify checkout & close transaction.
                        </p>
                        <div className="bg-amber-100/60 dark:bg-amber-950/40 border border-amber-200/50 rounded-xl p-3 flex items-start gap-2.5">
                          <span className="text-amber-600 font-extrabold text-base mt-0.5">📲</span>
                          <p className="text-amber-800 dark:text-amber-300 font-semibold text-[11px] leading-relaxed text-left">
                            When our delivery partner arrives, <strong>tell them the OTP from your SMS</strong>.
                            They will enter it to confirm delivery and complete the transaction.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Actions row */}
                    <div className="flex flex-wrap gap-2.5 pt-2">
                      <a
                        href={getWhatsAppShareLink(order)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Share2 className="w-4 h-4" /> Share on WhatsApp
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ORDER HISTORY */}
      {activePageTab === 'history' && (
        <div className="space-y-6 max-w-4xl mx-auto w-full">
          
          {/* TOTAL EXPENSE STATS BANNER */}
          {pastOrders.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900 border border-slate-105 dark:border-slate-805 p-6 rounded-3xl shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Amount Spent</span>
                <p className="text-2xl font-extrabold text-primary">₹{totalSpent.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Orders Delivered</span>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{totalDeliveries}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Orders Placed</span>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{pastOrders.length}</p>
              </div>
            </div>
          )}

          {loadingOrders ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : pastOrders.length === 0 ? (
            <div className="p-12 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-center flex flex-col items-center gap-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-950/40 text-slate-450 flex items-center justify-center">
                <ClipboardList className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-850 dark:text-white">No Order History</h3>
                <p className="text-xs text-slate-505 mt-1 max-w-xs leading-relaxed">
                  You don't have any completed orders yet. Place and receive your first order to build history!
                </p>
              </div>
              <a href="/products" className="btn-primary text-xs px-6 py-2.5">
                Order Pure Juices
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {pastOrders.map((order) => {
                const isDelivered = order.order_status === 'delivered';
                const isRejected = order.order_status === 'rejected';

                return (
                  <div 
                    key={order.id} 
                    className="border border-slate-105 dark:border-slate-800 p-6 rounded-3xl bg-white dark:bg-slate-900 space-y-4 shadow-sm"
                  >
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <p className="font-mono font-bold text-slate-805 dark:text-slate-200 text-sm">#{order.id.substring(0, 8)}</p>
                        <p className="text-[10px] text-slate-450 mt-1 font-semibold uppercase">
                          {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                          isDelivered 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/60 dark:text-emerald-400' 
                            : isRejected
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-955/60 dark:text-rose-455'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {order.order_status}
                        </span>

                        <span className="font-extrabold text-slate-800 dark:text-white text-sm">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Receipt Items summary */}
                    <div className="space-y-1.5 text-xs">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-slate-655 dark:text-slate-400 font-medium">
                          <span>
                            • {item.products?.name || 'Fresh Juice'}{' '}
                            <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] ml-1">
                              x{item.quantity}
                            </span>
                          </span>
                          <span>₹{(parseFloat(item.price_at_order) * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Address details */}
                    <div className="text-[10px] text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-955/20 p-3 rounded-xl">
                      <strong className="text-slate-500 uppercase block text-[8px] tracking-wider mb-1">Delivered to</strong>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">{order.delivery_address}</p>
                    </div>

                    {/* Actions row */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => handleReorder(order)}
                        className="bg-primary hover:bg-green-600 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Re-order Items
                      </button>
                      
                      <a
                        href={getWhatsAppShareLink(order)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Share Receipt
                      </a>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* 4. OPTIONAL LOGIN GLASS MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={() => setAuthModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 z-10 shadow-2xl flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </h3>
              <button onClick={() => setAuthModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="relative">
                    <User className="w-4.5 h-4.5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-805 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Phone className="w-4.5 h-4.5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="Mobile Number"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-805 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
                      required
                    />
                  </div>
                </>
              )}

              <div className="relative">
                <Mail className="w-4.5 h-4.5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="w-4.5 h-4.5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
                  required
                />
              </div>

              {formError && (
                <p className={`text-xs px-3 py-2 rounded-lg font-medium ${
                  formError.startsWith('✅') 
                    ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300' 
                    : 'text-rose-500 bg-rose-50 dark:bg-rose-955/30'
                }`}>{formError}</p>
              )}

              <button
                type="submit"
                disabled={submittingAuth}
                className="btn-primary w-full py-3 text-xs rounded-xl shadow-none"
              >
                {submittingAuth ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </form>

            <p className="text-xs text-center text-slate-500">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-bold hover:underline"
              >
                {isSignUp ? 'Login' : 'Register'}
              </button>
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
