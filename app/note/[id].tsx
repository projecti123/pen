import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Platform, Dimensions, Alert, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Heart, Download, MessageSquare, Bookmark, BookmarkCheck, Share2, ArrowLeft, FileText, Maximize2, Minimize2, Trash2, ThumbsDown, Search, ChevronUp, ChevronDown, Plus, Minus, ArrowRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { CustomBannerAd } from '@/components/ads/CustomBannerAd';
import { CustomInterstitialAd } from '@/components/ads/CustomInterstitialAd';
import { AdModal } from '@/components/AdModal';
import { NoteDownloadButton } from '@/components/NoteDownloadButton';
import { useNotesStore } from '@/store/notes-store';
import { useFollowersStore } from '@/store/followers-store';
import { supabase } from '@/lib/supabase';
import { Note } from '@/types';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { toggleBookmark, toggleLike, toggleDislike, deleteNote } = useNotesStore();
  const { followUser, unfollowUser, following } = useFollowersStore();
  const [session, setSession] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const [note, setNote] = useState<Note | null>(null);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [pageChangeCount, setPageChangeCount] = useState(0);
  const [showPageChangeAd, setShowPageChangeAd] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  const isOwner = note?.uploaderId === session?.user?.id;

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: userSession } } = await supabase.auth.getSession();
      setSession(userSession);
    };
    getSession();
  }, []);
  
  useEffect(() => {
    if (id) {
      fetchNote();
    }
  }, [id]);

  useEffect(() => {
    if (note?.uploaderId && following) {
      setIsFollowing(following.some(f => f.id === note.uploaderId));
    }
  }, [note, following]);
  
  useEffect(() => {
    // Show interstitial ad every 3 page changes
    if (pageChangeCount > 0 && pageChangeCount % 3 === 0) {
      setShowPageChangeAd(true);
    }
  }, [pageChangeCount]);

  const fetchNote = async () => {
    try {
      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .select(`
          *,
          uploader:uploader_id (
            id,
            name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();
        
      if (noteError) {
        if (noteError.code === 'PGRST116') {
          // Note was not found (likely deleted)
          router.replace('/(tabs)');
          return;
        }
        throw noteError;
      }
      
      // Get user's reaction to this note
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      
      let isLiked = false;
      let isDisliked = false;
      
      if (userId) {
        const { data: reaction } = await supabase
          .from('note_reactions')
          .select('reaction_type')
          .eq('user_id', userId)
          .eq('note_id', id)
          .single();
          
        if (reaction) {
          isLiked = reaction.reaction_type === 'like';
          isDisliked = reaction.reaction_type === 'dislike';
        }
      }
      
      if (noteData) {
        // Transform the data to match our Note type
        const transformedNote: Note = {
          id: noteData.id,
          title: noteData.title,
          description: noteData.description,
          subject: noteData.subject,
          class: noteData.class,
          board: noteData.board,
          topic: noteData.topic,
          fileType: noteData.file_type,
          fileUrl: noteData.file_url,
          thumbnailUrl: noteData.thumbnail_url,
          uploaderId: noteData.uploader_id,
          uploaderName: noteData.uploader?.name || 'Unknown',
          uploaderAvatar: noteData.uploader?.avatar_url,
          likes: noteData.likes || 0,
          downloads: noteData.downloads || 0,
          comments: noteData.comments || 0,
          views: noteData.views || 0,
          adClicks: noteData.ad_clicks || 0,
          earnings: noteData.earnings || 0,
          isLiked,
          isDisliked,
          isBookmarked: false,
          createdAt: noteData.created_at
        };
        setNote(transformedNote);
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = async () => {
    if (!note?.fileUrl) return;
    
    try {
      setIsDownloading(true);
      
      // On web, open in new tab
      if (Platform.OS === 'web') {
        window.open(note.fileUrl, '_blank');
      } else {
        // On mobile, open with system viewer
        const supported = await Linking.canOpenURL(note.fileUrl);
        if (supported) {
          await Linking.openURL(note.fileUrl);
        } else {
          throw new Error('Cannot open URL');
        }
      }
      
      // Update download count
      const { error } = await supabase
        .from('notes')
        .update({ downloads: (note.downloads || 0) + 1 })
        .eq('id', note.id);
        
      if (error) throw error;
      
      setNote(prev => prev ? { ...prev, downloads: (prev.downloads || 0) + 1 } : null);
    } catch (error) {
      console.error('Error opening file:', error);
    } finally {
      setIsDownloading(false);
      setShowAdModal(false);
    }
  };
  
  const handleAdComplete = async () => {
    setIsDownloading(true);
    
    // Simulate download
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsDownloading(false);
    
    // Update download count (would be handled by the store in a real app)
    if (note) {
      setNote({
        ...note,
        downloads: note.downloads + 1
      });
    }
  };
  
  const handleBookmark = () => {
    if (note) {
      toggleBookmark(note.id);
    }
  };
  
  const handleLike = async () => {
    if (!session) {
      router.push('/login');
      return;
    }
    await toggleLike(id);
  };

  const handleDislike = async () => {
    if (!session) {
      router.push('/login');
      return;
    }
    await toggleDislike(id);
    setIsDisliked(!isDisliked);
  };

  const handleDelete = async () => {
    console.log('Delete button clicked');
    console.log('Current note:', note);
    console.log('Current session:', session);
    console.log('Is owner?', isOwner);

    if (!note) {
      console.log('No note to delete');
      return;
    }

    if (!session?.user) {
      console.log('No user session');
      Alert.alert('Error', 'You must be logged in to delete notes.');
      return;
    }

    if (!isOwner) {
      console.log('User is not the owner');
      Alert.alert('Error', 'You can only delete your own notes.');
      return;
    }

    // Use Platform-specific alert
    if (Platform.OS === 'web') {
      console.log('Showing web confirmation');
      if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
        try {
          console.log('Starting delete process...');
          setIsDeleting(true);
          console.log('Calling deleteNote with ID:', note.id);
          await deleteNote(note.id);
          console.log('Note deleted successfully');
          router.back();
        } catch (error) {
          console.error('Failed to delete note:', error);
          alert('Failed to delete note. Please try again.');
        } finally {
          setIsDeleting(false);
        }
      } else {
        console.log('Delete cancelled');
      }
    } else {
      console.log('Showing mobile confirmation');
      Alert.alert(
        'Delete Note',
        'Are you sure you want to delete this note? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('Delete cancelled'),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('Starting delete process...');
                setIsDeleting(true);
                console.log('Calling deleteNote with ID:', note.id);
                await deleteNote(note.id);
                console.log('Note deleted successfully');
                router.back();
              } catch (error) {
                console.error('Failed to delete note:', error);
                Alert.alert('Error', 'Failed to delete note. Please try again.');
              } finally {
                setIsDeleting(false);
              }
            },
          },
        ]
      );
    }
  };
  
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setPageChangeCount(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading note details...</Text>
      </View>
    );
  }
  
  if (!note) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Note not found</Text>
        <Text style={styles.errorText}>The note you're looking for doesn't exist or has been removed.</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          variant="primary"
          style={styles.errorButton}
        />
      </View>
    );
  }
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen 
        options={{
          title: note.subject,
          headerRight: () => (
            <TouchableOpacity style={styles.headerButton}>
              <Share2 size={20} color={colors.text} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={!isFullscreen}>
        {!isFullscreen && (
          <>
            <Image 
              source={{ uri: note?.thumbnailUrl }} 
              style={styles.thumbnail}
              resizeMode="cover"
            />
            {!isFullscreen && (
              <CustomBannerAd 
                style={{
                  marginVertical: 16,
                  alignSelf: 'center'
                }}
              />
            )}
            <View style={styles.content}>
              <Text style={styles.title}>{note?.title}</Text>
              <Text style={styles.description}>{note?.description}</Text>
              
              <View style={styles.metaContainer}>
                <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>{note?.subject}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.secondaryLight }]}>
                  <Text style={[styles.badgeText, { color: colors.secondary }]}>{note?.class}</Text>
                </View>
                {note?.board && (
                  <View style={[styles.badge, { backgroundColor: colors.secondaryLight }]}>
                    <Text style={[styles.badgeText, { color: colors.info }]}>{note?.board}</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
        
        {note?.fileType === 'pdf' && (
          <View style={[styles.pdfContainer, isFullscreen && styles.pdfContainerFullscreen]}>
            {Platform.OS === 'web' ? (
              <>
                <TouchableOpacity 
                  style={styles.fullscreenButton}
                  onPress={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize2 size={24} color={colors.background} />
                  ) : (
                    <Maximize2 size={24} color={colors.background} />
                  )}
                </TouchableOpacity>
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(note.fileUrl)}&embedded=true`}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                />
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.fullscreenButton}
                  onPress={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? (
                    <Minimize2 size={24} color={colors.background} />
                  ) : (
                    <Maximize2 size={24} color={colors.background} />
                  )}
                </TouchableOpacity>
                <View style={styles.pdfControls}>
                  <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => {
                      setIsSearchVisible(!isSearchVisible);
                      if (!isSearchVisible) {
                        setSearchQuery('');
                        setSearchResults([]);
                        setCurrentSearchIndex(-1);
                        webViewRef.current?.injectJavaScript(`
                          window.clearHighlights();
                          true;
                        `);
                      }
                    }}
                  >
                    <Search size={24} color={isSearchVisible ? colors.primary : '#FFFFFF'} />
                  </TouchableOpacity>
                  {isSearchVisible && <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                      <Search size={20} color={colors.textSecondary} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search in PDF..."
                        value={searchQuery}
                        onChangeText={(text) => {
                          setSearchQuery(text);
                          if (text) {
                            webViewRef.current?.injectJavaScript(`
                              window.findAndHighlight('${text}');
                              true;
                            `);
                          } else {
                            webViewRef.current?.injectJavaScript(`
                              window.clearHighlights();
                              true;
                            `);
                          }
                        }}
                        placeholderTextColor={colors.textTertiary}
                      />
                    </View>
                    {searchResults.length > 0 && (
                      <View style={styles.searchNavigation}>
                        <Text style={styles.searchCount}>
                          {currentSearchIndex + 1} of {searchResults.length}
                        </Text>
                        <TouchableOpacity 
                          style={styles.searchNavButton}
                          onPress={() => {
                            const newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1;
                            setCurrentSearchIndex(newIndex);
                            webViewRef.current?.injectJavaScript(`
                              window.scrollToSearchResult(${searchResults[newIndex]});
                              true;
                            `);
                          }}
                        >
                          <ChevronUp size={20} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.searchNavButton}
                          onPress={() => {
                            const newIndex = currentSearchIndex < searchResults.length - 1 ? currentSearchIndex + 1 : 0;
                            setCurrentSearchIndex(newIndex);
                            webViewRef.current?.injectJavaScript(`
                              window.scrollToSearchResult(${searchResults[newIndex]});
                              true;
                            `);
                          }}
                        >
                          <ChevronDown size={20} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>}
                  <TouchableOpacity
                    style={styles.fullscreenButton}
                    onPress={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? (
                      <Minimize2 size={24} color="#FFFFFF" />
                    ) : (
                      <Maximize2 size={24} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
                <View style={[styles.pdfContainer, isFullscreen && styles.pdfContainerFullscreen]}>
                  <WebView
                    source={{ uri: `https://docs.google.com/viewer?url=${encodeURIComponent(note.fileUrl)}&embedded=true` }}
                    style={styles.pdf}
                    ref={webViewRef}
                    injectedJavaScript={`
                      // Add search functionality
                      window.findAndHighlight = function(text) {
                        if (!text) return;
                        window.getSelection().removeAllRanges();
                        const results = [];
                        const searchRegex = new RegExp(text, 'gi');
                        const walk = document.createTreeWalker(
                          document.body,
                          NodeFilter.SHOW_TEXT,
                          null,
                          false
                        );
                        let node;
                        while (node = walk.nextNode()) {
                          const matches = node.textContent.match(searchRegex);
                          if (matches) {
                            const range = document.createRange();
                            range.selectNodeContents(node);
                            const rects = range.getClientRects();
                            for (let i = 0; i < rects.length; i++) {
                              results.push(rects[i].top);
                            }
                            const span = document.createElement('span');
                            span.className = 'search-highlight';
                            range.surroundContents(span);
                          }
                        }
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'searchResults',
                          results: results
                        }));
                      };

                      window.clearHighlights = function() {
                        const highlights = document.getElementsByClassName('search-highlight');
                        while (highlights.length > 0) {
                          const parent = highlights[0].parentNode;
                          parent.replaceChild(
                            document.createTextNode(highlights[0].textContent),
                            highlights[0]
                          );
                        }
                      };

                      window.scrollToSearchResult = function(top) {
                        window.scrollTo(0, top);
                      };

                      // Add highlight styles
                      const style = document.createElement('style');
                      style.textContent = '.search-highlight { background-color: yellow; }';
                      document.head.appendChild(style);
                    `}
                    onMessage={(event) => {
                      try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === 'searchResults') {
                          setSearchResults(data.results);
                          setCurrentSearchIndex(data.results.length > 0 ? 0 : -1);
                        } else if (data.type === 'pageInfo') {
                          setCurrentPage(data.currentPage);
                          setTotalPages(data.totalPages);
                        }
                      } catch (e) {
                        console.error('Error parsing WebView message:', e);
                      }
                    }}
                    startInLoadingState={true}
                    renderLoading={() => (
                      <View style={styles.pdfLoading}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Loading PDF...</Text>
                      </View>
                    )}
                  />
                  <View style={styles.pdfControls}>
                    <TouchableOpacity
                      style={styles.searchButton}
                      onPress={() => {
                        setIsSearchVisible(!isSearchVisible);
                        if (!isSearchVisible) {
                          setSearchQuery('');
                          setSearchResults([]);
                          setCurrentSearchIndex(-1);
                          webViewRef.current?.injectJavaScript(`
                            window.clearHighlights();
                            true;
                          `);
                        }
                      }}
                    >
                      <Search size={24} color={isSearchVisible ? colors.primary : '#FFFFFF'} />
                    </TouchableOpacity>
                    {isSearchVisible && (
                      <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                          <Search size={20} color={colors.textSecondary} />
                          <TextInput
                            style={styles.searchInput}
                            placeholder="Search in PDF..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={colors.textTertiary}
                            returnKeyType="search"
                            onSubmitEditing={() => {
                              if (searchQuery) {
                                webViewRef.current?.injectJavaScript(`
                                  window.findAndHighlight('${searchQuery}');
                                  true;
                                `);
                              }
                            }}
                          />
                          <TouchableOpacity 
                            style={styles.searchActionButton}
                            onPress={() => {
                              if (searchQuery) {
                                webViewRef.current?.injectJavaScript(`
                                  window.findAndHighlight('${searchQuery}');
                                  true;
                                `);
                              } else {
                                webViewRef.current?.injectJavaScript(`
                                  window.clearHighlights();
                                  true;
                                `);
                              }
                            }}
                          >
                            <ArrowRight size={20} color={colors.primary} />
                          </TouchableOpacity>
                        </View>
                        {searchResults.length > 0 && (
                          <View style={styles.searchNavigation}>
                            <Text style={styles.searchCount}>
                              {currentSearchIndex + 1} of {searchResults.length}
                            </Text>
                            <TouchableOpacity 
                              style={styles.searchNavButton}
                              onPress={() => {
                                const newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1;
                                setCurrentSearchIndex(newIndex);
                                webViewRef.current?.injectJavaScript(`
                                  window.scrollToSearchResult(${searchResults[newIndex]});
                                  true;
                                `);
                              }}
                            >
                              <ChevronUp size={20} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.searchNavButton}
                              onPress={() => {
                                const newIndex = currentSearchIndex < searchResults.length - 1 ? currentSearchIndex + 1 : 0;
                                setCurrentSearchIndex(newIndex);
                                webViewRef.current?.injectJavaScript(`
                                  window.scrollToSearchResult(${searchResults[newIndex]});
                                  true;
                                `);
                              }}
                            >
                              <ChevronDown size={20} color={colors.primary} />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.fullscreenButton}
                      onPress={() => setIsFullscreen(!isFullscreen)}
                    >
                      {isFullscreen ? (
                        <Minimize2 size={24} color="#FFFFFF" />
                      ) : (
                        <Maximize2 size={24} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                  <View style={styles.pdfFooter}>
                    <View style={styles.pageInfo}>
                      <Text style={styles.pageText}>Page {currentPage} / {totalPages}</Text>
                    </View>
                    <View style={styles.zoomControls}>
                      <TouchableOpacity 
                        style={styles.zoomButton}
                        onPress={() => {
                          const newScale = Math.max(0.5, scale - 0.25);
                          setScale(newScale);
                          webViewRef.current?.injectJavaScript(`
                            document.body.style.zoom = ${newScale};
                            true;
                          `);
                        }}
                      >
                        <Minus size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.zoomButton}
                        onPress={() => {
                          const newScale = Math.min(3, scale + 0.25);
                          setScale(newScale);
                          webViewRef.current?.injectJavaScript(`
                            document.body.style.zoom = ${newScale};
                            true;
                          `);
                        }}
                      >
                        <Plus size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        )}
        
        {!isFullscreen && (
          <>
            <View style={styles.statsContainer}>
              <TouchableOpacity style={styles.statButton} onPress={handleLike}>
                <Heart size={24} color={note?.isLiked ? colors.primary : colors.text} fill={note?.isLiked ? colors.primary : 'transparent'} />
                <Text style={styles.statText}>{note?.likes || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statButton} onPress={handleDislike}>
                <ThumbsDown size={24} color={isDisliked ? colors.error : colors.text} fill={isDisliked ? colors.error : 'transparent'} />
              </TouchableOpacity>
              
              <View style={styles.statButton}>
                <Text style={styles.statText}>{note?.downloads} downloads</Text>
              </View>
              
              <TouchableOpacity style={styles.statButton}>
                <MessageSquare size={20} color={colors.textTertiary} />
                <Text style={styles.statText}>{note?.comments}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.statButton} onPress={handleBookmark}>
                {note?.isBookmarked ? (
                  <BookmarkCheck size={20} color={colors.primary} />
                ) : (
                  <Bookmark size={20} color={colors.textTertiary} />
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.uploaderContainer}>
              <Image 
                source={{ uri: note?.uploaderAvatar || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36' }} 
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  marginRight: 16
                }}
              />
              <View style={styles.uploaderInfo}>
                <View style={styles.uploaderContainer}>
                  <Text style={styles.uploaderName}>{note.uploaderName}</Text>
                  {session?.user?.id && note.uploaderId !== session.user.id && (
                    <Button
                      title={isFollowing ? 'Following' : 'Follow'}
                      onPress={async () => {
                        if (!note.uploaderId) return;
                        if (isFollowing) {
                          // Show interstitial ad every 3 pages
                          if (currentPage % 3 === 0) {
                            setShowInterstitialAd(true);
                          }
                          await unfollowUser(note.uploaderId);
                        } else {
                          await followUser(note.uploaderId);
                        }
                      }}
                      variant={isFollowing ? 'outline' : 'primary'}
                      size="small"
                    />
                  )}
                </View>
                <Text style={styles.uploadDate}>
                  {note?.createdAt && new Date(note.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <CustomInterstitialAd
        visible={showPageChangeAd}
        onClose={() => setShowPageChangeAd(false)}
        onComplete={handleAdComplete}
      />

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.downloadButtonContainer}>
            <NoteDownloadButton
              noteId={note?.id}
              noteName={note?.title}
              fileUrl={note?.fileUrl}
              creatorId={note?.uploaderId}
            />
          </View>
          {isOwner && (
            <TouchableOpacity 
              style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <AdModal 
        visible={showAdModal} 
        onClose={() => setShowAdModal(false)}
        onAdComplete={handleAdComplete}
        noteId={note?.id}
        noteName={note?.title}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bannerAd: {
    width: '100%',
    marginBottom: 16,
  },
  pdfContainer: {
    height: Dimensions.get('window').height * 0.7,
    marginVertical: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    position: 'relative',
  },
  pdfContainerFullscreen: {
    height: Dimensions.get('window').height,
    marginVertical: 0,
    borderRadius: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: colors.background,
  },
  fullscreenButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pdf: {
    flex: 1,
    backgroundColor: colors.card,
  },
  pdfLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 80, // Add extra padding for tab bar
  },
  headerButton: {
    padding: 8,
  },
  thumbnail: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  fileType: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 20,
  },
  statButton: {
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  uploaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    width: '100%'
  },
  uploaderInfo: {
    flex: 1,
  },
  uploaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text
  },
  uploadDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    minWidth: 200,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  downloadButtonContainer: {
    flex: 1,
  },
  deleteButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  pdfFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    zIndex: 10,
  },
  pageInfo: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pageText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  zoomControls: {
    flexDirection: 'row',
    gap: 8,
  },
  zoomButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pdfControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    marginRight: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    marginRight: 8,
    color: colors.text,
    fontSize: 16,
  },
  searchActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  searchNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  searchCount: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  searchNavButton: {
    padding: 8,
    marginLeft: 8,
  },
});