import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Sparkles, 
  MapPin, 
  CheckCircle, 
  ArrowRight,
  Flame,
  Award,
  Zap,
  XCircle,
  Star,
  Leaf,
  Droplets,
  Timer
} from 'lucide-react';
import { calculateDistance, SHOP_LOCATION } from '../utils/location.js';

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

// Juices for the rotating 3D showcase
const SHOWCASE_JUICES = [
  {
    name: 'Mango Bliss',
    color: 'from-yellow-400 to-orange-400',
    glowColor: 'rgba(251,191,36,0.4)',
    liquid: '#F59E0B',
    liquidLight: '#FCD34D',
    emoji: '🥭',
    price: '₹99',
    desc: 'Premium Alphonso Mango',
    particles: ['🥭', '🌿', '✨'],
  },
  {
    name: 'Orange Gold',
    color: 'from-orange-400 to-red-400',
    glowColor: 'rgba(249,115,22,0.4)',
    liquid: '#EA580C',
    liquidLight: '#FB923C',
    emoji: '🍊',
    price: '₹89',
    desc: 'Fresh Pulpy Oranges',
    particles: ['🍊', '💧', '✨'],
  },
  {
    name: 'Strawberry Rush',
    color: 'from-rose-400 to-pink-500',
    glowColor: 'rgba(244,63,94,0.4)',
    liquid: '#E11D48',
    liquidLight: '#FB7185',
    emoji: '🍓',
    price: '₹140',
    desc: 'Sun-Ripened Strawberries',
    particles: ['🍓', '🌸', '✨'],
  },
  {
    name: 'Watermelon Wave',
    color: 'from-green-400 to-emerald-500',
    glowColor: 'rgba(16,185,129,0.35)',
    liquid: '#059669',
    liquidLight: '#34D399',
    emoji: '🍉',
    price: '₹79',
    desc: 'Chilled Watermelon',
    particles: ['🍉', '🌿', '💧'],
  },
];

// 3D Glass Jar SVG Component
function JuiceGlassJar({ juice, isActive }) {
  return (
    <div className="relative flex flex-col items-center" style={{ filter: isActive ? `drop-shadow(0 0 40px ${juice.glowColor})` : 'none' }}>
      <svg viewBox="0 0 160 220" width="160" height="220" className="overflow-visible">
        {/* Jar shadow */}
        <ellipse cx="80" cy="215" rx="55" ry="8" fill="rgba(0,0,0,0.15)" />

        {/* Jar glass body */}
        <defs>
          <linearGradient id={`glass-${juice.name}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>
          <linearGradient id={`liquid-${juice.name}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={juice.liquidLight} stopOpacity="0.95" />
            <stop offset="100%" stopColor={juice.liquid} stopOpacity="1" />
          </linearGradient>
          <linearGradient id={`lid-${juice.name}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
          </linearGradient>
          <clipPath id={`jar-clip-${juice.name}`}>
            <path d="M30 55 Q28 60 26 80 L20 180 Q20 200 80 200 Q140 200 140 180 L134 80 Q132 60 130 55 Z" />
          </clipPath>
        </defs>

        {/* Liquid fill with animation */}
        <g clipPath={`url(#jar-clip-${juice.name})`}>
          <motion.rect
            x="20" y={isActive ? "75" : "110"}
            width="120" height="125"
            fill={`url(#liquid-${juice.name})`}
            animate={isActive ? { y: [75, 80, 75] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Liquid surface wave */}
          <motion.path
            d={`M20 ${isActive ? 75 : 110} Q50 ${isActive ? 68 : 103} 80 ${isActive ? 75 : 110} Q110 ${isActive ? 82 : 117} 140 ${isActive ? 75 : 110}`}
            fill={juice.liquidLight}
            fillOpacity="0.7"
            animate={isActive ? { d: [
              `M20 75 Q50 68 80 75 Q110 82 140 75`,
              `M20 78 Q50 72 80 78 Q110 84 140 78`,
              `M20 75 Q50 68 80 75 Q110 82 140 75`,
            ]} : {}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Bubbles */}
          {isActive && [1,2,3].map(i => (
            <motion.circle
              key={i}
              cx={40 + i * 30}
              cy={120}
              r={3 + i}
              fill="rgba(255,255,255,0.5)"
              animate={{ cy: [120, 80, 120], opacity: [0, 0.8, 0] }}
              transition={{ duration: 2 + i * 0.5, repeat: Infinity, delay: i * 0.7, ease: 'easeOut' }}
            />
          ))}
        </g>

        {/* Jar glass outline */}
        <path
          d="M30 55 Q28 60 26 80 L20 180 Q20 200 80 200 Q140 200 140 180 L134 80 Q132 60 130 55 Z"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
        />
        {/* Glass shine overlay */}
        <path
          d="M30 55 Q28 60 26 80 L20 180 Q20 200 80 200 Q140 200 140 180 L134 80 Q132 60 130 55 Z"
          fill={`url(#glass-${juice.name})`}
        />

        {/* Jar neck */}
        <rect x="38" y="40" width="84" height="18" rx="4" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />

        {/* Jar lid */}
        <rect x="32" y="28" width="96" height="16" rx="8" fill={`url(#lid-${juice.name})`} stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
        <rect x="52" y="18" width="56" height="14" rx="7" fill={`url(#lid-${juice.name})`} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />

        {/* Shine streaks on glass */}
        <path d="M36 70 Q34 120 36 170" stroke="rgba(255,255,255,0.35)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M46 65 Q44 90 46 115" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>

      {/* Emoji label */}
      <motion.div
        className="absolute -top-4 -right-2 text-4xl"
        animate={isActive ? { rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {juice.emoji}
      </motion.div>
    </div>
  );
}

// Floating Particle
function FloatingParticle({ emoji, delay, x, y }) {
  return (
    <motion.div
      className="absolute text-xl pointer-events-none select-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        y: [-10, -30, -10],
        x: [-5, 5, -5],
        opacity: [0, 1, 0],
        rotate: [0, 360],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {emoji}
    </motion.div>
  );
}

const featuredProducts = [
  {
    id: 'mango-juice-id',
    name: 'Mango Juice',
    description: 'Rich and creamy premium Alphonso mango juice. 100% natural, freshly squeezed, served chilled.',
    price: '99.00',
    category: 'Juices',
    image_url: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&q=80&w=600',
    color: 'from-yellow-400/20 to-orange-400/10',
    badge: '⭐ Bestseller',
  },
  {
    id: 'strawberry-juice-id',
    name: 'Strawberry Juice',
    description: 'Succulent fresh strawberries blended to a refreshing red nectar. Full of antioxidants.',
    price: '140.00',
    category: 'Juices',
    image_url: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?auto=format&fit=crop&q=80&w=600',
    color: 'from-rose-400/20 to-pink-400/10',
    badge: '🔥 Premium',
  },
  {
    id: 'avocado-shake-id',
    name: 'Avocado Shake',
    description: 'Buttery, rich, premium avocado shake sweetened with honey and blended with nuts.',
    price: '160.00',
    category: 'Juices',
    image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=600',
    color: 'from-green-400/20 to-emerald-400/10',
    badge: '💎 Exotic',
  },
];

export default function Home() {
  const [locationQuery, setLocationQuery] = useState('');
  const [zoneResult, setZoneResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [fullAddress, setFullAddress] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [detailsSubmitted, setDetailsSubmitted] = useState(false);
  const [activeJuice, setActiveJuice] = useState(0);
  const [isBlending, setIsBlending] = useState(false);

  const resetChecker = () => { setZoneResult(null); setDetailsSubmitted(false); setFullAddress(''); setMobileNumber(''); };

  // Auto-rotate showcase juice
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveJuice(prev => (prev + 1) % SHOWCASE_JUICES.length);
    }, 3000);
    return () => clearInterval(timer);
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

  const triggerBlend = () => {
    setIsBlending(true);
    setTimeout(() => setIsBlending(false), 2000);
  };

  const currentJuice = SHOWCASE_JUICES[activeJuice];

  return (
    <div className="w-full overflow-hidden">

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION — 3D Glass Jar Showcase
      ═══════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f2a1a 100%)'
      }}>
        {/* Animated background orbs */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: currentJuice.glowColor, filter: 'blur(120px)', top: '10%', right: '-10%' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
          key={activeJuice}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'rgba(16,185,129,0.15)', filter: 'blur(80px)', bottom: '5%', left: '-5%' }}
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        {/* Floating particles */}
        {currentJuice.particles.map((p, i) => (
          <FloatingParticle key={`${activeJuice}-${i}`} emoji={p} delay={i * 1.2} x={10 + i * 30} y={20 + i * 20} />
        ))}

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center px-6 sm:px-12 py-20 relative z-10">

          {/* Left: Hero Text */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9 }}
            className="flex flex-col gap-6 text-left"
          >
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border"
                style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)', color: '#86efac' }}>
                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                Pure Fruit Nectar
              </span>
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border"
                style={{ background: 'rgba(249,115,22,0.15)', borderColor: 'rgba(249,115,22,0.3)', color: '#fb923c' }}
              >
                🔥 First Order 20% OFF — Use FIRST20
              </motion.span>
            </div>

            <div>
              <h1 className="font-display text-5xl sm:text-7xl font-extrabold leading-[1.05] tracking-tight text-white">
                Bismilla
                <br />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeJuice}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.5 }}
                    className={`bg-gradient-to-r ${currentJuice.color.replace('/20', '').replace('/10', '')} bg-clip-text text-transparent`}
                    style={{ backgroundImage: `linear-gradient(to right, ${currentJuice.liquidLight}, ${currentJuice.liquid})` }}
                  >
                    Fruit Juice
                  </motion.span>
                </AnimatePresence>
              </h1>
            </div>

            <div className="flex flex-col gap-2.5 mt-1">
              {[
                { dot: '#22c55e', text: 'Fresh Juice with Pure Fruits — No Added Water' },
                { dot: '#f97316', text: 'Squeezed on Order, Packed with Nutrients' },
                { dot: '#eab308', text: 'Chilled Delivery Within 10KM Radius' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  className="flex items-center gap-3"
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.dot }} />
                  <span className="text-slate-300 text-sm font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 mt-3">
              <Link to="/products" className="btn-primary px-8 py-3.5 text-sm shadow-2xl">
                <ShoppingBag className="w-5 h-5" /> Order Now
              </Link>
              <Link to="/products" className="flex items-center gap-2 px-8 py-3.5 text-sm font-semibold rounded-full border transition-all hover:bg-white/10"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                Explore Menu <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-4 border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              {[
                { val: '500+', label: 'Happy Customers' },
                { val: '10+', label: 'Fresh Varieties' },
                { val: '10KM', label: 'Delivery Radius' },
              ].map((s, i) => (
                <div key={i} className="text-left">
                  <div className="text-2xl font-extrabold text-white">{s.val}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: 3D Juice Glass Jar Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, type: 'spring' }}
            className="flex flex-col items-center justify-center relative"
          >
            {/* Outer ring */}
            <motion.div
              className="absolute w-[400px] h-[400px] rounded-full border-2 border-dashed pointer-events-none"
              style={{ borderColor: `${currentJuice.liquid}40` }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute w-[300px] h-[300px] rounded-full border pointer-events-none"
              style={{ borderColor: `${currentJuice.liquidLight}30` }}
              animate={{ rotate: -360 }}
              transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            />

            {/* Current juice name */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeJuice}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="text-center mb-6 z-10 relative"
              >
                <div className="text-2xl font-extrabold text-white">{currentJuice.name}</div>
                <div className="text-sm text-slate-400">{currentJuice.desc}</div>
                <div className="text-3xl font-black mt-1" style={{ color: currentJuice.liquidLight }}>{currentJuice.price}</div>
              </motion.div>
            </AnimatePresence>

            {/* 3D Jar */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeJuice}
                initial={{ opacity: 0, rotateY: -90, scale: 0.7 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: 90, scale: 0.7 }}
                transition={{ duration: 0.7, type: 'spring' }}
                className="relative z-10"
                style={{ perspective: '800px' }}
              >
                {/* Blending animation overlay */}
                {isBlending && (
                  <motion.div
                    className="absolute inset-0 rounded-full z-20 flex items-center justify-center"
                    style={{ background: `radial-gradient(circle, ${currentJuice.glowColor} 0%, transparent 70%)` }}
                    animate={{ opacity: [0, 0.8, 0], scale: [0.8, 1.5, 0.8] }}
                    transition={{ duration: 2 }}
                  >
                    <div className="text-5xl animate-spin">🌀</div>
                  </motion.div>
                )}
                <JuiceGlassJar juice={currentJuice} isActive={true} />
              </motion.div>
            </AnimatePresence>

            {/* Juice selector dots */}
            <div className="flex gap-3 mt-8 z-10 relative">
              {SHOWCASE_JUICES.map((j, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveJuice(i); triggerBlend(); }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-300 border-2 hover:scale-110"
                  style={{
                    background: i === activeJuice ? `${j.liquid}40` : 'rgba(255,255,255,0.05)',
                    borderColor: i === activeJuice ? j.liquid : 'rgba(255,255,255,0.15)',
                    transform: i === activeJuice ? 'scale(1.2)' : 'scale(1)',
                  }}
                  title={j.name}
                >
                  {j.emoji}
                </button>
              ))}
            </div>

            {/* Blend CTA */}
            <motion.button
              onClick={triggerBlend}
              whileTap={{ scale: 0.92 }}
              className="mt-4 px-5 py-2 rounded-full text-xs font-bold border transition-all z-10 relative"
              style={{ borderColor: `${currentJuice.liquid}60`, color: currentJuice.liquidLight, background: `${currentJuice.liquid}15` }}
            >
              🥤 Watch it Blend!
            </motion.button>
          </motion.div>
        </div>

        {/* Bottom wave divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none" style={{ height: '80px' }}>
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#f8fafc" className="dark:fill-slate-950" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          BENEFITS SECTION
      ═══════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary font-bold text-xs uppercase tracking-widest bg-green-50 dark:bg-green-950/40 px-4 py-1.5 rounded-full border border-green-200/20">
              Our Philosophy
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mt-4">
              Why Bismilla Juice <br />
              <span className="text-primary">Stands Apart</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Award className="w-8 h-8" />,
                color: 'emerald',
                title: '100% Pure Fruits',
                desc: 'Absolutely no added water or processed sugar. Only pure natural fruit goodness in every sip.',
                emoji: '🏆',
              },
              {
                icon: <Flame className="w-8 h-8" />,
                color: 'orange',
                title: 'Freshly Pressed',
                desc: 'Every order squeezed live when you buy — full nutrients and enzymes, never pre-stored.',
                emoji: '🔥',
              },
              {
                icon: <Droplets className="w-8 h-8" />,
                color: 'blue',
                title: 'Hygienically Packed',
                desc: 'Sealed in food-grade glass jars and insulated chilled bags to maintain freshness.',
                emoji: '💧',
              },
              {
                icon: <Timer className="w-8 h-8" />,
                color: 'purple',
                title: 'Fast Delivery',
                desc: 'Delivered within 30–45 minutes inside our 10KM service radius. Hot or cold.',
                emoji: '⚡',
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative p-8 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-5 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-default"
              >
                {/* Animated glow bg */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`}
                  style={{ background: `radial-gradient(circle at 50% 50%, ${f.color === 'emerald' ? 'rgba(16,185,129,0.06)' : f.color === 'orange' ? 'rgba(249,115,22,0.06)' : f.color === 'blue' ? 'rgba(59,130,246,0.06)' : 'rgba(139,92,246,0.06)'}, transparent 70%)` }} />

                <div className="text-4xl">{f.emoji}</div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>

                {/* Bottom border accent */}
                <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 rounded-b-3xl`}
                  style={{ background: f.color === 'emerald' ? '#10b981' : f.color === 'orange' ? '#f97316' : f.color === 'blue' ? '#3b82f6' : '#8b5cf6' }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURED JUICES — Glass Jar Cards
      ═══════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-16"
          >
            <div>
              <span className="text-primary font-bold text-xs uppercase tracking-widest">Customer Favorites</span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mt-2">
                Fresh Juice <br />
                <span className="text-primary">Bestsellers</span>
              </h2>
            </div>
            <Link to="/products" className="btn-secondary text-sm whitespace-nowrap">
              Full Menu <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -12 }}
                className="group relative rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg hover:shadow-2xl transition-all duration-400 flex flex-col"
              >
                {/* Image Container */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Badge */}
                  <span className="absolute top-4 left-4 bg-white/95 dark:bg-slate-900/95 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    {product.badge}
                  </span>

                  {/* Category pill */}
                  <span className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {product.category}
                  </span>

                  {/* Juice jar overlay on hover */}
                  <motion.div
                    className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <div className="text-4xl drop-shadow-2xl">🧃</div>
                  </motion.div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white">{product.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed flex-1 line-clamp-2">{product.description}</p>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="font-black text-2xl text-slate-900 dark:text-white">₹{product.price}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                        <span className="text-[10px] text-slate-400 ml-1">5.0</span>
                      </div>
                    </div>
                    <Link to="/products" className="btn-primary py-2.5 px-5 text-xs font-bold shadow-none rounded-xl">
                      Order Now
                    </Link>
                  </div>
                </div>

                {/* Bottom accent bar */}
                <div className={`absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-700 bg-gradient-to-r ${product.color.replace('/20', '').replace('/10', '').replace('from-', 'from-').replace('to-', 'to-')}`}
                  style={{ background: `linear-gradient(to right, ${i === 0 ? '#f59e0b, #ea580c' : i === 1 ? '#e11d48, #db2777' : '#059669, #10b981'})` }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          BLENDING ANIMATION SECTION
      ═══════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0a2010 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          {['🍊', '🥭', '🍓', '🍉', '🍋', '🍇', '🥝', '🌿'].map((e, i) => (
            <FloatingParticle key={i} emoji={e} delay={i * 0.6} x={5 + i * 13} y={10 + (i % 3) * 30} />
          ))}
        </div>

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border mb-6 inline-block"
              style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)', color: '#86efac' }}>
              <Leaf className="w-3.5 h-3.5" /> How We Blend
            </span>

            <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-6 leading-tight">
              From Farm to Your
              <br />
              <span style={{ backgroundImage: 'linear-gradient(to right, #fbbf24, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Glass Jar 🍃
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed mb-16">
              We source the freshest fruits locally, wash them with purified water, and blend them fresh for each order — sealed in a glass jar and delivered chilled to your door.
            </p>

            {/* 3 Step Process */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '01', icon: '🌿', title: 'Fresh Sourcing', desc: 'Only farm-fresh, ripe, seasonal fruits selected every morning.' },
                { step: '02', icon: '🥤', title: 'Live Blending', desc: 'Blended fresh on order using food-safe machines — no pre-storage.' },
                { step: '03', icon: '🚀', title: 'Chilled Delivery', desc: 'Sealed glass jar packed in insulated bags — delivered in 30 min.' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  whileHover={{ scale: 1.04 }}
                  className="relative p-8 rounded-3xl text-left flex flex-col gap-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="text-5xl">{s.icon}</div>
                  <div className="absolute top-6 right-6 text-4xl font-black opacity-10 text-white">{s.step}</div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-12"
            >
              <Link to="/products" className="btn-primary px-10 py-4 text-base shadow-2xl inline-flex">
                <ShoppingBag className="w-5 h-5" /> Start Your Order
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          DELIVERY CHECKER SECTION
      ═══════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 sm:p-12 rounded-3xl shadow-2xl relative overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(249,115,22,0.1)' }} />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(16,185,129,0.1)' }} />

            <div className="relative z-10 text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-950/50 flex items-center justify-center mx-auto mb-4 shadow-md">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Do We Deliver To You?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 max-w-lg mx-auto leading-relaxed">
                We serve <strong className="text-slate-700 dark:text-slate-200">select villages around Udayagiri</strong>. Type your village to check instantly.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-8 relative z-10">
              {DELIVERY_ZONES.map(z => (
                <span key={z.name} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full">
                  📍 {z.name}
                </span>
              ))}
            </div>

            <form onSubmit={handleCheckZone} className="flex flex-col sm:flex-row gap-3 relative z-10">
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => { setLocationQuery(e.target.value); resetChecker(); }}
                placeholder="Type your village / town name..."
                className="flex-1 px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                required
              />
              <button
                type="submit"
                disabled={isChecking}
                className="btn-primary py-4 px-8 text-sm shrink-0 rounded-xl"
              >
                {isChecking ? '⏳ Checking...' : 'Check Availability'}
              </button>
            </form>

            {zoneResult !== null && !zoneResult.eligible && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 mt-6 p-5 rounded-2xl border bg-rose-50/80 dark:bg-rose-950/20 border-rose-200/50 flex items-start gap-4"
              >
                <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-700 dark:text-rose-300">Sorry, We Don't Deliver There Yet</p>
                  <p className="text-rose-600/80 dark:text-rose-400/80 text-xs mt-1 leading-relaxed">
                    <strong>"{locationQuery}"</strong> is not in our delivery zone. We only deliver to the areas listed above.
                  </p>
                </div>
              </motion.div>
            )}

            {zoneResult?.eligible && !detailsSubmitted && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 mt-6 flex flex-col gap-5">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/50">
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-700 dark:text-emerald-300">Great! We Deliver to {zoneResult.matchedZone} 🎉</p>
                    <p className="text-emerald-600/80 text-xs mt-1">Fill your details to proceed to the menu.</p>
                  </div>
                </div>
                <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-left">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-widest">📋 Your Delivery Details</h3>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Full Address <span className="text-rose-500">*</span></label>
                    <textarea value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} placeholder="House No., Street, Village, Landmark" rows={3} required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none leading-relaxed" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Mobile Number <span className="text-rose-500">*</span></label>
                    <input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" maxLength={10} required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest" />
                    {mobileNumber.length > 0 && mobileNumber.length < 10 && (
                      <p className="text-[11px] text-rose-500">{mobileNumber.length}/10 digits entered</p>
                    )}
                  </div>
                  <button type="submit" disabled={!fullAddress.trim() || mobileNumber.length < 10}
                    className="btn-primary w-full py-3 text-sm font-semibold rounded-xl gap-2 mt-1 disabled:opacity-50 disabled:cursor-not-allowed">
                    Confirm & Continue to Menu <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}

            {detailsSubmitted && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 mt-6 p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/30 border border-emerald-200/60 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-9 h-9 text-white" />
                </div>
                <div>
                  <p className="font-extrabold text-emerald-700 dark:text-emerald-300 text-xl">You're All Set! 🎉</p>
                  <p className="text-emerald-600/80 text-sm mt-1">{zoneResult?.matchedZone} · {mobileNumber}</p>
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
