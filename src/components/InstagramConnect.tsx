import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {Instagram, CheckCircle2, X} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {WebView} from 'react-native-webview';
import {supabase} from '../utils/supabase';
import {
  NEXT_PUBLIC_INSTAGRAM_APP_ID as INSTAGRAM_APP_ID,
  INSTAGRAM_REDIRECT_URI,
} from '@env';

function formatCount(n: number | undefined) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
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

interface Props {
  onNext: (profile: InstaProfile) => void;
  mode?: 'signin' | 'signup';
  role?: 'brand' | 'influencer';
  loading?: boolean;
  error?: string;
}

export default function InstagramConnect({
  onNext,
  mode = 'signup',
  role = 'influencer',
  loading: externalLoading = false,
  error: externalError = '',
}: Props) {
  const [connecting, setConnecting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [profile, setProfile] = useState<InstaProfile | null>(null);
  const [error, setError] = useState('');
  const [showWebView, setShowWebView] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const isSignIn = mode === 'signin';
  const displayError = externalError || error;

  const redirectUri = INSTAGRAM_REDIRECT_URI;
  const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('instagram_business_basic,instagram_business_manage_insights')}&response_type=code`;

  const exchangeCode = async (code: string) => {
    setConnecting(true);
    setError('');
    try {
      const {data, error: funcError} = await supabase.functions.invoke(
        'instagram-connect',
        {body: {code, redirectUri}},
      );

      if (funcError) throw new Error(funcError.message);
      if (data?.error) throw new Error(data.error);

      // The edge function now returns a fully-populated profile or a
      // structured error. Defensive guard: a token-only response (no
      // username) is the exact half-connected state that broke the next
      // sign-in. Refuse it here so the UI never lands in that state.
      if (!data?.profile?.username) {
        throw new Error(
          "Instagram didn't return your username. Please reconnect Instagram.",
        );
      }

      setProfile({
        ...data.profile,
        accessToken: data.accessToken,
        tokenExpiresAt: data.tokenExpiresAt,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to connect Instagram');
    } finally {
      setConnecting(false);
    }
  };

  const handleConnect = () => {
    setError('');
    setShowWebView(true);
  };

  const handleWebViewNavigationChange = (navState: any) => {
    const {url} = navState;

    // Check if the URL matches our redirect URI
    if (url && url.startsWith(redirectUri)) {
      setShowWebView(false);

      try {
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        const errorParam = urlObj.searchParams.get('error');

        if (code) {
          exchangeCode(code.replace('#_', ''));
        } else if (errorParam) {
          setError(
            urlObj.searchParams.get('error_description')?.replace(/\+/g, ' ') ||
              'Instagram connection was denied',
          );
        }
      } catch {
        setError('Failed to process Instagram response');
      }
    }
  };

  const handleDisconnect = () => {
    setProfile(null);
    setError('');
  };

  const handleContinue = async () => {
    if (!profile) return;
    setChecking(true);
    setError('');

    try {
      const {data: uniqueCheck} = await supabase.functions.invoke(
        'check-uniqueness',
        {body: {instagram: profile.username, role}},
      );

      if (uniqueCheck?.conflicts?.includes('instagram')) {
        const source = uniqueCheck.instagramConflictSource;

        if (isSignIn) {
          if (source && source !== role) {
            setError(
              `This Instagram is registered as ${source === 'brand' ? 'a Brand' : 'an Influencer'}. Please sign in as ${source === 'brand' ? 'a Brand' : 'an Influencer'} instead.`,
            );
            setChecking(false);
            return;
          }
        } else {
          const sourceLabel =
            source === 'brand'
              ? 'a Brand'
              : source === 'influencer'
                ? 'an Influencer'
                : 'another account';
          setError(
            `This Instagram is already registered as ${sourceLabel}. Please sign in instead.`,
          );
          setChecking(false);
          return;
        }
      }

      onNext(profile);
    } catch (err: any) {
      setError(err.message || 'Failed to verify Instagram');
    } finally {
      setChecking(false);
    }
  };

  return (
    <View>
      {/* Header */}
      <View className="items-center mb-2">
        <Text className="text-2xl font-bold text-slate-900">
          {isSignIn ? 'Sign In with Instagram' : 'Connect Instagram'}
        </Text>
        <Text className="text-slate-500 text-sm text-center mt-2">
          {isSignIn
            ? 'Connect your Instagram to sign in to your account'
            : 'Link your Instagram to unlock brand collaborations & build your media kit'}
        </Text>
      </View>

      {/* Error */}
      {displayError ? (
        <View className="p-3 bg-red-50 border border-red-200 rounded-xl mt-6">
          <Text className="text-sm text-red-600">{displayError}</Text>
        </View>
      ) : null}

      {!profile ? (
        <View className="items-center mt-8">
          {/* Instagram Icon with proper gradient */}
          <LinearGradient
            colors={['#FCAF45', '#F77737', '#E1306C', '#833AB4']}
            start={{x: 0, y: 1}}
            end={{x: 1, y: 0}}
            className="w-24 h-24 rounded-3xl items-center justify-center"
            style={{
              shadowColor: '#E1306C',
              shadowOffset: {width: 0, height: 8},
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
              borderRadius: 24,
            }}>
            <Instagram size={48} color="white" />
          </LinearGradient>

          {/* Connect Button */}
          <Pressable
            onPress={handleConnect}
            disabled={connecting}
            className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-200 flex-row items-center justify-center mt-8"
            style={{gap: 12}}>
            {connecting ? (
              <>
                <ActivityIndicator size="small" color="#E1306C" />
                <Text className="text-slate-500 text-sm font-semibold">
                  Connecting...
                </Text>
              </>
            ) : (
              <>
                <Instagram size={20} color="#E1306C" />
                <Text className="text-sm font-semibold text-[#E1306C]">
                  Connect with Instagram
                </Text>
              </>
            )}
          </Pressable>
        </View>
      ) : (
        <View className="mt-6">
          {/* Connected Profile Card */}
          <View
            className="p-4 rounded-2xl border border-green-200 bg-green-50 flex-row items-center"
            style={{gap: 16}}>
            {profile.profilePictureUrl ? (
              <Image
                source={{uri: profile.profilePictureUrl}}
                className="w-14 h-14 rounded-full"
                style={{borderWidth: 2, borderColor: 'white'}}
              />
            ) : (
              <LinearGradient
                colors={['#F77737', '#E1306C', '#833AB4']}
                start={{x: 0, y: 1}}
                end={{x: 1, y: 0}}
                className="w-14 h-14 rounded-full items-center justify-center">
                <Text className="text-white font-bold text-lg">
                  {profile.username?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </LinearGradient>
            )}

            <View className="flex-1">
              <Text
                className="text-base font-bold text-slate-900"
                numberOfLines={1}>
                @{profile.username}
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                {formatCount(profile.followersCount)} followers
                {' · '}
                {formatCount(profile.followsCount)} following
                {' · '}
                {formatCount(profile.mediaCount)} posts
              </Text>
            </View>

            <View className="flex-row items-center" style={{gap: 6}}>
              <CheckCircle2 size={22} color="#22C55E" />
              <Pressable
                onPress={handleDisconnect}
                className="p-1.5 rounded-full">
                <X size={14} color="#94A3B8" />
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Continue Button */}
      <View className="mt-8">
        <Pressable
          disabled={!profile || checking || externalLoading}
          onPress={handleContinue}
          className={`w-full h-[54px] rounded-2xl items-center justify-center flex-row ${
            !profile || checking || externalLoading
              ? 'bg-slate-100'
              : 'bg-[#9810FA]'
          }`}>
          {checking ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white text-base font-semibold ml-2">
                Verifying...
              </Text>
            </>
          ) : externalLoading ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white text-base font-semibold ml-2">
                {isSignIn ? 'Signing in...' : 'Continue'}
              </Text>
            </>
          ) : (
            <Text
              className={`text-base font-semibold ${
                !profile ? 'text-slate-400' : 'text-white'
              }`}>
              {isSignIn ? 'Sign In' : 'Continue'}
            </Text>
          )}
        </Pressable>

        {!profile && (
          <Text className="text-center text-[11px] text-slate-400 mt-3">
            Instagram connection is required to proceed
          </Text>
        )}
      </View>

      {/* Instagram OAuth WebView Modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowWebView(false)}>
        <View className="flex-1 bg-white">
          {/* WebView Header */}
          <View className="flex-row items-center justify-between px-4 pt-12 pb-3 bg-white border-b border-slate-100">
            <Pressable
              onPress={() => setShowWebView(false)}
              className="p-2 rounded-full bg-slate-100">
              <X size={20} color="#475569" />
            </Pressable>
            <Text className="text-sm font-bold text-slate-800">
              Connect Instagram
            </Text>
            <View className="w-10" />
          </View>

          <WebView
            ref={webViewRef}
            source={{uri: authUrl}}
            onNavigationStateChange={handleWebViewNavigationChange}
            startInLoadingState
            renderLoading={() => (
              <View className="absolute inset-0 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#E1306C" />
                <Text className="text-sm text-slate-500 mt-3">
                  Loading Instagram...
                </Text>
              </View>
            )}
            userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
          />
        </View>
      </Modal>
    </View>
  );
}
