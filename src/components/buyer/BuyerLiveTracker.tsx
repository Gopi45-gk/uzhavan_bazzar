import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Phone, ShieldCheck, CheckCircle2, Clock, Navigation, RefreshCw, Layers } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BuyerFeedProduct, DriverData } from '../../types/buyer';
import { BUYER_DRIVER_DATA } from '../../constants/buyerMockData';
import { useLanguage } from '../../context/LanguageContext';

interface BuyerLiveTrackerProps {
  product: BuyerFeedProduct;
  onBack: () => void;
  driver?: DriverData;
}

export const BuyerLiveTracker: React.FC<BuyerLiveTrackerProps> = ({
  product,
  onBack,
  driver = BUYER_DRIVER_DATA,
}) => {
  const { t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);
  const completedPolylineRef = useRef<L.Polyline | null>(null);

  const [progress, setProgress] = useState(42);
  const [etaMinutes, setEtaMinutes] = useState(15);
  const [currentSpeed, setCurrentSpeed] = useState(44);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'terrain'>('streets');
  const [callAlert, setCallAlert] = useState<string | null>(null);

  // Realistic highway coordinates from Farm (Pollachi/Coimbatore) to Buyer Hub (Chennai/Local)
  // Pollachi (10.6609, 77.0047) -> Tiruppur (11.1085, 77.3411) -> Erode (11.3410, 77.7172) -> Salem (11.6643, 78.1460) -> Chennai Delivery Hub (13.0827, 80.2707)
  // Or Local Hub route: Pollachi -> Kinathukadavu -> Eachanari -> Sundarapuram -> Coimbatore Hub
  const farmCoords: [number, number] = [
    product.coords?.lat || 10.6621,
    product.coords?.lng || 77.0118,
  ];
  const buyerHubCoords: [number, number] = [11.0168, 76.9558]; // Delivery hub

  // 10 route waypoints connecting Farm to Buyer Hub
  const routeWaypoints: [number, number][] = [
    farmCoords,
    [farmCoords[0] + 0.06, farmCoords[1] - 0.01],
    [farmCoords[0] + 0.12, farmCoords[1] - 0.02],
    [farmCoords[0] + 0.19, farmCoords[1] - 0.03],
    [farmCoords[0] + 0.24, farmCoords[1] - 0.04],
    [farmCoords[0] + 0.28, farmCoords[1] - 0.05],
    [buyerHubCoords[0] - 0.05, buyerHubCoords[1] - 0.02],
    [buyerHubCoords[0] - 0.02, buyerHubCoords[1] - 0.01],
    buyerHubCoords,
  ];

  // Interpolate current truck position based on progress % (0 to 100)
  const getInterpolatedPoint = (pct: number): [number, number] => {
    const totalSegments = routeWaypoints.length - 1;
    const segmentIndex = Math.min(
      totalSegments - 1,
      Math.floor((pct / 100) * totalSegments)
    );
    const segmentProgress = (pct / 100) * totalSegments - segmentIndex;

    const p1 = routeWaypoints[segmentIndex];
    const p2 = routeWaypoints[segmentIndex + 1];

    const lat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
    const lng = p1[1] + (p2[1] - p1[1]) * segmentProgress;
    return [lat, lng];
  };

  // Setup Leaflet map on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Leaflet Map instance
    const map = L.map(mapContainerRef.current, {
      center: farmCoords,
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // Add Zoom Control at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // CartoDB Voyager / OpenStreetMap clean tile layer
    const tileUrl =
      mapStyle === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const baseTiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
    }).addTo(map);

    // Custom Farm Icon
    const farmIcon = L.divIcon({
      className: 'farm-marker-icon',
      html: `
        <div style="background:#047857; color:white; border-radius:50%; width:38px; height:38px; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 16px rgba(4,120,87,0.4); border:3px solid #ffffff; font-size:18px;">
          🌾
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    // Custom Buyer Hub Icon
    const buyerHubIcon = L.divIcon({
      className: 'buyer-hub-icon',
      html: `
        <div style="background:#d97706; color:white; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 16px rgba(217,119,6,0.5); border:3px solid #ffffff; font-size:18px;">
          📍
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    // Farm Origin Marker
    const farmMarker = L.marker(farmCoords, { icon: farmIcon }).addTo(map);
    farmMarker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <strong style="color:#047857;">🌱 ${t('farmFieldHarvest', 'Farm Field Harvest')}</strong><br/>
        <span style="font-size:12px; color:#4b5563;">${product.farmerName}</span><br/>
        <span style="font-size:11px; color:#6b7280;">${product.location}</span>
      </div>
    `);

    // Buyer Hub Destination Marker
    const buyerMarker = L.marker(buyerHubCoords, { icon: buyerHubIcon }).addTo(map);
    buyerMarker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <strong style="color:#d97706;">🏠 ${t('deliveryHub', 'Delivery Hub')}</strong><br/>
        <span style="font-size:12px; color:#4b5563;">${t('doorstepDropoff', 'Doorstep Drop-off')}</span>
      </div>
    `);

    // Full Route Polyline (Dashed Highway Style)
    L.polyline(routeWaypoints, {
      color: '#064e3b',
      weight: 8,
      opacity: 0.3,
      lineCap: 'round',
    }).addTo(map);

    L.polyline(routeWaypoints, {
      color: '#059669',
      weight: 5,
      dashArray: '8, 8',
      opacity: 0.9,
    }).addTo(map);

    // Initial Truck Marker Position
    const initialTruckPos = getInterpolatedPoint(progress);

    const truckIcon = L.divIcon({
      className: 'truck-marker-icon',
      html: `
        <div style="background:#ffffff; color:#059669; border-radius:12px; padding:6px 10px; box-shadow:0 8px 24px rgba(0,0,0,0.25); border:2.5px solid #059669; display:flex; align-items:center; gap:6px; font-family:sans-serif;">
          <span style="font-size:20px;">🚚</span>
          <div>
            <div style="font-size:10px; font-weight:800; color:#064e3b; text-transform:uppercase; line-height:1;">Tata Ace</div>
            <div style="font-size:11px; font-weight:900; color:#059669; line-height:1.2;">${progress}%</div>
          </div>
        </div>
      `,
      iconSize: [88, 40],
      iconAnchor: [44, 20],
    });

    const truckMarker = L.marker(initialTruckPos, { icon: truckIcon, zIndexOffset: 1000 }).addTo(map);
    truckMarker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <strong style="color:#059669;">🚚 Driver: ${driver.name}</strong><br/>
        <span style="font-size:12px; color:#374151;">Vehicle: ${driver.vehicleModel} (${driver.vehicleNumber})</span><br/>
        <span style="font-size:11px; color:#047857; font-weight:bold;">GPS Speed: 42 km/h</span>
      </div>
    `);
    truckMarkerRef.current = truckMarker;

    // Fit map bounds to show full route
    const bounds = L.latLngBounds([farmCoords, buyerHubCoords]);
    map.fitBounds(bounds, { padding: [60, 60] });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Truck Position and Progress over time
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return 98;
        const next = prev + 1;
        setEtaMinutes(Math.max(2, Math.round(18 * (1 - next / 100))));
        setCurrentSpeed(Math.round(38 + Math.random() * 8));

        // Update truck marker on map
        if (truckMarkerRef.current && mapInstanceRef.current) {
          const newPos = getInterpolatedPoint(next);
          truckMarkerRef.current.setLatLng(newPos);

          const updatedIcon = L.divIcon({
            className: 'truck-marker-icon',
            html: `
              <div style="background:#ffffff; color:#059669; border-radius:12px; padding:6px 10px; box-shadow:0 8px 24px rgba(0,0,0,0.25); border:2.5px solid #059669; display:flex; align-items:center; gap:6px; font-family:sans-serif;">
                <span style="font-size:20px;">🚚</span>
                <div>
                  <div style="font-size:10px; font-weight:800; color:#064e3b; text-transform:uppercase; line-height:1;">Tata Ace</div>
                  <div style="font-size:11px; font-weight:900; color:#059669; line-height:1.2;">${next}%</div>
                </div>
              </div>
            `,
            iconSize: [88, 40],
            iconAnchor: [44, 20],
          });
          truckMarkerRef.current.setIcon(updatedIcon);
        }

        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Recenter map on vehicle
  const handleRecenterTruck = () => {
    if (mapInstanceRef.current) {
      const pos = getInterpolatedPoint(progress);
      mapInstanceRef.current.setView(pos, 14, { animate: true });
    }
  };

  // Recenter to full route
  const handleViewFullRoute = () => {
    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds([farmCoords, buyerHubCoords]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], animate: true });
    }
  };

  // Driver call simulation
  const handleCallDriver = () => {
    setCallAlert(`Dialing ${driver.name} at ${driver.phone}...`);
    setTimeout(() => setCallAlert(null), 4000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="bg-stone-100 min-h-screen pb-24 flex flex-col font-sans"
    >
      {/* Sticky Header matching reference image */}
      <header className="bg-white sticky top-0 z-20 px-4 py-3.5 border-b border-neutral-200/80 flex items-center justify-between shadow-xs">
        <button
          onClick={onBack}
          className="p-2 -ml-1 text-neutral-700 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black text-neutral-900 tracking-tight">
          {t('trackOrder', 'Live Delivery Route')}
        </h1>
        <div className="w-8" />
      </header>

      {/* Real Live Map Container */}
      <div className="relative w-full h-80 sm:h-96 md:h-[420px] bg-emerald-950 overflow-hidden shadow-inner">
        {/* Leaflet Map DOM Element */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Map Controls overlay */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={handleRecenterTruck}
            className="bg-white/90 hover:bg-white text-emerald-800 p-2.5 rounded-xl shadow-lg border border-neutral-200 backdrop-blur-md font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Locate Delivery Vehicle"
          >
            <Navigation className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">{t('trackOrder', 'Track Truck')}</span>
          </button>
          <button
            onClick={handleViewFullRoute}
            className="bg-white/90 hover:bg-white text-neutral-700 p-2.5 rounded-xl shadow-lg border border-neutral-200 backdrop-blur-md font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Fit Route to Screen"
          >
            <RefreshCw className="w-4 h-4 text-neutral-500" />
            <span className="hidden sm:inline">{t('trackLiveMap', 'Full Route')}</span>
          </button>
        </div>

        {/* Bottom Map Status Strip matching reference */}
        <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-4 py-2.5 flex items-center justify-between text-xs z-10">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold text-emerald-800 uppercase tracking-wider text-[11px] sm:text-xs">
              {t('outForDelivery', 'Out for Delivery')}
            </span>
            <span className="text-neutral-300">|</span>
            <span className="text-neutral-600 hidden sm:inline font-medium">
              {t('speed', 'Speed')}: <strong className="text-neutral-800">{currentSpeed} km/h</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-neutral-700 font-bold">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{t('eta', 'ETA')}: ~{etaMinutes} mins</span>
          </div>
        </div>
      </div>

      {/* Call Alert Toast Notification */}
      {callAlert && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
          <Phone className="w-3.5 h-3.5" />
          <span>{callAlert}</span>
        </div>
      )}

      {/* Driver & Delivery Information Details */}
      <div className="max-w-xl mx-auto w-full p-4 space-y-4 -mt-2">
        {/* Logistics Partner & Driver Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={driver.pictureUrl}
              alt={driver.name}
              className="w-13 h-13 rounded-full object-cover ring-2 ring-emerald-500/30"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-neutral-900 text-base">{driver.name}</h3>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-neutral-500 font-medium">
                {driver.vehicleModel} • {driver.vehicleNumber}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-amber-500 text-xs font-bold">★ 4.9</span>
                <span className="text-[11px] text-neutral-400 font-medium">
                  Verified Logistics Partner
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCallDriver}
            className="w-11 h-11 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition cursor-pointer shadow-xs border border-emerald-200"
            title="Call Driver"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Delivery Milestones */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/80 space-y-4">
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            {t('deliveryMilestones', 'Delivery Milestones')}
          </h4>

          <div className="space-y-4 relative">
            {/* Vertical connector line */}
            <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-neutral-200" />

            {/* Step 1: Farm Harvest */}
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-neutral-900">
                  Order Confirmed & Farm Harvested
                </p>
                <p className="text-xs text-neutral-500">
                  Produce picked fresh from farm fields in {product.location}
                </p>
              </div>
            </div>

            {/* Step 2: Quality Inspection */}
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-neutral-900">{t('aiGradedProduce', 'AI Quality Inspection Passed')}</p>
                <p className="text-xs text-neutral-500">
                  {t('grade', 'Grade')} {product.grade}
                </p>
              </div>
            </div>

            {/* Step 3: In Transit */}
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-emerald-800">{t('statusInTransit', 'In Transit')}</p>
                <p className="text-xs text-neutral-500">
                  {driver.vehicleModel}
                </p>
              </div>
            </div>

            {/* Step 4: Doorstep Delivery */}
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-400 border border-neutral-300 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-neutral-400">{t('deliveryAtDoorstep', 'Delivery at Doorstep')}</p>
                <p className="text-xs text-neutral-400">{t('doorstepDropoff', 'Doorstep Drop-off')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold text-sm shadow-md transition cursor-pointer"
        >
          {t('browseMarket', 'Return to Buyer Market')}
        </button>
      </div>
    </motion.div>
  );
};
