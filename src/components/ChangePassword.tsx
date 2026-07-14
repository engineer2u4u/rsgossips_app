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
import {useTranslation} from 'react-i18next';

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
  const {t} = useTranslation();
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50">
      <PageHeader title={t('ChangePassword.title')} onBack={onBack} />

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
            {t('ChangePassword.infoBanner')}
          </Text>
        </View>

        <PasswordField
          label={t('ChangePassword.currentPasswordLabel')}
          placeholder={t('ChangePassword.currentPasswordPlaceholder')}
        />
        <PasswordField
          label={t('ChangePassword.newPasswordLabel')}
          placeholder={t('ChangePassword.newPasswordPlaceholder')}
        />
        <PasswordField
          label={t('ChangePassword.confirmPasswordLabel')}
          placeholder={t('ChangePassword.confirmPasswordPlaceholder')}
        />

        {/* Update Button */}
        <TouchableOpacity className="items-center justify-center mt-4 mb-8 py-4 rounded-xl bg-[#E60076]">
          <Text className="text-white font-bold text-base">
            {t('ChangePassword.updateButton')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ChangePassword;
