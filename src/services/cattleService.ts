import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';

export type CattleCategory = 'all' | 'cow' | 'hens' | 'goat' | 'eggs' | 'milk';

export interface CattleItem {
  id: string;
  farmerId?: string;
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
  locationName?: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  verified: boolean;
  availableQty: string;
  imageUrl?: string;
  imageUrls?: string[];
  age?: string;
  gender?: string;
  lactation?: string;
  milkYield?: string;
  vaccination?: string;
  weight?: string;
  quantity?: number | string;
  unit?: string;
  description?: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
}

export const INITIAL_CATTLE_DATA: CattleItem[] = [
  // 1. COW
  {
    id: 'cattle-1',
    farmerId: 'farmer-default-murugan',
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
    locationName: 'Kangeyam, Tiruppur Dist',
    phone: '+91 94432 18902',
    verified: true,
    availableQty: '1 Pair Available',
    imageUrl: 'https://www.image2url.com/r2/default/images/1790515781753-c4236b67-e877-40a6-851c-b591799d290e.png',
    imageUrls: ['https://www.image2url.com/r2/default/images/1790515781753-c4236b67-e877-40a6-851c-b591799d290e.png'],
    age: '3.5 Years',
    gender: 'Female',
    lactation: '1st Lactation',
    milkYield: '11 L/day',
    vaccination: 'FMD Vaccinated',
  },
  {
    id: 'cattle-2',
    farmerId: 'farmer-default-velusamy',
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
    locationName: 'Oddanchatram, Dindigul',
    phone: '+91 98421 77341',
    verified: true,
    availableQty: '1 Cow Available',
    imageUrl: 'https://www.image2url.com/r2/default/images/1790515781753-c4236b67-e877-40a6-851c-b591799d290e.png',
    imageUrls: ['https://www.image2url.com/r2/default/images/1790515781753-c4236b67-e877-40a6-851c-b591799d290e.png'],
    age: '4 Years',
    gender: 'Female',
    lactation: '2nd Calving',
    milkYield: '16 L/day',
    vaccination: 'Regularly Vaccinated',
  },

  // 2. HENS
  {
    id: 'cattle-3',
    farmerId: 'farmer-default-selvam',
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
    locationName: 'Paramathi Velur, Namakkal',
    phone: '+91 97860 44129',
    verified: true,
    availableQty: '25 Birds in Batch',
    imageUrl: 'https://www.image2url.com/r2/default/images/1790516050752-fa71b3d3-54d5-47b8-8f59-00c75075b135.png',
    imageUrls: ['https://www.image2url.com/r2/default/images/1790516050752-fa71b3d3-54d5-47b8-8f59-00c75075b135.png'],
    age: '8 Months',
    gender: 'Mixed Flock',
    quantity: 25,
    unit: 'bird',
  },
  {
    id: 'cattle-4',
    farmerId: 'farmer-default-shanmugam',
    category: 'hens',
    categoryLabel: 'Hens (நாட்டு கோழி)',
    badgeEmoji: '🐔',
    badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
    badgeText: 'Hens',
    title: 'Asil Native Breeding Pair (Rooster + Hen)',
    breed: 'Pure Asil Fighter Heritage Strain',
    specs: ['3.4 Kg Rooster', 'Active & Alert', 'Vaccinated (Ranikhet / Lasota)', 'Direct Breeder Sale'],
    price: '₹2,400',
    priceNote: 'for healthy breeding pair',
    farmer: 'Shanmugam K.',
    location: 'Dharapuram, Tiruppur',
    locationName: 'Dharapuram, Tiruppur',
    phone: '+91 94871 22840',
    verified: true,
    availableQty: '3 Pairs Left',
    imageUrl: 'https://www.image2url.com/r2/default/images/1790516050752-fa71b3d3-54d5-47b8-8f59-00c75075b135.png',
    imageUrls: ['https://www.image2url.com/r2/default/images/1790516050752-fa71b3d3-54d5-47b8-8f59-00c75075b135.png'],
    age: '1 Year',
    gender: 'Breeding Pair',
    quantity: 2,
    unit: 'pair',
  },

  // 3. GOAT
  {
    id: 'cattle-5',
    farmerId: 'farmer-default-arun',
    category: 'goat',
    categoryLabel: 'Goat (செம்மறி / வெள்ளாடு)',
    badgeEmoji: '🐐',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    badgeText: 'Goat',
    title: 'Kanni Desi Male Breeding Goat',
    breed: 'Native Tamil Nadu Kanni Goat',
    specs: ['Age: 14 Months', 'Weight: 38 Kg Live', 'PPR & Enterotoxaemia Vaccinated', 'Stall Fed / Grazed'],
    price: '₹14,500',
    priceNote: 'Prime Breeding Male',
    farmer: 'Arunachalam Chettiar',
    location: 'Manapparai, Tiruchirappalli',
    locationName: 'Manapparai, Tiruchirappalli',
    phone: '+91 98428 66103',
    verified: true,
    availableQty: '1 Buck Available',
    imageUrl: 'https://www.image2url.com/r2/default/images/1790516122780-ed7f8d92-e6cb-4f57-86da-4539a61d9c93.png',
    imageUrls: ['https://www.image2url.com/r2/default/images/1790516122780-ed7f8d92-e6cb-4f57-86da-4539a61d9c93.png'],
    age: '14 Months',
    gender: 'Male',
    weight: '38 kg',
    vaccination: 'PPR & Enterotoxaemia',
  },
  {
    id: 'cattle-6',
    farmerId: 'farmer-default-thirunav',
    category: 'goat',
    categoryLabel: 'Goat (செம்மறி / வெள்ளாடு)',
    badgeEmoji: '🐐',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    badgeText: 'Goat',
    title: 'Boer Cross Premium Meat Goats (Pair)',
    breed: 'Boer x Tellicherry Cross',
    specs: ['42 Kg & 45 Kg Live Wt', 'Dewormed & Tagged', 'High Meat Ratio (62%)', 'Farm Ready'],
    price: '₹26,000',
    priceNote: 'for Pair (2 Goats)',
    farmer: 'Thirunavukkarasu Farm',
    location: 'Pollachi, Coimbatore',
    locationName: 'Pollachi, Coimbatore',
    phone: '+91 99440 33812',
    verified: true,
    availableQty: '1 Pair Available',
    imageUrl: 'https://www.image2url.com/r2/default/images/1790516122780-ed7f8d92-e6cb-4f57-86da-4539a61d9c93.png',
    imageUrls: ['https://www.image2url.com/r2/default/images/1790516122780-ed7f8d92-e6cb-4f57-86da-4539a61d9c93.png'],
    age: '2 Years',
    gender: 'Pair',
    weight: '45 kg',
    vaccination: 'Dewormed & Tagged',
  },

  // 4. EGGS
  {
    id: 'cattle-7',
    farmerId: 'farmer-default-palanisamy',
    category: 'eggs',
    categoryLabel: 'Country Eggs (நாட்டுக்கோழி முட்டை)',
    badgeEmoji: '🥚',
    badgeBg: 'bg-amber-50 text-amber-950 border-amber-300',
    badgeText: 'Eggs',
    title: '100% Organic Pasture Free-Range Eggs',
    breed: 'Naturally Foraged Hen Eggs',
    specs: ['Rich Orange Yolk', 'Daily Fresh Collection', 'Cleaned & Sorted', 'Min Order: 30 Eggs (1 Tray)'],
    price: '₹9.50',
    priceNote: 'per Egg (₹285 / Tray of 30)',
    farmer: 'Palanisamy Natural Farms',
    location: 'Rasipuram, Namakkal',
    locationName: 'Rasipuram, Namakkal',
    phone: '+91 94435 99015',
    verified: true,
    availableQty: '1,200 Eggs / Day',
    imageUrl: 'https://www.image2url.com/r2/default/images/1790520825559-ef4c7311-1d70-4ebf-8ae5-897289c32582.png',
    imageUrls: ['https://www.image2url.com/r2/default/images/1790520825559-ef4c7311-1d70-4ebf-8ae5-897289c32582.png'],
    quantity: 1200,
    unit: 'egg',
    description: '100% Organic pasture free-range eggs with rich orange yolks.',
  },

  // 5. MILK
  {
    id: 'cattle-8',
    farmerId: 'farmer-default-gomatha',
    category: 'milk',
    categoryLabel: 'Fresh Milk (பசும்பால்)',
    badgeEmoji: '🥛',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    badgeText: 'Milk',
    title: 'Pure Desi Cow A2 Raw Milk (Wholesale Supply)',
    breed: 'Gir & Kangeyam Heritage Cows',
    specs: ['Fat: 4.8% • SNF: 9.1%', 'Zero Adulteration / Unprocessed', 'Morning 5:30 AM Chilled Churn', 'Min. 20 Liters'],
    price: '₹55',
    priceNote: 'per Liter (Bulk Delivery)',
    farmer: 'Gomatha Dairy Cooperative',
    location: 'Sathyamangalam, Erode',
    locationName: 'Sathyamangalam, Erode',
    phone: '+91 94420 88619',
    verified: true,
    availableQty: '80 Liters / Day',
    imageUrl: 'https://www.image2url.com/r2/default/images/1790517007171-d9e656a1-0c2a-45e3-85a7-1a3afde64b65.png',
    imageUrls: ['https://www.image2url.com/r2/default/images/1790517007171-d9e656a1-0c2a-45e3-85a7-1a3afde64b65.png'],
    quantity: 80,
    unit: 'litre',
    description: 'Pure Desi Cow A2 raw milk with 4.8% fat and zero adulteration.',
  },
];

const LOCAL_STORAGE_KEY = 'uzhavan_cached_cattle';

export const cattleService = {
  /**
   * Uploads livestock photo to Firebase Storage under:
   * cattleImages/{farmerId}/{listingId}/image1.jpg
   */
  async uploadLivestockPhoto(
    farmerId: string,
    listingId: string,
    category: string,
    photoDataUrl: string
  ): Promise<string> {
    try {
      const fileName = `image1.jpg`;
      const storageRef = ref(storage, `cattleImages/${farmerId}/${listingId}/${fileName}`);

      let blob: Blob;
      if (photoDataUrl.startsWith('data:')) {
        const res = await fetch(photoDataUrl);
        blob = await res.blob();
      } else {
        return photoDataUrl;
      }

      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg',
        customMetadata: {
          farmerId,
          listingId,
          category,
        },
      });

      return await getDownloadURL(snapshot.ref);
    } catch (err) {
      console.warn('Livestock storage upload failed, using fallback data URL:', err);
      return photoDataUrl;
    }
  },

  /**
   * Subscribe to cattle & livestock listings from Firestore cattleListings (with fallback).
   */
  subscribeCattle(
    callback: (items: CattleItem[]) => void,
    options?: { farmerId?: string; activeOnly?: boolean }
  ): () => void {
    const colRef = collection(db, 'cattleListings');
    let q = query(colRef);

    if (options?.farmerId) {
      q = query(colRef, where('farmerId', '==', options.farmerId));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty && !options?.farmerId) {
          // If cattleListings is empty, check legacy fallback or seed
          this.subscribeCattleFallback(callback);
          return;
        }

        const items: CattleItem[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();

          // Exclude soft-deleted items
          if (d.status === 'deleted') return;

          // If activeOnly requested
          if (options?.activeOnly && d.status && d.status.toLowerCase() !== 'active') {
            return;
          }

          items.push({
            id: docSnap.id,
            farmerId: d.farmerId,
            category: d.category || 'cow',
            categoryLabel: d.categoryLabel || 'Livestock',
            badgeEmoji: d.badgeEmoji || (d.category === 'goat' ? '🐐' : d.category === 'hen' || d.category === 'hens' ? '🐔' : d.category === 'milk' ? '🥛' : d.category === 'egg' || d.category === 'eggs' ? '🥚' : '🐮'),
            badgeBg: d.badgeBg || 'bg-amber-100 text-amber-900 border-amber-300',
            badgeText: d.badgeText || (d.category ? d.category.toUpperCase() : 'LIVESTOCK'),
            title: d.title || d.productName || (d.breed ? `${d.breed} ${d.category}` : 'Livestock'),
            breed: d.breed || 'Native',
            specs: d.specs || (d.vaccination ? [d.vaccination] : []),
            price: d.price ? (String(d.price).startsWith('₹') ? String(d.price) : `₹${d.price}`) : '₹0',
            priceNote: d.priceNote,
            farmer: d.farmerName || d.farmer || 'Farmer',
            location: d.locationName || d.location || 'Tamil Nadu',
            locationName: d.locationName || d.location,
            latitude: d.latitude,
            longitude: d.longitude,
            phone: d.phone || d.mobileNumber || '+91 98421 55670',
            verified: d.verified ?? true,
            availableQty: d.availableQty || `${d.quantity || 1} Available`,
            imageUrl: d.imageUrl || (d.imageUrls && d.imageUrls[0]),
            imageUrls: d.imageUrls || (d.imageUrl ? [d.imageUrl] : []),
            age: d.age ? String(d.age) : undefined,
            gender: d.gender,
            lactation: d.lactation,
            milkYield: d.milkYield ? String(d.milkYield) : undefined,
            vaccination: d.vaccination,
            weight: d.weight ? String(d.weight) : undefined,
            quantity: d.quantity,
            unit: d.unit,
            description: d.description,
            status: d.status || 'active',
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
          });
        });

        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
        } catch {
          // ignore
        }

        callback(items);
      },
      (err: any) => {
        if (err?.code !== 'permission-denied') {
          console.warn('Firestore cattleListings sync notice:', err?.message || err);
        }
        this.subscribeCattleFallback(callback);
      }
    );

    return unsubscribe;
  },

  /**
   * Fallback subscriber to legacy /livestockListings and /cattle collections.
   */
  subscribeCattleFallback(callback: (items: CattleItem[]) => void): () => void {
    const colRef = collection(db, 'livestockListings');
    const q = query(colRef);

    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          this.seedInitialCattle();
          callback(INITIAL_CATTLE_DATA);
          return;
        }

        const items: CattleItem[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.status === 'deleted') return;
          items.push({
            id: docSnap.id,
            farmerId: d.farmerId,
            category: d.category || 'cow',
            categoryLabel: d.categoryLabel || 'Cattle',
            badgeEmoji: d.badgeEmoji || '🐮',
            badgeBg: d.badgeBg || 'bg-amber-100 text-amber-900 border-amber-300',
            badgeText: d.badgeText || 'Cattle',
            title: d.title || 'Livestock',
            breed: d.breed || 'Native',
            specs: d.specs || [],
            price: d.price ? (String(d.price).startsWith('₹') ? String(d.price) : `₹${d.price}`) : '₹0',
            priceNote: d.priceNote,
            farmer: d.farmer || 'Farmer',
            location: d.location || 'Tamil Nadu',
            locationName: d.locationName || d.location,
            latitude: d.latitude,
            longitude: d.longitude,
            phone: d.phone || '+91 98421 55670',
            verified: d.verified ?? true,
            availableQty: d.availableQty || 'Available',
            imageUrl: d.imageUrl,
            imageUrls: d.imageUrls || (d.imageUrl ? [d.imageUrl] : []),
            age: d.age,
            gender: d.gender,
            lactation: d.lactation,
            milkYield: d.milkYield,
            vaccination: d.vaccination,
            weight: d.weight,
            quantity: d.quantity,
            unit: d.unit,
            description: d.description,
            status: d.status || 'active',
            createdAt: d.createdAt,
          });
        });

        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
        } catch {
          // ignore
        }

        callback(items);
      },
      () => {
        try {
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (cached) {
            callback(JSON.parse(cached));
            return;
          }
        } catch {
          // ignore
        }
        callback(INITIAL_CATTLE_DATA);
      }
    );
  },

  /**
   * Add a new livestock listing to Firestore (/cattleListings, /livestockListings, /cattle).
   * Backend enforces that Cow, Goat, and Hens REQUIRE an image.
   * Egg and Milk DO NOT require an image (Sections 7, 8, 9, 10, 11).
   */
  async addCattle(
    item: Omit<CattleItem, 'id'>,
    photoDataUrl?: string
  ): Promise<string> {
    const normalizedCategory = item.category;

    // Image Requirement Enforcement: Cow, Goat, Hen require photo; Milk, Egg do not.
    const requiresImage = ['cow', 'goat', 'hens', 'hen'].includes(normalizedCategory);
    if (requiresImage) {
      const hasImage = Boolean(item.imageUrl || (item.imageUrls && item.imageUrls.length > 0) || photoDataUrl);
      if (!hasImage) {
        throw new Error('Please add a photo before posting.');
      }
    }

    const currentUid = auth.currentUser?.uid || item.farmerId || `farmer_${Date.now()}`;
    const listingId = `live_${Date.now()}`;

    // Upload photo to Firebase Storage under cattleImages/{farmerId}/{listingId}/image1.jpg
    let finalImageUrl: string | undefined = item.imageUrl;
    let finalImageUrls: string[] = item.imageUrls || [];

    if (requiresImage && photoDataUrl) {
      finalImageUrl = await this.uploadLivestockPhoto(
        currentUid,
        listingId,
        normalizedCategory,
        photoDataUrl
      );
      finalImageUrls = [finalImageUrl];
    } else if (!requiresImage) {
      // For Egg and Milk, do not store images
      finalImageUrl = undefined;
      finalImageUrls = [];
    }

    const cleanPrice = typeof item.price === 'string'
      ? parseFloat(item.price.replace(/[^\d.]/g, '')) || item.price
      : item.price;

    const payload = {
      ...item,
      listingId,
      farmerId: currentUid,
      farmerName: item.farmer || 'Farmer',
      imageUrl: finalImageUrl || null,
      imageUrls: finalImageUrls,
      price: item.price,
      numericPrice: typeof cleanPrice === 'number' ? cleanPrice : null,
      verified: true,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      // 1. Primary storage in cattleListings/{listingId} (Section 7)
      const primaryCol = collection(db, 'cattleListings');
      const primaryDoc = doc(primaryCol, listingId);
      await setDoc(primaryDoc, payload);

      // 2. Also sync to livestockListings and cattle for compatibility
      await setDoc(doc(db, 'livestockListings', listingId), payload).catch(() => {});
      await setDoc(doc(db, 'cattle', listingId), payload).catch(() => {});

      return listingId;
    } catch (err) {
      console.warn('Failed to add cattle to Firestore, fallback generated:', err);
      return listingId;
    }
  },

  /**
   * Delete a livestock listing (Section 26: Prefer status: "deleted").
   */
  async deleteListing(listingId: string): Promise<void> {
    try {
      const updateData = {
        status: 'deleted',
        updatedAt: serverTimestamp(),
      };
      await updateDoc(doc(db, 'cattleListings', listingId), updateData).catch(() =>
        deleteDoc(doc(db, 'cattleListings', listingId))
      );
      await updateDoc(doc(db, 'livestockListings', listingId), updateData).catch(() =>
        deleteDoc(doc(db, 'livestockListings', listingId))
      );
      await updateDoc(doc(db, 'cattle', listingId), updateData).catch(() =>
        deleteDoc(doc(db, 'cattle', listingId))
      );
    } catch (err) {
      console.warn('Failed to delete livestock listing:', err);
    }
  },

  /**
   * Update livestock listing fields (Section 27).
   */
  async updateListing(listingId: string, updates: Partial<CattleItem>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(doc(db, 'cattleListings', listingId), updateData).catch(() => {});
      await updateDoc(doc(db, 'livestockListings', listingId), updateData).catch(() => {});
      await updateDoc(doc(db, 'cattle', listingId), updateData).catch(() => {});
    } catch (err) {
      console.warn('Failed to update livestock listing in Firestore:', err);
    }
  },

  /**
   * Seeds initial livestock data if collection is empty.
   */
  async seedInitialCattle(): Promise<void> {
    try {
      const colRef = collection(db, 'cattleListings');
      for (const item of INITIAL_CATTLE_DATA) {
        const docRef = doc(colRef, item.id);
        await setDoc(
          docRef,
          {
            ...item,
            listingId: item.id,
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn('Auto-seed cattle notice:', err);
    }
  },
};
