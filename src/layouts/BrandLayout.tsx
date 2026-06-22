import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../components/BrandBottomNav';
import InstagramRequiredGate from '../components/InstagramRequiredGate';
import { useAuth } from '../context/AuthContext';

export default function BrandsLayout({ children }: any) {
  const { profile } = useAuth();
  // Block dashboard interaction until IG is connected. The gate is a
  // fixed full-screen modal; the layout still renders so the gate has
  // an auth-aware mount target.
  const needsIg = !!profile && profile.instagram_connected === false;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Main Scrollable Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav />

      {needsIg && <InstagramRequiredGate />}
    </SafeAreaView>
  );
}
