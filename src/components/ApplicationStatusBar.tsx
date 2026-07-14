// ApplicationStatusBar — collaboration tracker (rewritten per design).
//
// Mirrors the screenshot the user shipped: a soft-white card with a
// "YOUR COLLABORATION" eyebrow, "Application Status" title, a "Step N of 7"
// crown pill, a percent-complete line + status text, a gradient progress
// bar, then a numbered vertical timeline where the active step has a
// gradient ring + an expanded copy card below it.
//
// Status enum is unchanged:
//   pending → approved → submitted → accepted → live_submitted → payment → completed
// Plus revision_needed and rejected, which both map to the "submitted" tier.

import React, { useState } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Check,
  Clock,
  Crown,
  ExternalLink,
  Instagram,
  Upload,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { BRAND_GRADIENT_WARM } from '../theme/brand';
import SubmitDeliverablesModal from './SubmitDeliverablesModal';

type Status =
  | 'pending'
  | 'approved'
  | 'submitted'
  | 'accepted'
  | 'live_submitted'
  | 'payment'
  | 'completed'
  | 'revision_needed'
  | 'rejected';

interface Props {
  status: Status;
  campaign: any;
  refetch?: () => void;
}

interface Step {
  // Stable logic key. All user-facing copy (label, active-card title/body,
  // header one-liner) is resolved via i18n at render — see
  // ApplicationStatusBar.steps.<key>.* in the translation catalog.
  key: string;
}

const STATUS_STEPS: Step[] = [
  { key: 'pending' },
  { key: 'approved' },
  { key: 'submitted' },
  { key: 'accepted' },
  { key: 'live_submitted' },
  { key: 'payment' },
  { key: 'completed' },
];

function parseRevisionPayload(raw: any): { note: string; links: string[] } {
  if (!raw) return { note: '', links: [] };
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return { note: parsed?.note || '', links: parsed?.links || [] };
  } catch {
    return { note: typeof raw === 'string' ? raw : '', links: [] };
  }
}

function parseRejectionReason(raw: any): string {
  if (!raw) return '';
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return (
      parsed?.note || parsed?.reason || (typeof raw === 'string' ? raw : '')
    );
  } catch {
    return typeof raw === 'string' ? raw : '';
  }
}

export default function ApplicationStatusBar({
  status,
  campaign,
  refetch,
}: Props) {
  const { t } = useTranslation();
  const [showSubmit, setShowSubmit] = useState(false);

  const isRevision = status === 'revision_needed';
  const isRejected = status === 'rejected';
  // For both revision/rejected, show progress at the "submitted" tier — the
  // brand looked at what we sent and bounced it, so we shouldn't pretend
  // we're back at pending.
  const effectiveStatus: string =
    isRevision || isRejected ? 'submitted' : status;
  const currentStepIndex = Math.max(
    STATUS_STEPS.findIndex(s => s.key === effectiveStatus),
    0,
  );
  const currentStep = STATUS_STEPS[currentStepIndex];

  // Percent complete: each step is worth 1/7 of the bar. We round to the
  // nearest integer for display so the bar and the number stay aligned.
  const percent = Math.round(
    ((currentStepIndex + 1) / STATUS_STEPS.length) * 100,
  );

  const canUpload =
    status === 'approved' ||
    status === 'revision_needed' ||
    status === 'accepted';

  const submitLabel =
    status === 'accepted'
      ? t('ApplicationStatusBar.submitLiveLinks')
      : isRevision
        ? t('ApplicationStatusBar.resubmitDeliverables')
        : t('ApplicationStatusBar.uploadSubmission');

  const submissionLinks: { type: string; label: string; url: string }[] =
    campaign?.submissionLinks || [];

  return (
    <View style={styles.card}>
      {/* Top eyebrow + step pill */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.eyebrow}>
            {t('ApplicationStatusBar.eyebrow')}
          </Text>
          <Text style={styles.title}>{t('ApplicationStatusBar.title')}</Text>
        </View>
        {/* <LinearGradient
          colors={[...BRAND_GRADIENT_WARM]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.stepPill}>
          <Crown size={12} color="#fff" />
          <Text style={styles.stepPillText}>
            Step <Text style={styles.stepPillNumber}>{currentStepIndex + 1}</Text>{' '}
            of {STATUS_STEPS.length}
          </Text>
        </LinearGradient> */}
      </View>

      {/* Progress headline — drop the wasted LinearGradient background
          (it sat behind pink text so was never visible) and let the
          progressHeader flow as a plain row. */}
      <View style={styles.progressHeader}>
        <Text style={styles.percentText}>
          {t('ApplicationStatusBar.percentComplete', { percent })}
        </Text>
        <View style={styles.headerStatusBlock}>
          <Clock size={12} color="#EC4899" />
          <Text style={styles.headerStatusText}>
            {t(`ApplicationStatusBar.steps.${currentStep.key}.headerStatus`)}
          </Text>
        </View>
      </View>

      {/* Gradient progress bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFillWrap, { width: `${percent}%` }]}>
          <LinearGradient
            colors={[...BRAND_GRADIENT_WARM]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      </View>

      {/* Vertical step timeline */}
      <View style={styles.timeline}>
        {STATUS_STEPS.map((step, i) => {
          const isDone = i < currentStepIndex;
          const isCurrent = i === currentStepIndex;
          const isLast = i === STATUS_STEPS.length - 1;
          return (
            <View key={step.key} style={styles.stepRow}>
              {/* Left rail: numbered circle + connector */}
              <View style={styles.stepRail}>
                {isDone ? (
                  <LinearGradient
                    colors={['#34D399', '#10B981']}
                    style={styles.stepDot}
                  >
                    <Check size={14} color="#fff" strokeWidth={3} />
                  </LinearGradient>
                ) : isCurrent ? (
                  // Gradient-ringed active step — uses LinearGradient as the
                  // ring with a white inner disc that holds the number.
                  <LinearGradient
                    colors={[...BRAND_GRADIENT_WARM]}
                    style={styles.stepDotRing}
                  >
                    <View style={styles.stepDotInner}>
                      <Text style={styles.stepNumberActive}>{i + 1}</Text>
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={[styles.stepDot, styles.stepDotIdle]}>
                    <Text style={styles.stepNumberIdle}>{i + 1}</Text>
                  </View>
                )}
                {!isLast ? (
                  <View
                    style={[
                      styles.stepConnector,
                      isDone ? styles.stepConnectorDone : null,
                    ]}
                  />
                ) : null}
              </View>

              {/* Right side: label + optional active card */}
              <View style={{ flex: 1, paddingBottom: isLast ? 0 : 12 }}>
                <Text
                  style={[
                    styles.stepLabel,
                    isCurrent
                      ? styles.stepLabelActive
                      : isDone
                        ? styles.stepLabelDone
                        : styles.stepLabelIdle,
                  ]}
                >
                  {t(`ApplicationStatusBar.steps.${step.key}.label`)}
                </Text>

                {isCurrent ? (
                  <View style={styles.activeCard}>
                    <View style={styles.activeCardHeader}>
                      <View style={styles.activeDot} />
                      <Text style={styles.activeCardTitle}>
                        {t(`ApplicationStatusBar.steps.${step.key}.activeTitle`)}
                      </Text>
                    </View>
                    <Text style={styles.activeCardBody}>
                      {t(`ApplicationStatusBar.steps.${step.key}.activeBody`)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      {/* Revision / rejected branches */}
      {isRevision ? (
        <RevisionBanner reason={campaign?.rejectionReason} />
      ) : null}
      {isRejected ? (
        <RejectedBanner reason={campaign?.rejectionReason} />
      ) : null}

      {/* Upload / Resubmit / Live links button */}
      {canUpload ? (
        <TouchableOpacity
          onPress={() => setShowSubmit(true)}
          activeOpacity={0.9}
          style={styles.uploadBtn}
        >
          <LinearGradient
            colors={['#9810FA', '#E60076']}
            style={styles.uploadBtnInner}
          >
            <Upload size={16} color="white" />
            <Text style={styles.uploadBtnText}>{submitLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : null}

      {/* Submitted deliverables list */}
      {submissionLinks.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Text style={styles.submissionsHeader}>
            {t('ApplicationStatusBar.yourSubmissions')}
          </Text>
          <View style={{ gap: 8 }}>
            {submissionLinks.map((link, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.85}
                onPress={() => Linking.openURL(link.url)}
                style={styles.linkRow}
              >
                <LinearGradient
                  colors={['#FCAF45', '#E1306C', '#833AB4']}
                  style={styles.igBadge}
                >
                  <Instagram size={14} color="white" />
                </LinearGradient>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.linkLabel}>
                    {link.label || link.type}
                  </Text>
                  <Text style={styles.linkUrl} numberOfLines={1}>
                    {link.url}
                  </Text>
                </View>
                <ExternalLink size={14} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <SubmitDeliverablesModal
        visible={showSubmit}
        campaign={campaign}
        onClose={() => setShowSubmit(false)}
        onSuccess={() => {
          setShowSubmit(false);
          refetch?.();
        }}
      />
    </View>
  );
}

function RevisionBanner({ reason }: { reason: any }) {
  const { t } = useTranslation();
  const { note, links } = parseRevisionPayload(reason);
  return (
    <View style={styles.revisionBox}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={styles.revisionIcon}>
          <Text style={{ color: '#d97706', fontWeight: '700' }}>⟳</Text>
        </View>
        <Text style={styles.revisionTitle}>
          {t('ApplicationStatusBar.revisionRequested')}
        </Text>
      </View>
      {note ? <Text style={styles.revisionNote}>{note}</Text> : null}
      {links.length > 0 ? (
        <View style={{ paddingLeft: 36, gap: 6 }}>
          <Text style={styles.revisionListLabel}>
            {t('ApplicationStatusBar.deliverablesToRevise')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {links.map((l, i) => (
              <View key={i} style={styles.revisionChip}>
                <Text style={styles.revisionChipText}>{l}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function RejectedBanner({ reason }: { reason: any }) {
  const { t } = useTranslation();
  const text = parseRejectionReason(reason);
  return (
    <View style={styles.rejectedBox}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={styles.rejectedIcon}>
          <Text style={{ color: '#dc2626', fontWeight: '700' }}>✕</Text>
        </View>
        <Text style={styles.rejectedTitle}>
          {t('ApplicationStatusBar.applicationRejected')}
        </Text>
      </View>
      {text ? <Text style={styles.rejectedNote}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  // Header — center the step pill against the title block so the pill
  // doesn't visually float above the "Application Status" headline on iOS,
  // where the eyebrow + title stack is taller than the pill.
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
    letterSpacing: -0.4,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    // Bumped gap + padding so the Crown icon and the "Step N of 7" label
    // have breathing room on iOS, where the bolder font weights render
    // chunkier than on Android and the original 12/6 padding read as
    // cramped against the pill's rounded edges.
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  stepPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  stepPillNumber: {
    fontSize: 12,
    fontWeight: '900',
  },

  // Progress headline
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#EC4899',
  },
  headerStatusBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EC4899',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressBarFillWrap: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },

  // Timeline
  timeline: { gap: 0, marginTop: 4 },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
  },
  stepRail: {
    width: 32,
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  stepDotInner: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberActive: { fontSize: 12, fontWeight: '900', color: '#EC4899' },
  stepDotIdle: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  stepNumberIdle: { fontSize: 12, fontWeight: '800', color: '#94A3B8' },
  stepConnector: {
    width: 2,
    flex: 1,
    // minHeight keeps the connector visible on iOS for idle steps, where
    // the row height equals the 32px dot exactly and flex: 1 otherwise
    // collapses to 0. Android rounded up by a pixel or two so it kept
    // showing; iOS doesn't.
    minHeight: 18,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
    marginBottom: 4,
  },
  stepConnectorDone: { backgroundColor: '#34D399' },

  stepLabel: {
    fontSize: 14,
    fontWeight: '800',
    paddingTop: 6,
  },
  stepLabelDone: { color: '#0F172A' },
  stepLabelActive: { color: '#0F172A' },
  stepLabelIdle: { color: '#94A3B8' },

  // Active expanded card under the live step
  activeCard: {
    marginTop: 10,
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EC4899',
  },
  activeCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  activeCardBody: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 18,
  },

  // Revision / rejected branches (unchanged)
  revisionBox: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  revisionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revisionTitle: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  revisionNote: {
    fontSize: 12,
    color: '#92400e',
    paddingLeft: 36,
    lineHeight: 18,
  },
  revisionListLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d97706',
    textTransform: 'uppercase',
  },
  revisionChip: {
    backgroundColor: '#fde68a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  revisionChipText: { fontSize: 10, fontWeight: '700', color: '#92400e' },
  rejectedBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  rejectedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectedTitle: { fontSize: 13, fontWeight: '700', color: '#b91c1c' },
  rejectedNote: {
    fontSize: 12,
    color: '#b91c1c',
    paddingLeft: 36,
    lineHeight: 18,
  },

  // Upload button + submissions list (unchanged)
  uploadBtn: { height: 48, borderRadius: 14, overflow: 'hidden' },
  uploadBtnInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadBtnText: { color: 'white', fontSize: 14, fontWeight: '700' },
  submissionsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  igBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  linkUrl: { fontSize: 11, fontWeight: '700', color: '#0f172a' },
});
