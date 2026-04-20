import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { UserAgentData } from './types';

interface UserAgentParserState {
  data: UserAgentData;
  setUserAgent: (ua: string) => void;
  reset: () => void;
}

const DEFAULT_DATA: UserAgentData = {
  userAgent: '',
};

export const useUserAgentParserStore = create<UserAgentParserState>()(
  persist(
    (set) => ({
      data: DEFAULT_DATA,
      setUserAgent: (ua) => set({ data: { userAgent: ua } }),
      reset: () => set({ data: DEFAULT_DATA }),
    }),
    {
      name: 'qiao-tools-x-persist-user-agent-parser',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
