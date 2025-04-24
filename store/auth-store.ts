import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import { mockUser } from '@/mocks/user';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasCompletedOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  updateProfile: (profile: Partial<User>) => Promise<void>;
  updateEmail: (newEmail: string, password: string) => Promise<void>;
  setInterests: (interests: string[]) => Promise<void>;
  setSubjects: (subjects: string[]) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasCompletedOnboarding: false,
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (signInError) throw signInError;
          if (!authData.user) throw new Error('No user data returned');

          // Fetch the user's profile
          const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (fetchError) throw fetchError;
          if (!profile) throw new Error('Profile not found');

          const hasSelectedInterests = profile.interests && profile.interests.length > 0;
          
          set({ 
            user: profile,
            isAuthenticated: true,
            hasCompletedOnboarding: hasSelectedInterests,
            isLoading: false 
          });
        } catch (error) {
          console.error('Login error:', error);
          set({ 
            error: error instanceof Error ? error.message : "Login failed", 
            isLoading: false 
          });
          throw error;
        }
      },
      
      signup: async (name: string, username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // Sign up the user with minimal metadata
          const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name, username }
            }
          });

          if (signUpError) throw signUpError;
          if (!authData.user) throw new Error('No user data returned');

          // Try to create profile first
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              username,
              name: name,
              email: email,
              password: password
            })
            .select('*')
            .maybeSingle();

          if (createError) throw createError;
          if (!newProfile) throw new Error('Failed to create profile');

          // Set authenticated state immediately
          set({ 
            user: newProfile,
            isAuthenticated: true,
            hasCompletedOnboarding: false,
            isLoading: false,
            error: null
          });
          
        } catch (error) {
          console.error('Signup error:', error);
          set({ 
            error: error instanceof Error ? error.message : "Signup failed", 
            isLoading: false 
          });
          throw error;
        }
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false, hasCompletedOnboarding: false });
      },
      
      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        }));
      },

      updateEmail: async (newEmail, password) => {
        set({ isLoading: true, error: null });
        try {
          // First update auth.users email
          const { error: authError } = await supabase.auth.updateUser({
            email: newEmail
          });

          if (authError) throw authError;

          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user?.id;

          if (!userId) throw new Error('User not found');

          // Then update public.profiles email
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ email: newEmail })
            .eq('id', userId);

          if (profileError) {
            // If profile update fails, try to revert auth email
            await supabase.auth.updateUser({
              email: session?.user?.email
            });
            throw profileError;
          }

          // Update local state
          set((state) => ({
            user: state.user ? { ...state.user, email: newEmail } : null,
            isLoading: false
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : "Failed to update email", 
            isLoading: false 
          });
          throw error;
        }
      },
      
      setInterests: async (interests) => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user?.id;
          if (!userId) throw new Error('User not authenticated');

          // Update in database
          const { error } = await supabase
            .from('profiles')
            .update({ interests })
            .eq('id', userId);

          if (error) throw error;

          // Update local state
          set((state) => ({
            user: state.user ? { ...state.user, interests } : null,
            hasCompletedOnboarding: interests.length > 0
          }));
        } catch (error) {
          console.error('Failed to update interests:', error);
          throw error;
        }
      },
      
      setSubjects: async (subjects) => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user?.id;
          if (!userId) throw new Error('User not authenticated');

          // Update in database
          const { error } = await supabase
            .from('profiles')
            .update({ subjects })
            .eq('id', userId);

          if (error) throw error;

          // Update local state
          set((state) => ({
            user: state.user ? { ...state.user, subjects } : null
          }));
        } catch (error) {
          console.error('Failed to update subjects:', error);
          throw error;
        }
      },

      updateProfile: async (profile) => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user?.id;
          if (!userId) throw new Error('User not authenticated');

          // Update in database
          const { error } = await supabase
            .from('profiles')
            .update(profile)
            .eq('id', userId);

          if (error) throw error;

          // Update local state
          set((state) => ({
            user: state.user ? { ...state.user, ...profile } : null
          }));
        } catch (error) {
          console.error('Failed to update profile:', error);
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);