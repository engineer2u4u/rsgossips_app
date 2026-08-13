import React from 'react';
import {Modal, View, Text, ActivityIndicator} from 'react-native';
import {useTranslation} from 'react-i18next';

/**
 * Full-screen lock while we wait for a payment webhook to settle (used by the
 * service-order checkout flow). The caller polls in a bounded loop and hides
 * this when done.
 *
 * `transparent` + `statusBarTranslucent` so the dim covers the whole
 * screen including the status bar / nav bar areas.
 */
export default function VerifyingOverlay({visible}: {visible: boolean}) {
  const {t} = useTranslation();
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
            {t('verifyingOverlay.title')}
          </Text>
          <Text className="text-sm font-semibold text-slate-500">
            {t('verifyingOverlay.subtitle')}
          </Text>
          <Text className="text-[11px] font-semibold text-slate-400 mt-3">
            {t('verifyingOverlay.hint')}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
