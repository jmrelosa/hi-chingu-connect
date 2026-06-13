import { Copy, Mic, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

import type { ChatMessage } from "@/lib/threads-store";
import { useTts } from "@/lib/use-tts";
import { cn } from "@/lib/utils";

import { styleBadge } from "./StyleSelector";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const fromLabel =
    message.direction === "en-ko" ? "English → Korean" : "Korean → English";
  const badge = styleBadge(message.style ?? "polite");
  const time = formatTime(message.createdAt);
  const [copied, setCopied] = useState(false);

  const targetLang = message.direction === "en-ko" ? "ko-KR" : "en-US";
  const { speak, speakingId, supported: ttsSupported } = useTts();
  const isSpeaking = speakingId === message.id;

  const copyTranslation = async () => {
    if (!message.translation) return;
    try {
      await navigator.clipboard.writeText(message.translation);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      console.error(e);
    }
  };

  const speakTranslation = () => {
    if (!message.translation) return;
    speak(message.id, message.translation, targetLang);
  };

  return (
    <div className="flex w-full justify-end">
      <div className="flex max-w-[78%] flex-col items-end gap-1">
        <div className="flex items-center gap-1.5 px-1">
          {message.voice && (
            <span
              title="Voice input"
              className="flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
            >
              <Mic className="h-2.5 w-2.5" /> Voice
            </span>
          )}
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {fromLabel}
          </span>
          <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
            {badge}
          </span>
        </div>
        <div
          className={cn(
            "rounded-2xl rounded-br-sm bg-bubble-user px-4 py-3 text-bubble-user-foreground shadow-sm",
            "ring-1 ring-black/5",
          )}
        >
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {message.original}
          </p>
          <div className="my-2 h-px w-full bg-white/20" />
          {message.pending ? (
            <TypingDots />
          ) : message.error ? (
            <p className="text-sm italic text-red-100">
              Translation failed. Please try again.
            </p>
          ) : (
            <p className="whitespace-pre-wrap break-words text-[14px] italic leading-relaxed text-white/85">
              {message.translation}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
          <span>{time}</span>
          {!message.pending && !message.error && message.translation && (
            <>
              <span aria-hidden>·</span>
              <button
                type="button"
                onClick={copyTranslation}
                title={copied ? "Copied!" : "Copy translation"}
                aria-label="Copy translation"
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 hover:bg-muted hover:text-foreground"
              >
                <Copy className="h-3 w-3" />
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={speakTranslation}
                disabled={!ttsSupported}
                title={
                  !ttsSupported
                    ? "Text-to-speech not supported in this browser"
                    : isSpeaking
                      ? "Stop playback"
                      : "Speak translation"
                }
                aria-label={isSpeaking ? "Stop playback" : "Speak translation"}
                aria-pressed={isSpeaking}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 hover:bg-muted hover:text-foreground",
                  isSpeaking && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
                  !ttsSupported && "cursor-not-allowed opacity-50",
                )}
              >
                {isSpeaking ? (
                  <VolumeX className="h-3 w-3 animate-pulse" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
                {isSpeaking ? "Stop" : "Speak"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span
      className="inline-flex items-center gap-1 py-1"
      aria-label="Translating"
      role="status"
    >
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70" />
    </span>
  );
}

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
