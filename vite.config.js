import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "StarKeeper - GitHub Stars Manager",
        short_name: "StarKeeper",
        description: "Intelligent GitHub Stars management tool with AI-powered features",
        theme_color: "#6366f1",
        background_color: "#1e293b",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait-primary",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.github\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "github-api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/avatars\.githubusercontent\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "github-avatars-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/dashscope\.aliyuncs\.com\/.*/i,
            handler: "NetworkOnly",
            options: {
              cacheName: "dashscope-api-cache",
            },
          },
        ],
      },
      devOptions: {
        enabled: process.env.VITE_PWA_DEV === "true", // 通过环境变量控制
        type: "module",
      },
    }),
  ],
  server: {
    host: true, // 允许外部访问
    port: 3000, // 使用 3000 端口
    strictPort: false,
    hmr: {
      clientPort: 443, // Codespaces 使用 443 端口
    },
    proxy: {
      // 代理 DashScope API 请求
      "/api/dashscope": {
        target: "https://dashscope.aliyuncs.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dashscope/, ""),
        configure: (proxy, options) => {
          proxy.on("proxyReq", (proxyReq, req, res) => {
            // Proxy request
          });
        },
      },
      // 代理 DeepSeek API 请求
      "/api/deepseek": {
        target: "https://api.deepseek.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deepseek/, ""),
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
});
