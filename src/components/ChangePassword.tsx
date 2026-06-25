import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {ChevronLeft, Lock} from 'lucide-react-native';

interface ChangePasswordProps {
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

const PasswordField = ({label, placeholder}: {label: string; placeholder: string}) => (
  <View className="mb-5">
    <Text className="text-sm font-medium text-slate-600 mb-2">{label}</Text>
    <View
      className="flex-row items-center bg-white border border-slate-100 rounded-xl px-4"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 2},
        elevation: 2,
      }}>
      <Lock size={16} color="#94a3b8" />
      <TextInput
        className="flex-1 py-3 ml-3 text-base text-slate-800"
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        secureTextEntry
      />
    </View>
  </View>
);

const ChangePassword: React.FC<ChangePasswordProps> = ({onBack}) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50">
      <PageHeader title="Change Password" onBack={onBack} />

      <ScrollView className="flex-1 px-6 pt-8" keyboardShouldPersistTaps="handled">
        {/* Info Banner */}
        <View
          className="bg-[#FCE6F1] rounded-xl p-4 mb-6"
          style={{
            shadowColor: '#E60076',
            shadowOpacity: 0.12,
            shadowRadius: 10,
            shadowOffset: {width: 0, height: 4},
            elevation: 3,
          }}>
          <Text className="text-sm text-[#E60076] font-medium">
            Choose a strong password with at least 8 characters, including uppercase, lowercase, numbers, and symbols.
          </Text>
        </View>

        <PasswordField label="Current Password" placeholder="Enter current password" />
        <PasswordField label="New Password" placeholder="Enter new password" />
        <PasswordField label="Confirm New Password" placeholder="Re-enter new password" />

        {/* Update Button */}
        <TouchableOpacity className="items-center justify-center mt-4 mb-8 py-4 rounded-xl bg-[#E60076]">
          <Text className="text-white font-bold text-base">Update Password</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ChangePassword;
