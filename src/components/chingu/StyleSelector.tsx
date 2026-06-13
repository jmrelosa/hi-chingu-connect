import { cn } from "@/lib/utils";
import type { TranslationStyle } from "@/lib/threads-store";

const STYLES: { value: TranslationStyle; label: string; ko: string }[] = [
  { value: "formal", label: "Formal", ko: "격식체" },
  { value: "casual", label: "Casual", ko: "반말" },
  { value: "polite", label: "Polite", ko: "존댓말" },
];

interface Props {
  value: TranslationStyle;
  onChange: (style: TranslationStyle) => void;
}

export function StyleSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1">
      {STYLES.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => onChange(s.value)}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
            value === s.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          title={`${s.label} (${s.ko})`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

export function styleBadge(style: TranslationStyle): string {
  switch (style) {
    case "formal":
      return "격식체";
    case "casual":
      return "반말";
    case "polite":
    default:
      return "존댓말";
  }
}
