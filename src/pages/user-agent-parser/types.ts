import { IResult } from 'ua-parser-js';

export type UserAgentData = {
  userAgent: string;
  parsedResult: IResult | null;
};
