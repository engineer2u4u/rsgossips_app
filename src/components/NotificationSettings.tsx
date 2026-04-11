import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, Switch} from 'react-native';
import {ChevronLeft, Bell, MessageSquare, Heart, Users, Megaphone} from 'lucide-react-native';

interface NotificationSettingsProps {
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

const ToggleRow = ({
  icon,
  label,
  description,
  value,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}) => (
  <View className="flex-row items-center px-5 py-4 bg-white border-b border-slate-50">
    <View className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center mr-4">
      {icon}
    </View>
    <View className="flex-1 mr-3">
      <Text className="text-base font-medium text-slate-700">{label}</Text>
      <Text className="text-xs text-slate-400 mt-1">{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{false: '#e2e8f0', true: '#FCE6F1'}}
      thumbColor={value ? '#E60076' : '#94a3b8'}
    />
  </View>
);

const NotificationSettings: React.FC<NotificationSettingsProps> = ({onBack}) => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [messages, setMessages] = useState(true);
  const [likes, setLikes] = useState(true);
  const [followers, setFollowers] = useState(false);
  const [campaigns, setCampaigns] = useState(true);

  return (
    <View className="flex-1 bg-slate-50">
      <PageHeader title="Notifications" onBack={onBack} />

      <ScrollView className="flex-1">
        <Text className="px-6 pt-6 pb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Push Notifications
        </Text>

        <View className="mx-4 rounded-2xl overflow-hidden bg-white shadow-sm">
          <ToggleRow
            icon={<Bell size={18} color="#E60076" />}
            label="Push Notifications"
            description="Enable or disable all push notifications"
            value={pushEnabled}
            onToggle={setPushEnabled}
          />
          <ToggleRow
            icon={<MessageSquare size={18} color="#E60076" />}
            label="Messages"
            description="New message notifications"
            value={messages}
            onToggle={setMessages}
          />
          <ToggleRow
            icon={<Heart size={18} color="#E60076" />}
            label="Likes & Comments"
            description="When someone likes or comments on your post"
            value={likes}
            onToggle={setLikes}
          />
          <ToggleRow
            icon={<Users size={18} color="#E60076" />}
            label="New Followers"
            description="When someone follows you"
            value={followers}
            onToggle={setFollowers}
          />
          <ToggleRow
            icon={<Megaphone size={18} color="#E60076" />}
            label="Campaign Updates"
            description="Updates about your active campaigns"
            value={campaigns}
            onToggle={setCampaigns}
          />
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
};

export default NotificationSettings;
