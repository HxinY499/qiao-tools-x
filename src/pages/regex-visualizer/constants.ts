import type { RegexTemplate } from './types';

/**
 * 常用正则模板
 */
export const REGEX_TEMPLATES: RegexTemplate[] = [
  {
    name: '邮箱地址',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    description: '匹配常见的邮箱地址格式',
    testText: '联系我：test@example.com 或 user.name+tag@domain.co.uk',
  },
  {
    name: '手机号码（中国）',
    pattern: '1[3-9]\\d{9}',
    description: '匹配中国大陆 11 位手机号',
    testText: '我的手机号是 13812345678，备用号 19987654321',
  },
  {
    name: 'URL 链接',
    pattern: 'https?://[\\w.-]+(?:/[\\w./?%&=-]*)?',
    description: '匹配 HTTP/HTTPS 链接',
    testText: '访问 https://example.com/path?query=1 或 http://test.org',
  },
  {
    name: 'IPv4 地址',
    pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
    description: '匹配 IPv4 地址格式',
    testText: '服务器 IP：192.168.1.1，网关：10.0.0.1',
  },
  {
    name: '日期 (YYYY-MM-DD)',
    pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])',
    description: '匹配 YYYY-MM-DD 格式日期',
    testText: '生日：1990-05-20，入职日期：2023-01-15',
  },
  {
    name: '时间 (HH:MM:SS)',
    pattern: '(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d',
    description: '匹配 24 小时制时间',
    testText: '会议时间：09:30:00 到 17:45:30',
  },
  {
    name: '十六进制颜色',
    pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b',
    description: '匹配 CSS 十六进制颜色值',
    testText: '主色：#FF5733，背景色：#fff，边框：#1a2b3c',
  },
  {
    name: '身份证号（中国）',
    pattern: '[1-9]\\d{5}(?:19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]',
    description: '匹配 18 位中国身份证号',
    testText: '身份证：110101199003077890',
  },
  {
    name: 'HTML 标签',
    pattern: '<([a-z][a-z0-9]*)\\b[^>]*>.*?</\\1>|<[a-z][a-z0-9]*\\s*/>',
    description: '匹配 HTML 标签（简单版）',
    testText: '<div class="test">内容</div> <br/> <span>文本</span>',
  },
  {
    name: '中文字符',
    pattern: '[\\u4e00-\\u9fa5]+',
    description: '匹配连续的中文字符',
    testText: 'Hello 你好世界 World 测试文本',
  },
  {
    name: '数字（整数或小数）',
    pattern: '-?\\d+(?:\\.\\d+)?',
    description: '匹配整数或小数',
    testText: '价格：99.99，数量：-5，总计：1234',
  },
  {
    name: '用户名',
    pattern: '[a-zA-Z][a-zA-Z0-9_]{2,15}',
    description: '字母开头，3-16 位字母数字下划线',
    testText: '用户：admin_123，guest，test_user_01',
  },
];

/**
 * 元字符解释映射
 */
export const META_CHAR_EXPLANATIONS: Record<string, string> = {
  '.': '匹配任意单个字符（除换行符）',
  '*': '匹配前面的元素零次或多次',
  '+': '匹配前面的元素一次或多次',
  '?': '匹配前面的元素零次或一次',
  '^': '匹配字符串开头',
  '$': '匹配字符串结尾',
  '|': '或运算，匹配左边或右边',
  '\\d': '匹配数字 [0-9]',
  '\\D': '匹配非数字 [^0-9]',
  '\\w': '匹配单词字符 [a-zA-Z0-9_]',
  '\\W': '匹配非单词字符',
  '\\s': '匹配空白字符（空格、制表符等）',
  '\\S': '匹配非空白字符',
  '\\b': '匹配单词边界',
  '\\B': '匹配非单词边界',
  '\\n': '匹配换行符',
  '\\r': '匹配回车符',
  '\\t': '匹配制表符',
  '\\0': '匹配 NULL 字符',
};

/**
 * Flag 解释
 */
export const FLAG_EXPLANATIONS: Record<string, { label: string; description: string }> = {
  g: { label: '全局', description: '查找所有匹配项，而非在第一个匹配后停止' },
  i: { label: '忽略大小写', description: '匹配时不区分大小写' },
  m: { label: '多行', description: '^ 和 $ 匹配每行的开头和结尾' },
  s: { label: '单行', description: '. 可以匹配换行符' },
  u: { label: 'Unicode', description: '启用 Unicode 模式' },
  y: { label: '粘性', description: '从 lastIndex 位置开始匹配' },
};
