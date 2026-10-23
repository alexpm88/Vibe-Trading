// Puerta de acceso de la aplicación. Protege el dashboard y las credenciales
// (API key) frente a accesos no autorizados.
//
// La contraseña se configura mediante variables internas:
//   - VITE_APP_PASSWORD_HASH: hash SHA-256 (hex) de la contraseña (recomendado,
//     evita que la contraseña en texto plano quede en el bundle).
//   - VITE_APP_PASSWORD: contraseña en texto plano (alternativa simple).
// Si ninguna se define, se usa la contraseña por defecto (cámbiala).
//
// La sesión se guarda en sessionStorage: se cierra al cerrar la pestaña.

const AUTH_SESSION_KEY = "vibe_trading_authenticated";

// Hash SHA-256 de la contraseña por defecto "VibeTrading2026!".
const DEFAULT_PASSWORD_HASH = "e8632c2ebf691bfdc840e5e9925b3842df87a6dd9879bcec8f2db54d66209c89";

const PASSWORD_HASH: string =
  (import.meta.env.VITE_APP_PASSWORD_HASH as string | undefined) || DEFAULT_PASSWORD_HASH;
const PLAIN_PASSWORD: string = (import.meta.env.VITE_APP_PASSWORD as string | undefined) || "";

function subtle(): SubtleCrypto | undefined {
  return typeof crypto !== "undefined" && crypto.subtle ? crypto.subtle : undefined;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await subtle()!.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isAuthenticated(): boolean {
  return window.sessionStorage.getItem(AUTH_SESSION_KEY) === "1";
}

export async function login(password: string): Promise<boolean> {
  const trimmed = password.trim();
  if (!trimmed) return false;

  let ok = false;
  if (PLAIN_PASSWORD) {
    ok = trimmed === PLAIN_PASSWORD;
  } else if (subtle()) {
    ok = (await sha256Hex(trimmed)) === PASSWORD_HASH;
  } else {
    // Sin Web Crypto y sin contraseña en texto plano: no se puede verificar.
    ok = false;
  }

  if (ok) {
    window.sessionStorage.setItem(AUTH_SESSION_KEY, "1");
  }
  return ok;
}

export function logout(): void {
  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
}
