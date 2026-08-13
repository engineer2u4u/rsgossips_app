import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {openManagePlan} from '../lib/manage-plan';
import {MapPin, Gift, Users, Zap, Sparkles, X, Copy, Check} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {BRAND_GRADIENT_WARM, CARD_SHADOW} from '../theme/brand';
import {useAuth} from '../context/AuthContext';
import {
  explainCampaignMatch,
  MatchFactor,
  MatchFactorStatus,
} from '../utils/matchScore';
import {useAiTool} from '../hooks/useAiTool';
import {AiMarkdown} from './AiMarkdown';

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

// "Why this match?" coach — shows the transparent score breakdown and, on
// demand, an AI-narrated prioritised to-do list to raise it (tool: match_coach).
// Mirror of the web CampaignCard MatchCoachModal.
function MatchCoachModal({
  visible,
  campaign,
  score,
  breakdown,
  onClose,
}: {
  visible: boolean;
  campaign: Campaign;
  score: number;
  breakdown: MatchFactor[];
  onClose: () => void;
}) {
  const {t} = useTranslation();
  const {generate, loading, result, error, remaining, limitReached, setResult} =
    useAiTool();
  const [copied, setCopied] = useState(false);

  const scoreColor =
    score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#64748B';
  const barColor = (s: MatchFactorStatus) =>
    s === 'strong' ? '#10B981' : s === 'ok' ? '#F59E0B' : '#FB7185';

  const coachMe = () => {
    const summary = breakdown
      .map(b => `- ${b.label}: ${b.points}/${b.max} (${b.status}) — ${b.reason}`)
      .join('\n');
    generate({
      tool: 'match_coach',
      campaignId: String(campaign.id),
      inputs: {matchScore: score, breakdown: summary},
    });
  };

  const copy = () => {
    if (!result) return;
    Clipboard.setString(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const goUpgrade = () => {
    // Plan changes happen on the web (no in-app purchase). Hand off to browser.
    onClose();
    openManagePlan();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      {/* Backdrop — tap outside to dismiss */}
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/50 justify-end">
        <Pressable
          onPress={() => {}}
          className="bg-white rounded-t-[28px] overflow-hidden"
          style={{maxHeight: '80%'}}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-50">
            <View className="flex-row items-center" style={{gap: 8}}>
              <Zap size={16} color={scoreColor} />
              <Text className="font-bold text-slate-800 text-sm">
                {t('CampaignCard.coach.title')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="p-1.5 rounded-full bg-slate-100">
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="px-5 py-5"
            showsVerticalScrollIndicator={false}>
            {/* Score header */}
            <View className="flex-row items-center mb-4" style={{gap: 12}}>
              <Text
                className="text-3xl font-black"
                style={{color: scoreColor}}>
                {score}%
              </Text>
              <Text className="flex-1 text-xs text-slate-500 leading-snug">
                {t('CampaignCard.coach.matchWith', {title: campaign.title})}
              </Text>
            </View>

            {/* Breakdown bars */}
            <View style={{gap: 12}}>
              {breakdown.map(b => (
                <View key={b.key}>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[11px] font-semibold text-slate-600">
                      {b.label}
                    </Text>
                    <Text className="text-[11px] font-bold text-slate-400">
                      {b.points}/{b.max}
                    </Text>
                  </View>
                  <View className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((b.points / b.max) * 100)}%`,
                        backgroundColor: barColor(b.status),
                      }}
                    />
                  </View>
                  <Text className="text-[10px] text-slate-400 mt-1 leading-snug">
                    {b.reason}
                  </Text>
                </View>
              ))}
            </View>

            {/* AI coach button */}
            {!result && !limitReached && (
              <TouchableOpacity
                onPress={coachMe}
                disabled={loading}
                activeOpacity={0.9}
                className="mt-4 flex-row items-center justify-center"
                style={{
                  borderRadius: 16,
                  height: 44,
                  overflow: 'hidden',
                  gap: 8,
                  opacity: loading ? 0.7 : 1,
                }}>
                <LinearGradient
                  colors={['#9810FA', '#E60076']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                />
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Sparkles size={15} color="#fff" />
                )}
                <Text className="text-white font-bold text-sm">
                  {loading
                    ? t('CampaignCard.coach.coaching')
                    : t('CampaignCard.coach.coachButton')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Quota exhausted → upgrade CTA */}
            {limitReached && (
              <View className="mt-4 items-center bg-slate-50 rounded-2xl p-4">
                <Text className="text-xs text-slate-600 mb-2 text-center">
                  {t('CampaignCard.coach.limitBody')}
                </Text>
                <TouchableOpacity
                  onPress={goUpgrade}
                  className="h-9 px-4 rounded-xl bg-[#9810FA] items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {t('common.managePlan')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!!error && !limitReached && (
              <Text className="mt-3 text-xs text-rose-500">{error}</Text>
            )}

            {/* AI result */}
            {!!result && (
              <View className="mt-4 rounded-2xl p-4 border border-purple-100 bg-purple-50/40">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[10px] font-extrabold text-[#9810FA] uppercase tracking-wider">
                    {t('CampaignCard.coach.yourCoach')}
                  </Text>
                  <TouchableOpacity
                    onPress={copy}
                    className="flex-row items-center"
                    style={{gap: 4}}>
                    {copied ? (
                      <Check size={12} color="#10B981" />
                    ) : (
                      <Copy size={12} color="#94A3B8" />
                    )}
                    <Text className="text-[10px] font-bold text-slate-400">
                      {copied
                        ? t('CampaignCard.coach.copied')
                        : t('CampaignCard.coach.copy')}
                    </Text>
                  </TouchableOpacity>
                </View>
                <AiMarkdown text={result} textStyle={{fontSize: 12}} />
                <TouchableOpacity onPress={() => setResult('')} className="mt-3">
                  <Text className="text-[11px] font-bold text-[#9810FA]">
                    {t('CampaignCard.coach.regenerate')}
                  </Text>
                </TouchableOpacity>
                {typeof remaining === 'number' && Number.isFinite(remaining) && (
                  <Text className="text-[10px] text-slate-400 mt-2">
                    {t('CampaignCard.coach.remaining', {n: remaining})}
                  </Text>
                )}
              </View>
            )}

            <View className="h-8" />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CampaignCardImpl({campaign, matchScore = 0}: Props) {
  const navigation = useNavigation<any>();
  const {t} = useTranslation();
  const {profile} = useAuth();
  const [coachOpen, setCoachOpen] = useState(false);

  // Single source of truth for the match % — same breakdown feeds the badge
  // and the AI Match Coach so they never disagree (mirrors web CampaignCard).
  const match: {score: number; breakdown: MatchFactor[]} = profile
    ? explainCampaignMatch(profile, campaign)
    : {score: matchScore || 0, breakdown: []};

  const category = campaign.tags?.[0] || t('CampaignCard.general');
  const badge =
    campaign.daysLeft && parseInt(campaign.daysLeft, 10) <= 7
      ? t('CampaignCard.endingSoon')
      : campaign.status || t('CampaignCard.active');
  const initials =
    campaign.initials ||
    campaign.brandName?.[0]?.toUpperCase() ||
    campaign.title?.[0]?.toUpperCase() ||
    'B';
  const description =
    campaign.description?.slice(0, 80) ||
    t('CampaignCard.defaultDescription', {brandName: campaign.brandName});
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
          {/* The tiny match badge that used to live here moved to a full
              button in the action row (too small to discover up here —
              matches the web card). */}
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
                {t('CampaignCard.pay')}
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
                {t('CampaignCard.req')}
              </Text>
            </View>
            <Text className="text-xs font-black text-slate-800" numberOfLines={2}>
              {campaign.deliverables}
            </Text>
          </View>
        </View>

        {/* Action row — match-% coach button + Apply/View */}
        <View className="flex-row items-center" style={{gap: 10}}>
          {match.score > 0 && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setCoachOpen(true)}
              className="flex-row items-center justify-center bg-white"
              style={{
                borderRadius: 16,
                paddingVertical: 13,
                paddingHorizontal: 14,
                borderWidth: 1,
                gap: 4,
                borderColor:
                  match.score >= 80
                    ? '#A7F3D0'
                    : match.score >= 60
                      ? '#FDE68A'
                      : '#E2E8F0',
              }}>
              <Zap
                size={13}
                color={
                  match.score >= 80
                    ? '#059669'
                    : match.score >= 60
                      ? '#D97706'
                      : '#64748B'
                }
              />
              <Text
                className="text-xs font-black"
                style={{
                  color:
                    match.score >= 80
                      ? '#059669'
                      : match.score >= 60
                        ? '#D97706'
                        : '#64748B',
                }}>
                {match.score}%
              </Text>
              <Sparkles size={11} color="#9810FA" style={{opacity: 0.7}} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate('InfluencerOfferDetail', {id: campaign.id})
            }
            className="flex-1 items-center"
            style={{borderRadius: 16, paddingVertical: 14, overflow: 'hidden'}}>
            <LinearGradient
              colors={[...BRAND_GRADIENT_WARM]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
            />
            <Text className="text-white text-xs font-black uppercase tracking-widest">
              {campaign.applicationStatus === 'completed'
                ? t('CampaignCard.viewStatus')
                : campaign.status === 'Applied'
                  ? t('CampaignCard.viewStatus')
                  : t('CampaignCard.applyNow')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>

      {/* Match coach — mounted only when open so the AI hook state resets
          per open, matching the web modal's mount/unmount behaviour. */}
      {coachOpen && (
        <MatchCoachModal
          visible={coachOpen}
          campaign={campaign}
          score={match.score}
          breakdown={match.breakdown}
          onClose={() => setCoachOpen(false)}
        />
      )}
    </View>
  );
}

// Memoised so a parent re-render (e.g. pagination state, filter toggle)
// only re-renders cards whose props actually changed. The campaign id is a
// stable identity, so the default shallow compare is enough here.
export const CampaignCard = React.memo(CampaignCardImpl);
