// RatingModal — N-axis 5-star rating, upserts to public.campaign_ratings.
//
// Mirrors web app src/components/RatingModal.jsx. Used on both sides of the
// two-way rating system (web commit 12adeaa) — the same component renders
// for influencer-rating-brand and brand-rating-influencer; only the `sections`
// prop and `raterRole` differ.
//
// Conflict key on the upsert is (application_id, rater_role) so a user can
// re-submit and the latest values win.

import React, {useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Star, X} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {supabase} from '../utils/supabase';

export type RatingValues = {
  target_rating?: number;
  brief_clarity?: number;
  fairness?: number;
  product_quality?: number;
  value_for_effort?: number;
  [k: string]: number | undefined;
};

export type RatingSection = {
  key: keyof RatingValues;
  label: string;
  helper?: string;
};

interface Props {
  visible: boolean;
  onClose: () => void;
  applicationId: string;
  campaignId: string;
  brandId: string;
  influencerId: string;
  raterRole?: 'influencer' | 'brand';
  title?: string;
  subtitle?: string;
  sections: RatingSection[];
  primaryCta?: string;
  secondaryCta?: string;
  initialValues?: RatingValues;
  // Fires after a successful upsert, before onClose. Brand side uses this
  // to also transition the application to "payment" after rating.
  onPrimary?: () => void | Promise<void>;
  onSaved?: (values: RatingValues) => void;
  onSkip?: () => void;
}

export default function RatingModal({
  visible,
  onClose,
  applicationId,
  campaignId,
  brandId,
  influencerId,
  raterRole = 'influencer',
  title,
  subtitle,
  sections,
  primaryCta,
  secondaryCta,
  initialValues,
  onPrimary,
  onSaved,
  onSkip,
}: Props) {
  const {t} = useTranslation();
  const [values, setValues] = useState<RatingValues>(initialValues || {});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resolvedTitle = title ?? t('RatingModal.title');
  const resolvedPrimaryCta = primaryCta ?? t('RatingModal.submitRating');
  const resolvedSecondaryCta = secondaryCta ?? t('RatingModal.skipForNow');

  const setStar = (key: keyof RatingValues, n: number) => {
    setValues(v => ({...v, [key]: n}));
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    // Validate: every section has a 1-5 value.
    for (const s of sections) {
      const v = values[s.key];
      if (!v || v < 1 || v > 5) {
        setError(t('RatingModal.pleaseRate', {label: s.label}));
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        application_id: applicationId,
        campaign_id: campaignId,
        brand_id: brandId,
        influencer_id: influencerId,
        rater_role: raterRole,
      };
      for (const s of sections) {
        payload[s.key as string] = values[s.key];
      }
      const {error: err} = await supabase
        .from('campaign_ratings')
        .upsert(payload, {onConflict: 'application_id,rater_role'});
      if (err) {
        setError(err.message);
        return;
      }
      // Brand-side rating triggers a status transition (rate → payment).
      // Run it before closing so the parent sees the new state on refetch.
      if (onPrimary) {
        await onPrimary();
      }
      onSaved?.(values);
      onClose();
    } catch (e: any) {
      setError(e?.message || t('RatingModal.failedToSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (submitting) return;
    // Brand "Skip & Approve" also releases payment without saving a rating.
    if (onSkip) {
      try {
        await onSkip();
      } catch {}
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={submitting ? undefined : onClose}>
      <Pressable
        style={styles.scrim}
        onPress={submitting ? undefined : onClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={{flex: 1, paddingRight: 12}}>
              <Text style={styles.title}>{resolvedTitle}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={submitting}
              hitSlop={8}
              style={styles.close}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{maxHeight: 360}} contentContainerStyle={{paddingVertical: 8}}>
            {sections.map(section => {
              const cur = values[section.key] || 0;
              return (
                <View key={String(section.key)} style={styles.section}>
                  <Text style={styles.sectionLabel}>{section.label}</Text>
                  {section.helper ? (
                    <Text style={styles.sectionHelper}>{section.helper}</Text>
                  ) : null}
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <TouchableOpacity
                        key={n}
                        onPress={() => setStar(section.key, n)}
                        hitSlop={4}
                        disabled={submitting}>
                        <Star
                          size={32}
                          color="#F59E0B"
                          fill={n <= cur ? '#F59E0B' : 'transparent'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSkip}
              disabled={submitting}
              style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>{resolvedSecondaryCta}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              style={[styles.btn, styles.btnPrimary]}>
              {submitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.btnPrimaryText}>{resolvedPrimaryCta}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'white',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  header: {flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8},
  close: {padding: 4},
  title: {fontSize: 18, fontWeight: '700', color: '#0f172a'},
  subtitle: {fontSize: 13, color: '#64748b', marginTop: 4},
  section: {paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e2e8f0'},
  sectionLabel: {fontSize: 14, fontWeight: '700', color: '#0f172a'},
  sectionHelper: {fontSize: 12, color: '#64748b', marginTop: 2},
  starsRow: {flexDirection: 'row', gap: 8, marginTop: 10, justifyContent: 'center'},
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  errorText: {fontSize: 12, color: '#dc2626'},
  footer: {flexDirection: 'row', gap: 10, marginTop: 14},
  btn: {flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  btnGhost: {backgroundColor: '#f1f5f9'},
  btnGhostText: {color: '#0f172a', fontSize: 14, fontWeight: '600'},
  btnPrimary: {backgroundColor: '#E60076'},
  btnPrimaryText: {color: 'white', fontSize: 14, fontWeight: '700'},
});
