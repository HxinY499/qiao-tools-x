import { UAParser } from 'ua-parser-js';

export function parseUserAgent(ua: string) {
  const parser = new UAParser(ua);
  return parser.getResult();
}
