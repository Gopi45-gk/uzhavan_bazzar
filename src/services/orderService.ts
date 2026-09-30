import {
  collection,
  doc,
  addDoc,
  setDoc,
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

export type OrderStatusType =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItemLine {
  itemId?: string;
  productId: string;
  productName: string;
  farmerId: string;
  quantity: number;
  unit: string;
  price: number;
  subtotal: number;
}

export interface OrderDocument {
  // Required fields from Section 12 & Delivery Rules
  orderId: string;
  buyerId: string;
  buyerName: string;
  buyerMobile: string;
  farmerId: string;
  farmerName: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  unitPrice?: number;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  totalPrice?: number;
  deliveryAddress: string;
  deliveryLatitude?: number | string | null;
  deliveryLongitude?: number | string | null;

  // Requirement 3 & 4: Geo-coordinates, distance, and delivery method
  farmerLocation?: { latitude: number; longitude: number } | null;
  buyerLocation?: { latitude: number; longitude: number } | null;
  deliveryDistanceKm?: number;
  deliveryMethod?: 'INDIA_POST' | 'FARMER_DIRECT' | 'SELF_PICKUP' | string;
  deliveryStatus?: 'Pending' | 'Booked' | 'Dispatched' | 'In Transit' | 'Out for Delivery' | 'Delivered' | string;

  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'cod';
  orderStatus: OrderStatusType;
  transportOption: string;
  driverId?: string;
  createdAt: any;
  updatedAt: any;

  // Compatibility fields for existing farmer & buyer dashboards
  id: string;
  buyer: string;
  buyerPhone: string;
  item: string;
  qty: string;
  total: string;
  status: string;
  location: string;
  time: string;
  items?: OrderItemLine[];
}

export const INITIAL_ORDERS_SEED: Omit<OrderDocument, 'createdAt' | 'updatedAt'>[] = [
  {
    orderId: 'ORD-8921',
    id: 'ORD-8921',
    buyerId: 'buyer-demo-kovai',
    buyerName: 'Kovai Fresh Mart',
    buyer: 'Kovai Fresh Mart',
    buyerMobile: '+91 98421 55670',
    buyerPhone: '+91 98421 55670',
    farmerId: 'farmer-default-murugan',
    farmerName: 'Murugan S.',
    productId: 'prod-seed-1',
    productName: 'Country Tomato (Grade A)',
    item: 'Country Tomato (Grade A)',
    quantity: 250,
    qty: '250 kg',
    unit: 'kg',
    pricePerUnit: 38,
    subtotal: 9500,
    deliveryCharge: 0,
    totalAmount: 9500,
    total: '₹9,500',
    deliveryAddress: 'Madurai Mandi Gate 2, Ring Road, Madurai',
    location: 'Madurai Mandi Gate 2',
    paymentMethod: 'UPI',
    paymentStatus: 'completed',
    orderStatus: 'ready',
    status: 'Ready for Pickup',
    transportOption: 'Farmer Farm Pickup',
    time: '10:30 AM Today',
  },
  {
    orderId: 'ORD-8919',
    id: 'ORD-8919',
    buyerId: 'buyer-demo-green',
    buyerName: 'Green Basket Retail',
    buyer: 'Green Basket Retail',
    buyerMobile: '+91 97910 88231',
    buyerPhone: '+91 97910 88231',
    farmerId: 'farmer-default-murugan',
    farmerName: 'Murugan S.',
    productId: 'prod-seed-2',
    productName: 'Small Shallot Onions',
    item: 'Small Shallot Onions',
    quantity: 300,
    qty: '300 kg',
    unit: 'kg',
    pricePerUnit: 46,
    subtotal: 13800,
    deliveryCharge: 0,
    totalAmount: 13800,
    total: '₹13,800',
    deliveryAddress: 'Oddanchatram Central APMC Market, Dindigul',
    location: 'Farm Direct Pickup',
    paymentMethod: 'NetBanking',
    paymentStatus: 'completed',
    orderStatus: 'confirmed',
    status: 'Payment Completed',
    transportOption: 'Buyer Direct Vehicle',
    time: 'Yesterday',
  },
];

const LOCAL_STORAGE_KEY = 'uzhavan_cached_orders';

// Human-friendly status label mapping
export const formatOrderStatus = (status: OrderStatusType | string): string => {
  switch (status) {
    case 'placed':
      return 'Order Placed';
    case 'confirmed':
      return 'Payment Completed';
    case 'processing':
      return 'Processing in Farm';
    case 'ready':
      return 'Ready for Pickup';
    case 'shipped':
    case 'out_for_delivery':
      return 'In Transit';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status || 'Pending';
  }
};

export const orderService = {
  /**
   * Realtime subscription to orders collection.
   * Can filter by farmerId (Section 23: Farmer Orders) or buyerId (Section 24: Buyer Orders).
   */
  subscribeOrders(
    callback: (orders: OrderDocument[]) => void,
    options?: { farmerId?: string; buyerId?: string }
  ): () => void {
    const colRef = collection(db, 'orders');
    let q = query(colRef);

    if (options?.farmerId) {
      q = query(colRef, where('farmerId', '==', options.farmerId));
    } else if (options?.buyerId) {
      q = query(colRef, where('buyerId', '==', options.buyerId));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty && !options?.farmerId && !options?.buyerId) {
          this.seedInitialOrders();
          callback(INITIAL_ORDERS_SEED as OrderDocument[]);
          return;
        }

        const items: OrderDocument[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const oStatus = (d.orderStatus || 'placed') as OrderStatusType;
          const statusLabel = d.status || formatOrderStatus(oStatus);
          const totalAmt = Number(d.totalAmount || d.subtotal || 0);

          items.push({
            orderId: docSnap.id,
            id: docSnap.id,
            buyerId: d.buyerId || '',
            buyerName: d.buyerName || d.buyer || 'Buyer',
            buyer: d.buyerName || d.buyer || 'Buyer',
            buyerMobile: d.buyerMobile || d.buyerPhone || '',
            buyerPhone: d.buyerMobile || d.buyerPhone || '',
            farmerId: d.farmerId || '',
            farmerName: d.farmerName || 'Farmer',
            productId: d.productId || '',
            productName: d.productName || d.item || 'Produce',
            item: d.productName || d.item || 'Produce',
            quantity: Number(d.quantity) || 1,
            qty: d.qty || `${d.quantity || 1} ${d.unit || 'kg'}`,
            unit: d.unit || 'kg',
            pricePerUnit: Number(d.pricePerUnit) || 0,
            subtotal: Number(d.subtotal) || totalAmt,
            deliveryCharge: Number(d.deliveryCharge) || 0,
            totalAmount: totalAmt,
            total: d.total || `₹${totalAmt.toLocaleString()}`,
            deliveryAddress: d.deliveryAddress || d.location || 'Direct Pickup',
            location: d.deliveryAddress || d.location || 'Direct Pickup',
            deliveryLatitude: d.deliveryLatitude ?? null,
            deliveryLongitude: d.deliveryLongitude ?? null,
            paymentMethod: d.paymentMethod || 'Online',
            paymentStatus: d.paymentStatus || 'completed',
            orderStatus: oStatus,
            status: statusLabel,
            transportOption: d.transportOption || 'Standard Delivery',
            driverId: d.driverId,
            time: d.time || (d.createdAt ? 'Recently' : 'Just now'),
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
          });
        });

        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
        } catch {}

        callback(items);
      },
      (err: any) => {
        console.warn('Orders subscription notice:', err?.message || err);
        try {
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (cached) {
            callback(JSON.parse(cached));
            return;
          }
        } catch {}
        callback(INITIAL_ORDERS_SEED as OrderDocument[]);
      }
    );

    return unsubscribe;
  },

  /**
   * Creates a new buyer order in Firestore orders/{orderId}
   * and saves items under orders/{orderId}/items/{itemId} (Section 12 & 14).
   */
  async createOrder(
    orderData: Partial<OrderDocument> & Record<string, any>,
    items?: OrderItemLine[]
  ): Promise<string> {
    try {
      const colRef = collection(db, 'orders');
      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const docRef = doc(colRef, orderId);

      const payload: Record<string, any> = {
        orderId,
        id: orderId,
        buyerId: orderData.buyerId,
        buyerName: orderData.buyerName,
        buyer: orderData.buyerName,
        buyerMobile: orderData.buyerMobile,
        buyerPhone: orderData.buyerMobile,
        farmerId: orderData.farmerId,
        farmerName: orderData.farmerName,
        productId: orderData.productId,
        productName: orderData.productName,
        item: orderData.productName,
        quantity: orderData.quantity,
        qty: `${orderData.quantity} ${orderData.unit || 'kg'}`,
        unit: orderData.unit || 'kg',
        pricePerUnit: orderData.pricePerUnit,
        unitPrice: orderData.unitPrice || orderData.pricePerUnit || 0,
        subtotal: orderData.subtotal,
        deliveryCharge: orderData.deliveryCharge || 0,
        totalAmount: orderData.totalAmount,
        totalPrice: orderData.totalPrice || orderData.totalAmount || 0,
        total: `₹${orderData.totalAmount.toLocaleString()}`,
        deliveryAddress: orderData.deliveryAddress,
        location: orderData.deliveryAddress,
        deliveryLatitude: orderData.deliveryLatitude ?? null,
        deliveryLongitude: orderData.deliveryLongitude ?? null,

        // Requirement 3 & 4: Geo-coordinates & Delivery fields
        farmerLocation: orderData.farmerLocation ?? null,
        buyerLocation: orderData.buyerLocation ?? null,
        deliveryDistanceKm: Number(orderData.deliveryDistanceKm) || 0,
        deliveryMethod: orderData.deliveryMethod || (orderData.transportOption === 'India Post Delivery' ? 'INDIA_POST' : 'FARMER_DIRECT'),
        deliveryStatus: orderData.deliveryStatus || 'Pending',

        paymentMethod: orderData.paymentMethod || 'Online UPI',
        paymentStatus: orderData.paymentStatus || 'completed',
        orderStatus: (orderData.orderStatus || 'placed') as OrderStatusType,
        status: formatOrderStatus(orderData.orderStatus || 'placed'),
        transportOption: orderData.transportOption || 'Farmer Direct Delivery',
        driverId: orderData.driverId || '',
        time: 'Just now',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, payload);

      // Section 14: Save items subcollection orders/{orderId}/items/{itemId}
      const itemsToSave = items && items.length > 0 ? items : [
        {
          productId: orderData.productId,
          productName: orderData.productName,
          farmerId: orderData.farmerId,
          quantity: orderData.quantity,
          unit: orderData.unit || 'kg',
          price: orderData.pricePerUnit,
          subtotal: orderData.subtotal,
        },
      ];

      for (let i = 0; i < itemsToSave.length; i++) {
        const it = itemsToSave[i];
        const itemColRef = collection(docRef, 'items');
        await addDoc(itemColRef, {
          ...it,
          createdAt: serverTimestamp(),
        });
      }

      // Requirement 5 & 9: Create real-time notification for Farmer
      if (orderData.farmerId) {
        import('./notificationService').then(({ notificationService }) => {
          notificationService.createNotification({
            userId: orderData.farmerId!,
            type: 'NEW_ORDER',
            title: 'New Order Received',
            message: `Your product ${orderData.productName || 'produce'} (${orderData.quantity || 1} ${orderData.unit || 'kg'}) has been ordered by ${orderData.buyerName || 'Buyer'}.`,
            orderId,
            productId: orderData.productId,
            productName: orderData.productName,
            quantity: orderData.quantity,
            buyerName: orderData.buyerName,
            targetScreen: 'orders',
            isRead: false,
          }).catch((err) => console.warn('Notification creation notice:', err));
        });
      }

      return orderId;
    } catch (err) {
      console.warn('Failed to save order to Firestore:', err);
      return `ORD-${Date.now()}`;
    }
  },

  /**
   * Updates order status in Firestore orders/{orderId} (Section 11 & 13).
   * Automatically updates deliveryStatus and notifies buyer and farmer.
   */
  async updateOrderStatus(
    orderId: string,
    orderStatus: OrderStatusType | string
  ): Promise<void> {
    try {
      const docRef = doc(db, 'orders', orderId);
      const statusLabel = formatOrderStatus(orderStatus);

      // Map order status to delivery status
      let newDeliveryStatus: string | undefined;
      if (orderStatus === 'shipped') newDeliveryStatus = 'In Transit';
      else if (orderStatus === 'out_for_delivery') newDeliveryStatus = 'Out for Delivery';
      else if (orderStatus === 'delivered') newDeliveryStatus = 'Delivered';
      else if (orderStatus === 'confirmed') newDeliveryStatus = 'Booked';

      const updatePayload: Record<string, any> = {
        orderStatus,
        status: statusLabel,
        updatedAt: serverTimestamp(),
      };

      if (newDeliveryStatus) {
        updatePayload.deliveryStatus = newDeliveryStatus;
      }

      await updateDoc(docRef, updatePayload);

      // Trigger status change notification
      import('./notificationService').then(async ({ notificationService }) => {
        try {
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            notificationService.notifyOrderStatusChange(
              { id: snap.id, ...snap.data() } as OrderDocument,
              String(orderStatus)
            ).catch(() => {});
          }
        } catch {}
      });
    } catch (err) {
      console.warn('Failed to update order status in Firestore:', err);
    }
  },

  /**
   * Updates specific delivery status for India Post / Logistics (Requirement 15).
   * Status values: 'Pending' | 'Booked' | 'Dispatched' | 'In Transit' | 'Out for Delivery' | 'Delivered'
   */
  async updateDeliveryStatus(
    orderId: string,
    deliveryStatus: string
  ): Promise<void> {
    try {
      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, {
        deliveryStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Failed to update delivery status in Firestore:', err);
    }
  },

  /**
   * Seeds initial sample orders if collection is empty.
   */
  async seedInitialOrders(): Promise<void> {
    try {
      const colRef = collection(db, 'orders');
      for (const order of INITIAL_ORDERS_SEED) {
        const docRef = doc(colRef, order.orderId);
        await setDoc(
          docRef,
          {
            ...order,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn('Auto-seed orders notice:', err);
    }
  },
};
