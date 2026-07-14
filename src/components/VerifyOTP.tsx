import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
  onNext: (otp: string) => void;
  onResend?: () => void | Promise<void>;
  loading?: boolean;
  error?: string;
  otp?: string;
  setOtp?: (otp: string) => void;
  phoneNumber?: string;
}

// Matches the server-side cooldown in the OTP sender (60s per phone) —
// a 30s UI timer let users hit Resend while the backend still refused.
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyOTP({
  onNext,
  onResend,
  loading = false,
  error = '',
  otp = '',
  setOtp = () => {},
  phoneNumber = '+91 98765 43210',
}: Props) {
  const { t } = useTranslation();
  const [timer, setTimer] = useState(RESEND_COOLDOWN_SECONDS);
  const inputs = useRef<Array<TextInput | null>>([]);

  // Auto-focus the first slot on mount so the keyboard pops up immediately
  // when the OTP step renders. The small delay lets the parent's mount
  // animation settle so focus doesn't race with the keyboard avoiding view.
  useEffect(() => {
    const t = setTimeout(() => inputs.current[0]?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  /* ---------------- TIMER ---------------- */

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    if (!onResend) {
      setTimer(RESEND_COOLDOWN_SECONDS);
      return;
    }
    try {
      await onResend();
    } finally {
      setTimer(RESEND_COOLDOWN_SECONDS);
    }
  };

  /* ---------------- OTP INPUT ---------------- */

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const otpArray = otp.split('');
    otpArray[index] = value;

    const newOtp = otpArray.join('').slice(0, 6);
    setOtp(newOtp);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  // Backspace handling — onChangeText only fires when the text actually
  // changes, so pressing backspace on an already-empty slot does nothing
  // and the focus stays stuck on the current slot. onKeyPress catches the
  // raw key, so we can jump back AND erase the previous slot's digit.
  const handleKeyPress = (
    e: {nativeEvent: {key: string}},
    index: number,
  ) => {
    if (e.nativeEvent.key !== 'Backspace') return;
    if (otp[index]) return; // The slot had a digit — onChangeText will clear it.
    if (index === 0) return; // Already at the first slot.
    const arr = otp.split('');
    arr[index - 1] = '';
    setOtp(arr.join(''));
    inputs.current[index - 1]?.focus();
  };

  const handleSubmit = () => {
    if (otp.length === 6) {
      onNext(otp);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <View className="px-6" style={{gap: 24, paddingTop: 8, paddingBottom: 24}}>
      {/* TITLE */}
      <View className="items-center" style={{gap: 8}}>
        <Text className="text-2xl font-bold text-slate-900">{t('VerifyOTP.title')}</Text>

        <Text className="text-sm text-slate-500 text-center" style={{lineHeight: 20}}>
          {t('VerifyOTP.enterCode')}{'\n'}
          <Text className="font-semibold text-slate-900">{phoneNumber}</Text>
        </Text>
      </View>

      {/* WhatsApp delivery hint */}
      <View className="px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-lg">
        <Text className="text-xs text-emerald-700 text-center" style={{lineHeight: 18}}>
          {t('VerifyOTP.whatsappHint')}{' '}
          <Text className="font-bold">Rgossips Media</Text>!
        </Text>
      </View>

      {/* OTP INPUTS */}
      <View className="flex-row justify-center" style={{gap: 10, marginVertical: 4}}>
        {[...Array(6)].map((_, i) => (
          <TextInput
            key={i}
            ref={ref => {
              inputs.current[i] = ref;
            }}
            keyboardType="number-pad"
            maxLength={1}
            value={otp[i] ?? ''}
            onChangeText={value => handleChange(value, i)}
            onKeyPress={e => handleKeyPress(e, i)}
            className="border-2 rounded-xl border-slate-200"
            // Sizing + font inline (not via Tailwind) so iOS doesn't inherit a
            // 28px lineHeight from `text-lg` that fights the 56px box and
            // makes each digit baseline-drift after autofill.
            style={{
              width: 48,
              height: 56,
              fontSize: 22,
              fontWeight: '700',
              textAlign: 'center',
              padding: 0,
              color: '#0f172a',
            }}
          />
        ))}
      </View>

      {/* VERIFY BUTTON — matches the brand-pink Next button. */}
      <Pressable
        onPress={handleSubmit}
        disabled={loading || otp.length < 6}
        className={`w-full h-[58px] rounded-[20px] items-center justify-center ${
          otp.length === 6 ? 'bg-[#FA288A]' : 'bg-gray-300'
        }`}
      >
        <Text className="text-white text-lg font-semibold">
          {loading ? t('VerifyOTP.verifying') : t('VerifyOTP.verifyContinue')}
        </Text>
      </Pressable>

      {/* ERROR */}
      {error !== '' && (
        <View className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <Text className="text-sm text-red-600">{error}</Text>
        </View>
      )}

      {/* RESEND TIMER */}
      <View className="items-center" style={{paddingTop: 4}}>
        {timer > 0 ? (
          <Text className="text-sm text-slate-400 font-medium">
            {t('VerifyOTP.resendCodeIn')}{' '}
            <Text className="text-[#6347F9] font-bold">
              {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
            </Text>
          </Text>
        ) : (
          <Pressable onPress={handleResend}>
            <Text className="text-sm text-[#6347F9] font-bold">{t('VerifyOTP.resendOtp')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
