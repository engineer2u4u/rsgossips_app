// Deactivate Account — soft-deactivate flow.
//
// Mirrors web app src/components/DeactiveAccount.jsx (commit 011b781).
// Steps:
//   1. Optional reason survey (radio-list)
//   2. Mandatory "I understand" checkbox
//   3. Flip profile.status -> "deactivated" (role-aware table)
//   4. Revoke all device_sessions for this user
//   5. supabase.auth.signOut()
//   6. Navigate to Login
//
// Reactivation is implicit: signing back in flips status to "active" elsewhere
// (web has an auto-reactivate hook on auth-state-change; RN will inherit when
// the influencer signs back in via the existing AuthContext flow).

import React, {useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {AlertTriangle, Check, ChevronLeft, XCircle} from 'lucide-react-native';
import {supabase} from '../utils/supabase';
import {useAuth} from '../context/AuthContext';
import {useGlobalLoading} from '../context/LoadingContext';

interface DeactiveAccountProps {
  onBack: () => void;
}

const REASONS = [
  'Taking a break',
  'Not enough relevant brand offers',
  'Privacy concerns',
  'App was hard to use',
  'Switching to another platform',
  'Other',
];

const PageHeader = ({title, onBack}: {title: string; onBack: () => void}) => (
  <View className="flex-row items-center gap-4 px-6 py-4 bg-white border-b border-slate-100">
    <TouchableOpacity onPress={onBack} className="p-2 rounded-full bg-[#FCE6F1]">
      <ChevronLeft size={20} color="#E60076" />
    </TouchableOpacity>
    <Text className="text-lg font-bold text-slate-800">{title}</Text>
  </View>
);

const DeactiveAccount: React.FC<DeactiveAccountProps> = ({onBack}) => {
  const navigation = useNavigation();
  const {user, role, signOut} = useAuth();
  const {withLoading} = useGlobalLoading();

  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = confirmed && !!user?.id;

  const performDeactivate = async () => {
    if (!user?.id) return;
    setError(null);
    try {
      // Role-aware profile table + key column.
      const table = role === 'brand' ? 'brand_profiles' : 'influencer_profiles';
      const idCol = role === 'brand' ? 'brand_id' : 'influencer_id';

      const updates: Record<string, any> = {
        status: 'deactivated',
        updated_at: new Date().toISOString(),
      };
      if (reason) updates.deactivation_reason = reason;
      if (detail.trim()) updates.deactivation_feedback = detail.trim();

      const {error: profErr} = await supabase
        .from(table)
        .update(updates)
        .eq(idCol, user.id);
      if (profErr) throw profErr;

      // Revoke every active session for this user. This signs us out on every
      // other device within 60s (web/RN both poll the row).
      await supabase
        .from('device_sessions')
        .update({is_active: false})
        .eq('user_id', user.id);

      // Sign out locally.
      await signOut();
      navigation.navigate('Login' as never);
    } catch (e: any) {
      setError(e?.message || 'Failed to deactivate account.');
    }
  };

  const onDeactivatePressed = () => {
    if (!canSubmit) return;
    Alert.alert(
      'Deactivate account?',
      "Your profile will be hidden and you'll be signed out of every device. You can reactivate by signing back in.",
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => withLoading(performDeactivate(), 'Deactivating account…'),
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50">
      <PageHeader title="Deactivate Account" onBack={onBack} />

      <ScrollView
        className="flex-1 px-6 pt-6"
        keyboardShouldPersistTaps="handled">
        {/* Warning Banner */}
        <View className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-3">
            <AlertTriangle size={22} color="#ef4444" />
            <Text className="text-base font-bold text-red-600 ml-3">Warning</Text>
          </View>
          <Text className="text-sm text-red-500 leading-5">
            Deactivating your account hides your profile and signs you out of every device.
            You can reactivate any time by signing back in.
          </Text>
        </View>

        <Text className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          What happens when you deactivate
        </Text>
        <View className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          {[
            'Your profile is hidden from search and discovery',
            'Active campaigns and applications are paused',
            'Other devices signed in to your account are signed out',
            'You stop receiving notifications',
          ].map(item => (
            <View key={item} className="flex-row items-start mb-3">
              <XCircle size={16} color="#94a3b8" />
              <Text className="text-sm text-slate-600 ml-3 flex-1">{item}</Text>
            </View>
          ))}
        </View>

        <Text className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Reason for leaving (optional)
        </Text>
        <View className="bg-white rounded-2xl shadow-sm mb-3 overflow-hidden">
          {REASONS.map((r, i) => {
            const active = reason === r;
            return (
              <Pressable
                key={r}
                onPress={() => setReason(active ? null : r)}
                className={`flex-row items-center px-5 py-3 ${
                  i < REASONS.length - 1 ? 'border-b border-slate-50' : ''
                }`}>
                <View
                  className={`w-5 h-5 rounded-full border items-center justify-center mr-3 ${
                    active ? 'border-[#E60076] bg-[#FCE6F1]' : 'border-slate-300 bg-white'
                  }`}>
                  {active && <View className="w-2.5 h-2.5 rounded-full bg-[#E60076]" />}
                </View>
                <Text className="text-sm text-slate-700 flex-1">{r}</Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 h-24 mb-6"
          placeholder="Anything else you want to tell us? (optional)"
          placeholderTextColor="#94a3b8"
          multiline
          textAlignVertical="top"
          value={detail}
          onChangeText={setDetail}
        />

        <Pressable
          onPress={() => setConfirmed(v => !v)}
          className="flex-row items-start mb-4"
          hitSlop={4}>
          <View
            className={`w-5 h-5 rounded border items-center justify-center mt-0.5 mr-3 ${
              confirmed ? 'bg-red-500 border-red-500' : 'border-slate-300 bg-white'
            }`}>
            {confirmed && <Check size={14} color="white" strokeWidth={3} />}
          </View>
          <Text className="flex-1 text-sm text-slate-700 leading-snug">
            I understand my profile will be hidden and I'll be signed out of every device.
          </Text>
        </Pressable>

        {error ? (
          <View className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <Text className="text-xs text-red-600">{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={onDeactivatePressed}
          disabled={!canSubmit}
          className="items-center justify-center mb-4 py-4 rounded-xl"
          style={{backgroundColor: canSubmit ? '#ef4444' : '#fca5a5'}}>
          <Text className="text-white font-bold text-base">Deactivate Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onBack}
          className="items-center justify-center mb-8 py-4 rounded-xl border border-slate-200">
          <Text className="text-slate-600 font-bold text-base">Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default DeactiveAccount;
