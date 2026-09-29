import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface BuyerAddress {
  addressId?: string;
  id?: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  addressType: 'home' | 'work' | 'shop' | 'mandi' | 'other';
  isDefault?: boolean;
  createdAt?: any;
}

export const addressService = {
  /**
   * Saves a new delivery address under users/{userId}/addresses/{addressId}
   */
  async saveAddress(userId: string, data: Omit<BuyerAddress, 'addressId' | 'id' | 'createdAt'>): Promise<string> {
    try {
      const colRef = collection(db, 'users', userId, 'addresses');
      const docRef = await addDoc(colRef, {
        ...data,
        createdAt: serverTimestamp(),
      });
      await setDoc(docRef, { addressId: docRef.id, id: docRef.id }, { merge: true });
      return docRef.id;
    } catch (err) {
      console.warn('Failed to save address to Firestore:', err);
      return `addr-${Date.now()}`;
    }
  },

  /**
   * Realtime subscription to addresses for a user
   */
  subscribeAddresses(userId: string, callback: (addresses: BuyerAddress[]) => void): () => void {
    const colRef = collection(db, 'users', userId, 'addresses');
    const q = query(colRef);

    return onSnapshot(
      q,
      (snapshot) => {
        const list: BuyerAddress[] = [];
        snapshot.forEach((snap) => {
          const d = snap.data();
          list.push({
            addressId: snap.id,
            id: snap.id,
            name: d.name || '',
            phone: d.phone || '',
            address: d.address || '',
            city: d.city || '',
            district: d.district || '',
            state: d.state || 'Tamil Nadu',
            pincode: d.pincode || '',
            latitude: d.latitude ?? null,
            longitude: d.longitude ?? null,
            addressType: d.addressType || 'home',
            isDefault: d.isDefault ?? false,
            createdAt: d.createdAt,
          });
        });
        callback(list);
      },
      (err) => {
        console.warn('Address subscription notice:', err);
        callback([]);
      }
    );
  },
};
