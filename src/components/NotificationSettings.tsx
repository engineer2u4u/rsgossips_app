// Notification Preferences (persisted to public.user_preferences.notification_prefs).
//
// Mirrors web app src/components/NotificationSettings.jsx (commit 8aa1896).
// The DB trigger on public.notifications uses these flags to decide which
// notification types actually get inserted for the user, so flipping a toggle
// here changes real delivery — not just whether the UI shows the row.
//
// Keys exactly match the web side. Don't rename without updating the trigger:
//   campaignUpdates · applicationStatus · deadlineReminders · paymentAlerts

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
  Bell,
  ChevronLeft,
  Clock,
  CreditCard,
  FileCheck,
  RotateCcw,
  Save,
  Megaphone,
} from 'lucide-react-native';
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

const SECTIONS: {
  title: string;
  rows: {
    key: keyof Prefs;
    icon: typeof Bell;
    label: string;
    description: string;
  }[];
}[] = [
  {
    title: 'Campaigns',
    rows: [
      {
        key: 'campaignUpdates',
        icon: Megaphone,
        label: 'Campaign Updates',
        description: 'New matches & updates on brand campaigns',
      },
      {
        key: 'applicationStatus',
        icon: FileCheck,
        label: 'Application Status',
        description: 'When a brand accepts, rejects, or messages on your application',
      },
      {
        key: 'deadlineReminders',
        icon: Clock,
        label: 'Deadline Reminders',
        description: 'Heads-up before deliverables and submission deadlines',
      },
    ],
  },
  {
    title: 'Financial',
    rows: [
      {
        key: 'paymentAlerts',
        icon: CreditCard,
        label: 'Payment Alerts',
        description: 'Advance + final payouts, refunds and other money events',
      },
    ],
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

export default function NotificationSettings({onBack}: NotificationSettingsProps) {
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
      .select('notification_prefs')
      .eq('user_id', user.id)
      .maybeSingle();
    if (err) {
      console.warn('user_preferences select failed:', err.message);
      setError(err.message);
    }
    const merged = {...DEFAULT_PREFS, ...(data?.notification_prefs || {})} as Prefs;
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
            notification_prefs: settings,
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

  const restore = () => setSettings(DEFAULT_PREFS);

  return (
    <View className="flex-1 bg-slate-50">
      <PageHeader title="Notifications" onBack={onBack} />

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

          {SECTIONS.map(section => (
            <View key={section.title}>
              <Text className="px-6 pt-6 pb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                {section.title}
              </Text>
              <View className="mx-4 rounded-2xl overflow-hidden bg-white shadow-sm">
                {section.rows.map(row => {
                  const Icon = row.icon;
                  return (
                    <View
                      key={row.key}
                      className="flex-row items-center px-5 py-4 bg-white border-b border-slate-50">
                      <View className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center mr-4">
                        <Icon size={18} color="#E60076" />
                      </View>
                      <View className="flex-1 mr-3">
                        <Text className="text-base font-medium text-slate-700">{row.label}</Text>
                        <Text className="text-xs text-slate-400 mt-1">{row.description}</Text>
                      </View>
                      <Switch
                        value={settings[row.key]}
                        onValueChange={v =>
                          setSettings(prev => ({...prev, [row.key]: v}))
                        }
                        trackColor={{false: '#e2e8f0', true: '#FCE6F1'}}
                        thumbColor={settings[row.key] ? '#E60076' : '#94a3b8'}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          ))}

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
            <TouchableOpacity
              onPress={restore}
              className="flex-row items-center justify-center h-12 rounded-xl border border-slate-200 bg-white"
              style={{gap: 8}}>
              <RotateCcw size={16} color="#475569" />
              <Text className="text-slate-600 font-semibold text-sm">Restore Defaults</Text>
            </TouchableOpacity>
          </View>

          <View className="h-12" />
        </ScrollView>
      )}
    </View>
  );
}
