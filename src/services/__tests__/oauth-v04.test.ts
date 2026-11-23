// @vitest-environment node
import { expect, it, vi } from "vitest";

vi.mock("../../config", () => ({
  GITHUB_CONFIG: {
    clientId: "example",
    redirectUri: "http://localhost:3000/auth/callback",
    scopes: ["gist"],
  },
}));
import { consumeOAuthState, getGitHubAuthUrl } from "../../utils/auth";

it("generates separate states and challenges, and accepts a verifier only once", async () => {
  const storage = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  const first = new URL(await getGitHubAuthUrl()).searchParams;
  const second = new URL(await getGitHubAuthUrl()).searchParams;
  expect(first.get("state")).toMatch(/^[a-f0-9]{64}$/);
  expect(second.get("state")).not.toBe(first.get("state"));
  expect(first.get("code_challenge")).not.toBe(second.get("code_challenge"));
  expect(second.get("code_challenge_method")).toBe("S256");
  const state = second.get("state");
  const verifier = consumeOAuthState(state);
  expect(verifier).toMatch(/^[a-f0-9]{64}$/);
  expect(consumeOAuthState(state)).toBeNull();
});
