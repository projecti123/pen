import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth-store';

const classes = [
  { id: 'class10', name: 'Class 10' },
  { id: 'class11', name: 'Class 11' },
  { id: 'class12', name: 'Class 12' },
  { id: 'btech', name: 'B.Tech' },
  { id: 'bcom', name: 'B.Com' },
  { id: 'bsc', name: 'B.Sc' },
  { id: 'upsc', name: 'UPSC' },
  { id: 'jee', name: 'JEE' },
  { id: 'neet', name: 'NEET' },
  { id: 'ca', name: 'CA/CS' },
  { id: 'ssc', name: 'SSC' },
  { id: 'cuet', name: 'CUET' }
];

const subjects = [
  { id: 'physics', name: 'Physics' },
  { id: 'chemistry', name: 'Chemistry' },
  { id: 'biology', name: 'Biology' },
  { id: 'mathematics', name: 'Mathematics' },
  { id: 'history', name: 'History' },
  { id: 'geography', name: 'Geography' },
  { id: 'literature', name: 'Literature' },
  { id: 'economics', name: 'Economics' },
  { id: 'computer_science', name: 'Computer Science' }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setInterests, setSubjects: setUserSubjects } = useAuthStore();
  const [step, setStep] = useState(1);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleClassToggle = (classId: string) => {
    setSelectedClasses(prev => {
      if (prev.includes(classId)) {
        return prev.filter(id => id !== classId);
      } else {
        return [...prev, classId];
      }
    });
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  const handleNext = () => {
    if (selectedClasses.length === 0) {
      return; // Show error or alert
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleComplete = async () => {
    if (selectedSubjects.length === 0) {
      return; // Show error or alert
    }

    setIsLoading(true);
    try {
      await Promise.all([
        setInterests(selectedClasses),
        setUserSubjects(selectedSubjects)
      ]);
      router.push('/(tabs)');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      // Show error toast or alert here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.stepText}>Step {step} of 2</Text>
          <Text style={styles.title}>
            {step === 1 ? 'What are you studying?' : 'Select your subjects'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1 
              ? 'Choose your classes or exams'
              : 'Pick the subjects you\'re interested in'
            }
          </Text>
        </View>

        <View style={styles.grid}>
          {step === 1 ? (
            classes.map((classItem) => (
              <TouchableOpacity
                key={classItem.id}
                style={[
                  styles.card,
                  selectedClasses.includes(classItem.id) && styles.selectedCard
                ]}
                onPress={() => handleClassToggle(classItem.id)}
              >
                <Text style={[
                  styles.cardText,
                  selectedClasses.includes(classItem.id) && styles.selectedCardText
                ]}>
                  {classItem.name}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            subjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                style={[
                  styles.card,
                  selectedSubjects.includes(subject.id) && styles.selectedCard
                ]}
                onPress={() => handleSubjectToggle(subject.id)}
              >
                <Text style={[
                  styles.cardText,
                  selectedSubjects.includes(subject.id) && styles.selectedCardText
                ]}>
                  {subject.name}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.buttonContainer}>
          {step === 1 ? (
            <Button
              title="Next"
              onPress={handleNext}
              disabled={selectedClasses.length === 0}
              style={styles.button}
            />
          ) : (
            <>
              <Button
                title="Complete"
                onPress={handleComplete}
                isLoading={isLoading}
                disabled={selectedSubjects.length === 0}
                style={styles.button}
              />
              <TouchableOpacity onPress={handleBack}>
                <Text style={styles.backButton}>Go Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  stepText: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 32,
  },
  card: {
    width: '45%',
    margin: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  selectedCardText: {
    color: colors.white,
  },
  buttonContainer: {
    marginTop: 'auto',
  },
  button: {
    marginBottom: 16,
  },
  backButton: {
    color: colors.primary,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});