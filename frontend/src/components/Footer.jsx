import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  MapPin, 
  Clock, 
  Heart, 
  MessageSquare
} from 'lucide-react';

export default function Footer() {
  const shopMobile = '+91 79896 46180';
  const whatsappLink = `https://wa.me/917989646180?text=Hi%20Imran,%2520I%20would%20like%20to%20order%20some%20fresh%20juice!`;

  return (
    <footer className="bg-slate-900 text-slate-300 dark:bg-slate-950 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand Section */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-tr from-primary to-citrus-yellow p-2 rounded-xl text-white font-bold">BF</span>
            <span className="font-display text-2xl font-bold tracking-tight text-white">
              Bismilla <span className="text-citrus-yellow font-sans text-xs tracking-wider block uppercase">Fruit Juice</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
            Crafting premium natural juices with 100% pure fruit. We believe in serving health and taste side-by-side with zero artificial additives.
          </p>
          <div className="flex gap-4 items-center mt-2">
            <div className="bg-emerald-950 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-emerald-800/40">
              No Added Sugar
            </div>
            <div className="bg-emerald-950 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-emerald-800/40">
              No Added Water
            </div>
          </div>
        </div>

        {/* Links Section */}
        <div className="flex flex-col gap-3">
          <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-1">Quick Links</h4>
          <Link to="/" className="text-sm text-slate-400 hover:text-primary transition-colors">Home</Link>
          <Link to="/products" className="text-sm text-slate-400 hover:text-primary transition-colors">Juices Menu</Link>
          <Link to="/orders" className="text-sm text-slate-400 hover:text-primary transition-colors">Track Orders</Link>
          <Link to="/admin" className="text-sm text-slate-400 hover:text-citrus-orange transition-colors">Admin Dashboard</Link>
        </div>

        {/* Contact Info Section */}
        <div className="flex flex-col gap-3.5">
          <h4 className="text-white font-semibold text-sm tracking-wider uppercase mb-1">Get in Touch</h4>
          
          <div className="flex items-start gap-3">
            <Phone className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-slate-200">Owner: Imran</p>
              <a href={`tel:${shopMobile}`} className="hover:text-primary transition-colors text-slate-400 block mt-0.5">{shopMobile}</a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-4.5 h-4.5 text-citrus-orange shrink-0 mt-0.5" />
            <p className="text-sm text-slate-400 leading-relaxed">
              Dasarapalli Village, Udayagiri Mandal, Nellore Dt, AP, India (Delivery within 10KM)
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-4.5 h-4.5 text-citrus-yellow shrink-0 mt-0.5" />
            <div className="text-sm text-slate-400">
              <p className="font-semibold text-slate-200">Shop Timings</p>
              <p className="mt-0.5">10:00 AM - 11:00 PM</p>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Bottom */}
      <div className="border-t border-slate-800 bg-slate-950 py-6 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center max-w-7xl mx-auto gap-4">
        <p>© 2026 Bismilla Fruit Juice. All rights reserved.</p>
        
        <div className="flex items-center gap-1.5 text-slate-600">
          <span>Made with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>in Nellore</span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-400 hover:text-green-500 transition-colors"
          >
            <MessageSquare className="w-4 h-4" /> Whatsapp Order
          </a>
        </div>
      </div>
    </footer>
  );
}
