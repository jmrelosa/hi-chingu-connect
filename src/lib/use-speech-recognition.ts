import { useCallback, useEffect, useRef, useState } from "react";

function getSRCtor(): any | null {
  if (typeof window === "undefined") return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
}

export function isSpeechRecognitionSupported() {
  return getSRCtor() !== null;
}

export interface UseSpeechRecognitionOptions {
  lang: string;
  onResult: (transcript: string) => void;
  onError?: (err: string) => void;
}

export function useSpeechRecognition({
  lang,
  onResult,
  onError,
}: UseSpeechRecognitionOptions) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const supported = isSpeechRecognitionSupported();

  // Store callbacks in refs so `start` never captures stale closures.
  // Without this, every parent re-render produces a new `onResult` reference,
  // which invalidates `start`, which can cause the mic to silently fail on Android.
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {}
  }, []);

  // `start` only depends on `lang` — callbacks are accessed via refs
  const start = useCallback(() => {
    const Ctor = getSRCtor();
    if (!Ctor) {
      onErrorRef.current?.("unsupported");
      return;
    }

    // Abort any existing session before starting a new one
    try {
      recRef.current?.abort();
    } catch {}

    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onstart = () => setListening(true);

    rec.onend = () => {
      setListening(false);
      recRef.current = null;
    };

    rec.onerror = (e: any) => {
      setListening(false);
      recRef.current = null;
      onErrorRef.current?.(e?.error ?? "error");
    };

    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results as any[])
        .map((r: any) => r[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) onResultRef.current(transcript);
    };

    recRef.current = rec;
    rec.start();
  }, [lang]);

  useEffect(() => () => stop(), [stop]);

  return { listening, start, stop, supported };
}
