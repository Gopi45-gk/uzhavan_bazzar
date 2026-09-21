import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '../firebase/config';

/**
 * Deterministically maps a phone number to an internal Firebase Auth identity.
 * This ensures:
 * 1. The user logs in with ONLY Phone Number + Password.
 * 2. Firebase Authentication handles password hashing and security via scrypt.
 * 3. NO plaintext passwords are ever stored in Firestore or local storage.
 */
export const phoneToEmail = (phoneNumber: string): string => {
  const digits = phoneNumber.replace(/\D/g, '');
  const clean10 = digits.slice(-10);
  if (!clean10 || clean10.length < 10) {
    throw new Error('Please provide a valid 10-digit phone number.');
  }
  return `farmer_${clean10}@uzhavanbazzar.app`;
};

export interface RegisterCredentials {
  phoneNumber: string;
  password: string;
}

export const authService = {
  /**
   * Creates a new authenticated user in Firebase Auth.
   * Passwords are securely hashed by Firebase Auth.
   */
  async registerFarmer({ phoneNumber, password }: RegisterCredentials): Promise<User> {
    const email = phoneToEmail(phoneNumber);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  /**
   * Signs in an existing farmer using Phone Number + Password.
   */
  async loginFarmer(phoneNumber: string, password: string): Promise<User> {
    const email = phoneToEmail(phoneNumber);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  /**
   * Signs out the current user from Firebase Auth.
   */
  async logoutFarmer(): Promise<void> {
    await signOut(auth);
  },

  /**
   * Subscribes to Firebase Auth state changes.
   */
  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Returns current Firebase Auth user if available.
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  },
};
