import { describe, it, expect } from "vitest";
import {
  calculateActivityScore,
  calculateCommunityScore,
  calculateMaintenanceScore,
  getHealthLevel,
  detectStaleRepo,
} from "../health.service";

// 直接测试内部函数需要重构为导出，这里通过 detectStaleRepo 和已知的评分逻辑测试
// 由于内部函数未导出，我们通过导入的方式来验证

describe("health.service", () => {
  describe("detectStaleRepo", () => {
    it("should detect stale repo with low health and old update", () => {
      const repo = {
        pushedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(), // 400 days ago
      };
      const healthScore = { score: 20 };

      expect(detectStaleRepo(repo, healthScore)).toBe(true);
    });

    it("should not detect stale repo with high health", () => {
      const repo = {
        pushedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const healthScore = { score: 50 };

      expect(detectStaleRepo(repo, healthScore)).toBe(false);
    });

    it("should not detect stale repo with recent update", () => {
      const repo = {
        pushedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days ago
      };
      const healthScore = { score: 20 };

      expect(detectStaleRepo(repo, healthScore)).toBe(false);
    });
  });
});
