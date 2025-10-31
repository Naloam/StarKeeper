import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 允许外部访问
    port: 3001, // 使用 3001 端口（3000 已被占用）
    strictPort: false,
    hmr: {
      clientPort: 443, // Codespaces 使用 443 端口
    },
    proxy: {
      // 代理 DashScope API 请求
      '/api/dashscope': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dashscope/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 添加必要的请求头
            console.log('🔄 代理请求:', req.method, req.url);
          });
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
