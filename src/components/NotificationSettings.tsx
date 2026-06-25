// Notification Preferences (persisted to public.user_preferences.notification_prefs).
//
// Mirrors D:/Development/React/RS_Gossips src/components/NotificationSettings.jsx
// element-for-element: two sections (Campaign Notifications + Financial) with a
// gradient section header and toggle rows; Save Changes button + Restore
// defaults at the bottom. Keys exactly match the web side — don't rename
// without updating the DB trigger that reads them.
//   campaignUpdates · applicationStatus · deadlineReminders · paymentAlerts

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
import {Bell, ChevronLeft, RotateCcw, TrendingUp} from 'lucide-react-native';
import {supabase} from '../utils/supabase';
import {useAuth} from '../context/AuthContext';
import {useGlobalLoading} from '../context/LoadingContext';

interface NotificationSettingsProps {
  onBack: () => void;
}

type Prefs = {
  campaignUpdates: boolean;
  applicationStatus: boolean;
  deadlineReminders: boolean;
  paymentAlerts: boolean;
};

const DEFAULT_PREFS: Prefs = {
  campaignUpdates: true,
  applicationStatus: true,
  deadlineReminders: true,
  paymentAlerts: true,
};

// Same labels + descriptions used on the web mobile branch — keep in sync.
const CAMPAIGN_ROWS: {
  key: keyof Prefs;
  title: string;
  description: string;
}[] = [
  {
    key: 'campaignUpdates',
    title: 'Campaign Updates',
    description: 'New campaigns matching your profile',
  },
  {
    key: 'applicationStatus',
    title: 'Application Status',
    description: 'Updates on your applications',
  },
  {
    key: 'deadlineReminders',
    title: 'Deadline Reminders',
    description: 'Content submission deadlines',
  },
];

const FINANCIAL_ROWS: {
  key: keyof Prefs;
  title: string;
  description: string;
}[] = [
  {
    key: 'paymentAlerts',
    title: 'Payment Alerts',
    description: 'Payment received notifications',
  },
];

const PageHeader = ({title, onBack}: {title: string; onBack: () => void}) => (
  <View className="flex-row items-center gap-4 px-6 py-4 bg-white border-b border-slate-100">
    <TouchableOpacity onPress={onBack} className="p-2 rounded-full bg-[#FCE6F1]">
      <ChevronLeft size={20} color="#E60076" />
    </TouchableOpacity>
    <Text className="text-lg font-bold text-slate-800">{title}</Text>
  </View>
);

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
    <View
      className="flex-row items-center justify-between"
      style={{gap: 12, paddingVertical: 12}}>
      <View className="flex-1" style={{gap: 2}}>
        <Text className="text-[13px] font-black text-gray-900">{title}</Text>
        <Text className="text-[10px] font-bold text-gray-400">{description}</Text>
      </View>
      <Switch
        value={isEnabled}
        onValueChange={onToggle}
        trackColor={{false: '#e5e7eb', true: '#EC4899'}}
        thumbColor="#ffffff"
        ios_backgroundColor="#e5e7eb"
      />
    </View>
  );
}

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
      <Text className="font-black text-xs uppercase tracking-wider text-gray-900">
        {title}
      </Text>
    </View>
  );
}

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: {width: 0, height: 4},
  elevation: 4,
};

export default function NotificationSettings({onBack}: NotificationSettingsProps) {
  const {user} = useAuth();
  const {withLoading} = useGlobalLoading();
  const [settings, setSettings] = useState<Prefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState(0);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const {data} = await supabase
      .from('user_preferences')
      .select('notification_prefs')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data?.notification_prefs) {
      setSettings({...DEFAULT_PREFS, ...data.notification_prefs});
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
            notification_prefs: settings,
            updated_at: new Date().toISOString(),
          },
          {onConflict: 'user_id'},
        );
        setSavedAt(Date.now());
      })(),
      'Saving preferences…',
    );
  };

  const handleRestoreDefaults = () => setSettings(DEFAULT_PREFS);

  const justSaved = savedAt > 0 && Date.now() - savedAt < 3000;

  return (
    <View className="flex-1" style={{backgroundColor: '#F9FAFB'}}>
      <PageHeader title="Notification Settings" onBack={onBack} />

      {!loaded ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#EC4899" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            padding: 20,
            gap: 32,
            paddingBottom: Platform.OS === 'ios' ? 140 : 120,
          }}
          showsVerticalScrollIndicator={false}>
          {/* Campaign Notifications */}
          <View style={{gap: 12}}>
            <SectionHeader
              title="Campaign Notifications"
              iconBg="#EC4899"
              icon={<TrendingUp size={18} color="#fff" />}
            />
            <View
              className="bg-white border border-gray-100 rounded-xl"
              style={[{padding: 20, gap: 8}, cardShadow]}>
              {CAMPAIGN_ROWS.map(row => (
                <ToggleRow
                  key={row.key}
                  title={row.title}
                  description={row.description}
                  isEnabled={settings[row.key]}
                  onToggle={() => toggleSetting(row.key)}
                />
              ))}
            </View>
          </View>

          {/* Financial */}
          <View style={{gap: 12}}>
            <SectionHeader
              title="Financial"
              iconBg="#10B981"
              icon={<Bell size={18} color="#fff" />}
            />
            <View
              className="bg-white border border-gray-100 rounded-xl"
              style={[{padding: 20}, cardShadow]}>
              {FINANCIAL_ROWS.map(row => (
                <ToggleRow
                  key={row.key}
                  title={row.title}
                  description={row.description}
                  isEnabled={settings[row.key]}
                  onToggle={() => toggleSetting(row.key)}
                />
              ))}
            </View>
          </View>

          {/* Restore defaults — matches web mobile branch placement */}
          <TouchableOpacity
            onPress={handleRestoreDefaults}
            className="flex-row items-center justify-center rounded-xl border border-slate-200 bg-white"
            style={{paddingVertical: 12, gap: 6}}>
            <RotateCcw size={14} color="#64748B" />
            <Text className="text-xs font-black text-slate-500">
              Restore defaults
            </Text>
          </TouchableOpacity>

          {/* Save Changes — same gradient button shape as web */}
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
              {justSaved ? 'Saved ✓' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}
