import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth-store';
import { useNotesStore } from '@/store/notes-store';
import { supabase } from '@/lib/supabase';
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
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; type: string; file?: File } | null>(null);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [uploadButtonText, setUploadButtonText] = useState('Select PDF file');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Update button text when file type changes
  useEffect(() => {
    setUploadButtonText(`Select ${fileType.toUpperCase()} file`);
  }, [fileType]);

  // Clear errors when input changes
  const handleInputChange = (field: string, value: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    switch (field) {
      case 'title':
        setTitle(value);
        break;
      case 'description':
        setDescription(value);
        break;
      case 'subject':
        setSubject(value);
        break;
      case 'classLevel':
        setClassLevel(value);
        break;
      case 'board':
        setBoard(value);
        break;
      case 'topic':
        setTopic(value);
        break;
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setThumbnailUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
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
    if (!selectedFile) newErrors.file = 'PDF or DOCX file is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const renderSelectedFile = () => {
    if (!selectedFile) return null;

    return (
      <View style={styles.selectedFileContainer}>
        <View style={styles.selectedFileContent}>
          <FileText size={24} color={colors.primary} />
          <View style={styles.selectedFileInfo}>
            <Text style={styles.selectedFileName} numberOfLines={1}>{selectedFile.name}</Text>
            <Text style={styles.selectedFileType}>{fileType.toUpperCase()}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setSelectedFile(null)}>
          <X size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  const handleFileUpload = async () => {
    if (uploadInProgress) return;
    
    try {
      setUploadInProgress(true);
      setUploadButtonText('Selecting file...');
      console.log('Starting document picker...');
      
      // Configure document picker options based on file type
      const pickerOptions = {
        type: fileType === 'pdf' ? ['application/pdf'] : 
              fileType === 'doc' ? ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] :
              ['image/*'],
        multiple: false,
        copyToCacheDirectory: true
      };

      const result = await DocumentPicker.getDocumentAsync(pickerOptions);
      console.log('Document picker result:', result);

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('Selected file details:', {
          name: asset.name,
          uri: asset.uri,
          mimeType: asset.mimeType,
          size: asset.size
        });

        // Validate file type
        const validTypes = {
          pdf: ['application/pdf'],
          doc: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          image: ['image/jpeg', 'image/png', 'image/jpg']
        };

        const mimeType = asset.mimeType || '';
        if (!validTypes[fileType].includes(mimeType)) {
          throw new Error(`Invalid file type. Please select a ${fileType.toUpperCase()} file.`);
        }

        // For web platform, get the File object directly
        if (Platform.OS === 'web' && result.output) {
          const file = result.output[0];
          console.log('Web file object:', file);
          setSelectedFile({
            uri: URL.createObjectURL(file),
            name: file.name,
            type: file.type,
            file: file
          });
        } else {
          setSelectedFile({
            uri: asset.uri,
            name: asset.name,
            type: mimeType
          });
        }

        console.log('File state updated');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to pick document. Please try again.');
      setSelectedFile(null);
    } finally {
      setUploadInProgress(false);
      // Reset button text based on current state
      setUploadButtonText(selectedFile ? selectedFile.name : `Select ${fileType.toUpperCase()} file`);
    }
  };

  const uploadFileToSupabase = async (uri: string, path: string, file?: File) => {
    try {
      console.log('Starting file upload to Supabase...');
      console.log('Path:', path);

      let data;
      let error;

      if (Platform.OS === 'web' && file) {
        // Web upload
        ({ data, error } = await supabase.storage
          .from('notes')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: true
          }));
      } else {
        // Native upload
        const response = await fetch(uri);
        const blob = await response.blob();
        ({ data, error } = await supabase.storage
          .from('notes')
          .upload(path, blob, {
            cacheControl: '3600',
            upsert: true
          }));
      }

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      const { data: { publicUrl } } = await supabase.storage
        .from('notes')
        .getPublicUrl(path);

      console.log('Generated public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      if (error instanceof Error) {
        Alert.alert('Upload Error', error.message);
      } else {
        Alert.alert('Upload Error', 'Failed to upload file');
      }
      throw error;
    }
  };

  const handleSubmit = async () => {
    console.log('Starting submission process...');
    
    if (!user) {
      Alert.alert('Error', 'You must be logged in to upload notes');
      return;
    }
    
    console.log('User:', user.id);
    console.log('Selected file:', selectedFile);
    
    if (!validateForm()) {
      return;
    }

    try {
      setUploadInProgress(true);

      // Upload main file
      console.log('Uploading main file...');
      const timestamp = Date.now();
      const filePath = `${user.id}/${timestamp}-${selectedFile!.name}`;
      console.log('File path:', filePath);

      const fileUrl = await uploadFileToSupabase(
        selectedFile!.uri,
        filePath,
        selectedFile!.file
      );

      // Upload thumbnail
      const thumbnailPath = `${user.id}/thumbnail-${Date.now()}.jpg`;
      const thumbnailUrl = await uploadFileToSupabase(thumbnailUri!, thumbnailPath);

      // Create note in database
      const { error } = await supabase.from('notes').insert({
        title,
        description,
        subject,
        class: classLevel,
        board,
        topic,
        file_type: fileType,
        file_url: fileUrl,
        thumbnail_url: thumbnailUrl,
        uploader_id: user.id
      });

      if (error) {
        throw error;
      }

      // Reset form
      setTitle('');
      setDescription('');
      setSubject('');
      setClassLevel('');
      setBoard('');
      setTopic('');
      setSelectedFile(null);
      setThumbnailUri(null);
      setErrors({});

      // Show success alert and navigate
      Alert.alert(
        'Upload Successful! 🎉',
        'Your note has been uploaded and is now available for others to view.',
        [
          {
            text: 'View Profile',
            onPress: () => {
              router.push('/(tabs)/profile');
            },
            style: 'default'
          },
          {
            text: 'Upload Another',
            style: 'cancel'
          }
        ]
      );

    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'Failed to upload note. Please try again.');
    } finally {
      setUploadInProgress(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
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
            keyboardType="default"
          />
          
          <Input
            label="Description"
            placeholder="Describe what your notes cover"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            error={errors.description}
            keyboardType="default"
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
              onPress={() => !uploadInProgress && setFileType('pdf')}
              disabled={uploadInProgress || isLoading}
            >
              <View style={styles.iconWrapper}>
                <FileText 
                  size={24} 
                  color={fileType === 'pdf' ? colors.primary : colors.textSecondary} 
                />
              </View>
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
              onPress={() => !uploadInProgress && setFileType('image')}
              disabled={uploadInProgress || isLoading}
            >
              <View style={styles.iconWrapper}>
                <ImageIcon 
                  size={24} 
                  color={fileType === 'image' ? colors.primary : colors.textSecondary} 
                />
              </View>
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
              onPress={() => !uploadInProgress && setFileType('doc')}
              disabled={uploadInProgress || isLoading}
            >
              <View style={styles.iconWrapper}>
                <FileText 
                  size={24} 
                  color={fileType === 'doc' ? colors.primary : colors.textSecondary} 
                />
              </View>
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
          {renderSelectedFile()}
          <TouchableOpacity 
            style={[
              styles.fileUploadButton,
              (uploadInProgress || isLoading) && styles.fileUploadButtonDisabled
            ]}
            onPress={handleFileUpload}
            disabled={uploadInProgress || isLoading}
          >
            <View style={styles.iconWrapper}>
              <Upload size={24} color={uploadInProgress || isLoading ? colors.textTertiary : colors.textSecondary} />
            </View>
            <Text style={[
              styles.fileUploadText,
              (uploadInProgress || isLoading) && { color: colors.textTertiary }
            ]}>
              {uploadButtonText}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.label}>Thumbnail Image</Text>
          {thumbnailUri ? (
            <View style={styles.thumbnailContainer}>
              <Image source={{ uri: thumbnailUri }} style={styles.thumbnailImage} />
              <TouchableOpacity 
                style={styles.removeThumbnailButton}
                onPress={() => setThumbnailUri(null)}
              >
                <View style={styles.iconWrapper}>
                  <X size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.thumbnailPicker}
              onPress={pickImage}
            >
              <View style={styles.iconWrapper}>
                <Upload size={24} color={colors.textSecondary} />
              </View>
              <Text style={styles.thumbnailPickerText}>Upload Thumbnail</Text>
            </TouchableOpacity>
          )}
          {errors.thumbnail && <Text style={styles.errorText}>{errors.thumbnail}</Text>}
          
          <Button
            title={isLoading ? 'Uploading...' : 'Upload Note'}
            onPress={handleSubmit}
            isLoading={isLoading}
            style={styles.uploadButton}
            variant="primary"
            icon={<View style={styles.iconWrapper}><Upload size={20} color="#FFFFFF" /></View>}
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    flex: 1,
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
  fileUploadButtonDisabled: {
    opacity: 0.6,
  },
  fileUploadText: {
    fontSize: 16,
    color: colors.textSecondary,
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
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  selectedFileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  selectedFileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  selectedFileName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  selectedFileType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});