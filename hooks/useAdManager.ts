import { useCallback, useRef } from 'react';
import { InterstitialAd } from '../components/ads/native/InterstitialAd';

export const useAdManager = () => {
  const pageCountRef = useRef(0);

  const checkAndShowAd = useCallback(async () => {
    pageCountRef.current += 1;
    
    // Show an ad every 3 pages
    if (pageCountRef.current % 3 === 0) {
      await InterstitialAd.showAd();
    }
  }, []);

  return {
    checkAndShowAd,
  };
};
