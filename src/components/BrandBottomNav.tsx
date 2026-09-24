import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Home, Search, Briefcase, User } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const BottomNav = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const navItems = [
    { key: 'home', icon: Home, screen: 'BrandHome' },
    { key: 'search', icon: Search, screen: 'BrandSearch' },
    { key: 'campaigns', icon: Briefcase, screen: 'BrandCampaigns' },
    // 'messages' → BrandChats removed: that screen is a static mockup with a
    // hardcoded contact list and no backend. Shipping it fails Play's minimum
    // functionality policy and contradicts the "no messaging" answer in both
    // stores' content questionnaires. Restore alongside a real chat backend.
    { key: 'profile', icon: User, screen: 'BrandProfile' },
  ];

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-md"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="flex-row justify-around items-center h-16">
        {navItems.map(item => {
          const isActive = route.name === item.screen;
          const Icon = item.icon;

          return (
            <Pressable
              key={item.key}
              onPress={() => navigation.navigate(item.screen as never)}
              className="flex-1 items-center justify-center"
            >
              {/* Active state: soft rounded highlight behind the icon rather
                  than a thin bar at the top edge (which collided with the
                  icon and read as a stray line across it). */}
              <View
                className="items-center justify-center rounded-2xl"
                style={{
                  width: 52,
                  height: 32,
                  backgroundColor: isActive ? 'rgba(76,117,190,0.12)' : 'transparent',
                }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  color={isActive ? '#4C75BE' : '#64748B'}
                />
              </View>

              <Text
                className={`text-[10px] mt-1 font-semibold ${
                  isActive ? 'text-[#4C75BE]' : 'text-gray-400'
                }`}
              >
                {t(`BrandBottomNav.nav.${item.key}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default BottomNav;
