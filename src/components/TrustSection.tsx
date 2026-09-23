import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useBrandTrustScore } from '../hooks/useBrandTrustScore';
import { trustBandColors, trustBandKey } from '../lib/brandProfile';

// `showSearch` controls the decorative "Looking for…" bar above the trust
// card. It's a non-functional placeholder that reads as a search box, so on
// the Search screen — which already has a real username search in its header —
// it's hidden to avoid showing two search bars. It stays on the brand home.
//
// The score itself is real: it comes from the server (one implementation,
// _shared/brand-trust.ts) on the 300–900 scale, with the non-punitive band
// ladder. It used to be a hardcoded "840 / HIGH / +12%".
export const TrustSection: React.FC<{showSearch?: boolean}> = ({
  showSearch = true,
}) => {
  const { t } = useTranslation();
  const { trust } = useBrandTrustScore();
  const bandColors = trustBandColors(trust.band);
  const bandLabel = t(`TrustBands.${trustBandKey(trust.band)}`);

  return (
    <View className="px-4 w-full items-center gap-4">
      {/* Floating Search */}
      {showSearch && (
        <View className="bg-white w-full rounded-3xl p-4 flex-row items-center justify-between shadow border border-slate-100">
          <Text className="text-slate-400 text-sm font-medium pl-2 flex-1">
            {t('TrustSection.searchPlaceholder')}
          </Text>

          <Pressable className="bg-[#5B3DF5] p-2.5 rounded-2xl">
            <Plus size={20} color="white" />
          </Pressable>
        </View>
      )}

      {/* Trust Score Card */}
      <View className="bg-[#1F1F1F] w-full rounded-3xl p-6 flex-row justify-between items-center">
        <View className="flex-1 pr-3">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            {t('TrustSection.yourTrustScore')}
          </Text>

          <View className="flex-row items-end gap-2">
            <Text className="text-white text-4xl font-black">{trust.score}</Text>

            <Text className="text-slate-500 text-xs font-bold">
              {t('TrustSection.scoreOutOf', {max: trust.scaleMax})}
            </Text>
          </View>

          {trust.coldStart && (
            <Text className="text-amber-400 text-[9px] font-bold mt-1 uppercase tracking-wider">
              {t('TrustSection.coldStartCap', {
                cap: trust.coldStartCap,
                campaigns: trust.coldStartThreshold,
              })}
            </Text>
          )}
        </View>

        {/* Band chip — the progress ring was dropped per design feedback;
            the numeric score already communicates magnitude. */}
        <View
          className="px-3 py-1.5 rounded-full border"
          style={{borderColor: bandColors.accent}}>
          <Text
            className="text-[10px] font-black italic"
            style={{color: bandColors.accent}}>
            {bandLabel}
          </Text>
        </View>
      </View>
    </View>
  );
};
