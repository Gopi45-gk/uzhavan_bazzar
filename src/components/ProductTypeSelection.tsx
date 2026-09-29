import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ASSET_IMAGES } from '../constants/assets';

interface ProductTypeSelectionProps {
  open: boolean;
  onClose: () => void;
  onSelectAddProduct: () => void;
  onSelectExportProduct: () => void;
}

export const ProductTypeSelection: React.FC<ProductTypeSelectionProps> = ({
  open,
  onClose,
  onSelectAddProduct,
  onSelectExportProduct,
}) => {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="product-type-selection-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            id="product-type-selection-modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-[360px] sm:max-w-md shadow-2xl overflow-hidden border border-neutral-100 p-5"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 flex items-center justify-center shrink-0">
                  <img
                    src={ASSET_IMAGES.addProduct}
                    alt="Produce"
                    className="w-full h-full object-contain select-none"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h2 className="text-[16px] sm:text-[17px] font-black text-neutral-900 tracking-tight leading-tight">
                    {t('selectProductTypeTitle', 'விளைபொருளைச் சேர்க்கவும்')}
                  </h2>
                  <p className="text-[12px] text-neutral-500 font-medium leading-snug mt-0.5">
                    {t('chooseHowToSell', 'Choose how you want to sell your produce')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer shrink-0 ml-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Exactly TWO large selectable cards, vertically stacked */}
            <div className="space-y-3.5">
              {/* Option 1: Add Product — Local / Domestic Sale */}
              <motion.button
                id="option-add-product"
                whileHover={{ scale: 1.015, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSelectAddProduct();
                  onClose();
                }}
                className="w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border border-[#9ee4be] bg-[#ecfaf3] hover:border-emerald-400 transition-all cursor-pointer text-left shadow-xs group"
              >
                <div className="w-20 h-24 sm:w-24 sm:h-28 shrink-0 flex items-center justify-center">
                  <img
                    src="https://www.image2url.com/r2/default/images/1790677608838-76485589-417f-4221-8ebc-321a0d4b3a09.png"
                    alt="Local Sale"
                    className="w-full h-full object-contain select-none transition-transform group-hover:scale-105 duration-200"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="font-black text-[15px] sm:text-[16px] text-neutral-900 leading-tight">
                    {t('localSaleTitle', 'உள்ளூர் விற்பனை')}
                  </h3>
                  <p className="font-bold text-[12px] sm:text-[13px] text-neutral-800 mt-0.5 leading-tight">
                    {t('localSaleSubtitle', 'Add Product')}
                  </p>
                  <p className="text-[11px] sm:text-[12px] text-neutral-600 leading-snug mt-1 line-clamp-3">
                    {t('localSaleDesc', 'Sell your fresh produce directly to local buyers in India.')}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white shadow-xs flex items-center justify-center shrink-0 text-emerald-700 border border-emerald-100 group-hover:shadow-sm transition-all">
                  <ChevronRight className="w-5 h-5 text-emerald-700" strokeWidth={2.5} />
                </div>
              </motion.button>

              {/* Option 2: Export Product — International Sale */}
              <motion.button
                id="option-export-product"
                whileHover={{ scale: 1.015, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSelectExportProduct();
                  onClose();
                }}
                className="w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border border-[#fed888] bg-[#fffbf0] hover:border-amber-400 transition-all cursor-pointer text-left shadow-xs group"
              >
                <div className="w-20 h-24 sm:w-24 sm:h-28 shrink-0 flex items-center justify-center">
                  <img
                    src="https://www.image2url.com/r2/default/images/1790677644183-cb2fc12c-6bec-4217-bc99-e4906d9d58bb.png"
                    alt="Export Product"
                    className="w-full h-full object-contain select-none transition-transform group-hover:scale-105 duration-200"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="font-black text-[15px] sm:text-[16px] text-neutral-900 leading-tight">
                    {t('exportSaleTitle', 'ஏற்றுமதி')}
                  </h3>
                  <p className="font-bold text-[12px] sm:text-[13px] text-neutral-800 mt-0.5 leading-tight">
                    {t('exportSaleSubtitle', 'Export Product')}
                  </p>
                  <p className="text-[11px] sm:text-[12px] text-neutral-600 leading-snug mt-1 line-clamp-3">
                    {t('exportSaleDesc', 'List your produce for international buyers and export to global markets.')}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white shadow-xs flex items-center justify-center shrink-0 text-amber-700 border border-amber-100 group-hover:shadow-sm transition-all">
                  <ChevronRight className="w-5 h-5 text-[#d97706]" strokeWidth={2.5} />
                </div>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
