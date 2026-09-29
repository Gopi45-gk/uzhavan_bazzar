import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  Phone,
  User,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  Navigation,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { authService } from '../services/authService';
import { detectCurrentLocation } from '../services/locationService';
import { VoiceInputButton } from './VoiceInputButton';
import { getLocalizedErrorMessage } from '../utils/errorMapper';

interface AuthModalProps {
  role: 'farmer' | 'buyer';
  mode: 'login' | 'register';
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ role, mode, onClose, onSuccess }) => {
  const { t, language } = useLanguage();
  const isFarmer = role === 'farmer';
  const isLogin = mode === 'login';

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States for location & validation
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Requirement 4 & 5: One-time automatic GPS location detection when registration modal opens
  useEffect(() => {
    if (mode === 'register') {
      triggerGpsDetection();
    }
  }, [mode]);

  const triggerGpsDetection = () => {
    setIsDetectingLocation(true);
    setLocationNotice(null);
    detectCurrentLocation()
      .then((res) => {
        setLocation(res.locationName);
        setCoordinates({
          latitude: res.latitude,
          longitude: res.longitude,
        });
      })
      .catch((err) => {
        console.warn('GPS location detection note:', err?.message || err);
        setLocationNotice(t('locationPermissionRequired'));
      })
      .finally(() => {
        setIsDetectingLocation(false);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const rawDigits = phoneNumber.replace(/\D/g, '');

    // Validation for Login
    if (isLogin) {
      if (rawDigits.length !== 10) {
        setValidationError(t('invalidPhone', 'Please enter a valid 10-digit mobile number.'));
        return;
      }
      if (!password) {
        setValidationError(t('pleaseEnterPassword', 'Please enter your password.'));
        return;
      }

      setLoading(true);
      try {
        await authService.loginUser(rawDigits, password, role);
        setStep('success');
      } catch (err: any) {
        setValidationError(getLocalizedErrorMessage(err, t));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Validation for Registration (Strictly 5 fields)
    // 1. Full Name
    if (!fullName.trim()) {
      setValidationError(t('pleaseEnterName', 'Please enter your full name.'));
      return;
    }

    // 2. Mobile Number
    if (rawDigits.length !== 10) {
      setValidationError(t('invalidPhone', 'Please enter a valid 10-digit mobile number.'));
      return;
    }

    // 3. Location
    if (!location.trim()) {
      setValidationError(t('pleaseEnterLocation', 'Please enter your current location.'));
      return;
    }

    // 4. Set Password
    if (!password) {
      setValidationError(t('pleaseEnterPassword', 'Please enter your password.'));
      return;
    }
    if (password.length < 4) {
      setValidationError(t('passwordMinLength', 'Password must be at least 4 characters.'));
      return;
    }

    // 5. Confirm Password
    if (password !== confirmPassword) {
      setValidationError(t('passwordsDoNotMatch', 'Passwords do not match.'));
      return;
    }

    setLoading(true);
    try {
      await authService.registerUser({
        role,
        fullName: fullName.trim(),
        phoneNumber: rawDigits,
        locationName: location.trim(),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        password,
        selectedLanguage: language || 'en',
      });
      setStep('success');
    } catch (err: any) {
      setValidationError(getLocalizedErrorMessage(err, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        id="auth-modal-overlay"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          id="auth-modal-dialog"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-hidden relative border border-neutral-100 max-h-[92vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="mb-5">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
              {isFarmer ? t('farmerPortal', '🌾 Farmer Portal') : t('buyerPortal', '🛒 Buyer Portal')}
            </span>
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
              {step === 'success'
                ? t('welcomeAboard', 'Welcome aboard!')
                : `${isLogin ? t('login', 'LOGIN') : t('register', 'REGISTER')} - ${
                    isFarmer ? t('farmer', 'Farmer') : t('buyer', 'Buyer')
                  }`}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              {isLogin
                ? t('loginSubtitle', 'Enter your registered mobile number and password to continue')
                : t('registerSubtitle', 'Create your account with Uzhavan Bazaar')}
            </p>
          </div>

          {/* Localized Validation / Error Banner */}
          <AnimatePresence>
            {validationError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{validationError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 'success' ? (
            <div className="py-6 flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>
              <h3 className="text-lg font-bold text-neutral-800">
                {isLogin
                  ? t('loginSuccess', 'Signed in successfully!')
                  : t('registrationSuccess', 'Registration successful!')}
              </h3>
              <p className="text-sm text-neutral-500 mt-1 max-w-xs">
                {t('directProduceDesc', 'Direct agricultural produce from farmer to buyer.')}
              </p>
              <button
                id="auth-finish-btn"
                onClick={() => {
                  if (onSuccess) {
                    onSuccess();
                  } else {
                    onClose();
                  }
                }}
                className="mt-6 w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base transition-colors cursor-pointer"
              >
                {t('continueToDashboard', 'Continue to Dashboard')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* REGISTRATION: EXACTLY 5 FIELDS */}
              {!isLogin ? (
                <>
                  {/* FIELD 1: FULL NAME (with Mic inside input) */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      {t('name', 'FULL NAME')}
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reg-input-fullname"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t('namePlaceholder', 'e.g. Murugan S')}
                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        <VoiceInputButton
                          id="mic-reg-fullname"
                          onTranscript={(text) => setFullName(text)}
                          title="Speak full name"
                        />
                      </div>
                    </div>
                  </div>

                  {/* FIELD 2: MOBILE NUMBER (with Mic inside input) */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      {t('phoneNumber', 'MOBILE NUMBER')}
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-neutral-500 font-semibold text-sm pointer-events-none">
                        <Phone className="w-4 h-4 text-neutral-400 mr-1" />
                        +91
                      </div>
                      <input
                        id="reg-input-phone"
                        type="tel"
                        maxLength={10}
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder={t('phonePlaceholder', '98765 43210')}
                        className="w-full pl-20 pr-12 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium tracking-wide"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        <VoiceInputButton
                          id="mic-reg-phone"
                          isNumeric
                          onTranscript={(num) => setPhoneNumber(num)}
                          title="Speak mobile number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* FIELD 3: LOCATION (GPS Auto-detect + Reverse Geocoding + Mic inside input) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        {t('location', 'LOCATION')}
                      </label>
                      {isDetectingLocation ? (
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> {t('detectingGps', 'Detecting GPS...')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={triggerGpsDetection}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                          title="Re-detect GPS location"
                        >
                          <Navigation className="w-3 h-3" /> {t('autoDetect', 'Auto-Detect')}
                        </button>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reg-input-location"
                        type="text"
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder={
                          isDetectingLocation ? t('detectingLocation', 'Detecting current location...') : t('locationPlaceholder', 'Current Location')
                        }
                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        <VoiceInputButton
                          id="mic-reg-location"
                          onTranscript={(text) => setLocation(text)}
                          title="Speak location"
                        />
                      </div>
                    </div>
                    {locationNotice && (
                      <p className="text-[11px] text-neutral-500 mt-1 leading-tight">{locationNotice}</p>
                    )}
                  </div>

                  {/* FIELD 4: SET PASSWORD (with Eye toggle + Mic inside input) */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      {t('password', 'SET PASSWORD')}
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reg-input-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('passwordPlaceholder', 'Password')}
                        className="w-full pl-10 pr-20 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <VoiceInputButton
                          id="mic-reg-password"
                          onTranscript={(text) => setPassword(text)}
                          title="Speak password"
                        />
                        <button
                          type="button"
                          id="toggle-eye-password"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* FIELD 5: CONFIRM PASSWORD (with Eye toggle + Mic inside input) */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      {t('confirmPassword', 'CONFIRM PASSWORD')}
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reg-input-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('confirmPasswordPlaceholder', 'Confirm Password')}
                        className="w-full pl-10 pr-20 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <VoiceInputButton
                          id="mic-reg-confirm-password"
                          onTranscript={(text) => setConfirmPassword(text)}
                          title="Speak confirm password"
                        />
                        <button
                          type="button"
                          id="toggle-eye-confirm-password"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                          title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* LOGIN FORM: Mobile Number + Password */
                <>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      {t('phoneNumber', 'MOBILE NUMBER')}
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-neutral-500 font-semibold text-sm pointer-events-none">
                        <Phone className="w-4 h-4 text-neutral-400 mr-1" />
                        +91
                      </div>
                      <input
                        id="login-input-phone"
                        type="tel"
                        maxLength={10}
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder={t('phonePlaceholder', '98765 43210')}
                        className="w-full pl-20 pr-12 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium tracking-wide"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        <VoiceInputButton
                          id="mic-login-phone"
                          isNumeric
                          onTranscript={(num) => setPhoneNumber(num)}
                          title="Speak mobile number"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                      {t('password', 'PASSWORD')}
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="login-input-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('passwordPlaceholder', 'Password')}
                        className="w-full pl-10 pr-20 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <VoiceInputButton
                          id="mic-login-password"
                          onTranscript={(text) => setPassword(text)}
                          title="Speak password"
                        />
                        <button
                          type="button"
                          id="toggle-eye-login-password"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Submit Action Button */}
              <button
                id="auth-modal-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] text-black font-extrabold text-base tracking-wide flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-black" />
                    <span>{t('processing', 'Processing...')}</span>
                  </>
                ) : (
                  <>
                    <span>{isLogin ? (t('login', 'LOGIN')) : (t('register', 'REGISTER'))}</span>
                    <ArrowRight className="w-5 h-5 text-black" />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
