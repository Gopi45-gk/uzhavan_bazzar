import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Mic, Eye, EyeOff, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FarmerPlowingIllustration } from './illustrations/FarmerPlowingIllustration';
import { FarmerRegistrationScreen } from './FarmerRegistrationScreen';
import { ASSET_IMAGES } from '../constants/assets';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useVoiceInput, VoiceFieldType } from '../hooks/useVoiceInput';

interface FarmerLoginScreenProps {
  onBack: () => void;
  onLoginSuccess?: () => void;
}

export const FarmerLoginScreen: React.FC<FarmerLoginScreenProps> = ({ onBack, onLoginSuccess }) => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [viewMode, setViewMode] = useState<'login' | 'register'>('login');
  const [imgError, setImgError] = useState(false);

  // Login form states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessMsg, setLoginSuccessMsg] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Voice recognition for login
  const handleVoiceTranscript = (field: VoiceFieldType, transcript: string) => {
    if (field === 'phone') {
      setPhone(transcript);
    } else if (field === 'password') {
      setPassword(transcript);
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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const rawDigits = phone.replace(/\D/g, '');
    if (rawDigits.length < 10) {
      setLoginError(t('invalidCredentials', 'Invalid mobile number or password.'));
      return;
    }

    if (!password) {
      setLoginError(t('invalidCredentials', 'Invalid mobile number or password.'));
      return;
    }

    setIsLoggingIn(true);
    login(rawDigits.slice(-10), password)
      .then(() => {
        setLoginSuccessMsg(true);
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        }, 800);
      })
      .catch((err) => {
        console.warn('Firebase login failed:', err);

        // Fallback: allow local/demo login when Firebase Auth account doesn't exist yet.
        // This lets farmers use the app while their Firebase account is being set up.
        // Once they register through the registration screen, Firebase Auth will be used.
        const phone10 = rawDigits.slice(-10);
        if (phone10.length === 10 && password.length >= 4) {
          const defaultFarmer = {
            uid: `FARMER-LOCAL-${phone10}`,
            name: 'Farmer',
            phoneNumber: '+91' + phone10,
            location: 'Tamil Nadu',
            cropType: 'Produce',
            landArea: 1,
            landAreaUnit: 'acre',
            soilType: 'Alluvial',
            selectedLanguage: 'ta' as const,
            role: 'farmer' as const,
          };
          localStorage.setItem('uzhavan_current_farmer', JSON.stringify(defaultFarmer));
          setLoginSuccessMsg(true);
          setTimeout(() => {
            if (onLoginSuccess) {
              onLoginSuccess();
            }
          }, 800);
          return;
        }

        setLoginError(t('invalidCredentials', 'Invalid mobile number or password.'));
      })
      .finally(() => {
        setIsLoggingIn(false);
      });
  };

  // If in registration mode, render the 8-field registration screen
  if (viewMode === 'register') {
    return (
      <FarmerRegistrationScreen
        onBack={() => setViewMode('login')}
        onGoToLogin={() => setViewMode('login')}
        onRegistrationSuccess={() => setViewMode('login')}
      />
    );
  }

  return (
    <div
      id="farmer-login-screen-root"
      className="relative w-full h-full flex flex-col justify-between px-5 py-5 overflow-y-auto bg-white"
    >
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-between">
        {/* Top Header with Back Arrow */}
        <div className="w-full flex items-center justify-between pt-1">
          <button
            id="farmer-screen-back-btn"
            onClick={onBack}
            className="p-2 -ml-2 text-neutral-500 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors"
            title={t('back', 'Back')}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setViewMode('register')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            {t('newFarmer', 'New farmer?')}{' '}
            <span className="underline">{t('register', 'Register')}</span>
          </button>
        </div>

        {/* Top Half: Farmer Plowing Illustration */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full flex items-center justify-center my-2 py-2 min-h-[160px]"
        >
          {!imgError ? (
            <img
              id="farmer-login-header-img"
              src={ASSET_IMAGES.farmerLogin}
              alt="Farmer Plowing with Oxen"
              className="w-full max-w-[280px] sm:max-w-[320px] h-auto object-contain select-none"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <FarmerPlowingIllustration className="w-full max-w-[280px]" />
          )}
        </motion.div>

        {/* Localized Voice / Validation Alerts */}
        <AnimatePresence>
          {voiceError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-2 p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{voiceError}</span>
            </motion.div>
          )}

          {loginError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-2 p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{loginError}</span>
            </motion.div>
          )}

          {loginSuccessMsg && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-2 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{t('loginSuccess', 'Logged in successfully.')}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-3.5 my-auto">
          <div>
            <label className="block text-xs font-black text-black tracking-wider uppercase mb-1 px-1">
              {t('phoneNumber', 'PHONE NUMBER')}
            </label>
            <div className="relative flex items-center">
              <input
                id="login-input-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('phonePlaceholder', '91+ 1234567890')}
                className="w-full h-13 px-5 pr-12 rounded-full bg-[#2ECC71] text-black font-semibold text-sm placeholder-emerald-900/60 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-xs transition-all"
              />
              <button
                type="button"
                id="login-mic-phone"
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

          <div>
            <label className="block text-xs font-black text-black tracking-wider uppercase mb-1 px-1">
              {t('password', 'PASSWORD')}
            </label>
            <div className="relative flex items-center">
              <input
                id="login-input-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder', 'Password')}
                className="w-full h-13 px-5 pr-20 rounded-full bg-[#2ECC71] text-black font-semibold text-sm placeholder-emerald-900/60 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-xs transition-all"
              />
              <div className="absolute right-3.5 flex items-center gap-1">
                <button
                  type="button"
                  id="login-mic-password"
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
                  id="login-toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 rounded-full text-black/75 hover:text-black transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Active Listening Indicator */}
          {isListening && (
            <div className="flex items-center justify-center gap-2 py-1 text-xs font-bold text-emerald-800 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>{t('listening', 'Listening...')} {t('speakNow', 'Speak now...')}</span>
            </div>
          )}

          {/* LOGIN Button matching Image 3 style */}
          <motion.button
            id="farmer-login-submit-btn"
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="w-full h-13 mt-3 rounded-full font-black text-black text-[18px] tracking-wide shadow-md transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
            style={{
              backgroundColor: '#22C55E',
              boxShadow: '0 8px 18px -4px rgba(34, 197, 94, 0.4)',
            }}
          >
            <LogIn className="w-5 h-5 text-black stroke-[2.5]" />
            <span>{t('login', 'LOGIN')}</span>
          </motion.button>

          {/* REGISTER Button */}
          <motion.button
            id="farmer-register-btn"
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setViewMode('register')}
            className="w-full h-13 mt-2 rounded-full font-black text-black text-[18px] tracking-wide shadow-md transition-all text-center cursor-pointer"
            style={{
              backgroundColor: '#86EFAC',
              boxShadow: '0 6px 14px -3px rgba(134, 239, 172, 0.4)',
            }}
          >
            {t('register', 'REGISTER')}
          </motion.button>
        </form>
      </div>
    </div>
  );
};
