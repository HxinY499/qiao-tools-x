import { format } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/utils';

type PopoverAlign = 'start' | 'center' | 'end';

type DateTimePickerProps = {
  value: Date;
  onChange: (date: Date) => void;
  align?: PopoverAlign;
  buttonClassName?: string;
  timeLabel?: string;
};

function combineDateWithTime(date: Date, timeString: string) {
  const [rawHours = '00', rawMinutes = '00', rawSeconds = '00'] = timeString.split(':');
  const hours = Number(rawHours) || 0;
  const minutes = Number(rawMinutes) || 0;
  const seconds = Number(rawSeconds) || 0;
  const next = new Date(date);
  next.setHours(hours, minutes, seconds, 0);
  return next;
}

export function DateTimePicker({
  value,
  onChange,
  align = 'end',
  buttonClassName,
  timeLabel = '时间（精确到秒）',
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  // 本地编辑态：仅在用户打字时使用；关闭后由 value 派生，不需 useEffect 同步
  const [timeDraft, setTimeDraft] = useState<string | null>(null);

  const timeValue = timeDraft ?? format(value, 'HH:mm:ss');

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    // 关闭时清理本地编辑态，下次打开会重新从最新 value 派生
    if (!next) setTimeDraft(null);
  };

  const handleCalendarSelect = (date?: Date) => {
    if (!date) return;
    const combined = combineDateWithTime(date, timeValue);
    onChange(combined);
    handleOpenChange(false);
  };

  const handleTimeChange = (newValue: string) => {
    setTimeDraft(newValue);
    if (!newValue) return;
    onChange(combineDateWithTime(value, newValue));
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn('justify-between font-normal', buttonClassName)}>
          {format(value, 'yyyy-MM-dd')}
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={value}
          defaultMonth={value}
          onSelect={handleCalendarSelect}
        />
        <div className="border-t p-3 space-y-2">
          <Label className="text-xs text-muted-foreground">{timeLabel}</Label>
          <Input type="time" step="1" value={timeValue} onChange={(event) => handleTimeChange(event.target.value)} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
