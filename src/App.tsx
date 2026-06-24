import { useEffect, useMemo, useState } from 'react'
import {
  calculateMarketplaceFees,
  type MarketplaceFeeInputs,
  type MarketplaceFeeResult,
} from './lib/commerceFees'
import {
  calculateEtsyFees,
  type CostInputMode,
  type EtsyFeeInputs,
  type EtsyFeeResult,
  type OffsiteAdsRate,
} from './lib/etsyFees'

const siteOrigin = 'https://ecommerce-calculators-eta.vercel.app'

const tools = [
  {
    name: 'Etsy',
    title: 'Etsy Fee & Profit Calculator',
    path: '/etsy-fee-calculator',
    description: 'Estimate Etsy listing, transaction, payment processing, and Offsite Ads fees.',
  },
  {
    name: 'eBay',
    title: 'eBay Fee Calculator',
    path: '/ebay-fee-calculator',
    description: 'Estimate eBay final value fees, promoted listing costs, and seller profit.',
  },
  {
    name: 'PayPal',
    title: 'PayPal Fee Calculator',
    path: '/paypal-fee-calculator',
    description: 'Estimate PayPal payment fees and net receipts for US business transactions.',
  },
  {
    name: 'Shopify',
    title: 'Shopify Profit Calculator',
    path: '/shopify-profit-calculator',
    description: 'Estimate Shopify payment fees, transaction fees, product costs, and margin.',
  },
  {
    name: 'Amazon FBA',
    title: 'Amazon FBA Calculator',
    path: '/amazon-fba-calculator',
    description: 'Estimate Amazon referral fees, FBA fulfillment fees, landed costs, and profit.',
  },
  {
    name: 'TikTok Shop',
    title: 'TikTok Shop Fee Calculator',
    path: '/tiktok-shop-fee-calculator',
    description: 'Estimate TikTok Shop referral fees, creator commission, costs, and net profit.',
  },
] as const

type ToolPath = (typeof tools)[number]['path']
type DiscountType = 'amount' | 'percent'

interface EtsyFormValues {
  itemPrice: string
  shippingCharged: string
  discountValue: string
  discountType: DiscountType
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

interface GenericFormValues {
  itemPrice: string
  shippingCharged: string
  discountValue: string
  discountType: DiscountType
  quantity: string
  productCost: string
  packagingCost: string
  shippingCost: string
  otherCost: string
  primaryRatePercent: string
  secondaryRatePercent: string
  fixedFee: string
  perUnitFee: string
  targetMarginPercent: string
}

interface GenericCalculatorConfig {
  platformName: string
  title: string
  eyebrow: string
  intro: string
  ariaLabel: string
  primaryFeeLabel: string
  secondaryFeeLabel: string
  fixedFeeLabel: string
  perUnitFeeLabel: string
  shippingCostLabel: string
  otherCostLabel: string
  defaultValues: GenericFormValues
  note: string
  content: {
    howItWorks: string
    feesIncluded: Array<{ title: string; body: string }>
    faq: Array<{ question: string; answer: string }>
    disclaimer: string
  }
}

const defaultEtsyFormValues: EtsyFormValues = {
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

const genericCalculatorConfigs: Record<Exclude<ToolPath, '/etsy-fee-calculator'>, GenericCalculatorConfig> = {
  '/ebay-fee-calculator': {
    platformName: 'eBay',
    title: 'Free eBay Fee & Profit Calculator',
    eyebrow: 'Free US seller estimate',
    intro:
      'Estimate eBay final value fees, promoted listing fees, fixed order fees, net profit, break-even price, and target-margin pricing.',
    ariaLabel: 'eBay fee calculator inputs',
    primaryFeeLabel: 'Final value fee %',
    secondaryFeeLabel: 'Promoted listing ad fee %',
    fixedFeeLabel: 'Fixed order fee',
    perUnitFeeLabel: 'Insertion fee per item',
    shippingCostLabel: 'Shipping label cost paid by seller',
    otherCostLabel: 'Other marketplace or handling cost',
    defaultValues: makeGenericDefaults({
      itemPrice: '35',
      shippingCharged: '6',
      productCost: '12',
      packagingCost: '1',
      shippingCost: '5',
      primaryRatePercent: '13.25',
      secondaryRatePercent: '0',
      fixedFee: '0.40',
      perUnitFee: '0',
      targetMarginPercent: '30',
    }),
    note:
      'US estimate. Default final value fee is a common eBay category-style estimate. eBay fees vary by category, seller status, order value, and optional ads, so every fee field is editable.',
    content: {
      howItWorks:
        'Enter the selling price, buyer-paid shipping, discounts, quantity, seller costs, and editable eBay fee rates. The calculator estimates gross order amount, eBay fees, costs, net profit, margin, break-even price, and the price needed for your target margin.',
      feesIncluded: [
        {
          title: 'Final value fee',
          body: 'The default final value fee is an editable percentage of the order amount. eBay category rates vary, so adjust this field for your listing category.',
        },
        {
          title: 'Promoted listing fee',
          body: 'Use the promoted listing field when an order is attributed to an ad campaign. Leave it at 0% when ads do not apply.',
        },
        {
          title: 'Fixed order and insertion fees',
          body: 'The fixed order fee and insertion fee fields let you model per-order and per-item charges separately.',
        },
      ],
      faq: [
        {
          question: 'Are eBay fees the same for every category?',
          answer:
            'No. eBay final value fees vary by category, order value, seller status, and optional listing upgrades. This calculator uses editable defaults for US estimates.',
        },
        {
          question: 'Does this include promoted listings?',
          answer:
            'Yes. Add your promoted listing ad rate in the ad fee field, or leave it at 0% if the sale was not attributed to an ad.',
        },
      ],
      disclaimer:
        'This is an independent estimate tool and is not affiliated with, endorsed by, or sponsored by eBay Inc. Actual fees can vary by category, account, taxes, refunds, and promotions.',
    },
  },
  '/paypal-fee-calculator': {
    platformName: 'PayPal',
    title: 'Free PayPal Fee Calculator',
    eyebrow: 'Free US payment estimate',
    intro:
      'Estimate PayPal payment processing fees, fixed transaction fees, net receipts, and profit after product or service costs.',
    ariaLabel: 'PayPal fee calculator inputs',
    primaryFeeLabel: 'PayPal percentage fee %',
    secondaryFeeLabel: 'Additional fee %',
    fixedFeeLabel: 'Fixed transaction fee',
    perUnitFeeLabel: 'Per-item service fee',
    shippingCostLabel: 'Delivery or service cost',
    otherCostLabel: 'Other cost',
    defaultValues: makeGenericDefaults({
      itemPrice: '100',
      shippingCharged: '0',
      productCost: '0',
      packagingCost: '0',
      shippingCost: '0',
      primaryRatePercent: '3.49',
      secondaryRatePercent: '0',
      fixedFee: '0.49',
      perUnitFee: '0',
      targetMarginPercent: '80',
    }),
    note:
      'US business estimate. The default resembles a common PayPal checkout-style online transaction rate. PayPal rates vary by product, payment method, currency, and account, so fee fields are editable.',
    content: {
      howItWorks:
        'Enter the transaction amount, optional shipping charged, costs, PayPal percentage fee, and fixed transaction fee. The calculator estimates payment fees, net receipts, profit margin, and target pricing.',
      feesIncluded: [
        {
          title: 'Percentage payment fee',
          body: 'The percentage fee applies to the gross transaction amount after discounts.',
        },
        {
          title: 'Fixed transaction fee',
          body: 'The fixed fee is charged once per transaction in this estimate.',
        },
      ],
      faq: [
        {
          question: 'Why is the PayPal rate editable?',
          answer:
            'PayPal has different fee schedules for checkout products, cards, QR codes, international payments, and currencies. Editable rates keep the calculator useful across scenarios.',
        },
        {
          question: 'Can I calculate how much to charge to receive a target margin?',
          answer:
            'Yes. The result panel includes a target-margin price based on the percentage and fixed fees entered.',
        },
      ],
      disclaimer:
        'This is an independent estimate tool and is not affiliated with, endorsed by, or sponsored by PayPal. Actual fees can vary by account, product, country, currency, and payment method.',
    },
  },
  '/shopify-profit-calculator': {
    platformName: 'Shopify',
    title: 'Free Shopify Profit Calculator',
    eyebrow: 'Free US store estimate',
    intro:
      'Estimate Shopify payment fees, third-party transaction fees, product costs, shipping costs, net profit, and target pricing.',
    ariaLabel: 'Shopify profit calculator inputs',
    primaryFeeLabel: 'Online payment fee %',
    secondaryFeeLabel: 'Third-party transaction fee %',
    fixedFeeLabel: 'Fixed payment fee',
    perUnitFeeLabel: 'App or handling fee per item',
    shippingCostLabel: 'Shipping label or fulfillment cost',
    otherCostLabel: 'Other store cost',
    defaultValues: makeGenericDefaults({
      itemPrice: '45',
      shippingCharged: '5',
      productCost: '16',
      packagingCost: '1.5',
      shippingCost: '6',
      primaryRatePercent: '2.9',
      secondaryRatePercent: '0',
      fixedFee: '0.30',
      perUnitFee: '0',
      targetMarginPercent: '35',
    }),
    note:
      'US estimate. Defaults resemble common online card processing economics. Shopify rates vary by plan and payment provider, so payment and transaction fee fields are editable.',
    content: {
      howItWorks:
        'Enter item revenue, shipping charged, discounts, product costs, shipping label cost, and editable Shopify-related fee rates. The calculator estimates order profit, margin, break-even price, and target-margin price.',
      feesIncluded: [
        {
          title: 'Online payment fee',
          body: 'Use this field for Shopify Payments or your processor percentage fee.',
        },
        {
          title: 'Third-party transaction fee',
          body: 'Use this field when your Shopify plan charges an additional fee for an external payment provider.',
        },
        {
          title: 'Fixed and app fees',
          body: 'Fixed payment fees and per-item app or handling fees can be modeled separately.',
        },
      ],
      faq: [
        {
          question: 'Does this include Shopify subscription cost?',
          answer:
            'No. This calculator focuses on per-order profit. You can add a per-order allocation of subscription or app costs in the other cost field.',
        },
        {
          question: 'Which Shopify plan does this use?',
          answer:
            'The defaults are editable estimates. Enter the payment and transaction rates from your specific Shopify plan for better results.',
        },
      ],
      disclaimer:
        'This is an independent estimate tool and is not affiliated with, endorsed by, or sponsored by Shopify. Actual costs can vary by plan, app stack, provider, country, currency, and tax handling.',
    },
  },
  '/amazon-fba-calculator': {
    platformName: 'Amazon FBA',
    title: 'Free Amazon FBA Calculator',
    eyebrow: 'Free US FBA estimate',
    intro:
      'Estimate Amazon referral fees, FBA fulfillment fees, inbound or storage costs, net profit, break-even price, and target pricing.',
    ariaLabel: 'Amazon FBA calculator inputs',
    primaryFeeLabel: 'Referral fee %',
    secondaryFeeLabel: 'Closing or variable fee %',
    fixedFeeLabel: 'FBA fulfillment fee',
    perUnitFeeLabel: 'Other Amazon fee per unit',
    shippingCostLabel: 'Inbound, storage, or prep cost',
    otherCostLabel: 'Other landed cost',
    defaultValues: makeGenericDefaults({
      itemPrice: '29.99',
      shippingCharged: '0',
      productCost: '8',
      packagingCost: '0.75',
      shippingCost: '2',
      primaryRatePercent: '15',
      secondaryRatePercent: '0',
      fixedFee: '4.75',
      perUnitFee: '0',
      targetMarginPercent: '30',
    }),
    note:
      'US FBA estimate. Amazon referral fees and FBA fulfillment fees vary by category, size tier, weight, season, and program. Enter your actual FBA fee from Seller Central for best results.',
    content: {
      howItWorks:
        'Enter item price, product cost, prep or inbound cost, referral fee percentage, and FBA fulfillment fee. The calculator estimates Amazon fees, total landed costs, profit, margin, break-even price, and target pricing.',
      feesIncluded: [
        {
          title: 'Referral fee',
          body: 'The referral fee is modeled as an editable percentage of gross order amount.',
        },
        {
          title: 'FBA fulfillment fee',
          body: 'The fulfillment fee is modeled as a fixed per-order amount. Use Amazon Seller Central for the exact size and weight tier fee.',
        },
        {
          title: 'Inbound and storage costs',
          body: 'Use the inbound, storage, or prep cost field for per-order allocation of extra FBA costs.',
        },
      ],
      faq: [
        {
          question: 'Does this calculate Amazon size tiers automatically?',
          answer:
            'No. Version 1 keeps FBA fulfillment fee editable because size tier, weight, dangerous goods status, and seasonal changes affect the exact fee.',
        },
        {
          question: 'Does this include storage fees?',
          answer:
            'Storage is not calculated automatically. Add a per-order allocation in the inbound, storage, or prep cost field.',
        },
      ],
      disclaimer:
        'This is an independent estimate tool and is not affiliated with, endorsed by, or sponsored by Amazon. Actual FBA fees can vary by category, size, weight, inventory status, season, taxes, and account details.',
    },
  },
  '/tiktok-shop-fee-calculator': {
    platformName: 'TikTok Shop',
    title: 'Free TikTok Shop Fee Calculator',
    eyebrow: 'Free US seller estimate',
    intro:
      'Estimate TikTok Shop referral fees, creator or affiliate commission, fulfillment costs, net profit, and target pricing.',
    ariaLabel: 'TikTok Shop fee calculator inputs',
    primaryFeeLabel: 'Referral fee %',
    secondaryFeeLabel: 'Creator or affiliate commission %',
    fixedFeeLabel: 'Fixed order fee',
    perUnitFeeLabel: 'Fulfillment fee per item',
    shippingCostLabel: 'Shipping or TikTok fulfillment cost',
    otherCostLabel: 'Other campaign or sample cost',
    defaultValues: makeGenericDefaults({
      itemPrice: '30',
      shippingCharged: '0',
      productCost: '9',
      packagingCost: '1',
      shippingCost: '4',
      primaryRatePercent: '6',
      secondaryRatePercent: '10',
      fixedFee: '0',
      perUnitFee: '0',
      targetMarginPercent: '30',
    }),
    note:
      'US TikTok Shop estimate. Referral fees and commission terms can vary by category, campaign, and seller program. Defaults are editable so you can match your actual setup.',
    content: {
      howItWorks:
        'Enter product price, discount, fulfillment cost, product cost, referral fee, and creator commission. The calculator estimates TikTok Shop fees, total costs, profit, margin, break-even price, and target-margin price.',
      feesIncluded: [
        {
          title: 'Referral fee',
          body: 'The referral fee is modeled as an editable percentage of the order amount.',
        },
        {
          title: 'Creator or affiliate commission',
          body: 'Use this field when commissions apply to creator, affiliate, or campaign-driven sales.',
        },
        {
          title: 'Fulfillment and campaign costs',
          body: 'Shipping, fulfillment, sample, and campaign costs can be entered as seller costs.',
        },
      ],
      faq: [
        {
          question: 'Does TikTok Shop charge the same referral fee for all products?',
          answer:
            'No. Fees can vary by category and seller program. This calculator uses editable defaults for a practical US estimate.',
        },
        {
          question: 'Can I include creator commission?',
          answer:
            'Yes. Enter the creator or affiliate commission percentage as a separate fee.',
        },
      ],
      disclaimer:
        'This is an independent estimate tool and is not affiliated with, endorsed by, or sponsored by TikTok or TikTok Shop. Actual fees can vary by category, campaign, seller program, refunds, and account terms.',
    },
  },
}

function App() {
  const path = normalizePath(window.location.pathname)
  const currentTool = tools.find((tool) => tool.path === path)

  if (path === '/') {
    return <PageShell path={path} title="Ecommerce Fee & Profit Calculators" description="Free ecommerce fee and profit calculators for Etsy, eBay, PayPal, Shopify, Amazon FBA, and TikTok Shop."><HomePage /></PageShell>
  }

  if (path === '/etsy-fee-calculator') {
    return (
      <PageShell
        path={path}
        title="Free Etsy Fee & Profit Calculator"
        description="Estimate Etsy fees, net profit, profit margin, break-even price, and target-margin pricing for US sellers."
      >
        <EtsyCalculatorPage />
      </PageShell>
    )
  }

  if (currentTool && currentTool.path !== '/etsy-fee-calculator') {
    const config = genericCalculatorConfigs[currentTool.path]
    return (
      <PageShell path={path} title={config.title} description={config.intro}>
        <GenericCalculatorPage config={config} />
      </PageShell>
    )
  }

  return (
    <PageShell
      path="/"
      title="Ecommerce Fee & Profit Calculators"
      description="Free ecommerce fee and profit calculators for online sellers."
    >
      <NotFoundPage />
    </PageShell>
  )
}

function PageShell({
  path,
  title,
  description,
  children,
}: {
  path: string
  title: string
  description: string
  children: React.ReactNode
}) {
  const canonical = `${siteOrigin}${path}`

  usePageMetadata({ title, description, canonical })

  return (
    <>
      <header className="site-header">
        <a className="brand" href="/">
          Ecommerce Calculators
        </a>
        <nav className="tool-nav" aria-label="Calculator navigation">
          {tools.map((tool) => (
            <a key={tool.path} className={path === tool.path ? 'active' : undefined} href={tool.path}>
              {tool.name}
            </a>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </>
  )
}

function usePageMetadata({
  title,
  description,
  canonical,
}: {
  title: string
  description: string
  canonical: string
}) {
  useEffect(() => {
    document.title = title

    upsertHeadElement('meta[name="description"]', () => {
      const element = document.createElement('meta')
      element.name = 'description'
      return element
    }).setAttribute('content', description)

    upsertHeadElement('link[rel="canonical"]', () => {
      const element = document.createElement('link')
      element.rel = 'canonical'
      return element
    }).setAttribute('href', canonical)

    upsertHeadElement('script[data-page-json-ld="web-application"]', () => {
      const element = document.createElement('script')
      element.type = 'application/ld+json'
      element.dataset.pageJsonLd = 'web-application'
      return element
    }).textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: title,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description,
      url: canonical,
    })
  }, [canonical, description, title])
}

function upsertHeadElement<T extends HTMLElement>(selector: string, createElement: () => T): T {
  const existingElements = Array.from(document.head.querySelectorAll<T>(selector))
  const element = existingElements[0] ?? createElement()

  if (!element.parentElement) {
    document.head.appendChild(element)
  }

  existingElements.slice(1).forEach((duplicate) => duplicate.remove())

  return element
}

function HomePage() {
  return (
    <section className="tool-hero" aria-labelledby="page-title">
      <div className="eyebrow">Free US seller tools</div>
      <h1 id="page-title">Ecommerce Fee &amp; Profit Calculators</h1>
      <p className="intro">
        Estimate platform fees, payment costs, net profit, profit margin, break-even price, and
        target pricing across common ecommerce channels.
      </p>
      <div className="tool-grid">
        {tools.map((tool) => (
          <a className="tool-card" key={tool.path} href={tool.path}>
            <span>{tool.name}</span>
            <strong>{tool.title}</strong>
            <p>{tool.description}</p>
          </a>
        ))}
      </div>
      <p className="disclaimer">
        These calculators provide independent estimates using editable US defaults. Actual fees can
        vary by account, category, country, currency, tax handling, discounts, refunds, and platform
        programs.
      </p>
    </section>
  )
}

function EtsyCalculatorPage() {
  const [formValues, setFormValues] = useState<EtsyFormValues>(defaultEtsyFormValues)
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
  const updateFormValue = <K extends keyof EtsyFormValues>(key: K, value: EtsyFormValues[K]) => {
    setFormValues((current) => ({ ...current, [key]: value }))
  }

  return (
    <>
      <section className="tool-hero" aria-labelledby="page-title">
        <div className="eyebrow">Free US seller estimate</div>
        <h1 id="page-title">Free Etsy Fee &amp; Profit Calculator</h1>
        <p className="intro">
          Estimate Etsy fees, net profit, profit margin, break-even price, and the selling price
          you need to reach your target margin.
        </p>

        <div className="calculator-layout">
          <form className="calculator-panel" aria-label="Etsy fee calculator inputs">
            <RevenueFields formValues={formValues} updateFormValue={updateFormValue} />
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

            <TargetMarginField
              value={formValues.targetMarginPercent}
              onChange={(value) => updateFormValue('targetMarginPercent', value)}
            />
          </form>

          <EtsyResultPanel inputs={inputs} result={result} />
        </div>
      </section>
      <EtsyContentSections />
    </>
  )
}

function GenericCalculatorPage({ config }: { config: GenericCalculatorConfig }) {
  const [formValues, setFormValues] = useState<GenericFormValues>(config.defaultValues)
  const inputs = useMemo<MarketplaceFeeInputs>(() => {
    const grossBeforeDiscount =
      parseMoneyInput(formValues.itemPrice) * Math.max(1, parseMoneyInput(formValues.quantity)) +
      parseMoneyInput(formValues.shippingCharged)
    const discountValue = normalizeDiscount(
      parseMoneyInput(formValues.discountValue),
      formValues.discountType,
      grossBeforeDiscount,
    )

    return {
      itemPrice: parseMoneyInput(formValues.itemPrice),
      shippingCharged: parseMoneyInput(formValues.shippingCharged),
      discountValue,
      quantity: parseMoneyInput(formValues.quantity),
      productCost: parseMoneyInput(formValues.productCost),
      packagingCost: parseMoneyInput(formValues.packagingCost),
      shippingCost: parseMoneyInput(formValues.shippingCost),
      otherCost: parseMoneyInput(formValues.otherCost),
      targetMarginPercent: parseMoneyInput(formValues.targetMarginPercent),
      percentFees: [
        { label: config.primaryFeeLabel, ratePercent: parseMoneyInput(formValues.primaryRatePercent) },
        { label: config.secondaryFeeLabel, ratePercent: parseMoneyInput(formValues.secondaryRatePercent) },
      ],
      fixedFees: [
        { label: config.fixedFeeLabel, amount: parseMoneyInput(formValues.fixedFee), mode: 'order' },
        { label: config.perUnitFeeLabel, amount: parseMoneyInput(formValues.perUnitFee), mode: 'unit' },
      ],
    }
  }, [config, formValues])
  const result = useMemo(() => calculateMarketplaceFees(inputs), [inputs])
  const updateFormValue = <K extends keyof GenericFormValues>(key: K, value: GenericFormValues[K]) => {
    setFormValues((current) => ({ ...current, [key]: value }))
  }

  return (
    <>
      <section className="tool-hero" aria-labelledby="page-title">
        <div className="eyebrow">{config.eyebrow}</div>
        <h1 id="page-title">{config.title}</h1>
        <p className="intro">{config.intro}</p>

        <div className="calculator-layout">
          <form className="calculator-panel" aria-label={config.ariaLabel}>
            <RevenueFields formValues={formValues} updateFormValue={updateFormValue} />

            <SectionTitle title="Costs" />
            <div className="field-grid">
              <MoneyInput
                label="Product cost"
                value={formValues.productCost}
                onChange={(value) => updateFormValue('productCost', value)}
              />
              <MoneyInput
                label="Packaging cost"
                value={formValues.packagingCost}
                onChange={(value) => updateFormValue('packagingCost', value)}
              />
              <MoneyInput
                label={config.shippingCostLabel}
                value={formValues.shippingCost}
                onChange={(value) => updateFormValue('shippingCost', value)}
              />
              <MoneyInput
                label={config.otherCostLabel}
                value={formValues.otherCost}
                onChange={(value) => updateFormValue('otherCost', value)}
              />
            </div>

            <SectionTitle title={`${config.platformName} fees`} />
            <div className="fee-note">{config.note}</div>
            <div className="field-grid">
              <NumberInput
                label={config.primaryFeeLabel}
                value={formValues.primaryRatePercent}
                onChange={(value) => updateFormValue('primaryRatePercent', value)}
                suffix="%"
              />
              <NumberInput
                label={config.secondaryFeeLabel}
                value={formValues.secondaryRatePercent}
                onChange={(value) => updateFormValue('secondaryRatePercent', value)}
                suffix="%"
              />
              <MoneyInput
                label={config.fixedFeeLabel}
                value={formValues.fixedFee}
                onChange={(value) => updateFormValue('fixedFee', value)}
              />
              <MoneyInput
                label={config.perUnitFeeLabel}
                value={formValues.perUnitFee}
                onChange={(value) => updateFormValue('perUnitFee', value)}
              />
            </div>

            <TargetMarginField
              value={formValues.targetMarginPercent}
              onChange={(value) => updateFormValue('targetMarginPercent', value)}
            />
          </form>

          <GenericResultPanel platformName={config.platformName} inputs={inputs} result={result} />
        </div>
      </section>
      <GenericContentSections config={config} />
    </>
  )
}

function RevenueFields<T extends { itemPrice: string; shippingCharged: string; discountValue: string; discountType: DiscountType; quantity: string }>({
  formValues,
  updateFormValue,
}: {
  formValues: T
  updateFormValue: <K extends keyof T>(key: K, value: T[K]) => void
}) {
  return (
    <>
      <SectionTitle title="Revenue" />
      <div className="field-grid">
        <MoneyInput
          label="Item price"
          value={formValues.itemPrice}
          onChange={(value) => updateFormValue('itemPrice', value as T['itemPrice'])}
        />
        <MoneyInput
          label="Shipping charged to buyer"
          value={formValues.shippingCharged}
          onChange={(value) => updateFormValue('shippingCharged', value as T['shippingCharged'])}
        />
        <NumberInput
          label="Discount"
          value={formValues.discountValue}
          onChange={(value) => updateFormValue('discountValue', value as T['discountValue'])}
        />
        <label className="field">
          <span>Discount type</span>
          <select
            value={formValues.discountType}
            onChange={(event) =>
              updateFormValue('discountType', event.target.value as T['discountType'])
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
          onChange={(value) => updateFormValue('quantity', value as T['quantity'])}
        />
      </div>
    </>
  )
}

function TargetMarginField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <>
      <SectionTitle title="Pricing goal" />
      <div className="field-grid single">
        <NumberInput label="Target profit margin %" value={value} onChange={onChange} suffix="%" />
      </div>
    </>
  )
}

function EtsyResultPanel({ inputs, result }: { inputs: EtsyFeeInputs; result: EtsyFeeResult }) {
  const formattedNetProfit = formatMoney(result.netProfit)
  const formattedProfitMargin = formatPercent(result.profitMarginPercent)
  const formattedTargetMargin = formatCompactPercent(inputs.targetMarginPercent)

  return (
    <ResultPanel
      platformName="Etsy"
      formattedNetProfit={formattedNetProfit}
      formattedProfitMargin={formattedProfitMargin}
      metrics={[
        ['Gross revenue', formatMoney(result.grossOrderAmount)],
        ['Total Etsy fees', formatMoney(result.totalEtsyFees)],
        ['Total costs', formatMoney(result.totalCosts)],
        ['Net profit', formattedNetProfit],
        ['Profit margin', formattedProfitMargin],
        ['Break-even price', formatMoney(result.breakEvenPrice)],
        [`Price for ${formattedTargetMargin} target margin`, formatMoney(result.suggestedPriceForTargetMargin)],
      ]}
      breakdowns={[
        {
          title: 'Etsy fees',
          variant: 'fees',
          rows: [
            ['Listing fee', result.listingFee],
            ['Transaction fee', result.transactionFee],
            ['Payment processing fee', result.paymentProcessingFee],
            ['Offsite Ads fee', result.offsiteAdsFee],
            ['Total Etsy fees', result.totalEtsyFees, true],
          ],
        },
        {
          title: 'Seller costs',
          variant: 'costs',
          rows:
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
                ],
        },
      ]}
      netProfit={result.netProfit}
      profitMarginPercent={result.profitMarginPercent}
    />
  )
}

function GenericResultPanel({
  platformName,
  inputs,
  result,
}: {
  platformName: string
  inputs: MarketplaceFeeInputs
  result: MarketplaceFeeResult
}) {
  const formattedNetProfit = formatMoney(result.netProfit)
  const formattedProfitMargin = formatPercent(result.profitMarginPercent)
  const formattedTargetMargin = formatCompactPercent(inputs.targetMarginPercent)

  return (
    <ResultPanel
      platformName={platformName}
      formattedNetProfit={formattedNetProfit}
      formattedProfitMargin={formattedProfitMargin}
      metrics={[
        ['Gross revenue', formatMoney(result.grossOrderAmount)],
        [`Total ${platformName} fees`, formatMoney(result.totalFees)],
        ['Total costs', formatMoney(result.totalCosts)],
        ['Net profit', formattedNetProfit],
        ['Profit margin', formattedProfitMargin],
        ['Break-even price', formatMoney(result.breakEvenPrice)],
        [`Price for ${formattedTargetMargin} target margin`, formatMoney(result.suggestedPriceForTargetMargin)],
      ]}
      breakdowns={[
        { title: `${platformName} fees`, variant: 'fees', rows: result.feeRows },
        { title: 'Seller costs', variant: 'costs', rows: result.costRows },
      ]}
      netProfit={result.netProfit}
      profitMarginPercent={result.profitMarginPercent}
    />
  )
}

function ResultPanel({
  platformName,
  formattedNetProfit,
  formattedProfitMargin,
  metrics,
  breakdowns,
  netProfit,
  profitMarginPercent,
}: {
  platformName: string
  formattedNetProfit: string
  formattedProfitMargin: string
  metrics: Array<[string, string]>
  breakdowns: Array<{ title: string; variant: 'fees' | 'costs'; rows: Array<[string, number, boolean?]> }>
  netProfit: number
  profitMarginPercent: number
}) {
  return (
    <aside className="result-panel" aria-label={`Estimated ${platformName} results`}>
      <div className="result-header">
        <span>Estimated results</span>
        <strong>{formattedNetProfit}</strong>
      </div>
      <p className="result-summary">
        At this price, your estimated net profit is {formattedNetProfit}, which equals a{' '}
        {formattedProfitMargin} profit margin.
      </p>
      {netProfit < 0 && <p className="alert danger">This sale may lose money after fees and costs.</p>}
      {netProfit >= 0 && profitMarginPercent > 0 && profitMarginPercent < 20 && (
        <p className="alert warning">Your margin looks low. Consider increasing price or reducing costs.</p>
      )}
      <div className="metric-grid">
        {metrics.map(([label, value]) => (
          <Metric key={label} label={label} value={value} />
        ))}
      </div>
      <h2 className="breakdown-title">Detailed fee breakdown</h2>
      <div className="breakdown-groups">
        {breakdowns.map((breakdown) => (
          <Breakdown
            key={breakdown.title}
            title={breakdown.title}
            variant={breakdown.variant}
            rows={breakdown.rows}
          />
        ))}
      </div>
    </aside>
  )
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="section-title">{title}</h2>
}

function MoneyInput(props: { label: string; value: string; onChange: (value: string) => void }) {
  return <NumberInput {...props} prefix="$" />
}

function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  step = 0.01,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  prefix?: string
  suffix?: string
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
        {suffix && <span>{suffix}</span>}
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
    <section className={`breakdown-section ${variant}`} aria-labelledby={`${slugify(title)}-breakdown`}>
      <h3 id={`${slugify(title)}-breakdown`}>{title}</h3>
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

function GenericContentSections({ config }: { config: GenericCalculatorConfig }) {
  return (
    <section className="content">
      <h2>How this {config.platformName} calculator works</h2>
      <p>{config.content.howItWorks}</p>
      <h2>{config.platformName} fees included in this calculator</h2>
      {config.content.feesIncluded.map((item) => (
        <div key={item.title}>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </div>
      ))}
      <h2>Frequently asked questions</h2>
      <FaqList items={config.content.faq} />
      <p className="disclaimer">{config.content.disclaimer}</p>
    </section>
  )
}

const etsyFaqItems = [
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
    answer: 'This calculator uses a US payment processing estimate of 3% plus $0.25 per order.',
  },
  {
    question: 'Is this calculator official?',
    answer:
      'No. This is an independent estimate tool and is not affiliated with, endorsed by, or sponsored by Etsy, Inc.',
  },
]

function EtsyContentSections() {
  return (
    <section className="content">
      <h2>How this Etsy fee calculator works</h2>
      <p>
        Enter your item price, buyer-paid shipping, discounts, quantity, product costs, shipping
        label cost, and optional Offsite Ads rate. The calculator estimates order revenue, Etsy
        fees, costs, net profit, margin, break-even price, and the price needed for your target
        margin.
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
      <p>For US sellers, this calculator estimates payment processing at 3% plus $0.25 per order.</p>
      <h3>Offsite Ads fee</h3>
      <p>You can choose no Offsite Ads fee, 12%, or 15%. The estimated fee is capped at $100.</p>
      <h2>Frequently asked questions</h2>
      <FaqList items={etsyFaqItems} />
      <p className="disclaimer">
        This calculator provides estimates based on publicly available Etsy fee information. It is
        not affiliated with, endorsed by, or sponsored by Etsy, Inc. Etsy fees may change, and
        actual fees can vary by country, tax rules, currency, refunds, ads, and account-specific
        factors.
      </p>
    </section>
  )
}

function FaqList({ items }: { items: Array<{ question: string; answer: string }> }) {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      <div className="faq-list">
        {items.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </>
  )
}

function NotFoundPage() {
  return (
    <section className="tool-hero" aria-labelledby="page-title">
      <div className="eyebrow">Page not found</div>
      <h1 id="page-title">Choose a calculator</h1>
      <p className="intro">The requested calculator does not exist. Pick a tool below.</p>
      <div className="tool-grid">
        {tools.map((tool) => (
          <a className="tool-card" key={tool.path} href={tool.path}>
            <span>{tool.name}</span>
            <strong>{tool.title}</strong>
            <p>{tool.description}</p>
          </a>
        ))}
      </div>
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

const formatPercent = (value: number) => `${(Number.isFinite(value) ? value : 0).toFixed(2)}%`

function parseMoneyInput(value: string): number {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return parsed
}

const formatCompactPercent = (value: number) => {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0
  return `${Number.isInteger(safeValue) ? safeValue.toFixed(0) : safeValue.toFixed(2)}%`
}

function normalizeDiscount(value: number, type: DiscountType, base: number): number {
  if (type === 'percent') return Math.max(0, base) * (Math.min(value, 100) / 100)
  return value
}

function makeGenericDefaults(overrides: Partial<GenericFormValues>): GenericFormValues {
  return {
    itemPrice: '30',
    shippingCharged: '0',
    discountValue: '0',
    discountType: 'amount',
    quantity: '1',
    productCost: '10',
    packagingCost: '1',
    shippingCost: '4',
    otherCost: '0',
    primaryRatePercent: '10',
    secondaryRatePercent: '0',
    fixedFee: '0',
    perUnitFee: '0',
    targetMarginPercent: '30',
    ...overrides,
  }
}

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1)
  return path
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default App
