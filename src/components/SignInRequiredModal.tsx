// "You'll need an account for that" — shown when a guest reaches an
// account-based action.
//
// The marketplace itself is open (guideline 5.1.1(v)); this is the wall, and
// it only stands in front of things that genuinely belong to an account:
// applying, ordering, your own orders.
//
// Three deliberate properties, because a prompt that traps someone reads to a
// reviewer as the same violation we are fixing:
//   - it says WHY the account is needed, per action
//   - "Keep browsing" always closes it
//   - closing leaves the visitor exactly where they were
//
// Shape follows UpgradeRequiredModal so the two read as one family.

import React from 'react';
import {Modal, View, Text, Pressable} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {LogIn, UserPlus, X} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';

export type SignInReason =
  | 'apply_campaign'
  | 'request_quote'
  | 'my_orders'
  | 'generic';

export default function SignInRequiredModal({
  reason,
  onClose,
  onSignIn,
  onSignUp,
}: {
  reason: SignInReason | null;
  onClose: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}) {
  const {t} = useTranslation();
  if (!reason) return null;

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
              accessibilityLabel={t('SignInRequired.close')}
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
              <LogIn size={26} color="#fff" />
            </View>
            <Text className="mt-4 text-lg font-black text-white text-center">
              {t(`SignInRequired.${reason}.title`)}
            </Text>
            <Text
              className="mt-2 text-sm text-center"
              style={{color: 'rgba(255,255,255,0.9)'}}>
              {t(`SignInRequired.${reason}.body`)}
            </Text>
          </View>

          <View className="px-6 py-6">
            <Pressable
              onPress={onSignIn}
              accessibilityRole="button"
              className="flex-row items-center justify-center overflow-hidden"
              style={{height: 50, borderRadius: 16, gap: 8}}>
              <LinearGradient
                colors={['#9810fa', '#e60076']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
              />
              <LogIn size={16} color="#fff" />
              <Text className="text-white text-sm font-bold">
                {t('SignInRequired.signIn')}
              </Text>
            </Pressable>

            <Pressable
              onPress={onSignUp}
              accessibilityRole="button"
              className="mt-2 flex-row items-center justify-center border"
              style={{
                height: 46,
                borderRadius: 16,
                gap: 8,
                borderColor: '#E9D5FF',
              }}>
              <UserPlus size={15} color="#9333EA" />
              <Text className="text-[13px] font-bold text-purple-700">
                {t('SignInRequired.createAccount')}
              </Text>
            </Pressable>

            {/* Always an exit. */}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              className="mt-2 items-center justify-center"
              style={{height: 46, borderRadius: 16}}>
              <Text className="text-[13px] font-bold text-slate-500">
                {t('SignInRequired.keepBrowsing')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
