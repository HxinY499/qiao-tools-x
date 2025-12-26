export interface TableConfig {
  rows: number;
  cols: number;
  headers: string[];
  data: string[][];
  alignments: ('left' | 'center' | 'right')[];
}

export interface ToolbarAction {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  shortcut?: string;
}
