// Brand account actions — Deactivate (soft, self-restorable pause) and
// Delete (30-day purge, admin-only restore in the grace window) in one
// shared bottom-sheet shell.
//
// Web parity: src/components/brands/BrandAccountActionsModal.jsx. Mobile
// mechanics (profile write, device_sessions revoke, signOut + navigate)
// mirror the influencer-side DeactiveAccount.tsx.
//
// Semantics:
//   deactivate → brand_profiles { status:'deactivated', updated_at }
//   delete     → brand_profiles { status:'pending_deletion', deleted_at,
//                deletion_reason, updated_at }
//   both       → device_sessions.is_active=false for the user, then a
//                fire-and-forget send-account-event-email, then signOut.
//
// The confirm checkbox lives in the FOOTER (not the scroll body) so it is
// always visible next to Cancel + the action button — same as web.

import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
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
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {AlertTriangle, Check, Trash2, UserMinus, X} from 'lucide-react-native';
import {supabase} from '../../utils/supabase';
import {invokeFn} from '../../lib/api';
import {useAuth} from '../../context/AuthContext';

export type AccountActionVariant = 'deactivate' | 'delete';

// `value` is the stable enum persisted on the profile (never translated);
// `key` maps to the localized display label.
const REASONS_DEACTIVATE = [
  {key: 'break', value: 'Taking a break from campaigns'},
  {key: 'otherPlatform', value: 'Found another platform'},
  {key: 'privacy', value: 'Privacy concerns'},
  {key: 'notFindingCreators', value: 'Not finding the right creators'},
  {key: 'tooManyNotifications', value: 'Too many notifications'},
  {key: 'security', value: 'Account security issues'},
  {key: 'other', value: 'Other'},
];

const REASONS_DELETE = [
  {key: 'closingBusiness', value: 'Closing the business'},
  {key: 'movingPlatform', value: 'Moving to a different platform'},
  {key: 'privacy', value: 'Privacy concerns'},
  {key: 'createdByMistake', value: 'Created the account by mistake'},
  {key: 'duplicate', value: 'Duplicate account'},
  {key: 'other', value: 'Other'},
];

export default function BrandAccountActionsModal({
  variant,
  onClose,
}: {
  variant: AccountActionVariant | null;
  onClose: () => void;
}) {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {user, signOut} = useAuth();

  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fresh form every time the sheet opens.
  useEffect(() => {
    if (variant) {
      setReason('');
      setConfirmed(false);
      setConfirmText('');
      setSubmitting(false);
      setError('');
    }
  }, [variant]);

  const isDelete = variant === 'delete';
  const reasons = isDelete ? REASONS_DELETE : REASONS_DEACTIVATE;
  const reasonsGroup = isDelete ? 'reasonsDelete' : 'reasonsDeactivate';
  const accent = isDelete ? '#ef4444' : '#f59e0b';

  // Delete needs the extra typed-confirmation gate ("DELETE") — the grace
  // window is revocable but the user should feel the weight.
  const canSubmit =
    !!reason &&
    confirmed &&
    !submitting &&
    (!isDelete || confirmText.trim().toUpperCase() === 'DELETE');

  const handleSubmit = async () => {
    if (!user?.id || !canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const update = isDelete
        ? {
            status: 'pending_deletion',
            deleted_at: now,
            deletion_reason: reason,
            updated_at: now,
          }
        : {
            status: 'deactivated',
            updated_at: now,
          };

      const {error: upErr} = await supabase
        .from('brand_profiles')
        .update(update)
        .eq('brand_id', user.id);
      if (upErr) throw new Error(upErr.message);

      // Boot every signed-in device. For delete this also stops the user
      // accidentally signing back in (verify-otp blocks the OTP).
      await supabase
        .from('device_sessions')
        .update({is_active: false})
        .eq('user_id', user.id);

      // Confirmation email — server derives the recipient from the JWT.
      // Fire-and-forget so a mail outage can't block the sign-out path.
      try {
        await invokeFn('send-account-event-email', {
          event: isDelete ? 'deletion_pending' : 'deactivated',
          role: 'brand',
        });
      } catch (_) {
        /* non-fatal */
      }

      await signOut();
      onClose();
      navigation.navigate('Login' as never);
    } catch (e: any) {
      setError(
        e?.message || t('BrandsBrandAccountActionsModal.errors.failedToSubmit'),
      );
      setSubmitting(false);
    }
  };

  const infoPoints = isDelete
    ? ['point1', 'point2', 'point3', 'point4'].map(k =>
        t(`BrandsBrandAccountActionsModal.deleteInfo.${k}`),
      )
    : ['point1', 'point2', 'point3'].map(k =>
        t(`BrandsBrandAccountActionsModal.deactivateInfo.${k}`),
      );

  return (
    <Modal
      visible={variant !== null}
      animationType="slide"
      transparent
      onRequestClose={submitting ? undefined : onClose}>
      <View style={s.scrim}>
        <View style={s.sheet}>
          {/* Header */}
          <View style={s.header}>
            <View
              style={[
                s.headerIcon,
                {backgroundColor: isDelete ? '#fef2f2' : '#fffbeb'},
              ]}>
              {isDelete ? (
                <Trash2 size={18} color="#ef4444" />
              ) : (
                <UserMinus size={18} color="#f59e0b" />
              )}
            </View>
            <View style={{flex: 1}}>
              <Text style={s.title}>
                {isDelete
                  ? t('BrandsBrandAccountActionsModal.title.delete')
                  : t('BrandsBrandAccountActionsModal.title.deactivate')}
              </Text>
              <Text style={s.subtitle}>
                {isDelete
                  ? t('BrandsBrandAccountActionsModal.subtitle.delete')
                  : t('BrandsBrandAccountActionsModal.subtitle.deactivate')}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              disabled={submitting}
              hitSlop={8}
              style={{padding: 4, opacity: submitting ? 0.5 : 1}}>
              <X size={20} color="#94a3b8" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{padding: 18, gap: 18}}
            keyboardShouldPersistTaps="handled">
            {/* Warning box */}
            <View
              style={[
                s.infoBox,
                isDelete
                  ? {backgroundColor: '#fef2f2', borderColor: '#fecaca'}
                  : {backgroundColor: '#fffbeb', borderColor: '#fde68a'},
              ]}>
              <View style={{flexDirection: 'row', gap: 10}}>
                <AlertTriangle
                  size={18}
                  color={accent}
                  style={{marginTop: 2}}
                />
                <View style={{flex: 1, gap: 6}}>
                  <Text
                    style={[
                      s.infoHeading,
                      {color: isDelete ? '#7f1d1d' : '#78350f'},
                    ]}>
                    {isDelete
                      ? t('BrandsBrandAccountActionsModal.deleteInfo.heading')
                      : t(
                          'BrandsBrandAccountActionsModal.deactivateInfo.heading',
                        )}
                  </Text>
                  {infoPoints.map((p, i) => (
                    <Text
                      key={i}
                      style={[
                        s.infoPoint,
                        {color: isDelete ? '#b91c1c' : '#b45309'},
                      ]}>
                      {'•'} {p}
                    </Text>
                  ))}
                </View>
              </View>
            </View>

            {/* Reason picker — pressable radio list (mobile stand-in for the
                web <select>) */}
            <View>
              <Text style={s.reasonHeading}>
                {isDelete
                  ? t('BrandsBrandAccountActionsModal.reasonHeading.delete')
                  : t(
                      'BrandsBrandAccountActionsModal.reasonHeading.deactivate',
                    )}
              </Text>
              <Text style={s.reasonSubtext}>
                {t('BrandsBrandAccountActionsModal.reasonSubtext')}
              </Text>
              <View style={s.reasonList}>
                {reasons.map((r, i) => {
                  const active = reason === r.value;
                  return (
                    <Pressable
                      key={r.key}
                      onPress={() => setReason(active ? '' : r.value)}
                      style={[
                        s.reasonRow,
                        i < reasons.length - 1 && s.reasonRowBorder,
                      ]}>
                      <View
                        style={[
                          s.radio,
                          active && {
                            borderColor: accent,
                            backgroundColor: isDelete ? '#fef2f2' : '#fffbeb',
                          },
                        ]}>
                        {active ? (
                          <View
                            style={[s.radioDot, {backgroundColor: accent}]}
                          />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          s.reasonText,
                          active && {color: accent, fontWeight: '700'},
                        ]}>
                        {t(
                          `BrandsBrandAccountActionsModal.${reasonsGroup}.${r.key}`,
                        )}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Type-to-confirm gate — delete only */}
            {isDelete ? (
              <View>
                <Text style={s.confirmLabel}>
                  {t('BrandsBrandAccountActionsModal.typeToConfirm')}
                </Text>
                <TextInput
                  value={confirmText}
                  onChangeText={setConfirmText}
                  placeholder="DELETE"
                  placeholderTextColor="#cbd5e1"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={s.confirmInput}
                />
              </View>
            ) : null}

            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer — checkbox pinned here so it's always visible next to
              the action buttons */}
          <View style={s.footer}>
            <Pressable
              onPress={() => setConfirmed(v => !v)}
              style={s.checkboxRow}
              hitSlop={4}>
              <View
                style={[
                  s.checkbox,
                  confirmed && {backgroundColor: accent, borderColor: accent},
                ]}>
                {confirmed ? (
                  <Check size={13} color="white" strokeWidth={3} />
                ) : null}
              </View>
              <Text style={s.checkboxText}>
                {isDelete
                  ? t('BrandsBrandAccountActionsModal.confirmCheckbox.delete')
                  : t(
                      'BrandsBrandAccountActionsModal.confirmCheckbox.deactivate',
                    )}
              </Text>
            </Pressable>
            <View style={{flexDirection: 'row', gap: 8}}>
              <TouchableOpacity
                onPress={onClose}
                disabled={submitting}
                style={[s.btn, s.btnGhost, {opacity: submitting ? 0.5 : 1}]}>
                <Text style={s.btnGhostText}>
                  {t('BrandsBrandAccountActionsModal.actions.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={[
                  s.btn,
                  {backgroundColor: accent, opacity: canSubmit ? 1 : 0.5},
                ]}>
                {submitting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={s.btnActionText}>
                    {isDelete
                      ? t(
                          'BrandsBrandAccountActionsModal.actions.deleteAccount',
                        )
                      : t('BrandsBrandAccountActionsModal.actions.deactivate')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {fontSize: 17, fontWeight: '800', color: '#0f172a'},
  subtitle: {fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2},
  infoBox: {borderWidth: 1, borderRadius: 16, padding: 14},
  infoHeading: {fontSize: 12, fontWeight: '800'},
  infoPoint: {fontSize: 11, fontWeight: '600', lineHeight: 16},
  reasonHeading: {fontSize: 14, fontWeight: '800', color: '#0f172a'},
  reasonSubtext: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 10,
  },
  reasonList: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    overflow: 'hidden',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reasonRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'white',
  },
  radioDot: {width: 10, height: 10, borderRadius: 5},
  reasonText: {fontSize: 13, color: '#334155', flex: 1, fontWeight: '500'},
  confirmLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  confirmInput: {
    backgroundColor: '#F8F9FE',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
    letterSpacing: 2,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {fontSize: 12, color: '#dc2626', fontWeight: '700'},
  footer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    gap: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F8F9FE',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    fontWeight: '700',
    lineHeight: 17,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {borderWidth: 1, borderColor: '#e2e8f0'},
  btnGhostText: {color: '#475569', fontWeight: '700', fontSize: 13},
  btnActionText: {color: 'white', fontWeight: '800', fontSize: 13},
});
