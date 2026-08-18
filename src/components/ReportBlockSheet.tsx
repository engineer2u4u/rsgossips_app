import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Flag, Ban, Check, X} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {invokeFn} from '../lib/api';
import {BRAND, CARD_SHADOW} from '../theme/brand';

// Safety actions on another user's content — report and block.
//
// Google Play's User Generated Content policy and Apple's Guideline 1.2 both
// require an app that shows user-authored content to offer both, in-app, at
// the point the content is seen. RGossips has no chat, but creator profiles,
// campaign briefs, pitches, deliverables and the public media kit are all UGC,
// so the requirement applies everywhere one user sees another's content.
//
// One sheet handles both so every surface gets the same affordances from a
// single mount: <ReportBlockSheet visible … targetUserId … entityType … />

export type ReportEntityType =
  | 'user'
  | 'campaign'
  | 'application'
  | 'deliverable'
  | 'media_kit'
  | 'service';

// Must stay in step with the reason CHECK constraint in migration 059 and the
// REASONS set in the report-content edge function.
const REASONS: {key: string; labelKey: string}[] = [
  {key: 'spam', labelKey: 'ReportBlock.reasons.spam'},
  {key: 'harassment', labelKey: 'ReportBlock.reasons.harassment'},
  {key: 'hate_speech', labelKey: 'ReportBlock.reasons.hateSpeech'},
  {key: 'sexual_content', labelKey: 'ReportBlock.reasons.sexualContent'},
  {key: 'violence', labelKey: 'ReportBlock.reasons.violence'},
  {key: 'scam_or_fraud', labelKey: 'ReportBlock.reasons.scam'},
  {key: 'impersonation', labelKey: 'ReportBlock.reasons.impersonation'},
  {key: 'intellectual_property', labelKey: 'ReportBlock.reasons.ip'},
  {key: 'other', labelKey: 'ReportBlock.reasons.other'},
];

interface Props {
  visible: boolean;
  onClose: () => void;
  /** auth.users id of the person whose content this is. */
  targetUserId: string;
  /** Shown in the confirmation copy so the user knows who they're acting on. */
  targetName?: string;
  entityType: ReportEntityType;
  /** Required for every entityType except 'user'. */
  entityId?: string | null;
  /** Fires after a successful block so the caller can drop the row from a list. */
  onBlocked?: (userId: string) => void;
}

type Stage = 'menu' | 'report' | 'blockConfirm' | 'done';

export default function ReportBlockSheet({
  visible,
  onClose,
  targetUserId,
  targetName,
  entityType,
  entityId,
  onBlocked,
}: Props) {
  const {t} = useTranslation();
  const [stage, setStage] = useState<Stage>('menu');
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [doneMessage, setDoneMessage] = useState('');

  const reset = () => {
    setStage('menu');
    setReason(null);
    setDetails('');
    setBusy(false);
    setError('');
    setDoneMessage('');
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const submitReport = async () => {
    if (!reason) return;
    setBusy(true);
    setError('');
    try {
      const res = await invokeFn<{
        success?: boolean;
        message?: string;
        error?: string;
      }>('report-content', {
        reportedUserId: targetUserId,
        entityType,
        entityId: entityType === 'user' ? null : entityId,
        reason,
        details: details.trim() || undefined,
      });
      if (!res?.success) {
        setError(res?.error || t('ReportBlock.errorGeneric'));
        setBusy(false);
        return;
      }
      setDoneMessage(res.message || t('ReportBlock.reportThanks'));
      setStage('done');
    } catch (e: any) {
      setError(e?.message || t('ReportBlock.errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  const submitBlock = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await invokeFn<{success?: boolean; error?: string}>(
        'block-user',
        {action: 'block', targetUserId},
      );
      if (!res?.success) {
        setError(res?.error || t('ReportBlock.errorGeneric'));
        setBusy(false);
        return;
      }
      setDoneMessage(t('ReportBlock.blockDone', {name: targetName || ''}));
      setStage('done');
      onBlocked?.(targetUserId);
    } catch (e: any) {
      setError(e?.message || t('ReportBlock.errorGeneric'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}>
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={close}
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}>
        {/* Stop taps inside the sheet from closing it. */}
        <Pressable
          onPress={e => e.stopPropagation()}
          style={[
            CARD_SHADOW,
            {
              backgroundColor: '#fff',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingBottom: Platform.OS === 'ios' ? 34 : 20,
            },
          ]}>
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-slate-200" />
          </View>

          <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
            <Text className="text-[17px] font-black text-slate-900">
              {stage === 'report'
                ? t('ReportBlock.reportTitle')
                : stage === 'blockConfirm'
                ? t('ReportBlock.blockTitle')
                : stage === 'done'
                ? t('ReportBlock.doneTitle')
                : t('ReportBlock.menuTitle')}
            </Text>
            <Pressable
              onPress={close}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}>
              <X size={20} color="#64748b" />
            </Pressable>
          </View>

          {!!error && (
            <View className="mx-5 mb-3 rounded-xl bg-red-50 px-4 py-3">
              <Text className="text-[13px] text-red-600">{error}</Text>
            </View>
          )}

          {/* ── menu ── */}
          {stage === 'menu' && (
            <View className="px-5 pb-4">
              <Pressable
                onPress={() => setStage('report')}
                className="flex-row items-center gap-3 py-4 border-b border-slate-100"
                accessibilityRole="button">
                <Flag size={19} color="#e11d48" />
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-slate-900">
                    {t('ReportBlock.reportAction')}
                  </Text>
                  <Text className="text-[12px] text-slate-500 mt-0.5">
                    {t('ReportBlock.reportSubtitle')}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => setStage('blockConfirm')}
                className="flex-row items-center gap-3 py-4"
                accessibilityRole="button">
                <Ban size={19} color="#0f172a" />
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-slate-900">
                    {t('ReportBlock.blockAction')}
                  </Text>
                  <Text className="text-[12px] text-slate-500 mt-0.5">
                    {t('ReportBlock.blockSubtitle')}
                  </Text>
                </View>
              </Pressable>
            </View>
          )}

          {/* ── report ── */}
          {stage === 'report' && (
            <View className="px-5 pb-2">
              <Text className="text-[13px] text-slate-500 mb-3">
                {t('ReportBlock.reportPrompt')}
              </Text>
              <ScrollView style={{maxHeight: 260}} keyboardShouldPersistTaps="handled">
                {REASONS.map(r => {
                  const selected = reason === r.key;
                  return (
                    <Pressable
                      key={r.key}
                      onPress={() => setReason(r.key)}
                      className="flex-row items-center justify-between py-3 border-b border-slate-100"
                      accessibilityRole="radio"
                      accessibilityState={{selected}}>
                      <Text
                        className={`text-[14px] ${
                          selected
                            ? 'text-slate-900 font-bold'
                            : 'text-slate-600'
                        }`}>
                        {t(r.labelKey)}
                      </Text>
                      {selected && <Check size={17} color={BRAND.pink} />}
                    </Pressable>
                  );
                })}

                <TextInput
                  value={details}
                  onChangeText={setDetails}
                  placeholder={t('ReportBlock.detailsPlaceholder')}
                  placeholderTextColor="#94a3b8"
                  multiline
                  maxLength={1000}
                  className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-[14px] text-slate-900"
                  style={{minHeight: 84, textAlignVertical: 'top'}}
                />
              </ScrollView>

              <Pressable
                onPress={submitReport}
                disabled={!reason || busy}
                className="mt-4"
                accessibilityRole="button">
                <LinearGradient
                  colors={['#9810FA', '#E60076']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={{
                    height: 50,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: !reason || busy ? 0.5 : 1,
                  }}>
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-[15px] font-black">
                      {t('ReportBlock.submitReport')}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* ── block confirm ── */}
          {stage === 'blockConfirm' && (
            <View className="px-5 pb-2">
              <Text className="text-[14px] text-slate-600 leading-5">
                {t('ReportBlock.blockConfirmBody', {
                  name: targetName || t('ReportBlock.thisUser'),
                })}
              </Text>

              <Pressable
                onPress={submitBlock}
                disabled={busy}
                className="mt-5 h-[50px] rounded-2xl bg-slate-900 items-center justify-center"
                style={{opacity: busy ? 0.5 : 1}}
                accessibilityRole="button">
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-[15px] font-black">
                    {t('ReportBlock.confirmBlock')}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => setStage('menu')}
                disabled={busy}
                className="mt-2 h-[46px] items-center justify-center"
                accessibilityRole="button">
                <Text className="text-[14px] font-bold text-slate-500">
                  {t('common.cancel')}
                </Text>
              </Pressable>
            </View>
          )}

          {/* ── done ── */}
          {stage === 'done' && (
            <View className="px-5 pb-4 items-center">
              <View className="w-12 h-12 rounded-full bg-emerald-50 items-center justify-center mb-3">
                <Check size={24} color="#059669" />
              </View>
              <Text className="text-[14px] text-slate-600 text-center leading-5">
                {doneMessage}
              </Text>
              <Pressable
                onPress={close}
                className="mt-5 h-[46px] w-full rounded-2xl bg-slate-100 items-center justify-center"
                accessibilityRole="button">
                <Text className="text-[14px] font-bold text-slate-700">
                  {t('common.done')}
                </Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
