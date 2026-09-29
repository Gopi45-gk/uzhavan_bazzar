import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ===== EXPORT REQUESTS =====

export interface ExportRequest {
  id: string;
  requestId: string;
  farmerId: string;
  farmerName: string;
  productId?: string;
  productName: string;
  grade: 'A' | 'B' | 'C';
  destination: string;
  destinationPort: string;
  cargoWeight: number;
  unit: string;
  shippingMode: 'sea' | 'air';
  dispatchDate: string;
  eta: string;
  estimatedExportValue: number;
  partner: string;
  status: 'pending' | 'quoted' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt?: any;
  updatedAt?: any;
}

// Export destination data with estimated ETAs
export const EXPORT_DESTINATIONS = [
  { country: 'Germany', port: 'Hamburg', seaDays: 22, airDays: 3 },
  { country: 'Netherlands', port: 'Rotterdam', seaDays: 20, airDays: 3 },
  { country: 'France', port: 'Marseille', seaDays: 16, airDays: 2 },
  { country: 'Spain', port: 'Valencia', seaDays: 14, airDays: 2 },
];

// Estimated export prices (per kg in INR) by grade
export const EXPORT_PRICE_ESTIMATES: Record<string, Record<string, number>> = {
  A: { default: 120, Tomato: 110, Onion: 85, Mango: 180, Banana: 95, Rice: 75 },
  B: { default: 90, Tomato: 82, Onion: 65, Mango: 140, Banana: 72, Rice: 58 },
  C: { default: 65, Tomato: 60, Onion: 48, Mango: 100, Banana: 52, Rice: 42 },
};

export const exportService = {
  /**
   * Create a new export request in Firestore exportRequests collection
   */
  async createExportRequest(
    data: Omit<ExportRequest, 'id' | 'requestId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const docRef = await addDoc(collection(db, 'exportRequests'), {
      ...data,
      status: data.status || 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await updateDoc(docRef, { requestId: docRef.id });
    return docRef.id;
  },

  /**
   * Subscribe to export requests for a specific farmer
   */
  subscribeExportRequests(
    farmerId: string,
    callback: (requests: ExportRequest[]) => void
  ): () => void {
    const q = query(
      collection(db, 'exportRequests'),
      where('farmerId', '==', farmerId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const items: ExportRequest[] = snapshot.docs.map((d) => ({
          id: d.id,
          requestId: d.id,
          ...d.data(),
        })) as ExportRequest[];
        callback(items);
      },
      (err) => {
        console.warn('Export requests subscription error:', err);
        callback([]);
      }
    );
  },

  /**
   * Update export request status
   */
  async updateExportStatus(requestId: string, status: ExportRequest['status']): Promise<void> {
    const docRef = doc(db, 'exportRequests', requestId);
    await updateDoc(docRef, { status, updatedAt: serverTimestamp() });
  },

  /**
   * Calculate estimated export value
   */
  calculateExportValue(
    productName: string,
    grade: 'A' | 'B' | 'C',
    weightKg: number,
    shippingMode: 'sea' | 'air'
  ): number {
    const gradePrices = EXPORT_PRICE_ESTIMATES[grade] || EXPORT_PRICE_ESTIMATES.A;
    const matchedKey = Object.keys(gradePrices).find(
      (k) => k !== 'default' && productName.toLowerCase().includes(k.toLowerCase())
    );
    const pricePerKg = matchedKey ? gradePrices[matchedKey] : gradePrices.default;
    // Air cargo has ~15% premium
    const modeMultiplier = shippingMode === 'air' ? 1.15 : 1.0;
    return Math.round(pricePerKg * weightKg * modeMultiplier);
  },

  /**
   * Calculate ETA based on destination and mode
   */
  calculateETA(
    destination: string,
    shippingMode: 'sea' | 'air',
    dispatchDate: string
  ): string {
    const dest = EXPORT_DESTINATIONS.find(
      (d) => `${d.country} — ${d.port}` === destination || d.country === destination
    );
    if (!dest) return 'TBD';
    const days = shippingMode === 'sea' ? dest.seaDays : dest.airDays;
    const dispatch = new Date(dispatchDate);
    if (isNaN(dispatch.getTime())) return `~${days} days`;
    const arrival = new Date(dispatch.getTime() + days * 24 * 60 * 60 * 1000);
    return arrival.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  },
};

// ===== BULK ORDERS =====

export interface BulkOrder {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  farmerId: string;
  farmerName: string;
  productId: string;
  productName: string;
  requestedQuantity: number;
  unit: string;
  neededBy: string;
  notes: string;
  status: 'pending' | 'accepted' | 'rejected' | 'processing' | 'ready' | 'delivered' | 'cancelled';
  createdAt?: any;
  updatedAt?: any;
}

export const bulkOrderService = {
  /**
   * Create a new bulk order request
   */
  async createBulkOrder(
    data: Omit<BulkOrder, 'id' | 'orderId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const docRef = await addDoc(collection(db, 'bulkOrders'), {
      ...data,
      status: data.status || 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await updateDoc(docRef, { orderId: docRef.id });
    return docRef.id;
  },

  /**
   * Subscribe to bulk orders for a specific buyer
   */
  subscribeBuyerBulkOrders(
    buyerId: string,
    callback: (orders: BulkOrder[]) => void
  ): () => void {
    const q = query(
      collection(db, 'bulkOrders'),
      where('buyerId', '==', buyerId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const items: BulkOrder[] = snapshot.docs.map((d) => ({
          id: d.id,
          orderId: d.id,
          ...d.data(),
        })) as BulkOrder[];
        callback(items);
      },
      (err) => {
        console.warn('Buyer bulk orders subscription error:', err);
        callback([]);
      }
    );
  },

  /**
   * Subscribe to bulk orders for a specific farmer (incoming requests)
   */
  subscribeFarmerBulkOrders(
    farmerId: string,
    callback: (orders: BulkOrder[]) => void
  ): () => void {
    const q = query(
      collection(db, 'bulkOrders'),
      where('farmerId', '==', farmerId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const items: BulkOrder[] = snapshot.docs.map((d) => ({
          id: d.id,
          orderId: d.id,
          ...d.data(),
        })) as BulkOrder[];
        callback(items);
      },
      (err) => {
        console.warn('Farmer bulk orders subscription error:', err);
        callback([]);
      }
    );
  },

  /**
   * Subscribe to ALL bulk orders (fallback when farmer has no UID filter)
   */
  subscribeAllBulkOrders(callback: (orders: BulkOrder[]) => void): () => void {
    const q = query(collection(db, 'bulkOrders'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: BulkOrder[] = snapshot.docs.map((d) => ({
          id: d.id,
          orderId: d.id,
          ...d.data(),
        })) as BulkOrder[];
        callback(items);
      },
      (err) => {
        console.warn('All bulk orders subscription error:', err);
        callback([]);
      }
    );
  },

  /**
   * Update bulk order status (farmer accepts/rejects, or status progression)
   */
  async updateBulkOrderStatus(orderId: string, status: BulkOrder['status']): Promise<void> {
    const docRef = doc(db, 'bulkOrders', orderId);
    await updateDoc(docRef, { status, updatedAt: serverTimestamp() });
  },
};
