import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useAds } from '@/hooks/useAds';
import { Ad } from '@/types/ads';
import { colors } from '@/constants/colors';
import { X } from 'lucide-react-native';

interface CustomInterstitialAdProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
  subject?: string;
  className?: string;
}

export const CustomInterstitialAd: React.FC<CustomInterstitialAdProps> = ({
  visible,
  onClose,
  onComplete,
  subject,
  className
}) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const { fetchAd, recordImpression } = useAds();
  const [hasRecordedView, setHasRecordedView] = useState(false);

  useEffect(() => {
    if (visible) {
      loadAd();
    } else {
      setAd(null);
      setHasRecordedView(false);
    }
  }, [visible, subject, className]);

  useEffect(() => {
    if (visible && ad && !hasRecordedView) {
      recordImpression(ad, 'view');
      setHasRecordedView(true);
    }
  }, [visible, ad, hasRecordedView]);

  const loadAd = async () => {
    try {
      const newAd = await fetchAd('interstitial', subject, className);
      if (newAd) {
        setAd(newAd);
      }
    } catch (error) {
      console.error('Error loading interstitial ad:', error);
      onClose();
    }
  };

  const handlePress = async () => {
    if (!ad?.target_url) return;
    
    try {
      await recordImpression(ad, 'click');
      if (onComplete) {
        onComplete();
      }
      onClose();
    } catch (error) {
      console.error('Error handling ad click:', error);
      onClose();
    }
  };

  if (!visible || !ad) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.adContainer}
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
                  <Text style={styles.description} numberOfLines={3}>
                    {ad.description}
                  </Text>
                )}
              </View>
            )}
            <Text style={styles.sponsored}>Sponsored</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  adContainer: {
    width: '100%',
    aspectRatio: 1.5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sponsored: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 12,
    color: colors.textSecondary,
    opacity: 0.7,
  },
});
