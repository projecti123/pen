import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAdMob } from '@/hooks/useAdMob';

export function AdBanner() {
  const { showBannerAd } = useAdMob();
  const adElement = showBannerAd();

  if (!adElement) return null;

  return (
    <View style={styles.container}>
      {adElement}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
});
