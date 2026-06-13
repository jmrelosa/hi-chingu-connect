export type Direction = "en-ko" | "ko-en";

export interface ChatMessage {
  id: string;
  original: string;
  translation: string;
  direction: Direction;
  createdAt: number;
  pending?: boolean;
  error?: boolean;
}

export interface Thread {
  id: string;
  title: string;
  updatedAt: number;
  direction: Direction;
  messages: ChatMessage[];
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
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveThreads(threads: Thread[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(threads));
}

export function createThread(direction: Direction = "en-ko"): Thread {
  return {
    id: uid(),
    title: "New conversation",
    updatedAt: Date.now(),
    direction,
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