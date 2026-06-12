import { Save } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('tools');
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
      toast.error(t('jsonFormatter.saveNameRequired'));
      return;
    }

    if (!content.trim()) {
      toast.error(t('jsonFormatter.saveEmptyContent'));
      return;
    }

    try {
      setLoading(true);
      await db.add(name, content);
      toast.success(t('jsonFormatter.saveSuccess'));
      setOpen(false);
      onSaved?.();
    } catch (error) {
      console.error('Save failed:', error);
      toast.error(t('jsonFormatter.saveFailed'));
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
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 xl:w-auto xl:px-2"
                disabled={disabled}
                title={t('jsonFormatter.save')}
              >
                <Save className="h-3.5 w-3.5" />
                <span className="hidden xl:inline ml-2">{t('jsonFormatter.save')}</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('jsonFormatter.saveTooltip')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('jsonFormatter.saveDialogTitle')}</DialogTitle>
          <DialogDescription>{t('jsonFormatter.saveDialogDesc')}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Label htmlFor="name" className="text-right shrink-0">
            {t('jsonFormatter.saveName')}
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-3"
            placeholder={t('jsonFormatter.saveNamePlaceholder')}
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
            {t('jsonFormatter.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? t('jsonFormatter.saving') : t('jsonFormatter.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
