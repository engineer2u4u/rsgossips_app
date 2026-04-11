import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Check,
  X,
  Video,
  Smartphone,
  Youtube,
  Image as ImageIcon,
  Clapperboard,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../context/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {
  NEXT_PUBLIC_SUPABASE_URL as SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as SUPABASE_ANON_KEY,
} from '@env';

const SERVICE_OPTIONS = [
  {id: 'reels', label: 'Reels', icon: Video},
  {id: 'stories', label: 'Stories', icon: Smartphone},
  {id: 'shorts', label: 'YT Shorts', icon: Youtube},
  {id: 'posts', label: 'Posts', icon: ImageIcon},
  {id: 'ugc', label: 'UGC Videos', icon: Clapperboard},
];

export default function CompleteProfileCard() {
  const {profile, user, refreshProfile} = useAuth();
  const navigation = useNavigation();
  const [showRatesModal, setShowRatesModal] = useState(false);

  const hasInstagram = !!profile?.instagram_handle;
  const hasMediaKit = !!profile?.media_kit_published;
  const serviceRates = profile?.service_rates || {};
  const hasRates =
    !!serviceRates && Object.values(serviceRates).some((v: any) => v > 0);

  const completedCount =
    1 + (hasInstagram ? 1 : 0) + (hasMediaKit ? 1 : 0) + (hasRates ? 1 : 0);
  const progressPercent = Math.round((completedCount / 5) * 100);

  const steps = [
    {id: 1, title: 'Create your account', subtitle: "You're all set", completed: true},
    {
      id: 2,
      title: 'Connect Instagram',
      subtitle: hasInstagram ? `@${profile?.instagram_handle}` : 'Brands discover you instantly',
      completed: hasInstagram,
      action: hasInstagram ? undefined : 'Connect',
      active: !hasInstagram,
    },
    {
      id: 3,
      title: 'Generate AI Media Kit',
      subtitle: hasMediaKit ? 'Published' : 'Look pro in 60 seconds',
      completed: hasMediaKit,
      action: hasMediaKit ? undefined : 'Create',
      active: hasInstagram && !hasMediaKit,
      onPress: () => navigation.navigate('InfluencerMediaKit' as never),
    },
    {
      id: 4,
      title: 'Set your rate card',
      subtitle: hasRates ? 'Rates configured' : 'Know your worth',
      completed: hasRates,
      action: hasRates ? undefined : 'Set Rates',
      active: hasMediaKit && !hasRates,
      onPress: () => setShowRatesModal(true),
    },
    {
      id: 5,
      title: 'Apply to first campaign',
      subtitle: 'Land your first deal',
      action: 'Browse',
      onPress: () => navigation.navigate('InfluencerCampaigns' as never),
    },
  ];

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(progressPercent / 100, {duration: 1000});
  }, [progressPercent]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handleSaveRates = async (services: string[], rates: Record<string, string>) => {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          table: 'influencer_profiles',
          services,
          serviceRates: rates,
        }),
      });
      await refreshProfile();
    } catch {}
    setShowRatesModal(false);
  };

  return (
    <View className="w-full px-4 mb-6">
      <View className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
        {/* HEADER */}
        <View className="mb-6">
          <View className="flex-row items-center mb-5" style={{gap: 16}}>
            <View className="w-16 h-16 rounded-full border-4 border-slate-50 items-center justify-center">
              <Text className="text-pink-600 font-black text-lg">
                {progressPercent}%
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xl font-black text-slate-900 leading-tight">
                Get Your First Brand Deal
              </Text>
              <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                {completedCount}/5 steps — keep going!
              </Text>
            </View>
          </View>

          <View className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <Animated.View style={progressStyle} className="h-full">
              <LinearGradient
                colors={['#8E2DE2', '#F6339A']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={{flex: 1}}
              />
            </Animated.View>
          </View>
        </View>

        {/* STEPS */}
        <View>
          {steps.map(step => (
            <View
              key={step.id}
              className="flex-row items-center justify-between py-4 border-b border-slate-50">
              <View className="flex-row items-center flex-1" style={{gap: 12}}>
                {step.completed ? (
                  <LinearGradient
                    colors={['#8E2DE2', '#F6339A']}
                    style={{borderRadius: 100, width: 32, height: 32, alignItems: 'center', justifyContent: 'center'}}>
                    <Check size={16} color="white" strokeWidth={4} />
                  </LinearGradient>
                ) : (
                  <View
                    className={`w-8 h-8 rounded-full border-2 items-center justify-center ${step.active ? 'border-pink-500' : 'border-slate-200'}`}>
                    <Text className={`text-xs font-black ${step.active ? 'text-pink-500' : 'text-slate-300'}`}>
                      {step.id}
                    </Text>
                  </View>
                )}
                <View className="flex-1 pr-2">
                  <Text className={`font-black text-sm ${step.completed ? 'text-slate-300 line-through' : 'text-slate-800'}`}>
                    {step.title}
                  </Text>
                  <Text className="text-[11px] text-slate-400 font-bold">
                    {step.subtitle}
                  </Text>
                </View>
              </View>

              {step.action && !step.completed && (
                <TouchableOpacity activeOpacity={0.8} onPress={step.onPress}>
                  {step.active ? (
                    <LinearGradient
                      colors={['#8E2DE2', '#F6339A']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={{borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8}}>
                      <Text className="text-white text-[10px] font-black uppercase">
                        {step.action}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50">
                      <Text className="text-slate-400 text-[10px] font-black uppercase">
                        {step.action}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Set Rates Modal */}
      {showRatesModal && (
        <SetRatesModal
          services={profile?.services || []}
          rates={serviceRates}
          onSave={handleSaveRates}
          onClose={() => setShowRatesModal(false)}
        />
      )}
    </View>
  );
}

function SetRatesModal({
  services,
  rates,
  onSave,
  onClose,
}: {
  services: string[];
  rates: Record<string, any>;
  onSave: (services: string[], rates: Record<string, string>) => void;
  onClose: () => void;
}) {
  const [localServices, setLocalServices] = useState<string[]>(services);
  const [localRates, setLocalRates] = useState<Record<string, string>>(() => {
    const r: Record<string, string> = {};
    SERVICE_OPTIONS.forEach(s => {
      r[s.id] = rates[s.id] ? String(rates[s.id]) : '';
    });
    return r;
  });
  const [saving, setSaving] = useState(false);

  const toggleService = (id: string) => {
    setLocalServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const filteredRates: Record<string, string> = {};
    localServices.forEach(id => {
      if (localRates[id]) filteredRates[id] = localRates[id];
    });
    await onSave(localServices, filteredRates);
    setSaving(false);
  };

  return (
    <Modal visible animationType="slide" transparent>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-[32px] max-h-[85%]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100">
            <Text className="text-lg font-bold text-slate-800">
              Set Your Rates
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-slate-100">
              <X size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-6 py-5" showsVerticalScrollIndicator={false}>
            {/* Service Selection */}
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
              Select Services
            </Text>
            <View className="flex-row flex-wrap" style={{gap: 8, marginBottom: 24}}>
              {SERVICE_OPTIONS.map(svc => {
                const Icon = svc.icon;
                const isSelected = localServices.includes(svc.id);
                return (
                  <TouchableOpacity
                    key={svc.id}
                    onPress={() => toggleService(svc.id)}
                    style={{width: '31%'}}
                    className={`items-center py-4 rounded-2xl border-2 ${
                      isSelected
                        ? 'border-[#E60076] bg-pink-50'
                        : 'border-slate-100 bg-white'
                    }`}>
                    <Icon
                      size={22}
                      color={isSelected ? '#E60076' : '#94A3B8'}
                    />
                    <Text
                      className={`text-[10px] font-bold mt-2 ${
                        isSelected ? 'text-[#E60076]' : 'text-slate-400'
                      }`}>
                      {svc.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Rate Inputs */}
            {localServices.length > 0 && (
              <>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Set Rates (₹)
                </Text>
                <View style={{gap: 12}}>
                  {localServices.map(id => {
                    const svc = SERVICE_OPTIONS.find(s => s.id === id);
                    if (!svc) return null;
                    return (
                      <View key={id} className="flex-row items-center bg-slate-50 rounded-xl p-3" style={{gap: 10}}>
                        <Text className="text-sm font-semibold text-slate-700 flex-1">
                          {svc.label}
                        </Text>
                        <View className="flex-row items-center bg-white border border-slate-200 rounded-lg px-3 h-10" style={{gap: 4}}>
                          <Text className="text-slate-400 text-sm">₹</Text>
                          <TextInput
                            keyboardType="number-pad"
                            value={localRates[id]}
                            onChangeText={v =>
                              setLocalRates(prev => ({...prev, [id]: v}))
                            }
                            placeholder="0"
                            className="w-20 text-sm font-bold text-slate-800"
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            <View className="h-4" />
          </ScrollView>

          {/* Footer */}
          <View className="px-6 py-4 border-t border-slate-100 flex-row" style={{gap: 12}}>
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 h-12 rounded-2xl bg-slate-100 items-center justify-center">
              <Text className="text-sm font-bold text-slate-600">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || localServices.length === 0}
              className="flex-1">
              <LinearGradient
                colors={['#9810FA', '#E60076']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={{
                  borderRadius: 16,
                  height: 48,
                  opacity: saving || localServices.length === 0 ? 0.5 : 1,
                }}
                className="items-center justify-center flex-row">
                {saving && (
                  <ActivityIndicator color="white" size="small" style={{marginRight: 8}} />
                )}
                <Text className="text-white font-bold text-sm">
                  {saving ? 'Saving...' : 'Save Rates'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
