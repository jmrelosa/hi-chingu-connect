import { Mic, SendHorizonal } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Direction, TranslationStyle } from "@/lib/threads-store";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";
import { cn } from "@/lib/utils";

import { StyleSelector } from "./StyleSelector";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onVoiceSubmit?: (text: string) => void;
  direction: Direction;
  style: TranslationStyle;
  onStyleChange: (style: TranslationStyle) => void;
  disabled?: boolean;
}

export function Composer({
  value,
  onChange,
  onSubmit,
  onVoiceSubmit,
  direction,
  style,
  onStyleChange,
  disabled,
}: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const placeholder =
    direction === "en-ko" ? "Type in English…" : "Type in Korean…";
  const hint =
    direction === "en-ko"
      ? "Type in English — we'll translate to Korean."
      : "한국어로 입력하세요 — 영어로 번역됩니다.";

  const lang = direction === "en-ko" ? "en-US" : "ko-KR";

  const handleResult = useCallback(
    (transcript: string) => {
      onChange(transcript);
      if (onVoiceSubmit) {
        onVoiceSubmit(transcript);
      } else {
        onSubmit();
      }
    },
    [onChange, onSubmit, onVoiceSubmit],
  );

  const { listening, start, stop, supported } = useSpeechRecognition({
    lang,
    onResult: handleResult,
    onError: (e) => {
      if (e && e !== "no-speech" && e !== "aborted") console.warn("Speech error:", e);
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSubmit();
    requestAnimationFrame(() => ref.current?.focus());
  };

  const toggleMic = () => {
    if (!supported) return;
    if (listening) stop();
    else {
      try {
        start();
      } catch (e) {
        console.warn(e);
        toast.error("Please allow microphone access in your browser settings");
      }
    }
  };

  const handleFocus = () => {
    // Auto-scroll page so input stays above the mobile keyboard
    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    });
  };

  return (
    <div className="pb-safe sticky bottom-0 border-t border-border bg-background px-3 pt-2 sm:px-6 sm:pt-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            {listening ? (
              <span className="font-medium text-brand-green">Listening…</span>
            ) : (
              hint
            )}
          </p>
          <StyleSelector value={style} onChange={onStyleChange} />
        </div>
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
          <Textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            rows={1}
            className="min-h-[44px] max-h-40 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-base leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-[15px]"
          />
          <Button
            type="button"
            variant={listening ? "default" : "ghost"}
            size="icon"
            onClick={toggleMic}
            onTouchEnd={(e) => {
              e.preventDefault();
              toggleMic();
            }}
            disabled={!supported || disabled}
            title={
              !supported
                ? "Voice input requires Chrome or Edge"
                : listening
                  ? "Stop listening"
                  : `Speak in ${direction === "en-ko" ? "English" : "Korean"}`
            }
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            aria-pressed={listening}
            style={{ minWidth: 48, minHeight: 48, touchAction: "manipulation" }}
            className={cn(
              "relative z-50 h-12 w-12 shrink-0 rounded-full sm:h-10 sm:w-10",
              listening
                ? "mic-recording bg-brand-green text-white hover:bg-brand-green/90"
                : "text-muted-foreground",
              !supported && "cursor-not-allowed opacity-60",
            )}
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={disabled || !value.trim()}
            size="icon"
            aria-label="Send message"
            style={{ minWidth: 48, minHeight: 48, touchAction: "manipulation" }}
            className="relative z-50 h-12 w-12 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 sm:h-10 sm:w-10"
          >
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
