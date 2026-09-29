import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Calendar, CheckCircle2, Package } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { bulkOrderService } from '../../services/exportService';
import { productService, ProductListing } from '../../services/productService';
import { authService } from '../../services/authService';

interface BulkOrderModalProps {
  open: boolean;
  onClose: () => void;
}

export const BulkOrderModal: React.FC<BulkOrderModalProps> = ({ open, onClose }) => {
  const { t } = useLanguage();

  const [products, setProducts] = useState<ProductListing[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [neededBy, setNeededBy] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load available products from Firebase
  useEffect(() => {
    if (!open) return;
    const unsub = productService.subscribeProducts(
      (items) => {
        setProducts(items.filter((i) => String(i.status).toLowerCase() === 'active'));
      },
      { activeOnly: true }
    );
    return () => unsub();
  }, [open]);

  const selectedProduct = products.find(
    (p) => (p.productId || p.id) === selectedProductId
  );

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedProductId) errs.product = t('selectProduceError', 'Please select a produce');
    if (!quantity || Number(quantity) <= 0) errs.quantity = t('enterQuantityError', 'Please enter a valid quantity');
    if (!neededBy) errs.date = t('selectDateError', 'Please select the needed-by date');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !selectedProduct) return;
    setSubmitting(true);
    try {
      const session = authService.getCurrentSession();
      await bulkOrderService.createBulkOrder({
        buyerId: session?.uid || 'buyer-demo',
        buyerName: session?.name || 'Verified Buyer',
        farmerId: selectedProduct.farmerId || 'farmer-default',
        farmerName: selectedProduct.farmerName || 'Farmer',
        productId: selectedProduct.productId || selectedProduct.id,
        productName: selectedProduct.productName || selectedProduct.name,
        requestedQuantity: Number(quantity),
        unit,
        neededBy,
        notes: notes.trim(),
        status: 'pending',
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        resetForm();
        onClose();
      }, 1800);
    } catch (err) {
      console.warn('Bulk order error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedProductId('');
    setQuantity('');
    setUnit('kg');
    setNeededBy('');
    setNotes('');
    setErrors({});
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="bulk-order-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            id="bulk-order-modal"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl"
          >
            {/* Success State */}
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                </motion.div>
                <h3 className="font-black text-lg text-neutral-900">
                  {t('bulkRequestSent', 'Bulk request sent successfully!')}
                </h3>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                        {t('requestBulkSupply', 'Request Bulk Supply')}
                      </h2>
                      <p className="text-[11px] text-neutral-500 font-medium">
                        {t('bulkOrderDesc', 'For restaurants, shops & wholesale buyers')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {/* Produce */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">
                      <Package className="w-3.5 h-3.5" />
                      {t('produce', 'Produce')}
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => { setSelectedProductId(e.target.value); setErrors({ ...errors, product: '' }); }}
                      className="w-full px-3.5 py-3 rounded-xl border border-neutral-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">{t('selectProduce', 'Select Produce')}</option>
                      {products.map((p) => (
                        <option key={p.productId || p.id} value={p.productId || p.id}>
                          {p.productName || p.name} — {p.farmerName}
                        </option>
                      ))}
                    </select>
                    {errors.product && <p className="text-xs text-rose-500 mt-1">{errors.product}</p>}
                  </div>

                  {/* Required Quantity */}
                  <div>
                    <label className="text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider block">
                      {t('requiredQuantity', 'Required Quantity')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => { setQuantity(e.target.value); setErrors({ ...errors, quantity: '' }); }}
                        placeholder="100"
                        min="1"
                        className="flex-1 px-3.5 py-3 rounded-xl border border-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-neutral-400"
                      />
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-20 px-2 py-3 rounded-xl border border-neutral-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="kg">kg</option>
                        <option value="quintal">qtl</option>
                        <option value="ton">ton</option>
                        <option value="piece">pcs</option>
                      </select>
                    </div>
                    {errors.quantity && <p className="text-xs text-rose-500 mt-1">{errors.quantity}</p>}
                  </div>

                  {/* Needed By */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5" />
                      {t('neededBy', 'Needed By')}
                    </label>
                    <input
                      type="date"
                      value={neededBy}
                      onChange={(e) => { setNeededBy(e.target.value); setErrors({ ...errors, date: '' }); }}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3.5 py-3 rounded-xl border border-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {errors.date && <p className="text-xs text-rose-500 mt-1">{errors.date}</p>}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider block">
                      {t('notesForFarmer', 'Notes for the Farmer')}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t('notesPlaceholder', 'Grade, packaging, recurring supply, delivery instructions...')}
                      rows={3}
                      className="w-full px-3.5 py-3 rounded-xl border border-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-neutral-400 resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2 pb-2">
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition"
                    >
                      {t('cancel', 'Cancel')}
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60 transition shadow-sm"
                    >
                      {submitting
                        ? t('sendingRequest', 'Sending request...')
                        : t('sendRequest', 'Send Request')}
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
