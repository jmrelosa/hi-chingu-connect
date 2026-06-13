import { Loader2 } from "lucide-react";

import type { ChatMessage } from "@/lib/threads-store";
import { cn } from "@/lib/utils";

import { styleBadge } from "./StyleSelector";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const fromLabel =
    message.direction === "en-ko" ? "English → Korean" : "Korean → English";
  const badge = styleBadge(message.style ?? "polite");

  return (
    <div className="flex w-full justify-end">
      <div className="flex max-w-[78%] flex-col items-end gap-1">
        <div className="flex items-center gap-1.5 px-1">
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
            <p className="flex items-center gap-2 text-sm italic text-white/80">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Translating…
            </p>
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
      </div>
    </div>
  );
}
