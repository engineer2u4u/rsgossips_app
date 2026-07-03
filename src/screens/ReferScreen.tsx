// Refer & Earn — Phase 1 mirror of the web /influencer/refer page.
// Subscription-locked; unsubscribed users see an upsell instead of the
// share UI. Everything else is a direct port of the web page: share
// link + WhatsApp deeplink + wallet balance + tier chart + referrals
// list + ledger history.

import React, {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  Clipboard,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {Copy, MessageCircle, Sparkles, Trophy} from 'lucide-react-native';

import InfluencerLayout from '../layouts/InfluencerLayout';
import {useAuth} from '../context/AuthContext';
import {supabase} from '../utils/supabase';
import {BRAND, BRAND_GRADIENT_WARM, CARD_SHADOW} from '../theme/brand';

const STATUS_PILL: Record<string, {label: string; bg: string; fg: string}> = {
  PENDING: {label: 'Pending', bg: '#F1F5F9', fg: '#64748B'},
  SIGNED_UP: {label: 'Signed up', bg: '#EFF6FF', fg: '#1D4ED8'},
  QUALIFIED: {label: 'Qualified', bg: '#FEF3C7', fg: '#B45309'},
  REWARDED: {label: 'Rewarded', bg: '#ECFDF5', fg: '#047857'},
  REVERSED: {label: 'Reversed', bg: '#FFF1F2', fg: '#BE123C'},
  EXPIRED: {label: 'Expired', bg: '#F1F5F9', fg: '#94A3B8'},
  MANUAL_REVIEW: {label: 'Under review', bg: '#FFF7ED', fg: '#C2410C'},
};

const REASON_LABEL: Record<string, string> = {
  REFERRAL_EARN: 'Referral reward',
  WELCOME_BONUS: 'Welcome bonus',
  MILESTONE_BONUS: 'Milestone bonus',
  LEADERBOARD: 'Leaderboard prize',
  REDEMPTION: 'Applied to subscription',
  CLAWBACK: 'Refund clawback',
  EXPIRY: 'Auto-expired',
  ADMIN_ADJUSTMENT: 'Admin adjustment',
};

const formatDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

type Referral = {
  id: string;
  status: string;
  referee_first_plan: string | null;
  referrer_reward_rc: number;
  created_at: string;
  qualified_at: string | null;
  rewarded_at: string | null;
};

type LedgerRow = {
  id: string;
  delta_rc: number;
  reason: string;
  balance_after: number;
  expires_at: string | null;
  unlocks_at: string | null;
  created_at: string;
  note: string | null;
};

export default function ReferScreen() {
  const navigation = useNavigation<any>();
  const {user, profile, loading: authLoading} = useAuth();

  const [referralCode, setReferralCode] = useState('');
  const [availableBalance, setAvailableBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [profRes, availBalRes, refsRes, ledRes, boardRes, rankRes] = await Promise.all([
      supabase
        .from('influencer_profiles')
        .select('referral_code')
        .eq('influencer_id', user.id)
        .maybeSingle(),
      supabase
        .from('v_reward_credits_available_balance')
        .select('available_balance, locked_balance')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('referrals')
        .select(
          'id, status, referee_first_plan, referrer_reward_rc, created_at, qualified_at, rewarded_at',
        )
        .eq('referrer_id', user.id)
        .order('created_at', {ascending: false})
        .limit(50),
      supabase
        .from('reward_credits_ledger')
        .select(
          'id, delta_rc, reason, balance_after, expires_at, unlocks_at, created_at, note',
        )
        .eq('user_id', user.id)
        .order('created_at', {ascending: false})
        .limit(50),
      // Monthly leaderboard + current user's rank on it. Both are
      // SECURITY DEFINER RPCs so they bypass referrals RLS.
      supabase.rpc('get_referral_leaderboard', {top_n: 10}),
      supabase.rpc('get_my_referral_rank'),
    ]);
    setReferralCode(profRes.data?.referral_code || '');
    setAvailableBalance(availBalRes.data?.available_balance || 0);
    setLockedBalance(availBalRes.data?.locked_balance || 0);
    setReferrals((refsRes.data as Referral[]) || []);
    setLedger((ledRes.data as LedgerRow[]) || []);
    setLeaderboard(Array.isArray(boardRes.data) ? boardRes.data : []);
    setMyRank(
      Array.isArray(rankRes.data) && rankRes.data[0] ? rankRes.data[0] : null,
    );
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const isSubscribed =
    !!profile?.subscription_plan && profile.subscription_plan !== 'trial';
  const shareUrl = referralCode ? `https://rgossips.com/?ref=${referralCode}` : '';

  const copyLink = () => {
    if (!shareUrl) return;
    Clipboard.setString(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shareOnWhatsApp = async () => {
    if (!shareUrl) return;
    const msg = `Try RGossips — your first month is 50% off with my link: ${shareUrl}`;
    const waUrl = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    try {
      const supported = await Linking.canOpenURL(waUrl);
      if (supported) {
        Linking.openURL(waUrl);
      } else {
        // WhatsApp not installed → fall back to the OS share sheet.
        Share.share({message: msg});
      }
    } catch {
      Share.share({message: msg});
    }
  };

  const qualifiedCount = referrals.filter(r => r.status === 'REWARDED').length;
  const pendingCount = referrals.filter(
    r => r.status === 'SIGNED_UP' || r.status === 'QUALIFIED',
  ).length;
  const totalEarned = referrals
    .filter(r => r.status === 'REWARDED')
    .reduce((s, r) => s + (r.referrer_reward_rc || 0), 0);

  if (authLoading || loading) {
    return (
      <InfluencerLayout>
        <View className="items-center justify-center py-20">
          <Text className="text-sm font-semibold text-slate-400">Loading…</Text>
        </View>
      </InfluencerLayout>
    );
  }

  return (
    <InfluencerLayout onRefresh={load}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{padding: 16, paddingBottom: 120, gap: 16}}>
        {/* Header */}
        <View>
          <Text className="text-2xl font-black text-slate-900">Refer & Earn</Text>
          <Text className="text-sm text-slate-500 mt-1 leading-5">
            Share RGossips with other creators. When they subscribe you both
            win — they get 50% off their first month, you earn Reward Credits
            (RC) redeemable on your next renewal.
          </Text>
        </View>

        {!isSubscribed ? (
          // Gate: only subscribed users can share.
          <View
            className="bg-white rounded-3xl border border-slate-100 p-6 items-center"
            style={CARD_SHADOW}>
            <LinearGradient
              colors={[...BRAND_GRADIENT_WARM]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}>
              <Sparkles color="white" size={26} />
            </LinearGradient>
            <Text className="text-lg font-black text-slate-900 text-center">
              Subscribe to unlock referrals
            </Text>
            <Text className="text-sm text-slate-500 mt-2 text-center">
              Refer & Earn is available to paid subscribers. Upgrade to any
              plan and start sharing your referral link right after.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('InfluencerPricing')}
              style={{borderRadius: 16, overflow: 'hidden', marginTop: 16}}>
              <LinearGradient
                colors={[...BRAND_GRADIENT_WARM]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={{paddingVertical: 12, paddingHorizontal: 24}}>
                <Text className="text-white text-sm font-black">See plans</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Balance card */}
            <View style={{borderRadius: 24, overflow: 'hidden', ...CARD_SHADOW}}>
              <LinearGradient
                colors={[...BRAND_GRADIENT_WARM]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={{padding: 24}}>
                <Text className="text-white text-[10px] font-black uppercase tracking-widest opacity-80">
                  Available RC
                </Text>
                <Text className="text-white text-4xl font-black mt-1">
                  {availableBalance}
                </Text>
                <Text className="text-white text-xs opacity-80 mt-1">
                  ₹{availableBalance} redeemable at checkout
                </Text>
                {lockedBalance > 0 ? (
                  <View
                    className="flex-row items-center mt-3"
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      gap: 6,
                    }}>
                    <Text className="text-white text-[9px] font-black uppercase tracking-widest opacity-90">
                      Locked
                    </Text>
                    <Text className="text-white text-[11px] font-black">
                      +{lockedBalance} RC
                    </Text>
                  </View>
                ) : null}
                <Text className="text-white text-[11px] opacity-70 mt-4">
                  {lockedBalance > 0
                    ? 'Your welcome bonus unlocks 30 days after signup. Referral rewards are spendable immediately.'
                    : 'Redeem up to 50% of any plan price at checkout.'}
                </Text>
              </LinearGradient>
            </View>

            {/* Share card */}
            <View
              className="bg-white rounded-3xl border border-slate-100 p-5"
              style={CARD_SHADOW}>
              <Text className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Your referral link
              </Text>
              <View
                className="mt-2 flex-row items-center bg-slate-50 rounded-2xl p-3 border border-slate-100"
                style={{gap: 8}}>
                <Text
                  className="flex-1 text-sm text-slate-800"
                  style={{fontFamily: 'monospace'}}
                  numberOfLines={1}>
                  {shareUrl}
                </Text>
                <Pressable
                  onPress={copyLink}
                  className="flex-row items-center"
                  style={{gap: 4}}
                  hitSlop={8}>
                  <Copy size={14} color={BRAND.accent} />
                  <Text
                    className="text-xs font-black"
                    style={{color: BRAND.accent}}>
                    {copied ? 'Copied' : 'Copy'}
                  </Text>
                </Pressable>
              </View>
              <Pressable
                onPress={shareOnWhatsApp}
                className="mt-4 rounded-2xl items-center justify-center flex-row"
                style={{
                  backgroundColor: '#25D366',
                  paddingVertical: 12,
                  gap: 8,
                }}>
                <MessageCircle size={16} color="white" />
                <Text className="text-white text-sm font-black">
                  Share on WhatsApp
                </Text>
              </Pressable>

              {/* Stats strip */}
              <View className="flex-row gap-2 mt-4">
                <StatTile label="Qualified" value={qualifiedCount} />
                <StatTile label="Pending" value={pendingCount} />
                <StatTile label="RC earned" value={totalEarned} />
              </View>
            </View>

            {/* Reward tiers */}
            <View
              className="bg-white rounded-3xl border border-slate-100 p-5"
              style={CARD_SHADOW}>
              <View
                className="flex-row items-center mb-3"
                style={{gap: 6}}>
                <Trophy size={16} color="#F59E0B" />
                <Text className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Instant rewards
                </Text>
              </View>
              <View className="flex-row" style={{gap: 8}}>
                <TierTile plan="Starter" price="₹99" rc={50} />
                <TierTile plan="Pro" price="₹299" rc={150} highlight />
                <TierTile plan="Elite" price="₹699" rc={300} />
              </View>
              <Text className="text-[11px] text-slate-400 mt-3 leading-4">
                RC lands the moment your friend pays. Reversed if they refund
                within 7 days. Auto-expires 90 days after credit.
              </Text>
            </View>

            {/* Monthly leaderboard — self-hides when nobody qualified
                this month yet. */}
            {leaderboard.length > 0 ? (
              <View
                className="bg-white rounded-3xl border border-slate-100 p-5"
                style={CARD_SHADOW}>
                <View
                  className="flex-row items-center justify-between mb-2"
                  style={{gap: 8}}>
                  <Text className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Top referrers this month
                  </Text>
                  {myRank ? (
                    <View
                      style={{
                        backgroundColor: '#F1F5F9',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                      }}>
                      <Text className="text-[11px] font-black text-slate-700">
                        You: #{myRank.rank}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {leaderboard.map(row => {
                  const isMe = user?.id === row.referrer_id;
                  return (
                    <View
                      key={row.referrer_id}
                      className="flex-row items-center py-3 border-b border-slate-100"
                      style={{
                        gap: 10,
                        backgroundColor: isMe ? '#FDF2F8' : 'transparent',
                        marginHorizontal: isMe ? -20 : 0,
                        paddingHorizontal: isMe ? 20 : 0,
                      }}>
                      <Text
                        className="text-[13px] font-black text-slate-500"
                        style={{width: 28, textAlign: 'center'}}>
                        #{row.rank}
                      </Text>
                      {row.profile_photo_url ? (
                        <Image
                          source={{uri: row.profile_photo_url}}
                          style={{width: 32, height: 32, borderRadius: 16}}
                        />
                      ) : (
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: '#F1F5F9',
                          }}
                        />
                      )}
                      <View className="flex-1">
                        <View
                          className="flex-row items-center"
                          style={{gap: 4}}>
                          <Text
                            className="text-[13px] font-bold text-slate-900"
                            numberOfLines={1}>
                            {row.full_name || row.username || 'Unknown'}
                          </Text>
                          {isMe ? (
                            <Text
                              className="text-[10px] font-black"
                              style={{color: BRAND.accent}}>
                              YOU
                            </Text>
                          ) : null}
                        </View>
                        <Text
                          className="text-[11px] text-slate-400"
                          numberOfLines={1}>
                          {row.instagram_handle
                            ? `@${row.instagram_handle}`
                            : '—'}
                        </Text>
                      </View>
                      <View style={{alignItems: 'flex-end'}}>
                        <Text className="text-sm font-black text-emerald-600">
                          {row.rc_earned} RC
                        </Text>
                        <Text className="text-[10px] text-slate-400">
                          {row.rewarded_count} referral
                          {row.rewarded_count === 1 ? '' : 's'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
                <Text className="text-[11px] text-slate-400 mt-2 leading-4">
                  Resets on the 1st of each month (IST).
                </Text>
              </View>
            ) : null}

            {/* Referrals list */}
            <View
              className="bg-white rounded-3xl border border-slate-100 p-5"
              style={CARD_SHADOW}>
              <Text className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">
                Your referrals
              </Text>
              {referrals.length === 0 ? (
                <Text className="text-sm text-slate-400 py-4 text-center">
                  No referrals yet — share your link to get started.
                </Text>
              ) : (
                referrals.map(r => {
                  const pill = STATUS_PILL[r.status] || {
                    label: r.status,
                    bg: '#F1F5F9',
                    fg: '#64748B',
                  };
                  return (
                    <View
                      key={r.id}
                      className="flex-row items-center py-3 border-b border-slate-100"
                      style={{gap: 10}}>
                      <View className="flex-1">
                        <Text className="text-[13px] font-bold text-slate-900">
                          {r.referee_first_plan
                            ? `${r.referee_first_plan} subscription`
                            : 'New referral'}
                        </Text>
                        <Text className="text-[11px] text-slate-400">
                          {formatDate(
                            r.rewarded_at || r.qualified_at || r.created_at,
                          )}
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: pill.bg,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 4,
                        }}>
                        <Text
                          className="text-[10px] font-black uppercase tracking-wider"
                          style={{color: pill.fg}}>
                          {pill.label}
                        </Text>
                      </View>
                      {r.status === 'REWARDED' && (
                        <Text className="text-[13px] font-black text-emerald-600">
                          +{r.referrer_reward_rc} RC
                        </Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>

            {/* Ledger */}
            <View
              className="bg-white rounded-3xl border border-slate-100 p-5"
              style={CARD_SHADOW}>
              <Text className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">
                RC wallet history
              </Text>
              {ledger.length === 0 ? (
                <Text className="text-sm text-slate-400 py-4 text-center">
                  Wallet is empty.
                </Text>
              ) : (
                ledger.map(row => {
                  const isLocked =
                    row.unlocks_at &&
                    new Date(row.unlocks_at).getTime() > Date.now() &&
                    row.delta_rc > 0;
                  return (
                    <View
                      key={row.id}
                      className="flex-row items-center py-3 border-b border-slate-100"
                      style={{gap: 10}}>
                      <View className="flex-1">
                        <View
                          className="flex-row items-center"
                          style={{gap: 6, flexWrap: 'wrap'}}>
                          <Text className="text-[13px] font-bold text-slate-900">
                            {REASON_LABEL[row.reason] || row.reason}
                          </Text>
                          {isLocked ? (
                            <View
                              style={{
                                backgroundColor: '#FEF3C7',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 3,
                              }}>
                              <Text
                                className="text-[9px] font-black uppercase tracking-wider"
                                style={{color: '#B45309'}}>
                                Locked
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text className="text-[11px] text-slate-400">
                          {formatDate(row.created_at)}
                          {isLocked ? ` · unlocks ${formatDate(row.unlocks_at)}` : ''}
                          {row.expires_at && row.delta_rc > 0
                            ? ` · expires ${formatDate(row.expires_at)}`
                            : ''}
                          {row.note ? ` · ${row.note}` : ''}
                        </Text>
                      </View>
                      <Text
                        className="text-sm font-black"
                        style={{color: row.delta_rc > 0 ? '#059669' : '#64748B'}}>
                        {row.delta_rc > 0 ? '+' : ''}
                        {row.delta_rc}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </InfluencerLayout>
  );
}

function StatTile({label, value}: {label: string; value: number}) {
  return (
    <View className="flex-1 bg-slate-50 rounded-xl p-3 items-center">
      <Text className="text-lg font-black text-slate-900">{value}</Text>
      <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
        {label}
      </Text>
    </View>
  );
}

function TierTile({
  plan,
  price,
  rc,
  highlight,
}: {
  plan: string;
  price: string;
  rc: number;
  highlight?: boolean;
}) {
  return (
    <View
      className="flex-1 rounded-2xl p-3 items-center"
      style={{
        borderWidth: 1,
        borderColor: highlight ? '#F9A8D4' : '#E2E8F0',
        backgroundColor: highlight ? '#FDF2F8' : '#F8FAFC',
      }}>
      <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {plan}
      </Text>
      <Text className="text-[13px] font-bold text-slate-700 mt-0.5">
        {price}
      </Text>
      <Text
        className="text-lg font-black mt-1"
        style={{color: highlight ? BRAND.accent : '#0F172A'}}>
        +{rc} RC
      </Text>
    </View>
  );
}
