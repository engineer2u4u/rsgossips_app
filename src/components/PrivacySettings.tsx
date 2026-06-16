// Privacy & Security — toggles persisted to user_preferences.privacy_prefs +
// links to Trusted Devices / Deactivate Account / Change Password.
//
// Mirrors web app src/components/PrivacySettings.jsx (commit 8aa1896).
// Keys exactly match the web side so the same row in user_preferences works
// across both surfaces. Don't rename without updating the web too.

import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
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
  Lock,
  Mail,
  Save,
  Search,
  Shield,
  Smartphone,
  UserX,
} from 'lucide-react-native';
import {supabase} from '../utils/supabase';
import {useAuth} from '../context/AuthContext';
import {useGlobalLoading} from '../context/LoadingContext';

interface PrivacySecurityPageProps {
  onBack: () => void;
  onTrustedDevices: () => void;
  onDeactiveAccount: () => void;
  onPasswordChange: () => void;
}

type Prefs = {
  publicProfile: boolean;
  showEmail: boolean;
  searchIndexing: boolean;
  twoFactor: boolean;
};

const DEFAULT_PREFS: Prefs = {
  publicProfile: true,
  showEmail: false,
  searchIndexing: true,
  twoFactor: false,
};

const PageHeader = ({title, onBack}: {title: string; onBack: () => void}) => (
  <View className="flex-row items-center gap-4 px-6 py-4 bg-white border-b border-slate-100">
    <TouchableOpacity onPress={onBack} className="p-2 rounded-full bg-[#FCE6F1]">
      <ChevronLeft size={20} color="#E60076" />
    </TouchableOpacity>
    <Text className="text-lg font-bold text-slate-800">{title}</Text>
  </View>
);

const ToggleRow = ({
  icon,
  label,
  description,
  value,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) => (
  <View className="flex-row items-center px-5 py-4 bg-white border-b border-slate-50">
    <View className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center mr-4">
      {icon}
    </View>
    <View className="flex-1 mr-3">
      <Text className="text-base font-medium text-slate-700">{label}</Text>
      <Text className="text-xs text-slate-400 mt-1">{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{false: '#e2e8f0', true: '#FCE6F1'}}
      thumbColor={value ? '#E60076' : '#94a3b8'}
    />
  </View>
);

const LinkRow = ({
  icon,
  label,
  description,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onPress: () => void;
  danger?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center px-5 py-4 bg-white border-b border-slate-50">
    <View
      className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
        danger ? 'bg-red-50' : 'bg-[#FCE6F1]'
      }`}>
      {icon}
    </View>
    <View className="flex-1">
      <Text
        className={`text-base font-medium ${
          danger ? 'text-red-500' : 'text-slate-700'
        }`}>
        {label}
      </Text>
      <Text className="text-xs text-slate-400 mt-1">{description}</Text>
    </View>
    <ChevronRight size={18} color="#94a3b8" />
  </TouchableOpacity>
);

const PrivacySecurityPage: React.FC<PrivacySecurityPageProps> = ({
  onBack,
  onTrustedDevices,
  onDeactiveAccount,
  onPasswordChange,
}) => {
  const {user} = useAuth();
  const {withLoading} = useGlobalLoading();
  const [settings, setSettings] = useState<Prefs>(DEFAULT_PREFS);
  const [original, setOriginal] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setError(null);
    const {data, error: err} = await supabase
      .from('user_preferences')
      .select('privacy_prefs')
      .eq('user_id', user.id)
      .maybeSingle();
    if (err) {
      console.warn('user_preferences select failed:', err.message);
      setError(err.message);
    }
    const merged = {...DEFAULT_PREFS, ...(data?.privacy_prefs || {})} as Prefs;
    setSettings(merged);
    setOriginal(merged);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = JSON.stringify(settings) !== JSON.stringify(original);

  const save = async () => {
    if (!user?.id) return;
    await withLoading(
      (async () => {
        const {error: err} = await supabase.from('user_preferences').upsert(
          {
            user_id: user.id,
            privacy_prefs: settings,
            updated_at: new Date().toISOString(),
          },
          {onConflict: 'user_id'},
        );
        if (err) {
          setError(err.message);
          return;
        }
        setOriginal(settings);
      })(),
      'Saving preferences…',
    );
  };

  return (
    <View className="flex-1 bg-slate-50">
      <PageHeader title="Privacy & Security" onBack={onBack} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E60076" />
        </View>
      ) : (
        <ScrollView className="flex-1">
          {error ? (
            <View className="mx-4 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <Text className="text-xs text-red-600">{error}</Text>
            </View>
          ) : null}

          {/* Privacy toggles */}
          <Text className="px-6 pt-6 pb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Privacy
          </Text>
          <View className="mx-4 rounded-2xl overflow-hidden bg-white shadow-sm">
            <ToggleRow
              icon={<Eye size={18} color="#E60076" />}
              label="Public Profile"
              description="Allow brands to discover your profile in search"
              value={settings.publicProfile}
              onToggle={v => setSettings(p => ({...p, publicProfile: v}))}
            />
            <ToggleRow
              icon={<Mail size={18} color="#E60076" />}
              label="Show Email"
              description="Display your email to brands you've collaborated with"
              value={settings.showEmail}
              onToggle={v => setSettings(p => ({...p, showEmail: v}))}
            />
            <ToggleRow
              icon={<Search size={18} color="#E60076" />}
              label="Search Indexing"
              description="Allow your public media kit to be indexed by search engines"
              value={settings.searchIndexing}
              onToggle={v => setSettings(p => ({...p, searchIndexing: v}))}
            />
          </View>

          {/* Security */}
          <Text className="px-6 pt-6 pb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Security
          </Text>
          <View className="mx-4 rounded-2xl overflow-hidden bg-white shadow-sm">
            <ToggleRow
              icon={<Shield size={18} color="#E60076" />}
              label="Two-Factor Authentication"
              description="Add an extra step when signing in on a new device"
              value={settings.twoFactor}
              onToggle={v => setSettings(p => ({...p, twoFactor: v}))}
            />
            <LinkRow
              icon={<Lock size={18} color="#E60076" />}
              label="Change Password"
              description="Update your account password"
              onPress={onPasswordChange}
            />
            <LinkRow
              icon={<Smartphone size={18} color="#E60076" />}
              label="Trusted Devices"
              description="Manage devices currently signed in"
              onPress={onTrustedDevices}
            />
          </View>

          {/* Save / restore */}
          <View className="px-4 mt-8" style={{gap: 10}}>
            <TouchableOpacity
              onPress={save}
              disabled={!dirty}
              className="flex-row items-center justify-center h-12 rounded-xl"
              style={{
                backgroundColor: dirty ? '#E60076' : '#FCA5C7',
                gap: 8,
              }}>
              <Save size={16} color="white" />
              <Text className="text-white font-bold text-sm">
                {dirty ? 'Save Changes' : 'No changes'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Danger Zone */}
          <Text className="px-6 pt-8 pb-3 text-sm font-semibold text-red-400 uppercase tracking-wider">
            Danger Zone
          </Text>
          <View className="mx-4 rounded-2xl overflow-hidden bg-white shadow-sm mb-8">
            <LinkRow
              icon={<UserX size={18} color="#ef4444" />}
              label="Deactivate Account"
              description="Temporarily disable your account"
              onPress={onDeactiveAccount}
              danger
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export {PrivacySecurityPage};
export default PrivacySecurityPage;
