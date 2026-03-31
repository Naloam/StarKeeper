import { describe, it, expect } from "vitest";
import {
  calculateStringSimilarity,
  calculateRepoSimilarity,
  detectSimilarRepos,
  clusterByLanguage,
  clusterByTopics,
  generateDeduplicationReport,
} from "../similarity.service";

describe("similarity.service", () => {
  describe("calculateStringSimilarity", () => {
    it("should return 1 for identical strings", () => {
      expect(calculateStringSimilarity("react", "react")).toBe(1);
    });

    it("should return 0 for empty strings", () => {
      expect(calculateStringSimilarity("", "test")).toBe(0);
      expect(calculateStringSimilarity("test", "")).toBe(0);
    });

    it("should be case insensitive", () => {
      const score = calculateStringSimilarity("React", "react");
      expect(score).toBe(1);
    });

    it("should return high similarity for similar strings", () => {
      const score = calculateStringSimilarity("react-router", "react-router-dom");
      expect(score).toBeGreaterThan(0.7);
    });

    it("should return low similarity for different strings", () => {
      const score = calculateStringSimilarity("react", "angular");
      expect(score).toBeLessThan(0.5);
    });
  });

  describe("calculateRepoSimilarity", () => {
    const repo1 = {
      name: "react",
      description: "A JavaScript library for building user interfaces",
      language: "JavaScript",
      topics: ["javascript", "ui", "frontend"],
      stargazersCount: 1000,
      forksCount: 200,
      updatedAt: "2024-01-01",
    };

    const repo2 = {
      name: "react-dom",
      description: "React package for working with the DOM",
      language: "JavaScript",
      topics: ["javascript", "react", "frontend"],
      stargazersCount: 800,
      forksCount: 150,
      updatedAt: "2024-01-15",
    };

    const repo3 = {
      name: "rust-cli",
      description: "A command line tool written in Rust",
      language: "Rust",
      topics: ["rust", "cli", "tools"],
      stargazersCount: 50,
      forksCount: 10,
      updatedAt: "2024-02-01",
    };

    it("should return high similarity for similar repos", () => {
      const result = calculateRepoSimilarity(repo1, repo2);
      expect(result.score).toBeGreaterThan(0.3);
      expect(result.details).toHaveProperty("name");
      expect(result.details).toHaveProperty("description");
      expect(result.details).toHaveProperty("language");
      expect(result.details).toHaveProperty("topics");
    });

    it("should return low similarity for different repos", () => {
      const result = calculateRepoSimilarity(repo1, repo3);
      expect(result.score).toBeLessThan(0.4);
    });

    it("should handle repos without topics", () => {
      const noTopicsRepo = { ...repo1, topics: [] };
      const result = calculateRepoSimilarity(noTopicsRepo, repo2);
      expect(result.score).toBeTypeOf("number");
    });

    it("should handle repos without description", () => {
      const noDescRepo = { ...repo1, description: null };
      const result = calculateRepoSimilarity(noDescRepo, repo2);
      expect(result.score).toBeTypeOf("number");
    });
  });

  describe("detectSimilarRepos", () => {
    it("should group similar repos", () => {
      const repos = [
        {
          id: 1,
          name: "react",
          description: "React library",
          language: "JavaScript",
          topics: ["ui"],
        },
        {
          id: 2,
          name: "react-dom",
          description: "React DOM",
          language: "JavaScript",
          topics: ["ui"],
        },
        { id: 3, name: "rust-cli", description: "CLI tool", language: "Rust", topics: ["cli"] },
      ];
      const groups = detectSimilarRepos(repos, 0.3);
      expect(groups.length).toBeGreaterThanOrEqual(1);
    });

    it("should return empty for no similar repos", () => {
      const repos = [
        { id: 1, name: "aaa", description: "Alpha project", language: "Go", topics: ["go"] },
        { id: 2, name: "bbb", description: "Beta project", language: "Rust", topics: ["rust"] },
        {
          id: 3,
          name: "ccc",
          description: "Gamma project",
          language: "Python",
          topics: ["python"],
        },
      ];
      const groups = detectSimilarRepos(repos, 0.6);
      expect(groups).toHaveLength(0);
    });

    it("should handle empty list", () => {
      expect(detectSimilarRepos([], 0.5)).toHaveLength(0);
    });
  });

  describe("clusterByLanguage", () => {
    it("should group repos by language", () => {
      const repos = [
        { language: "JavaScript" },
        { language: "JavaScript" },
        { language: "Rust" },
        { language: null },
      ];
      const clusters = clusterByLanguage(repos);
      expect(clusters["JavaScript"]).toHaveLength(2);
      expect(clusters["Rust"]).toHaveLength(1);
      expect(clusters["Other"]).toHaveLength(1);
    });
  });

  describe("clusterByTopics", () => {
    it("should group repos by shared topics (min 2)", () => {
      const repos = [
        { topics: ["react", "ui"] },
        { topics: ["react", "frontend"] },
        { topics: ["vue"] },
      ];
      const clusters = clusterByTopics(repos);
      expect(clusters["react"]).toHaveLength(2);
      expect(clusters["vue"]).toBeUndefined(); // only 1 repo
    });
  });

  describe("generateDeduplicationReport", () => {
    it("should generate a report with correct structure", () => {
      const repos = [
        {
          id: 1,
          name: "react",
          description: "React",
          language: "JS",
          topics: [],
          stargazersCount: 100,
          forksCount: 10,
          updatedAt: "2024-01-01",
        },
        {
          id: 2,
          name: "react-dom",
          description: "React DOM",
          language: "JS",
          topics: [],
          stargazersCount: 80,
          forksCount: 8,
          updatedAt: "2024-01-01",
        },
      ];
      const report = generateDeduplicationReport(repos, 0.3);
      expect(report).toHaveProperty("totalRepos", 2);
      expect(report).toHaveProperty("duplicateGroups");
      expect(report).toHaveProperty("totalDuplicates");
      expect(report).toHaveProperty("groups");
      expect(report).toHaveProperty("summary");
    });
  });
});
