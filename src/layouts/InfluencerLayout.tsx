import React, {useRef, createContext, useContext, useState, useEffect, useCallback} from 'react';
import {View, ScrollView, Image, Pressable, Text, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Bell, Headphones} from 'lucide-react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

import BottomNav from '../components/BottomNav';
import SupportChatModal from '../components/SupportChatModal';
import InstagramRequiredGate from '../components/InstagramRequiredGate';
import {useAuth} from '../context/AuthContext';
import {invokeFn} from '../lib/api';
import {BRAND, BG} from '../theme/brand';

const LayoutScrollContext = createContext<React.RefObject<ScrollView | null> | null>(null);
export function useLayoutScroll() {
  return useContext(LayoutScrollContext);
}

function TopBar({onOpenSupport}: {onOpenSupport: () => void}) {
  const navigation = useNavigation<any>();
  const {user} = useAuth();
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

    </View>
  );
}

export default function InfluencerLayout({
  children,
  onRefresh,
}: {
  children: React.ReactNode;
  /** Optional pull-to-refresh handler. When provided, the page exposes a
   *  native RefreshControl that runs this callback and shows the spinner
   *  until the returned promise resolves (or 0ms for void returns). */
  onRefresh?: () => void | Promise<void>;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const {profile, instagramTokenMissing} = useAuth();
  // Instagram is a mandatory connection for influencers. We gate the
  // dashboard only when BOTH signals agree: the profile flag is explicit
  // false AND the refresh-instagram poll also reports the token missing.
  // This stops a stale `instagram_connected: false` from check-profile
  // from gating users whose token is in fact still valid (refresh-instagram
  // clears instagramTokenMissing the moment it confirms the token works).
  const needsIg =
    !!profile && profile.instagram_connected === false && instagramTokenMissing;

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

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
          showsVerticalScrollIndicator={false}
          // Detach off-screen views from the native hierarchy on Android —
          // the home page has many heavy sections (multiple carousels, lists
          // of shadowed cards) and the JS thread chokes without recycling.
          removeClippedSubviews
          // Drop the JS-thread scroll event spam from 60Hz to ~16Hz; the
          // page doesn't react to per-pixel scroll position.
          scrollEventThrottle={16}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={BRAND.accent}
                colors={[BRAND.accent]}
              />
            ) : undefined
          }>
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
