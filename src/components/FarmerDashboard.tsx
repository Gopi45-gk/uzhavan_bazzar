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
  Trash2,
  Edit3,
  ThumbsUp,
  Send,
  MessageSquare,
} from 'lucide-react';
import { ASSET_IMAGES } from '../constants/assets';
import { CattleModal } from './CattleModal';
import { AddProduceCameraModal } from './AddProduceCameraModal';
import { ProductTypeSelection } from './ProductTypeSelection';
import { ExportProductModal } from './ExportProductModal';
import { productService, ProductListing } from '../services/productService';
import { orderService, OrderDocument } from '../services/orderService';
import { cattleService, CattleItem } from '../services/cattleService';
import { communityService, CommunityPost } from '../services/communityService';
import { marketInsightService, MarketRate } from '../services/marketInsightService';
import { farmerService, FarmerProfile, DEFAULT_FARMER } from '../services/farmerService';
import { authService } from '../services/authService';
import { bulkOrderService, BulkOrder } from '../services/exportService';
import { useLanguage } from '../context/LanguageContext';
import { LanguageCode } from '../types';

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
  | 'bulk-requests'
  | null;

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  onBackToLogin,
  onSwitchToBuyer,
  onSwitchLanguage,
}) => {
  const { t, language, setLanguage } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showProductTypeSelection, setShowProductTypeSelection] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  // Farmer Profile from Firestore /users/{uid} & /farmers/{uid}
  const [profileData, setProfileData] = useState<FarmerProfile>(() => {
    const session = typeof window !== 'undefined' ? authService.getCurrentSession() : null;
    if (session && (session.fullName || session.name)) {
      return {
        ...DEFAULT_FARMER,
        uid: session.uid,
        name: session.fullName || session.name,
        fullName: session.fullName || session.name,
        phoneNumber: session.mobileNumber || session.phoneNumber,
        mobileNumber: session.mobileNumber || session.phoneNumber,
        location: session.location || DEFAULT_FARMER.location,
        latitude: session.latitude ?? DEFAULT_FARMER.latitude,
        longitude: session.longitude ?? DEFAULT_FARMER.longitude,
        selectedLanguage: (session.language || 'ta') as any,
        language: (session.language || 'ta') as any,
      };
    }
    return DEFAULT_FARMER;
  });

  // Form states for Add Produce
  const [produceName, setProduceName] = useState('Fresh Tomatoes');
  const [quantity, setQuantity] = useState('500');
  const [unit, setUnit] = useState('Kg');
  const [pricePerUnit, setPricePerUnit] = useState('38');
  const [harvestDate, setHarvestDate] = useState('Tomorrow');
  const [produceSubmitted, setProduceSubmitted] = useState(false);

  // New Community post states
  const [newPostText, setNewPostText] = useState('');
  const [newPostTag, setNewPostTag] = useState('General');
  const [postingComment, setPostingComment] = useState(false);

  // Firestore-backed Real-time state (Section 20, 23, 25)
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [cattleListings, setCattleListings] = useState<CattleItem[]>([]);
  const [orders, setOrders] = useState<OrderDocument[]>([]);
  const [marketRates, setMarketRates] = useState<MarketRate[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [bulkRequests, setBulkRequests] = useState<BulkOrder[]>([]);

  // Produce Edit state (Requirement 11: Edit, Update quantity, Update price, Change availability)
  const [editingProduce, setEditingProduce] = useState<ProductListing | null>(null);
  const [editProduceQty, setEditProduceQty] = useState<string>('');
  const [editProducePrice, setEditProducePrice] = useState<string>('');
  const [editProduceAvailability, setEditProduceAvailability] = useState<'active' | 'inactive' | 'sold_out'>('active');
  const [isUpdatingListing, setIsUpdatingListing] = useState<boolean>(false);

  // Subscriptions to all Firestore collections
  useEffect(() => {
    const session = authService.getCurrentSession();
    const activeUid = session?.uid;

    // 1. Fetch Farmer Profile
    farmerService.getProfile(activeUid).then((prof) => setProfileData(prof));

    // 2. Realtime Produce Listings from Firestore /products (Section 20: My Listings)
    const unsubProducts = productService.subscribeProducts((items) => {
      setListings(items);
    });

    // 2b. Realtime Cattle Listings from Firestore /cattleListings (Section 20: My Listings)
    const unsubCattle = cattleService.subscribeCattle((items) => {
      setCattleListings(items);
    });

    // 3. Realtime Orders from Firestore /orders (Section 23: Farmer Orders)
    const unsubOrders = orderService.subscribeOrders((items) => {
      setOrders(items);
    });

    // 4. Realtime Market Mandi Rates from Firestore /market_rates
    const unsubRates = marketInsightService.subscribeRates((rates) => {
      setMarketRates(rates);
    });

    // 5. Realtime Community Discussions from Firestore /community_posts
    const unsubCommunity = communityService.subscribeCommunity((posts) => {
      setCommunityPosts(posts);
    });

    // 6. Realtime Bulk Requests from Firestore /bulkOrders
    const unsubBulk = bulkOrderService.subscribeAllBulkOrders((items) => {
      // Filter to only show requests for this farmer's products
      const farmerProducts = new Set<string>();
      setBulkRequests(items);
    });

    return () => {
      unsubProducts();
      unsubCattle();
      unsubOrders();
      unsubRates();
      unsubCommunity();
      unsubBulk();
    };
  }, []);

  const handleAcceptBulkRequest = async (orderId: string) => {
    try {
      await bulkOrderService.updateBulkOrderStatus(orderId, 'accepted');
    } catch (err) {
      console.warn('Error accepting bulk request:', err);
    }
  };

  const handleRejectBulkRequest = async (orderId: string) => {
    try {
      await bulkOrderService.updateBulkOrderStatus(orderId, 'rejected');
    } catch (err) {
      console.warn('Error rejecting bulk request:', err);
    }
  };

  const handleOpenEditProduce = (item: ProductListing) => {
    setEditingProduce(item);
    setEditProduceQty(String(item.quantity ?? item.quantityKg ?? 100));
    const cleanPrice = String(item.price || item.pricePerUnit || '40')
      .replace(/[^0-9.]/g, '')
      .trim();
    setEditProducePrice(cleanPrice || '40');
    setEditProduceAvailability(
      String(item.status).toLowerCase() === 'active' ? 'active' : 'inactive'
    );
  };

  const handleSaveProduceEdit = async () => {
    if (!editingProduce) return;
    setIsUpdatingListing(true);
    try {
      const newQty = parseFloat(editProduceQty) || editingProduce.quantity;
      const numPrice = parseFloat(editProducePrice) || 40;
      const unit = editingProduce.unit || 'kg';
      const newPriceStr = `₹${numPrice} / ${unit}`;

      await productService.updateProduct(editingProduce.id, {
        quantity: newQty,
        quantityKg: typeof newQty === 'number' ? newQty : parseFloat(String(newQty)),
        price: newPriceStr,
        displayPrice: newPriceStr,
        pricePerUnit: String(numPrice),
        optimizedPriceMax: numPrice,
        status: editProduceAvailability,
        availability: editProduceAvailability === 'active' ? 'In Stock' : 'Out of Stock',
      });
      setEditingProduce(null);
    } catch (err) {
      console.warn('Error updating product in Firestore:', err);
    } finally {
      setIsUpdatingListing(false);
    }
  };

  const handleAddProduceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProduceSubmitted(true);
    try {
      await productService.addProduct({
        name: produceName,
        variety: 'Fresh Farm Harvest',
        quantity: `${quantity} ${unit}`,
        price: `₹${pricePerUnit} / ${unit}`,
        status: 'Active',
        farmerName: profileData.name,
        farmerPhone: profileData.phoneNumber,
        location: profileData.location,
        unit,
        pricePerUnit,
        harvestDate,
      });
    } catch (err) {
      console.warn('Error saving produce to Firestore:', err);
    }
    setTimeout(() => {
      setProduceSubmitted(false);
      setActiveSheet('my-listings');
    }, 1200);
  };

  const handleDeleteListing = async (
    id: string,
    name: string,
    type: 'produce' | 'cattle' = 'produce'
  ) => {
    if (window.confirm(`Are you sure you want to remove "${name}" listing?`)) {
      try {
        if (type === 'produce') {
          await productService.deleteProduct(id);
        } else {
          await cattleService.deleteListing(id);
        }
      } catch (err) {
        console.warn('Error deleting listing from Firestore:', err);
      }
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    setPostingComment(true);
    try {
      await communityService.createPost({
        author: profileData.name,
        village: profileData.location.split(',')[0] || 'Tamil Nadu',
        cropTag: newPostTag,
        text: newPostText.trim(),
        avatarBg: 'bg-emerald-700',
      });
      setNewPostText('');
    } catch (err) {
      console.warn('Error posting to community in Firestore:', err);
    } finally {
      setPostingComment(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await communityService.likePost(postId);
    } catch (err) {
      console.warn('Error liking post in Firestore:', err);
    }
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
            onClick={() => setShowProductTypeSelection(true)}
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

      {/* --- SLIDING NAVIGATION DRAWER (HAMBURGER MENU) --- */}
      <AnimatePresence>
        {drawerOpen && (
          <div
            id="dashboard-drawer-overlay"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex"
            onClick={() => setDrawerOpen(false)}
          >
            <motion.div
              id="dashboard-drawer"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[290px] h-full bg-white shadow-2xl flex flex-col justify-between p-5"
            >
              <div>
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 leading-tight">{profileData.name}</h3>
                      <p className="text-xs text-neutral-500 font-medium">{profileData.location} • {t('farmer', 'Farmer')}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {t('verifiedFarmer', 'Verified Member')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Nav Links */}
                <div className="mt-5 space-y-1.5">
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      setShowProductTypeSelection(true);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 text-neutral-800 font-medium text-sm transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <PlusCircle className="w-5 h-5 text-emerald-600" />
                      <span>{t('addProduce', 'Add Produce')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>

                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      setActiveSheet('my-listings');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 text-neutral-800 font-medium text-sm transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-amber-600" />
                      <span>{t('myListings', 'My Listings')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>

                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      setActiveSheet('orders');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 text-neutral-800 font-medium text-sm transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-5 h-5 text-sky-600" />
                      <span>{t('orders', 'Orders')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>

                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      setActiveSheet('community');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 text-neutral-800 font-medium text-sm transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-green-600" />
                      <span>{t('farmerCommunity', 'Farmer Community')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>

                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      setActiveSheet('market-insights');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 text-neutral-800 font-medium text-sm transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-rose-600" />
                      <span>{t('marketInsight', 'Market Insight')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>

                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      setActiveSheet('cattle');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 text-neutral-800 font-medium text-sm transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-amber-100">
                        <span className="text-xs">🐮</span>
                      </div>
                      <span>{t('cattleAndLivestock', 'Cattle & Livestock')}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </button>

                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      setActiveSheet('bulk-requests');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 text-neutral-800 font-medium text-sm transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-5 h-5 text-purple-600" />
                      <span>{t('bulkRequests', 'Bulk Requests')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {bulkRequests.filter(r => r.status === 'pending').length > 0 && (
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {bulkRequests.filter(r => r.status === 'pending').length}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Bottom Quick Switchers & Section 8 Language Menu */}
              <div className="pt-3 border-t border-neutral-100 space-y-3">
                {/* 6 Supported Languages Grid (Section 8) */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2 px-1 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('language', 'Language')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { code: 'ta' as LanguageCode, label: 'தமிழ்' },
                      { code: 'en' as LanguageCode, label: 'English' },
                      { code: 'te' as LanguageCode, label: 'తెలుగు' },
                      { code: 'kn' as LanguageCode, label: 'ಕನ್ನಡ' },
                      { code: 'ml' as LanguageCode, label: 'മലയാളം' },
                      { code: 'hi' as LanguageCode, label: 'हिन्दी' },
                    ].map((item) => (
                      <button
                        key={item.code}
                        onClick={() => {
                          setLanguage(item.code);
                          setDrawerOpen(false);
                        }}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                          language === item.code
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-neutral-100">
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      onSwitchToBuyer();
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-sm font-bold cursor-pointer"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
                    <span>{t('buyerPortal', 'Buyer Portal')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      onBackToLogin();
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-red-600 hover:bg-red-50 text-sm font-semibold cursor-pointer"
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
                <h3 className="text-xl font-black text-neutral-900">{profileData.name}</h3>
                <p className="text-sm font-semibold text-neutral-500">
                  {t('farmerId', 'Farmer ID')}: {profileData.uid.startsWith('usr_')
                    ? `UB-${profileData.uid.replace('usr_', '')}`
                    : profileData.uid.length > 12
                    ? `UB-${profileData.uid.slice(-6).toUpperCase()}`
                    : profileData.uid}
                </p>

                <div className="mt-4 w-full bg-neutral-50 rounded-2xl p-4 text-left space-y-2.5 border border-neutral-100 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                      <Phone className="w-3.5 h-3.5" /> {t('phoneNumber', 'Mobile')}
                    </span>
                    <span className="font-bold text-neutral-800">{profileData.phoneNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5" /> {t('location', 'Location')}
                    </span>
                    <span className="font-bold text-neutral-800">{profileData.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5" /> {t('landArea', 'Land Area')}
                    </span>
                    <span className="font-bold text-neutral-800">{profileData.landArea} {profileData.landAreaUnit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 flex items-center gap-1.5 font-medium">
                      🌱 {t('crops', 'Crops')}
                    </span>
                    <span className="font-bold text-neutral-800 text-xs">
                      {listings.length > 0
                        ? Array.from(new Set(listings.map((l) => l.productName || l.name))).slice(0, 3).join(', ')
                        : profileData.cropType}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setProfileOpen(false)}
                  className="mt-5 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-md"
                >
                  {t('closeProfile', 'Close Profile')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 1: ADD PRODUCE 4-VIEW AI CAMERA MODAL --- */}
      <AddProduceCameraModal
        isOpen={activeSheet === 'add-produce'}
        onClose={() => setActiveSheet(null)}
        onProductListed={(newProduct) => {
          setListings((prev) => [newProduct, ...prev]);
          setActiveSheet(null);
        }}
        farmerLocation={profileData.location || 'Madurai Mandi Gate 2'}
        defaultDistrict="Chennai"
        farmerId={profileData.uid || profileData.phoneNumber || 'FARMER-MURUGAN-01'}
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
                    <p className="text-xs text-neutral-500">
                      {listings.length + cattleListings.length} {t('items', 'items')}
                    </p>
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
                {/* Produce Inline Edit Panel (Requirement 11) */}
                {editingProduce && (
                  <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-2xl space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-emerald-700" />
                        <h4 className="font-bold text-emerald-950 text-sm">
                          Edit: {editingProduce.productName || editingProduce.name}
                        </h4>
                      </div>
                      <button
                        onClick={() => setEditingProduce(null)}
                        className="p-1 rounded-full text-neutral-400 hover:text-neutral-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-neutral-600 mb-1">
                          Available Qty ({editingProduce.unit || 'kg'})
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={editProduceQty}
                          onChange={(e) => setEditProduceQty(e.target.value)}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-neutral-300 font-bold text-neutral-900 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-neutral-600 mb-1">
                          Price / {editingProduce.unit || 'kg'} (₹)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={editProducePrice}
                          onChange={(e) => setEditProducePrice(e.target.value)}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-neutral-300 font-bold text-neutral-900 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-neutral-600 mb-1">
                        Availability Status
                      </label>
                      <div className="flex gap-2">
                        {[
                          { key: 'active', label: 'In Stock' },
                          { key: 'sold_out', label: 'Sold Out' },
                          { key: 'inactive', label: 'Inactive' },
                        ].map((st) => (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => setEditProduceAvailability(st.key as any)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              editProduceAvailability === st.key
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleSaveProduceEdit}
                        disabled={isUpdatingListing}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        {isUpdatingListing ? 'Updating Firebase...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setEditingProduce(null)}
                        className="px-4 py-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-700 font-bold text-xs hover:bg-neutral-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* 1. Agricultural Produce Listings from Firestore (Section 20) */}
                {listings.map((item) => (
                  <div
                    key={`prod-${item.id}`}
                    className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-neutral-900 text-sm">{item.name}</h4>
                        {item.grade && (
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              item.grade === 'A'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : item.grade === 'B'
                                ? 'bg-lime-100 text-lime-800 border border-lime-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {t('grade', 'Grade')} {item.grade}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'Active' || item.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {item.status === 'Active' || item.status === 'active' ? t('activeStatus', 'Active') : item.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {item.quantity} {item.unit || ''} • {item.price}
                      </p>
                      <span className="text-[11px] text-neutral-400">{t('listed', 'Listed')}: {item.date || t('activeStatus', 'Active')}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditProduce(item)}
                        className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
                        title="Edit price, quantity, availability"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteListing(item.id, item.name, 'produce')}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                        title="Delete listing from Firestore"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* 2. Cattle & Livestock Listings from Firestore (Section 20) */}
                {cattleListings.map((cItem) => (
                  <div
                    key={`cattle-${cItem.id}`}
                    className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/70 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cItem.badgeEmoji || '🐮'}</span>
                        <h4 className="font-bold text-neutral-900 text-sm">{cItem.title}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                          {cItem.category.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 mt-0.5 font-medium">
                        {cItem.price} • {cItem.availableQty || `${cItem.quantity || 1} ${t('available', 'available')}`}
                      </p>
                      <span className="text-[11px] text-neutral-500">{cItem.location}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeleteListing(cItem.id, cItem.title, 'cattle')}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                        title="Delete cattle listing from Firestore"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {listings.length === 0 && cattleListings.length === 0 && (
                  <div className="text-center py-8 text-neutral-400 text-sm">
                    {t('noListingsYet', 'No active listings yet. Add your first produce or livestock!')}
                  </div>
                )}
              </div>

              <button
                onClick={() => setActiveSheet('add-produce')}
                className="mt-5 w-full py-3 rounded-2xl bg-[#22C55E] text-black font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-[#16A34A] transition-colors"
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
                    <p className="text-xs text-neutral-500">{t('incomingOrders', 'Active buyer orders from Firestore')}</p>
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
                    className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2.5"
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
                      {order.deliveryAddress && (
                        <p className="text-[11px] text-neutral-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="truncate">{order.deliveryAddress}</span>
                        </p>
                      )}
                    </div>

                    {/* Order Status Controller (Section 13) */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-semibold text-neutral-500">{t('orderStatus', 'Order Status:')}</span>
                      <select
                        value={order.orderStatus || 'placed'}
                        onChange={(e) => orderService.updateOrderStatus(order.id, e.target.value)}
                        className="text-xs font-bold py-1 px-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 focus:outline-none cursor-pointer"
                      >
                        <option value="placed">{t('statusPlaced', 'Placed')}</option>
                        <option value="confirmed">{t('statusConfirmed', 'Confirmed')}</option>
                        <option value="processing">{t('statusProcessing', 'Processing')}</option>
                        <option value="ready">{t('statusReady', 'Ready for Pickup')}</option>
                        <option value="shipped">{t('statusInTransit', 'In Transit')}</option>
                        <option value="delivered">{t('statusDelivered', 'Delivered')}</option>
                        <option value="cancelled">{t('statusCancelled', 'Cancelled')}</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {order.time}
                      </span>
                      {order.buyerPhone && (
                        <a
                          href={`tel:${order.buyerPhone}`}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          {t('callBuyer', 'Call Buyer')}
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {orders.length === 0 && (
                  <div className="text-center py-8 text-neutral-400 text-sm">
                    {t('noOrdersYet', 'No orders placed yet.')}
                  </div>
                )}
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
                    <p className="text-xs text-neutral-500">{t('communitySubtitle', '12,400+ Farmers online across the state')}</p>
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
                {/* Form to post new discussion */}
                <form onSubmit={handleCreatePost} className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-700" /> {t('shareWithFarmers', 'Ask or Share with Farmers')}
                    </span>
                    <select
                      value={newPostTag}
                      onChange={(e) => setNewPostTag(e.target.value)}
                      className="text-[11px] font-semibold bg-white border border-neutral-300 rounded-lg px-2 py-1 text-neutral-700"
                    >
                      <option value="Pest Control">{t('tagPestControl', 'Pest Control')}</option>
                      <option value="Mandi Rates">{t('tagMandiRates', 'Mandi Rates')}</option>
                      <option value="Subsidy & Schemes">{t('tagSubsidy', 'Subsidy')}</option>
                      <option value="Seeds & Soil">{t('tagSeedsSoil', 'Seeds & Soil')}</option>
                      <option value="General">{t('tagGeneral', 'General')}</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      placeholder={t('shareTipPlaceholder', 'Share tip or ask a question...')}
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={postingComment || !newPostText.trim()}
                      className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{t('post', 'Post')}</span>
                    </button>
                  </div>
                </form>

                {/* Weather Alert */}
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/70">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                    🌧️ {t('weatherAlertTitle', 'Weather Alert')}
                  </span>
                  <p className="text-xs text-amber-950 font-medium mt-1">
                    {t('weatherAlertDesc', 'Madurai and Dindigul region: Moderate rainfall expected in the next 2 days. Protect harvested crops and plan harvesting accordingly.')}
                  </p>
                </div>

                {/* Live Community Posts from Firestore */}
                {communityPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full ${
                            post.avatarBg || 'bg-emerald-700'
                          } text-white font-bold text-xs flex items-center justify-center`}
                        >
                          {post.author.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-neutral-900">
                            {post.author} • {post.village}
                          </h4>
                          <span className="text-[10px] text-neutral-400">{post.timeAgo}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {post.cropTag}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-700 font-medium leading-relaxed">
                      {post.text}
                    </p>

                    <div className="flex items-center gap-4 pt-2 border-t border-neutral-200/60 text-[11px] text-neutral-500">
                      <button
                        type="button"
                        onClick={() => handleLikePost(post.id)}
                        className="flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{post.likes} {t('like', 'Helpful')}</span>
                      </button>
                      <span>•</span>
                      <span>{post.comments} {t('replies', 'Replies')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 5: MARKET INSIGHT SHEET --- */}
      <AnimatePresence>
        {activeSheet === 'market-insights' && (
          <div
            id="sheet-market-insights-overlay"
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
                  <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-neutral-900 leading-tight">
                      {t('marketInsight', 'Market Insight')}
                    </h3>
                    <p className="text-xs text-neutral-500">{t('todayMandiRates', 'Live Mandi Bhav & Market Price Trends')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSheet(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-2.5">
                {marketRates.map((crop, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm">{crop.name}</h4>
                      <span className="text-xs text-neutral-500">{crop.mandi} {t('market', 'Mandi')}</span>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-neutral-900 text-sm">{crop.rate}</div>
                      <span
                        className={`text-xs font-bold ${
                          crop.up ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {crop.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium text-center">
                💡 {t('mandiDisclaimer', 'Prices are updated real-time from official AGMARKNET & Uzhavar Sandhai records.')}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 6: CATTLE & LIVESTOCK CARD SYSTEM (Cow, Hens, Goat, Eggs, Milk) --- */}
      <CattleModal
        isOpen={activeSheet === 'cattle'}
        onClose={() => setActiveSheet(null)}
        currentFarmer={profileData}
      />

      {/* --- MODAL 7: PRODUCT TYPE SELECTION (Add Product vs Export Product) --- */}
      <ProductTypeSelection
        open={showProductTypeSelection}
        onClose={() => setShowProductTypeSelection(false)}
        onSelectAddProduct={() => setActiveSheet('add-produce')}
        onSelectExportProduct={() => setShowExportModal(true)}
      />

      {/* --- MODAL 8: EXPORT PRODUCT --- */}
      <ExportProductModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        farmerName={profileData.name}
      />

      {/* --- SHEET: BULK REQUESTS MANAGEMENT --- */}
      <AnimatePresence>
        {activeSheet === 'bulk-requests' && (
          <div
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-xs"
            onClick={() => setActiveSheet(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 pt-5 pb-3 border-b border-neutral-100">
                <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                  {t('incomingBulkRequests', 'Incoming Bulk Requests')}
                </h2>
                <button
                  onClick={() => setActiveSheet(null)}
                  className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-3">
                {bulkRequests.length === 0 ? (
                  <div className="text-center py-10">
                    <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-neutral-500">
                      {t('noBulkRequests', 'No bulk requests yet')}
                    </p>
                  </div>
                ) : (
                  bulkRequests.map((req) => (
                    <div key={req.id} className="p-4 rounded-2xl border border-neutral-200 bg-white shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-neutral-900">{req.productName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          req.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {req.status === 'pending' ? t('statusPending', 'Pending') :
                           req.status === 'accepted' ? t('statusAccepted', 'Accepted') :
                           t('statusRejected', 'Rejected')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div><span className="text-neutral-400 font-medium">{t('buyerNameLabel', 'Buyer')}:</span> <span className="font-bold text-neutral-700">{req.buyerName}</span></div>
                        <div><span className="text-neutral-400 font-medium">{t('requiredQuantity', 'Qty')}:</span> <span className="font-bold text-neutral-700">{req.requestedQuantity} {req.unit}</span></div>
                        <div><span className="text-neutral-400 font-medium">{t('requiredByDate', 'By')}:</span> <span className="font-bold text-neutral-700">{req.neededBy}</span></div>
                      </div>
                      {req.notes && (
                        <p className="text-xs text-neutral-500 italic bg-neutral-50 p-2 rounded-lg">
                          "{req.notes}"
                        </p>
                      )}
                      {req.status === 'pending' && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleAcceptBulkRequest(req.id)}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                          >
                            ✓ {t('acceptRequest', 'Accept')}
                          </button>
                          <button
                            onClick={() => handleRejectBulkRequest(req.id)}
                            className="flex-1 py-2 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition"
                          >
                            ✕ {t('rejectRequest', 'Reject')}
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
