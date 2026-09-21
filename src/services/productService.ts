import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface ProductDocument {
  id?: string;
  farmerId: string;
  farmerName: string;
  farmerPhone?: string;
  productName: string;
  category: string;
  quantityKg: number;
  grade: string;
  qualityScore: number;
  mandiPrice: number;
  recommendedPriceMin: number;
  recommendedPriceMax: number;
  displayPrice?: string;
  priceUnit: string;
  location: string;
  images: string[];
  aiDetection: {
    detectedName: string;
    confidence: number;
  };
  aiGrading: {
    grade: string;
    score: number;
  };
  status: 'active' | 'sold_out' | 'deleted';
  createdAt?: any;
  updatedAt?: any;
}

export const productService = {
  /**
   * Stores a new product listing in Firestore under /products/{productId}.
   */
  async createProduct(productId: string, data: Omit<ProductDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductDocument> {
    const docRef = doc(db, 'products', productId);
    const productData: ProductDocument = {
      ...data,
      id: productId,
      status: data.status || 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, productData);
    return productData;
  },

  /**
   * Retrieves products belonging exclusively to the given farmer UID.
   * Enforces ownership isolation for My Listings.
   */
  async getFarmerProducts(farmerId: string): Promise<ProductDocument[]> {
    try {
      const q = query(
        collection(db, 'products'),
        where('farmerId', '==', farmerId)
      );
      const snapshot = await getDocs(q);
      const list: ProductDocument[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as ProductDocument;
        item.id = d.id;
        list.push(item);
      });
      return list;
    } catch (err) {
      console.warn('Error fetching farmer products from Firestore:', err);
      return [];
    }
  },

  /**
   * Retrieves all public active products for the marketplace.
   */
  async getMarketplaceProducts(): Promise<ProductDocument[]> {
    try {
      const q = query(
        collection(db, 'products'),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      const list: ProductDocument[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as ProductDocument;
        item.id = d.id;
        list.push(item);
      });
      return list;
    } catch (err) {
      console.warn('Error fetching marketplace products:', err);
      return [];
    }
  },

  /**
   * Deletes a product, strictly checking ownership.
   */
  async deleteProduct(productId: string, farmerId: string): Promise<void> {
    const docRef = doc(db, 'products', productId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const data = snap.data() as ProductDocument;
    if (data.farmerId !== farmerId) {
      throw new Error('Unauthorized: You can only delete your own listings.');
    }

    await deleteDoc(docRef);
  },

  /**
   * Updates product details with ownership verification.
   */
  async updateProduct(
    productId: string,
    farmerId: string,
    updates: Partial<ProductDocument>
  ): Promise<void> {
    const docRef = doc(db, 'products', productId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const data = snap.data() as ProductDocument;
    if (data.farmerId !== farmerId) {
      throw new Error('Unauthorized: You can only modify your own listings.');
    }

    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },
};
