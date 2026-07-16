// SubmitDeliverablesModal — multi-link form for the three influencer flows:
//   1. Initial submission (status = "approved")
//   2. Resubmission after revision (status = "revision_needed")
//   3. Live link submission after work accepted (status = "accepted")
//
// All three call POST /functions/v1/submit-deliverables with body
//   { applicationId, submissionLinks: [{type, label, url}] }
//
// Deliverables list is rebuilt from `campaign.contentTypesRequired`
// (e.g. ["reels:2", "stories:3"]) so "Reels 1", "Reels 2", "Stories 1", … get
// their own URL field. When the brand requested a partial revision, only the
// matching rows are highlighted as needing a fresh URL — see the
// `needsRevision` flag below.
//
// Mirrors web logic in src/app/influencer/offers/[id]/page.js (function
// SubmitDeliverablesModal). Keep in sync.

import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Upload, X} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {invokeFn, EdgeFunctionError} from '../lib/api';
import {
  detectInstagramLinkType,
  expectedLinkType,
  labelForLinkType,
  normaliseInstagramUrl,
} from '../utils/instagram-url';

interface Campaign {
  applicationId?: string;
  applicationStatus?: string;
  title?: string;
  contentTypesRequired?: string[];
  submissionLinks?: {type: string; label: string; url: string}[];
  rejectionReason?: string | {note?: string; links?: string[]; from?: string};
}

interface Props {
  visible: boolean;
  campaign: Campaign | null;
  onClose: () => void;
  onSuccess: () => void;
}

type Deliverable = {
  key: string;
  label: string;
  type: string;
  needsRevision: boolean;
};

export default function SubmitDeliverablesModal({
  visible,
  campaign,
  onClose,
  onSuccess,
}: Props) {
  const {t} = useTranslation();
  const isRevision = campaign?.applicationStatus === 'revision_needed';

  // Parse revision info — the brand can send a JSON blob with a note + the
  // specific deliverable labels they want re-shot, or a flat string.
  let revisionNote = '';
  let revisionRequested: string[] = [];
  let revisionFrom = '';
  if (isRevision && campaign?.rejectionReason) {
    try {
      const parsed =
        typeof campaign.rejectionReason === 'string'
          ? JSON.parse(campaign.rejectionReason)
          : campaign.rejectionReason;
      revisionNote = parsed?.note || '';
      revisionRequested = (parsed?.links || []).map((l: string) => l.toLowerCase());
      revisionFrom = parsed?.from || '';
    } catch {
      // Fall back to the raw string as the note.
      revisionNote =
        typeof campaign.rejectionReason === 'string'
          ? campaign.rejectionReason
          : '';
    }
  }

  // Live-links flow: status === "accepted" (initial live-link upload) OR a
  // revision asked specifically for live-link rework.
  const isLiveLinksFlow =
    campaign?.applicationStatus === 'accepted' ||
    (isRevision && revisionFrom === 'live_submitted');

  // Expand contentTypesRequired into one row per deliverable instance.
  const deliverables: Deliverable[] = useMemo(() => {
    return (campaign?.contentTypesRequired || []).flatMap(item => {
      const [type, countStr] = item.split(':');
      const count = parseInt(countStr, 10) || 1;
      const baseLabel = type.charAt(0).toUpperCase() + type.slice(1);
      return Array.from({length: count}, (_, i) => {
        const itemLabel = `${baseLabel}${count > 1 ? ` ${i + 1}` : ''}`.trim();
        const itemLabelLc = itemLabel.toLowerCase();
        const typeLc = type.toLowerCase();
        // needsRevision = true when this row's URL needs replacing:
        //   - normal (non-revision) submission, OR
        //   - blanket revision (no specific labels requested), OR
        //   - the revision list mentions this specific item / type
        const needsRevision =
          !isRevision ||
          revisionRequested.length === 0 ||
          revisionRequested.some(
            r =>
              itemLabelLc === r ||
              itemLabelLc.includes(r) ||
              r.includes(itemLabelLc) ||
              typeLc === r,
          );
        return {key: `${type}_${i + 1}`, label: itemLabel, type, needsRevision};
      });
    });
  }, [campaign, isRevision, revisionRequested]);

  // Prefill state — when revising deliverables, keep the URLs the brand was
  // happy with and clear the ones needing rework. Live-links flow always
  // starts blank because the prior `submission_links` were deliverable URLs,
  // not live posts.
  const [links, setLinks] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    const existingLinks = isLiveLinksFlow ? [] : campaign?.submissionLinks || [];
    deliverables.forEach((d, i) => {
      const matchByLabel = existingLinks.find(el => el.label === d.label);
      const matchByIndex = existingLinks[i];
      const existing = matchByLabel || matchByIndex;
      if (isRevision && d.needsRevision) {
        initial[d.key] = '';
      } else if (existing?.url && !isLiveLinksFlow) {
        initial[d.key] = existing.url;
      } else {
        initial[d.key] = '';
      }
    });
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const allFilled =
    deliverables.length > 0 && deliverables.every(d => links[d.key]?.trim());

  const linkAnalysis = useMemo(() => {
    const counts = new Map<string, number>();
    deliverables.forEach(d => {
      const url = links[d.key]?.trim();
      if (!url) return;
      const key = normaliseInstagramUrl(url);
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const out: Record<
      string,
      {detected: any; expected: any; mismatch: boolean; duplicate: boolean}
    > = {};
    deliverables.forEach(d => {
      const url = links[d.key]?.trim();
      const expected = expectedLinkType(d.type);
      if (!url) {
        out[d.key] = {detected: null, expected, mismatch: false, duplicate: false};
        return;
      }
      const detected = detectInstagramLinkType(url);
      const mismatch = !!(
        expected &&
        detected !== 'unknown' &&
        detected !== expected
      );
      const norm = normaliseInstagramUrl(url);
      const duplicate = !!norm && (counts.get(norm) || 0) > 1;
      out[d.key] = {detected, expected, mismatch, duplicate};
    });
    return out;
  }, [links, deliverables]);

  const hasDuplicates = Object.values(linkAnalysis).some(a => a.duplicate);

  const handleSubmit = async () => {
    if (!allFilled || submitting) return;
    if (hasDuplicates) {
      setError(t('SubmitDeliverablesModal.duplicateError'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const submissionLinks = deliverables.map(d => ({
        type: d.type,
        label: d.label,
        url: links[d.key].trim(),
      }));
      const data = await invokeFn<{success?: boolean}>('submit-deliverables', {
        applicationId: campaign?.applicationId,
        submissionLinks,
      });
      if (data?.success) {
        onSuccess();
      } else {
        setError(t('SubmitDeliverablesModal.unexpectedResponse'));
      }
    } catch (err) {
      if (err instanceof EdgeFunctionError) {
        setError(err.message);
      } else {
        setError((err as Error)?.message || t('SubmitDeliverablesModal.failedToSubmit'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const heading = isLiveLinksFlow
    ? t('SubmitDeliverablesModal.submitLiveLinks')
    : t('SubmitDeliverablesModal.uploadSubmissions');

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{flex: 1, backgroundColor: 'white'}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{flex: 1, paddingRight: 12}}>
            <Text style={styles.heading} numberOfLines={1}>
              {heading}
            </Text>
            <Text style={styles.subheading} numberOfLines={1}>
              {t('SubmitDeliverablesModal.subheading', {
                title: campaign?.title,
                count: deliverables.length,
              })}
            </Text>
            {isLiveLinksFlow ? (
              <Text style={styles.liveHint}>
                {t('SubmitDeliverablesModal.liveHint')}
              </Text>
            ) : null}
          </View>
          <Pressable onPress={onClose} style={styles.close} hitSlop={8}>
            <X size={18} color="#94A3B8" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{padding: 20, gap: 16}}
          keyboardShouldPersistTaps="handled">
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {isRevision && revisionNote ? (
            <View style={styles.revisionBox}>
              <Text style={styles.revisionLabel}>{t('SubmitDeliverablesModal.revisionNoteLabel')}</Text>
              <Text style={styles.revisionNote}>{revisionNote}</Text>
            </View>
          ) : null}

          <Text style={styles.intro}>
            {isRevision
              ? t('SubmitDeliverablesModal.introRevision')
              : t('SubmitDeliverablesModal.introNormal')}
          </Text>

          {deliverables.map(d => {
            const analysis = linkAnalysis[d.key] || {};
            const placeholder =
              analysis.expected === 'story'
                ? 'https://www.instagram.com/stories/…'
                : analysis.expected === 'post'
                  ? 'https://www.instagram.com/p/…'
                  : 'https://www.instagram.com/reel/…';
            const hasUrl = !!links[d.key]?.trim();
            const dimmed = isRevision && !d.needsRevision;
            return (
              <View
                key={d.key}
                style={[styles.row, dimmed && {opacity: 0.5}]}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowLabel}>{d.label}</Text>
                  {isRevision && d.needsRevision ? (
                    <Text style={styles.revisionBadge}>{t('SubmitDeliverablesModal.needsRevisionBadge')}</Text>
                  ) : null}
                  {dimmed ? (
                    <Text style={styles.kept}>{t('SubmitDeliverablesModal.keepAsIs')}</Text>
                  ) : null}
                </View>
                <TextInput
                  value={links[d.key] || ''}
                  onChangeText={v => setLinks(prev => ({...prev, [d.key]: v}))}
                  placeholder={placeholder}
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  editable={!dimmed}
                  style={styles.input}
                />
                {hasUrl ? (
                  <View style={styles.analysisRow}>
                    {analysis.detected && analysis.detected !== 'unknown' ? (
                      <Text style={styles.detected}>
                        {t('SubmitDeliverablesModal.detectedType', {
                          type: labelForLinkType(analysis.detected),
                        })}
                      </Text>
                    ) : analysis.detected === 'unknown' ? (
                      <Text style={styles.warn}>
                        {t('SubmitDeliverablesModal.couldntDetect')}
                      </Text>
                    ) : null}
                    {analysis.mismatch ? (
                      <Text style={styles.mismatch}>
                        {t('SubmitDeliverablesModal.mismatchTypes', {
                          expected: labelForLinkType(analysis.expected),
                          detected: labelForLinkType(analysis.detected),
                        })}
                      </Text>
                    ) : null}
                    {analysis.duplicate ? (
                      <Text style={styles.mismatch}>
                        {t('SubmitDeliverablesModal.duplicateRow')}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}

          {deliverables.length === 0 ? (
            <Text style={styles.warn}>
              {t('SubmitDeliverablesModal.noDeliverables')}
            </Text>
          ) : null}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={onClose} style={[styles.btn, styles.btnGhost]}>
            <Text style={styles.btnGhostText}>{t('SubmitDeliverablesModal.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!allFilled || submitting}
            style={[styles.btn, styles.btnPrimary, {opacity: !allFilled || submitting ? 0.5 : 1}]}>
            <LinearGradient
              colors={['#9810FA', '#E60076']}
              style={styles.gradientBg}
            />
            {submitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Upload size={16} color="white" />
                <Text style={styles.btnPrimaryText}>
                  {isLiveLinksFlow
                    ? t('SubmitDeliverablesModal.submitLiveLinks')
                    : isRevision
                      ? t('SubmitDeliverablesModal.resubmit')
                      : t('SubmitDeliverablesModal.submit')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  heading: {fontSize: 16, fontWeight: '700', color: '#0f172a'},
  subheading: {fontSize: 11, color: '#94a3b8', marginTop: 2},
  liveHint: {fontSize: 10, color: '#059669', fontWeight: '600', marginTop: 4},
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {fontSize: 13, color: '#dc2626'},
  revisionBox: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  revisionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d97706',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  revisionNote: {fontSize: 12, color: '#92400e'},
  intro: {fontSize: 12, color: '#64748b'},
  row: {gap: 8},
  rowHeader: {flexDirection: 'row', alignItems: 'center', gap: 8},
  rowLabel: {fontSize: 13, fontWeight: '700', color: '#0f172a'},
  revisionBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#d97706',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  kept: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16a34a',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  input: {
    height: 44,
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0f172a',
  },
  analysisRow: {gap: 2},
  detected: {fontSize: 11, color: '#16a34a', fontWeight: '600'},
  warn: {fontSize: 11, color: '#f59e0b', fontWeight: '600'},
  mismatch: {fontSize: 11, color: '#dc2626', fontWeight: '600'},
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
  },
  btn: {flex: 1, height: 48, borderRadius: 14, overflow: 'hidden'},
  btnGhost: {
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: {color: '#0f172a', fontSize: 14, fontWeight: '600'},
  // Padding/layout for the primary button live on the TouchableOpacity itself
  // (see styles.btnPrimary). The gradient is rendered as an absolute
  // background fill so iOS measures content + padding against the touchable
  // rather than the gradient view.
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gradientBg: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0},
  btnPrimaryText: {color: 'white', fontSize: 14, fontWeight: '700'},
});
