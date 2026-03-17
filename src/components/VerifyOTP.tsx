import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';

interface Props {
  onNext: (otp: string) => void;
  loading?: boolean;
  error?: string;
  otp?: string;
  setOtp?: (otp: string) => void;
  phoneNumber?: string;
}

export default function VerifyOTP({
  onNext,
  loading = false,
  error = '',
  otp = '',
  setOtp = () => {},
  phoneNumber = '+91 98765 43210',
}: Props) {
  const [timer, setTimer] = useState(30);
  const inputs = useRef<Array<TextInput | null>>([]);

  /* ---------------- TIMER ---------------- */

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const handleSubmit = () => {
    if (otp.length === 6) {
      onNext(otp);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <View className="px-6 space-y-8">
      {/* TITLE */}
      <View className="items-center space-y-2">
        <Text className="text-2xl font-bold text-slate-900">Verify OTP</Text>

        <Text className="text-sm text-slate-500 text-center">
          Enter the 6-digit code sent to{'\n'}
          <Text className="font-semibold text-slate-900">{phoneNumber}</Text>
        </Text>
      </View>

      {/* OTP INPUTS */}
      <View className="flex-row justify-center gap-2">
        {[...Array(6)].map((_, i) => (
          <TextInput
            key={i}
            ref={ref => (inputs.current[i] = ref)}
            keyboardType="number-pad"
            maxLength={1}
            value={otp[i] ?? ''}
            onChangeText={value => handleChange(value, i)}
            className="w-12 h-14 text-lg font-bold border-2 rounded-xl border-slate-200 text-center"
          />
        ))}
      </View>

      {/* VERIFY BUTTON */}
      <Pressable
        onPress={handleSubmit}
        disabled={loading || otp.length < 6}
        className={`h-[54px] rounded-2xl items-center justify-center ${
          otp.length === 6 ? 'bg-[#9810FA]' : 'bg-gray-300'
        }`}
      >
        <Text className="text-white text-base font-semibold">
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </Text>
      </Pressable>

      {/* ERROR */}
      {error !== '' && (
        <View className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <Text className="text-sm text-red-600">{error}</Text>
        </View>
      )}

      {/* RESEND TIMER */}
      <View className="items-center">
        {timer > 0 ? (
          <Text className="text-sm text-slate-400 font-medium">
            Resend code in{' '}
            <Text className="text-[#6347F9] font-bold">
              0:{timer < 10 ? `0${timer}` : timer}
            </Text>
          </Text>
        ) : (
          <Pressable onPress={() => setTimer(30)}>
            <Text className="text-sm text-[#6347F9] font-bold">Resend OTP</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
