import { GITHUB_CONFIG } from "../config";

const OAUTH_STATE_KEY = "starkeeper-oauth-state";

function secureNonce() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function getGitHubAuthUrl() {
  const verifier = secureNonce();
  const state = secureNonce();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  sessionStorage.setItem(OAUTH_STATE_KEY, JSON.stringify({ state, verifier, at: Date.now() }));
  const params = new URLSearchParams({
    client_id: GITHUB_CONFIG.clientId,
    redirect_uri: GITHUB_CONFIG.redirectUri,
    scope: GITHUB_CONFIG.scopes.join(" "),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export function consumeOAuthState(state: string | null): string | null {
  const value = sessionStorage.getItem(OAUTH_STATE_KEY);
  sessionStorage.removeItem(OAUTH_STATE_KEY);
  if (!state || !value) return null;
  const saved = JSON.parse(value);
  return state === saved.state && Date.now() - saved.at <= 10 * 60_000 ? saved.verifier : null;
}

export async function validateGitHubToken(token: string) {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      cache: "no-store",
    });
    if (response.status === 401) return { valid: false, invalidToken: true } as const;
    if (!response.ok) return { valid: false, invalidToken: false } as const;
    const data = await response.json();
    return {
      valid: true,
      user: {
        id: data.id,
        login: data.login,
        name: data.name,
        avatarUrl: data.avatar_url,
      },
    } as const;
  } catch {
    return { valid: false, invalidToken: false } as const;
  }
}
