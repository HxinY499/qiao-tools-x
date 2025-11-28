import type { LucideIcon } from 'lucide-react';
import { ComponentType } from 'react';

export type ToolCategory = 'image' | 'css' | 'dev' | 'text' | 'life' | 'other';
export type ToolRoute = {
  path: string;
  label: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  component: ComponentType;
  category: ToolCategory;
};
