import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  MapPin,
  Calendar,
  Instagram,
  Youtube,
  DollarSign,
  FileText,
  ChevronRight,
  Eye,
  BarChart3,
  Award,
  Zap,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

type Campaign = {
  id: string | number;
  initials?: string;
  title: string;
  brandName: string;
  status: string;
  tags: string[];
  budget: string;
  deadline?: string;
  daysLeft?: string;
  deliverables: string;
  location: string;
  platforms: string[];
};

interface Props {
  campaign: Campaign;
  matchScore?: number;
}

export function CampaignCard({campaign, matchScore = 0}: Props) {
  const navigation = useNavigation<any>();
  const isActive = campaign.status === 'Active';
  const isApplied = campaign.status === 'Applied';
  const isCompleted = campaign.status === 'Completed';

  const statusStyles: Record<string, {bg: string; text: string}> = {
    Active: {bg: 'bg-[#00BA88]', text: 'text-white'},
    Applied: {bg: 'bg-[#4E82EE]', text: 'text-white'},
    Completed: {bg: 'bg-slate-200', text: 'text-slate-600'},
  };

  const status = statusStyles[campaign.status] || statusStyles.Active;

  const scoreColor =
    matchScore >= 80
      ? {text: 'text-emerald-500', bg: 'bg-emerald-50', color: '#10B981'}
      : matchScore >= 60
        ? {text: 'text-amber-500', bg: 'bg-amber-50', color: '#F59E0B'}
        : {text: 'text-slate-400', bg: 'bg-slate-50', color: '#94A3B8'};

  return (
    <View className="bg-white rounded-[32px] p-5 border border-slate-50 shadow-sm" style={{gap: 16}}>
      {/* Header */}
      <View className="flex-row items-start justify-between">
        <View className="flex-row" style={{gap: 12}}>
          <LinearGradient
            colors={['#60A5FA', '#6366F1']}
            className="w-12 h-12 rounded-2xl items-center justify-center">
            <Text className="text-white text-sm font-bold">
              {campaign.initials || campaign.title.substring(0, 2).toUpperCase()}
            </Text>
          </LinearGradient>
          <View>
            <View className="flex-row items-center" style={{gap: 4}}>
              <Text
                className="font-bold text-slate-800 max-w-[160px]"
                numberOfLines={1}>
                {campaign.title}
              </Text>
              <Award size={14} color="#F59E0B" />
            </View>
            <Text className="text-[11px] text-slate-400 font-medium">
              {campaign.brandName}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center" style={{gap: 6}}>
          {matchScore > 0 && (
            <View
              className={`flex-row items-center px-2 py-1 rounded-lg ${scoreColor.bg}`}
              style={{gap: 3}}>
              <Zap size={10} color={scoreColor.color} />
              <Text className={`text-[10px] font-black ${scoreColor.text}`}>
                {matchScore}%
              </Text>
            </View>
          )}
          <View className={`${status.bg} px-3 py-1 rounded-lg`}>
            <Text
              className={`text-[10px] font-bold ${status.text} uppercase tracking-wider`}>
              {campaign.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Tags + Platforms */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row" style={{gap: 6}}>
          {campaign.tags.map(tag => (
            <View
              key={tag}
              className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
              <Text className="text-[10px] font-bold text-slate-500">
                {tag}
              </Text>
            </View>
          ))}
        </View>
        <View className="flex-row" style={{gap: 6}}>
          {campaign.platforms.includes('instagram') && (
            <Instagram size={18} color="#E60076" />
          )}
          {campaign.platforms.includes('youtube') && (
            <Youtube size={18} color="#FF0000" />
          )}
        </View>
      </View>

      {/* Data Grid 2x2 */}
      <View className="flex-row flex-wrap" style={{gap: 8}}>
        <View className="flex-1 min-w-[45%] p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
          <View className="flex-row items-center mb-1" style={{gap: 4}}>
            <DollarSign size={10} color="#00BA88" />
            <Text className="text-[9px] font-bold text-slate-400 uppercase">
              Budget
            </Text>
          </View>
          <Text className="text-xs font-bold text-[#00BA88]">
            {campaign.budget}
          </Text>
        </View>

        <View className="flex-1 min-w-[45%] p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
          <View className="flex-row items-center mb-1" style={{gap: 4}}>
            <Calendar size={10} color="#3B82F6" />
            <Text className="text-[9px] font-bold text-slate-400 uppercase">
              Deadline
            </Text>
          </View>
          <Text className="text-xs font-bold text-slate-800">
            {campaign.deadline || '—'}
            {campaign.daysLeft && (
              <Text className="text-[9px] text-red-500">
                {' '}
                {campaign.daysLeft} left
              </Text>
            )}
          </Text>
        </View>

        <View className="flex-1 min-w-[45%] p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
          <View className="flex-row items-center mb-1" style={{gap: 4}}>
            <FileText size={10} color="#9810FA" />
            <Text className="text-[9px] font-bold text-slate-400 uppercase">
              Deliverables
            </Text>
          </View>
          <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
            {campaign.deliverables}
          </Text>
        </View>

        <View className="flex-1 min-w-[45%] p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
          <View className="flex-row items-center mb-1" style={{gap: 4}}>
            <MapPin size={10} color="#F97316" />
            <Text className="text-[9px] font-bold text-slate-400 uppercase">
              Location
            </Text>
          </View>
          <Text className="text-xs font-bold text-slate-800">
            {campaign.location}
          </Text>
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('InfluencerOfferDetail', {id: campaign.id})}>
        <LinearGradient
          colors={['#9810FA', '#E60076']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={{borderRadius: 16, height: 48}}
          className="flex-row items-center justify-center">
          {isActive && (
            <>
              <Text className="text-white font-bold text-sm">Apply Now</Text>
              <ChevronRight size={16} color="white" style={{marginLeft: 4}} />
            </>
          )}
          {isApplied && (
            <>
              <Eye size={16} color="white" style={{marginRight: 8}} />
              <Text className="text-white font-bold text-sm">View Status</Text>
              <ChevronRight size={16} color="white" style={{marginLeft: 4}} />
            </>
          )}
          {isCompleted && (
            <>
              <BarChart3 size={16} color="white" style={{marginRight: 8}} />
              <Text className="text-white font-bold text-sm">
                Full Analytics
              </Text>
              <ChevronRight size={16} color="white" style={{marginLeft: 4}} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
