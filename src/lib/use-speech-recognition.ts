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

  const start = useCallback(() => {
    const Ctor = getSRCtor();

    if (!Ctor) {
      alert("SpeechRecognition not supported");
      onErrorRef.current?.("unsupported");
      return;
    }

    try {
      recRef.current?.abort();
    } catch {}

    const rec = new Ctor();

    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onstart = () => {
      console.log("SR START");
      setListening(true);
    };

    rec.onend = () => {
      console.log("SR END");
      setListening(false);
      recRef.current = null;
    };

    rec.onerror = (e: any) => {
      console.log("SR ERROR:", e?.error);

      alert(`Speech Error: ${e?.error}`);

      setListening(false);
      recRef.current = null;

      onErrorRef.current?.(e?.error ?? "error");
    };

    rec.onresult = (e: any) => {
      console.log("SR RESULT:", e);

      const transcript = Array.from(e.results as any[])
        .map((r: any) => r[0]?.transcript ?? "")
        .join(" ")
        .trim();

      console.log("TRANSCRIPT:", transcript);

      if (transcript) {
        alert(`Transcript: ${transcript}`);
        onResultRef.current(transcript);
      } else {
        alert("Result received but transcript is empty");
      }
    };

    recRef.current = rec;

    try {
      rec.start();
    } catch (err) {
      console.error("SR START ERROR:", err);
      alert(`Start Error: ${String(err)}`);
    }
  }, [lang]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { listening, start, stop, supported };
}
