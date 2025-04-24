import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useAds } from '@/hooks/useAds';
import { Ad } from '@/types/ads';
import { colors } from '@/constants/colors';

interface CustomBannerAdProps {
  subject?: string;
  className?: string;
  style?: any;
}

export const CustomBannerAd: React.FC<CustomBannerAdProps> = ({
  subject,
  className,
  style
}) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const { fetchAd, recordImpression } = useAds();

  useEffect(() => {
    loadAd();
  }, [subject, className]);

  const loadAd = async () => {
    try {
      const newAd = await fetchAd('banner', subject, className);
      if (newAd) {
        setAd(newAd);
        await recordImpression(newAd, 'view');
      }
    } catch (error) {
      console.error('Error loading banner ad:', error);
    }
  };

  const handlePress = async () => {
    if (!ad?.target_url) return;
    
    try {
      await recordImpression(ad, 'click');
      await Linking.openURL(ad.target_url);
    } catch (error) {
      console.error('Error opening ad URL:', error);
    }
  };

  if (!ad) return null;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {ad.image_url ? (
        <Image
          source={{ uri: ad.image_url }}
          style={styles.image}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.textContainer}>
          <Text style={styles.title}>{ad.title}</Text>
          {ad.description && (
            <Text style={styles.description} numberOfLines={2}>
              {ad.description}
            </Text>
          )}
        </View>
      )}
      <Text style={styles.sponsored}>Sponsored</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 90,
    backgroundColor: colors.background,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: '100%',
    minHeight: 90,
  },
  textContainer: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sponsored: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    fontSize: 10,
    color: colors.textSecondary,
    opacity: 0.7,
  },
});
