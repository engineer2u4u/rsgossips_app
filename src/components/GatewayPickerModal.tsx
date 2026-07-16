import React from 'react';
import {Modal, View, Text, Pressable, Image, Platform} from 'react-native';
import Svg, {Path, SvgUri} from 'react-native-svg';
import {useTranslation} from 'react-i18next';

interface Props {
  visible: boolean;
  planLabel: string;
  onCancel: () => void;
  onPick: (gateway: 'stripe' | 'razorpay') => void;
}

// Bottom-sheet gateway picker — mirrors the web's modal. Stripe is currently
// DISABLED (only Razorpay is offered); all Stripe code (this option, the
// StripeLogo, the gateway==='stripe' branch in callers, the stripe-* edge
// functions) is kept so it can be re-enabled by flipping SHOW_STRIPE.
const SHOW_STRIPE = false;

export default function GatewayPickerModal({
  visible,
  planLabel,
  onCancel,
  onPick,
}: Props) {
  const {t} = useTranslation();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent>
      <Pressable
        onPress={onCancel}
        className="flex-1 justify-end"
        style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
        {/* Inner pressable swallows taps so they don't bubble up and
            dismiss the modal. */}
        <Pressable
          onPress={() => {}}
          className="bg-white rounded-t-[28px]"
          style={{paddingBottom: Platform.OS === 'ios' ? 34 : 24}}>
          <View className="items-center pt-3">
            <View className="w-10 h-1 rounded-full bg-slate-200" />
          </View>

          <View className="px-5 pt-4">
            <Text className="text-base font-black text-slate-900">
              {t('GatewayPickerModal.payFor')}{' '}
              <Text style={{color: '#5851DB'}}>{planLabel}</Text>
            </Text>
            <Text className="text-[11px] font-semibold text-slate-400 mt-0.5">
              {t('GatewayPickerModal.pickMethod')}
            </Text>
          </View>

          <View className="px-5 pt-4" style={{gap: 10}}>
            <GatewayOption
              onPress={() => onPick('razorpay')}
              title="Razorpay"
              tagline={t('GatewayPickerModal.razorpayTagline')}
              borderColor="rgba(12,36,81,0.15)"
              logo={<RazorpayLogo />}
            />
            {SHOW_STRIPE && (
              <GatewayOption
                onPress={() => onPick('stripe')}
                title="Stripe"
                tagline={t('GatewayPickerModal.stripeTagline')}
                borderColor="rgba(99,91,255,0.15)"
                logo={<StripeLogo />}
              />
            )}
            <Text className="text-[10px] text-slate-400 font-semibold text-center pt-3">
              {t('GatewayPickerModal.returnNote')}
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function GatewayOption({
  onPress,
  title,
  tagline,
  borderColor,
  logo,
}: {
  onPress: () => void;
  title: string;
  tagline: string;
  borderColor: string;
  logo: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{color: 'rgba(0,0,0,0.04)'}}
      className="flex-row items-center bg-white rounded-2xl p-4"
      style={{borderWidth: 2, borderColor, gap: 14}}>
      <View
        className="bg-slate-50 rounded-xl items-center justify-center"
        style={{width: 56, height: 56}}>
        {logo}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-black text-slate-900">{title}</Text>
        <Text className="text-[11px] font-semibold text-slate-500 mt-0.5">
          {tagline}
        </Text>
      </View>
      <Text className="text-slate-300 text-xl">›</Text>
    </Pressable>
  );
}

// Same compact SVG wordmarks the web uses (no asset bundle change needed
// since react-native-svg is already on the dependency tree).
function StripeLogo() {
  return (
    <Svg width="44" height="18" viewBox="0 0 60 24">
      <Path
        fill="#635BFF"
        d="M59.5 14.34c0-4.27-2.07-7.64-6.02-7.64-3.96 0-6.36 3.37-6.36 7.6 0 5.02 2.83 7.56 6.89 7.56 1.98 0 3.48-.45 4.61-1.08v-3.37c-1.13.57-2.43.92-4.08.92-1.62 0-3.05-.57-3.23-2.54h8.14c.01-.22.05-1.1.05-1.45zm-8.23-1.58c0-1.89 1.15-2.67 2.21-2.67 1.02 0 2.11.78 2.11 2.67h-4.32zM39.27 6.7c-1.63 0-2.68.77-3.26 1.3l-.22-1.03h-3.66v19.43l4.16-.88.01-4.72c.6.43 1.49 1.05 2.95 1.05 2.99 0 5.71-2.4 5.71-7.7-.02-4.84-2.78-7.45-5.69-7.45zm-1 11.45c-.98 0-1.56-.35-1.96-.78l-.02-6.17c.43-.48 1.03-.81 1.98-.81 1.52 0 2.57 1.7 2.57 3.87 0 2.22-1.04 3.89-2.57 3.89zM30.95 5.74V2.34l-4.17.88V6.6l4.17-.86zm-4.17 1.24h4.17v14.66h-4.17V6.98zM23.85 8.18l-.27-1.2h-3.59v14.66h4.16V11.71c.98-1.28 2.64-1.05 3.15-.87V6.98c-.53-.19-2.47-.55-3.45 1.2zM15.34 3.34l-4.06.86-.02 13.32c0 2.46 1.85 4.28 4.31 4.28 1.36 0 2.36-.25 2.91-.55v-3.4c-.53.22-3.16 1-3.16-1.46v-5.94h3.16V6.98h-3.16l.02-3.64zM4.21 11.26c0-.65.53-.9 1.41-.9 1.26 0 2.85.38 4.11 1.06V7.49c-1.37-.55-2.73-.76-4.11-.76C2.24 6.73 0 8.49 0 11.43c0 4.59 6.31 3.86 6.31 5.83 0 .76-.66 1.01-1.59 1.01-1.37 0-3.13-.57-4.51-1.32v3.96c1.53.66 3.07.94 4.51.94 3.45 0 5.83-1.7 5.83-4.68 0-4.96-6.34-4.08-6.34-5.91z"
      />
    </Svg>
  );
}

// Loads the official Razorpay wordmark from their CDN. The dark-text version
// (`logo-light.svg`) — paired against the white gateway-option tiles.
function RazorpayLogo() {
  return (
    <SvgUri
      width="68"
      height="16"
      uri="https://accounts.razorpay.com/assets/razorpay/logo-light.svg"
    />
  );
}
