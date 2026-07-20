import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Mail, X } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
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

type LoginRouteParams = { invited?: string; ref?: string };

export default function LoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ Login: LoginRouteParams }, 'Login'>>();
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

  // --- INVITATION DEEP LINK (?invited=<handle>) ---
  // Tapping the admin email link opens the app at this screen with
  // route.params.invited set to the brand/influencer Instagram handle.
  // We resolve it via lookup-invitation, auto-set role + name, and jump
  // straight to the Instagram OAuth step. No skip — IG is mandatory.
  useEffect(() => {
    const handle = (route.params?.invited || '').trim();
    if (!handle) return;
    let cancelled = false;
    (async () => {
      setInvitationChecking(true);
      try {
        const data = await invokeFn<{
          found?: boolean;
          role?: 'brand' | 'influencer';
          status?: string;
          invitation?: {
            id: string;
            name: string;
            instagram_username: string;
            logo_url: string;
          };
        }>('lookup-invitation', { token: handle });
        if (cancelled) return;

        if (!data?.found) {
          setInvitationBlock({
            kind: 'invalid',
            title: t('ScreensLoginScreen.invitationNotRecognisedTitle'),
            message: t('ScreensLoginScreen.invitationNotRecognisedMessage', { handle }),
          });
          setFlow('signup');
          return;
        }
        if (data.status && data.status !== 'pending') {
          setInvitationBlock({
            kind: 'claimed',
            title: t('ScreensLoginScreen.invitationClaimedTitle'),
            message: t('ScreensLoginScreen.invitationClaimedMessage', { handle }),
          });
          setFlow('signin');
          return;
        }

        const inv = data.invitation!;
        setInvitation({
          id: inv.id,
          instagramHandle: (inv.instagram_username || handle).toLowerCase(),
        });
        setSignupData(prev => ({
          ...prev,
          role: data.role || prev.role,
          name: inv.name || prev.name,
        }));
        setFlow('signup');
        setStep(2); // → InstagramConnect (mandatory)
      } catch (e: any) {
        if (cancelled) return;
        setInvitationBlock({
          kind: 'error',
          title: t('ScreensLoginScreen.invitationVerifyErrorTitle'),
          message: e?.message || t('ScreensLoginScreen.invitationVerifyErrorMessage'),
        });
        setFlow('signup');
      } finally {
        if (!cancelled) setInvitationChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [route.params?.invited]);

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
  // Set by the ?invited=<handle> deep-link lookup. `instagramHandle` is
  // the expected IG handle from the invitation row — used to enforce the
  // anti-fraud check during OAuth.
  const [invitation, setInvitation] = useState<{
    id: string;
    instagramHandle: string;
  } | null>(null);
  const [invitationBlock, setInvitationBlock] = useState<{
    kind: 'use-link' | 'claimed' | 'invalid' | 'error';
    title: string;
    message: string;
    inviteHandle?: string;
  } | null>(null);
  const [invitationChecking, setInvitationChecking] = useState(false);

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
    // Length-based, NOT startsWith('91') — Indian mobiles can legitimately
    // begin with 91 (e.g. 91136…); the old check skipped the country code
    // for them and the backend then couldn't match the verification proof.
    const formattedPhone = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;

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

  // Resend from the sign-in verify step. The bare `() => sendOtp(phone)`
  // this replaces swallowed rejections — when the backend refused with
  // "Too many OTP requests for this number. Try again in an hour." the
  // user saw nothing. Surface the failure through the shared error state.
  const handleResendOtp = async (phoneNumber: string) => {
    setError('');
    try {
      await sendOtp(phoneNumber);
    } catch (err: any) {
      setError(err?.message || t('ScreensLoginScreen.failedResendOtp'));
    }
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
    // Same length-based rule as sendOtp (see comment there).
    const fullPhone = `+${rawDigits.length === 10 ? `91${rawDigits}` : rawDigits}`;

    const { data, error: authError } = await supabase.functions.invoke(
      'whatsapp-otp-verifier',
      { body: { phone: fullPhone, otp: otpCode, mode } },
    );

    if (authError) throw new Error(authError.message);
    if (data?.error) {
      throw new OtpError(data.error, data.message || data.error);
    }

    // Sign-up (Option A): the verifier only PROVES phone ownership now — no
    // auth user, no session yet. create-profile mints both atomically at
    // form submit. Nothing to stash here.
    if (mode === 'signup') {
      return data; // { success, phoneVerified, phone }
    }

    // Sign-in: verifier still returns a live session + user.
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
    setLoadingMsg(t('ScreensLoginScreen.checkingYourNumber'));
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
        setError(t('ScreensLoginScreen.doesNotExist'));
        setLoading(false);
        return;
      }

      if (check.match === false) {
        const otherRole = check.role === 'brand'
          ? t('ScreensLoginScreen.roleBrand')
          : t('ScreensLoginScreen.roleInfluencer');
        setError(
          t('ScreensLoginScreen.registeredAsOtherRole', { role: otherRole }),
        );
        setLoading(false);
        return;
      }

      setLoadingMsg(t('ScreensLoginScreen.sendingOtp'));
      await sendOtp(phoneNumber);
      setOtp('');
      nextStep(); // -> step 3 (verify)
    } catch (err: any) {
      if (err instanceof EdgeFunctionError) {
        setError(err.message);
      } else {
        setError(err?.message || t('ScreensLoginScreen.failedSendOtp'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignInVerifyOtp = async (otpCode: string) => {
    setLoading(true);
    setLoadingMsg(t('ScreensLoginScreen.verifying'));
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
        const otherRole = detectedRole === 'brand'
          ? t('ScreensLoginScreen.roleBrand')
          : t('ScreensLoginScreen.roleInfluencer');
        const wanted = requestedRole === 'brand'
          ? t('ScreensLoginScreen.roleBrand')
          : t('ScreensLoginScreen.roleInfluencer');
        setError(
          t('ScreensLoginScreen.registeredAsOtherRoleMismatch', { role: otherRole, wanted }),
        );
        setLoading(false);
        return;
      }

      setLoadingMsg(t('ScreensLoginScreen.settingUpSession'));
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      const target = (detectedRole || requestedRole) === 'brand'
        ? 'BrandHome'
        : 'InfluencerHome';
      // reset (not navigate) — clears the auth stack so swipe-back can't
      // surface a stale BrandHome / InfluencerHome from a prior session.
      (navigation as any).reset({index: 0, routes: [{name: target}]});
    } catch (err: any) {
      if (err instanceof OtpError && err.code === 'no_user') {
        // Backend says no account on this phone — bounce to sign-up.
        setError('');
        setFlow('signup');
        setStep(1);
        setLoading(false);
        return;
      }
      setError(err?.message || t('ScreensLoginScreen.failedVerifyOtp'));
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

  const handleSignUpInstagramConnect = async (profile: InstaProfile) => {
    // Refuse to advance past the Instagram step without a usable profile.
    // The InstagramConnect component already guards against this, but a
    // second check here means the row can never land with a token-only
    // half-state that breaks the next sign-in.
    if (!profile?.username) {
      setError(t('ScreensLoginScreen.instagramNoUsername'));
      return;
    }

    // Invitation flow: the user proved invitation ownership by tapping
    // the email link. Verify the OAuth'd handle matches the invitation
    // (case-insensitive) — prevents claiming a brand invitation with a
    // personal IG account by accident.
    if (invitation?.instagramHandle) {
      const oauthHandle = profile.username.toLowerCase();
      if (oauthHandle !== invitation.instagramHandle) {
        setError(
          t('ScreensLoginScreen.invitationHandleMismatch', {
            expected: invitation.instagramHandle,
            actual: profile.username,
          }),
        );
        return;
      }
      setInstaProfile(profile);
      nextStep();
      return;
    }

    // Non-invitation signup: if the OAuth'd handle matches a pending
    // invitation we don't know about (user signed up directly instead of
    // via the email link), bounce them to a "Use your invitation link"
    // screen so they don't end up with a duplicate account.
    try {
      const data = await invokeFn<{
        found?: boolean;
        status?: string;
      }>('lookup-invitation', { token: profile.username });
      if (data?.found && data?.status === 'pending') {
        setInstaProfile(null);
        setInvitationBlock({
          kind: 'use-link',
          title: t('ScreensLoginScreen.useInvitationTitle'),
          message: t('ScreensLoginScreen.useInvitationMessage', { handle: profile.username }),
          inviteHandle: profile.username,
        });
        return;
      }
    } catch (_) {
      // Soft-fail — don't block sign-up on a lookup outage.
    }

    setInstaProfile(profile);
    nextStep(); // -> step 3 (profile form)
  };

  const handleSignUpFormSubmit = async (formData: any) => {
    setSignupData(prev => ({ ...prev, ...formData }));
    setLoading(true);
    setLoadingMsg(t('ScreensLoginScreen.creatingYourAccount'));
    setError('');

    try {
      const storagePhone = phone.replace(/\D/g, '').slice(-10);
      const table =
        signupData.role === 'brand' ? 'brand_profiles' : 'influencer_profiles';

      // Option A: no userId yet — create-profile creates the auth user AND
      // the profile atomically, keyed off the phone proof minted at OTP
      // verify, and returns the new userId + a session.
      const createBody: any = {
        table,
        phone: storagePhone,
        name: formData.name || signupData.name,
        gstinData: formData.gstinData || null,
        invitationId: invitation?.id || null,
        // Refer & Earn attribution — read once from the deep link on
        // page load, passed straight through to create-profile. Guarded
        // server-side against self-referral + inactive referrer, so an
        // empty / bad code is a silent no-op.
        referralCode: route.params?.ref || null,
        // Non-crypto stable device fingerprint for the anti-fraud
        // attribution on the referral row. RN's Platform + Dimensions +
        // timezone give us enough variance to flag duplicate installs
        // on the same physical device without leaking identifying data.
        deviceFingerprint: (() => {
          try {
            const {Platform, Dimensions} = require('react-native');
            const {width, height} = Dimensions.get('screen');
            const parts = [
              Platform.OS || '',
              String(Platform.Version || ''),
              String(width),
              String(height),
              Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || '',
            ].join('|');
            let h = 0;
            for (let i = 0; i < parts.length; i++) {
              h = ((h << 5) - h + parts.charCodeAt(i)) | 0;
            }
            return String(h >>> 0);
          } catch {
            return null;
          }
        })(),
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

      // create-profile now returns the freshly-created userId + session.
      const newUserId = createResult?.userId;
      const newSession = createResult?.session;
      if (!newUserId)
        throw new Error(t('ScreensLoginScreen.accountCreationIncomplete'));
      setAuthUserId(newUserId);

      if (newSession?.access_token) {
        setPendingSession(newSession);
        setLoadingMsg(t('ScreensLoginScreen.settingUpSessionDots'));
        await supabase.auth.setSession({
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token,
        });
      }

      if (signupData.role === 'brand') {
        // Brands go straight to dashboard. reset (not navigate) so the
        // signup stack doesn't linger underneath the home screen.
        setLoadingMsg(t('ScreensLoginScreen.redirectingToDashboard'));
        (navigation as any).reset({index: 0, routes: [{name: 'BrandHome'}]});
        return;
      }

      setLoading(false);
      nextStep(); // -> step 4 (categories)
    } catch (err: any) {
      setError(err.message || t('ScreensLoginScreen.failedCreateAccount'));
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
    setLoadingMsg(t('ScreensLoginScreen.savingPreferences'));
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
        setLoadingMsg(t('ScreensLoginScreen.settingUpSessionDots'));
        await supabase.auth.setSession({
          access_token: pendingSession.access_token,
          refresh_token: pendingSession.refresh_token,
        });
      }

      // reset (not navigate) — same reasoning as the sign-in path. Prevents
      // the categories/preferences screens from sitting in the back stack
      // after the user lands on home.
      (navigation as any).reset({
        index: 0,
        routes: [
          {name: data.role === 'brand' ? 'BrandHome' : 'InfluencerHome'},
        ],
      });
    } catch (err: any) {
      setError(err.message || t('ScreensLoginScreen.failedCompleteSignup'));
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

      {/* Auth Drawer — wrapped in KeyboardAvoidingView so the bottom sheet
          lifts above the iOS keyboard instead of sitting behind it. The
          inner ScrollView keeps content reachable when the keyboard plus
          the sheet would otherwise exceed the visible window. */}
      {flow !== 'onboarding' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{position: 'absolute', left: 0, right: 0, bottom: 0}}>
          <View className="w-full bg-white rounded-t-[40px] overflow-hidden">
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
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingHorizontal: 32, paddingBottom: 48}}>
            {/* Invitation interrupt — shown when the link is bad/used or
                when the user signed up directly with an IG that has a
                pending invitation. Replaces the regular flow until
                resolved. */}
            {invitationChecking && (
              <View className="items-center justify-center py-12">
                <ActivityIndicator size="large" color="#E60076" />
                <Text className="mt-3 text-sm font-semibold text-slate-500">
                  {t('ScreensLoginScreen.checkingYourInvitation')}
                </Text>
              </View>
            )}
            {invitationBlock && !invitationChecking && (
              <InvitationInterrupt
                block={invitationBlock}
                onContinueSignUp={() => {
                  setInvitationBlock(null);
                  setFlow('signup');
                  setStep(1);
                }}
                onSwitchToSignIn={() => {
                  setInvitationBlock(null);
                  setFlow('signin');
                  setStep(1);
                }}
                onUseInvitation={(handle) => {
                  // Re-enter the invitation flow via route params reset.
                  setInvitationBlock(null);
                  (navigation as any).setParams({ invited: handle });
                }}
              />
            )}
            {!invitationChecking && !invitationBlock && (<>
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
                    onResend={() => handleResendOtp(phone)}
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
            </>)}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

// Drawer screen shown when the invitation flow can't proceed:
//   - "use-link"  → user signed up directly with an IG that has a pending
//                   invitation; route them to the email link instead
//   - "claimed"   → invitation already used; bounce to sign-in
//   - "invalid"/"error" → link broken or service hiccup; let them sign
//                         up normally
function InvitationInterrupt({
  block,
  onContinueSignUp,
  onSwitchToSignIn,
  onUseInvitation,
}: {
  block: {
    kind: 'use-link' | 'claimed' | 'invalid' | 'error';
    title: string;
    message: string;
    inviteHandle?: string;
  };
  onContinueSignUp: () => void;
  onSwitchToSignIn: () => void;
  onUseInvitation: (handle: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ paddingTop: 24 }}>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#FDF2F8',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Mail size={26} color="#E60076" />
        </View>
      </View>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text className="text-xl font-black text-slate-900 text-center">
          {block.title}
        </Text>
        <Text className="text-sm text-slate-500 text-center leading-5 mt-2">
          {block.message}
        </Text>
      </View>

      {block.kind === 'use-link' && (
        <Text className="text-[11px] text-slate-400 text-center leading-4 mb-4">
          {t('ScreensLoginScreen.cantFindEmail')}
        </Text>
      )}

      {block.kind === 'claimed' ? (
        <Pressable
          onPress={onSwitchToSignIn}
          style={{ borderRadius: 16, overflow: 'hidden' }}>
          <LinearGradient
            colors={['#9810FA', '#E60076']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 14, alignItems: 'center' }}>
            <Text className="text-white text-sm font-black">{t('ScreensLoginScreen.signInInstead')}</Text>
          </LinearGradient>
        </Pressable>
      ) : block.kind === 'use-link' ? (
        <View style={{ gap: 12 }}>
          {!!block.inviteHandle && (
            <Pressable
              onPress={() => onUseInvitation(block.inviteHandle!)}
              style={{ borderRadius: 16, overflow: 'hidden' }}>
              <LinearGradient
                colors={['#9810FA', '#E60076']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 14, alignItems: 'center' }}>
                <Text className="text-white text-sm font-black">
                  {t('ScreensLoginScreen.continueWithInvitation')}
                </Text>
              </LinearGradient>
            </Pressable>
          )}
          <Pressable
            onPress={onContinueSignUp}
            className="border border-slate-200 rounded-2xl py-3 items-center">
            <Text className="text-sm font-bold text-slate-600">
              {t('ScreensLoginScreen.signUpDifferentInstagram')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onContinueSignUp}
          className="border border-slate-200 rounded-2xl py-3 items-center">
          <Text className="text-sm font-bold text-slate-600">
            Sign up with a different Instagram
          </Text>
        </Pressable>
      )}
    </View>
  );
}
