import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Home, Briefcase, User, Compass, Sparkles } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { BRAND, BRAND_GRADIENT_WARM } from '../theme/brand';

// Alerts are reachable from the bell icon in the top bar, so they no longer
// take up a slot in the bottom nav.
const navItems = [
  { key: 'home', icon: Home, screen: 'InfluencerHome' },
  { key: 'brands', icon: Compass, screen: 'InfluencerSearch' },
  { key: 'campaigns', icon: Briefcase, screen: 'InfluencerCampaigns' },
  { key: 'services', icon: Sparkles, screen: 'InfluencerServices' },
  { key: 'profile', icon: User, screen: 'InfluencerProfile' },
];

/**
 * Floating glass tab bar. Without a native blur library installed
 * (`@react-native-community/blur` / `expo-blur`) we can't do a true
 * backdrop-filter, so this approximates the frosted look with:
 *   - High-opacity white (`rgba(255,255,255,0.82)`) so the lavender page
 *     barely shows through
 *   - A 1px sheen border at the top of the pill (white highlight)
 *   - A diffuse inky drop shadow so the pill reads as "floating"
 *   - Inset from screen edges + bottom so it actually floats
 * If you want a real backdrop blur, install `@react-native-community/blur`
 * and wrap the inner content in a `<BlurView blurType="light">`.
 */
const BottomNav = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { t } = useTranslation();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: Platform.OS === 'ios' ? 24 : 14,
        zIndex: 50,
      }}
    >
      <View
        style={{
          borderRadius: 28,
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.7)',
          // Heavy diffuse shadow so the pill clearly floats above content.
          shadowColor: '#19162b',
          shadowOpacity: 0.18,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 14 },
          elevation: 14,
          overflow: 'hidden',
        }}
      >
        {/* Top sheen highlight — a barely-visible inner gradient that mimics
            the glass top edge so the pill doesn't read as flat. */}
        <LinearGradient
          colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 18,
          }}
        />

        <View
          className="flex-row justify-around items-center"
          style={{ height: 68, paddingHorizontal: 6 }}
        >
          {navItems.map(item => {
            const isActive = route.name === item.screen;
            const Icon = item.icon;

            return (
              <Pressable
                key={item.key}
                onPress={() => navigation.navigate(item.screen)}
                className="flex-1 items-center justify-center"
                style={{ paddingVertical: 4 }}
              >
                {isActive ? (
                  <LinearGradient
                    colors={[...BRAND_GRADIENT_WARM]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      width: 44,
                      height: 32,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: [{ translateY: -2 }],
                      shadowColor: BRAND.accent,
                      shadowOpacity: 0.45,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 6 },
                      elevation: 4,
                    }}
                  >
                    <Icon size={20} strokeWidth={2.4} color="#ffffff" />
                  </LinearGradient>
                ) : (
                  <View
                    style={{
                      width: 44,
                      height: 32,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} strokeWidth={2} color="#908ca1" />
                  </View>
                )}

                <Text
                  className="text-[10.5px] mt-0.5 font-bold"
                  style={{ color: isActive ? BRAND.accent : '#908ca1' }}
                >
                  {t(`BottomNav.nav.${item.key}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default BottomNav;
