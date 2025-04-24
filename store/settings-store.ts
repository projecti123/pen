import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  autoDownload: boolean;
  admobEnabled: boolean;
  bannerAdsEnabled: boolean;
  rewardedAdsEnabled: boolean;
  interstitialAdsEnabled: boolean;
  admobBannerId: string;
  admobRewardedId: string;
  admobInterstitialId: string;
  bannerRefreshRate: string;
  rewardedInterval: string;
  interstitialFrequency: string;
}

interface SettingsState {
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  theme: 'system',
  language: 'en',
  notifications: true,
  autoDownload: false,
  admobEnabled: true,
  bannerAdsEnabled: true,
  rewardedAdsEnabled: true,
  interstitialAdsEnabled: true,
  admobBannerId: __DEV__ 
    ? 'ca-app-pub-3940256099942544/6300978111'  // Test banner ID
    : process.env.NEXT_PUBLIC_ADMOB_BANNER_ID || '',  // Set this in your .env file
  admobRewardedId: __DEV__
    ? 'ca-app-pub-3940256099942544/5224354917'  // Test rewarded ID
    : process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID || '',  // Set this in your .env file
  admobInterstitialId: __DEV__
    ? 'ca-app-pub-3940256099942544/1033173712'  // Test interstitial ID
    : process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID || '',  // Set this in your .env file
  bannerRefreshRate: '60',
  rewardedInterval: '300',
  interstitialFrequency: '5',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (newSettings: Partial<Settings>) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'settings-storage',
      storage: {
        getItem: async (name: string) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name: string, value: any) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name: string) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);
