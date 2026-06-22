import React, {useRef, createContext, useContext, useState, useEffect} from 'react';
import {View, ScrollView, Image, Pressable, Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Bell, Headphones} from 'lucide-react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

import BottomNav from '../components/BottomNav';
import SupportChatModal from '../components/SupportChatModal';
import InstagramRequiredGate from '../components/InstagramRequiredGate';
import {useAuth} from '../context/AuthContext';
import {invokeFn} from '../lib/api';
import {BRAND, BRAND_GRADIENT_WARM, BG} from '../theme/brand';

const LayoutScrollContext = createContext<React.RefObject<ScrollView | null> | null>(null);
export function useLayoutScroll() {
  return useContext(LayoutScrollContext);
}

function TopBar({onOpenSupport}: {onOpenSupport: () => void}) {
  const navigation = useNavigation<any>();
  const {profile, user} = useAuth();
  const initial = (profile?.full_name || 'U').trim().charAt(0).toUpperCase();
  const avatarUrl = profile?.profile_photo_url;
  const [unread, setUnread] = useState(0);

  // Mirrors the web header: fetch all notifications via the `notifications`
  // edge function and count the unread ones. Refresh on a 30s tick and
  // again whenever the layout regains focus (so the badge clears the moment
  // the user comes back from the Notifications screen).
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const fetchUnread = async () => {
      try {
        const data = await invokeFn<{notifications?: any[]}>(
          'notifications',
          {action: 'list', userId: user.id},
        );
        if (cancelled) return;
        const count = (data?.notifications || []).filter(
          (n: any) => !n.is_read,
        ).length;
        setUnread(count);
      } catch {
        // Best-effort — leave the existing count if the call fails.
      }
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (!user?.id) return;
      invokeFn<{notifications?: any[]}>('notifications', {
        action: 'list',
        userId: user.id,
      })
        .then(data => {
          const count = (data?.notifications || []).filter(
            (n: any) => !n.is_read,
          ).length;
          setUnread(count);
        })
        .catch(() => {});
    }, [user?.id]),
  );

  return (
    <View
      className="flex-row items-center px-4 py-3 border-b border-slate-100"
      style={{
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.88)',
      }}>
      <Image
        source={require('../assets/rgossipsLogo.png')}
        style={{height: 26, width: 150, marginRight: 'auto'}}
        resizeMode="contain"
      />

      <Pressable
        onPress={() => navigation.navigate('InfluencerNotifications')}
        className="w-10 h-10 rounded-2xl border border-slate-100 bg-white items-center justify-center relative">
        <Bell size={19} color="#4d4960" />
        {unread > 0 && (
          <View
            className="absolute items-center justify-center"
            style={{
              top: -5,
              right: -5,
              minWidth: 18,
              height: 18,
              paddingHorizontal: 4,
              borderRadius: 9,
              backgroundColor: BRAND.accent,
              borderWidth: 2,
              borderColor: '#fff',
            }}>
            <Text className="text-white text-[10px] font-black">
              {unread > 9 ? '9+' : unread}
            </Text>
          </View>
        )}
      </Pressable>

      <Pressable
        onPress={onOpenSupport}
        className="w-10 h-10 rounded-2xl border border-slate-100 bg-white items-center justify-center">
        <Headphones size={19} color="#4d4960" />
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('InfluencerProfile')}
        style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: 'rgba(210,65,143,0.45)',
        }}>
        {avatarUrl ? (
          <Image source={{uri: avatarUrl}} style={{width: '100%', height: '100%'}} />
        ) : (
          <LinearGradient
            colors={[...BRAND_GRADIENT_WARM]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Text className="text-white font-bold text-base">{initial}</Text>
          </LinearGradient>
        )}
      </Pressable>
    </View>
  );
}

export default function InfluencerLayout({children}: {children: React.ReactNode}) {
  const scrollRef = useRef<ScrollView>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const {profile} = useAuth();
  // Instagram is a mandatory connection for influencers — gate the
  // dashboard until profile.instagram_connected is true. `undefined`
  // means cached/old response (don't block); explicit `false` means
  // server confirmed no token.
  const needsIg = !!profile && profile.instagram_connected === false;

  return (
    <SafeAreaView className="flex-1" style={{backgroundColor: BG.page}}>
      <TopBar onOpenSupport={() => setSupportOpen(true)} />

      <LayoutScrollContext.Provider value={scrollRef}>
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          style={{backgroundColor: BG.page}}
          // Pad the scroll bottom so the floating glass nav doesn't sit
          // over the final content card.
          contentContainerStyle={{flexGrow: 1, paddingBottom: 110}}
          showsVerticalScrollIndicator={false}>
          <View className="w-full">{children}</View>
        </ScrollView>
      </LayoutScrollContext.Provider>

      {/* BottomNav positions itself absolutely (floating pill) — no wrapper
          needed here, but the SafeAreaView is the nearest non-scrolling
          parent so it pins to the screen edge. */}
      <BottomNav />

      {/* Support decision-tree chat — mirrors web's SupportChat. */}
      <SupportChatModal
        visible={supportOpen}
        onClose={() => setSupportOpen(false)}
      />

      {needsIg && <InstagramRequiredGate />}
    </SafeAreaView>
  );
}
