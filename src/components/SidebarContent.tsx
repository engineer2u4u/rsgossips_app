import React, {useState} from 'react';
import {View, Text, Pressable, Image} from 'react-native';
import LogoutConfirmDialog from './LogoutConfirmDialog';
import {
  Home,
  Search,
  Briefcase,
  User,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  X,
} from 'lucide-react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../context/AuthContext';
import {useProfilePhoto} from '../utils/photoUrl';

const navLinks = [
  {key: 'home', label: 'Home', icon: Home, screen: 'InfluencerHome'},
  {key: 'brands', label: 'Brands', icon: Search, screen: 'InfluencerSearch'},
  {key: 'campaigns', label: 'Campaigns', icon: Briefcase, screen: 'InfluencerCampaigns'},
  // 'chats' → InfluencerChats removed: that screen is a static mockup with no
  // backend, and it carried a hardcoded `badge: 3` advertising three unread
  // messages that never existed. Shipping it fails Play's minimum
  // functionality policy and contradicts the "no messaging" answer in both
  // stores' content questionnaires. Restore alongside a real chat backend.
  {key: 'notifications', label: 'Notifications', icon: Bell, screen: 'InfluencerNotifications', dot: true},
  {key: 'profile', label: 'Profile', icon: User, screen: 'InfluencerProfile'},
];

export default function SidebarContent({closeSidebar}: {closeSidebar: () => void}) {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const {profile, signOut} = useAuth();
  const profilePhoto = useProfilePhoto();
  const [showLogout, setShowLogout] = useState(false);

  const navigateTo = (screen: string) => {
    closeSidebar();
    navigation.navigate(screen as never);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="p-5 flex-row items-center justify-between border-b border-slate-100">
        <View className="flex-row items-center" style={{gap: 12}}>
          {profilePhoto ? (
            <Image
              key={profilePhoto}
              source={{uri: profilePhoto}}
              className="w-11 h-11 rounded-full"
              style={{borderWidth: 2, borderColor: 'white'}}
            />
          ) : (
            <View className="w-11 h-11 rounded-full bg-purple-100 items-center justify-center">
              <Text className="text-purple-600 font-bold">
                {(profile?.full_name || 'U').charAt(0)}
              </Text>
            </View>
          )}
          <View>
            <Text className="text-sm font-bold text-slate-800">
              {profile?.full_name || t('SidebarContent.userFallback')}
            </Text>
            <Text className="text-[11px] text-emerald-600 font-semibold">
              {profile?.subscription_plan === 'free'
                ? t('SidebarContent.freeTrial')
                : t('SidebarContent.proMember')}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={closeSidebar}
          className="p-1.5 rounded-lg">
          <X size={18} color="#94A3B8" />
        </Pressable>
      </View>

      {/* Nav Links */}
      <View className="flex-1 py-3 px-3">
        {navLinks.map(item => {
          const Icon = item.icon;
          const isActive = route.name === item.screen;

          return (
            <Pressable
              key={item.label}
              onPress={() => navigateTo(item.screen)}
              className={`flex-row items-center px-4 py-3 rounded-xl mb-0.5 ${
                isActive ? 'bg-pink-50' : ''
              }`}
              style={{gap: 12}}>
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                color={isActive ? '#E60076' : '#475569'}
              />
              <Text
                className={`text-sm flex-1 ${
                  isActive ? 'font-bold text-pink-600' : 'font-medium text-slate-600'
                }`}>
                {t(`SidebarContent.nav.${item.key}`)}
              </Text>
              {/* The count badge went with the Chats entry — it was the only
                  item that carried one, and the value was hardcoded. Re-add it
                  with a real unread count if chat ever ships. */}
              {item.dot && (
                <View className="w-2 h-2 bg-pink-500 rounded-full" />
              )}
            </Pressable>
          );
        })}

        <View className="h-px bg-slate-100 my-3 mx-4" />

        <Pressable
          onPress={() => navigateTo('InfluencerProfile')}
          className="flex-row items-center px-4 py-3 rounded-xl"
          style={{gap: 12}}>
          <Settings size={20} color="#475569" />
          <Text className="text-sm font-medium text-slate-600">{t('SidebarContent.settings')}</Text>
        </Pressable>

        <Pressable
          onPress={() => navigateTo('InfluencerProfile')}
          className="flex-row items-center px-4 py-3 rounded-xl"
          style={{gap: 12}}>
          <HelpCircle size={20} color="#475569" />
          <Text className="text-sm font-medium text-slate-600">
            {t('SidebarContent.helpSupport')}
          </Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View className="p-4 border-t border-slate-100">
        <Pressable
          onPress={() => setShowLogout(true)}
          className="flex-row items-center px-4 py-3 rounded-xl"
          style={{gap: 12}}>
          <LogOut size={20} color="#EF4444" />
          <Text className="text-sm font-semibold text-red-500">{t('SidebarContent.logOut')}</Text>
        </Pressable>
      </View>

      <LogoutConfirmDialog
        visible={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={async () => {
          await signOut();
          setShowLogout(false);
          closeSidebar();
          navigation.navigate('Login' as never);
        }}
      />
    </View>
  );
}
