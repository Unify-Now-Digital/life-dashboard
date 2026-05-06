// Default data — what the dashboard shows on first load.
// Edit this to change the initial state when no data is present.

export const defaultState = {
  schemaVersion: 1,
  todayDate: null,
  priorities: [
    { text: "", done: false },
    { text: "", done: false },
    { text: "", done: false },
  ],
  // Per-habit list of ISO dates ("YYYY-MM-DD") when the habit was confirmed YES.
  // The streak = consecutive most-recent days in this list, ending at "yesterday or earlier".
  // "Today" is never logged here — we only confirm past days.
  habitLog: { gym: [], spanish: [], clean: [], sleep: [] },
  // Per-habit list of ISO dates explicitly confirmed NO. Used to know "answered" vs "unanswered".
  habitNoLog: { gym: [], spanish: [], clean: [], sleep: [] },
  journal: "",
  goals: [
    { id: "sm", label: "Sears Melvin — first 10 orders", current: 2, target: 10 },
    { id: "mason", label: "Mason App — go live", current: 65, target: 100 },
    { id: "spanish", label: "Spanish — reach B2", current: 55, target: 100 },
    { id: "body", label: "Body — cut to 12% BF", current: 70, target: 100 },
  ],
  upcoming: [
    { id: 1, date: "Tue 5", text: "Aylin 1-1 — raise discussion", cat: "CM" },
    { id: 2, date: "Wed 6", text: "Push leg day", cat: "Fitness" },
    { id: 3, date: "Thu 7", text: "Giorgi sync — Mason App release", cat: "UD" },
    { id: 4, date: "Sat 9", text: "Spanish exchange meetup", cat: "Personal" },
  ],
  northStar:
    "Build Sears Melvin into the UK's most trusted memorial mason while running a healthy, multilingual, well-travelled life from Barcelona.",
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
  trends: {
    spanishMinutes: [40, 55, 30, 70, 60, 80, 90],
    bodyweight: [83.0, 83.2, 82.8, 82.7, 82.5, 82.5, 82.4],
  },
  drilldowns: {
    businesses: [
      { id: 1, name: "Sears Melvin", color: "#E24B4A", value: "£3,240", meta: "2 orders · 5 enquiries" },
      { id: 2, name: "Churchill", color: "#BA7517", value: "£18,420", meta: "14 orders · 6 permits pending" },
      { id: 3, name: "BODDY", color: "#185FA5", value: "CHF 84k", meta: "12 deals · 3 close this week" },
      { id: 4, name: "Unify Digital", color: "#534AB7", value: "Mason App", meta: "65% to launch" },
    ],
    finances: {
      income: 8450,
      spending: 5210,
      saved: 3240,
      currency: "€",
      incomeBreakdown: [
        { id: 1, label: "Churchill", amount: 7000 },
        { id: 2, label: "Sears Melvin", amount: 1200 },
        { id: 3, label: "Other", amount: 250 },
      ],
      expenseBreakdown: [
        { id: 1, label: "Rent", amount: 1800 },
        { id: 2, label: "Food & social", amount: 1300 },
        { id: 3, label: "Travel & fun", amount: 600 },
        { id: 4, label: "Living", amount: 1510 },
      ],
    },
    travel: {
      countries: 12,
      daysAwayYTD: 38,
      trips: [
        { id: 1, name: "Buenos Aires", start: "2026-06-15", end: "2026-07-02", sub: "Jun 15 – Jul 2 · 17 nights", days: 42 },
        { id: 2, name: "London — Churchill / Matt", start: "2026-07-20", end: "2026-07-24", sub: "Jul 20 – Jul 24 · 4 nights", days: 77 },
        { id: 3, name: "Tbilisi — UD", start: "2026-09-10", end: "2026-09-17", sub: "Sep 10 – Sep 17 · 7 nights", days: 129 },
      ],
    },
    relationships: [
      { id: 1, name: "Matt Sears", initials: "MS", color: "amber", last: "3 days ago · WhatsApp", action: "due call", stale: false },
      { id: 2, name: "Aylin", initials: "AY", color: "purple", last: "yesterday · email", action: "1-1 Tue", stale: false },
      { id: 3, name: "Giorgi", initials: "G", color: "red", last: "6 days ago · Slack", action: "overdue", stale: true },
      { id: 4, name: "Mum", initials: "M", color: "teal", last: "9 days ago · phone", action: "overdue", stale: true },
    ],
    reading: [
      { id: 1, title: "The 7 Habits of Highly Effective People", author: "Stephen Covey", progress: 60, sub: "ch. 5 of 8" },
      { id: 2, title: "Mastery", author: "Robert Greene", progress: 22, sub: "ch. 2 of 6" },
      { id: 3, title: "Huberman Lab — Sleep & cognition", author: "Podcast · 1 episode behind", progress: null, sub: "" },
    ],
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
      // Conversations are multi-turn dialogues. Each turn is either:
      //   { speaker: "them", es, en }     — counterpart speaks
      //   { speaker: "you", options: [{ tone, es, en }, ...] }  — your possible replies
      // The user steps through one turn at a time, optionally tapping any
      // Spanish line to reveal its English translation beneath.
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
      // Verbs: yo form across past (pretérito indefinido), present, future.
      // Show many at once so the user can recall translations and conjugations together.
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
      // UI cursors so we resume where we left off
      phraseIndex: 0,
      chunkIndex: 0,
    },
  },
};

export const nextId = (items) => (items.length ? Math.max(...items.map((i) => i.id || 0)) + 1 : 1);
