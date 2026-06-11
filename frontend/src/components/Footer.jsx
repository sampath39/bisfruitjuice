import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, Heart, MessageSquare, ShoppingBag } from 'lucide-react';

export default function Footer() {
  const shopMobile = '+91 79896 46180';
  const whatsappLink = `https://wa.me/917989646180?text=Hi%20Imran,%20I%20would%20like%20to%20order%20some%20fresh%20juice!`;

  return (
    <footer className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-300 mt-auto">
      
      {/* Top wave */}
      <div className="w-full overflow-hidden" style={{ height: 60, background: 'white' }}>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#0f172a" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="md:col-span-2 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="bg-gradient-to-tr from-green-500 to-amber-400 p-2.5 rounded-xl text-white shadow-lg">
              <ShoppingBag className="w-6 h-6" />
            </span>
            <div>
              <span className="font-display text-2xl font-bold text-white block">Bismilla</span>
              <span className="text-amber-400 font-sans text-[10px] tracking-widest uppercase font-bold">Fruit Juice</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
            Crafting premium natural juices with 100% pure fruit — no water, no sugar, no artificial additives. Health and taste, side-by-side.
          </p>
          <div className="flex gap-3">
            <span className="bg-green-900/40 text-green-400 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-green-700/30">
              🌿 No Added Sugar
            </span>
            <span className="bg-green-900/40 text-green-400 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-green-700/30">
              💧 No Added Water
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-1">Quick Links</h4>
          <Link to="/" className="text-sm text-slate-400 hover:text-green-400 transition-colors">🏠 Home</Link>
          <Link to="/products" className="text-sm text-slate-400 hover:text-green-400 transition-colors">🧃 Juices Menu</Link>
          <Link to="/my-orders" className="text-sm text-slate-400 hover:text-green-400 transition-colors">📦 My Orders</Link>
          <Link to="/orders" className="text-sm text-slate-400 hover:text-green-400 transition-colors">📍 Track Orders</Link>
          <Link to="/admin" className="text-sm text-slate-400 hover:text-orange-400 transition-colors">⚙️ Admin Panel</Link>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-1">Get in Touch</h4>

          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-slate-200">Owner: Imran</p>
              <a href={`tel:${shopMobile}`} className="hover:text-green-400 transition-colors text-slate-400 block mt-0.5">{shopMobile}</a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-400 leading-relaxed">
              Dasarapalli Village, Udayagiri Mandal, Nellore Dt, AP, India
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-400">
              <p className="font-semibold text-slate-200">Shop Timings</p>
              <p className="mt-0.5">10:00 AM – 11:00 PM Daily</p>
            </div>
          </div>

          <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 transition-colors text-white px-4 py-2.5 rounded-xl text-sm font-semibold mt-1 w-max shadow-md">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.498 1.453 5.418 1.454 5.561 0 10.085-4.526 10.088-10.09.002-2.697-1.047-5.234-2.951-7.14C17.299 1.472 14.773.235 12.01.235 6.445.235 1.92 4.76 1.916 10.326c-.001 1.996.52 3.94 1.508 5.679L2.43 21.6l5.772-1.516z"/>
            </svg>
            Order on WhatsApp
          </a>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-700 py-5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <p>© 2026 Bismilla Fruit Juice. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>in Nellore, Andhra Pradesh</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
