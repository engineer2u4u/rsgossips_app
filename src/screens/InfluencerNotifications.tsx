import React, {useState} from 'react';
import {View, Text, ScrollView, Pressable} from 'react-native';
import {
  ChevronLeft,
  FileText,
  CheckCircle,
  Users,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import Animated, {FadeInDown} from 'react-native-reanimated';
import InfluencerLayout from '../layouts/InfluencerLayout';

const NOTIFICATIONS = [
  {
    id: 1,
    title: 'New Campaign Invitation!',
    description:
      'StyleBrand Co. has invited you to their Summer Collection campaign. Tap to view details and apply.',
    time: '09:10',
    icon: FileText,
    iconColor: '#E60076',
    unread: true,
  },
  {
    id: 2,
    title: 'Application Approved!',
    description:
      'Your application for the Luxury Perfume Launch campaign has been approved. View the brief and deliverables.',
    time: '09:10',
    icon: CheckCircle,
    iconColor: '#E60076',
    unread: true,
  },
  {
    id: 3,
    title: 'New Brand Collaboration Request',
    description:
      'GreenEarth Co. wants to collaborate with you. Tap to view their campaign and requirements.',
    time: '08:45',
    icon: Users,
    iconColor: '#E60076',
    unread: false,
  },
  {
    id: 4,
    title: 'Payment Received!',
    description:
      'You received ₹25,000 for the Wellness Spa Retreat campaign. Check your wallet for details.',
    time: 'Yesterday',
    icon: CheckCircle,
    iconColor: '#E60076',
    unread: false,
  },
];

export default function InfluencerNotifications() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications(prev =>
      prev.map(n => ({...n, unread: false})),
    );
  };

  return (
    <InfluencerLayout>
      <ScrollView className="flex-1 bg-[#F8F9FD]">
        {/* Header */}
        <View className="bg-white px-5 py-5 flex-row items-center justify-between shadow-sm">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center">
            <ChevronLeft size={24} color="#E60076" />
          </Pressable>
          <Text className="text-xl font-bold text-slate-800">
            Notifications
          </Text>
          <View className="w-10" />
        </View>

        {/* Notification List */}
        <View className="px-4 mt-4" style={{gap: 8}}>
          {notifications.map((item, index) => {
            const Icon = item.icon;
            return (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(index * 100)}>
                <Pressable
                  className={`relative flex-row items-start p-5 rounded-2xl border ${
                    item.unread
                      ? 'bg-white border-slate-100 shadow-md'
                      : 'bg-white/60 border-transparent opacity-80'
                  }`}
                  style={{gap: 16}}>
                  <View className="w-12 h-12 rounded-xl bg-[#FCE6F1] items-center justify-center">
                    <Icon size={24} color={item.iconColor} />
                  </View>

                  <View className="flex-1" style={{gap: 4}}>
                    <View className="flex-row justify-between items-start">
                      <Text className="font-bold text-slate-800 text-sm flex-1 leading-tight">
                        {item.title}
                      </Text>
                      <Text className="text-[10px] font-medium text-slate-400 ml-2">
                        {item.time}
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-500 leading-relaxed">
                      {item.description}
                    </Text>
                  </View>

                  {item.unread && (
                    <View className="absolute top-5 right-3 w-2 h-2 bg-[#E60076] rounded-full" />
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Mark all as read */}
        <View className="mt-8 items-center mb-8">
          <Pressable onPress={markAllRead}>
            <Text className="text-[#E60076] text-sm font-bold uppercase tracking-widest">
              Mark all as read
            </Text>
          </Pressable>
        </View>

        <View className="h-20" />
      </ScrollView>
    </InfluencerLayout>
  );
}
