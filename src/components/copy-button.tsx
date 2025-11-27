import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/utils';

type CopyButtonMode = 'icon' | 'text' | 'icon-text';

interface CopyButtonProps extends ButtonProps {
  text: string;
  mode?: CopyButtonMode;
  iconClassName?: string;
  copyText?: string;
  successText?: string;
  onCopy?: () => void;
}

export function CopyButton({
  text,
  mode = 'icon',
  className,
  iconClassName,
  copyText = '复制',
  successText = '已复制',
  onCopy,
  variant = 'ghost',
  size = 'sm',
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
    } catch (error) {
      console.error('复制失败', error);
    }
  };

  const Icon = copied ? Check : Copy;
  const displayIcon = (
    <Icon className={cn('h-4 w-4', iconClassName, mode === 'icon-text' && 'mr-1', copied && 'text-green-500')} />
  );

  if (mode === 'icon') {
    return (
      <Button
        variant={variant}
        size="icon"
        className={cn('h-8 w-8 shrink-0', className)}
        onClick={handleCopy}
        {...props}
      >
        {displayIcon}
        <span className="sr-only">{copied ? successText : copyText}</span>
      </Button>
    );
  }

  if (mode === 'text') {
    return (
      <Button variant={variant} size={size} className={className} onClick={handleCopy} {...props}>
        {copied ? successText : copyText}
      </Button>
    );
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleCopy} {...props}>
      {displayIcon}
      {copied ? successText : copyText}
    </Button>
  );
}
