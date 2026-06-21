// Transaction categoriser. Direction-aware: confirmed overrides first, then
// internal transfers / round-ups, then named income & rent sources, then
// inbound-from-a-person paybacks, then keyword spend rules, then the P2P-out
// catch-all, then `other`.
//
// Tuned to match Arin's curated Revolut categorisation (the export used to
// build financeSeed.js), so live in-app imports reconcile with the seed.
// Order matters — specific keys before generic ones.

// Human-readable labels for every category key.
export const CATEGORY_LABELS = {
  eating_out: "Eating out",
  p2p_out: "Sent to people",
  software_biz: "Business tools",
  travel: "Travel",
  shopping: "Shopping",
  groceries: "Groceries",
  subscriptions: "Subscriptions",
  transport: "Transport",
  health_fitness: "Health & fitness",
  insurance: "Insurance",
  cash: "Cash",
  fees: "Fees",
  other: "Other",
  // Excluded-from-spend buckets (transfers + income).
  transfer_rent: "Rent transfer",
  transfer_internal: "Internal transfer",
  rent_offset: "Rent offset (Dan)",
  income_boddy: "Income — BODDY",
  income_unify: "Income — Unify",
  income_other: "P2P paybacks",
};

// Categories excluded from the "spend" total.
export const EXCLUDED_FROM_SPEND = new Set([
  "transfer_rent",
  "transfer_internal",
  "rent_offset",
  "income_boddy",
  "income_unify",
  "income_other",
]);
// Counted as real income on the Income stat card.
export const INCOME_CATEGORIES = new Set(["income_boddy", "income_unify"]);

// Confirmed overrides (Arin's manual decisions — extend as he confirms more).
export const OVERRIDES = {
  amevista: "shopping",
  connectcentre: "software_biz", // business
  assurant: "insurance", // personal
};

// Internal transfers / round-ups / FX — never spend.
const INTERNAL_KEYS = ["revpoints", "spare change", "exchanged to", "exchanged from", "round-up", "round up", "vault", "pocket", "on hold", "release"];

// Spend-only keyword rules (income/rent/transfers handled explicitly below).
const RULES = [
  // business / deductible
  ["software_biz", ["highlevel", "clickup", "clay", "connectcentre", "openai", "anthropic",
    "perplexity", "github", "vercel", "cloudflare", "make.com", "make ",
    "n8n", "namecheap", "godaddy", "apollo", "supabase", "zapier", "airtable",
    "hostinger", "google workspace", "xai", "notion", "replit", "lovable",
    "cursor", "linear", "roam research", "readwise", "adblock", "twilio",
    "digitalocean", "render.com", "railway", "1global"]],
  ["insurance", ["assurant"]],
  // personal spend
  ["subscriptions", ["amazon prime", "spotify", "netflix", "youtube", "icloud", "apple.com", "disney"]],
  ["groceries", ["bonpreu", "mercadona", "carrefour", "lidl", "dia ", "condis", "consum",
    "ametller", "sainsbury", "marks & spencer", "aldi", "picardia"]],
  ["health_fitness", ["classpass", "farmacia", "pharmacy", "clinica", "dentist", "salon", "hair",
    "sundy", "massage", "physio", "gym", "puregym"]],
  ["eating_out", ["honest greens", "glovo", "taberna", "restaurante", "cafe", "café", "coffee",
    "costa", " bar", "la principal", "ramses", "gouda", "guitart", "vermut", "brunch", "pizz",
    "sushi", "kebab", "burger", "goiko", "starbucks", "mcdonald", "big penny",
    "jack horner", "hokka", "80 grados", "weicheng", "norrsken", "phoshfood", "fantail"]],
  ["transport", ["uber", "free now", "freenow", "cabify", "bolt.eu", "tmb", "renfe",
    "greater anglia", "aena", "transport for london", "tfl"]],
  ["travel", ["airbnb", "hotel", "vueling", "ryanair", "booking.com", "stoketravel",
    "duty free", "easyjet", "enterticket", "costa rica", "trip.com", "agoda",
    "la molina", "lloguer", "iberia", "cottage"]],
  ["shopping", ["amazon", "temu", "zara", "decathlon", "nespresso", "perfumeria", "aliexpress",
    "nike", "druni", "amevista", "vanquish", "prorider", "pretty shiny",
    "sheepskin", "dhl"]],
  ["cash", ["cash withdrawal"]],
  // refined so "coffee" no longer matches the bare "fee" keyword
  ["fees", [" fee", "plan fee", "metal plan", "pastdue"]],
];

const BUSINESS = new Set(["software_biz"]); // + connectcentre via override

// Categorise one transaction. Returns { category, business }.
export function categorise(tx, overrides = OVERRIDES) {
  const d = (tx.desc || "").toLowerCase();
  const inbound = tx.direction === "in";

  // 1. manual overrides
  for (const [key, cat] of Object.entries(overrides)) if (d.includes(key)) return tag(cat, d);

  // 2. internal transfers / round-ups / FX (excluded from spend)
  if (INTERNAL_KEYS.some((k) => d.includes(k))) return tag("transfer_internal", d);

  // 3. rent funding (self-transfer out)
  if (d.includes("to arin melvin")) return tag("transfer_rent", d);

  // 4. named income / rent sources (specific, before the generic from/to rules)
  if (d.includes("daniel lukas matthias schonbohm")) return tag("rent_offset", d);
  if (d.includes("pindor group")) return tag("income_boddy", d);
  if (d.includes("unify digital")) return tag("income_unify", d);

  // 5. inbound from a person = P2P payback (not income, not spend)
  if (inbound && (d.includes("transfer from") || d.includes("payment from") || d.startsWith("from "))) {
    return tag("income_other", d);
  }

  // 6. keyword spend rules
  for (const [cat, keys] of RULES) for (const key of keys) if (d.includes(key)) return tag(cat, d);

  // 7. outbound to a person
  if (d.includes("transfer to") || d.includes("payment to") || d.includes(" to ") || d.startsWith("to ")) {
    return tag("p2p_out", d);
  }

  return tag("other", d);
}

function tag(cat, d) {
  return { category: cat, business: BUSINESS.has(cat) || d.includes("connectcentre") };
}
