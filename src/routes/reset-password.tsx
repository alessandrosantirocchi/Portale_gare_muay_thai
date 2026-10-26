import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nuova password — FIGHT HUB" },
      { name: "description", content: "Scegli una nuova password per l'area riservata della tua società su FIGHT HUB." },
      { property: "og:title", content: "Nuova password — FIGHT HUB" },
      { property: "og:description", content: "Reimposta la password dell'area società FIGHT HUB." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [pronto, setPronto] = useState(false);
  const [password, setPassword] = useState("");
  const [conferma, setConferma] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [carico, setCarico] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setPronto(true);
    });
    supabase.auth.getSession().then(({ data: s }) => { if (s.session) setPronto(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    if (password.length < 6) return setErrore("La password deve avere almeno 6 caratteri.");
    if (password !== conferma) return setErrore("Le due password non coincidono.");
    setCarico(true);
    const { error } = await supabase.auth.updateUser({ password });
    setCarico(false);
    if (error) return setErrore(error.message);
    navigate({ to: "/area" });
  }

  const campo = "mt-1 w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
  return (
    <main className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-display text-3xl uppercase text-foreground">Nuova password</h1>
      {!pronto ? (
        <p className="mt-4 text-sm text-muted-foreground">Apri questa pagina dal link ricevuto via email. Se il link è scaduto, richiedine uno nuovo da "Password dimenticata?".</p>
      ) : (
        <form onSubmit={salva} className="mt-6 flex flex-col gap-4">
          <label className="text-[12px] text-muted-foreground">Nuova password<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={campo} /></label>
          <label className="text-[12px] text-muted-foreground">Ripeti password<input type="password" required value={conferma} onChange={(e) => setConferma(e.target.value)} className={campo} /></label>
          {errore && <p className="text-[12px] text-destructive">{errore}</p>}
          <button type="submit" disabled={carico} className="rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">{carico ? "Attendi…" : "Salva nuova password"}</button>
        </form>
      )}
    </main>
  );
}
