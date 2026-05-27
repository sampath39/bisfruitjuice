import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Search, SlidersHorizontal, Plus, Minus, ShoppingCart, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api.js';

// Hardcoded fallback data in case database API is not online
const FALLBACK_PRODUCTS = [
  // Juices
  { id: 'j1', name: 'Mango Juice', description: 'Rich and creamy premium Alphonso mango juice. 100% natural, freshly squeezed, served chilled.', price: 99.00, category: 'Juices', image_url: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'j2', name: 'Apple Juice', description: 'Freshly pressed crisp red apples with a hint of cinnamon. Pure fruit goodness, no sugar added.', price: 120.00, category: 'Juices', image_url: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'j3', name: 'Orange Juice', description: 'Zesty and pulpy sweet oranges packed with natural Vitamin C. Freshly squeezed, refreshing taste.', price: 89.00, category: 'Juices', image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'j4', name: 'Watermelon Juice', description: 'Hydrating and light fresh watermelon juice. The perfect summery thirst-quencher.', price: 79.00, category: 'Juices', image_url: 'https://images.unsplash.com/photo-1589733901241-5e514f27b51a?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'j5', name: 'Pineapple Juice', description: 'Tangy and sweet tropical pineapple juice with digestive enzymes and anti-inflammatory benefits.', price: 89.00, category: 'Juices', image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'j6', name: 'Banana Shake', description: 'Smooth and thick banana milkshake loaded with nutrients and blended with cold milk.', price: 99.00, category: 'Juices', image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'j7', name: 'Strawberry Juice', description: 'Succulent fresh strawberries blended to a refreshing red nectar. Full of antioxidants.', price: 140.00, category: 'Juices', image_url: 'https://images.unsplash.com/photo-1587888637140-849b25d80ef9?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'j8', name: 'Mixed Fruit Juice', description: 'A rich cocktail of seasonal fruits, combining orange, apple, pineapple, and pomegranate.', price: 110.00, category: 'Juices', image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'j9', name: 'Avocado Shake', description: 'Buttery, rich, premium avocado shake sweetened with honey and blended with nuts.', price: 160.00, category: 'Juices', image_url: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'j10', name: 'Mosambi Juice', description: 'Freshly extracted sweet lime juice. Lightly salted, sweet, citrusy, and deeply hydrating.', price: 79.00, category: 'Juices', image_url: 'https://images.unsplash.com/photo-1525385133336-254847240f92?auto=format&fit=crop&q=80&w=600', is_available: true },
  // Cool Drinks
  { id: 'd1', name: 'Thums Up 250ml', description: 'Strong, carbonated fizzy cola drink. Served ice cold.', price: 20.00, category: 'Cool Drinks', image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'd2', name: 'Sprite 750ml', description: 'Crisp, refreshing lemon-lime soda. Chill bottle.', price: 45.00, category: 'Cool Drinks', image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'd3', name: 'Coca Cola 1.25L', description: 'Classic fizzy sweet cola drink. Perfect party size.', price: 70.00, category: 'Cool Drinks', image_url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&q=80&w=600', is_available: true },
  // Water Bottles
  { id: 'w1', name: 'Bisleri Mineral Water 1L', description: 'Safe, purified packaged drinking mineral water.', price: 20.00, category: 'Water Bottles', image_url: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'w2', name: 'Kinley Drinking Water 2L', description: 'Double purified bottled water with added minerals.', price: 35.00, category: 'Water Bottles', image_url: 'https://images.unsplash.com/photo-1616118132285-d6023d8650df?auto=format&fit=crop&q=80&w=600', is_available: true },
  // Ice Creams
  { id: 'i1', name: 'Vanilla Delight Scoop', description: 'Creamy Madagascar vanilla bean ice cream scoop.', price: 50.00, category: 'Ice Creams', image_url: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'i2', name: 'Chocolate Fudge Sundae', description: 'Rich chocolate ice cream topped with hot fudge and nuts.', price: 90.00, category: 'Ice Creams', image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'i3', name: 'Butterscotch Cone', description: 'Crispy waffle cone packed with butterscotch crunch and premium ice cream.', price: 60.00, category: 'Ice Creams', image_url: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&q=80&w=600', is_available: true },
  // Cigarettes
  { id: 'c1', name: 'Classic Milds', description: 'Premium rich blend cigarettes. Pack of 20.', price: 190.00, category: 'Cigarettes', image_url: 'https://images.unsplash.com/photo-1556997685-309989c1aa82?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'c2', name: 'Gold Flake Kings', description: 'Smooth, golden-cured premium tobacco cigarettes. Pack of 20.', price: 180.00, category: 'Cigarettes', image_url: 'https://images.unsplash.com/photo-1563201515-adbe4570df44?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'c3', name: 'Marlboro Advance', description: 'Advanced smooth filter cigarettes. Pack of 20.', price: 200.00, category: 'Cigarettes', image_url: 'https://images.unsplash.com/photo-1606240242277-c918ec3391b1?auto=format&fit=crop&q=80&w=600', is_available: true }
];

export default function Products() {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [quantities, setQuantities] = useState({}); // Stores quantity by product id

  // Load products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/products');
        if (response.data && response.data.length > 0) {
          setProducts(response.data);
        } else {
          console.warn('API returned empty product list, using local fallback juices list.');
          setProducts(FALLBACK_PRODUCTS);
        }
      } catch (err) {
        console.warn('API error, falling back to local mock juices list:', err);
        setProducts(FALLBACK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = ['All', 'Juices', 'Cool Drinks', 'Water Bottles', 'Ice Creams', 'Cigarettes'];

  // Handle quantity changes per product card
  const handleQuantityChange = (productId, delta) => {
    const currentQty = quantities[productId] || 1;
    const nextQty = Math.max(1, currentQty + delta);
    setQuantities({ ...quantities, [productId]: nextQty });
  };

  const handleAddToCart = (product) => {
    const qty = quantities[product.id] || 1;
    addToCart(product, qty);
    showToast(`Added ${qty} x ${product.name} to cart!`, 'success');
    // Reset quantity input to 1 after adding
    setQuantities({ ...quantities, [product.id]: 1 });
  };

  // Filter products by search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.is_available;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col gap-10 min-h-[80vh]">
      {/* Title Header */}
      <div className="text-left space-y-2">
        <span className="text-primary font-bold text-xs uppercase tracking-widest bg-green-50 dark:bg-green-950/40 px-3.5 py-1 rounded-full border border-green-200/10">Our Menu</span>
        <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mt-1">Fresh Squeezed Nectars</h1>
        <p className="text-slate-450 text-sm max-w-lg leading-relaxed">
          Choose from our selection of premium, 100% natural fruit juices and creamy milkshakes. Squeezed only when you order.
        </p>
      </div>

      {/* Search & Category Filter Controls bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        
        {/* Search input */}
        <div className="relative w-full lg:max-w-md">
          <Search className="w-4.5 h-4.5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fresh juices (e.g. Mango, Avocado)..."
            className="w-full pl-11 pr-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        {/* Categories Tab pills */}
        <div className="flex gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid displaying cards */}
      {loading ? (
        // Skeleton Loaders
        <div className="grid-responsive">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <div key={num} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
              <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-5 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3.5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="flex justify-between items-center mt-4">
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        // Empty State search matches
        <div className="flex flex-col items-center justify-center text-center py-20 gap-4 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-8">
          <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-citrus-orange">
            <Info className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-800 dark:text-white">No Juices Found</h3>
            <p className="text-slate-500 dark:text-slate-450 text-xs sm:text-sm mt-1 max-w-[280px]">
              We couldn't find any fresh juices matching your criteria. Try adjusting your query or filter.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="btn-secondary text-xs px-6 py-2"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        // Products Cards Grid
        <div className="grid-responsive">
          {filteredProducts.map((product) => {
            const cardQty = quantities[product.id] || 1;

            return (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col group hover:border-green-300/40 hover:shadow-2xl transition-all duration-300"
              >
                {/* Product Image */}
                <div className="h-52 overflow-hidden bg-slate-100 relative shrink-0">
                  <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=400'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 text-xs font-semibold px-3 py-1 rounded-full text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100/10">
                    {product.category}
                  </span>
                </div>

                {/* Details */}
                <div className="p-5 flex flex-col flex-1 text-left justify-between">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white leading-tight">{product.name}</h3>
                    <p className="text-slate-550 dark:text-slate-400 text-xs leading-relaxed line-clamp-2">{product.description}</p>
                  </div>

                  {/* Quantity and Actions bottom panel */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xl text-slate-800 dark:text-white">₹{parseFloat(product.price).toFixed(2)}</span>
                      
                      {/* Card quantity counter */}
                      <div className="flex items-center border border-slate-200 dark:border-slate-750 rounded-lg py-0.5 px-1.5 bg-slate-50 dark:bg-slate-950">
                        <button
                          onClick={() => handleQuantityChange(product.id, -1)}
                          className="p-1 text-slate-550 dark:text-slate-400 hover:text-primary"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-slate-800 dark:text-slate-250">{cardQty}</span>
                        <button
                          onClick={() => handleQuantityChange(product.id, 1)}
                          className="p-1 text-slate-550 dark:text-slate-400 hover:text-primary"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      className="btn-primary w-full py-2.5 text-xs font-semibold rounded-xl"
                    >
                      <ShoppingCart className="w-4 h-4 shrink-0" /> Add to Cart
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
