// Brand trust score + completion widget for the brand profile screen.
//
// Reads the server-computed score via useBrandTrustScore
// (brand-campaigns { action: "trustScore" }). Shows:
//   1. The 300–900 score with a band pill
//      (Elite / Trusted / Established / Emerging / Building Trust)
//   2. The five weighted pillars and where each one stands
//   3. The profile completion sub-line with a list of missing fields
//
// Mirrors the layout the web brand profile page uses, condensed for mobile.

import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {
  Activity,
  Award,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {useBrandTrustScore} from '../../hooks/useBrandTrustScore';
import {trustBandColors, trustBandKey} from '../../lib/brandProfile';

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

  const bandColors = trustBandColors(trust.band);
  const bandLabel = t(`TrustBands.${trustBandKey(trust.band)}`);
  const {
    influencerReviews,
    campaignExecution,
    verification,
    communication,
    engagement,
  } = trust.breakdown;

  const verifiedCount = Object.values(verification.items).filter(Boolean).length;

  return (
    <View style={s.card}>
      {/* Header — score + band */}
      <View style={s.header}>
        <View style={{flex: 1}}>
          <Text style={s.label}>{t('BrandsBrandTrustWidget.trustScore')}</Text>
          <View style={s.scoreRow}>
            <Text style={s.score}>{trust.score}</Text>
            <Text style={s.scoreMax}>
              {t('BrandsBrandTrustWidget.scoreMax', {max: trust.scaleMax})}
            </Text>
          </View>
        </View>
        <View style={[s.bandPill, {backgroundColor: bandColors.bg}]}>
          <Award size={11} color={bandColors.on} />
          <Text style={[s.bandText, {color: bandColors.on}]}>{bandLabel}</Text>
        </View>
      </View>

      {/* Overall bar — the weighted pillar average, i.e. where the score sits
          between 300 and 900. */}
      <View style={s.overallBar}>
        <View
          style={[
            s.overallFill,
            {
              width: `${Math.max(2, Math.min(100, trust.overallPercent))}%`,
              backgroundColor: bandColors.accent,
            },
          ]}
        />
      </View>
      <Text style={s.percentHint}>
        {t('BrandsBrandTrustWidget.percentHint', {
          percent: trust.overallPercent,
        })}
      </Text>

      {/* Cold start — a new brand is capped until it has delivered. */}
      {trust.coldStart && (
        <View style={s.coldStart}>
          <Text style={s.coldStartText}>
            {t('BrandsBrandTrustWidget.coldStart', {
              cap: trust.coldStartCap,
              campaigns: trust.coldStartThreshold,
            })}
          </Text>
        </View>
      )}

      {/* Breakdown — the five weighted pillars */}
      <View style={s.breakdownList}>
        <BreakdownRow
          Icon={Star}
          color="#f59e0b"
          title={t('BrandsBrandTrustWidget.influencerReviews')}
          weight={influencerReviews.weight}
          percent={influencerReviews.percent}
          subtitle={
            influencerReviews.count
              ? t('BrandsBrandTrustWidget.reviewsCount', {
                  count: influencerReviews.count,
                })
              : t('BrandsBrandTrustWidget.noReviews')
          }
        />
        <BreakdownRow
          Icon={Truck}
          color="#6366f1"
          title={t('BrandsBrandTrustWidget.campaignExecution')}
          weight={campaignExecution.weight}
          percent={campaignExecution.percent}
          subtitle={
            campaignExecution.hasData
              ? t('BrandsBrandTrustWidget.executionSubtitle', {
                  completed: campaignExecution.finalAcceptedCount,
                  started: campaignExecution.approvedCount,
                })
              : t('BrandsBrandTrustWidget.noExecution')
          }
        />
        <BreakdownRow
          Icon={ShieldCheck}
          color="#10b981"
          title={t('BrandsBrandTrustWidget.verification')}
          weight={verification.weight}
          percent={verification.percent}
          subtitle={t('BrandsBrandTrustWidget.verificationSubtitle', {
            done: verifiedCount,
            total: 4,
          })}
        />
        <BreakdownRow
          Icon={MessageSquare}
          color="#0ea5e9"
          title={t('BrandsBrandTrustWidget.communication')}
          weight={communication.weight}
          percent={communication.percent}
          subtitle={
            communication.hasData
              ? t('BrandsBrandTrustWidget.communicationSubtitle', {
                  response: communication.responseAvg,
                  richness: communication.richnessPct,
                })
              : t('BrandsBrandTrustWidget.noCommunication')
          }
        />
        <BreakdownRow
          Icon={Activity}
          color="#a855f7"
          title={t('BrandsBrandTrustWidget.engagement')}
          weight={engagement.weight}
          percent={engagement.percent}
          subtitle={t('BrandsBrandTrustWidget.engagementSubtitle', {
            n: engagement.campaignsLast90d,
            profile: engagement.profileCompletionPct,
          })}
        />
      </View>

      {/* Profile completion — feeds the engagement pillar, but the brand can
          act on it directly, so it gets its own line with the field names. */}
      <View style={s.completion}>
        <View style={s.completionHead}>
          <Text style={s.completionTitle}>
            {t('BrandsBrandTrustWidget.profileCompleteness')}
          </Text>
          <Text style={s.completionPct}>{completion.percent}%</Text>
        </View>
        <View style={s.rowBar}>
          <View
            style={[
              s.rowBarFill,
              {
                width: `${Math.min(100, completion.percent)}%`,
                backgroundColor: '#10b981',
              },
            ]}
          />
        </View>
        <Text style={s.rowSubtitle} numberOfLines={2}>
          {completion.missing.length === 0
            ? t('BrandsBrandTrustWidget.allSet')
            : t('BrandsBrandTrustWidget.missing', {
                fields: completion.missing.join(', '),
              })}
        </Text>
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
  coldStart: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: -4,
  },
  coldStartText: {fontSize: 10, fontWeight: '700', color: '#92400E'},
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
  completion: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    gap: 2,
  },
  completionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completionTitle: {fontSize: 12, fontWeight: '800', color: '#0f172a'},
  completionPct: {fontSize: 11, fontWeight: '800', color: '#64748b'},
});
