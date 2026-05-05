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
      chunks: [
        { id: 1, situation: "First-date opener at a café", prompt: "¿Qué te gusta hacer los fines de semana?", responses: [
          { tone: "casual", text: "Depende del fin. Si estoy con energía, gym y algo afuera; si no, leer y descansar." },
          { tone: "neutral", text: "Suelo entrenar y, cuando puedo, viajar. ¿Y vos?" },
          { tone: "playful", text: "Depende con quién los pase. ¿Qué tenés en mente?" },
        ], bucket: 0, lastSeen: null },
        { id: 2, situation: "Pushing back on a client deadline", prompt: "Necesitamos esto para el lunes.", responses: [
          { tone: "diplomatic", text: "Entiendo la urgencia. Para hacerlo bien, te propongo el miércoles." },
          { tone: "firm", text: "Para garantizar la calidad, lo más temprano sería el miércoles." },
          { tone: "collaborative", text: "Si movemos algunas piezas, ¿podríamos apuntar al martes?" },
        ], bucket: 0, lastSeen: null },
        { id: 3, situation: "Declining an invitation politely", prompt: "¿Te sumás a cenar el sábado?", responses: [
          { tone: "warm", text: "Me encantaría, pero ya tengo algo. ¿Lo dejamos para la próxima?" },
          { tone: "brief", text: "El sábado no puedo. ¿Otro día de la semana?" },
          { tone: "open", text: "Esta vez no llego, pero avisame la próxima." },
        ], bucket: 0, lastSeen: null },
        { id: 4, situation: "Asking for a raise opener", prompt: "Quería hablar de algo importante.", responses: [
          { tone: "direct", text: "Quería revisar mi compensación a la luz de los resultados de los últimos meses." },
          { tone: "framed", text: "Me gustaría conversar sobre el siguiente paso en mi rol y lo que eso implica." },
          { tone: "data-led", text: "Te preparé un resumen de lo que entregué este trimestre. ¿Lo revisamos juntos?" },
        ], bucket: 0, lastSeen: null },
        { id: 5, situation: "Recovering from missing a message", prompt: "Te escribí hace tres días.", responses: [
          { tone: "honest", text: "Perdón, se me pasó. Estuve a full y recién lo veo." },
          { tone: "warm", text: "Me hiciste falta esta semana. Perdón por la demora." },
          { tone: "playful", text: "Estoy en deuda. ¿Cómo te compenso?" },
        ], bucket: 0, lastSeen: null },
        { id: 6, situation: "Disagreeing with a teammate", prompt: "Yo lo haría así, sin más.", responses: [
          { tone: "respectful", text: "Entiendo tu punto, pero me preocupa el impacto a largo plazo." },
          { tone: "questioning", text: "¿Y si lo miramos desde otro ángulo antes de decidir?" },
          { tone: "alternative", text: "No necesariamente. Hay otra forma que podría funcionar mejor." },
        ], bucket: 0, lastSeen: null },
        { id: 7, situation: "Catching up after a long time", prompt: "¡Tanto tiempo! ¿Cómo andás?", responses: [
          { tone: "honest", text: "Bastante movido, la verdad. Mil cosas pasando, pero contento. ¿Vos?" },
          { tone: "brief", text: "Todo bien, con mucho laburo. ¿Cómo va lo tuyo?" },
          { tone: "deflect", text: "Largo de contar. Mejor contame vos primero." },
        ], bucket: 0, lastSeen: null },
        { id: 8, situation: "Negotiating at a market", prompt: "Son cincuenta euros.", responses: [
          { tone: "polite", text: "¿Habría algo de margen si me llevo dos?" },
          { tone: "direct", text: "Te ofrezco cuarenta en efectivo." },
          { tone: "soft", text: "Me encanta, pero está fuera de mi presupuesto. ¿Algo más cerca de treinta?" },
        ], bucket: 0, lastSeen: null },
      ],
      // Verbs: Argentine voseo. Forms order: yo, vos, él/ella, nosotros, ellos/ellas.
      // Each verb tracks correct passes for the simple Leitner-style rule reveal.
      verbs: [
        { id: 1, infinitive: "tener", tense: "presente", forms: ["tengo", "tenés", "tiene", "tenemos", "tienen"], rule: "-go in yo + e→ie stem change (vos keeps -és, no diphthong)", correctPasses: 0 },
        { id: 2, infinitive: "poder", tense: "presente", forms: ["puedo", "podés", "puede", "podemos", "pueden"], rule: "o→ue stem change in stressed syllables (vos keeps -és, no diphthong)", correctPasses: 0 },
        { id: 3, infinitive: "querer", tense: "presente", forms: ["quiero", "querés", "quiere", "queremos", "quieren"], rule: "e→ie stem change (vos keeps -és, no diphthong)", correctPasses: 0 },
        { id: 4, infinitive: "hacer", tense: "presente", forms: ["hago", "hacés", "hace", "hacemos", "hacen"], rule: "-go in yo, regular elsewhere", correctPasses: 0 },
        { id: 5, infinitive: "decir", tense: "presente", forms: ["digo", "decís", "dice", "decimos", "dicen"], rule: "-go in yo + e→i stem change (vos keeps -ís)", correctPasses: 0 },
        { id: 6, infinitive: "ir", tense: "presente", forms: ["voy", "vas", "va", "vamos", "van"], rule: "fully irregular — memorize", correctPasses: 0 },
        { id: 7, infinitive: "ser", tense: "presente", forms: ["soy", "sos", "es", "somos", "son"], rule: "fully irregular — note vos: sos", correctPasses: 0 },
        { id: 8, infinitive: "estar", tense: "presente", forms: ["estoy", "estás", "está", "estamos", "están"], rule: "stress shifts to ending (accents on á)", correctPasses: 0 },
        { id: 9, infinitive: "tener", tense: "pretérito indefinido", forms: ["tuve", "tuviste", "tuvo", "tuvimos", "tuvieron"], rule: "irregular stem 'tuv-' + shared endings (-e, -iste, -o, -imos, -ieron)", correctPasses: 0 },
        { id: 10, infinitive: "hacer", tense: "pretérito indefinido", forms: ["hice", "hiciste", "hizo", "hicimos", "hicieron"], rule: "stem 'hic-' (note 'hizo' for él/ella to keep soft c sound)", correctPasses: 0 },
        { id: 11, infinitive: "ir", tense: "pretérito indefinido", forms: ["fui", "fuiste", "fue", "fuimos", "fueron"], rule: "shares forms with ser — context disambiguates", correctPasses: 0 },
        { id: 12, infinitive: "decir", tense: "pretérito indefinido", forms: ["dije", "dijiste", "dijo", "dijimos", "dijeron"], rule: "stem 'dij-' — note 'dijeron' (no 'i' after j)", correctPasses: 0 },
        { id: 13, infinitive: "comer", tense: "imperfecto", forms: ["comía", "comías", "comía", "comíamos", "comían"], rule: "-er/-ir imperfect: -ía, -ías, -ía, -íamos, -ían (fully regular)", correctPasses: 0 },
        { id: 14, infinitive: "hablar", tense: "imperfecto", forms: ["hablaba", "hablabas", "hablaba", "hablábamos", "hablaban"], rule: "-ar imperfect: -aba, -abas, -aba, -ábamos, -aban (fully regular)", correctPasses: 0 },
        { id: 15, infinitive: "tener", tense: "subjuntivo presente", forms: ["tenga", "tengas", "tenga", "tengamos", "tengan"], rule: "yo present (tengo) → drop -o, add opposite-vowel endings", correctPasses: 0 },
        { id: 16, infinitive: "poder", tense: "subjuntivo presente", forms: ["pueda", "puedas", "pueda", "podamos", "puedan"], rule: "stem change preserved except in nosotros", correctPasses: 0 },
        { id: 17, infinitive: "ir", tense: "subjuntivo presente", forms: ["vaya", "vayas", "vaya", "vayamos", "vayan"], rule: "irregular stem 'vay-'", correctPasses: 0 },
        { id: 18, infinitive: "tener", tense: "condicional", forms: ["tendría", "tendrías", "tendría", "tendríamos", "tendrían"], rule: "irregular stem 'tendr-' + imperfect endings", correctPasses: 0 },
        { id: 19, infinitive: "hacer", tense: "condicional", forms: ["haría", "harías", "haría", "haríamos", "harían"], rule: "irregular stem 'har-' + imperfect endings", correctPasses: 0 },
        { id: 20, infinitive: "poder", tense: "condicional", forms: ["podría", "podrías", "podría", "podríamos", "podrían"], rule: "irregular stem 'podr-' + imperfect endings", correctPasses: 0 },
      ],
      // UI cursors so we resume where we left off
      phraseIndex: 0,
      verbIndex: 0,
      chunkIndex: 0,
    },
  },
};

export const nextId = (items) => (items.length ? Math.max(...items.map((i) => i.id || 0)) + 1 : 1);
