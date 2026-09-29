import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Search,
  Phone,
  MapPin,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Camera,
  Upload,
  Trash2,
  Loader2,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { ASSET_IMAGES } from '../constants/assets';
import { cattleService, CattleCategory, CattleItem, INITIAL_CATTLE_DATA } from '../services/cattleService';
import { orderService } from '../services/orderService';
import { FarmerProfile } from '../services/farmerService';
import { useLanguage } from '../context/LanguageContext';

interface CattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFarmer?: FarmerProfile;
}

export const CATTLE_CATEGORIES_DATA = [
  {
    id: 'cow' as const,
    name: 'COW',
    image: ASSET_IMAGES.cattleCow,
    animType: 'bounce' as const,
    btnLabel: 'Post Cow Listing',
  },
  {
    id: 'goat' as const,
    name: 'GOAT',
    image: ASSET_IMAGES.cattleGoat,
    animType: 'bounce' as const,
    btnLabel: 'Post Goat Listing',
  },
  {
    id: 'hens' as const,
    name: 'HEN',
    image: ASSET_IMAGES.cattleHen,
    animType: 'bounce' as const,
    btnLabel: 'Post Hen Listing',
  },
  {
    id: 'milk' as const,
    name: 'MILK',
    image: ASSET_IMAGES.cattleMilk,
    animType: 'float' as const,
    btnLabel: 'Post Milk Listing',
  },
  {
    id: 'eggs' as const,
    name: 'EGG',
    image: ASSET_IMAGES.cattleEgg,
    animType: 'bounce' as const,
    btnLabel: 'Post Egg Listing',
  },
];

export const INBUILT_COW_TYPES = [
  'Kangeyam',
  'Jersey',
  'HF',
  'Gir',
  'Sahiwal',
  'Crossbred',
  'Other',
] as const;

export const INBUILT_GOAT_TYPES = [
  'Boer',
  'Jamunapari',
  'Sirohi',
  'Kanni Adu',
  'Salem Black',
  'Mecheri',
  'Other',
] as const;

export const INBUILT_HEN_TYPES = [
  'Country Chicken',
  'Aseel',
  'Kadaknath',
  'Broiler',
  'Layer',
  'Giriraja',
  'Other',
] as const;

export const INBUILT_EGG_TYPES = [
  'Country Egg',
  'White Egg',
  'Brown Egg',
  'Other',
] as const;

export const INBUILT_EGG_QTY_PRESETS = ['10', '50', '100', '250', '500', '1000'];

export const INBUILT_MILK_TYPES = [
  'Cow Milk',
  'Goat Milk',
  'Buffalo Milk',
  'Other',
] as const;

export const INBUILT_MILK_QTY_PRESETS = ['5', '10', '20', '50', '100'];

export const CattleModal: React.FC<CattleModalProps> = ({
  isOpen,
  onClose,
  currentFarmer,
}) => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'farmersCattle' | 'marketplace' | 'myCattle'>('farmersCattle');
  const [selectedTab, setSelectedTab] = useState<CattleCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<CattleItem[]>(INITIAL_CATTLE_DATA);

  // Inbuilt selection states
  const [isCustomCowBreed, setIsCustomCowBreed] = useState(false);
  const [customCowBreed, setCustomCowBreed] = useState('');

  const [isCustomGoatBreed, setIsCustomGoatBreed] = useState(false);
  const [customGoatBreed, setCustomGoatBreed] = useState('');

  const [isCustomHenBreed, setIsCustomHenBreed] = useState(false);
  const [customHenBreed, setCustomHenBreed] = useState('');

  const [isCustomEggType, setIsCustomEggType] = useState(false);
  const [customEggType, setCustomEggType] = useState('');

  const [isCustomMilkType, setIsCustomMilkType] = useState(false);
  const [customMilkType, setCustomMilkType] = useState('');

  // Subscribe to real-time Firestore livestockListings / cattle collection
  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = cattleService.subscribeCattle((realtimeItems) => {
      setItems(realtimeItems);
    });
    return () => unsubscribe();
  }, [isOpen]);

  // Inquire / Book Modal State
  const [bookingItem, setBookingItem] = useState<CattleItem | null>(null);
  const [bookSuccess, setBookSuccess] = useState(false);
  const [buyerName, setBuyerName] = useState('Murugan S.');
  const [buyerPhone, setBuyerPhone] = useState('+91 98765 43210');
  const [buyerQty, setBuyerQty] = useState('1');

  // Post Listing Form Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState<'cow' | 'hens' | 'goat' | 'eggs' | 'milk'>('cow');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Photo state (REQUIRED for Cow, Goat, Hens; NOT REQUIRED for Eggs, Milk)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Track listings created in this session for My Cattle view
  const [myCreatedIds, setMyCreatedIds] = useState<string[]>([]);

  // Dynamic Category Specific Fields:
  // COW
  const [cowBreed, setCowBreed] = useState('Kangeyam');
  const [cowAge, setCowAge] = useState('3.5 Years');
  const [cowGender, setCowGender] = useState('Female');
  const [cowLactation, setCowLactation] = useState('1st Lactation');
  const [cowMilkYield, setCowMilkYield] = useState('11 L/day');
  const [cowVaccination, setCowVaccination] = useState('FMD Vaccinated');
  const [cowQuantity, setCowQuantity] = useState('1');
  const [cowPrice, setCowPrice] = useState('48,000');
  const [cowLocation, setCowLocation] = useState(currentFarmer?.location || 'Kangeyam, Tiruppur');
  const [cowDescription, setCowDescription] = useState('Native Tamil Nadu Kangeyam (A2 Milk Lineage)');

  // GOAT
  const [goatBreed, setGoatBreed] = useState('Boer');
  const [goatAge, setGoatAge] = useState('2 Years');
  const [goatGender, setGoatGender] = useState('Female');
  const [goatWeight, setGoatWeight] = useState('45 kg');
  const [goatQuantity, setGoatQuantity] = useState('1');
  const [goatVaccination, setGoatVaccination] = useState('PPR Vaccinated');
  const [goatPrice, setGoatPrice] = useState('12,000');
  const [goatLocation, setGoatLocation] = useState(currentFarmer?.location || 'Oddanchatram, Dindigul');
  const [goatDescription, setGoatDescription] = useState('Healthy purebred female meat goat, pasture fed.');

  // HEN
  const [henBreed, setHenBreed] = useState('Country Chicken');
  const [henAge, setHenAge] = useState('8 Months');
  const [henGender, setHenGender] = useState('Mixed');
  const [henQuantity, setHenQuantity] = useState('10');
  const [henPrice, setHenPrice] = useState('700');
  const [henLocation, setHenLocation] = useState(currentFarmer?.location || 'Paramathi Velur, Namakkal');
  const [henDescription, setHenDescription] = useState('Pure free-range country chicken, pasture fed without antibiotics.');

  // EGG (NO IMAGE REQUIRED)
  const [eggType, setEggType] = useState('Country Egg');
  const [eggQuantity, setEggQuantity] = useState('500');
  const [eggPrice, setEggPrice] = useState('8');
  const [eggUnit, setEggUnit] = useState('Egg');
  const [eggLocation, setEggLocation] = useState(currentFarmer?.location || 'Rasipuram, Namakkal');
  const [eggDescription, setEggDescription] = useState('100% Organic free-range country eggs with natural orange yolk.');

  // MILK (NO IMAGE REQUIRED)
  const [milkType, setMilkType] = useState('Cow Milk');
  const [milkQuantity, setMilkQuantity] = useState('50');
  const [milkPrice, setMilkPrice] = useState('50');
  const [milkUnit, setMilkUnit] = useState('Litre');
  const [milkLocation, setMilkLocation] = useState(currentFarmer?.location || 'Sathyamangalam, Erode');
  const [milkDescription, setMilkDescription] = useState('Pure Desi Cow A2 raw milk, 4.8% fat, fresh morning chilled delivery.');

  // Sync default location from current logged-in farmer
  useEffect(() => {
    if (currentFarmer?.location) {
      setCowLocation((prev) => (!prev || prev.includes('Tiruppur') ? currentFarmer.location : prev));
      setGoatLocation((prev) => (!prev || prev.includes('Dindigul') ? currentFarmer.location : prev));
      setHenLocation((prev) => (!prev || prev.includes('Namakkal') ? currentFarmer.location : prev));
      setEggLocation((prev) => (!prev || prev.includes('Namakkal') ? currentFarmer.location : prev));
      setMilkLocation((prev) => (!prev || prev.includes('Erode') ? currentFarmer.location : prev));
    }
  }, [currentFarmer]);

  // Handle Photo selection from device camera or gallery
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoDataUrl(reader.result as string);
        setFormError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoDataUrl(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  // Open add modal pre-selecting the current tab if specific
  const openPostModal = (cat?: 'cow' | 'hens' | 'goat' | 'eggs' | 'milk') => {
    if (cat) {
      setNewCategory(cat);
    } else if (selectedTab !== 'all') {
      setNewCategory(selectedTab);
    }
    setFormError(null);
    setPhotoDataUrl(null);
    setShowPreview(false);
    setShowAddModal(true);
  };

  // Farmer's Own Listings (My Cattle)
  const myListings = items.filter(
    (item) =>
      myCreatedIds.includes(item.id) ||
      (currentFarmer?.uid && item.farmerId === currentFarmer.uid) ||
      item.farmer?.includes('You') ||
      item.farmerId === 'farmer-auth' ||
      item.farmerId?.startsWith('farmer-default')
  );

  // Filter items based on selected tab and search
  const filteredItems = items.filter((item) => {
    const matchesTab =
      selectedTab === 'all' ||
      item.category === selectedTab ||
      (selectedTab === 'hens' && (item.category as any) === 'hen') ||
      (selectedTab === 'eggs' && (item.category as any) === 'egg');

    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesTab;
    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      item.breed.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.farmer.toLowerCase().includes(q) ||
      (item.specs && item.specs.some((s) => s.toLowerCase().includes(q))) ||
      (item.description && item.description.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingItem) {
      try {
        await orderService.createOrder({
          id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
          buyer: buyerName,
          buyerPhone: buyerPhone,
          item: `${bookingItem.title} (${buyerQty} ${bookingItem.category === 'milk' ? 'L' : 'Units'})`,
          qty: `${buyerQty} Units`,
          total: bookingItem.price,
          status: 'Pending',
          location: bookingItem.location,
          time: 'Just now',
        });
      } catch (err) {
        console.warn('Cattle booking order error:', err);
      }
    }
    setBookSuccess(true);
    setTimeout(() => {
      setBookSuccess(false);
      setBookingItem(null);
    }, 1800);
  };

  // Submit livestock listing
  const handleAddNewCattle = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const requiresImage = ['cow', 'goat', 'hens'].includes(newCategory);

    // Frontend validation for photo requirement
    if (requiresImage && !photoDataUrl) {
      setFormError('Please add a photo before posting.');
      return;
    }

    setIsSubmitting(true);

    const categoryBadges: Record<
      'cow' | 'hens' | 'goat' | 'eggs' | 'milk',
      { label: string; emoji: string; bg: string; text: string }
    > = {
      cow: {
        label: 'Cow (பசு மாடு)',
        emoji: '🐮',
        bg: 'bg-amber-100 text-amber-900 border-amber-300',
        text: 'Cow',
      },
      hens: {
        label: 'Hens (நாட்டு கோழி)',
        emoji: '🐔',
        bg: 'bg-orange-100 text-orange-900 border-orange-300',
        text: 'Hens',
      },
      goat: {
        label: 'Goat (செம்மறி / வெள்ளாடு)',
        emoji: '🐐',
        bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        text: 'Goat',
      },
      eggs: {
        label: 'Eggs (நாட்டுக்கோழி முட்டை)',
        emoji: '🥚',
        bg: 'bg-amber-50 text-amber-950 border-amber-300',
        text: 'Eggs',
      },
      milk: {
        label: 'Milk (பசும்பால் / எருமைப்பால்)',
        emoji: '🥛',
        bg: 'bg-sky-100 text-sky-900 border-sky-300',
        text: 'Milk',
      },
    };

    const meta = categoryBadges[newCategory];
    const farmerName = currentFarmer?.name ? `You (${currentFarmer.name})` : 'You (Murugan S.)';
    const farmerPhone = currentFarmer?.phoneNumber || '+91 98421 55670';

    let title = '';
    let breed = '';
    let specs: string[] = [];
    let price = '';
    let priceNote = 'Direct Farm Sale';
    let location = '';
    let availableQty = 'Available Now';
    let description = '';

    const actualCowBreed = isCustomCowBreed && customCowBreed.trim() ? customCowBreed.trim() : cowBreed;
    const actualGoatBreed = isCustomGoatBreed && customGoatBreed.trim() ? customGoatBreed.trim() : goatBreed;
    const actualHenBreed = isCustomHenBreed && customHenBreed.trim() ? customHenBreed.trim() : henBreed;
    const actualEggType = isCustomEggType && customEggType.trim() ? customEggType.trim() : eggType;
    const actualMilkType = isCustomMilkType && customMilkType.trim() ? customMilkType.trim() : milkType;

    if (newCategory === 'cow') {
      title = `${actualCowBreed} ${cowGender === 'Female' ? 'Desi Cow' : cowGender}`;
      breed = `Native ${actualCowBreed} (${cowLactation})`;
      specs = [cowLactation, `${cowMilkYield} Yield`, `Age: ${cowAge}`, cowVaccination, `${cowQuantity} Available`].filter(Boolean);
      price = cowPrice.startsWith('₹') ? cowPrice : `₹${cowPrice}`;
      priceNote = 'Direct Farm Sale';
      location = cowLocation;
      availableQty = `${cowQuantity} Available`;
      description = cowDescription;
    } else if (newCategory === 'goat') {
      title = `${actualGoatBreed} ${goatGender} Goat`;
      breed = `Pure ${actualGoatBreed} Breed`;
      specs = [`Age: ${goatAge}`, `Weight: ${goatWeight}`, goatVaccination, `${goatQuantity} Available`].filter(Boolean);
      price = goatPrice.startsWith('₹') ? goatPrice : `₹${goatPrice}`;
      priceNote = 'Prime Meat / Breeding';
      location = goatLocation;
      availableQty = `${goatQuantity} Available`;
      description = goatDescription;
    } else if (newCategory === 'hens') {
      title = `${actualHenBreed}`;
      breed = `${actualHenBreed} (${henQuantity} Available)`;
      specs = [`Age: ${henAge}`, `${henQuantity} Birds Lot`, `Gender: ${henGender}`].filter(Boolean);
      price = henPrice.startsWith('₹') ? henPrice : `₹${henPrice}`;
      priceNote = 'per Bird / Batch';
      location = henLocation;
      availableQty = `${henQuantity} Birds Batch`;
      description = henDescription;
    } else if (newCategory === 'eggs') {
      title = actualEggType;
      breed = `${eggQuantity} Fresh Farm Eggs`;
      specs = ['Daily Fresh Collection', `${eggQuantity} Available`, `Unit: ${eggUnit}`].filter(Boolean);
      price = eggPrice.startsWith('₹') ? eggPrice : `₹${eggPrice}`;
      priceNote = `per ${eggUnit}`;
      location = eggLocation;
      availableQty = `${eggQuantity} Eggs in Stock`;
      description = eggDescription;
    } else if (newCategory === 'milk') {
      title = actualMilkType;
      breed = 'Pure Daily Chilled Supply';
      specs = [`${milkQuantity} Litres / Day`, 'Zero Adulteration', `Unit: ${milkUnit}`].filter(Boolean);
      price = milkPrice.startsWith('₹') ? milkPrice : `₹${milkPrice}`;
      priceNote = `per ${milkUnit}`;
      location = milkLocation;
      availableQty = `${milkQuantity} Litres Today`;
      description = milkDescription;
    }

    const newItemData: Omit<CattleItem, 'id'> = {
      farmerId: currentFarmer?.uid || 'farmer-auth',
      category: newCategory,
      categoryLabel: meta.label,
      badgeEmoji: meta.emoji,
      badgeBg: meta.bg,
      badgeText: meta.text,
      title,
      breed,
      specs,
      price,
      priceNote,
      farmer: farmerName,
      location,
      locationName: location,
      phone: farmerPhone,
      verified: true,
      availableQty,
      imageUrl: photoDataUrl || undefined,
      imageUrls: photoDataUrl ? [photoDataUrl] : [],
      description,
      status: 'active',
    };

    try {
      const newId = await cattleService.addCattle(newItemData, photoDataUrl || undefined);
      const createdItem: CattleItem = { ...newItemData, id: newId };
      setMyCreatedIds((prev) => [newId, ...prev]);
      setItems((prev) => [createdItem, ...prev.filter((i) => i.id !== newId)]);
      setShowAddModal(false);
      setViewMode('myCattle');
      setSelectedTab(newCategory);
      setPhotoDataUrl(null);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to post listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteListing = async (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this listing?')) {
      try {
        await cattleService.deleteListing(listingId);
        setItems((prev) => prev.filter((i) => i.id !== listingId));
      } catch (err) {
        console.warn('Delete listing failed:', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        key="cattle-sheet-overlay"
        id="cattle-sheet-overlay"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs p-0 sm:p-4 select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-[#FAF8F5] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header Bar matching Uzhavan Bazzar style */}
          <div className="bg-white px-5 py-4 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-amber-600/30 bg-amber-50 flex items-center justify-center shadow-xs flex-shrink-0">
                <img
                  src={ASSET_IMAGES.cattle}
                  alt="Cattle"
                  className="w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg sm:text-xl font-black text-neutral-900 leading-tight">
                    {t('cattleAndLivestock', 'Cattle & Livestock')}
                  </h3>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    {t('liveMandi', 'Live Mandi')}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  {t('cattleDescription', 'Direct trading of Cow, Hens, Goat, Eggs & Milk')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="add-cattle-btn"
                onClick={() => setViewMode(viewMode === 'farmersCattle' ? 'marketplace' : 'farmersCattle')}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer ${
                  viewMode === 'farmersCattle'
                    ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {viewMode === 'farmersCattle' ? (
                  <>
                    <span>🛒</span>
                    <span>{t('liveMandi', 'Live Mandi')}</span>
                  </>
                ) : (
                  <>
                    <span>🐄</span>
                    <span>{t('farmersCattle', "Farmer's Cattle")}</span>
                  </>
                )}
              </button>
              <button
                id="close-cattle-modal-btn"
                onClick={onClose}
                className="p-2 rounded-full text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation Bar: Farmer's Cattle | Live Mandi | My Cattle */}
          <div className="bg-white px-5 py-2.5 border-b border-neutral-200 flex items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-2xl w-full">
              <button
                id="tab-farmers-cattle-view"
                type="button"
                onClick={() => setViewMode('farmersCattle')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  viewMode === 'farmersCattle'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                }`}
              >
                <span>🐄</span>
                <span>{t('farmersCattle', "Farmer's Cattle")}</span>
              </button>
              <button
                id="tab-marketplace-view"
                type="button"
                onClick={() => setViewMode('marketplace')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  viewMode === 'marketplace'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                }`}
              >
                <span>🛒</span>
                <span>{t('liveMandi', 'Live Mandi')}</span>
                <span className="text-[10px] opacity-80">({filteredItems.length})</span>
              </button>
              <button
                id="tab-my-cattle-view"
                type="button"
                onClick={() => setViewMode('myCattle')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  viewMode === 'myCattle'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                }`}
              >
                <span>📋</span>
                <span>{t('myCattle', 'My Cattle')}</span>
                <span className="text-[10px] opacity-80">({myListings.length})</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: FARMER'S CATTLE (ONLY the 5 category cards vertically, sequential animation, no marketplace listings) */}
          {viewMode === 'farmersCattle' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="flex flex-col gap-4">
                {CATTLE_CATEGORIES_DATA.map((cat, idx) => (
                  <motion.div
                    key={`farmers-cattle-${cat.id}`}
                    id={`cattle-card-${cat.id}`}
                    initial={{ opacity: 0, scale: 0.92, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      delay: idx * 0.08,
                      duration: 0.35,
                      ease: 'easeOut',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openPostModal(cat.id)}
                    className="w-full bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col items-center justify-center text-center group select-none"
                  >
                    <div className="w-full h-44 sm:h-52 rounded-xl bg-neutral-50/80 flex items-center justify-center overflow-hidden p-3 border border-neutral-100">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="max-h-full max-w-full object-contain select-none"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.includes('image3url')) {
                            target.src = target.src.replace('image3url', 'image2url');
                          }
                        }}
                      />
                    </div>
                    <h4 className="mt-4 text-2xl font-black text-neutral-900 tracking-wider uppercase group-hover:text-emerald-700 transition-colors">
                      {cat.id === 'cow' ? t('categoryCow') : cat.id === 'goat' ? t('categoryGoat') : cat.id === 'hens' ? t('categoryHen') : cat.id === 'milk' ? t('categoryMilk') : t('categoryEgg')}
                    </h4>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 2: LIVE MANDI (MARKETPLACE WITH SEARCH, CATEGORY FILTER CHIPS, AND LISTINGS) */}
          {viewMode === 'marketplace' && (
            <>
              {/* Search & Category Tabs Bar */}
              <div className="bg-white px-5 pt-3 pb-3 border-b border-neutral-200 flex flex-col gap-3 flex-shrink-0">
                {/* Search Input */}
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="cattle-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchCattle', 'Search Cow, Hens, Goat, Eggs, Milk or district...')}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs sm:text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
                    >
                      {t('cancel', 'Clear')}
                    </button>
                  )}
                </div>

                {/* 5 Category Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                  <button
                    onClick={() => setSelectedTab('all')}
                    className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedTab === 'all'
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {t('all', 'All')} ({items.length})
                  </button>

                  <button
                    id="tab-cow"
                    onClick={() => setSelectedTab('cow')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedTab === 'cow'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    <span>🐮</span>
                    <span>{t('categoryCow', 'Cow')}</span>
                    <span className="text-[10px] opacity-80">
                      ({items.filter((i) => i.category === 'cow').length})
                    </span>
                  </button>

                  <button
                    id="tab-goat"
                    onClick={() => setSelectedTab('goat')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedTab === 'goat'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    <span>🐐</span>
                    <span>{t('categoryGoat', 'Goat')}</span>
                    <span className="text-[10px] opacity-80">
                      ({items.filter((i) => i.category === 'goat').length})
                    </span>
                  </button>

                  <button
                    id="tab-hens"
                    onClick={() => setSelectedTab('hens')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedTab === 'hens'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-orange-50 text-orange-900 hover:bg-orange-100 border border-orange-200'
                    }`}
                  >
                    <span>🐔</span>
                    <span>{t('categoryHen', 'Hen')}</span>
                    <span className="text-[10px] opacity-80">
                      ({items.filter((i) => i.category === 'hens' || (i.category as any) === 'hen').length})
                    </span>
                  </button>

                  <button
                    id="tab-milk"
                    onClick={() => setSelectedTab('milk')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedTab === 'milk'
                        ? 'bg-sky-700 text-white shadow-xs'
                        : 'bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-200'
                    }`}
                  >
                    <span>🥛</span>
                    <span>{t('categoryMilk', 'Milk')}</span>
                    <span className="text-[10px] opacity-80">
                      ({items.filter((i) => i.category === 'milk').length})
                    </span>
                  </button>

                  <button
                    id="tab-eggs"
                    onClick={() => setSelectedTab('eggs')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedTab === 'eggs'
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    <span>🥚</span>
                    <span>{t('categoryEgg', 'Egg')}</span>
                    <span className="text-[10px] opacity-80">
                      ({items.filter((i) => i.category === 'eggs' || (i.category as any) === 'egg').length})
                    </span>
                  </button>
                </div>
              </div>

              {/* Marketplace Cards List View */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* Banner to switch to Farmer's Cattle */}
                <div className="w-full">
                  <button
                    id="post-livestock-banner-btn"
                    onClick={() => setViewMode('farmersCattle')}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('postListing', "Farmer's Cattle: Post Cow, Goat, Hen, Milk or Eggs")}</span>
                  </button>
                </div>

                {/* Marketplace Listings Section Header */}
                <div className="pt-2 border-t border-neutral-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wider flex items-center gap-2">
                      <span>{t('marketplace', 'Marketplace Listings')}</span>
                      <span className="text-[11px] bg-neutral-100 text-neutral-700 font-bold px-2 py-0.5 rounded-full">
                        {filteredItems.length}
                      </span>
                    </h4>
                    <span className="text-[11px] text-neutral-500 font-medium">{t('verifiedFarmer', 'Browse verified farmer listings')}</span>
                  </div>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-neutral-300">
                    <p className="text-sm font-bold text-neutral-700">{t('noLivestockFound', 'No livestock listings found')}</p>
                    <p className="text-xs text-neutral-400 mt-1">{t('cattleDescription', 'Try selecting another tab or post what you have')}</p>
                    <button
                      onClick={() => {
                        setSelectedTab('all');
                        setSearchQuery('');
                      }}
                      className="mt-3 px-4 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-bold cursor-pointer"
                    >
                      {t('resetFilters', 'Reset Filters')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredItems.map((item, itemIdx) => {
                      const isOwner =
                        item.farmer?.includes('You') ||
                        (currentFarmer && item.farmerId === currentFarmer.uid);

                      return (
                        <motion.div
                          key={item.id ? `cattle-card-${item.id}` : `cattle-idx-${itemIdx}`}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                          className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Header: Category & Availability Badge */}
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-100">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${item.badgeBg}`}
                              >
                                <span>{item.badgeEmoji}</span>
                                <span>{item.badgeText}</span>
                              </span>

                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{item.availableQty}</span>
                                </span>
                                {isOwner && (
                                  <button
                                    onClick={(e) => handleDeleteListing(e, item.id)}
                                    className="p-1 text-neutral-400 hover:text-rose-600 rounded-md transition-colors"
                                    title="Delete this listing"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Optional Livestock Photo (when available) */}
                            {item.imageUrl && (
                              <div className="mt-2.5 mb-1 w-full h-36 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            {/* Title & Breed */}
                            <div className="mt-3">
                              <h4 className="font-black text-neutral-900 text-base leading-snug">
                                {item.title}
                              </h4>
                              <p className="text-xs text-neutral-600 font-medium mt-0.5">
                                {item.breed}
                              </p>
                            </div>

                            {/* Specs Tags */}
                            {item.specs && item.specs.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {item.specs.map((spec, sIdx) => (
                                  <span
                                    key={`spec-${item.id || itemIdx}-${sIdx}`}
                                    className="text-[10px] font-semibold bg-neutral-100 text-neutral-700 px-2 py-1 rounded-md"
                                  >
                                    {spec}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Farmer Location & Verification */}
                            <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                                <span className="truncate font-medium">{item.location}</span>
                              </div>
                              <span className="font-bold text-neutral-700 truncate">{item.farmer}</span>
                            </div>
                          </div>

                          {/* Card Footer: Price & Direct Actions */}
                          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                            <div>
                              <div className="font-black text-lg text-emerald-700 leading-none">
                                {item.price}
                              </div>
                              {item.priceNote && (
                                <span className="text-[10px] text-neutral-400 font-medium">
                                  {item.priceNote}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Call Farmer */}
                              <a
                                href={`tel:${item.phone}`}
                                className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200/80 cursor-pointer"
                                title={`Call ${item.farmer} (${item.phone})`}
                              >
                                <Phone className="w-4 h-4" />
                              </a>

                              {/* Inquire / Buy Modal */}
                              <button
                                onClick={() => setBookingItem(item)}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                              >
                                {t('inquire', 'Inquire')}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* VIEW 3: MY CATTLE (FARMER'S OWN POSTED LISTINGS MATCHING SECTION 25) */}
          {viewMode === 'myCattle' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                <div>
                  <h4 className="text-base sm:text-lg font-black text-neutral-900 uppercase tracking-wide flex items-center gap-2">
                    <span>{t('myCattle', 'MY CATTLE')}</span>
                    <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full">
                      {myListings.length}
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-500 font-medium">
                    {t('yourActiveLivestock', 'Your active livestock and produce postings')}
                  </p>
                </div>
                <button
                  onClick={() => setViewMode('farmersCattle')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('postListing', 'Post Listing')}</span>
                </button>
              </div>

              {myListings.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-neutral-300">
                  <span className="text-4xl">🐄</span>
                  <p className="text-sm font-bold text-neutral-800 mt-2">{t('noListingsYet', 'No listings posted yet')}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {t('cattleDescription', "Select Farmer's Cattle to post your Cow, Goat, Hen, Milk or Eggs")}
                  </p>
                  <button
                    onClick={() => setViewMode('farmersCattle')}
                    className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('farmersCattle', "Go to Farmer's Cattle")}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {myListings.map((item) => (
                    <div
                      key={`my-listing-${item.id}`}
                      className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                          <span className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
                            <span>{item.badgeEmoji}</span>
                            <span className="capitalize">{item.category}</span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {t('activeStatus', 'Active')}
                          </span>
                        </div>

                        {item.imageUrl && (
                          <div className="mt-2.5 w-full h-32 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="mt-2.5">
                          <h4 className="font-black text-neutral-900 text-base leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-xs text-neutral-600 font-semibold mt-0.5">
                            {item.breed}
                          </p>
                        </div>

                        <div className="mt-2 flex items-center gap-1 text-xs text-neutral-500">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
                        <div>
                          <span className="text-lg font-black text-emerald-700 leading-none">
                            {item.price}
                          </span>
                          {item.priceNote && (
                            <span className="text-[10px] text-neutral-400 block font-medium">
                              {item.priceNote}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => handleDeleteListing(e, item.id)}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Remove listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t('delete', 'Delete')}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom Trust Banner */}
          <div className="bg-amber-50/80 border-t border-amber-200/70 px-5 py-2.5 flex items-center justify-between text-xs text-amber-950 flex-shrink-0">
            <span className="font-medium">
              {t('cattleTrustBanner', '🛡️ Zero middleman fees • Direct contact with verified livestock breeders')}
            </span>
            <span className="font-bold hidden sm:inline text-amber-800">{t('uzhavanTrust', 'Uzhavan Bazzar Trust')}</span>
          </div>
        </motion.div>
      </div>

      {/* SUB-MODAL 1: INQUIRE / CONTACT FARMER MODAL */}
      <AnimatePresence>
        {bookingItem && (
          <div
            key="cattle-inquire-modal-overlay"
            id="cattle-inquire-modal-overlay"
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
            onClick={() => setBookingItem(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-neutral-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{bookingItem.badgeEmoji}</span>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-sm">{t('directSellerConnect', 'Direct Seller Connect')}</h3>
                    <p className="text-xs text-neutral-500">{t('contactSeller', 'Contact')} {bookingItem.farmer}</p>
                  </div>
                </div>
                <button
                  onClick={() => setBookingItem(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {bookSuccess ? (
                <div className="py-8 text-center flex flex-col items-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mb-2 animate-bounce" />
                  <h4 className="font-bold text-neutral-900 text-base">{t('orderSuccess', 'Inquiry Sent Successfully!')}</h4>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                    {buyerPhone}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBookSubmit} className="mt-4 space-y-3">
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs">
                    <p className="font-bold text-neutral-800">{bookingItem.title}</p>
                    <p className="text-emerald-700 font-black text-sm mt-0.5">{bookingItem.price}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">📍 {bookingItem.location}</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                      {t('fullName', 'Your Full Name')}
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                      {t('mobileNumber', 'Your Contact Mobile')}
                    </label>
                    <input
                      type="tel"
                      required
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                      {t('quantity', 'Quantity Interested')}
                    </label>
                    <input
                      type="text"
                      value={buyerQty}
                      onChange={(e) => setBuyerQty(e.target.value)}
                      placeholder="e.g. 1 Pair / 20 Litres / 100 Eggs"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <a
                      href={`tel:${bookingItem.phone}`}
                      className="flex-1 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{t('call', 'Call Now')}</span>
                    </a>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      {t('submit', 'Send Inquiry')}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUB-MODAL 2: DYNAMIC CATEGORY-SPECIFIC POSTING MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div
            key="cattle-post-modal-overlay"
            id="cattle-post-modal-overlay"
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div>
                  <h3 className="font-black text-neutral-900 text-lg uppercase tracking-wide">
                    {newCategory === 'cow'
                      ? t('postCow')
                      : newCategory === 'goat'
                      ? t('postGoat')
                      : newCategory === 'hens'
                      ? t('postHen')
                      : newCategory === 'milk'
                      ? t('postMilk')
                      : t('postEgg')}
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium">
                    {t('cattleDescription', "Farmer's Cattle Direct Listing")}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Validation Error Banner */}
              {formError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Hidden file inputs for Camera & Gallery Photo Upload */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoSelect}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />

              <form onSubmit={handleAddNewCattle} className="mt-4 space-y-4">
                {/* ----------------- 1. COW FORM ----------------- */}
                {newCategory === 'cow' && (
                  <>
                    {/* Inbuilt Cow Type / Breed Chips */}
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1.5">
                        Select Cow Type / Breed <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {INBUILT_COW_TYPES.map((type) => {
                          const isSelected = isCustomCowBreed ? type === 'Other' : cowBreed === type;
                          return (
                            <button
                              type="button"
                              key={type}
                              onClick={() => {
                                if (type === 'Other') {
                                  setIsCustomCowBreed(true);
                                  if (customCowBreed) setCowBreed(customCowBreed);
                                } else {
                                  setIsCustomCowBreed(false);
                                  setCowBreed(type);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                              }`}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                      {isCustomCowBreed && (
                        <input
                          type="text"
                          required
                          value={customCowBreed}
                          onChange={(e) => {
                            setCustomCowBreed(e.target.value);
                            setCowBreed(e.target.value);
                          }}
                          placeholder="Type custom Cow breed (e.g. Umblachery, Bargur)..."
                          className="mt-2 w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
                          autoFocus
                        />
                      )}
                    </div>

                    {/* COW PHOTO - REQUIRED (Camera or Gallery) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase">
                          {t('categoryCow', 'Cow')} {t('camera', 'Photo')} <span className="text-rose-600 font-bold">*{t('required', 'Required')}</span>
                        </label>
                        {photoDataUrl && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="text-[11px] text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> {t('delete', 'Remove')}
                          </button>
                        )}
                      </div>

                      {photoDataUrl ? (
                        <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-emerald-300 bg-neutral-100 shadow-inner group">
                          <img
                            src={photoDataUrl}
                            alt="Uploaded Cow"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => cameraInputRef.current?.click()}
                              className="px-2.5 py-1.5 rounded-lg bg-black/70 text-white text-xs font-semibold hover:bg-black/85 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>{t('camera', 'Camera')}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => galleryInputRef.current?.click()}
                              className="px-2.5 py-1.5 rounded-lg bg-black/70 text-white text-xs font-semibold hover:bg-black/85 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{t('gallery', 'Gallery')}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="py-4 px-3 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-center"
                          >
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                              <Camera className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-emerald-900">{t('takePhoto', 'Take Photo')}</span>
                            <span className="text-[10px] text-emerald-600">{t('camera', 'Camera')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            className="py-4 px-3 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-center"
                          >
                            <div className="w-9 h-9 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center shadow-xs">
                              <Upload className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-neutral-900">{t('choosePhoto', 'Choose Photo')}</span>
                            <span className="text-[10px] text-neutral-500">{t('gallery', 'Gallery')}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Cow Details */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Age <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={cowAge}
                          onChange={(e) => setCowAge(e.target.value)}
                          placeholder="e.g. 3.5 Years"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Gender
                        </label>
                        <select
                          value={cowGender}
                          onChange={(e) => setCowGender(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        >
                          <option value="Female">Female (Cow)</option>
                          <option value="Male">Male (Bull)</option>
                          <option value="Calf">Calf (கன்று)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Milk Yield
                        </label>
                        <input
                          type="text"
                          value={cowMilkYield}
                          onChange={(e) => setCowMilkYield(e.target.value)}
                          placeholder="e.g. 11 L/day"
                          className="w-full px-2 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Lactation
                        </label>
                        <input
                          type="text"
                          value={cowLactation}
                          onChange={(e) => setCowLactation(e.target.value)}
                          placeholder="e.g. 1st Lactation"
                          className="w-full px-2 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Quantity <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={cowQuantity}
                          onChange={(e) => setCowQuantity(e.target.value)}
                          placeholder="e.g. 1"
                          className="w-full px-2 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                        Vaccination Status <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={cowVaccination}
                        onChange={(e) => setCowVaccination(e.target.value)}
                        placeholder="e.g. FMD Vaccinated, Dewormed"
                        className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Price (₹) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={cowPrice}
                          onChange={(e) => setCowPrice(e.target.value)}
                          placeholder="e.g. 48,000"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Location <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={cowLocation}
                          onChange={(e) => setCowLocation(e.target.value)}
                          placeholder="Town, District"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                        Description / Lineage (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={cowDescription}
                        onChange={(e) => setCowDescription(e.target.value)}
                        placeholder="e.g. Native Tamil Nadu Kangeyam (A2 Milk Lineage) with female calf"
                        className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium resize-none"
                      />
                    </div>
                  </>
                )}

                {/* ----------------- 2. GOAT FORM ----------------- */}
                {newCategory === 'goat' && (
                  <>
                    {/* Inbuilt Goat Type / Breed Chips */}
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1.5">
                        Select Goat Type / Breed <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {INBUILT_GOAT_TYPES.map((type) => {
                          const isSelected = isCustomGoatBreed ? type === 'Other' : goatBreed === type;
                          return (
                            <button
                              type="button"
                              key={type}
                              onClick={() => {
                                if (type === 'Other') {
                                  setIsCustomGoatBreed(true);
                                  if (customGoatBreed) setGoatBreed(customGoatBreed);
                                } else {
                                  setIsCustomGoatBreed(false);
                                  setGoatBreed(type);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                              }`}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                      {isCustomGoatBreed && (
                        <input
                          type="text"
                          required
                          value={customGoatBreed}
                          onChange={(e) => {
                            setCustomGoatBreed(e.target.value);
                            setGoatBreed(e.target.value);
                          }}
                          placeholder="Type custom Goat breed..."
                          className="mt-2 w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                          autoFocus
                        />
                      )}
                    </div>

                    {/* GOAT PHOTO - REQUIRED (Camera or Gallery) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase">
                          {t('categoryGoat', 'Goat')} {t('camera', 'Photo')} <span className="text-rose-600 font-bold">*{t('required', 'Required')}</span>
                        </label>
                        {photoDataUrl && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="text-[11px] text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> {t('delete', 'Remove')}
                          </button>
                        )}
                      </div>

                      {photoDataUrl ? (
                        <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-emerald-300 bg-neutral-100 shadow-inner group">
                          <img
                            src={photoDataUrl}
                            alt="Uploaded Goat"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => cameraInputRef.current?.click()}
                              className="px-2.5 py-1.5 rounded-lg bg-black/70 text-white text-xs font-semibold hover:bg-black/85 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>{t('camera', 'Camera')}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => galleryInputRef.current?.click()}
                              className="px-2.5 py-1.5 rounded-lg bg-black/70 text-white text-xs font-semibold hover:bg-black/85 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{t('gallery', 'Gallery')}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="py-4 px-3 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-center"
                          >
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                              <Camera className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-emerald-900">{t('takePhoto', 'Take Photo')}</span>
                            <span className="text-[10px] text-emerald-600">{t('camera', 'Camera')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            className="py-4 px-3 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-center"
                          >
                            <div className="w-9 h-9 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center shadow-xs">
                              <Upload className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-neutral-900">{t('choosePhoto', 'Choose Photo')}</span>
                            <span className="text-[10px] text-neutral-500">{t('gallery', 'Gallery')}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Goat Details */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Age <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={goatAge}
                          onChange={(e) => setGoatAge(e.target.value)}
                          placeholder="e.g. 2 Years"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Gender
                        </label>
                        <select
                          value={goatGender}
                          onChange={(e) => setGoatGender(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        >
                          <option value="Female">Female (பெண் ஆடு)</option>
                          <option value="Male">Male (கிடா ஆடு)</option>
                          <option value="Pair">Pair (ஜோடி)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Weight <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={goatWeight}
                          onChange={(e) => setGoatWeight(e.target.value)}
                          placeholder="e.g. 45 kg"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Quantity <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={goatQuantity}
                          onChange={(e) => setGoatQuantity(e.target.value)}
                          placeholder="e.g. 1"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                        Vaccination Status <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={goatVaccination}
                        onChange={(e) => setGoatVaccination(e.target.value)}
                        placeholder="e.g. PPR Vaccinated, Dewormed"
                        className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Price (₹) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={goatPrice}
                          onChange={(e) => setGoatPrice(e.target.value)}
                          placeholder="e.g. 12,000"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Location <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={goatLocation}
                          onChange={(e) => setGoatLocation(e.target.value)}
                          placeholder="Town, District"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={goatDescription}
                        onChange={(e) => setGoatDescription(e.target.value)}
                        placeholder="e.g. Healthy purebred female meat goat, pasture fed."
                        className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium resize-none"
                      />
                    </div>
                  </>
                )}

                {/* ----------------- 3. HEN FORM ----------------- */}
                {newCategory === 'hens' && (
                  <>
                    {/* Inbuilt Hen Type Chips */}
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1.5">
                        Select Hen Type <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {INBUILT_HEN_TYPES.map((type) => {
                          const isSelected = isCustomHenBreed ? type === 'Other' : henBreed === type;
                          return (
                            <button
                              type="button"
                              key={type}
                              onClick={() => {
                                if (type === 'Other') {
                                  setIsCustomHenBreed(true);
                                  if (customHenBreed) setHenBreed(customHenBreed);
                                } else {
                                  setIsCustomHenBreed(false);
                                  setHenBreed(type);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-orange-600 text-white shadow-xs'
                                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                              }`}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                      {isCustomHenBreed && (
                        <input
                          type="text"
                          required
                          value={customHenBreed}
                          onChange={(e) => {
                            setCustomHenBreed(e.target.value);
                            setHenBreed(e.target.value);
                          }}
                          placeholder="Type custom Hen breed (e.g. Siruvidai, Peruvidai)..."
                          className="mt-2 w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-hidden font-medium"
                          autoFocus
                        />
                      )}
                    </div>

                    {/* HEN PHOTO - REQUIRED (Camera or Gallery) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase">
                          {t('categoryHen', 'Hen')} {t('camera', 'Photo')} <span className="text-rose-600 font-bold">*{t('required', 'Required')}</span>
                        </label>
                        {photoDataUrl && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="text-[11px] text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> {t('delete', 'Remove')}
                          </button>
                        )}
                      </div>

                      {photoDataUrl ? (
                        <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-emerald-300 bg-neutral-100 shadow-inner group">
                          <img
                            src={photoDataUrl}
                            alt="Uploaded Hen"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => cameraInputRef.current?.click()}
                              className="px-2.5 py-1.5 rounded-lg bg-black/70 text-white text-xs font-semibold hover:bg-black/85 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>{t('camera', 'Camera')}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => galleryInputRef.current?.click()}
                              className="px-2.5 py-1.5 rounded-lg bg-black/70 text-white text-xs font-semibold hover:bg-black/85 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{t('gallery', 'Gallery')}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="py-4 px-3 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-center"
                          >
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                              <Camera className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-emerald-900">{t('takePhoto', 'Take Photo')}</span>
                            <span className="text-[10px] text-emerald-600">{t('camera', 'Camera')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            className="py-4 px-3 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-center"
                          >
                            <div className="w-9 h-9 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center shadow-xs">
                              <Upload className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-neutral-900">{t('choosePhoto', 'Choose Photo')}</span>
                            <span className="text-[10px] text-neutral-500">{t('gallery', 'Gallery')}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Hen Details */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Age <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={henAge}
                          onChange={(e) => setHenAge(e.target.value)}
                          placeholder="e.g. 8 Months"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Gender
                        </label>
                        <select
                          value={henGender}
                          onChange={(e) => setHenGender(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        >
                          <option value="Mixed">Mixed Flock (ஆண் + பெண்)</option>
                          <option value="Rooster">Rooster (சேவல்)</option>
                          <option value="Hen">Hen (பெட்டை கோழி)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Quantity <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={henQuantity}
                          onChange={(e) => setHenQuantity(e.target.value)}
                          placeholder="e.g. 10 Birds"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Price (₹) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={henPrice}
                          onChange={(e) => setHenPrice(e.target.value)}
                          placeholder="e.g. 700 / Hen"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                        Location <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={henLocation}
                        onChange={(e) => setHenLocation(e.target.value)}
                        placeholder="Town, District"
                        className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={henDescription}
                        onChange={(e) => setHenDescription(e.target.value)}
                        placeholder="e.g. Pure free-range country chicken, pasture fed without antibiotics."
                        className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium resize-none"
                      />
                    </div>
                  </>
                )}

                {/* ----------------- 4. EGG FORM (NO PHOTO REQUIRED) ----------------- */}
                {newCategory === 'eggs' && (
                  <>
                    {/* Inbuilt Egg Type Chips */}
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1.5">
                        Select Egg Type <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {INBUILT_EGG_TYPES.map((type) => {
                          const isSelected = isCustomEggType ? type === 'Other' : eggType === type;
                          return (
                            <button
                              type="button"
                              key={type}
                              onClick={() => {
                                if (type === 'Other') {
                                  setIsCustomEggType(true);
                                  if (customEggType) setEggType(customEggType);
                                } else {
                                  setIsCustomEggType(false);
                                  setEggType(type);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-700 text-white shadow-xs'
                                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                              }`}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                      {isCustomEggType && (
                        <input
                          type="text"
                          required
                          value={customEggType}
                          onChange={(e) => {
                            setCustomEggType(e.target.value);
                            setEggType(e.target.value);
                          }}
                          placeholder="Type custom Egg type..."
                          className="mt-2 w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
                          autoFocus
                        />
                      )}
                    </div>

                    {/* Quantity with Inbuilt Presets */}
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1.5">
                        Number of Eggs <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {INBUILT_EGG_QTY_PRESETS.map((qty) => (
                          <button
                            type="button"
                            key={qty}
                            onClick={() => setEggQuantity(qty)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              eggQuantity === qty
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            }`}
                          >
                            {qty} Eggs
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        required
                        min="1"
                        value={eggQuantity}
                        onChange={(e) => setEggQuantity(e.target.value)}
                        placeholder="e.g. 500"
                        className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Price (₹) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={eggPrice}
                          onChange={(e) => setEggPrice(e.target.value)}
                          placeholder="e.g. 8"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Unit <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={eggUnit}
                          onChange={(e) => setEggUnit(e.target.value)}
                          className="w-full px-2 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        >
                          <option value="Egg">per Egg (ஒரு முட்டை)</option>
                          <option value="Tray (30 Eggs)">per Tray (30 Eggs)</option>
                          <option value="100 Eggs">per 100 Eggs</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                        Location <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={eggLocation}
                        onChange={(e) => setEggLocation(e.target.value)}
                        placeholder="Town, District"
                        className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={eggDescription}
                        onChange={(e) => setEggDescription(e.target.value)}
                        placeholder="e.g. 100% Organic free-range country eggs with natural orange yolk."
                        className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium resize-none"
                      />
                    </div>
                  </>
                )}

                {/* ----------------- 5. MILK FORM (NO PHOTO REQUIRED) ----------------- */}
                {newCategory === 'milk' && (
                  <>
                    {/* Inbuilt Milk Type Chips */}
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1.5">
                        Select Milk Type <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {INBUILT_MILK_TYPES.map((type) => {
                          const isSelected = isCustomMilkType ? type === 'Other' : milkType === type;
                          return (
                            <button
                              type="button"
                              key={type}
                              onClick={() => {
                                if (type === 'Other') {
                                  setIsCustomMilkType(true);
                                  if (customMilkType) setMilkType(customMilkType);
                                } else {
                                  setIsCustomMilkType(false);
                                  setMilkType(type);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-sky-700 text-white shadow-xs'
                                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                              }`}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                      {isCustomMilkType && (
                        <input
                          type="text"
                          required
                          value={customMilkType}
                          onChange={(e) => {
                            setCustomMilkType(e.target.value);
                            setMilkType(e.target.value);
                          }}
                          placeholder="Type custom Milk type..."
                          className="mt-2 w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-medium"
                          autoFocus
                        />
                      )}
                    </div>

                    {/* Quantity with Inbuilt Presets */}
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1.5">
                        Quantity in Litres <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {INBUILT_MILK_QTY_PRESETS.map((qty) => (
                          <button
                            type="button"
                            key={qty}
                            onClick={() => setMilkQuantity(qty)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              milkQuantity === qty
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            }`}
                          >
                            {qty} Litres
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        required
                        min="1"
                        value={milkQuantity}
                        onChange={(e) => setMilkQuantity(e.target.value)}
                        placeholder="e.g. 20"
                        className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Price (₹) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={milkPrice}
                          onChange={(e) => setMilkPrice(e.target.value)}
                          placeholder="e.g. 50"
                          className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                          Unit <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={milkUnit}
                          onChange={(e) => setMilkUnit(e.target.value)}
                          className="w-full px-2 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        >
                          <option value="Litre">per Litre (லிட்டர்)</option>
                          <option value="Can (20 Litres)">per 20L Can</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                        Location <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={milkLocation}
                        onChange={(e) => setMilkLocation(e.target.value)}
                        placeholder="Town, District"
                        className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                        Description (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={milkDescription}
                        onChange={(e) => setMilkDescription(e.target.value)}
                        placeholder="e.g. Pure Desi Cow A2 raw milk, 4.8% fat, fresh morning chilled delivery."
                        className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium resize-none"
                      />
                    </div>
                  </>
                )}

                {/* ----------------- PREVIEW CARD (MATCHING SECTION 22) ----------------- */}
                <div className="pt-2 border-t border-neutral-200">
                  <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
                      <span className="font-black text-neutral-800 uppercase tracking-wider text-[11px]">
                        {newCategory === 'cow'
                          ? 'COW'
                          : newCategory === 'goat'
                          ? 'GOAT'
                          : newCategory === 'hens'
                          ? 'HEN'
                          : newCategory === 'milk'
                          ? 'MILK'
                          : 'EGG'}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Listing Preview
                      </span>
                    </div>

                    {photoDataUrl && (
                      <div className="w-full h-32 rounded-xl overflow-hidden my-2.5 bg-neutral-100 border border-neutral-200">
                        <img
                          src={photoDataUrl}
                          alt="Listing Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="mt-2 space-y-1">
                      <h4 className="text-sm font-black text-neutral-900">
                        {newCategory === 'cow'
                          ? `${cowBreed} ${cowGender === 'Female' ? 'Cow' : cowGender}`
                          : newCategory === 'goat'
                          ? `${goatBreed} Goat`
                          : newCategory === 'hens'
                          ? henBreed
                          : newCategory === 'eggs'
                          ? eggType
                          : milkType}
                      </h4>

                      {newCategory === 'cow' && (
                        <>
                          <p className="font-semibold text-neutral-600">Breed: {cowBreed}</p>
                          <p className="text-neutral-500">Age: {cowAge}</p>
                          <p className="text-neutral-500">Milk: {cowMilkYield}</p>
                        </>
                      )}

                      {newCategory === 'goat' && (
                        <>
                          <p className="font-semibold text-neutral-600">Breed: {goatBreed}</p>
                          <p className="text-neutral-500">Age: {goatAge}</p>
                          <p className="text-neutral-500">Weight: {goatWeight}</p>
                        </>
                      )}

                      {newCategory === 'hens' && (
                        <>
                          <p className="font-semibold text-neutral-600">Type: {henBreed}</p>
                          <p className="text-neutral-500">Age: {henAge}</p>
                          <p className="text-neutral-500">Quantity: {henQuantity} Birds</p>
                        </>
                      )}

                      {newCategory === 'eggs' && (
                        <>
                          <p className="font-semibold text-neutral-600">Quantity: {eggQuantity} Eggs</p>
                        </>
                      )}

                      {newCategory === 'milk' && (
                        <>
                          <p className="font-semibold text-neutral-600">Quantity: {milkQuantity} Litres</p>
                        </>
                      )}

                      <p className="text-emerald-700 font-black text-sm pt-1">
                        Price:{' '}
                        {newCategory === 'cow'
                          ? (cowPrice.startsWith('₹') ? cowPrice : `₹${cowPrice}`)
                          : newCategory === 'goat'
                          ? (goatPrice.startsWith('₹') ? goatPrice : `₹${goatPrice}`)
                          : newCategory === 'hens'
                          ? `${henPrice.startsWith('₹') ? henPrice : `₹${henPrice}`} / Bird`
                          : newCategory === 'eggs'
                          ? `${eggPrice.startsWith('₹') ? eggPrice : `₹${eggPrice}`} / ${eggUnit}`
                          : `${milkPrice.startsWith('₹') ? milkPrice : `₹${milkPrice}`} / ${milkUnit}`}
                      </p>

                      <p className="text-[11px] text-neutral-500">
                        Location:{' '}
                        {newCategory === 'cow'
                          ? cowLocation
                          : newCategory === 'goat'
                          ? goatLocation
                          : newCategory === 'hens'
                          ? henLocation
                          : newCategory === 'eggs'
                          ? eggLocation
                          : milkLocation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Action Button matching Section 22 */}
                <div className="pt-2">
                  <button
                    type="submit"
                    id="post-cattle-submit-btn"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black text-sm shadow-md transition-all text-center flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t('postingProduce', 'Posting Listing...')}</span>
                      </>
                    ) : (
                      <span>{t('postCattleListing', 'POST LISTING')}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
