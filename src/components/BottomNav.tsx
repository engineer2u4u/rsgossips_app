import React from 'react';
import {View, Text, Pressable} from 'react-native';
import {Home, Search, Briefcase, User, MessageSquare} from 'lucide-react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const navItems = [
  {label: 'Home', icon: Home, screen: 'InfluencerHome'},
  {label: 'Brands', icon: Search, screen: 'InfluencerSearch'},
  {label: 'Campaigns', icon: Briefcase, screen: 'InfluencerCampaigns'},
  {label: 'Chats', icon: MessageSquare, screen: 'InfluencerChats'},
  {label: 'Profile', icon: User, screen: 'InfluencerProfile'},
];

const BottomNav = () => {
  const navigation = useNavigation();
  const route = useRoute();

  return (
    <View className="bg-white border-t border-gray-100 shadow-md">
      <View className="flex-row justify-around items-center h-16">
        {navItems.map(item => {
          const isActive = route.name === item.screen;
          const Icon = item.icon;

          return (
            <Pressable
              key={item.label}
              onPress={() => navigation.navigate(item.screen as never)}
              className="flex-1 items-center justify-center relative">
              {isActive && (
                <LinearGradient
                  colors={['#8E2DE2', '#F6339A']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={{
                    position: 'absolute',
                    top: 0,
                    width: 48,
                    height: 3,
                    borderBottomLeftRadius: 100,
                    borderBottomRightRadius: 100,
                  }}
                />
              )}

              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                color={isActive ? '#F6339A' : '#64748B'}
                style={{marginTop: 4}}
              />

              <Text
                className={`text-[10px] mt-1 font-semibold ${
                  isActive ? 'text-pink-500' : 'text-slate-400'
                }`}>
                {item.label}
              </Text>

              {/* Chat badge */}
              {item.label === 'Chats' && !isActive && (
                <View className="absolute top-1 right-3 w-2 h-2 bg-pink-500 rounded-full" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default BottomNav;
