import React from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import {ChevronLeft, TrendingUp, DollarSign, Target, Clock} from 'lucide-react-native';

interface DetailedCampaignAnalyticsProps {
  onBack: () => void;
}

const PageHeader = ({title, onBack}: {title: string; onBack: () => void}) => (
  <View className="flex-row items-center gap-4 px-6 py-4 bg-white border-b border-slate-100">
    <TouchableOpacity onPress={onBack} className="p-2 rounded-full bg-[#FCE6F1]">
      <ChevronLeft size={20} color="#E60076" />
    </TouchableOpacity>
    <Text className="text-lg font-bold text-slate-800">{title}</Text>
  </View>
);

const CampaignCard = ({
  name,
  brand,
  status,
  earnings,
  engagement,
}: {
  name: string;
  brand: string;
  status: string;
  earnings: string;
  engagement: string;
}) => (
  <View className="bg-white rounded-2xl shadow-sm p-5 mb-4">
    <View className="flex-row justify-between items-start mb-3">
      <View className="flex-1">
        <Text className="text-base font-bold text-slate-800">{name}</Text>
        <Text className="text-sm text-slate-400 mt-1">{brand}</Text>
      </View>
      <View
        className={`px-3 py-1 rounded-full ${
          status === 'Active' ? 'bg-green-100' : 'bg-slate-100'
        }`}>
        <Text
          className={`text-xs font-semibold ${
            status === 'Active' ? 'text-green-600' : 'text-slate-500'
          }`}>
          {status}
        </Text>
      </View>
    </View>

    <View className="flex-row mt-2">
      <View className="flex-1 flex-row items-center">
        <DollarSign size={14} color="#E60076" />
        <Text className="text-sm text-slate-600 ml-1">{earnings}</Text>
      </View>
      <View className="flex-1 flex-row items-center">
        <TrendingUp size={14} color="#E60076" />
        <Text className="text-sm text-slate-600 ml-1">{engagement}</Text>
      </View>
    </View>
  </View>
);

const DetailedCampaignAnalytics: React.FC<DetailedCampaignAnalyticsProps> = ({onBack}) => {
  return (
    <View className="flex-1 bg-slate-50">
      <PageHeader title="Campaign Analytics" onBack={onBack} />

      <ScrollView className="flex-1 px-4 pt-6">
        {/* Summary Cards */}
        <View className="flex-row mb-6">
          <View className="flex-1 bg-white rounded-2xl shadow-sm p-4 mr-3 items-center">
            <View className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center mb-2">
              <Target size={18} color="#E60076" />
            </View>
            <Text className="text-xl font-bold text-slate-800">12</Text>
            <Text className="text-xs text-slate-500">Total Campaigns</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl shadow-sm p-4 mr-3 items-center">
            <View className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center mb-2">
              <Clock size={18} color="#E60076" />
            </View>
            <Text className="text-xl font-bold text-slate-800">3</Text>
            <Text className="text-xs text-slate-500">Active</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl shadow-sm p-4 items-center">
            <View className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center mb-2">
              <DollarSign size={18} color="#E60076" />
            </View>
            <Text className="text-xl font-bold text-slate-800">$4.2K</Text>
            <Text className="text-xs text-slate-500">Total Earned</Text>
          </View>
        </View>

        {/* Campaign List */}
        <Text className="px-2 pb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Campaigns
        </Text>

        <CampaignCard
          name="Summer Collection Promo"
          brand="Fashion Brand Co."
          status="Active"
          earnings="$1,200"
          engagement="12.4%"
        />
        <CampaignCard
          name="Skincare Launch"
          brand="Glow Beauty"
          status="Active"
          earnings="$850"
          engagement="9.8%"
        />
        <CampaignCard
          name="Fitness Challenge"
          brand="ActiveWear Plus"
          status="Completed"
          earnings="$2,150"
          engagement="15.2%"
        />

        <View className="h-8" />
      </ScrollView>
    </View>
  );
};

export {DetailedCampaignAnalytics};
export default DetailedCampaignAnalytics;
