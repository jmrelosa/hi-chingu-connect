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
      <div className="flex h-screen w-full items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="hidden md:flex">
        <ThreadSidebar
          threads={threads}
          activeId={activeId ?? ""}
          onNew={handleNew}
          onDelete={handleDelete}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        {children({ threads, activeThread, updateThread })}
      </div>
    </div>
  );
}