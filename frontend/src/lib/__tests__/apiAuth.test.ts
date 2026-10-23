import {
  getApiAuthKey,
  setApiAuthKey,
  authHeaders,
  authQuerySuffix,
  withAuthQuery,
  initApiAuth,
} from "../apiAuth";

// jsdom no expone crypto.subtle; usamos el WebCrypto de Node para los tests.
if (!globalThis.crypto?.subtle) {
  const { webcrypto } = require("node:crypto");
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
}

describe("apiAuth", () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await setApiAuthKey("");
  });

  describe("getApiAuthKey", () => {
    it("returns empty string when nothing stored", async () => {
      await initApiAuth();
      expect(getApiAuthKey()).toBe("");
    });
    it("returns stored key after init (decrypts from storage)", async () => {
      await setApiAuthKey("my-secret");
      await initApiAuth();
      expect(getApiAuthKey()).toBe("my-secret");
    });
  });

  describe("setApiAuthKey", () => {
    it("stores trimmed value and encrypts it (not plaintext)", async () => {
      await setApiAuthKey("  abc-123  ");
      expect(getApiAuthKey()).toBe("abc-123");
      const stored = localStorage.getItem("vibe_trading_api_auth_key");
      expect(stored).not.toBeNull();
      expect(stored).not.toContain("abc-123");
    });
    it("removes key when value is empty/whitespace", async () => {
      await setApiAuthKey("abc");
      await setApiAuthKey("   ");
      expect(getApiAuthKey()).toBe("");
      expect(localStorage.getItem("vibe_trading_api_auth_key")).toBeNull();
    });
    it("removes key when value is empty string", async () => {
      await setApiAuthKey("abc");
      await setApiAuthKey("");
      expect(getApiAuthKey()).toBe("");
      expect(localStorage.getItem("vibe_trading_api_auth_key")).toBeNull();
    });
  });

  describe("authHeaders", () => {
    it("returns empty object when no key set", () => {
      expect(authHeaders()).toEqual({});
    });
    it("returns Bearer header when key exists", async () => {
      await setApiAuthKey("token-xyz");
      expect(authHeaders()).toEqual({ Authorization: "Bearer token-xyz" });
    });
  });

  describe("authQuerySuffix", () => {
    it("returns empty string when no key", () => {
      expect(authQuerySuffix()).toBe("");
    });
    it("returns encoded query param when key exists", async () => {
      await setApiAuthKey("key with spaces");
      expect(authQuerySuffix()).toBe("api_key=key%20with%20spaces");
    });
  });

  describe("withAuthQuery", () => {
    it("returns url unchanged when no key", () => {
      expect(withAuthQuery("https://api.com/data")).toBe("https://api.com/data");
    });
    it("appends with ? when url has no query string", async () => {
      await setApiAuthKey("abc");
      expect(withAuthQuery("https://api.com/data")).toBe("https://api.com/data?api_key=abc");
    });
    it("appends with & when url already has query string", async () => {
      await setApiAuthKey("abc");
      expect(withAuthQuery("https://api.com/data?foo=bar")).toBe("https://api.com/data?foo=bar&api_key=abc");
    });
  });
});
