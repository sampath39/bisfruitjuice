import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Sparkles, 
  MapPin, 
  CheckCircle, 
  ArrowRight,
  Flame,
  Award,
  Zap,
  Phone,
  Home as HomeIcon,
  XCircle,
  Send
} from 'lucide-react';
import { calculateDistance, SHOP_LOCATION } from '../utils/location.js';

// ── Strict delivery whitelist ─────────────────────────────────────────────
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

export default function Home() {
  const [locationQuery, setLocationQuery]         = useState('');
  const [zoneResult, setZoneResult]               = useState(null);
  const [isChecking, setIsChecking]               = useState(false);
  const [fullAddress, setFullAddress]             = useState('');
  const [mobileNumber, setMobileNumber]           = useState('');
  const [detailsSubmitted, setDetailsSubmitted]   = useState(false);

  const resetChecker = () => { setZoneResult(null); setDetailsSubmitted(false); setFullAddress(''); setMobileNumber(''); };

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

  const featuredProducts = [
    {
      id: 'mango-juice-id',
      name: 'Mango Juice',
      description: 'Rich and creamy premium Alphonso mango juice. 100% natural, freshly squeezed, served chilled.',
      price: '99.00',
      category: 'Juices',
      image_url: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'strawberry-juice-id',
      name: 'Strawberry Juice',
      description: 'Succulent fresh strawberries blended to a refreshing red nectar. Full of antioxidants.',
      price: '140.00',
      category: 'Juices',
      image_url: 'https://images.unsplash.com/photo-1587888637140-849b25d80ef9?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'avocado-shake-id',
      name: 'Avocado Shake',
      description: 'Buttery, rich, premium avocado shake sweetened with honey and blended with nuts.',
      price: '160.00',
      category: 'Juices',
      image_url: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=400'
    }
  ];

  return (
    <div className="w-full overflow-hidden">
      {/* 1. HERO BANNER SECTION */}
      <section className="relative min-h-[85vh] flex items-center bg-gradient-to-br from-emerald-50 via-orange-50/30 to-yellow-50/50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950/80 px-6 sm:px-12 py-16">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/10 w-72 h-72 bg-green-200/40 dark:bg-emerald-950/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-orange-200/30 dark:bg-orange-950/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Hero Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-6 text-left"
          >
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-350 text-xs font-semibold w-max border border-emerald-200/40">
                <Sparkles className="w-4 h-4 animate-spin-slow" /> Pure Fruit Nectar
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-350 text-xs font-semibold w-max border border-orange-200/40 animate-pulse">
                🔥 First Order 20% OFF: Code FIRST20
              </div>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight">
              Bismilla <br />
              <span className="bg-gradient-to-r from-primary via-citrus-orange to-citrus-yellow-dark bg-clip-text text-transparent">
                Fruit Juice
              </span>
            </h1>

            {/* Slogans */}
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>Fresh Juice with Pure Fruits</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
                <span className="h-2 w-2 rounded-full bg-citrus-orange" />
                <span>No Added Sugar</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
                <span className="h-2 w-2 rounded-full bg-citrus-yellow-dark" />
                <span>No Added Water</span>
              </div>
            </div>

            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-lg leading-relaxed mt-2">
              Quench your thirst with the freshest premium juices in town. Squeezed on order, packed with nutrients, and delivered straight to your door chilled.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mt-4">
              <Link to="/products" className="btn-primary px-8 py-3 text-sm sm:text-base shadow-lg">
                <ShoppingBag className="w-5 h-5" /> Order Now
              </Link>
              <Link to="/products" className="btn-secondary px-8 py-3 text-sm sm:text-base">
                Explore Juices <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Hero Right: 3D Juice Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="flex justify-center items-center relative"
          >
            {/* Spinning background decor */}
            <div className="absolute w-[350px] sm:w-[450px] h-[350px] sm:h-[450px] border-2 border-dashed border-green-300/40 dark:border-green-800/30 rounded-full animate-spin-slow pointer-events-none" />

            <div className="relative group perspective-1000">
              <motion.div 
                whileHover={{ rotateY: 15, rotateX: -5 }}
                className="relative z-10 transition-transform duration-500 preserve-3d"
              >
                {/* Main Showcase Image (Glassmorphic Mockup) */}
                <div className="relative overflow-hidden w-[280px] sm:w-[350px] h-[380px] sm:h-[480px] rounded-3xl border border-white/30 dark:border-slate-800/50 bg-gradient-to-tr from-white/40 to-white/10 dark:from-slate-900/30 dark:to-slate-900/10 backdrop-blur-xl shadow-2xl p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="bg-white/80 dark:bg-slate-800/80 px-3 py-1 rounded-full text-[10px] font-bold text-citrus-orange shadow-sm border border-slate-100/10">
                      🔥 Best Seller
                    </span>
                  </div>

                  {/* High Quality Juice Glass Image */}
                  <img
                    src="https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=400"
                    alt="Premium Orange Juice"
                    className="w-full h-3/5 object-cover rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-350"
                  />

                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-850 dark:text-white">Pulpy Orange Gold</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Rich in Vitamin C, 100% natural extract</p>
                  </div>
                </div>

                {/* Overlapping back cards to give depth */}
                <div className="absolute top-10 -left-10 w-[200px] h-[280px] rounded-2xl border border-white/20 bg-white/20 dark:bg-slate-800/20 backdrop-blur-md -z-10 shadow-lg p-4 flex flex-col justify-between transform -rotate-12 transition-transform group-hover:-rotate-15">
                  <img
                    src="https://images.unsplash.com/photo-1587888637140-849b25d80ef9?auto=format&fit=crop&q=80&w=200"
                    alt="Strawberry"
                    className="w-full h-1/2 object-cover rounded-xl"
                  />
                  <p className="font-semibold text-xs text-slate-700 dark:text-slate-200">Strawberry Chiller</p>
                </div>

                <div className="absolute bottom-10 -right-10 w-[180px] h-[260px] rounded-2xl border border-white/20 bg-white/20 dark:bg-slate-800/20 backdrop-blur-md -z-10 shadow-lg p-4 flex flex-col justify-between transform rotate-12 transition-transform group-hover:rotate-15">
                  <img
                    src="https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=200"
                    alt="Banana Shake"
                    className="w-full h-1/2 object-cover rounded-xl"
                  />
                  <p className="font-semibold text-xs text-slate-700 dark:text-slate-200 text-right">Banana Nutty Shake</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. WHY CHOOSE US SECTION */}
      <section className="py-20 px-6 bg-white dark:bg-slate-900 border-t border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="text-primary font-bold text-xs uppercase tracking-widest bg-green-50 dark:bg-green-950/40 px-4 py-1.5 rounded-full border border-green-200/20">Our Philosophy</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Why Bismilla Juice is Special</h2>
            <p className="text-slate-400 text-sm max-w-md mt-2">We focus on health and freshness above all else. Here is how we differ from ordinary shops.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {[
              {
                icon: <Award className="w-7 h-7 text-emerald-500" />,
                title: '100% Pure Fruits',
                desc: 'Absolutely no added water, and no processed sugar. You get only pure, natural fruit goodness in every single sip.'
              },
              {
                icon: <Flame className="w-7 h-7 text-citrus-orange" />,
                title: 'Freshly Pressed',
                desc: 'We never store pre-pressed juices. Every order is squeezed live only when you buy, retaining full nutrients and enzymes.'
              },
              {
                icon: <Zap className="w-7 h-7 text-citrus-yellow-dark" />,
                title: 'Chilled Local Delivery',
                desc: 'Delivered in insulated chilled bags within a 10KM radius from our shop, keeping the temperature cold and flavors alive.'
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -8 }}
                className="p-8 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center text-center gap-4 group hover:border-green-300 dark:hover:border-green-900/30 transition-all duration-300 shadow-sm hover:shadow-lg"
              >
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-md transform group-hover:rotate-6 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white mt-1">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS SECTION */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-950/40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-12">
            <div className="text-left">
              <span className="text-primary font-bold text-xs uppercase tracking-widest">Customer Favorites</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">Featured Fresh Juices</h2>
            </div>
            <Link to="/products" className="btn-secondary text-sm">
              View Entire Menu <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <div 
                key={product.id}
                className="glass-card rounded-2xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800 group hover:border-green-300/40 hover:shadow-2xl transition-all duration-300"
              >
                <div className="relative h-60 overflow-hidden shrink-0">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 text-xs font-semibold px-3 py-1 rounded-full text-slate-800 dark:text-white shadow-sm">
                    {product.category}
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-1 text-left justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{product.name}</h3>
                    <p className="text-slate-550 dark:text-slate-400 text-xs line-clamp-2 leading-relaxed">{product.description}</p>
                  </div>
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-lg text-slate-800 dark:text-white">₹{product.price}</span>
                    <Link to="/products" className="btn-primary py-2 px-4 text-xs font-semibold shadow-none rounded-lg">
                      Order Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. DELIVERY CHECKER SECTION */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-tr from-emerald-50/40 via-white to-orange-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950/60 border-t border-slate-150 dark:border-slate-850">
        <div className="max-w-3xl mx-auto glass-card p-6 sm:p-10 rounded-3xl shadow-xl text-center flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-200/20 dark:bg-orange-950/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-green-200/20 dark:bg-green-950/10 rounded-full blur-2xl pointer-events-none" />

          {/* Heading */}
          <div className="flex flex-col items-center gap-3 relative z-10">
            <div className="p-4 bg-green-50 dark:bg-green-950/50 rounded-2xl text-primary w-max shadow-sm">
              <MapPin className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Do We Deliver To You?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg leading-relaxed">
              We serve <strong className="text-slate-700 dark:text-slate-200">select villages and towns</strong> around Udayagiri (Dasarapalli Village).
              Type your village name below to check instantly.
            </p>
          </div>

          {/* Allowed zone badges */}
          <div className="flex flex-wrap justify-center gap-2 relative z-10">
            {DELIVERY_ZONES.map(z => (
              <span key={z.name} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full">
                📍 {z.name}
              </span>
            ))}
          </div>

          {/* Zone check input */}
          <form onSubmit={handleCheckZone} className="flex flex-col sm:flex-row gap-3 relative z-10">
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => { setLocationQuery(e.target.value); resetChecker(); }}
              placeholder="Type your village / town name (e.g. Dachuru, Rapur...)"
              className="flex-1 px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              required
            />
            <button
              type="submit"
              disabled={isChecking}
              className="btn-primary py-3.5 sm:py-3 px-7 text-sm shrink-0 whitespace-nowrap rounded-xl"
            >
              {isChecking ? '⏳ Checking...' : 'Check Availability'}
            </button>
          </form>

          {/* Not eligible result */}
          {zoneResult !== null && !zoneResult.eligible && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 p-5 rounded-2xl border bg-rose-50/80 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/40 text-left flex items-start gap-4"
            >
              <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-700 dark:text-rose-300 text-base">Sorry, We Don't Deliver There Yet</p>
                <p className="text-rose-600/80 dark:text-rose-400/80 text-xs mt-1 leading-relaxed">
                  <strong>"{locationQuery}"</strong> is not in our delivery zone. We only deliver to the areas listed above.
                </p>
              </div>
            </motion.div>
          )}

          {/* Eligible — show details form */}
          {zoneResult?.eligible && !detailsSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 flex flex-col gap-5"
            >
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40 text-left">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-700 dark:text-emerald-300 text-base">Great! We Deliver to {zoneResult.matchedZone} 🎉</p>
                  <p className="text-emerald-600/80 dark:text-emerald-400/80 text-xs mt-1">Please fill your full address and mobile number below.</p>
                </div>
              </div>

              <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 sm:p-6 text-left shadow-sm">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-widest">📋 Your Delivery Details</h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Full Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="House No., Street, Village, Landmark, Pincode"
                    rows={3}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none leading-relaxed"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all font-mono tracking-widest"
                  />
                  {mobileNumber.length > 0 && mobileNumber.length < 10 && (
                    <p className="text-[11px] text-rose-500">{mobileNumber.length}/10 digits entered</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!fullAddress.trim() || mobileNumber.length < 10}
                  className="btn-primary w-full py-3 text-sm font-semibold rounded-xl gap-2 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm &amp; Continue to Menu <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}

          {/* Final confirmation */}
          {detailsSubmitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-center flex flex-col items-center gap-4"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-extrabold text-emerald-700 dark:text-emerald-300 text-lg">You're All Set! 🎉</p>
                <p className="text-emerald-600/80 dark:text-emerald-400/80 text-sm mt-1 leading-relaxed">
                  Location: <strong>{zoneResult?.matchedZone}</strong> · Mobile: <strong>{mobileNumber}</strong>
                </p>
              </div>
              <Link to="/products" className="btn-primary px-8 py-3 text-sm rounded-xl shadow-none">
                <ShoppingBag className="w-4 h-4" /> Order Now <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}

