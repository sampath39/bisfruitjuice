import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartDrawer() {
  const { cartItems, cartOpen, setCartOpen, removeFromCart, updateCartQuantity, cartTotal } = useCart();

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-black z-[150] cursor-pointer"
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[151] flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-green-50 to-amber-50">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                  <ShoppingBag className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-bold text-slate-800">Shopping Cart</span>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold border border-green-200">
                  {cartItems.length}
                </span>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1.5 rounded-full hover:bg-white text-slate-500 transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center gap-5 py-12">
                  <div className="w-24 h-24 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Your Cart is Empty</h3>
                    <p className="text-slate-500 text-xs mt-1.5 max-w-[220px] leading-relaxed">
                      Add some fresh fruit juices to get started!
                    </p>
                  </div>
                  <Link
                    to="/products"
                    onClick={() => setCartOpen(false)}
                    className="btn-primary py-2.5 px-6 text-xs mt-1"
                  >
                    Explore Juices
                  </Link>
                </div>
              ) : (
                cartItems.map((item) => (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 p-3 rounded-xl border border-slate-100 bg-white items-center justify-between shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=150'}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-100 border border-slate-100"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{item.category}</p>

                      <div className="flex items-center mt-2.5">
                        <div className="flex items-center border border-slate-200 rounded-full py-0.5 px-1.5 bg-slate-50">
                          <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="p-1 hover:text-green-600 transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-slate-800">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="p-1 hover:text-green-600 transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2.5 shrink-0">
                      <span className="font-bold text-sm text-slate-900">
                        ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-300 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded-full transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer Checkout */}
            {cartItems.length > 0 && (
              <div className="p-5 border-t border-slate-100 bg-gradient-to-r from-green-50 to-amber-50/50 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-medium">Subtotal</span>
                  <span className="text-2xl font-black text-slate-900">₹{cartTotal.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-slate-400 text-center leading-relaxed -mt-1">
                  Delivery charges calculated at checkout. Available within 10KM only.
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    to="/orders"
                    onClick={() => setCartOpen(false)}
                    className="btn-primary w-full py-3 text-sm font-bold shadow-md"
                  >
                    Proceed to Order <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="btn-secondary w-full py-2.5 text-xs"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
