import { format, parse } from 'date-fns';
import { RefreshCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { DateTimePicker } from './date-time-picker';

type TimestampPrecision = 'seconds' | 'milliseconds';

type FormatConfig =
  | {
      id: string;
      label: string;
      pattern: string;
    }
  | {
      id: string;
      label: string;
      type: 'iso' | 'utc' | 'locale';
    };

type FormatItem = {
  id: string;
  label: string;
  formatter: (date: Date) => string;
};

const FORMAT_CONFIGS: FormatConfig[] = [
  { id: 'standard', label: 'yyyy-MM-dd HH:mm:ss', pattern: 'yyyy-MM-dd HH:mm:ss' },
  { id: 'slash', label: 'yyyy/MM/dd HH:mm:ss', pattern: 'yyyy/MM/dd HH:mm:ss' },
  { id: 'us', label: 'MM-dd-yyyy HH:mm:ss', pattern: 'MM-dd-yyyy HH:mm:ss' },
  { id: 'date-only', label: 'yyyy-MM-dd', pattern: 'yyyy-MM-dd' },
  { id: 'iso', label: 'ISO 8601', type: 'iso' },
  { id: 'utc', label: 'UTC 字符串', type: 'utc' },
  { id: 'locale', label: '本地字符串', type: 'locale' },
];

const COMMON_FORMAT_ITEMS: FormatItem[] = [
  {
    id: 'common-unix-seconds',
    label: 'Unix 秒 (10 位)',
    formatter: (date) => Math.floor(date.getTime() / 1000).toString(),
  },
  {
    id: 'common-unix-milliseconds',
    label: 'Unix 毫秒 (13 位)',
    formatter: (date) => date.getTime().toString(),
  },
  ...FORMAT_CONFIGS.map((config) => ({
    id: `common-${config.id}`,
    label: config.label,
    formatter: (date: Date) => formatByConfig(date, config),
  })),
];

const DATETIME_DISPLAY_FORMAT = 'yyyy-MM-dd HH:mm:ss';

const DATETIME_PARSE_PATTERNS = [
  'yyyy-MM-dd HH:mm:ss',
  "yyyy-MM-dd'T'HH:mm:ss",
  'yyyy/MM/dd HH:mm:ss',
  'yyyy-MM-dd HH:mm',
  'yyyy/MM/dd HH:mm',
  'yyyy-MM-dd',
  'yyyy/MM/dd',
  'MM-dd-yyyy HH:mm:ss',
  'MM/dd/yyyy HH:mm:ss',
  'MM-dd-yyyy',
  'MM/dd/yyyy',
];

function formatDisplayDatetime(date: Date) {
  return format(date, DATETIME_DISPLAY_FORMAT);
}

function formatTimestampByPrecision(date: Date, precision: TimestampPrecision) {
  return precision === 'seconds' ? Math.floor(date.getTime() / 1000).toString() : date.getTime().toString();
}

function formatByConfig(date: Date, config: FormatConfig) {
  if ('pattern' in config) {
    return format(date, config.pattern);
  }
  if (config.type === 'iso') return date.toISOString();
  if (config.type === 'utc') return date.toUTCString();
  return date.toLocaleString();
}

function tryParseDatetimeInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const native = new Date(trimmed);
  if (!Number.isNaN(native.getTime())) {
    return native;
  }

  for (const pattern of DATETIME_PARSE_PATTERNS) {
    const parsed = parse(trimmed, pattern, new Date());
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function TimestampConverterPage() {
  const initialDateRef = useRef<Date | null>(null);
  if (!initialDateRef.current) {
    initialDateRef.current = new Date();
  }
  const initialDate = initialDateRef.current!;

  const [currentDate, setCurrentDate] = useState(initialDate);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [timestampValue, setTimestampValue] = useState(() => formatTimestampByPrecision(initialDate, 'seconds'));
  const [timestampError, setTimestampError] = useState('');
  const [converterDate, setConverterDate] = useState(initialDate);
  const [datetimeInput, setDatetimeInput] = useState(() => formatDisplayDatetime(initialDate));
  const [datetimeError, setDatetimeError] = useState('');

  const timezoneLabel = useMemo(() => {
    const offsetMinutes = -new Date().getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);
    const hours = Math.floor(absMinutes / 60)
      .toString()
      .padStart(2, '0');
    const minutes = (absMinutes % 60).toString().padStart(2, '0');
    return `UTC${sign}${hours}:${minutes}`;
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [autoRefresh]);

  const handleManualCurrentDateChange = (nextDate: Date) => {
    setAutoRefresh(false);
    setCurrentDate(nextDate);
  };

  const resumeAutoRefresh = () => {
    setAutoRefresh(true);
    setCurrentDate(new Date());
  };

  const handleTimestampChange = (value: string) => {
    setTimestampValue(value);
    const trimmed = value.trim();
    if (!trimmed) {
      setTimestampError('请输入时间戳');
      return;
    }
    if (!/^-?\d+$/.test(trimmed)) {
      setTimestampError('时间戳只能包含数字');
      return;
    }
    const numeric = Number(trimmed);
    const digits = trimmed.startsWith('-') ? trimmed.slice(1) : trimmed;
    const nextPrecision: TimestampPrecision = digits.length > 10 ? 'milliseconds' : 'seconds';
    const normalized = nextPrecision === 'seconds' ? numeric * 1000 : numeric;
    const parsedDate = new Date(normalized);
    if (Number.isNaN(parsedDate.getTime())) {
      setTimestampError('无法解析该时间戳');
      return;
    }
    setTimestampError('');
    setConverterDate(parsedDate);
    setDatetimeError('');
    setDatetimeInput(formatDisplayDatetime(parsedDate));
    setTimestampValue(formatTimestampByPrecision(parsedDate, nextPrecision));
  };

  const handleDatetimeInputChange = (value: string) => {
    setDatetimeInput(value);
    const trimmed = value.trim();
    if (!trimmed) {
      setDatetimeError('请输入日期时间');
      return;
    }
    const parsed = tryParseDatetimeInput(trimmed);
    if (!parsed) {
      setDatetimeError('无法解析该日期时间格式');
      return;
    }
    const containsMilliseconds = /\.\d{1,3}/.test(trimmed);
    const nextPrecision: TimestampPrecision = containsMilliseconds ? 'milliseconds' : 'seconds';
    setDatetimeError('');
    setTimestampError('');
    setConverterDate(parsed);
    setTimestampValue(formatTimestampByPrecision(parsed, nextPrecision));
    setDatetimeInput(formatDisplayDatetime(parsed));
  };

  const normalizedDatetimeText = formatDisplayDatetime(converterDate);

  return (
    <div className="max-w-5xl w-full mx-auto px-4 py-6 lg:py-10 space-y-6">
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold">时间戳 ⇄ 日期时间</h3>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="timestamp-input">Unix 时间戳</Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  id="timestamp-input"
                  inputMode="numeric"
                  value={timestampValue}
                  onChange={(event) => handleTimestampChange(event.target.value)}
                  placeholder="1700000000 或 1700000000000"
                  className="font-mono"
                />
                <CopyButton text={timestampValue} mode="icon-text" variant="outline" size="sm" className="sm:w-32" />
              </div>
              {timestampError && <p className="text-xs text-red-500">{timestampError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="datetime-input">日期时间（{timezoneLabel}）</Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  id="datetime-input"
                  value={datetimeInput}
                  onChange={(event) => handleDatetimeInputChange(event.target.value)}
                  placeholder="2024-05-20 12:30:45 / 2024/05/20 / ISO 8601"
                  className="font-mono"
                />
                <CopyButton
                  text={normalizedDatetimeText}
                  mode="icon-text"
                  variant="outline"
                  size="sm"
                  className="sm:w-32"
                />
              </div>
              {datetimeError ? (
                <p className="text-xs text-red-500">{datetimeError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  支持 ISO8601、yyyy-MM-dd HH:mm:ss、yyyy/MM/dd 等常见格式，解析结果已规范化。
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">当前时间</p>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-2xl font-semibold">{format(currentDate, 'yyyy-MM-dd HH:mm:ss')}</h2>
                <CopyButton
                  text={format(currentDate, 'yyyy-MM-dd HH:mm:ss')}
                  mode="icon"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {timezoneLabel} {autoRefresh ? '· 自动刷新中' : '· 自动刷新已暂停'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {!autoRefresh && (
                <Button variant="outline" size="sm" onClick={resumeAutoRefresh}>
                  <RefreshCcw className="h-4 w-4 mr-1" />
                  恢复自动刷新
                </Button>
              )}
              <DateTimePicker value={currentDate} onChange={handleManualCurrentDateChange} buttonClassName="w-52" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {COMMON_FORMAT_ITEMS.map((item) => {
                const value = item.formatter(currentDate);
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border bg-muted/40 px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-mono mt-1 break-all">{value}</p>
                    </div>
                    <CopyButton text={value} mode="icon" variant="ghost" size="icon" className="h-8 w-8 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TimestampConverterPage;
