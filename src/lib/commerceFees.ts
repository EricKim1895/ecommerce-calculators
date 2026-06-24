import { ceilToCents, roundToCents } from './etsyFees'

export interface MarketplaceFeeInputs {
  itemPrice: number
  quantity: number
  shippingCharged: number
  discountValue: number
  productCost: number
  shippingCost: number
  packagingCost: number
  otherCost: number
  targetMarginPercent: number
  percentFees: Array<{ label: string; ratePercent: number; base?: 'gross' | 'item' }>
  fixedFees: Array<{ label: string; amount: number; mode?: 'order' | 'unit' }>
}

export interface MarketplaceFeeResult {
  itemRevenue: number
  grossOrderAmount: number
  discountAmount: number
  totalFees: number
  totalCosts: number
  netProfit: number
  profitMarginPercent: number
  breakEvenPrice: number
  suggestedPriceForTargetMargin: number
  feeRows: Array<[string, number, boolean?]>
  costRows: Array<[string, number, boolean?]>
}

const clampNumber = (value: number, fallback = 0) => {
  if (!Number.isFinite(value)) return fallback
  return Math.max(0, value)
}

export const sanitizeMarketplaceInputs = (inputs: MarketplaceFeeInputs): MarketplaceFeeInputs => ({
  ...inputs,
  itemPrice: clampNumber(inputs.itemPrice),
  quantity: Math.max(1, Math.floor(clampNumber(inputs.quantity, 1))),
  shippingCharged: clampNumber(inputs.shippingCharged),
  discountValue: clampNumber(inputs.discountValue),
  productCost: clampNumber(inputs.productCost),
  shippingCost: clampNumber(inputs.shippingCost),
  packagingCost: clampNumber(inputs.packagingCost),
  otherCost: clampNumber(inputs.otherCost),
  targetMarginPercent: Math.min(95, clampNumber(inputs.targetMarginPercent)),
  percentFees: inputs.percentFees.map((fee) => ({
    ...fee,
    ratePercent: clampNumber(fee.ratePercent),
  })),
  fixedFees: inputs.fixedFees.map((fee) => ({
    ...fee,
    amount: clampNumber(fee.amount),
  })),
})

const calculateWithoutDerivedPrices = (rawInputs: MarketplaceFeeInputs) => {
  const inputs = sanitizeMarketplaceInputs(rawInputs)
  const itemRevenue = roundToCents(inputs.itemPrice * inputs.quantity)
  const grossBeforeDiscount = roundToCents(itemRevenue + inputs.shippingCharged)
  const discountAmount = roundToCents(Math.min(grossBeforeDiscount, inputs.discountValue))
  const grossOrderAmount = roundToCents(Math.max(0, grossBeforeDiscount - discountAmount))

  const percentRows = inputs.percentFees.map((fee) => {
    const base = fee.base === 'item' ? itemRevenue : grossOrderAmount
    return [fee.label, roundToCents(base * (fee.ratePercent / 100))] as [string, number]
  })
  const fixedRows = inputs.fixedFees.map((fee) => [
    fee.label,
    roundToCents(fee.amount * (fee.mode === 'unit' ? inputs.quantity : 1)),
  ]) as Array<[string, number]>
  const feeRows = [...percentRows, ...fixedRows]
  const totalFees = roundToCents(feeRows.reduce((total, [, value]) => total + value, 0))

  const productCost = roundToCents(inputs.productCost * inputs.quantity)
  const packagingCost = roundToCents(inputs.packagingCost * inputs.quantity)
  const shippingCost = roundToCents(inputs.shippingCost)
  const otherCost = roundToCents(inputs.otherCost)
  const costRows: Array<[string, number, boolean?]> = [
    ['Product cost', productCost],
    ['Packaging cost', packagingCost],
    ['Shipping or fulfillment cost', shippingCost],
    ['Other cost', otherCost],
  ]
  const totalCosts = roundToCents(productCost + packagingCost + shippingCost + otherCost)
  const netProfit = roundToCents(grossOrderAmount - totalFees - totalCosts)
  const profitMarginPercent =
    grossOrderAmount > 0 ? roundToCents((netProfit / grossOrderAmount) * 100) : 0

  return {
    itemRevenue,
    grossOrderAmount,
    discountAmount,
    totalFees,
    totalCosts,
    netProfit,
    profitMarginPercent,
    feeRows: [...feeRows, ['Total fees', totalFees, true]] as Array<[string, number, boolean?]>,
    costRows: [...costRows, ['Total costs', totalCosts, true]] as Array<[string, number, boolean?]>,
  }
}

export const calculateMarketplaceFees = (inputs: MarketplaceFeeInputs): MarketplaceFeeResult => {
  const result = calculateWithoutDerivedPrices(inputs)

  return {
    ...result,
    breakEvenPrice: findBreakEvenPrice(inputs),
    suggestedPriceForTargetMargin: findPriceForTargetMargin(inputs, inputs.targetMarginPercent),
  }
}

const findBreakEvenPrice = (inputs: MarketplaceFeeInputs) =>
  ceilToCents(findLowestPrice(inputs, (result) => result.netProfit >= 0))

const findPriceForTargetMargin = (inputs: MarketplaceFeeInputs, targetMarginPercent: number) =>
  ceilToCents(
    findLowestPrice(
      inputs,
      (result) => result.profitMarginPercent >= roundToCents(clampNumber(targetMarginPercent)),
    ),
  )

const findLowestPrice = (
  inputs: MarketplaceFeeInputs,
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
