始终使用中文回复

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
  - `title/subtitle`: 页面标题(侧边栏显示名称)与副标题
  - `icon`: Lucide React 图标
  - `component`: 懒加载的页面组件
  - `category`: 工具分类

### 添加新工具的步骤

1. 在 `src/pages/` 下创建新文件夹(如 `src/pages/tool-name/`)
2. 实现 `index.tsx` 作为页面组件
3. 在 [src/router.ts](src/router.ts) 中:
   - 导入图标和懒加载组件
   - 添加新的路由配置到 `toolRoutes` 数组，并指定 `category` 分类
4. 应用会自动在侧边栏展示新工具

### 项目结构

- `src/pages/`: 各工具页面,每个工具独立文件夹
- `src/components/`: 组件目录
  - `src/components/ui/`: **shadcn/ui 组件库**（已全量下载完成，不要再安装新组件）
  - `src/components/` 根目录: **自定义业务组件**（如 `code-area.tsx` 等）
- `src/router.ts`: 统一路由配置
- `src/App.tsx`: 主应用框架(含侧边栏与主内容区)
- `src/utils/`: 工具函数(如 `cn` 用于合并 className)

### 组件说明

**shadcn/ui 组件 (`src/components/ui/`)**

- 全部来自 [shadcn/ui](https://ui.shadcn.com/)，已全量下载完成
- 基于 Radix UI + CVA，完美支持暗色模式
- **不要使用 shadcn CLI 下载新组件**，所有常用组件已就绪

**自定义组件 (`src/components/*.tsx`)**

- `code-area`: 代码展示组件，用于显示生成的代码（支持语法高亮、一键复制等功能）
- `copy-button`: 复制按钮，用于复制文字
- `color-picker`: 颜色选择器，用于选择颜色
- `image`: 显示图片的组件，如果需要弹窗预览大图，就使用这个组件
- `file-drag-uploader`: 上传文件的组件
- 其他业务组件根据需要自行实现，放在此目录下

### UI 组件使用

- `src/components/ui/` 下的组件**全部来自 shadcn/ui，已全量下载完成**
- **开发时必须优先使用 shadcn 组件**
- 需要新组件时的优先级:
  1. **首先检查 `src/components/ui/` 是否已有对应组件**（避免重复造轮子）
  2. 如果 shadcn 没有提供该组件，再考虑自己实现
  3. **不要使用 shadcn CLI 下载新组件**（所有组件已下载完毕）

### 状态管理

- 使用 Zustand 进行状态管理
- 每个工具可以在自己的文件夹下创建 `store.ts`(如 [src/pages/scroll-bar/store.ts](src/pages/scroll-bar/store.ts))

### 样式系统

- Tailwind CSS + tailwindcss-animate
- 使用 `@/` 路径别名指向 `src/`
- 组件使用 CVA (class-variance-authority) 管理变体样式

#### 暗色模式支持

项目全面支持暗色模式，开发时**必须确保所有工具在亮色和暗色模式下都完美显示**。

**核心原则：**

1. **使用语义化 CSS 变量**（推荐）
   - `bg-background` / `bg-card` / `bg-popover` - 背景色
   - `text-foreground` / `text-muted-foreground` - 文字颜色
   - `border` - 边框颜色
   - `bg-primary` / `text-primary-foreground` - 主题色
   - `bg-secondary` / `text-secondary-foreground` - 次要色
   - 这些变量会根据暗色/亮色模式自动切换，无需手动处理

2. **避免硬编码颜色**
   - ❌ 不要用：`bg-white` / `bg-gray-100` / `text-black` / `text-gray-900`
   - ✅ 应该用：`bg-background` / `bg-card` / `text-foreground` / `text-muted-foreground`

3. **使用 shadcn/ui 组件**
   - shadcn 组件已内置暗色模式支持
   - `Button` / `Card` / `Input` / `Select` 等可直接使用

4. **需要条件样式时使用 `dark:` 前缀**

   ```tsx
   <div className="bg-gray-50 dark:bg-gray-900">{/* 仅在需要精确控制时使用 */}</div>
   ```

5. **测试暗色模式**
   - 开发时点击右上角月亮/太阳图标切换模式
   - 确保所有文字清晰可读、对比度足够
   - 确保边框、阴影、背景在两种模式下都和谐

6. **提取通用颜色到主题配置**
   - 当发现某个颜色在多个地方使用，或具有语义化含义时，应该提取到 Tailwind 主题配置中
   - 主题配置文件：`tailwind.config.js` 或 `src/index.css` 的 CSS 变量
   - 提取步骤：
     1. 在 `src/index.css` 中添加新的 CSS 变量（需同时定义亮色和暗色）
     2. 在 `tailwind.config.js` 的 `extend.colors` 中引用该变量
     3. 在代码中使用新的语义化类名
   - 例如：如果多个工具都需要"成功绿色"，应该定义 `--success` 变量和 `bg-success` 类名，而不是到处写 `bg-green-500 dark:bg-green-600`

**常见场景示例：**

```tsx
// ✅ 正确：卡片容器
<div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4">
  <h3 className="text-lg font-semibold">标题</h3>
  <p className="text-sm text-muted-foreground">副文本</p>
</div>

// ✅ 正确：输入框（使用 shadcn Input 组件）
import { Input } from '@/components/ui/input';
<Input placeholder="输入内容" />

// ❌ 错误：硬编码白色背景
<div className="bg-white text-black">
  {/* 暗色模式下会很难看 */}
</div>

// ❌ 错误：重复使用相同的颜色组合
<div className="bg-green-500 dark:bg-green-600">成功</div>
<div className="bg-green-500 dark:bg-green-600">完成</div>
{/* 应该提取为 --success 变量 */}

// ✅ 正确：提取通用颜色后
<div className="bg-success text-success-foreground">成功</div>
<div className="bg-success text-success-foreground">完成</div>

// ✅ 如果确实需要纯色且只用一次，使用 dark: 变体
<div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50">
  {/* 明确处理两种模式 */}
</div>
```

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

### 1.1 工具目录结构规范

在 `src/pages` 下新建工具目录，目录名即路由 path（建议全小写短横线），例如：`src/pages/your-tool/`

**标准目录结构：**

```
src/pages/your-tool/
├── index.tsx    # UI 入口，组件渲染逻辑
├── store.ts     # 状态管理（使用 Zustand）
├── utils.ts     # 工具函数，从 UI 中抽离的纯函数
└── types.ts     # TypeScript 类型定义
```

**文件说明：**

1. **`index.tsx`** - UI 入口（必需）
   - 负责页面组件渲染和用户交互
   - 只包含 UI 相关逻辑，不要包含复杂的业务逻辑和工具函数
   - 导出默认组件供路由使用

2. **`store.ts`** - 状态管理（可选，建议使用）
   - 使用 Zustand 管理工具的状态
   - 包含状态定义、actions 和业务逻辑
   - **持久化命名规范**: 如果使用 `persist` 中间件，`name` 属性必须严格遵循 `qiao-tools-x-persist-[tool-name]` 格式（例如 `qiao-tools-x-persist-uuid-generator`）

3. **`utils.ts`** - 工具函数（可选）
   - 存放可复用的纯函数，如格式化、转换、计算等
   - **禁止在组件中定义可抽离的函数**，保持组件简洁
   - 函数应该是纯函数，便于测试和维护

4. **`types.ts`** - 类型定义（可选）
   - 定义工具专属的 TypeScript 类型和接口
   - 保持类型集中管理，便于维护

### 1.2 示例代码

**`src/pages/your-tool/index.tsx`**

```tsx
import { useDebounceFn } from 'ahooks';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { useYourToolStore } from './store';
import { YourDataType } from './types';
import { formatResult, processData } from './utils';

function YourToolPage() {
  const { data, updateData, reset } = useYourToolStore();

  return (
    <div className="max-w-5xl w-full mx-auto px-4 pb-5 lg:py-8">
      <Card className="shadow-sm p-4 lg:p-5">
        <p className="text-sm text-muted-foreground">这里是新工具的内容区域。</p>
      </Card>
    </div>
  );
}

export default YourToolPage;
```

**`src/pages/your-tool/store.ts`**

```tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { YourDataType } from './types';

interface YourToolState {
  data: YourDataType;
  updateData: (newData: Partial<YourDataType>) => void;
  reset: () => void;
}

const DEFAULT_DATA: YourDataType = {
  // 初始状态
};

export const useYourToolStore = create<YourToolState>()(
  persist(
    (set) => ({
      data: DEFAULT_DATA,
      updateData: (newData) => set((state) => ({ data: { ...state.data, ...newData } })),
      reset: () => set({ data: DEFAULT_DATA }),
    }),
    {
      name: 'qiao-tools-x-persist-your-tool', // 严格遵循命名规范
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
```

**`src/pages/your-tool/utils.ts`**

```tsx
/**
 * 格式化结果
 */
export function formatResult(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * 处理数据
 */
export function processData(input: string): string {
  // 纯函数逻辑
  return input.replace(/\s+/g, ' ');
}

/**
 * 验证输入
 */
export function validateInput(input: string): boolean {
  return input.length > 0 && input.length < 100;
}
```

**`src/pages/your-tool/types.ts`**

```tsx
export interface YourDataType {
  value: string;
  mode: 'light' | 'dark';
  options: ToolOptions;
}

export interface ToolOptions {
  enabled: boolean;
  threshold: number;
}

export type ResultStatus = 'idle' | 'loading' | 'success' | 'error';
```

### 1.3 开发注意事项

- 外层布局建议参考现有工具保持统一风格
- 页头标题 / 副标题由全局 `app` + `tool-page` + `router.ts` 渲染，工具页本身不需要再写标题
- **必须确保工具在亮色和暗色模式下都能完美显示**，使用语义化的 Tailwind 类名（如 `bg-card`、`text-foreground`）而非硬编码颜色
- 保持文件职责清晰：UI、状态、工具函数、类型分离
- 优先使用已有的共享组件和工具函数

## 2. 定义工具 Key

1. 打开 `src/type.ts`，在 `ToolKey` 枚举中添加新的 Key：

```ts
export enum ToolKey {
  // ...
  YourTool = 'your-tool', // 新增
}
```

## 3. 在 router 中注册工具信息

1. 打开 `src/router.ts`：
   - 路径：`src/router.ts`

2. 引入你的页面组件和图标（使用 `lucide-react`）：

```ts
import type { LucideIcon } from 'lucide-react';
import { ImageIcon, ScrollText } from 'lucide-react';
import { ToolKey } from '@/type';
import ImageCompressorPage from '@/pages/image-compressor';
import ScrollBarPage from '@/pages/scroll-bar';
import YourToolPage from '@/pages/your-tool'; // 新增
```

3. `ToolRoute` 类型说明（已定义好，只需按字段填）：

```ts
export type ToolRoute = {
  key: ToolKey; // 工具唯一标识
  path: string; // 路由路径 & 左侧 NavLink 的 to
  title: string; // 工具标题
  subtitle?: string; // 右侧工具页 Header 副标题
  icon: LucideIcon; // 左侧菜单图标（lucide-react）
  component: ComponentType; // 工具页面组件
  category: ToolCategory; // 工具分类
  seo: {
    // seo 配置
    description: string;
    keywords?: string;
  };
};
```

4. 在 `toolRoutes` 数组中追加一项配置：

```ts
export const toolRoutes: ToolRoute[] = [
  {
    key: ToolKey.YourTool,
    path: '/your-tool', // 新工具路由
    title: '你的工具名称', // 左侧菜单文案和工具标题
    subtitle: '一句话说明这个工具用途', // （可选）副标题
    icon: ScrollText, // 任选一个 lucide 图标
    component: YourToolPage, // 对应页面组件
    category: 'dev', // 分类
  },
];
```
