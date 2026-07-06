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
import {
  User,
  CheckCircle2,
  Building2,
  MapPin,
  BadgeCheck,
  Check,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {supabase} from '../utils/supabase';
import {classifyGstPan} from '../lib/brandProfile';

interface InstaProfile {
  username: string;
  profilePictureUrl?: string;
}

interface GstinData {
  gstStatus: string;
  tradeName: string;
  legalName: string;
  address: string;
  businessType: string;
  registrationDate: string;
}

interface Invitation {
  id: string;
  brand_name?: string;
  full_name?: string;
  logo_url?: string;
}

interface Props {
  onSubmit: (data: {
    name: string;
    phone: string;
    gstin: string;
    gstinData: GstinData;
  }) => void;
  onSendOtp: (phone: string) => Promise<void>;
  onResendOtp: (phone: string) => Promise<void>;
  onVerifyOtp: (phone: string, otp: string) => Promise<void>;
  loading?: boolean;
  error?: string;
  initialPhone?: string;
  otpPreVerified?: boolean;
  instagramProfile?: InstaProfile | null;
  invitation?: Invitation | null;
}

export default function BrandSignUpForm({
  onSubmit,
  onSendOtp,
  onResendOtp,
  onVerifyOtp,
  loading = false,
  error = '',
  initialPhone = '',
  otpPreVerified = false,
  instagramProfile = null,
  invitation = null,
}: Props) {
  const [formData, setFormData] = useState({
    name: invitation?.brand_name || invitation?.full_name || '',
    phone: initialPhone,
    gstin: '',
  });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(otpPreVerified);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [localError, setLocalError] = useState('');
  const [consentAgreed, setConsentAgreed] = useState(false);

  // GSTIN state — GST/PAN is OPTIONAL at signup (matches web).
  // Influencers can verify it later from Profile to boost trust score.
  const [gstinLoading, setGstinLoading] = useState(false);
  const [gstinData, setGstinData] = useState<GstinData | null>(null);
  const [gstinError, setGstinError] = useState('');

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

  const handleGstinChange = (value: string) => {
    const cleaned = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 15);
    setFormData(prev => ({...prev, gstin: cleaned}));
    if (gstinData) {
      setGstinData(null);
      setGstinError('');
    }
  };

  // --- GSTIN Verification ---
  const handleVerifyGstin = async () => {
    if (formData.gstin.length !== 15) return;
    setGstinLoading(true);
    setGstinError('');
    try {
      const {data, error: funcError} = await supabase.functions.invoke(
        'verify-gstin',
        {body: {gstin: formData.gstin}},
      );

      if (funcError) throw new Error(funcError.message);
      if (data?.error) throw new Error(data.error);

      if (!data?.verified) {
        setGstinError('GSTIN not found or inactive');
        return;
      }

      if (data.data.gstStatus !== 'Active') {
        setGstinError(
          `GSTIN status: ${data.data.gstStatus}. Only active GSTINs are allowed.`,
        );
        return;
      }

      // Check GSTIN uniqueness
      const {data: uniqueCheck} = await supabase.functions.invoke(
        'check-uniqueness',
        {body: {gstin: formData.gstin}},
      );
      if (uniqueCheck?.conflicts?.includes('gstin')) {
        setGstinError(
          'This GSTIN is already registered with another account.',
        );
        return;
      }

      setGstinData(data.data);
    } catch (err: any) {
      setGstinError(err.message || 'Failed to verify GSTIN');
    } finally {
      setGstinLoading(false);
    }
  };

  // --- Phone OTP ---
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
        setLocalError(
          'This phone number is already registered. Please sign in instead.',
        );
        setOtpLoading(false);
        return;
      }
      await onSendOtp(formData.phone);
      setOtpSent(true);
      setTimer(60);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to send OTP');
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
  // in the previous slot. Mirrors the fix in VerifyOTP / SignUpForm.
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
      setLocalError(err.message || 'Invalid OTP');
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
      setLocalError(err.message || 'Failed to resend OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setLocalError('Please enter your full name');
      return;
    }
    // GST/PAN is optional. If something was entered, validate the format
    // even if the user didn't click "Verify" against the live GSTN lookup.
    if (formData.gstin && !gstinData) {
      const {valid, kind} = classifyGstPan(formData.gstin);
      if (!valid) {
        setGstinError(
          kind === 'pan'
            ? 'PAN should be 10 chars: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).'
            : kind === 'gst'
              ? 'GST should be 15 chars (e.g. 22AAAAA0000A1Z5).'
              : 'Enter a valid GST (15 chars) or PAN (10 chars), or leave blank.',
        );
        return;
      }
    }
    if (!otpVerified) {
      setLocalError('Please verify your phone number');
      return;
    }
    if (!consentAgreed) {
      setLocalError('Please accept the Brand Consent Policy to continue');
      return;
    }
    onSubmit({...formData, gstin: formData.gstin || '', gstinData: gstinData as any});
  };

  const displayError = error || localError;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="space-y-5 px-1">
        {/* Header */}
        <View className="items-center space-y-2">
          <Text className="text-2xl font-bold text-slate-900">
            {invitation ? 'Complete Your Profile' : 'Register Brand'}
          </Text>
          <Text className="text-sm text-slate-500 text-center">
            {invitation
              ? 'Your brand has been pre-registered. Verify your details to get started.'
              : 'Verify your business to start collaborating'}
          </Text>
        </View>

        {/* Admin Invitation Banner */}
        {invitation && (
          <View className="p-4 rounded-2xl border border-purple-200 bg-purple-50 flex-row items-center gap-3">
            {invitation.logo_url ? (
              <Image
                source={{uri: invitation.logo_url}}
                className="w-12 h-12 rounded-xl"
                style={{borderWidth: 2, borderColor: 'white'}}
              />
            ) : (
              <View
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{backgroundColor: '#9810FA'}}>
                <Text className="text-white font-bold text-lg">
                  {invitation.brand_name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900">
                {invitation.brand_name}
              </Text>
              <Text className="text-[11px] text-purple-600 font-medium">
                Pre-registered by RecentGossips
              </Text>
            </View>
            <BadgeCheck size={20} color="#9810FA" />
          </View>
        )}

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
                Instagram connected
              </Text>
            </View>
            <CheckCircle2 size={18} color="#22C55E" />
          </View>
        )}

        {/* Contact Name */}
        <View className="space-y-1.5">
          <Text className="text-xs font-semibold text-slate-500 ml-1">
            Contact Person Name
          </Text>
          <View className="flex-row items-center border border-slate-200 rounded-xl px-4 h-12">
            <User size={18} color="rgba(99,71,249,0.6)" />
            <TextInput
              placeholder="Your full name"
              value={formData.name}
              onChangeText={v => setFormData(prev => ({...prev, name: v}))}
              className="flex-1 ml-3 text-base"
            />
          </View>
        </View>

        {/* GST / PAN — OPTIONAL (matches web; boosts trust score later). */}
        <View className="space-y-1.5">
          <Text className="text-xs font-semibold text-slate-500 ml-1">
            GST / PAN{' '}
            <Text className="text-slate-300 font-normal">(optional)</Text>
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1 flex-row items-center border border-slate-200 rounded-xl px-4 h-12">
              <Building2 size={18} color="rgba(99,71,249,0.6)" />
              <TextInput
                placeholder="GST (15) or PAN (10) — e.g. ABCDE1234F"
                value={formData.gstin}
                onChangeText={handleGstinChange}
                editable={!gstinData}
                maxLength={15}
                autoCapitalize="characters"
                className="flex-1 ml-3 text-base font-mono tracking-wider"
              />
            </View>

            {!gstinData && formData.gstin.length === 15 && (
              <Pressable
                onPress={handleVerifyGstin}
                disabled={gstinLoading}
                className="h-12 px-4 rounded-xl items-center justify-center bg-[#9810FA]">
                {gstinLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white text-sm font-semibold">
                    Verify
                  </Text>
                )}
              </Pressable>
            )}

            {gstinData && (
              <View className="h-12 px-3 items-center justify-center">
                <CheckCircle2 size={22} color="#22C55E" />
              </View>
            )}
          </View>

          {gstinError ? (
            <Text className="text-xs text-red-500 ml-1">{gstinError}</Text>
          ) : (
            <Text className="text-[11px] text-slate-400 ml-1">
              Helps boost your trust score; you can add it later in Profile.
            </Text>
          )}

          {/* GSTIN Verified Details Card */}
          {gstinData && (
            <View className="p-3 rounded-xl bg-green-50 border border-green-200 space-y-2">
              <View className="flex-row items-center gap-2">
                <BadgeCheck size={16} color="#16A34A" />
                <Text className="text-xs font-bold text-green-700">
                  GSTIN Verified
                </Text>
                <View className="ml-auto px-2 py-0.5 bg-green-100 rounded-full">
                  <Text className="text-[10px] font-bold text-green-700">
                    {gstinData.gstStatus}
                  </Text>
                </View>
              </View>

              <View className="space-y-1">
                <Text className="text-sm font-semibold text-slate-800">
                  {gstinData.tradeName || gstinData.legalName}
                </Text>
                {gstinData.tradeName &&
                  gstinData.legalName !== gstinData.tradeName && (
                    <Text className="text-[11px] text-slate-500">
                      Legal: {gstinData.legalName}
                    </Text>
                  )}
                <View className="flex-row items-start gap-1">
                  <MapPin size={12} color="#94A3B8" style={{marginTop: 2}} />
                  <Text className="text-[11px] text-slate-500 flex-1">
                    {gstinData.address}
                  </Text>
                </View>
                <Text className="text-[11px] text-slate-400">
                  {gstinData.businessType} · Regd: {gstinData.registrationDate}
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  setGstinData(null);
                  setFormData(prev => ({...prev, gstin: ''}));
                }}>
                <Text className="text-[11px] text-red-400 font-semibold">
                  Change GSTIN
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Phone + OTP */}
        <View className="space-y-1.5">
          <Text className="text-xs font-semibold text-slate-500 ml-1">
            Mobile Number
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
                placeholder="Enter phone number"
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
                    Send OTP
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
                  Your OTP just slid into WhatsApp — say hi to{' '}
                  <Text className="font-bold">Rgossips Media</Text>!
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
                    Verify
                  </Text>
                </Pressable>

                {timer > 0 ? (
                  <Text className="text-xs text-slate-400">
                    Resend in{' '}
                    <Text className="text-[#6347F9] font-bold">
                      {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                    </Text>
                  </Text>
                ) : (
                  <Pressable onPress={handleResend}>
                    <Text className="text-xs text-[#6347F9] font-bold">
                      Resend OTP
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
            I have read and agree to the{' '}
            <Text
              className="text-[#6347F9] font-bold"
              onPress={() =>
                (navigation as any).navigate('ConsentPolicy', {role: 'brand'})
              }>
              Brand Consent Policy
            </Text>
            , Terms of Service, Privacy Policy and Community Guidelines of
            Recent Gossips, on behalf of the Brand I represent.
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
                Creating account...
              </Text>
            </>
          ) : (
            <Text
              className={`text-base font-semibold ${
                !formData.name || !otpVerified || !consentAgreed
                  ? 'text-slate-400'
                  : 'text-white'
              }`}>
              Create Brand Account
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
