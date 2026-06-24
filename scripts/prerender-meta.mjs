import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const siteOrigin = 'https://ecommerce-calculators-eta.vercel.app'
const rootDir = dirname(dirname(fileURLToPath(import.meta.url)))
const distDir = join(rootDir, 'dist')
const sourceHtmlPath = join(distDir, 'index.html')

const pages = [
  {
    path: '/',
    title: 'Ecommerce Fee & Profit Calculators',
    description:
      'Free ecommerce fee and profit calculators for Etsy, eBay, PayPal, Shopify, Amazon FBA, and TikTok Shop.',
  },
  {
    path: '/etsy-fee-calculator',
    title: 'Free Etsy Fee & Profit Calculator',
    description:
      'Estimate Etsy fees, net profit, profit margin, break-even price, and target-margin pricing for US sellers.',
  },
  {
    path: '/ebay-fee-calculator',
    title: 'Free eBay Fee & Profit Calculator',
    description:
      'Estimate eBay final value fees, promoted listing fees, fixed order fees, net profit, break-even price, and target-margin pricing.',
  },
  {
    path: '/paypal-fee-calculator',
    title: 'Free PayPal Fee Calculator',
    description:
      'Estimate PayPal payment processing fees, fixed transaction fees, net receipts, and profit after product or service costs.',
  },
  {
    path: '/shopify-profit-calculator',
    title: 'Free Shopify Profit Calculator',
    description:
      'Estimate Shopify payment fees, third-party transaction fees, product costs, shipping costs, net profit, and target pricing.',
  },
  {
    path: '/amazon-fba-calculator',
    title: 'Free Amazon FBA Calculator',
    description:
      'Estimate Amazon referral fees, FBA fulfillment fees, inbound or storage costs, net profit, break-even price, and target pricing.',
  },
  {
    path: '/tiktok-shop-fee-calculator',
    title: 'Free TikTok Shop Fee Calculator',
    description:
      'Estimate TikTok Shop referral fees, creator or affiliate commission, fulfillment costs, net profit, and target pricing.',
  },
]

const sourceHtml = await readFile(sourceHtmlPath, 'utf8')

await Promise.all(
  pages.map(async (page) => {
    const canonical = `${siteOrigin}${page.path}`
    const html = applyPageMeta(sourceHtml, {
      ...page,
      canonical,
      jsonLd: createWebApplicationJsonLd(page, canonical),
    })
    const outputPath =
      page.path === '/'
        ? sourceHtmlPath
        : join(distDir, page.path.slice(1), 'index.html')

    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, html)
  }),
)

console.log(`Prerendered metadata for ${pages.length} routes.`)

function applyPageMeta(html, { title, description, canonical, jsonLd }) {
  const jsonLdScript = `<script type="application/ld+json" data-page-json-ld="web-application">${escapeScriptJson(
    JSON.stringify(jsonLd),
  )}</script>`

  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtmlText(title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${escapeHtmlAttribute(description)}" />`,
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${escapeHtmlAttribute(canonical)}" />`,
    )
    .replace(
      /(?:\s*<script\s+type="application\/ld\+json"\s+data-page-json-ld="web-application">[\s\S]*?<\/script>)?\s*<\/head>/,
      `\n    ${jsonLdScript}\n  </head>`,
    )
}

function createWebApplicationJsonLd(page, canonical) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: page.title,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: page.description,
    url: canonical,
  }
}

function escapeHtmlText(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function escapeHtmlAttribute(value) {
  return escapeHtmlText(value).replaceAll('"', '&quot;')
}

function escapeScriptJson(value) {
  return value.replaceAll('<', '\\u003c')
}
