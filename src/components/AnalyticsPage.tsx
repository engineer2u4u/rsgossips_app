// Campaign analytics — real data via useInfluencerCampaigns.
//
// Web parity: src/components/AnalyticsPage.jsx (commit b091708).
// KPI row: Total earnings (sum of completed budgets), Total reach (profile
// proxy × campaign count), Avg engagement (profile), Brand rating (TBD).
// Monthly chart: last 6 months of completed-campaign earnings, rendered as
// a column chart (no SVG path math — RN doesn't have <svg> without a lib
// and a column chart conveys the same info).
//
// Demographics section reads from profile.audience_demographics if present;
// otherwise falls back to a placeholder distribution so the screen never
// looks broken.

import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  Eye,
  Heart,
  Star,
  TrendingUp,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../context/AuthContext';
import {useInfluencerCampaigns} from '../hooks/useInfluencerCampaigns';
import {
  formatCountCompact,
  formatINRCompact,
  earnedAmountINR,
  type CampaignRow,
} from '../lib/influencer-stats';

interface Props {
  onBack: () => void;
}

const AnalyticsPage: React.FC<Props> = ({onBack}) => {
  const {profile} = useAuth();
  const navigation = useNavigation<any>();
  const {stats, loading} = useInfluencerCampaigns();

  const followers = profile?.followers_count || 0;
  const engagement = profile?.engagement_rate || 0;
  // Web treats total reach as a profile-level proxy. Without per-campaign
  // metrics we approximate with profile.total_reach when populated, falling
  // back to followers × campaign count as a rough indicator.
  const totalReach =
    profile?.total_reach ||
    (followers > 0 && stats.completedCount > 0
      ? followers * stats.completedCount
      : 0);

  // KPI row (4 tiles)
  const kpis = [
    {
      icon: Coins,
      label: 'Total Earnings',
      value: formatINRCompact(stats.totalEarnings),
      sub:
        stats.earningsThisMonth > 0
          ? `+${formatINRCompact(stats.earningsThisMonth)} this month`
          : 'No earnings this month',
      bg: '#F0FDF4',
      iconBg: '#10B981',
      color: '#10B981',
    },
    {
      icon: Eye,
      label: 'Total Reach',
      value: formatCountCompact(totalReach),
      sub: `across ${stats.myCount} ${stats.myCount === 1 ? 'campaign' : 'campaigns'}`,
      bg: '#FDF2F8',
      iconBg: '#EC4899',
      color: '#EC4899',
    },
    {
      icon: Heart,
      label: 'Avg Engagement',
      value: `${(engagement || 0).toFixed(1)}%`,
      sub: 'on your Instagram',
      bg: '#FAF5FF',
      iconBg: '#8B5CF6',
      color: '#8B5CF6',
    },
    {
      icon: Star,
      label: 'Brand Rating',
      value: '—',
      sub: stats.completedCount === 0 ? 'No reviews yet' : 'Coming soon',
      bg: '#FFFBEB',
      iconBg: '#F59E0B',
      color: '#F59E0B',
    },
  ];

  // Chart heights normalised to the max bucket so the tallest bar reaches 100%.
  const monthMax = Math.max(...stats.months.map(m => m.value), 1);
  const chartHasData = stats.months.some(m => m.value > 0);

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
        {/* KPI grid */}
        <View className="px-5 flex-row flex-wrap" style={{gap: 10}}>
          {loading ? (
            <View style={{paddingVertical: 30, width: '100%', alignItems: 'center'}}>
              <ActivityIndicator color="#E60076" />
            </View>
          ) : (
            kpis.map(stat => {
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
                  <Text className="text-xl font-black text-[#1A1A1A] mt-1">
                    {stat.value}
                  </Text>
                  <Text
                    className="text-[10px] font-semibold mt-1"
                    style={{color: stat.color}}
                    numberOfLines={1}>
                    {stat.sub}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Monthly earnings chart */}
        <View className="mx-5 mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text className="text-base font-black text-[#1A1A1A]">
                Earnings over time
              </Text>
              <Text className="text-[10px] text-gray-400">
                last 6 months on RGossips
              </Text>
            </View>
            {stats.earningsTrend !== null ? (
              <LinearGradient
                colors={['#E94560', '#7F47CD']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={{paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999}}>
                <Text className="text-white text-[11px] font-bold">
                  {stats.earningsTrend >= 0 ? '+' : ''}
                  {stats.earningsTrend}%
                </Text>
              </LinearGradient>
            ) : null}
          </View>

          {chartHasData ? (
            <>
              <View className="h-32 flex-row items-end justify-between mb-3" style={{gap: 6}}>
                {stats.months.map((m, i) => {
                  const heightPct = (m.value / monthMax) * 100;
                  const isLast = i === stats.months.length - 1;
                  return (
                    <View key={m.key} className="flex-1 items-center">
                      <View
                        className="w-full rounded-t-md"
                        style={{
                          height: `${Math.max(heightPct, 2)}%`,
                          backgroundColor: isLast ? '#E94560' : '#FCE5EC',
                        }}
                      />
                    </View>
                  );
                })}
              </View>
              <View className="flex-row justify-between px-1">
                {stats.months.map(m => (
                  <Text
                    key={m.key}
                    className="text-[9px] text-gray-400 font-medium"
                    style={{flex: 1, textAlign: 'center'}}>
                    {m.label}
                  </Text>
                ))}
              </View>
            </>
          ) : (
            <View className="h-32 items-center justify-center">
              <Text className="text-xs text-gray-400">
                No completed campaigns yet
              </Text>
            </View>
          )}
        </View>

        {/* Brands worked with */}
        {stats.brands.length > 0 ? (
          <View className="mx-5 mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-black text-[#1A1A1A]">
                Brands you've worked with
              </Text>
              <Text className="text-[10px] text-gray-400 font-semibold">
                {stats.brands.length} total
                {stats.repeatBrandCount > 0
                  ? ` · ${stats.repeatBrandCount} repeat`
                  : ''}
              </Text>
            </View>
            <View className="flex-row flex-wrap" style={{gap: 8}}>
              {stats.brands.slice(0, 8).map(b => (
                <View
                  key={b.name}
                  className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl flex-row items-center"
                  style={{gap: 6}}>
                  <Text className="text-xs font-semibold text-slate-700">
                    {b.name}
                  </Text>
                  {b.count > 1 ? (
                    <View className="bg-purple-100 px-1.5 py-0.5 rounded-full">
                      <Text className="text-[9px] font-bold text-purple-700">
                        ×{b.count}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Recent campaigns — clickable rows open the offer detail.
            Per-campaign reach/engagement comes from applicationMetrics when
            the row has been refreshed server-side; falls back to the
            profile-level engagement rate otherwise (web commit 5782609). */}
        <View className="mx-5 mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <View className="mb-3">
            <Text className="text-base font-black text-[#1A1A1A]">
              Recent campaigns
            </Text>
            <Text className="text-[10px] text-gray-400">
              {stats.recent.length === 0
                ? 'no campaigns yet'
                : `your latest ${stats.recent.length} campaign${
                    stats.recent.length === 1 ? '' : 's'
                  }`}
            </Text>
          </View>

          {stats.recent.length === 0 ? (
            <View className="py-6 items-center">
              <Text className="text-xs text-gray-400">
                Apply to a campaign to see it here.
              </Text>
            </View>
          ) : (
            <View style={{gap: 8}}>
              {stats.recent.map(c => (
                <RecentRow
                  key={c.id}
                  c={c}
                  engagementPct={engagement}
                  onPress={() =>
                    navigation.navigate('InfluencerOfferDetail', {id: c.id})
                  }
                />
              ))}
            </View>
          )}
        </View>

        {/* Demographics — uses profile.audience_demographics when present */}
        <View className="mx-5 mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <Text className="text-base font-black text-[#1A1A1A] mb-4">
            Audience Demographics
          </Text>

          <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Gender Distribution
          </Text>
          <View style={{gap: 8}}>
            {[
              {
                label: 'Female',
                pct: profile?.audience_demographics?.gender?.female || 62,
                color: '#A855F7',
              },
              {
                label: 'Male',
                pct: profile?.audience_demographics?.gender?.male || 35,
                color: '#3B82F6',
              },
              {
                label: 'Other',
                pct: profile?.audience_demographics?.gender?.other || 3,
                color: '#F59E0B',
              },
            ].map(g => (
              <View key={g.label}>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs font-semibold text-slate-600">
                    {g.label}
                  </Text>
                  <Text className="text-xs font-bold text-slate-800">
                    {g.pct}%
                  </Text>
                </View>
                <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{width: `${g.pct}%`, backgroundColor: g.color}}
                  />
                </View>
              </View>
            ))}
          </View>

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
                  <Text className="text-xs font-semibold text-slate-600">
                    {a.range}
                  </Text>
                  <Text className="text-xs font-bold text-slate-800">{a.pct}%</Text>
                </View>
                <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <LinearGradient
                    colors={['#8B5CF6', '#EC4899']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={{
                      width: `${a.pct}%`,
                      height: '100%',
                      borderRadius: 100,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Web parity: the analytics screen on rgossips.com is a single
            page — the legacy "Campaign Analytics" deep-link card has been
            removed so mobile matches the same one-screen flow. Extra
            bottom spacer below the Audience Demographics card so it
            doesn't end flush against the floating BottomNav. */}

        <View className="h-40" />
      </ScrollView>

      {/* BottomNav is rendered by the parent InfluencerProfile at the
          SafeAreaView level so it actually floats over the scroll content
          on every subview instead of scrolling with this ScrollView. */}
    </View>
  );
};

/* ─────────── Recent campaign row ─────────── */

function RecentRow({
  c,
  engagementPct,
  onPress,
}: {
  c: CampaignRow & {applicationMetrics?: {reach?: number; engagement?: number}};
  engagementPct: number;
  onPress: () => void;
}) {
  const completed = c.applicationStatus === 'completed';
  const earnings = completed ? earnedAmountINR(c) : 0;

  // Real per-campaign metrics from refresh-application-metrics, with the
  // influencer-level engagement rate as a fallback when no live links have
  // been measured yet (matches web RecentRow logic).
  const m = c.applicationMetrics;
  const reach = m?.reach || 0;
  const rowEngagement =
    m && (m.engagement || 0) > 0 ? (m.engagement as number) : engagementPct;

  const statusBg = completed ? 'bg-blue-50' : 'bg-pink-100';
  const statusText = completed ? 'text-blue-700' : 'text-pink-700';
  const statusLabel =
    completed
      ? 'Completed'
      : c.applicationStatus
        ? c.applicationStatus.replace(/_/g, ' ')
        : 'Active';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="flex-row items-center p-3 rounded-xl border border-slate-100 bg-slate-50/50"
      style={{gap: 12}}>
      <View className="flex-1 min-w-0">
        <Text
          className="text-sm font-bold text-[#1A1A2E]"
          numberOfLines={1}>
          {c.title || 'Untitled campaign'}
        </Text>
        <View className="flex-row items-center mt-1" style={{gap: 6}}>
          <Text
            className="text-[10px] font-semibold text-gray-500"
            numberOfLines={1}>
            {c.brandName || 'Brand'}
          </Text>
          <View
            className={`${statusBg} px-2 py-0.5 rounded-md`}>
            <Text
              className={`text-[9px] font-bold uppercase ${statusText}`}>
              {statusLabel}
            </Text>
          </View>
        </View>
        <View className="flex-row mt-2" style={{gap: 12}}>
          <View>
            <Text className="text-[9px] font-bold text-gray-400 uppercase">
              Reach
            </Text>
            <Text className="text-xs font-bold text-slate-800">
              {reach > 0 ? formatCountCompact(reach) : '—'}
            </Text>
          </View>
          <View>
            <Text className="text-[9px] font-bold text-gray-400 uppercase">
              Engagement
            </Text>
            <Text className="text-xs font-bold text-slate-800">
              {rowEngagement > 0 ? `${rowEngagement.toFixed(1)}%` : '—'}
            </Text>
          </View>
          <View>
            <Text className="text-[9px] font-bold text-gray-400 uppercase">
              Earnings
            </Text>
            <Text className="text-xs font-bold text-pink-600">
              {earnings > 0 ? formatINRCompact(earnings) : '—'}
            </Text>
          </View>
        </View>
      </View>
      <ChevronRight size={16} color="#CBD5E1" />
    </TouchableOpacity>
  );
}

export default AnalyticsPage;
