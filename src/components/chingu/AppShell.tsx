import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  bootstrapThreads,
  createThread,
  saveThreads,
  type Thread,
} from "@/lib/threads-store";

import { ThreadSidebar } from "./ThreadSidebar";

interface RenderProps {
  threads: Thread[];
  activeThread: Thread | undefined;
  updateThread: (id: string, updater: (t: Thread) => Thread) => void;
}

interface Props {
  activeId?: string;
  children: (props: RenderProps) => ReactNode;
}

export function AppShell({ activeId, children }: Props) {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    let rafId = 0;
    const timeoutIds = new Set<number>();

    const updateViewportMetrics = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const vv = window.visualViewport;
        const visualHeight = Math.round(vv?.height ?? window.innerHeight);
        const viewportTop = Math.round(vv?.offsetTop ?? 0);
        const viewportBottom = viewportTop + visualHeight;
        const keyboardInset = Math.max(
          0,
          Math.round(window.innerHeight - visualHeight - viewportTop),
        );

        root.style.setProperty("--app-height", `${visualHeight}px`);
        root.style.setProperty("--visual-viewport-height", `${visualHeight}px`);
        root.style.setProperty("--visual-viewport-bottom", `${viewportBottom}px`);
        root.style.setProperty("--keyboard-inset", `${keyboardInset}px`);
      });
    };

    const scheduleViewportChecks = () => {
      updateViewportMetrics();
      [80, 240, 500].forEach((delay) => {
        const id = window.setTimeout(() => {
          timeoutIds.delete(id);
          updateViewportMetrics();
        }, delay);
        timeoutIds.add(id);
      });
    };

    updateViewportMetrics();
    window.visualViewport?.addEventListener("resize", updateViewportMetrics);
    window.visualViewport?.addEventListener("scroll", updateViewportMetrics);
    window.addEventListener("resize", updateViewportMetrics);
    window.addEventListener("orientationchange", updateViewportMetrics);
    window.addEventListener("focusin", scheduleViewportChecks);
    window.addEventListener("focusout", scheduleViewportChecks);

    return () => {
      cancelAnimationFrame(rafId);
      timeoutIds.forEach((id) => window.clearTimeout(id));
      window.visualViewport?.removeEventListener("resize", updateViewportMetrics);
      window.visualViewport?.removeEventListener("scroll", updateViewportMetrics);
      window.removeEventListener("resize", updateViewportMetrics);
      window.removeEventListener("orientationchange", updateViewportMetrics);
      window.removeEventListener("focusin", scheduleViewportChecks);
      window.removeEventListener("focusout", scheduleViewportChecks);
    };
  }, []);

  // Idempotent client-only bootstrap (avoid creating dupes in StrictMode).
  useEffect(() => {
    const { threads: t } = bootstrapThreads();
    setThreads(t);
    setReady(true);
  }, []);

  // If no activeId provided (e.g. landing on "/"), navigate to first thread.
  useEffect(() => {
    if (!ready) return;
    if (!activeId && threads[0]) {
      navigate({
        to: "/$threadId",
        params: { threadId: threads[0].id },
        replace: true,
      });
    }
  }, [ready, activeId, threads, navigate]);

  // If the activeId doesn't exist in storage, redirect to the first one or create new.
  useEffect(() => {
    if (!ready || !activeId) return;
    if (!threads.some((t) => t.id === activeId)) {
      if (threads[0]) {
        navigate({
          to: "/$threadId",
          params: { threadId: threads[0].id },
          replace: true,
        });
      } else {
        const t = createThread();
        const next = [t];
        setThreads(next);
        saveThreads(next);
        navigate({
          to: "/$threadId",
          params: { threadId: t.id },
          replace: true,
        });
      }
    }
  }, [ready, activeId, threads, navigate]);

  const handleNew = useCallback(() => {
    const t = createThread();
    setThreads((prev) => {
      const next = [t, ...prev];
      saveThreads(next);
      return next;
    });
    return t.id;
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      setThreads((prev) => {
        const next = prev.filter((t) => t.id !== id);
        const finalThreads = next.length === 0 ? [createThread()] : next;
        saveThreads(finalThreads);
        if (id === activeId) {
          navigate({
            to: "/$threadId",
            params: { threadId: finalThreads[0].id },
            replace: true,
          });
        }
        return finalThreads;
      });
    },
    [activeId, navigate],
  );

  const updateThread = useCallback(
    (id: string, updater: (t: Thread) => Thread) => {
      setThreads((prev) => {
        const next = prev.map((t) => (t.id === id ? updater(t) : t));
        saveThreads(next);
        return next;
      });
    },
    [],
  );

  const activeThread = threads.find((t) => t.id === activeId);

  if (!ready) {
    return (
      <div className="flex w-full items-center justify-center overflow-x-hidden bg-background text-muted-foreground" style={{ height: "var(--app-height, 100dvh)" }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="flex w-full overflow-x-hidden bg-background text-foreground" style={{ height: "var(--app-height, 100dvh)" }}>
      <div className="hidden md:flex">
        <ThreadSidebar
          threads={threads}
          activeId={activeId ?? ""}
          onNew={handleNew}
          onDelete={handleDelete}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {children({ threads, activeThread, updateThread })}
      </div>
    </div>
  );
}