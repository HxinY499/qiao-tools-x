/**
 * 常用正则模板选择器
 */

import { BookOpen, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { REGEX_TEMPLATES } from './constants';
import type { RegexTemplate } from './types';

interface TemplateSelectorProps {
  onSelect: (template: RegexTemplate) => void;
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <BookOpen className="h-4 w-4" />
          常用模板
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-y-auto custom-scrollbar">
        {REGEX_TEMPLATES.map((template, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => onSelect(template)}
            className="flex flex-col items-start gap-1 py-2 cursor-pointer"
          >
            <span className="font-medium">{template.name}</span>
            <span className="text-xs text-muted-foreground line-clamp-1">{template.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default TemplateSelector;
