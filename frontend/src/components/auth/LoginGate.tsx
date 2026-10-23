import { useState, type FormEvent } from "react";
import { isAuthenticated, login } from "@/lib/auth";

export function LoginGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean>(() => isAuthenticated());
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const ok = await login(password);
    setBusy(false);
    if (ok) {
      setAuthed(true);
    } else {
      setError("Contraseña incorrecta");
      setPassword("");
    }
  };

  if (authed) {
    return <>{children}</>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Vibe Trading
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acceso restringido. Introduce la contraseña para continuar.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-lg border bg-card p-6 shadow-sm"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              Contraseña
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
