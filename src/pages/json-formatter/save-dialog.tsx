import { Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { db } from './db';

interface SaveJsonDialogProps {
  content: string;
  onSaved?: () => void;
  disabled?: boolean;
}

export function SaveJsonDialog({ content, onSaved, disabled }: SaveJsonDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Auto-generate a default name based on date
      const now = new Date();
      setName(`JSON-${now.toLocaleString()}`);
    }
    setOpen(newOpen);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('请输入保存名称');
      return;
    }

    if (!content.trim()) {
      toast.error('无法保存空内容');
      return;
    }

    try {
      setLoading(true);
      await db.add(name, content);
      toast.success('保存成功');
      setOpen(false);
      onSaved?.();
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 gap-2 px-2 xl:px-3" disabled={disabled} title="保存">
                <Save className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">保存</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>数据将存储在本地 IndexedDB 中</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>保存 JSON</DialogTitle>
          <DialogDescription>将保存在您的浏览器本地数据库（IndexedDB）中</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Label htmlFor="name" className="text-right shrink-0">
            名称
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-3"
            placeholder="输入名称..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave();
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
