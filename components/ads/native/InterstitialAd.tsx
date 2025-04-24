import { Platform } from 'react-native';
import { InterstitialAd as RNInterstitialAd, TestIds, AdEventType } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.select({
      ios: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy',
      android: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy',
    });

class InterstitialAdManager {
  private static instance: InterstitialAdManager;
  private interstitialAd: RNInterstitialAd | null = null;
  private isLoading = false;

  private constructor() {
    this.loadAd();
  }

  static getInstance(): InterstitialAdManager {
    if (!InterstitialAdManager.instance) {
      InterstitialAdManager.instance = new InterstitialAdManager();
    }
    return InterstitialAdManager.instance;
  }

  private loadAd() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.interstitialAd = RNInterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    this.interstitialAd.load();
    
    this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      this.isLoading = false;
    });

    this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      this.interstitialAd = null;
      this.loadAd();
    });
  }

  async showAd(): Promise<boolean> {
    if (!this.interstitialAd) {
      this.loadAd();
      return false;
    }

    if (await this.interstitialAd.isLoaded()) {
      await this.interstitialAd.show();
      return true;
    }

    return false;
  }
}

export const InterstitialAd = InterstitialAdManager.getInstance();
