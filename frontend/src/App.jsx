import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';

import Home from './pages/Home.jsx';
import Products from './pages/Products.jsx';
import Orders from './pages/Orders.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="flex flex-col min-h-screen">
              {/* Global Navigation Header */}
              <Navbar />
              
              {/* Slide out shopping cart panel */}
              <CartDrawer />
              
              {/* Main Routing Body */}
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
              </main>

              {/* Global Footer */}
              <Footer />

              {/* Floating WhatsApp Support Button */}
              <a
                href="https://wa.me/917989646180?text=Hello%20Imran!%20I%20have%2520a%2520question%2520about%2520my%2520juice%2520order."
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-2xl z-[150] transition-all transform hover:scale-110 flex items-center justify-center border border-white/20 active:scale-95 animate-bounce-slow"
                aria-label="WhatsApp Support"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.498 1.453 5.418 1.454 5.561 0 10.085-4.526 10.088-10.09.002-2.697-1.047-5.234-2.951-7.14C17.299 1.472 14.773.235 12.01.235 6.445.235 1.92 4.76 1.916 10.326c-.001 1.996.52 3.94 1.508 5.679L2.43 21.6l5.772-1.516c1.698.926 3.6 1.413 5.518 1.413z" />
                </svg>
              </a>
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
