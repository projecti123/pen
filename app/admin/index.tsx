import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Card } from '../../components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { LineChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { 
  Users, BookOpen, DollarSign, TrendingUp, Bell, FileText, 
  AlertTriangle, CreditCard, ArrowRight, Home, Settings, 
  Shield, MessageCircle, BarChart2, BellRing, Flag,
  MonitorPlay, UserCog
} from 'lucide-react-native';

export default function AdminDashboard() {
  const router = useRouter();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const [
        { data: users },
        { data: notes },
        { data: ads }
      ] = await Promise.all([
        supabase.from('profiles').select('count').single(),
        supabase.from('notes').select('count').single(),
        supabase.from('ad_views').select('count').single()
      ]);

      return {
        users: users?.count || 0,
        notes: notes?.count || 0,
        ads: ads?.count || 0
      };
    }
  });

  const quickActions = [
    {
      title: 'Manage Users',
      onPress: () => router.push('/admin/users'),
      implemented: true,
      icon: Users,
      color: colors.primary
    },
    {
      title: 'Upload Notes',
      onPress: () => router.push('/admin/upload-notes'),
      implemented: true,
      icon: FileText,
      color: colors.success
    },
    {
      title: 'Review Reports',
      onPress: () => router.push('/admin/reports'),
      implemented: true,
      icon: AlertTriangle,
      color: colors.warning
    },
    {
      title: 'Send Notification',
      onPress: () => Alert.alert('Coming Soon', 'This feature will be available in the next update.'),
      implemented: false,
      icon: Bell,
      color: colors.info
    },
    {
      title: 'View Analytics',
      onPress: () => router.push('/admin/analytics'),
      implemented: true,
      icon: TrendingUp,
      color: colors.secondary
    },
    {
      title: 'Process Withdrawals',
      onPress: () => router.push('/admin/withdrawals'),
      implemented: true,
      icon: CreditCard,
      color: colors.error
    },
    {
      title: 'Ad Settings',
      description: 'Control ad settings and revenue',
      onPress: () => router.push('/admin/ads'),
      implemented: true,
      icon: MonitorPlay,
      color: colors.warning
    },
    {
      title: 'Content Moderation',
      description: 'Review flagged content',
      onPress: () => router.push('/admin/moderation'),
      implemented: true,
      icon: Flag,
      color: colors.error
    },
    {
      title: 'App Settings',
      description: 'Configure app features',
      onPress: () => router.push('/admin/settings'),
      implemented: true,
      icon: Settings,
      color: colors.primary
    },
    {
      title: 'Admin Roles',
      description: 'Manage admin permissions',
      onPress: () => router.push('/admin/roles'),
      implemented: true,
      icon: Shield,
      color: colors.success
    },
    {
      title: 'Telegram Groups',
      description: 'Manage community links',
      onPress: () => router.push('/admin/telegram'),
      implemented: true,
      icon: MessageCircle,
      color: colors.info
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.header}>Dashboard Overview</Text>
            <Text style={styles.subtitle}>Welcome back, Admin!</Text>
          </View>
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => router.push('/')}
          >
            <Home size={24} color={colors.primary} />
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <View style={styles.statsGrid}>
          <Card style={styles.statsCard}>
            <View style={styles.cardIcon}>
              <Users size={24} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Total Users</Text>
            <Text style={styles.cardValue}>{stats?.users || 0}</Text>
            <Text style={styles.cardTrend}>↑ 12% this month</Text>
          </Card>
          
          <Card style={styles.statsCard}>
            <View style={[styles.cardIcon, { backgroundColor: colors.success + '20' }]}>
              <BookOpen size={24} color={colors.success} />
            </View>
            <Text style={styles.cardTitle}>Total Notes</Text>
            <Text style={styles.cardValue}>{stats?.notes || 0}</Text>
            <Text style={styles.cardTrend}>↑ 8% this month</Text>
          </Card>
          
          <Card style={styles.statsCard}>
            <View style={[styles.cardIcon, { backgroundColor: colors.warning + '20' }]}>
              <DollarSign size={24} color={colors.warning} />
            </View>
            <Text style={styles.cardTitle}>Ad Revenue</Text>
            <Text style={styles.cardValue}>₹{(stats?.ads || 0) * 0.5}</Text>
            <Text style={styles.cardTrend}>↑ 15% this month</Text>
          </Card>
        </View>
      )}

      <View style={styles.charts}>
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleContainer}>
              <TrendingUp size={20} color={colors.primary} />
              <Text style={styles.chartTitle}>User Growth</Text>
            </View>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/admin/analytics')}
            >
              <Text style={styles.viewAllText}>View Analytics</Text>
              <ArrowRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <LineChart
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [{
                data: [20, 45, 78, 100, 143, 198]
              }]
            }}
            width={600}
            height={220}
            chartConfig={{
              backgroundColor: colors.card,
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: () => colors.text,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: colors.primary
              }
            }}
            bezier
            style={styles.chart}
          />
        </Card>
      </View>

      <View style={styles.quickActions}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSubtitle}>Manage your platform</Text>
        </View>
        <View style={styles.actionGrid}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <TouchableOpacity
                key={action.title}
                onPress={action.onPress}
                style={[
                  styles.actionCardWrapper,
                  !action.implemented && styles.actionCardDisabled
                ]}
              >
                <Card style={styles.actionCard}>
                  <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                    <Icon size={24} color={action.color} />
                  </View>
                  <View>
                    <Text style={[
                      styles.actionText,
                      !action.implemented && styles.actionTextDisabled
                    ]}>
                      {action.title}
                    </Text>
                    {action.description && (
                      <Text style={styles.actionDescription}>
                        {action.description}
                      </Text>
                    )}
                  </View>
                  {!action.implemented && (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Coming Soon</Text>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
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
  headerContainer: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  homeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  loader: {
    marginTop: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  statsCard: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    gap: 8,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  cardTrend: {
    fontSize: 12,
    color: colors.success,
  },
  charts: {
    marginBottom: 24,
  },
  chartCard: {
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCardWrapper: {
    width: '48%',
  },
  actionCard: {
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    gap: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionCardDisabled: {
    opacity: 0.7,
  },
  actionTextDisabled: {
    color: colors.textTertiary,
  },
  comingSoonBadge: {
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  comingSoonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
});
