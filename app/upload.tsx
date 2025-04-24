import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth-store';
import { useNotesStore } from '@/store/notes-store';
import { mockCategories } from '@/mocks/categories';
import { mockClasses } from '@/mocks/classes';
import { mockBoards } from '@/mocks/boards';

export default function UploadScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { uploadNote, isLoading } = useNotesStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [board, setBoard] = useState('');
  const [topic, setTopic] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'image' | 'doc'>('pdf');
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setThumbnailUri(result.assets[0].uri);
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!subject.trim()) newErrors.subject = 'Subject is required';
    if (!classLevel.trim()) newErrors.classLevel = 'Class/Exam is required';
    if (!topic.trim()) newErrors.topic = 'Topic is required';
    if (!thumbnailUri) newErrors.thumbnail = 'Thumbnail image is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleUpload = async () => {
    if (!validateForm() || !user) return;
    
    try {
      await uploadNote({
        title,
        description,
        subject,
        class: classLevel,
        board,
        topic,
        fileType,
        fileUrl: 'https://example.com/sample.pdf', // Mock URL
        thumbnailUrl: thumbnailUri || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8',
        uploaderId: user.id,
        uploaderName: user.name,
        uploaderAvatar: user.avatar,
      });
      
      Alert.alert(
        "Upload Successful",
        "Your note has been uploaded successfully!",
        [
          { 
            text: "View My Profile", 
            onPress: () => router.replace('/profile')
          },
          {
            text: "Upload Another",
            onPress: () => {
              // Reset form
              setTitle('');
              setDescription('');
              setSubject('');
              setClassLevel('');
              setBoard('');
              setTopic('');
              setThumbnailUri(null);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert("Upload Failed", "There was an error uploading your note. Please try again.");
    }
  };
  
  const handleFileUpload = () => {
    Alert.alert(
      "Demo Limitation",
      "In this demo version, actual file uploads are not supported. In a production app, this would open a file picker to select PDF or DOCX files.",
      [{ text: "OK" }]
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Upload Study Note</Text>
          <Text style={styles.subtitle}>Share your knowledge and earn rewards</Text>
        </View>
        
        <View style={styles.form}>
          <Input
            label="Title"
            placeholder="Enter a descriptive title"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
          />
          
          <Input
            label="Description"
            placeholder="Describe what your notes cover"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            error={errors.description}
          />
          
          <Text style={styles.label}>Subject</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.optionsContainer}
          >
            {mockCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.optionItem,
                  subject === category.name && { backgroundColor: `${category.color}20` }
                ]}
                onPress={() => setSubject(category.name)}
              >
                <Text 
                  style={[
                    styles.optionText,
                    subject === category.name && { color: category.color, fontWeight: '600' }
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
          
          <Text style={styles.label}>Class/Exam</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.optionsContainer}
          >
            {mockClasses.map((classItem) => (
              <TouchableOpacity
                key={classItem.id}
                style={[
                  styles.optionItem,
                  classLevel === classItem.name && { backgroundColor: `${colors.secondary}20` }
                ]}
                onPress={() => setClassLevel(classItem.name)}
              >
                <Text 
                  style={[
                    styles.optionText,
                    classLevel === classItem.name && { color: colors.secondary, fontWeight: '600' }
                  ]}
                >
                  {classItem.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors.classLevel && <Text style={styles.errorText}>{errors.classLevel}</Text>}
          
          <Text style={styles.label}>Board (Optional)</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.optionsContainer}
          >
            {mockBoards.map((boardItem) => (
              <TouchableOpacity
                key={boardItem.id}
                style={[
                  styles.optionItem,
                  board === boardItem.name && { backgroundColor: '#F0F0F020' }
                ]}
                onPress={() => setBoard(boardItem.name)}
              >
                <Text 
                  style={[
                    styles.optionText,
                    board === boardItem.name && { color: colors.text, fontWeight: '600' }
                  ]}
                >
                  {boardItem.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Input
            label="Topics Covered"
            placeholder="E.g., Mechanics, Thermodynamics"
            value={topic}
            onChangeText={setTopic}
            error={errors.topic}
          />
          
          <Text style={styles.label}>File Type</Text>
          <View style={styles.fileTypeContainer}>
            <TouchableOpacity
              style={[
                styles.fileTypeItem,
                fileType === 'pdf' && styles.fileTypeSelected
              ]}
              onPress={() => setFileType('pdf')}
            >
              <FileText 
                size={24} 
                color={fileType === 'pdf' ? colors.primary : colors.textSecondary} 
              />
              <Text 
                style={[
                  styles.fileTypeText,
                  fileType === 'pdf' && styles.fileTypeTextSelected
                ]}
              >
                PDF
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.fileTypeItem,
                fileType === 'image' && styles.fileTypeSelected
              ]}
              onPress={() => setFileType('image')}
            >
              <ImageIcon 
                size={24} 
                color={fileType === 'image' ? colors.primary : colors.textSecondary} 
              />
              <Text 
                style={[
                  styles.fileTypeText,
                  fileType === 'image' && styles.fileTypeTextSelected
                ]}
              >
                Image
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.fileTypeItem,
                fileType === 'doc' && styles.fileTypeSelected
              ]}
              onPress={() => setFileType('doc')}
            >
              <FileText 
                size={24} 
                color={fileType === 'doc' ? colors.primary : colors.textSecondary} 
              />
              <Text 
                style={[
                  styles.fileTypeText,
                  fileType === 'doc' && styles.fileTypeTextSelected
                ]}
              >
                DOC
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.label}>Upload File</Text>
          <TouchableOpacity 
            style={styles.fileUploadButton}
            onPress={handleFileUpload}
          >
            <Upload size={24} color={colors.textSecondary} />
            <Text style={styles.fileUploadText}>
              {fileType === 'pdf' ? 'Upload PDF File' : 
               fileType === 'doc' ? 'Upload DOC/DOCX File' : 
               'Upload Image File'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.demoNote}>
            Note: In this demo version, actual file uploads are not supported.
          </Text>
          
          <Text style={styles.label}>Thumbnail Image</Text>
          {thumbnailUri ? (
            <View style={styles.thumbnailContainer}>
              <Image source={{ uri: thumbnailUri }} style={styles.thumbnailImage} />
              <TouchableOpacity 
                style={styles.removeThumbnailButton}
                onPress={() => setThumbnailUri(null)}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.thumbnailPicker}
              onPress={pickImage}
            >
              <Upload size={24} color={colors.textSecondary} />
              <Text style={styles.thumbnailPickerText}>Upload Thumbnail</Text>
            </TouchableOpacity>
          )}
          {errors.thumbnail && <Text style={styles.errorText}>{errors.thumbnail}</Text>}
          
          <Button
            title="Upload Note"
            onPress={handleUpload}
            isLoading={isLoading}
            style={styles.uploadButton}
            icon={<Upload size={20} color="#FFFFFF" />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 80, // Add extra padding for tab bar
  },
  header: {
    padding: 20,
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
  },
  form: {
    padding: 20,
    paddingTop: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 12,
  },
  optionsContainer: {
    paddingBottom: 8,
  },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginRight: 8,
  },
  optionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -4,
    marginBottom: 16,
  },
  fileTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  fileTypeItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    marginHorizontal: 4,
  },
  fileTypeSelected: {
    backgroundColor: `${colors.primary}15`,
  },
  fileTypeText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  fileTypeTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  fileUploadButton: {
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    flexDirection: 'row',
    gap: 8,
  },
  fileUploadText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  demoNote: {
    fontSize: 14,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: 24,
  },
  thumbnailPicker: {
    height: 160,
    borderRadius: 12,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  thumbnailPickerText: {
    marginTop: 8,
    fontSize: 16,
    color: colors.textSecondary,
  },
  thumbnailContainer: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeThumbnailButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    marginBottom: 24,
  },
});