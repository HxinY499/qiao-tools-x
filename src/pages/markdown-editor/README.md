# Markdown 编辑器 - 文本输入流程

## 1. 手动输入文本

```
用户键盘输入
    ↓
Textarea 原生 input 事件
    ↓
onChange={(e) => setContent(e.target.value)}
    ↓
content 状态更新 → React 重新渲染
    ↓
useEffect 监听 content 变化 → 解析 Markdown → 更新预览
```

## 2. 点击 Toolbar 按钮插入文本

```
点击按钮（如"粗体"）
    ↓
applyAction() → wrapSelection(textarea, '**')
    ↓
insertTextNative() → execCommand('insertText', false, '**文本**')
    ↓
┌─────────────────────────────────────────────────────┐
│  execCommand 做了两件事：                            │
│  1. 直接修改 textarea.value（DOM 层面）              │
│  2. 自动触发原生 input 事件                          │
│  3. 记录到浏览器撤销栈（支持 Ctrl+Z）                 │
└─────────────────────────────────────────────────────┘
    ↓
原生 input 事件触发
    ↓
onChange={(e) => setContent(e.target.value)}  ← 和手动输入走同一条路
    ↓
content 状态更新 → React 重新渲染
    ↓
同时：onSelectionChange() 保存光标位置到 pendingFocusRef
    ↓
useEffect 监听 content 变化：
  - 解析 Markdown → 更新预览
  - 从 pendingFocusRef 恢复光标位置
```

## 关键点对比

| 对比项 | 手动输入 | Toolbar 插入 |
|--------|----------|--------------|
| 触发方式 | 键盘事件 | `execCommand` |
| 内容更新 | `onChange` | `onChange`（相同） |
| 光标处理 | 浏览器自动 | `onSelectionChange` 手动恢复 |
| 撤销支持 | 原生支持 | `execCommand` 记录 |

## 设计原则

**内容更新统一走 `onChange`**，Toolbar 只额外处理光标位置。

这样做的好处：
1. 避免重复调用 `setContent`
2. 职责分离清晰
3. 数据流单向，易于理解和维护
