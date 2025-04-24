import React, { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { CustomBannerAd } from './CustomBannerAd';

export const AdTester = () => {
  const [subject, setSubject] = useState<string | undefined>(undefined);
  const [className, setClassName] = useState<string | undefined>(undefined);

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology'];
  const classes = ['Class 11', 'Class 12'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ad Tester</Text>
      
      <View style={styles.controls}>
        <Text style={styles.subtitle}>Subject:</Text>
        <View style={styles.buttonGroup}>
          <Button title="All" onPress={() => setSubject(undefined)} />
          {subjects.map(s => (
            <Button
              key={s}
              title={s}
              onPress={() => setSubject(s)}
            />
          ))}
        </View>

        <Text style={styles.subtitle}>Class:</Text>
        <View style={styles.buttonGroup}>
          <Button title="All" onPress={() => setClassName(undefined)} />
          {classes.map(c => (
            <Button
              key={c}
              title={c}
              onPress={() => setClassName(c)}
            />
          ))}
        </View>
      </View>

      <View style={styles.adContainer}>
        <Text style={styles.currentSettings}>
          Current Settings:{'\n'}
          Subject: {subject || 'All'}{'\n'}
          Class: {className || 'All'}
        </Text>
        
        <CustomBannerAd
          subject={subject}
          className={className}
          style={styles.ad}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  controls: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  adContainer: {
    flex: 1,
  },
  currentSettings: {
    fontSize: 14,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  ad: {
    marginBottom: 16,
  },
});
