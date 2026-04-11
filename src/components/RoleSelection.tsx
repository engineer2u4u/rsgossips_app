import React from 'react';
import {View, Text, Pressable} from 'react-native';
import {User, Briefcase} from 'lucide-react-native';

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
  const isSignIn = mode === 'signin';

  return (
    <View className="px-6 pt-4 pb-6">
      {/* TITLE */}
      <View className="items-center mb-8">
        <Text className="text-2xl font-bold text-slate-900 mb-2">
          {isSignIn ? 'Sign In' : 'Create Account'}
        </Text>

        <Text className="text-slate-500 text-sm text-center">
          {isSignIn
            ? 'Select your role to sign in'
            : 'Select how you want to use the platform'}
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
              Influencer / Creator
            </Text>

            <Text className="text-xs text-slate-500">
              I want to collaborate with brands
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
            <Text className="font-bold text-slate-900">Brand / Business</Text>

            <Text className="text-xs text-slate-500">
              I want to hire creators for campaigns
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Switch Mode */}
      {onSwitchMode && (
        <Pressable onPress={onSwitchMode} className="mt-8">
          <Text className="text-center text-sm text-slate-500">
            {isSignIn ? "Don't have an account? " : 'Already have an account? '}
            <Text className="text-[#6347F9] font-bold">
              {isSignIn ? 'Sign Up' : 'Sign In'}
            </Text>
          </Text>
        </Pressable>
      )}
    </View>
  );
}
