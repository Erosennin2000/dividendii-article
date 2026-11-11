// Facts shown across the public site. Change them here and every page follows.
export const SITE = {
  brand: 'Dividendii',
  legal: 'Dividendii Limited',
  rc: 'RC 9598309',
  address: '10 Ahmadu Bello Street, Victoria Island, Lagos',
  phone: '+234 909 502 3263',
  phoneTel: '+2349095023263',
  whatsapp: 'https://wa.me/2349095023263',
  email: 'support@dividendii.com',
  hours: '9am to 5pm, Monday to Friday',
  upfront: 150,            // naira per company, before VAT
  vat: 0.075,
  success: 5,              // percent of money recovered
  reply: 'within 24 hours',
  source: 'https://nairametrics.com/2026/07/16/sec-launches-nationwide-campaign-to-recover-n270-billion-unclaimed-dividends/',
}
export const upfrontWithVat = () => Math.round(SITE.upfront * (1 + SITE.vat) * 100) / 100

// Set to true once your lawyer has approved the pages in src/pages/site/Legal.jsx. It removes the "draft" banner there.
export const LEGAL_REVIEWED = false
