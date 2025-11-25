# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 React + TypeScript + Vite 的工具集合应用,提供多种在线工具(如图片压缩、滚动条样式生成器等)。

## 常用命令

### 开发

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本(包含 TypeScript 类型检查)
pnpm preview      # 预览生产构建
pnpm lint         # 运行 ESLint 并自动修复问题
```

## 核心架构

### 路由系统

- 所有工具路由在 [src/router.ts](src/router.ts) 中使用 `toolRoutes` 数组统一管理
- 每个工具路由包含:
  - `path`: URL 路径
  - `label`: 侧边栏显示名称
  - `title/subtitle`: 页面标题与副标题
  - `icon`: Lucide React 图标
  - `component`: 懒加载的页面组件

### 添加新工具的步骤

1. 在 `src/pages/` 下创建新文件夹(如 `src/pages/tool-name/`)
2. 实现 `index.tsx` 作为页面组件
3. 在 [src/router.ts](src/router.ts) 中:
   - 导入图标和懒加载组件
   - 添加新的路由配置到 `toolRoutes` 数组
4. 应用会自动在侧边栏展示新工具

### 项目结构

- `src/pages/`: 各工具页面,每个工具独立文件夹
- `src/components/ui/`: UI 组件库(主要来自 shadcn/ui)
- `src/router.ts`: 统一路由配置
- `src/App.tsx`: 主应用框架(含侧边栏与主内容区)
- `src/utils/`: 工具函数(如 `cn` 用于合并 className)

### UI 组件获取

- `src/components/ui/` 下的组件**大多来自 shadcn/ui**
- 需要新组件时的优先级:
  1. **优先使用 shadcn CLI**: `npx shadcn@latest add <component-name>`
  2. 如果 shadcn 没有提供,再考虑自己实现
- shadcn 组件基于 Radix UI + CVA,已配置好样式系统

### 状态管理

- 使用 Zustand 进行状态管理
- 每个工具可以在自己的文件夹下创建 `store.ts`(如 [src/pages/scroll-bar/store.ts](src/pages/scroll-bar/store.ts))

### 样式系统

- Tailwind CSS + tailwindcss-animate
- 使用 `@/` 路径别名指向 `src/`
- 组件使用 CVA (class-variance-authority) 管理变体样式

### 图标库

- 使用 **lucide-react** 作为图标库
- 导入示例: `import { ImageIcon, ScrollText } from 'lucide-react'`
- 所有工具路由的图标都使用 Lucide 图标

## 开发注意事项

### TypeScript

- 项目使用 TypeScript 5.9+ 和严格类型检查
- 构建前会执行 `tsc -b` 进行类型检查
- 使用 Project References (tsconfig.app.json, tsconfig.node.json)

### ESLint 配置

- 集成 Prettier 自动格式化
- 自动移除未使用的 imports (`unused-imports` 插件)
- 自动排序 imports (`simple-import-sort` 插件)
- React Hooks 规则检查
- 运行 `pnpm lint` 会自动修复大部分问题

### 代码组织原则

- 每个工具页面独立,互不依赖
- UI 组件统一放在 `src/components/ui/`
- 使用 Suspense + lazy() 进行代码分割
- 路由系统自动处理加载状态(RouteLoadingFallback)

# 如何在创建一个新的工具

## 1. 创建页面文件

1. 在 `src/pages` 下新建一个目录，目录名就是路由 path（建议全小写短横线）：
   - 例如：`src/pages/your-tool/`

2. 在该目录下创建入口文件：
   - `src/pages/your-tool/index.tsx`

3. 在 `index.tsx` 中导出页面组件（只负责右侧内容区，不要自己写全局 header）

```tsx
// src/pages/your-tool/index.tsx
function YourToolPage() {
  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8">
      {/* 这里写你的工具内容，可以用 shadcn 的 Button/Input 等组件 */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 lg:p-5">
        <p className="text-sm">这里是新工具的内容区域。</p>
      </div>
    </div>
  );
}

export default YourToolPage;
```

注意：

- 外层布局建议参考现有工具（如 `image-compressor`、`scroll-bar`），保持统一风格。
- 页头标题 / 副标题由全局 `App` + `router.ts` 渲染，工具页本身不需要再写标题。
- 如果需要存储比较复杂的状态，使用zustand，复杂状态和ui 需要分开管理，不要放在同一个文件里，新建一个store.ts 文件

## 2. 在 router 中注册工具信息

1. 打开 `src/router.ts`：
   - 路径：`src/router.ts`

2. 引入你的页面组件和图标（使用 `lucide-react`）：

```ts
import type { LucideIcon } from 'lucide-react';
import { ImageIcon, ScrollText } from 'lucide-react';
import ImageCompressorPage from '@/pages/image-compressor';
import ScrollBarPage from '@/pages/scroll-bar';
import YourToolPage from '@/pages/your-tool'; // 新增
```

3. `ToolRoute` 类型说明（已定义好，只需按字段填）：

```ts
export type ToolRoute = {
  path: string; // 路由路径 & 左侧 NavLink 的 to
  label: string; // 左侧菜单显示的名称
  title: string; // 右侧工具页 Header 大标题
  subtitle?: string; // 右侧工具页 Header 副标题
  icon: LucideIcon; // 左侧菜单图标（lucide-react）
  component: () => JSX.Element; // 工具页面组件
};
```

4. 在 `toolRoutes` 数组中追加一项配置：

```ts
export const toolRoutes: ToolRoute[] = [
  {
    path: '/image-compressor',
    label: '图片压缩工具',
    title: 'ImageCompressor',
    subtitle: '在线图片压缩与尺寸调整工具，支持实时预览与参数调节',
    icon: ImageIcon,
    component: ImageCompressorPage,
  },
  {
    path: '/scroll-bar',
    label: '滚动条生成器',
    title: '滚动条样式可视化',
    subtitle: '可视化调整滚动条样式，并生成可复制的 CSS 代码',
    icon: ScrollText,
    component: ScrollBarPage,
  },
  {
    path: '/your-tool', // 新工具路由
    label: '你的工具名称', // 左侧菜单文案
    title: 'Your Tool Title', // 右侧大标题
    subtitle: '一句话说明这个工具用途', // （可选）副标题
    icon: ScrollText, // 任选一个 lucide 图标
    component: YourToolPage, // 对应页面组件
  },
];
```

总结：

- 新工具页面统一放在 `src/pages/<tool>/index.tsx`
- 所有工具的元信息（路由、标题、副标题、图标、组件）统一在 `src/router.ts` 中配置
- 不需要在 `App.tsx` 手动改 `<Routes>` 或左侧菜单，只维护 `toolRoutes` 即可。
