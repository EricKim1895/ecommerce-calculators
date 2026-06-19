export type OffsiteAdsRate = 0 | 0.12 | 0.15
export type CostInputMode = 'detailed' | 'total'

export interface EtsyFeeInputs {
  itemPrice: number
  quantity: number
  shippingCharged: number
  discountValue: number
  discountType: 'amount' | 'percent'
  productCost: number
  packagingCost: number
  shippingLabelCost: number
  laborCost: number
  otherCost: number
  costInputMode: CostInputMode
  totalSellerCost: number
  offsiteAdsRate: OffsiteAdsRate
  targetMarginPercent: number
}

export interface EtsyFeeResult {
  itemRevenue: number
  grossOrderAmount: number
  discountAmount: number
  listingFee: number
  transactionFee: number
  paymentProcessingFee: number
  offsiteAdsFee: number
  totalEtsyFees: number
  totalCosts: number
  netProfit: number
  profitMarginPercent: number
  breakEvenPrice: number
  suggestedPriceForTargetMargin: number
}

export const ETSY_FEE_CONFIG = {
  listingFeePerItem: 0.2,
  transactionRate: 0.065,
  paymentProcessingRateUS: 0.03,
  paymentProcessingFixedUS: 0.25,
  offsiteAdsCap: 100,
}

export function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function ceilToCents(value: number): number {
  return Math.ceil((value - Number.EPSILON) * 100) / 100
}

const clampNumber = (value: number, fallback = 0) => {
  if (!Number.isFinite(value)) return fallback
  return Math.max(0, value)
}

export const sanitizeInputs = (inputs: EtsyFeeInputs): EtsyFeeInputs => ({
  ...inputs,
  itemPrice: clampNumber(inputs.itemPrice),
  quantity: Math.max(1, Math.floor(clampNumber(inputs.quantity, 1))),
  shippingCharged: clampNumber(inputs.shippingCharged),
  discountValue: clampNumber(inputs.discountValue),
  productCost: clampNumber(inputs.productCost),
  packagingCost: clampNumber(inputs.packagingCost),
  shippingLabelCost: clampNumber(inputs.shippingLabelCost),
  laborCost: clampNumber(inputs.laborCost),
  otherCost: clampNumber(inputs.otherCost),
  costInputMode: inputs.costInputMode === 'total' ? 'total' : 'detailed',
  totalSellerCost: clampNumber(inputs.totalSellerCost),
  targetMarginPercent: Math.min(95, clampNumber(inputs.targetMarginPercent)),
})

const calculateWithoutDerivedPrices = (rawInputs: EtsyFeeInputs) => {
  const inputs = sanitizeInputs(rawInputs)
  const itemRevenue = roundToCents(inputs.itemPrice * inputs.quantity)
  const shippingCharged = roundToCents(inputs.shippingCharged)
  const discountBase = roundToCents(itemRevenue + shippingCharged)
  const rawDiscount =
    inputs.discountType === 'percent'
      ? discountBase * (Math.min(inputs.discountValue, 100) / 100)
      : inputs.discountValue
  const discountAmount = roundToCents(Math.min(discountBase, rawDiscount))
  const grossOrderAmount = roundToCents(
    Math.max(0, itemRevenue + shippingCharged - discountAmount),
  )
  const listingFee = roundToCents(ETSY_FEE_CONFIG.listingFeePerItem * inputs.quantity)
  const transactionFee = roundToCents(grossOrderAmount * ETSY_FEE_CONFIG.transactionRate)
  const paymentProcessingFee =
    grossOrderAmount > 0
      ? roundToCents(
          grossOrderAmount * ETSY_FEE_CONFIG.paymentProcessingRateUS +
            ETSY_FEE_CONFIG.paymentProcessingFixedUS,
        )
      : 0
  const offsiteAdsFee = roundToCents(
    Math.min(grossOrderAmount * inputs.offsiteAdsRate, ETSY_FEE_CONFIG.offsiteAdsCap),
  )
  const totalEtsyFees = roundToCents(
    listingFee + transactionFee + paymentProcessingFee + offsiteAdsFee,
  )
  const totalCosts =
    inputs.costInputMode === 'total'
      ? roundToCents(inputs.totalSellerCost)
      : roundToCents(
          inputs.quantity *
            (inputs.productCost + inputs.packagingCost + inputs.laborCost + inputs.otherCost) +
            inputs.shippingLabelCost,
        )
  const netProfit = roundToCents(grossOrderAmount - totalEtsyFees - totalCosts)
  const profitMarginPercent =
    grossOrderAmount > 0 ? roundToCents((netProfit / grossOrderAmount) * 100) : 0

  return {
    itemRevenue,
    grossOrderAmount,
    discountAmount,
    listingFee,
    transactionFee,
    paymentProcessingFee,
    offsiteAdsFee,
    totalEtsyFees,
    totalCosts,
    netProfit,
    profitMarginPercent,
  }
}

export const calculateEtsyFees = (inputs: EtsyFeeInputs): EtsyFeeResult => {
  const result = calculateWithoutDerivedPrices(inputs)

  return {
    ...result,
    breakEvenPrice: findBreakEvenPrice(inputs),
    suggestedPriceForTargetMargin: findPriceForTargetMargin(inputs, inputs.targetMarginPercent),
  }
}

export const findBreakEvenPrice = (inputs: EtsyFeeInputs) =>
  ceilToCents(findLowestPrice(inputs, (result) => result.netProfit >= 0))

export const findPriceForTargetMargin = (inputs: EtsyFeeInputs, targetMarginPercent: number) =>
  ceilToCents(
    findLowestPrice(
      inputs,
      (result) => result.profitMarginPercent >= roundToCents(clampNumber(targetMarginPercent)),
    ),
  )

const findLowestPrice = (
  inputs: EtsyFeeInputs,
  predicate: (result: ReturnType<typeof calculateWithoutDerivedPrices>) => boolean,
) => {
  let low = 0
  let high = 10000

  for (let i = 0; i < 100; i += 1) {
    const mid = (low + high) / 2
    const result = calculateWithoutDerivedPrices({ ...inputs, itemPrice: mid })

    if (predicate(result)) {
      high = mid
    } else {
      low = mid
    }
  }

  return high
}
