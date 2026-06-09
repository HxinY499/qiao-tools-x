import figlet from 'figlet';

import type { FontName } from './types';

/**
 * 用 Vite 的 import.meta.glob 在编译时收集所有 figlet 字体模块。
 * - 对开发/生产都友好：dev 由 Vite 预转换，prod 由 Rolldown 正确打包成异步 chunk。
 * - 不会把全部字体打进主 bundle —— 每个字体是独立的 lazy chunk，按需下载。
 *
 * 路径以 `/` 开头表示从项目根开始（Vite glob 的标准用法之一）。
 * Vite 8 / Rolldown 对 node_modules 下的 glob 会正确处理为按需异步 chunk。
 */
const fontLoaders = import.meta.glob<{ default: string }>('/node_modules/figlet/importable-fonts/*.js');

/** 已加载/正在加载的字体缓存：name -> Promise<void> */
const fontLoadCache = new Map<string, Promise<void>>();

/**
 * 动态加载一个 figlet 字体并注入到 figlet 实例中。
 * 同名字体重复调用复用同一 Promise；加载失败时清缓存以便下次重试。
 */
export function loadFont(name: FontName): Promise<void> {
  const cached = fontLoadCache.get(name);
  if (cached) return cached;

  const key = `/node_modules/figlet/importable-fonts/${name}.js`;
  const loader = fontLoaders[key];
  if (!loader) {
    return Promise.reject(new Error(`字体 "${name}" 未找到`));
  }

  const promise = loader()
    .then((mod) => {
      figlet.parseFont(name, mod.default);
    })
    .catch((err) => {
      fontLoadCache.delete(name);
      throw err;
    });

  fontLoadCache.set(name, promise);
  return promise;
}

/**
 * 渲染 ASCII 大字。先确保字体已加载，再调用 textSync 同步生成。
 * 失败时返回 null（调用方决定如何提示用户）。
 */
export async function renderAsciiArt(text: string, font: FontName): Promise<string | null> {
  if (!text) return '';
  try {
    await loadFont(font);
    return figlet.textSync(text, { font: font as figlet.Fonts });
  } catch (err) {
    console.error('[ascii-art] render failed:', err);
    return null;
  }
}

/** 触发浏览器下载 .txt 文件 */
export function downloadAsTxt(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 从数组中随机取一个元素（不与上次相同） */
export function pickRandomDifferent<T>(list: readonly T[], current?: T): T {
  if (list.length <= 1) return list[0];
  let next = list[Math.floor(Math.random() * list.length)];
  while (next === current) {
    next = list[Math.floor(Math.random() * list.length)];
  }
  return next;
}
