import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { colors } from '@/constants/colors';
import { Bell, Send, Clock, Users, Target, History } from 'lucide-react-native';

type Notification = {
  id: string;
  title: string;
  message: string;
  target: string;
  scheduledFor: string;
  status: 'sent' | 'scheduled' | 'draft';
  sentTo?: number;
  openRate?: number;
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New UPSC Notes Available',
      message: 'Check out our latest notes for UPSC General Studies Paper I',
      target: 'UPSC Students',
      scheduledFor: '2025-04-23 15:00',
      status: 'sent',
      sentTo: 1500,
      openRate: 75,
    },
    {
      id: '2',
      title: 'Maintenance Update',
      message: 'The app will be under maintenance from 2 AM to 4 AM tomorrow',
      target: 'All Users',
      scheduledFor: '2025-04-24 10:00',
      status: 'scheduled',
    },
  ]);

  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    target: 'All Users',
    scheduledFor: '',
  });

  const handleSendNow = () => {
    if (newNotification.title && newNotification.message) {
      setNotifications(prev => [{
        id: Date.now().toString(),
        ...newNotification,
        status: 'sent',
        sentTo: 2500,
        openRate: 0,
      }, ...prev]);
      setNewNotification({ title: '', message: '', target: 'All Users', scheduledFor: '' });
    }
  };

  const handleSchedule = () => {
    if (newNotification.title && newNotification.message && newNotification.scheduledFor) {
      setNotifications(prev => [{
        id: Date.now().toString(),
        ...newNotification,
        status: 'scheduled',
      }, ...prev]);
      setNewNotification({ title: '', message: '', target: 'All Users', scheduledFor: '' });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Bell size={24} color={colors.primary} />
        <Text style={styles.headerText}>Notification Center</Text>
      </View>

      <Card style={styles.composeCard}>
        <Text style={styles.sectionTitle}>Compose Notification</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Notification Title"
            value={newNotification.title}
            onChangeText={(text) => setNewNotification(prev => ({ ...prev, title: text }))}
          />
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Notification Message"
            value={newNotification.message}
            onChangeText={(text) => setNewNotification(prev => ({ ...prev, message: text }))}
            multiline
            numberOfLines={4}
          />
          <TextInput
            style={styles.input}
            placeholder="Schedule Time (YYYY-MM-DD HH:mm)"
            value={newNotification.scheduledFor}
            onChangeText={(text) => setNewNotification(prev => ({ ...prev, scheduledFor: text }))}
          />
          <View style={styles.targetSelector}>
            <Text style={styles.targetLabel}>Target Audience:</Text>
            {['All Users', 'UPSC', 'NEET', 'JEE', 'Inactive Users'].map((target) => (
              <TouchableOpacity
                key={target}
                style={[
                  styles.targetChip,
                  newNotification.target === target && styles.targetChipSelected
                ]}
                onPress={() => setNewNotification(prev => ({ ...prev, target }))}
              >
                <Text style={[
                  styles.targetChipText,
                  newNotification.target === target && styles.targetChipTextSelected
                ]}>
                  {target}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.sendButton]} 
              onPress={handleSendNow}
            >
              <Send size={20} color={colors.white} />
              <Text style={styles.buttonText}>Send Now</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.scheduleButton]}
              onPress={handleSchedule}
            >
              <Clock size={20} color={colors.white} />
              <Text style={styles.buttonText}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      <View style={styles.notificationsList}>
        <Text style={styles.sectionTitle}>Recent Notifications</Text>
        {notifications.map(notification => (
          <Card key={notification.id} style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <View style={styles.notificationMeta}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <View style={[
                  styles.statusBadge,
                  styles[`status${notification.status}`]
                ]}>
                  <Text style={styles.statusText}>
                    {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.notificationTarget}>
                <Target size={14} color={colors.textSecondary} /> {notification.target}
              </Text>
            </View>

            <Text style={styles.notificationMessage}>{notification.message}</Text>

            <View style={styles.notificationFooter}>
              {notification.status === 'scheduled' ? (
                <View style={styles.scheduledTime}>
                  <Clock size={14} color={colors.primary} />
                  <Text style={styles.scheduledTimeText}>
                    Scheduled for: {notification.scheduledFor}
                  </Text>
                </View>
              ) : (
                <View style={styles.stats}>
                  <View style={styles.stat}>
                    <Users size={14} color={colors.success} />
                    <Text style={styles.statText}>
                      Sent to {notification.sentTo} users
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <History size={14} color={colors.info} />
                    <Text style={styles.statText}>
                      {notification.openRate}% open rate
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  composeCard: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  inputContainer: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
    color: colors.text,
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  targetSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 14,
    color: colors.text,
    marginRight: 8,
  },
  targetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  targetChipSelected: {
    backgroundColor: colors.primary,
  },
  targetChipText: {
    fontSize: 14,
    color: colors.text,
  },
  targetChipTextSelected: {
    color: colors.white,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  sendButton: {
    backgroundColor: colors.primary,
  },
  scheduleButton: {
    backgroundColor: colors.secondary,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    padding: 16,
    marginBottom: 12,
  },
  notificationHeader: {
    marginBottom: 12,
  },
  notificationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statussent: {
    backgroundColor: colors.success + '20',
  },
  statusscheduled: {
    backgroundColor: colors.warning + '20',
  },
  statusdraft: {
    backgroundColor: colors.secondary + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  notificationTarget: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  notificationFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  scheduledTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduledTimeText: {
    fontSize: 14,
    color: colors.primary,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: colors.text,
  },
});
