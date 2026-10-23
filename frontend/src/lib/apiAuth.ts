// Almacenamiento seguro del API key del backend.
//
// El secreto NO se guarda en texto plano: se cifra con AES-GCM (Web Crypto) y
// el blob cifrado se persiste en localStorage. La clave de cifrado se mantiene
// en sessionStorage, de modo que no queda material de descifrado persistido en
// disco: tras recargar la página por completo hay que volver a introducir la
// clave en Ajustes. Esto protege el secreto frente a inspección de localStorage.
//
// getApiAuthKey() / authHeaders() / withAuthQuery() son síncronas y leen una
// caché en memoria que se rellena de forma asíncrona con initApiAuth().

const STORAGE_KEY = "vibe_trading_api_auth_key"; // blob cifrado (iv.cifrado)
const KEY_STORAGE_KEY = "vibe_trading_api_auth_key_material"; // clave AES (sessionStorage)

let cachedKey = "";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function subtle(): SubtleCrypto | undefined {
  return typeof crypto !== "undefined" && crypto.subtle ? crypto.subtle : undefined;
}

async function getCryptoKey(): Promise<CryptoKey | null> {
  const b64 = window.sessionStorage.getItem(KEY_STORAGE_KEY);
  if (!b64) return null;
  try {
    return await subtle()!.importKey("raw", base64ToBytes(b64), { name: "AES-GCM" }, false, [
      "encrypt",
      "decrypt",
    ]);
  } catch {
    return null;
  }
}

async function generateCryptoKey(): Promise<CryptoKey> {
  const key = await subtle()!.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
  const raw = await subtle()!.exportKey("raw", key);
  window.sessionStorage.setItem(KEY_STORAGE_KEY, bytesToBase64(new Uint8Array(raw)));
  return key;
}

// Rellena la caché en memoria descifrando el blob almacenado. Debe llamarse una
// vez al arrancar la aplicación (ver main.tsx).
export async function initApiAuth(): Promise<void> {
  if (!subtle()) {
    // Contexto no seguro (sin HTTPS/localhost): no hay Web Crypto. Se conserva
    // el valor en texto plano como último recurso para no romper la app.
    cachedKey = window.localStorage.getItem(STORAGE_KEY) || "";
    return;
  }
  const key = await getCryptoKey();
  const blob = window.localStorage.getItem(STORAGE_KEY);
  if (!key || !blob) {
    cachedKey = "";
    return;
  }
  try {
    const [ivB64, dataB64] = blob.split(".");
    const decrypted = await subtle()!.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(ivB64) },
      key,
      base64ToBytes(dataB64),
    );
    cachedKey = new TextDecoder().decode(decrypted);
  } catch {
    cachedKey = "";
  }
}

export function getApiAuthKey(): string {
  return cachedKey;
}

export async function setApiAuthKey(value: string): Promise<void> {
  const trimmed = value.trim();
  if (!trimmed) {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(KEY_STORAGE_KEY);
    cachedKey = "";
    return;
  }
  if (!subtle()) {
    // Contexto no seguro: fallback a texto plano.
    window.localStorage.setItem(STORAGE_KEY, trimmed);
    cachedKey = trimmed;
    return;
  }
  let key = await getCryptoKey();
  if (!key) key = await generateCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await subtle()!.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(trimmed),
  );
  const blob = `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ciphertext))}`;
  window.localStorage.setItem(STORAGE_KEY, blob);
  cachedKey = trimmed;
}

export function authHeaders(): Record<string, string> {
  const key = getApiAuthKey();
  return key ? { Authorization: `Bearer ${key}` } : {};
}

export function authQuerySuffix(): string {
  const key = getApiAuthKey();
  return key ? `api_key=${encodeURIComponent(key)}` : "";
}

export function withAuthQuery(url: string): string {
  const suffix = authQuerySuffix();
  if (!suffix) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${suffix}`;
}
