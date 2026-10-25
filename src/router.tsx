import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// After a new publish, old cached pages may request files that no longer exist
// ("Importing a module script failed"). Reload once to fetch the fresh version.
if (typeof window !== "undefined") {
  const ricarica = () => {
    const chiave = "fh-reload-chunk";
    const ultimo = Number(sessionStorage.getItem(chiave) ?? 0);
    if (Date.now() - ultimo < 10000) return;
    sessionStorage.setItem(chiave, String(Date.now()));
    window.location.reload();
  };
  // Do not preventDefault: that makes the failed import resolve to undefined,
  // which crashes the router with "reading 'component'". Just reload.
  window.addEventListener("vite:preloadError", () => ricarica());
  window.addEventListener("unhandledrejection", (e) => {
    const msg = String((e.reason as Error)?.message ?? e.reason ?? "");
    if (/Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module|reading 'component'/i.test(msg)) ricarica();
  });
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
