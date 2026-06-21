// Transaction categoriser. Two-pass: confirmed overrides first, then keyword
// rules. Genuinely unknown merchants fall through to `other` and are surfaced
// in the UI for one-time manual confirmation (which extends OVERRIDES).
//
// Order matters — specific keys before generic ones (`amazon prime` before
// `amazon`, named P2P recipients before the catch-all `to `).

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
  rent_offset: "Rent offset (Dan)",
  income_boddy: "Income — BODDY",
  income_unify: "Income — Unify",
};

// Categories excluded from the "spend" total.
export const EXCLUDED_FROM_SPEND = new Set([
  "transfer_rent",
  "rent_offset",
  "income_boddy",
  "income_unify",
]);
export const INCOME_CATEGORIES = new Set(["income_boddy", "income_unify"]);

// Confirmed overrides (Arin's manual decisions — extend as he confirms more).
export const OVERRIDES = {
  amevista: "shopping",
  connectcentre: "software_biz", // business
  assurant: "insurance", // personal
};

const RULES = [
  // transfers & housing (excluded from spend)
  ["transfer_rent", ["to arin melvin"]], // funds the rent account
  ["rent_offset", ["daniel lukas matthias schonbohm"]], // Dan — €1,250/mo offset
  // income
  ["income_boddy", ["pindor group"]],
  ["income_unify", ["unify digital"]],
  // business / deductible
  ["software_biz", ["highlevel", "clickup", "clay", "connectcentre", "openai", "anthropic",
    "perplexity", "github", "vercel", "cloudflare", "make.com", "make ",
    "n8n", "namecheap", "godaddy", "apollo", "supabase", "zapier", "airtable",
    "hostinger", "google workspace", "xai"]],
  ["insurance", ["assurant"]],
  // personal spend
  ["subscriptions", ["amazon prime", "spotify", "netflix", "youtube", "icloud", "apple.com", "disney"]],
  ["groceries", ["bonpreu", "mercadona", "carrefour", "lidl", "dia ", "condis", "consum",
    "ametller", "sainsbury", "marks & spencer", "aldi", "picardia"]],
  ["health_fitness", ["classpass", "farmacia", "pharmacy", "clinica", "dentist", "salon", "hair",
    "sundy", "massage", "physio", "gym"]],
  ["eating_out", ["honest greens", "glovo", "taberna", "restaurante", "cafe", "café", " bar",
    "la principal", "ramses", "gouda", "guitart", "vermut", "brunch", "pizz",
    "sushi", "kebab", "burger", "goiko", "starbucks", "mcdonald", "big penny",
    "jack horner", "hokka", "80 grados", "weicheng", "norrsken"]],
  ["transport", ["uber", "free now", "freenow", "cabify", "bolt.eu", "tmb", "renfe",
    "greater anglia", "aena"]],
  ["travel", ["airbnb", "hotel", "vueling", "ryanair", "booking.com", "stoketravel",
    "duty free", "easyjet", "enterticket", "costa rica", "trip.com", "agoda",
    "la molina", "lloguer"]],
  ["shopping", ["amazon", "temu", "zara", "decathlon", "nespresso", "perfumeria", "aliexpress",
    "nike", "druni", "amevista", "vanquish", "prorider", "pretty shiny",
    "sheepskin", "dhl"]],
  ["cash", ["cash withdrawal"]],
  ["fees", ["fee", "pastdue"]],
  ["p2p_out", ["transfer to", "to "]],
];

const BUSINESS = new Set(["software_biz"]); // + connectcentre via override

// Categorise one transaction. Returns { category, business }.
export function categorise(tx, overrides = OVERRIDES) {
  const d = (tx.desc || "").toLowerCase();
  for (const [key, cat] of Object.entries(overrides)) {
    if (d.includes(key)) return tag(cat, d);
  }
  for (const [cat, keys] of RULES) {
    for (const key of keys) if (d.includes(key)) return tag(cat, d);
  }
  return tag("other", d);
}

function tag(cat, d) {
  return { category: cat, business: BUSINESS.has(cat) || d.includes("connectcentre") };
}
