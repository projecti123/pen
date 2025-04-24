import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { colors } from '@/constants/colors';
import { Flag, CheckCircle, XCircle, MessageCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type ContentReport = {
  id: string;
  content_type: string;
  content_id: string;
  content_title: string;
  reason: string;
  reporter_id: string;
  resolved_by?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  resolution_note?: string;
  created_at: string;
  updated_at: string;
};

export default function ContentModeration() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('content_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setReports(data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reports';
      console.error('Error fetching reports:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId: string, action: 'resolved' | 'dismissed') => {
    try {
      const { error: updateError } = await supabase
        .rpc('manage_content_report', {
          p_report_id: reportId,
          p_status: action,
          p_resolution_note: action === 'resolved' ? 'Content reviewed and approved' : 'Report dismissed',
          p_resolver_id: user?.id
        });

      if (updateError) throw updateError;

      // Refresh reports list
      fetchReports();
      Alert.alert('Success', `Report ${action} successfully`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update report';
      console.error('Error updating report:', errorMessage);
      Alert.alert('Error', errorMessage);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading reports...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const pendingReports = reports.filter(r => r.status === 'pending');
  const resolvedToday = reports.filter(r => {
    const today = new Date().toISOString().split('T')[0];
    return r.status === 'resolved' && r.updated_at.startsWith(today);
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Flag size={24} color={colors.primary} />
        <Text style={styles.headerText}>Content Moderation</Text>
      </View>

      <Card style={styles.statsCard}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Pending Reports</Text>
          <Text style={styles.statValue}>{pendingReports.length}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Resolved Today</Text>
          <Text style={styles.statValue}>{resolvedToday.length}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Total Reports</Text>
          <Text style={styles.statValue}>{reports.length}</Text>
        </View>
      </Card>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        {reports.map((report) => (
          <Card key={report.id} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={styles.reportType}>
                <Flag size={16} color={colors.warning} />
                <Text style={styles.reportTypeText}>{report.content_type}</Text>
              </View>
              <Text style={styles.reportDate}>
                {new Date(report.created_at).toLocaleDateString()}
              </Text>
            </View>

            <Text style={styles.reportTitle}>
              {report.content_type}: {report.content_title}
            </Text>
            <Text style={styles.reportReason}>
              Reason: {report.reason}
            </Text>
            <Text style={[styles.reportedBy, 
              report.status === 'resolved' ? styles.resolvedText :
              report.status === 'dismissed' ? styles.dismissedText :
              styles.pendingText
            ]}>
              Status: {report.status.toUpperCase()}
            </Text>

            {report.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleResolve(report.id, 'resolved')}
                >
                  <CheckCircle size={20} color={colors.success} />
                  <Text style={[styles.actionText, styles.approveText]}>
                    Approve
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleResolve(report.id, 'dismissed')}
                >
                  <XCircle size={20} color={colors.error} />
                  <Text style={[styles.actionText, styles.rejectText]}>
                    Reject
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
  resolvedText: {
    color: colors.success,
  },
  dismissedText: {
    color: colors.error,
  },
  pendingText: {
    color: colors.warning,
  },
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
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  reportCard: {
    marginBottom: 16,
    padding: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportTypeText: {
    fontSize: 14,
    color: colors.warning,
    textTransform: 'capitalize',
  },
  reportDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  reportReason: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  reportContent: {
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reportedBy: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: colors.success + '10',
  },
  rejectButton: {
    backgroundColor: colors.error + '10',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  approveText: {
    color: colors.success,
  },
  rejectText: {
    color: colors.error,
  },
});
