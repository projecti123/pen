import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Search, Filter, X, FileText, Users } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Input } from '@/components/Input';
import { NoteCard } from '@/components/NoteCard';
import { UserCard } from '@/components/UserCard';
import { EmptyState } from '@/components/EmptyState';
import { useNotesStore } from '@/store/notes-store';
import { useUsersStore } from '@/store/users-store';
import { mockCategories } from '@/mocks/categories';
import { mockClasses } from '@/mocks/classes';
import { mockBoards } from '@/mocks/boards';

export default function SearchScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const { notes, fetchNotes, isLoading: isLoadingNotes } = useNotesStore();
  const { searchResults: users, searchUsers, isLoading: isLoadingUsers } = useUsersStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'notes' | 'users'>('notes');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(category || null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    if (selectedTab === 'notes') {
      fetchNotes();
    }
  }, [selectedTab]);

  useEffect(() => {
    if (selectedTab === 'users' && searchQuery.trim()) {
      searchUsers(searchQuery);
    }
  }, [searchQuery, selectedTab]);
  
  useEffect(() => {
    if (category) {
      setSelectedCategory(category);
    }
  }, [category]);
  
  const filteredNotes = notes.filter(note => {
    // Search query filter
    const matchesSearch = searchQuery === '' || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.topic.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = !selectedCategory || 
      note.subject.toLowerCase() === selectedCategory.toLowerCase();
    
    // Class filter
    const matchesClass = !selectedClass || 
      note.class.toLowerCase().includes(selectedClass.toLowerCase());
    
    // Board filter
    const matchesBoard = !selectedBoard || 
      (note.board && note.board.toLowerCase().includes(selectedBoard.toLowerCase()));
    
    return matchesSearch && matchesCategory && matchesClass && matchesBoard;
  });
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedClass(null);
    setSelectedBoard(null);
  };
  
  const renderFilterChip = (
    label: string, 
    isSelected: boolean, 
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        isSelected ? { backgroundColor: colors.primaryLight } : null
      ]}
      onPress={onPress}
    >
      <Text 
        style={[
          styles.filterChipText,
          isSelected ? { color: colors.primary } : null
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchContainer}>
        <Input
          placeholder={selectedTab === 'notes' ? "Search notes, subjects, topics..." : "Search users by name or username"}
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={colors.textTertiary} />}
          rightIcon={selectedTab === 'notes' ? (
            <TouchableOpacity onPress={toggleFilters}>
              <Filter size={20} color={showFilters ? colors.primary : colors.textTertiary} />
            </TouchableOpacity>
          ) : undefined}
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'notes' && styles.selectedTab]} 
          onPress={() => setSelectedTab('notes')}
        >
          <FileText size={20} color={selectedTab === 'notes' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, selectedTab === 'notes' && styles.selectedTabText]}>Notes</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'users' && styles.selectedTab]}
          onPress={() => setSelectedTab('users')}
        >
          <Users size={20} color={selectedTab === 'users' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, selectedTab === 'users' && styles.selectedTabText]}>Users</Text>
        </TouchableOpacity>
      </View>
      
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Filters</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFilters}>Clear all</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.filterLabel}>Subject</Text>
          <FlatList
            data={mockCategories}
            renderItem={({ item }) => renderFilterChip(
              item.name,
              selectedCategory === item.id,
              () => setSelectedCategory(selectedCategory === item.id ? null : item.id)
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsContainer}
          />
          
          <Text style={styles.filterLabel}>Class/Exam</Text>
          <FlatList
            data={mockClasses}
            renderItem={({ item }) => renderFilterChip(
              item.name,
              selectedClass === item.id,
              () => setSelectedClass(selectedClass === item.id ? null : item.id)
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsContainer}
          />
          
          <Text style={styles.filterLabel}>Board</Text>
          <FlatList
            data={mockBoards}
            renderItem={({ item }) => renderFilterChip(
              item.name,
              selectedBoard === item.id,
              () => setSelectedBoard(selectedBoard === item.id ? null : item.id)
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsContainer}
          />
        </View>
      )}
      
      {selectedTab === 'notes' ? (
        <>
          {showFilters && (
            <View style={styles.filtersContainer}>
              <View style={styles.filtersHeader}>
                <Text style={styles.filtersTitle}>Filters</Text>
                <TouchableOpacity onPress={clearFilters}>
                  <Text style={styles.clearFilters}>Clear all</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.filterLabel}>Subject</Text>
              <FlatList
                data={mockCategories}
                renderItem={({ item }) => renderFilterChip(
                  item.name,
                  selectedCategory === item.id,
                  () => setSelectedCategory(selectedCategory === item.id ? null : item.id)
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsContainer}
              />
              
              <Text style={styles.filterLabel}>Class/Exam</Text>
              <FlatList
                data={mockClasses}
                renderItem={({ item }) => renderFilterChip(
                  item.name,
                  selectedClass === item.id,
                  () => setSelectedClass(selectedClass === item.id ? null : item.id)
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsContainer}
              />
              
              <Text style={styles.filterLabel}>Board</Text>
              <FlatList
                data={mockBoards}
                renderItem={({ item }) => renderFilterChip(
                  item.name,
                  selectedBoard === item.id,
                  () => setSelectedBoard(selectedBoard === item.id ? null : item.id)
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsContainer}
              />
            </View>
          )}

          {isLoadingNotes ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading notes...</Text>
            </View>
          ) : filteredNotes.length === 0 ? (
            <EmptyState
              title="No notes found"
              description={searchQuery 
                ? `No results for "${searchQuery}". Try different keywords or filters.` 
                : "No notes match your current filters. Try adjusting them."}
              icon={<Search size={40} color={colors.textTertiary} />}
              style={styles.emptyState}
            />
          ) : (
            <FlatList
              data={filteredNotes}
              renderItem={({ item }) => <NoteCard note={item} />}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.notesContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      ) : (
        <>
          {isLoadingUsers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Searching users...</Text>
            </View>
          ) : !searchQuery ? (
            <EmptyState
              title="Search Users"
              description="Enter a name or username to find other users"
              icon={<Users size={40} color={colors.textTertiary} />}
              style={styles.emptyState}
            />
          ) : users.length === 0 ? (
            <EmptyState
              title="No users found"
              description={`No users found matching "${searchQuery}"`}
              icon={<Users size={40} color={colors.textTertiary} />}
              style={styles.emptyState}
            />
          ) : (
            <FlatList
              data={users}
              renderItem={({ item }) => <UserCard user={item} />}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.usersContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  selectedTab: {
    backgroundColor: colors.primaryLight,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  selectedTabText: {
    color: colors.primary,
  },
  usersContainer: {
    paddingTop: 12,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 80, // Add extra padding for tab bar
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  clearFilters: {
    fontSize: 14,
    color: colors.primary,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  filterChipsContainer: {
    paddingBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.card,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  notesContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
  }
});