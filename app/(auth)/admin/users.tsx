import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Search, UserCheck, UserX } from 'lucide-react-native';
import { colors } from '@/constants/colors';

type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  level: number;
  is_verified?: boolean;
};

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch users with search functionality
  // Verify user mutation
  const verifyUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });

  // Unverify user mutation
  const unverifyUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: false })
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*');

      if (searchQuery) {
        query = query.or(`username.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as User[];
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Users</Text>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      {/* Users List */}
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <ScrollView style={styles.usersList}>
          {users?.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.userMeta}>
                  <Text style={styles.userUsername}>@{user.username}</Text>
                  <Text style={[styles.userRole, user.role === 'admin' && styles.adminRole]}>
                    {user.role}
                  </Text>
                  <Text style={styles.userLevel}>Level {user.level}</Text>
                </View>
              </View>
              
              <View style={styles.actions}>
                {user.role !== 'admin' && (
                  <TouchableOpacity 
                    style={[styles.actionButton, user.is_verified ? styles.unverifyButton : styles.verifyButton]}
                    onPress={() => {
                      if (user.is_verified) {
                        unverifyUserMutation.mutate(user.id);
                      } else {
                        verifyUserMutation.mutate(user.id);
                      }
                    }}
                  >
                    {user.is_verified ? (
                      <UserX size={20} color={colors.error} />
                    ) : (
                      <UserCheck size={20} color={colors.success} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  loader: {
    marginTop: 40,
  },
  usersList: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userUsername: {
    fontSize: 14,
    color: colors.textTertiary,
    marginRight: 12,
  },
  userRole: {
    fontSize: 12,
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    color: colors.textSecondary,
    marginRight: 12,
  },
  adminRole: {
    backgroundColor: colors.primary + '20',
    color: colors.primary,
  },
  userLevel: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  verifyButton: {
    backgroundColor: colors.success + '20',
  },
  unverifyButton: {
    backgroundColor: colors.error + '20',
  },
});
