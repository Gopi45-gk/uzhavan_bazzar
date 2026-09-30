/**
 * Real-time Notification Service
 * Uzhavan Bazzar
 *
 * Implements real-time Firebase-backed notifications for farmers and buyers:
 * - Real-time onSnapshot listeners
 * - Automatic upcoming order & delivery today detection from actual Firestore dates
 * - Order status transition notifications
 * - Bulk order request notifications
 * - Read/Unread state management
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { OrderDocument } from './orderService';

export type NotificationType =
  | 'NEW_ORDER'
  | 'ORDER_CONFIRMED'
  | 'UPCOMING_ORDER'
  | 'DELIVERY_TODAY'
  | 'ORDER_DISPATCHED'
  | 'ORDER_DELIVERED'
  | 'BULK_ORDER'
  | 'ORDER_CANCELLED'
  | 'REVIEW_RECEIVED'
  | 'PRODUCT_LOW_STOCK';

export interface NotificationDocument {
  notificationId: string;
  id: string;
  userId: string; // farmerId or buyerId
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  productId?: string;
  bulkOrderId?: string;
  quantity?: number | string;
  buyerName?: string;
  farmerName?: string;
  productName?: string;
  targetScreen?: 'orders' | 'bulk-requests' | 'reviews' | 'my-listings';
  isRead: boolean;
  createdAt: any;
  scheduledFor?: string | null;
}

const LOCAL_STORAGE_NOTIFS_KEY = 'uzhavan_cached_notifications';

export const notificationService = {
  /**
   * Real-time subscription to notifications collection for a specific user (Farmer or Buyer).
   */
  subscribeNotifications(
    userId: string,
    callback: (notifications: NotificationDocument[]) => void
  ): () => void {
    if (!userId) {
      callback([]);
      return () => {};
    }

    const colRef = collection(db, 'notifications');
    const q = query(colRef, where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: NotificationDocument[] = [];
        snapshot.forEach((snap) => {
          const d = snap.data();
          list.push({
            notificationId: snap.id,
            id: snap.id,
            userId: d.userId,
            type: d.type as NotificationType,
            title: d.title || 'Notification',
            message: d.message || '',
            orderId: d.orderId || '',
            productId: d.productId || '',
            bulkOrderId: d.bulkOrderId || '',
            quantity: d.quantity,
            buyerName: d.buyerName || '',
            farmerName: d.farmerName || '',
            productName: d.productName || '',
            targetScreen: d.targetScreen || 'orders',
            isRead: Boolean(d.isRead),
            createdAt: d.createdAt,
            scheduledFor: d.scheduledFor || null,
          });
        });

        // Client-side sort by createdAt descending (newest first)
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
          const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });

        try {
          localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(list));
        } catch {}

        callback(list);
      },
      (err) => {
        console.warn('Notifications subscription notice:', err?.message || err);
        try {
          const cached = localStorage.getItem(LOCAL_STORAGE_NOTIFS_KEY);
          if (cached) {
            callback(JSON.parse(cached));
            return;
          }
        } catch {}
        callback([]);
      }
    );

    return unsubscribe;
  },

  /**
   * Creates a notification in Firestore notifications/{notificationId}
   */
  async createNotification(
    data: Omit<NotificationDocument, 'notificationId' | 'id' | 'createdAt'> & {
      customId?: string;
    }
  ): Promise<string> {
    try {
      const colRef = collection(db, 'notifications');
      const notifId = data.customId || `NOTIF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const docRef = doc(colRef, notifId);

      const payload = {
        notificationId: notifId,
        id: notifId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        orderId: data.orderId || '',
        productId: data.productId || '',
        bulkOrderId: data.bulkOrderId || '',
        quantity: data.quantity ?? '',
        buyerName: data.buyerName || '',
        farmerName: data.farmerName || '',
        productName: data.productName || '',
        targetScreen: data.targetScreen || 'orders',
        isRead: false,
        createdAt: serverTimestamp(),
        scheduledFor: data.scheduledFor || null,
      };

      await setDoc(docRef, payload, { merge: true });
      return notifId;
    } catch (err) {
      console.warn('Error creating notification in Firestore:', err);
      return '';
    }
  },

  /**
   * Marks a single notification as read (Requirement 10: isRead: true)
   */
  async markAsRead(notificationId: string): Promise<void> {
    if (!notificationId) return;
    try {
      const docRef = doc(db, 'notifications', notificationId);
      await updateDoc(docRef, {
        isRead: true,
      });
    } catch (err) {
      console.warn('Error marking notification as read in Firestore:', err);
    }
  },

  /**
   * Marks all notifications for a user as read
   */
  async markAllAsRead(notifications: NotificationDocument[]): Promise<void> {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.allSettled(
      unread.map((n) => this.markAsRead(n.notificationId || n.id))
    );
  },

  /**
   * Checks real orders from Firestore and generates upcoming order notifications (Requirement 6 & 12).
   * Generates:
   * - "UPCOMING_ORDER" if delivery is scheduled for tomorrow
   * - "DELIVERY_TODAY" if delivery is scheduled for today
   * Uses idempotent deterministic IDs to avoid duplicate notifications.
   */
  async checkUpcomingOrders(
    farmerId: string,
    orders: OrderDocument[],
    isTamil: boolean = false
  ): Promise<void> {
    if (!farmerId || !orders || orders.length === 0) return;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    for (const order of orders) {
      if (order.farmerId !== farmerId) continue;
      if (order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') continue;

      // Extract order creation / scheduled delivery date
      let orderDateStr = todayStr;
      if (order.createdAt?.seconds) {
        orderDateStr = new Date(order.createdAt.seconds * 1000).toISOString().slice(0, 10);
      } else if (order.createdAt) {
        orderDateStr = new Date(order.createdAt).toISOString().slice(0, 10);
      }

      // 1. Check for Delivery Today
      const todayNotifId = `NOTIF_TODAY_${order.id || order.orderId}_${todayStr}`;
      // 2. Check for Upcoming Order Tomorrow
      const upcomingNotifId = `NOTIF_UPCOMING_${order.id || order.orderId}_${tomorrowStr}`;

      // If active order was placed or confirmed, schedule timely reminder
      if (order.orderStatus === 'shipped' || order.orderStatus === 'out_for_delivery') {
        const title = isTamil ? 'இன்றைய டெலிவரி' : 'Delivery Scheduled for Today';
        const msg = isTamil
          ? `ஆர்டர் #${order.orderId || order.id} (${order.productName || order.item}, ${order.quantity || order.qty}) இன்று வாடிக்கையாளருக்கு சென்றடைய உள்ளது.`
          : `Order #${order.orderId || order.id} (${order.productName || order.item}, ${order.quantity || order.qty}) is out for delivery today.`;

        await this.createNotification({
          customId: todayNotifId,
          userId: farmerId,
          type: 'DELIVERY_TODAY',
          title,
          message: msg,
          orderId: order.orderId || order.id,
          productId: order.productId,
          productName: order.productName || order.item,
          quantity: order.quantity || order.qty,
          buyerName: order.buyerName || order.buyer,
          targetScreen: 'orders',
          isRead: false,
          scheduledFor: todayStr,
        });
      } else if (order.orderStatus === 'placed' || order.orderStatus === 'confirmed' || order.orderStatus === 'processing') {
        const title = isTamil ? 'வரவிருக்கும் ஆர்டர்' : 'Upcoming Order';
        const msg = isTamil
          ? `ஆர்டர் #${order.orderId || order.id} (${order.productName || order.item} — ${order.quantity || order.qty}) தயாரிப்பில் உள்ளது.`
          : `Order #${order.orderId || order.id} (${order.productName || order.item} — ${order.quantity || order.qty}) is scheduled for delivery.`;

        await this.createNotification({
          customId: upcomingNotifId,
          userId: farmerId,
          type: 'UPCOMING_ORDER',
          title,
          message: msg,
          orderId: order.orderId || order.id,
          productId: order.productId,
          productName: order.productName || order.item,
          quantity: order.quantity || order.qty,
          buyerName: order.buyerName || order.buyer,
          targetScreen: 'orders',
          isRead: false,
          scheduledFor: tomorrowStr,
        });
      }
    }
  },

  /**
   * Generates order status transition notification for buyer and farmer (Requirement 11).
   */
  async notifyOrderStatusChange(
    order: OrderDocument,
    newStatus: string,
    isTamil: boolean = false
  ): Promise<void> {
    let type: NotificationType = 'ORDER_CONFIRMED';
    let titleEn = 'Order Updated';
    let titleTa = 'ஆர்டர் புதுப்பிக்கப்பட்டது';
    let msgEn = `Order #${order.orderId || order.id} status changed to ${newStatus}.`;
    let msgTa = `ஆர்டர் #${order.orderId || order.id} நிலை: ${newStatus}.`;

    switch (newStatus) {
      case 'confirmed':
        type = 'ORDER_CONFIRMED';
        titleEn = 'Order Confirmed';
        titleTa = 'ஆர்டர் உறுதி செய்யப்பட்டது';
        msgEn = `Your order for ${order.productName || order.item} has been confirmed by the farmer.`;
        msgTa = `உங்கள் ${order.productName || order.item} ஆர்டர் விவசாயியால் உறுதி செய்யப்பட்டது.`;
        break;
      case 'shipped':
      case 'out_for_delivery':
        type = 'ORDER_DISPATCHED';
        titleEn = 'Order Dispatched';
        titleTa = 'ஆர்டர் அனுப்பப்பட்டது';
        msgEn = `Order #${order.orderId || order.id} is now on the way to your destination.`;
        msgTa = `ஆர்டர் #${order.orderId || order.id} உங்கள் முகவரிக்கு புறப்பட்டுள்ளது.`;
        break;
      case 'delivered':
        type = 'ORDER_DELIVERED';
        titleEn = 'Order Delivered';
        titleTa = 'ஆர்டர் ஒப்படைக்கப்பட்டது';
        msgEn = `Order #${order.orderId || order.id} has been delivered successfully.`;
        msgTa = `ஆர்டர் #${order.orderId || order.id} வெற்றிகரமாக ஒப்படைக்கப்பட்டது.`;
        break;
      case 'cancelled':
        type = 'ORDER_CANCELLED';
        titleEn = 'Order Cancelled';
        titleTa = 'ஆர்டர் ரத்து செய்யப்பட்டது';
        msgEn = `Order #${order.orderId || order.id} has been cancelled.`;
        msgTa = `ஆர்டர் #${order.orderId || order.id} ரத்து செய்யப்பட்டுள்ளது.`;
        break;
    }

    // Send notification to buyer
    if (order.buyerId) {
      await this.createNotification({
        userId: order.buyerId,
        type,
        title: isTamil ? titleTa : titleEn,
        message: isTamil ? msgTa : msgEn,
        orderId: order.orderId || order.id,
        productId: order.productId,
        productName: order.productName || order.item,
        quantity: order.quantity || order.qty,
        farmerName: order.farmerName,
        targetScreen: 'orders',
        isRead: false,
      });
    }

    // Also send confirmation/delivered note to farmer
    if (order.farmerId) {
      await this.createNotification({
        userId: order.farmerId,
        type,
        title: isTamil ? titleTa : titleEn,
        message: isTamil
          ? `ஆர்டர் #${order.orderId || order.id} (${order.productName || order.item}) நிலை: ${titleTa}.`
          : `Order #${order.orderId || order.id} (${order.productName || order.item}) updated to: ${titleEn}.`,
        orderId: order.orderId || order.id,
        productId: order.productId,
        productName: order.productName || order.item,
        quantity: order.quantity || order.qty,
        buyerName: order.buyerName || order.buyer,
        targetScreen: 'orders',
        isRead: false,
      });
    }
  },

  /**
   * Generates bulk order notification for farmer (Requirement 16).
   */
  async notifyBulkOrder(
    data: {
      farmerId: string;
      buyerId: string;
      buyerName: string;
      productName: string;
      quantity: number | string;
      bulkOrderId: string;
    },
    isTamil: boolean = false
  ): Promise<void> {
    const title = isTamil ? 'புதிய மொத்த விற்பனை கோரிக்கை' : 'New Bulk Order Request';
    const message = isTamil
      ? `${data.buyerName} என்பவர் ${data.quantity} kg ${data.productName} கோரியுள்ளார்.`
      : `${data.buyerName} requested ${data.quantity} kg of ${data.productName}.`;

    await this.createNotification({
      userId: data.farmerId,
      type: 'BULK_ORDER',
      title,
      message,
      bulkOrderId: data.bulkOrderId,
      productName: data.productName,
      quantity: data.quantity,
      buyerName: data.buyerName,
      targetScreen: 'bulk-requests',
      isRead: false,
    });
  },
};
