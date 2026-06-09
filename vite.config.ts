import path from 'node:path';
import { fileURLToPath } from 'node:url';

import babel from '@rolldown/plugin-babel';
import react from '@vitejs/plugin-react';
import { defineConfig, type PluginOption } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
// 说明：vite8 把 @vitejs/devtools 设为 optional peer，pnpm 由此产生多个 vite 类型实例，
// 导致 IDE(tsserver) 解析到的 UserConfig 副本不含 devtools 字段（tsc -b 与 vite build 均通过）。
// 这里将配置提取为无类型注解的变量再交给 defineConfig：TS 的「多余属性检查」仅在对象字面量
// 直接传参时触发，提取为变量后改为结构可赋值检查，从而允许 devtools 字段，消除 IDE 假阳性。
const config = {
  // 启用 Vite 8 官方内置 DevTools（依赖 @vitejs/devtools）。
  // dev / build 启动后，终端会打印 DevTools 访问地址，提供 Rolldown 构建分析、
  // 模块图、chunks、依赖等调试能力。
  devtools: {
    enabled: true,
  },
  plugins: [
    react(),
    // Vite 8 的 plugin-react 默认使用 Oxc，不再支持内置 babel 选项，
    // 这里用独立的 @rolldown/plugin-babel 运行 babel-plugin-direct-import，
    // 对 lucide-react 做按需直接导入优化（仅处理 src 下源码）。
    // babel() 返回的 Plugin 与本项目 vite8 是不同类型实例（同上多实例问题），故断言统一。
    babel({
      include: /src\/.*\.[jt]sx?$/,
      plugins: [['babel-plugin-direct-import', { modules: ['lucide-react'] }]],
    }) as PluginOption,
  ],
  server: {
    open: true,
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Vite 8 / Rolldown 下 manualChunks 仅支持函数形式（对象写法已移除）。
        // 提取为变量后 id 失去上下文类型，故显式标注 string 避免 implicit any。
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          // React 核心
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/.test(id)) {
            return 'vendor-react';
          }
          // Radix UI 组件
          if (id.includes('@radix-ui')) {
            return 'vendor-radix';
          }
          // 工具库
          if (/[\\/]node_modules[\\/](clsx|tailwind-merge|class-variance-authority|zustand|date-fns)[\\/]/.test(id)) {
            return 'vendor-utils';
          }
          return undefined;
        },
      },
    },
  },
};

export default defineConfig(config);
