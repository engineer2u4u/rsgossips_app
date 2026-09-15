import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  AppState,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import {Instagram, X} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../context/AuthContext';
import {isInstagramTokenExpired} from '../lib/instagramToken';
import {useInstagramReconnect} from '../hooks/useInstagramReconnect';

// Ask a returning creator to reconnect Instagram as soon as we know their
// token is dead. Mirrors web InstagramReconnectModal.
//
// Mounted ONCE at the app root (App.tsx) — not in InfluencerLayout, which
// every stacked screen mounts, so a per-screen Modal would stack copies.
//
// "Later" hides it until the app next comes back from the background after
// REASK_AFTER_MS, or the next cold start.
const REASK_AFTER_MS = 30 * 60 * 1000;

export default function InstagramReconnectModal() {
  const {t} = useTranslation();
  const {user, role, profile, instagramTokenMissing} = useAuth();
  const [dismissedAt, setDismissedAt] = useState(0);
  const backgroundedAt = useRef<number | null>(null);

  const {connecting, error, reconnect} = useInstagramReconnect({
    userId: user?.id,
    errorReconnect: t('InstagramReconnectModal.failed'),
    errorOpen: t('InstagramReconnectModal.failedOpen'),
  });

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'background' || state === 'inactive') {
        backgroundedAt.current = Date.now();
      } else if (state === 'active') {
        const away = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0;
        backgroundedAt.current = null;
        if (away >= REASK_AFTER_MS) setDismissedAt(0);
      }
    });
    return () => sub.remove();
  }, []);

  const expired =
    role === 'influencer' &&
    !!profile?.instagram_connected &&
    (instagramTokenMissing || isInstagramTokenExpired(profile));
  const visible = expired && !dismissedAt;

  const later = () => setDismissedAt(Date.now());

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={later}
      statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
          padding: 16,
        }}>
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 24,
            padding: 22,
            width: '100%',
            maxWidth: 480,
            alignSelf: 'center',
          }}>
          <Pressable
            onPress={later}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('InstagramReconnectModal.later')}
            style={{position: 'absolute', top: 12, right: 12, padding: 6}}>
            <X size={18} color="#94A3B8" />
          </Pressable>

          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}>
            <LinearGradient
              colors={['#FCAF45', '#E1306C', '#833AB4']}
              start={{x: 0, y: 1}}
              end={{x: 1, y: 0}}
              style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
            />
            <Instagram size={26} color="#fff" />
          </View>

          <Text
            style={{fontSize: 18, fontWeight: '900', color: '#0F172A', paddingRight: 28}}>
            {t('InstagramReconnectModal.title')}
          </Text>
          <Text style={{fontSize: 14, color: '#64748B', marginTop: 8, lineHeight: 20}}>
            {t('InstagramReconnectModal.body')}
          </Text>
          {error ? (
            <Text style={{fontSize: 13, color: '#EF4444', marginTop: 10}}>{error}</Text>
          ) : null}

          <Pressable
            onPress={reconnect}
            disabled={connecting}
            style={{
              marginTop: 20,
              height: 48,
              borderRadius: 14,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              opacity: connecting ? 0.6 : 1,
            }}>
            <LinearGradient
              colors={['#FCAF45', '#E1306C', '#833AB4']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
            />
            {connecting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Instagram size={16} color="#fff" />
            )}
            <Text style={{color: '#fff', fontSize: 15, fontWeight: '800'}}>
              {connecting
                ? t('InstagramReconnectModal.connecting')
                : t('InstagramReconnectModal.reconnect')}
            </Text>
          </Pressable>

          <Pressable
            onPress={later}
            style={{height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6}}>
            <Text style={{color: '#64748B', fontSize: 14, fontWeight: '700'}}>
              {t('InstagramReconnectModal.later')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
