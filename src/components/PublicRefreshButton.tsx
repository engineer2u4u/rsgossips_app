// Manual "Refresh numbers" for creators without an Instagram connection.
// Calls refresh-instagram-public, which pulls the public counts for the
// stored handle and enforces the one-per-24h cap. This component only
// MIRRORS the cap from profile.instagram_public_refreshed_at; the server is
// the authority, so a stale profile can at worst show a button that comes
// back "skipped" and then corrects itself.
//
// Renders nothing for connected creators: they have the hourly OAuth refresh
// and a richer data set, and a public refresh would overwrite it.

import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, Text, View} from 'react-native';
import {RefreshCw} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../context/AuthContext';
import {EdgeFunctionError, invokeFn} from '../lib/api';

const INTERVAL_MS = 24 * 60 * 60 * 1000;

export default function PublicRefreshButton() {
  const {t} = useTranslation();
  const {profile, refreshProfile} = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Server-stated next-allowed time, when it told us one; otherwise derived.
  const [nextAllowedAt, setNextAllowedAt] = useState<number | null>(null);
  const [, setTick] = useState(0);

  const last = profile?.instagram_public_refreshed_at
    ? Date.parse(profile.instagram_public_refreshed_at)
    : 0;
  const nextAt = nextAllowedAt ?? (last ? last + INTERVAL_MS : 0);
  const coolingDown = nextAt > Date.now();

  // Re-render once a minute while cooling down so the countdown moves.
  useEffect(() => {
    if (!coolingDown) return;
    const id = setInterval(() => setTick(x => x + 1), 60_000);
    return () => clearInterval(id);
  }, [coolingDown]);

  if (!profile || profile.instagram_connected || !profile.instagram_handle) return null;

  const fmtAgo = (ms: number) => {
    const h = Math.floor(ms / 3_600_000);
    if (h < 1) return t('PublicRefresh.justNow');
    if (h < 24) return t('PublicRefresh.hoursAgo', {n: h});
    return t('PublicRefresh.daysAgo', {n: Math.floor(h / 24)});
  };
  const fmtIn = (ms: number) => {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.max(1, Math.ceil((ms % 3_600_000) / 60_000));
    return h >= 1 ? t('PublicRefresh.hours', {n: h}) : t('PublicRefresh.minutes', {n: m});
  };

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await invokeFn<{
        success?: boolean;
        skipped?: boolean;
        nextAllowedAt?: string;
      }>('refresh-instagram-public', {});
      if (res?.nextAllowedAt) setNextAllowedAt(Date.parse(res.nextAllowedAt));
      if (res?.success) await refreshProfile();
    } catch (err: any) {
      // 409 "connected": the profile here is stale and the creator has in
      // fact connected — reload and this button disappears on its own.
      if (err instanceof EdgeFunctionError && err.status === 409) {
        await refreshProfile();
      } else {
        setError(err?.message || t('PublicRefresh.failed'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="items-center mt-3" style={{gap: 4}}>
      <Pressable
        onPress={run}
        disabled={busy || coolingDown}
        className={`flex-row items-center rounded-full px-4 border ${
          coolingDown ? 'bg-slate-50 border-slate-100' : 'bg-white border-[#9810FA]'
        }`}
        style={{height: 36, gap: 6}}>
        {busy ? (
          <ActivityIndicator size="small" color="#9810FA" />
        ) : (
          <RefreshCw size={14} color={coolingDown ? '#94A3B8' : '#9810FA'} />
        )}
        <Text
          className={`text-[12px] font-bold ${coolingDown ? 'text-slate-400' : 'text-[#9810FA]'}`}>
          {busy
            ? t('PublicRefresh.refreshing')
            : coolingDown
              ? t('PublicRefresh.nextIn', {in: fmtIn(nextAt - Date.now())})
              : t('PublicRefresh.refresh')}
        </Text>
      </Pressable>
      {last > 0 && !busy ? (
        <Text className="text-[10px] text-slate-400">
          {t('PublicRefresh.updatedAgo', {ago: fmtAgo(Date.now() - last)})}
        </Text>
      ) : null}
      {!!error && <Text className="text-[11px] text-red-600 text-center px-4">{error}</Text>}
    </View>
  );
}
