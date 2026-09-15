import React, {useState} from 'react';
import {Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {
  BadgeCheck,
  Crown,
  Infinity as InfinityIcon,
  LayoutTemplate,
  Sparkles,
  TrendingUp,
  Wand2,
  X,
  Zap,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../context/AuthContext';
import {getEffectivePlan, PLAN_IDS} from '../lib/plans';
import {isInstagramTokenExpired} from '../lib/instagramToken';
import {invokeFn} from '../lib/api';
import {navigationRef} from '../lib/navigation';

// One-time "Welcome to Elite" popup. Mirrors web EliteWelcomeModal: shows
// while the effective plan is elite and elite_welcome_seen_at is null (a DB
// trigger clears it whenever a plan becomes elite — migration 072). Lists
// only perks that are actually delivered. Mounted once at the app root, and
// waits while the Instagram reconnect popup is up.
const PERKS = [
  {key: 'topSpot', Icon: TrendingUp},
  {key: 'spotlight', Icon: Sparkles},
  {key: 'badge', Icon: BadgeCheck},
  {key: 'applications', Icon: InfinityIcon},
  {key: 'ai', Icon: Wand2},
  {key: 'mediaKit', Icon: LayoutTemplate},
  {key: 'payouts', Icon: Zap},
] as const;

const GRADIENT = ['#F59E0B', '#E1306C', '#833AB4'];

export default function EliteWelcomeModal() {
  const {t} = useTranslation();
  const {user, role, profile, setProfile, instagramTokenMissing} = useAuth();
  const [closed, setClosed] = useState(false);

  const isElite =
    role === 'influencer' && !!profile && getEffectivePlan(profile as any) === PLAN_IDS.ELITE;
  const reconnectPending =
    !!profile?.instagram_connected &&
    (instagramTokenMissing || isInstagramTokenExpired(profile));
  const visible = isElite && !profile?.elite_welcome_seen_at && !closed && !reconnectPending;

  const dismiss = (goToCampaigns = false) => {
    setClosed(true);
    const seenAt = new Date().toISOString();
    setProfile(p => (p ? {...p, elite_welcome_seen_at: seenAt} : p));
    if (goToCampaigns && navigationRef.isReady()) {
      (navigationRef.navigate as any)('InfluencerCampaigns');
    }
    if (user?.id) {
      invokeFn('update-profile', {
        userId: user.id,
        table: 'influencer_profiles',
        eliteWelcomeSeen: true,
      }).catch(() => {
        // Best effort — worst case it greets them once more next launch.
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => dismiss()}
      statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'flex-end',
          padding: 12,
        }}>
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 24,
            overflow: 'hidden',
            maxHeight: '92%',
            width: '100%',
            maxWidth: 520,
            alignSelf: 'center',
          }}>
          <View style={{paddingHorizontal: 22, paddingTop: 24, paddingBottom: 20}}>
            <LinearGradient
              colors={GRADIENT}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
            />
            <Pressable
              onPress={() => dismiss()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('EliteWelcomeModal.close')}
              style={{position: 'absolute', top: 12, right: 12, padding: 6}}>
              <X size={18} color="rgba(255,255,255,0.9)" />
            </Pressable>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}>
              <Crown size={28} color="#fff" />
            </View>
            <Text style={{color: '#fff', fontSize: 22, fontWeight: '900', paddingRight: 28}}>
              {t('EliteWelcomeModal.title')}
            </Text>
            <Text style={{color: 'rgba(255,255,255,0.92)', fontSize: 14, marginTop: 6}}>
              {t('EliteWelcomeModal.subtitle')}
            </Text>
          </View>

          <ScrollView
            style={{flexGrow: 0}}
            contentContainerStyle={{paddingHorizontal: 20, paddingVertical: 16, gap: 12}}>
            {PERKS.map(({key, Icon}) => (
              <View key={key} style={{flexDirection: 'row', alignItems: 'flex-start', gap: 12}}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: '#FDF2F8',
                    borderWidth: 1,
                    borderColor: '#FCE7F3',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Icon size={18} color="#C2185B" />
                </View>
                <View style={{flex: 1, minWidth: 0}}>
                  <Text style={{fontSize: 14, fontWeight: '800', color: '#0F172A'}}>
                    {t(`EliteWelcomeModal.perks.${key}.title`)}
                  </Text>
                  <Text style={{fontSize: 12.5, color: '#64748B', marginTop: 2, lineHeight: 18}}>
                    {t(`EliteWelcomeModal.perks.${key}.body`)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={{paddingHorizontal: 20, paddingBottom: 20, paddingTop: 4}}>
            <Pressable
              onPress={() => dismiss(true)}
              style={{
                height: 48,
                borderRadius: 14,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <LinearGradient
                colors={GRADIENT}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
              />
              <Text style={{color: '#fff', fontSize: 15, fontWeight: '800'}}>
                {t('EliteWelcomeModal.cta')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => dismiss()}
              style={{height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4}}>
              <Text style={{color: '#64748B', fontSize: 14, fontWeight: '700'}}>
                {t('EliteWelcomeModal.close')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
