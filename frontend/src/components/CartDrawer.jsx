import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartDrawer() {
  const { 
    cartItems, 
    cartOpen, 
    setCartOpen, 
    removeFromCart, 
    updateCartQuantity, 
    cartTotal 
  } = useCart();

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-black z-[150] cursor-pointer"
          />

          {/* Cart Sidebar Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[151] flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <span className="font-semibold text-slate-800 dark:text-white">Shopping Cart</span>
                <span className="bg-green-100 dark:bg-green-950 text-primary dark:text-green-400 text-xs px-2 py-0.5 rounded-full font-bold">
                  {cartItems.length}
                </span>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cartItems.length === 0 ? (
                // Empty State
                <div className="h-full flex flex-col justify-center items-center text-center gap-4 py-12">
                  <div className="w-24 h-24 rounded-full bg-green-50 dark:bg-green-950/40 flex items-center justify-center text-primary animate-bounce-slow">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white text-base">Your Cart is Empty</h3>
                    <p className="text-slate-500 dark:text-slate-450 text-xs mt-1 max-w-[240px]">
                      Looks like you haven't added any fresh fruit juices yet.
                    </p>
                  </div>
                  <Link
                    to="/products"
                    onClick={() => setCartOpen(false)}
                    className="btn-primary py-2 px-6 text-xs mt-2"
                  >
                    Explore Juices
                  </Link>
                </div>
              ) : (
                // Item Cards
                cartItems.map((item) => (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-55 dark:bg-slate-900/30 items-center justify-between"
                  >
                    {/* Item Image */}
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=150'}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-100 border border-slate-100 dark:border-slate-800"
                    />

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.category}</p>
                      
                      <div className="flex items-center justify-between mt-2.5">
                        {/* Quantity editor */}
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-full py-0.5 px-2 bg-white dark:bg-slate-800">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:text-primary transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:text-primary transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <span className="font-bold text-sm text-slate-850 dark:text-slate-150">
                        ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-full transition-all"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Drawer Footer Checkout Card */}
            {cartItems.length > 0 && (
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Subtotal</span>
                  <span className="text-xl font-bold text-slate-800 dark:text-white">₹{cartTotal.toFixed(2)}</span>
                </div>
                
                <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                  Taxes and delivery charges are calculated at checkout. Delivery available only within 10KM.
                </p>

                <div className="grid grid-cols-1 gap-2">
                  <Link
                    to="/orders"
                    onClick={() => setCartOpen(false)}
                    className="btn-primary w-full py-3"
                  >
                    Proceed to Order <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="btn-secondary w-full py-2.5 text-xs border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
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
