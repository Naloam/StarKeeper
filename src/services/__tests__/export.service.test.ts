import { describe, it, expect } from "vitest";
import {
  exportToMarkdown,
  exportToCSV,
  exportToJSON,
  getExportStats,
  exportStatsCSV,
} from "../export.service";

const mockStars = [
  {
    id: 1,
    name: "react",
    fullName: "facebook/react",
    owner: {
      login: "facebook",
      avatarUrl: "https://example.com/avatar.png",
      htmlUrl: "https://github.com/facebook",
    },
    description: "A JavaScript library for building UIs",
    htmlUrl: "https://github.com/facebook/react",
    homepage: "https://react.dev",
    language: "JavaScript",
    stargazersCount: 200000,
    forksCount: 40000,
    watchersCount: 6000,
    openIssuesCount: 800,
    topics: ["javascript", "ui"],
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
    pushedAt: "2024-06-01T00:00:00Z",
  },
  {
    id: 2,
    name: "vue",
    fullName: "vuejs/vue",
    owner: {
      login: "vuejs",
      avatarUrl: "https://example.com/vue.png",
      htmlUrl: "https://github.com/vuejs",
    },
    description: "Vue.js framework",
    htmlUrl: "https://github.com/vuejs/vue",
    homepage: null,
    language: "TypeScript",
    stargazersCount: 200000,
    forksCount: 30000,
    watchersCount: 5000,
    openIssuesCount: 500,
    topics: ["vue", "framework"],
    createdAt: "2023-06-01T00:00:00Z",
    updatedAt: "2024-05-01T00:00:00Z",
    pushedAt: "2024-05-01T00:00:00Z",
  },
];

const mockMetadata = {
  1: {
    tags: ["frontend", "favorite"],
    notes: "Core UI framework",
    aiSummary: { summary: "A declarative UI library" },
  },
  2: {
    tags: ["frontend"],
    notes: "",
  },
};

describe("export.service", () => {
  describe("exportToMarkdown", () => {
    it("should generate valid markdown", () => {
      const md = exportToMarkdown(mockStars, mockMetadata);
      expect(md).toContain("# My GitHub Stars Collection");
      expect(md).toContain("react");
      expect(md).toContain("vue");
      expect(md).toContain("frontend");
      expect(md).toContain("Core UI framework");
      expect(md).toContain("A declarative UI library");
    });

    it("should group by tags", () => {
      const md = exportToMarkdown(mockStars, mockMetadata);
      expect(md).toContain("frontend");
    });

    it("should handle empty stars", () => {
      const md = exportToMarkdown([], {});
      expect(md).toContain("项目总数: 0");
    });
  });

  describe("exportToCSV", () => {
    it("should generate valid CSV with headers", () => {
      const csv = exportToCSV(mockStars, mockMetadata);
      expect(csv).toContain("Name,Full Name,Owner");
      expect(csv).toContain('"react"');
      expect(csv).toContain('"facebook/react"');
      expect(csv).toContain('"vue"');
    });

    it("should properly escape commas in description", () => {
      const stars = [{ ...mockStars[0], description: "A, B, C library" }];
      const csv = exportToCSV(stars, {});
      expect(csv).toContain('"A, B, C library"');
    });

    it("should escape quotes in fields", () => {
      const stars = [{ ...mockStars[0], description: 'Say "hello"' }];
      const csv = exportToCSV(stars, {});
      expect(csv).toContain('"Say ""hello"""');
    });

    it("should include tags as semicolon-separated", () => {
      const csv = exportToCSV(mockStars, mockMetadata);
      expect(csv).toContain("frontend; favorite");
    });
  });

  describe("exportToJSON", () => {
    it("should generate valid JSON", () => {
      const json = exportToJSON(mockStars, mockMetadata);
      const parsed = JSON.parse(json);
      expect(parsed.version).toBe("1.0.0");
      expect(parsed.totalCount).toBe(2);
      expect(parsed.repositories).toHaveLength(2);
    });

    it("should include metadata in export", () => {
      const json = exportToJSON(mockStars, mockMetadata);
      const parsed = JSON.parse(json);
      const reactRepo = parsed.repositories[0];
      expect(reactRepo.metadata.tags).toEqual(["frontend", "favorite"]);
      expect(reactRepo.metadata.notes).toBe("Core UI framework");
    });

    it("should handle empty stars", () => {
      const json = exportToJSON([], {});
      const parsed = JSON.parse(json);
      expect(parsed.totalCount).toBe(0);
    });
  });

  describe("getExportStats", () => {
    it("should calculate correct statistics", () => {
      const stats = getExportStats(mockStars, mockMetadata);
      expect(stats.total).toBe(2);
      expect(stats.tagged).toBe(2);
      expect(stats.untagged).toBe(0);
      expect(stats.withNotes).toBe(1);
      expect(stats.withAISummary).toBe(1);
      expect(stats.totalTags).toBe(2); // frontend, favorite (unique tags)
    });
  });

  describe("exportStatsCSV", () => {
    it("should handle null statsData gracefully", () => {
      const csv = exportStatsCSV(null);
      expect(csv).toContain("统计类型,指标,数值,占比");
    });

    it("should handle missing health data", () => {
      const csv = exportStatsCSV({
        basic: {
          totalStars: 10,
          totalTags: 5,
          withNotes: 3,
          notesPercentage: 30,
          withAISummary: 1,
          aiSummaryPercentage: 10,
        },
      });
      expect(csv).toContain("总 Stars 数,10");
    });
  });
});
