import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { User } from '@/types';
import { colors } from '@/constants/colors';
import { User as UserIcon, Twitter, Linkedin, Instagram, Github, Globe } from 'lucide-react-native';

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  const router = useRouter();

  const navigateToProfile = () => {
    router.push(`/user/${user.id}`);
  };

  const openLink = (url: string) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.container} onPress={navigateToProfile}>
        <View style={styles.avatarContainer}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <UserIcon size={24} color={colors.textSecondary} />
            </View>
          )}
        </View>
        <View style={styles.content}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          {user.bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {user.bio}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {(user.twitter_url || user.linkedin_url || user.instagram_url || user.github_url || user.website_url) && (
        <View style={styles.socialLinks}>
          {user.twitter_url && (
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => openLink(user.twitter_url!)}
            >
              <Twitter size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
          {user.linkedin_url && (
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => openLink(user.linkedin_url!)}
            >
              <Linkedin size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
          {user.instagram_url && (
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => openLink(user.instagram_url!)}
            >
              <Instagram size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
          {user.github_url && (
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => openLink(user.github_url!)}
            >
              <Github size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
          {user.website_url && (
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => openLink(user.website_url!)}
            >
              <Globe size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    padding: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultAvatar: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  socialLinks: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 16,
  },
  socialButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
});
