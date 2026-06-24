# Ecommerce Fee & Profit Calculators

A free ecommerce fee and profit calculator suite for estimating seller fees, net profit, profit margin, break-even price, and the selling price needed to reach a target margin.

## Features

- Umbrella homepage for ecommerce calculators
- Etsy fee estimate for US sellers
- eBay fee estimate with editable final value, ad, fixed, and insertion fees
- PayPal fee estimate with editable percentage and fixed payment fees
- Shopify profit estimate with editable payment and third-party transaction fees
- Amazon FBA estimate with editable referral, fulfillment, and landed costs
- TikTok Shop fee estimate with editable referral and creator commission fees
- Detailed costs mode
- Total cost only mode
- Net profit and profit margin
- Break-even price
- Target margin price
- SEO content, FAQ, JSON-LD, and disclaimer

## Local development

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Open:

```text
http://127.0.0.1:5173/
```

Calculator routes:

```text
/etsy-fee-calculator
/ebay-fee-calculator
/paypal-fee-calculator
/shopify-profit-calculator
/amazon-fba-calculator
/tiktok-shop-fee-calculator
```

## Build

```bash
npm run build
```

## Notes

These calculators provide independent estimates based on editable US fee defaults. They are not affiliated with, endorsed by, or sponsored by Etsy, eBay, PayPal, Shopify, Amazon, TikTok, or their related companies.
