import React from 'react';
import {View, Text, TouchableOpacity, Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {MapPin, Gift, Users, Zap} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {BRAND_GRADIENT_WARM, CARD_SHADOW} from '../theme/brand';

type Campaign = {
  id: string | number;
  initials?: string;
  title: string;
  brandName: string;
  status: string;
  applicationStatus?: string;
  tags: string[];
  budget: string;
  deadline?: string;
  daysLeft?: string;
  deliverables: string;
  location: string;
  platforms: string[];
  bannerImage?: string;
  description?: string;
};

interface Props {
  campaign: Campaign;
  matchScore?: number;
}

// Fallback placeholders for campaigns without a banner — same set the
// home-page slider uses so the look is consistent across surfaces.
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=600',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600',
];

function pickPlaceholder(id: string | number): string {
  const key = String(id);
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return PLACEHOLDER_IMAGES[Math.abs(hash) % PLACEHOLDER_IMAGES.length];
}

function CampaignCardImpl({campaign, matchScore = 0}: Props) {
  const navigation = useNavigation<any>();

  const category = campaign.tags?.[0] || 'General';
  const badge =
    campaign.daysLeft && parseInt(campaign.daysLeft, 10) <= 7
      ? 'Ending Soon'
      : campaign.status || 'Active';
  const initials =
    campaign.initials ||
    campaign.brandName?.[0]?.toUpperCase() ||
    campaign.title?.[0]?.toUpperCase() ||
    'B';
  const description =
    campaign.description?.slice(0, 80) ||
    `${campaign.brandName} campaign. Created by admin.`;
  const imageUrl = campaign.bannerImage || pickPlaceholder(campaign.id);

  // Shadow on an outer wrapper so the inner card can keep overflow-hidden
  // (needed to clip the banner image to the rounded card corners) without
  // also clipping the drop shadow itself.
  return (
    <View style={[{borderRadius: 32, backgroundColor: '#ffffff'}, CARD_SHADOW]}>
    <View
      className="bg-white rounded-[32px] border border-slate-100 overflow-hidden">
      {/* Image */}
      <View className="h-56 p-3">
        <View className="flex-1 rounded-3xl overflow-hidden relative">
          <Image
            source={{uri: imageUrl}}
            className="w-full h-full"
            resizeMode="cover"
          />
          {/* Category chip (top-left) */}
          <View className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full">
            <Text className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">
              {category}
            </Text>
          </View>
          {/* Status pill (top-right) */}
          <View
            className="absolute top-3 right-3 bg-slate-900/80 px-2.5 py-1 rounded-full flex-row items-center"
            style={{gap: 4}}>
            <View className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            <Text className="text-white text-[9px] font-bold">{badge}</Text>
          </View>
          {/* Match badge (bottom-left) */}
          {matchScore > 0 && (
            <View
              className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg flex-row items-center"
              style={{
                backgroundColor:
                  matchScore >= 75
                    ? '#22C55E'
                    : matchScore >= 50
                      ? '#F59E0B'
                      : '#64748B',
                gap: 4,
              }}>
              <Zap size={10} color="#fff" />
              <Text className="text-white text-[10px] font-black">
                {matchScore}% match
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View className="px-5 pb-5">
        {/* Brand row */}
        <View className="flex-row items-center mb-2" style={{gap: 6}}>
          <View className="w-6 h-6 rounded-full bg-emerald-100 items-center justify-center">
            <Text className="text-[10px] font-black text-emerald-600">
              {initials.slice(0, 2)}
            </Text>
          </View>
          <Text className="text-[12px] font-bold text-slate-500">
            {campaign.brandName}
          </Text>
          <View className="flex-1" />
          <View className="flex-row items-center" style={{gap: 2}}>
            <MapPin size={11} color="#94A3B8" />
            <Text
              className="text-[11px] font-medium text-slate-400 max-w-[140px]"
              numberOfLines={1}>
              {campaign.location}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text
          className="text-lg font-black text-slate-900 leading-tight mb-1"
          numberOfLines={2}>
          {campaign.title}
        </Text>

        {/* Description */}
        <Text
          className="text-xs text-slate-500 font-medium leading-relaxed mb-4"
          numberOfLines={2}>
          {description}
        </Text>

        {/* Pay / Req tiles */}
        <View className="flex-row mb-4" style={{gap: 8}}>
          <View className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-50">
            <View className="flex-row items-center mb-1" style={{gap: 4}}>
              <Gift size={11} color="#22C55E" />
              <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Pay
              </Text>
            </View>
            <Text className="text-sm font-black text-slate-800" numberOfLines={1}>
              {campaign.budget}
            </Text>
          </View>
          <View className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-50">
            <View className="flex-row items-center mb-1" style={{gap: 4}}>
              <Users size={11} color="#3B82F6" />
              <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Req
              </Text>
            </View>
            <Text className="text-xs font-black text-slate-800" numberOfLines={2}>
              {campaign.deliverables}
            </Text>
          </View>
        </View>

        {/* Action */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate('InfluencerOfferDetail', {id: campaign.id})
          }
          className="items-center"
          style={{borderRadius: 16, paddingVertical: 14, overflow: 'hidden'}}>
          <LinearGradient
            colors={[...BRAND_GRADIENT_WARM]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
          />
          <Text className="text-white text-xs font-black uppercase tracking-widest">
            {campaign.applicationStatus === 'completed'
              ? 'View Status'
              : campaign.status === 'Applied'
                ? 'View Status'
                : 'Apply Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
    </View>
  );
}

// Memoised so a parent re-render (e.g. pagination state, filter toggle)
// only re-renders cards whose props actually changed. The campaign id is a
// stable identity, so the default shallow compare is enough here.
export const CampaignCard = React.memo(CampaignCardImpl);
