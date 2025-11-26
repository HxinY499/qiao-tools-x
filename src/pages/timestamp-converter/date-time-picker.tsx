import { format } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const [timeValue, setTimeValue] = useState(() => format(value, 'HH:mm:ss'));

  useEffect(() => {
    if (!open) {
      setTimeValue(format(value, 'HH:mm:ss'));
    }
  }, [value, open]);

  const commitChange = (nextDate: Date) => {
    onChange(nextDate);
  };

  const handleCalendarSelect = (date?: Date) => {
    if (!date) return;
    const combined = combineDateWithTime(date, timeValue);
    commitChange(combined);
    setOpen(false);
  };

  const handleTimeChange = (newValue: string) => {
    setTimeValue(newValue);
    if (!newValue) return;
    const combined = combineDateWithTime(value, newValue);
    commitChange(combined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
