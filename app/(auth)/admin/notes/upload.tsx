import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AdminNotesUpload() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Notes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
