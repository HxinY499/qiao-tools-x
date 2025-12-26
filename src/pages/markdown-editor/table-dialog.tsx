import { AlignCenter, AlignLeft, AlignRight, Minus, Plus, Trash2, Upload } from 'lucide-react';
import { cloneElement, isValidElement, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

import { TableConfig } from './types';
import { createDefaultTableConfig, generateMarkdownTable } from './utils';

interface TableDialogProps {
  trigger: React.ReactNode;
  onInsert: (markdown: string) => void;
}

export function TableDialog({ trigger, onInsert }: TableDialogProps) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<TableConfig>(() => createDefaultTableConfig(2, 3));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateRows = (delta: number) => {
    const newRows = Math.max(1, config.rows + delta);
    setConfig((prev) => ({
      ...prev,
      rows: newRows,
      data: delta > 0 ? [...prev.data, Array(prev.cols).fill('')] : prev.data.slice(0, newRows),
    }));
  };

  const updateCols = (delta: number) => {
    const newCols = Math.max(1, config.cols + delta);
    setConfig((prev) => ({
      ...prev,
      cols: newCols,
      headers: delta > 0 ? [...prev.headers, `标题 ${newCols}`] : prev.headers.slice(0, newCols),
      data: prev.data.map((row) => (delta > 0 ? [...row, ''] : row.slice(0, newCols))),
      alignments: delta > 0 ? [...prev.alignments, 'left'] : prev.alignments.slice(0, newCols),
    }));
  };

  const deleteRow = (rowIndex: number) => {
    if (config.rows <= 1) return;
    setConfig((prev) => ({
      ...prev,
      rows: prev.rows - 1,
      data: prev.data.filter((_, i) => i !== rowIndex),
    }));
  };

  const deleteCol = (colIndex: number) => {
    if (config.cols <= 1) return;
    setConfig((prev) => ({
      ...prev,
      cols: prev.cols - 1,
      headers: prev.headers.filter((_, i) => i !== colIndex),
      data: prev.data.map((row) => row.filter((_, i) => i !== colIndex)),
      alignments: prev.alignments.filter((_, i) => i !== colIndex),
    }));
  };

  const updateHeader = (index: number, value: string) => {
    setConfig((prev) => ({
      ...prev,
      headers: prev.headers.map((h, i) => (i === index ? value : h)),
    }));
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    setConfig((prev) => ({
      ...prev,
      data: prev.data.map((row, ri) =>
        ri === rowIndex ? row.map((cell, ci) => (ci === colIndex ? value : cell)) : row,
      ),
    }));
  };

  const updateAlignment = (index: number, value: 'left' | 'center' | 'right') => {
    setConfig((prev) => ({
      ...prev,
      alignments: prev.alignments.map((a, i) => (i === index ? value : a)),
    }));
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });

        if (jsonData.length === 0) return;

        // 第一行作为表头
        const headers = (jsonData[0] || []).map((h) => String(h || ''));
        const rows = jsonData.slice(1).map((row) => row.map((cell) => String(cell || '')));

        // 限制最大行列数
        const maxCols = Math.min(headers.length, 8);
        const maxRows = Math.min(rows.length, 10);

        const newConfig: TableConfig = {
          rows: maxRows || 1,
          cols: maxCols || 1,
          headers: headers.slice(0, maxCols).length > 0 ? headers.slice(0, maxCols) : ['标题 1'],
          data:
            maxRows > 0
              ? rows.slice(0, maxRows).map((row) => {
                  const paddedRow = [...row.slice(0, maxCols)];
                  while (paddedRow.length < maxCols) paddedRow.push('');
                  return paddedRow;
                })
              : [Array(maxCols || 1).fill('')],
          alignments: Array(maxCols || 1).fill('left') as ('left' | 'center' | 'right')[],
        };

        setConfig(newConfig);
      } catch {
        // 解析失败静默处理
      }
    };
    reader.readAsArrayBuffer(file);

    // 重置 input 以便可以再次选择同一文件
    e.target.value = '';
  };

  const handleInsert = () => {
    const markdown = generateMarkdownTable(config);
    onInsert(markdown);
    setOpen(false);
    // 重置为默认配置
    setConfig(createDefaultTableConfig(2, 3));
  };

  const preview = generateMarkdownTable(config);

  // 克隆 trigger 并添加点击事件
  const triggerElement = isValidElement(trigger)
    ? cloneElement(trigger as React.ReactElement<{ onClick?: () => void }>, {
        onClick: () => setOpen(true),
      })
    : trigger;

  return (
    <>
      {triggerElement}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>插入表格</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {/* 行列控制 + 导入 */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Label className="w-8">行数</Label>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateRows(-1)}
                    disabled={config.rows <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-mono">{config.rows}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateRows(1)}
                    disabled={config.rows >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-8">列数</Label>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateCols(-1)}
                    disabled={config.cols <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-mono">{config.cols}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateCols(1)}
                    disabled={config.cols >= 8}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImportExcel}
                  className="hidden"
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-1.5" />
                  导入 Excel
                </Button>
              </div>
            </div>

            {/* 表格编辑器 */}
            <div className="border rounded-md overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-max">
                <thead>
                  {/* 删除列按钮行 */}
                  <tr>
                    {config.headers.map((_, i) => (
                      <th key={i} className="p-1 border-b border-r last:border-r-0 min-w-[120px]">
                        <div className="flex justify-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteCol(i)}
                                disabled={config.cols <= 1}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>删除此列</TooltipContent>
                          </Tooltip>
                        </div>
                      </th>
                    ))}
                    <th className="w-10" />
                  </tr>
                  {/* 表头输入行 */}
                  <tr className="bg-muted/50">
                    {config.headers.map((header, i) => (
                      <th key={i} className="p-2 border-b border-r last:border-r-0 min-w-[120px]">
                        <Input
                          value={header}
                          onChange={(e) => updateHeader(i, e.target.value)}
                          className="h-8 text-center font-medium"
                          placeholder={`标题 ${i + 1}`}
                        />
                      </th>
                    ))}
                    <th className="w-10 border-b" />
                  </tr>
                  {/* 对齐方式 */}
                  <tr className="bg-muted/30">
                    {config.alignments.map((align, i) => (
                      <th key={i} className="p-1 border-b border-r last:border-r-0">
                        <ToggleGroup
                          type="single"
                          value={align}
                          onValueChange={(v) => v && updateAlignment(i, v as 'left' | 'center' | 'right')}
                          className="justify-center"
                        >
                          <ToggleGroupItem value="left" size="sm" className="h-7 w-7 p-0">
                            <AlignLeft className="h-3.5 w-3.5" />
                          </ToggleGroupItem>
                          <ToggleGroupItem value="center" size="sm" className="h-7 w-7 p-0">
                            <AlignCenter className="h-3.5 w-3.5" />
                          </ToggleGroupItem>
                          <ToggleGroupItem value="right" size="sm" className="h-7 w-7 p-0">
                            <AlignRight className="h-3.5 w-3.5" />
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </th>
                    ))}
                    <th className="w-10 border-b" />
                  </tr>
                </thead>
                <tbody>
                  {config.data.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="p-2 border-b border-r last:border-r-0">
                          <Input
                            value={cell}
                            onChange={(e) => updateCell(ri, ci, e.target.value)}
                            className={cn(
                              'h-8',
                              config.alignments[ci] === 'center' && 'text-center',
                              config.alignments[ci] === 'right' && 'text-right',
                            )}
                            placeholder="单元格内容"
                          />
                        </td>
                      ))}
                      {/* 删除行按钮 */}
                      <td className="w-10 border-b p-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteRow(ri)}
                              disabled={config.rows <= 1}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>删除此行</TooltipContent>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 预览 */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Markdown 预览</Label>
              <pre className="bg-muted/50 rounded-md p-3 text-xs font-mono overflow-x-auto custom-scrollbar">
                {preview}
              </pre>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={handleInsert}>插入表格</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
