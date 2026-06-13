import { useCallback, useEffect, useRef, useState } from "react";

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

function loadVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const v = window.speechSynthesis.getVoices();
  if (v.length) {
    cachedVoices = v;
    voicesLoaded = true;
  }
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => loadVoices();
}

/** Pick the best voice for a BCP-47 language tag (e.g. "en-US", "ko-KR"). */
export function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (!cachedVoices.length) loadVoices();
  if (!cachedVoices.length) return null;
  const target = lang.toLowerCase();
  const base = target.split("-")[0];
  // Prefer exact match, then language prefix, prefer local/default voices.
  const score = (v: SpeechSynthesisVoice) => {
    const l = v.lang.toLowerCase();
    let s = 0;
    if (l === target) s += 100;
    else if (l.startsWith(base + "-") || l === base) s += 50;
    else return -1;
    if (v.localService) s += 5;
    if (v.default) s += 3;
    return s;
  };
  return (
    cachedVoices
      .map((v) => ({ v, s: score(v) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)[0]?.v ?? null
  );
}

export function isTtsSupported() {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}

export function useTts() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const currentRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    currentRef.current = null;
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    (id: string, text: string, lang: string) => {
      if (!isTtsSupported() || !text) return;
      const synth = window.speechSynthesis;
      // Toggle off if already speaking this id
      if (currentRef.current === id) {
        stop();
        return;
      }
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      const voice = pickVoice(lang);
      if (voice) utter.voice = voice;
      utter.onend = () => {
        if (currentRef.current === id) {
          currentRef.current = null;
          setSpeakingId(null);
        }
      };
      utter.onerror = () => {
        if (currentRef.current === id) {
          currentRef.current = null;
          setSpeakingId(null);
        }
      };
      currentRef.current = id;
      setSpeakingId(id);
      synth.speak(utter);
    },
    [stop],
  );

  return { speak, stop, speakingId, supported: isTtsSupported() };
}