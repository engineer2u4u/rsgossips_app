import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../components/BrandBottomNav';

export default function BrandsLayout({ children }: any) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Main Scrollable Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav />
    </SafeAreaView>
  );
}
