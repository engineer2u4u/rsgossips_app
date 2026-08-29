import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import {ChevronLeft, Ban} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {invokeFn} from '../lib/api';
import {CARD_SHADOW} from '../theme/brand';

// Blocked accounts, with unblock.
//
// Play's User Generated Content policy and Apple Guideline 1.2 require a
// blocking mechanism; both also expect it to be reversible. Without this
// screen a block was permanent from the user's side — they could hide someone
// and then had no way to undo it, which is its own support burden and reads
// badly in review.
//
// Names are resolved server-side by block-user's `list` action: the raw table
// holds only ids, and RLS rightly stops the client reading another user's
// profile to look them up.

type BlockedUser = {
  userId: string;
  name: string;
  handle: string | null;
  photo: string | null;
  blockedAt: string;
};

export default function BlockedAccounts({onBack}: {onBack: () => void}) {
  const {t} = useTranslation();
  const [blocks, setBlocks] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  // Per-row so one slow unblock doesn't disable the whole list.
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await invokeFn<{
        success?: boolean;
        blocks?: BlockedUser[];
        error?: string;
      }>('block-user', {action: 'list'});
      if (!res?.success) {
        setError(res?.error || t('BlockedAccounts.errorLoad'));
        return;
      }
      setBlocks(res.blocks || []);
    } catch (e: any) {
      setError(e?.message || t('BlockedAccounts.errorLoad'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const unblock = async (userId: string) => {
    setBusyId(userId);
    setError('');
    try {
      const res = await invokeFn<{success?: boolean; error?: string}>(
        'block-user',
        {action: 'unblock', targetUserId: userId},
      );
      if (!res?.success) {
        setError(res?.error || t('BlockedAccounts.errorUnblock'));
        return;
      }
      // Drop locally rather than refetching — the server is authoritative and
      // already agreed, so a round trip would only add latency.
      setBlocks(prev => prev.filter(b => b.userId !== userId));
    } catch (e: any) {
      setError(e?.message || t('BlockedAccounts.errorUnblock'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center px-5 py-4 bg-white border-b border-slate-100">
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}>
          <ChevronLeft size={22} color="#0f172a" />
        </Pressable>
        <Text className="text-[17px] font-black text-slate-900 ml-2">
          {t('BlockedAccounts.title')}
        </Text>
      </View>

      {!!error && (
        <View className="mx-5 mt-4 rounded-xl bg-red-50 px-4 py-3">
          <Text className="text-[13px] text-red-600">{error}</Text>
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={blocks}
          keyExtractor={item => item.userId}
          contentContainerStyle={{padding: 20, paddingBottom: 40}}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          ListEmptyComponent={
            <View className="items-center pt-16 px-8">
              <View className="w-14 h-14 rounded-full bg-slate-100 items-center justify-center mb-4">
                <Ban size={24} color="#94a3b8" />
              </View>
              <Text className="text-[15px] font-bold text-slate-700 text-center">
                {t('BlockedAccounts.emptyTitle')}
              </Text>
              <Text className="text-[13px] text-slate-500 text-center mt-1.5 leading-5">
                {t('BlockedAccounts.emptyBody')}
              </Text>
            </View>
          }
          renderItem={({item}) => (
            <View
              style={[CARD_SHADOW, {backgroundColor: '#fff'}]}
              className="flex-row items-center rounded-2xl px-4 py-3.5 mb-2.5">
              {item.photo ? (
                <Image
                  source={{uri: item.photo}}
                  className="w-11 h-11 rounded-full"
                />
              ) : (
                <View className="w-11 h-11 rounded-full bg-slate-200 items-center justify-center">
                  <Text className="text-[15px] font-black text-slate-500">
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <View className="flex-1 ml-3">
                <Text
                  className="text-[14.5px] font-bold text-slate-900"
                  numberOfLines={1}>
                  {item.name}
                </Text>
                {!!item.handle && (
                  <Text className="text-[12px] text-slate-500" numberOfLines={1}>
                    @{item.handle}
                  </Text>
                )}
              </View>

              <Pressable
                onPress={() => unblock(item.userId)}
                disabled={busyId === item.userId}
                className="px-4 h-9 rounded-full bg-slate-900 items-center justify-center"
                style={{opacity: busyId === item.userId ? 0.5 : 1}}
                accessibilityRole="button">
                {busyId === item.userId ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white text-[12.5px] font-bold">
                    {t('BlockedAccounts.unblock')}
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}
