import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LogOut, Upload, DollarSign, Award, Users, Settings, ChevronRight, User, RefreshCw, BookOpen, Edit2, Plus, Camera } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { NoteCard } from '@/components/NoteCard';
import { EmptyState } from '@/components/EmptyState';
import { useAuthStore } from '@/store/auth-store';
import { useNotesStore } from '@/store/notes-store';
import { useFollowersStore } from '@/store/followers-store';
import { useEarningsStore } from '@/store/earnings-store';
import { EditProfileModal } from '@/components/EditProfileModal';
import { InterestsModal } from '@/components/InterestsModal';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateProfile, setInterests, setSubjects } = useAuthStore();
  const { uploadedNotes, fetchUploadedNotes } = useNotesStore();
  const { followers, following, fetchFollowers, fetchFollowing } = useFollowersStore();
  const { earnings, fetchEarnings } = useEarningsStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editLinkedIn, setEditLinkedIn] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editGitHub, setEditGitHub] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [isInterestsModalVisible, setIsInterestsModalVisible] = useState(false);
  
  useEffect(() => {
    // Only load data if authenticated
    if (isAuthenticated && user) {
      loadData();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditBio(user.bio || '');
      setEditTwitter(user.twitter_url || '');
      setEditLinkedIn(user.linkedin_url || '');
      setEditInstagram(user.instagram_url || '');
      setEditGitHub(user.github_url || '');
      setEditWebsite(user.website_url || '');
    }
  }, [user]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated && user) {
        loadData();
      }
    }, [isAuthenticated, user])
  );
  
  const loadData = async () => {
    if (user) {
      console.log('Loading data for user:', user.id);
      await Promise.all([
        fetchUploadedNotes(user.id),
        fetchEarnings(),
        fetchFollowers(user.id),
        fetchFollowing(user.id)
      ]);
      console.log('Current followers:', followers);
      console.log('Current following:', following);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  const handleLogout = () => {
    logout();
    // No need to navigate - the tab navigator will handle this
  };
  
  const handleManualRefresh = () => {
    Alert.alert(
      "Refresh Data",
      "Do you want to refresh your profile data?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Refresh",
          onPress: loadData
        }
      ]
    );
  };
  
  const handleUpdateInterests = async (interests: string[], subjects: string[]) => {
    try {
      await Promise.all([
        await setInterests(interests),
        await setSubjects(subjects)
      ]);
      // Refresh data after updating interests
      await loadData();
    } catch (error) {
      console.error('Failed to update interests:', error);
      Alert.alert('Error', 'Failed to update interests. Please try again.');
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: editName,
        bio: editBio,
        twitter_url: editTwitter,
        linkedin_url: editLinkedIn,
        instagram_url: editInstagram,
        github_url: editGitHub,
        website_url: editWebsite,
      });
      // Refresh data after updating profile
      await loadData();
      setIsEditModalVisible(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };
  
  // If not authenticated, show login prompt instead of redirecting
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.authPromptContainer}>
          <EmptyState
            title="Your Profile"
            description="Log in to access your profile, uploads, and earnings"
            icon={<User size={40} color={colors.textTertiary} />}
            actionLabel="Log In"
            onAction={() => router.push('/(auth)/login')}
            style={styles.emptyState}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <LogOut size={16} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.scrollView}
      >
        <View style={styles.header}>
          <View style={styles.coverPhoto}>
            <View style={styles.coverGradient} />
          </View>

          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {user.avatar_url ? (
                <Image 
                  source={{ uri: user.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.defaultAvatar]}>
                  <User size={50} color="#FFFFFF" />
                </View>
              )}
              <TouchableOpacity 
                style={styles.editAvatarButton}
                onPress={() => setIsEditModalVisible(true)}
              >
                <Camera size={16} color="#FFFFFF" style={{ opacity: 0.8 }} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileContent}>
              <View style={styles.nameSection}>
                <TouchableOpacity 
                  style={styles.nameButton}
                  onPress={() => setIsEditModalVisible(true)}
                >
                  <Text style={styles.displayName}>{user.name}</Text>
                  <Edit2 size={16} color="#FFFFFF" style={{ opacity: 0.8, marginLeft: 8 }} />
                </TouchableOpacity>
                <Text style={[styles.username, { color: '#CF9FFF' }]}>@{user.username}</Text>
                <TouchableOpacity 
                  style={styles.bioButton}
                  onPress={() => setIsEditModalVisible(true)}
                >
                  <View style={styles.bioHeader}>
                    <View style={styles.bioLabelContainer}>
                      <Text style={styles.bioLabel}>About Me</Text>
                      {user.bio ? (
                        <View style={styles.bioLengthIndicator}>
                          <Text style={styles.bioLengthText}>{user.bio.length}/500</Text>
                        </View>
                      ) : null}
                    </View>
                    <Edit2 size={16} color="#FFFFFF" style={{ opacity: 0.8 }} />
                  </View>
                  {user.bio ? (
                    <View style={styles.bioContent}>
                      <Text style={styles.bio} numberOfLines={3}>{user.bio}</Text>
                      <View style={styles.bioFooter}>
                        <TouchableOpacity 
                          style={styles.readMoreButton}
                          onPress={() => setIsEditModalVisible(true)}
                        >
                          <Text style={styles.readMoreText}>Read more</Text>
                          <ChevronRight size={14} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.emptyBioContent}>
                      <Text style={[styles.bio, styles.emptyBioText]}>Share something about yourself...</Text>
                      <View style={styles.addBioButton}>
                        <Text style={styles.addBioText}>Add Bio</Text>
                        <Plus size={14} color={colors.primary} />
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{followers.length}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{following.length}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{uploadedNotes.length}</Text>
                <Text style={styles.statLabel}>Notes</Text>
              </View>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryAction]}
                onPress={() => router.push('/(tabs)/stats')}
              >
                <DollarSign size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Statistics</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryAction]}
                onPress={() => setIsEditModalVisible(true)}
              >
                <Edit2 size={20} color="#2A2A3C" />
                <Text style={[styles.actionButtonText, { color: '#2A2A3C' }]}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuContainer}>
              <TouchableOpacity 
                style={styles.menuCard}
                onPress={() => setIsInterestsModalVisible(true)}
              >
                <View style={styles.menuHeader}>
                  <View style={[styles.menuIconContainer, { backgroundColor: colors.primary }]}>
                    <BookOpen size={20} color={colors.white} />
                  </View>
                  <View>
                    <Text style={styles.menuTitle}>Interests</Text>
                    <Text style={styles.menuSubtext}>
                      {user.interests?.length || 0} subjects selected
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.socialLinks}>
                <Text style={styles.sectionTitle}>Social Links</Text>
                {user.twitter_url && (
                  <TouchableOpacity 
                    style={styles.socialLink}
                    onPress={() => Linking.openURL(user.twitter_url!)}
                  >
                    <View style={[styles.socialIconContainer, { backgroundColor: '#1DA1F2' }]}>
                      <Twitter size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.socialLinkText}>Twitter</Text>
                  </TouchableOpacity>
                )}
                {user.linkedin_url && (
                  <TouchableOpacity 
                    style={styles.socialLink}
                    onPress={() => Linking.openURL(user.linkedin_url!)}
                  >
                    <View style={[styles.socialIconContainer, { backgroundColor: '#0A66C2' }]}>
                      <Linkedin size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.socialLinkText}>LinkedIn</Text>
                  </TouchableOpacity>
                )}
                {user.instagram_url && (
                  <TouchableOpacity 
                    style={styles.socialLink}
                    onPress={() => Linking.openURL(user.instagram_url!)}
                  >
                    <View style={[styles.socialIconContainer, { backgroundColor: '#E4405F' }]}>
                      <Instagram size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.socialLinkText}>Instagram</Text>
                  </TouchableOpacity>
                )}
                {user.github_url && (
                  <TouchableOpacity 
                    style={styles.socialLink}
                    onPress={() => Linking.openURL(user.github_url!)}
                  >
                    <View style={[styles.socialIconContainer, { backgroundColor: '#333333' }]}>
                      <Github size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.socialLinkText}>GitHub</Text>
                  </TouchableOpacity>
                )}
                {user.website_url && (
                  <TouchableOpacity 
                    style={styles.socialLink}
                    onPress={() => Linking.openURL(user.website_url!)}
                  >
                    <View style={[styles.socialIconContainer, { backgroundColor: '#4CAF50' }]}>
                      <Globe size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.socialLinkText}>Website</Text>
                  </TouchableOpacity>
                )}
              </View>

              {user.is_verified && (
                <TouchableOpacity style={styles.menuCard}>
                  <View style={styles.menuHeader}>
                    <View style={[styles.menuIconContainer, { backgroundColor: colors.warning }]}>
                      <Award size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.menuTitle}>Verified Creator</Text>
                  </View>
                  <Text style={styles.menuSubtext}>{user.verification_reason || 'Trusted content creator'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Notes</Text>
            <TouchableOpacity 
              style={styles.sectionAction}
              onPress={() => router.push('/upload')}
            >
              <Text style={styles.sectionActionText}>Upload New</Text>
              <Upload size={16} color={colors.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
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
              description="You haven't uploaded any study notes yet. Start sharing your knowledge!"
              actionLabel="Upload First Note"
              onAction={() => router.push('/upload')}
            />
          )}
        </View>
      </ScrollView>

      <EditProfileModal
        isVisible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        currentBio={user.bio}
        currentAvatar={user.avatar_url}
        currentUsername={user.username}
        currentName={user.name}
        currentTwitter={user.twitter_url}
        currentLinkedIn={user.linkedin_url}
        currentInstagram={user.instagram_url}
        currentGitHub={user.github_url}
        currentWebsite={user.website_url}
        onUpdate={onRefresh}
      />
      
      <InterestsModal
        visible={isInterestsModalVisible}
        onClose={() => setIsInterestsModalVisible(false)}
        onSave={handleUpdateInterests}
        initialInterests={user?.interests}
        initialSubjects={user?.subjects}
      />
    </SafeAreaView>
  );
}

import { Linking } from 'react-native';
import { Twitter, Linkedin, Instagram, Github, Globe } from 'lucide-react-native';

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    padding: 16,
  },
  authPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyState: {
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: '#1E1E2E',
  },
  scrollView: {
    flex: 1,
    paddingBottom: 80, // Add extra padding for tab bar
  },
  header: {
    position: 'relative',
    backgroundColor: '#2A2A3C',
  },
  coverPhoto: {
    height: 120,
    backgroundColor: '#8B5CF6',
    opacity: 0.3,
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
  defaultAvatar: {
    backgroundColor: '#2A2A3C',
    justifyContent: 'center',
    alignItems: 'center',
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
  nameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  editNameIcon: {
    marginLeft: 8,
    opacity: 0.7,
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
    marginBottom: 8,
  },
  addBioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addBioText: {
    fontSize: 14,
    color: colors.primary,
    marginRight: 6,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2A2A3C',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
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
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 1,
    justifyContent: 'center',
  },
  primaryAction: {
    backgroundColor: '#4CAF50',
  },
  secondaryAction: {
    backgroundColor: '#FFFFFF',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  menuContainer: {
    gap: 12,
    marginBottom: 24,
  },
  menuCard: {
    backgroundColor: '#2A2A3C',
    borderRadius: 16,
    padding: 16,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  menuSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
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
  socialLinks: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  socialIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  socialLinkText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '600',
  },
});