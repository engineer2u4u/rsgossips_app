// "Edit top reels" — the creator pastes Instagram permalinks and we resolve
// them against their own latest posts.
//
// Web parity: src/components/mediaKitTemplates/ReelLinksEditor.jsx (fields +
// validation) and EditOverlay.jsx (the modal shell). The save sequence
// mirrors web's handleTopReelsSave (app/influencer/media-kit/page.js:122):
//   resolve-reel-thumbnails → update-profile { topReels } → refreshProfile.
//
// Order in the list is display order. There is no drag-to-reorder on web
// either; you change the order by editing the text.

import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {Info, Plus, X} from 'lucide-react-native';

import {
  checkReelLinks,
  serverProblems,
  TOP_REELS_POST_LIMIT,
  type ReelListProblem,
  type ReelServerProblem,
} from '../lib/reelLinks';

/** What the save callback reports back, mirroring web's shapes. */
export type TopReelsSaveResult =
  | {ok: true}
  | {
      error: {
        kind: 'reconnect' | 'failed' | 'unresolved';
        details?: {url: string; reason?: string}[];
        account?: string;
        scanned?: number;
        limit?: number;
      };
    };

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Existing reels; only their permalinks are edited. */
  reels: any[];
  /** The creator's own handle, named in the guidance and the errors. */
  account?: string;
  onSave: (reels: {permalink: string}[]) => Promise<TopReelsSaveResult>;
}

export default function TopReelsEditorModal({
  visible,
  onClose,
  reels,
  account,
  onSave,
}: Props) {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  const [links, setLinks] = useState<string[]>(() => {
    const existing = (reels || []).map((r: any) => r?.permalink || '');
    return existing.length ? existing : [''];
  });
  const [saving, setSaving] = useState(false);
  // Whole-request state, and the per-link verdicts the server sent back.
  const [topError, setTopError] = useState<
    'unresolved' | 'reconnect' | 'failed' | null
  >(null);
  const [serverByUrl, setServerByUrl] = useState<
    Map<string, ReelServerProblem>
  >(new Map());
  const [serverAccount, setServerAccount] = useState<string>('');

  // Re-check on every keystroke, exactly as web does.
  const problems = useMemo(() => checkReelLinks(links), [links]);
  const unresolvedCount = useMemo(
    () => links.filter(l => serverByUrl.has(l.trim())).length,
    [links, serverByUrl],
  );
  const canSave =
    !saving && problems.every(p => !p) && unresolvedCount === 0;

  const handle = account || t('MediaKitReels.yourAccount');

  const setAt = (i: number, value: string) => {
    setLinks(prev => prev.map((l, n) => (n === i ? value : l)));
    // A stale server verdict must not stick to a link the creator just fixed.
    setServerByUrl(prev => {
      if (prev.size === 0) return prev;
      const next = new Map(prev);
      next.delete(links[i].trim());
      return next;
    });
    setTopError(null);
  };

  const removeAt = (i: number) => {
    setLinks(prev => (prev.length === 1 ? [''] : prev.filter((_, n) => n !== i)));
    setTopError(null);
  };

  const addRow = () => setLinks(prev => [...prev, '']);

  const save = async () => {
    setSaving(true);
    setTopError(null);
    try {
      const payload = links
        .map(l => l.trim())
        .filter(Boolean)
        .map(permalink => ({permalink}));
      const res = await onSave(payload);
      if ('ok' in res && res.ok) {
        onClose();
        return;
      }
      const err = (res as any).error || {kind: 'failed'};
      setTopError(err.kind);
      if (err.kind === 'unresolved') {
        setServerByUrl(serverProblems(err.details));
        setServerAccount(err.account || '');
      }
    } finally {
      setSaving(false);
    }
  };

  const errorFor = (i: number): string | null => {
    const url = links[i].trim();
    const server = serverByUrl.get(url);
    if (server) {
      return t(`MediaKitReels.errors.${server}`, {
        account: serverAccount || handle,
        limit: TOP_REELS_POST_LIMIT,
      });
    }
    const p: ReelListProblem | null = problems[i];
    return p ? t(`MediaKitReels.errors.${p}`) : null;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={saving ? undefined : onClose}>
      <View className="flex-1 justify-end">
        {/* Backdrop is a SIBLING of the sheet: as an ancestor it owns the
            touch responder and the list below could not be scrolled on iOS. */}
        <Pressable
          style={[StyleSheet.absoluteFill, {backgroundColor: 'rgba(0,0,0,0.5)'}]}
          onPress={saving ? undefined : onClose}
        />
        <View
          className="bg-white rounded-t-[28px] max-h-[88%]"
          style={{paddingBottom: insets.bottom}}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100">
            <View style={{flex: 1}}>
              <Text className="text-base font-black text-slate-900">
                {t('MediaKitReels.title')}
              </Text>
              <Text className="text-[11px] text-slate-400 mt-0.5">
                {t('MediaKitReels.subtitle')}
              </Text>
            </View>
            <Pressable
              onPress={saving ? undefined : onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              style={{opacity: saving ? 0.4 : 1}}>
              <X size={20} color="#64748b" />
            </Pressable>
          </View>

          {/* flexShrink keeps the list inside the 88% cap so it scrolls. */}
          <ScrollView
            style={{flexShrink: 1}}
            contentContainerStyle={{padding: 20, gap: 14}}
            automaticallyAdjustKeyboardInsets
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled">
            {/* Guidance — why only their own, recent posts work. */}
            <View
              className="rounded-2xl bg-slate-50 p-3.5"
              style={{gap: 6}}>
              <View className="flex-row" style={{gap: 8}}>
                <Info size={14} color="#64748b" />
                <Text className="flex-1 text-[11.5px] text-slate-600 leading-5">
                  {account
                    ? t('MediaKitReels.guidance.own', {account})
                    : t('MediaKitReels.guidance.ownNoAccount')}
                </Text>
              </View>
              <Text className="text-[11.5px] text-slate-500 leading-5">
                {t('MediaKitReels.guidance.howTo')}
              </Text>
              <Text className="text-[11.5px] text-slate-500 leading-5">
                {t('MediaKitReels.guidance.latestOnly', {
                  limit: TOP_REELS_POST_LIMIT,
                })}
              </Text>
            </View>

            {/* Whole-request states */}
            {topError ? (
              <View className="rounded-2xl bg-rose-50 border border-rose-100 p-3.5">
                <Text className="text-[12px] text-rose-700 leading-5">
                  {topError === 'unresolved'
                    ? t('MediaKitReels.top.unresolved', {
                        count: unresolvedCount,
                      })
                    : t(`MediaKitReels.top.${topError}`)}
                </Text>
              </View>
            ) : null}

            {/* The links */}
            {links.map((link, i) => {
              const err = errorFor(i);
              return (
                <View key={i} style={{gap: 6}}>
                  <View className="flex-row items-center" style={{gap: 8}}>
                    <TextInput
                      value={link}
                      onChangeText={v => setAt(i, v)}
                      placeholder={t('MediaKitReels.placeholder')}
                      placeholderTextColor="#cbd5e1"
                      keyboardType="url"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!saving}
                      className="flex-1 rounded-xl border px-3 text-[13px] text-slate-800"
                      style={{
                        height: 46,
                        borderColor: err ? '#fda4af' : '#e2e8f0',
                        backgroundColor: '#fff',
                      }}
                    />
                    <Pressable
                      onPress={() => removeAt(i)}
                      disabled={saving}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={t('MediaKitReels.remove')}
                      className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center">
                      <X size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                  {err ? (
                    <Text className="text-[11px] text-rose-600 leading-4">
                      {err}
                    </Text>
                  ) : null}
                </View>
              );
            })}

            <Pressable
              onPress={addRow}
              disabled={saving}
              accessibilityRole="button"
              className="flex-row items-center self-start rounded-xl px-3"
              style={{height: 38, gap: 6, backgroundColor: '#f1f5f9'}}>
              <Plus size={14} color="#475569" />
              <Text className="text-[12px] font-bold text-slate-600">
                {t('MediaKitReels.addLink')}
              </Text>
            </Pressable>
          </ScrollView>

          {/* Footer */}
          <View
            className="flex-row px-5 pt-4 border-t border-slate-100"
            style={{gap: 10}}>
            <Pressable
              onPress={onClose}
              disabled={saving}
              accessibilityRole="button"
              className="flex-1 rounded-2xl bg-slate-100 items-center justify-center"
              style={{height: 48}}>
              <Text className="text-[13px] font-bold text-slate-600">
                {t('common.cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={!canSave}
              accessibilityRole="button"
              className="flex-1 rounded-2xl flex-row items-center justify-center"
              style={{
                height: 48,
                gap: 8,
                backgroundColor: '#9810fa',
                opacity: canSave ? 1 : 0.5,
              }}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : null}
              <Text className="text-[13px] font-bold text-white">
                {saving ? t('MediaKitReels.saving') : t('common.save')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
