/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { UzhavanBazzarLogo } from './components/UzhavanBazzarLogo';
import { LanguageScreen } from './components/LanguageScreen';
import { RoleScreen } from './components/RoleScreen';
import { FarmerLoginScreen } from './components/FarmerLoginScreen';
import { BuyerLoginScreen } from './components/BuyerLoginScreen';
import { FarmerDashboard } from './components/FarmerDashboard';
import { BuyerDashboard } from './components/buyer/BuyerDashboard';
import { ScreenType, LanguageCode } from './types';
import { ASSET_IMAGES } from './constants/assets';
import { useLanguage } from './context/LanguageContext';

// Screen sequence ranking to calculate slide direction (forward = 1, backward = -1)
const SCREEN_ORDER: Record<ScreenType, number> = {
  'splash': 0,
  'language': 1,
  'role': 2,
  'farmer-login': 3,
  'buyer-login': 3,
  'farmer-dashboard': 4,
  'buyer-dashboard': 4,
};

// Smooth, fluid, mobile-native spring page transitions
const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
    scale: 0.985,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: 'spring', stiffness: 320, damping: 32, mass: 0.8 },
      opacity: { duration: 0.32, ease: [0.25, 1, 0.5, 1] },
      scale: { duration: 0.32, ease: [0.25, 1, 0.5, 1] },
    },
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction > 0 ? -40 : 40,
    opacity: 0,
    scale: 0.985,
    transition: {
      x: { type: 'spring', stiffness: 320, damping: 32, mass: 0.8 },
      opacity: { duration: 0.24, ease: [0.25, 1, 0.5, 1] },
      scale: { duration: 0.24, ease: [0.25, 1, 0.5, 1] },
    },
  }),
};

export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('splash');
  const [direction, setDirection] = useState<number>(1);
  const [imageError, setImageError] = useState(false);
  const [splashKey, setSplashKey] = useState(0);

  const logoUrl = ASSET_IMAGES.logo;

  // Smart screen continuation after splash
  const handleSplashContinue = () => {
    try {
      const session = authService.getCurrentSession();
      if (session) {
        if (session.role === 'buyer') {
          navigateTo('buyer-dashboard', 1);
          return;
        } else if (session.role === 'farmer') {
          navigateTo('farmer-dashboard', 1);
          return;
        }
      }
    } catch {}

    const savedScreen = localStorage.getItem('uzhavan_last_screen') as ScreenType | null;
    if (savedScreen && savedScreen !== 'splash' && savedScreen in SCREEN_ORDER) {
      navigateTo(savedScreen, 1);
      return;
    }

    const hasChosenLang = localStorage.getItem('uzhavan_selected_language') || localStorage.getItem('selectedLanguage');
    if (hasChosenLang) {
      navigateTo('role', 1);
      return;
    }

    navigateTo('language', 1);
  };

  // Unified page navigation handler that calculates animation direction
  const navigateTo = (nextScreen: ScreenType, explicitDir?: number) => {
    const currentIdx = SCREEN_ORDER[currentScreen] ?? 0;
    const nextIdx = SCREEN_ORDER[nextScreen] ?? 0;
    const computedDir = explicitDir !== undefined ? explicitDir : (nextIdx >= currentIdx ? 1 : -1);
    setDirection(computedDir);
    setCurrentScreen(nextScreen);
    if (nextScreen !== 'splash') {
      try {
        localStorage.setItem('uzhavan_last_screen', nextScreen);
      } catch {}
    }
  };

  // Automatically transition from splash after 2.6 seconds
  useEffect(() => {
    if (currentScreen === 'splash') {
      const timer = setTimeout(() => {
        handleSplashContinue();
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, splashKey]);

  const handleLanguageSelect = (lang: LanguageCode) => {
    setLanguage(lang);
    navigateTo('role', 1);
  };

  const handleRoleSelect = (role: 'farmer' | 'buyer') => {
    if (role === 'farmer') {
      navigateTo('farmer-login', 1);
    } else {
      navigateTo('buyer-login', 1);
    }
  };

  return (
    <div
      id="app-container"
      className="w-full min-h-screen h-screen overflow-hidden flex flex-col bg-white select-none font-sans"
    >
      <div
        id="app-viewport"
        className="relative w-full h-full flex-1 flex flex-col overflow-hidden bg-white"
      >
        <AnimatePresence mode="wait" custom={direction}>
          {/* SCREEN 0: Splash Screen with Logo Animation */}
          {currentScreen === 'splash' && (
            <motion.div
              key={`splash-screen-${splashKey}`}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="relative w-full h-full flex flex-col items-center justify-between p-6 sm:p-10 bg-white cursor-pointer"
              onClick={handleSplashContinue}
              title="Click anywhere to continue"
            >
              {/* Animated soft glow behind logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                  opacity: [0, 0.45, 0.3, 0.45],
                  scale: [0.7, 1.15, 1, 1.1],
                }}
                transition={{
                  opacity: { duration: 3.5, repeat: Infinity, repeatType: 'reverse' },
                  scale: { duration: 4, repeat: Infinity, repeatType: 'reverse' },
                }}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 380,
                  height: 380,
                  top: '30%',
                  background:
                    'radial-gradient(circle, rgba(234, 88, 12, 0.15) 0%, rgba(34, 197, 94, 0.12) 45%, rgba(255, 255, 255, 0) 70%)',
                  filter: 'blur(28px)',
                }}
              />

              <div className="h-6" />

              {/* Centered animated logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.82, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center my-auto"
              >
                <motion.div
                  animate={{ y: [0, -6, 0], scale: [1, 1.018, 1] }}
                  transition={{ duration: 3.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                  className="flex flex-col items-center"
                >
                  {!imageError ? (
                    <img
                      id="uzhavan-bazzar-logo-img"
                      src={logoUrl}
                      alt="Uzhavan Bazzar Logo"
                      style={{ width: 330, height: 264, objectFit: 'contain' }}
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <UzhavanBazzarLogo width={330} height={264} />
                  )}
                </motion.div>
              </motion.div>

              {/* Bottom Continue prompt */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
                className="w-full flex items-center justify-center px-2 pb-6"
              >
                <button
                  id="skip-splash-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSplashContinue();
                  }}
                  className="px-6 py-2.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs sm:text-sm flex items-center gap-2 hover:bg-emerald-100 transition-colors shadow-xs cursor-pointer"
                >
                  <span>{t('continueToLanguage', 'Continue')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* SCREEN 1: Language Selection (1st Image) */}
          {currentScreen === 'language' && (
            <motion.div
              key="language-screen"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full h-full"
            >
              <LanguageScreen
                onSelectLanguage={handleLanguageSelect}
                selectedLanguage={language}
              />
            </motion.div>
          )}

          {/* SCREEN 2: Role Selection - Farmer or Buyer (2nd Image) */}
          {currentScreen === 'role' && (
            <motion.div
              key="role-screen"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full h-full"
            >
              <RoleScreen
                onSelectRole={handleRoleSelect}
                onBack={() => navigateTo('language', -1)}
              />
            </motion.div>
          )}

          {/* SCREEN 3: Farmer Login / Register (3rd Image) */}
          {currentScreen === 'farmer-login' && (
            <motion.div
              key="farmer-login-screen"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full h-full"
            >
              <FarmerLoginScreen
                onBack={() => navigateTo('role', -1)}
                onLoginSuccess={() => navigateTo('farmer-dashboard', 1)}
              />
            </motion.div>
          )}

          {/* SCREEN 4: Buyer Login / Register (4th Image) */}
          {currentScreen === 'buyer-login' && (
            <motion.div
              key="buyer-login-screen"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full h-full"
            >
              <BuyerLoginScreen
                onBack={() => navigateTo('role', -1)}
                onLoginSuccess={() => navigateTo('buyer-dashboard', 1)}
              />
            </motion.div>
          )}

          {/* SCREEN 5: Farmer Dashboard (Uploaded Reference Design) */}
          {currentScreen === 'farmer-dashboard' && (
            <motion.div
              key="farmer-dashboard-screen"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full h-full"
            >
              <FarmerDashboard
                onBackToLogin={() => {
                  try {
                    localStorage.removeItem('uzhavan_last_screen');
                  } catch {}
                  navigateTo('farmer-login', -1);
                }}
                onSwitchToBuyer={() => navigateTo('buyer-dashboard', 1)}
                onSwitchLanguage={() => navigateTo('language', -1)}
              />
            </motion.div>
          )}

          {/* SCREEN 6: Buyer Dashboard & Marketplace (Section 21 & 24) */}
          {currentScreen === 'buyer-dashboard' && (
            <motion.div
              key="buyer-dashboard-screen"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full h-full"
            >
              <BuyerDashboard
                onBackToRole={() => {
                  try {
                    localStorage.removeItem('uzhavan_last_screen');
                  } catch {}
                  navigateTo('role', -1);
                }}
                onSwitchToFarmer={() => navigateTo('farmer-dashboard', 1)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
