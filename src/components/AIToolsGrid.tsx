import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import {
  Type,
  Hash,
  FileText,
  BarChart3,
  Zap,
  ClipboardCheck,
} from 'lucide-react-native';
import { CARD_SHADOW } from '../theme/brand';

const tools = [
  {
    key: 'captions',
    icon: Type,
    color: '#f97316',
    active: true,
  },
  {
    key: 'hashtags',
    icon: Hash,
    color: '#3b82f6',
  },
  {
    key: 'scripts',
    icon: FileText,
    color: '#f59e0b',
  },
  {
    key: 'rateCard',
    icon: BarChart3,
    color: '#10b981',
  },
  {
    key: 'hookIdeas',
    icon: Zap,
    color: '#f43f5e',
  },
  {
    key: 'briefHelper',
    icon: ClipboardCheck,
    color: '#6366f1',
  },
];

export default function AiToolsGrid() {
  const { t } = useTranslation();
  return (
    <View className="w-full">
      <View
        style={[
          {
            backgroundColor: '#ffffff',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: 'rgba(25,22,43,0.06)',
            padding: 20,
            position: 'relative',
            overflow: 'hidden',
          },
          CARD_SHADOW,
        ]}>
        {/* HEADER */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-bold text-slate-900">
            {t('AIToolsGrid.header')}
          </Text>

          <Text className="text-xs text-slate-400">
            <Text className="text-slate-600">{t('AIToolsGrid.usedCount')}</Text>
            {t('AIToolsGrid.allFree')}
          </Text>
        </View>

        {/* GRID */}
        <View className="flex-row flex-wrap justify-between">
          {tools.map((tool, index) => {
            const Icon = tool.icon;

            return (
              <Animated.View
                key={index}
                entering={FadeInUp.delay(index * 80)}
                className="w-[48%] mb-4"
              >
                <Pressable
                  className={`p-5 rounded-3xl items-center ${
                    tool.active
                      ? 'bg-orange-50 border border-orange-100'
                      : 'bg-slate-50'
                  }`}
                >
                  <View className="p-3 rounded-2xl bg-white shadow-sm mb-3">
                    <Icon size={20} color={tool.color} />
                  </View>

                  <Text className="font-semibold text-slate-800 text-sm">
                    {t(`AIToolsGrid.tools.${tool.key}.title`)}
                  </Text>

                  <Text
                    className={`text-[10px] font-bold uppercase mt-1 ${
                      tool.active ? 'text-orange-600' : 'text-slate-400'
                    }`}
                  >
                    {t(`AIToolsGrid.tools.${tool.key}.status`)}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Coming Soon overlay — blocks taps and signals these tools aren't
            live yet. Web shows this on hover; on mobile it's always visible. */}
        <View
          pointerEvents="auto"
          className="absolute inset-0 items-center justify-center"
          style={{backgroundColor: 'rgba(255,255,255,0.72)'}}>
          <View
            className="px-6 py-3 rounded-2xl"
            style={{
              backgroundColor: '#0f172a',
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowRadius: 12,
              shadowOffset: {width: 0, height: 6},
              elevation: 6,
            }}>
            <Text className="text-white text-sm font-black uppercase tracking-widest">
              {t('AIToolsGrid.comingSoon')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
