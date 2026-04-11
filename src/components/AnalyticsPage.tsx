import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Eye,
  Heart,
  Users,
  DollarSign,
  BarChart3,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../context/AuthContext';
import BottomNav from './BottomNav';

interface Props {
  onBack: () => void;
  onCampaignAnalytics: () => void;
}

function formatCount(n: number | undefined) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

const AnalyticsPage: React.FC<Props> = ({onBack, onCampaignAnalytics}) => {
  const {profile} = useAuth();
  const [timeRange, setTimeRange] = useState('Last 30 Days');

  const followers = profile?.followers_count || 0;
  const engagement = profile?.engagement_rate || 0;

  const stats = [
    {
      icon: Eye,
      label: 'Total Views',
      value: formatCount(profile?.total_impressions || followers * 2),
      change: '+12%',
      color: '#10B981',
      bg: '#F0FDF4',
      iconBg: '#10B981',
    },
    {
      icon: Heart,
      label: 'Engagement',
      value: `${engagement || 8.5}%`,
      change: '+2.3%',
      color: '#EC4899',
      bg: '#FDF2F8',
      iconBg: '#EC4899',
    },
    {
      icon: Users,
      label: 'Followers',
      value: formatCount(followers || 125000),
      change: '+5.2K',
      color: '#3B82F6',
      bg: '#EFF6FF',
      iconBg: '#3B82F6',
    },
    {
      icon: DollarSign,
      label: 'Revenue',
      value: '$12.4K',
      change: '+23%',
      color: '#10B981',
      bg: '#F0FDF4',
      iconBg: '#10B981',
    },
  ];

  // Mini chart data points
  const chartPoints = [20, 25, 22, 35, 30, 55, 50, 70, 65, 85, 80, 95];

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-5 py-4" style={{gap: 12}}>
        <TouchableOpacity
          onPress={onBack}
          className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center">
          <ChevronLeft size={20} color="#E60076" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-800">Analytics</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Trending Up Header */}
        <View className="px-5 mb-5">
          <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            Total Performance
          </Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center" style={{gap: 8}}>
              <Text className="text-2xl">📈</Text>
              <Text className="text-2xl font-black text-[#1A1A1A]">Trending Up</Text>
            </View>
            <TouchableOpacity className="flex-row items-center bg-white border border-slate-200 px-3 py-2 rounded-full" style={{gap: 4}}>
              <Text className="text-xs font-semibold text-slate-600">{timeRange}</Text>
              <ChevronDown size={14} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid 2x2 */}
        <View className="px-5 flex-row flex-wrap" style={{gap: 10}}>
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <View
                key={stat.label}
                style={{width: '48%', backgroundColor: stat.bg}}
                className="p-4 rounded-2xl border border-white">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                  style={{backgroundColor: stat.iconBg}}>
                  <Icon size={20} color="white" />
                </View>
                <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  {stat.label}
                </Text>
                <View className="flex-row items-baseline mt-1" style={{gap: 6}}>
                  <Text className="text-xl font-black text-[#1A1A1A]">
                    {stat.value}
                  </Text>
                  <Text className="text-[10px] font-bold" style={{color: stat.color}}>
                    {stat.change}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Monthly Earnings Chart */}
        <View className="mx-5 mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-base font-black text-[#1A1A1A]">Monthly Earnings</Text>
            <View className="flex-row items-center" style={{gap: 4}}>
              <View className="w-3 h-3 bg-emerald-500 rounded" />
              <Text className="text-[10px] font-bold text-emerald-500">+23%</Text>
            </View>
          </View>

          {/* Simple chart visualization */}
          <View className="h-32 flex-row items-end justify-between mb-3" style={{gap: 2}}>
            {chartPoints.map((h, i) => (
              <View key={i} className="flex-1 items-center">
                <View
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${h}%`,
                    backgroundColor: i >= chartPoints.length - 3 ? '#10B981' : '#D1FAE5',
                  }}
                />
              </View>
            ))}
          </View>

          {/* X-axis labels */}
          <View className="flex-row justify-between px-1">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => (
              <Text key={m} className="text-[9px] text-gray-400 font-medium">{m}</Text>
            ))}
          </View>
        </View>

        {/* Audience Demographics */}
        <View className="mx-5 mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <Text className="text-base font-black text-[#1A1A1A] mb-4">
            Audience Demographics
          </Text>

          {/* Gender Distribution */}
          <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Gender Distribution
          </Text>
          <View style={{gap: 8}}>
            {[
              {label: 'Female', pct: profile?.audience_demographics?.gender?.female || 62, color: '#A855F7'},
              {label: 'Male', pct: profile?.audience_demographics?.gender?.male || 35, color: '#3B82F6'},
              {label: 'Other', pct: profile?.audience_demographics?.gender?.other || 3, color: '#F59E0B'},
            ].map(g => (
              <View key={g.label}>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs font-semibold text-slate-600">{g.label}</Text>
                  <Text className="text-xs font-bold text-slate-800">{g.pct}%</Text>
                </View>
                <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <View className="h-full rounded-full" style={{width: `${g.pct}%`, backgroundColor: g.color}} />
                </View>
              </View>
            ))}
          </View>

          {/* Age Distribution */}
          <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-5 mb-3">
            Age Distribution
          </Text>
          <View style={{gap: 8}}>
            {(profile?.audience_demographics?.ageRanges || [
              {range: '18-24', pct: 35},
              {range: '25-34', pct: 40},
              {range: '35-44', pct: 18},
              {range: '45+', pct: 7},
            ]).map((a: any) => (
              <View key={a.range}>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs font-semibold text-slate-600">{a.range}</Text>
                  <Text className="text-xs font-bold text-slate-800">{a.pct}%</Text>
                </View>
                <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <LinearGradient
                    colors={['#8B5CF6', '#EC4899']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={{width: `${a.pct}%`, height: '100%', borderRadius: 100}}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Campaign Analytics Button */}
        <TouchableOpacity
          onPress={onCampaignAnalytics}
          className="mx-5 mt-6 mb-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex-row items-center"
          style={{gap: 14}}>
          <View className="w-12 h-12 bg-purple-50 rounded-xl items-center justify-center">
            <BarChart3 size={22} color="#8B5CF6" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-[#1A1A1A]">Campaign Analytics</Text>
            <Text className="text-[11px] text-gray-400 font-medium">Detailed campaign performance</Text>
          </View>
          <ChevronRight size={18} color="#CBD5E1" />
        </TouchableOpacity>

        <View className="h-24" />
      </ScrollView>

      {/* Bottom Nav */}
      <View className="absolute bottom-0 left-0 right-0">
        <BottomNav />
      </View>
    </View>
  );
};

export default AnalyticsPage;
