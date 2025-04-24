import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { LineChart, BarChart } from 'react-native-chart-kit';

type AnalyticsData = {
  userGrowth: number[];
  noteUploads: number[];
  adViews: number[];
  earnings: number[];
  topSubjects: {
    subject: string;
    count: number;
  }[];
};

export default function AdminAnalytics() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const [userGrowth, noteUploads, adViews, earnings, topSubjects] = await Promise.all([
        // Get user growth (last 6 months)
        supabase.rpc('get_monthly_user_growth'),
        // Get note uploads (last 6 months)
        supabase.rpc('get_monthly_note_uploads'),
        // Get ad views (last 6 months)
        supabase.rpc('get_monthly_ad_views'),
        // Get earnings (last 6 months)
        supabase.rpc('get_monthly_earnings'),
        // Get top subjects
        supabase.rpc('get_top_subjects')
      ]);

      // Ensure we always have 6 values for monthly data, fill with 0 if missing
      const fillMonthlyData = (data: Array<number | null> = []) => {
        const filled = [...(data || [])];
        while (filled.length < 6) filled.push(0);
        return filled;
      };

      return {
        userGrowth: fillMonthlyData(userGrowth.data).map(v => Number(v) || 0),
        noteUploads: fillMonthlyData(noteUploads.data).map(v => Number(v) || 0),
        adViews: fillMonthlyData(adViews.data).map(v => Number(v) || 0),
        earnings: fillMonthlyData(earnings.data).map(v => Number(v) || 0),
        topSubjects: (topSubjects.data || []).map((s: { subject: string; count: number }) => ({
          subject: String(s.subject || 'Unknown'),
          count: Number(s.count) || 0
        })).slice(0, 5)
      } as AnalyticsData;
    }
  });

  // Ensure we have valid data for charts
  const safeData = {
    userGrowth: data?.userGrowth || [0, 0, 0, 0, 0, 0],
    noteUploads: data?.noteUploads || [0, 0, 0, 0, 0, 0],
    adViews: data?.adViews || [0, 0, 0, 0, 0, 0],
    earnings: data?.earnings || [0, 0, 0, 0, 0, 0],
    topSubjects: data?.topSubjects || []
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary
    }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const screenWidth = Dimensions.get('window').width - 40; // 40 for padding

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Analytics</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <View style={styles.content}>
          {/* User Growth Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>User Growth</Text>
            <LineChart
              data={{
                labels: months,
                datasets: [{
                  data: safeData.userGrowth
                }]
              }}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Note Uploads Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Note Uploads</Text>
            <LineChart
              data={{
                labels: months,
                datasets: [{
                  data: safeData.noteUploads
                }]
              }}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Ad Views Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Ad Views</Text>
            <LineChart
              data={{
                labels: months,
                datasets: [{
                  data: safeData.adViews
                }]
              }}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Earnings Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Earnings</Text>
            <LineChart
              data={{
                labels: months,
                datasets: [{
                  data: safeData.earnings
                }]
              }}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>

          {/* Top Subjects Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Top Subjects</Text>
            <BarChart
              data={{
                labels: safeData.topSubjects.map(s => s.subject.slice(0, 10)),
                datasets: [{
                  data: safeData.topSubjects.map(s => s.count)
                }]
              }}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              verticalLabelRotation={30}
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix=""
            />
          </View>
        </View>
      )}
    </ScrollView>
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
  content: {
    gap: 20,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: colors.text,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
