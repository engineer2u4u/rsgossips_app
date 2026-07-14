import React from 'react';
import {View, Text, Pressable} from 'react-native';
import {User, Briefcase} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';

interface Props {
  onNext: (role: 'brand' | 'influencer') => void;
  mode?: 'signin' | 'signup';
  onSwitchMode?: () => void;
}

export default function RoleSelection({
  onNext,
  mode = 'signup',
  onSwitchMode,
}: Props) {
  const {t} = useTranslation();
  const isSignIn = mode === 'signin';

  return (
    <View className="px-6 pt-4 pb-6">
      {/* TITLE */}
      <View className="items-center mb-8">
        <Text className="text-2xl font-bold text-slate-900 mb-2">
          {isSignIn ? t('RoleSelection.signIn') : t('RoleSelection.createAccount')}
        </Text>

        <Text className="text-slate-500 text-sm text-center">
          {isSignIn
            ? t('RoleSelection.selectRoleSignIn')
            : t('RoleSelection.selectRoleSignUp')}
        </Text>
      </View>

      {/* OPTIONS */}
      <View>
        {/* Influencer */}
        <Pressable
          onPress={() => onNext('influencer')}
          className="flex-row items-center p-5 rounded-2xl border border-slate-200 bg-white mb-4 active:border-purple-600 active:bg-purple-50">
          <View className="p-3 rounded-xl mr-4 bg-slate-100">
            <User size={24} color="#475569" />
          </View>

          <View className="flex-1">
            <Text className="font-bold text-slate-900">
              {t('RoleSelection.influencerTitle')}
            </Text>

            <Text className="text-xs text-slate-500">
              {t('RoleSelection.influencerSubtitle')}
            </Text>
          </View>
        </Pressable>

        {/* Brand */}
        <Pressable
          onPress={() => onNext('brand')}
          className="flex-row items-center p-5 rounded-2xl border border-slate-200 bg-white active:border-purple-600 active:bg-purple-50">
          <View className="p-3 rounded-xl mr-4 bg-slate-100">
            <Briefcase size={24} color="#475569" />
          </View>

          <View className="flex-1">
            <Text className="font-bold text-slate-900">
              {t('RoleSelection.brandTitle')}
            </Text>

            <Text className="text-xs text-slate-500">
              {t('RoleSelection.brandSubtitle')}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Switch Mode */}
      {onSwitchMode && (
        <Pressable onPress={onSwitchMode} className="mt-8">
          <Text className="text-center text-sm text-slate-500">
            {isSignIn
              ? t('RoleSelection.noAccountPrompt')
              : t('RoleSelection.haveAccountPrompt')}
            <Text className="text-[#6347F9] font-bold">
              {isSignIn ? t('RoleSelection.signUp') : t('RoleSelection.signIn')}
            </Text>
          </Text>
        </Pressable>
      )}
    </View>
  );
}
