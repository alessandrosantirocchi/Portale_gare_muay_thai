import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News sospese — FIGHT HUB" },
      {
        name: "description",
        content: "La sezione News è temporaneamente non disponibile.",
      },
      { property: "og:title", content: "News sospese — FIGHT HUB" },
      {
        property: "og:description",
        content: "La sezione News è temporaneamente non disponibile.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Navigate to="/" replace />,
});
