// Default data — schemaVersion 2.
//
// Schema is the contract: additive changes only. Renames break things.
// `migrate()` in storage.js upgrades older blobs in place.

export const SCHEMA_VERSION = 4;

const seedGoal = (id, label, target, priorities = []) => ({
  id,
  label,
  target: target ?? null,
  priorities: priorities.map((p, i) => ({
    id: p.id ?? `${id}-p${i + 1}`,
    label: p.label,
    done: !!p.done,
    starred: !!p.starred,
    starredAt: p.starred ? new Date().toISOString().slice(0, 10) : null,
    doneAt: p.done ? new Date().toISOString().slice(0, 10) : null,
    notes: p.notes ?? "",
    isPrivate: !!p.isPrivate,
  })),
});

export const defaultState = {
  schemaVersion: SCHEMA_VERSION,
  todayDate: null,

  northStar:
    "Sears Melvin — the UK's most trusted memorial mason brand by 2027.",

  habitLog: { gym: [], spanish: [], clean: [], sleep: [] },
  habitNoLog: { gym: [], spanish: [], clean: [], sleep: [] },

  // Today's Top 3 — three ad-hoc priority slots, directly editable in the
  // TopThree component. Auto-filled when a Work todo is starred. Always
  // exactly three entries; an empty title means the slot is unused.
  topThree: [
    { id: 1, title: "", projectKey: null, done: false },
    { id: 2, title: "", projectKey: null, done: false },
    { id: 3, title: "", projectKey: null, done: false },
  ],

  upcoming: [
    { id: 1, date: "Tue 5", text: "Aylin 1-1 — raise discussion", cat: "CM" },
    { id: 2, date: "Wed 6", text: "Push leg day", cat: "Fitness" },
    { id: 3, date: "Thu 7", text: "Giorgi sync — Mason App release", cat: "UD" },
    { id: 4, date: "Sat 9", text: "Spanish exchange meetup", cat: "Personal" },
  ],

  // Routines: cadence-driven recurring tasks (Phase 2 — UI deferred).
  routines: [],

  // Top-level summary card on dashboard. Source-of-truth for cross-cutting numbers.
  metrics: {
    unifyMTD: "£0",
    smMTD: "£3,240",
    cmMTD: "£18,420",
    boddyPipeline: "CHF 84k",
    netWorth: "£—",
    daysToTrip: "42",
    nextTripName: "Buenos Aires",
    spanishLevel: "B1+",
  },

  projects: {
    health: {
      goals: [
        seedGoal("body", "Cut to 12% BF", null, [
          { label: "3 strength sessions this week" },
          { label: "Hit 2.0g protein/kg daily" },
          { label: "Bodyweight back under 82kg" },
        ]),
      ],
      // Flat structure consumed by HealthProject. v3→v4 migration moves any
      // legacy `markers.{weight,waist}` into here and converts waist's old
      // `value` field to `cm`.
      weight: [
        { date: "2026-05-03", kg: 80.8 },
        { date: "2026-05-04", kg: 80.5 },
        { date: "2026-05-05", kg: 80.2 },
        { date: "2026-05-06", kg: 80.0 },
        { date: "2026-05-07", kg: 79.6 },
        { date: "2026-05-08", kg: 79.3 },
        { date: "2026-05-09", kg: 79.1 },
      ],
      waist: [
        { date: "2026-05-09", cm: 90 },
      ],
      food: [],
      targets: {
        weightKg: 78,
        waistCm: 85,
        calories: 2200,
        proteinG: 160,
        direction: "cut",
      },
    },

    finance: {
      goals: [],
      // Weekly net-worth snapshots in EUR. Powers the sparkline on the
      // Finance dashboard card. Dashboard reads the last 7 entries.
      netWorthHistory: [
        { date: "2026-03-29", eur: -8200 },
        { date: "2026-04-05", eur: -7600 },
        { date: "2026-04-12", eur: -6900 },
        { date: "2026-04-19", eur: -6100 },
        { date: "2026-04-26", eur: -5700 },
        { date: "2026-05-03", eur: -5300 },
        { date: "2026-05-09", eur: -4806 },
      ],
      // Monthly revenue snapshots in EUR — sum of all monthlyRevenue lines for
      // that month. Powers the Δ-vs-last-month figure on the Finance rail card.
      revenueHistory: [
        { month: "2026-04", eur: 10500 },
        { month: "2026-05", eur: 10833 },
      ],
      // EUR-only after the simplification. Tax timeline merged in here.
      debts: [
        { id: 1, name: "Student loan", amount: 25806 },
        { id: 2, name: "Tax debt", amount: 5000 },
      ],
      savings: [
        { id: 1, name: "Revolut", amount: 8000 },
      ],
      investments: [
        { id: 1, name: "eToro", amount: 12000 },
      ],
      // Flat monthly revenue lines — no UD percentage formula, plain EUR.
      monthlyRevenue: [
        { id: 1, name: "Unify Digital", amount: 8343 },
        { id: 2, name: "Sears Melvin", amount: 0 },
        { id: 3, name: "BODDY", amount: 2250 },
        { id: 4, name: "Personal training", amount: 240 },
      ],
    },

    travel: {
      goals: [],
      trips: [
        {
          id: 1,
          name: "Georgia",
          start: "2026-05-11",
          end: "2026-05-15",
          sub: "May 11 – May 15 · 4 nights",
          days: 2,
          checklist: { flights: false, accommodation: false, activities: false, gym: false, coworking: false, eSIM: false, insurance: false },
          notes: "",
        },
        {
          id: 2,
          name: "London",
          start: "2026-05-27",
          end: "2026-06-04",
          sub: "May 27 – Jun 4 · 8 nights",
          days: 18,
          checklist: { flights: false, accommodation: false, activities: false, gym: false, coworking: false, eSIM: false, insurance: false },
          notes: "",
        },
        {
          id: 3,
          name: "Riga / Tallinn",
          start: "2026-08-01",
          end: "2026-08-20",
          sub: "Aug 1 – Aug 20 · 19 nights · TBC",
          days: 84,
          checklist: { flights: false, accommodation: false, activities: false, gym: false, coworking: false, eSIM: false, insurance: false },
          notes: "TBC",
        },
        {
          id: 4,
          name: "Florence",
          start: "2026-08-21",
          end: "2026-08-24",
          sub: "Aug 21 – Aug 24 · 3 nights",
          days: 104,
          checklist: { flights: false, accommodation: false, activities: false, gym: false, coworking: false, eSIM: false, insurance: false },
          notes: "",
        },
        {
          id: 5,
          name: "Croatia (Hvar)",
          start: "2026-08-29",
          end: "2026-08-30",
          sub: "Aug 29 – Aug 30 · 1 night",
          days: 112,
          checklist: { flights: false, accommodation: false, activities: false, gym: false, coworking: false, eSIM: false, insurance: false },
          notes: "",
        },
      ],
      points: { ba: 0, iberia: 0, emirates: 0, revpoints: 0, amex: 0, lastUpdated: null },
      wishlist: [],
      sublets: [],
      // Recommender (places/events/restaurants) — schema slot only; UI deferred.
      recommender: {},
    },

    work: {
      goals: [],
      businesses: [
        {
          id: 1,
          key: "unify",
          name: "Unify Digital",
          color: "#534AB7",
          value: "£8,343",
          meta: "Mason App · 65% to launch",
          goals: [],
          todos: [
            { id: 1, title: "Stripe production keys swapped in", done: false },
            { id: 2, title: "Apple submission v1", done: false },
            { id: 3, title: "Mason App TestFlight invites", done: true },
          ],
        },
        {
          id: 2,
          key: "searsMelvin",
          name: "Sears Melvin",
          color: "#E24B4A",
          value: "0 orders",
          meta: "5 enquiries",
          goals: [],
          todos: [
            { id: 1, title: "Finalise pricing sheet", done: false },
            { id: 2, title: "Reply to 5 enquiries", done: false },
          ],
        },
        {
          id: 3,
          key: "churchill",
          name: "Churchill Memorials",
          color: "#BA7517",
          value: "£5,800",
          meta: "14 orders · 6 permits pending",
          goals: [],
          todos: [
            { id: 1, title: "Chase 6 outstanding permits", done: false },
            { id: 2, title: "Aylin 1-1 — raise discussion", done: false },
          ],
        },
        {
          id: 4,
          key: "boddy",
          name: "BODDY",
          color: "#185FA5",
          value: "Support team",
          meta: "12 deals · 3 close this week",
          goals: [],
          todos: [
            { id: 1, title: "Weekly status to founders", done: false },
            { id: 2, title: "Onboarding doc for new SDR", done: false },
          ],
        },
      ],
    },

    learning: {
      goals: [
        seedGoal("spanish-b2", "Spanish — reach B2", null, [
          { label: "30 min daily through phrase deck" },
          { label: "Weekly intercambio meet-up" },
        ]),
      ],
      reading: [],
      // Spanish micro-learning. Argentine focus: vos in conjugations, no vosotros.
      // Pronouns order: yo, vos, él/ella, nosotros, ellos/ellas
      spanish: {
        phrases: [
          { id: 1, es: "Quisiera que me lo confirmes antes del viernes", en: "I'd like you to confirm it before Friday", note: "subjunctive after querer" },
          { id: 2, es: "Me parece que tendríamos que replantearlo", en: "I think we'd have to rethink it", note: "soft business pushback" },
          { id: 3, es: "Se me hizo tarde, perdón", en: "I lost track of time, sorry", note: "reflexive — common Argentine apology" },
          { id: 4, es: "¿Te parece si lo dejamos para la semana que viene?", en: "What do you think about leaving it for next week?", note: "polite reschedule" },
          { id: 5, es: "Hasta cierto punto, sí", en: "To a certain extent, yes", note: "nuanced agreement" },
          { id: 6, es: "Si tuviera más tiempo, lo haría yo mismo", en: "If I had more time, I'd do it myself", note: "imperfect subjunctive + conditional" },
          { id: 7, es: "Estoy hasta las manos esta semana", en: "I'm swamped this week", note: "Argentine idiom" },
          { id: 8, es: "¿Qué tenés en mente?", en: "What do you have in mind?", note: "voseo — opens the door" },
          { id: 9, es: "Diría que vale la pena intentarlo", en: "I'd say it's worth a shot", note: "conditional — softer opinion" },
          { id: 10, es: "No es que no quiera, es que no puedo ahora", en: "It's not that I don't want to, it's that I can't right now", note: "no es que + subjunctive" },
          { id: 11, es: "Me re copó la idea", en: "I really loved the idea", note: "Argentine slang — 're' intensifier" },
          { id: 12, es: "¿Podrías pasarme el contacto?", en: "Could you send me the contact?", note: "conditional request" },
        ],
        chunks: [
          { id: 1, situation: "First-date opener at a café", turns: [
            { speaker: "them", es: "¿Qué te gusta hacer los fines de semana?", en: "What do you like to do on weekends?" },
            { speaker: "you", options: [
              { tone: "casual", es: "Depende del fin. Si estoy con energía, gym y algo afuera; si no, leer y descansar.", en: "Depends on the weekend. If I have energy, gym and something outside; if not, reading and resting." },
              { tone: "neutral", es: "Suelo entrenar y, cuando puedo, viajar. ¿Y vos?", en: "I usually train and, when I can, travel. And you?" },
              { tone: "playful", es: "Depende con quién los pase. ¿Qué tenés en mente?", en: "Depends who I spend them with. What do you have in mind?" },
            ]},
            { speaker: "them", es: "Ah, copado. ¿Y solés salir o más bien quedarte tranquilo?", en: "Oh, cool. And do you usually go out or rather stay in?" },
            { speaker: "you", options: [
              { tone: "honest", es: "Mitad y mitad. Algo de gimnasio, algo de café, algo de cama.", en: "Half and half. Some gym, some café, some bed." },
              { tone: "outgoing", es: "Salir, pero sin volverme loco. ¿Tenés algún lugar favorito?", en: "Going out, but not crazy. Do you have a favourite spot?" },
              { tone: "homebody", es: "Más quedarme. Pero por la persona indicada hago una excepción.", en: "More staying in. But for the right person I make an exception." },
            ]},
          ], bucket: 0, lastSeen: null },
          { id: 2, situation: "Pushing back on a client deadline", turns: [
            { speaker: "them", es: "Necesitamos esto para el lunes.", en: "We need this by Monday." },
            { speaker: "you", options: [
              { tone: "diplomatic", es: "Entiendo la urgencia. Para hacerlo bien, te propongo el miércoles.", en: "I understand the urgency. To do it right, I'd propose Wednesday." },
              { tone: "firm", es: "Para garantizar la calidad, lo más temprano sería el miércoles.", en: "To guarantee quality, the earliest would be Wednesday." },
              { tone: "collaborative", es: "Si movemos algunas piezas, ¿podríamos apuntar al martes?", en: "If we move some pieces around, could we aim for Tuesday?" },
            ]},
            { speaker: "them", es: "El cliente está esperando.", en: "The client is waiting." },
            { speaker: "you", options: [
              { tone: "calm", es: "Lo sé. Prefiero entregar algo sólido el miércoles que algo a medias el lunes.", en: "I know. I'd rather deliver something solid Wednesday than half-baked Monday." },
              { tone: "owning", es: "Yo me encargo de comunicárselo. ¿Te paso un texto que puedas reenviar?", en: "I'll handle telling them. Want me to send a message you can forward?" },
            ]},
          ], bucket: 0, lastSeen: null },
          { id: 3, situation: "Declining an invitation politely", turns: [
            { speaker: "them", es: "¿Te sumás a cenar el sábado?", en: "Want to join us for dinner Saturday?" },
            { speaker: "you", options: [
              { tone: "warm", es: "Me encantaría, pero ya tengo algo. ¿Lo dejamos para la próxima?", en: "I'd love to, but I already have something. Can we leave it for next time?" },
              { tone: "brief", es: "El sábado no puedo. ¿Otro día de la semana?", en: "I can't Saturday. Another day this week?" },
              { tone: "open", es: "Esta vez no llego, pero avisame la próxima.", en: "Can't make it this time, but let me know next time." },
            ]},
          ], bucket: 0, lastSeen: null },
          { id: 4, situation: "Boss invites you for a one-on-one", turns: [
            { speaker: "them", es: "¿Tenés un minuto? Quería ver cómo te está yendo.", en: "Got a minute? I wanted to see how you're doing." },
            { speaker: "you", options: [
              { tone: "direct", es: "Sí, justo quería revisar mi compensación a la luz de los últimos meses.", en: "Yes, I actually wanted to review my compensation given the last few months." },
              { tone: "framed", es: "Sí. Me gustaría hablar del siguiente paso en mi rol.", en: "Yes. I'd like to talk about the next step in my role." },
              { tone: "data-led", es: "Sí. Te preparé un resumen de lo que entregué este trimestre, ¿lo vemos?", en: "Yes. I put together a summary of what I delivered this quarter, shall we look at it?" },
            ]},
          ], bucket: 0, lastSeen: null },
          { id: 5, situation: "Recovering from a missed message", turns: [
            { speaker: "them", es: "Te escribí hace tres días.", en: "I wrote to you three days ago." },
            { speaker: "them", es: "¿Está todo bien?", en: "Is everything OK?" },
            { speaker: "you", options: [
              { tone: "honest", es: "Perdón, se me pasó. Estuve a full y recién lo veo.", en: "Sorry, it slipped by. I was swamped and just saw it." },
              { tone: "warm", es: "Me hiciste falta esta semana. Perdón por la demora.", en: "I missed you this week. Sorry for the delay." },
              { tone: "playful", es: "Estoy en deuda. ¿Cómo te compenso?", en: "I owe you. How do I make it up to you?" },
            ]},
          ], bucket: 0, lastSeen: null },
          { id: 6, situation: "Disagreeing with a teammate", turns: [
            { speaker: "them", es: "Yo lo haría así, sin más.", en: "I'd just do it this way, end of story." },
            { speaker: "you", options: [
              { tone: "respectful", es: "Entiendo tu punto, pero me preocupa el impacto a largo plazo.", en: "I get your point, but I'm worried about the long-term impact." },
              { tone: "questioning", es: "¿Y si lo miramos desde otro ángulo antes de decidir?", en: "What if we look at it from another angle before deciding?" },
              { tone: "alternative", es: "No necesariamente. Hay otra forma que podría funcionar mejor.", en: "Not necessarily. There's another way that could work better." },
            ]},
          ], bucket: 0, lastSeen: null },
          { id: 7, situation: "Catching up after a long time", turns: [
            { speaker: "them", es: "¡Tanto tiempo! ¿Cómo andás?", en: "It's been so long! How are you?" },
            { speaker: "you", options: [
              { tone: "honest", es: "Bastante movido, la verdad. Mil cosas pasando, pero contento. ¿Vos?", en: "Pretty busy, honestly. A thousand things going on, but happy. You?" },
              { tone: "brief", es: "Todo bien, con mucho laburo. ¿Cómo va lo tuyo?", en: "All good, lots of work. How's yours going?" },
              { tone: "deflect", es: "Largo de contar. Mejor contame vos primero.", en: "Long story. You go first." },
            ]},
          ], bucket: 0, lastSeen: null },
          { id: 8, situation: "Negotiating at a market", turns: [
            { speaker: "them", es: "Son cincuenta euros.", en: "That'll be fifty euros." },
            { speaker: "you", options: [
              { tone: "polite", es: "¿Habría algo de margen si me llevo dos?", en: "Would there be some flexibility if I take two?" },
              { tone: "direct", es: "Te ofrezco cuarenta en efectivo.", en: "I'll offer you forty in cash." },
              { tone: "soft", es: "Me encanta, pero está fuera de mi presupuesto. ¿Algo más cerca de treinta?", en: "I love it, but it's outside my budget. Anything closer to thirty?" },
            ]},
            { speaker: "them", es: "Es lo mejor que puedo hacer. Cuarenta y cinco, último precio.", en: "That's the best I can do. Forty-five, final price." },
            { speaker: "you", options: [
              { tone: "accept", es: "Cerramos. Cuarenta y cinco está bien.", en: "Done. Forty-five works." },
              { tone: "walk", es: "Lo voy a pensar y te aviso. Gracias igual.", en: "I'll think about it and let you know. Thanks anyway." },
            ]},
          ], bucket: 0, lastSeen: null },
        ],
        verbs: [
          { id: 1, infinitive: "tener", en: "to have", forms: { past: "tuve", present: "tengo", future: "tendré" }, rule: "yo stems: teng- · tuv- · tendr-", correctPasses: 0 },
          { id: 2, infinitive: "hacer", en: "to do / make", forms: { past: "hice", present: "hago", future: "haré" }, rule: "yo stems: hag- · hic- · har-", correctPasses: 0 },
          { id: 3, infinitive: "ir", en: "to go", forms: { past: "fui", present: "voy", future: "iré" }, rule: "fully irregular; preterite shared with ser (fui = was/went)", correctPasses: 0 },
          { id: 4, infinitive: "ser", en: "to be (essential)", forms: { past: "fui", present: "soy", future: "seré" }, rule: "fully irregular; preterite shared with ir", correctPasses: 0 },
          { id: 5, infinitive: "estar", en: "to be (state)", forms: { past: "estuve", present: "estoy", future: "estaré" }, rule: "preterite stem 'estuv-'; future regular", correctPasses: 0 },
          { id: 6, infinitive: "poder", en: "can / to be able to", forms: { past: "pude", present: "puedo", future: "podré" }, rule: "stems: pued- (o→ue) · pud- · podr-", correctPasses: 0 },
          { id: 7, infinitive: "querer", en: "to want / love", forms: { past: "quise", present: "quiero", future: "querré" }, rule: "stems: quier- (e→ie) · quis- · querr- (double r)", correctPasses: 0 },
          { id: 8, infinitive: "decir", en: "to say / tell", forms: { past: "dije", present: "digo", future: "diré" }, rule: "stems: dig- · dij- · dir-", correctPasses: 0 },
          { id: 9, infinitive: "ver", en: "to see", forms: { past: "vi", present: "veo", future: "veré" }, rule: "preterite no accent (vi); present 'veo' irregular", correctPasses: 0 },
          { id: 10, infinitive: "saber", en: "to know (a fact)", forms: { past: "supe", present: "sé", future: "sabré" }, rule: "stems: sé · sup- · sabr-", correctPasses: 0 },
          { id: 11, infinitive: "venir", en: "to come", forms: { past: "vine", present: "vengo", future: "vendré" }, rule: "stems: veng- · vin- · vendr-", correctPasses: 0 },
          { id: 12, infinitive: "dar", en: "to give", forms: { past: "di", present: "doy", future: "daré" }, rule: "preterite no accent (di); present 'doy' irregular; future regular", correctPasses: 0 },
        ],
        phraseIndex: 0,
        chunkIndex: 0,
        phrasesSeen: [],
      },
      // Mirrors Spanish shape. Istanbul-Turkish flavour, informal sen form.
      turkish: {
        phrases: [
          { id: 1, tr: "Cuma'dan önce onaylamanı isterim", en: "I'd like you to confirm it before Friday", note: "subjunctive 'isterim' + -mAnI suffix" },
          { id: 2, tr: "Bence bunu tekrar düşünmemiz gerek", en: "I think we'd have to rethink it", note: "soft business pushback" },
          { id: 3, tr: "Geç kaldım, kusura bakma", en: "I lost track of time, sorry", note: "common informal apology" },
          { id: 4, tr: "Haftaya bıraksak nasıl olur?", en: "How about we leave it for next week?", note: "polite reschedule with -sA conditional" },
          { id: 5, tr: "Bir yere kadar evet", en: "To a certain extent, yes", note: "nuanced agreement" },
          { id: 6, tr: "Vaktim olsa kendim yapardım", en: "If I had more time, I'd do it myself", note: "conditional + aorist" },
          { id: 7, tr: "Bu hafta başımı kaşıyacak vaktim yok", en: "I'm swamped this week", note: "Turkish idiom — lit. 'no time to scratch my head'" },
          { id: 8, tr: "Aklında ne var?", en: "What do you have in mind?", note: "opens the door, casual" },
          { id: 9, tr: "Denemeye değer derim", en: "I'd say it's worth a shot", note: "softer opinion with aorist 'derim'" },
          { id: 10, tr: "İstemediğimden değil, şu an yapamıyorum", en: "It's not that I don't want to, it's that I can't right now", note: "-DIğImdAn değil structure" },
          { id: 11, tr: "Fikre bayıldım", en: "I really loved the idea", note: "'bayılmak' — strong positive informal" },
          { id: 12, tr: "Numarayı bana atar mısın?", en: "Could you send me the contact?", note: "polite request with 'atmak' (slang send)" },
        ],
        chunks: [
          { id: 1, situation: "First-date opener at a café", turns: [
            { speaker: "them", tr: "Hafta sonları ne yapmayı seversin?", en: "What do you like to do on weekends?" },
            { speaker: "you", options: [
              { tone: "casual", tr: "Haftasına göre. Enerjim varsa spor ve dışarı; yoksa kitap ve dinlenme.", en: "Depends on the weekend. If I have energy, gym and outside; if not, reading and resting." },
              { tone: "neutral", tr: "Genelde antrenman, fırsat olunca seyahat. Ya sen?", en: "I usually train and, when I can, travel. And you?" },
              { tone: "playful", tr: "Kiminle geçirdiğime bağlı. Aklında ne var?", en: "Depends who I spend them with. What do you have in mind?" },
            ]},
            { speaker: "them", tr: "Güzel. Genelde dışarı mı çıkarsın yoksa evde mi takılırsın?", en: "Nice. Do you usually go out or rather stay in?" },
            { speaker: "you", options: [
              { tone: "honest", tr: "Yarı yarıya. Biraz spor, biraz kafe, biraz da yatak.", en: "Half and half. Some gym, some café, some bed." },
              { tone: "outgoing", tr: "Çıkmayı severim ama abartmam. Favori bir mekânın var mı?", en: "I like going out, but I don't overdo it. Do you have a favourite spot?" },
              { tone: "homebody", tr: "Daha çok evdeyim. Ama doğru kişi için istisna yaparım.", en: "More staying in. But for the right person I make an exception." },
            ]},
          ], bucket: 0, lastSeen: null },
          { id: 2, situation: "Pushing back on a client deadline", turns: [
            { speaker: "them", tr: "Bunu Pazartesi'ye yetiştirmemiz lazım.", en: "We need this by Monday." },
            { speaker: "you", options: [
              { tone: "diplomatic", tr: "Aciliyeti anlıyorum. Düzgün yapmak için Çarşamba'yı öneririm.", en: "I understand the urgency. To do it right, I'd propose Wednesday." },
              { tone: "firm", tr: "Kaliteyi garantilemek için en erken Çarşamba olur.", en: "To guarantee quality, the earliest would be Wednesday." },
              { tone: "collaborative", tr: "Bazı şeyleri kaydırırsak Salı'ya yetiştirebilir miyiz?", en: "If we move some pieces around, could we aim for Tuesday?" },
            ]},
            { speaker: "them", tr: "Müşteri bekliyor.", en: "The client is waiting." },
            { speaker: "you", options: [
              { tone: "calm", tr: "Biliyorum. Pazartesi yarım yamalak yerine Çarşamba sağlam vermeyi tercih ederim.", en: "I know. I'd rather deliver something solid Wednesday than half-baked Monday." },
              { tone: "owning", tr: "Onlara ben söylerim. İletebileceğin bir mesaj atayım mı?", en: "I'll handle telling them. Want me to send a message you can forward?" },
            ]},
          ], bucket: 0, lastSeen: null },
          { id: 3, situation: "Declining an invitation politely", turns: [
            { speaker: "them", tr: "Cumartesi yemeğe gelir misin?", en: "Want to join us for dinner Saturday?" },
            { speaker: "you", options: [
              { tone: "warm", tr: "Çok isterdim ama bir işim var. Sonraya bıraksak?", en: "I'd love to, but I already have something. Can we leave it for next time?" },
              { tone: "brief", tr: "Cumartesi olmaz. Hafta içi başka bir gün?", en: "I can't Saturday. Another day this week?" },
              { tone: "open", tr: "Bu sefer yetişemem ama bir dahakine haber ver.", en: "Can't make it this time, but let me know next time." },
            ]},
          ], bucket: 0, lastSeen: null },
          { id: 4, situation: "Boss invites you for a one-on-one", turns: [
            { speaker: "them", tr: "Bir dakikan var mı? Nasıl gittiğine bakmak istiyordum.", en: "Got a minute? I wanted to see how you're doing." },
            { speaker: "you", options: [
              { tone: "direct", tr: "Var. Aslında son aylar ışığında maaşımı konuşmak istiyordum.", en: "Yes, I actually wanted to review my compensation given the last few months." },
              { tone: "framed", tr: "Var. Roldeki bir sonraki adımı konuşmak isterim.", en: "Yes. I'd like to talk about the next step in my role." },
              { tone: "data-led", tr: "Var. Bu çeyrek tesliminin özetini hazırladım, beraber bakalım mı?", en: "Yes. I put together a summary of what I delivered this quarter, shall we look at it?" },
            ]},
          ], bucket: 0, lastSeen: null },
          { id: 5, situation: "Recovering from a missed message", turns: [
            { speaker: "them", tr: "Sana üç gün önce yazmıştım.", en: "I wrote to you three days ago." },
            { speaker: "them", tr: "Her şey yolunda mı?", en: "Is everything OK?" },
            { speaker: "you", options: [
              { tone: "honest", tr: "Pardon, gözümden kaçmış. Çok yoğundum, daha yeni gördüm.", en: "Sorry, it slipped by. I was swamped and just saw it." },
              { tone: "warm", tr: "Bu hafta seni özledim. Geç kaldığım için affet.", en: "I missed you this week. Sorry for the delay." },
              { tone: "playful", tr: "Sana borçluyum. Nasıl telafi edeyim?", en: "I owe you. How do I make it up to you?" },
            ]},
          ], bucket: 0, lastSeen: null },
          { id: 6, situation: "Disagreeing with a teammate", turns: [
            { speaker: "them", tr: "Ben olsam böyle yapardım, o kadar.", en: "I'd just do it this way, end of story." },
            { speaker: "you", options: [
              { tone: "respectful", tr: "Anlıyorum ama uzun vadeli etkisi beni endişelendiriyor.", en: "I get your point, but I'm worried about the long-term impact." },
              { tone: "questioning", tr: "Karar vermeden başka bir açıdan baksak?", en: "What if we look at it from another angle before deciding?" },
              { tone: "alternative", tr: "Şart değil. Daha iyi işleyebilecek başka bir yol var.", en: "Not necessarily. There's another way that could work better." },
            ]},
          ], bucket: 0, lastSeen: null },
          { id: 7, situation: "Catching up after a long time", turns: [
            { speaker: "them", tr: "Ne kadar oldu! Nasılsın?", en: "It's been so long! How are you?" },
            { speaker: "you", options: [
              { tone: "honest", tr: "Açıkçası baya hareketli. Bin tane şey oluyor ama keyifliyim. Sen nasılsın?", en: "Pretty busy, honestly. A thousand things going on, but happy. You?" },
              { tone: "brief", tr: "İyiyim, iş yoğun. Sende ne var ne yok?", en: "All good, lots of work. How's yours going?" },
              { tone: "deflect", tr: "Uzun hikâye. Önce sen anlat.", en: "Long story. You go first." },
            ]},
          ], bucket: 0, lastSeen: null },
          { id: 8, situation: "Negotiating at a market", turns: [
            { speaker: "them", tr: "Elli euro.", en: "That'll be fifty euros." },
            { speaker: "you", options: [
              { tone: "polite", tr: "İki tane alsam bir esneklik olur mu?", en: "Would there be some flexibility if I take two?" },
              { tone: "direct", tr: "Sana kırk veririm, nakit.", en: "I'll offer you forty in cash." },
              { tone: "soft", tr: "Çok beğendim ama bütçemi aşıyor. Otuza yakın bir şey?", en: "I love it, but it's outside my budget. Anything closer to thirty?" },
            ]},
            { speaker: "them", tr: "Yapabileceğimin en iyisi bu. Kırk beş, son fiyat.", en: "That's the best I can do. Forty-five, final price." },
            { speaker: "you", options: [
              { tone: "accept", tr: "Anlaştık. Kırk beş tamam.", en: "Done. Forty-five works." },
              { tone: "walk", tr: "Düşünüp haber veririm. Yine de teşekkürler.", en: "I'll think about it and let you know. Thanks anyway." },
            ]},
          ], bucket: 0, lastSeen: null },
        ],
        verbs: [
          { id: 1, infinitive: "olmak", en: "to be / become", forms: { past: "oldum", present: "oluyorum", future: "olacağım" }, rule: "core copula; aorist 'olurum'", correctPasses: 0 },
          { id: 2, infinitive: "yapmak", en: "to do / make", forms: { past: "yaptım", present: "yapıyorum", future: "yapacağım" }, rule: "regular -mak; vowel harmony a→ı", correctPasses: 0 },
          { id: 3, infinitive: "gitmek", en: "to go", forms: { past: "gittim", present: "gidiyorum", future: "gideceğim" }, rule: "consonant softening t→d before vowels", correctPasses: 0 },
          { id: 4, infinitive: "gelmek", en: "to come", forms: { past: "geldim", present: "geliyorum", future: "geleceğim" }, rule: "regular -mek; e-class harmony", correctPasses: 0 },
          { id: 5, infinitive: "almak", en: "to take / buy", forms: { past: "aldım", present: "alıyorum", future: "alacağım" }, rule: "regular -mak", correctPasses: 0 },
          { id: 6, infinitive: "vermek", en: "to give", forms: { past: "verdim", present: "veriyorum", future: "vereceğim" }, rule: "regular -mek", correctPasses: 0 },
          { id: 7, infinitive: "görmek", en: "to see", forms: { past: "gördüm", present: "görüyorum", future: "göreceğim" }, rule: "ö→ü harmony in -Iyor", correctPasses: 0 },
          { id: 8, infinitive: "bilmek", en: "to know", forms: { past: "bildim", present: "biliyorum", future: "bileceğim" }, rule: "regular -mek; common aorist 'bilirim'", correctPasses: 0 },
          { id: 9, infinitive: "istemek", en: "to want", forms: { past: "istedim", present: "istiyorum", future: "isteyeceğim" }, rule: "buffer y in future after vowel-stem", correctPasses: 0 },
          { id: 10, infinitive: "demek", en: "to say", forms: { past: "dedim", present: "diyorum", future: "diyeceğim" }, rule: "irregular: e→i in present/future", correctPasses: 0 },
          { id: 11, infinitive: "edebilmek", en: "to be able to", forms: { past: "edebildim", present: "edebiliyorum", future: "edebileceğim" }, rule: "ability suffix -Abil; commonly attached to other verbs", correctPasses: 0 },
          { id: 12, infinitive: "durmak", en: "to stop / stand", forms: { past: "durdum", present: "duruyorum", future: "duracağım" }, rule: "regular -mak; o→u harmony in -Iyor", correctPasses: 0 },
        ],
        phraseIndex: 0,
        chunkIndex: 0,
        phrasesSeen: [],
      },
    },

    journal: {
      goals: [],
      entries: [],
      mood: [
        { date: "2026-05-09", energy: 3, mood: 3 },
      ],
      weekly: [
        {
          weekISO: "2026-W19",
          prompts: [
            { q: "What went well?", a: "" },
            { q: "What didn't?", a: "" },
            { q: "What's next?", a: "" },
          ],
        },
      ],
      monthly: [],
      // Top-of-mind: short rolling list, FIFO ~10 entries, surfaced in dashboard summary.
      topOfMind: ["Buenos Aires planning", "Mason App launch"],
    },

    relationships: {
      goals: [],
      contacts: [
        { id: 1, name: "Matt Sears", initials: "MS", color: "amber", last: "3 days ago · WhatsApp", action: "due call", stale: false },
        { id: 2, name: "Aylin", initials: "AY", color: "purple", last: "yesterday · email", action: "1-1 Tue", stale: false },
        { id: 3, name: "Giorgi", initials: "G", color: "red", last: "6 days ago · Slack", action: "overdue", stale: true },
        { id: 4, name: "Mum", initials: "M", color: "teal", last: "9 days ago · phone", action: "overdue", stale: true },
      ],
    },

    charity: {
      goals: [],
    },
  },
};

export const nextId = (items) => (items.length ? Math.max(...items.map((i) => i.id || 0)) + 1 : 1);

// Walk every project and collect priorities along with their parent goal+project keys.
// Returns: [{ projectKey, goalId, goalLabel, priority }]
export function allPriorities(state) {
  const out = [];
  const projects = state.projects || {};
  for (const [pk, p] of Object.entries(projects)) {
    const goals = p?.goals || [];
    for (const g of goals) {
      for (const pr of g.priorities || []) {
        out.push({ projectKey: pk, goalId: g.id, goalLabel: g.label, priority: pr });
      }
    }
    // Work has nested business goals too.
    if (pk === "work") {
      for (const b of p.businesses || []) {
        for (const g of b.goals || []) {
          for (const pr of g.priorities || []) {
            out.push({ projectKey: `work:${b.key}`, goalId: g.id, goalLabel: g.label, priority: pr });
          }
        }
      }
    }
  }
  return out;
}
