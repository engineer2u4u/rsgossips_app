// ApplicationStatusBar — vertical step tracker for an influencer's
// application, plus revision/rejected banners, contextual upload CTA, and
// the list of already-submitted links.
//
// Ports the ApplicationStatusBar component inlined in web app
// src/app/influencer/offers/[id]/page.js. Status enum:
//
//   pending → approved → submitted → accepted → live_submitted → payment → completed
//
// Special branches:
//   - revision_needed: amber banner + "Resubmit Deliverables"
//   - rejected: red banner
//
// Upload button only shows when status is approved | revision_needed | accepted.

import React, {useState} from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CheckCircle,
  ExternalLink,
  Instagram,
  Upload,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import SubmitDeliverablesModal from './SubmitDeliverablesModal';

const STATUS_STEPS = [
  {key: 'pending', label: 'Applied'},
  {key: 'approved', label: 'Approved'},
  {key: 'submitted', label: 'Deliverables Submitted'},
  {key: 'accepted', label: 'Work Accepted'},
  {key: 'live_submitted', label: 'Live Links Submitted'},
  {key: 'payment', label: 'Payment in Progress'},
  {key: 'completed', label: 'Completed'},
] as const;

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

function parseRevisionPayload(raw: any): {note: string; links: string[]} {
  if (!raw) return {note: '', links: []};
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return {
      note: parsed?.note || '',
      links: parsed?.links || [],
    };
  } catch {
    return {note: typeof raw === 'string' ? raw : '', links: []};
  }
}

function parseRejectionReason(raw: any): string {
  if (!raw) return '';
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return parsed?.note || parsed?.reason || (typeof raw === 'string' ? raw : '');
  } catch {
    return typeof raw === 'string' ? raw : '';
  }
}

export default function ApplicationStatusBar({status, campaign, refetch}: Props) {
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
  const canUpload =
    status === 'approved' || status === 'revision_needed' || status === 'accepted';

  const submitLabel =
    status === 'accepted'
      ? 'Submit Live Links'
      : isRevision
        ? 'Resubmit Deliverables'
        : 'Upload Submission';

  const submissionLinks: {type: string; label: string; url: string}[] =
    campaign?.submissionLinks || [];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Application Status</Text>

      {/* Vertical timeline */}
      <View style={styles.timeline}>
        {/* Background line */}
        <View style={styles.timelineLineBg} />
        {/* Filled-in progress line */}
        <View
          style={[
            styles.timelineLineFilled,
            {
              height: `${
                Math.max(0, currentStepIndex / (STATUS_STEPS.length - 1)) * 100
              }%`,
            },
          ]}
        />

        {STATUS_STEPS.map((step, i) => {
          const isDone = i < currentStepIndex;
          const isCurrent = i === currentStepIndex;
          return (
            <View key={step.key} style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  isDone
                    ? styles.stepDotDone
                    : isCurrent
                      ? styles.stepDotCurrent
                      : styles.stepDotIdle,
                ]}>
                {isDone ? (
                  <CheckCircle size={12} color="white" />
                ) : isCurrent ? (
                  <View style={styles.stepDotInner} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isDone
                    ? {color: '#059669'}
                    : isCurrent
                      ? {color: '#0f172a'}
                      : {color: '#94a3b8'},
                ]}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Revision banner */}
      {isRevision ? <RevisionBanner reason={campaign?.rejectionReason} /> : null}

      {/* Rejected banner */}
      {isRejected ? <RejectedBanner reason={campaign?.rejectionReason} /> : null}

      {/* Upload / Resubmit / Live links button */}
      {canUpload ? (
        <TouchableOpacity
          onPress={() => setShowSubmit(true)}
          activeOpacity={0.9}
          style={styles.uploadBtn}>
          <LinearGradient
            colors={['#9810FA', '#E60076']}
            style={styles.uploadBtnInner}>
            <Upload size={16} color="white" />
            <Text style={styles.uploadBtnText}>{submitLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : null}

      {/* Submitted deliverables list */}
      {submissionLinks.length > 0 ? (
        <View style={{gap: 10}}>
          <Text style={styles.submissionsHeader}>
            ✓ Your Submissions
          </Text>
          <View style={{gap: 8}}>
            {submissionLinks.map((link, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.85}
                onPress={() => Linking.openURL(link.url)}
                style={styles.linkRow}>
                <LinearGradient
                  colors={['#FCAF45', '#E1306C', '#833AB4']}
                  style={styles.igBadge}>
                  <Instagram size={14} color="white" />
                </LinearGradient>
                <View style={{flex: 1, minWidth: 0}}>
                  <Text style={styles.linkLabel}>{link.label || link.type}</Text>
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

function RevisionBanner({reason}: {reason: any}) {
  const {note, links} = parseRevisionPayload(reason);
  return (
    <View style={styles.revisionBox}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
        <View style={styles.revisionIcon}>
          <Text style={{color: '#d97706', fontWeight: '700'}}>⟳</Text>
        </View>
        <Text style={styles.revisionTitle}>Revision Requested</Text>
      </View>
      {note ? <Text style={styles.revisionNote}>{note}</Text> : null}
      {links.length > 0 ? (
        <View style={{paddingLeft: 36, gap: 6}}>
          <Text style={styles.revisionListLabel}>Deliverables to revise:</Text>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6}}>
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

function RejectedBanner({reason}: {reason: any}) {
  const text = parseRejectionReason(reason);
  return (
    <View style={styles.rejectedBox}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
        <View style={styles.rejectedIcon}>
          <Text style={{color: '#dc2626', fontWeight: '700'}}>✕</Text>
        </View>
        <Text style={styles.rejectedTitle}>Application Rejected</Text>
      </View>
      {text ? <Text style={styles.rejectedNote}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8F9FD',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
  },
  title: {fontSize: 15, fontWeight: '800', color: '#0f172a'},
  timeline: {paddingLeft: 28, position: 'relative'},
  timelineLineBg: {
    position: 'absolute',
    left: 11,
    top: 12,
    bottom: 12,
    width: 3,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
  },
  timelineLineFilled: {
    position: 'absolute',
    left: 11,
    top: 12,
    width: 3,
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 18,
    position: 'relative',
  },
  stepDot: {
    position: 'absolute',
    left: -28,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepDotDone: {backgroundColor: '#10b981'},
  stepDotCurrent: {
    backgroundColor: '#0f172a',
    borderWidth: 4,
    borderColor: '#cbd5e1',
  },
  stepDotIdle: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  stepDotInner: {width: 8, height: 8, backgroundColor: 'white', borderRadius: 4},
  stepLabel: {fontSize: 13, fontWeight: '700'},
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
  revisionTitle: {fontSize: 13, fontWeight: '700', color: '#92400e'},
  revisionNote: {fontSize: 12, color: '#92400e', paddingLeft: 36, lineHeight: 18},
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
  revisionChipText: {fontSize: 10, fontWeight: '700', color: '#92400e'},
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
  rejectedTitle: {fontSize: 13, fontWeight: '700', color: '#b91c1c'},
  rejectedNote: {fontSize: 12, color: '#b91c1c', paddingLeft: 36, lineHeight: 18},
  uploadBtn: {height: 48, borderRadius: 14, overflow: 'hidden'},
  uploadBtnInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadBtnText: {color: 'white', fontSize: 14, fontWeight: '700'},
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
  linkUrl: {fontSize: 11, fontWeight: '700', color: '#0f172a'},
});
