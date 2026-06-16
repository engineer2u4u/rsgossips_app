import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { X } from 'lucide-react-native';
import LoadingSpinner from '../components/LoadingSpinner';

import { supabase } from '../utils/supabase';
import { invokeFn, EdgeFunctionError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import OnboardingCarousel from '../components/OnboardingCarousel';
import RoleSelection from '../components/RoleSelection';
import InstagramConnect from '../components/InstagramConnect';
import SignUpForm from '../components/SignUpForm';
import BrandSignUpForm from '../components/BrandSignUpForm';
import CategorySelection from '../components/CategorySelection';
import Preferences from '../components/Preferences';
import SignInPhone from '../components/SignInPhone';
import VerifyOTP from '../components/VerifyOTP';

// "+918743898976" / "8743898976" → "+91 87438 98976"
function formatDisplayPhone(raw: string): string {
  const digits = String(raw || '')
    .replace(/\D/g, '')
    .replace(/^91/, '');
  if (digits.length < 5) return `+91 ${digits}`;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

// verifyOtp throws this when the backend reports a structured error code
// (e.g. "no_user", "wrong_role"). Callers can branch on `.code` instead of
// parsing message strings.
class OtpError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message || code);
    this.code = code;
  }
}

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
  const {user: authedUser, role: authedRole, loading: authLoading} = useAuth();

  // If AuthContext restored a session from AsyncStorage (cold start with a
  // persisted login), redirect past the login UI to the role-appropriate home.
  // navigation.reset (not navigate) so the back button can't return to Login.
  useEffect(() => {
    if (authLoading) return;
    if (!authedUser) return;
    const target = authedRole === 'brand' ? 'BrandHome' : 'InfluencerHome';
    (navigation as any).reset({index: 0, routes: [{name: target}]});
  }, [authLoading, authedUser, authedRole, navigation]);

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
  const [otp, setOtp] = useState('');
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
    setOtp('');
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
  // mode="signin" makes the backend refuse to auto-create a user — sign-in
  // shouldn't silently spin up accounts. Backend returns { error: 'no_user' }
  // when the phone isn't registered and we're in signin mode; we surface that
  // as an OtpError so the caller can switch into sign-up cleanly.
  const verifyOtp = async (
    phoneNumber: string,
    otpCode: string,
    mode: 'signin' | 'signup' = 'signup',
  ) => {
    const rawDigits = phoneNumber.replace(/\D/g, '');
    const fullPhone = `+${rawDigits.startsWith('91') ? rawDigits : `91${rawDigits}`}`;

    const { data, error: authError } = await supabase.functions.invoke(
      'whatsapp-otp-verifier',
      { body: { phone: fullPhone, otp: otpCode, mode } },
    );

    if (authError) throw new Error(authError.message);
    if (data?.error) {
      throw new OtpError(data.error, data.message || data.error);
    }

    setPendingSession(data.session);
    setAuthUserId(data.user.id);
    return data;
  };

  // ========================
  // SIGN IN FLOW HANDLERS
  // ========================
  // Sign-in is mobile-OTP based for both brands and influencers — Instagram
  // is only used for sign-UP. Web parity: commit 9da2224 + 247f99d.
  //
  // Step flow:
  //   1 → role
  //   2 → SignInPhone (calls check-phone-exists, then sends OTP, advances)
  //   3 → VerifyOTP (verifyOtp mode='signin', role-mismatch guard, set session)

  const handleSignInRoleSelected = (selectedRole: 'brand' | 'influencer') => {
    setSignupData(prev => ({ ...prev, role: selectedRole }));
    setError('');
    nextStep(); // -> step 2 (phone entry)
  };

  // Phone pre-check: if this number isn't on file, prompt to sign up instead.
  // If it's registered to the other role, tell the user before burning an OTP.
  // The check-phone-exists edge function also records unknown numbers in
  // public.leads — web commit 247f99d.
  const handleSignInSendOtp = async (phoneNumber: string) => {
    setLoading(true);
    setLoadingMsg('Checking your number…');
    setError('');
    try {
      // invokeFn (vs supabase.functions.invoke) so we get a hard 20s timeout —
      // the supabase-js helper on RN can hang forever on a dropped connection.
      const check = await invokeFn<{
        exists?: boolean;
        match?: boolean;
        role?: string;
        error?: string;
      }>('check-phone-exists', {
        phone: phoneNumber,
        role: signupData.role,
      });

      if (!check?.exists) {
        setError("You don't exist with us. Kindly sign up first.");
        setLoading(false);
        return;
      }

      if (check.match === false) {
        const otherRole = check.role === 'brand' ? 'a Brand' : 'an Influencer';
        setError(
          `This number is registered as ${otherRole}. Please switch role and try again.`,
        );
        setLoading(false);
        return;
      }

      setLoadingMsg('Sending OTP…');
      await sendOtp(phoneNumber);
      setOtp('');
      nextStep(); // -> step 3 (verify)
    } catch (err: any) {
      if (err instanceof EdgeFunctionError) {
        setError(err.message);
      } else {
        setError(err?.message || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignInVerifyOtp = async (otpCode: string) => {
    setLoading(true);
    setLoadingMsg('Verifying…');
    setError('');
    try {
      const data = await verifyOtp(phone, otpCode, 'signin');

      // Role-mismatch defence in depth. The pre-check above catches this in
      // the happy path, but a tampered or stale client could still get here
      // pointed at the wrong role — refuse the sign-in outright instead of
      // landing the user in the wrong dashboard.
      const detectedRole = data?.user?.role;
      const requestedRole = signupData.role;
      if (detectedRole && requestedRole && detectedRole !== requestedRole) {
        const otherRole = detectedRole === 'brand' ? 'a Brand' : 'an Influencer';
        const wanted = requestedRole === 'brand' ? 'a Brand' : 'an Influencer';
        setError(
          `This number is registered as ${otherRole}, not ${wanted}. Please go back and pick the correct role.`,
        );
        setLoading(false);
        return;
      }

      setLoadingMsg('Setting up your session…');
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      const target = (detectedRole || requestedRole) === 'brand'
        ? 'BrandHome'
        : 'InfluencerHome';
      navigation.navigate(target as never);
    } catch (err: any) {
      if (err instanceof OtpError && err.code === 'no_user') {
        // Backend says no account on this phone — bounce to sign-up.
        setError('');
        setFlow('signup');
        setStep(1);
        setLoading(false);
        return;
      }
      setError(err?.message || 'Failed to verify OTP');
      setLoading(false);
      return;
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
        'Instagram didn\'t return your username. Please reconnect Instagram before continuing.',
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

  // Splash while AuthContext is restoring a persisted session — and while we
  // already have a user but the reset() effect above hasn't fired yet. Keeps
  // the carousel from flashing for signed-in users on cold start.
  if (authLoading || authedUser) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0F0F1A',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIndicator size="large" color="#E60076" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0F0F1A]">
      {/* Background Carousel */}
      <OnboardingCarousel
        onLoginClick={switchToSignIn}
        onSignUpClick={switchToSignUp}
      />

      {/* Overlay when auth is open. Non-interactive — the sheet only closes via
          the X button so a stray backdrop tap can't lose typed input or abort
          an in-flight OTP / sign-up. */}
      {flow !== 'onboarding' && (
        <View
          className="absolute inset-0 bg-[#ff92ca]/70"
          pointerEvents="auto"
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
            {/* ===== SIGN IN FLOW (phone-OTP, web parity) ===== */}
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
                  <SignInPhone
                    onNext={handleSignInSendOtp}
                    loading={loading}
                    error={error}
                    phone={phone}
                    setPhone={setPhone}
                    mode="signin"
                    role={signupData.role || 'influencer'}
                  />
                )}
                {step === 3 && (
                  <VerifyOTP
                    onNext={handleSignInVerifyOtp}
                    onResend={() => sendOtp(phone)}
                    loading={loading}
                    error={error}
                    otp={otp}
                    setOtp={setOtp}
                    phoneNumber={formatDisplayPhone(phone)}
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
