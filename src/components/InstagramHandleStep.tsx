// Signup step 2 for creators: type an Instagram username, we look up the
// public profile server-side (instagram-lookup), show a preview, and carry
// the numbers into create-profile exactly as the OAuth step used to — minus
// the token. The result is a SELF-DECLARED profile; OAuth, offered at the
// bottom, is what earns the verified badge.
//
// The uniqueness check is the same call InstagramConnect makes before it
// lets a profile through, so an already-registered handle is refused here
// too, with the same message.

import React, {useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import {AtSign, BadgeCheck, Instagram, Search} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {EdgeFunctionError, invokeFn} from '../lib/api';

export interface HandleProfile {
  username: string;
  profilePictureUrl?: string;
  followersCount?: number;
  followsCount?: number;
  mediaCount?: number;
}

interface Props {
  onNext: (profile: HandleProfile) => void | Promise<void>;
  onConnectInstead: () => void;
  /** Invitation flow pre-fills the invited handle. */
  initialHandle?: string;
}

type LookupReason =
  | 'invalid'
  | 'not_found'
  | 'not_business'
  | 'rate_limited'
  | 'unavailable';

interface LookupResponse {
  found: boolean;
  reason?: LookupReason;
  message?: string;
  profile?: {
    username: string;
    name?: string;
    profile_picture_url?: string;
    followers_count: number;
    follows_count: number;
    media_count: number;
  };
}

const HANDLE_RE = /^[A-Za-z0-9._]{1,30}$/;

function compact(n: number | undefined): string {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(v);
}

export default function InstagramHandleStep({onNext, onConnectInstead, initialHandle = ''}: Props) {
  const {t} = useTranslation();
  const [handle, setHandle] = useState(initialHandle.replace(/^@/, ''));
  const [preview, setPreview] = useState<LookupResponse['profile'] | null>(null);
  const [looking, setLooking] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  // Set when the failure is one OAuth would get around (personal account,
  // lookup down): the "connect instead" link is then shown as a button.
  const [offerOAuth, setOfferOAuth] = useState(false);

  const reasonMessage = (reason?: LookupReason): string => {
    switch (reason) {
      case 'invalid':
        return t('InstagramHandleStep.errorInvalid');
      case 'not_found':
        return t('InstagramHandleStep.errorNotFound');
      case 'not_business':
        return t('InstagramHandleStep.errorNotBusiness');
      case 'rate_limited':
        return t('InstagramHandleStep.errorRateLimited');
      default:
        return t('InstagramHandleStep.errorUnavailable');
    }
  };

  const lookUp = async () => {
    const username = handle.trim().replace(/^@/, '').toLowerCase();
    setError('');
    setOfferOAuth(false);
    setPreview(null);
    if (!username) {
      setError(t('InstagramHandleStep.errorEmpty'));
      return;
    }
    if (!HANDLE_RE.test(username)) {
      setError(t('InstagramHandleStep.errorInvalid'));
      return;
    }
    setLooking(true);
    try {
      const res = await invokeFn<LookupResponse>('instagram-lookup', {username});
      if (res?.found && res.profile?.username) {
        setPreview(res.profile);
        setHandle(res.profile.username);
      } else {
        setError(reasonMessage(res?.reason));
        setOfferOAuth(res?.reason === 'not_business' || res?.reason === 'unavailable');
      }
    } catch (err: any) {
      // 429 / 503 come back as thrown EdgeFunctionErrors with the body in
      // .data; anything else is a network-level failure.
      const reason: LookupReason | undefined =
        err instanceof EdgeFunctionError
          ? err.data?.reason || (err.status === 429 ? 'rate_limited' : 'unavailable')
          : 'unavailable';
      setError(reasonMessage(reason));
      setOfferOAuth(reason === 'unavailable');
    } finally {
      setLooking(false);
    }
  };

  const confirm = async () => {
    if (!preview) return;
    setChecking(true);
    setError('');
    try {
      const uniq = await invokeFn<{
        conflicts?: string[];
        instagramConflictSource?: string;
      }>('check-uniqueness', {instagram: preview.username, role: 'influencer'});
      if (uniq?.conflicts?.includes('instagram')) {
        const source = uniq.instagramConflictSource;
        const label =
          source === 'brand'
            ? t('InstagramHandleStep.roleBrand')
            : source === 'influencer'
              ? t('InstagramHandleStep.roleInfluencer')
              : t('InstagramHandleStep.roleOther');
        setError(t('InstagramHandleStep.errorAlreadyRegistered', {source: label}));
        return;
      }
      await onNext({
        username: preview.username,
        profilePictureUrl: preview.profile_picture_url || '',
        followersCount: preview.followers_count || 0,
        followsCount: preview.follows_count || 0,
        mediaCount: preview.media_count || 0,
      });
    } catch (err: any) {
      setError(err?.message || t('InstagramHandleStep.errorUnavailable'));
    } finally {
      setChecking(false);
    }
  };

  const busy = looking || checking;

  return (
    <View>
      <View className="flex-row items-center mb-2" style={{gap: 10}}>
        <View
          className="items-center justify-center rounded-2xl"
          style={{width: 44, height: 44, backgroundColor: '#FDF2F8'}}>
          <Instagram size={22} color="#E60076" />
        </View>
        <Text className="text-2xl font-black text-[#1A1A1A]">
          {t('InstagramHandleStep.title')}
        </Text>
      </View>
      <Text className="text-[13px] text-slate-500 mb-5">
        {t('InstagramHandleStep.subtitle')}
      </Text>

      {/* Handle input + Look up */}
      {!preview && (
        <View className="flex-row" style={{gap: 8}}>
          <View
            className="flex-1 flex-row items-center rounded-2xl border border-slate-200 bg-white px-3"
            style={{height: 52}}>
            <AtSign size={16} color="#94A3B8" />
            <TextInput
              value={handle}
              onChangeText={v => {
                setHandle(v);
                if (error) setError('');
              }}
              onSubmitEditing={lookUp}
              placeholder={t('InstagramHandleStep.placeholder')}
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              returnKeyType="search"
              editable={!busy}
              className="flex-1 ml-2 text-[15px] text-[#1A1A1A]"
              style={{height: 52, paddingVertical: 0}}
            />
          </View>
          <Pressable
            onPress={lookUp}
            disabled={busy}
            className={`rounded-2xl items-center justify-center flex-row px-4 ${
              busy ? 'bg-slate-100' : 'bg-[#9810FA]'
            }`}
            style={{height: 52, minWidth: 104}}>
            {looking ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Search size={16} color="white" />
                <Text className="text-white text-[14px] font-semibold ml-1.5">
                  {t('InstagramHandleStep.lookUp')}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* Preview card */}
      {preview && (
        <View className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <View className="flex-row items-center" style={{gap: 12}}>
            {preview.profile_picture_url ? (
              <Image
                source={{uri: preview.profile_picture_url}}
                style={{width: 56, height: 56, borderRadius: 28, backgroundColor: '#E2E8F0'}}
              />
            ) : (
              <View
                className="items-center justify-center bg-slate-200"
                style={{width: 56, height: 56, borderRadius: 28}}>
                <Text className="text-xl font-black text-slate-500">
                  {preview.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-[15px] font-black text-[#1A1A1A]" numberOfLines={1}>
                @{preview.username}
              </Text>
              {preview.name ? (
                <Text className="text-[12px] text-slate-500" numberOfLines={1}>
                  {preview.name}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => {
                setPreview(null);
                setError('');
              }}
              disabled={busy}
              className="px-2 py-1">
              <Text className="text-[12px] font-semibold text-[#9810FA]">
                {t('InstagramHandleStep.notYou')}
              </Text>
            </Pressable>
          </View>
          <View className="flex-row justify-around mt-4 pt-3 border-t border-emerald-100">
            {[
              [compact(preview.followers_count), t('InstagramHandleStep.followers')],
              [compact(preview.follows_count), t('InstagramHandleStep.following')],
              [compact(preview.media_count), t('InstagramHandleStep.posts')],
            ].map(([v, l]) => (
              <View key={l} className="items-center">
                <Text className="text-base font-black text-[#1A1A1A]">{v}</Text>
                <Text className="text-[10px] font-bold text-slate-400 uppercase">{l}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!!error && (
        <View className="rounded-xl bg-red-50 px-4 py-3 mt-3">
          <Text className="text-[13px] text-red-600">{error}</Text>
        </View>
      )}

      {/* Confirm */}
      {preview && (
        <Pressable
          onPress={confirm}
          disabled={busy}
          className={`w-full rounded-2xl items-center justify-center flex-row mt-6 ${
            busy ? 'bg-slate-100' : 'bg-[#9810FA]'
          }`}
          style={{height: 54}}>
          {checking ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white text-base font-semibold ml-2">
                {t('InstagramHandleStep.checking')}
              </Text>
            </>
          ) : (
            <Text className="text-white text-base font-semibold">
              {t('InstagramHandleStep.confirm')}
            </Text>
          )}
        </Pressable>
      )}

      {/* OAuth as the upgrade, or the escape when the handle route is shut */}
      <View className="mt-6 items-center">
        {offerOAuth ? (
          <Pressable
            onPress={onConnectInstead}
            disabled={busy}
            className="w-full rounded-2xl items-center justify-center flex-row border border-[#9810FA] bg-white"
            style={{height: 48, gap: 8}}>
            <BadgeCheck size={16} color="#9810FA" />
            <Text className="text-[14px] font-semibold text-[#9810FA]">
              {t('InstagramHandleStep.connectInstead')}
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={onConnectInstead} disabled={busy} className="py-2 px-3">
            <Text className="text-[13px] font-semibold text-[#9810FA]">
              {t('InstagramHandleStep.connectInstead')}
            </Text>
          </Pressable>
        )}
        <Text className="text-center text-[11px] text-slate-400 mt-2 px-4">
          {t('InstagramHandleStep.connectInsteadHint')}
        </Text>
      </View>
    </View>
  );
}
