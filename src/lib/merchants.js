// Known merchant → domain map for logo fetching, plus a display-name
// normaliser. Logos come from Clearbit by domain; the FinanceLens falls back
// to a coloured letter-avatar when there's no domain or the image fails to
// load. Extend MERCHANT_DOMAINS as new top merchants appear.

export const MERCHANT_DOMAINS = {
  Glovo: "glovoapp.com",
  "Honest Greens": "honestgreens.com",
  "Norrsken Foundation": "norrsken.org",
  Amazon: "amazon.com",
  "Amazon Prime": "amazon.com",
  Spotify: "spotify.com",
  Netflix: "netflix.com",
  Disney: "disneyplus.com",
  Uber: "uber.com",
  "Free Now": "free-now.com",
  Cabify: "cabify.com",
  Bolt: "bolt.eu",
  Renfe: "renfe.com",
  Ryanair: "ryanair.com",
  Vueling: "vueling.com",
  EasyJet: "easyjet.com",
  Airbnb: "airbnb.com",
  "Booking.com": "booking.com",
  Agoda: "agoda.com",
  Zara: "zara.com",
  Decathlon: "decathlon.com",
  Nike: "nike.com",
  Nespresso: "nespresso.com",
  Temu: "temu.com",
  AliExpress: "aliexpress.com",
  Mercadona: "mercadona.es",
  Carrefour: "carrefour.es",
  Lidl: "lidl.es",
  Bonpreu: "bonpreu.cat",
  Condis: "condis.es",
  ClassPass: "classpass.com",
  GitHub: "github.com",
  Vercel: "vercel.com",
  Cloudflare: "cloudflare.com",
  OpenAI: "openai.com",
  Anthropic: "anthropic.com",
  Perplexity: "perplexity.ai",
  ClickUp: "clickup.com",
  HighLevel: "gohighlevel.com",
  Clay: "clay.com",
  Supabase: "supabase.com",
  Zapier: "zapier.com",
  Airtable: "airtable.com",
  Namecheap: "namecheap.com",
  Apollo: "apollo.io",
  Starbucks: "starbucks.com",
  "McDonald's": "mcdonalds.com",
  Goiko: "goiko.com",
};

// Title-case a raw Revolut description into a tidy display name.
export function prettyMerchant(desc) {
  const raw = (desc || "").trim();
  if (!raw) return "Unknown";
  // strip common P2P prefixes
  const cleaned = raw.replace(/^(payment to|transfer to|to)\s+/i, "").trim() || raw;
  return cleaned
    .split(/\s+/)
    .map((w) => (w.length <= 3 && w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ")
    .slice(0, 40);
}

export function domainFor(name) {
  if (MERCHANT_DOMAINS[name]) return MERCHANT_DOMAINS[name];
  // case-insensitive contains match against known keys
  const lower = (name || "").toLowerCase();
  for (const [k, v] of Object.entries(MERCHANT_DOMAINS)) {
    if (lower.includes(k.toLowerCase())) return v;
  }
  return null;
}

export const logoUrl = (domain) => (domain ? `https://logo.clearbit.com/${domain}` : null);
