import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";

import {
  newMessageId,
  type ChatMessage,
  type Direction,
  type Thread,
} from "@/lib/threads-store";
import { translateText } from "@/lib/translate.functions";

import { Composer } from "./Composer";
import { DirectionToggle } from "./DirectionToggle";
import { MessageBubble } from "./MessageBubble";

interface Props {
  thread: Thread;
  updateThread: (id: string, updater: (t: Thread) => Thread) => void;
}

export function ChatView({ thread, updateThread }: Props) {
  const translate = useServerFn(translateText);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.id, thread.messages.length]);

  const setDirection = (d: Direction) => {
    updateThread(thread.id, (t) => ({ ...t, direction: d, updatedAt: Date.now() }));
  };

  const handleSubmit = async () => {
    const text = draft.trim();
    if (!text) return;
    const id = newMessageId();
    const direction = thread.direction;
    const msg: ChatMessage = {
      id,
      original: text,
      translation: "",
      direction,
      createdAt: Date.now(),
      pending: true,
    };
    updateThread(thread.id, (t) => ({
      ...t,
      title: t.messages.length === 0 ? truncateTitle(text) : t.title,
      updatedAt: Date.now(),
      messages: [...t.messages, msg],
    }));
    setDraft("");

    try {
      const { translation } = await translate({ data: { text, direction } });
      updateThread(thread.id, (t) => ({
        ...t,
        updatedAt: Date.now(),
        messages: t.messages.map((m) =>
          m.id === id ? { ...m, translation, pending: false } : m,
        ),
      }));
    } catch (err) {
      console.error(err);
      updateThread(thread.id, (t) => ({
        ...t,
        messages: t.messages.map((m) =>
          m.id === id ? { ...m, pending: false, error: true } : m,
        ),
      }));
    }
  };

  const directionLabel =
    thread.direction === "en-ko"
      ? "Translating English → Korean"
      : "Translating Korean → English";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-brand-navy px-4 py-3 text-brand-navy-foreground sm:px-6">
        <div className="flex min-w-0 flex-col leading-tight">
          <h1 className="truncate text-sm font-semibold sm:text-base">
            {thread.title || "New conversation"}
          </h1>
          <span className="text-[11px] text-white/60">{directionLabel}</span>
        </div>
        <DirectionToggle direction={thread.direction} onChange={setDirection} />
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-chat-bg px-4 py-6 sm:px-6"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {thread.messages.length === 0 ? (
            <EmptyState direction={thread.direction} />
          ) : (
            thread.messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
        </div>
      </div>

      <Composer
        value={draft}
        onChange={setDraft}
        onSubmit={handleSubmit}
        direction={thread.direction}
      />
    </div>
  );
}

function truncateTitle(text: string) {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 40 ? `${t.slice(0, 40)}…` : t;
}

function EmptyState({ direction }: { direction: Direction }) {
  const lines =
    direction === "en-ko"
      ? ["Say hello!", "Type something in English and I'll translate it to Korean."]
      : ["안녕하세요!", "Type something in Korean and I'll translate it to English."];
  return (
    <div className="mx-auto mt-12 max-w-md rounded-2xl border border-border bg-card px-6 py-8 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
        👋
      </div>
      <h2 className="text-base font-semibold text-foreground">{lines[0]}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{lines[1]}</p>
    </div>
  );
}