import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { UserAgentData } from './types';
import { parseUserAgent } from './utils';

interface UserAgentParserState {
  data: UserAgentData;
  setUserAgent: (ua: string) => void;
  reset: () => void;
}

const DEFAULT_DATA: UserAgentData = {
  userAgent: '',
  parsedResult: null,
};

export const useUserAgentParserStore = create<UserAgentParserState>()(
  persist(
    (set) => ({
      data: DEFAULT_DATA,
      setUserAgent: (ua) => {
        const parsedResult = ua ? parseUserAgent(ua) : null;
        set({ data: { userAgent: ua, parsedResult } });
      },
      reset: () => set({ data: DEFAULT_DATA }),
    }),
    {
      name: 'qiao-tools-x-persist-user-agent-parser',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
