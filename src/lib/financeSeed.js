// Seed finance summary — generated from Arin's real Revolut export
// (2025-10-01 → 2026-04-18, ~6.5 months, 1,413 transactions), already parsed
// and categorised. Shown as the default until a fresh CSV is imported, at which
// point financeStats() recomputes everything from the new transactions.
//
// Shape matches the output of financeStats(). Top 8 merchants per category are
// itemised; `extra` carries the long-tail count. Regenerate from a newer export.

export const FINANCE_SEED = {
  "seeded": true,
  "rangeLabel": "Oct 25 – Apr 26 · 6 mo",
  "range": {
    "start": "2025-10-01",
    "end": "2026-04-18",
    "months": [
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04"
    ],
    "days": 199
  },
  "stats": {
    "income": {
      "perMonth": 3619,
      "perWeek": 835,
      "note": "BODDY + Unify"
    },
    "cardSpend": {
      "perMonth": 2790,
      "perWeek": 644,
      "note": "transfers excl."
    },
    "rentNet": {
      "perMonth": 1174,
      "perWeek": 271,
      "gross": 2761,
      "offset": 1587,
      "note": "€2,761 − €1,587 Dan"
    },
    "net": {
      "perMonth": -345,
      "perWeek": -80,
      "note": "before P2P paybacks"
    }
  },
  "deductible": {
    "perMonth": 419,
    "perWeek": 97
  },
  "excluded": {
    "perMonth": 3190,
    "total": 20857
  },
  "categories": [
    {
      "key": "eating_out",
      "label": "Eating out",
      "total": 6212,
      "count": 362,
      "perMonth": 950,
      "perWeek": 219,
      "perDay": 31.2,
      "deductible": 0,
      "business": false,
      "spark": [
        0.72,
        1.0,
        0.85,
        0.56,
        0.02,
        0.52,
        0.26
      ],
      "merchants": [
        {
          "name": "Glovo",
          "domain": "glovoapp.com",
          "total": 1456,
          "count": 74,
          "perMonth": 223,
          "perWeek": 51,
          "perDay": 7.3,
          "freq": "day"
        },
        {
          "name": "Honest Greens",
          "domain": "honestgreens.com",
          "total": 825,
          "count": 86,
          "perMonth": 126,
          "perWeek": 29,
          "perDay": 4.1,
          "freq": "day"
        },
        {
          "name": "Norrsken Foundation",
          "domain": null,
          "total": 283,
          "count": 4,
          "perMonth": 43,
          "perWeek": 10,
          "perDay": 1.4,
          "freq": "week"
        },
        {
          "name": "Weicheng1",
          "domain": null,
          "total": 232,
          "count": 1,
          "perMonth": 35,
          "perWeek": 8,
          "perDay": 1.2,
          "freq": "one-off"
        },
        {
          "name": "Taberna Gouda",
          "domain": null,
          "total": 194,
          "count": 1,
          "perMonth": 30,
          "perWeek": 7,
          "perDay": 1.0,
          "freq": "one-off"
        },
        {
          "name": "Ramses",
          "domain": null,
          "total": 147,
          "count": 1,
          "perMonth": 22,
          "perWeek": 5,
          "perDay": 0.7,
          "freq": "one-off"
        },
        {
          "name": "Cash Withdrawal At Perfumeria Passion",
          "domain": null,
          "total": 126,
          "count": 1,
          "perMonth": 19,
          "perWeek": 4,
          "perDay": 0.6,
          "freq": "one-off"
        },
        {
          "name": "Nespresso",
          "domain": "nespresso.com",
          "total": 120,
          "count": 6,
          "perMonth": 18,
          "perWeek": 4,
          "perDay": 0.6,
          "freq": "week"
        }
      ],
      "extra": {
        "count": 108,
        "perMonth": 433
      }
    },
    {
      "key": "software_biz",
      "label": "Business tools",
      "total": 2740,
      "count": 49,
      "perMonth": 419,
      "perWeek": 96,
      "perDay": 13.8,
      "deductible": 419,
      "business": true,
      "spark": [
        1.0,
        0.51,
        0.8,
        0.18,
        0.07,
        0.28,
        0.0
      ],
      "merchants": [
        {
          "name": "Highlevel",
          "domain": "gohighlevel.com",
          "total": 1506,
          "count": 12,
          "perMonth": 230,
          "perWeek": 53,
          "perDay": 7.6,
          "freq": "week"
        },
        {
          "name": "Clickup.Com",
          "domain": "clickup.com",
          "total": 445,
          "count": 3,
          "perMonth": 68,
          "perWeek": 16,
          "perDay": 2.2,
          "freq": "week"
        },
        {
          "name": "Connectcentre.Ie",
          "domain": "connectcentre.ie",
          "total": 313,
          "count": 4,
          "perMonth": 48,
          "perWeek": 11,
          "perDay": 1.6,
          "freq": "week"
        },
        {
          "name": "Openai",
          "domain": "openai.com",
          "total": 99,
          "count": 6,
          "perMonth": 15,
          "perWeek": 3,
          "perDay": 0.5,
          "freq": "week"
        },
        {
          "name": "Hostinger",
          "domain": "hostinger.com",
          "total": 63,
          "count": 3,
          "perMonth": 10,
          "perWeek": 2,
          "perDay": 0.3,
          "freq": "week"
        },
        {
          "name": "Make",
          "domain": "make.com",
          "total": 58,
          "count": 7,
          "perMonth": 9,
          "perWeek": 2,
          "perDay": 0.3,
          "freq": "week"
        },
        {
          "name": "Zapier",
          "domain": "zapier.com",
          "total": 56,
          "count": 2,
          "perMonth": 9,
          "perWeek": 2,
          "perDay": 0.3,
          "freq": "week"
        },
        {
          "name": "Xai",
          "domain": null,
          "total": 52,
          "count": 2,
          "perMonth": 8,
          "perWeek": 2,
          "perDay": 0.3,
          "freq": "week"
        }
      ],
      "extra": {
        "count": 5,
        "perMonth": 23
      }
    },
    {
      "key": "p2p_out",
      "label": "Sent to people",
      "total": 2430,
      "count": 34,
      "perMonth": 372,
      "perWeek": 85,
      "perDay": 12.2,
      "deductible": 0,
      "business": false,
      "spark": [
        0.42,
        0.96,
        0.66,
        0.23,
        0.08,
        1.0,
        0.35
      ],
      "merchants": [
        {
          "name": "Transfer To Lisette Hoepelman",
          "domain": null,
          "total": 844,
          "count": 8,
          "perMonth": 129,
          "perWeek": 30,
          "perDay": 4.2,
          "freq": "week"
        },
        {
          "name": "To Benjamin Wacker",
          "domain": null,
          "total": 500,
          "count": 1,
          "perMonth": 76,
          "perWeek": 18,
          "perDay": 2.5,
          "freq": "one-off"
        },
        {
          "name": "Transfer To Ana Luisa Uran Grajales",
          "domain": null,
          "total": 242,
          "count": 5,
          "perMonth": 37,
          "perWeek": 9,
          "perDay": 1.2,
          "freq": "week"
        },
        {
          "name": "Transfer To Luisa Fernanda Rodriguez Bedoya",
          "domain": null,
          "total": 156,
          "count": 3,
          "perMonth": 24,
          "perWeek": 5,
          "perDay": 0.8,
          "freq": "week"
        },
        {
          "name": "To Hony Moazzam",
          "domain": null,
          "total": 120,
          "count": 1,
          "perMonth": 18,
          "perWeek": 4,
          "perDay": 0.6,
          "freq": "one-off"
        },
        {
          "name": "To Andrew Swailes",
          "domain": null,
          "total": 115,
          "count": 1,
          "perMonth": 18,
          "perWeek": 4,
          "perDay": 0.6,
          "freq": "one-off"
        },
        {
          "name": "To Steven Wise",
          "domain": null,
          "total": 92,
          "count": 1,
          "perMonth": 14,
          "perWeek": 3,
          "perDay": 0.5,
          "freq": "one-off"
        },
        {
          "name": "To Arin Ibrisim-Melvin",
          "domain": null,
          "total": 69,
          "count": 1,
          "perMonth": 11,
          "perWeek": 2,
          "perDay": 0.3,
          "freq": "one-off"
        }
      ],
      "extra": {
        "count": 9,
        "perMonth": 45
      }
    },
    {
      "key": "other",
      "label": "Other",
      "total": 1916,
      "count": 95,
      "perMonth": 293,
      "perWeek": 67,
      "perDay": 9.6,
      "deductible": 0,
      "business": false,
      "spark": [
        0.57,
        0.12,
        0.35,
        1.0,
        0.86,
        0.26,
        0.05
      ],
      "merchants": [
        {
          "name": "Sp Tern Setups",
          "domain": null,
          "total": 449,
          "count": 1,
          "perMonth": 69,
          "perWeek": 16,
          "perDay": 2.3,
          "freq": "one-off"
        },
        {
          "name": "Mercado Pago",
          "domain": null,
          "total": 204,
          "count": 1,
          "perMonth": 31,
          "perWeek": 7,
          "perDay": 1.0,
          "freq": "one-off"
        },
        {
          "name": "Phoshfood.Com*Marbella",
          "domain": null,
          "total": 190,
          "count": 2,
          "perMonth": 29,
          "perWeek": 7,
          "perDay": 1.0,
          "freq": "week"
        },
        {
          "name": "Iberia",
          "domain": "iberia.com",
          "total": 184,
          "count": 2,
          "perMonth": 28,
          "perWeek": 6,
          "perDay": 0.9,
          "freq": "week"
        },
        {
          "name": "Notion",
          "domain": "notion.so",
          "total": 50,
          "count": 2,
          "perMonth": 8,
          "perWeek": 2,
          "perDay": 0.3,
          "freq": "week"
        },
        {
          "name": "Merpago Republica",
          "domain": null,
          "total": 49,
          "count": 1,
          "perMonth": 8,
          "perWeek": 2,
          "perDay": 0.2,
          "freq": "one-off"
        },
        {
          "name": "Merpago Lameccafit",
          "domain": null,
          "total": 32,
          "count": 1,
          "perMonth": 5,
          "perWeek": 1,
          "perDay": 0.2,
          "freq": "one-off"
        },
        {
          "name": "2006",
          "domain": null,
          "total": 29,
          "count": 2,
          "perMonth": 5,
          "perWeek": 1,
          "perDay": 0.1,
          "freq": "week"
        }
      ],
      "extra": {
        "count": 60,
        "perMonth": 111
      }
    },
    {
      "key": "travel",
      "label": "Travel",
      "total": 1663,
      "count": 11,
      "perMonth": 254,
      "perWeek": 59,
      "perDay": 8.4,
      "deductible": 0,
      "business": false,
      "spark": [
        0.0,
        0.0,
        1.0,
        0.66,
        0.41,
        0.12,
        0.0
      ],
      "merchants": [
        {
          "name": "Airbnb",
          "domain": "airbnb.com",
          "total": 442,
          "count": 1,
          "perMonth": 68,
          "perWeek": 16,
          "perDay": 2.2,
          "freq": "one-off"
        },
        {
          "name": "Hotel Costa Rica",
          "domain": null,
          "total": 314,
          "count": 1,
          "perMonth": 48,
          "perWeek": 11,
          "perDay": 1.6,
          "freq": "one-off"
        },
        {
          "name": "Stoketravel",
          "domain": "stoketravel.com",
          "total": 255,
          "count": 1,
          "perMonth": 39,
          "perWeek": 9,
          "perDay": 1.3,
          "freq": "one-off"
        },
        {
          "name": "Enterticket",
          "domain": null,
          "total": 230,
          "count": 2,
          "perMonth": 35,
          "perWeek": 8,
          "perDay": 1.2,
          "freq": "week"
        },
        {
          "name": "World Duty Free",
          "domain": "worlddutyfree.com",
          "total": 200,
          "count": 2,
          "perMonth": 31,
          "perWeek": 7,
          "perDay": 1.0,
          "freq": "week"
        },
        {
          "name": "Trip.Com",
          "domain": "trip.com",
          "total": 86,
          "count": 1,
          "perMonth": 13,
          "perWeek": 3,
          "perDay": 0.4,
          "freq": "one-off"
        },
        {
          "name": "Agoda",
          "domain": null,
          "total": 79,
          "count": 1,
          "perMonth": 12,
          "perWeek": 3,
          "perDay": 0.4,
          "freq": "one-off"
        },
        {
          "name": "Lloguer La Molina",
          "domain": null,
          "total": 42,
          "count": 1,
          "perMonth": 6,
          "perWeek": 1,
          "perDay": 0.2,
          "freq": "one-off"
        }
      ],
      "extra": {
        "count": 1,
        "perMonth": 2
      }
    },
    {
      "key": "shopping",
      "label": "Shopping",
      "total": 1589,
      "count": 26,
      "perMonth": 243,
      "perWeek": 56,
      "perDay": 8.0,
      "deductible": 0,
      "business": false,
      "spark": [
        0.1,
        0.85,
        0.32,
        0.42,
        0.6,
        1.0,
        0.17
      ],
      "merchants": [
        {
          "name": "Amazon",
          "domain": "amazon.com",
          "total": 664,
          "count": 16,
          "perMonth": 102,
          "perWeek": 23,
          "perDay": 3.3,
          "freq": "week"
        },
        {
          "name": "Temu",
          "domain": "temu.com",
          "total": 241,
          "count": 2,
          "perMonth": 37,
          "perWeek": 8,
          "perDay": 1.2,
          "freq": "week"
        },
        {
          "name": "Amevista",
          "domain": null,
          "total": 191,
          "count": 1,
          "perMonth": 29,
          "perWeek": 7,
          "perDay": 1.0,
          "freq": "one-off"
        },
        {
          "name": "Vanquish Fitness",
          "domain": "vanquishfitness.com",
          "total": 104,
          "count": 1,
          "perMonth": 16,
          "perWeek": 4,
          "perDay": 0.5,
          "freq": "one-off"
        },
        {
          "name": "Nike",
          "domain": "nike.com",
          "total": 96,
          "count": 1,
          "perMonth": 15,
          "perWeek": 3,
          "perDay": 0.5,
          "freq": "one-off"
        },
        {
          "name": "Dhl",
          "domain": "dhl.com",
          "total": 89,
          "count": 1,
          "perMonth": 14,
          "perWeek": 3,
          "perDay": 0.4,
          "freq": "one-off"
        },
        {
          "name": "Prorider Stores",
          "domain": null,
          "total": 58,
          "count": 1,
          "perMonth": 9,
          "perWeek": 2,
          "perDay": 0.3,
          "freq": "one-off"
        },
        {
          "name": "Pretty Shiny Shop",
          "domain": null,
          "total": 57,
          "count": 1,
          "perMonth": 9,
          "perWeek": 2,
          "perDay": 0.3,
          "freq": "one-off"
        }
      ],
      "extra": {
        "count": 2,
        "perMonth": 14
      }
    },
    {
      "key": "groceries",
      "label": "Groceries",
      "total": 588,
      "count": 34,
      "perMonth": 90,
      "perWeek": 21,
      "perDay": 3.0,
      "deductible": 0,
      "business": false,
      "spark": [
        0.76,
        1.0,
        0.81,
        0.89,
        0.0,
        0.37,
        0.03
      ],
      "merchants": [
        {
          "name": "Bonpreu",
          "domain": "bonpreu.cat",
          "total": 397,
          "count": 12,
          "perMonth": 61,
          "perWeek": 14,
          "perDay": 2.0,
          "freq": "week"
        },
        {
          "name": "Condis",
          "domain": "condis.es",
          "total": 67,
          "count": 8,
          "perMonth": 10,
          "perWeek": 2,
          "perDay": 0.3,
          "freq": "week"
        },
        {
          "name": "Sainsbury'S",
          "domain": "sainsburys.co.uk",
          "total": 33,
          "count": 5,
          "perMonth": 5,
          "perWeek": 1,
          "perDay": 0.2,
          "freq": "week"
        },
        {
          "name": "Marks & Spencer",
          "domain": "marksandspencer.com",
          "total": 31,
          "count": 3,
          "perMonth": 5,
          "perWeek": 1,
          "perDay": 0.2,
          "freq": "week"
        },
        {
          "name": "Picardia",
          "domain": null,
          "total": 30,
          "count": 1,
          "perMonth": 5,
          "perWeek": 1,
          "perDay": 0.1,
          "freq": "one-off"
        },
        {
          "name": "Ametller Origen",
          "domain": "ametllerorigen.com",
          "total": 24,
          "count": 2,
          "perMonth": 4,
          "perWeek": 1,
          "perDay": 0.1,
          "freq": "week"
        },
        {
          "name": "Aldi",
          "domain": null,
          "total": 4,
          "count": 1,
          "perMonth": 1,
          "perWeek": 0,
          "perDay": 0.0,
          "freq": "one-off"
        },
        {
          "name": "Mercadona",
          "domain": "mercadona.es",
          "total": 3,
          "count": 2,
          "perMonth": 0,
          "perWeek": 0,
          "perDay": 0.0,
          "freq": "week"
        }
      ]
    },
    {
      "key": "health_fitness",
      "label": "Health & fitness",
      "total": 309,
      "count": 9,
      "perMonth": 47,
      "perWeek": 11,
      "perDay": 1.6,
      "deductible": 0,
      "business": false,
      "spark": [
        0.71,
        0.71,
        1.0,
        0.0,
        0.35,
        0.35,
        0.0
      ],
      "merchants": [
        {
          "name": "Classpass",
          "domain": "classpass.com",
          "total": 175,
          "count": 5,
          "perMonth": 27,
          "perWeek": 6,
          "perDay": 0.9,
          "freq": "week"
        },
        {
          "name": "Sundy Unisex Hair Salo",
          "domain": null,
          "total": 105,
          "count": 3,
          "perMonth": 16,
          "perWeek": 4,
          "perDay": 0.5,
          "freq": "week"
        },
        {
          "name": "Puregym",
          "domain": "puregym.com",
          "total": 29,
          "count": 1,
          "perMonth": 4,
          "perWeek": 1,
          "perDay": 0.1,
          "freq": "one-off"
        }
      ]
    },
    {
      "key": "transport",
      "label": "Transport",
      "total": 276,
      "count": 38,
      "perMonth": 42,
      "perWeek": 10,
      "perDay": 1.4,
      "deductible": 0,
      "business": false,
      "spark": [
        0.17,
        0.2,
        1.0,
        0.17,
        0.1,
        0.09,
        0.0
      ],
      "merchants": [
        {
          "name": "Uber",
          "domain": "uber.com",
          "total": 168,
          "count": 32,
          "perMonth": 26,
          "perWeek": 6,
          "perDay": 0.8,
          "freq": "week"
        },
        {
          "name": "Free Now",
          "domain": "free-now.com",
          "total": 58,
          "count": 4,
          "perMonth": 9,
          "perWeek": 2,
          "perDay": 0.3,
          "freq": "week"
        },
        {
          "name": "Greater Anglia",
          "domain": "greateranglia.co.uk",
          "total": 50,
          "count": 2,
          "perMonth": 8,
          "perWeek": 2,
          "perDay": 0.2,
          "freq": "week"
        }
      ]
    },
    {
      "key": "subscriptions",
      "label": "Subscriptions",
      "total": 234,
      "count": 25,
      "perMonth": 36,
      "perWeek": 8,
      "perDay": 1.2,
      "deductible": 0,
      "business": false,
      "spark": [
        1.0,
        0.37,
        0.87,
        0.17,
        0.37,
        0.37,
        0.2
      ],
      "merchants": [
        {
          "name": "Youtube",
          "domain": "youtube.com",
          "total": 102,
          "count": 8,
          "perMonth": 16,
          "perWeek": 4,
          "perDay": 0.5,
          "freq": "week"
        },
        {
          "name": "Amazon Prime",
          "domain": "amazon.com",
          "total": 56,
          "count": 8,
          "perMonth": 9,
          "perWeek": 2,
          "perDay": 0.3,
          "freq": "week"
        },
        {
          "name": "Netflix",
          "domain": "netflix.com",
          "total": 42,
          "count": 6,
          "perMonth": 6,
          "perWeek": 1,
          "perDay": 0.2,
          "freq": "week"
        },
        {
          "name": "Spotify",
          "domain": "spotify.com",
          "total": 29,
          "count": 2,
          "perMonth": 4,
          "perWeek": 1,
          "perDay": 0.1,
          "freq": "week"
        },
        {
          "name": "Amazon",
          "domain": "amazon.com",
          "total": 5,
          "count": 1,
          "perMonth": 1,
          "perWeek": 0,
          "perDay": 0.0,
          "freq": "one-off"
        }
      ]
    },
    {
      "key": "fees",
      "label": "Fees",
      "total": 176,
      "count": 7,
      "perMonth": 27,
      "perWeek": 6,
      "perDay": 0.9,
      "deductible": 0,
      "business": false,
      "spark": [
        0.0,
        1.0,
        0.21,
        0.13,
        0.0,
        0.0,
        0.0
      ],
      "merchants": [
        {
          "name": "Pastdue Credit",
          "domain": null,
          "total": 114,
          "count": 1,
          "perMonth": 17,
          "perWeek": 4,
          "perDay": 0.6,
          "freq": "one-off"
        },
        {
          "name": "Metal Plan Fee",
          "domain": null,
          "total": 52,
          "count": 3,
          "perMonth": 8,
          "perWeek": 2,
          "perDay": 0.3,
          "freq": "week"
        },
        {
          "name": "Costa Coffee",
          "domain": null,
          "total": 11,
          "count": 3,
          "perMonth": 2,
          "perWeek": 0,
          "perDay": 0.1,
          "freq": "week"
        }
      ]
    },
    {
      "key": "insurance",
      "label": "Insurance",
      "total": 104,
      "count": 1,
      "perMonth": 16,
      "perWeek": 4,
      "perDay": 0.5,
      "deductible": 0,
      "business": false,
      "spark": [
        0.0,
        0.0,
        1.0,
        0.0,
        0.0,
        0.0,
        0.0
      ],
      "merchants": [
        {
          "name": "Www.Assurantsoluti",
          "domain": null,
          "total": 104,
          "count": 1,
          "perMonth": 16,
          "perWeek": 4,
          "perDay": 0.5,
          "freq": "one-off"
        }
      ]
    }
  ]
};
