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
  // Food diary — fast end time + per-meal log.
  // fastEndTime is stored as "HH:MM" (today implied; full ISO once persistence lands).
  // foods: { id, time: "HH:MM", what, kcal, p (protein g), c (carbs g), f (fat g) }
  foodDiary: {
    fastEndTime: null,
    foods: [],
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
      // attempts/correct are lifetime row-level counters: incremented every time
      // the user submits all three forms together. correctPasses is the current
      // mastery streak (resets on any miss); attempts/correct are cumulative.
      verbs: [
        { id: 1, infinitive: "tener", en: "to have", forms: { past: "tuve", present: "tengo", future: "tendré" }, rule: "yo stems: teng- · tuv- · tendr-", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 2, infinitive: "hacer", en: "to do / make", forms: { past: "hice", present: "hago", future: "haré" }, rule: "yo stems: hag- · hic- · har-", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 3, infinitive: "ir", en: "to go", forms: { past: "fui", present: "voy", future: "iré" }, rule: "fully irregular; preterite shared with ser (fui = was/went)", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 4, infinitive: "ser", en: "to be (essential)", forms: { past: "fui", present: "soy", future: "seré" }, rule: "fully irregular; preterite shared with ir", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 5, infinitive: "estar", en: "to be (state)", forms: { past: "estuve", present: "estoy", future: "estaré" }, rule: "preterite stem 'estuv-'; future regular", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 6, infinitive: "poder", en: "can / to be able to", forms: { past: "pude", present: "puedo", future: "podré" }, rule: "stems: pued- (o→ue) · pud- · podr-", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 7, infinitive: "querer", en: "to want / love", forms: { past: "quise", present: "quiero", future: "querré" }, rule: "stems: quier- (e→ie) · quis- · querr- (double r)", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 8, infinitive: "decir", en: "to say / tell", forms: { past: "dije", present: "digo", future: "diré" }, rule: "stems: dig- · dij- · dir-", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 9, infinitive: "ver", en: "to see", forms: { past: "vi", present: "veo", future: "veré" }, rule: "preterite no accent (vi); present 'veo' irregular", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 10, infinitive: "saber", en: "to know (a fact)", forms: { past: "supe", present: "sé", future: "sabré" }, rule: "stems: sé · sup- · sabr-", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 11, infinitive: "venir", en: "to come", forms: { past: "vine", present: "vengo", future: "vendré" }, rule: "stems: veng- · vin- · vendr-", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 12, infinitive: "dar", en: "to give", forms: { past: "di", present: "doy", future: "daré" }, rule: "preterite no accent (di); present 'doy' irregular; future regular", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 13, infinitive: "salir", en: "to go out / leave", forms: { past: "salí", present: "salgo", future: "saldré" }, rule: "stems: salg- · sal- · saldr-", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 14, infinitive: "poner", en: "to put", forms: { past: "puse", present: "pongo", future: "pondré" }, rule: "stems: pong- · pus- · pondr-", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 15, infinitive: "traer", en: "to bring", forms: { past: "traje", present: "traigo", future: "traeré" }, rule: "stems: traig- · traj- · traer-", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 16, infinitive: "comer", en: "to eat", forms: { past: "comí", present: "como", future: "comeré" }, rule: "regular -er; preterite stress on i (comí)", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 17, infinitive: "hablar", en: "to speak", forms: { past: "hablé", present: "hablo", future: "hablaré" }, rule: "regular -ar (hablé · hablo · hablaré)", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 18, infinitive: "llegar", en: "to arrive", forms: { past: "llegué", present: "llego", future: "llegaré" }, rule: "spelling: -gar → -gué in preterite yo (llegué)", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 19, infinitive: "leer", en: "to read", forms: { past: "leí", present: "leo", future: "leeré" }, rule: "regular -er; preterite leí keeps stress on i", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 20, infinitive: "vivir", en: "to live", forms: { past: "viví", present: "vivo", future: "viviré" }, rule: "regular -ir (viví · vivo · viviré)", correctPasses: 0, attempts: 0, correct: 0 },
      ],
      // Rolling log of the last N row checks across all verbs — drives the
      // "recent" accuracy %. Lifetime accuracy is computed from per-verb
      // attempts/correct totals. Capped on insertion to keep state small.
      verbHistory: [],
      // UI cursors so we resume where we left off
      phraseIndex: 0,
      chunkIndex: 0,
      // Phrase IDs the user has cycled through this session — drives the
      // "seen" completion metric on the Phrase tab. Resets on reload (until
      // localStorage persistence lands).
      phrasesSeen: [],
    },
    // Turkish micro-learning. Same shape as spanish; ben (I) form across
    // past (di-past), present continuous (-yor), future (-ecek).
    // NOTE: content drafted by AI — should be reviewed by a native speaker
    // before serious practice.
    turkish: {
      phrases: [
        { id: 1, es: "Acaba müsait misiniz?", en: "Are you available?", note: "polite question with mi-/mı-" },
        { id: 2, es: "Bunu beraber inceleyelim mi?", en: "Shall we look at this together?", note: "first-person plural suggestion -elim" },
        { id: 3, es: "Maalesef şu an gelemem.", en: "Unfortunately I can't come right now.", note: "negative ability -emem (can't)" },
        { id: 4, es: "Sizin için ne yapabilirim?", en: "What can I do for you?", note: "ability suffix -abil-" },
        { id: 5, es: "Bir saniye lütfen, hemen dönüyorum.", en: "One second please, I'll be right back.", note: "continuous as near future" },
        { id: 6, es: "Çok teşekkür ederim, bunu unutmayacağım.", en: "Thank you so much, I won't forget this.", note: "negative future -mayacak" },
        { id: 7, es: "Sanırım yanlış anladım.", en: "I think I misunderstood.", note: "softener 'sanırım' (I think)" },
        { id: 8, es: "Ne olursa olsun yanındayım.", en: "Whatever happens, I'm with you.", note: "fixed expression 'ne olursa olsun'" },
        { id: 9, es: "Bunu daha sonra konuşabilir miyiz?", en: "Can we talk about this later?", note: "ability + question form" },
        { id: 10, es: "Açıkçası, pek emin değilim.", en: "Honestly, I'm not very sure.", note: "softener 'açıkçası'" },
        { id: 11, es: "Belki başka bir gün görüşürüz.", en: "Maybe we'll see each other another day.", note: "aorist tense for general future" },
        { id: 12, es: "Senin için bir şey yapmamı ister misin?", en: "Do you want me to do something for you?", note: "embedded request structure" },
      ],
      chunks: [
        { id: 1, situation: "Asking directions in Istanbul", turns: [
          { speaker: "them", es: "Pardon, Galata Kulesi'ne nasıl gidebilirim?", en: "Excuse me, how can I get to Galata Tower?" },
          { speaker: "you", options: [
            { tone: "helpful", es: "Şu sokağı düz gidin, sonra sağa dönün.", en: "Go straight down that street, then turn right." },
            { tone: "friendly", es: "Buradan beş dakika yürürseniz görürsünüz.", en: "If you walk five minutes from here, you'll see it." },
            { tone: "apologetic", es: "Maalesef ben de buralı değilim.", en: "Unfortunately I'm not from here either." },
          ]},
          { speaker: "them", es: "Anladım, çok teşekkür ederim.", en: "Got it, thank you very much." },
          { speaker: "you", options: [
            { tone: "warm", es: "Rica ederim, kolay gelsin.", en: "You're welcome, take it easy." },
            { tone: "polite", es: "Bir şey değil, yolunuz açık olsun.", en: "It's nothing, may your road be open." },
          ]},
        ], bucket: 0, lastSeen: null },

        { id: 2, situation: "Ordering at a kebab shop", turns: [
          { speaker: "them", es: "Ne istersiniz?", en: "What would you like?" },
          { speaker: "you", options: [
            { tone: "direct", es: "Bir adana kebap, az acılı lütfen.", en: "One Adana kebab, mildly spicy please." },
            { tone: "asking", es: "Bugün ne tavsiye edersiniz?", en: "What would you recommend today?" },
            { tone: "careful", es: "Sebzeli bir şey var mı?", en: "Is there something with vegetables?" },
          ]},
          { speaker: "them", es: "Yanında ayran ister misiniz?", en: "Would you like ayran with that?" },
          { speaker: "you", options: [
            { tone: "yes", es: "Evet, ayran çok iyi olur.", en: "Yes, an ayran would be great." },
            { tone: "no", es: "Hayır, sadece su yeter, teşekkürler.", en: "No, just water is enough, thanks." },
          ]},
        ], bucket: 0, lastSeen: null },

        { id: 3, situation: "Polite refusal of an invitation", turns: [
          { speaker: "them", es: "Bu akşam bize gelmek ister misin?", en: "Want to come over tonight?" },
          { speaker: "you", options: [
            { tone: "warm", es: "Çok sağ ol ama bu akşam müsait değilim.", en: "Thank you so much but I'm not available tonight." },
            { tone: "alternative", es: "Bu akşam zor, başka gün olabilir mi?", en: "Tonight is hard, could it be another day?" },
            { tone: "honest", es: "Aslında çok yorgunum, başka zaman yapalım.", en: "Honestly I'm really tired, let's do it another time." },
          ]},
        ], bucket: 0, lastSeen: null },

        { id: 4, situation: "Apologising for being late", turns: [
          { speaker: "them", es: "Geciktin biraz.", en: "You're a bit late." },
          { speaker: "you", options: [
            { tone: "honest", es: "Çok özür dilerim, trafik berbattı.", en: "I'm so sorry, the traffic was awful." },
            { tone: "explaining", es: "Pardon, bir işim çıktı, hemen geldim.", en: "Sorry, something came up, I came as fast as I could." },
            { tone: "owning", es: "Haklısın, daha erken çıkmam gerekiyordu.", en: "You're right, I should have left earlier." },
          ]},
        ], bucket: 0, lastSeen: null },

        { id: 5, situation: "Asking for help at work", turns: [
          { speaker: "them", es: "Yardıma ihtiyacın var mı?", en: "Do you need help?" },
          { speaker: "you", options: [
            { tone: "direct", es: "Evet aslında, bir konuda fikrini almak istiyorum.", en: "Yes actually, I'd like your opinion on something." },
            { tone: "polite", es: "Müsait olduğunda kısaca konuşabilir miyiz?", en: "When you're free, can we talk briefly?" },
            { tone: "self-reliant", es: "Şimdilik iyiyim, takılırsam söylerim.", en: "I'm fine for now, I'll say if I get stuck." },
          ]},
        ], bucket: 0, lastSeen: null },

        { id: 6, situation: "Catching up with a friend", turns: [
          { speaker: "them", es: "Uzun zamandır görüşemedik, nasılsın?", en: "We haven't seen each other in a long time, how are you?" },
          { speaker: "you", options: [
            { tone: "honest", es: "İyiyim, biraz yoğunum ama her şey yolunda. Sen nasılsın?", en: "I'm good, a bit busy but everything's fine. You?" },
            { tone: "brief", es: "İyi, çalışıyorum işte. Senden ne haber?", en: "Good, working as usual. What's new with you?" },
            { tone: "deflect", es: "Anlatması uzun sürer. Önce sen anlat.", en: "It's a long story. You go first." },
          ]},
        ], bucket: 0, lastSeen: null },

        { id: 7, situation: "Disagreeing politely with a colleague", turns: [
          { speaker: "them", es: "Bence bu plan en iyisi.", en: "I think this plan is the best one." },
          { speaker: "you", options: [
            { tone: "respectful", es: "Anlıyorum, ama bence farklı bir açıdan bakmaya değer.", en: "I get it, but I think it's worth looking from another angle." },
            { tone: "questioning", es: "Şu noktayı tekrar düşünebilir miyiz?", en: "Can we rethink that point?" },
            { tone: "alternative", es: "Mutlaka değil. Belki başka bir yol da işe yarayabilir.", en: "Not necessarily. Maybe another way could also work." },
          ]},
        ], bucket: 0, lastSeen: null },

        { id: 8, situation: "Negotiating at the bazaar", turns: [
          { speaker: "them", es: "Bu yüz lira, son fiyat.", en: "This is one hundred lira, final price." },
          { speaker: "you", options: [
            { tone: "polite", es: "Biraz indirim mümkün mü?", en: "Is a small discount possible?" },
            { tone: "direct", es: "Seksen lira ne dersiniz?", en: "How about eighty lira?" },
            { tone: "soft", es: "Çok beğendim ama bütçemi aşıyor.", en: "I really like it but it's over my budget." },
          ]},
          { speaker: "them", es: "En fazla doksan lira yapabilirim.", en: "I can do ninety lira at most." },
          { speaker: "you", options: [
            { tone: "accept", es: "Tamam, anlaştık. Doksan lira olsun.", en: "Okay, deal. Ninety lira it is." },
            { tone: "walk", es: "Düşüneyim, sonra döneceğim. Yine de teşekkürler.", en: "Let me think about it, I'll come back. Thanks anyway." },
          ]},
        ], bucket: 0, lastSeen: null },
      ],
      // Verbs: ben (I) form across past (di-past), present continuous (-yor), future (-ecek).
      verbs: [
        { id: 1, infinitive: "olmak", en: "to be / become", forms: { past: "oldum", present: "oluyorum", future: "olacağım" }, rule: "olmak is irregular as helping verb; -yor present", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 2, infinitive: "yapmak", en: "to do / make", forms: { past: "yaptım", present: "yapıyorum", future: "yapacağım" }, rule: "regular -mak; vowel harmony -acak", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 3, infinitive: "gelmek", en: "to come", forms: { past: "geldim", present: "geliyorum", future: "geleceğim" }, rule: "regular -mek; future -ecek (front vowel harmony)", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 4, infinitive: "gitmek", en: "to go", forms: { past: "gittim", present: "gidiyorum", future: "gideceğim" }, rule: "consonant softening: t→d before vowels (gid-iyor)", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 5, infinitive: "görmek", en: "to see", forms: { past: "gördüm", present: "görüyorum", future: "göreceğim" }, rule: "vowel harmony with ö → ü in past, -üyor in present", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 6, infinitive: "bilmek", en: "to know", forms: { past: "bildim", present: "biliyorum", future: "bileceğim" }, rule: "regular -mek; e→i not happening here", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 7, infinitive: "istemek", en: "to want", forms: { past: "istedim", present: "istiyorum", future: "isteyeceğim" }, rule: "future buffer -y- (iste-y-eceğim)", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 8, infinitive: "demek", en: "to say", forms: { past: "dedim", present: "diyorum", future: "diyeceğim" }, rule: "irregular: e→i in present and future (di-)", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 9, infinitive: "almak", en: "to take / buy", forms: { past: "aldım", present: "alıyorum", future: "alacağım" }, rule: "regular -mak; back vowel harmony", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 10, infinitive: "vermek", en: "to give", forms: { past: "verdim", present: "veriyorum", future: "vereceğim" }, rule: "regular -mek; front vowel harmony", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 11, infinitive: "sevmek", en: "to love / like", forms: { past: "sevdim", present: "seviyorum", future: "seveceğim" }, rule: "regular -mek", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 12, infinitive: "anlamak", en: "to understand", forms: { past: "anladım", present: "anlıyorum", future: "anlayacağım" }, rule: "future buffer -y- (anla-y-acağım)", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 13, infinitive: "konuşmak", en: "to speak", forms: { past: "konuştum", present: "konuşuyorum", future: "konuşacağım" }, rule: "regular -mak with ş kept; o → u harmony", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 14, infinitive: "düşünmek", en: "to think", forms: { past: "düşündüm", present: "düşünüyorum", future: "düşüneceğim" }, rule: "vowel harmony: ü throughout", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 15, infinitive: "yemek", en: "to eat", forms: { past: "yedim", present: "yiyorum", future: "yiyeceğim" }, rule: "irregular: e→i in present and future (yi-)", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 16, infinitive: "içmek", en: "to drink", forms: { past: "içtim", present: "içiyorum", future: "içeceğim" }, rule: "regular -mek with ç kept", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 17, infinitive: "okumak", en: "to read", forms: { past: "okudum", present: "okuyorum", future: "okuyacağım" }, rule: "regular -mak; future buffer -y- (oku-y-acağım)", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 18, infinitive: "yazmak", en: "to write", forms: { past: "yazdım", present: "yazıyorum", future: "yazacağım" }, rule: "regular -mak; ı in -ıyor (back vowel harmony)", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 19, infinitive: "çalışmak", en: "to work / study", forms: { past: "çalıştım", present: "çalışıyorum", future: "çalışacağım" }, rule: "regular -mak; ş + ı harmony", correctPasses: 0, attempts: 0, correct: 0 },
        { id: 20, infinitive: "kalmak", en: "to stay", forms: { past: "kaldım", present: "kalıyorum", future: "kalacağım" }, rule: "regular -mak; back vowel harmony", correctPasses: 0, attempts: 0, correct: 0 },
      ],
      verbHistory: [],
      phraseIndex: 0,
      chunkIndex: 0,
      phrasesSeen: [],
    },
  },
};

export const nextId = (items) => (items.length ? Math.max(...items.map((i) => i.id || 0)) + 1 : 1);
