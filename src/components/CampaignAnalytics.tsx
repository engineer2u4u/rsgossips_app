// Mobile parity port of D:/Development/React/RS_Gossips
// src/components/CampaignAnalytics.jsx (mobile branch). Mirrors the same
// six sections with the same dummy values:
//   1. Header with back + title
//   2. 4-grid stats (Total Campaigns, Active, Total Views, Total Earnings)
//   3. Campaign Performance bar chart
//   4. Platform Distribution doughnut
//   5. Performance by Category progress bars
//   6. Recent Campaigns list (one card per campaign)

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import {
  ChevronLeft,
  Target,
  Activity,
  Eye,
  DollarSign,
} from 'lucide-react-native';
import {BarChart, PieChart} from 'react-native-chart-kit';

interface DetailedCampaignAnalyticsProps {
  onBack: () => void;
}

const {width: SCREEN_W} = Dimensions.get('window');
const CHART_W = SCREEN_W - 32 - 24; // page padding (16 each side) + card padding (12 each side)

const PageHeader = ({title, onBack}: {title: string; onBack: () => void}) => (
  <View
    className="flex-row items-center px-6 py-4 bg-white border-b border-slate-100"
    style={{gap: 16}}>
    <TouchableOpacity onPress={onBack} className="p-2 rounded-2xl bg-pink-50">
      <ChevronLeft size={20} color="#EC4899" strokeWidth={3} />
    </TouchableOpacity>
    <Text className="text-lg font-black text-slate-900 tracking-tight">
      {title}
    </Text>
  </View>
);

function StatMiniCard({
  icon,
  label,
  value,
  trend,
  iconBg,
  trendColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  iconBg: string;
  trendColor: string;
}) {
  return (
    <View
      className="bg-white p-4 rounded-xl border border-slate-100 flex-row items-center"
      style={{
        gap: 10,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 2},
        elevation: 2,
      }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-[10px] font-black text-pink-400 uppercase tracking-tighter">
          {label}
        </Text>
        <Text className="text-xl font-black text-gray-900">{value}</Text>
        <Text className="text-[9px] font-bold mt-0.5" style={{color: trendColor}}>
          {trend}
        </Text>
      </View>
    </View>
  );
}

function CategoryProgress({
  label,
  count,
  value,
  progressPct,
}: {
  label: string;
  count: string;
  value: string;
  progressPct: number;
}) {
  return (
    <View style={{gap: 6}}>
      <View className="flex-row justify-between items-end">
        <View>
          <Text className="text-[11px] font-black text-gray-900">{label}</Text>
          <Text className="text-[9px] font-bold text-gray-400">{count}</Text>
        </View>
        <Text className="text-[10px] font-black text-pink-500">{value}</Text>
      </View>
      <View className="w-full h-2 bg-pink-100 rounded-full overflow-hidden">
        <View
          style={{
            height: '100%',
            width: `${progressPct}%`,
            backgroundColor: '#EC4899',
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
}

function CampaignItem({
  title,
  date,
  status,
  views,
  engagement,
  revenue,
  statusBg,
  statusFg,
}: {
  title: string;
  date: string;
  status: string;
  views: string;
  engagement: string;
  revenue: string;
  statusBg: string;
  statusFg: string;
}) {
  return (
    <View
      className="bg-white p-5 rounded-xl border border-gray-100"
      style={{
        gap: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 2},
        elevation: 2,
      }}>
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-2">
          <Text className="text-sm font-black text-gray-900">{title}</Text>
          <Text className="text-[10px] font-bold text-gray-400 mt-0.5">
            {date}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: statusBg,
          }}>
          <Text
            className="text-[9px] font-black uppercase tracking-wider"
            style={{color: statusFg}}>
            {status}
          </Text>
        </View>
      </View>
      <View className="flex-row" style={{gap: 8}}>
        <StatBox label="Views" value={views} />
        <StatBox label="Engagement" value={engagement} />
        <StatBox label="Revenue" value={revenue} valueColor="#EC4899" />
      </View>
    </View>
  );
}

function StatBox({
  label,
  value,
  valueColor = '#0F172A',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View
      className="flex-1 bg-gray-50 p-3 rounded-2xl border border-gray-100 items-center">
      <Text className="text-[8px] font-black text-gray-400 uppercase">
        {label}
      </Text>
      <Text
        className="text-[11px] font-black mt-1"
        style={{color: valueColor}}>
        {value}
      </Text>
    </View>
  );
}

const DetailedCampaignAnalytics: React.FC<DetailedCampaignAnalyticsProps> = ({
  onBack,
}) => {
  // Same labels/values web uses in the mobile branch.
  const barLabels = ['Nike', 'Spotify', 'Sephora', 'Disney', 'Netflix'];
  const barValues = [2000, 1500, 2500, 1100, 1800];

  const platformData = [
    {
      name: 'Instagram',
      population: 45,
      color: '#EC4899',
      legendFontColor: '#1F2937',
      legendFontSize: 11,
    },
    {
      name: 'TikTok',
      population: 25,
      color: '#8b5cf6',
      legendFontColor: '#1F2937',
      legendFontSize: 11,
    },
    {
      name: 'YouTube',
      population: 20,
      color: '#ef4444',
      legendFontColor: '#1F2937',
      legendFontSize: 11,
    },
    {
      name: 'Other',
      population: 10,
      color: '#64748b',
      legendFontColor: '#1F2937',
      legendFontSize: 11,
    },
  ];

  return (
    <View className="flex-1" style={{backgroundColor: '#F9FAFB'}}>
      <PageHeader title="Campaign Analytics" onBack={onBack} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          gap: 20,
          paddingBottom: Platform.OS === 'ios' ? 60 : 40,
        }}
        showsVerticalScrollIndicator={false}>
        {/* 1. 4-grid stats — same shape + values as web mobile branch */}
        <View className="flex-row flex-wrap" style={{gap: 12}}>
          <View style={{width: '48%'}}>
            <StatMiniCard
              icon={<Target size={16} color="#fff" />}
              label="Total Campaigns"
              value="12"
              trend="+3 this month"
              iconBg="#EC4899"
              trendColor="#EC4899"
            />
          </View>
          <View style={{width: '48%'}}>
            <StatMiniCard
              icon={<Activity size={16} color="#fff" />}
              label="Active"
              value="5"
              trend="In progress"
              iconBg="#34D399"
              trendColor="#34D399"
            />
          </View>
          <View style={{width: '48%'}}>
            <StatMiniCard
              icon={<Eye size={16} color="#fff" />}
              label="Total Views"
              value="850K"
              trend="+15%"
              iconBg="#8b5cf6"
              trendColor="#EC4899"
            />
          </View>
          <View style={{width: '48%'}}>
            <StatMiniCard
              icon={<DollarSign size={16} color="#fff" />}
              label="Total Earnings"
              value="$24.5K"
              trend="+20%"
              iconBg="#EC4899"
              trendColor="#EC4899"
            />
          </View>
        </View>

        {/* 2. Campaign Performance bar chart */}
        <View
          className="bg-white p-4 rounded-xl border border-gray-100"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 8,
            shadowOffset: {width: 0, height: 2},
            elevation: 2,
          }}>
          <Text className="font-black text-gray-900 text-[13px] mb-4">
            Campaign Performance
          </Text>
          <BarChart
            data={{labels: barLabels, datasets: [{data: barValues}]}}
            width={CHART_W}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            withInnerLines={false}
            withHorizontalLabels={false}
            fromZero
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: () => '#EC4899',
              labelColor: () => '#EC4899',
              barPercentage: 0.7,
              propsForLabels: {fontWeight: 'bold', fontSize: 10},
            }}
            style={{borderRadius: 12, marginLeft: -16}}
          />
        </View>

        {/* 3. Platform Distribution doughnut */}
        <View
          className="bg-white p-4 rounded-xl border border-gray-100"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 8,
            shadowOffset: {width: 0, height: 2},
            elevation: 2,
          }}>
          <Text className="font-black text-gray-900 text-[13px] mb-4 text-center">
            Platform Distribution
          </Text>
          <PieChart
            data={platformData}
            width={CHART_W}
            height={200}
            chartConfig={{
              color: () => '#000',
              labelColor: () => '#1F2937',
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="10"
            hasLegend
          />
        </View>

        {/* 4. Performance by Category progress bars */}
        <View
          className="bg-white p-5 rounded-xl border border-gray-100"
          style={{
            gap: 18,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 8,
            shadowOffset: {width: 0, height: 2},
            elevation: 2,
          }}>
          <Text className="font-black text-gray-900 text-[13px]">
            Performance by Category
          </Text>
          <CategoryProgress
            label="Fashion"
            count="4 campaigns"
            value="$90,500"
            progressPct={90}
          />
          <CategoryProgress
            label="Beauty"
            count="3 campaigns"
            value="$35,200"
            progressPct={60}
          />
          <CategoryProgress
            label="Tech"
            count="2 campaigns"
            value="$65,300"
            progressPct={75}
          />
          <CategoryProgress
            label="Lifestyle"
            count="3 campaigns"
            value="$54,100"
            progressPct={65}
          />
        </View>

        {/* 5. Recent Campaigns list */}
        <View style={{gap: 16}}>
          <Text className="font-black text-gray-900 text-[13px] px-1">
            Recent Campaigns
          </Text>
          <CampaignItem
            title="Nike Summer Launch"
            date="Jan 10 - Jan 31"
            status="Completed"
            views="45K"
            engagement="12.5%"
            revenue="$2,500"
            statusBg="#DBEAFE"
            statusFg="#3B82F6"
          />
          <CampaignItem
            title="Spotify Playlist Series"
            date="Jan 15 - Feb 5"
            status="Active"
            views="11K"
            engagement="8.8%"
            revenue="$1,800"
            statusBg="#D1FAE5"
            statusFg="#10B981"
          />
          <CampaignItem
            title="Sephora Tutorial"
            date="Feb 1 - Feb 10"
            status="Active"
            views="8K"
            engagement="7.2%"
            revenue="$1,200"
            statusBg="#D1FAE5"
            statusFg="#10B981"
          />
        </View>
      </ScrollView>
    </View>
  );
};

export {DetailedCampaignAnalytics};
export default DetailedCampaignAnalytics;
