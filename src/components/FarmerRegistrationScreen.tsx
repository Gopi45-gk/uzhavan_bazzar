import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Mic, Eye, EyeOff, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useVoiceInput, VoiceFieldType } from '../hooks/useVoiceInput';

interface FarmerRegistrationScreenProps {
  onBack: () => void;
  onGoToLogin: () => void;
  onRegistrationSuccess: () => void;
}

export const FarmerRegistrationScreen: React.FC<FarmerRegistrationScreenProps> = ({
  onBack,
  onGoToLogin,
  onRegistrationSuccess,
}) => {
  const { t, language } = useLanguage();
  const { register } = useAuth();

  // Form field states matching Reference 3
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [cropType, setCropType] = useState('');
  const [landArea, setLandArea] = useState('');
  const [soilType, setSoilType] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation / Error / Success states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Voice recognition integration
  const handleVoiceTranscript = (field: VoiceFieldType, transcript: string) => {
    switch (field) {
      case 'name':
        setName(transcript);
        break;
      case 'phone':
        setPhoneNumber(transcript);
        break;
      case 'location':
        setLocation(transcript);
        break;
      case 'cropType':
        setCropType(transcript);
        break;
      case 'landArea':
        setLandArea(transcript);
        break;
      case 'soilType':
        setSoilType(transcript);
        break;
      case 'password':
        setPassword(transcript);
        break;
      case 'confirmPassword':
        setConfirmPassword(transcript);
        break;
      default:
        break;
    }
  };

  const { isListening, activeField, error: voiceError, startListening, stopListening } = useVoiceInput({
    onTranscript: handleVoiceTranscript,
  });

  const handleMicClick = (field: VoiceFieldType) => {
    if (isListening && activeField === field) {
      stopListening();
    } else {
      startListening(field);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // 1. Name validation
    if (!name.trim()) {
      setValidationError(t('pleaseEnterName', 'Please enter your name.'));
      return;
    }

    // 2. Phone validation
    const rawDigits = phoneNumber.replace(/\D/g, '');
    if (rawDigits.length < 10) {
      setValidationError(t('invalidPhone', 'Please enter a valid 10-digit phone number.'));
      return;
    }

    // 3. Location validation
    if (!location.trim()) {
      setValidationError(t('pleaseEnterLocation', 'Please enter your location.'));
      return;
    }

    // 4. Crop type validation
    if (!cropType.trim()) {
      setValidationError(t('pleaseEnterCropType', 'Please enter your crop type.'));
      return;
    }

    // 5. Land area validation
    if (!landArea.trim()) {
      setValidationError(t('pleaseEnterLandArea', 'Please enter your land area.'));
      return;
    }

    // 6. Soil type validation
    if (!soilType.trim()) {
      setValidationError(t('pleaseEnterSoilType', 'Please enter your soil type.'));
      return;
    }

    // 7. Password validation
    if (!password) {
      setValidationError(t('pleaseEnterPassword', 'Please enter your password.'));
      return;
    }
    if (password.length < 4) {
      setValidationError(t('passwordMinLength', 'Password must be at least 4 characters.'));
      return;
    }

    // 8. Confirm password match
    if (password !== confirmPassword) {
      setValidationError(t('passwordsDoNotMatch', 'Passwords do not match.'));
      return;
    }

    // Register with Firebase Authentication and Cloud Firestore
    setIsSubmitting(true);
    register({
      name: name.trim(),
      phoneNumber: rawDigits.slice(-10),
      location: location.trim(),
      cropType: cropType.trim(),
      landArea: landArea.trim(),
      landAreaUnit: 'acre',
      soilType: soilType.trim(),
      selectedLanguage: language || 'ta',
      password,
    })
      .then(() => {
        setIsSuccess(true);
        setTimeout(() => {
          onRegistrationSuccess();
        }, 1500);
      })
      .catch((err: any) => {
        console.warn('Firebase registration error:', err);
        if (err?.code === 'auth/email-already-in-use') {
          setValidationError(t('alreadyRegistered', 'An account already exists with this phone number. Please login.'));
        } else if (err?.code === 'auth/weak-password') {
          setValidationError(t('passwordMinLength', 'Password must be at least 6 characters.'));
        } else {
          setValidationError(err?.message || t('registrationFailed', 'Registration failed. Please try again.'));
        }
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div
      id="farmer-registration-screen-root"
      className="relative w-full h-full flex flex-col justify-between px-4 sm:px-6 py-4 overflow-y-auto bg-[#FAFAFA]"
    >
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col pb-8">
        {/* Top Header with Back Arrow */}
        <div className="w-full flex items-center justify-between pt-1 pb-3">
          <button
            id="register-back-btn"
            onClick={onBack}
            className="p-2 -ml-2 text-neutral-600 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors"
            title={t('back', 'Back')}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-right">
            <button
              onClick={onGoToLogin}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              {t('alreadyRegistered', 'Already registered?')}{' '}
              <span className="underline">{t('login', 'Login')}</span>
            </button>
          </div>
        </div>

        {/* Localized Voice Error Banner */}
        <AnimatePresence>
          {voiceError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{voiceError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Localized Validation Error Banner */}
        <AnimatePresence>
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{validationError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Localized Registration Success Banner */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-bold flex items-center gap-3 shadow-xs"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p>{t('registrationSuccess', 'Registration successful.')}</p>
                <p className="text-xs font-normal text-emerald-700 mt-0.5">
                  {t('loginHere', 'Redirecting to login...')}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Registration Form strictly matching Reference Image 3 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* FIELD 1: Name */}
          <div>
            <label className="block text-xs font-black text-black tracking-wider uppercase mb-1 px-1">
              {t('name', 'Name')}
            </label>
            <div className="relative flex items-center">
              <input
                id="reg-input-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('namePlaceholder', 'Name')}
                className="w-full h-13 px-5 pr-12 rounded-full bg-[#2ECC71] text-black font-semibold text-sm placeholder-emerald-900/60 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-xs transition-all"
              />
              <button
                type="button"
                id="mic-btn-name"
                onClick={() => handleMicClick('name')}
                className={`absolute right-3.5 p-2 rounded-full transition-colors ${
                  isListening && activeField === 'name'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-black/75 hover:text-black hover:bg-black/10'
                }`}
                title="Voice input for Name"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* FIELD 2: PHONE NUMBER */}
          <div>
            <label className="block text-xs font-black text-black tracking-wider uppercase mb-1 px-1">
              {t('phoneNumber', 'PHONE NUMBER')}
            </label>
            <div className="relative flex items-center">
              <input
                id="reg-input-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t('phonePlaceholder', '91+ 1234567890')}
                className="w-full h-13 px-5 pr-12 rounded-full bg-[#2ECC71] text-black font-semibold text-sm placeholder-emerald-900/60 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-xs transition-all"
              />
              <button
                type="button"
                id="mic-btn-phone"
                onClick={() => handleMicClick('phone')}
                className={`absolute right-3.5 p-2 rounded-full transition-colors ${
                  isListening && activeField === 'phone'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-black/75 hover:text-black hover:bg-black/10'
                }`}
                title="Voice input for Phone Number"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* FIELD 3: LOCATION */}
          <div>
            <label className="block text-xs font-black text-black tracking-wider uppercase mb-1 px-1">
              {t('location', 'LOCATION')}
            </label>
            <div className="relative flex items-center">
              <input
                id="reg-input-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('locationPlaceholder', 'Location')}
                className="w-full h-13 px-5 pr-12 rounded-full bg-[#2ECC71] text-black font-semibold text-sm placeholder-emerald-900/60 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-xs transition-all"
              />
              <button
                type="button"
                id="mic-btn-location"
                onClick={() => handleMicClick('location')}
                className={`absolute right-3.5 p-2 rounded-full transition-colors ${
                  isListening && activeField === 'location'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-black/75 hover:text-black hover:bg-black/10'
                }`}
                title="Voice input for Location"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* FIELD 4: CROP TYPE */}
          <div>
            <label className="block text-xs font-black text-black tracking-wider uppercase mb-1 px-1">
              {t('cropType', 'CROP TYPE')}
            </label>
            <div className="relative flex items-center">
              <input
                id="reg-input-crop-type"
                type="text"
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                placeholder={t('cropTypePlaceholder', 'Crop Type')}
                className="w-full h-13 px-5 pr-12 rounded-full bg-[#2ECC71] text-black font-semibold text-sm placeholder-emerald-900/60 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-xs transition-all"
              />
              <button
                type="button"
                id="mic-btn-crop-type"
                onClick={() => handleMicClick('cropType')}
                className={`absolute right-3.5 p-2 rounded-full transition-colors ${
                  isListening && activeField === 'cropType'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-black/75 hover:text-black hover:bg-black/10'
                }`}
                title="Voice input for Crop Type"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* FIELD 5: LAND AREA */}
          <div>
            <label className="block text-xs font-black text-black tracking-wider uppercase mb-1 px-1">
              {t('landArea', 'LAND AREA')}
            </label>
            <div className="relative flex items-center">
              <input
                id="reg-input-land-area"
                type="text"
                value={landArea}
                onChange={(e) => setLandArea(e.target.value)}
                placeholder={t('landAreaPlaceholder', 'Land Area')}
                className="w-full h-13 px-5 pr-12 rounded-full bg-[#2ECC71] text-black font-semibold text-sm placeholder-emerald-900/60 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-xs transition-all"
              />
              <button
                type="button"
                id="mic-btn-land-area"
                onClick={() => handleMicClick('landArea')}
                className={`absolute right-3.5 p-2 rounded-full transition-colors ${
                  isListening && activeField === 'landArea'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-black/75 hover:text-black hover:bg-black/10'
                }`}
                title="Voice input for Land Area"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* FIELD 6: SOIL TYPE */}
          <div>
            <label className="block text-xs font-black text-black tracking-wider uppercase mb-1 px-1">
              {t('soilType', 'SOIL TYPE')}
            </label>
            <div className="relative flex items-center">
              <input
                id="reg-input-soil-type"
                type="text"
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                placeholder={t('soilTypePlaceholder', 'Soil Type')}
                className="w-full h-13 px-5 pr-12 rounded-full bg-[#2ECC71] text-black font-semibold text-sm placeholder-emerald-900/60 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-xs transition-all"
              />
              <button
                type="button"
                id="mic-btn-soil-type"
                onClick={() => handleMicClick('soilType')}
                className={`absolute right-3.5 p-2 rounded-full transition-colors ${
                  isListening && activeField === 'soilType'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-black/75 hover:text-black hover:bg-black/10'
                }`}
                title="Voice input for Soil Type"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* FIELD 7: PASSWORD */}
          <div>
            <label className="block text-xs font-black text-black tracking-wider uppercase mb-1 px-1">
              {t('password', 'PASSWORD')}
            </label>
            <div className="relative flex items-center">
              <input
                id="reg-input-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder', 'Password')}
                className="w-full h-13 px-5 pr-20 rounded-full bg-[#2ECC71] text-black font-semibold text-sm placeholder-emerald-900/60 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-xs transition-all"
              />
              <div className="absolute right-3.5 flex items-center gap-1">
                <button
                  type="button"
                  id="mic-btn-password"
                  onClick={() => handleMicClick('password')}
                  className={`p-1.5 rounded-full transition-colors ${
                    isListening && activeField === 'password'
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'text-black/75 hover:text-black'
                  }`}
                  title="Voice input for Password"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  id="toggle-eye-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 rounded-full text-black/75 hover:text-black transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* FIELD 8: CONFIRM PASSWORD */}
          <div>
            <label className="block text-xs font-black text-black tracking-wider uppercase mb-1 px-1">
              {t('confirmPassword', 'CONFIRM PASSWORD')}
            </label>
            <div className="relative flex items-center">
              <input
                id="reg-input-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder', 'Confirm Password')}
                className="w-full h-13 px-5 pr-20 rounded-full bg-[#2ECC71] text-black font-semibold text-sm placeholder-emerald-900/60 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-xs transition-all"
              />
              <div className="absolute right-3.5 flex items-center gap-1">
                <button
                  type="button"
                  id="mic-btn-confirm-password"
                  onClick={() => handleMicClick('confirmPassword')}
                  className={`p-1.5 rounded-full transition-colors ${
                    isListening && activeField === 'confirmPassword'
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'text-black/75 hover:text-black'
                  }`}
                  title="Voice input for Confirm Password"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  id="toggle-eye-confirm-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1.5 rounded-full text-black/75 hover:text-black transition-colors"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Active Listening Indicator */}
          {isListening && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-emerald-800 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>{t('listening', 'Listening...')} {t('speakNow', 'Speak now...')}</span>
            </div>
          )}

          {/* Bottom Register Button matching Reference Image 3 */}
          <div className="pt-2">
            <motion.button
              id="farmer-registration-submit-btn"
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-13 rounded-full bg-[#86EFAC] hover:bg-[#6EE7B7] text-black font-extrabold text-base tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-5 h-5 text-black stroke-[2.3]" />
              <span>{t('register', 'Register')}</span>
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};
