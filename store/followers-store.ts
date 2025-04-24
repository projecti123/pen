import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface DatabaseUser {
  id: string;
  email: string;
  raw_user_meta_data: {
    name?: string;
    avatar?: string;
  };
}

interface FollowerRow {
  follower_id: string;
  users: DatabaseUser;
}

interface FollowingRow {
  following_id: string;
  users: DatabaseUser;
}

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface FollowersState {
  followers: User[];
  following: User[];
  isLoading: boolean;
  error: string | null;
  fetchFollowers: (userId: string) => Promise<void>;
  fetchFollowing: (userId: string) => Promise<void>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  isFollowing: (userId: string) => boolean;
}

export const useFollowersStore = create<FollowersState>((set, get) => ({
  followers: [],
  following: [],
  isLoading: false,
  error: null,

  fetchFollowers: async (userId: string) => {
    try {
      console.log('Fetching followers for user:', userId);
      set({ isLoading: true, error: null });
      const { data: followerRows, error } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('following_id', userId);

      if (error) throw error;

      // Get user details for each follower
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email, name, avatar_url')
        .in('id', followerRows?.map(row => row.follower_id) || []);

      console.log('Followers data:', userData);
      console.log('Followers error:', userError);

      if (userError) throw userError;
      const users = (userData || []).map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url
      }));
      console.log('Processed followers:', users);
      set({ followers: users, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchFollowing: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const { data: followingRows, error } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', userId);

      if (error) throw error;

      // Get user details for each following
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email, name, avatar_url')
        .in('id', followingRows?.map(row => row.following_id) || []);

      if (userError) throw userError;

      if (error) throw error;
      const users = (userData || []).map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url
      }));
      set({ following: users, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  followUser: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase
        .from('followers')
        .insert([{ follower_id: (await supabase.auth.getUser()).data.user?.id, following_id: userId }]);

      if (error) throw error;
      await get().fetchFollowing((await supabase.auth.getUser()).data.user?.id || '');
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  unfollowUser: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabase
        .from('followers')
        .delete()
        .match({ 
          follower_id: (await supabase.auth.getUser()).data.user?.id,
          following_id: userId 
        });

      if (error) throw error;
      await get().fetchFollowing((await supabase.auth.getUser()).data.user?.id || '');
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  isFollowing: (userId: string) => {
    return get().following.some(user => user.id === userId);
  },
}));
