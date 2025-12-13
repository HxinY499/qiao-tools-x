import { EscapeType } from './utils';

export type TextEscaperData = {
  input: string;
  output: string;
  activeTab: EscapeType;
  mode: 'encode' | 'decode'; // 编码(转义) 或 解码(反转义)
};
