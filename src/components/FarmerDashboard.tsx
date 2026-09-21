import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  User,
  X,
  PlusCircle,
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  Globe,
  ArrowLeftRight,
  LogOut,
  ChevronRight,
  Phone,
  CheckCircle2,
  Calendar,
  IndianRupee,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { ASSET_IMAGES } from '../constants/assets';
import { CattleModal } from './CattleModal';
import { MarketInsightsModal } from './MarketInsightsModal';
import { AddProduceCameraModal } from './AddProduceCameraModal';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { farmerService } from '../services/farmerService';

interface FarmerDashboardProps {
  onBackToLogin: () => void;
  onSwitchToBuyer: () => void;
  onSwitchLanguage: () => void;
}

type ActiveSheet =
  | 'add-produce'
  | 'my-listings'
  | 'orders'
  | 'community'
  | 'market-insights'
  | 'cattle'
  | null;

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  onBackToLogin,
  onSwitchToBuyer,
  onSwitchLanguage,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, farmerProfile, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  const currentFarmer = farmerProfile || (() => {
    try {
      const saved = localStorage.getItem('uzhavan_current_farmer');
      return saved ? JSON.parse(saved) : { name: 'Murugan S.', location: 'Madurai Rural', phone: '9842155670' };
    } catch {
      return { name: 'Murugan S.', location: 'Madurai Rural', phone: '9842155670' };
    }
  })();

  // Form states for Add Produce
  const [produceName, setProduceName] = useState('Fresh Tomatoes');
  const [quantity, setQuantity] = useState('500');
  const [unit, setUnit] = useState('Kg');
  const [pricePerUnit, setPricePerUnit] = useState('38');
  const [harvestDate, setHarvestDate] = useState('Tomorrow');
  const [produceSubmitted, setProduceSubmitted] = useState(false);

  // Mock data for Farmer Listings
  const [listings, setListings] = useState([
    {
      id: 'L-101',
      name: 'Country Tomato (Grade A)',
      variety: 'Fresh Farm Harvest',
      quantity: '450 Kg',
      price: '₹38 / Kg',
      status: 'Active',
      views: 124,
      date: 'Today',
    },
    {
      id: 'L-102',
      name: 'Small Shallot Onions',
      variety: 'Bellary Pink',
      quantity: '800 Kg',
      price: '₹46 / Kg',
      status: 'Active',
      views: 98,
      date: 'Yesterday',
    },
    {
      id: 'L-103',
      name: 'Fresh Green Chillies',
      variety: 'Guntur Spicy',
      quantity: '200 Kg',
      price: '₹55 / Kg',
      status: 'Sold Out',
      views: 215,
      date: '3 days ago',
    },
  ]);

  // Fetch farmer's own products from Cloud Firestore when authenticated
  useEffect(() => {
    if (user?.uid) {
      productService
        .getFarmerProducts(user.uid)
        .then((fetchedProducts) => {
          if (fetchedProducts && fetchedProducts.length > 0) {
            const mapped = fetchedProducts.map((p) => ({
              id: p.id || `L-${Math.floor(100 + Math.random() * 900)}`,
              name: `${p.productName} (Grade ${p.grade})`,
              variety: `AI Quality Score ${p.qualityScore}/100`,
              quantity: `${p.quantityKg} Kg`,
              price: p.displayPrice || `₹${p.recommendedPriceMin}–₹${p.recommendedPriceMax} / Kg`,
              status: p.status === 'active' ? 'Active' : 'Sold Out',
              views: 1,
              date: 'Recently',
            }));
            setListings(mapped);
          }
        })
        .catch((err) => {
          console.warn('Could not load Firestore listings:', err);
        });
    }
  }, [user?.uid]);

  // Mock data for Orders
  const orders = [
    {
      id: 'ORD-8921',
      buyer: 'Kovai Fresh Mart',
      buyerPhone: '+91 98421 55670',
      item: 'Country Tomato (Grade A)',
      qty: '250 Kg',
      total: '₹9,500',
      status: 'Ready for Pickup',
      location: 'Madurai Mandi Gate 2',
      time: '10:30 AM Today',
    },
    {
      id: 'ORD-8919',
      buyer: 'Green Basket Retail',
      buyerPhone: '+91 97910 88231',
      item: 'Small Shallot Onions',
      qty: '300 Kg',
      total: '₹13,800',
      status: 'Payment Completed',
      location: 'Farm Direct Pickup',
      time: 'Yesterday',
    },
  ];

  // Market Insights data


  const handleAddProduceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProduceSubmitted(true);
    setTimeout(() => {
      setListings((prev) => [
        {
          id: `L-${Math.floor(100 + Math.random() * 900)}`,
          name: produceName,
          variety: 'Freshly Harvested',
          quantity: `${quantity} ${unit}`,
          price: `₹${pricePerUnit} / ${unit}`,
          status: 'Active',
          views: 1,
          date: 'Just now',
        },
        ...prev,
      ]);
      setProduceSubmitted(false);
      setActiveSheet('my-listings');
    }, 1200);
  };

  return (
    <div
      id="farmer-dashboard-root"
      className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#FAF8F5] select-none"
    >
      {/* Background Paddy Field Artwork matching user's bg asset */}
      <div
        id="dashboard-background-image"
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url('${ASSET_IMAGES.farmerDashboardBg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Soft morning gradient overlay to ensure top circles and text pop clearly */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(254, 252, 248, 0.94) 0%, rgba(254, 252, 248, 0.88) 32%, rgba(254, 252, 248, 0.35) 60%, rgba(254, 252, 248, 0) 100%)',
          }}
        />
      </div>

      {/* Top Header matching reference image */}
      <header
        id="dashboard-header"
        className="relative z-10 w-full max-w-2xl mx-auto flex items-center justify-between px-6 pt-5 pb-2"
      >
        {/* Left: Hamburger Menu Icon with 3 thick black horizontal lines */}
        <button
          id="dashboard-hamburger-btn"
          onClick={() => setDrawerOpen(true)}
          className="p-1.5 -ml-2 text-black hover:opacity-75 transition-opacity active:scale-95"
          aria-label="Open Navigation Menu"
        >
          <div className="w-7 h-5 flex flex-col justify-between">
            <span className="w-full h-1 bg-black rounded-sm" />
            <span className="w-full h-1 bg-black rounded-sm" />
            <span className="w-full h-1 bg-black rounded-sm" />
          </div>
        </button>

        {/* Center: Brand Title "UZHAVAN BAZZAR" with Leaf Emblem on 'U' */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative flex items-center gap-1.5">
            {/* 2 Green sprout leaves positioned above 'U' matching screenshot */}
            <div className="absolute -top-3 left-0">
              <svg
                width="20"
                height="14"
                viewBox="0 0 24 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 14C3 8 7 3 13 2C13 7 10 12 5 14H2Z"
                  fill="#15803D"
                />
                <path
                  d="M10 12C12 7 16 3 22 2C22 7 18 11 13 12H10Z"
                  fill="#16A34A"
                />
              </svg>
            </div>
            <span
              className="font-black text-[23px] sm:text-[25px] tracking-tight text-[#15803D]"
              style={{
                fontFamily: "'Playfair Display', 'Cinzel', 'Georgia', serif",
                letterSpacing: '-0.02em',
              }}
            >
              UZHAVAN
            </span>
            <span
              className="font-black text-[23px] sm:text-[25px] tracking-tight text-[#B45309]"
              style={{
                fontFamily: "'Playfair Display', 'Cinzel', 'Georgia', serif",
                letterSpacing: '-0.02em',
              }}
            >
              BAZZAR
            </span>
          </div>
        </div>

        {/* Right: Circular Profile Icon matching screenshot (2px green border, green user) */}
        <button
          id="dashboard-profile-btn"
          onClick={() => setProfileOpen(true)}
          className="w-10 h-10 rounded-full border-2 border-[#15803D] bg-transparent flex items-center justify-center text-[#15803D] hover:scale-105 active:scale-95 transition-transform"
          aria-label="Open Farmer Profile"
        >
          <User className="w-6 h-6 text-[#15803D] stroke-[2.2]" />
        </button>
      </header>

      {/* Main Feature Badges Layout matching exact reference image */}
      <motion.main
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.07,
              delayChildren: 0.08,
            },
          },
        }}
        className="relative z-10 flex-1 flex flex-col justify-between w-full max-w-lg sm:max-w-xl mx-auto px-4 pt-2 pb-6 overflow-y-auto"
      >
        {/* Row 1: ADD PRODUCE & MY LISTINGS */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* 1. ADD PRODUCE */}
          <motion.div
            id="feature-add-produce"
            variants={{
              hidden: { opacity: 0, y: 16, scale: 0.94 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 320, damping: 24 },
              },
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => setActiveSheet('add-produce')}
            className="flex flex-col items-center text-center cursor-pointer group"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center transition-transform">
              <img
                src={ASSET_IMAGES.addProduct}
                alt="Add Produce"
                className="w-full h-full object-contain drop-shadow-md select-none"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="mt-2 flex flex-col items-center">
              <h2 className="text-[15px] sm:text-[16px] font-black uppercase text-black tracking-tight leading-tight">
                {t('addProduce', 'ADD PRODUCE')}
              </h2>
            </div>
          </motion.div>

          {/* 2. MY LISTINGS */}
          <motion.div
            id="feature-my-listings"
            variants={{
              hidden: { opacity: 0, y: 16, scale: 0.94 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 320, damping: 24 },
              },
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => setActiveSheet('my-listings')}
            className="flex flex-col items-center text-center cursor-pointer group"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center transition-transform">
              <img
                src={ASSET_IMAGES.myListing}
                alt="My Listings"
                className="w-full h-full object-contain drop-shadow-md select-none"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="mt-2 flex flex-col items-center">
              <h2 className="text-[15px] sm:text-[16px] font-black uppercase text-black tracking-tight leading-tight">
                {t('myListings', 'MY LISTINGS')}
              </h2>
            </div>
          </motion.div>
        </div>

        {/* Row 2: ORDERS & FARMER COMMUNITY */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* 3. ORDERS */}
          <motion.div
            id="feature-orders"
            variants={{
              hidden: { opacity: 0, y: 16, scale: 0.94 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 320, damping: 24 },
              },
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => setActiveSheet('orders')}
            className="flex flex-col items-center text-center cursor-pointer group"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center transition-transform">
              <img
                src={ASSET_IMAGES.myOrders}
                alt="Orders"
                className="w-full h-full object-contain drop-shadow-md select-none"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="mt-2 flex flex-col items-center">
              <h2 className="text-[15px] sm:text-[16px] font-black uppercase text-black tracking-tight leading-tight">
                {t('orders', 'ORDERS')}
              </h2>
            </div>
          </motion.div>

          {/* 4. FARMER COMMUNITY */}
          <motion.div
            id="feature-farmer-community"
            variants={{
              hidden: { opacity: 0, y: 16, scale: 0.94 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 320, damping: 24 },
              },
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => setActiveSheet('community')}
            className="flex flex-col items-center text-center cursor-pointer group"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center transition-transform">
              <img
                src={ASSET_IMAGES.farmerCommunity}
                alt="Farmer Community"
                className="w-full h-full object-contain drop-shadow-md select-none"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="mt-2 flex flex-col items-center">
              <h2 className="text-[15px] sm:text-[16px] font-black uppercase text-black tracking-tight leading-tight">
                {t('farmerCommunity', 'FARMER COMMUNITY')}
              </h2>
            </div>
          </motion.div>
        </div>

        {/* Row 3: MARKET INSIGHT & CATTLE matching exact reference image */}
        <div className="grid grid-cols-2 gap-4 mt-2 pb-4">
          {/* 5. MARKET INSIGHT */}
          <motion.div
            id="feature-market-insight"
            variants={{
              hidden: { opacity: 0, y: 16, scale: 0.94 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 320, damping: 24 },
              },
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => setActiveSheet('market-insights')}
            className="flex flex-col items-center text-center cursor-pointer group"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center transition-transform">
              <img
                src={ASSET_IMAGES.marketInsights}
                alt="Market Insight"
                className="w-full h-full object-contain drop-shadow-md select-none"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="mt-2 flex flex-col items-center">
              <h2 className="text-[15px] sm:text-[16px] font-black uppercase text-black tracking-tight leading-tight">
                {t('marketInsight', 'MARKET INSIGHT')}
              </h2>
            </div>
          </motion.div>

          {/* 6. CATTLE */}
          <motion.div
            id="feature-cattle"
            variants={{
              hidden: { opacity: 0, y: 16, scale: 0.94 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: 'spring', stiffness: 320, damping: 24 },
              },
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            onClick={() => setActiveSheet('cattle')}
            className="flex flex-col items-center text-center cursor-pointer group"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center transition-transform">
              <img
                src={ASSET_IMAGES.cattle}
                alt="Cattle"
                className="w-full h-full object-contain drop-shadow-md select-none"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="mt-2 flex flex-col items-center">
              <h2 className="text-[15px] sm:text-[16px] font-black uppercase text-black tracking-tight leading-tight">
                {t('cattle', 'CATTLE')}
              </h2>
            </div>
          </motion.div>
        </div>
      </motion.main>

      {/* --- HAMBURGER LANGUAGE MENU DROPDOWN (REFERENCE IMAGE 2) --- */}
      <AnimatePresence>
        {drawerOpen && (
          <div
            id="dashboard-drawer-overlay"
            className="fixed inset-0 z-50 bg-black/15 backdrop-blur-[1px]"
            onClick={() => setDrawerOpen(false)}
          >
            <motion.div
              id="dashboard-language-dropdown"
              initial={{ opacity: 0, scale: 0.94, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-16 left-5 sm:left-7 w-56 sm:w-60 bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden select-none"
            >
              {/* Header: Globe Icon + LANGUAGE */}
              <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-neutral-400 stroke-[2.2]" />
                <span className="text-xs font-black uppercase tracking-wider text-neutral-400">
                  {t('language', 'LANGUAGE')}
                </span>
              </div>

              {/* 6 Languages matching Reference Image 2 */}
              <div className="p-2 space-y-0.5">
                {[
                  { code: 'ta', nativeName: 'தமிழ்' },
                  { code: 'en', nativeName: 'English' },
                  { code: 'te', nativeName: 'తెలుగు' },
                  { code: 'kn', nativeName: 'ಕನ್ನಡ' },
                  { code: 'ml', nativeName: 'മലയാളം' },
                  { code: 'hi', nativeName: 'हिंदी' },
                ].map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      id={`menu-lang-${lang.code}`}
                      onClick={() => {
                        setLanguage(lang.code as any);
                        setDrawerOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-2xl text-[16px] font-bold transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'text-[#16A34A] bg-[#F0FDF4] font-extrabold'
                          : 'text-neutral-800 hover:bg-neutral-50 hover:text-emerald-700'
                      }`}
                    >
                      <span>{lang.nativeName}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FARMER PROFILE MODAL --- */}
      <AnimatePresence>
        {profileOpen && (
          <div
            id="farmer-profile-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            onClick={() => setProfileOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setProfileOpen(false)}
                className="absolute top-5 right-5 p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-500 bg-emerald-100 flex items-center justify-center text-emerald-800 shadow-md mb-3">
                  <User className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-neutral-900">{currentFarmer.name}</h3>
                <p className="text-sm font-semibold text-neutral-500">
                  {t('verifiedMember', 'Verified Member')}
                </p>

                <div className="mt-4 w-full bg-neutral-50 rounded-2xl p-4 text-left space-y-2.5 border border-neutral-100 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                      <Phone className="w-3.5 h-3.5" /> {t('phoneNumber', 'Mobile')}
                    </span>
                    <span className="font-bold text-neutral-800">+91 {currentFarmer.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5" /> {t('location', 'Location')}
                    </span>
                    <span className="font-bold text-neutral-800">{currentFarmer.location}</span>
                  </div>
                  {currentFarmer.landArea && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5" /> {t('landArea', 'Land Area')}
                      </span>
                      <span className="font-bold text-neutral-800">{currentFarmer.landArea}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 w-full flex flex-col gap-2">
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-md cursor-pointer"
                  >
                    {t('close', 'Close Profile')}
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onBackToLogin();
                    }}
                    className="w-full py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('logout', 'Logout')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 1: ADD PRODUCE CAMERA + AI GRADING & MANDI PRICING --- */}
      <AddProduceCameraModal
        isOpen={activeSheet === 'add-produce'}
        onClose={() => setActiveSheet(null)}
        onProductListed={(newProduct) => {
          setListings((prev) => [
            {
              id: newProduct.id || `L-${Math.floor(100 + Math.random() * 900)}`,
              name: `${newProduct.product_name} (Grade ${newProduct.grade})`,
              variety: `AI Quality Score ${newProduct.quality_score}/100`,
              quantity: `${newProduct.quantity_kg} Kg`,
              price: `${newProduct.display_price || `₹${newProduct.recommended_min_price}–₹${newProduct.recommended_max_price}/kg`}`,
              status: 'Active',
              views: 1,
              date: 'Just now',
            },
            ...prev,
          ]);
        }}
        farmerLocation="Madurai Mandi Gate 2"
        defaultDistrict="Chennai"
      />

      {/* --- MODAL 2: MY LISTINGS SHEET --- */}
      <AnimatePresence>
        {activeSheet === 'my-listings' && (
          <div
            id="sheet-my-listings-overlay"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
            onClick={() => setActiveSheet(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-neutral-900 leading-tight">
                      {t('myListings', 'My Listings')}
                    </h3>
                    <p className="text-xs text-neutral-500">{listings.length} items registered</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSheet(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {listings.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-neutral-900 text-sm">{item.name}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {item.status === 'Active' ? t('activeStatus', 'Active') : t('soldOutStatus', 'Sold Out')}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {item.quantity} • {item.price}
                      </p>
                      <span className="text-[11px] text-neutral-400">Listed: {item.date}</span>
                    </div>

                    <button
                      onClick={() => alert(`Managing listing: ${item.name}`)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setActiveSheet('add-produce')}
                className="mt-5 w-full py-3 rounded-2xl bg-[#22C55E] text-black font-extrabold text-sm flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ {t('addProduce', 'Add New Produce')}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 3: ORDERS SHEET --- */}
      <AnimatePresence>
        {activeSheet === 'orders' && (
          <div
            id="sheet-orders-overlay"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
            onClick={() => setActiveSheet(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-neutral-900 leading-tight">
                      {t('orders', 'Orders')}
                    </h3>
                    <p className="text-xs text-neutral-500">Active wholesale & retail buyer orders</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSheet(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {order.id}
                      </span>
                      <span className="font-extrabold text-sm text-neutral-900">{order.total}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm">{order.buyer}</h4>
                      <p className="text-xs text-neutral-600">
                        {order.item} - <strong className="text-neutral-900">{order.qty}</strong>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {order.time}
                      </span>
                      <a
                        href={`tel:${order.buyerPhone}`}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        Call Buyer
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 4: FARMER COMMUNITY SHEET --- */}
      <AnimatePresence>
        {activeSheet === 'community' && (
          <div
            id="sheet-community-overlay"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
            onClick={() => setActiveSheet(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-neutral-900 leading-tight">
                      {t('farmerCommunity', 'Farmer Community')}
                    </h3>
                    <p className="text-xs text-neutral-500">12,400+ Verified Tamil Nadu Farmers</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSheet(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/70">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                    🌧️ Weather Alert
                  </span>
                  <p className="text-xs text-amber-950 font-medium mt-1">
                    Madurai and Dindigul region: Moderate rainfall expected in the next 2 days. Protect harvested crops and plan harvesting accordingly.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                      RS
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">Ramasamy • Theni</h4>
                      <span className="text-[10px] text-neutral-400">1 hour ago</span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-700 mt-2 font-medium">
                    Fresh country tomatoes currently getting ₹38-₹42/kg on Uzhavan Bazzar. Direct wholesale buyers are purchasing without middleman cuts!
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center">
                      SK
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">Senthilkumar • Salem</h4>
                      <span className="text-[10px] text-neutral-400">3 hours ago</span>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-700 mt-2 font-medium">
                    Any recommended organic neem seed extract recipes for natural pest prevention for okra and brinjal?
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 5: MARKET INSIGHT SHEET (Live AGMARKNET API) --- */}
      <MarketInsightsModal
        isOpen={activeSheet === 'market-insights'}
        onClose={() => setActiveSheet(null)}
      />

      {/* --- MODAL 6: CATTLE & LIVESTOCK CARD SYSTEM (Cow, Hens, Goat, Eggs, Milk) --- */}
      <CattleModal
        isOpen={activeSheet === 'cattle'}
        onClose={() => setActiveSheet(null)}
      />
    </div>
  );
};
