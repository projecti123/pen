import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useFollowingStore } from '@/store/following-store';
import { colors } from '@/constants/colors';
import { EmptyState } from '@/components/EmptyState';
import { Users } from 'lucide-react-native';

export default function SocialScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();
  const { followingCount, followersCount, followingUsers, fetchFollowingCount, fetchFollowersCount, fetchFollowingIds, toggleFollow, isFollowing } = useFollowingStore();
  console.log('Following users:', followingUsers);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (user) {
      console.log('Loading data for user:', user.id);
      await Promise.all([
        fetchFollowersCount(user.id),
        fetchFollowingCount(user.id),
        fetchFollowingIds()
      ]);
      console.log('Data loaded');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => router.push(`/user/${item.id}`)}
    >
      <View style={styles.userInfo}>
        <Image 
          source={{ uri: item.avatar || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36' }}
          style={styles.avatar}
        />
        <View style={styles.userTextContainer}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>@{item.username}</Text>
        </View>
      </View>
      
      {user?.id !== item.id && (
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing(item.id) && styles.followingButton
          ]}
          onPress={() => toggleFollow(item.id)}
        >
          <Text style={[
            styles.followButtonText,
            isFollowing(item.id) && styles.followingButtonText
          ]}>
            {isFollowing(item.id) ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Social"
          description="Log in to connect with other students"
          icon={<Users size={40} color={colors.textTertiary} />}
          actionLabel="Log In"
          onAction={() => router.push('/(auth)/login')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
            Followers
          </Text>
          <Text style={styles.count}>{followersCount}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            Following
          </Text>
          <Text style={styles.count}>{followingCount}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'followers' ? [] : followingUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            title={activeTab === 'followers' ? 'No followers yet' : 'Not following anyone'}
            description={activeTab === 'followers' 
              ? 'Share your notes to gain followers'
              : 'Follow other students to see their updates'}
            icon={<Users size={40} color={colors.textTertiary} />}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 80, // Add extra padding for tab bar
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginRight: 8,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  count: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  listContent: {
    padding: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  followingButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: colors.primary,
  },
});
