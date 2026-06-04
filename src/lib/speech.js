// Text-to-speech via the Web Speech API. No dependency; degrades to a no-op
// where the browser doesn't support it (e.g. some older mobile webviews).

// Pick the best available voice for a language, preferring an exact match
// (e.g. es-AR) then any voice sharing the base language (es-*).
function pickVoice(lang) {
  const synth = window.speechSynthesis;
  const voices = synth.getVoices() || [];
  if (!voices.length) return null;
  const base = lang.split("-")[0];
  return (
    voices.find((v) => v.lang && v.lang.toLowerCase() === lang.toLowerCase()) ||
    voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(base)) ||
    null
  );
}

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Speak `text` in `lang` (e.g. "es-AR"). Cancels any in-flight utterance first
// so rapid taps don't queue up.
export function speak(text, lang = "es-ES") {
  if (!speechSupported() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  u.rate = 0.95;
  synth.speak(u);
}
