export type Direction = "en-ko" | "ko-en";
export type TranslationStyle = "formal" | "casual" | "polite";

export interface ChatMessage {
  id: string;
  original: string;
  translation: string;
  direction: Direction;
  style: TranslationStyle;
  createdAt: number;
  pending?: boolean;
  error?: boolean;
  voice?: boolean;
}

export interface Thread {
  id: string;
  title: string;
  updatedAt: number;
  direction: Direction;
  style: TranslationStyle;
  messages: ChatMessage[];
  interpreterMode?: boolean;
  /** When true, panel A speaks Korean and panel B speaks English. */
  swapped?: boolean;
  labelA?: string;
  labelB?: string;
}

const KEY = "hi-chingu:threads:v1";

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function loadThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Thread[];
    if (!Array.isArray(parsed)) return [];
    // Migrate old threads that lack `style`
    for (const t of parsed) {
      if (!t.style) t.style = "polite";
      for (const m of t.messages) {
        if (!m.style) m.style = "polite";
      }
    }
    return parsed;
  } catch {
    return [];
  }
}

export function saveThreads(threads: Thread[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(threads));
}

export function createThread(direction: Direction = "en-ko", style: TranslationStyle = "polite"): Thread {
  return {
    id: uid(),
    title: "New conversation",
    updatedAt: Date.now(),
    direction,
    style,
    messages: [],
  };
}

export function newMessageId() {
  return uid();
}

/** Idempotent bootstrap: returns existing threads or creates a single default one. */
export function bootstrapThreads(): { threads: Thread[]; activeId: string } {
  const existing = loadThreads();
  if (existing.length > 0) {
    return { threads: existing, activeId: existing[0].id };
  }
  const t = createThread();
  const threads = [t];
  saveThreads(threads);
  return { threads, activeId: t.id };
}