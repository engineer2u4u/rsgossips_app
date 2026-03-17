import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../utils/supabase';
import OnboardingCarousel from '../components/OnboardingCarousel';
import RoleSelection from '../components/RoleSelection';
import SignInPhone from '../components/SignInPhone';
import VerifyOTP from '../components/VerifyOTP';
import ProfileDetails from '../components/ProfileDetails';
import CategorySelection from '../components/CategorySelection';
import Preferences from '../components/Preferences';
import Notifications from '../components/Notifications';
import SuccessScreen from '../components/SuccessScreen';

export default function LoginScreen() {
  const navigation = useNavigation();

  const [flow, setFlow] = useState<'onboarding' | 'signin' | 'signup'>(
    'onboarding',
  );
  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const [signupData, setSignupData] = useState({
    role: null as 'brand' | 'influencer' | null,
    name: '',
    username: '',
    niche: '',
    location: '',
    instagram: '',
    youtube: '',
    categories: [] as string[],
    services: [] as string[],
    rateRange: '',
    notificationsEnabled: false,
  });

  const nextStep = () => setStep(s => s + 1);

  const goToSignIn = () => {
    setFlow('signin');
    setStep(1);
    setErrorMsg('');
  };

  const goToSignUp = () => {
    setFlow('signup');
    setStep(1);
    setErrorMsg('');
  };

  /* -------------------------
     PHONE LOGIN
  --------------------------*/

  const handlePhoneSignIn = async (phoneNumber: string) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const rawDigits = phoneNumber.replace(/\D/g, '');

      if (rawDigits.length < 10) {
        setErrorMsg('Invalid phone number');
        setLoading(false);
        return;
      }

      const formattedPhone = rawDigits.startsWith('91')
        ? `+${rawDigits}`
        : `+91${rawDigits}`;

      setPhone(formattedPhone);

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      nextStep();
    } catch (err: any) {
      setErrorMsg(err.message);
    }

    setLoading(false);
  };

  /* -------------------------
     VERIFY OTP
  --------------------------*/

  const handleVerifyOTP = async (otpCode: string) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otpCode,
        type: 'sms',
      });

      if (error) throw error;

      if (flow === 'signin') {
        const { data: influencer } = await supabase
          .from('influencers')
          .select('id')
          .eq('id', data.user.id)
          .single();

        const { data: brand } = await supabase
          .from('brands')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (influencer || brand) {
          navigation.navigate('BrandHome' as never);
        } else {
          setFlow('signup');
          setStep(4);
        }
      } else {
        nextStep();
      }
    } catch {
      setErrorMsg('Invalid OTP');
    }

    setLoading(false);
  };

  /* -------------------------
     FINAL SAVE
  --------------------------*/

  const handleSuccessAndSaveToDb = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('User not found');

      const table = signupData.role === 'brand' ? 'brands' : 'influencers';

      const { error } = await supabase.from(table).upsert({
        id: user.id,
        phone,
        name: signupData.name,
        username: signupData.username,
        niche: signupData.niche,
        categories: signupData.categories,
      });

      if (error) throw error;

      navigation.navigate('BrandHome' as never);
    } catch (err: any) {
      setErrorMsg(err.message);
    }

    setLoading(false);
  };

  /* -------------------------
     UI
  --------------------------*/

  return (
    <View className="flex-1 bg-[#0F0F1A]">
      {/* Background */}
      <OnboardingCarousel
        onLoginClick={goToSignIn}
        onSignUpClick={goToSignUp}
      />

      {/* Overlay */}
      {flow !== 'onboarding' && (
        <Pressable
          className="absolute inset-0 bg-black/40"
          onPress={() => {
            setFlow('onboarding');
            setStep(1);
            setErrorMsg('');
          }}
        />
      )}

      {/* Bottom Drawer */}
      {flow !== 'onboarding' && (
        <View className="absolute bottom-0 w-full bg-white rounded-t-[40px] px-6 pt-6 pb-10">
          {flow === 'signin' && (
            <>
              {step === 1 && (
                <RoleSelection
                  onNext={role => {
                    setSignupData(prev => ({ ...prev, role }));
                    nextStep();
                  }}
                />
              )}

              {step === 2 && (
                <SignInPhone
                  onNext={handlePhoneSignIn}
                  loading={loading}
                  error={errorMsg}
                  phone={phone}
                  setPhone={setPhone}
                />
              )}

              {step === 3 && (
                <VerifyOTP
                  onNext={handleVerifyOTP}
                  loading={loading}
                  error={errorMsg}
                  otp={otp}
                  setOtp={setOtp}
                  phoneNumber={phone}
                />
              )}
            </>
          )}

          {flow === 'signup' && (
            <>
              {step === 1 && (
                <RoleSelection
                  onNext={role => {
                    setSignupData(prev => ({ ...prev, role }));
                    nextStep();
                  }}
                />
              )}

              {step === 2 && (
                <SignInPhone
                  onNext={handlePhoneSignIn}
                  loading={loading}
                  error={errorMsg}
                  phone={phone}
                  setPhone={setPhone}
                />
              )}

              {step === 3 && (
                <VerifyOTP
                  onNext={handleVerifyOTP}
                  loading={loading}
                  error={errorMsg}
                  otp={otp}
                  setOtp={setOtp}
                  phoneNumber={phone}
                />
              )}

              {step === 4 && (
                <ProfileDetails
                  onNext={data => {
                    setSignupData(prev => ({ ...prev, ...data }));
                    nextStep();
                  }}
                />
              )}

              {step === 5 && (
                <CategorySelection
                  onNext={categories => {
                    setSignupData(prev => ({ ...prev, categories }));
                    nextStep();
                  }}
                />
              )}

              {step === 6 && (
                <Preferences
                  onNext={data => {
                    setSignupData(prev => ({ ...prev, ...data }));
                    nextStep();
                  }}
                />
              )}

              {step === 7 && (
                <Notifications
                  onNext={enabled => {
                    setSignupData(prev => ({
                      ...prev,
                      notificationsEnabled: enabled,
                    }));
                    nextStep();
                  }}
                />
              )}

              {step === 8 && (
                <SuccessScreen
                  onNext={handleSuccessAndSaveToDb}
                  loading={loading}
                />
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}
