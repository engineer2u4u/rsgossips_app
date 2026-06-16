import React from 'react';
import {Modal, View, Text, ActivityIndicator} from 'react-native';

/**
 * Full-screen lock while we wait for the webhook to flip subscription_plan
 * on the profile. The caller polls refreshProfile in a bounded loop and
 * hides this when done — see InfluencerPricing.handleUpgrade.
 *
 * `transparent` + `statusBarTranslucent` so the dim covers the whole
 * screen including the status bar / nav bar areas.
 */
export default function VerifyingOverlay({visible}: {visible: boolean}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}>
      <View
        className="flex-1 items-center justify-center"
        style={{backgroundColor: 'rgba(255,255,255,0.92)', gap: 18}}>
        <ActivityIndicator size="large" color="#9810FA" />
        <View className="items-center px-8" style={{gap: 4}}>
          <Text className="text-lg font-black text-slate-900">
            Payment received
          </Text>
          <Text className="text-sm font-semibold text-slate-500">
            Syncing your new plan…
          </Text>
          <Text className="text-[11px] font-semibold text-slate-400 mt-3">
            This usually takes a couple of seconds.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
