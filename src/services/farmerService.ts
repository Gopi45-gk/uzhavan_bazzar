import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { LanguageCode } from '../types';

export interface FarmerProfile {
  uid: string;
  name: string;
  phoneNumber: string;
  location: string;
  cropType: string;
  landArea: number | string;
  landAreaUnit: string;
  soilType: string;
  selectedLanguage: LanguageCode;
  role: 'farmer';
  createdAt?: any;
  updatedAt?: any;
}

export type CreateFarmerProfileInput = Omit<
  FarmerProfile,
  'role' | 'createdAt' | 'updatedAt'
>;

export const farmerService = {
  /**
   * Stores a new farmer profile in Firestore under /farmers/{uid}.
   * STRICT SECURITY INVARIANT: Passwords are NEVER written to Firestore.
   */
  async createFarmerProfile(
    uid: string,
    input: CreateFarmerProfileInput
  ): Promise<FarmerProfile> {
    const docRef = doc(db, 'farmers', uid);

    // Format phone number to clean E.164-style e.g. +919876543210
    const rawDigits = input.phoneNumber.replace(/\D/g, '').slice(-10);
    const formattedPhone = `+91${rawDigits}`;

    const numArea = parseFloat(String(input.landArea)) || input.landArea;

    const profileData: FarmerProfile = {
      uid,
      name: input.name.trim(),
      phoneNumber: formattedPhone,
      location: input.location.trim(),
      cropType: input.cropType.trim(),
      landArea: numArea,
      landAreaUnit: input.landAreaUnit || 'acre',
      soilType: input.soilType.trim(),
      selectedLanguage: input.selectedLanguage || 'ta',
      role: 'farmer',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, profileData);
    return profileData;
  },

  /**
   * Retrieves a farmer profile by UID from /farmers/{uid}.
   */
  async getFarmerProfile(uid: string): Promise<FarmerProfile | null> {
    const docRef = doc(db, 'farmers', uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return docSnap.data() as FarmerProfile;
  },

  /**
   * Updates the farmer's preferred UI language in their Firestore profile.
   */
  async updateFarmerLanguage(uid: string, language: LanguageCode): Promise<void> {
    const docRef = doc(db, 'farmers', uid);
    await updateDoc(docRef, {
      selectedLanguage: language,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Updates partial farmer profile fields.
   */
  async updateFarmerProfile(
    uid: string,
    updates: Partial<Omit<FarmerProfile, 'uid' | 'createdAt'>>
  ): Promise<void> {
    const docRef = doc(db, 'farmers', uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },
};
