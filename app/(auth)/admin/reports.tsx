import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react-native';

type Report = {
  id: string;
  user_id: string;
  reported_id: string;
  type: 'note' | 'user' | 'comment';
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: {
    name: string;
    username: string;
  };
  reported?: {
    name: string;
    username: string;
  };
};

export default function AdminReports() {
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:user_id(name, username),
          reported:reported_id(name, username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Report[];
    }
  });

  const resolveReportMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'resolve' | 'dismiss' }) => {
      const { error } = await supabase
        .from('reports')
        .update({ status: action === 'resolve' ? 'resolved' : 'dismissed' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    }
  });

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'resolved':
        return colors.success;
      case 'dismissed':
        return colors.error;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review Reports</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <ScrollView style={styles.reportsList}>
          {reports?.map((report) => (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.reportType}>
                  <AlertTriangle size={20} color={colors.warning} />
                  <Text style={styles.reportTypeText}>{report.type}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                    {report.status}
                  </Text>
                </View>
              </View>

              <View style={styles.reportContent}>
                <Text style={styles.reportReason}>{report.reason}</Text>
                
                <View style={styles.userInfo}>
                  <Text style={styles.userLabel}>Reporter:</Text>
                  <Text style={styles.userName}>{report.reporter?.name}</Text>
                  <Text style={styles.userUsername}>@{report.reporter?.username}</Text>
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userLabel}>Reported:</Text>
                  <Text style={styles.userName}>{report.reported?.name}</Text>
                  <Text style={styles.userUsername}>@{report.reported?.username}</Text>
                </View>
              </View>

              {report.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.resolveButton]}
                    onPress={() => resolveReportMutation.mutate({ id: report.id, action: 'resolve' })}
                  >
                    <CheckCircle size={20} color={colors.success} />
                    <Text style={[styles.actionText, { color: colors.success }]}>Resolve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionButton, styles.dismissButton]}
                    onPress={() => resolveReportMutation.mutate({ id: report.id, action: 'dismiss' })}
                  >
                    <XCircle size={20} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  loader: {
    marginTop: 40,
  },
  reportsList: {
    flex: 1,
  },
  reportCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  reportContent: {
    gap: 12,
  },
  reportReason: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  userUsername: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resolveButton: {
    backgroundColor: colors.success + '10',
  },
  dismissButton: {
    backgroundColor: colors.error + '10',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
