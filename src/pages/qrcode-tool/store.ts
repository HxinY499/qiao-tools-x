import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ContactData, LocationData, QRCodeState, QRMode, QRStyleConfig, QRTab, SMSData, WifiData } from './types';

const DEFAULT_WIFI: WifiData = {
  ssid: '',
  password: '',
  encryption: 'WPA',
  hidden: false,
};

const DEFAULT_CONTACT: ContactData = {
  name: '',
  phone: '',
  email: '',
  company: '',
  title: '',
};

const DEFAULT_SMS: SMSData = {
  phone: '',
  message: '',
};

const DEFAULT_LOCATION: LocationData = {
  latitude: '',
  longitude: '',
  label: '',
};

const DEFAULT_STYLE: QRStyleConfig = {
  foreground: '#000000',
  background: '#ffffff',
  errorCorrectionLevel: 'M',
  size: 300,
  margin: 2,
  logoDataUrl: '',
  logoSizeRatio: 0.2,
};

export interface QRCodeStore extends QRCodeState {
  setTab: (tab: QRTab) => void;
  setMode: (mode: QRMode) => void;
  setText: (text: string) => void;
  setWifi: (wifi: Partial<WifiData>) => void;
  setContact: (contact: Partial<ContactData>) => void;
  setSMS: (sms: Partial<SMSData>) => void;
  setLocation: (location: Partial<LocationData>) => void;
  setStyle: (style: Partial<QRStyleConfig>) => void;
  setQRDataUrl: (url: string) => void;
  setParseResult: (result: string) => void;
  setParseError: (error: string) => void;
  reset: () => void;
  resetCurrentMode: () => void;
  resetStyle: () => void;
}

const initialState: QRCodeState = {
  tab: 'generate',
  mode: 'text',
  text: '',
  wifi: DEFAULT_WIFI,
  contact: DEFAULT_CONTACT,
  sms: DEFAULT_SMS,
  location: DEFAULT_LOCATION,
  style: DEFAULT_STYLE,
  qrDataUrl: '',
  parseResult: '',
  parseError: '',
};

export const useQRCodeStore = create<QRCodeStore>()(
  persist(
    (set) => ({
      ...initialState,

      setTab: (tab) => set({ tab }),
      setMode: (mode) => set({ mode }),
      setText: (text) => set({ text }),

      setWifi: (wifi) =>
        set((state) => ({
          wifi: { ...state.wifi, ...wifi },
        })),

      setContact: (contact) =>
        set((state) => ({
          contact: { ...state.contact, ...contact },
        })),

      setSMS: (sms) =>
        set((state) => ({
          sms: { ...state.sms, ...sms },
        })),

      setLocation: (location) =>
        set((state) => ({
          location: { ...state.location, ...location },
        })),

      setStyle: (style) =>
        set((state) => ({
          style: { ...state.style, ...style },
        })),

      setQRDataUrl: (qrDataUrl) => set({ qrDataUrl }),
      setParseResult: (parseResult) => set({ parseResult, parseError: '' }),
      setParseError: (parseError) => set({ parseError, parseResult: '' }),

      reset: () => set(initialState),

      resetCurrentMode: () =>
        set((state) => {
          switch (state.mode) {
            case 'text':
              return { text: '', qrDataUrl: '' };
            case 'wifi':
              return { wifi: DEFAULT_WIFI, qrDataUrl: '' };
            case 'contact':
              return { contact: DEFAULT_CONTACT, qrDataUrl: '' };
            case 'sms':
              return { sms: DEFAULT_SMS, qrDataUrl: '' };
            case 'location':
              return { location: DEFAULT_LOCATION, qrDataUrl: '' };
            default:
              return { qrDataUrl: '' };
          }
        }),

      resetStyle: () => set({ style: DEFAULT_STYLE, qrDataUrl: '' }),
    }),
    {
      name: 'qiao-tools-x-persist-qrcode-tool',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tab: state.tab,
        mode: state.mode,
        text: state.text,
        wifi: state.wifi,
        contact: state.contact,
        sms: state.sms,
        location: state.location,
        style: state.style,
      }),
    },
  ),
);
