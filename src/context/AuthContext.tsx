import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { authService, RegisterCredentials } from '../services/authService';
import { farmerService, FarmerProfile, CreateFarmerProfileInput } from '../services/farmerService';
import { useLanguage } from './LanguageContext';

interface AuthContextType {
  user: User | null;
  farmerProfile: FarmerProfile | null;
  loading: boolean;
  error: string | null;
  register: (input: CreateFarmerProfileInput & { password: string }) => Promise<FarmerProfile>;
  login: (phoneNumber: string, password: string) => Promise<FarmerProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, setLanguage } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(() => {
    try {
      const cached = localStorage.getItem('uzhavan_current_farmer');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to Firebase Auth state on mount
  useEffect(() => {
    const unsubscribe = authService.onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profile = await farmerService.getFarmerProfile(firebaseUser.uid);
          if (profile) {
            setFarmerProfile(profile);
            localStorage.setItem('uzhavan_current_farmer', JSON.stringify(profile));
            // Synchronize language from saved profile if available
            if (profile.selectedLanguage && profile.selectedLanguage !== language) {
              setLanguage(profile.selectedLanguage);
            }
          }
        } catch (err) {
          console.warn('Error loading farmer profile on auth state change:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Register farmer with Firebase Auth + Firestore
  const register = async (
    input: CreateFarmerProfileInput & { password: string }
  ): Promise<FarmerProfile> => {
    setError(null);
    setLoading(true);

    try {
      // 1. Create authenticated user in Firebase Auth (password is securely hashed)
      const firebaseUser = await authService.registerFarmer({
        phoneNumber: input.phoneNumber,
        password: input.password,
      });

      // 2. Create profile document in Firestore (strictly NO passwords stored)
      const profile = await farmerService.createFarmerProfile(firebaseUser.uid, {
        name: input.name,
        phoneNumber: input.phoneNumber,
        location: input.location,
        cropType: input.cropType,
        landArea: input.landArea,
        landAreaUnit: input.landAreaUnit || 'acre',
        soilType: input.soilType,
        selectedLanguage: language || input.selectedLanguage || 'ta',
      });

      setFarmerProfile(profile);
      localStorage.setItem('uzhavan_current_farmer', JSON.stringify(profile));
      return profile;
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login farmer with Phone Number + Password
  const login = async (phoneNumber: string, password: string): Promise<FarmerProfile> => {
    setError(null);
    setLoading(true);

    try {
      // 1. Authenticate with Firebase Auth via deterministic identity mapping
      const firebaseUser = await authService.loginFarmer(phoneNumber, password);

      // 2. Retrieve farmer profile from Firestore
      let profile = await farmerService.getFarmerProfile(firebaseUser.uid);

      if (!profile) {
        // Fallback: Create initial profile if missing
        profile = await farmerService.createFarmerProfile(firebaseUser.uid, {
          name: 'Farmer Member',
          phoneNumber,
          location: 'Tamil Nadu',
          cropType: 'Produce',
          landArea: '1',
          landAreaUnit: 'acre',
          soilType: 'Alluvial',
          selectedLanguage: language,
        });
      }

      setFarmerProfile(profile);
      localStorage.setItem('uzhavan_current_farmer', JSON.stringify(profile));

      // Synchronize language if stored in profile
      if (profile.selectedLanguage) {
        setLanguage(profile.selectedLanguage);
      }

      return profile;
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout farmer
  const logout = async (): Promise<void> => {
    try {
      await authService.logoutFarmer();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setUser(null);
      setFarmerProfile(null);
      localStorage.removeItem('uzhavan_current_farmer');
    }
  };

  // Refetch profile
  const refreshProfile = async (): Promise<void> => {
    if (!user) return;
    try {
      const profile = await farmerService.getFarmerProfile(user.uid);
      if (profile) {
        setFarmerProfile(profile);
        localStorage.setItem('uzhavan_current_farmer', JSON.stringify(profile));
      }
    } catch (err) {
      console.warn('Could not refresh profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        farmerProfile,
        loading,
        error,
        register,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
