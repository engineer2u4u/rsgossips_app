import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../components/BrandBottomNav';
import InstagramRequiredGate from '../components/InstagramRequiredGate';
import { useAuth } from '../context/AuthContext';
import { BG } from '../theme/brand';

export default function BrandsLayout({
  children,
  /** Colour painted behind the status bar. Screens whose header is the blue
   *  gradient pass BG.brandHeader so the bar matches it; the default white
   *  suits the screens with a white header (home). */
  topColor = BG.header,
}: any) {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  // Block dashboard interaction until IG is connected. The gate is a
  // fixed full-screen modal; the layout still renders so the gate has
  // an auth-aware mount target.
  const needsIg = !!profile && profile.instagram_connected === false;

  return (
    // edges omits 'top' so the strip below can paint it the header's colour —
    // otherwise the status bar shows white over a blue gradient header.
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      className="flex-1 bg-white">
      <View style={{ height: insets.top, backgroundColor: topColor }} />

      {/* Main Scrollable Content.
          BrandBottomNav is absolutely positioned over this, so the scroll
          has to reserve its height (h-16 = 64) plus breathing room or the
          last row sits under the nav and can't be reached — Delete Account
          on the profile screen was unreachable. InfluencerLayout does the
          same with 110 for its taller floating pill. */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 88 }}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav />

      {needsIg && <InstagramRequiredGate />}
    </SafeAreaView>
  );
}
