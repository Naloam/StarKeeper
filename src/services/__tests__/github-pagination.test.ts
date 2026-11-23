// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
const listStars = vi.hoisted(() => vi.fn());
vi.mock("@octokit/rest", () => ({
  Octokit: class {
    activity = { listReposStarredByAuthenticatedUser: listStars };
  },
}));
vi.mock("../../config", () => ({
  APP_CONFIG: { version: "test" },
  GITHUB_CONFIG: { api: { baseUrl: "https://api.github.com" } },
}));
vi.mock("../../utils/toast", () => ({ handleApiError: vi.fn() }));
import { getAllStarredRepos } from "../github.service";

afterEach(() => vi.useRealTimers());

it("reads more than 1000 Stars in pages of 100 without duplicating accumulated pages", async () => {
  vi.useFakeTimers();
  listStars.mockImplementation(async ({ page }: { page: number }) => ({
    data: Array.from({ length: page <= 10 ? 100 : 23 }, (_, index) => ({
      repo: {
        id: (page - 1) * 100 + index + 1,
        owner: { login: "test" },
        private: false,
        visibility: "public",
      },
      starred_at: "2026-01-01",
    })),
    headers: { link: page <= 10 ? '<https://api.github.com/?page=2>; rel="next"' : "" },
  }));
  const progress = vi.fn();
  const pending = getAllStarredRepos("test-token", progress);
  await vi.runAllTimersAsync();
  const stars = await pending;
  expect(stars).toHaveLength(1023);
  expect(new Set(stars.map((repo) => repo.id)).size).toBe(1023);
  expect(listStars).toHaveBeenCalledTimes(11);
  expect(progress).toHaveBeenLastCalledWith({ current: 1023, hasMore: false });
});
