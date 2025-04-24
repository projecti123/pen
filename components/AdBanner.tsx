import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { supabase } from '@/lib/supabase';

interface AdBannerProps {
  position?: 'top' | 'bottom';
  size?: BannerAdSize;
  noteId?: string;
  creatorId?: string;
  sticky?: boolean;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  position = 'top',
  size = BannerAdSize.BANNER,
  noteId,
  creatorId,
  sticky = true,
}) => {
  // Replace with your actual AdMob ID in production
  const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-XXXXX/YYYYY';

  const handleAdImpression = async () => {
    if (noteId && creatorId) {
      try {
        // First get current values
        const { data: noteData } = await supabase
          .from('notes')
          .select('views, earnings')
          .eq('id', noteId)
          .single();

        const { data: creatorData } = await supabase
          .from('creator_profiles')
          .select('total_earnings')
          .eq('id', creatorId)
          .single();

        if (noteData) {
          // Update note views and earnings
          await supabase
            .from('notes')
            .update({ 
              views: (noteData.views || 0) + 1,
              earnings: (noteData.earnings || 0) + 0.001 // $0.001 per view
            })
            .eq('id', noteId);
        }

        // Update creator earnings history
        await supabase
          .from('creator_earnings_history')
          .insert({
            creator_id: creatorId,
            amount: 0.001,
            type: 'ad_revenue'
          });

        if (creatorData) {
          // Update creator total earnings
          await supabase
            .from('creator_profiles')
            .update({ 
              total_earnings: (creatorData.total_earnings || 0) + 0.001
            })
            .eq('id', creatorId);
        }
      } catch (error) {
        console.error('Error updating ad stats:', error);
      }
    }
  };

  return (
    <View style={[
      styles.container, 
      styles[position],
      sticky && styles.sticky,
      !sticky && styles.relative
    ]}>
      <BannerAd
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onPaid={handleAdImpression}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  sticky: {
    position: 'absolute',
  },
  relative: {
    position: 'relative',
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: 0,
  },
});
