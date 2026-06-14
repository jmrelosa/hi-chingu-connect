import { useServerFn } from "@tanstack/react-start";
import { ArrowLeftRight, Download, MoreVertical, Trash2, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  newMessageId,
  type ChatMessage,
  type Direction,
  type Thread,
  type TranslationStyle,
} from "@/lib/threads-store";
import { translateText } from "@/lib/translate.functions";
import { cn } from "@/lib/utils";

import { Composer } from "./Composer";
import { DirectionToggle } from "./DirectionToggle";
import { InterpreterPanel } from "./InterpreterPanel";
import { MessageBubble } from "./MessageBubble";
import { StyleSelector } from "./StyleSelector";

interface Props {
  thread: Thread;
  updateThread: (id: string, updater: (t: Thread) => Thread) => void;
}

export function ChatView({ thread, updateThread }: Props) {
  const translate = useServerFn(translateText);
  const [draft, setDraft] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const style = thread.style ?? "polite";
  const interpreterMode = !!thread.interpreterMode;
  const swapped = !!thread.swapped;
  const defaultLabelA = swapped ? "You (Korean)" : "You (English)";
  const defaultLabelB = swapped ? "Them (English)" : "Them (Korean)";
  const labelA = thread.labelA ?? defaultLabelA;
  const labelB = thread.labelB ?? defaultLabelB;
  // Panel A direction: english (en-ko) unless swapped
  const directionA: Direction = swapped ? "ko-en" : "en-ko";
  const directionB: Direction = swapped ? "en-ko" : "ko-en";

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [thread.id, thread.messages.length]);

  const setDirection = (d: Direction) => {
    updateThread(thread.id, (t) => ({ ...t, direction: d, updatedAt: Date.now() }));
  };

  const setStyle = (s: TranslationStyle) => {
    updateThread(thread.id, (t) => ({ ...t, style: s, updatedAt: Date.now() }));
  };

  const toggleInterpreter = () => {
    updateThread(thread.id, (t) => ({
      ...t,
      interpreterMode: !t.interpreterMode,
      updatedAt: Date.now(),
    }));
  };

  const swapSpeakers = () => {
    updateThread(thread.id, (t) => ({
      ...t,
      swapped: !t.swapped,
      labelA: undefined,
      labelB: undefined,
      updatedAt: Date.now(),
    }));
  };

  const setLabel = (which: "A" | "B", value: string) => {
    updateThread(thread.id, (t) => ({
      ...t,
      ...(which === "A" ? { labelA: value } : { labelB: value }),
      updatedAt: Date.now(),
    }));
  };

  const handleSubmit = async (override?: {
    text: string;
    voice?: boolean;
    direction?: Direction;
  }) => {
    const text = (override?.text ?? draft).trim();
    if (!text) return;
    const id = newMessageId();
    const direction = override?.direction ?? thread.direction;
    const msg: ChatMessage = {
      id,
      original: text,
      translation: "",
      direction,
      style,
      createdAt: Date.now(),
      pending: true,
      voice: override?.voice,
    };
    updateThread(thread.id, (t) => ({
      ...t,
      title: t.messages.length === 0 ? truncateTitle(text) : t.title,
      updatedAt: Date.now(),
      messages: [...t.messages, msg],
    }));
    if (!override) setDraft("");

    try {
      const { translation } = await translate({ data: { text, direction, style } });
      updateThread(thread.id, (t) => ({
        ...t,
        updatedAt: Date.now(),
        messages: t.messages.map((m) =>
          m.id === id ? { ...m, translation, pending: false } : m,
        ),
      }));
    } catch (err) {
      console.error(err);
      toast.error("Translation failed. Please try again.");
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

  const sendForPanel = (panelDirection: Direction) => (text: string, voice: boolean) => {
    handleSubmit({ text, voice, direction: panelDirection });
  };

  const messagesA = thread.messages.filter((m) => m.direction === directionA);
  const messagesB = thread.messages.filter((m) => m.direction === directionB);

  const clearChat = () => {
    updateThread(thread.id, (t) => ({ ...t, messages: [], updatedAt: Date.now() }));
    toast.success("Conversation cleared");
  };

  const exportChat = () => {
    if (thread.messages.length === 0) {
      toast("Nothing to export yet");
      return;
    }
    const lines: string[] = [];
    lines.push(`Hi Chingu! — Conversation Export`);
    lines.push(`Title: ${thread.title || "Untitled"}`);
    lines.push(`Exported: ${new Date().toLocaleString()}`);
    lines.push("");
    lines.push("=".repeat(60));
    lines.push("");
    for (const m of thread.messages) {
      const ts = new Date(m.createdAt).toLocaleString();
      const dir = m.direction === "en-ko" ? "EN → KO" : "KO → EN";
      const styleTag = (m.style ?? "polite").toUpperCase();
      const voiceTag = m.voice ? " 🎤" : "";
      lines.push(`[${ts}] ${dir} (${styleTag})${voiceTag}`);
      lines.push(`Original:    ${m.original}`);
      lines.push(`Translation: ${m.translation || (m.error ? "[failed]" : "[pending]")}`);
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const safeTitle = (thread.title || "conversation")
      .replace(/[^\w\-]+/g, "_")
      .slice(0, 40) || "conversation";
    const stamp = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hi-chingu_${safeTitle}_${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Conversation exported");
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ConfirmClear open={confirmOpen} onOpenChange={setConfirmOpen} onConfirm={clearChat} title={thread.title} />
      <header className="flex flex-col gap-2 border-b border-white/10 bg-brand-navy px-3 py-2 text-brand-navy-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-3">
        {/* Row 1 (mobile) / left side (desktop): title + interpreter toggle + kebab */}
        <div className="flex min-h-[40px] items-center justify-between gap-2 sm:min-h-0 sm:flex-1">
          <div className="flex min-w-0 flex-col leading-tight">
            <h1 className="truncate text-sm font-semibold sm:text-base">
              {thread.title || "New conversation"}
            </h1>
            <span className="hidden text-[11px] text-white/60 sm:inline">
              {interpreterMode ? "Interpreter Mode — two-way live" : directionLabel}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={toggleInterpreter}
              aria-pressed={interpreterMode}
              className={cn(
                "h-9 gap-1.5 rounded-full border px-2.5 text-xs sm:px-3 sm:text-sm",
                interpreterMode
                  ? "border-brand-green/40 bg-brand-green/20 text-white hover:bg-brand-green/30"
                  : "border-white/10 bg-white/5 text-white/90 hover:bg-white/10 hover:text-white",
              )}
              title="Toggle Interpreter Mode"
            >
              <Users className="h-3.5 w-3.5" />
              <span className="hidden xs:inline sm:inline">Interpreter</span>
              <span className="inline xs:hidden sm:hidden">🔄</span>
            </Button>
            {/* Desktop: explicit Export/Clear buttons */}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={exportChat}
              disabled={thread.messages.length === 0}
              title="Export conversation as .txt"
              className="hidden h-9 gap-1.5 rounded-full border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 hover:text-white disabled:opacity-40 sm:inline-flex"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setConfirmOpen(true)}
              disabled={thread.messages.length === 0}
              title="Clear conversation"
              className="hidden h-9 gap-1.5 rounded-full border border-white/10 bg-white/5 text-white/90 hover:bg-red-500/20 hover:text-white disabled:opacity-40 sm:inline-flex"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
            {/* Mobile: kebab menu for Export/Clear */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="More actions"
                  className="h-9 w-9 shrink-0 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 sm:hidden"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={exportChat}
                  disabled={thread.messages.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export as .txt
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setConfirmOpen(true)}
                  disabled={thread.messages.length === 0}
                  className="text-red-600 focus:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Row 2 (mobile) / right side (desktop): language toggle + (interpreter: swap) */}
        <div className="flex items-center gap-2 sm:gap-2">
          {interpreterMode ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={swapSpeakers}
              className="h-9 w-full gap-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/90 hover:bg-white/10 hover:text-white sm:w-auto sm:text-sm"
              title="Swap which panel speaks which language"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Swap speakers
            </Button>
          ) : (
            <DirectionToggle
              direction={thread.direction}
              onChange={setDirection}
              className="h-9 w-full sm:w-auto"
            />
          )}
        </div>
      </header>

      {interpreterMode ? (
        <>
          <div className="flex items-center justify-between gap-3 border-b border-border bg-background/80 px-3 py-2 sm:px-6">
            <p className="hidden text-xs text-muted-foreground sm:block">
              Each panel uses its own mic. Style applies to both.
            </p>
            <p className="text-xs text-muted-foreground sm:hidden">Style:</p>
            <StyleSelector value={style} onChange={setStyle} />
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
            <InterpreterPanel
              direction={directionA}
              label={labelA}
              onLabelChange={(v) => setLabel("A", v)}
              messages={messagesA}
              onSubmit={sendForPanel(directionA)}
              tint="blue"
              className="lg:border-r"
            />
            <InterpreterPanel
              direction={directionB}
              label={labelB}
              onLabelChange={(v) => setLabel("B", v)}
              messages={messagesB}
              onSubmit={sendForPanel(directionB)}
              tint="green"
            />
          </div>
        </>
      ) : (
        <>
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto bg-chat-bg px-3 pt-4 sm:px-6 sm:py-6"
            style={{ paddingBottom: "calc(var(--composer-height, 112px) + var(--keyboard-inset, 0px) + 1rem)" }}
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
            onSubmit={() => handleSubmit()}
            onVoiceSubmit={(text) => handleSubmit({ text, voice: true })}
            direction={thread.direction}
            style={style}
            onStyleChange={setStyle}
          />
        </>
      )}
    </div>
  );
}

function ConfirmClear({
  open,
  onOpenChange,
  onConfirm,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  title: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear this conversation?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all messages in &quot;{title || "this conversation"}&quot;. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Clear chat
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
