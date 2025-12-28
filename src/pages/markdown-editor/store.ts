import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { ThemeName } from './themes';

interface MarkdownEditorState {
  content: string;
  previewTheme: ThemeName;
  setContent: (content: string) => void;
  setPreviewTheme: (theme: ThemeName) => void;
  clear: () => void;
}

const DEFAULT_CONTENT = `# Markdown 编辑器

欢迎使用 Markdown 编辑器！这里是一些基本语法示例：

## 文本格式

**粗体文本** 和 *斜体文本* 以及 ~~删除线~~

## 列表

- 无序列表项 1
- 无序列表项 2
  - 嵌套列表项

1. 有序列表项 1
2. 有序列表项 2

## 代码

行内代码：\`const name = 'Markdown'\`

代码块：

\`\`\`javascript
function hello() {
  console.log('Hello, Markdown!');
}
\`\`\`

## 链接和图片

[链接文本](https://example.com)

![图片描述](https://via.placeholder.com/150)

## 引用

> 这是一段引用文本
> 可以有多行

## 表格

| 姓名 | 年龄 | 城市 |
| :--- | :---: | ---: |
| 张三 | 25 | 北京 |
| 李四 | 30 | 上海 |

---

开始编辑你的 Markdown 内容吧！
`;

export const useMarkdownEditorStore = create<MarkdownEditorState>()(
  persist(
    (set) => ({
      content: DEFAULT_CONTENT,
      previewTheme: 'notion-style-light',
      setContent: (content) => set({ content }),
      setPreviewTheme: (previewTheme) => set({ previewTheme }),
      clear: () => set({ content: '' }),
    }),
    {
      name: 'qiao-tools-x-persist-markdown-editor',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
