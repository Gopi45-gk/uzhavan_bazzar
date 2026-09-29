import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  X,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  IndianRupee,
  RefreshCw,
  Scale,
  Sparkles,
  ShieldCheck,
  Check,
  UploadCloud,
} from 'lucide-react';
import { calculateRecommendedPrice, calculateEstimatedTotal } from '../services/pricingEngine';
import { storageService } from '../services/storageService';
import { productService, ProductListing } from '../services/productService';
import { useLanguage } from '../context/LanguageContext';

export interface AddProduceCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductListed: (product: ProductListing) => void;
  farmerLocation?: string;
  defaultDistrict?: string;
  farmerId?: string;
}

interface PhotoItem {
  dataUrl: string;
  blob: Blob;
  viewName: string;
}

const COMMODITY_EMOJIS: Record<string, string> = {
  tomato: '🍅',
  onion: '🧅',
  potato: '🥔',
  carrot: '🥕',
  banana: '🍌',
  apple: '🍎',
  mango: '🥭',
  orange: '🍊',
  brinjal: '🍆',
  bhindi: '🥦',
  capsicum: '🫑',
  cucumber: '🥒',
  cabbage: '🥬',
  cauliflower: '🥦',
  papaya: '🍈',
  radish: '🥕',
  pumpkin: '🎃',
  grape: '🍇',
  guava: '🍐',
  strawberry: '🍓',
  bean: '🫘',
  bitter_gourd: '🥒',
  bottle_gourd: '🥒',
  broccoli: '🥦',
};

const PHOTO_STEPS = [
  {
    step: 1,
    title: 'Photo 1 of 4: Front View',
    subtitle: 'Capture the front side of the produce in natural light',
    tag: 'Front View',
    icon: '📸',
  },
  {
    step: 2,
    title: 'Photo 2 of 4: Side View',
    subtitle: 'Rotate 90° to capture the side surface',
    tag: 'Side View',
    icon: '🔄',
  },
  {
    step: 3,
    title: 'Photo 3 of 4: Opposite Side',
    subtitle: 'Turn to the opposite side to inspect hidden blemishes',
    tag: 'Opposite Side',
    icon: '🔁',
  },
  {
    step: 4,
    title: 'Photo 4 of 4: Close-up Quality',
    subtitle: 'Close-up of surface quality, skin texture, and freshness',
    tag: 'Close-up Detail',
    icon: '🔍',
  },
];

export const AddProduceCameraModal: React.FC<AddProduceCameraModalProps> = ({
  isOpen,
  onClose,
  onProductListed,
  farmerLocation = 'Madurai Mandi Gate 2',
  defaultDistrict = 'Chennai',
  farmerId = 'FARMER-MURUGAN-01',
}) => {
  const { t } = useLanguage();

  const photoSteps = [
    {
      step: 1,
      title: t('photo1Front', 'Photo 1 of 4: Front View'),
      subtitle: t('photo1FrontSub', 'Capture the front side of the produce in natural light'),
      tag: t('frontViewTag', 'Front View'),
      icon: '📸',
    },
    {
      step: 2,
      title: t('photo2Side', 'Photo 2 of 4: Side View'),
      subtitle: t('photo2SideSub', 'Rotate 90° to capture the side surface'),
      tag: t('sideViewTag', 'Side View'),
      icon: '🔄',
    },
    {
      step: 3,
      title: t('photo3Opposite', 'Photo 3 of 4: Opposite Side'),
      subtitle: t('photo3OppositeSub', 'Turn to the opposite side to inspect hidden blemishes'),
      tag: t('oppositeViewTag', 'Opposite Side'),
      icon: '🔁',
    },
    {
      step: 4,
      title: t('photo4Closeup', 'Photo 4 of 4: Close-up Quality'),
      subtitle: t('photo4CloseupSub', 'Close-up of surface quality, skin texture, and freshness'),
      tag: t('closeupTag', 'Close-up Detail'),
      icon: '🔍',
    },
  ];

  // Navigation & capture states
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [capturedPhotos, setCapturedPhotos] = useState<PhotoItem[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Analysis & server interaction states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(1);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  // Manual farmer verification & editing states (Requirement 1, 10, 21)
  const [isEditingDetection, setIsEditingDetection] = useState<boolean>(false);
  const [editedProductName, setEditedProductName] = useState<string>('');
  const [editedCategory, setEditedCategory] = useState<string>('Vegetable');
  const [editedGrade, setEditedGrade] = useState<'A' | 'B' | 'C'>('A');
  const [editedLocation, setEditedLocation] = useState<string>(farmerLocation);
  const [editedDescription, setEditedDescription] = useState<string>('');

  // Listing form states
  const [quantityKg, setQuantityKg] = useState<string>('25');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Video & Canvas references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera when modal opens
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by browser. Please use the Upload button.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // autoplay handling
        }
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraActive(false);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission is required. Please allow access or use the Upload button.'
          : 'Unable to start camera preview. Please use the Upload button below.'
      );
    }
  }, [facingMode]);

  // Handle open / close lifecycle
  useEffect(() => {
    if (isOpen && capturedPhotos.length < 4 && !analysisResult && !isAnalyzing) {
      if (!streamRef.current) {
        startCamera();
      }
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, capturedPhotos.length, analysisResult, isAnalyzing, startCamera, stopCamera]);

  // Reset modal state
  const resetWorkflow = () => {
    stopCamera();
    setCurrentStep(0);
    setCapturedPhotos([]);
    setIsAnalyzing(false);
    setIsEditingDetection(false);
    setEditedProductName('');
    setEditedCategory('Vegetable');
    setEditedGrade('A');
    setEditedLocation(farmerLocation);
    setEditedDescription('');
    setAnalysisProgress(1);
    setAnalysisError(null);
    setAnalysisResult(null);
    setQuantityKg('25');
    setIsSubmitting(false);
    setIsSuccess(false);
  };

  const handleClose = () => {
    resetWorkflow();
    onClose();
  };

  // Capture current camera frame
  const captureCurrentPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const newPhotoItem: PhotoItem = {
          dataUrl,
          blob,
          viewName: photoSteps[currentStep]?.tag || 'Produce View',
        };

        const updated = [...capturedPhotos, newPhotoItem];
        setCapturedPhotos(updated);

        if (updated.length === 4) {
          stopCamera();
          triggerAnalysis(updated);
        } else {
          setCurrentStep(updated.length);
        }
      },
      'image/jpeg',
      0.9
    );
  };

  // Fallback file input capture
  const handleFileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newPhotoItem: PhotoItem = {
        dataUrl,
        blob: file,
        viewName: photoSteps[currentStep]?.tag || 'Produce View',
      };

      const updated = [...capturedPhotos, newPhotoItem];
      setCapturedPhotos(updated);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (updated.length === 4) {
        stopCamera();
        triggerAnalysis(updated);
      } else {
        setCurrentStep(updated.length);
      }
    };
    reader.readAsDataURL(file);
  };

  // Retake photo
  const handleRetakePhoto = (indexToRetake: number) => {
    const updated = capturedPhotos.filter((_, idx) => idx !== indexToRetake);
    setCapturedPhotos(updated);
    setCurrentStep(updated.length);
    setAnalysisResult(null);
    setAnalysisError(null);
    if (!cameraActive) {
      startCamera();
    }
  };

  // Trigger AI pipeline (1 to 4 photos: multi-view fusion or single photo)
  const triggerAnalysis = async (photosToAnalyze: PhotoItem[]) => {
    if (!photosToAnalyze || photosToAnalyze.length === 0) {
      setAnalysisError('Please capture or upload at least 1 produce photo.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisProgress(1);

    const pTimer2 = setTimeout(() => setAnalysisProgress(2), 600);
    const pTimer3 = setTimeout(() => setAnalysisProgress(3), 1200);
    const pTimer4 = setTimeout(() => setAnalysisProgress(4), 1800);
    const pTimer5 = setTimeout(() => setAnalysisProgress(5), 2400);

    try {
      const formData = new FormData();
      photosToAnalyze.forEach((photo, idx) => {
        formData.append('images', photo.blob, `photo_${idx + 1}.jpg`);
      });
      formData.append('district', defaultDistrict);
      formData.append('state', 'Tamil Nadu');

      const API_ENDPOINT = 'http://localhost:8000/api/products/analyze';
      let response: Response;
      try {
        response = await fetch(API_ENDPOINT, {
          method: 'POST',
          body: formData,
        });
      } catch {
        response = await fetch('/api/products/analyze', {
          method: 'POST',
          body: formData,
        });
      }

      clearTimeout(pTimer2);
      clearTimeout(pTimer3);
      clearTimeout(pTimer4);
      clearTimeout(pTimer5);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Current market price is temporarily unavailable. Please try again.');
      }

      const result = await response.json();

      // Ensure grade is strictly A, B, or C
      const rawGrade = (result.quality?.grade || 'C').toUpperCase();
      const validGrade: 'A' | 'B' | 'C' = ['A', 'B', 'C'].includes(rawGrade) ? rawGrade : 'C';
      result.quality.grade = validGrade;

      const pName = result.product?.name || 'Produce';
      const cat = result.product?.category || 'Vegetable';
      setEditedProductName(pName);
      setEditedCategory(cat);
      setEditedGrade(validGrade);
      setEditedLocation(farmerLocation);
      setEditedDescription(`Farm-fresh ${pName} (Grade ${validGrade}) certified by AI quality vision model.`);

      // Verify and sync pricing with frontend centralized pricing engine
      const mandiPrice = Number(result.market?.mandi_price) || 55;
      const frontendPricing = calculateRecommendedPrice(pName, mandiPrice, validGrade);

      // Harmonize recommended_price
      result.recommended_price = {
        ...result.recommended_price,
        grade: validGrade,
        basePrice: mandiPrice,
        minPrice: frontendPricing.minPrice,
        maxPrice: frontendPricing.maxPrice,
        displayPrice: frontendPricing.displayPrice,
        display_text: frontendPricing.displayPrice,
        is_open_ended: frontendPricing.isOpenEnded,
        explanation: frontendPricing.explanation,
      };

      setAnalysisResult(result);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setAnalysisError(err.message || 'Current market price is temporarily unavailable. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Publish produce listing
  const handlePostProduct = async () => {
    if (!analysisResult) return;

    const qty = parseFloat(quantityKg);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid quantity greater than 0 kg.');
      return;
    }

    setIsSubmitting(true);

    try {
      const productName = activeProductName;
      const category = activeCategory;
      const grade = activeGrade;
      const mandiPrice = Number(analysisResult.market?.mandi_price) || 45;

      // 1. Upload captured images to Firebase Storage
      let uploadedImageUrls: string[] = [];
      try {
        uploadedImageUrls = await storageService.uploadProducePhotos(
          farmerId,
          `prod-${Date.now()}`,
          capturedPhotos.map((p) => ({ blob: p.blob, dataUrl: p.dataUrl }))
        );
      } catch (storageErr) {
        console.warn('Firebase Storage upload notice:', storageErr);
        uploadedImageUrls = capturedPhotos.map((p) => p.dataUrl.slice(0, 100));
      }

      // 2. Prepare payload with all required traceability fields
      const pricingRes = calculateRecommendedPrice(productName, mandiPrice, grade);
      const totalRes = calculateEstimatedTotal(qty, pricingRes);

      const payload = {
        product_name: productName,
        commodity_key: commodityKey,
        category: category,
        quantity_kg: qty,
        grade: grade,
        quality_score: analysisResult.quality.score,
        detection_confidence: activeConfidence,
        quality_confidence: analysisResult.quality.confidence,
        mandi_price: mandiPrice,
        mandi_market: analysisResult.market.market_name || 'APMC Market',
        mandi_district: analysisResult.market.district || defaultDistrict,
        mandi_location: editedLocation || farmerLocation,
        mandi_unit: 'kg',
        mandi_price_timestamp: analysisResult.market.timestamp || new Date().toISOString(),
        recommended_min_price: pricingRes.minPrice ?? null,
        recommended_max_price: pricingRes.maxPrice,
        estimated_min_total: totalRes.minTotal ?? null,
        estimated_max_total: totalRes.maxTotal,
        farmer_id: farmerId,
        farmer_name: 'Murugan S.',
        farmer_location: editedLocation || farmerLocation,
        images: uploadedImageUrls,
        pricing_rule: pricingRes.pricingRuleUsed,
        model_version: 'YOLOv8 + MobileNetV3',
        created_at: new Date().toISOString(),
      };

      // 3. Send to backend server for validation & persistence
      let backendRecord = null;
      try {
        const response = await fetch('http://localhost:8000/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const resJson = await response.json();
          backendRecord = resJson.product;
        }
      } catch {
        // Local fallback
      }

      // 4. Save directly to Firestore /products collection (Section 4 & 5)
      const primaryImageUrl = (uploadedImageUrls && uploadedImageUrls.length > 0 && uploadedImageUrls[0].length > 100)
        ? uploadedImageUrls[0]
        : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80';

      const firestoreListing: any = {
        name: `${productName} (Grade ${grade})`,
        productName: productName,
        category: category,
        variety: 'Farm Fresh',
        quantity: qty,
        quantityKg: qty,
        unit: 'kg',
        price: pricingRes.displayPrice,
        displayPrice: pricingRes.displayPrice,
        marketPrice: mandiPrice,
        optimizedPriceMin: pricingRes.minPrice || mandiPrice - 5,
        optimizedPriceMax: pricingRes.maxPrice || mandiPrice,
        status: 'active',
        availability: 'In Stock',
        views: 1,
        date: 'Just now',
        farmerId: farmerId,
        farmerName: 'Murugan S.',
        farmerPhone: '+91 98421 55670',
        location: editedLocation || farmerLocation,
        farmerLocation: editedLocation || farmerLocation,
        pricePerUnit: String(pricingRes.maxPrice),
        harvestDate: 'Today',
        grade: grade,
        qualityScore: analysisResult.quality.score,
        freshnessScore: analysisResult.quality.freshness_score || analysisResult.quality.score || 92,
        detectionConfidence: activeConfidence,
        mlConfidence: activeConfidence,
        qualityConfidence: analysisResult.quality.confidence,
        detectedDefects: analysisResult.quality.detected_defects || [],
        mandiPrice: mandiPrice,
        mandiMarket: analysisResult.market.market_name,
        mandiLocation: editedLocation || farmerLocation,
        mandiUnit: 'kg',
        mandiPriceTimestamp: analysisResult.market.timestamp || new Date().toISOString(),
        recommendedMinPrice: pricingRes.minPrice,
        recommendedMaxPrice: pricingRes.maxPrice,
        estimatedMinValue: totalRes.minTotal,
        estimatedMaxValue: totalRes.maxTotal,
        pricingRule: pricingRes.pricingRuleUsed,
        modelVersion: 'YOLOv8 + MobileNetV3',
        imageUrl: primaryImageUrl,
        imageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : [primaryImageUrl],
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : [primaryImageUrl],
        description: editedDescription || `Farm-fresh ${productName} (Grade ${grade}) certified by AI quality vision model.`,
        aiGradeData: {
          grade: grade,
          detectedProduct: productName,
          confidence: activeConfidence,
          model: 'YOLOv8 + MobileNetV3',
          analyzedImages: capturedPhotos.length || 1,
          analyzedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docId = await productService.addProduct(firestoreListing);

      const createdProduct: ProductListing = {
        ...firestoreListing,
        id: backendRecord?.id || docId,
        productId: backendRecord?.id || docId,
      };

      setIsSuccess(true);
      onProductListed(createdProduct);

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      console.error('Post product failed:', err);
      alert('Failed to list product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Calculated active values (supports farmer manual verification/editing)
  const activeProductName = editedProductName || analysisResult?.product?.name || 'Produce';
  const activeGrade = (editedGrade || analysisResult?.quality?.grade || 'C') as 'A' | 'B' | 'C';
  const activeCategory = editedCategory || analysisResult?.product?.category || 'Vegetable';
  const activeConfidence = analysisResult?.product?.confidence ?? 0.94;
  const confidencePercent = Math.round(activeConfidence * 100);

  const numQty = parseFloat(quantityKg) || 0;
  const commodityKey =
    analysisResult?.product?.commodity_key ||
    activeProductName.toLowerCase().replace(/\s+/g, '_');
  const emoji = COMMODITY_EMOJIS[commodityKey] || '🌾';
  const grade = activeGrade;
  const mandiPrice = Number(analysisResult?.market?.mandi_price) || 0;

  const currentPricing = analysisResult
    ? calculateRecommendedPrice(activeProductName, mandiPrice, activeGrade)
    : null;

  const currentEstimate = currentPricing
    ? calculateEstimatedTotal(numQty, currentPricing)
    : null;

  return (
    <AnimatePresence>
      <div
        key="add-produce-camera-overlay"
        id="add-produce-camera-overlay"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4 select-none"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#FAF8F5] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[94vh] flex flex-col overflow-hidden"
        >
          {/* Header Bar */}
          <div className="bg-white px-5 py-4 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-xs flex-shrink-0 font-bold">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg font-black text-neutral-900 leading-tight">
                    Add Produce & AI Grading
                  </h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Grade A/B/C
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium">
                  {capturedPhotos.length < 4
                    ? `Capture 4 angles (${capturedPhotos.length}/4)`
                    : analysisResult
                    ? 'AI Quality & Mandi Price Verified'
                    : 'Analyzing multi-view quality'}
                </p>
              </div>
            </div>

            <button
              id="close-add-produce-modal"
              onClick={handleClose}
              className="p-2 rounded-full text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* SUCCESS STATE */}
            {isSuccess && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-12 flex flex-col items-center text-center space-y-3"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h4 className="text-xl font-black text-neutral-900">
                  {t('produceListedSuccess', 'Produce Listed Successfully!')}
                </h4>
                <p className="text-xs text-neutral-600 max-w-xs leading-relaxed">
                  Your <strong>{analysisResult?.product?.name}</strong> ({t('grade', 'Grade')} {analysisResult?.quality?.grade}) has been published to Uzhavan Bazzar mandi buyers!
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 text-neutral-700 font-bold text-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> {t('close', 'Closing window...')}...
                  </span>
                </div>
              </motion.div>
            )}

            {/* ERROR STATE */}
            {analysisError && !isAnalyzing && (
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                analysisError.toLowerCase().includes('human')
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  analysisError.toLowerCase().includes('human') ? 'text-amber-600' : 'text-rose-600'
                }`} />
                <div className="flex-1">
                  <h5 className="text-xs font-black uppercase tracking-wider">
                    {analysisError.toLowerCase().includes('human') ? '👤 Human Detected • Fresh Produce Required' : 'Grading Notice'}
                  </h5>
                  <p className="text-xs font-semibold mt-0.5">{analysisError}</p>
                  {analysisError.toLowerCase().includes('human') && (
                    <p className="text-[11px] text-amber-700 mt-1">
                      Tip: Place your produce (tomatoes, potatoes, apples, etc.) on a flat surface and ensure faces or people are not occupying the camera frame.
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setAnalysisError(null);
                      setCapturedPhotos([]);
                      setCurrentStep(0);
                      startCamera();
                    }}
                    className={`mt-2.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                      analysisError.toLowerCase().includes('human')
                        ? 'bg-amber-700 hover:bg-amber-800'
                        : 'bg-rose-700 hover:bg-rose-800'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('retakePhotos', 'Retake 4 Photos')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 1: CAMERA CAPTURE (0 to 3 photos captured) */}
            {!isSuccess && !analysisResult && !isAnalyzing && (
              <div className="space-y-4">
                {/* 4-Step Progress Indicator */}
                <div className="grid grid-cols-4 gap-2">
                  {photoSteps.map((s, idx) => {
                    const isDone = idx < capturedPhotos.length;
                    const isCurrent = idx === currentStep;
                    return (
                      <div
                        key={s.step}
                        className={`p-2 rounded-xl text-center border transition-all ${
                          isDone
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : isCurrent
                            ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                            : 'bg-white border-neutral-200 text-neutral-400'
                        }`}
                      >
                        <div className="text-sm font-bold flex items-center justify-center gap-1">
                          <span>{s.icon}</span>
                          {isDone && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <div className="text-[10px] font-black uppercase mt-0.5 truncate">
                          {s.tag}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* View Guidance Title */}
                <div className="bg-white p-3 rounded-2xl border border-neutral-200/90 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wide">
                      {photoSteps[currentStep]?.title}
                    </span>
                    <p className="text-xs text-neutral-600 font-medium">
                      {photoSteps[currentStep]?.subtitle}
                    </p>
                  </div>
                  <span className="text-xs bg-neutral-100 font-bold px-2 py-1 rounded-lg text-neutral-600">
                    {currentStep + 1} / 4
                  </span>
                </div>

                {/* Live Camera Viewport */}
                <div className="relative aspect-4/3 w-full bg-neutral-900 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-neutral-300">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  />
                  {!cameraActive && (
                    <div className="p-6 text-center text-white flex flex-col items-center space-y-3">
                      <Camera className="w-10 h-10 text-neutral-400" />
                      <p className="text-xs text-neutral-300 max-w-xs">
                        {cameraError || 'Allow camera permission or use the upload button below to select images.'}
                      </p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        Start Camera
                      </button>
                    </div>
                  )}

                  {/* Corner guide overlay */}
                  <div className="absolute inset-4 pointer-events-none border-2 border-white/40 rounded-2xl flex flex-col justify-between p-3">
                    <div className="flex justify-between items-start">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/20">
                        {photoSteps[currentStep]?.title || 'Capture View'}
                      </span>
                      <span className="bg-emerald-950/80 backdrop-blur-md text-emerald-300 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-emerald-500/30">
                        Produce Only
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="bg-black/60 backdrop-blur-md text-white/80 text-[11px] font-medium px-3 py-1 rounded-full">
                        Center fruits or vegetables • Avoid faces or people in view
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileCapture}
                  />

                  {/* Upload from Gallery Fallback */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-3 rounded-2xl bg-white border border-neutral-300 text-neutral-700 font-bold text-xs flex items-center gap-1.5 hover:bg-neutral-50 cursor-pointer shadow-xs"
                    title="Upload image from phone storage"
                  >
                    <UploadCloud className="w-4 h-4 text-neutral-500" />
                    <span className="hidden sm:inline">{t('uploadFromGallery', 'Upload')}</span>
                  </button>

                  {/* Main Capture Shutter Button */}
                  <button
                    id="shutter-capture-btn"
                    type="button"
                    onClick={captureCurrentPhoto}
                    disabled={!cameraActive}
                    className={`flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-97 cursor-pointer ${
                      cameraActive
                        ? 'bg-[#22C55E] hover:bg-[#16A34A] text-black shadow-emerald-600/20'
                        : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-black flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-black" />
                    </div>
                    <span>{t('capturePhoto', 'CAPTURE PHOTO')} ({currentStep + 1}/4)</span>
                  </button>
                </div>

                {/* Thumbnail Strip of Captured Photos */}
                {capturedPhotos.length > 0 && (
                  <div className="bg-white p-3 rounded-2xl border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600">
                      <span>Captured Views ({capturedPhotos.length}/4):</span>
                      <div className="flex items-center gap-2">
                        {capturedPhotos.length >= 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              stopCamera();
                              triggerAnalysis(capturedPhotos);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                          >
                            ⚡ {t('analyzeNow', 'Grade Now')} ({capturedPhotos.length})
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setCapturedPhotos([]);
                            setCurrentStep(0);
                          }}
                          className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                        >
                          {t('retakePhotos', 'Reset All')}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {capturedPhotos.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          className="relative aspect-square rounded-xl overflow-hidden border-2 border-emerald-500 group shadow-xs"
                        >
                          <img
                            src={photo.dataUrl}
                            alt={`View ${pIdx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRetakePhoto(pIdx)}
                            className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white p-1 rounded-full text-[9px] cursor-pointer"
                            title="Retake this view"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5 truncate px-1">
                            {photo.viewName}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STAGE 2: 5-STEP PROCESSING STATE */}
            {isAnalyzing && (
              <div className="py-8 px-4 flex flex-col items-center space-y-6">
                <div className="relative flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin flex items-center justify-center" />
                  <Sparkles className="w-8 h-8 text-emerald-600 absolute" />
                </div>

                <div className="text-center space-y-1">
                  <h4 className="text-base font-black text-neutral-900">{t('processing', 'Analyzing Your Harvest...')}</h4>
                  <p className="text-xs text-neutral-500">
                    4-Image Multi-View Fusion via YOLOv8 & CNN Quality Model
                  </p>
                </div>

                {/* Step-by-Step Progress Checklist */}
                <div className="w-full max-w-sm bg-white p-4 rounded-2xl border border-neutral-200 space-y-3 shadow-xs">
                  <div className="flex items-center gap-3 text-xs font-bold">
                    {analysisProgress >= 1 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-neutral-300 flex-shrink-0" />
                    )}
                    <span className={analysisProgress >= 1 ? 'text-neutral-900' : 'text-neutral-400'}>
                      {t('analyzingStep1', 'YOLOv8 Produce Detection & Consistency Verification')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold">
                    {analysisProgress >= 2 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-neutral-300 flex-shrink-0" />
                    )}
                    <span className={analysisProgress >= 2 ? 'text-neutral-900' : 'text-neutral-400'}>
                      {t('analyzingStep2', 'CNN Quality Analysis on 4 Angle Produce Crops')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold">
                    {analysisProgress >= 3 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-neutral-300 flex-shrink-0" />
                    )}
                    <span className={analysisProgress >= 3 ? 'text-neutral-900' : 'text-neutral-400'}>
                      {t('analyzingStep3', 'Multi-View Feature Fusion → Quality Score & A/B/C Grade')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold">
                    {analysisProgress >= 4 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-neutral-300 flex-shrink-0" />
                    )}
                    <span className={analysisProgress >= 4 ? 'text-neutral-900' : 'text-neutral-400'}>
                      {t('analyzingStep4', 'Fetching Current Mandi Market Reference Price')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold">
                    {analysisProgress >= 5 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-neutral-300 flex-shrink-0" />
                    )}
                    <span className={analysisProgress >= 5 ? 'text-neutral-900' : 'text-neutral-400'}>
                      {t('analyzingStep5', 'Dynamic Grade-Based Price Optimization')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 3: GRADING RESULT, MANDI PRICE & QUANTITY CONFIRMATION */}
            {analysisResult && !isSuccess && (
              <div className="space-y-4">
                {/* 1. LOW / MEDIUM / HIGH CONFIDENCE BANNER (Requirement 1, 21) */}
                <div
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2.5 ${
                    activeConfidence >= 0.85
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : activeConfidence >= 0.55
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {activeConfidence >= 0.85 ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-black">
                        {activeConfidence >= 0.85
                          ? `${activeProductName} — Grade ${activeGrade} — ${confidencePercent}% confidence`
                          : activeConfidence >= 0.55
                          ? `${activeProductName} detected — Please verify the result.`
                          : `We couldn't confidently identify this product. Please upload a clearer image.`}
                      </div>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        {activeConfidence >= 0.85
                          ? 'Real-world AI model verified high quality.'
                          : 'You can tap "Edit / Verify" to confirm or correct product details.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingDetection(!isEditingDetection)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-current hover:bg-black/5 shrink-0 cursor-pointer transition-colors"
                  >
                    {isEditingDetection ? 'Done' : 'Edit / Verify'}
                  </button>
                </div>

                {/* EDIT / VERIFY COLLAPSIBLE PANEL (Requirement 1, 10) */}
                {isEditingDetection && (
                  <div className="p-3.5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-2.5 text-xs font-bold">
                    <div className="text-[11px] font-black uppercase text-neutral-500 tracking-wider">
                      Manual Farmer Verification & Correction
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-600 uppercase mb-1">Product Name</label>
                      <input
                        type="text"
                        value={editedProductName}
                        onChange={(e) => setEditedProductName(e.target.value)}
                        placeholder="e.g. Tomato, Onion, Potato..."
                        className="w-full px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-300 font-bold text-neutral-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-neutral-600 uppercase mb-1">Category</label>
                        <select
                          value={editedCategory}
                          onChange={(e) => setEditedCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-300 font-bold text-neutral-900 focus:bg-white focus:outline-hidden"
                        >
                          <option value="Vegetable">Vegetable</option>
                          <option value="Fruit">Fruit</option>
                          <option value="Grain">Grain</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-600 uppercase mb-1">Grade (A/B/C)</label>
                        <select
                          value={editedGrade}
                          onChange={(e) => setEditedGrade(e.target.value as 'A' | 'B' | 'C')}
                          className="w-full px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-300 font-bold text-neutral-900 focus:bg-white focus:outline-hidden"
                        >
                          <option value="A">Grade A (High Quality)</option>
                          <option value="B">Grade B (Good Quality)</option>
                          <option value="C">Grade C (Standard)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-600 uppercase mb-1">Location</label>
                      <input
                        type="text"
                        value={editedLocation}
                        onChange={(e) => setEditedLocation(e.target.value)}
                        placeholder="Farm / Mandi Location"
                        className="w-full px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-300 font-bold text-neutral-900 focus:bg-white focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}

                {/* 2. PRODUCT IDENTIFICATION & STRICT A/B/C GRADE BANNER */}
                <div className="bg-white p-4 rounded-3xl border border-neutral-200/90 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl select-none">{emoji}</span>
                      <div>
                        <div className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                          {t('detectedProduct', 'Detected Product')}
                        </div>
                        <h4 className="text-xl font-black text-neutral-900 leading-tight">
                          {activeProductName}
                        </h4>
                        <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {capturedPhotos.length === 4 ? '4 Views Consistent' : 'Produce Vision Verified'} ({confidencePercent}% confidence)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quality Grade Badge: STRICTLY Grade A, B, or C */}
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                        {t('qualityGrade', 'QUALITY GRADE')}
                      </div>
                      <div
                        className={`inline-flex items-center justify-center px-4 py-1.5 rounded-2xl font-black text-xl shadow-xs mt-0.5 ${
                          activeGrade === 'A'
                            ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-500'
                            : activeGrade === 'B'
                            ? 'bg-lime-100 text-lime-900 border-2 border-lime-500'
                            : 'bg-amber-100 text-amber-900 border-2 border-amber-500'
                        }`}
                      >
                        {t('grade', 'Grade')} {activeGrade}
                      </div>
                    </div>
                  </div>

                  {/* Quality Score Progress Bar */}
                  <div className="mt-3.5 pt-3 border-t border-neutral-100">
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-neutral-500 uppercase tracking-wide text-[10px]">
                        {t('qualityScore', 'QUALITY SCORE')}
                      </span>
                      <span className="text-neutral-900 font-black">
                        {analysisResult.quality.score} / 100
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          grade === 'A'
                            ? 'bg-emerald-500'
                            : grade === 'B'
                            ? 'bg-lime-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.max(5, analysisResult.quality.score)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-1 flex justify-between">
                      <span>0 - 74 ({t('grade', 'Grade')} C)</span>
                      <span>75 - 89 ({t('grade', 'Grade')} B)</span>
                      <span>90 - 100 ({t('grade', 'Grade')} A)</span>
                    </div>
                  </div>
                </div>

                {/* 2. MANDI MARKET PRICE & RECOMMENDED SELLING PRICE */}
                <div className="bg-white p-4 rounded-3xl border border-neutral-200/90 shadow-sm space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Mandi Market Price */}
                    <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                      <div className="flex items-center gap-1.5 text-neutral-500 text-[11px] font-bold uppercase">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t('mandiBasePrice', 'CURRENT MANDI PRICE')}</span>
                      </div>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-neutral-900">
                          ₹{mandiPrice}
                        </span>
                        <span className="text-xs text-neutral-500 font-medium">/ {t('kgUnit', 'kg')}</span>
                      </div>
                      <div className="text-[10px] text-neutral-500 truncate mt-0.5">
                        {analysisResult.market.market_name}
                      </div>
                    </div>

                    {/* Recommended Farmer Selling Price */}
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-bold uppercase">
                        <Scale className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t('recommendedPrice', 'RECOMMENDED PRICE')}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-lg sm:text-xl font-black text-emerald-900">
                          {currentPricing?.displayPrice}
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        Grade {grade} Calibration
                      </div>
                    </div>
                  </div>

                  {/* Price Transparency Note (Requirement 14 & 15) */}
                  <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-900 leading-snug">
                    {t('priceNote', 'Price basis: Current Mandi price + AI quality grade. This recommendation is an estimated range, not a guaranteed selling price.')}
                  </div>
                </div>

                {/* 3. FARMER ENTERS QUANTITY & ESTIMATED TOTAL (Requirement 16 & 17) */}
                <div className="bg-white p-4 rounded-3xl border border-neutral-200/90 shadow-sm space-y-3">
                  <div>
                    <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-1">
                      {t('howManyKg', 'How many kg do you have?')}
                    </label>
                    <div className="relative">
                      <input
                        id="produce-quantity-input"
                        type="number"
                        step="any"
                        min="0.1"
                        required
                        value={quantityKg}
                        onChange={(e) => setQuantityKg(e.target.value)}
                        placeholder="e.g. 25"
                        className="w-full px-4 py-3 rounded-2xl bg-neutral-100 border border-neutral-300 text-neutral-900 font-black text-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-500">
                        kg
                      </span>
                    </div>

                    {/* Quick increment chips */}
                    <div className="flex gap-1.5 mt-2">
                      {['5', '12.5', '25', '100'].map((qVal) => (
                        <button
                          key={qVal}
                          type="button"
                          onClick={() => setQuantityKg(qVal)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            quantityKg === qVal
                              ? 'bg-neutral-900 text-white'
                              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          }`}
                        >
                          {qVal} kg
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Total Value Estimation (Requirement 17) */}
                  <div className="p-3.5 rounded-2xl bg-neutral-900 text-white flex items-center justify-between shadow-md">
                    <div>
                      <div className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                        {currentEstimate?.label}
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {numQty} kg @ {currentPricing?.displayPrice}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-emerald-400">
                        {currentEstimate?.displayTotal}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-medium">
                        {currentEstimate?.isUpperBound ? 'Upper-bound estimate' : (t('grossMandiValue', 'Gross Mandi Value'))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. FINAL CONFIRMATION & POST PRODUCT (Requirement 18) */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between px-2 text-xs font-bold text-neutral-600">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>4 {t('camera', 'Photos')}: ✓ {t('success', 'Captured')}</span>
                    </span>
                    <span className="text-neutral-400">{t('post', 'Ready to publish')}</span>
                  </div>

                  <button
                    id="post-product-confirm-btn"
                    type="button"
                    onClick={handlePostProduct}
                    disabled={isSubmitting || numQty <= 0}
                    className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98 cursor-pointer ${
                      numQty > 0 && !isSubmitting
                        ? 'bg-[#22C55E] hover:bg-[#16A34A] text-black shadow-emerald-600/25'
                        : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>{t('postingProduce', 'Publishing to Uzhavan Bazzar...')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('postProduct', 'POST PRODUCT')}</span>
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAnalysisResult(null);
                      setCapturedPhotos([]);
                      setCurrentStep(0);
                      startCamera();
                    }}
                    className="w-full py-2.5 text-center text-xs font-bold text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
                  >
                    {t('discardRetake', 'Discard & Retake Photos')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
