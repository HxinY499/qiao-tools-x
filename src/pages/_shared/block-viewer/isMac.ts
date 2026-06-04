/**
 * 判断当前平台是否为 macOS
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /mac|iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** 粘贴快捷键文案（运行期不变，缓存为常量） */
export const PASTE_SHORTCUT = isMac() ? '⌘V' : 'Ctrl+V';

/** 解析快捷键文案 */
export const SUBMIT_SHORTCUT = isMac() ? '⌘↵' : 'Ctrl+↵';
