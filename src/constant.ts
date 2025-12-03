import { ToolCategory } from './type';

export const LOADING_MESSAGES = [
  '正在为你准备工具箱，请稍候片刻～',
  '前方高能工具加载中，深呼吸放松一下～',
  '帮你拧紧每一颗螺丝，马上就好～',
  '稍等一下，我们正在为你调好所有参数～',
  '加载中……灵感正在靠近，请耐心等候～',
];

export const CATEGORY_ORDER: ToolCategory[] = ['image', 'dev', 'text', 'css', 'life', 'other'];
export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  image: '图片类',
  css: '样式类',
  dev: '开发类',
  text: '文本类',
  life: '生活实用类',
  other: '其他',
};

// api 基础地址
// 开发环境下使用本地 API 服务器
export const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';
