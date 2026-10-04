import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Accedi — FIGHT HUB" },
      {
        name: "description",
        content:
          "Area riservata delle società: accedi con email e password o con Google per gestire le iscrizioni degli atleti.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Accedi — FIGHT HUB" },
      { property: "og:description", content: "FIGHT HUB: eventi, atleti e iscrizioni agli sport da combattimento." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomeSocieta, setNomeSocieta] = useState("");
  const [codiceFiscale, setCodiceFiscale] = useState("");
  const [citta, setCitta] = useState("");
  const [regione, setRegione] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [carico, setCarico] = useState(false);

  async function invia(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    setInfo(null);
    setCarico(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/area" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nome_societa: nomeSocieta, codice_fiscale: codiceFiscale.replace(/\s+/g, "").toUpperCase(), citta, regione },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo("Controlla la tua email per confermare la registrazione, poi accedi.");
        } else {
          navigate({ to: "/area" });
        }
      }
    } catch (err: any) {
      setErrore(err.message ?? "Si è verificato un errore.");
    } finally {
      setCarico(false);
    }
  }

  async function google() {
    setErrore(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setErrore(result.error.message ?? "Accesso Google non riuscito.");
    if (result.redirected) return;
    if (!result.error) navigate({ to: "/area" });
  }

  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
        <div className="mb-1 h-[3px] -mx-6 -mt-6 mb-6 barra-tricolore" />
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">
          Area società
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login"
            ? "Accedi con le credenziali della tua società per iscrivere gli atleti."
            : "Registra la tua società per accedere alle iscrizioni online."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-[13px] font-medium">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setErrore(null);
                setInfo(null);
              }}
              className={
                mode === m
                  ? "rounded-md bg-card py-1.5 text-foreground"
                  : "rounded-md py-1.5 text-muted-foreground"
              }
            >
              {m === "login" ? "Accedi" : "Registrati"}
            </button>
          ))}
        </div>

        <form className="mt-5 flex flex-col gap-3" onSubmit={invia}>
          {mode === "signup" && (
            <>
              <Campo
                label="Nome società"
                value={nomeSocieta}
                onChange={setNomeSocieta}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Codice fiscale società" value={codiceFiscale} onChange={setCodiceFiscale} required />
                <Campo label="Città" value={citta} onChange={setCitta} />
              </div>
              <label className="text-[12px] font-medium text-muted-foreground">
                Regione
                <select
                  required
                  value={regione}
                  onChange={(e) => setRegione(e.target.value)}
                  className="mt-1 w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">Seleziona…</option>
                  {REGIONI.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          <Campo label="Email" type="email" value={email} onChange={setEmail} required />
          <Campo label="Password" type="password" value={password} onChange={setPassword} required />
          {mode === "signup" && (
            <label className="flex items-start gap-2 text-[12px] text-muted-foreground">
              <input type="checkbox" required className="mt-0.5" />
              <span>
                Ho letto l'
                <Link to="/privacy" target="_blank" className="text-primary underline">
                  informativa privacy
                </Link>{" "}
                e dichiaro di essere autorizzato a trattare i dati degli atleti che inserirò
                (compreso il consenso dei genitori per i minorenni).
              </span>
            </label>
          )}

          {errore && <p className="text-[12px] text-destructive">{errore}</p>}
          {info && <p className="text-[12px] text-accent">{info}</p>}

          <button
            type="submit"
            disabled={carico}
            className="rounded-[10px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {carico
              ? "Attendi…"
              : mode === "login"
                ? "Accedi"
                : "Crea account"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          oppure
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={google}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          <GoogleIcon />
          Continua con Google
        </button>

        <p className="mt-4 text-[12px] text-muted-foreground">
          L'accesso è consentito alle sole società in regola con il tesseramento per la stagione
          corrente.{" "}
          <Link to="/" className="text-primary">
            Torna alla home
          </Link>
        </p>
      </div>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="text-[12px] font-medium text-muted-foreground">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-[10px] border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.6 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.6 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.5 26.7 35.5 24 35.5c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39 16.2 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2c-.4.4 6.6-4.8 6.6-14.7 0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
