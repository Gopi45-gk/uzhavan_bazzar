import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface OrderDocument {
  id?: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  buyerPhone?: string;
  sellerId: string; // Farmer UID
  sellerName: string;
  productId: string;
  productName: string;
  quantity: string | number;
  price: string | number;
  totalAmount: string | number;
  deliveryAddress: string;
  transportOption: 'online_vendor' | 'own_transport';
  vendorReference?: string;
  paymentMethod: string;
  status: 'Ready for Pickup' | 'Payment Completed' | 'In Transit' | 'Delivered' | 'Pending';
  createdAt?: any;
  updatedAt?: any;
}

export const orderService = {
  /**
   * Retrieves orders for a seller (farmer).
   */
  async getFarmerOrders(sellerId: string): Promise<OrderDocument[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('sellerId', '==', sellerId)
      );
      const snapshot = await getDocs(q);
      const list: OrderDocument[] = [];
      snapshot.forEach((d) => {
        const item = d.data() as OrderDocument;
        item.id = d.id;
        list.push(item);
      });
      return list;
    } catch (err) {
      console.warn('Error fetching orders from Firestore:', err);
      return [];
    }
  },

  /**
   * Creates a new order document in Firestore.
   */
  async createOrder(data: OrderDocument): Promise<OrderDocument> {
    const docRef = doc(db, 'orders', data.orderId);
    const orderData: OrderDocument = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, orderData);
    return orderData;
  },
};
