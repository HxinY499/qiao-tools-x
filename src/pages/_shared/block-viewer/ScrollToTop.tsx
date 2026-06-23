import { ArrowUp } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

// 向上查找最近的可滚动祖先（overflow-y 为 auto/scroll/overlay），找不到则回退到 window
export function findScrollParent(el: HTMLElement | null): HTMLElement | Window {
  let node = el?.parentElement ?? null;
  while (node) {
    const style = getComputedStyle(node);
    const overflowY = style.overflowY;
    if (
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return window;
}

/** 回到顶部按钮，自动监听最近的可滚动祖先 */
export function ScrollToTop() {
  const { t } = useTranslation('blockViewer');
  const anchorRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLElement | Window | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scroller = findScrollParent(anchorRef.current);
    scrollerRef.current = scroller;

    const getTop = () => (scroller === window ? window.scrollY : (scroller as HTMLElement).scrollTop);
    const handleScroll = () => setVisible(getTop() > 400);

    scroller.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => scroller.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    if (scroller === window) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      (scroller as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <>
      {/* 用于定位滚动祖先的锚点 */}
      <div ref={anchorRef} className="hidden" aria-hidden />
      {visible && (
        <Button
          size="icon"
          variant="outline"
          className="fixed bottom-6 right-6 z-50 h-9 w-9 rounded-full shadow-md bg-background/80 backdrop-blur-sm"
          onClick={scrollToTop}
          title={t('scrollToTop.title')}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </>
  );
}
