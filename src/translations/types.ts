export interface Translations {
  // Navigation & Headers
  dashboard: string;
  uzhavanBazzar: string;
  language: string;
  selectLanguage: string;
  farmerPortal: string;
  buyerPortal: string;
  verifiedMember: string;

  // 6 Dashboard Badges
  addProduce: string;
  myListings: string;
  orders: string;
  farmerCommunity: string;
  marketInsight: string;
  cattle: string;

  // Role Selection
  farmer: string;
  buyer: string;
  chooseRole: string;
  sellHarvest: string;
  purchaseDirect: string;

  // Registration Form
  name: string;
  namePlaceholder: string;
  phoneNumber: string;
  phonePlaceholder: string;
  location: string;
  locationPlaceholder: string;
  cropType: string;
  cropTypePlaceholder: string;
  landArea: string;
  landAreaPlaceholder: string;
  soilType: string;
  soilTypePlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  confirmPassword: string;
  confirmPasswordPlaceholder: string;
  register: string;
  alreadyRegistered: string;
  loginHere: string;

  // Registration Validation & Messages
  pleaseEnterName: string;
  pleaseEnterPhone: string;
  invalidPhone: string;
  pleaseEnterLocation: string;
  pleaseEnterCropType: string;
  pleaseEnterLandArea: string;
  pleaseEnterSoilType: string;
  pleaseEnterPassword: string;
  passwordMinLength: string;
  passwordsDoNotMatch: string;
  registrationSuccess: string;
  registrationFailed: string;

  // Login Form
  login: string;
  farmerLogin: string;
  newFarmer: string;
  registerHere: string;
  invalidCredentials: string;
  loginSuccess: string;
  loginSubtitle: string;
  registerSubtitle: string;
  welcomeAboard: string;
  directProduceDesc: string;
  continueToDashboard: string;
  detectingGps: string;
  autoDetect: string;
  detectingLocation: string;
  processing: string;
  locationPermissionRequired: string;

  // Voice Input
  listening: string;
  speakNow: string;
  voiceNotSupported: string;
  voiceError: string;
  permissionDenied: string;

  // Add Produce Camera Flow
  addProduceTitle: string;
  aiGradingSubtitle: string;
  photo1Front: string;
  photo1FrontSub: string;
  photo2Side: string;
  photo2SideSub: string;
  photo3Opposite: string;
  photo3OppositeSub: string;
  photo4Closeup: string;
  photo4CloseupSub: string;
  frontViewTag: string;
  sideViewTag: string;
  oppositeViewTag: string;
  closeupTag: string;
  capturePhoto: string;
  uploadFromGallery: string;
  switchCamera: string;
  camera: string;
  gallery: string;
  takePhoto: string;
  preview: string;
  removePhoto: string;
  retakePhotos: string;
  retakeThisPhoto: string;
  analyzingStep1: string;
  analyzingStep2: string;
  analyzingStep3: string;
  analyzingStep4: string;
  analyzingStep5: string;
  mandiBasePrice: string;
  recommendedPrice: string;
  priceNote: string;
  howManyKg: string;
  kgUnit: string;
  totalEstimatedValue: string;
  grossMandiValue: string;
  postProduct: string;
  postingProduce: string;
  discardAndRetake: string;
  produceListedSuccess: string;
  gradingError: string;
  noProduceDetected: string;
  cameraPermissionRequired: string;
  gradeAQuality: string;
  gradeBQuality: string;
  gradeCQuality: string;

  // Cattle & Livestock
  cattleAndLivestock: string;
  searchCattle: string;
  categoryCow: string;
  categoryGoat: string;
  categoryHen: string;
  categoryMilk: string;
  categoryEgg: string;
  farmersCattle: string;
  marketplace: string;
  liveMandi: string;
  myCattle: string;
  postCattleListing: string;
  postCowListing: string;
  postGoatListing: string;
  postHenListing: string;
  postMilkListing: string;
  postEggListing: string;
  cattleType: string;
  goatType: string;
  henType: string;
  milkType: string;
  eggType: string;
  all: string;
  inquire: string;
  bookNow: string;
  breed: string;
  age: string;
  gender: string;
  milkYield: string;
  vaccination: string;
  weight: string;
  quantity: string;
  price: string;
  photoRequired: string;
  choosePhoto: string;
  inquireSuccess: string;
  listingPostedSuccess: string;

  // Orders & Tracking
  incomingOrders: string;
  myOrders: string;
  orderId: string;
  orderDate: string;
  totalAmount: string;
  paymentStatus: string;
  orderStatus: string;
  statusPlaced: string;
  statusConfirmed: string;
  statusProcessing: string;
  statusReady: string;
  statusInTransit: string;
  statusDelivered: string;
  statusCancelled: string;
  callBuyer: string;
  callDriver: string;
  trackOrder: string;
  noOrdersYet: string;

  // Listings Sheet
  produceListings: string;
  cattleListingsTab: string;
  noListingsYet: string;
  views: string;
  delete: string;
  edit: string;
  todayMandiRates: string;

  // Buyer Marketplace & Checkout
  searchPlaceholder: string;
  marketValue: string;
  predictedValue: string;
  allGrades: string;
  sales: string;
  ongoingOrders: string;
  orderHistory: string;
  transactions: string;
  delivery: string;
  market: string;
  account: string;
  switchFarmerPortal: string;
  switchBuyerPortal: string;
  choosePaymentMethod: string;
  payNow: string;
  processingPayment: string;
  paymentSuccessful: string;
  grade: string;
  directFromFarmer: string;
  verifiedFarmer: string;
  productDescription: string;
  aiGradedProduce: string;
  selectQuantity: string;
  totalPayable: string;
  buyNow: string;
  checkout: string;
  orderSummary: string;
  transportOptions: string;
  deliveredByFarmer: string;
  ownTransport: string;
  deliveryFee: string;
  paymentMethod: string;
  onlinePayment: string;
  cod: string;
  confirmOrder: string;
  proceedToPayment: string;
  writeReview: string;
  submitReview: string;
  yourRating: string;
  yourReview: string;
  reviewSubmitted: string;

  // Profile Modal
  farmerId: string;
  closeProfile: string;
  crops: string;

  // Community
  shareWithFarmers: string;
  post: string;
  like: string;
  replies: string;

  // Technical & Error Mappings
  errorRequiredField: string;
  errorNetwork: string;
  errorInvalidCredentials: string;
  errorUserNotFound: string;
  errorWeakPassword: string;
  errorEmailInUse: string;
  errorGenericSave: string;
  errorPhotoRequired: string;

  // General Actions
  cancel: string;
  close: string;
  save: string;
  back: string;
  continueText: string;
  logout: string;
  activeStatus: string;
  soldOutStatus: string;
  search: string;
  loading: string;
  success: string;
  error: string;
  confirm: string;
  submit: string;
  available: string;
  addToCart: string;
  editProfile: string;
  profile: string;

  // Additional complete localization keys
  items: string;
  listed: string;
  cart: string;
  review: string;
  reviews: string;
  selectBreed: string;
  postListing: string;
  cattleDescription: string;
  noLivestockFound: string;
  resetFilters: string;
  cattleTrustBanner: string;
  uzhavanTrust: string;
  communitySubtitle: string;
  shareTipPlaceholder: string;
  weatherAlertTitle: string;
  weatherAlertDesc: string;
  mandiDisclaimer: string;
  detectedProduct: string;
  qualityGrade: string;
  qualityScore: string;
  discardRetake: string;
  totalPayableToFarmer: string;
  trackLiveMap: string;
  verifiedBuyer: string;
  noOngoingDeliveries: string;
  browseMarket: string;
  continueToLanguage: string;
  itemsAvailable: string;
  active: string;
  call: string;
  required: string;
  directSellerConnect: string;
  contactSeller: string;
  outForDelivery: string;
  speed: string;
  eta: string;
  deliveryMilestones: string;
  fastAndSecure: string;
  assignedLogisticsPartner: string;
  produceSubtotal: string;
  logisticsFee: string;
  free: string;
  grandTotal: string;
  selfPickup: string;
  codSubtitle: string;
  tagPestControl: string;
  tagMandiRates: string;
  tagSubsidy: string;
  tagSeedsSoil: string;
  tagGeneral: string;
  farmFieldHarvest: string;
  deliveryHub: string;
  doorstepDropoff: string;
  deliveryAtDoorstep: string;

  // Product Type Selection
  selectProductType: string;
  selectProductTypeTitle: string;
  chooseHowToSell: string;
  addProductOption: string;
  exportProductOption: string;
  addProductDesc: string;
  exportProductDesc: string;
  localSaleTitle: string;
  localSaleSubtitle: string;
  localSaleDesc: string;
  exportSaleTitle: string;
  exportSaleSubtitle: string;
  exportSaleDesc: string;

  // Export Product Workflow
  exportProduct: string;
  destination: string;
  selectDestination: string;
  cargo: string;
  cargoPlaceholder: string;
  exportWeight: string;
  shippingMode: string;
  seaFreight: string;
  airCargo: string;
  dispatchDate: string;
  estimatedDelivery: string;
  estimatedExportValue: string;
  partnerNetwork: string;
  requestQuote: string;
  requestingQuote: string;
  quoteRequestSuccess: string;
  exportRequestCreated: string;
  selectDestinationError: string;
  selectCargoError: string;
  enterWeightError: string;
  selectModeError: string;
  selectDispatchDateError: string;
  germany: string;
  netherlands: string;
  france: string;
  spain: string;
  hamburg: string;
  rotterdam: string;
  marseille: string;
  valencia: string;

  // Bulk Order
  requestBulkSupply: string;
  bulkOrder: string;
  bulkOrderDesc: string;
  produce: string;
  selectProduce: string;
  requiredQuantity: string;
  neededBy: string;
  notesForFarmer: string;
  notesPlaceholder: string;
  sendRequest: string;
  sendingRequest: string;
  bulkRequestSent: string;
  selectProduceError: string;
  enterQuantityError: string;
  selectDateError: string;

  // Farmer Bulk Request Management
  bulkRequests: string;
  incomingBulkRequests: string;
  noBulkRequests: string;
  buyerNameLabel: string;
  requestedProduct: string;
  requestedQuantityLabel: string;
  requiredByDate: string;
  buyerNotes: string;
  acceptRequest: string;
  rejectRequest: string;
  statusPending: string;
  statusAccepted: string;
  statusRejected: string;

  // Buyer Bulk Order Status
  myBulkOrders: string;
  noBulkOrders: string;
  bulkOrderStatus: string;

  // Category Filters
  allCategories: string;
  vegetables: string;
  fruits: string;
  grains: string;
  livestock: string;
}
