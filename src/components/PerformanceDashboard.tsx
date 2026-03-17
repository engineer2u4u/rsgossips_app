import React from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
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
          YOUR PLAN THIS MONTH
        </Text>

        <Text className="text-4xl font-bold">
          26x <Text className="text-green-600">Return</Text>
        </Text>

        <Text className="text-slate-500 mt-1">
          Excellent performance on your ₹699 Pro plan.
        </Text>

        <View className="flex-row items-center mt-3 bg-green-100 px-3 py-1 rounded-full self-start">
          <ArrowUpRight size={14} color="#16A34A" />
          <Text className="text-green-700 text-xs ml-1">
            +340% growth compared to last month
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
          title="Total Earnings"
          value="₹2,00,000"
          growth="+12.5%"
          positive
        />

        <MetricCard
          icon={<Users size={18} color="#2563EB" />}
          title="Total Followers"
          value="5.2M"
          growth="+5.2%"
          positive
        />

        <MetricCard
          positive={false}
          icon={<Eye size={18} color="#9333EA" />}
          title="Profile Views"
          value="15.4K"
          growth="-2.1%"
        />

        <MetricCard
          icon={<Activity size={18} color="#DB2777" />}
          title="Avg Engagement"
          value="8.5%"
          growth="+1.2%"
          positive
        />
      </View>

      {/* EARNINGS CHART */}
      <View className="bg-white rounded-3xl p-6 mb-6">
        <Text className="text-lg font-semibold mb-1">Earnings Overview</Text>

        <Text className="text-xs text-slate-400 mb-4">
          Your revenue growth over time
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
        <Text className="text-white opacity-70 text-xs">Available Balance</Text>

        <Text className="text-white text-3xl font-bold mt-1">₹1,50,000</Text>

        <Pressable className="mt-4 bg-gradient-to-r from-pink-500 to-purple-600 py-3 rounded-xl">
          <LinearGradient
            colors={['#9810fa', '#e60076']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-3.5 rounded-2xl items-center"
            style={{
              borderRadius: 16,
              paddingBottom: 14,
              paddingTop: 14,
            }}
          >
            <Text className="text-center text-white font-bold">
              Withdraw Funds →
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* ACTIONS */}
      <View className="bg-white rounded-3xl p-6">
        <Text className="font-bold mb-4">Today</Text>

        <ActionItem title="Submit BoAt Reel" sub="overdue" alert />

        <ActionItem
          alert={false}
          title="Reply to Mamaearth"
          sub="brief clarification"
        />
      </View>
    </ScrollView>
  );
}

function MetricCard({ icon, title, value, growth, positive }) {
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

function ActionItem({ title, sub, alert }) {
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
          {alert ? 'Upload' : 'Reply'}
        </Text>
      </Pressable>
    </View>
  );
}
