import { ArrowLeftRight } from "lucide-react";

import type { Direction } from "@/lib/threads-store";
import { cn } from "@/lib/utils";

interface Props {
  direction: Direction;
  onChange: (d: Direction) => void;
  className?: string;
}

export function DirectionToggle({ direction, onChange, className }: Props) {
  const flip = () => onChange(direction === "en-ko" ? "ko-en" : "en-ko");

  const [from, to] =
    direction === "en-ko"
      ? [{ flag: "🇺🇸", label: "English" }, { flag: "🇰🇷", label: "Korean" }]
      : [{ flag: "🇰🇷", label: "Korean" }, { flag: "🇺🇸", label: "English" }];

  return (
    <button
      type="button"
      onClick={flip}
      aria-label="Flip translation direction"
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur transition hover:bg-white/10",
        className,
      )}
    >
      <span className="flex items-center gap-1.5">
        <span className="text-base leading-none">{from.flag}</span>
        <span>{from.label}</span>
      </span>
      <ArrowLeftRight className="h-3.5 w-3.5 text-white/60 transition group-hover:text-white" />
      <span className="flex items-center gap-1.5">
        <span className="text-base leading-none">{to.flag}</span>
        <span>{to.label}</span>
      </span>
    </button>
  );
}