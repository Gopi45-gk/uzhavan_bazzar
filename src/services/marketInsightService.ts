import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface MarketRate {
  id: string;
  name: string;
  mandi: string;
  rate: string;
  trend: string;
  up: boolean;
  updatedAt?: any;
}

const INITIAL_RATES: MarketRate[] = [
  { id: 'rate-1', name: 'Tomatoes', mandi: 'Koyambedu', rate: '₹36 - ₹42 / Kg', trend: '+8%', up: true },
  { id: 'rate-2', name: 'Small Onions / Shallots', mandi: 'Madurai', rate: '₹44 - ₹50 / Kg', trend: '+4%', up: true },
  { id: 'rate-3', name: 'Big Onions', mandi: 'Trichy', rate: '₹28 - ₹32 / Kg', trend: '-2%', up: false },
  { id: 'rate-4', name: 'Green Chillies', mandi: 'Tiruppur', rate: '₹52 - ₹60 / Kg', trend: '+12%', up: true },
  { id: 'rate-5', name: 'Carrots', mandi: 'Ooty / Mettupalayam', rate: '₹40 - ₹48 / Kg', trend: '+3%', up: true },
];

const LOCAL_STORAGE_KEY = 'uzhavan_cached_market_rates';

export const marketInsightService = {
  /**
   * Subscribe to real-time market rates from Firestore /market_rates.
   */
  subscribeRates(callback: (rates: MarketRate[]) => void): () => void {
    const colRef = collection(db, 'market_rates');
    const q = query(colRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          this.seedInitialRates();
          callback(INITIAL_RATES);
          return;
        }

        const items: MarketRate[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          items.push({
            id: docSnap.id,
            name: d.name || 'Produce',
            mandi: d.mandi || 'Market',
            rate: d.rate || '₹0 / Kg',
            trend: d.trend || '0%',
            up: d.up ?? true,
            updatedAt: d.updatedAt,
          });
        });

        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
        } catch {
          // ignore
        }

        callback(items);
      },
      (err: any) => {
        if (err?.code !== 'permission-denied') {
          console.warn('Firestore rates sync:', err?.message || err);
        }
        try {
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (cached) {
            callback(JSON.parse(cached));
            return;
          }
        } catch {
          // ignore
        }
        callback(INITIAL_RATES);
      }
    );

    return unsubscribe;
  },

  /**
   * Seeds initial market rates to Firestore.
   */
  async seedInitialRates(): Promise<void> {
    try {
      const colRef = collection(db, 'market_rates');
      for (const rate of INITIAL_RATES) {
        const docRef = doc(colRef, rate.id);
        await setDoc(docRef, {
          ...rate,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Auto-seed market rates failed:', err);
    }
  },
};
