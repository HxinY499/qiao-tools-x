# Typora 主题移植指南

本文档指导如何将 Typora 主题移植到本项目的 Markdown 编辑器中。

## 移植流程

当用户提供 Typora 主题链接（如 `https://theme.typora.io/theme/Vercel/`）时，按以下步骤操作：

### 1. 获取主题 CSS 源码

1. 访问用户提供的主题页面，找到 GitHub 仓库链接
2. 从仓库中获取主题的 `.css` 文件（通常是 `主题名.css`）
3. 使用 `https://raw.githubusercontent.com/用户名/仓库名/分支/文件名.css` 获取原始 CSS
4. **重要**：如果主题同时提供亮色和暗色版本（如 `theme-light.css` 和 `theme-dark.css`），必须同时接入两个版本

### 2. 创建主题文件

在 `src/pages/markdown-editor/themes/` 目录下创建新文件，命名为 `主题名.ts`：

```typescript
// 主题名 主题 - 来自 Typora (主题链接)
export const style = `
.markdown-body {
  // 移植后的样式
}
`;
```

### 3. 选择器转换规则

| Typora 选择器     | 转换为                           |
| ----------------- | -------------------------------- |
| `#write`          | `.markdown-body`                 |
| `#write h1`       | `.markdown-body h1`              |
| `.md-fences`      | `.markdown-body pre`             |
| `.md-fences code` | `.markdown-body pre code`        |
| `code`            | `.markdown-body code`            |
| `.CodeMirror`     | 删除（编辑器特有）               |
| `.ty-*`           | 删除（Typora 特有）              |
| `.md-*`           | 大部分删除，除非有对应 HTML 元素 |

### 4. 样式处理规则

#### 必须保留的样式

- 字体设置（font-family, font-size, line-height）
- 颜色（color, background-color）
- 标题样式（h1-h6）
- 段落、列表、引用、表格样式
- 代码块和行内代码样式
- 链接样式
- 分隔线样式

#### 需要删除的内容

- `@font-face` 声明（除非使用 Web 字体 CDN）
- Typora 特有的 UI 元素样式（侧边栏、工具栏等）
- CodeMirror 编辑器样式
- 打印样式（`@media print`）
- CSS 变量声明中引用本地文件的部分

#### 需要修改的内容

- 本地字体改为通用字体栈或 Web 字体
- 相对路径的资源引用需要删除或替换
- 背景色设置为 `transparent`（由容器控制）

### 5. 注册主题

修改 `src/pages/markdown-editor/themes/index.ts`：

```typescript
// 1. 添加类型
export type ThemeName = 'github' | 'newsprint' | 'night' | '新主题名';

// 2. 添加元数据（包含 isDark 标识）
export const THEME_LIST: ThemeMeta[] = [
  // ... 已有主题
  { name: '新主题名', label: '显示名称', isDark: false }, // 亮色主题
  { name: '新暗色主题', label: '暗色显示名称', isDark: true }, // 暗色主题
];

// 3. 添加加载器
const themeLoaders: Record<ThemeName, () => Promise<{ style: string }>> = {
  // ... 已有主题
  新主题名: () => import('./新主题名'),
};
```

## 移植示例

### 原始 Typora CSS

```css
#write {
  font-family: 'Geist', sans-serif;
  color: #171717;
}

#write h1 {
  font-size: 2.5rem;
  border-bottom: 1px solid #eee;
}

.md-fences {
  background-color: #282c34;
  border-radius: 7px;
}
```

### 移植后

```typescript
export const style = `
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #171717;
}

.markdown-body h1 {
  font-size: 2.5rem;
  border-bottom: 1px solid #eee;
}

.markdown-body pre {
  background-color: #282c34;
  border-radius: 7px;
}
`;
```

## 常见字体替换

| 原字体         | 替换为                                                                  |
| -------------- | ----------------------------------------------------------------------- |
| Geist          | `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`             |
| GeistMono      | `"SF Mono", Monaco, Consolas, monospace`                                |
| PT Serif       | `"PT Serif", Georgia, "Times New Roman", serif`                         |
| JetBrains Mono | `"JetBrains Mono", "Fira Code", "SF Mono", Monaco, Consolas, monospace` |
| Maple Mono     | `"Maple Mono NF CN", "SF Mono", Monaco, Consolas, monospace`            |
| LXGWWenKai     | 删除或保留（中文字体，可选）                                            |
| PingFang SC    | `"PingFang SC", "Microsoft YaHei", sans-serif`                          |

## 注意事项

1. **按需加载**：每个主题单独一个文件，通过动态 `import()` 加载
2. **缓存机制**：加载后的主题会缓存，避免重复请求
3. **亮/暗色标识**：务必正确设置 `isDark` 字段，方便用户识别主题类型
4. **测试**：移植后需要测试各种 Markdown 元素的渲染效果
