/**
 * Location Service: GPS Detection and Reverse Geocoding
 * One-time capture during farmer registration. No continuous background tracking.
 */

export interface LocationResult {
  locationName: string;
  latitude: number;
  longitude: number;
}

export async function reverseGeocodeCoordinates(lat: number, lon: number): Promise<string> {
  // 1. Primary: OpenStreetMap Nominatim API
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en' },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const locality =
        addr.suburb ||
        addr.neighbourhood ||
        addr.village ||
        addr.town ||
        addr.city ||
        addr.county ||
        '';
      const district = addr.state_district || addr.county || addr.city || '';
      const state = addr.state || 'Tamil Nadu';

      const parts = [locality, district, state].filter(
        (part, idx, arr) => part && arr.indexOf(part) === idx
      );
      if (parts.length > 0) {
        return parts.join(', ');
      }
      if (data.display_name) {
        return data.display_name.split(',').slice(0, 3).join(', ').trim();
      }
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode note:', err);
  }

  // 2. Secondary fallback: BigDataCloud client API
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (res.ok) {
      const data = await res.json();
      const locality = data.locality || data.city || '';
      const state = data.principalSubdivision || 'Tamil Nadu';
      const parts = [locality, state].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
  } catch (err) {
    console.warn('BigDataCloud reverse geocode note:', err);
  }

  // 3. Fallback: Formatted Coordinate String
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

export function detectCurrentLocation(): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        try {
          const locationName = await reverseGeocodeCoordinates(latitude, longitude);
          resolve({
            locationName,
            latitude,
            longitude,
          });
        } catch {
          resolve({
            locationName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude,
            longitude,
          });
        }
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}
