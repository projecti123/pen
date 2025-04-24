import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from './error-boundary';
import { colors } from '@/constants/colors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { FloatingStickyNotes } from '@/components/FloatingStickyNotes';
import { useAuthStore } from '@/store/auth-store';

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a delay
    const hideSplash = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await SplashScreen.hideAsync();
    };
    
    hideSplash();
  }, []);

  const queryClient = new QueryClient();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <View style={{ flex: 1 }}>
            <RootLayoutNav />
            <FloatingStickyNotes />
          </View>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: Platform.OS === 'ios' ? colors.background : colors.background,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="(auth)/login" 
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="(auth)/signup" 
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="(auth)/onboarding" 
        options={{ 
          headerShown: false,
          presentation: 'modal',
        }} 
      />
      <Stack.Screen 
        name="note/[id]" 
        options={{ 
          title: 'Note Details',
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="search" 
        options={{ 
          title: 'Search Notes',
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="upload" 
        options={{ 
          title: 'Upload Note',
          animation: 'slide_from_bottom',
        }} 
      />
    </Stack>
  );
}