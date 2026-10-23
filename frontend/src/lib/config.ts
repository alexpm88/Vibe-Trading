// Dirección del backend. Se configura en tiempo de build mediante la variable
// interna VITE_API_URL (ver .env / variables de entorno del proyecto).
// Si no se define, se usa el backend desplegado por defecto.
const DEFAULT_API_URL = "https://vibe-trading-backend-nkar.onrender.com";

export const API_BASE_URL: string = (
  (import.meta.env.VITE_API_URL as string | undefined) || DEFAULT_API_URL
).replace(/\/+$/, "");
