import type { DragEvent, ReactNode } from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

export interface FileValidationRule {
  /**
   * 允许的 MIME 类型，支持通配符
   * 例如: ['image/*', 'application/pdf', 'text/plain']
   */
  accept?: string[];
  /**
   * 最大文件大小（字节）
   */
  maxSize?: number;
  /**
   * 最小文件大小（字节）
   */
  minSize?: number;
  /**
   * 允许的文件扩展名（不带点）
   * 例如: ['jpg', 'png', 'pdf']
   */
  extensions?: string[];
  /**
   * 自定义验证函数
   */
  customValidator?: (file: File) => { valid: boolean; error?: string };
}

export interface FileDragUploaderProps {
  /**
   * 文件选择后的回调
   */
  onFileSelect: (file: File) => void;
  /**
   * 文件验证失败的回调
   */
  onError?: (error: string) => void;
  /**
   * 验证规则
   */
  validation?: FileValidationRule;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 自定义样式类名
   */
  className?: string;
  /**
   * 拖拽激活时的样式类名
   */
  dragOverClassName?: string;
  /**
   * 禁用时的样式类名
   */
  disabledClassName?: string;
  /**
   * 上传区域的内容（完全自定义）
   */
  children?: ReactNode;
  /**
   * 默认的 icon（emoji 或 ReactNode）
   */
  icon?: ReactNode;
  /**
   * 主要提示文字
   */
  title?: string;
  /**
   * 次要提示文字
   */
  description?: string;
  /**
   * 按钮文字
   */
  buttonText?: string;
  /**
   * 底部提示文字
   */
  hint?: string;
  /**
   * 是否显示默认按钮
   */
  showButton?: boolean;
  /**
   * 是否允许点击整个区域触发文件选择
   */
  clickableArea?: boolean;
  /**
   * input 的 accept 属性
   */
  accept?: string;
  /**
   * 是否允许多选
   */
  multiple?: boolean;
  /**
   * 多选时的回调
   */
  onFilesSelect?: (files: File[]) => void;
  /**
   * 拖拽状态变化回调
   */
  onDragStateChange?: (isDragging: boolean) => void;
  /**
   * 文件读取方式
   */
  readAs?: 'dataURL' | 'text' | 'arrayBuffer' | 'binaryString' | null;
  /**
   * 文件读取完成回调
   */
  onFileRead?: (result: string | ArrayBuffer | null, file: File) => void;
  /**
   * 文件读取错误回调
   */
  onReadError?: (error: ProgressEvent<FileReader>, file: File) => void;
  /**
   * 点击事件拦截器（返回 false 可阻止默认行为）
   */
  onAreaClick?: (event: React.MouseEvent<HTMLDivElement>) => boolean | void;
  /**
   * 自定义内部 input ref（高级用法）
   */
  inputRef?: React.RefObject<HTMLInputElement>;
  /**
   * 是否在验证失败时阻止调用 onFileSelect
   */
  preventInvalidFileSelect?: boolean;
}

const DEFAULT_MESSAGES = {
  icon: '📁',
  title: '拖拽文件到此处',
  buttonText: '选择文件',
  hint: '请选择合适的文件',
} as const;

/**
 * 通用的文件拖拽上传组件
 *
 * 支持特性：
 * - 拖拽上传和点击上传
 * - 灵活的文件验证（类型、大小、扩展名、自定义验证）
 * - 完全自定义 UI 或使用默认 UI
 * - 多文件上传
 * - 文件自动读取（可选）
 * - 状态回调
 *
 * @example
 * // 基础用法 - 图片上传
 * <FileDragUploader
 *   onFileSelect={(file) => console.log(file)}
 *   validation={{ accept: ['image/*'], maxSize: 10 * 1024 * 1024 }}
 *   icon="🖼️"
 *   title="上传图片"
 *   hint="支持 JPG、PNG，最大 10MB"
 * />
 *
 * @example
 * // 完全自定义 UI
 * <FileDragUploader
 *   onFileSelect={handleFile}
 *   validation={{ accept: ['application/pdf'] }}
 * >
 *   <div className="custom-upload-area">
 *     <p>拖拽 PDF 文件到这里</p>
 *   </div>
 * </FileDragUploader>
 *
 * @example
 * // 多文件上传
 * <FileDragUploader
 *   multiple
 *   onFilesSelect={(files) => console.log(files)}
 *   icon="📚"
 *   title="批量上传"
 * />
 *
 * @example
 * // 自动读取文件内容
 * <FileDragUploader
 *   onFileSelect={handleFile}
 *   readAs="dataURL"
 *   onFileRead={(result, file) => {
 *     console.log('文件内容:', result);
 *   }}
 * />
 */
export function FileDragUploader(props: FileDragUploaderProps) {
  const {
    onFileSelect,
    onFilesSelect,
    onError,
    validation,
    disabled = false,
    className = '',
    dragOverClassName = '',
    disabledClassName = '',
    children,
    icon = DEFAULT_MESSAGES.icon,
    title = DEFAULT_MESSAGES.title,
    description = '',
    buttonText = DEFAULT_MESSAGES.buttonText,
    hint = DEFAULT_MESSAGES.hint,
    showButton = true,
    clickableArea = true,
    accept = '*/*',
    multiple = false,
    onDragStateChange,
    readAs = null,
    onFileRead,
    onReadError,
    onAreaClick,
    inputRef: externalInputRef,
    preventInvalidFileSelect = true,
  } = props;

  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;

  const [isDragOver, setIsDragOver] = useState(false);

  /**
   * 验证文件是否符合规则
   */
  function validateFile(file: File): { valid: boolean; error?: string } {
    if (!validation) return { valid: true };

    // 验证文件大小
    if (validation.maxSize !== undefined && file.size > validation.maxSize) {
      return {
        valid: false,
        error: `文件过大，最大允许 ${formatBytes(validation.maxSize)}`,
      };
    }

    if (validation.minSize !== undefined && file.size < validation.minSize) {
      return {
        valid: false,
        error: `文件过小，最小需要 ${formatBytes(validation.minSize)}`,
      };
    }

    // 验证 MIME 类型
    if (validation.accept && validation.accept.length > 0) {
      const isValidMime = validation.accept.some((acceptType) => {
        if (acceptType.endsWith('/*')) {
          const prefix = acceptType.slice(0, -2);
          return file.type.startsWith(prefix);
        }
        return file.type === acceptType;
      });

      if (!isValidMime) {
        return {
          valid: false,
          error: `不支持的文件类型，仅支持：${validation.accept.join(', ')}`,
        };
      }
    }

    // 验证文件扩展名
    if (validation.extensions && validation.extensions.length > 0) {
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.split('.').pop();

      if (!fileExtension || !validation.extensions.includes(fileExtension)) {
        return {
          valid: false,
          error: `不支持的文件扩展名，仅支持：${validation.extensions.join(', ')}`,
        };
      }
    }

    // 自定义验证
    if (validation.customValidator) {
      return validation.customValidator(file);
    }

    return { valid: true };
  }

  /**
   * 读取文件内容（如果需要）
   */
  function readFile(file: File) {
    if (!readAs || !onFileRead) return;

    const reader = new FileReader();

    reader.onload = () => {
      onFileRead(reader.result, file);
    };

    reader.onerror = (error) => {
      if (onReadError) {
        onReadError(error, file);
      } else if (onError) {
        onError(`文件读取失败：${file.name}`);
      }
    };

    switch (readAs) {
      case 'dataURL':
        reader.readAsDataURL(file);
        break;
      case 'text':
        reader.readAsText(file);
        break;
      case 'arrayBuffer':
        reader.readAsArrayBuffer(file);
        break;
      case 'binaryString':
        reader.readAsBinaryString(file);
        break;
    }
  }

  /**
   * 处理单或多个文件
   */
  function handleFiles(files: FileList | File[] | null) {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // 多文件模式
    if (multiple && onFilesSelect) {
      const validFiles: File[] = [];
      const errors: string[] = [];

      fileArray.forEach((file) => {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
          readFile(file);
        } else if (validation.error) {
          errors.push(`${file.name}: ${validation.error}`);
        }
      });

      if (validFiles.length > 0) {
        onFilesSelect(validFiles);
      }

      if (errors.length > 0 && onError) {
        onError(errors.join('\n'));
      }

      return;
    }

    // 单文件模式
    const file = fileArray[0];
    if (!file) return;

    const validationResult = validateFile(file);

    if (!validationResult.valid) {
      if (validationResult.error && onError) {
        onError(validationResult.error);
      }
      if (preventInvalidFileSelect) {
        return;
      }
    }

    readFile(file);
    onFileSelect(file);
  }

  /**
   * 处理拖拽放置
   */
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (disabled) return;

    setIsDragOver(false);
    onDragStateChange?.(false);

    const files = event.dataTransfer.files;
    handleFiles(files);
  }

  /**
   * 处理拖拽悬停
   */
  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (disabled) return;

    if (!isDragOver) {
      setIsDragOver(true);
      onDragStateChange?.(true);
    }
  }

  /**
   * 处理拖拽离开
   */
  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (disabled) return;

    // 只有当离开整个区域时才重置状态
    const rect = event.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = event;

    if (clientX <= rect.left || clientX >= rect.right || clientY <= rect.top || clientY >= rect.bottom) {
      setIsDragOver(false);
      onDragStateChange?.(false);
    }
  }

  /**
   * 处理 input 文件选择
   */
  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(event.target.files);
    // 重置 input，允许选择相同文件
    event.target.value = '';
  }

  /**
   * 处理区域点击
   */
  function handleAreaClick(event: React.MouseEvent<HTMLDivElement>) {
    if (disabled) return;

    // 如果有自定义点击处理器，调用它
    if (onAreaClick) {
      const shouldContinue = onAreaClick(event);
      if (shouldContinue === false) return;
    }

    if (clickableArea) {
      inputRef.current?.click();
    }
  }

  /**
   * 处理按钮点击
   */
  function handleButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    inputRef.current?.click();
  }

  /**
   * 格式化字节大小
   */
  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, index);
    return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
  }

  // 计算最终样式
  const finalClassName = [
    'relative border border-dashed rounded-lg transition-colors',
    disabled ? disabledClassName || 'opacity-50 cursor-not-allowed bg-muted/30' : clickableArea ? 'cursor-pointer' : '',
    isDragOver && !disabled ? dragOverClassName || 'border-primary/60 bg-muted/80 shadow-sm' : 'border-border',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // 如果提供了自定义 children，使用它
  if (children) {
    return (
      <div
        className={finalClassName}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleAreaClick}
      >
        {children}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />
      </div>
    );
  }

  // 使用默认 UI
  return (
    <div
      className={finalClassName}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleAreaClick}
    >
      <div className="relative z-10 flex flex-col items-center text-center gap-1.5 px-4 py-6 sm:py-8">
        {icon && <div className="text-3xl mb-1">{icon}</div>}
        {title && <p className="text-sm font-medium">{title}</p>}
        {description && <p className="text-sm font-medium">{description}</p>}
        {showButton && (
          <Button
            type="button"
            className="rounded-full px-3.5 py-1.5 h-auto text-xs"
            onClick={handleButtonClick}
            disabled={disabled}
          >
            {buttonText}
          </Button>
        )}
        {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  );
}
