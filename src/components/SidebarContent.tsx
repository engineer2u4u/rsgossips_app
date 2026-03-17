import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Home, Search, Briefcase, User, LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const navItems = [
  { label: 'Home', icon: Home, screen: 'InfluencerHome' },
  { label: 'Discover', icon: Search, screen: 'Discover' },
  { label: 'Campaigns', icon: Briefcase, screen: 'Campaigns' },
  { label: 'Profile', icon: User, screen: 'Profile' },
];

export default function SidebarContent({ closeSidebar }) {
  const navigation = useNavigation();

  return (
    <View className="flex-1 px-6 pt-10">
      {navItems.map(item => {
        const Icon = item.icon;

        return (
          <Pressable
            key={item.label}
            onPress={() => {
              navigation.navigate(item.screen);
              closeSidebar();
            }}
            className="flex-row items-center py-4"
          >
            <Icon size={22} color="#334155" />
            <Text className="ml-4 text-base font-semibold text-slate-700">
              {item.label}
            </Text>
          </Pressable>
        );
      })}

      <View className="h-px bg-slate-200 my-6" />

      <Pressable
        onPress={() => navigation.navigate('Login')}
        className="flex-row items-center py-4"
      >
        <LogOut size={22} color="#ef4444" />
        <Text className="ml-4 text-base font-semibold text-red-500">
          Logout
        </Text>
      </Pressable>
    </View>
  );
}
