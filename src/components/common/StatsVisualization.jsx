import React, { useState, useMemo, useRef } from "react";
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Download } from "lucide-react";
import LineChart from "../charts/LineChart";
import PieChart from "../charts/PieChart";
import BarChart from "../charts/BarChart";
import {
  getStarsGrowthChartData,
  getLanguagePieChartData,
  getHealthDistributionChartData,
  getTagTrendChartData,
} from "../../services/stats.service";

/**
 * 统计可视化仪表板组件
 */
export default function StatsVisualization({ stars, metadata, healthStats }) {
  const [period, setPeriod] = useState("month"); // month, quarter, year
  const [activeTab, setActiveTab] = useState("growth"); // growth, language, health, tags

  // 图表引用
  const chartRefs = {
    growth: useRef(null),
    language: useRef(null),
    health: useRef(null),
    tags: useRef(null),
  };

  // 生成图表数据
  const growthChartData = useMemo(() => {
    return getStarsGrowthChartData(stars, period);
  }, [stars, period]);

  const languageChartData = useMemo(() => {
    return getLanguagePieChartData(stars);
  }, [stars]);

  const healthChartData = useMemo(() => {
    return healthStats ? getHealthDistributionChartData(healthStats) : null;
  }, [healthStats]);

  const tagChartData = useMemo(() => {
    return getTagTrendChartData(stars, metadata);
  }, [stars, metadata]);

  // 导出图表为图片
  const handleExportChart = () => {
    const chartRef = chartRefs[activeTab].current;
    if (!chartRef) {
      alert("无法找到图表");
      return;
    }

    try {
      // 获取 Chart.js canvas 元素
      const canvas = chartRef.querySelector("canvas");
      if (!canvas) {
        alert("无法找到图表画布");
        return;
      }

      // 转换为 Blob 并下载
      canvas.toBlob((blob) => {
        if (!blob) {
          alert("导出失败");
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        const chartNames = {
          growth: "stars-growth-trend",
          language: "language-distribution",
          health: "health-distribution",
          tags: "tag-statistics",
        };

        link.download = `${chartNames[activeTab]}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (error) {
      console.error("导出图表失败:", error);
      alert("导出失败：" + error.message);
    }
  };

  const tabs = [
    { id: "growth", label: "Stars 增长趋势", icon: TrendingUp },
    { id: "language", label: "语言分布", icon: PieChartIcon },
    { id: "health", label: "健康度分布", icon: BarChart3 },
    { id: "tags", label: "标签统计", icon: BarChart3 },
  ];

  return (
    <div className="card mb-6">
      {/* 标题和操作栏 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-h2 text-text-primary flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-text-secondary" strokeWidth={1.5} />
          数据可视化
        </h2>
        <button
          onClick={handleExportChart}
          className="btn bg-surface border border-border text-text-primary hover:bg-surface-darker text-body-sm"
        >
          <Download className="w-4 h-4" strokeWidth={1.5} />
          <span>导出图表</span>
        </button>
      </div>

      {/* 标签页切换 */}
      <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-fast text-body-sm ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-surface text-text-secondary hover:bg-surface-darker border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 图表内容区域 */}
      <div className="min-h-[400px]">
        {/* Stars 增长趋势 */}
        {activeTab === "growth" && (
          <div ref={chartRefs.growth}>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-2">
                {["month", "quarter", "year"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 rounded-lg text-caption transition-fast ${
                      period === p
                        ? "bg-primary/10 text-primary"
                        : "bg-surface text-text-secondary hover:bg-surface-darker"
                    }`}
                  >
                    {p === "month" ? "按月" : p === "quarter" ? "按季" : "按年"}
                  </button>
                ))}
              </div>
            </div>
            <LineChart data={growthChartData} height={400} />
          </div>
        )}

        {/* 语言分布 */}
        {activeTab === "language" && (
          <div ref={chartRefs.language}>
            <p className="text-body-sm text-text-secondary mb-4">展示项目使用的编程语言分布情况</p>
            <PieChart data={languageChartData} height={400} />
          </div>
        )}

        {/* 健康度分布 */}
        {activeTab === "health" && healthChartData && (
          <div ref={chartRefs.health}>
            <p className="text-body-sm text-text-secondary mb-4">展示已分析项目的健康度分布</p>
            <BarChart data={healthChartData} height={400} />
          </div>
        )}

        {/* 标签统计 */}
        {activeTab === "tags" && (
          <div ref={chartRefs.tags}>
            <p className="text-body-sm text-text-secondary mb-4">展示最常用的项目标签 Top 10</p>
            <BarChart data={tagChartData} height={400} />
          </div>
        )}
      </div>
    </div>
  );
}
