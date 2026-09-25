// Why a free creator cannot apply to THIS campaign, said before they invest
// anything in it. Mirrors the web modal (src/components/UpgradeRequiredModal.jsx).
//
// apply-campaign refuses both cases server-side, but only once the creator has
// opened the form and written a pitch — the worst moment to learn the rules.
// This fires on the Apply press instead, and names the specific reason rather
// than showing a generic paywall:
//
//   paid_campaign — the campaign carries cash (paid or hybrid). Free covers
//                   barter only, so a plan OR a barter campaign both help.
//   quota         — the three free applications are spent. Only a plan helps.

import React from 'react';
import {Modal, View, Text, Pressable, ScrollView} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Crown, Lock, X, Sparkles} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {FREE_BARTER_APPLICATIONS, PLAN_PRICING} from '../lib/plans';

// continue_paid — a free creator who already APPLIED to a paid campaign and is
// now taking it forward (accepting an offer). Telling them their free
// applications cover barter is wrong: they applied already, and the barter
// escape hatch is not an escape for them, so it is suppressed.
export type UpgradeReason = 'paid_campaign' | 'continue_paid' | 'quota' | null;

export default function UpgradeRequiredModal({
  reason,
  remaining = 0,
  campaignType,
  onClose,
  onSeePlans,
  onBrowseBarter,
}: {
  reason: UpgradeReason;
  remaining?: number;
  campaignType?: string;
  onClose: () => void;
  onSeePlans: () => void;
  onBrowseBarter?: () => void;
}) {
  const {t} = useTranslation();
  if (!reason) return null;

  const isContinue = reason === 'continue_paid';
  const isPaidCampaign = reason === 'paid_campaign' || isContinue;
  const from = PLAN_PRICING?.starter?.monthly;
  const kind =
    String(campaignType || '').toLowerCase() === 'hybrid'
      ? t('UpgradeRequired.kindHybrid')
      : t('UpgradeRequired.kindPaid');

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View
        className="flex-1 items-center justify-center px-4"
        style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
        <View
          className="w-full bg-white overflow-hidden"
          style={{maxWidth: 380, maxHeight: '92%', borderRadius: 24}}>
          <View className="px-6 pt-8 pb-6 items-center">
            <LinearGradient
              colors={['#9810fa', '#e60076']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
            />
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('UpgradeRequired.close')}
              hitSlop={10}
              style={{position: 'absolute', top: 12, right: 12}}>
              <X size={18} color="rgba(255,255,255,0.85)" />
            </Pressable>

            <View
              className="items-center justify-center"
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.2)',
              }}>
              {isPaidCampaign ? (
                <Lock size={26} color="#fff" />
              ) : (
                <Crown size={26} color="#fff" />
              )}
            </View>
            <Text className="mt-4 text-lg font-black text-white text-center">
              {isContinue
                ? t('UpgradeRequired.continueTitle')
                : isPaidCampaign
                  ? t('UpgradeRequired.paidTitle')
                  : t('UpgradeRequired.quotaTitle', {limit: FREE_BARTER_APPLICATIONS})}
            </Text>
            <Text
              className="mt-2 text-sm text-center"
              style={{color: 'rgba(255,255,255,0.9)'}}>
              {isContinue
                ? t('UpgradeRequired.continueBody')
                : isPaidCampaign
                  ? t('UpgradeRequired.paidBody', {
                      limit: FREE_BARTER_APPLICATIONS,
                      kind,
                    })
                  : t('UpgradeRequired.quotaBody', {limit: FREE_BARTER_APPLICATIONS})}
            </Text>
          </View>

          {/* flexShrink lets this body shrink with the card on short screens
              so the CTAs scroll into view instead of being clipped. */}
          <ScrollView
            style={{maxHeight: 340, flexShrink: 1}}
            contentContainerStyle={{paddingHorizontal: 24, paddingVertical: 24}}>
            <View style={{gap: 10}}>
              {[
                t('UpgradeRequired.perk1'),
                t('UpgradeRequired.perk2'),
                t('UpgradeRequired.perk3'),
              ].map(p => (
                <View key={p} className="flex-row" style={{gap: 10}}>
                  <Sparkles size={14} color="#9333EA" />
                  <Text className="flex-1 text-[13px] text-slate-600">{p}</Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={onSeePlans}
              accessibilityRole="button"
              className="mt-5 flex-row items-center justify-center overflow-hidden"
              style={{height: 50, borderRadius: 16, gap: 8}}>
              <LinearGradient
                colors={['#9810fa', '#e60076']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
              />
              <Crown size={16} color="#fff" />
              <Text className="text-white text-sm font-bold">
                {from
                  ? t('UpgradeRequired.ctaFrom', {price: from})
                  : t('UpgradeRequired.cta')}
              </Text>
            </Pressable>

            {/* Blocked by campaign TYPE but still holding free applications —
                point them at the ones they can actually spend. Out of quota,
                there is nowhere useful to go but the plans screen. */}
            {/* Not for continue_paid: a creator mid-application is not
                choosing what to apply to, so "browse barter" is no escape. */}
            {isPaidCampaign && !isContinue && remaining > 0 && onBrowseBarter ? (
              <Pressable
                onPress={onBrowseBarter}
                accessibilityRole="button"
                className="mt-2 items-center justify-center border"
                style={{height: 46, borderRadius: 16, borderColor: '#E9D5FF'}}>
                <Text className="text-[13px] font-bold text-purple-700">
                  {t('UpgradeRequired.browseBarter', {count: remaining})}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                className="mt-2 items-center justify-center"
                style={{height: 46, borderRadius: 16}}>
                <Text className="text-[13px] font-bold text-slate-500">
                  {t('UpgradeRequired.notNow')}
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
