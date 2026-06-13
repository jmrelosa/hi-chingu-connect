import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/chingu/AppShell";
import { ChatView } from "@/components/chingu/ChatView";

export const Route = createFileRoute("/$threadId")({
  head: () => ({
    meta: [
      { title: "Hi Chingu! — Conversation" },
      {
        name: "description",
        content: "Live two-way English ↔ Korean translation conversation.",
      },
    ],
  }),
  component: ThreadRoute,
});

function ThreadRoute() {
  const { threadId } = Route.useParams();

  return (
    <AppShell activeId={threadId}>
      {({ activeThread, updateThread }) =>
        activeThread ? (
          <ChatView
            key={activeThread.id}
            thread={activeThread}
            updateThread={updateThread}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Loading conversation…
          </div>
        )
      }
    </AppShell>
  );
}