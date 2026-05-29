import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { 
  ShoppingBag, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  User, 
  LogOut, 
  LayoutDashboard,
  ClipboardList
} from 'lucide-react';

export default function Navbar() {
  const { user, signOut, isAdmin } = useAuth();
  const { cartCount, setCartOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize Dark Mode from localStorage or system preference
  useEffect(() => {
    const isDark = 
      localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setDarkMode(isDark);
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Menu', path: '/products' },
    { name: 'My Orders', path: '/orders' }
  ];

  return (
    <nav className="glass-nav sticky top-0 z-[100] px-4 sm:px-8 py-3.5 flex justify-between items-center transition-all duration-300">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2 group">
        <span className="bg-gradient-to-tr from-primary to-citrus-yellow p-2 rounded-xl text-white shadow-md transform group-hover:rotate-12 transition-transform duration-300">
          <ShoppingBag className="w-5 h-5" />
        </span>
        <span className="font-display text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-citrus-orange bg-clip-text text-transparent">
          Bismilla <span className="text-citrus-yellow-dark dark:text-citrus-yellow font-sans text-sm font-semibold tracking-wider block -mt-1 uppercase">Fruit Juice</span>
        </span>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`font-medium transition-colors text-sm hover:text-primary ${
              isActive(link.path) 
                ? 'text-primary dark:text-primary' 
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {link.name}
          </Link>
        ))}

        {isAdmin && (
          <Link
            to="/admin"
            className={`font-semibold flex items-center gap-1 text-sm transition-colors text-citrus-orange hover:text-citrus-orange-dark ${
              isActive('/admin') ? 'underline underline-offset-4' : ''
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Admin Panel
          </Link>
        )}
      </div>

      {/* Action Controls */}
      <div className="hidden md:flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Cart Trigger */}
        <button
          onClick={() => setCartOpen(true)}
          className="relative p-2.5 rounded-full bg-green-50 dark:bg-green-950/40 text-primary hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
        >
          <ShoppingBag className="w-5.5 h-5.5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-citrus-orange text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
              {cartCount}
            </span>
          )}
        </button>

        {/* User Session Handler */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-citrus-yellow text-white flex items-center justify-center text-xs font-bold capitalize">
                {user.full_name?.charAt(0) || user.email?.charAt(0)}
              </div>
              <span className="text-xs font-medium max-w-[100px] truncate text-slate-700 dark:text-slate-300">
                {user.full_name || 'My Profile'}
              </span>
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl py-1 z-[101]">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{user.full_name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
                
                <Link
                  to="/orders"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ClipboardList className="w-4 h-4" /> My Orders
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-citrus-orange hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                )}

                <button
                  onClick={() => {
                    signOut();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
                >
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

      {/* Mobile Actions (Menu Toggle + Cart Toggle) */}
      <div className="flex md:hidden items-center gap-3">
        {/* Mobile Cart Trigger */}
        <button
          onClick={() => setCartOpen(true)}
          className="relative p-2 text-primary hover:bg-green-50 dark:hover:bg-green-950/20 rounded-full"
        >
          <ShoppingBag className="w-5.5 h-5.5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-citrus-orange text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>

        {/* Mobile Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-slate-600 dark:text-slate-300"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Mobile Menu Trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-600 dark:text-slate-300"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white dark:bg-slate-900 shadow-lg border-b border-slate-100 dark:border-slate-800 p-5 z-[99] flex flex-col gap-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`font-semibold py-1.5 border-b border-slate-50 dark:border-slate-800/50 ${
                isActive(link.path) ? 'text-primary' : 'text-slate-600 dark:text-slate-350'
              }`}
            >
              {link.name}
            </Link>
          ))}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="font-semibold text-citrus-orange py-1.5 flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800/50"
            >
              <LayoutDashboard className="w-4 h-4" /> Admin Panel
            </Link>
          )}

          {user ? (
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold uppercase">
                  {user.full_name?.charAt(0) || user.email?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user.full_name}</p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="btn-secondary w-full text-rose-500 border-rose-100 dark:border-rose-950/20 text-xs py-2 mt-1"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/orders', { state: { openAuth: true } });
              }}
              className="btn-primary w-full text-xs py-2 mt-1"
            >
              <User className="w-4 h-4" /> Sign In
            </button>
          )}

        </div>
      )}
    </nav>
  );
}
