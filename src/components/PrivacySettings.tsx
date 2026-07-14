// Privacy & Security — toggles persisted to user_preferences.privacy_prefs
// plus a Trusted Devices + Deactivate Account link and a Security Tips card.
//
// Mirrors D:/Development/React/RS_Gossips src/components/PrivacySettings.jsx
// element-for-element. Keys exactly match the web side so the same row in
// user_preferences works across both surfaces:
//   publicProfile · showEmail

import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Shield,
  ShieldCheck,
  Smartphone,
  UserMinus,
} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {supabase} from '../utils/supabase';
import {useAuth} from '../context/AuthContext';
import {useGlobalLoading} from '../context/LoadingContext';

interface PrivacySecurityPageProps {
  onBack: () => void;
  onTrustedDevices: () => void;
  onDeactiveAccount: () => void;
  /** Kept optional for back-compat with the existing nav graph; the link
   *  itself isn't rendered because web's PrivacySettings has no password
   *  change row. */
  onPasswordChange?: () => void;
}

type Prefs = {
  publicProfile: boolean;
  showEmail: boolean;
};

const DEFAULT_PREFS: Prefs = {
  publicProfile: true,
  showEmail: false,
};

const PageHeader = ({title, onBack}: {title: string; onBack: () => void}) => (
  <View className="flex-row items-center gap-4 px-6 py-4 bg-white border-b border-slate-100">
    <TouchableOpacity onPress={onBack} className="p-2 rounded-full bg-[#FCE6F1]">
      <ChevronLeft size={20} color="#E60076" />
    </TouchableOpacity>
    <Text className="text-lg font-bold text-slate-800">{title}</Text>
  </View>
);

function SectionHeader({
  title,
  iconBg,
  icon,
}: {
  title: string;
  iconBg: string;
  icon: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center px-1" style={{gap: 12}}>
      <View
        style={{
          padding: 8,
          backgroundColor: iconBg,
          borderRadius: 12,
        }}>
        {icon}
      </View>
      <Text
        className="font-black uppercase text-gray-400"
        style={{fontSize: 10, letterSpacing: 2}}>
        {title}
      </Text>
    </View>
  );
}

function ToggleRow({
  title,
  description,
  isEnabled,
  onToggle,
}: {
  title: string;
  description: string;
  isEnabled: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      className="flex-row items-center justify-between"
      style={{gap: 12, paddingVertical: 8}}>
      <View className="flex-1" style={{gap: 2}}>
        <Text className="text-[13px] font-black text-gray-900">{title}</Text>
        <Text className="text-[10px] font-bold text-gray-400">
          {description}
        </Text>
      </View>
      <Switch
        value={isEnabled}
        onValueChange={onToggle}
        trackColor={{false: '#e5e7eb', true: '#EC4899'}}
        thumbColor="#ffffff"
        ios_backgroundColor="#e5e7eb"
      />
    </TouchableOpacity>
  );
}

function SecurityLink({
  icon,
  title,
  description,
  onPress,
  isDestructive,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  isDestructive?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center"
      style={{gap: 14, paddingVertical: 8}}>
      <View
        style={{
          padding: 10,
          borderRadius: 12,
          backgroundColor: isDestructive ? '#FEE2E2' : '#F3F4F6',
        }}>
        {icon}
      </View>
      <View className="flex-1">
        <Text
          className="text-[13px] font-black"
          style={{color: isDestructive ? '#EF4444' : '#0F172A'}}>
          {title}
        </Text>
        <Text className="text-[10px] font-bold text-gray-400">{description}</Text>
      </View>
      <ChevronRight size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

function SecurityTipsCard() {
  const {t} = useTranslation();
  const tips = [
    t('PrivacySettings.securityTips.strongPassword'),
    t('PrivacySettings.securityTips.reviewDevices'),
    t('PrivacySettings.securityTips.neverShare'),
  ];
  return (
    <View
      style={{
        backgroundColor: '#FFF9E6',
        borderColor: '#FFE7A1',
        borderWidth: 1,
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        gap: 14,
      }}>
      <View
        style={{
          padding: 10,
          backgroundColor: '#FBBF24',
          borderRadius: 12,
          alignSelf: 'flex-start',
        }}>
        <ShieldCheck size={20} color="#fff" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-black mb-2" style={{color: '#78350F'}}>
          {t('PrivacySettings.securityTips.title')}
        </Text>
        <View style={{gap: 6}}>
          {tips.map(tip => (
            <View
              key={tip}
              className="flex-row items-center"
              style={{gap: 8}}>
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#FBBF24',
                }}
              />
              <Text
                className="text-[11px] font-bold"
                style={{color: '#B45309', flex: 1}}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: {width: 0, height: 4},
  elevation: 3,
};

const PrivacySecurityPage: React.FC<PrivacySecurityPageProps> = ({
  onBack,
  onTrustedDevices,
  onDeactiveAccount,
}) => {
  const {t} = useTranslation();
  const {user} = useAuth();
  const {withLoading} = useGlobalLoading();
  const [settings, setSettings] = useState<Prefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState(0);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const {data} = await supabase
      .from('user_preferences')
      .select('privacy_prefs')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data?.privacy_prefs) {
      setSettings({...DEFAULT_PREFS, ...data.privacy_prefs});
    }
    setLoaded(true);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSetting = (key: keyof Prefs) =>
    setSettings(prev => ({...prev, [key]: !prev[key]}));

  const handleSave = async () => {
    if (!user?.id) return;
    await withLoading(
      (async () => {
        await supabase.from('user_preferences').upsert(
          {
            user_id: user.id,
            privacy_prefs: settings,
            updated_at: new Date().toISOString(),
          },
          {onConflict: 'user_id'},
        );
        setSavedAt(Date.now());
      })(),
      t('PrivacySettings.savingPreferences'),
    );
  };

  const justSaved = savedAt > 0 && Date.now() - savedAt < 3000;

  return (
    <View className="flex-1" style={{backgroundColor: '#F9FAFB'}}>
      <PageHeader title={t('PrivacySettings.pageTitle')} onBack={onBack} />

      {!loaded ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#EC4899" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            padding: 20,
            gap: 24,
            paddingBottom: Platform.OS === 'ios' ? 140 : 120,
          }}
          showsVerticalScrollIndicator={false}>
          {/* Privacy Settings */}
          <View style={{gap: 12}}>
            <SectionHeader
              title={t('PrivacySettings.privacySettingsSection')}
              iconBg="#3B82F6"
              icon={<Eye size={18} color="#fff" />}
            />
            <View
              className="bg-white border border-gray-100"
              style={[
                {borderRadius: 32, padding: 24, gap: 16},
                cardShadow,
              ]}>
              <ToggleRow
                title={t('PrivacySettings.publicProfile.title')}
                description={t('PrivacySettings.publicProfile.description')}
                isEnabled={settings.publicProfile}
                onToggle={() => toggleSetting('publicProfile')}
              />
              <ToggleRow
                title={t('PrivacySettings.showEmail.title')}
                description={t('PrivacySettings.showEmail.description')}
                isEnabled={settings.showEmail}
                onToggle={() => toggleSetting('showEmail')}
              />
            </View>
          </View>

          {/* Security Control */}
          <View style={{gap: 12}}>
            <SectionHeader
              title={t('PrivacySettings.securityControlSection')}
              iconBg="#10B981"
              icon={<Shield size={18} color="#fff" />}
            />
            <View
              className="bg-white border border-gray-100"
              style={[
                {borderRadius: 32, padding: 24, gap: 12},
                cardShadow,
              ]}>
              <SecurityLink
                icon={<Smartphone size={18} color="#6B7280" />}
                title={t('PrivacySettings.trustedDevices.title')}
                description={t('PrivacySettings.trustedDevices.description')}
                onPress={onTrustedDevices}
              />
              <SecurityLink
                icon={<UserMinus size={18} color="#EF4444" />}
                title={t('PrivacySettings.deactivateAccount.title')}
                description={t('PrivacySettings.deactivateAccount.description')}
                onPress={onDeactiveAccount}
                isDestructive
              />
            </View>
            <SecurityTipsCard />
          </View>

          {/* Save Changes */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!user?.id}
            style={{
              paddingVertical: 16,
              borderRadius: 12,
              backgroundColor: '#EC4899',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#EC4899',
              shadowOpacity: 0.35,
              shadowRadius: 18,
              shadowOffset: {width: 0, height: 8},
              elevation: 6,
            }}>
            <Text className="text-white font-black text-sm">
              {justSaved
                ? t('PrivacySettings.saved')
                : t('PrivacySettings.saveChanges')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

export {PrivacySecurityPage};
export default PrivacySecurityPage;
