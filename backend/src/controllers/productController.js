import { supabase, isMockMode } from '../config/db.js';

// Seed catalog for mock bypass mode
const MOCK_PRODUCTS = [
  // 1. JUICES
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

  // 2. CIGARETTES
  { id: 'c1', name: 'Classic Milds', description: 'Premium rich blend cigarettes. Pack of 20.', price: 190.00, category: 'Cigarettes', image_url: 'https://images.unsplash.com/photo-1556997685-309989c1aa82?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'c2', name: 'Gold Flake Kings', description: 'Smooth, golden-cured premium tobacco cigarettes. Pack of 20.', price: 180.00, category: 'Cigarettes', image_url: 'https://images.unsplash.com/photo-1563201515-adbe4570df44?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'c3', name: 'Marlboro Advance', description: 'Advanced smooth filter cigarettes. Pack of 20.', price: 200.00, category: 'Cigarettes', image_url: 'https://images.unsplash.com/photo-1606240242277-c918ec3391b1?auto=format&fit=crop&q=80&w=600', is_available: true },

  // 3. COOL DRINKS
  { id: 'd1', name: 'Thums Up 250ml', description: 'Strong, carbonated fizzy cola drink. Served ice cold.', price: 20.00, category: 'Cool Drinks', image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'd2', name: 'Sprite 750ml', description: 'Crisp, refreshing lemon-lime soda. Chill bottle.', price: 45.00, category: 'Cool Drinks', image_url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'd3', name: 'Coca Cola 1.25L', description: 'Classic fizzy sweet cola drink. Perfect party size.', price: 70.00, category: 'Cool Drinks', image_url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&q=80&w=600', is_available: true },

  // 4. WATER BOTTLES
  { id: 'w1', name: 'Bisleri Mineral Water 1L', description: 'Safe, purified packaged drinking mineral water.', price: 20.00, category: 'Water Bottles', image_url: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'w2', name: 'Kinley Drinking Water 2L', description: 'Double purified bottled water with added minerals.', price: 35.00, category: 'Water Bottles', image_url: 'https://images.unsplash.com/photo-1616118132285-d6023d8650df?auto=format&fit=crop&q=80&w=600', is_available: true },

  // 5. ICE CREAMS
  { id: 'i1', name: 'Vanilla Delight Scoop', description: 'Creamy Madagascar vanilla bean ice cream scoop.', price: 50.00, category: 'Ice Creams', image_url: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'i2', name: 'Chocolate Fudge Sundae', description: 'Rich chocolate ice cream topped with hot fudge and nuts.', price: 90.00, category: 'Ice Creams', image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=600', is_available: true },
  { id: 'i3', name: 'Butterscotch Cone', description: 'Crispy waffle cone packed with butterscotch crunch and premium ice cream.', price: 60.00, category: 'Ice Creams', image_url: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&q=80&w=600', is_available: true }
];

let inMemoryProducts = [...MOCK_PRODUCTS];

// Get all products
export const getProducts = async (req, res) => {
  try {
    if (isMockMode) {
      return res.json(inMemoryProducts);
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(products);
  } catch (err) {
    console.error('Error in getProducts:', err);
    res.status(500).json({ error: 'Failed to fetch products', fallback: MOCK_PRODUCTS });
  }
};

// Get single product
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isMockMode) {
      const prod = inMemoryProducts.find(p => p.id === id);
      if (!prod) return res.status(404).json({ error: 'Product not found' });
      return res.json(prod);
    }

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' });
      }
      throw error;
    }
    res.json(product);
  } catch (err) {
    console.error('Error in getProductById:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// Create product (Admin only)
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image_url, is_available } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const newProdPayload = {
      name,
      description,
      price: parseFloat(price),
      category: category || 'Juices',
      image_url: image_url || '',
      is_available: is_available !== undefined ? is_available : true
    };

    if (isMockMode) {
      const mockResult = {
        id: `p_mock_${Math.random().toString(36).substring(2, 9)}`,
        created_at: new Date().toISOString(),
        ...newProdPayload
      };
      inMemoryProducts.unshift(mockResult);
      return res.status(201).json(mockResult);
    }

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert([newProdPayload])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(newProduct);
  } catch (err) {
    console.error('Error in createProduct:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// Update product (Admin only)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image_url, is_available } = req.body;

    if (isMockMode) {
      const idx = inMemoryProducts.findIndex(p => p.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Product not found' });
      
      const updated = {
        ...inMemoryProducts[idx],
        name: name !== undefined ? name : inMemoryProducts[idx].name,
        description: description !== undefined ? description : inMemoryProducts[idx].description,
        price: price !== undefined ? parseFloat(price) : inMemoryProducts[idx].price,
        category: category !== undefined ? category : inMemoryProducts[idx].category,
        image_url: image_url !== undefined ? image_url : inMemoryProducts[idx].image_url,
        is_available: is_available !== undefined ? is_available : inMemoryProducts[idx].is_available
      };
      inMemoryProducts[idx] = updated;
      return res.json(updated);
    }

    const { data: existing, error: existError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .single();

    if (existError || !existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (category !== undefined) updateData.category = category;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (is_available !== undefined) updateData.is_available = is_available;

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(updatedProduct);
  } catch (err) {
    console.error('Error in updateProduct:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete product (Admin only)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMockMode) {
      inMemoryProducts = inMemoryProducts.filter(p => p.id !== id);
      return res.json({ message: 'Product deleted successfully' });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error in deleteProduct:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Upload Product Image to Supabase Storage (Admin only)
export const uploadProductImage = async (req, res) => {
  try {
    const { fileBase64, fileName, fileType } = req.body;
    
    if (!fileBase64 || !fileName) {
      return res.status(400).json({ error: 'fileBase64 and fileName are required' });
    }

    if (isMockMode) {
      return res.json({ imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=600' });
    }

    const buffer = Buffer.from(fileBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const bucketName = 'juice-images';
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: fileType || 'image/jpeg',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    res.json({ imageUrl: publicUrl });
  } catch (err) {
    console.error('Error in uploadProductImage:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};
