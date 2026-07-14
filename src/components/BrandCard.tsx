import React from 'react';
import {useTranslation} from 'react-i18next';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import {CheckCircle, ShieldCheck, Zap} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {BRAND_GRADIENT_WARM} from '../theme/brand';

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

interface Props {
  brand: Brand;
  matchScore?: number;
  onPress?: () => void;
}

function BrandCardImpl({brand, matchScore = 0, onPress}: Props) {
  const {t} = useTranslation();
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
      style={{
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 6,
      }}>
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
        <View className="w-20 h-20 rounded-2xl bg-[#F8F9FD] items-center justify-center mb-4 overflow-hidden">
          {brand.logo ? (
            <Image
              source={{uri: brand.logo}}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-2xl font-black text-slate-300">
              {brand.name?.[0]}
            </Text>
          )}
        </View>

        <View className="flex-row items-center justify-center px-3" style={{gap: 4}}>
          <Text
            className="text-lg font-bold text-slate-800 flex-shrink"
            numberOfLines={1}>
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

      {/* Footer — composite trust score (uses app warm gradient) */}
      {(() => {
        const score =
          typeof brand.trustScore === 'number' ? brand.trustScore : null;
        const bandRaw =
          brand.trustBand || (score !== null ? bandForScore(score) : '—');
        const bandLabels: Record<string, string> = {
          Excellent: t('BrandCard.bands.excellent'),
          'Very Good': t('BrandCard.bands.veryGood'),
          Good: t('BrandCard.bands.good'),
          Fair: t('BrandCard.bands.fair'),
          Poor: t('BrandCard.bands.poor'),
        };
        const band = bandLabels[bandRaw] || bandRaw;
        return (
          <View className="mt-3">
            <View
              className="flex-row items-center justify-between"
              style={{
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 8,
                overflow: 'hidden',
              }}>
              <LinearGradient
                colors={[...BRAND_GRADIENT_WARM]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
              />
              <View className="flex-row items-center" style={{gap: 6}}>
                <ShieldCheck size={14} color="#fff" />
                <Text className="text-[10px] font-black uppercase tracking-wider text-white">
                  {t('BrandCard.trust')}
                </Text>
              </View>
              <Text className="text-[11px] font-black text-white tracking-wide">
                {band}
              </Text>
            </View>
          </View>
        );
      })()}
    </TouchableOpacity>
  );
}

// Memoised so the brand grid doesn't re-render every card when pagination
// state (visibleCount) changes inside InfluencerDiscover. Most props are
// primitives / object refs that stay stable across renders; `onPress` is
// recreated each render but its body is cheap, so the shallow compare is
// acceptable here.
const BrandCard = React.memo(BrandCardImpl);
export default BrandCard;
