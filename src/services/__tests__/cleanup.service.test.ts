import { describe, it, expect } from "vitest";
import {
  detectAbandonedRepos,
  detectSimilarRepos,
  detectLowEngagementRepos,
  generateCleanupSuggestions,
  archiveRepos,
  restoreArchivedRepos,
  getArchivedRepos,
} from "../cleanup.service";

describe("cleanup.service", () => {
  describe("detectAbandonedRepos", () => {
    it("should detect archived repos", () => {
      const stars = [{ id: 1, archived: true, updatedAt: "2024-01-01" }];
      const result = detectAbandonedRepos(stars, {});
      expect(result).toHaveLength(1);
      expect(result[0].severity).toBe("high");
      expect(result[0].reason).toContain("归档");
    });

    it("should detect repos with low health and old update", () => {
      const stars = [
        {
          id: 1,
          archived: false,
          updatedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      const metadata = { 1: { healthScore: { score: 20 } } };
      const result = detectAbandonedRepos(stars, metadata);
      expect(result).toHaveLength(1);
      expect(result[0].reason).toContain("健康度低");
    });

    it("should not flag healthy repos", () => {
      const stars = [
        {
          id: 1,
          archived: false,
          updatedAt: new Date().toISOString(),
        },
      ];
      const metadata = { 1: { healthScore: { score: 80 } } };
      const result = detectAbandonedRepos(stars, metadata);
      expect(result).toHaveLength(0);
    });
  });

  describe("detectLowEngagementRepos", () => {
    it("should detect old stars without tags or notes", () => {
      const stars = [
        {
          id: 1,
          starredAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(), // 200 days ago
          updatedAt: new Date().toISOString(),
        },
      ];
      const metadata = { 1: { tags: [], notes: "" } };
      const result = detectLowEngagementRepos(stars, metadata);
      expect(result).toHaveLength(1);
      expect(result[0].severity).toBe("low");
    });

    it("should not flag repos with tags", () => {
      const stars = [
        {
          id: 1,
          starredAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const metadata = { 1: { tags: ["important"] } };
      const result = detectLowEngagementRepos(stars, metadata);
      expect(result).toHaveLength(0);
    });

    it("should not flag recently starred repos", () => {
      const stars = [
        {
          id: 1,
          starredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
          updatedAt: new Date().toISOString(),
        },
      ];
      const metadata = { 1: {} };
      const result = detectLowEngagementRepos(stars, metadata);
      expect(result).toHaveLength(0);
    });
  });

  describe("archiveRepos", () => {
    it("should mark repos as archived", () => {
      const metadata = { 1: { tags: ["react"] } };
      const result = archiveRepos(["1"], metadata);
      expect(result["1"].archived).toBeDefined();
      expect(result["1"].archived.canRestore).toBe(true);
      expect(result["1"].tags).toEqual(["react"]); // preserve existing
    });

    it("should create metadata entry if not exists", () => {
      const metadata = {};
      const result = archiveRepos(["1"], metadata);
      expect(result["1"]).toBeDefined();
      expect(result["1"].archived).toBeDefined();
    });
  });

  describe("restoreArchivedRepos", () => {
    it("should remove archived status", () => {
      const metadata = { 1: { archived: { archivedAt: Date.now() }, tags: ["react"] } };
      const result = restoreArchivedRepos(["1"], metadata);
      expect(result["1"].archived).toBeUndefined();
      expect(result["1"].tags).toEqual(["react"]);
    });
  });

  describe("getArchivedRepos", () => {
    it("should list archived repos with remaining days", () => {
      const stars = [{ id: 1, name: "old-project" }];
      const metadata = {
        1: {
          archived: {
            archivedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
            expiresAt: Date.now() + 25 * 24 * 60 * 60 * 1000,
            canRestore: true,
          },
        },
      };
      const result = getArchivedRepos(stars, metadata);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("old-project");
      expect(result[0].canRestore).toBe(true);
    });

    it("should exclude non-archived repos", () => {
      const stars = [{ id: 1, name: "active-project" }];
      const metadata = { 1: { tags: ["react"] } };
      const result = getArchivedRepos(stars, metadata);
      expect(result).toHaveLength(0);
    });
  });

  describe("generateCleanupSuggestions", () => {
    it("should generate complete cleanup report", () => {
      const stars = [
        {
          id: 1,
          archived: true,
          updatedAt: "2023-01-01",
          stargazersCount: 10,
          language: "JS",
          name: "a",
          description: "a",
          topics: [],
        },
        {
          id: 2,
          archived: false,
          updatedAt: new Date().toISOString(),
          stargazersCount: 100,
          language: "TS",
          name: "b",
          description: "b",
          topics: [],
        },
      ];
      const metadata = {};
      const report = generateCleanupSuggestions(stars, metadata);

      expect(report).toHaveProperty("summary");
      expect(report).toHaveProperty("categories");
      expect(report).toHaveProperty("recommendations");
      expect(report.summary.totalStars).toBe(2);
      expect(report.categories.abandoned).toHaveLength(1);
    });
  });
});
