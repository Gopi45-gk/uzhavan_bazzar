import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { authService } from './authService';
import { LanguageCode } from '../types';

export interface FarmerProfile {
  uid: string;
  name: string;
  fullName?: string;
  phoneNumber: string;
  mobileNumber?: string;
  location: string;
  cropType: string;
  landArea: number | string;
  landAreaUnit: string;
  soilType: string;
  selectedLanguage: LanguageCode;
  language?: LanguageCode;
  role: 'farmer';
  verified: boolean;
  latitude?: number | null;
  longitude?: number | null;
  createdAt?: any;
  updatedAt?: any;
}

export const DEFAULT_FARMER: FarmerProfile = {
  uid: 'farmer-default-murugan',
  name: 'Murugan S.',
  fullName: 'Murugan S.',
  phoneNumber: '+91 98421 55670',
  mobileNumber: '+91 98421 55670',
  location: 'Madurai Rural, Tamil Nadu',
  cropType: 'Tomato, Shallots, Green Chilli',
  landArea: 4.5,
  landAreaUnit: 'Acres',
  soilType: 'Red Loam Soil',
  selectedLanguage: 'ta',
  language: 'ta',
  role: 'farmer',
  verified: true,
  latitude: 9.9252,
  longitude: 78.1198,
};

const LOCAL_STORAGE_KEY = 'uzhavan_farmer_profile';

export const farmerService = {
  /**
   * Retrieves or creates farmer profile in Firestore users/{uid} and farmers/{uid}.
   * If uid is not explicitly supplied, reads the active session/authenticated farmer.
   */
  async getProfile(passedUid?: string): Promise<FarmerProfile> {
    const session = typeof window !== 'undefined' ? authService.getCurrentSession() : null;
    const activeUid = passedUid && passedUid !== DEFAULT_FARMER.uid
      ? passedUid
      : session?.uid || auth.currentUser?.uid || DEFAULT_FARMER.uid;

    const sessionMatches = session && (session.uid === activeUid || !passedUid);

    const baseProfile: FarmerProfile = {
      ...DEFAULT_FARMER,
      uid: activeUid,
      name: (sessionMatches ? session.fullName || session.name : null) || DEFAULT_FARMER.name,
      fullName: (sessionMatches ? session.fullName || session.name : null) || DEFAULT_FARMER.fullName,
      phoneNumber: (sessionMatches ? session.mobileNumber || session.phoneNumber : null) || DEFAULT_FARMER.phoneNumber,
      mobileNumber: (sessionMatches ? session.mobileNumber || session.phoneNumber : null) || DEFAULT_FARMER.mobileNumber,
      location: (sessionMatches ? session.location : null) || DEFAULT_FARMER.location,
      latitude: (sessionMatches ? session.latitude : null) ?? DEFAULT_FARMER.latitude,
      longitude: (sessionMatches ? session.longitude : null) ?? DEFAULT_FARMER.longitude,
      selectedLanguage: (sessionMatches && session.language ? session.language : 'ta') as LanguageCode,
      language: (sessionMatches && session.language ? session.language : 'ta') as LanguageCode,
    };

    try {
      // 1. Check primary users/{activeUid}
      const userRef = doc(db, 'users', activeUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const uData = userSnap.data();
        const prof: FarmerProfile = {
          ...baseProfile,
          uid: activeUid,
          name: uData.fullName || uData.name || baseProfile.name,
          fullName: uData.fullName || uData.name || baseProfile.fullName,
          phoneNumber: uData.mobileNumber || uData.phoneNumber || baseProfile.phoneNumber,
          mobileNumber: uData.mobileNumber || uData.phoneNumber || baseProfile.mobileNumber,
          location: uData.location || uData.locationName || baseProfile.location,
          latitude: uData.latitude ?? baseProfile.latitude,
          longitude: uData.longitude ?? baseProfile.longitude,
          selectedLanguage: (uData.language || uData.selectedLanguage || baseProfile.selectedLanguage) as LanguageCode,
          language: (uData.language || uData.selectedLanguage || baseProfile.language) as LanguageCode,
          cropType: uData.cropType || baseProfile.cropType,
          landArea: uData.landArea ?? baseProfile.landArea,
          landAreaUnit: uData.landAreaUnit || baseProfile.landAreaUnit,
          soilType: uData.soilType || baseProfile.soilType,
        };
        try {
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_${activeUid}`, JSON.stringify(prof));
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prof));
        } catch {}
        return prof;
      }

      // 2. Fallback to legacy farmers/{activeUid}
      const docRef = doc(db, 'farmers', activeUid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as any;
        const prof: FarmerProfile = {
          ...baseProfile,
          ...data,
          name: data.fullName || data.name || baseProfile.name,
          phoneNumber: data.mobileNumber || data.phoneNumber || baseProfile.phoneNumber,
          location: data.location || data.locationName || baseProfile.location,
        };
        try {
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_${activeUid}`, JSON.stringify(prof));
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prof));
        } catch {}
        return prof;
      }

      // 3. If neither exists, write registered session profile to users/{activeUid}
      if (activeUid && activeUid !== DEFAULT_FARMER.uid) {
        const initialProfile = {
          ...baseProfile,
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, initialProfile, { merge: true }).catch(() => {});
        await setDoc(docRef, initialProfile, { merge: true }).catch(() => {});
      }

      return baseProfile;
    } catch (err: any) {
      if (err?.code !== 'permission-denied') {
        console.warn('Farmer profile sync notice:', err?.message || err);
      }
      try {
        const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${activeUid}`) || localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.uid === activeUid || sessionMatches)) {
            return { ...baseProfile, ...parsed };
          }
        }
      } catch {}
      return baseProfile;
    }
  },

  /**
   * Updates farmer profile fields in Firestore users/{uid} and farmers/{uid}.
   */
  async updateProfile(uid: string, updates: Partial<FarmerProfile>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      const farmerRef = doc(db, 'farmers', uid);

      const updatePayload = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userRef, updatePayload).catch(() => setDoc(userRef, updatePayload, { merge: true }));
      await updateDoc(farmerRef, updatePayload).catch(() => setDoc(farmerRef, updatePayload, { merge: true }));

      // Update local storage
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      const current = cached ? JSON.parse(cached) : DEFAULT_FARMER;
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ ...current, ...updates })
      );
    } catch (err) {
      console.warn('Failed to update farmer profile in Firestore:', err);
    }
  },
};
