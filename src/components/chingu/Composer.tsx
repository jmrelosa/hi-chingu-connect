import { Mic, SendHorizonal } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Direction } from "@/lib/threads-store";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  direction: Direction;
  disabled?: boolean;
}

export function Composer({ value, onChange, onSubmit, direction, disabled }: Props) {
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

  return (
    <div className="border-t border-border bg-background px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        <p className="px-1 text-xs text-muted-foreground">{hint}</p>
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
          <Textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="min-h-[44px] max-h-40 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-[15px] leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled
            title="Voice input coming soon"
            aria-label="Voice input (coming soon)"
            className={cn(
              "h-10 w-10 shrink-0 rounded-full text-muted-foreground",
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
            className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}