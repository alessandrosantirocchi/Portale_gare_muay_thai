import logo from "@/assets/fight-hub-cropped.png.asset.json";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-ink text-ink-foreground/70">
      <div className="h-[3px] barra-tricolore" />
      <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-4 px-5 py-8 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <img src={logo.url} alt="FIGHT HUB" className="h-auto w-[160px]" />
            <span className="text-[11px] italic text-ink-foreground/70">Il portale del fighiting italiano</span>
          </div>
        </div>
        <p className="text-[12px]">
          © 2026 FIGHT HUB · Portale iscrizione atleti, calendario gare e classifiche
        </p>
      </div>
    </footer>
  );
}
