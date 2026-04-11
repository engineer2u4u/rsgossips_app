import React from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import {CheckCircle, Star, Users, Zap, Instagram} from 'lucide-react-native';

type Brand = {
  id: string | number;
  name: string;
  category: string;
  minBudget?: number;
  maxBudget?: number;
  isVerified?: boolean;
  platforms?: string[];
  activeCampaigns?: number;
  rating?: number;
  followers?: string;
  logo?: string;
  payout?: string;
};

interface Props {
  brand: Brand;
  matchScore?: number;
}

export default function BrandCard({brand, matchScore = 0}: Props) {
  const scoreColor =
    matchScore >= 80
      ? {text: 'text-emerald-500', bg: 'bg-emerald-50'}
      : matchScore >= 60
        ? {text: 'text-amber-500', bg: 'bg-amber-50'}
        : {text: 'text-slate-400', bg: 'bg-slate-50'};

  return (
    <TouchableOpacity
      className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-md"
      activeOpacity={0.7}
      style={{shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4}}>
      {/* Match Score Badge */}
      {matchScore > 0 && (
        <View
          className={`absolute top-5 right-5 z-10 flex-row items-center px-2.5 py-1 rounded-lg ${scoreColor.bg}`}
          style={{gap: 4}}>
          <Zap size={12} color={matchScore >= 80 ? '#10B981' : matchScore >= 60 ? '#F59E0B' : '#94A3B8'} />
          <Text
            className={`text-[11px] font-black ${scoreColor.text}`}>
            {matchScore}%
          </Text>
        </View>
      )}

      {/* Logo + Name */}
      <View className="items-center mb-4">
        <View className="w-20 h-20 rounded-2xl bg-[#F8F9FD] items-center justify-center p-4 mb-4 overflow-hidden">
          {brand.logo ? (
            <Image
              source={{uri: brand.logo}}
              className="w-full h-full"
              resizeMode="contain"
            />
          ) : (
            <Text className="text-2xl font-black text-slate-300">
              {brand.name?.[0]}
            </Text>
          )}
        </View>

        <View className="flex-row items-center justify-center" style={{gap: 4}}>
          <Text className="text-lg font-bold text-slate-800" numberOfLines={1}>
            {brand.name}
          </Text>
          {brand.isVerified && (
            <CheckCircle size={16} color="#1DA1F2" />
          )}
        </View>
        <Text className="text-xs text-slate-400 font-medium mt-1">
          {brand.category}
        </Text>
      </View>

      {/* Stats */}
      <View className="w-full mb-6" style={{gap: 12}}>
        <View className="flex-row justify-between items-center">
          <Text className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">
            Active Campaigns
          </Text>
          <Text className="text-sm font-bold text-slate-800">
            {brand.activeCampaigns || 0}
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">
            Avg Payout
          </Text>
          <Text className="text-sm font-bold text-[#00BA88]">
            {brand.payout || '—'}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between pt-4 border-t border-slate-50">
        <View className="flex-row items-center" style={{gap: 6}}>
          <Star size={16} color="#F59E0B" fill="#F59E0B" />
          <Text className="text-xs font-bold text-slate-700">
            {brand.rating || '—'}
          </Text>
        </View>
        <View className="flex-row items-center" style={{gap: 6}}>
          <Users size={16} color="#CBD5E1" />
          <Text className="text-xs font-bold text-slate-400">
            {brand.followers || '—'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
