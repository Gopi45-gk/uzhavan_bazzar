import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { FarmerWithPhoneIllustration } from './illustrations/FarmerWithPhoneIllustration';
import { BuyerWithGroceriesIllustration } from './illustrations/BuyerWithGroceriesIllustration';
import { ASSET_IMAGES } from '../constants/assets';
import { useLanguage } from '../context/LanguageContext';

interface RoleScreenProps {
  onSelectRole: (role: 'farmer' | 'buyer') => void;
  onBack: () => void;
}

export const RoleScreen: React.FC<RoleScreenProps> = ({ onSelectRole, onBack }) => {
  const { t } = useLanguage();
  const [farmerImgError, setFarmerImgError] = useState(false);
  const [buyerImgError, setBuyerImgError] = useState(false);

  return (
    <div
      id="role-screen-root"
      className="relative w-full h-full flex flex-col justify-between px-4 py-5 overflow-y-auto"
      style={{
        background: '#EEEEEE',
      }}
    >
      <div className="w-full max-w-lg md:max-w-xl mx-auto flex-1 flex flex-col justify-between">
        {/* Top Header with Back Arrow */}
        <div className="w-full flex items-center justify-between pt-1">
          <button
            id="role-screen-back-btn"
            onClick={onBack}
            className="p-2 -ml-1 text-neutral-600 hover:text-neutral-900 rounded-full hover:bg-neutral-300/50 transition-colors"
            title="Back to Language Selection"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content Area: Farmer Option & Buyer Option */}
        <div className="flex-1 flex flex-col justify-around py-4 gap-8">
          {/* 1. Farmer Option Section matching Image 2 */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.1 }}
            className="w-full flex items-center justify-between gap-3 px-1"
          >
            {/* Farmer Illustration on Left */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 25 }}
              className="w-[145px] sm:w-[170px] flex-shrink-0 flex items-center justify-center min-h-[160px]"
            >
              {!farmerImgError ? (
                <img
                  id="role-farmer-img"
                  src={ASSET_IMAGES.farmer}
                  alt="Farmer"
                  className="w-full max-w-[135px] sm:max-w-[160px] max-h-[190px] object-contain select-none drop-shadow-sm"
                  referrerPolicy="no-referrer"
                  onError={() => setFarmerImgError(true)}
                />
              ) : (
                <FarmerWithPhoneIllustration className="w-full max-w-[130px]" />
              )}
            </motion.div>

            {/* Large Green "FARMER" Button on Right */}
            <div className="flex-1 flex justify-center items-center">
              <motion.button
                id="role-select-farmer-btn"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                onClick={() => onSelectRole('farmer')}
                className="w-full max-w-[200px] py-4 px-6 rounded-2xl font-black text-black text-[22px] tracking-wide shadow-lg transition-transform cursor-pointer"
                style={{
                  backgroundColor: '#22C55E',
                  boxShadow: '0 8px 18px -3px rgba(34, 197, 94, 0.45)',
                }}
              >
                {t('farmer')}
              </motion.button>
            </div>
          </motion.div>

          {/* 2. Buyer Option Section matching Image 2 */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28, delay: 0.22 }}
            className="w-full flex items-center justify-between gap-3 px-1"
          >
            {/* Buyer Illustration on Left */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 25 }}
              className="w-[145px] sm:w-[170px] flex-shrink-0 flex items-center justify-center min-h-[160px]"
            >
              {!buyerImgError ? (
                <img
                  id="role-buyer-img"
                  src={ASSET_IMAGES.buyer}
                  alt="Buyer"
                  className="w-full max-w-[140px] sm:max-w-[165px] max-h-[180px] object-contain select-none drop-shadow-sm"
                  referrerPolicy="no-referrer"
                  onError={() => setBuyerImgError(true)}
                />
              ) : (
                <BuyerWithGroceriesIllustration className="w-full max-w-[135px]" />
              )}
            </motion.div>

            {/* Large Green "BUYER" Button on Right */}
            <div className="flex-1 flex justify-center items-center">
              <motion.button
                id="role-select-buyer-btn"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                onClick={() => onSelectRole('buyer')}
                className="w-full max-w-[200px] py-4 px-6 rounded-2xl font-black text-black text-[22px] tracking-wide shadow-lg transition-transform cursor-pointer"
                style={{
                  backgroundColor: '#22C55E',
                  boxShadow: '0 8px 18px -3px rgba(34, 197, 94, 0.45)',
                }}
              >
                {t('buyer')}
              </motion.button>
            </div>
          </motion.div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
};
