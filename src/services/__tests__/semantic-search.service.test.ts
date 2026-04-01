import { describe, it, expect } from "vitest";
import {
  cosineSimilarity,
  generateSearchText,
  loadEmbeddingsFromMetadata,
  saveEmbeddingsToMetadata,
  getReposNeedingEmbedding,
} from "../semantic-search.service";

describe("semantic-search.service", () => {
  describe("cosineSimilarity", () => {
    it("should return 1 for identical vectors", () => {
      const vec = [1, 2, 3];
      expect(cosineSimilarity(vec, vec)).toBeCloseTo(1);
    });

    it("should return 0 for orthogonal vectors", () => {
      const vec1 = [1, 0];
      const vec2 = [0, 1];
      expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(0);
    });

    it("should return -1 for opposite vectors", () => {
      const vec1 = [1, 0];
      const vec2 = [-1, 0];
      expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(-1);
    });

    it("should throw for mismatched dimensions", () => {
      expect(() => cosineSimilarity([1, 2], [1])).toThrow("向量维度不匹配");
    });

    it("should return 0 for zero vectors", () => {
      expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
    });

    it("should handle null inputs", () => {
      expect(() => cosineSimilarity(null, [1])).toThrow();
    });
  });

  describe("generateSearchText", () => {
    const baseRepo = {
      name: "react",
      full_name: "facebook/react",
      description: "A JavaScript library for building UIs",
      language: "JavaScript",
      topics: ["javascript", "ui", "frontend"],
    };

    it("should include repo name, description, and language", () => {
      const text = generateSearchText(baseRepo, {});
      expect(text).toContain("react");
      expect(text).toContain("JavaScript library");
      expect(text).toContain("JavaScript");
    });

    it("should include AI summary when available", () => {
      const metadata = {
        aiSummary: {
          summary: "A UI framework",
          features: ["components", "virtual DOM"],
          useCase: "building web apps",
          techStack: ["JavaScript", "JSX"],
        },
      };
      const text = generateSearchText(baseRepo, metadata);
      expect(text).toContain("A UI framework");
      expect(text).toContain("components");
      expect(text).toContain("building web apps");
    });

    it("should include user tags", () => {
      const metadata = { tags: ["frontend", "favorite"] };
      const text = generateSearchText(baseRepo, metadata);
      expect(text).toContain("frontend");
      expect(text).toContain("favorite");
    });

    it("should include user notes", () => {
      const metadata = { notes: "Important for project X" };
      const text = generateSearchText(baseRepo, metadata);
      expect(text).toContain("Important for project X");
    });

    it("should handle repo with minimal data", () => {
      const minimalRepo = { name: "test", full_name: "user/test" };
      const text = generateSearchText(minimalRepo, {});
      expect(text).toContain("test");
    });

    it("should add category keywords for frontend projects", () => {
      const frontendRepo = {
        name: "my-ui-lib",
        description: "A component library",
        language: "TypeScript",
        topics: [],
      };
      const text = generateSearchText(frontendRepo, {});
      expect(text).toContain("前端");
    });

    it("should add category keywords for backend projects", () => {
      const backendRepo = {
        name: "my-api",
        description: "A REST API server",
        language: "Go",
        topics: [],
      };
      const text = generateSearchText(backendRepo, {});
      expect(text).toContain("后端");
    });
  });

  describe("loadEmbeddingsFromMetadata", () => {
    it("should extract embeddings from metadata", () => {
      const metadata = {
        123: { embedding: [0.1, 0.2, 0.3] },
        456: { tags: ["react"], notes: "" },
        789: { embedding: [0.4, 0.5, 0.6] },
      };
      const result = loadEmbeddingsFromMetadata(metadata);
      expect(Object.keys(result)).toHaveLength(2);
      expect(result["123"]).toEqual([0.1, 0.2, 0.3]);
      expect(result["789"]).toEqual([0.4, 0.5, 0.6]);
    });

    it("should return empty object for no embeddings", () => {
      const metadata = { 123: { tags: ["react"] } };
      expect(loadEmbeddingsFromMetadata(metadata)).toEqual({});
    });
  });

  describe("saveEmbeddingsToMetadata", () => {
    it("should add embeddings to existing metadata", () => {
      const metadata = { 123: { tags: ["react"] } };
      const embeddingsMap = { 123: [0.1, 0.2], 456: [0.3, 0.4] };
      const result = saveEmbeddingsToMetadata(metadata, embeddingsMap);
      expect(result["123"].embedding).toEqual([0.1, 0.2]);
      expect(result["123"].tags).toEqual(["react"]); // preserve existing
      expect(result["456"].embedding).toEqual([0.3, 0.4]);
    });
  });

  describe("getReposNeedingEmbedding", () => {
    it("should return repos without embeddings", () => {
      const repos = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const metadata = {
        1: { embedding: [0.1] },
        // 2 has no metadata
        3: {}, // no embedding
      };
      const result = getReposNeedingEmbedding(repos, metadata);
      expect(result.map((r) => r.id)).toEqual([2, 3]);
    });

    it("should return empty if all have embeddings", () => {
      const repos = [{ id: 1 }];
      const metadata = { 1: { embedding: [0.1] } };
      expect(getReposNeedingEmbedding(repos, metadata)).toHaveLength(0);
    });
  });
});
