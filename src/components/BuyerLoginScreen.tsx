import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { MarketStallIllustration } from './illustrations/MarketStallIllustration';
import { AuthModal } from './AuthModal';
import { ASSET_IMAGES } from '../constants/assets';
import { useLanguage } from '../context/LanguageContext';

interface BuyerLoginScreenProps {
  onBack: () => void;
  onLoginSuccess?: () => void;
}

export const BuyerLoginScreen: React.FC<BuyerLoginScreenProps> = ({ onBack, onLoginSuccess }) => {
  const { t } = useLanguage();
  const [modalMode, setModalMode] = useState<'login' | 'register' | null>(null);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      id="buyer-login-screen-root"
      className="relative w-full h-full flex flex-col justify-between px-5 py-5 overflow-y-auto bg-white"
      style={{
        background: '#FFFFFF',
      }}
    >
      <div className="w-full max-w-md md:max-w-lg mx-auto flex-1 flex flex-col justify-between">
        {/* Top Header with Back Arrow matching Image 4 */}
        <div className="w-full flex items-center justify-between pt-1">
          <button
            id="buyer-screen-back-btn"
            onClick={onBack}
            className="p-2 -ml-2 text-neutral-500 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors"
            title="Back to Role Selection"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Top Half: Farmers Market Stall Illustration matching Image 4 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full flex items-center justify-center my-auto py-4 min-h-[220px]"
        >
          {!imgError ? (
            <img
              id="buyer-login-header-img"
              src={ASSET_IMAGES.buyerLogin}
              alt="Farmers Market Stall"
              className="w-full max-w-[340px] sm:max-w-[380px] h-auto object-contain select-none"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <MarketStallIllustration className="w-full max-w-[340px]" />
          )}
        </motion.div>

        {/* Bottom Half: LOGIN and REGISTER Buttons matching Image 4 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26, delay: 0.15 }}
          className="w-full flex flex-col items-center gap-5 pb-16 pt-6"
        >
          {/* LOGIN Button */}
          <motion.button
            id="buyer-login-btn"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => setModalMode('login')}
            className="w-full max-w-[280px] sm:max-w-[320px] py-4 rounded-2xl font-black text-black text-[20px] tracking-wide shadow-md transition-all text-center cursor-pointer"
            style={{
              backgroundColor: '#22C55E',
              boxShadow: '0 8px 18px -4px rgba(34, 197, 94, 0.4)',
            }}
          >
            {t('login', 'LOGIN')}
          </motion.button>

          {/* REGISTER Button */}
          <motion.button
            id="buyer-register-btn"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => setModalMode('register')}
            className="w-full max-w-[280px] sm:max-w-[320px] py-4 rounded-2xl font-black text-black text-[20px] tracking-wide shadow-md transition-all text-center cursor-pointer"
            style={{
              backgroundColor: '#22C55E',
              boxShadow: '0 8px 18px -4px rgba(34, 197, 94, 0.4)',
            }}
          >
            {t('register', 'REGISTER')}
          </motion.button>
        </motion.div>
      </div>

      {/* Interactive Buyer Login / Registration Modal */}
      {modalMode && (
        <AuthModal
          role="buyer"
          mode={modalMode}
          onClose={() => setModalMode(null)}
          onSuccess={() => {
            setModalMode(null);
            if (onLoginSuccess) {
              onLoginSuccess();
            }
          }}
        />
      )}
    </div>
  );
};
