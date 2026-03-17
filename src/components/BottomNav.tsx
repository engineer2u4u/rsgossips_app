import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Home, Search, Briefcase, User } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const BottomNav = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const navItems = [
    { label: 'Home', icon: Home, screen: 'Home' },
    { label: 'Discover', icon: Search, screen: 'Discover' },
    { label: 'Campaigns', icon: Briefcase, screen: 'Campaigns' },
    { label: 'Profile', icon: User, screen: 'Profile' },
  ];

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-md">
      <View className="flex-row justify-around items-center h-16">
        {navItems.map(item => {
          const isActive = route.name === item.screen;
          const Icon = item.icon;

          return (
            <Pressable
              key={item.label}
              onPress={() => navigation.navigate(item.screen)}
              className="flex-1 items-center justify-center relative"
            >
              {/* Active indicator */}
              {isActive && (
                <View className="absolute top-0 w-12 h-[3px] rounded-b-full bg-pink-500" />
              )}

              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                color={isActive ? '#F6339A' : '#64748B'}
              />

              <Text
                className={`text-[10px] mt-1 font-semibold ${
                  isActive ? 'text-pink-500' : 'text-gray-400'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default BottomNav;
