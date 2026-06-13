import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/chingu/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hi Chingu! — Real-time English ↔ Korean translator" },
      {
        name: "description",
        content:
          "Live two-way English and Korean chat translator. Type to see instant translations side by side.",
      },
      { property: "og:title", content: "Hi Chingu!" },
      {
        property: "og:description",
        content: "Live two-way English ↔ Korean chat translator.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  // AppShell will bootstrap threads and navigate to the first one.
  return (
    <AppShell>
      {() => (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          Loading conversation…
        </div>
      )}
    </AppShell>
  );
}
