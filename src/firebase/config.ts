import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: "AIzaSyCuU1hdw2JXb-CIanD_vvbpGyc1y4KYSXY",
  authDomain: "uzhavanbazzar.firebaseapp.com",
  projectId: "uzhavanbazzar",
  storageBucket: "uzhavanbazzar.firebasestorage.app",
  messagingSenderId: "257094814305",
  appId: "1:257094814305:web:2bd773b7774b762afc3820",
  measurementId: "G-VE5D3DS9TW"
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

