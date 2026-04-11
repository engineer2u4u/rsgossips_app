import React from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import {ChevronLeft, ChevronRight, Smartphone, Lock, UserX, Eye, Shield} from 'lucide-react-native';

interface PrivacySecurityPageProps {
  onBack: () => void;
  onTrustedDevices: () => void;
  onDeactiveAccount: () => void;
  onPasswordChange: () => void;
}

const PageHeader = ({title, onBack}: {title: string; onBack: () => void}) => (
  <View className="flex-row items-center gap-4 px-6 py-4 bg-white border-b border-slate-100">
    <TouchableOpacity onPress={onBack} className="p-2 rounded-full bg-[#FCE6F1]">
      <ChevronLeft size={20} color="#E60076" />
    </TouchableOpacity>
    <Text className="text-lg font-bold text-slate-800">{title}</Text>
  </View>
);

const MenuItem = ({
  icon,
  label,
  description,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onPress: () => void;
  danger?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center px-5 py-4 bg-white border-b border-slate-50">
    <View
      className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
        danger ? 'bg-red-50' : 'bg-[#FCE6F1]'
      }`}>
      {icon}
    </View>
    <View className="flex-1">
      <Text
        className={`text-base font-medium ${
          danger ? 'text-red-500' : 'text-slate-700'
        }`}>
        {label}
      </Text>
      <Text className="text-xs text-slate-400 mt-1">{description}</Text>
    </View>
    <ChevronRight size={18} color="#94a3b8" />
  </TouchableOpacity>
);

const PrivacySecurityPage: React.FC<PrivacySecurityPageProps> = ({
  onBack,
  onTrustedDevices,
  onDeactiveAccount,
  onPasswordChange,
}) => {
  return (
    <View className="flex-1 bg-slate-50">
      <PageHeader title="Privacy & Security" onBack={onBack} />

      <ScrollView className="flex-1">
        {/* Security Section */}
        <Text className="px-6 pt-6 pb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Security
        </Text>
        <View className="mx-4 rounded-2xl overflow-hidden bg-white shadow-sm">
          <MenuItem
            icon={<Lock size={18} color="#E60076" />}
            label="Change Password"
            description="Update your account password"
            onPress={onPasswordChange}
          />
          <MenuItem
            icon={<Smartphone size={18} color="#E60076" />}
            label="Trusted Devices"
            description="Manage devices with access to your account"
            onPress={onTrustedDevices}
          />
        </View>

        {/* Privacy Section */}
        <Text className="px-6 pt-6 pb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Privacy
        </Text>
        <View className="mx-4 rounded-2xl overflow-hidden bg-white shadow-sm">
          <MenuItem
            icon={<Eye size={18} color="#E60076" />}
            label="Profile Visibility"
            description="Control who can see your profile"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Shield size={18} color="#E60076" />}
            label="Data & Permissions"
            description="Manage your data sharing preferences"
            onPress={() => {}}
          />
        </View>

        {/* Danger Zone */}
        <Text className="px-6 pt-6 pb-3 text-sm font-semibold text-red-400 uppercase tracking-wider">
          Danger Zone
        </Text>
        <View className="mx-4 rounded-2xl overflow-hidden bg-white shadow-sm mb-8">
          <MenuItem
            icon={<UserX size={18} color="#ef4444" />}
            label="Deactivate Account"
            description="Temporarily disable your account"
            onPress={onDeactiveAccount}
            danger
          />
        </View>
      </ScrollView>
    </View>
  );
};

export {PrivacySecurityPage};
export default PrivacySecurityPage;
