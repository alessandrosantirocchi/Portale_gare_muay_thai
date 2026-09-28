import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News e comunicati — FIGHT HUB" },
      {
        name: "description",
        content: "Comunicati ufficiali, aperture iscrizioni e aggiornamenti sui regolamenti.",
      },
      { property: "og:title", content: "News e comunicati — FIGHT HUB" },
      {
        property: "og:description",
        content: "Tutti gli aggiornamenti per le società affiliate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Navigate to="/" replace />,
});
