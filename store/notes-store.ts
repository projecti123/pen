import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '@/types';
import { supabase } from '@/lib/supabase';

interface NotesState {
  notes: Note[];
  trendingNotes: Note[];
  recommendedNotes: Note[];
  bookmarkedNotes: Note[];
  downloadedNotes: Note[];
  uploadedNotes: Note[];
  likedNotes: Note[];
  dislikedNotes: Note[];
  isLoading: boolean;
  error: string | null;

  fetchNotes: () => Promise<void>;
  fetchTrendingNotes: () => Promise<void>;
  fetchRecommendedNotes: (interests: string[]) => Promise<void>;
  fetchBookmarkedNotes: () => Promise<void>;
  fetchLikedNotes: () => Promise<void>;
  fetchDownloadedNotes: () => Promise<void>;
  fetchUploadedNotes: (userId: string) => Promise<void>;
  downloadNote: (noteId: string) => Promise<void>;
  toggleBookmark: (noteId: string) => void;
  toggleLike: (noteId: string) => void;
  toggleDislike: (noteId: string) => void;
  uploadNote: (note: Omit<Note, 'id' | 'likes' | 'downloads' | 'comments' | 'createdAt'>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  recordView: (noteId: string) => Promise<void>;
  recordAdClick: (noteId: string) => Promise<void>;
  recordSupportTip: (noteId: string, amount: number) => Promise<void>;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      recordView: async (noteId) => {
        try {
          const { error } = await supabase.rpc('record_view', {
            p_note_id: noteId
          });
          if (error) throw error;
          
          // Update local state
          set((state) => ({
            notes: state.notes.map(note =>
              note.id === noteId
                ? { ...note, views: (note.views || 0) + 1 }
                : note
            )
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to record view" });
        }
      },

      recordAdClick: async (noteId) => {
        try {
          const { error } = await supabase.rpc('record_ad_click', {
            p_note_id: noteId
          });
          if (error) throw error;
          
          // Update local state
          set((state) => ({
            notes: state.notes.map(note =>
              note.id === noteId
                ? {
                    ...note,
                    adClicks: (note.adClicks || 0) + 1,
                    earnings: (note.earnings || 0) + 0.10
                  }
                : note
            )
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to record ad click" });
        }
      },

      recordSupportTip: async (noteId, amount) => {
        try {
          const { error } = await supabase.rpc('record_support_tip', {
            p_note_id: noteId,
            p_amount: amount
          });
          if (error) throw error;
          
          // Update local state
          set((state) => ({
            notes: state.notes.map(note =>
              note.id === noteId
                ? { ...note, earnings: (note.earnings || 0) + amount }
                : note
            )
          }));
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to record support tip" });
        }
      },
      notes: [],
      trendingNotes: [],
      recommendedNotes: [],
      bookmarkedNotes: [],
      downloadedNotes: [],
      uploadedNotes: [],
      likedNotes: [],
      dislikedNotes: [],
      isLoading: false,
      error: null,
      
      fetchNotes: async () => {
        set({ isLoading: true });
        try {
          const { data: notes, error } = await supabase
            .from('notes')
            .select(`
              *,
              profiles:uploader_id (
                name,
                avatar_url,
                is_verified,
                verification_reason
              )
            `)
            .order('created_at', { ascending: false });

          console.log('Raw data from query:', JSON.stringify(notes?.[0], null, 2));

          if (error) throw error;
          console.log('Raw notes data:', notes);

          // Transform the data to include uploader details
          const formattedNotes = notes.map((note: any) => ({
            id: note.id,
            title: note.title,
            description: note.description,
            subject: note.subject,
            class: note.class,
            board: note.board,
            topic: note.topic,
            fileType: note.file_type,
            fileUrl: note.file_url,
            thumbnailUrl: note.thumbnail_url,
            uploaderId: note.uploader_id,
            uploaderName: note.profiles?.name || 'Unknown',
            uploaderAvatar: note.profiles?.avatar_url,
            uploaderIsVerified: note.profiles?.is_verified || false,
            uploaderVerificationReason: note.profiles?.verification_reason,
            likes: note.likes || 0,
            downloads: note.downloads || 0,
            comments: note.comments || 0,
            views: note.views || 0,
            earnings: note.earnings || 0,
            createdAt: note.created_at,
            isLiked: false,
            isBookmarked: false,
            isDisliked: false,
            adClicks: note.ad_clicks || 0
          }));

          set({ notes: formattedNotes, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to fetch notes", isLoading: false });
        }
      },
      
      fetchTrendingNotes: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('notes')
            .select(`
              *,
              uploader:profiles!uploader_id(id, name, avatar_url)
            `)
            .order('views', { ascending: false })
            .order('likes', { ascending: false })
            .limit(5);

          if (error) throw error;
          
          // Transform data to include uploader info
          const transformedNotes = data?.map(note => ({
            ...note,
            uploaderName: note.uploader?.name || 'Unknown',
            uploaderAvatar: note.uploader?.avatar_url,
            uploaderId: note.uploader?.id,
            thumbnailUrl: note.thumbnail_url || note.uploader?.avatar_url
          })) || [];

          set({ trendingNotes: transformedNotes, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to fetch trending notes", isLoading: false });
        }
      },
      
      fetchRecommendedNotes: async (interests: string[]) => {
        set({ isLoading: true, error: null });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) throw new Error('User not authenticated');
          const userId = session.user.id;

          // Get followed users
          const { data: followedUsers, error: followError } = await supabase
            .from('followers')
            .select('following_id')
            .eq('follower_id', userId);

          if (followError) throw followError;

          // Get notes from followed users
          const followedUserIds = followedUsers?.map(f => f.following_id) || [];
          
          // Prepare base query with proper joins
          let query = supabase
            .from('notes')
            .select(`
              *,
              profiles!notes_uploader_id_fkey(
                id,
                name,
                avatar_url
              )
            `);

          // Build the filter conditions for interests
          if (interests?.length > 0) {
            const interestFilters = interests.map(interest => {
              const classFilter = `class.ilike.%${interest}%`;
              const subjectFilter = `subject.ilike.%${interest}%`;
              const topicFilter = `topic.ilike.%${interest}%`;
              return `or(${classFilter},${subjectFilter},${topicFilter})`;
            });
            
            // Apply filters
            query = query.or(interestFilters.join(','));
          }

          // Add followed users condition if any
          if (followedUserIds.length > 0) {
            query = query.or(`uploader_id.in.(${followedUserIds.join(',')})`);
          }

          // Order by most recent and most viewed
          query = query.order('created_at', { ascending: false })
                      .order('views', { ascending: false })
                      .limit(20);

          console.log('Executing query:', query);
          const { data, error } = await query;
          
          if (error) {
            console.error('Query error:', error);
            throw error;
          }

          console.log('Raw query results:', data);

          // Transform the data to include uploader details
          const transformedNotes = data?.map(note => ({
            id: note.id,
            title: note.title,
            description: note.description,
            subject: note.subject,
            class: note.class,
            board: note.board,
            topic: note.topic,
            fileType: note.file_type,
            fileUrl: note.file_url,
            thumbnailUrl: note.thumbnail_url,
            uploaderId: note.uploader_id,
            uploaderName: note.profiles?.name || 'Unknown',
            uploaderAvatar: note.profiles?.avatar_url,
            likes: note.likes || 0,
            downloads: note.downloads || 0,
            comments: note.comments || 0,
            views: note.views || 0,
            adClicks: note.ad_clicks || 0,
            earnings: note.earnings || 0,
            isLiked: false,
            isDisliked: false,
            isBookmarked: false,
            createdAt: note.created_at
          })) || [];
          
          console.log('Transformed notes:', transformedNotes);
          set({ recommendedNotes: transformedNotes, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch recommended notes:', error);
          set({ error: error instanceof Error ? error.message : "Failed to fetch recommended notes", isLoading: false });
        }
      },
      
      fetchBookmarkedNotes: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;
          
          if (!userId) throw new Error('User not authenticated');

          const { data, error } = await supabase
            .from('wishlists')
            .select(`
              note_id,
              notes:notes (*, uploader:profiles!uploader_id(id, name, avatar_url))
            `)
            .eq('user_id', userId);

          if (error) throw error;
          
          // Transform the data to Note array
          const bookmarked = data?.reduce<Note[]>((acc, item) => {
            if (item.notes && typeof item.notes === 'object' && !Array.isArray(item.notes)) {
              const note = item.notes as {
                id: string;
                title: string;
                description: string;
                subject: string;
                class: string;
                board: string;
                topic: string;
                file_type: 'pdf' | 'image' | 'doc';
                file_url: string;
                thumbnail_url: string;
                uploader_id: string;
                likes: number;
                downloads: number;
                comments: number;
                views: number;
                ad_clicks: number;
                earnings: number;
                created_at: string;
                uploader?: {
                  id?: string;
                  name?: string;
                  avatar_url?: string;
                };
              };

              const transformedNote: Note = {
                id: note.id,
                title: note.title,
                description: note.description,
                subject: note.subject,
                class: note.class,
                board: note.board,
                topic: note.topic,
                fileType: note.file_type,
                fileUrl: note.file_url,
                thumbnailUrl: note.thumbnail_url,
                uploaderId: note.uploader_id,
                uploaderName: note.uploader?.name || 'Unknown',
                uploaderAvatar: note.uploader?.avatar_url,
                likes: note.likes || 0,
                downloads: note.downloads || 0,
                comments: note.comments || 0,
                views: note.views || 0,
                adClicks: note.ad_clicks || 0,
                earnings: note.earnings || 0,
                isLiked: false,
                isDisliked: false,
                isBookmarked: true, // Since this is from wishlists table
                createdAt: note.created_at
              };
              acc.push(transformedNote);
            }
            return acc;
          }, []) || [];
          
          set({ bookmarkedNotes: bookmarked, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch bookmarked notes:', error);
          set({ error: error instanceof Error ? error.message : "Failed to fetch bookmarked notes", isLoading: false });
        }
      },
      
      fetchDownloadedNotes: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log('Fetching downloaded notes...');
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) throw new Error('Not authenticated');

          // First get the downloads
          const { data: downloads, error: downloadsError } = await supabase
            .from('downloads')
            .select('note_id, downloaded_at')
            .eq('user_id', session.user.id)
            .order('downloaded_at', { ascending: false });

          if (downloadsError) {
            console.error('Error fetching downloads:', downloadsError);
            throw downloadsError;
          }

          if (!downloads || downloads.length === 0) {
            set({ downloadedNotes: [], isLoading: false });
            return;
          }

          // Then get the notes with their uploader info
          const { data: notes, error: notesError } = await supabase
            .from('notes')
            .select(`
              *,
              uploader:profiles!uploader_id(id, name, avatar_url)
            `)
            .in('id', downloads.map(d => d.note_id));

          if (notesError) {
            console.error('Error fetching notes:', notesError);
            throw notesError;
          }

          // Combine the data
          const transformedNotes = notes?.map(note => {
            const download = downloads.find(d => d.note_id === note.id);
            return {
              ...note,
              uploaderId: note.uploader?.id,
              uploaderName: note.uploader?.name,
              uploaderAvatar: note.uploader?.avatar_url,
              thumbnailUrl: note.thumbnail_url || note.uploader?.avatar_url, // Add thumbnail with fallback
              downloadedAt: download?.downloaded_at
            } as Note;
          }) || [];

          console.log('Transformed notes:', transformedNotes);
          set({ downloadedNotes: transformedNotes, isLoading: false });
        } catch (error) {
          console.error('Error in fetchDownloadedNotes:', error);
          set({ error: error instanceof Error ? error.message : "Failed to fetch downloaded notes", isLoading: false });
        }
      },
      
      fetchUploadedNotes: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('uploader_id', userId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          set({ uploadedNotes: data || [], isLoading: false });
          const { data: notesData, error: notesError } = await supabase
            .from('notes')
            .select(`
              *,
              uploader:uploader_id (
                id,
                name,
                avatar_url,
                is_verified,
                verification_reason
              )
            `)
            .eq('uploader_id', userId)
            .order('created_at', { ascending: false });
            
          if (notesError) throw notesError;
          
          // Transform the data to match our Note type
          const transformedNotes = notesData?.map(note => ({
            id: note.id,
            title: note.title,
            description: note.description,
            subject: note.subject,
            class: note.class,
            board: note.board,
            topic: note.topic,
            fileType: note.file_type,
            fileUrl: note.file_url,
            thumbnailUrl: note.thumbnail_url,
            uploaderId: note.uploader_id,
            uploaderName: note.uploader?.name || 'Unknown',
            uploaderAvatar: note.uploader?.avatar_url,
            uploaderIsVerified: note.uploader?.is_verified || false,
            uploaderVerificationReason: note.uploader?.verification_reason,
            likes: note.likes || 0,
            downloads: note.downloads || 0,
            comments: note.comments || 0,
            views: note.views || 0,
            adClicks: note.ad_clicks || 0,
            earnings: note.earnings || 0,
            isLiked: false,
            isDisliked: false,
            isBookmarked: false,
            createdAt: note.created_at
          })) || [];
          
          set({ uploadedNotes: transformedNotes, isLoading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to fetch uploaded notes", isLoading: false });
        }
      },
      
      toggleDislike: async (noteId) => {
        try {
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;
          
          if (!userId) throw new Error('User not authenticated');

          // Check if note is already disliked
          const isDisliked = get().dislikedNotes.some(note => note.id === noteId);
          
          // Remove from disliked notes if already disliked, add if not
          if (isDisliked) {
            set(state => ({
              dislikedNotes: state.dislikedNotes.filter(note => note.id !== noteId)
            }));
          } else {
            const note = get().notes.find(note => note.id === noteId);
            if (note) {
              set(state => ({
                dislikedNotes: [...state.dislikedNotes, note],
                // Remove from liked notes if it was liked
                likedNotes: state.likedNotes.filter(n => n.id !== noteId)
              }));
            }
          }

          // Update in database
          const { error } = await supabase
            .from('note_reactions')
            .upsert({
              user_id: userId,
              note_id: noteId,
              reaction_type: isDisliked ? null : 'dislike'
            });

          if (error) throw error;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to toggle dislike' });
        }
      },

      deleteNote: async (noteId) => {
        try {
          set({ isLoading: true, error: null });

          // Get current user
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            console.error('Delete failed: Not authenticated');
            throw new Error('Not authenticated');
          }

          // First delete all related records
          const { error: wishlistError } = await supabase
            .from('wishlists')
            .delete()
            .eq('note_id', noteId);

          if (wishlistError) {
            console.error('Failed to delete wishlist entries:', wishlistError);
          }

          const { error: likesError } = await supabase
            .from('likes')
            .delete()
            .eq('note_id', noteId);

          if (likesError) {
            console.error('Failed to delete like entries:', likesError);
          }

          // Now delete the note
          const { error: deleteError } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId)
            .eq('uploader_id', session.user.id);

          if (deleteError) {
            console.error('Delete failed:', deleteError);
            throw deleteError;
          }

          console.log('Note deleted successfully:', noteId);

          // Update all note lists in state
          set(state => {
            // Helper to filter out the deleted note
            const filterNote = (notes: Note[] | undefined) => notes?.filter((n: Note) => n.id !== noteId) || [];

            const newState = {
              notes: filterNote(state.notes),
              uploadedNotes: filterNote(state.uploadedNotes),
              bookmarkedNotes: filterNote(state.bookmarkedNotes),
              likedNotes: filterNote(state.likedNotes),
              downloadedNotes: filterNote(state.downloadedNotes),
              trendingNotes: filterNote(state.trendingNotes),
              recommendedNotes: filterNote(state.recommendedNotes),
              isLoading: false
            };
            console.log('State updated after delete');
            return newState;
          });

          // Get current user's interests
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('interests')
            .eq('id', currentSession?.user?.id)
            .single();

          // Refresh all note lists to ensure sync with server
          await Promise.all([
            get().fetchNotes(),
            get().fetchRecommendedNotes(userProfile?.interests || []),
            get().fetchTrendingNotes()
          ]);
        } catch (error) {
          console.error('Delete note error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete note',
            isLoading: false
          });
          throw error;
        }
      },
      
      toggleBookmark: async (noteId) => {
        try {
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;
          
          if (!userId) throw new Error('User not authenticated');

          const { data: existingBookmark } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', userId)
            .eq('note_id', noteId)
            .single();

          const isBookmarking = !existingBookmark;

          if (existingBookmark) {
            // Remove bookmark
            await supabase
              .from('wishlists')
              .delete()
              .eq('user_id', userId)
              .eq('note_id', noteId);
          } else {
            // Add bookmark
            await supabase
              .from('wishlists')
              .insert([{
                user_id: userId,
                note_id: noteId
              }]);
          }

          // Update isBookmarked flag in all note lists
          set((state) => {
            const updateNoteList = (notes: Note[]) => 
              notes.map(note => 
                note.id === noteId 
                  ? { ...note, isBookmarked: isBookmarking }
                  : note
              );
            
            return {
              notes: updateNoteList(state.notes),
              trendingNotes: updateNoteList(state.trendingNotes),
              recommendedNotes: updateNoteList(state.recommendedNotes),
              downloadedNotes: updateNoteList(state.downloadedNotes),
              uploadedNotes: updateNoteList(state.uploadedNotes)
            };
          });

          // Refresh bookmarked notes
          await get().fetchBookmarkedNotes();
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to toggle bookmark" });
        }
      },
      
      toggleLike: (noteId) => {
        set((state) => {
          // Update in all note lists
          const updateNoteList = (notes: Note[]) => 
            notes.map(note => 
              note.id === noteId 
                ? { 
                    ...note, 
                    isLiked: !note.isLiked,
                    likes: note.isLiked ? note.likes - 1 : note.likes + 1 
                  } 
                : note
            );
          
          return {
            notes: updateNoteList(state.notes),
            trendingNotes: updateNoteList(state.trendingNotes),
            recommendedNotes: updateNoteList(state.recommendedNotes),
            bookmarkedNotes: updateNoteList(state.bookmarkedNotes),
            uploadedNotes: updateNoteList(state.uploadedNotes)
          };
        });
      },
      
      uploadNote: async (note) => {
        set({ isLoading: true, error: null });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user?.id;

          if (!userId) throw new Error('User not authenticated');

          // Create note in database
          const { data, error } = await supabase
            .from('notes')
            .insert([{
              ...note,
              uploader_id: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (error) throw error;

          // Update local state
          const transformedNote: Note = {
            id: data.id,
            title: data.title,
            description: data.description,
            subject: data.subject,
            class: data.class,
            board: data.board,
            topic: data.topic,
            fileType: data.file_type,
            fileUrl: data.file_url,
            thumbnailUrl: data.thumbnail_url,
            uploaderId: data.uploader_id,
            uploaderName: 'You',
            uploaderAvatar: undefined,
            likes: 0,
            downloads: 0,
            comments: 0,
            views: 0,
            adClicks: 0,
            earnings: 0,
            isLiked: false,
            isDisliked: false,
            isBookmarked: false,
            createdAt: data.created_at
          };

          set((state) => {
            const updatedNotes = [transformedNote, ...state.notes];
            const updatedUploadedNotes = [transformedNote, ...state.uploadedNotes];
            
            return {
              notes: updatedNotes,
              uploadedNotes: updatedUploadedNotes,
              isLoading: false
            };
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to upload note", isLoading: false });
          throw error;
        }
      },
      
      fetchLikedNotes: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) throw new Error('Not authenticated');

          const { data: likes, error: likesError } = await supabase
            .from('likes')
            .select('note_id')
            .eq('user_id', session.user.id);

          if (likesError) throw likesError;

          if (likes && likes.length > 0) {
            const noteIds = likes.map(l => l.note_id);
            const { data: notes, error: notesError } = await supabase
              .from('notes')
              .select('*')
              .in('id', noteIds);

            if (notesError) throw notesError;

            set({ likedNotes: notes || [], isLoading: false });
          } else {
            set({ likedNotes: [], isLoading: false });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch liked notes', isLoading: false });
        }
      },

      downloadNote: async (noteId) => {
        try {
          // Record the download in our downloads table
          const { error: downloadError } = await supabase.rpc('record_download', {
            p_note_id: noteId
          });
          if (downloadError) throw downloadError;

          // Increment note stats with named parameters
          const { error: updateError } = await supabase.rpc('increment_note_stats', {
            note_id: noteId,
            view_increment: 0,
            download_increment: 1,
            ad_click_increment: 1,
            earning_increment: 0.50
          });
          if (updateError) throw updateError;

          // Refresh downloaded notes
          await get().fetchDownloadedNotes();
        } catch (error) {
          set({ error: error instanceof Error ? error.message : "Failed to download note" });
          throw error;
        }
      },
    }),
    {
      name: 'notes-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notes: state.notes,
        bookmarkedNotes: state.bookmarkedNotes,
        uploadedNotes: state.uploadedNotes,
        downloadedNotes: state.downloadedNotes
      })
    }
  )
);