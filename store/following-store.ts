import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface UserData {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
}

interface FollowingState {
  followingCount: number;
  followersCount: number;
  followingIds: string[];
  followingUsers: UserData[];
  isLoading: boolean;
  error: string | null;
  
  fetchFollowingCount: (userId: string) => Promise<void>;
  fetchFollowersCount: (userId: string) => Promise<void>;
  fetchFollowingIds: () => Promise<void>;
  toggleFollow: (targetUserId: string) => Promise<void>;
  isFollowing: (targetUserId: string) => boolean;
}

export const useFollowingStore = create<FollowingState>()((set, get) => ({
  followingCount: 0,
  followersCount: 0,
  followingIds: [],
  followingUsers: [],
  isLoading: false,
  error: null,

  fetchFollowingCount: async (userId) => {
    try {
      // Log the user ID we're querying for
      console.log('Fetching following count for user:', userId);
      
      const { count, error } = await supabase
        .from('followers')
        .select('following_id', { count: 'exact' })
        .eq('follower_id', userId);

      console.log('Following count result:', { count, error });

      if (error) {
        console.error('Error inserting follow:', error);
        throw error;
      }
      set({ followingCount: count || 0 });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch following count' });
    }
  },

  fetchFollowersCount: async (userId) => {
    try {
      const { count, error } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (error) {
        console.error('Error inserting follow:', error);
        throw error;
      }
      set({ followersCount: count || 0 });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch followers count' });
    }
  },

  fetchFollowingIds: async () => {
    console.log('Fetching following IDs...');
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) throw new Error('Not authenticated');

      console.log('Current user ID:', userId);
      
      const { data, error } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', userId);

      console.log('Following IDs query result:', { data, error });

      if (error) {
        console.error('Error inserting follow:', error);
        throw error;
      }
      
      const followingIds = data?.map(f => f.following_id) || [];
      
      // Fetch user data for following IDs
      let followingUsers: UserData[] = [];

      if (followingIds.length > 0) {
        console.log('Fetching profiles for IDs:', followingIds);
        const { data: userData, error: userDataError } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url')
          .in('id', followingIds);

        console.log('Profile data result:', userData);

        if (userDataError) {
          console.error('Error fetching profiles:', userDataError);
          throw userDataError;
        }

        followingUsers = userData?.map(user => ({
          id: user.id,
          name: user.name,
          username: user.username,
          avatar_url: user.avatar_url
        })) || [];
      }



      console.log('Setting state:', { followingIds, followingUsers });
      set({ followingIds, followingUsers, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch following list',
        isLoading: false 
      });
    }
  },

  toggleFollow: async (targetUserId) => {
    if (!targetUserId) {
      console.error('No target user ID provided');
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) throw new Error('Not authenticated');
      if (userId === targetUserId) throw new Error('Cannot follow yourself');

      const isCurrentlyFollowing = get().isFollowing(targetUserId);

      if (isCurrentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', targetUserId);

        if (error) {
        console.error('Error inserting follow:', error);
        throw error;
      }

        set(state => ({
          followingIds: state.followingIds.filter(id => id !== targetUserId),
          followingUsers: state.followingUsers.filter(user => user.id !== targetUserId),
          followingCount: state.followingCount - 1
        }));

        // Refresh following list
        await get().fetchFollowingIds();
      } else {
        // Check if already following
        const { data: existingFollow } = await supabase
          .from('followers')
          .select('*')
          .eq('follower_id', userId)
          .eq('following_id', targetUserId)
          .single();

        if (existingFollow) {
          console.log('Already following this user');
          return;
        }

        console.log('Following user:', targetUserId);
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: userId,
            following_id: targetUserId,
            created_at: new Date().toISOString()
          });

        if (error) {
        console.error('Error inserting follow:', error);
        throw error;
      }

        console.log('Fetching user data for:', targetUserId);
        // Fetch user data for the new follow
        console.log('Fetching profile for user:', targetUserId);
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, name, email, avatar_url')
          .eq('id', targetUserId)
          .single();

        console.log('Profile data result:', userData);

        if (userError) {
          console.error('Error fetching user data:', userError);
          throw userError;
        }

        const newUser: UserData = {
          id: userData.id,
          name: userData.name,
          username: session.user.user_metadata?.username || '',
          avatar_url: userData.avatar_url
        };

        set(state => ({
          followingIds: [...state.followingIds, targetUserId],
          followingUsers: [...state.followingUsers, newUser],
          followingCount: state.followingCount + 1
        }));

        // Refresh following list
        await get().fetchFollowingIds();
      }
    } catch (error) {
      console.error('Toggle follow error:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to toggle follow' });
    }
  },

  isFollowing: (targetUserId) => {
    return get().followingIds.includes(targetUserId);
  }
}));
