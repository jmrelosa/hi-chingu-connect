import { useCallback, useEffect, useRef, useState } from "react";

type SR = any;

function getSRCtor(): SR | null {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported() {
  return getSRCtor() !== null;
}

export interface UseSpeechRecognitionOptions {
  lang: string;
  onResult: (transcript: string) => void;
  onError?: (err: string) => void;
}

export function useSpeechRecognition({ lang, onResult, onError }: UseSpeechRecognitionOptions) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const supported = isSpeechRecognitionSupported();

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {}
  }, []);

  const start = useCallback(() => {
    const Ctor = getSRCtor();
    if (!Ctor) {
      onError?.("unsupported");
      return;
    }
    try {
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
        onError?.(e?.error ?? "error");
      };
      rec.onresult = (e: any) => {
        const transcript = Array.from(e.results)
          .map((r: any) => r[0]?.transcript ?? "")
          .join(" ")
          .trim();
        if (transcript) onResult(transcript);
      };
      recRef.current = rec;
      rec.start();
    } catch (err: any) {
      setListening(false);
      onError?.(err?.message ?? "error");
    }
  }, [lang, onResult, onError]);

  useEffect(() => () => stop(), [stop]);

  return { listening, start, stop, supported };
}