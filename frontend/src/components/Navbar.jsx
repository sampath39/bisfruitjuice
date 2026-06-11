import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { 
  ShoppingBag, Menu, X, User, LogOut, LayoutDashboard, ClipboardList
} from 'lucide-react';

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth();
  const { cartCount, setCartOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Always force light mode
  useEffect(() => {
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  // Detect scroll for nav shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Menu', path: '/products' },
    { name: 'My Orders', path: '/my-orders' }
  ];

  return (
    <nav className={`sticky top-0 z-[100] px-4 sm:px-8 py-3.5 flex justify-between items-center transition-all duration-300 bg-white border-b border-slate-100 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>

      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2.5 group">
        <span className="bg-gradient-to-tr from-green-500 to-amber-400 p-2 rounded-xl text-white shadow-md transform group-hover:rotate-12 transition-transform duration-300">
          <ShoppingBag className="w-5 h-5" />
        </span>
        <span>
          <span className="font-display text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-orange-500 bg-clip-text text-transparent block leading-tight">
            Bismilla
          </span>
          <span className="text-amber-600 font-sans text-[10px] font-bold tracking-widest uppercase -mt-0.5 block">
            Fruit Juice
          </span>
        </span>
      </Link>

      {/* Desktop Navigation Links */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`font-medium transition-colors text-sm relative group ${
              isActive(link.path)
                ? 'text-green-600 font-semibold'
                : 'text-slate-600 hover:text-green-600'
            }`}
          >
            {link.name}
            <span className={`absolute -bottom-1 left-0 h-0.5 rounded-full bg-green-500 transition-all duration-300 ${isActive(link.path) ? 'w-full' : 'w-0 group-hover:w-full'}`} />
          </Link>
        ))}

        {isAdmin && (
          <Link
            to="/admin"
            className={`font-semibold flex items-center gap-1.5 text-sm transition-colors text-orange-500 hover:text-orange-600 ${isActive('/admin') ? 'underline underline-offset-4' : ''}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Admin Panel
          </Link>
        )}
      </div>

      {/* Desktop Action Controls */}
      <div className="hidden md:flex items-center gap-3">

        {/* Cart Trigger */}
        <button
          onClick={() => setCartOpen(true)}
          className="relative p-2.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-100"
        >
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
              {cartCount}
            </span>
          )}
        </button>

        {/* User Session */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-green-500 to-amber-400 text-white flex items-center justify-center text-xs font-bold capitalize">
                {user.full_name?.charAt(0) || user.email?.charAt(0)}
              </div>
              <span className="text-xs font-medium max-w-[100px] truncate text-slate-700">
                {user.full_name || 'My Profile'}
              </span>
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-100 shadow-xl py-1 z-[101]">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-800 truncate">{user.full_name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
                <Link to="/my-orders" onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">
                  <ClipboardList className="w-4 h-4" /> My Orders
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-orange-500 hover:bg-orange-50">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                )}
                <button onClick={() => { signOut(); setUserDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-500 hover:bg-rose-50 text-left">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate('/orders', { state: { openAuth: true } })}
            className="btn-primary py-1.5 px-4 text-xs shadow-none"
          >
            <User className="w-3.5 h-3.5" /> Sign In
          </button>
        )}
      </div>

      {/* Mobile Actions */}
      <div className="flex md:hidden items-center gap-2">
        <button onClick={() => setCartOpen(true)} className="relative p-2 text-green-600 hover:bg-green-50 rounded-full">
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-xl border-b border-slate-100 p-5 z-[99] flex flex-col gap-3 md:hidden">
          {navLinks.map((link) => (
            <Link key={link.name} to={link.path} onClick={() => setMobileMenuOpen(false)}
              className={`font-semibold py-2 border-b border-slate-50 text-sm ${isActive(link.path) ? 'text-green-600' : 'text-slate-600'}`}>
              {link.name}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" onClick={() => setMobileMenuOpen(false)}
              className="font-semibold text-orange-500 py-2 flex items-center gap-1.5 border-b border-slate-50 text-sm">
              <LayoutDashboard className="w-4 h-4" /> Admin Panel
            </Link>
          )}
          {user ? (
            <div className="flex flex-col gap-3 mt-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-500 to-amber-400 text-white flex items-center justify-center font-bold uppercase text-sm">
                  {user.full_name?.charAt(0) || user.email?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{user.full_name}</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{user.email}</p>
                </div>
              </div>
              <button onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="btn-secondary w-full text-rose-500 border-rose-100 text-xs py-2">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          ) : (
            <button onClick={() => { setMobileMenuOpen(false); navigate('/orders', { state: { openAuth: true } }); }}
              className="btn-primary w-full text-xs py-2 mt-1">
              <User className="w-4 h-4" /> Sign In
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
