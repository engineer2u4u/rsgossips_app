// Brand trust score + completion widget for the brand profile screen.
//
// Pulls real data via useBrandTrustScore (campaign_ratings + campaigns +
// campaign_applications). Shows:
//   1. The 0–1000 score with a band pill (LOW / GOOD / HIGH)
//   2. A breakdown of the three pillars and their weighted contribution
//   3. The profile completion sub-bar with a list of missing fields
//
// Mirrors the layout the web brand profile page uses, condensed for mobile.

import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {Award, CheckCircle2, ShieldCheck, Star, Truck} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {useBrandTrustScore} from '../../hooks/useBrandTrustScore';

const BAND_STYLES = {
  HIGH: {bg: '#D1FAE5', text: '#065F46', labelKey: 'high'},
  GOOD: {bg: '#DBEAFE', text: '#1E40AF', labelKey: 'good'},
  LOW: {bg: '#FEE2E2', text: '#991B1B', labelKey: 'low'},
};

export function BrandTrustWidget() {
  const {t} = useTranslation();
  const {loading, trust, completion} = useBrandTrustScore();

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator color="#5851DB" size="small" />
      </View>
    );
  }

  const band = BAND_STYLES[trust.band];
  const {influencerRating, campaignDelivery, profileCompleteness} =
    trust.breakdown;

  return (
    <View style={s.card}>
      {/* Header — score + band */}
      <View style={s.header}>
        <View style={{flex: 1}}>
          <Text style={s.label}>{t('BrandsBrandTrustWidget.trustScore')}</Text>
          <View style={s.scoreRow}>
            <Text style={s.score}>{trust.score}</Text>
            <Text style={s.scoreMax}>{t('BrandsBrandTrustWidget.scoreMax')}</Text>
          </View>
        </View>
        <View style={[s.bandPill, {backgroundColor: band.bg}]}>
          <Award size={11} color={band.text} />
          <Text style={[s.bandText, {color: band.text}]}>
            {t(`BrandsBrandTrustWidget.band.${band.labelKey}`)}
          </Text>
        </View>
      </View>

      {/* Overall bar */}
      <View style={s.overallBar}>
        <View
          style={[
            s.overallFill,
            {
              width: `${Math.min(100, trust.percent)}%`,
              backgroundColor:
                trust.band === 'HIGH'
                  ? '#10b981'
                  : trust.band === 'GOOD'
                    ? '#3b82f6'
                    : '#ef4444',
            },
          ]}
        />
      </View>
      <Text style={s.percentHint}>
        {t('BrandsBrandTrustWidget.percentHint', {percent: trust.percent})}
      </Text>

      {/* Breakdown */}
      <View style={s.breakdownList}>
        <BreakdownRow
          Icon={Star}
          color="#f59e0b"
          title={t('BrandsBrandTrustWidget.influencerRatings')}
          weight={influencerRating.weight}
          percent={influencerRating.percent}
          subtitle={
            influencerRating.count
              ? t('BrandsBrandTrustWidget.ratingsCount', {
                  count: influencerRating.count,
                })
              : t('BrandsBrandTrustWidget.noRatings')
          }
        />
        <BreakdownRow
          Icon={Truck}
          color="#6366f1"
          title={t('BrandsBrandTrustWidget.campaignDelivery')}
          weight={campaignDelivery.weight}
          percent={campaignDelivery.percent}
          subtitle={
            campaignDelivery.total > 0
              ? t('BrandsBrandTrustWidget.deliverySubtitle', {
                  completed: campaignDelivery.completedCount,
                  stale: campaignDelivery.staleCount,
                })
              : t('BrandsBrandTrustWidget.noCampaigns')
          }
        />
        <BreakdownRow
          Icon={ShieldCheck}
          color="#10b981"
          title={t('BrandsBrandTrustWidget.profileCompleteness')}
          weight={profileCompleteness.weight}
          percent={profileCompleteness.percent}
          subtitle={
            completion.missing.length === 0
              ? t('BrandsBrandTrustWidget.allSet')
              : t('BrandsBrandTrustWidget.missing', {
                  fields: completion.missing.join(', '),
                })
          }
        />
      </View>
    </View>
  );
}

function BreakdownRow({
  Icon,
  color,
  title,
  weight,
  percent,
  subtitle,
}: {
  Icon: any;
  color: string;
  title: string;
  weight: number;
  percent: number;
  subtitle: string;
}) {
  const {t} = useTranslation();
  return (
    <View style={s.row}>
      <View style={[s.rowIcon, {backgroundColor: `${color}1A`}]}>
        <Icon size={14} color={color} />
      </View>
      <View style={{flex: 1, minWidth: 0}}>
        <View style={s.rowTitleRow}>
          <Text style={s.rowTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={s.rowWeightPill}>
            <Text style={s.rowWeightText}>
              {t('BrandsBrandTrustWidget.weight', {
                weight: Math.round(weight * 100),
              })}
            </Text>
          </View>
        </View>
        <Text style={s.rowSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
        <View style={s.rowBar}>
          <View
            style={[
              s.rowBarFill,
              {
                width: `${Math.min(100, percent)}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
      </View>
      {percent === 100 ? (
        <CheckCircle2 size={14} color="#10b981" />
      ) : (
        <Text style={s.rowPercent}>{percent}%</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  loadingWrap: {paddingVertical: 24, alignItems: 'center'},
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
  },
  header: {flexDirection: 'row', alignItems: 'center'},
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  scoreRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 4},
  score: {fontSize: 30, fontWeight: '900', color: '#0f172a', lineHeight: 32},
  scoreMax: {fontSize: 12, fontWeight: '700', color: '#94a3b8', marginBottom: 2},
  bandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  bandText: {fontSize: 10, fontWeight: '800', letterSpacing: 0.5},
  overallBar: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  overallFill: {height: '100%'},
  percentHint: {fontSize: 10, color: '#94a3b8', marginTop: -8},
  breakdownList: {gap: 12, marginTop: 4},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12},
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  rowTitle: {fontSize: 12, fontWeight: '800', color: '#0f172a', flex: 1},
  rowWeightPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  rowWeightText: {fontSize: 9, fontWeight: '800', color: '#64748b'},
  rowSubtitle: {fontSize: 10, color: '#94a3b8', marginTop: 2, marginBottom: 4},
  rowBar: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  rowBarFill: {height: '100%'},
  rowPercent: {fontSize: 11, fontWeight: '800', color: '#64748b', width: 36, textAlign: 'right'},
});
