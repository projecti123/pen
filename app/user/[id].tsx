import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, RefreshControl, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useNotesStore } from '@/store/notes-store';
import { useFollowingStore } from '@/store/following-store';
import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/constants/colors';
import { NoteCard } from '@/components/NoteCard';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Users, BookOpen, Edit2, ChevronRight, Award, Upload, RefreshCw, Twitter, Linkedin, Instagram, Github, Globe } from 'lucide-react-native';
import { EditProfileModal } from '@/components/EditProfileModal';
import { supabase } from '@/lib/supabase';

export default function UserProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { uploadedNotes, fetchUploadedNotes } = useNotesStore();
  const { user } = useAuthStore();
  const { followingUsers, toggleFollow, isFollowing } = useFollowingStore();
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);

  console.log('Current user:', user?.id);
  console.log('URL id:', id);
  console.log('Is own profile:', user?.id === id);

  useEffect(() => {
    if (id) {
      loadData();
      fetchProfile();
    }
  }, [id]);

  const loadData = async () => {
    if (id) {
      await fetchUploadedNotes(id as string);
    }
  };

  const fetchProfile = async () => {
    if (id) {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          bio,
          username,
          avatar_url,
          is_verified,
          verification_reason,
          email,
          twitter_url,
          linkedin_url,
          instagram_url,
          github_url,
          website_url
        `)
        .eq('id', id)
        .single();
      
      if (!error && data) {
        setProfile(data);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await fetchProfile();
    setRefreshing(false);
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="User Not Found"
          description="This user may not exist"
          icon={<Users size={40} color={colors.textTertiary} />}
        />
      </SafeAreaView>
    );
  }

  const isOwnProfile = user?.id === id;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.header}>
          <View style={styles.coverPhoto}>
            <View style={styles.coverGradient} />
          </View>

          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: profile?.avatar_url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36' }} 
                style={styles.avatar} 
              />
              {isOwnProfile && (
                <TouchableOpacity 
                  style={styles.editAvatarButton}
                  onPress={() => setIsEditModalVisible(true)}
                >
                  <Edit2 size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.profileContent}>
              <View style={styles.nameSection}>
                <View style={styles.nameContainer}>
                  <Text style={styles.displayName}>{profile?.name || 'Loading...'}</Text>
                  {profile.is_verified && (
                    <View style={styles.verifiedBadge}>
                      <Award size={16} color={colors.warning} />
                    </View>
                  )}
                </View>
                <Text style={[styles.username, { color: colors.error }]}>@{profile.username}</Text>
                <View style={styles.bioButton}>
                  <View style={styles.bioHeader}>
                    <View style={styles.bioLabelContainer}>
                      <Text style={styles.bioLabel}>About</Text>
                      {profile.bio ? (
                        <View style={styles.bioLengthIndicator}>
                          <Text style={styles.bioLengthText}>{profile.bio.length} chars</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  {profile.bio ? (
                    <View style={styles.bioContent}>
                      <Text style={styles.bio} numberOfLines={3}>{profile.bio}</Text>
                      {profile.bio.length > 150 && (
                        <View style={styles.bioFooter}>
                          <View style={styles.readMoreButton}>
                            <Text style={styles.readMoreText}>Read more</Text>
                            <ChevronRight size={14} color={colors.primary} />
                          </View>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.emptyBioContent}>
                      <Text style={[styles.bio, styles.emptyBioText]}>No bio added yet</Text>
                    </View>
                  )}
                </View>
              </View>

              {!isOwnProfile && (
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    isFollowing(id as string) && styles.followingButton
                  ]}
                  onPress={() => toggleFollow(id as string)}
                >
                  <Text style={[
                    styles.followButtonText,
                    isFollowing(id as string) && styles.followingButtonText
                  ]}>
                    {isFollowing(id as string) ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.statsContainer}>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statValue}>{followers.length}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              
              <View style={styles.statDivider} />
              
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statValue}>{following.length}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
              
              <View style={styles.statDivider} />
              
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statValue}>{uploadedNotes.length}</Text>
                <Text style={styles.statLabel}>Notes</Text>
              </TouchableOpacity>
            </View>

            {(profile.twitter_url || profile.linkedin_url || profile.instagram_url || profile.github_url || profile.website_url) && (
              <View style={styles.socialLinksContainer}>
                <Text style={styles.socialLinksTitle}>Connect with {profile.name.split(' ')[0]}</Text>
                <View style={styles.socialLinks}>
                  {profile.twitter_url && (
                    <TouchableOpacity 
                      style={styles.socialButton}
                      onPress={() => Linking.openURL(profile.twitter_url)}
                    >
                      <Twitter size={20} color={colors.primary} />
                      <Text style={styles.socialButtonText}>Twitter</Text>
                    </TouchableOpacity>
                  )}
                  {profile.linkedin_url && (
                    <TouchableOpacity 
                      style={styles.socialButton}
                      onPress={() => Linking.openURL(profile.linkedin_url)}
                    >
                      <Linkedin size={20} color={colors.primary} />
                      <Text style={styles.socialButtonText}>LinkedIn</Text>
                    </TouchableOpacity>
                  )}
                  {profile.instagram_url && (
                    <TouchableOpacity 
                      style={styles.socialButton}
                      onPress={() => Linking.openURL(profile.instagram_url)}
                    >
                      <Instagram size={20} color={colors.primary} />
                      <Text style={styles.socialButtonText}>Instagram</Text>
                    </TouchableOpacity>
                  )}
                  {profile.github_url && (
                    <TouchableOpacity 
                      style={styles.socialButton}
                      onPress={() => Linking.openURL(profile.github_url)}
                    >
                      <Github size={20} color={colors.primary} />
                      <Text style={styles.socialButtonText}>GitHub</Text>
                    </TouchableOpacity>
                  )}
                  {profile.website_url && (
                    <TouchableOpacity 
                      style={styles.socialButton}
                      onPress={() => Linking.openURL(profile.website_url)}
                    >
                      <Globe size={20} color={colors.primary} />
                      <Text style={styles.socialButtonText}>Website</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>

          {isOwnProfile && (
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryAction]}
                onPress={() => router.push('/upload')}
              >
                <Upload size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>New Note</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryAction]}
                onPress={() => setIsEditModalVisible(true)}
              >
                <Edit2 size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Study Notes</Text>
            {isOwnProfile && (
              <TouchableOpacity 
                style={styles.sectionAction}
                onPress={() => router.push('/upload')}
              >
                <Text style={styles.sectionActionText}>Upload New</Text>
                <Upload size={16} color={colors.primary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
          </View>

          {uploadedNotes.length > 0 ? (
            <View style={styles.notesGrid}>
              {uploadedNotes.map(note => (
                <NoteCard key={note.id} note={note} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<BookOpen size={40} color={colors.textTertiary} />}
              title="No Notes Yet"
              description={isOwnProfile ? 
                "You haven't uploaded any study notes yet. Start sharing your knowledge!" :
                "This user hasn't uploaded any study notes yet."}
              actionLabel={isOwnProfile ? "Upload First Note" : undefined}
              onAction={isOwnProfile ? () => router.push('/upload') : undefined}
            />
          )}
        </View>
      </ScrollView>

      <EditProfileModal
        isVisible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        currentBio={profile?.bio}
        currentAvatar={profile?.avatar_url}
        currentUsername={profile?.username}
        onUpdate={loadData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  socialLinksContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    width: '100%',
  },
  socialLinksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  socialLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 120,
  },
  socialButtonText: {
    marginLeft: 8,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 80, // Add extra padding for tab bar
  },
  scrollView: {
    flex: 1,
  },
  header: {
    position: 'relative',
  },
  coverPhoto: {
    height: 120,
    backgroundColor: colors.primary,
    opacity: 0.9,
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: colors.background,
    opacity: 0.9,
  },
  profileSection: {
    marginTop: -50,
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
    alignSelf: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.background,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  bioLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  bio: {
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  bioButton: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bioLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bioLengthIndicator: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  bioLengthText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bioContent: {
    marginTop: 4,
  },
  bioFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  readMoreText: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 4,
  },
  emptyBioContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyBioText: {
    fontStyle: 'italic',
    color: colors.textTertiary,
  },
  followButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  followButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  followingButtonText: {
    color: colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryAction: {
    backgroundColor: colors.primary,
  },
  secondaryAction: {
    backgroundColor: colors.success,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  sectionActionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
});
