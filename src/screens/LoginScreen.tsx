import React, { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { X } from 'lucide-react-native';
import LoadingSpinner from '../components/LoadingSpinner';

import { supabase } from '../utils/supabase';
import { NEXT_PUBLIC_SUPABASE_URL as SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as SUPABASE_ANON_KEY } from '@env';
import OnboardingCarousel from '../components/OnboardingCarousel';
import RoleSelection from '../components/RoleSelection';
import InstagramConnect from '../components/InstagramConnect';
import SignUpForm from '../components/SignUpForm';
import BrandSignUpForm from '../components/BrandSignUpForm';
import CategorySelection from '../components/CategorySelection';
import Preferences from '../components/Preferences';

interface InstaProfile {
  username: string;
  profilePictureUrl?: string;
  followersCount?: number;
  followsCount?: number;
  mediaCount?: number;
  accessToken?: string;
  tokenExpiresAt?: string;
}

export default function LoginScreen() {
  const navigation = useNavigation();

  // --- UI & FLOW STATE ---
  // signin steps: 1=role, 2=instagram connect (auto-login)
  // signup steps: 1=role, 2=instagram connect, 3=profile form, 4=categories, 5=preferences
  const [flow, setFlow] = useState<'onboarding' | 'signin' | 'signup'>(
    'onboarding',
  );
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');

  // --- AUTH STATE ---
  const [phone, setPhone] = useState('');
  const [pendingSession, setPendingSession] = useState<any>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  // --- INSTAGRAM STATE ---
  const [instaProfile, setInstaProfile] = useState<InstaProfile | null>(null);

  // --- INVITATION STATE ---
  const [invitation, setInvitation] = useState<any>(null);

  // --- SIGNUP DATA ---
  const [signupData, setSignupData] = useState({
    role: null as 'brand' | 'influencer' | null,
    name: '',
    categories: [] as string[],
    services: [] as string[],
  });

  // --- NAVIGATION ---
  const switchToSignIn = () => {
    setFlow('signin');
    setStep(1);
    setError('');
  };

  const switchToSignUp = () => {
    setFlow('signup');
    setStep(1);
    setError('');
  };

  const nextStep = () => setStep(s => s + 1);

  const closeAuth = () => {
    setFlow('onboarding');
    setStep(1);
    setError('');
    setPhone('');
    setInstaProfile(null);
  };

  // --- SHARED: Send OTP via WhatsApp ---
  const sendOtp = async (phoneNumber: string) => {
    const rawDigits = phoneNumber.replace(/\D/g, '');
    const formattedPhone = rawDigits.startsWith('91')
      ? rawDigits
      : `91${rawDigits}`;

    const { data, error: funcError } = await supabase.functions.invoke(
      'whatsapp-otp-sender',
      {
        body: {
          phone: formattedPhone,
          role: signupData.role || 'influencer',
        },
      },
    );

    if (funcError) throw new Error(funcError.message);
    if (data?.error) throw new Error(data.error);

    setPhone(`+${formattedPhone}`);
  };

  // --- SHARED: Verify OTP & create session ---
  const verifyOtp = async (phoneNumber: string, otpCode: string) => {
    const rawDigits = phoneNumber.replace(/\D/g, '');
    const fullPhone = `+${rawDigits.startsWith('91') ? rawDigits : `91${rawDigits}`}`;

    const { data, error: authError } = await supabase.functions.invoke(
      'whatsapp-otp-verifier',
      { body: { phone: fullPhone, otp: otpCode } },
    );

    if (authError) throw new Error(authError.message);
    if (data?.error) throw new Error(data.error);

    setPendingSession(data.session);
    setAuthUserId(data.user.id);
    return data;
  };

  // ========================
  // SIGN IN FLOW HANDLERS
  // ========================

  const handleSignInRoleSelected = (selectedRole: 'brand' | 'influencer') => {
    setSignupData(prev => ({ ...prev, role: selectedRole }));
    nextStep(); // -> step 2 (Instagram connect)
  };

  const handleSignInInstagramConnect = async (profile: InstaProfile) => {
    setLoading(true);
    setLoadingMsg('Signing in...');
    setError('');
    try {
      setInstaProfile(profile);

      // Look up existing user by Instagram username
      const res = await fetch(`${SUPABASE_URL}/functions/v1/instagram-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          instagramUsername: profile.username,
          role: signupData.role,
        }),
      });

      const data = await res.json();

      if (data?.success && data?.session) {
        // Existing user found - apply session and navigate
        setLoadingMsg('Setting up your session...');
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        navigation.navigate(
          signupData.role === 'brand'
            ? ('BrandHome' as never)
            : ('InfluencerHome' as never),
        );
        return;
      }

      if (data?.error === 'invitation_found') {
        // Admin pre-registered - go to signup with pre-filled data
        setInvitation(data.invitation);
        setSignupData(prev => ({
          ...prev,
          name: data.invitation.full_name || data.invitation.brand_name || '',
        }));
        setFlow('signup');
        setStep(3);
        setError('');
        setLoading(false);
        return;
      }

      if (data?.error === 'wrong_role') {
        setError(data.message);
        setLoading(false);
        return;
      }

      if (data?.error === 'not_found') {
        // No account - switch to signup flow, skip to profile form (step 3)
        setFlow('signup');
        setStep(3);
        setError('');
        setLoading(false);
        return;
      }

      throw new Error(data?.message || 'Login failed');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Instagram');
      setLoading(false);
    }
  };

  // ========================
  // SIGN UP FLOW HANDLERS
  // ========================

  const handleSignUpRoleSelected = (selectedRole: 'brand' | 'influencer') => {
    setSignupData(prev => ({ ...prev, role: selectedRole }));
    nextStep(); // -> step 2 (Instagram connect)
  };

  const handleSignUpInstagramConnect = (profile: InstaProfile) => {
    // Refuse to advance past the Instagram step without a usable profile.
    // The InstagramConnect component already guards against this, but a
    // second check here means the row can never land with a token-only
    // half-state that breaks the next sign-in.
    if (!profile?.username) {
      setError(
        "Instagram didn't return your username. Please reconnect Instagram before continuing.",
      );
      return;
    }
    setInstaProfile(profile);
    nextStep(); // -> step 3 (profile form)
  };

  const handleSignUpFormSubmit = async (formData: any) => {
    setSignupData(prev => ({ ...prev, ...formData }));
    setLoading(true);
    setLoadingMsg('Creating your account...');
    setError('');

    try {
      const userId = authUserId;
      if (!userId)
        throw new Error('No user found. Please verify your phone number.');

      const storagePhone = phone.replace(/\D/g, '').slice(-10);
      const table =
        signupData.role === 'brand' ? 'brand_profiles' : 'influencer_profiles';

      const createBody: any = {
        userId,
        table,
        phone: storagePhone,
        name: formData.name || signupData.name,
        gstinData: formData.gstinData || null,
        invitationId: invitation?.id || null,
      };

      // Add Instagram data if available
      if (instaProfile) {
        createBody.username = instaProfile.username || '';
        createBody.instagram = instaProfile.username || '';
        createBody.profilePictureUrl = instaProfile.profilePictureUrl || '';
        createBody.followersCount = instaProfile.followersCount || 0;
        createBody.followsCount = instaProfile.followsCount || 0;
        createBody.mediaCount = instaProfile.mediaCount || 0;
        createBody.instagramAccessToken = instaProfile.accessToken || '';
        createBody.instagramTokenExpiresAt = instaProfile.tokenExpiresAt || '';
      }

      const { data: createResult, error: createError } =
        await supabase.functions.invoke('create-profile', {
          body: createBody,
        });

      if (createError) throw new Error(createError.message);
      if (createResult?.error) throw new Error(createResult.error);

      if (pendingSession) {
        setLoadingMsg('Setting up your session...');
        await supabase.auth.setSession({
          access_token: pendingSession.access_token,
          refresh_token: pendingSession.refresh_token,
        });
      }

      if (signupData.role === 'brand') {
        // Brands go straight to dashboard
        setLoadingMsg('Redirecting to dashboard...');
        navigation.navigate('BrandHome' as never);
        return;
      }

      setLoading(false);
      nextStep(); // -> step 4 (categories)
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
      setLoading(false);
    }
  };

  const handleCategorySelection = (selectedCategories: string[]) => {
    setSignupData(prev => ({ ...prev, categories: selectedCategories }));
    nextStep(); // -> step 5 (preferences/services)
  };

  const handlePreferences = async (preferencesData: { services: string[] }) => {
    setSignupData(prev => ({ ...prev, ...preferencesData }));
    await finishSignup({ ...signupData, ...preferencesData });
  };

  const handleSkip = async () => {
    await finishSignup(signupData);
  };

  const finishSignup = async (data: any) => {
    setLoading(true);
    setLoadingMsg('Saving your preferences...');
    try {
      if (authUserId) {
        const table =
          data.role === 'brand' ? 'brand_profiles' : 'influencer_profiles';
        await supabase.functions.invoke('update-profile', {
          body: {
            userId: authUserId,
            table,
            categories: data.categories || [],
            services: data.services || [],
          },
        });
      }

      if (pendingSession) {
        setLoadingMsg('Setting up your session...');
        await supabase.auth.setSession({
          access_token: pendingSession.access_token,
          refresh_token: pendingSession.refresh_token,
        });
      }

      navigation.navigate(
        data.role === 'brand'
          ? ('BrandHome' as never)
          : ('InfluencerHome' as never),
      );
    } catch (err: any) {
      setError(err.message || 'Failed to complete signup');
      setLoading(false);
    }
  };

  // ========================
  // RENDER
  // ========================

  return (
    <View className="flex-1 bg-[#0F0F1A]">
      {/* Background Carousel */}
      <OnboardingCarousel
        onLoginClick={switchToSignIn}
        onSignUpClick={switchToSignUp}
      />

      {/* Overlay when auth is open */}
      {flow !== 'onboarding' && (
        <Pressable
          className="absolute inset-0 bg-[#ff92ca]/70"
          onPress={closeAuth}
        />
      )}

      {/* Auth Drawer */}
      {flow !== 'onboarding' && (
        <View className="absolute bottom-0 w-full bg-white rounded-t-[40px] overflow-hidden">
          {/* Loading Overlay */}
          {loading && <LoadingSpinner message={loadingMsg} />}

          {/* Header with close & drag indicator */}
          <View className="relative items-center px-8 pt-6 pb-2">
            <View className="w-12 h-1 bg-slate-200 rounded-full mb-4" />
            <Pressable
              onPress={closeAuth}
              className="absolute right-6 top-6 p-2 rounded-full"
              hitSlop={8}
            >
              <X size={24} color="#64748B" />
            </Pressable>
          </View>

          {/* Content */}
          <View className="px-8 pb-12">
            {/* ===== SIGN IN FLOW ===== */}
            {flow === 'signin' && (
              <>
                {step === 1 && (
                  <RoleSelection
                    onNext={handleSignInRoleSelected}
                    mode="signin"
                    onSwitchMode={switchToSignUp}
                  />
                )}
                {step === 2 && (
                  <InstagramConnect
                    onNext={handleSignInInstagramConnect}
                    mode="signin"
                    role={signupData.role || 'influencer'}
                    loading={loading}
                    error={error}
                  />
                )}
              </>
            )}

            {/* ===== SIGN UP FLOW ===== */}
            {flow === 'signup' && (
              <>
                {step === 1 && (
                  <RoleSelection
                    onNext={handleSignUpRoleSelected}
                    mode="signup"
                    onSwitchMode={switchToSignIn}
                  />
                )}
                {step === 2 && (
                  <InstagramConnect
                    onNext={handleSignUpInstagramConnect}
                    mode="signup"
                    role={signupData.role || 'influencer'}
                  />
                )}
                {step === 3 && signupData.role === 'brand' && (
                  <BrandSignUpForm
                    onSubmit={handleSignUpFormSubmit}
                    onSendOtp={sendOtp}
                    onResendOtp={sendOtp}
                    onVerifyOtp={verifyOtp}
                    loading={loading}
                    error={error}
                    initialPhone={
                      phone ? phone.replace(/\D/g, '').slice(-10) : ''
                    }
                    otpPreVerified={!!authUserId}
                    instagramProfile={instaProfile}
                    invitation={invitation}
                  />
                )}
                {step === 3 && signupData.role !== 'brand' && (
                  <SignUpForm
                    onSubmit={handleSignUpFormSubmit}
                    onSendOtp={sendOtp}
                    onResendOtp={sendOtp}
                    onVerifyOtp={verifyOtp}
                    loading={loading}
                    error={error}
                    role={signupData.role || 'influencer'}
                    initialPhone={
                      phone ? phone.replace(/\D/g, '').slice(-10) : ''
                    }
                    otpPreVerified={!!authUserId}
                    instagramProfile={instaProfile}
                    initialName={signupData.name}
                  />
                )}
                {step === 4 && (
                  <CategorySelection
                    onNext={handleCategorySelection}
                    onSkip={handleSkip}
                  />
                )}
                {step === 5 && (
                  <Preferences onNext={handlePreferences} onSkip={handleSkip} />
                )}
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
