import React from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import {CheckCircle, ShieldCheck, Zap} from 'lucide-react-native';

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
  trustScore?: number;
  trustBand?: string;
};

// Mirrors the band thresholds in supabase/functions/list-brands/index.ts.
// Used as a fallback when the edge function didn't include a band string.
function bandForScore(score: number): string {
  if (score >= 800) return 'Excellent';
  if (score >= 740) return 'Very Good';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  return 'Poor';
}

function trustPalette(band: string): {fg: string; bg: string; icon: string} {
  switch (band) {
    case 'Excellent':
      return {fg: '#047857', bg: '#D1FAE5', icon: '#10B981'};
    case 'Very Good':
      return {fg: '#065F46', bg: '#ECFDF5', icon: '#34D399'};
    case 'Good':
      return {fg: '#92400E', bg: '#FEF3C7', icon: '#F59E0B'};
    case 'Fair':
      return {fg: '#9A3412', bg: '#FFEDD5', icon: '#F97316'};
    default:
      return {fg: '#475569', bg: '#F1F5F9', icon: '#94A3B8'};
  }
}

interface Props {
  brand: Brand;
  matchScore?: number;
  onPress?: () => void;
}

export default function BrandCard({brand, matchScore = 0, onPress}: Props) {
  const scoreColor =
    matchScore >= 80
      ? {text: 'text-emerald-500', bg: 'bg-emerald-50'}
      : matchScore >= 60
        ? {text: 'text-amber-500', bg: 'bg-amber-50'}
        : {text: 'text-slate-400', bg: 'bg-slate-50'};

  return (
    <TouchableOpacity
      className="bg-white rounded-[28px] p-4 border border-slate-200"
      activeOpacity={0.7}
      onPress={onPress}
      style={{shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4}}>
      {/* Match Score Badge */}
      {matchScore > 0 && (
        <View
          className={`absolute top-3 right-3 z-10 flex-row items-center px-2 py-0.5 rounded-lg ${scoreColor.bg}`}
          style={{gap: 3}}>
          <Zap size={10} color={matchScore >= 80 ? '#10B981' : matchScore >= 60 ? '#F59E0B' : '#94A3B8'} />
          <Text
            className={`text-[10px] font-black ${scoreColor.text}`}>
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

      {/* Footer — composite trust score */}
      {(() => {
        const score =
          typeof brand.trustScore === 'number' ? brand.trustScore : null;
        const band =
          brand.trustBand || (score !== null ? bandForScore(score) : '—');
        const palette = trustPalette(band);
        return (
          <View
            className="mt-2 pt-3 border-t border-slate-50 flex-row items-center justify-between rounded-xl px-2 py-1.5"
            style={{backgroundColor: palette.bg}}>
            <View className="flex-row items-center" style={{gap: 6}}>
              <ShieldCheck size={14} color={palette.icon} />
              <Text
                className="text-[10px] font-black uppercase tracking-wider"
                style={{color: palette.fg}}>
                Trust
              </Text>
            </View>
            <View className="flex-row items-baseline" style={{gap: 4}}>
              <Text className="text-sm font-black" style={{color: palette.fg}}>
                {score !== null ? score : '—'}
              </Text>
              <Text
                className="text-[9px] font-bold opacity-70"
                style={{color: palette.fg}}>
                {band}
              </Text>
            </View>
          </View>
        );
      })()}
    </TouchableOpacity>
  );
}
