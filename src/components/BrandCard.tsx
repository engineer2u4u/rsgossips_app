import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  CheckCircle,
  ShieldCheck,
  Zap,
  Sparkles,
  X,
  Copy,
  Check,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {BRAND_GRADIENT_WARM} from '../theme/brand';
import {useAuth} from '../context/AuthContext';
import {
  explainBrandMatch,
  MatchFactor,
  MatchFactorStatus,
} from '../utils/matchScore';
import {useAiTool} from '../hooks/useAiTool';
import {AiMarkdown} from './AiMarkdown';

type Brand = {
  id: string | number;
  name: string;
  category: string;
  categories?: string[];
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

// "Why this match?" — same pattern as the CampaignCard coach modal:
// transparent breakdown bars + an optional AI-narrated to-do list
// (tool: match_coach, no campaignId — the breakdown itself is the context).
// Mirror of the web BrandCard BrandMatchModal.
function BrandMatchModal({
  visible,
  brand,
  score,
  breakdown,
  onClose,
}: {
  visible: boolean;
  brand: Brand;
  score: number;
  breakdown: MatchFactor[];
  onClose: () => void;
}) {
  const {t} = useTranslation();
  const navigation = useNavigation<any>();
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
      inputs: {brand: brand.name, matchScore: score, breakdown: summary},
    });
  };

  const copy = () => {
    if (!result) return;
    Clipboard.setString(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const goUpgrade = () => {
    // Close first — an open RN Modal would cover the pricing screen.
    onClose();
    navigation.navigate('InfluencerPricing');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      {/* Backdrop — tap outside to dismiss */}
      <Pressable onPress={onClose} className="flex-1 bg-black/50 justify-end">
        <Pressable
          onPress={() => {}}
          className="bg-white rounded-t-[28px] overflow-hidden"
          style={{maxHeight: '80%'}}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-50">
            <View className="flex-row items-center" style={{gap: 8}}>
              <Zap size={16} color={scoreColor} />
              <Text className="font-bold text-slate-800 text-sm">
                {t('BrandCard.match.title')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="p-1.5 rounded-full bg-slate-100">
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-5 py-5" showsVerticalScrollIndicator={false}>
            {/* Score header */}
            <View className="flex-row items-center mb-4" style={{gap: 12}}>
              <Text className="text-3xl font-black" style={{color: scoreColor}}>
                {score}%
              </Text>
              <Text className="flex-1 text-xs text-slate-500 leading-snug">
                {t('BrandCard.match.matchWith', {name: brand.name})}
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
                    ? t('BrandCard.match.coaching')
                    : t('BrandCard.match.coachButton')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Quota exhausted → upgrade CTA */}
            {limitReached && (
              <View className="mt-4 items-center bg-slate-50 rounded-2xl p-4">
                <Text className="text-xs text-slate-600 mb-2 text-center">
                  {t('BrandCard.match.limitBody')}
                </Text>
                <TouchableOpacity
                  onPress={goUpgrade}
                  className="h-9 px-4 rounded-xl bg-[#9810FA] items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {t('BrandCard.match.upgrade')}
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
                    {t('BrandCard.match.yourCoach')}
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
                        ? t('BrandCard.match.copied')
                        : t('BrandCard.match.copy')}
                    </Text>
                  </TouchableOpacity>
                </View>
                <AiMarkdown text={result} textStyle={{fontSize: 12}} />
                <TouchableOpacity onPress={() => setResult('')} className="mt-3">
                  <Text className="text-[11px] font-bold text-[#9810FA]">
                    {t('BrandCard.match.regenerate')}
                  </Text>
                </TouchableOpacity>
                {typeof remaining === 'number' && Number.isFinite(remaining) && (
                  <Text className="text-[10px] text-slate-400 mt-2">
                    {t('BrandCard.match.remaining', {n: remaining})}
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

interface Props {
  brand: Brand;
  matchScore?: number;
  onPress?: () => void;
}

function BrandCardImpl({brand, matchScore = 0, onPress}: Props) {
  const {t} = useTranslation();
  const {profile} = useAuth();
  const [matchOpen, setMatchOpen] = useState(false);

  // Single source of truth for the match % — same breakdown feeds the badge
  // and the "why this match?" modal so they never disagree (mirrors web
  // BrandCard; the parent's `matchScore` prop comes from the same scorer).
  const match: {score: number; breakdown: MatchFactor[]} = profile
    ? explainBrandMatch(profile, brand)
    : {score: matchScore || 0, breakdown: []};

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
      {/* Match Score Badge — pressable, opens the "why this match?" sheet.
          A nested touchable claims the tap, so the card's own onPress
          doesn't fire (RN equivalent of the web stopPropagation). */}
      {matchScore > 0 && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setMatchOpen(true)}
          className={`absolute top-3 right-3 z-10 flex-row items-center px-2 py-0.5 rounded-lg ${scoreColor.bg}`}
          style={{gap: 3}}>
          <Zap
            size={10}
            color={
              matchScore >= 80
                ? '#10B981'
                : matchScore >= 60
                  ? '#F59E0B'
                  : '#94A3B8'
            }
          />
          <Text className={`text-[10px] font-black ${scoreColor.text}`}>
            {matchScore}%
          </Text>
          <Sparkles size={9} color="#9810FA" style={{opacity: 0.7}} />
        </TouchableOpacity>
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

      {/* Why-this-match sheet — mounted only when open so the AI hook state
          resets per open, matching the web modal's mount/unmount behaviour. */}
      {matchOpen && (
        <BrandMatchModal
          visible={matchOpen}
          brand={brand}
          score={match.score}
          breakdown={match.breakdown}
          onClose={() => setMatchOpen(false)}
        />
      )}
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
