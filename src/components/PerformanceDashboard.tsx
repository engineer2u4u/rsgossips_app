import React from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LineChart } from 'react-native-chart-kit';
import {
  DollarSign,
  Users,
  Eye,
  Activity,
  ArrowUpRight,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

const screenWidth = Dimensions.get('window').width;

export default function PerformanceDashboard() {
  const { t } = useTranslation();
  const miniChart = {
    labels: ['1', '2', '3', '4', '5', '6', '7'],
    datasets: [{ data: [3, 4, 3.8, 6, 5.8, 8.5, 11] }],
  };

  const earningsChart = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ data: [12000, 18000, 15000, 24000, 22000, 30000, 28000] }],
  };

  return (
    <ScrollView className="flex-1 bg-[#F7F7FB] px-4 py-6">
      {/* TOP CARD */}
      <View className="bg-white rounded-3xl p-6 mb-6">
        <Text className="text-xs text-slate-500 font-semibold mb-2">
          {t('PerformanceDashboard.yourPlanThisMonth')}
        </Text>

        <Text className="text-4xl font-bold">
          26x <Text className="text-green-600">{t('PerformanceDashboard.return')}</Text>
        </Text>

        <Text className="text-slate-500 mt-1">
          {t('PerformanceDashboard.planPerformance')}
        </Text>

        <View className="flex-row items-center mt-3 bg-green-100 px-3 py-1 rounded-full self-start">
          <ArrowUpRight size={14} color="#16A34A" />
          <Text className="text-green-700 text-xs ml-1">
            {t('PerformanceDashboard.growthComparison')}
          </Text>
        </View>

        {/* Mini Chart */}
        <LineChart
          data={miniChart}
          width={screenWidth - 60}
          height={120}
          withDots={false}
          withInnerLines={false}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={false}
          chartConfig={{
            color: () => '#6366F1',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
          }}
          style={{ marginTop: 20 }}
        />
      </View>

      {/* METRICS */}
      <View className="flex-row flex-wrap justify-between mb-6">
        <MetricCard
          icon={<DollarSign size={18} color="#16A34A" />}
          title={t('PerformanceDashboard.totalEarnings')}
          value="₹2,00,000"
          growth="+12.5%"
          positive
        />

        <MetricCard
          icon={<Users size={18} color="#2563EB" />}
          title={t('PerformanceDashboard.totalFollowers')}
          value="5.2M"
          growth="+5.2%"
          positive
        />

        <MetricCard
          positive={false}
          icon={<Eye size={18} color="#9333EA" />}
          title={t('PerformanceDashboard.profileViews')}
          value="15.4K"
          growth="-2.1%"
        />

        <MetricCard
          icon={<Activity size={18} color="#DB2777" />}
          title={t('PerformanceDashboard.avgEngagement')}
          value="8.5%"
          growth="+1.2%"
          positive
        />
      </View>

      {/* EARNINGS CHART */}
      <View className="bg-white rounded-3xl p-6 mb-6">
        <Text className="text-lg font-semibold mb-1">{t('PerformanceDashboard.earningsOverview')}</Text>

        <Text className="text-xs text-slate-400 mb-4">
          {t('PerformanceDashboard.revenueGrowth')}
        </Text>

        <LineChart
          data={earningsChart}
          width={screenWidth - 60}
          height={220}
          bezier
          withDots={false}
          withInnerLines={false}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={false}
          chartConfig={{
            color: () => '#EC4899',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
          }}
        />
      </View>

      {/* BALANCE CARD */}
      <View className="bg-slate-900 rounded-3xl p-6 mb-6">
        <Text className="text-white opacity-70 text-xs">{t('PerformanceDashboard.availableBalance')}</Text>

        <Text className="text-white text-3xl font-bold mt-1">₹1,50,000</Text>

        <Pressable
          className="mt-4 rounded-2xl overflow-hidden items-center justify-center"
          style={{paddingTop: 14, paddingBottom: 14}}
        >
          <LinearGradient
            colors={['#9810fa', '#e60076']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
          />
          <Text className="text-center text-white font-bold">
            {t('PerformanceDashboard.withdrawFunds')}
          </Text>
        </Pressable>
      </View>

      {/* ACTIONS */}
      <View className="bg-white rounded-3xl p-6">
        <Text className="font-bold mb-4">{t('PerformanceDashboard.today')}</Text>

        <ActionItem
          title={t('PerformanceDashboard.submitBoatReel')}
          sub={t('PerformanceDashboard.overdue')}
          alert
        />

        <ActionItem
          alert={false}
          title={t('PerformanceDashboard.replyMamaearth')}
          sub={t('PerformanceDashboard.briefClarification')}
        />
      </View>
    </ScrollView>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  growth: string;
  positive: boolean;
}

function MetricCard({ icon, title, value, growth, positive }: MetricCardProps) {
  return (
    <View className="bg-white w-[48%] rounded-2xl p-4 mb-4">
      <View className="flex-row justify-between">
        {icon}

        <Text
          className={`text-[10px] font-bold px-2 py-1 rounded-full ${
            positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
          }`}
        >
          {growth}
        </Text>
      </View>

      <Text className="text-xs text-slate-400 mt-2">{title}</Text>

      <Text className="text-xl font-bold text-slate-800">{value}</Text>
    </View>
  );
}

interface ActionItemProps {
  title: string;
  sub: string;
  alert?: boolean;
}

function ActionItem({ title, sub, alert }: ActionItemProps) {
  const { t } = useTranslation();
  return (
    <View className="flex-row justify-between items-center mb-3">
      <View>
        <Text className="text-xs font-bold text-slate-700">{title}</Text>

        <Text className="text-[10px] text-slate-400">{sub}</Text>
      </View>

      <Pressable
        className={`px-4 py-1 rounded-full ${
          alert ? 'bg-red-500' : 'border border-slate-200'
        }`}
      >
        <Text
          className={`text-[10px] font-bold ${
            alert ? 'text-white' : 'text-slate-600'
          }`}
        >
          {alert ? t('PerformanceDashboard.upload') : t('PerformanceDashboard.reply')}
        </Text>
      </Pressable>
    </View>
  );
}
