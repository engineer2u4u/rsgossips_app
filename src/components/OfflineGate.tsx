import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {RefreshCw, WifiOff} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
// @ts-ignore — provided by react-native-dotenv
import {NEXT_PUBLIC_SUPABASE_URL as SUPABASE_URL} from '@env';

// Full-screen offline takeover. The app has no NetInfo dependency, so the
// signal comes from the API layer: invokeFn emits NETWORK_ERROR_EVENT when a
// fetch dies with a network-level failure. While visible we probe the
// backend every 4s and dismiss only when a real HTTP response comes back —
// so the app resumes exactly when connectivity returns.
export const NETWORK_ERROR_EVENT = 'rg-network-error';

async function probe(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    // Any HTTP status proves the network path is alive.
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return !!res;
  } catch {
    return false;
  }
}

export default function OfflineGate() {
  const {t} = useTranslation();
  const [offline, setOffline] = useState(false);
  const [checking, setChecking] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tryReconnect = useCallback(async () => {
    setChecking(true);
    const up = await probe();
    setChecking(false);
    if (up) setOffline(false);
  }, []);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(NETWORK_ERROR_EVENT, () => {
      setOffline(true);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!offline) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    pollRef.current = setInterval(() => {
      probe().then(up => up && setOffline(false));
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [offline]);

  if (!offline) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.art}>
        <View style={[styles.ring, styles.ringOuter]} />
        <View style={[styles.ring, styles.ringInner]} />
        <LinearGradient colors={['#9810FA', '#E60076']} style={styles.core}>
          <WifiOff size={28} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.emoji}>📡</Text>
      </View>

      <Text style={styles.title}>{t('OfflineGate.title')}</Text>
      <Text style={styles.body}>{t('OfflineGate.body')}</Text>

      <TouchableOpacity onPress={tryReconnect} disabled={checking} activeOpacity={0.85}>
        <LinearGradient colors={['#9810FA', '#E60076']} style={styles.button}>
          {checking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <RefreshCw size={16} color="#FFFFFF" />
          )}
          <Text style={styles.buttonText}>
            {checking ? t('OfflineGate.checking') : t('OfflineGate.refresh')}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.note}>{t('OfflineGate.autoNote')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8F9FD',
    zIndex: 9999,
    elevation: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  art: {width: 128, height: 128, alignItems: 'center', justifyContent: 'center', marginBottom: 28},
  ring: {position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(152,16,250,0.08)'},
  ringOuter: {width: 128, height: 128},
  ringInner: {width: 96, height: 96, backgroundColor: 'rgba(230,0,118,0.10)'},
  core: {width: 64, height: 64, borderRadius: 999, alignItems: 'center', justifyContent: 'center'},
  emoji: {position: 'absolute', top: -4, right: -4, fontSize: 22},
  title: {fontSize: 22, fontWeight: '900', color: '#0f172a', textAlign: 'center'},
  body: {fontSize: 13, lineHeight: 20, color: '#64748b', textAlign: 'center', marginTop: 10},
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 28,
  },
  buttonText: {color: '#FFFFFF', fontSize: 14, fontWeight: '900'},
  note: {fontSize: 11, color: '#94a3b8', marginTop: 14, textAlign: 'center'},
});
