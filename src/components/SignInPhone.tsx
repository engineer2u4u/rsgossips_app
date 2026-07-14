import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
  onNext: (phone: string) => void;
  loading?: boolean;
  error?: string;
  phone?: string;
  setPhone?: (phone: string) => void;
  mode?: 'signin' | 'signup';
  minLen?: number;
  maxLen?: number;
  userExists?: boolean;
  role?: 'brand' | 'influencer';
  onSwitchToSignIn?: () => void;
}

export default function SignInPhone({
  onNext,
  loading = false,
  error = '',
  phone = '',
  setPhone = () => {},
  mode = 'signin',
  minLen = 10,
  maxLen = 10,
  userExists = false,
  role = 'influencer',
  onSwitchToSignIn = () => {},
}: Props) {
  const { t } = useTranslation();
  const [localPhone, setLocalPhone] = useState(phone);

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, maxLen);
    setLocalPhone(digits);
    setPhone(digits);
  };

  const handleSubmit = () => {
    if (localPhone.length < minLen || localPhone.length > maxLen) return;
    onNext(localPhone);
  };

  return (
    <View className="px-6 pt-4 pb-6">
      {/* TITLE */}
      <View className="items-center mb-8">
        <Text className="text-2xl font-bold text-slate-900 mb-2">
          {mode === 'signup' ? t('SignInPhone.titleSignup') : t('SignInPhone.titleSignin')}
        </Text>

        <Text className="text-sm text-slate-500 text-center">
          {mode === 'signup'
            ? t('SignInPhone.subtitleSignup')
            : t('SignInPhone.subtitleSignin')}
        </Text>
      </View>

      {/* ERROR */}
      {error !== '' && (
        <View className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
          <Text className="text-sm text-red-600">{error}</Text>
        </View>
      )}

      {/* USER EXISTS */}
      {userExists && (
        <View className="p-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg flex-row justify-between items-center">
          <Text className="text-sm text-yellow-800">{t('SignInPhone.userExists')}</Text>

          <Pressable onPress={onSwitchToSignIn}>
            <Text className="text-sm font-semibold text-[#6347F9]">
              {t('SignInPhone.signInLink')}
            </Text>
          </Pressable>
        </View>
      )}

      {/* PHONE INPUT */}
      <View className="mb-6">
        <View className="flex-row items-center border border-slate-200 rounded-2xl h-14 px-4 bg-white">
          <View className="pr-3 border-r border-slate-200 mr-3">
            <Text className="text-sm font-semibold text-slate-700">+91</Text>
          </View>

          <TextInput
            keyboardType="phone-pad"
            value={localPhone}
            onChangeText={handlePhoneChange}
            placeholder={t('SignInPhone.phonePlaceholder')}
            maxLength={maxLen}
            editable={!loading}
            className="flex-1 text-base"
            style={{ lineHeight: 16 }}
          />
        </View>
      </View>

      {/* BUTTON — matches the brand-pink "Next" button used elsewhere
          (OnboardingCarousel) so the auth surface looks cohesive. */}
      <Pressable
        onPress={handleSubmit}
        disabled={
          loading || localPhone.length < minLen || localPhone.length > maxLen
        }
        className="w-full bg-[#FA288A] h-[58px] rounded-[20px] items-center justify-center"
      >
        <Text className="text-white text-lg font-semibold">
          {loading
            ? t('SignInPhone.sendingOtp')
            : mode === 'signup'
              ? t('SignInPhone.titleSignup')
              : t('SignInPhone.sendOtp')}
        </Text>
      </Pressable>
    </View>
  );
}
