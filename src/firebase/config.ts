import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Web app's Firebase configuration provided by the user
export const firebaseConfig = {
  apiKey: "AIzaSyC9HzPn-aQCdmESzLgkBqciSNdgHwM0Zv4",
  authDomain: "uzhavan-bazzar.firebaseapp.com",
  projectId: "uzhavan-bazzar",
  storageBucket: "uzhavan-bazzar.firebasestorage.app",
  messagingSenderId: "210899730862",
  appId: "1:210899730862:web:d5bd88cdc1d472cf8f883f",
  measurementId: "G-C948SCW5TJ"
};

// Initialize Firebase once
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Authentication instance
export const auth = getAuth(app);

// Cloud Firestore instance
export const db = getFirestore(app);

// Firebase Storage instance
export const storage = getStorage(app);

// Analytics instance (deferred initialization to avoid ERR_NETWORK_CHANGED during startup)
export let analytics: any = null;
if (typeof window !== 'undefined') {
  // Delay analytics init to let the network stabilize after page load
  setTimeout(() => {
    if (navigator.onLine) {
      isSupported()
        .then((supported) => {
          if (supported) {
            try {
              analytics = getAnalytics(app);
            } catch {
              // Analytics initialization failed silently
            }
          }
        })
        .catch(() => {
          // Analytics is optional — no-op
        });
    }
  }, 3000);
}

