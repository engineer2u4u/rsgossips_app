import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {User, CheckCircle2, Check} from 'lucide-react-native';
import {supabase} from '../utils/supabase';

interface InstaProfile {
  username: string;
  profilePictureUrl?: string;
}

interface Props {
  onSubmit: (data: {name: string; phone: string}) => void;
  onSendOtp: (phone: string) => Promise<void>;
  onResendOtp: (phone: string) => Promise<void>;
  onVerifyOtp: (phone: string, otp: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  role?: 'brand' | 'influencer';
  initialPhone?: string;
  otpPreVerified?: boolean;
  instagramProfile?: InstaProfile | null;
  initialName?: string;
}

export default function SignUpForm({
  onSubmit,
  onSendOtp,
  onResendOtp,
  onVerifyOtp,
  loading = false,
  error = '',
  role = 'influencer',
  initialPhone = '',
  otpPreVerified = false,
  instagramProfile = null,
  initialName = '',
}: Props) {
  const [formData, setFormData] = useState({
    name: initialName,
    phone: initialPhone,
  });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(otpPreVerified);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [localError, setLocalError] = useState('');
  const [consentAgreed, setConsentAgreed] = useState(false);

  const {t} = useTranslation();
  const navigation = useNavigation();
  const otpInputs = useRef<Array<TextInput | null>>([]);

  // Auto-focus the first OTP slot when the grid first appears (otpSent flips
  // true) so the keyboard pops up without an extra tap. Re-focuses if the
  // user goes back and resends.
  useEffect(() => {
    if (!otpSent || otpVerified) return;
    const t = setTimeout(() => otpInputs.current[0]?.focus(), 120);
    return () => clearTimeout(t);
  }, [otpSent, otpVerified]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({...prev, phone: digits}));
    if (otpSent) {
      setOtpSent(false);
      setOtpVerified(false);
      setOtp('');
    }
  };

  const handleSendOtp = async () => {
    if (formData.phone.length < 10) return;
    setOtpLoading(true);
    setLocalError('');
    try {
      const {data: uniqueCheck} = await supabase.functions.invoke(
        'check-uniqueness',
        {body: {phone: formData.phone}},
      );
      if (uniqueCheck?.conflicts?.includes('phone')) {
        setLocalError(t('SignUpForm.phoneAlreadyRegistered'));
        setOtpLoading(false);
        return;
      }
      await onSendOtp(formData.phone);
      setOtpSent(true);
      setTimer(60);
    } catch (err: any) {
      setLocalError(err.message || t('SignUpForm.failedSendOtp'));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const otpArray = otp.split('');
    otpArray[index] = value;
    const newOtp = otpArray.join('').slice(0, 6);
    setOtp(newOtp);
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  // Backspace on an empty slot should walk focus back AND clear the digit
  // in the previous slot. Without this, onChangeText never fires for an
  // already-empty slot and the user's clear key feels stuck on the current
  // input.
  const handleOtpKeyPress = (
    e: {nativeEvent: {key: string}},
    index: number,
  ) => {
    if (e.nativeEvent.key !== 'Backspace') return;
    if (otp[index]) return;
    if (index === 0) return;
    const arr = otp.split('');
    arr[index - 1] = '';
    setOtp(arr.join(''));
    otpInputs.current[index - 1]?.focus();
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    setVerifyLoading(true);
    setLocalError('');
    try {
      await onVerifyOtp(formData.phone, otp);
      setOtpVerified(true);
    } catch (err: any) {
      setLocalError(err.message || t('SignUpForm.invalidOtp'));
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    setOtpLoading(true);
    setLocalError('');
    try {
      await onResendOtp(formData.phone);
      setTimer(60);
      setOtp('');
    } catch (err: any) {
      setLocalError(err.message || t('SignUpForm.failedResendOtp'));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setLocalError(t('SignUpForm.enterFullName'));
      return;
    }
    if (!otpVerified) {
      setLocalError(t('SignUpForm.verifyPhone'));
      return;
    }
    if (!consentAgreed) {
      setLocalError(t('SignUpForm.acceptConsent'));
      return;
    }
    onSubmit({...formData});
  };

  const displayError = error || localError;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="space-y-5 px-1">
        {/* Header */}
        <View className="items-center space-y-2">
          <Text className="text-2xl font-bold text-slate-900">
            {t('SignUpForm.title')}
          </Text>
          <Text className="text-sm text-slate-500">
            {t('SignUpForm.subtitle')}
          </Text>
        </View>

        {/* Error */}
        {displayError ? (
          <View className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <Text className="text-sm text-red-600">{displayError}</Text>
          </View>
        ) : null}

        {/* Instagram Connected Badge */}
        {instagramProfile && (
          <View className="p-3 rounded-xl border border-green-200 bg-green-50 flex-row items-center gap-3">
            {instagramProfile.profilePictureUrl ? (
              <Image
                source={{uri: instagramProfile.profilePictureUrl}}
                className="w-10 h-10 rounded-full"
                style={{borderWidth: 2, borderColor: 'white'}}
              />
            ) : (
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{backgroundColor: '#E1306C'}}>
                <Text className="text-white font-bold text-sm">
                  {instagramProfile.username?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text
                className="text-sm font-bold text-slate-900"
                numberOfLines={1}>
                @{instagramProfile.username}
              </Text>
              <Text className="text-[10px] text-slate-400">
                {t('SignUpForm.instagramConnected')}
              </Text>
            </View>
            <CheckCircle2 size={18} color="#22C55E" />
          </View>
        )}

        {/* Full Name */}
        <View className="space-y-1.5">
          <Text className="text-xs font-semibold text-slate-500 ml-1">
            {t('SignUpForm.fullNameLabel')}
          </Text>
          <View className="flex-row items-center border border-slate-200 rounded-xl px-4 h-12">
            <User size={18} color="rgba(99,71,249,0.6)" />
            <TextInput
              placeholder={t('SignUpForm.fullNamePlaceholder')}
              value={formData.name}
              onChangeText={v => setFormData(prev => ({...prev, name: v}))}
              className="flex-1 ml-3 text-base"
            />
          </View>
        </View>

        {/* Phone + OTP */}
        <View className="space-y-1.5">
          <Text className="text-xs font-semibold text-slate-500 ml-1">
            {t('SignUpForm.mobileNumberLabel')}
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1 flex-row items-center border border-slate-200 rounded-xl h-12">
              <View className="pl-4 pr-2 border-r border-slate-200 mr-2">
                <Text className="text-sm font-semibold text-slate-700">
                  +91
                </Text>
              </View>
              <TextInput
                keyboardType="phone-pad"
                placeholder={t('SignUpForm.phonePlaceholder')}
                value={formData.phone}
                onChangeText={handlePhoneChange}
                editable={!otpVerified}
                maxLength={10}
                className="flex-1 text-base pr-3"
              />
            </View>

            {!otpVerified && !otpSent && (
              <Pressable
                onPress={handleSendOtp}
                disabled={formData.phone.length < 10 || otpLoading}
                className={`h-12 px-4 rounded-xl items-center justify-center ${
                  formData.phone.length < 10 ? 'bg-slate-200' : 'bg-[#9810FA]'
                }`}>
                {otpLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white text-sm font-semibold">
                    {t('SignUpForm.sendOtp')}
                  </Text>
                )}
              </Pressable>
            )}

            {otpVerified && (
              <View className="h-12 px-3 items-center justify-center">
                <CheckCircle2 size={22} color="#22C55E" />
              </View>
            )}
          </View>

          {/* OTP Input */}
          {otpSent && !otpVerified && (
            <View className="space-y-3 pt-2">
              <View className="px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                <Text className="text-[11px] text-emerald-700 text-center">
                  {t('SignUpForm.otpWhatsappPrefix')}{' '}
                  <Text className="font-bold">Rgossips Media</Text>
                  {t('SignUpForm.otpWhatsappSuffix')}
                </Text>
              </View>
              <View className="flex-row justify-center gap-1.5">
                {[...Array(6)].map((_, i) => (
                  <TextInput
                    key={i}
                    ref={ref => {
                      otpInputs.current[i] = ref;
                    }}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={otp[i] ?? ''}
                    onChangeText={value => handleOtpChange(value, i)}
                    onKeyPress={e => handleOtpKeyPress(e, i)}
                    className="w-10 h-12 text-lg font-bold border-2 rounded-lg border-slate-200 text-center"
                  />
                ))}
              </View>

              <View className="items-center space-y-2">
                <Pressable
                  onPress={handleVerifyOtp}
                  disabled={otp.length < 6 || verifyLoading}
                  className={`h-9 px-8 rounded-lg items-center justify-center flex-row ${
                    otp.length < 6 ? 'bg-slate-200' : 'bg-[#9810FA]'
                  }`}>
                  {verifyLoading && (
                    <ActivityIndicator
                      size="small"
                      color="white"
                      style={{marginRight: 4}}
                    />
                  )}
                  <Text className="text-white text-sm font-semibold">
                    {t('SignUpForm.verify')}
                  </Text>
                </Pressable>

                {timer > 0 ? (
                  <Text className="text-xs text-slate-400">
                    {t('SignUpForm.resendIn')}{' '}
                    <Text className="text-[#6347F9] font-bold">
                      {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                    </Text>
                  </Text>
                ) : (
                  <Pressable onPress={handleResend}>
                    <Text className="text-xs text-[#6347F9] font-bold">
                      {t('SignUpForm.resendOtp')}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Consent (mandatory) */}
        <Pressable
          onPress={() => setConsentAgreed(v => !v)}
          className="flex-row items-start gap-3 px-1 py-1"
          hitSlop={4}>
          <View
            className={`w-5 h-5 rounded border items-center justify-center mt-0.5 ${
              consentAgreed
                ? 'bg-[#6347F9] border-[#6347F9]'
                : 'border-slate-300 bg-white'
            }`}>
            {consentAgreed && <Check size={14} color="white" strokeWidth={3} />}
          </View>
          <Text className="flex-1 text-[12px] text-slate-600 leading-snug">
            {t('SignUpForm.consentPrefix')}{' '}
            <Text
              className="text-[#6347F9] font-bold"
              onPress={() =>
                (navigation as any).navigate('ConsentPolicy', {
                  role: 'influencer',
                })
              }>
              {t('SignUpForm.consentLink')}
            </Text>
            {t('SignUpForm.consentSuffix')}
          </Text>
        </Pressable>

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading || !formData.name || !otpVerified || !consentAgreed}
          className={`w-full h-[54px] rounded-2xl items-center justify-center flex-row ${
            loading || !formData.name || !otpVerified || !consentAgreed
              ? 'bg-slate-200'
              : 'bg-[#9810FA]'
          }`}>
          {loading ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white text-base font-semibold ml-2">
                {t('SignUpForm.creatingAccount')}
              </Text>
            </>
          ) : (
            <Text
              className={`text-base font-semibold ${
                !formData.name || !otpVerified || !consentAgreed
                  ? 'text-slate-400'
                  : 'text-white'
              }`}>
              {t('SignUpForm.title')}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
