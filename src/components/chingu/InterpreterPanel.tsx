import { Mic, Pencil, SendHorizonal } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage, Direction } from "@/lib/threads-store";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";
import { cn } from "@/lib/utils";

import { MessageBubble } from "./MessageBubble";

interface Props {
  /** Source language this panel speaks in. */
  direction: Direction;
  label: string;
  onLabelChange: (label: string) => void;
  messages: ChatMessage[];
  onSubmit: (text: string, voice: boolean) => void;
  tint: "blue" | "green";
  className?: string;
}

export function InterpreterPanel({
  direction,
  label,
  onLabelChange,
  messages,
  onSubmit,
  tint,
  className,
}: Props) {
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(label);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    setDraftLabel(label);
  }, [label]);

  const lang = direction === "en-ko" ? "en-US" : "ko-KR";
  const placeholder =
    direction === "en-ko" ? "Type or speak in English…" : "Type or speak in Korean…";

  const send = (text: string, voice: boolean) => {
    const t = text.trim();
    if (!t) return;
    onSubmit(t, voice);
    setValue("");
    requestAnimationFrame(() => taRef.current?.focus());
  };

  const handleVoice = useCallback(
    (transcript: string) => {
      setValue(transcript);
      send(transcript, true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { listening, start, stop, supported } = useSpeechRecognition({
    lang,
    onResult: handleVoice,
    onError: (e) => {
      if (e && e !== "no-speech" && e !== "aborted") console.warn("Speech error:", e);
    },
  });

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

  const tintClasses =
    tint === "blue"
      ? "bg-sky-50 border-sky-200"
      : "bg-emerald-50 border-emerald-200";
  const tintAccent = tint === "blue" ? "text-sky-700" : "text-emerald-700";
  const flag = direction === "en-ko" ? "🇺🇸" : "🇰🇷";
  const langName = direction === "en-ko" ? "English" : "Korean";

  const commitLabel = () => {
    const next = draftLabel.trim() || label;
    onLabelChange(next);
    setEditing(false);
  };

  return (
    <section
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border",
        tintClasses,
        className,
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-2 border-b bg-white/60 px-3 py-1.5 backdrop-blur sm:px-4 sm:py-2",
          tint === "blue" ? "border-sky-200" : "border-emerald-200",
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="text-base leading-none sm:text-lg">{flag}</span>
          {editing ? (
            <input
              autoFocus
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitLabel();
                if (e.key === "Escape") {
                  setDraftLabel(label);
                  setEditing(false);
                }
              }}
              className="min-w-0 rounded-md border border-border bg-white px-2 py-0.5 text-xs font-semibold text-foreground outline-none focus:border-primary sm:text-sm"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="group inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-foreground sm:text-sm"
              title="Click to rename"
            >
              <span className="truncate">{label}</span>
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
            </button>
          )}
          <span className={cn("hidden text-[10px] font-medium uppercase tracking-wide sm:inline sm:text-[11px]", tintAccent)}>
            {langName}
          </span>
        </div>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-3 sm:py-4">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-sm rounded-xl border border-white/60 bg-white/70 px-4 py-6 text-center text-sm text-muted-foreground shadow-sm">
            {direction === "en-ko"
              ? "Speak or type in English. Korean translation appears here."
              : "한국어로 말하거나 입력하세요. 영어 번역이 여기에 표시됩니다."}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
        )}
      </div>

      <div
        className={cn(
          "z-40 shrink-0 border-t bg-white/80 px-2 pt-2 pb-safe backdrop-blur sm:px-3",
          tint === "blue" ? "border-sky-200" : "border-emerald-200",
        )}
      >
        {listening && (
          <p className="mb-1 px-1 text-xs font-medium text-brand-green">Listening…</p>
        )}
        <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-1.5 shadow-sm focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
          <Textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() =>
              requestAnimationFrame(() =>
                taRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(value, false);
              }
            }}
            placeholder={placeholder}
            rows={1}
            className="min-h-[44px] max-h-32 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-base leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-[14px]"
          />
          <Button
            type="button"
            size="icon"
            variant={listening ? "default" : "ghost"}
            onClick={toggleMic}
            onTouchEnd={(e) => {
              e.preventDefault();
              toggleMic();
            }}
            disabled={!supported}
            title={
              !supported
                ? "Voice input requires Chrome or Edge"
                : listening
                  ? "Stop listening"
                  : `Speak in ${langName}`
            }
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            aria-pressed={listening}
            style={{ minWidth: 48, minHeight: 48, touchAction: "manipulation" }}
            className={cn(
              "relative z-50 h-12 w-12 shrink-0 rounded-full sm:h-9 sm:w-9",
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
            size="icon"
            onClick={() => send(value, false)}
            disabled={!value.trim()}
            aria-label="Send"
            style={{ minWidth: 48, minHeight: 48, touchAction: "manipulation" }}
            className="relative z-50 h-12 w-12 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 sm:h-9 sm:w-9"
          >
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}