import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { Bell, MessageCircle, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { HOME_COLORS } from '../theme/brandHome';

// Top bar for the redesigned brand Home feed (RGossips Explore design): brand
// identity on the left, notification + support actions on the right, and a
// search pill that opens the creator directory. Replaces the old navy hero —
// the AI-matching hero now lives in BrandMatchPrompt.
const BrandHero: React.FC<{ onSupport?: () => void }> = ({ onSupport }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { profile } = useAuth();

  const displayName =
    profile?.gstin_trade_name ||
    profile?.brand_name ||
    profile?.contact_name ||
    t('ScreensBrandProfile.brand');
  const initials = displayName.charAt(0).toUpperCase();
  const logoUrl = profile?.logo_url;

  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4 }}>
      {/* Top row: identity + actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}
          onPress={() => navigation.navigate('BrandProfile' as never)}>
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: '#EEF1F8' }}
            />
          ) : (
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                backgroundColor: '#5B3DF5',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{initials}</Text>
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 10.5, color: HOME_COLORS.faint, fontWeight: '600' }}>
              {t('BrandHero.welcomeBack')}
            </Text>
            <Text
              style={{ fontSize: 15, fontWeight: '700', color: HOME_COLORS.ink, letterSpacing: -0.3 }}
              numberOfLines={1}>
              {displayName}
            </Text>
          </View>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Pressable
            onPress={() => navigation.navigate('BrandNotifications' as never)}
            style={iconBtn}>
            <Bell size={21} color="#3E4A6B" />
            <View
              style={{
                position: 'absolute',
                top: 11,
                right: 11,
                width: 7,
                height: 7,
                borderRadius: 99,
                backgroundColor: '#9B5FC4',
                borderWidth: 1.5,
                borderColor: '#fff',
              }}
            />
          </Pressable>
          <Pressable onPress={() => onSupport?.()} style={iconBtn}>
            <MessageCircle size={21} color="#3E4A6B" />
          </Pressable>
        </View>
      </View>

      {/* Search pill → creator directory */}
      <Pressable
        onPress={() => navigation.navigate('BrandSearch' as never)}
        style={{
          height: 40,
          marginTop: 11,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
          paddingHorizontal: 13,
          borderRadius: 99,
          backgroundColor: '#EEF1F8',
          borderWidth: 1,
          borderColor: '#E4E9F4',
        }}>
        <Search size={15} color={HOME_COLORS.faint} />
        <Text style={{ flex: 1, fontSize: 12.5, color: HOME_COLORS.faint }} numberOfLines={1}>
          {t('BrandHero.searchPlaceholder')}
        </Text>
      </Pressable>
    </View>
  );
};

const iconBtn = {
  position: 'relative' as const,
  width: 44,
  height: 44,
  borderRadius: 14,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

export default BrandHero;
