import { useRef, useEffect, useState } from "react";
import { useStarsStore } from "../../store";

/**
 * 项目关系图谱 — 基于语言/标签关联的 Canvas 可视化
 */
export default function RelationGraph() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { stars, metadata } = useStarsStore();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [positionsRef] = useRef({});

  const buildGraphData = () => {
    const nodes = [];
    const links = [];

    const langGroups = {};
    stars.forEach((star) => {
      const lang = star.language || "Unknown";
      if (!langGroups[lang]) langGroups[lang] = [];
      langGroups[lang].push(star);
    });

    Object.entries(langGroups).forEach(([lang, repos]) => {
      nodes.push({
        id: `lang-${lang}`,
        label: lang,
        type: "language",
        count: repos.length,
        radius: Math.max(20, Math.min(50, repos.length * 5)),
      });
    });

    const tagCounts = {};
    Object.values(metadata).forEach((meta) => {
      meta.tags?.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    Object.entries(tagCounts)
      .filter(([, count]) => count >= 2)
      .forEach(([tag, count]) => {
        nodes.push({
          id: `tag-${tag}`,
          label: tag,
          type: "tag",
          count,
          radius: Math.max(15, Math.min(40, count * 8)),
        });
      });

    Object.entries(langGroups).forEach(([lang, repos]) => {
      const tagSet = new Map();
      repos.forEach((repo) => {
        const repoTags = metadata[repo.id]?.tags || [];
        repoTags.forEach((tag) => {
          tagSet.set(tag, (tagSet.get(tag) || 0) + 1);
        });
      });
      tagSet.forEach((count, tag) => {
        if (nodes.find((n) => n.id === `tag-${tag}`)) {
          links.push({
            source: `lang-${lang}`,
            target: `tag-${tag}`,
            weight: count,
          });
        }
      });
    });

    return { nodes, links };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const { nodes, links } = buildGraphData();
    if (nodes.length === 0) return;

    const ctx = canvas.getContext("2d");
    const width = container.clientWidth;
    const height = 400;
    const dpr = window.devicePixelRatio || 1;

    const realWidth = width;
    const realHeight = height;

    canvas.width = realWidth * dpr;
    canvas.height = realHeight * dpr;
    canvas.style.width = `${realWidth}px`;
    canvas.style.height = `${realHeight}px`;
    ctx.scale(dpr, dpr);

    const centerX = realWidth / 2;
    const centerY = realHeight / 2;
    const positions = {};

    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      const spread = Math.min(realWidth, realHeight) * 0.35;
      positions[node.id] = {
        x: centerX + Math.cos(angle) * spread,
        y: centerY + Math.sin(angle) * spread,
        vx: 0,
        vy: 0,
      };
    });

    for (let iter = 0; iter < 80; iter++) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = positions[nodes[i].id];
          const b = positions[nodes[j].id];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = (nodes[i].radius + nodes[j].radius) * 1.5;
          if (dist < minDist) {
            const force = (minDist - dist) * 0.05;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
          }
        }
      }

      links.forEach((link) => {
        const a = positions[link.source];
        const b = positions[link.target];
        if (!a || !b) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 0.01 * link.weight;
        a.vx += (dx / dist) * force;
        a.vy += (dy / dist) * force;
        b.vx -= (dx / dist) * force;
        b.vy -= (dy / dist) * force;
      });

      nodes.forEach((node) => {
        const p = positions[node.id];
        p.vx += (centerX - p.x) * 0.002;
        p.vy += (centerY - p.y) * 0.002;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.x = Math.max(node.radius, Math.min(realWidth - node.radius, p.x));
        p.y = Math.max(node.radius, Math.min(realHeight - node.radius, p.y));
      });
    }

    positionsRef.current = positions;

    ctx.clearRect(0, 0, realWidth, realHeight);

    links.forEach((link) => {
      const a = positions[link.source];
      const b = positions[link.target];
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(99, 102, 241, ${Math.min(0.6, link.weight * 0.15)})`;
      ctx.lineWidth = Math.max(1, Math.min(4, link.weight * 0.5));
      ctx.stroke();
    });

    nodes.forEach((node) => {
      const p = positions[node.id];
      const isHovered = hoveredNode === node.id;
      const radius = isHovered ? node.radius * 1.3 : node.radius;

      if (isHovered) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius + 8, 0, 2 * Math.PI);
        const glow = ctx.createRadialGradient(p.x, p.y, radius, p.x, p.y, radius + 8);
        glow.addColorStop(
          0,
          node.type === "language" ? "rgba(99,102,241,0.3)" : "rgba(16,185,129,0.3)",
        );
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle =
        node.type === "language"
          ? isHovered
            ? "#6366f1"
            : "#818cf8"
          : isHovered
            ? "#10b981"
            : "#6ee7b7";
      ctx.globalAlpha = isHovered ? 1 : 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = isHovered ? "#1f293b" : "#64748b";
      ctx.font = `${isHovered ? "bold " : ""}${Math.max(10, Math.min(13, radius * 0.5))}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.label, p.x, p.y - (node.count ? 6 : 0));

      if (node.count) {
        ctx.fillStyle = "#9ca3af";
        ctx.font = "10px sans-serif";
        ctx.fillText(`${node.count}`, p.x, p.y + 8);
      }
    });

    ctx.fillStyle = "#64748b";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.beginPath();
    ctx.arc(20, realHeight - 30, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#818cf8";
    ctx.fill();
    ctx.fillStyle = "#64748b";
    ctx.fillText("语言", 32, realHeight - 26);
    ctx.beginPath();
    ctx.arc(90, realHeight - 30, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#6ee7b7";
    ctx.fill();
    ctx.fillStyle = "#64748b";
    ctx.fillText("标签", 102, realHeight - 26);
  }, [stars, metadata, hoveredNode]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const positions = positionsRef.current;
    if (!positions) return;

    const { nodes } = buildGraphData();
    for (const node of nodes) {
      const p = positions[node.id];
      if (!p) continue;
      const dx = x - p.x;
      const dy = y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < node.radius) {
        setHoveredNode(node.id);
        return;
      }
    }
    setHoveredNode(null);
  };

  return (
    <div ref={containerRef} className="bg-surface-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">项目关系图谱</h3>
        <span className="text-xs text-text-secondary">语言与标签的关联关系</span>
      </div>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
        className="w-full cursor-pointer rounded-lg"
        style={{ height: 400 }}
      />
      {hoveredNode && (
        <div className="mt-2 text-xs text-text-secondary text-center">
          悬停: {hoveredNode.replace(/^(lang|tag)-/, "")}
        </div>
      )}
    </div>
  );
}
