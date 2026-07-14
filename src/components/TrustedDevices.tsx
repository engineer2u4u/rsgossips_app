// Trusted Devices — real list from public.device_sessions, with inline revoke
// and bulk "log out other devices". Mirrors web app src/components/TrustedDevices.jsx.
//
// The current device is identified by the device_id stored in AsyncStorage
// (see src/utils/device-session.ts). Revoking a non-current device just
// flips is_active=false; AuthContext on that device polls every 60s and
// auto-signs-out. Revoking the *current* device signs us out immediately.

import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronLeft,
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import type {TFunction} from 'i18next';
import {supabase} from '../utils/supabase';
import {useAuth} from '../context/AuthContext';
import {getCurrentDeviceId} from '../utils/device-session';
import {useGlobalLoading} from '../context/LoadingContext';

interface TrustedDevicesProps {
  onBack: () => void;
}

type DeviceRow = {
  id: string;
  device_id: string;
  device_name: string | null;
  user_agent: string | null;
  last_active_at: string | null;
  is_active: boolean;
};

function pickIcon(name: string | null | undefined, ua: string | null | undefined) {
  const s = `${name || ''} ${ua || ''}`.toLowerCase();
  if (s.includes('ipad') || s.includes('tablet')) return Tablet;
  if (s.includes('iphone') || s.includes('android') || s.includes('ios') || s.includes('rgossips')) return Smartphone;
  return Monitor;
}

function relativeTime(iso: string | null, t: TFunction): string {
  if (!iso) return t('TrustedDevices.unknown');
  const ts = new Date(iso).getTime();
  if (!isFinite(ts)) return t('TrustedDevices.unknown');
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('TrustedDevices.activeNow');
  if (mins < 60) return t('TrustedDevices.activeMinAgo', {count: mins});
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('TrustedDevices.activeHrAgo', {count: hours});
  const days = Math.floor(hours / 24);
  if (days < 30) return t('TrustedDevices.activeDaysAgo', {count: days});
  return new Date(iso).toLocaleDateString();
}

const PageHeader = ({title, onBack}: {title: string; onBack: () => void}) => (
  <View className="flex-row items-center gap-4 px-6 py-4 bg-white border-b border-slate-100">
    <TouchableOpacity onPress={onBack} className="p-2 rounded-full bg-[#FCE6F1]">
      <ChevronLeft size={20} color="#E60076" />
    </TouchableOpacity>
    <Text className="text-lg font-bold text-slate-800">{title}</Text>
  </View>
);

export default function TrustedDevices({onBack}: TrustedDevicesProps) {
  const {t} = useTranslation();
  const {user} = useAuth();
  const {withLoading} = useGlobalLoading();
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setError(null);
    setLoading(true);
    const [cid, list] = await Promise.all([
      getCurrentDeviceId(),
      supabase
        .from('device_sessions')
        .select('id, device_id, device_name, user_agent, last_active_at, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_active_at', {ascending: false}),
    ]);
    setCurrentId(cid);
    if (list.error) {
      console.warn('device_sessions select failed:', list.error.message);
      setError(list.error.message);
      setDevices([]);
    } else {
      setDevices((list.data || []) as DeviceRow[]);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const revoke = (row: DeviceRow) => {
    const isCurrent = row.device_id === currentId;
    Alert.alert(
      isCurrent
        ? t('TrustedDevices.signOutThisDeviceTitle')
        : t('TrustedDevices.removeThisDeviceTitle'),
      isCurrent
        ? t('TrustedDevices.signOutImmediately')
        : t('TrustedDevices.deviceSignedOutSoon', {
            device: row.device_name || t('TrustedDevices.thisDevice'),
          }),
      [
        {text: t('TrustedDevices.cancel'), style: 'cancel'},
        {
          text: isCurrent ? t('TrustedDevices.signOut') : t('TrustedDevices.remove'),
          style: 'destructive',
          onPress: () =>
            withLoading(
              (async () => {
                await supabase.from('device_sessions').update({is_active: false}).eq('id', row.id);
                if (isCurrent) {
                  await supabase.auth.signOut();
                } else {
                  await load();
                }
              })(),
              isCurrent
                ? t('TrustedDevices.signingOut')
                : t('TrustedDevices.removingDevice'),
            ),
        },
      ],
    );
  };

  const revokeOthers = () => {
    if (!user?.id || !currentId) return;
    const others = devices.filter(d => d.device_id !== currentId);
    if (others.length === 0) return;
    Alert.alert(
      t('TrustedDevices.signOutAllOthersTitle'),
      t('TrustedDevices.devicesSignedOutSoon', {count: others.length}),
      [
        {text: t('TrustedDevices.cancel'), style: 'cancel'},
        {
          text: t('TrustedDevices.signOut'),
          style: 'destructive',
          onPress: () =>
            withLoading(
              (async () => {
                await supabase
                  .from('device_sessions')
                  .update({is_active: false})
                  .eq('user_id', user.id)
                  .neq('device_id', currentId);
                await load();
              })(),
              t('TrustedDevices.signingOutOthers'),
            ),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <PageHeader title={t('TrustedDevices.title')} onBack={onBack} />

      <ScrollView className="flex-1">
        <Text className="px-6 pt-6 pb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">
          {t('TrustedDevices.activeSessions')}
        </Text>

        <View
          className="mx-4 rounded-2xl overflow-hidden bg-white"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 10,
            shadowOffset: {width: 0, height: 4},
            elevation: 3,
          }}>
          {loading ? (
            <View className="py-10 items-center">
              <ActivityIndicator color="#E60076" />
            </View>
          ) : error ? (
            <View className="px-5 py-6">
              <Text className="text-xs text-red-500 text-center">{error}</Text>
            </View>
          ) : devices.length === 0 ? (
            <View className="px-5 py-6">
              <Text className="text-sm text-slate-400 text-center">
                {t('TrustedDevices.noActiveSessions')}
              </Text>
            </View>
          ) : (
            devices.map(d => {
              const Icon = pickIcon(d.device_name, d.user_agent);
              const isCurrent = d.device_id === currentId;
              return (
                <View
                  key={d.id}
                  className="flex-row items-center px-5 py-4 border-b border-slate-50">
                  <View className="w-12 h-12 rounded-xl bg-[#FCE6F1] items-center justify-center mr-4">
                    <Icon size={20} color="#E60076" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-base font-medium text-slate-700">
                        {d.device_name || t('TrustedDevices.unknownDevice')}
                      </Text>
                      {isCurrent && (
                        <View className="ml-2 px-2 py-0.5 rounded-full bg-green-100">
                          <Text className="text-xs font-semibold text-green-600">
                            {t('TrustedDevices.current')}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-xs text-slate-400 mt-1" numberOfLines={1}>
                      {d.user_agent || '—'}
                    </Text>
                    <Text className="text-xs text-slate-400">{relativeTime(d.last_active_at, t)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => revoke(d)} className="p-2" hitSlop={4}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {devices.length > 1 && (
          <TouchableOpacity
            onPress={revokeOthers}
            className="flex-row items-center justify-center mx-6 mt-8 py-4 rounded-xl border-2 border-red-200 bg-red-50">
            <Trash2 size={18} color="#ef4444" />
            <Text className="text-red-500 font-bold text-base ml-2">
              {t('TrustedDevices.signOutAllOthers')}
            </Text>
          </TouchableOpacity>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
