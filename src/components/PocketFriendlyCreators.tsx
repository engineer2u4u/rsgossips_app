// Pocket Friendly Creators — real creators inside a reel-price bucket.
//
// This used to be four hard-coded people with Unsplash headshots ("Rohan
// Sharma", "Ananya Singh"...) while the web section of the same name read
// list-influencers. A brand comparing the app against the site saw four
// creators who do not exist and cannot be hired, and the Elite top-spot
// perk was invisible here.
//
// Mirrors src/components/brands/PocketFriendlyCreators.jsx: pull the
// directory once, keep creators whose reel rate falls in the chosen bucket,
// Elite first and cheapest-first within each group.

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';

import BrandSectionHeader from './brands/BrandSectionHeader';
import EliteBadge from './EliteBadge';
import ProBadge from './ProBadge';
import { invokeFn } from '../lib/api';
import {
  ANGLE_96,
  CHIP_TINT,
  HOME_COLORS,
  VIOLET_BLUE,
  VIOLET_BLUE_LOCATIONS,
} from '../theme/brandHome';

const { width: SCREEN_W } = Dimensions.get('window');
const TILE = (SCREEN_W - 28 - 11) / 2;

type Influencer = {
  influencer_id?: string;
  full_name?: string;
  username?: string;
  instagram_handle?: string;
  profile_photo_url?: string;
  followers_count?: number;
  categories?: string[];
  service_rates?: Record<string, string | number>;
  is_elite?: boolean;
  is_pro?: boolean;
};

type Row = Influencer & { _reelRate: number };

/** Same buckets as the web section so the two read alike. */
const PRICE_RANGES = [
  { id: 'under_1k', min: 0, max: 1_000 },
  { id: '1k_5k', min: 1_000, max: 5_000 },
  { id: '5k_10k', min: 5_000, max: 10_000 },
  { id: '10k_25k', min: 10_000, max: 25_000 },
  { id: '25k_plus', min: 25_000, max: Number.POSITIVE_INFINITY },
] as const;

const DEFAULT_RANGE_ID = '1k_5k'; // the most populated bucket

const formatRate = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const formatFollowers = (n?: number) => {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

export default function PocketFriendlyCreators() {
  const { t } = useTranslation();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeId, setRangeId] = useState<string>(DEFAULT_RANGE_ID);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Filtering happens locally, so ask for a wide slice — the default
        // limit is 50, which is not enough to fill a price bucket.
        const data = await invokeFn<{ influencers?: Influencer[] }>(
          'list-influencers',
          { limit: 2000 },
        );
        if (!cancelled && Array.isArray(data?.influencers)) {
          setInfluencers(data.influencers);
        }
      } catch {
        // Soft-fail: the section hides itself rather than blocking the home
        // screen on a directory outage.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const range = PRICE_RANGES.find(r => r.id === rangeId) || PRICE_RANGES[1];

  const matches = useMemo(() => {
    const out: Row[] = [];
    for (const inf of influencers) {
      // Invitation stubs carry an empty service_rates and drop out here.
      const raw = inf?.service_rates?.reels;
      if (raw == null || raw === '') continue;
      const rate = Number(raw);
      if (!Number.isFinite(rate) || rate <= 0) continue;
      if (rate < range.min || rate >= range.max) continue;
      out.push({ ...inf, _reelRate: rate });
    }
    // Elite leads (their top-spot perk), cheapest first within each group.
    out.sort(
      (a, b) =>
        (b.is_elite ? 1 : 0) - (a.is_elite ? 1 : 0) || a._reelRate - b._reelRate,
    );
    return out.slice(0, 6);
  }, [influencers, range]);

  // Nothing to show and nothing loading — don't render an empty section.
  if (!loading && matches.length === 0 && influencers.length === 0) return null;

  return (
    <View style={{ width: '100%', gap: 11 }}>
      <BrandSectionHeader
        title={t('PocketFriendlyCreators.title')}
        subtitle={t('PocketFriendlyCreators.subtitle')}
      />

      {/* Price buckets */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}>
        {PRICE_RANGES.map(r => {
          const active = r.id === rangeId;
          return (
            <Pressable
              key={r.id}
              onPress={() => setRangeId(r.id)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 99,
                borderWidth: 1,
                borderColor: active ? HOME_COLORS.violetDeep : HOME_COLORS.cardBorder,
                backgroundColor: active ? '#F5F3FF' : HOME_COLORS.card,
              }}>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: '700',
                  color: active ? HOME_COLORS.violetDeep : HOME_COLORS.muted,
                }}>
                {t(`PocketFriendlyCreators.ranges.${r.id}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={{ paddingVertical: 28, alignItems: 'center' }}>
          <ActivityIndicator color={HOME_COLORS.violetDeep} />
        </View>
      ) : matches.length === 0 ? (
        <Text
          style={{
            paddingHorizontal: 14,
            fontSize: 11.5,
            color: HOME_COLORS.muted,
            lineHeight: 17,
          }}>
          {t('PocketFriendlyCreators.emptyBucket')}
        </Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11, paddingHorizontal: 14 }}>
          {matches.map(c => {
            const handle = c.instagram_handle || c.username || '';
            const name = c.full_name || handle || t('PocketFriendlyCreators.creatorFallback');
            const category = Array.isArray(c.categories) ? c.categories[0] : '';
            return (
              <View
                key={c.influencer_id || handle}
                style={{
                  width: TILE,
                  backgroundColor: HOME_COLORS.card,
                  borderWidth: 1,
                  borderColor: HOME_COLORS.cardBorder,
                  borderRadius: 18,
                  paddingVertical: 15,
                  paddingHorizontal: 12,
                  alignItems: 'center',
                  gap: 7,
                }}>
                {c.profile_photo_url ? (
                  <Image
                    source={{ uri: c.profile_photo_url }}
                    style={{ width: 52, height: 52, borderRadius: 99, backgroundColor: '#EEF1F8' }}
                  />
                ) : (
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 99,
                      backgroundColor: '#EEF1F8',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: HOME_COLORS.violetDeep }}>
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <Text
                  style={{ width: '100%', fontSize: 12, fontWeight: '700', color: HOME_COLORS.ink, textAlign: 'center' }}
                  numberOfLines={1}>
                  {name}
                </Text>

                {c.is_elite ? <EliteBadge /> : c.is_pro ? <ProBadge /> : null}

                {category ? (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' }}>
                    <LinearGradient
                      colors={CHIP_TINT}
                      start={ANGLE_96.start}
                      end={ANGLE_96.end}
                      style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                    />
                    <Text
                      style={{ fontSize: 8.5, fontWeight: '700', letterSpacing: 1, color: HOME_COLORS.violetDeep }}
                      numberOfLines={1}>
                      {category.toUpperCase()}
                    </Text>
                  </View>
                ) : null}

                <Text style={{ fontSize: 10.5, color: HOME_COLORS.muted }}>
                  {t('PocketFriendlyCreators.followers', {
                    count: formatFollowers(c.followers_count),
                  })}
                </Text>

                <Pressable
                  disabled={!handle}
                  style={{
                    width: '100%',
                    marginTop: 2,
                    borderRadius: 10,
                    overflow: 'hidden',
                    paddingVertical: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: handle ? 1 : 0.5,
                  }}
                  onPress={() => Linking.openURL(`https://rgossips.com/kit/${handle}`)}>
                  <LinearGradient
                    colors={VIOLET_BLUE}
                    locations={VIOLET_BLUE_LOCATIONS}
                    start={ANGLE_96.start}
                    end={ANGLE_96.end}
                    style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                  />
                  <Text style={{ color: '#fff', fontSize: 11.5, fontWeight: '700' }}>
                    {t('PocketFriendlyCreators.perReel', { rate: formatRate(c._reelRate) })}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
