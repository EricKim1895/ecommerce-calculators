import { useMemo, useState } from 'react'
import {
  calculateEtsyFees,
  type CostInputMode,
  type EtsyFeeInputs,
  type OffsiteAdsRate,
} from './lib/etsyFees'

interface FormValues {
  itemPrice: string
  shippingCharged: string
  discountValue: string
  discountType: 'amount' | 'percent'
  quantity: string
  productCost: string
  packagingCost: string
  shippingLabelCost: string
  laborCost: string
  otherCost: string
  costInputMode: CostInputMode
  totalSellerCost: string
  offsiteAdsRate: OffsiteAdsRate
  targetMarginPercent: string
}

const defaultFormValues: FormValues = {
  itemPrice: '25',
  shippingCharged: '5',
  discountValue: '0',
  discountType: 'amount',
  quantity: '1',
  productCost: '8',
  packagingCost: '1',
  shippingLabelCost: '4',
  laborCost: '0',
  otherCost: '0',
  costInputMode: 'detailed',
  totalSellerCost: '13',
  offsiteAdsRate: 0,
  targetMarginPercent: '30',
}

const faqItems = [
  {
    question: 'How much does Etsy take from a sale?',
    answer:
      'For US sellers, Etsy commonly charges a listing fee, a transaction fee, and a payment processing fee. Offsite Ads may also apply when an order comes from an eligible ad click.',
  },
  {
    question: "What is Etsy's transaction fee?",
    answer:
      'This calculator estimates the Etsy transaction fee at 6.5% of the order amount, including the item price and shipping charged to the buyer after discounts.',
  },
  {
    question: 'Does Etsy charge fees on shipping?',
    answer:
      'Yes. This calculator applies the transaction fee and payment processing fee to the item price plus shipping charged to the buyer, minus discounts.',
  },
  {
    question: "What is Etsy's payment processing fee in the US?",
    answer:
      'This calculator uses a US payment processing estimate of 3% plus $0.25 per order.',
  },
  {
    question: 'What are Etsy Offsite Ads fees?',
    answer:
      'Offsite Ads fees may apply when a buyer purchases after clicking an Etsy Offsite Ad. This calculator supports no Offsite Ads, 12%, or 15%, capped at $100.',
  },
  {
    question: 'Does this calculator include sales tax?',
    answer:
      'No. This calculator does not include sales tax, VAT, refunds, currency conversion, or account-specific adjustments.',
  },
  {
    question: 'Is this calculator official?',
    answer:
      'No. This is an independent estimate tool and is not affiliated with, endorsed by, or sponsored by Etsy, Inc.',
  },
]

const webApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Free Etsy Fee & Profit Calculator',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description:
    'A free calculator for estimating Etsy fees, net profit, profit margin, break-even price, and target-margin pricing.',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
}

function App() {
  const [formValues, setFormValues] = useState<FormValues>(defaultFormValues)
  const inputs = useMemo<EtsyFeeInputs>(
    () => ({
      itemPrice: parseMoneyInput(formValues.itemPrice),
      shippingCharged: parseMoneyInput(formValues.shippingCharged),
      discountValue: parseMoneyInput(formValues.discountValue),
      discountType: formValues.discountType,
      quantity: parseMoneyInput(formValues.quantity),
      productCost: parseMoneyInput(formValues.productCost),
      packagingCost: parseMoneyInput(formValues.packagingCost),
      shippingLabelCost: parseMoneyInput(formValues.shippingLabelCost),
      laborCost: parseMoneyInput(formValues.laborCost),
      otherCost: parseMoneyInput(formValues.otherCost),
      costInputMode: formValues.costInputMode,
      totalSellerCost: parseMoneyInput(formValues.totalSellerCost),
      offsiteAdsRate: formValues.offsiteAdsRate,
      targetMarginPercent: parseMoneyInput(formValues.targetMarginPercent),
    }),
    [formValues],
  )
  const result = useMemo(() => calculateEtsyFees(inputs), [inputs])
  const formattedNetProfit = formatMoney(result.netProfit)
  const formattedProfitMargin = formatPercent(result.profitMarginPercent)
  const formattedTargetMargin = formatCompactPercent(inputs.targetMarginPercent)

  const updateFormValue = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setFormValues((current) => ({ ...current, [key]: value }))
  }

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(webApplicationJsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>

      <main>
        <section className="tool-hero" aria-labelledby="page-title">
          <div className="eyebrow">Free US seller estimate</div>
          <h1 id="page-title">Free Etsy Fee &amp; Profit Calculator</h1>
          <p className="intro">
            Estimate Etsy fees, net profit, profit margin, break-even price, and the selling
            price you need to reach your target margin.
          </p>

          <div className="calculator-layout">
            <form className="calculator-panel" aria-label="Etsy fee calculator inputs">
              <SectionTitle title="Revenue" />
              <div className="field-grid">
                <MoneyInput
                  label="Item price"
                  value={formValues.itemPrice}
                  onChange={(value) => updateFormValue('itemPrice', value)}
                />
                <MoneyInput
                  label="Shipping charged to buyer"
                  value={formValues.shippingCharged}
                  onChange={(value) => updateFormValue('shippingCharged', value)}
                />
                <NumberInput
                  label="Discount"
                  value={formValues.discountValue}
                  onChange={(value) => updateFormValue('discountValue', value)}
                />
                <label className="field">
                  <span>Discount type</span>
                  <select
                    value={formValues.discountType}
                    onChange={(event) =>
                      updateFormValue(
                        'discountType',
                        event.target.value as FormValues['discountType'],
                      )
                    }
                  >
                    <option value="amount">$ amount</option>
                    <option value="percent">% percent</option>
                  </select>
                </label>
                <NumberInput
                  label="Quantity"
                  min={1}
                  step={1}
                  value={formValues.quantity}
                  onChange={(value) => updateFormValue('quantity', value)}
                />
              </div>

              <SectionTitle title="Costs" />
              <div className="mode-control">
                <span>Cost input mode</span>
                <div className="segmented-control cost-mode" aria-label="Cost input mode">
                  <button
                    type="button"
                    className={formValues.costInputMode === 'detailed' ? 'active' : ''}
                    onClick={() => updateFormValue('costInputMode', 'detailed')}
                  >
                    Detailed costs
                  </button>
                  <button
                    type="button"
                    className={formValues.costInputMode === 'total' ? 'active' : ''}
                    onClick={() => updateFormValue('costInputMode', 'total')}
                  >
                    Total cost only
                  </button>
                </div>
              </div>
              {formValues.costInputMode === 'detailed' ? (
                <>
                  <p className="field-help">
                    Break down your material, packaging, shipping, labor, and other costs.
                  </p>
                  <div className="field-grid">
                    <MoneyInput
                      label="Product/material cost"
                      value={formValues.productCost}
                      onChange={(value) => updateFormValue('productCost', value)}
                    />
                    <MoneyInput
                      label="Packaging cost"
                      value={formValues.packagingCost}
                      onChange={(value) => updateFormValue('packagingCost', value)}
                    />
                    <MoneyInput
                      label="Shipping label cost paid by seller"
                      value={formValues.shippingLabelCost}
                      onChange={(value) => updateFormValue('shippingLabelCost', value)}
                    />
                    <MoneyInput
                      label="Labor cost"
                      value={formValues.laborCost}
                      onChange={(value) => updateFormValue('laborCost', value)}
                    />
                    <MoneyInput
                      label="Other cost"
                      value={formValues.otherCost}
                      onChange={(value) => updateFormValue('otherCost', value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="field-help">
                    Use this if you already know your total cost for this order.
                  </p>
                  <div className="field-grid single">
                    <MoneyInput
                      label="Total seller cost"
                      value={formValues.totalSellerCost}
                      onChange={(value) => updateFormValue('totalSellerCost', value)}
                    />
                  </div>
                </>
              )}

              <SectionTitle title="Etsy fees" />
              <div className="fee-note">
                <strong>Seller country:</strong> United States. Listing fee: $0.20 per item.
                Transaction fee: 6.5%. Payment processing fee: 3% + $0.25.
              </div>
              <div className="segmented-control" aria-label="Offsite Ads">
                {[
                  { label: 'None', value: 0 },
                  { label: '12%', value: 0.12 },
                  { label: '15%', value: 0.15 },
                ].map((option) => (
                  <button
                    type="button"
                    key={option.label}
                    className={formValues.offsiteAdsRate === option.value ? 'active' : ''}
                    onClick={() => updateFormValue('offsiteAdsRate', option.value as OffsiteAdsRate)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <SectionTitle title="Pricing goal" />
              <div className="field-grid single">
                <NumberInput
                  label="Target profit margin %"
                  value={formValues.targetMarginPercent}
                  onChange={(value) => updateFormValue('targetMarginPercent', value)}
                />
              </div>
            </form>

            <aside className="result-panel" aria-label="Estimated Etsy fee results">
              <div className="result-header">
                <span>Estimated results</span>
                <strong>{formattedNetProfit}</strong>
              </div>
              <p className="result-summary">
                At this price, your estimated net profit is {formattedNetProfit}, which equals a{' '}
                {formattedProfitMargin} profit margin.
              </p>
              {result.netProfit < 0 && (
                <p className="alert danger">
                  This sale may lose money after Etsy fees and your costs.
                </p>
              )}
              {result.netProfit >= 0 &&
                result.profitMarginPercent > 0 &&
                result.profitMarginPercent < 20 && (
                  <p className="alert warning">
                    Your margin looks low. Consider increasing your price or reducing costs.
                  </p>
                )}

              <div className="metric-grid">
                <Metric label="Gross revenue" value={formatMoney(result.grossOrderAmount)} />
                <Metric label="Total Etsy fees" value={formatMoney(result.totalEtsyFees)} />
                <Metric label="Total costs" value={formatMoney(result.totalCosts)} />
                <Metric label="Net profit" value={formattedNetProfit} />
                <Metric label="Profit margin" value={formattedProfitMargin} />
                <Metric label="Break-even price" value={formatMoney(result.breakEvenPrice)} />
                <Metric
                  label={`Price for ${formattedTargetMargin} target margin`}
                  value={formatMoney(result.suggestedPriceForTargetMargin)}
                />
              </div>

              <h2 className="breakdown-title">Detailed fee breakdown</h2>
              <div className="breakdown-groups">
                <Breakdown
                  title="Etsy fees"
                  variant="fees"
                  rows={[
                    ['Listing fee', result.listingFee],
                    ['Transaction fee', result.transactionFee],
                    ['Payment processing fee', result.paymentProcessingFee],
                    ['Offsite Ads fee', result.offsiteAdsFee],
                    ['Total Etsy fees', result.totalEtsyFees, true],
                  ]}
                />
                <Breakdown
                  title="Seller costs"
                  variant="costs"
                  rows={
                    inputs.costInputMode === 'total'
                      ? [
                          ['Seller-entered total cost', inputs.totalSellerCost],
                          ['Total costs', result.totalCosts, true],
                        ]
                      : [
                          ['Product/material cost', inputs.quantity * Math.max(0, inputs.productCost)],
                          ['Packaging cost', inputs.quantity * Math.max(0, inputs.packagingCost)],
                          ['Shipping label cost', Math.max(0, inputs.shippingLabelCost)],
                          ['Labor cost', inputs.quantity * Math.max(0, inputs.laborCost)],
                          ['Other cost', inputs.quantity * Math.max(0, inputs.otherCost)],
                          ['Total costs', result.totalCosts, true],
                        ]
                  }
                />
              </div>
            </aside>
          </div>
        </section>

        <ContentSections />
      </main>
    </>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="section-title">{title}</h2>
}

function MoneyInput(props: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return <NumberInput {...props} prefix="$" />
}

function NumberInput({
  label,
  value,
  onChange,
  prefix,
  min = 0,
  step = 0.01,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  prefix?: string
  min?: number
  step?: number
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-shell">
        {prefix && <span>{prefix}</span>}
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode="decimal"
        />
      </div>
    </label>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function Breakdown({
  title,
  variant,
  rows,
}: {
  title: string
  variant: 'fees' | 'costs'
  rows: Array<[string, number, boolean?]>
}) {
  return (
    <section className={`breakdown-section ${variant}`} aria-labelledby={`${variant}-breakdown`}>
      <h3 id={`${variant}-breakdown`}>{title}</h3>
      <dl className="breakdown">
        {rows.map(([label, value, isTotal]) => (
          <div key={label} className={isTotal ? 'total-row' : undefined}>
            <dt>{label}</dt>
            <dd>{formatMoney(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function ContentSections() {
  return (
    <section className="content">
      <h2>How this Etsy fee calculator works</h2>
      <p>
        Enter your item price, buyer-paid shipping, discounts, quantity, product costs, shipping
        label cost, and optional Offsite Ads rate. The calculator estimates order revenue, Etsy
        fees, costs, net profit, margin, break-even price, and the price needed for your target
        margin.
      </p>
      <p>
        It combines revenue, Etsy fees, seller costs, and your target margin in one estimate, so
        you can see both current profit and the price needed to reach a specific margin goal.
      </p>

      <h2>Etsy fees included in this calculator</h2>
      <h3>Listing fee</h3>
      <p>The estimate includes a $0.20 listing fee per item sold.</p>
      <h3>Transaction fee</h3>
      <p>
        The transaction fee is estimated at 6.5% of the order amount after discounts, including
        shipping charged to the buyer.
      </p>
      <h3>Payment processing fee</h3>
      <p>
        For US sellers, this calculator estimates payment processing at 3% of the order amount
        plus $0.25 per order.
      </p>
      <h3>Offsite Ads fee</h3>
      <p>
        You can choose no Offsite Ads fee, 12%, or 15%. The estimated Offsite Ads fee is capped at
        $100.
      </p>

      <h2>How to calculate Etsy profit</h2>
      <p>
        Etsy profit = gross order amount - Etsy fees - seller costs. Gross order amount includes
        the item price and shipping charged to the buyer after discounts. Etsy fees include the
        listing fee, transaction fee, payment processing fee, and optional Offsite Ads fee. Seller
        costs include product/material cost, packaging, shipping label, labor, and other costs.
      </p>

      <h2>How to price Etsy products for profit</h2>
      <p>
        A profitable Etsy price should cover platform fees, payment fees, shipping label cost,
        materials, packaging, labor, and a margin target that leaves room for refunds or future
        cost changes.
      </p>
      <p>
        Break-even price is the lowest item price where estimated profit is zero or higher. Target
        margin price is the estimated item price needed to reach the profit margin you enter.
      </p>

      <h2>Example Etsy fee calculation</h2>
      <p>
        With a $25 item, $5 shipping charged to the buyer, $8 product cost, $1 packaging, and a $4
        shipping label, this calculator estimates the fees and shows whether your target margin is
        reachable at the current price.
      </p>
      <p>
        Example inputs: item price $25, shipping charged to buyer $5, product/material cost $8,
        packaging cost $1, shipping label cost $4, and Offsite Ads set to none.
      </p>
      <dl className="example-breakdown">
        <div>
          <dt>Gross revenue</dt>
          <dd>$30.00</dd>
        </div>
        <div>
          <dt>Listing fee</dt>
          <dd>$0.20</dd>
        </div>
        <div>
          <dt>Transaction fee</dt>
          <dd>$1.95</dd>
        </div>
        <div>
          <dt>Payment processing fee</dt>
          <dd>$1.15</dd>
        </div>
        <div>
          <dt>Total Etsy fees</dt>
          <dd>$3.30</dd>
        </div>
        <div>
          <dt>Total costs</dt>
          <dd>$13.00</dd>
        </div>
        <div>
          <dt>Estimated net profit</dt>
          <dd>$13.70</dd>
        </div>
        <div>
          <dt>Profit margin</dt>
          <dd>45.67%</dd>
        </div>
      </dl>

      <h2>Frequently asked questions</h2>
      <div className="faq-list">
        {faqItems.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>

      <p className="disclaimer">
        This calculator provides estimates based on publicly available Etsy fee information. It is
        not affiliated with, endorsed by, or sponsored by Etsy, Inc. Etsy fees may change, and
        actual fees can vary by country, tax rules, currency, refunds, ads, and other
        account-specific factors.
      </p>
    </section>
  )
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)

const formatPercent = (value: number) =>
  `${(Number.isFinite(value) ? value : 0).toFixed(2)}%`

function parseMoneyInput(value: string): number {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return parsed
}

const formatCompactPercent = (value: number) => {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0
  return `${Number.isInteger(safeValue) ? safeValue.toFixed(0) : safeValue.toFixed(2)}%`
}

export default App
