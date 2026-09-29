import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LanguageIllustration } from './illustrations/LanguageIllustration';
import { LanguageCode, LanguageOption } from '../types';
import { ASSET_IMAGES } from '../constants/assets';

interface LanguageScreenProps {
  onSelectLanguage: (lang: LanguageCode) => void;
  selectedLanguage?: LanguageCode;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'ta',
    nativeName: 'தமிழ்',
    englishName: 'TAMIL',
    bgGradient: 'from-[#22C55E] to-[#15803D]',
    shadowColor: 'rgba(21, 128, 61, 0.35)',
  },
  {
    code: 'en',
    nativeName: 'ENGLISH',
    englishName: 'ENGLISH',
    bgGradient: 'from-[#06B6D4] to-[#0284C7]',
    shadowColor: 'rgba(2, 132, 199, 0.35)',
  },
  {
    code: 'te',
    nativeName: 'తెలుగు',
    englishName: 'TELUGU',
    bgGradient: 'from-[#F59E0B] to-[#EA580C]',
    shadowColor: 'rgba(234, 88, 12, 0.35)',
  },
  {
    code: 'ml',
    nativeName: 'മലയാളം',
    englishName: 'MALAYALAM',
    bgGradient: 'from-[#F87171] to-[#DC2626]',
    shadowColor: 'rgba(220, 38, 38, 0.35)',
  },
  {
    code: 'kn',
    nativeName: 'ಕನ್ನಡ',
    englishName: 'KANNADA',
    bgGradient: 'from-[#A855F7] to-[#7E22CE]',
    shadowColor: 'rgba(126, 34, 206, 0.35)',
  },
  {
    code: 'hi',
    nativeName: 'हिन्दी',
    englishName: 'HINDI',
    bgGradient: 'from-[#6366F1] to-[#3B82F6]',
    shadowColor: 'rgba(59, 130, 246, 0.35)',
  },
];

export const LanguageScreen: React.FC<LanguageScreenProps> = ({
  onSelectLanguage,
  selectedLanguage,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      id="language-screen-root"
      className="relative w-full h-full flex flex-col justify-between px-5 py-6 bg-white overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FAF7 60%, #F0FDF4 100%)',
      }}
    >
      <div className="w-full max-w-lg md:max-w-xl mx-auto flex-1 flex flex-col justify-between">
        {/* Top Section with Diverse Indian People & Greetings Illustration */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full pt-2 flex flex-col items-center justify-center min-h-[200px]"
        >
          {!imgError ? (
            <img
              id="language-header-img"
              src={ASSET_IMAGES.language}
              alt="Select Language - Diverse Farmers"
              className="w-full max-w-[340px] sm:max-w-[380px] h-auto object-contain select-none"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <LanguageIllustration className="w-full max-w-[360px]" />
          )}
        </motion.div>

        {/* Center Title - Bold Display Header matching Image 1 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="my-3 text-center"
        >
          <h1
            id="select-language-heading"
            className="text-[21px] sm:text-[24px] font-black uppercase text-black tracking-tight font-serif"
            style={{
              fontFamily: "'Playfair Display', 'Rockwell', 'Georgia', serif",
              letterSpacing: '0.02em',
            }}
          >
            SELECT YOUR LANGUAGE
          </h1>
        </motion.div>

        {/* 2-Column Language Buttons Grid matching Image 1 */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
                delayChildren: 0.15,
              },
            },
          }}
          className="w-full grid grid-cols-2 gap-3.5 sm:gap-4 pb-4"
        >
          {LANGUAGES.map((lang, index) => {
            const isSelected = selectedLanguage === lang.code;
            return (
              <motion.button
                key={lang.code}
                id={`lang-btn-${lang.code}`}
                variants={{
                  hidden: { opacity: 0, y: 18, scale: 0.94 },
                  show: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                      type: 'spring',
                      stiffness: 340,
                      damping: 24,
                    },
                  },
                }}
                whileHover={{ scale: 1.035, y: -2 }}
                whileTap={{ scale: 0.93 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                onClick={() => onSelectLanguage(lang.code)}
                className={`relative overflow-hidden flex flex-col items-center justify-center py-3.5 px-3 rounded-2xl text-white transition-shadow shadow-md bg-gradient-to-r ${lang.bgGradient} ${
                  isSelected ? 'ring-4 ring-offset-2 ring-emerald-500' : ''
                } cursor-pointer`}
                style={{
                  boxShadow: `0 8px 18px -4px ${lang.shadowColor}`,
                  minHeight: '68px',
                }}
              >
                {/* Subtle top gloss reflection */}
                <div className="absolute top-0 inset-x-0 h-1/2 bg-white/15 rounded-t-2xl pointer-events-none" />

                {/* Native Language Text */}
                <span className="text-[19px] sm:text-[22px] font-black leading-tight drop-shadow-sm tracking-wide">
                  {lang.nativeName}
                </span>

                {/* English Subtitle */}
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-white/95 mt-0.5">
                  {lang.englishName}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};
