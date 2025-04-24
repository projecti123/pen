import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd as RNBannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__ 
  ? TestIds.BANNER 
  : Platform.select({
      ios: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy',
      android: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy',
    });

interface BannerAdProps {
  size?: BannerAdSize;
  style?: any;
}

export const BannerAd: React.FC<BannerAdProps> = ({ 
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
  style 
}) => {
  return (
    <View style={[styles.container, style]}>
      <RNBannerAd
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
