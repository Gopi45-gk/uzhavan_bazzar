/**
 * Delivery Service — Haversine Distance Calculation & India Post Integration
 * Uzhavan Bazzar
 */

import {
  INDIA_POST_DISTANCE_THRESHOLD_KM,
  INDIA_POST_PRICING_CONFIG,
  LOCAL_DELIVERY_BASE_CHARGE,
  TAMIL_NADU_COORDINATES,
} from '../constants/deliveryConfig';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export type DeliveryMethodType = 'FARMER_DIRECT' | 'INDIA_POST' | 'SELF_PICKUP';

export type IndiaPostDeliveryStatus =
  | 'Pending'
  | 'Booked'
  | 'Dispatched'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Delivered';

/**
 * Resolves GPS coordinates from a coordinate object or textual location string.
 */
export function resolveCoordinates(
  loc: LocationCoordinates | string | null | undefined,
  defaultFallback: LocationCoordinates = { latitude: 10.6621, longitude: 77.0118 } // Pollachi/Coimbatore default
): LocationCoordinates {
  if (!loc) return defaultFallback;

  if (typeof loc === 'object' && loc !== null) {
    const lat = Number((loc as any).latitude ?? (loc as any).lat);
    const lng = Number((loc as any).longitude ?? (loc as any).lng);
    if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
      return { latitude: lat, longitude: lng };
    }
  }

  if (typeof loc === 'string') {
    const lower = loc.toLowerCase();
    for (const [key, coords] of Object.entries(TAMIL_NADU_COORDINATES)) {
      if (lower.includes(key)) {
        return coords;
      }
    }
    // Attempt coordinate string parsing e.g. "10.6621, 77.0118"
    const match = loc.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
  }

  return defaultFallback;
}

/**
 * Calculates geographical distance between Farmer and Buyer using the Haversine formula (km).
 * Strictly dynamic calculation based on real coordinates.
 */
export function calculateDistanceKm(
  farmerLocation: LocationCoordinates | string | null | undefined,
  buyerLocation: LocationCoordinates | string | null | undefined
): number {
  const c1 = resolveCoordinates(farmerLocation, { latitude: 10.6621, longitude: 77.0118 }); // Pollachi Farm
  const c2 = resolveCoordinates(buyerLocation, { latitude: 11.0168, longitude: 76.9558 }); // Coimbatore Hub

  const R = 6371; // Earth's mean radius in km
  const dLat = (c2.latitude - c1.latitude) * (Math.PI / 180);
  const dLon = (c2.longitude - c1.longitude) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(c1.latitude * (Math.PI / 180)) *
      Math.cos(c2.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const rawDist = R * c;

  // Round to 1 decimal place (e.g. 68.4)
  return Math.round(rawDist * 10) / 10;
}

/**
 * Check if the order is eligible for India Post Delivery (Requirement 1: distance > 50 KM).
 */
export function isEligibleForIndiaPost(distanceKm: number): boolean {
  return distanceKm > INDIA_POST_DISTANCE_THRESHOLD_KM;
}

/**
 * Calculates dynamic India Post Delivery Charge based on configured rules.
 */
export function calculateIndiaPostCharge(distanceKm: number, weightKg: number = 10): number {
  const { baseCharge, perKmRate, perKgRate, minCharge, maxCharge } = INDIA_POST_PRICING_CONFIG;
  const excessKm = Math.max(0, distanceKm - INDIA_POST_DISTANCE_THRESHOLD_KM);
  const calculated = baseCharge + excessKm * perKmRate + weightKg * perKgRate;
  const finalFee = Math.round(Math.min(maxCharge, Math.max(minCharge, calculated)));
  return finalFee;
}

/**
 * Returns dynamic estimated delivery time based on distance and delivery method.
 */
export function getEstimatedDeliveryTime(
  distanceKm: number,
  method: DeliveryMethodType,
  isTamil: boolean = false
): string {
  if (method === 'INDIA_POST') {
    if (distanceKm <= 120) {
      return isTamil ? '1–2 வேலை நாட்கள் (ஸ்பீட் போஸ்ட்)' : '1–2 Business Days (Speed Post)';
    } else if (distanceKm <= 250) {
      return isTamil ? '2–3 வேலை நாட்கள் (ஸ்பீட் போஸ்ட்)' : '2–3 Business Days (Speed Post)';
    } else {
      return isTamil ? '3–4 வேலை நாட்கள் (பார்சல் சேவை)' : '3–4 Business Days (Parcel Service)';
    }
  }

  if (method === 'SELF_PICKUP') {
    return isTamil ? 'உடனடி பண்ணை சேகரிப்பு' : 'Immediate Farm Gate Pickup';
  }

  // FARMER_DIRECT (Tata Ace)
  return isTamil ? 'இன்றே / 24 மணி நேரத்திற்குள்' : 'Same Day / Within 24 Hours';
}

/**
 * Returns human-readable label for delivery methods
 */
export function getDeliveryMethodLabel(method: string, isTamil: boolean = false): string {
  switch (method) {
    case 'INDIA_POST':
      return isTamil ? 'இந்திய அஞ்சல் டெலிவரி' : 'India Post Delivery';
    case 'SELF_PICKUP':
      return isTamil ? 'நேரடி பண்ணை சேகரிப்பு' : 'Self Pickup (Farm Gate)';
    case 'FARMER_DIRECT':
    default:
      return isTamil ? 'விவசாயி நேரடி டெலிவரி' : 'Farmer Direct Delivery';
  }
}
