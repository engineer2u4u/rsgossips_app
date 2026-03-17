import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { User, Briefcase, CheckCircle2 } from 'lucide-react-native';

interface Props {
  onNext: (role: 'brand' | 'influencer') => void;
}

export default function RoleSelection({ onNext }: Props) {
  const [selectedRole, setSelectedRole] = useState<
    'brand' | 'influencer' | null
  >(null);

  const handleContinue = () => {
    if (selectedRole) {
      onNext(selectedRole);
    }
  };

  return (
    <View className="px-6 pt-4 pb-6">
      {/* TITLE */}
      <View className="items-center mb-8">
        <Text className="text-2xl font-bold text-slate-900 mb-2">
          Choose your Role
        </Text>

        <Text className="text-slate-500 text-sm text-center">
          Select how you want to use the platform
        </Text>
      </View>

      {/* OPTIONS */}
      <View>
        {/* Influencer */}
        <Pressable
          onPress={() => setSelectedRole('influencer')}
          className={`flex-row items-center p-5 rounded-2xl border mb-4 ${
            selectedRole === 'influencer'
              ? 'border-purple-600 bg-purple-50'
              : 'border-slate-200 bg-white'
          }`}
        >
          <View
            className={`p-3 rounded-xl mr-4 ${
              selectedRole === 'influencer' ? 'bg-purple-600' : 'bg-slate-100'
            }`}
          >
            <User
              size={24}
              color={selectedRole === 'influencer' ? 'white' : '#475569'}
            />
          </View>

          <View className="flex-1">
            <Text className="font-bold text-slate-900">
              Influencer / Creator
            </Text>

            <Text className="text-xs text-slate-500">
              I want to collaborate with brands
            </Text>
          </View>

          {selectedRole === 'influencer' && (
            <CheckCircle2 size={20} color="#9810FA" />
          )}
        </Pressable>

        {/* Brand */}
        <Pressable
          onPress={() => setSelectedRole('brand')}
          className={`flex-row items-center p-5 rounded-2xl border ${
            selectedRole === 'brand'
              ? 'border-purple-600 bg-purple-50'
              : 'border-slate-200 bg-white'
          }`}
        >
          <View
            className={`p-3 rounded-xl mr-4 ${
              selectedRole === 'brand' ? 'bg-purple-600' : 'bg-slate-100'
            }`}
          >
            <Briefcase
              size={24}
              color={selectedRole === 'brand' ? 'white' : '#475569'}
            />
          </View>

          <View className="flex-1">
            <Text className="font-bold text-slate-900">Brand / Business</Text>

            <Text className="text-xs text-slate-500">
              I want to hire creators for campaigns
            </Text>
          </View>

          {selectedRole === 'brand' && (
            <CheckCircle2 size={20} color="#9810FA" />
          )}
        </Pressable>
      </View>

      {/* BUTTON */}
      <Pressable
        onPress={handleContinue}
        disabled={!selectedRole}
        className={`h-14 rounded-2xl items-center justify-center mt-8 ${
          selectedRole ? 'bg-[#9810FA]' : 'bg-gray-300'
        }`}
      >
        <Text className="text-white text-lg font-semibold">Continue</Text>
      </Pressable>
    </View>
  );
}
