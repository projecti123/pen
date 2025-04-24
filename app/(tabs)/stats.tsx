import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { useStatsStore } from '@/store/stats-store';
import { useEarningsStore } from '@/store/earnings-store';
import { colors } from '@/constants/colors';
import { BookOpen, Clock, Flame, Star, TrendingUp, Users, BookMarked } from 'lucide-react-native';

export default function StatsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { stats, isLoading: statsLoading, error: statsError, fetchStats } = useStatsStore();
  const { earnings, fetchEarnings } = useEarningsStore();
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [lastWeekEarnings, setLastWeekEarnings] = useState(0);

  useEffect(() => {
    if (user) {
      fetchStats(user.id);
      fetchEarnings();
      fetchWeeklyEarnings();
    }
  }, [user]);

  const fetchWeeklyEarnings = async () => {
    if (!user) return;

    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const { data: thisWeek } = await supabase
      .from('earnings_history')
      .select('amount')
      .eq('user_id', user.id)
      .gte('created_at', startOfWeek.toISOString())
      .lt('created_at', now.toISOString());

    const { data: lastWeek } = await supabase
      .from('earnings_history')
      .select('amount')
      .eq('user_id', user.id)
      .gte('created_at', startOfLastWeek.toISOString())
      .lt('created_at', startOfWeek.toISOString());

    setWeeklyEarnings(thisWeek?.reduce((sum, record) => sum + parseFloat(record.amount), 0) || 0);
    setLastWeekEarnings(lastWeek?.reduce((sum, record) => sum + parseFloat(record.amount), 0) || 0);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Please log in to view your stats</Text>
      </SafeAreaView>
    );
  }

  if (statsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (statsError) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{statsError}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Your Study Stats</Text>

        <View style={styles.streakCard}>
          <Flame size={24} color={colors.primary} />
          <Text style={styles.streakCount}>{stats?.studyStreak || 0}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
          {stats?.lastStudyDate && (
            <Text style={styles.lastStudied}>
              Last studied: {new Date(stats.lastStudyDate).toLocaleDateString()}
            </Text>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <BookOpen size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats?.totalDownloads || 0}</Text>
            <Text style={styles.statLabel}>Notes Studied</Text>
          </View>

          <View style={styles.statCard}>
            <TrendingUp size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats?.totalViews || 0}</Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </View>

          <View style={styles.statCard}>
            <Clock size={24} color={colors.primary} />
            <Text style={styles.statValue}>
              {stats?.averageStudyTime.toFixed(1) || '0'}
            </Text>
            <Text style={styles.statLabel}>Avg. Notes/Day</Text>
          </View>

          <View style={styles.statCard}>
            <BookMarked size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats?.totalWishlisted || 0}</Text>
            <Text style={styles.statLabel}>Wishlisted</Text>
          </View>
        </View>

        <View style={styles.earningsCard}>
          <Text style={styles.sectionTitle}>Earnings Overview</Text>
          
          <View style={styles.earningsOverview}>
            <View style={styles.earningsStat}>
              <Text style={styles.earningsLabel}>Total Earnings</Text>
              <Text style={[styles.earningsValue, { color: colors.success }]}>₹{earnings?.total.toFixed(2)}</Text>
            </View>

            <View style={styles.earningsStat}>
              <Text style={styles.earningsLabel}>This Week</Text>
              <Text 
                style={[styles.earningsValue, 
                  { color: weeklyEarnings >= lastWeekEarnings ? colors.success : colors.error }
                ]}
              >
                ₹{weeklyEarnings.toFixed(2)}
                {weeklyEarnings !== lastWeekEarnings && (
                  <Text style={styles.earningsDiff}>
                    {weeklyEarnings > lastWeekEarnings ? ' ↑' : ' ↓'}
                  </Text>
                )}
              </Text>
              <Text style={styles.earningsSubtext}>vs ₹{lastWeekEarnings.toFixed(2)} last week</Text>
            </View>

            <View style={styles.earningsStat}>
              <Text style={styles.earningsLabel}>Available</Text>
              <Text style={[styles.earningsValue, { color: colors.primary }]}>₹{earnings?.withdrawable.toFixed(2)}</Text>
              <TouchableOpacity 
                style={styles.withdrawButton}
                onPress={() => router.push('/earnings')}
              >
                <Text style={styles.withdrawButtonText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.earningsBreakdown}>
            <Text style={styles.breakdownTitle}>Earnings Breakdown</Text>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Ad Revenue</Text>
              <Text style={styles.breakdownValue}>₹{(earnings?.total - (earnings?.supportTips || 0)).toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Support Tips</Text>
              <Text style={styles.breakdownValue}>₹{(earnings?.supportTips || 0).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {stats?.mostStudiedSubjects && stats.mostStudiedSubjects.length > 0 && (
          <View style={styles.subjectsCard}>
            <Text style={styles.sectionTitle}>Most Studied Subjects</Text>
            {stats.mostStudiedSubjects.map((subject, index) => (
              <View key={subject.subject} style={styles.subjectRow}>
                <Text style={styles.subjectName}>{subject.subject}</Text>
                <Text style={styles.subjectCount}>{subject.count} notes</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface EarningsRecord {
  amount: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
    paddingBottom: 80, // Add extra padding for tab bar
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginTop: 20,
  },
  streakCard: {
    backgroundColor: '#2A2A3C',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  streakCount: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 8,
  },
  streakLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  lastStudied: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#2A2A3C',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '47%',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  subjectsCard: {
    backgroundColor: '#2A2A3C',
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subjectName: {
    fontSize: 16,
    color: colors.text,
  },
  subjectCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  earningsCard: {
    backgroundColor: '#2A2A3C',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  earningsOverview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  earningsStat: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  earningsDiff: {
    fontSize: 16,
    fontWeight: '600',
  },
  earningsSubtext: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  withdrawButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  earningsBreakdown: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  breakdownLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
