import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useStickyNotesStore } from '@/store/sticky-notes-store';
import StickyNote from './StickyNote';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { BlurView } from 'expo-blur';

const noteColors = [
  '#FFD700', // Yellow
  '#98FB98', // Light Green
  '#87CEEB', // Sky Blue
  '#DDA0DD', // Plum
  '#F08080', // Light Coral
];

export function FloatingStickyNotes() {
  const { notes, isVisible, toggleVisibility, addNote, deleteNote, updateNote } = useStickyNotesStore();

  const handleAddNote = () => {
    const randomColor = noteColors[Math.floor(Math.random() * noteColors.length)];
    addNote({
      id: Math.random().toString(),
      content: '',
      color: randomColor,
      position: {
        x: Math.random() * 100,
        y: Math.random() * 100,
      },
    });
  };

  if (!isVisible) {
    return (
      <TouchableOpacity 
        style={styles.toggleButton} 
        onPress={toggleVisibility}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialCommunityIcons name="notebook" size={32} color={colors.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Quick Notes</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              onPress={handleAddNote}
              style={styles.addButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={toggleVisibility}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="close" size={24} color="#FF4444" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.notesContainer}>
          {notes.map(note => (
            <StickyNote
              key={note.id}
              {...note}
              floating={true}
              onDelete={deleteNote}
              onUpdate={updateNote}
            />
          ))}
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(103, 58, 183, 0.85)',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  addButton: {
    padding: 4,
  },
  notesContainer: {
    flex: 1,
    paddingTop: 16,
  },
});
