import React from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  FileQuestion,
  BookOpen,
  Mail,
  Star,
  Bug,
} from 'lucide-react-native';

interface HelpSupportProps {
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

const MenuItem = ({
  icon,
  label,
  description,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center px-5 py-4 bg-white border-b border-slate-50">
    <View className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center mr-4">
      {icon}
    </View>
    <View className="flex-1">
      <Text className="text-base font-medium text-slate-700">{label}</Text>
      <Text className="text-xs text-slate-400 mt-1">{description}</Text>
    </View>
    <ChevronRight size={18} color="#94a3b8" />
  </TouchableOpacity>
);

const HelpSupport: React.FC<HelpSupportProps> = ({onBack}) => {
  return (
    <View className="flex-1 bg-slate-50">
      <PageHeader title="Help & Support" onBack={onBack} />

      <ScrollView className="flex-1">
        {/* Quick Help */}
        <Text className="px-6 pt-6 pb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Quick Help
        </Text>
        <View className="mx-4 rounded-2xl overflow-hidden bg-white shadow-sm">
          <MenuItem
            icon={<FileQuestion size={18} color="#E60076" />}
            label="FAQs"
            description="Find answers to common questions"
          />
          <MenuItem
            icon={<BookOpen size={18} color="#E60076" />}
            label="Getting Started Guide"
            description="Learn how to use the platform"
          />
        </View>

        {/* Contact Us */}
        <Text className="px-6 pt-6 pb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Contact Us
        </Text>
        <View className="mx-4 rounded-2xl overflow-hidden bg-white shadow-sm">
          <MenuItem
            icon={<MessageCircle size={18} color="#E60076" />}
            label="Live Chat"
            description="Chat with our support team"
          />
          <MenuItem
            icon={<Mail size={18} color="#E60076" />}
            label="Email Support"
            description="support@rgossips.com"
          />
        </View>

        {/* Feedback */}
        <Text className="px-6 pt-6 pb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Feedback
        </Text>
        <View className="mx-4 rounded-2xl overflow-hidden bg-white shadow-sm mb-6">
          <MenuItem
            icon={<Star size={18} color="#E60076" />}
            label="Rate the App"
            description="Let us know how we're doing"
          />
          <MenuItem
            icon={<Bug size={18} color="#E60076" />}
            label="Report a Bug"
            description="Help us improve by reporting issues"
          />
        </View>

        {/* App Version */}
        <View className="items-center mb-8">
          <Text className="text-xs text-slate-400">RGossips v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export {HelpSupport};
export default HelpSupport;
