import { Link, useNavigate } from "@tanstack/react-router";
import { MessageSquarePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Thread } from "@/lib/threads-store";
import { cn } from "@/lib/utils";

interface Props {
  threads: Thread[];
  activeId: string;
  onNew: () => string;
  onDelete: (id: string) => void;
}

export function ThreadSidebar({ threads, activeId, onNew, onDelete }: Props) {
  const navigate = useNavigate();

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-white/10 bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-bold">
          Hi
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Hi Chingu!</span>
          <span className="text-[11px] text-white/60">English ↔ Korean</span>
        </div>
      </div>

      <div className="px-3 py-3">
        <Button
          type="button"
          onClick={() => {
            const id = onNew();
            navigate({ to: "/$threadId", params: { threadId: id } });
          }}
          className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New conversation
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        <p className="px-2 py-2 text-[11px] font-medium uppercase tracking-wider text-white/50">
          Conversations
        </p>
        <ul className="space-y-0.5">
          {threads.map((t) => {
            const active = t.id === activeId;
            return (
              <li key={t.id}>
                <Link
                  to="/$threadId"
                  params={{ threadId: t.id }}
                  className={cn(
                    "group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-white/80 hover:bg-white/5",
                  )}
                >
                  <span className="truncate">{t.title || "New conversation"}</span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, t.id)}
                    aria-label="Delete conversation"
                    className={cn(
                      "rounded p-1 text-white/40 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100",
                      active && "opacity-100",
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-4 py-3 text-[11px] text-white/50">
        Saved in this browser
      </div>
    </aside>
  );
}