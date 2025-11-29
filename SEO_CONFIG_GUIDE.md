# 新增工具 SEO 配置指南

本文档规定了在添加新工具时必须遵守的 SEO 配置标准。本项目在 `router.ts` 中采用集中式配置管理，由通用的 `SEO` 组件统一消费。**请勿在页面组件内部硬编码 `<Helmet>` 标签。**

---

## 1. 必须修改的文件

添加新工具时，必须修改以下两个文件以确保 SEO 正常工作：

### A. `src/type.ts`

1.  **添加 `ToolKey`**: 在枚举中新增一个工具 Key。
2.  **检查 `ToolCategory`**: 确保工具归属于现有的分类之一 (`image`, `css`, `dev`, `text`, `life`, `other`)。

### B. `src/router.ts`

这是 SEO 数据存放的核心位置。你需要在 `toolRoutes` 数组中新增一个对象。

---

## 2. 配置结构 (`toolRoutes`)

每个路由对象都需要包含一个 `seo` 对象。标准结构如下：

```typescript
{
  key: ToolKey.NewToolName, // 对应步骤 1 中的 Key
  path: '/new-tool-path',   // URL 路径 (kebab-case)
  label: '中文菜单名',       // 侧边栏显示的短名称
  title: 'English Title',   // 浏览器标签页标题 (仅前缀)
  subtitle: '中文页面副标题', // 页面顶部显示的详细标题
  category: 'dev',          // 必须对应 ToolCategory 类型
  seo: {
    description: '...',     // <meta name="description"> 和 og:description
    keywords: '...',        // <meta name="keywords">
  },
}
```

---

## 3. SEO 字段填写规范

### `category` (关键：影响 JSON-LD 生成)

选择最合适的分类，以便生成正确的 Schema.org 结构化数据：

- `image` -> 生成 `MultimediaApplication` (多媒体应用)
- `dev` / `css` -> 生成 `DeveloperApplication` (开发者应用)
- `text` -> 生成 `UtilitiesApplication` (实用工具应用)
- `life` / `other` -> 生成 `WebApplication` (Web 应用)

### `seo.description` (核心描述)

- **长度**: 80 - 150 个字符。
- **语言**: 自然流畅的中文。
- **强制包含要素**:
  - 必须提及 "免费在线"。
  - 必须提及具体的输入/输出格式（如果适用）。
  - **隐私承诺**: 必须提及 "数据本地处理" 或 "保护隐私" (例如："所有数据本地处理，保护您的隐私")。
- **推荐模版**:
  > "免费在线[工具名]，支持[功能A]与[功能B]。可自定义[参数]。所有处理在浏览器本地完成，无需上传服务器，保护您的隐私。"

### `seo.keywords` (关键词标签)

- **格式**: 英文逗号分隔的字符串。
- **内容策略**:
  - 核心功能 (如 "正则测试")
  - 同义词 (如 "正则表达式", "RegExp")
  - 动词组合 (如 "测试", "调试", "生成")
  - 技术栈 (如 "JavaScript正则")
  - 长尾词 (如 "在线正则工具")

---

## 4. 实现示例

**任务:** 添加一个 "Markdown 预览" 工具。

**1. 更新 `src/type.ts`:**

```typescript
export enum ToolKey {
  // ... 现有 key
  MarkdownPreview = 'markdown-preview',
}
```

**2. 更新 `src/router.ts`:**

```typescript
{
  key: ToolKey.MarkdownPreview,
  path: '/markdown-preview',
  label: 'Markdown 预览',
  title: 'Markdown Preview',
  subtitle: '实时 Markdown 编辑与预览工具，支持导出 HTML',
  icon: FileText, // 从 lucide-react 导入图标
  component: MarkdownPage,
  category: 'text', // 映射为 UtilitiesApplication
  seo: {
    description: '免费在线 Markdown 编辑器与预览工具，支持实时渲染、语法高亮及 HTML 导出。完全纯前端运行，您的文档内容仅保存在本地浏览器中，安全无忧。',
    keywords: 'Markdown编辑器,Markdown预览,在线Markdown,md转html,Markdown写作,文本编辑工具',
  },
},
```

---

## 5. 验证清单 (Checklist)

在完成代码编写前，请自查：

1. [ ] `description` 是否包含了 "本地处理/隐私" (本地/隐私) 字样？
2. [ ] `category` 是否设置正确，以确保 JSON-LD 类型准确？
3. [ ] `keywords` 是否使用逗号分隔且相关性强？
