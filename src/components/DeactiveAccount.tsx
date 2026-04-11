import React from 'react';
import {View, Text, TouchableOpacity, ScrollView, TextInput} from 'react-native';
import {ChevronLeft, AlertTriangle, XCircle} from 'lucide-react-native';

interface DeactiveAccountProps {
  onBack: () => void;
}

const PageHeader = ({title, onBack}: {title: string; onBack: () => void}) => (
  <View className="flex-row items-center gap-4 px-6 py-4 bg-white border-b border-slate-100">
    <TouchableOpacity onPress={onBack} className="p-2 rounded-full bg-[#FCE6F1]">
      <ChevronLeft size={20} color="#E60076" />
    </TouchableOpacity>
    <Text className="text-lg font-bold text-slate-800">{title}</Text>
  </View>
);

const DeactiveAccount: React.FC<DeactiveAccountProps> = ({onBack}) => {
  return (
    <View className="flex-1 bg-slate-50">
      <PageHeader title="Deactivate Account" onBack={onBack} />

      <ScrollView className="flex-1 px-6 pt-6">
        {/* Warning Banner */}
        <View className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-3">
            <AlertTriangle size={22} color="#ef4444" />
            <Text className="text-base font-bold text-red-600 ml-3">Warning</Text>
          </View>
          <Text className="text-sm text-red-500 leading-5">
            Deactivating your account will temporarily hide your profile, posts, and interactions.
            You can reactivate your account at any time by logging back in.
          </Text>
        </View>

        {/* What Happens Section */}
        <Text className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          What happens when you deactivate
        </Text>
        <View className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          {[
            'Your profile will be hidden from search results',
            'Your posts will no longer be visible',
            'Active campaigns will be paused',
            'You will stop receiving notifications',
          ].map((item, index) => (
            <View key={index} className="flex-row items-start mb-3 last:mb-0">
              <XCircle size={16} color="#94a3b8" />
              <Text className="text-sm text-slate-600 ml-3 flex-1">{item}</Text>
            </View>
          ))}
        </View>

        {/* Reason */}
        <Text className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Reason for leaving (optional)
        </Text>
        <TextInput
          className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 h-28 mb-6"
          placeholder="Tell us why you're leaving..."
          placeholderTextColor="#94a3b8"
          multiline
          textAlignVertical="top"
        />

        {/* Confirm Password */}
        <Text className="text-sm font-medium text-slate-600 mb-2">
          Enter your password to confirm
        </Text>
        <TextInput
          className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 mb-6"
          placeholder="Enter password"
          placeholderTextColor="#94a3b8"
          secureTextEntry
        />

        {/* Deactivate Button */}
        <TouchableOpacity className="items-center justify-center mb-4 py-4 rounded-xl bg-red-500">
          <Text className="text-white font-bold text-base">Deactivate Account</Text>
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          onPress={onBack}
          className="items-center justify-center mb-8 py-4 rounded-xl border border-slate-200">
          <Text className="text-slate-600 font-bold text-base">Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default DeactiveAccount;
