/**
 * Centralized Dynamic Mandi-Price-Optimized Quality Pricing Engine
 * Uzhavan Bazzar
 *
 * Implements strict Grade A, B, C pricing optimization:
 * - Grade A: BASE PRICE - ₹5 to BASE PRICE (e.g. ₹55 -> ₹50–₹55/kg)
 * - Grade B: BASE PRICE - ₹10 to BASE PRICE - ₹3 (e.g. ₹55 -> ₹45–₹52/kg)
 * - Grade C: Below BASE PRICE - ₹10 (e.g. ₹55 -> Below ₹45/kg)
 *
 * Supports product-specific overrides with default fallback.
 * Strictly outputs only Grade A, B, or C.
 */

export type QualityGrade = 'A' | 'B' | 'C';

export interface PricingOffsets {
  minOffset?: number;
  maxOffset: number;
}

export interface ProductPricingRule {
  A: PricingOffsets;
  B: PricingOffsets;
  C: PricingOffsets;
}

export const QUALITY_PRICING_RULES: Record<string, ProductPricingRule> = {
  default: {
    A: { minOffset: -5, maxOffset: 0 },
    B: { minOffset: -10, maxOffset: -3 },
    C: { maxOffset: -10 },
  },
  tomato: {
    A: { minOffset: -5, maxOffset: 0 },
    B: { minOffset: -10, maxOffset: -3 },
    C: { maxOffset: -10 },
  },
  onion: {
    A: { minOffset: -5, maxOffset: 0 },
    B: { minOffset: -10, maxOffset: -3 },
    C: { maxOffset: -10 },
  },
  potato: {
    A: { minOffset: -5, maxOffset: 0 },
    B: { minOffset: -10, maxOffset: -3 },
    C: { maxOffset: -10 },
  },
};

export interface RecommendedPriceResult {
  product: string;
  grade: QualityGrade;
  basePrice: number;
  minPrice?: number;
  maxPrice: number;
  displayPrice: string;
  isOpenEnded: boolean;
  pricingRuleUsed: string;
  explanation: string;
}

export interface EstimatedTotalResult {
  quantityKg: number;
  minTotal?: number;
  maxTotal: number;
  displayTotal: string;
  isUpperBound: boolean;
  label: string;
}

/**
 * Calculates recommended selling price based on current Mandi price and AI quality grade.
 * Strictly outputs Grade A, Grade B, or Grade C.
 */
export function calculateRecommendedPrice(
  product: string,
  mandiPrice: number,
  grade: string
): RecommendedPriceResult {
  const normGrade = (grade || 'C').toUpperCase().trim() as QualityGrade;
  const validGrade: QualityGrade = ['A', 'B', 'C'].includes(normGrade) ? normGrade : 'C';

  const productKey = (product || 'default').toLowerCase().replace(/\s+/g, '_');
  const ruleSet = QUALITY_PRICING_RULES[productKey] || QUALITY_PRICING_RULES.default;
  const rule = ruleSet[validGrade] || QUALITY_PRICING_RULES.default[validGrade];
  const ruleSource = QUALITY_PRICING_RULES[productKey] ? productKey : 'default';

  const base = Math.max(1, Number(mandiPrice) || 0);

  if (validGrade === 'A') {
    const minOffset = rule.minOffset ?? -5;
    const maxOffset = rule.maxOffset ?? 0;
    const minPrice = Math.max(1, Math.round((base + minOffset) * 10) / 10);
    const maxPrice = Math.max(minPrice, Math.round((base + maxOffset) * 10) / 10);
    const displayPrice = `₹${minPrice}–₹${maxPrice}/kg`;

    return {
      product,
      grade: 'A',
      basePrice: base,
      minPrice,
      maxPrice,
      displayPrice,
      isOpenEnded: false,
      pricingRuleUsed: `${ruleSource}.A`,
      explanation: 'This recommendation is based on the current market price and AI quality grade.',
    };
  }

  if (validGrade === 'B') {
    const minOffset = rule.minOffset ?? -10;
    const maxOffset = rule.maxOffset ?? -3;
    const minPrice = Math.max(1, Math.round((base + minOffset) * 10) / 10);
    const maxPrice = Math.max(minPrice, Math.round((base + maxOffset) * 10) / 10);
    const displayPrice = `₹${minPrice}–₹${maxPrice}/kg`;

    return {
      product,
      grade: 'B',
      basePrice: base,
      minPrice,
      maxPrice,
      displayPrice,
      isOpenEnded: false,
      pricingRuleUsed: `${ruleSource}.B`,
      explanation: 'This recommendation is based on the current market price and AI quality grade.',
    };
  }

  // Grade C: Below BASE PRICE - ₹10 (NO fake minimum price)
  const maxOffset = rule.maxOffset ?? -10;
  const maxPrice = Math.max(1, Math.round((base + maxOffset) * 10) / 10);
  const displayPrice = `Below ₹${maxPrice}/kg`;

  return {
    product,
    grade: 'C',
    basePrice: base,
    maxPrice,
    displayPrice,
    isOpenEnded: true,
    pricingRuleUsed: `${ruleSource}.C`,
    explanation: 'This recommendation is based on the current market price and AI quality grade.',
  };
}

/**
 * Calculates estimated total gross selling value for farmer's inventory quantity.
 * For Grade A & B: Range (minTotal to maxTotal)
 * For Grade C: Upper-bound estimate ("Below ₹X for Y kg")
 */
export function calculateEstimatedTotal(
  quantityKg: number,
  recommended: RecommendedPriceResult
): EstimatedTotalResult {
  const qty = Math.max(0, Number(quantityKg) || 0);

  if (recommended.grade === 'C' || recommended.isOpenEnded || recommended.minPrice === undefined) {
    const maxTotal = Math.round(qty * recommended.maxPrice);
    return {
      quantityKg: qty,
      maxTotal,
      displayTotal: `Below ₹${maxTotal.toLocaleString('en-IN')} for ${qty} kg`,
      isUpperBound: true,
      label: 'Upper-bound Estimated Value',
    };
  }

  const minTotal = Math.round(qty * recommended.minPrice);
  const maxTotal = Math.round(qty * recommended.maxPrice);
  return {
    quantityKg: qty,
    minTotal,
    maxTotal,
    displayTotal: `₹${minTotal.toLocaleString('en-IN')}–₹${maxTotal.toLocaleString('en-IN')}`,
    isUpperBound: false,
    label: 'Estimated Selling Value',
  };
}
