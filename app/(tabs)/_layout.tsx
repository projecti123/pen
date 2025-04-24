import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Home, Search, Upload, BookMarked, User, Users, BarChart } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';

export default function TabLayout() {
  const { isAuthenticated } = useAuthStore();
  
  const getTabColor = (routeName: string) => {
    switch (routeName) {
      case 'index': return '#FF6B6B';  // Bright coral red
      case 'search': return '#4ECDC4'; // Bright turquoise
      case 'upload': return '#45B7D1';  // Bright sky blue
      case 'library': return '#96CEB4'; // Mint green
      case 'social': return '#9B5DE5'; // Purple
      case 'profile': return '#FFBE0B'; // Bright yellow
      case 'stats': return '#6C63FF'; // Purple blue
      default: return colors.primary;
    }
  };

  const getTabBackground = (routeName: string, focused: boolean) => {
    if (!focused) return '#F3F4F6';  // Light gray when not selected
    switch (routeName) {
      case 'index': return '#FFE5E5';   // Light red
      case 'search': return '#E5F9F7';  // Light turquoise
      case 'upload': return '#E5F4F9';  // Light blue
      case 'library': return '#EDF7F3';  // Light green
      case 'social': return '#F5E6FF';  // Light purple
      case 'profile': return '#FFF7E5';  // Light yellow
      case 'stats': return '#F0EFFF';  // Light purple blue
      default: return '#F3F4F6';
    }
  };
  
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: getTabColor(route.name),
        tabBarInactiveTintColor: '#4B5563',
        tabBarStyle: {
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: colors.background,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabel: () => null,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? colors.primary : colors.surface,
              padding: 12,
              borderRadius: 30,
              marginBottom: 4,
              elevation: focused ? 4 : 0,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: focused ? 0.3 : 0,
              shadowRadius: 4,
            }}>
              <Home size={24} color={focused ? '#FFFFFF' : '#8E89A9'} />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              navigation.navigate('(auth)/login');
            }
          },
        })}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? colors.primary : colors.surface,
              padding: 12,
              borderRadius: 30,
              marginBottom: 4,
              elevation: focused ? 4 : 0,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: focused ? 0.3 : 0,
              shadowRadius: 4,
            }}>
              <Search size={24} color={focused ? '#FFFFFF' : '#8E89A9'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? colors.primary : colors.surface,
              padding: 12,
              borderRadius: 30,
              marginBottom: 4,
              elevation: focused ? 4 : 0,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: focused ? 0.3 : 0,
              shadowRadius: 4,
            }}>
              <Upload size={24} color={focused ? '#FFFFFF' : '#8E89A9'} />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              navigation.navigate('(auth)/login');
            } else {
              e.preventDefault();
              navigation.navigate('upload');
            }
          },
        })}
      />
      <Tabs.Screen
        name="library"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? colors.primary : colors.surface,
              padding: 12,
              borderRadius: 30,
              marginBottom: 4,
              elevation: focused ? 4 : 0,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: focused ? 0.3 : 0,
              shadowRadius: 4,
            }}>
              <BookMarked size={24} color={focused ? '#FFFFFF' : '#8E89A9'} />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              navigation.navigate('(auth)/login');
            }
          },
        })}
      />
      <Tabs.Screen
        name="social"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? colors.primary : colors.surface,
              padding: 12,
              borderRadius: 30,
              marginBottom: 4,
              elevation: focused ? 4 : 0,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: focused ? 0.3 : 0,
              shadowRadius: 4,
            }}>
              <Users size={24} color={focused ? '#FFFFFF' : '#8E89A9'} />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              navigation.navigate('(auth)/login');
            }
          },
        })}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? colors.primary : colors.surface,
              padding: 12,
              borderRadius: 30,
              marginBottom: 4,
              elevation: focused ? 4 : 0,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: focused ? 0.3 : 0,
              shadowRadius: 4,
            }}>
              <User size={24} color={focused ? '#FFFFFF' : '#8E89A9'} />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              navigation.navigate('(auth)/login');
            }
          },
        })}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? colors.primary : colors.surface,
              padding: 12,
              borderRadius: 30,
              marginBottom: 4,
              elevation: focused ? 4 : 0,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: focused ? 0.3 : 0,
              shadowRadius: 4,
            }}>
              <BarChart size={24} color={focused ? '#FFFFFF' : '#8E89A9'} />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              navigation.navigate('(auth)/login');
            }
          },
        })}
      />
    </Tabs>
  );
}