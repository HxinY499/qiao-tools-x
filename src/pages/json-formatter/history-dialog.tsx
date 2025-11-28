import { format } from 'date-fns';
import { Archive, Clock, FileJson, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { db, SavedJson } from './db';

interface HistoryDialogProps {
  onLoad: (content: string) => void;
}

export function HistoryDialog({ onLoad }: HistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<SavedJson[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await db.getAll();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('加载历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await db.delete(id);
      toast.success('删除成功');
      loadHistory(); // Reload list
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('删除失败');
    }
  };

  const handleSelect = (content: string) => {
    onLoad(content);
    setOpen(false);
    toast.success('已加载 JSON 内容');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-2 px-2 xl:px-3" title="仓库">
          <Archive className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">仓库</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            JSON 仓库
          </DialogTitle>
          <DialogDescription>管理保存在本地 IndexedDB 中的 JSON 数据</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 mt-4 border rounded-md">
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-full py-8 text-muted-foreground">加载中...</div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground gap-2">
                <FileJson className="h-8 w-8 opacity-20" />
                <p>暂无保存的记录</p>
              </div>
            ) : (
              <div className="p-4 grid gap-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => handleSelect(item.content)}
                  >
                    <div className="grid gap-1.5 flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate text-sm">{item.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(item.createdAt, 'yyyy-MM-dd HH:mm:ss')}
                      </div>
                      <code className="text-[10px] text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded truncate font-mono max-w-full block mt-1">
                        {item.content.slice(0, 60)}
                        {item.content.length > 60 ? '...' : ''}
                      </code>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={(e) => item.id && handleDelete(item.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>删除此记录</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
