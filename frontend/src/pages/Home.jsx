import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, Sparkles, MapPin, CheckCircle, ArrowRight,
  Flame, Award, XCircle, Star, Leaf, Droplets, Timer, Play, Pause
} from 'lucide-react';

const DELIVERY_ZONES = [
  { name: 'Udayagiri / Dasarapalli',  keywords: ['udayagiri', 'dasarapalli', 'dasara palli'] },
  { name: 'Dachuru',                  keywords: ['dachuru'] },
  { name: 'Thirumalapadu',            keywords: ['thirumalapadu', 'thirumallapadu', 'tirumalapadu'] },
  { name: 'Kesamaneni Palli',         keywords: ['kesamaneni', 'kesamanenipalli'] },
  { name: 'Verubotla Palli',          keywords: ['verubotla', 'verubotlapalli'] },
  { name: 'Kanupurupalle',            keywords: ['kanupurupalle', 'kanupurupalli', 'kanupuru'] },
  { name: 'Peramkonda',               keywords: ['peramkonda'] },
  { name: 'Kulluru',                  keywords: ['kulluru'] },
  { name: 'Penubarthi',               keywords: ['penubarthi'] },
  { name: 'Kondur',                   keywords: ['kondur'] },
  { name: 'Rapur area',               keywords: ['rapur'] },
  { name: 'Kaluvoya area',            keywords: ['kaluvoya'] },
  { name: 'Podalakur area',           keywords: ['podalakur', 'podalakuru'] },
];

// Real 4K 3D/realistic blending and pouring videos
const JUICE_VIDEOS = [
  {
    src: 'https://assets.mixkit.co/videos/preview/mixkit-kitchen-blender-blending-fruits-and-yogurt-43204-large.mp4',
    label: 'Fresh Orange Juice',
    color: '#f97316',
    bg: '#fff7ed',
    emoji: '🍊',
  },
  {
    src: 'https://assets.mixkit.co/videos/preview/mixkit-smoothie-being-poured-into-a-glass-40618-large.mp4',
    label: 'Tropical Blend',
    color: '#eab308',
    bg: '#fefce8',
    emoji: '🥭',
  },
  {
    src: 'https://assets.mixkit.co/videos/preview/mixkit-slicing-fresh-fruits-for-a-smoothie-40615-large.mp4',
    label: 'Berry Fresh',
    color: '#e11d48',
    bg: '#fff1f2',
    emoji: '🍓',
  },
];

const featuredProducts = [
  {
    id: 'mango-juice-id',
    name: 'Mango Juice',
    desc: 'Premium Alphonso mango. 100% pure, freshly squeezed.',
    price: '99',
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&q=80&w=600',
    color: '#f59e0b',
    bg: '#fffbeb',
    emoji: '🥭',
    badge: 'Bestseller',
  },
  {
    id: 'strawberry-juice-id',
    name: 'Strawberry Juice',
    desc: 'Sun-ripened strawberries, rich antioxidants in every sip.',
    price: '140',
    image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?auto=format&fit=crop&q=80&w=600',
    color: '#e11d48',
    bg: '#fff1f2',
    emoji: '🍓',
    badge: 'Premium',
  },
  {
    id: 'avocado-shake-id',
    name: 'Avocado Shake',
    desc: 'Buttery smooth avocado blended with honey and nuts.',
    price: '160',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=600',
    color: '#16a34a',
    bg: '#f0fdf4',
    emoji: '🥑',
    badge: 'Exotic',
  },
];

export default function Home() {
  const [locationQuery, setLocationQuery] = useState('');
  const [zoneResult, setZoneResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [fullAddress, setFullAddress] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [detailsSubmitted, setDetailsSubmitted] = useState(false);
  const [activeVideo, setActiveVideo] = useState(0);

  const resetChecker = () => { setZoneResult(null); setDetailsSubmitted(false); setFullAddress(''); setMobileNumber(''); };

  // Auto-rotate videos
  useEffect(() => {
    const t = setInterval(() => setActiveVideo(v => (v + 1) % JUICE_VIDEOS.length), 7000);
    return () => clearInterval(t);
  }, []);

  const handleCheckZone = (e) => {
    e.preventDefault();
    if (!locationQuery.trim()) return;
    setIsChecking(true);
    resetChecker();
    const q = locationQuery.trim().toLowerCase();
    setTimeout(() => {
      const matched = DELIVERY_ZONES.find(z => z.keywords.some(kw => q.includes(kw)));
      setZoneResult(matched ? { eligible: true, matchedZone: matched.name } : { eligible: false });
      setIsChecking(false);
    }, 800);
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    if (!fullAddress.trim() || mobileNumber.trim().length < 10) return;
    setDetailsSubmitted(true);
  };

  const currentVideo = JUICE_VIDEOS[activeVideo];

  return (
    <div className="w-full overflow-hidden bg-white">

      {/* ═══════════════════════════════════════════════════════════════
          HERO — Light theme, Real blending video background
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #fffbf0 0%, #fff7ed 40%, #f0fdf4 100%)' }}>

        {/* Soft background orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(249,115,22,0.07) 0%, transparent 70%)' }} />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center px-6 sm:px-12 py-20 relative z-10">

          {/* LEFT — Hero Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9 }}
            className="flex flex-col gap-6"
          >
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                <Sparkles className="w-3.5 h-3.5" /> Pure Fruit Nectar
              </span>
              <motion.span
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200"
              >
                🔥 First Order 20% OFF — Use FIRST20
              </motion.span>
            </div>

            <div>
              <h1 className="font-display text-5xl sm:text-7xl font-extrabold leading-[1.05] tracking-tight text-slate-900">
                Bismilla
                <br />
                <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-green-500 bg-clip-text text-transparent">
                  Fruit Juice
                </span>
              </h1>
            </div>

            <div className="flex flex-col gap-2.5">
              {[
                { dot: '#22c55e', text: 'Fresh Juice with Pure Fruits — No Added Water' },
                { dot: '#f97316', text: 'Squeezed Live on Order, Packed with Nutrients' },
                { dot: '#eab308', text: 'Chilled Delivery Within 10KM Radius' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.15 }} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.dot }} />
                  <span className="text-slate-600 text-sm font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>

            <p className="text-slate-500 text-sm max-w-md leading-relaxed">
              Quench your thirst with the freshest premium juices in Udayagiri. Squeezed on order, packed with nutrients, delivered chilled to your door.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="btn-primary px-8 py-3.5 text-sm shadow-xl">
                <ShoppingBag className="w-5 h-5" /> Order Now
              </Link>
              <Link to="/products" className="btn-secondary px-8 py-3.5 text-sm">
                Explore Menu <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-10 pt-4 mt-2 border-t border-slate-200">
              {[{ val: '500+', label: 'Happy Customers' }, { val: '10+', label: 'Fresh Varieties' }, { val: '10KM', label: 'Delivery Radius' }].map((s, i) => (
                <div key={i}>
                  <div className="text-2xl font-extrabold text-slate-900">{s.val}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT — Real Juice Blending Video */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, type: 'spring' }}
            className="relative flex flex-col items-center gap-4"
          >
            {/* Video Card */}
            <div className="relative w-full max-w-[480px] rounded-3xl overflow-hidden shadow-2xl border border-white/80"
              style={{ background: currentVideo.bg }}>

              {/* Video */}
              <div className="relative h-[340px] sm:h-[420px] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeVideo}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                  >
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                      src={currentVideo.src}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Gradient overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none" style={{ background: `linear-gradient(to top, ${currentVideo.bg}ee, transparent)` }} />

                {/* Top badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: currentVideo.color }} />
                  <span className="text-xs font-bold text-slate-800">✨ 4K Blending</span>
                </div>

                {/* Video selector */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {JUICE_VIDEOS.map((v, i) => (
                    <button key={i} onClick={() => setActiveVideo(i)}
                      className="w-8 h-8 rounded-full text-lg flex items-center justify-center shadow-md transition-all hover:scale-110 border-2"
                      style={{ background: i === activeVideo ? v.color : 'white', borderColor: i === activeVideo ? v.color : 'transparent' }}
                      title={v.label}
                    >
                      {v.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Bottom Info */}
              <div className="px-6 py-5 flex items-center justify-between" style={{ background: currentVideo.bg }}>
                <div>
                  <p className="font-bold text-slate-900 text-lg">{currentVideo.label}</p>
                  <p className="text-slate-550 text-xs mt-0.5">Freshly blended on every order</p>
                </div>
                <Link to="/products" className="btn-primary py-2.5 px-5 text-xs font-bold shadow-none rounded-xl">
                  Order Now
                </Link>
              </div>
            </div>

            {/* Floating fruit chips */}
            {['🍊', '🥭', '🍓', '🍋', '🍉', '🥝'].map((f, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl pointer-events-none select-none hidden sm:block"
                style={{ top: `${10 + i * 14}%`, right: i % 2 === 0 ? '-6%' : 'auto', left: i % 2 !== 0 ? '-6%' : 'auto' }}
                animate={{ y: [-8, 8, -8], rotate: [-10, 10, -10] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
              >
                {f}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 w-full pointer-events-none overflow-hidden" style={{ height: 70 }}>
          <svg viewBox="0 0 1440 70" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,35 C480,70 960,0 1440,35 L1440,70 L0,70 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          REAL VIDEO BLENDING SECTION — Dedicated juice making showcase
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-primary font-bold text-xs uppercase tracking-widest bg-green-50 px-4 py-1.5 rounded-full border border-green-100">
              Watch it Happen
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-4">
              Real Fresh Blending,
              <span className="text-primary"> Right Before You</span>
            </h2>
            <p className="text-slate-500 text-sm mt-3 max-w-lg mx-auto leading-relaxed">
              Not from a carton. Not pre-made. Every single order is blended fresh using whole fruits, in front of you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                src: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=800',
                title: 'Live Pressing',
                desc: 'Fresh oranges pressed to juice right when you order.',
                color: '#f97316',
                bg: '#fff7ed',
              },
              {
                src: 'https://images.unsplash.com/photo-1595981267035-7b04d84d52fd?auto=format&fit=crop&q=80&w=800',
                title: 'High-Speed Blending',
                desc: 'Whole fruits into smooth nectar in seconds with zero additives.',
                color: '#eab308',
                bg: '#fefce8',
              },
              {
                src: 'https://images.unsplash.com/photo-1622597467836-f38283fb518f?auto=format&fit=crop&q=80&w=800',
                title: 'Poured to Perfection',
                desc: 'Chilled, sealed, and delivered in glass jars — no compromise.',
                color: '#e11d48',
                bg: '#fff1f2',
              },
            ].map((media, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -8 }}
                className="rounded-3xl overflow-hidden shadow-lg border border-slate-100 flex flex-col group transition-all duration-300 hover:shadow-2xl"
                style={{ background: media.bg }}
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    src={media.src}
                    alt={media.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                  <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-full shadow-sm" style={{ color: media.color }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: media.color }} />
                    Live
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-base">{media.title}</h3>
                  <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{media.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          WHY CHOOSE US — Light Cards
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f0fdf4 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-primary font-bold text-xs uppercase tracking-widest bg-green-50 px-4 py-1.5 rounded-full border border-green-100">Our Philosophy</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-4">
              Why Bismilla Juice <br />
              <span className="text-primary">Stands Apart</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { emoji: '🏆', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', title: '100% Pure Fruits', desc: 'No water, no sugar. Only natural fruit goodness every sip.' },
              { emoji: '🔥', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', title: 'Freshly Pressed', desc: 'Every order squeezed live. Full nutrients, no pre-storage.' },
              { emoji: '💧', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', title: 'Hygienically Packed', desc: 'Sealed in food-grade glass jars, delivered chilled.' },
              { emoji: '⚡', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', title: '30 Min Delivery', desc: 'Fast chilled delivery inside our 10KM service radius.' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -10, boxShadow: `0 20px 60px ${f.color}22` }}
                className="p-7 rounded-3xl border flex flex-col gap-4 transition-all duration-300 cursor-default"
                style={{ background: f.bg, borderColor: f.border }}
              >
                <div className="text-4xl">{f.emoji}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
                <div className="h-1 rounded-full mt-auto" style={{ background: f.color, opacity: 0.3 }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURED PRODUCTS — Light Clean Cards
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-14">
            <div>
              <span className="text-primary font-bold text-xs uppercase tracking-widest">Customer Favorites</span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-2">
                Fresh Juice<br /><span className="text-primary">Bestsellers</span>
              </h2>
            </div>
            <Link to="/products" className="btn-secondary text-sm whitespace-nowrap">
              Full Menu <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -12 }}
                className="group rounded-3xl overflow-hidden border border-slate-100 bg-white shadow-lg hover:shadow-2xl transition-all duration-400 flex flex-col"
              >
                <div className="relative h-64 overflow-hidden" style={{ background: p.bg }}>
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <span className="absolute top-4 left-4 bg-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md" style={{ color: p.color }}>
                    {p.emoji} {p.badge}
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-bold text-xl text-slate-900">{p.name}</h3>
                  <p className="text-slate-500 text-sm mt-1.5 leading-relaxed flex-1 line-clamp-2">{p.desc}</p>
                  <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100">
                    <div>
                      <span className="font-black text-2xl text-slate-900">₹{p.price}</span>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                      </div>
                    </div>
                    <Link to="/products" className="btn-primary py-2.5 px-5 text-xs font-bold shadow-none rounded-xl">
                      Order Now
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PROCESS — Light theme, step by step
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: 'linear-gradient(135deg, #fffbf0 0%, #f0fdf4 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 mb-4 inline-block">
              <Leaf className="w-3.5 h-3.5" /> How We Do It
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900">
              From Farm to Your<br />
              <span className="text-primary">Glass Jar 🍃</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-green-200 via-orange-200 to-rose-200 rounded-full" />

            {[
              { step: '01', icon: '🌿', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', title: 'Fresh Sourcing', desc: 'Farm-fresh, ripe, seasonal fruits selected every morning from local farmers.' },
              { step: '02', icon: '🥤', color: '#f97316', bg: '#fff7ed', border: '#fed7aa', title: 'Live Blending', desc: 'Blended fresh on each order using food-safe machines. No pre-storage.' },
              { step: '03', icon: '🚀', color: '#e11d48', bg: '#fff1f2', border: '#fecdd3', title: 'Chilled Delivery', desc: 'Sealed glass jar in insulated bags — at your door within 30 minutes.' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ scale: 1.03 }}
                className="relative p-8 rounded-3xl border flex flex-col gap-4 text-left transition-all duration-300"
                style={{ background: s.bg, borderColor: s.border }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md" style={{ background: 'white' }}>
                  {s.icon}
                </div>
                <div className="absolute top-6 right-6 text-5xl font-black opacity-10" style={{ color: s.color }}>{s.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{s.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="mt-12 text-center">
            <Link to="/products" className="btn-primary px-10 py-4 text-base shadow-xl inline-flex">
              <ShoppingBag className="w-5 h-5" /> Start Your Order
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          DELIVERY CHECKER — Light Card
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="p-8 sm:p-12 rounded-3xl border border-slate-100 shadow-2xl relative overflow-hidden bg-gradient-to-br from-white to-green-50/50"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'rgba(249,115,22,0.06)' }} />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'rgba(34,197,94,0.06)' }} />

            <div className="relative z-10 text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Do We Deliver To You?</h2>
              <p className="text-slate-500 text-sm mt-3 max-w-lg mx-auto leading-relaxed">
                We serve <strong className="text-slate-700">select villages around Udayagiri</strong>. Type your village name to check instantly.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-8 relative z-10">
              {DELIVERY_ZONES.map(z => (
                <span key={z.name} className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">
                  📍 {z.name}
                </span>
              ))}
            </div>

            <form onSubmit={handleCheckZone} className="flex flex-col sm:flex-row gap-3 relative z-10">
              <input type="text" value={locationQuery} onChange={(e) => { setLocationQuery(e.target.value); resetChecker(); }}
                placeholder="Type your village / town name..."
                className="flex-1 px-5 py-4 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm" required />
              <button type="submit" disabled={isChecking} className="btn-primary py-4 px-8 text-sm shrink-0 rounded-xl">
                {isChecking ? '⏳ Checking...' : 'Check Availability'}
              </button>
            </form>

            {zoneResult !== null && !zoneResult.eligible && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="relative z-10 mt-6 p-5 rounded-2xl border bg-rose-50 border-rose-200 flex items-start gap-4">
                <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-700">Sorry, We Don't Deliver There Yet</p>
                  <p className="text-rose-600 text-xs mt-1 leading-relaxed"><strong>"{locationQuery}"</strong> is not in our delivery zone. We only deliver to the areas listed above.</p>
                </div>
              </motion.div>
            )}

            {zoneResult?.eligible && !detailsSubmitted && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 mt-6 flex flex-col gap-5">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left">
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-700">Great! We Deliver to {zoneResult.matchedZone} 🎉</p>
                    <p className="text-emerald-600 text-xs mt-1">Fill your details to proceed to the menu.</p>
                  </div>
                </div>
                <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-left">
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-widest">📋 Your Delivery Details</h3>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Full Address <span className="text-rose-500">*</span></label>
                    <textarea value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} placeholder="House No., Street, Village, Landmark" rows={3} required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none leading-relaxed" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Mobile Number <span className="text-rose-500">*</span></label>
                    <input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" maxLength={10} required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest" />
                    {mobileNumber.length > 0 && mobileNumber.length < 10 && <p className="text-[11px] text-rose-500">{mobileNumber.length}/10 digits</p>}
                  </div>
                  <button type="submit" disabled={!fullAddress.trim() || mobileNumber.length < 10}
                    className="btn-primary w-full py-3 text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
                    Confirm & Continue to Menu <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}

            {detailsSubmitted && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 mt-6 p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-9 h-9 text-white" />
                </div>
                <div>
                  <p className="font-extrabold text-emerald-700 text-xl">You're All Set! 🎉</p>
                  <p className="text-emerald-600 text-sm mt-1">{zoneResult?.matchedZone} · {mobileNumber}</p>
                </div>
                <Link to="/products" className="btn-primary px-10 py-3 text-sm rounded-xl shadow-none">
                  <ShoppingBag className="w-4 h-4" /> Order Now <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
