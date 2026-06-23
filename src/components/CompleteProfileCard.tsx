import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import Svg, {Circle, Defs, LinearGradient as SvgLinearGradient, Stop} from 'react-native-svg';
import {useAuth} from '../context/AuthContext';
import {NavigationContext} from '@react-navigation/native';
import {invokeFn} from '../lib/api';
import {BRAND, BRAND_GRADIENT_WARM, CARD_SHADOW} from '../theme/brand';

const SERVICE_OPTIONS = [
  {id: 'reels', label: 'Reels', icon: Video},
  {id: 'stories', label: 'Stories', icon: Smartphone},
  {id: 'shorts', label: 'YT Shorts', icon: Youtube},
  {id: 'posts', label: 'Posts', icon: ImageIcon},
  {id: 'ugc', label: 'UGC Videos', icon: Clapperboard},
];

export default function CompleteProfileCard() {
  const {profile, user, refreshProfile} = useAuth();
  // Read the nav context directly instead of useNavigation() — that hook
  // throws "Couldn't find a navigation context" when the context is briefly
  // undefined (which can happen during a re-render cascade triggered by the
  // rates-save flow, where AuthContext refreshes and the navigator subtree
  // temporarily unmounts). A null check makes the click handlers no-op
  // instead of crashing the whole card.
  const navigation = useContext(NavigationContext);
  const [showRatesModal, setShowRatesModal] = useState(false);

  const hasInstagram = !!profile?.instagram_handle;
  const hasMediaKit = !!profile?.media_kit_published;
  const serviceRates = profile?.service_rates || {};
  const hasRates =
    !!serviceRates && Object.values(serviceRates).some((v: any) => v > 0);

  const steps = [
    {
      id: 1,
      title: 'Create your account',
      subtitle: "You're all set",
      completed: true,
      active: false as boolean,
      action: undefined as string | undefined,
      onPress: undefined as (() => void) | undefined,
    },
    {
      id: 2,
      title: 'Connect Instagram',
      subtitle: hasInstagram
        ? `@${profile?.instagram_handle}`
        : 'Brands discover you instantly',
      completed: hasInstagram,
      action: hasInstagram ? undefined : 'Connect',
      active: !hasInstagram,
      onPress: undefined as (() => void) | undefined,
    },
    {
      id: 3,
      title: 'Generate AI Media Kit',
      subtitle: hasMediaKit ? 'Published' : 'Look pro in 60 seconds',
      completed: hasMediaKit,
      action: hasMediaKit ? undefined : 'Create',
      active: hasInstagram && !hasMediaKit,
      onPress: () => navigation?.navigate('InfluencerMediaKit' as never),
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
      // Mirrors web: once the rate card is set the creator has done
      // everything brands need — treat the funnel as complete.
      id: 5,
      title: 'Apply to first campaign',
      subtitle: hasRates ? "You're discoverable to brands!" : 'Land your first deal',
      completed: hasRates,
      action: hasRates ? undefined : 'Browse',
      active: false,
      onPress: () => navigation?.navigate('InfluencerCampaigns' as never),
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / 5) * 100);

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(progressPercent / 100, {duration: 1000});
  }, [progressPercent]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handleSaveRates = async (services: string[], rates: Record<string, string>) => {
    // Coerce the string inputs into numbers — downstream code reads them
    // numerically (matchScore.ts → `Number(profile.service_rates?.reels)`,
    // and `hasRates` checks `v > 0`). Storing strings worked by coincidence
    // of JS coercion; numbers are the correct shape for the JSONB column.
    const numericRates: Record<string, number> = {};
    for (const id of services) {
      const n = Number(rates[id]);
      if (Number.isFinite(n) && n > 0) numericRates[id] = n;
    }

    try {
      await invokeFn('update-profile', {
        userId: user?.id,
        table: 'influencer_profiles',
        services,
        serviceRates: numericRates,
      });
      await refreshProfile();
      setShowRatesModal(false);
    } catch (err: any) {
      // Used to be a silent catch. That hid every failure — auth, network,
      // edge-function rejection, RLS — and left the user thinking save
      // worked while the row was actually untouched. Surface the message
      // so we can see what's actually happening.
      console.error('Failed to save rates:', err);
      const msg =
        err?.message ||
        (typeof err === 'string' ? err : 'Something went wrong.');
      Alert.alert("Couldn't save rates", msg);
      // Keep the modal open on failure so the user can retry without re-
      // selecting services + retyping prices.
    }
  };

  const RING_SIZE = 56;
  const RING_STROKE = 5;
  const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const ringOffset = RING_CIRCUMFERENCE - RING_CIRCUMFERENCE * (completedCount / 5);

  return (
    <View className="w-full mb-4">
      <View
        style={[
          {
            backgroundColor: '#ffffff',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: 'rgba(25,22,43,0.06)',
            padding: 16,
          },
          CARD_SHADOW,
        ]}>
        {/* HEADER */}
        <View className="mb-2">
          <View className="flex-row items-center" style={{gap: 12}}>
            <View
              style={{width: RING_SIZE, height: RING_SIZE}}
              className="items-center justify-center">
              <Svg width={RING_SIZE} height={RING_SIZE} style={{position: 'absolute', transform: [{rotate: '-90deg'}]}}>
                <Defs>
                  <SvgLinearGradient id="profile-ring" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor={BRAND.coral} />
                    <Stop offset="50%" stopColor={BRAND.accent} />
                    <Stop offset="100%" stopColor={BRAND.violet} />
                  </SvgLinearGradient>
                </Defs>
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke="#F1F5F9"
                  strokeWidth={RING_STROKE}
                  fill="transparent"
                />
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke="url(#profile-ring)"
                  strokeWidth={RING_STROKE}
                  strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </Svg>
              <Text className="text-xs font-black text-slate-800">
                {progressPercent}%
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-[16px] font-black text-slate-900 leading-tight">
                Get Your First Brand Deal
              </Text>
              <Text className="text-[11px] text-slate-400 font-bold mt-0.5">
                {completedCount}/5 steps —{' '}
                {completedCount === 5 ? 'all done 🎉' : 'keep going!'}
              </Text>
            </View>
          </View>
        </View>

        {/* STEPS — tight rows, divider between items only (no dashed
            connector), no bottom progress bar. Mirrors the screenshot. */}
        <View>
          {steps.map((step, index) => (
            <View
              key={step.id}
              className={`flex-row items-center justify-between py-2 ${
                index !== steps.length - 1 ? 'border-b border-slate-50' : ''
              }`}>
              <View className="flex-row items-center flex-1" style={{gap: 12}}>
                {step.completed ? (
                  <View
                    style={{
                      borderRadius: 100,
                      width: 26,
                      height: 26,
                      backgroundColor: '#22C55E',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Check size={14} color="white" strokeWidth={4} />
                  </View>
                ) : (
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 100,
                      borderWidth: 2,
                      borderColor: step.active ? BRAND.accent : '#e2e8f0',
                      backgroundColor: step.active
                        ? 'rgba(210,65,143,0.08)'
                        : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text
                      className="text-[11px] font-black"
                      style={{color: step.active ? BRAND.accent : '#94a3b8'}}>
                      {step.id}
                    </Text>
                  </View>
                )}
                <View className="flex-1 pr-2">
                  <Text
                    className={`font-bold text-[13px] ${
                      step.completed ? 'text-slate-800' : 'text-slate-800'
                    }`}>
                    {step.title}
                  </Text>
                  <Text className="text-[10px] text-slate-400 font-semibold">
                    {step.subtitle}
                  </Text>
                </View>
              </View>

              {step.action && !step.completed && (
                step.active ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={step.onPress}
                    style={{
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      overflow: 'hidden',
                    }}>
                    <LinearGradient
                      colors={[...BRAND_GRADIENT_WARM]}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                    />
                    <Text className="text-white text-[10px] font-black uppercase tracking-wider">
                      {step.action}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity activeOpacity={0.8} onPress={step.onPress}>
                    <View className="px-3 py-1.5 rounded-lg border border-slate-200">
                      <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        {step.action}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/40 justify-end">
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
                    style={{
                      width: '31%',
                      alignItems: 'center',
                      paddingVertical: 16,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: isSelected ? BRAND.accent : '#f1f5f9',
                      backgroundColor: isSelected
                        ? 'rgba(210,65,143,0.07)'
                        : '#ffffff',
                    }}>
                    <Icon
                      size={22}
                      color={isSelected ? BRAND.accent : '#94A3B8'}
                    />
                    <Text
                      className="text-[10px] font-bold mt-2"
                      style={{color: isSelected ? BRAND.accent : '#94a3b8'}}>
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
              style={{
                flex: 1,
                borderRadius: 16,
                height: 48,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                opacity: saving || localServices.length === 0 ? 0.5 : 1,
              }}>
              <LinearGradient
                colors={['#9810FA', '#E60076']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
              />
              {saving && (
                <ActivityIndicator color="white" size="small" style={{marginRight: 8}} />
              )}
              <Text className="text-white font-bold text-sm">
                {saving ? 'Saving...' : 'Save Rates'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
