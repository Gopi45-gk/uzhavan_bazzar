import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Ship, Plane, Calendar, CheckCircle2, ArrowLeft, Globe, Package, Weight, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { exportService, EXPORT_DESTINATIONS } from '../services/exportService';
import { authService } from '../services/authService';

interface ExportProductModalProps {
  open: boolean;
  onClose: () => void;
  farmerName: string;
}

export const ExportProductModal: React.FC<ExportProductModalProps> = ({
  open,
  onClose,
  farmerName,
}) => {
  const { t } = useLanguage();

  const [destination, setDestination] = useState('');
  const [cargo, setCargo] = useState('');
  const [grade, setGrade] = useState<'A' | 'B' | 'C'>('A');
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('kg');
  const [shippingMode, setShippingMode] = useState<'sea' | 'air' | ''>('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const destinations = EXPORT_DESTINATIONS.map(
    (d) => `${d.country} — ${d.port}`
  );

  // Calculate ETA
  const eta =
    destination && shippingMode && dispatchDate
      ? exportService.calculateETA(destination, shippingMode as 'sea' | 'air', dispatchDate)
      : '—';

  // Calculate estimated value
  const estimatedValue =
    cargo && grade && weight && shippingMode
      ? exportService.calculateExportValue(cargo, grade, Number(weight) || 0, shippingMode as 'sea' | 'air')
      : 0;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!destination) errs.destination = t('selectDestinationError', 'Please select a destination');
    if (!cargo.trim()) errs.cargo = t('selectCargoError', 'Please enter cargo details');
    if (!weight || Number(weight) <= 0) errs.weight = t('enterWeightError', 'Please enter weight');
    if (!shippingMode) errs.mode = t('selectModeError', 'Please select shipping mode');
    if (!dispatchDate) errs.dispatch = t('selectDispatchDateError', 'Please select dispatch date');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const session = authService.getCurrentSession();
      await exportService.createExportRequest({
        farmerId: session?.uid || 'farmer-demo',
        farmerName: farmerName || session?.name || 'Farmer',
        productName: cargo,
        grade,
        destination,
        destinationPort: destination.split('—')[1]?.trim() || destination,
        cargoWeight: Number(weight),
        unit,
        shippingMode: shippingMode as 'sea' | 'air',
        dispatchDate,
        eta,
        estimatedExportValue: estimatedValue,
        partner: 'IndoEuroGammaExports',
        status: 'pending',
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        resetForm();
        onClose();
      }, 1800);
    } catch (err) {
      console.warn('Export request error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setDestination('');
    setCargo('');
    setGrade('A');
    setWeight('');
    setUnit('kg');
    setShippingMode('');
    setDispatchDate('');
    setErrors({});
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="export-product-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            id="export-product-modal"
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
                  {t('quoteRequestSuccess', 'Quote request sent successfully!')}
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  {t('exportRequestCreated', 'Export request created')}
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <Globe className="w-6 h-6 text-blue-600" />
                    <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                      🌍 {t('exportProduct', 'Export Product')}
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-5 py-4 space-y-4">
                  {/* Destination */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5" />
                      {t('destination', 'Destination')}
                    </label>
                    <select
                      value={destination}
                      onChange={(e) => { setDestination(e.target.value); setErrors({ ...errors, destination: '' }); }}
                      className="w-full px-3.5 py-3 rounded-xl border border-neutral-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('selectDestination', 'Select Destination')}</option>
                      {destinations.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    {errors.destination && <p className="text-xs text-rose-500 mt-1">{errors.destination}</p>}
                  </div>

                  {/* Cargo */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">
                      <Package className="w-3.5 h-3.5" />
                      {t('cargo', 'Cargo')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={cargo}
                        onChange={(e) => { setCargo(e.target.value); setErrors({ ...errors, cargo: '' }); }}
                        placeholder={t('cargoPlaceholder', 'Tomato — Grade A')}
                        className="flex-1 px-3.5 py-3 rounded-xl border border-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-neutral-400"
                      />
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value as 'A' | 'B' | 'C')}
                        className="w-24 px-2 py-3 rounded-xl border border-neutral-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="A">{t('grade', 'Grade')} A</option>
                        <option value="B">{t('grade', 'Grade')} B</option>
                        <option value="C">{t('grade', 'Grade')} C</option>
                      </select>
                    </div>
                    {errors.cargo && <p className="text-xs text-rose-500 mt-1">{errors.cargo}</p>}
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">
                      <Weight className="w-3.5 h-3.5" />
                      {t('exportWeight', 'Export Weight')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => { setWeight(e.target.value); setErrors({ ...errors, weight: '' }); }}
                        placeholder="4000"
                        min="1"
                        className="flex-1 px-3.5 py-3 rounded-xl border border-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-neutral-400"
                      />
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-20 px-2 py-3 rounded-xl border border-neutral-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="kg">kg</option>
                        <option value="ton">ton</option>
                        <option value="quintal">qtl</option>
                      </select>
                    </div>
                    {errors.weight && <p className="text-xs text-rose-500 mt-1">{errors.weight}</p>}
                  </div>

                  {/* Shipping Mode */}
                  <div>
                    <label className="text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider block">
                      {t('shippingMode', 'Shipping Mode')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => { setShippingMode('sea'); setErrors({ ...errors, mode: '' }); }}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                          shippingMode === 'sea'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                        }`}
                      >
                        <Ship className="w-5 h-5" />
                        {t('seaFreight', 'Sea Freight')}
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => { setShippingMode('air'); setErrors({ ...errors, mode: '' }); }}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                          shippingMode === 'air'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                        }`}
                      >
                        <Plane className="w-5 h-5" />
                        {t('airCargo', 'Air Cargo')}
                      </motion.button>
                    </div>
                    {errors.mode && <p className="text-xs text-rose-500 mt-1">{errors.mode}</p>}
                  </div>

                  {/* Dispatch Date */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5" />
                      {t('dispatchDate', 'Dispatch Date')}
                    </label>
                    <input
                      type="date"
                      value={dispatchDate}
                      onChange={(e) => { setDispatchDate(e.target.value); setErrors({ ...errors, dispatch: '' }); }}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3.5 py-3 rounded-xl border border-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.dispatch && <p className="text-xs text-rose-500 mt-1">{errors.dispatch}</p>}
                  </div>

                  {/* ETA */}
                  {eta !== '—' && (
                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                      <span className="text-xs font-bold text-neutral-500 uppercase">
                        {t('estimatedDelivery', 'Estimated Delivery')}
                      </span>
                      <span className="text-sm font-black text-neutral-800">{eta}</span>
                    </div>
                  )}

                  {/* Estimated Export Value */}
                  {estimatedValue > 0 && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <p className="text-xs font-bold text-emerald-700 uppercase mb-1">
                        {t('estimatedExportValue', 'Estimated Export Value')}
                      </p>
                      <p className="text-2xl font-black text-emerald-800">
                        ₹{estimatedValue.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">
                        {weight} {unit} × {cargo} {t('grade', 'Grade')} {grade}
                      </p>
                    </div>
                  )}

                  {/* Partner Network */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                      {t('partnerNetwork', 'Partner Network')}
                    </p>
                    <p className="text-sm font-black text-slate-800">IndoEuroGammaExports</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Verified Export Partner • ISO 9001:2015</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2 pb-2">
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition"
                    >
                      {t('back', 'Back')}
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60 transition shadow-sm"
                    >
                      {submitting
                        ? t('requestingQuote', 'Requesting quote...')
                        : t('requestQuote', 'Request Quote')}
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
