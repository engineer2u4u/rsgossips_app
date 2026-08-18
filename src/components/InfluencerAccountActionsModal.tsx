// Creator account actions — Delete (30-day soft purge, admin-only restore in
// the grace window).
//
// Web parity: src/components/InfluencerAccountActionsModal.jsx. Mechanics
// mirror the brand-side BrandAccountActionsModal.tsx exactly, against
// influencer_profiles instead of brand_profiles.
//
// Deactivate already has its own screen (DeactiveAccount.tsx) reached from
// Privacy settings, so this component covers deletion only — the piece that
// was missing on the creator side. Google Play requires every user to be able
// to request account deletion; brands could already do this, creators could
// not, which left the store's Delete-account URL describing a flow half the
// users did not have.
//
// Semantics (schema landed in migration 046_influencer_soft_delete):
//   influencer_profiles { status:'pending_deletion', deleted_at,
//                         deletion_reason, updated_at }
//   device_sessions.is_active = false for the user
//   fire-and-forget send-account-event-email, then signOut.
//
// Sign-in stays blocked while status is 'pending_deletion' — the OTP verifier
// already refuses both roles — and the admin purge hard-deletes 30 days after
// `deleted_at`.

import React, {useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {AlertTriangle, Check, Trash2, X} from 'lucide-react-native';
import {supabase} from '../utils/supabase';
import {invokeFn} from '../lib/api';
import {useAuth} from '../context/AuthContext';

// `value` is the stable enum persisted on the profile (never translated);
// `key` maps to the localized display label. Values match the web list so the
// admin queue sees one vocabulary across platforms.
const REASONS_DELETE = [
  {key: 'leavingCreating', value: 'Stepping away from creating'},
  {key: 'movingPlatform', value: 'Moving to a different platform'},
  {key: 'privacy', value: 'Privacy concerns'},
  {key: 'createdByMistake', value: 'Created the account by mistake'},
  {key: 'duplicate', value: 'Duplicate account'},
  {key: 'other', value: 'Other'},
];

// Typing the word is deliberate friction — this is irreversible after 30 days.
const CONFIRM_WORD = 'DELETE';

export default function InfluencerAccountActionsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const {t} = useTranslation();
  const {user, signOut} = useAuth();

  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const canSubmit =
    !!reason &&
    confirmed &&
    confirmText.trim().toUpperCase() === CONFIRM_WORD &&
    !busy;

  const close = () => {
    if (busy) return;
    setReason('');
    setConfirmed(false);
    setConfirmText('');
    setError('');
    onClose();
  };

  const submit = async () => {
    if (!canSubmit || !user?.id) return;
    setBusy(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const {error: upErr} = await supabase
        .from('influencer_profiles')
        .update({
          status: 'pending_deletion',
          deleted_at: now,
          deletion_reason: reason,
          updated_at: now,
        })
        .eq('influencer_id', user.id);

      // supabase-js resolves failed writes instead of throwing, so an
      // unchecked result here would sign the user out having changed nothing.
      if (upErr) {
        setError(upErr.message || t('InfluencerAccountActions.errorFallback'));
        setBusy(false);
        return;
      }

      // Revoke every device so the account is inaccessible immediately, not
      // just on this handset.
      await supabase
        .from('device_sessions')
        .update({is_active: false})
        .eq('user_id', user.id);

      // Fire-and-forget: the confirmation email must never block the flow the
      // user just confirmed.
      try {
        await invokeFn('send-account-event-email', {
          event: 'deletion_pending',
          userId: user.id,
        });
      } catch {
        // Non-fatal — the account is already marked for deletion.
      }

      await signOut();
    } catch (e: any) {
      setError(e?.message || t('InfluencerAccountActions.errorFallback'));
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}>
      <View className="flex-1 bg-black/50 justify-end">
        <View
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '90%',
            paddingBottom: Platform.OS === 'ios' ? 34 : 20,
          }}>
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-slate-200" />
          </View>

          <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
            <View className="flex-row items-center" style={{gap: 8}}>
              <Trash2 size={18} color="#DC2626" />
              <Text className="text-[17px] font-black text-slate-900">
                {t('InfluencerAccountActions.title')}
              </Text>
            </View>
            <Pressable
              onPress={close}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}>
              <X size={20} color="#64748b" />
            </Pressable>
          </View>

          <ScrollView
            className="px-5"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* What actually happens — same four points as the brand flow, so
                the store's Delete-account page can describe one process. */}
            <View className="rounded-2xl bg-red-50 p-4">
              <View className="flex-row items-center mb-2" style={{gap: 7}}>
                <AlertTriangle size={16} color="#DC2626" />
                <Text className="text-[13px] font-black text-red-700">
                  {t('InfluencerAccountActions.info.heading')}
                </Text>
              </View>
              {(['point1', 'point2', 'point3', 'point4'] as const).map(k => (
                <Text
                  key={k}
                  className="text-[12.5px] text-red-700/90 leading-5 mb-1">
                  • {t(`InfluencerAccountActions.info.${k}`)}
                </Text>
              ))}
            </View>

            <Text className="text-[14px] font-black text-slate-900 mt-5 mb-1">
              {t('InfluencerAccountActions.reasonHeading')}
            </Text>
            <Text className="text-[12px] text-slate-500 mb-2">
              {t('InfluencerAccountActions.reasonSubtext')}
            </Text>

            {REASONS_DELETE.map(r => {
              const selected = reason === r.value;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => setReason(r.value)}
                  className="flex-row items-center justify-between py-3 border-b border-slate-100"
                  accessibilityRole="radio"
                  accessibilityState={{selected}}>
                  <Text
                    className={`text-[14px] ${
                      selected ? 'text-slate-900 font-bold' : 'text-slate-600'
                    }`}>
                    {t(`InfluencerAccountActions.reasons.${r.key}`)}
                  </Text>
                  {selected && <Check size={17} color="#DC2626" />}
                </Pressable>
              );
            })}

            <Text className="text-[12px] text-slate-500 mt-5 mb-1.5">
              {t('InfluencerAccountActions.confirmTypePrompt', {
                word: CONFIRM_WORD,
              })}
            </Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder={CONFIRM_WORD}
              placeholderTextColor="#cbd5e1"
              className="rounded-xl bg-slate-50 px-4 py-3 text-[15px] font-bold text-slate-900"
            />

            {!!error && (
              <View className="mt-3 rounded-xl bg-red-50 px-4 py-3">
                <Text className="text-[13px] text-red-600">{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* Confirm checkbox sits in the footer beside the buttons, always
              visible rather than scrolled away — same as the brand modal. */}
          <View className="px-5 pt-4">
            <Pressable
              onPress={() => setConfirmed(v => !v)}
              className="flex-row items-start mb-4"
              style={{gap: 10}}
              accessibilityRole="checkbox"
              accessibilityState={{checked: confirmed}}>
              <View
                className={`w-5 h-5 rounded-md items-center justify-center border mt-0.5 ${
                  confirmed
                    ? 'bg-red-600 border-red-600'
                    : 'bg-white border-slate-300'
                }`}>
                {confirmed && <Check size={13} color="#fff" />}
              </View>
              <Text className="flex-1 text-[12.5px] text-slate-600 leading-5">
                {t('InfluencerAccountActions.confirmCheckbox')}
              </Text>
            </Pressable>

            <View className="flex-row" style={{gap: 10}}>
              <Pressable
                onPress={close}
                disabled={busy}
                className="flex-1 h-[50px] rounded-2xl bg-slate-100 items-center justify-center"
                accessibilityRole="button">
                <Text className="text-[15px] font-bold text-slate-700">
                  {t('common.cancel')}
                </Text>
              </Pressable>
              <Pressable
                onPress={submit}
                disabled={!canSubmit}
                className="flex-1 h-[50px] rounded-2xl bg-red-600 items-center justify-center"
                style={{opacity: canSubmit ? 1 : 0.45}}
                accessibilityRole="button">
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-[15px] font-black text-white">
                    {t('InfluencerAccountActions.deleteButton')}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
