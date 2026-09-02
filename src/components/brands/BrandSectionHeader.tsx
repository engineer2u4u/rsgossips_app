// Section header for the redesigned brand Home feed: a gradient accent bar,
// a title, an optional subtitle, and an optional right-side action link. Every
// Home section uses this so the rhythm is identical top to bottom.

import React from 'react';
import {Pressable, Text, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {ACCENT_BAR, ACCENT_BAR_LOCATIONS, ANGLE_180, HOME_COLORS} from '../../theme/brandHome';

interface Props {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  paddingX?: number;
}

export default function BrandSectionHeader({
  title,
  subtitle,
  action,
  onAction,
  paddingX = 14,
}: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: subtitle ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        paddingHorizontal: paddingX,
        gap: 10,
      }}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, minWidth: 0}}>
        <LinearGradient
          colors={ACCENT_BAR}
          locations={ACCENT_BAR_LOCATIONS}
          start={ANGLE_180.start}
          end={ANGLE_180.end}
          style={{width: 3.5, height: 17, borderRadius: 99}}
        />
        <View style={{flex: 1, minWidth: 0}}>
          <Text
            style={{fontSize: 15, fontWeight: '700', letterSpacing: -0.3, color: HOME_COLORS.ink}}
            numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{fontSize: 10.5, color: HOME_COLORS.muted, marginTop: 1}} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{fontSize: 11.5, fontWeight: '600', color: HOME_COLORS.violet}}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
