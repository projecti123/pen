import React, { useState } from 'react';
import { Button } from './Button';
import { AdModal } from './AdModal';
import { useNotesStore } from '@/store/notes-store';
import { useEarningsStore } from '@/store/earnings-store';
import { Platform, Linking, View, TouchableOpacity, Text, StyleSheet, Modal } from 'react-native';
import { colors } from '@/constants/colors';
import { Download, Coffee } from 'lucide-react-native';
import { Input } from './Input';

interface NoteDownloadButtonProps {
  noteId: string;
  noteName: string;
  fileUrl: string;
  creatorId: string;
}

export const NoteDownloadButton: React.FC<NoteDownloadButtonProps> = ({
  noteId,
  noteName,
  fileUrl,
  creatorId
}) => {
  const [showAd, setShowAd] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const { downloadNote } = useNotesStore();
  const { addEarning } = useEarningsStore();

  const handleDownload = () => {
    setShowAd(true);
  };

  const handleAdComplete = async () => {
    try {
      setIsDownloading(true);
      
      // First update stats in Supabase
      await downloadNote(noteId);

      // Then handle the download
      await handleFileDownload();
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileDownload = async () => {
    try {
      // Get the signed URL from the downloadNote function
      const signedUrl = await downloadNote(noteId);
      
      // If we got a signed URL, open it
      if (signedUrl) {
        // On web, open in new tab
        if (Platform.OS === 'web') {
          window.open(signedUrl, '_blank');
        } else {
          // On mobile, open with system viewer
          const supported = await Linking.canOpenURL(signedUrl);
          if (supported) {
            await Linking.openURL(signedUrl);
          } else {
            throw new Error('Cannot open URL');
          }
        }
      }
    } catch (error) {
      throw new Error('Failed to download file: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleTip = async () => {
    try {
      const amount = parseFloat(tipAmount);
      if (isNaN(amount) || amount <= 0) {
        console.error('Invalid amount');
        return;
      }

      await addEarning({
        amount,
        type: 'support_tip',
        noteId
      });

      setShowTipModal(false);
      setTipAmount('');
    } catch (error) {
      console.error('Tip failed:', error);
    }
  };

  return (
    <>
      <AdModal
        visible={showAd}
        onClose={() => setShowAd(false)}
        onAdComplete={handleAdComplete}
        noteId={noteId}
        noteName={noteName}
      />
      <View style={styles.container}>
        <Button
          title={isDownloading ? "Downloading..." : "Download"}
          onPress={handleDownload}
          isLoading={isDownloading}
          icon={<Download size={20} color={colors.text} />}
        />
        <Button
          title="Buy me a coffee"
          onPress={() => setShowTipModal(true)}
          variant="secondary"
          style={styles.tipButton}
          icon={<Coffee size={20} color={colors.primary} />}
        />
      </View>

      <Modal
        visible={showTipModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTipModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Support the Creator</Text>
            <Text style={styles.modalSubtitle}>Buy them a coffee to show your appreciation!</Text>

            <Input
              label="Amount (₹)"
              value={tipAmount}
              onChangeText={setTipAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
            />

            <View style={styles.modalButtons}>
              <Button 
                title="Cancel" 
                onPress={() => setShowTipModal(false)} 
                style={styles.modalButton}
                variant="secondary"
              />
              <Button 
                title="Send Tip" 
                onPress={handleTip} 
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipButton: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButton: {
    minWidth: 100,
    marginLeft: 8,
  },
});
