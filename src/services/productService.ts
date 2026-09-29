import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface AiGradeData {
  grade: 'A' | 'B' | 'C';
  detectedProduct: string;
  confidence: number;
  model: string;
  analyzedImages: number;
  analyzedAt: any;
}

export interface ProductListing {
  // Primary Firebase fields (Section 4 & 5)
  productId: string;
  farmerId: string;
  farmerName: string;
  farmerPhone?: string;
  productName: string;
  category: string;
  grade: 'A' | 'B' | 'C';
  quantity: number | string;
  unit: string;
  marketPrice: number;
  optimizedPriceMin: number;
  optimizedPriceMax: number;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  imageUrls: string[];
  description: string;
  status: 'active' | 'deleted' | 'sold_out' | 'pending' | 'Active' | 'Sold Out' | 'Pending';
  aiGradeData?: AiGradeData;
  createdAt?: any;
  updatedAt?: any;

  // Compatibility fields for existing UI components
  id: string;
  name: string;
  variety?: string;
  price: string;
  views: number;
  date?: string;
  pricePerUnit?: string;
  harvestDate?: string;
  displayPrice?: string;
  recommendedMinPrice?: number;
  recommendedMaxPrice?: number;
  quantityKg?: number;
  estimatedMinValue?: number;
  estimatedMaxValue?: number;
  qualityScore?: number;
  detectionConfidence?: number;
  qualityConfidence?: number;
  mandiPrice?: number;
  mandiMarket?: string;
  mandiLocation?: string;
  mandiUnit?: string;
  mandiPriceTimestamp?: string;
  pricingRule?: string;
  modelVersion?: string;
  images?: string[];
  rating?: number;
}

// Default initial products stored in Firestore on first startup if empty
export const INITIAL_PRODUCTS_SEED: Omit<ProductListing, 'productId' | 'id'>[] = [
  {
    farmerId: 'farmer-default-murugan',
    farmerName: 'Murugan S.',
    farmerPhone: '+91 98421 55670',
    productName: 'Country Tomato',
    name: 'Country Tomato (Grade A)',
    variety: 'Fresh Farm Harvest',
    category: 'Vegetable',
    grade: 'A',
    quantity: 450,
    unit: 'kg',
    marketPrice: 40,
    optimizedPriceMin: 36,
    optimizedPriceMax: 42,
    price: '₹38 / kg',
    pricePerUnit: '38',
    location: 'Madurai Rural, Tamil Nadu',
    latitude: 9.9252,
    longitude: 78.1198,
    imageUrls: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80'],
    images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80'],
    description: 'Crisp, organically ripened country tomatoes harvested at dawn. High lycopene, uniform red hue.',
    status: 'active',
    views: 142,
    date: 'Today',
    harvestDate: 'Tomorrow',
    aiGradeData: {
      grade: 'A',
      detectedProduct: 'Tomato',
      confidence: 0.96,
      model: 'YOLOv8 + CNN',
      analyzedImages: 4,
      analyzedAt: new Date().toISOString(),
    },
  },
  {
    farmerId: 'farmer-default-murugan',
    farmerName: 'Murugan S.',
    farmerPhone: '+91 98421 55670',
    productName: 'Small Shallot Onions',
    name: 'Small Shallot Onions (Grade A)',
    variety: 'Bellary Pink',
    category: 'Vegetable',
    grade: 'A',
    quantity: 800,
    unit: 'kg',
    marketPrice: 48,
    optimizedPriceMin: 44,
    optimizedPriceMax: 50,
    price: '₹46 / kg',
    pricePerUnit: '46',
    location: 'Oddanchatram, Dindigul',
    latitude: 10.4784,
    longitude: 77.7471,
    imageUrls: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&auto=format&fit=crop&q=80'],
    images: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&auto=format&fit=crop&q=80'],
    description: 'Top-grade pink shallots with rich pungent aroma. Ideal for sambar and commercial culinary use.',
    status: 'active',
    views: 118,
    date: 'Yesterday',
    harvestDate: 'Harvested Yesterday',
    aiGradeData: {
      grade: 'A',
      detectedProduct: 'Onion',
      confidence: 0.94,
      model: 'YOLOv8 + CNN',
      analyzedImages: 4,
      analyzedAt: new Date().toISOString(),
    },
  },
  {
    farmerId: 'farmer-default-murugan',
    farmerName: 'Murugan S.',
    farmerPhone: '+91 98421 55670',
    productName: 'Fresh Green Chillies',
    name: 'Fresh Green Chillies (Grade B)',
    variety: 'Guntur Spicy',
    category: 'Vegetable',
    grade: 'B',
    quantity: 200,
    unit: 'kg',
    marketPrice: 58,
    optimizedPriceMin: 52,
    optimizedPriceMax: 56,
    price: '₹55 / kg',
    pricePerUnit: '55',
    location: 'Paramathi Velur, Namakkal',
    latitude: 11.0772,
    longitude: 78.0125,
    imageUrls: ['https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80'],
    images: ['https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=800&auto=format&fit=crop&q=80'],
    description: 'Crisp green chillies with high heat quotient. Handpicked and graded.',
    status: 'active',
    views: 89,
    date: '2 days ago',
    harvestDate: '2 days ago',
    aiGradeData: {
      grade: 'B',
      detectedProduct: 'Green Chilli',
      confidence: 0.91,
      model: 'YOLOv8 + CNN',
      analyzedImages: 4,
      analyzedAt: new Date().toISOString(),
    },
  },
];

const LOCAL_STORAGE_KEY = 'uzhavan_cached_products';

export const productService = {
  /**
   * Realtime subscription to products collection in Firestore.
   * Supports filtering by farmerId (Section 20: My Listings) or activeOnly (Section 21: Buyer Marketplace).
   */
  subscribeProducts(
    callback: (products: ProductListing[]) => void,
    options?: { farmerId?: string; activeOnly?: boolean }
  ): () => void {
    const colRef = collection(db, 'products');
    let q = query(colRef);

    if (options?.farmerId) {
      q = query(colRef, where('farmerId', '==', options.farmerId));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty && !options?.farmerId) {
          // Auto-seed if completely empty
          this.seedInitialProducts();
          const mapped = INITIAL_PRODUCTS_SEED.map((p, idx) => ({
            ...p,
            productId: `prod-seed-${idx + 1}`,
            id: `prod-seed-${idx + 1}`,
          }));
          callback(mapped);
          return;
        }

        const items: ProductListing[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();

          // Exclude deleted listings
          if (d.status === 'deleted') return;

          // If activeOnly requested, check active
          if (options?.activeOnly && d.status && d.status.toLowerCase() !== 'active') {
            return;
          }

          const gradeVal: 'A' | 'B' | 'C' =
            d.grade === 'A' || d.grade === 'B' || d.grade === 'C'
              ? d.grade
              : d.aiGradeData?.grade || 'A';

          const primaryImage =
            (d.imageUrls && d.imageUrls.length > 0 ? d.imageUrls[0] : null) ||
            (d.images && d.images.length > 0 ? d.images[0] : null) ||
            'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80';

          const imageUrlsList: string[] =
            Array.isArray(d.imageUrls) && d.imageUrls.length > 0
              ? d.imageUrls
              : Array.isArray(d.images) && d.images.length > 0
              ? d.images
              : [primaryImage];

          const pName = d.productName || d.name || 'Farm Fresh Produce';
          const pQty = d.quantity ?? d.quantityKg ?? 100;
          const pUnit = d.unit || 'kg';
          const pPriceStr = d.price || `₹${d.optimizedPriceMax || d.marketPrice || 40} / ${pUnit}`;

          items.push({
            productId: docSnap.id,
            id: docSnap.id,
            farmerId: d.farmerId || 'farmer-default-murugan',
            farmerName: d.farmerName || 'Murugan S.',
            farmerPhone: d.farmerPhone || '+91 98421 55670',
            productName: pName,
            name: d.name || `${pName} (Grade ${gradeVal})`,
            variety: d.variety || 'Farm Fresh Harvest',
            category: d.category || 'Vegetable',
            grade: gradeVal,
            quantity: pQty,
            quantityKg: typeof pQty === 'number' ? pQty : parseFloat(pQty) || 100,
            unit: pUnit,
            marketPrice: Number(d.marketPrice) || 40,
            optimizedPriceMin: Number(d.optimizedPriceMin) || 35,
            optimizedPriceMax: Number(d.optimizedPriceMax) || 45,
            price: pPriceStr,
            displayPrice: pPriceStr,
            pricePerUnit: d.pricePerUnit || String(d.optimizedPriceMax || d.marketPrice || 40),
            location: d.location || 'Madurai, Tamil Nadu',
            latitude: d.latitude ?? null,
            longitude: d.longitude ?? null,
            imageUrls: imageUrlsList,
            images: imageUrlsList,
            description: d.description || `Fresh Grade-${gradeVal} ${pName} directly from verified farm.`,
            status: d.status || 'active',
            views: d.views || 1,
            date: d.date || 'Today',
            harvestDate: d.harvestDate || 'Harvested recently',
            aiGradeData: d.aiGradeData,
            qualityScore: d.qualityScore ?? (gradeVal === 'A' ? 95 : gradeVal === 'B' ? 82 : 68),
            rating: d.rating ?? (gradeVal === 'A' ? 4.9 : 4.7),
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
          });
        });

        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
        } catch {}

        callback(items);
      },
      (error) => {
        console.warn('Firestore products subscription notice:', error?.message || error);
        try {
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (cached) {
            callback(JSON.parse(cached));
            return;
          }
        } catch {}
        callback(
          INITIAL_PRODUCTS_SEED.map((p, idx) => ({
            ...p,
            productId: `prod-seed-${idx + 1}`,
            id: `prod-seed-${idx + 1}`,
          }))
        );
      }
    );

    return unsubscribe;
  },

  /**
   * One-time retrieval of active products for marketplace
   */
  async getActiveProducts(): Promise<ProductListing[]> {
    try {
      const colRef = collection(db, 'products');
      const snap = await getDocs(colRef);
      if (snap.empty) {
        return INITIAL_PRODUCTS_SEED.map((p, idx) => ({
          ...p,
          productId: `prod-seed-${idx + 1}`,
          id: `prod-seed-${idx + 1}`,
        }));
      }

      const items: ProductListing[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.status === 'deleted') return;
        const gradeVal: 'A' | 'B' | 'C' =
          d.grade === 'A' || d.grade === 'B' || d.grade === 'C' ? d.grade : 'A';
        const imgList = d.imageUrls || d.images || [];

        items.push({
          productId: docSnap.id,
          id: docSnap.id,
          farmerId: d.farmerId || 'farmer-default-murugan',
          farmerName: d.farmerName || 'Murugan S.',
          farmerPhone: d.farmerPhone || '+91 98421 55670',
          productName: d.productName || d.name || 'Produce',
          name: d.name || d.productName || 'Produce',
          category: d.category || 'Vegetable',
          grade: gradeVal,
          quantity: d.quantity || 100,
          quantityKg: Number(d.quantity) || 100,
          unit: d.unit || 'kg',
          marketPrice: Number(d.marketPrice) || 40,
          optimizedPriceMin: Number(d.optimizedPriceMin) || 35,
          optimizedPriceMax: Number(d.optimizedPriceMax) || 45,
          location: d.location || 'Madurai',
          latitude: d.latitude ?? null,
          longitude: d.longitude ?? null,
          imageUrls: imgList,
          images: imgList,
          description: d.description || '',
          price: d.price || `₹${d.optimizedPriceMax || 40} / kg`,
          displayPrice: d.price || `₹${d.optimizedPriceMax || 40} / kg`,
          views: d.views || 1,
          status: d.status || 'active',
          aiGradeData: d.aiGradeData,
          createdAt: d.createdAt,
        });
      });
      return items;
    } catch {
      return INITIAL_PRODUCTS_SEED.map((p, idx) => ({
        ...p,
        productId: `prod-seed-${idx + 1}`,
        id: `prod-seed-${idx + 1}`,
      }));
    }
  },

  /**
   * Adds a new agricultural product to Firestore products/{productId} (Section 4, 5, 6).
   */
  async addProduct(
    product: Partial<ProductListing> & {
      farmerId?: string;
      farmerName?: string;
      productName?: string;
      grade?: 'A' | 'B' | 'C';
      quantity?: number | string;
      unit?: string;
      marketPrice?: number;
      optimizedPriceMin?: number;
      optimizedPriceMax?: number;
      location?: string;
      imageUrls?: string[];
      description?: string;
      aiGradeData?: AiGradeData;
    }
  ): Promise<string> {
    try {
      const colRef = collection(db, 'products');
      const prodName = product.productName || product.name || 'Produce';
      const grade = product.grade || product.aiGradeData?.grade || 'A';
      const qty = typeof product.quantity === 'number' ? product.quantity : parseFloat(String(product.quantity)) || 100;
      const unit = product.unit || 'kg';
      const mktPrice = Number(product.marketPrice || product.mandiPrice) || 45;
      const optMin = Number(product.optimizedPriceMin || product.recommendedMinPrice) || mktPrice - 5;
      const optMax = Number(product.optimizedPriceMax || product.recommendedMaxPrice) || mktPrice;
      const loc = product.location || 'Madurai, Tamil Nadu';
      const imgUrls = product.imageUrls || product.images || [];

      const docRecord = {
        farmerId: product.farmerId || 'farmer-default-murugan',
        farmerName: product.farmerName || 'Murugan S.',
        farmerPhone: product.farmerPhone || '+91 98421 55670',
        productName: prodName,
        name: `${prodName} (Grade ${grade})`,
        category: product.category || 'Vegetable',
        grade,
        quantity: qty,
        quantityKg: qty,
        unit,
        marketPrice: mktPrice,
        optimizedPriceMin: optMin,
        optimizedPriceMax: optMax,
        price: product.price || `₹${optMax} / ${unit}`,
        pricePerUnit: String(optMax),
        location: loc,
        latitude: product.latitude ?? 9.9252,
        longitude: product.longitude ?? 78.1198,
        imageUrls: imgUrls,
        images: imgUrls,
        description: product.description || `Fresh Grade-${grade} ${prodName} directly from farmer.`,
        status: 'active',
        views: 1,
        date: 'Just now',
        aiGradeData: product.aiGradeData || {
          grade,
          detectedProduct: prodName,
          confidence: product.detectionConfidence || 0.94,
          model: product.modelVersion || 'YOLOv8 + CNN',
          analyzedImages: imgUrls.length || 4,
          analyzedAt: serverTimestamp(),
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(colRef, docRecord);
      // Sync productId inside document
      await setDoc(docRef, { productId: docRef.id, id: docRef.id }, { merge: true });
      return docRef.id;
    } catch (err) {
      console.warn('Failed to add product to Firestore:', err);
      return `prod-${Date.now()}`;
    }
  },

  /**
   * Deletes a produce listing from Firestore (Section 26: Prefer status: "deleted").
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, {
        status: 'deleted',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Soft-delete failed, trying hard delete:', err);
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (hardErr) {
        console.warn('Delete product error:', hardErr);
      }
    }
  },

  /**
   * Updates an existing produce listing in Firestore (Section 27).
   */
  async updateProduct(id: string, updates: Partial<ProductListing>): Promise<void> {
    try {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Error updating product in Firestore:', err);
    }
  },

  /**
   * Seeds initial sample products to Firestore.
   */
  async seedInitialProducts(): Promise<void> {
    try {
      const colRef = collection(db, 'products');
      for (let i = 0; i < INITIAL_PRODUCTS_SEED.length; i++) {
        const item = INITIAL_PRODUCTS_SEED[i];
        const docRef = doc(colRef, `prod-seed-${i + 1}`);
        await setDoc(
          docRef,
          {
            ...item,
            productId: `prod-seed-${i + 1}`,
            id: `prod-seed-${i + 1}`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn('Auto-seed products notice:', err);
    }
  },
};
