import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MessageSquare, Bookmark, BookmarkCheck, ThumbsDown, UserPlus, UserCheck, Award } from 'lucide-react-native';
import { Note } from '@/types';
import { colors } from '@/constants/colors';
import { useNotesStore } from '@/store/notes-store';
import { useFollowingStore } from '@/store/following-store';
import { useAuthStore } from '@/store/auth-store';
import { NoteDownloadButton } from './NoteDownloadButton';

interface NoteCardProps {
  note: Note;
  compact?: boolean;
  showVerificationTooltip?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, compact = false, showVerificationTooltip = false }) => {
  const router = useRouter();
  const { toggleBookmark, toggleLike, toggleDislike } = useNotesStore();
  const { user } = useAuthStore();
  
  console.log('Note data in NoteCard:', {
    noteId: note?.id,
    uploaderId: note?.uploaderId,
    uploaderName: note?.uploaderName,
    currentUserId: user?.id
  });
  // Only validate required fields
  if (!note) {
    console.error('No note data provided');
    return null;
  }

  const { 
    isFollowing, 
    toggleFollow, 
    followingIds,
    fetchFollowingIds 
  } = useFollowingStore();

  useEffect(() => {
    if (user) {
      fetchFollowingIds();
    }
  }, [user]);
  
  const handlePress = () => {
    router.push(`/note/${note.id}`);
  };
  
  const handleBookmark = (e: any) => {
    e.stopPropagation();
    toggleBookmark(note.id);
  };
  
  const handleLike = (e: any) => {
    e.stopPropagation();
    toggleLike(note.id);
  };

  const handleDislike = (e: any) => {
    e.stopPropagation();
    toggleDislike(note.id);
  };
  
  if (compact) {
    return (
      <TouchableOpacity 
        style={styles.compactContainer} 
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: note.thumbnailUrl }} 
          style={styles.compactThumbnail} 
        />
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={2}>{note.title}</Text>
          <Text style={styles.compactSubject}>{note.subject}</Text>
          <View style={styles.compactStats}>
            <View style={styles.statItem}>
              <Heart size={14} color={note.isLiked ? colors.error : colors.textTertiary} />
              <Text style={styles.statText}>{note.likes}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statText}>{note.downloads} downloads</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: note.thumbnailUrl }} 
        style={styles.thumbnail} 
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>{note.title}</Text>
          <TouchableOpacity onPress={handleBookmark} style={styles.bookmarkButton}>
            {note.isBookmarked ? (
              <BookmarkCheck size={20} color={colors.primary} />
            ) : (
              <Bookmark size={20} color={colors.textTertiary} />
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.description} numberOfLines={2}>{note.description}</Text>
        
        <View style={styles.metaContainer}>
          <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>{note.subject}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.secondaryLight }]}>
            <Text style={[styles.badgeText, { color: colors.secondary }]}>{note.class}</Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.uploaderInfo}>
            <TouchableOpacity 
              style={styles.uploaderButton}
              onPress={() => router.push({ pathname: '/profile', params: { id: note.uploaderId } })}
            >
              <Image 
                source={{ uri: note.uploaderAvatar || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36' }} 
                style={styles.avatar} 
              />
              <View style={styles.uploaderNameContainer}>
          <Text style={styles.uploaderName}>{note.uploaderName}</Text>
          {note.uploaderIsVerified && (
            <TouchableOpacity 
              onPress={() => showVerificationTooltip && alert(note.uploaderVerificationReason || 'Verified Creator')}
              disabled={!showVerificationTooltip}
            >
              <Award size={14} color={colors.primary} style={styles.verificationBadge} />
            </TouchableOpacity>
          )}
        </View>
            </TouchableOpacity>
            {/* Show follow button if we have a logged-in user and they're not the note uploader */}
            {user?.id && note?.uploaderId && user.id !== note.uploaderId && (
              /* Show follow button only if we have both a logged-in user and a valid uploader ID */
              <TouchableOpacity 
                style={[styles.followButton, isFollowing(note.uploaderId) && styles.followingButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  const uploaderId = note.uploaderId;
                  if (!uploaderId) {
                    console.error('No uploader ID available for note:', note.id);
                    return;
                  }
                  console.log('Toggling follow for user:', note.uploaderId);
                  toggleFollow(note.uploaderId);
                }}
              >
                {isFollowing(note.uploaderId) ? (
                  <>
                    <UserCheck size={14} color={colors.primary} />
                    <Text style={[styles.followButtonText, styles.followingButtonText]}>Following</Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={14} color="#FFFFFF" />
                    <Text style={styles.followButtonText}>Follow</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.stats}>
            <TouchableOpacity style={styles.statItem} onPress={handleLike}>
              <Heart size={16} color={note.isLiked ? colors.error : colors.textTertiary} fill={note.isLiked ? colors.error : 'transparent'} />
              <Text style={styles.statText}>{note.likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statItem} onPress={handleDislike}>
              <ThumbsDown 
                size={16} 
                color={note.isDisliked ? colors.error : colors.textTertiary} 
                fill={note.isDisliked ? colors.error : 'transparent'}
              />
            </TouchableOpacity>
            
            <View style={styles.downloadButton}>
              <NoteDownloadButton
                noteId={note.id}
                noteName={note.title}
                fileUrl={note.fileUrl}
                creatorId={note.uploaderId}
              />
            </View>
            
            <View style={styles.statItem}>
              <MessageSquare size={16} color={colors.textTertiary} />
              <Text style={styles.statText}>{note.comments}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  uploaderNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationBadge: {
    marginLeft: 4,
  },
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  thumbnail: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  bookmarkButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  uploaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  uploaderName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  followingButton: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  followingButtonText: {
    color: colors.primary,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  downloadButton: {
    marginLeft: 16,
  },
  statText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  compactThumbnail: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
  },
  compactContent: {
    flex: 1,
    padding: 12,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  compactSubject: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  compactStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});