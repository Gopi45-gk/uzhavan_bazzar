/**
 * Delivery & Logistics Configuration
 * Uzhavan Bazzar
 *
 * Centralized, configurable settings for India Post and local farmer logistics.
 */

// Configurable threshold for India Post Delivery availability (Requirement 3)
export const INDIA_POST_DISTANCE_THRESHOLD_KM = 50;

// Standard local logistics flat rate (<= 50 KM) via Tata Ace
export const LOCAL_DELIVERY_BASE_CHARGE = 120;

// India Post Delivery Pricing Configuration (dynamic rate calculation)
export interface IndiaPostPricingRule {
  baseCharge: number; // Base booking and postal handling charge (₹)
  perKmRate: number; // Rate per KM above 50 KM threshold (₹/km)
  perKgRate: number; // Weight charge per kg (₹/kg)
  minCharge: number; // Minimum charge
  maxCharge: number; // Cap for fair farmer marketplace pricing
}

export const INDIA_POST_PRICING_CONFIG: IndiaPostPricingRule = {
  baseCharge: 50,
  perKmRate: 0.90, // e.g. 70 km (20 km over threshold) -> +₹18
  perKgRate: 1.20, // e.g. 50 kg -> +₹60
  minCharge: 80,
  maxCharge: 420,
};

// Known Tamil Nadu agricultural locations with exact GPS coordinates
export const TAMIL_NADU_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  pollachi: { latitude: 10.6609, longitude: 77.0047 },
  coimbatore: { latitude: 11.0168, longitude: 76.9558 },
  tiruppur: { latitude: 11.1085, longitude: 77.3411 },
  erode: { latitude: 11.3410, longitude: 77.7172 },
  salem: { latitude: 11.6643, longitude: 78.1460 },
  dindigul: { latitude: 10.3673, longitude: 77.9803 },
  oddanchatram: { latitude: 10.4908, longitude: 77.7478 },
  madurai: { latitude: 9.9252, longitude: 78.1198 },
  trichy: { latitude: 10.7905, longitude: 78.7047 },
  tiruchirappalli: { latitude: 10.7905, longitude: 78.7047 },
  thanjavur: { latitude: 10.7870, longitude: 79.1378 },
  theni: { latitude: 10.0104, longitude: 77.4768 },
  dharmapuri: { latitude: 12.1211, longitude: 78.1582 },
  krishnagiri: { latitude: 12.5186, longitude: 78.2137 },
  chennai: { latitude: 13.0827, longitude: 80.2707 },
  vellore: { latitude: 12.9165, longitude: 79.1325 },
  tirunelveli: { latitude: 8.7139, longitude: 77.7567 },
  kanyakumari: { latitude: 8.0883, longitude: 77.5385 },
  nagapattinam: { latitude: 10.7656, longitude: 79.8424 },
  namakkal: { latitude: 11.2189, longitude: 78.1674 },
  karur: { latitude: 10.9601, longitude: 78.0766 },
  cuddalore: { latitude: 11.7480, longitude: 79.7714 },
  villupuram: { latitude: 11.9401, longitude: 79.4861 },
  kanchipuram: { latitude: 12.8342, longitude: 79.7036 },
  bengaluru: { latitude: 12.9716, longitude: 77.5946 },
  bangalore: { latitude: 12.9716, longitude: 77.5946 },
};
