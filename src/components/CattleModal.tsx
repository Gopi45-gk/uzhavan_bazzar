import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Search,
  Phone,
  MapPin,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Tag,
  Sparkles,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import { ASSET_IMAGES } from '../constants/assets';

export type CattleCategory = 'all' | 'cow' | 'hens' | 'goat' | 'eggs' | 'milk';

export interface CattleItem {
  id: string;
  category: 'cow' | 'hens' | 'goat' | 'eggs' | 'milk';
  categoryLabel: string;
  badgeEmoji: string;
  badgeBg: string;
  badgeText: string;
  title: string;
  breed: string;
  specs: string[];
  price: string;
  priceNote?: string;
  farmer: string;
  location: string;
  phone: string;
  verified: boolean;
  availableQty: string;
  imageUrl?: string;
}

const INITIAL_CATTLE_DATA: CattleItem[] = [
  // 1. COW
  {
    id: 'cattle-1',
    category: 'cow',
    categoryLabel: 'Cow (பசு மாடு)',
    badgeEmoji: '🐮',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    badgeText: 'Cow',
    title: 'Kangeyam Pure Desi Cow with Calf',
    breed: 'Native Tamil Nadu Kangeyam (A2 Milk Lineage)',
    specs: ['1st Lactation', '11 L / Day Milk', 'Age: 3.5 Years', 'FMD Vaccinated'],
    price: '₹48,000',
    priceNote: 'Cow + Female Calf',
    farmer: 'Murugavel Kounder',
    location: 'Kangeyam, Tiruppur Dist',
    phone: '+91 94432 18902',
    verified: true,
    availableQty: '1 Pair Available',
  },
  {
    id: 'cattle-2',
    category: 'cow',
    categoryLabel: 'Cow (பசு மாடு)',
    badgeEmoji: '🐮',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    badgeText: 'Cow',
    title: 'Jersey Cross High-Yield Dairy Cow',
    breed: 'Crossbred Dairy Cow',
    specs: ['2nd Calving', '16 L / Day Yield', 'Pregnant (3 Mos)', 'Docile Temperament'],
    price: '₹52,500',
    priceNote: 'Direct Farm Sale',
    farmer: 'Velusamy P.',
    location: 'Oddanchatram, Dindigul',
    phone: '+91 98421 77341',
    verified: true,
    availableQty: '1 Cow Available',
  },

  // 2. HENS
  {
    id: 'cattle-3',
    category: 'hens',
    categoryLabel: 'Hens (நாட்டு கோழி)',
    badgeEmoji: '🐔',
    badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
    badgeText: 'Hens',
    title: 'Pure Free-Range Country Hens (Nattu Kozhi)',
    breed: 'Siruvidai & Asil Native Bloodline',
    specs: ['Flock of 25 Birds', '1.8 - 2.2 Kg each', '100% Organic Pasture Fed', 'Zero Antibiotics'],
    price: '₹380',
    priceNote: 'per bird (₹9,500 lot)',
    farmer: 'Selvam Organic Poultry',
    location: 'Paramathi Velur, Namakkal',
    phone: '+91 97860 44129',
    verified: true,
    availableQty: '25 Birds in Batch',
  },
  {
    id: 'cattle-4',
    category: 'hens',
    categoryLabel: 'Hens (நாட்டு கோழி)',
    badgeEmoji: '🐔',
    badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
    badgeText: 'Hens',
    title: 'Original Kadaknath Black Hens',
    breed: 'Pure Indigenous Kadaknath',
    specs: ['Adult Layer Birds', 'High Protein & Iron', 'Free-range Grazing', 'Dewormed'],
    price: '₹620',
    priceNote: 'per bird',
    farmer: 'Muthuvel Farms',
    location: 'Omalur, Salem Dist',
    phone: '+91 99420 51833',
    verified: true,
    availableQty: '14 Birds Available',
  },

  // 3. GOAT
  {
    id: 'cattle-5',
    category: 'goat',
    categoryLabel: 'Goat (செம்மறி / வெள்ளாடு)',
    badgeEmoji: '🐐',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    badgeText: 'Goat',
    title: 'Tellicherry & Kanni Breeding Goats',
    breed: 'Pure Tellicherry Strain (Twin Birthing Lineage)',
    specs: ['1 Breeding Buck + 3 Does', 'Avg Weight 28 - 34 Kg', 'PPR & FMD Protected', 'Open Grazing Fed'],
    price: '₹8,800',
    priceNote: 'per goat (₹35,000 set)',
    farmer: 'Karuppan M.',
    location: 'Usilampatti, Madurai',
    phone: '+91 96290 32185',
    verified: true,
    availableQty: '4 Goats in Lot',
  },
  {
    id: 'cattle-6',
    category: 'goat',
    categoryLabel: 'Goat (செம்மறி / வெள்ளாடு)',
    badgeEmoji: '🐐',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    badgeText: 'Goat',
    title: 'Salem Black Meat Goats',
    breed: 'Native Salem Black Goat',
    specs: ['5 Male Goats', '22 - 25 Kg each', 'Healthy & Active', 'Farm Direct'],
    price: '₹7,600',
    priceNote: 'per goat',
    farmer: 'Arumugam R.',
    location: 'Pennagaram, Dharmapuri',
    phone: '+91 98432 99014',
    verified: true,
    availableQty: '5 Male Goats',
  },

  // 4. EGGS
  {
    id: 'cattle-7',
    category: 'eggs',
    categoryLabel: 'Eggs (நாட்டுக்கோழி முட்டை)',
    badgeEmoji: '🥚',
    badgeBg: 'bg-amber-50 text-amber-950 border-amber-300',
    badgeText: 'Eggs',
    title: '100% Organic Country Hen Brown Eggs',
    breed: 'Fresh Lay from Pasture Hens (Nattu Kozhi Muttai)',
    specs: ['Tray of 30 Eggs', 'Rich Dark Orange Yolk', 'Harvested Today Morning', 'Zero Chemicals'],
    price: '₹360',
    priceNote: 'per 30-egg tray (₹12 / egg)',
    farmer: 'Dhanalakshmi Organic Hatchery',
    location: 'Perundurai, Erode',
    phone: '+91 97891 22340',
    verified: true,
    availableQty: '80 Trays Ready',
  },
  {
    id: 'cattle-8',
    category: 'eggs',
    categoryLabel: 'Eggs (நாட்டுக்கோழி முட்டை)',
    badgeEmoji: '🥚',
    badgeBg: 'bg-amber-50 text-amber-950 border-amber-300',
    badgeText: 'Eggs',
    title: 'Fertile Asil Cross Hatching Eggs',
    breed: 'Pure Country Fighter Lineage',
    specs: ['Pack of 50 Eggs', '88% Proven Fertility', 'Carefully Packed', 'Same-Day Dispatch'],
    price: '₹750',
    priceNote: 'pack of 50 (₹15 / egg)',
    farmer: 'Palanisamy Hatchery',
    location: 'Aravakurichi, Karur',
    phone: '+91 94421 88102',
    verified: true,
    availableQty: '12 Packs Available',
  },

  // 5. MILK
  {
    id: 'cattle-9',
    category: 'milk',
    categoryLabel: 'Milk (பசும்பால் / எருமைப்பால்)',
    badgeEmoji: '🥛',
    badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
    badgeText: 'Milk',
    title: 'Pure Fresh A2 Kangeyam Desi Cow Milk',
    breed: 'Raw Unprocessed Farm Milk',
    specs: ['Daily Morning Harvest', 'Fat: 4.8% • SNF: 8.9%', 'Cooled at 4°C', 'Bulk & Can Delivery'],
    price: '₹65',
    priceNote: 'per Liter (Minimum 10L order)',
    farmer: 'Sivakumar Desi Dairy',
    location: 'Alanganallur, Madurai',
    phone: '+91 98940 11234',
    verified: true,
    availableQty: '120 Liters Daily Supply',
  },
  {
    id: 'cattle-10',
    category: 'milk',
    categoryLabel: 'Milk (பசும்பால் / எருமைப்பால்)',
    badgeEmoji: '🥛',
    badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
    badgeText: 'Milk',
    title: 'Fresh Thick Murrah Buffalo Milk',
    breed: 'Pure Cream Buffalo Milk',
    specs: ['Fat: 7.4% • SNF: 9.2%', 'Ideal for Paneer & Ghee', 'Clean Hand-Milked', 'Available Daily'],
    price: '₹76',
    priceNote: 'per Liter',
    farmer: 'Manikandan G.',
    location: 'Cumbum Valley, Theni',
    phone: '+91 96550 44819',
    verified: true,
    availableQty: '70 Liters Available',
  },
];

interface CattleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CattleModal: React.FC<CattleModalProps> = ({ isOpen, onClose }) => {
  const [selectedTab, setSelectedTab] = useState<CattleCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<CattleItem[]>(INITIAL_CATTLE_DATA);

  // Inquire / Book Modal State
  const [bookingItem, setBookingItem] = useState<CattleItem | null>(null);
  const [bookSuccess, setBookSuccess] = useState(false);
  const [buyerName, setBuyerName] = useState('Murugan S.');
  const [buyerPhone, setBuyerPhone] = useState('+91 98765 43210');
  const [buyerQty, setBuyerQty] = useState('1');

  // Post Listing Form Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState<'cow' | 'hens' | 'goat' | 'eggs' | 'milk'>('cow');
  const [newTitle, setNewTitle] = useState('');
  const [newBreed, setNewBreed] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newLocation, setNewLocation] = useState('Madurai, Tamil Nadu');
  const [newPhone, setNewPhone] = useState('+91 98765 43210');
  const [newSpecs, setNewSpecs] = useState('Healthy • Vaccinated • Farm Direct');

  // Filter items based on selected tab and search
  const filteredItems = items.filter((item) => {
    const matchesTab = selectedTab === 'all' || item.category === selectedTab;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesTab;
    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      item.breed.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.farmer.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookSuccess(true);
    setTimeout(() => {
      setBookSuccess(false);
      setBookingItem(null);
    }, 1800);
  };

  const handleAddNewCattle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice) return;

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

    const newItem: CattleItem = {
      id: `cattle-${Date.now()}`,
      category: newCategory,
      categoryLabel: meta.label,
      badgeEmoji: meta.emoji,
      badgeBg: meta.bg,
      badgeText: meta.text,
      title: newTitle,
      breed: newBreed || 'Native Local Breed',
      specs: newSpecs.split('•').map((s) => s.trim()).filter(Boolean),
      price: newPrice.startsWith('₹') ? newPrice : `₹${newPrice}`,
      priceNote: 'Direct Farm Listing',
      farmer: 'You (Murugan S.)',
      location: newLocation,
      phone: newPhone,
      verified: true,
      availableQty: 'Available Now',
    };

    setItems([newItem, ...items]);
    setShowAddModal(false);
    setSelectedTab(newCategory);
    setNewTitle('');
    setNewBreed('');
    setNewPrice('');
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
                    Cattle & Livestock
                  </h3>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Live Mandi
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Direct trading of Cow, Hens, Goat, Eggs & Milk
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="add-cattle-btn"
                onClick={() => setShowAddModal(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Post Cattle</span>
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
                placeholder="Search Cow, Hens, Goat, Eggs, Milk or district..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs sm:text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* 5 Individual Category Pills requested by User */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                onClick={() => setSelectedTab('all')}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedTab === 'all'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                All ({items.length})
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
                <span>Cow</span>
                <span className="text-[10px] opacity-80">
                  ({items.filter((i) => i.category === 'cow').length})
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
                <span>Hens</span>
                <span className="text-[10px] opacity-80">
                  ({items.filter((i) => i.category === 'hens').length})
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
                <span>Goat</span>
                <span className="text-[10px] opacity-80">
                  ({items.filter((i) => i.category === 'goat').length})
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
                <span>Eggs</span>
                <span className="text-[10px] opacity-80">
                  ({items.filter((i) => i.category === 'eggs').length})
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
                <span>Milk</span>
                <span className="text-[10px] opacity-80">
                  ({items.filter((i) => i.category === 'milk').length})
                </span>
              </button>
            </div>
          </div>

          {/* Cards List View - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Quick Mobile "+ Post Cattle" Button */}
            <div className="sm:hidden">
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Post Cow, Hens, Goat, Eggs or Milk Listing</span>
              </button>
            </div>

            {filteredItems.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-neutral-300">
                <p className="text-sm font-bold text-neutral-700">No livestock listings found</p>
                <p className="text-xs text-neutral-400 mt-1">Try selecting another tab or clear your search</p>
                <button
                  onClick={() => {
                    setSelectedTab('all');
                    setSearchQuery('');
                  }}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-bold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
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

                        <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{item.availableQty}</span>
                        </span>
                      </div>

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
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {item.specs.map((spec, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[10px] font-semibold bg-neutral-100 text-neutral-700 px-2 py-1 rounded-md"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>

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
                          Inquire
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Trust Banner */}
          <div className="bg-amber-50/80 border-t border-amber-200/70 px-5 py-2.5 flex items-center justify-between text-xs text-amber-950 flex-shrink-0">
            <span className="font-medium">
              🛡️ Zero middleman fees • Direct contact with verified livestock breeders
            </span>
            <span className="font-bold hidden sm:inline text-amber-800">Uzhavan Bazzar Trust</span>
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
                    <h3 className="font-bold text-neutral-900 text-sm">Direct Inquiry</h3>
                    <p className="text-[11px] text-neutral-500">{bookingItem.farmer}</p>
                  </div>
                </div>
                <button
                  onClick={() => setBookingItem(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {bookSuccess ? (
                <div className="py-8 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-neutral-900 text-base">Inquiry Sent Successfully!</h4>
                  <p className="text-xs text-neutral-600 mt-1 max-w-[240px]">
                    {bookingItem.farmer} has received your inquiry for <strong>{bookingItem.title}</strong> and will call you back shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBookSubmit} className="mt-4 space-y-3.5">
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="text-xs font-bold text-neutral-800">{bookingItem.title}</div>
                    <div className="flex items-center justify-between text-xs text-emerald-700 font-bold mt-1">
                      <span>{bookingItem.price}</span>
                      <span className="text-neutral-500 font-normal">{bookingItem.location}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                      Your Full Name
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
                      Your Mobile Number
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
                      Required Quantity
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerQty}
                      onChange={(e) => setBuyerQty(e.target.value)}
                      placeholder="e.g. 1 cow, 10 hens, 2 crates, 20 liters"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href={`tel:${bookingItem.phone}`}
                      className="flex-1 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold text-xs text-center flex items-center justify-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Direct Call</span>
                    </a>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs text-center cursor-pointer"
                    >
                      Send Inquiry
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUB-MODAL 2: POST NEW CATTLE AD MODAL */}
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
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-neutral-200 max-h-[88vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div>
                  <h3 className="font-bold text-neutral-900 text-base">Post Cattle & Livestock</h3>
                  <p className="text-xs text-neutral-500">List your Cow, Hens, Goat, Eggs or Milk</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddNewCattle} className="mt-4 space-y-3.5">
                {/* Select Category */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                    Select Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cow', 'hens', 'goat', 'eggs', 'milk'] as const).map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setNewCategory(cat)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold capitalize flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          newCategory === cat
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        <span>
                          {cat === 'cow'
                            ? '🐮'
                            : cat === 'hens'
                            ? '🐔'
                            : cat === 'goat'
                            ? '🐐'
                            : cat === 'eggs'
                            ? '🥚'
                            : '🥛'}
                        </span>
                        <span>{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                    Listing Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Kangeyam Cow / Country Hens / A2 Milk"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Breed / Variety */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                    Breed / Quality Details
                  </label>
                  <input
                    type="text"
                    required
                    value={newBreed}
                    onChange={(e) => setNewBreed(e.target.value)}
                    placeholder="e.g. Pure Native Breed / 1st Lactation / 100% Organic"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                      Price (₹)
                    </label>
                    <input
                      type="text"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="e.g. ₹45,000 / ₹380"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                      Farm Location
                    </label>
                    <input
                      type="text"
                      required
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="District / Town"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Key Specs */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                    Key Highlights (separated by •)
                  </label>
                  <input
                    type="text"
                    value={newSpecs}
                    onChange={(e) => setNewSpecs(e.target.value)}
                    placeholder="e.g. Vaccinated • 12L Milk Yield • Dewormed"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                    Contact Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all text-center cursor-pointer"
                  >
                    Publish Livestock Listing
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
