import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {ChevronLeft, Instagram, Edit2} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../context/AuthContext';
import {invokeFn} from '../lib/api';
import {useProfilePhoto} from '../utils/photoUrl';

const {width} = Dimensions.get('window');

interface Props {
  onBack: () => void;
  /** Optional now — kept so legacy callers don't break, but the Add Reel
   *  button has been removed (the web app doesn't have one either). */
  onAddReel?: () => void;
  onEditProfile?: () => void;
}

// Mirrors web's SUBMISSION_STATUS_BADGE. Anything else falls through to
// no badge so we never paint an unknown status.
const SUBMISSION_STATUS_BADGE: Record<string, {label: string; bg: string; fg: string}> = {
  live_submitted: {label: 'Pending', bg: '#FEF3C7', fg: '#92400E'},
  completed: {label: 'Approved', bg: '#D1FAE5', fg: '#065F46'},
};

// One card per submitted live link, derived from the user's campaigns.
type LiveSubmission = {
  url: string;
  type: string;
  label: string;
  campaignId: string;
  campaignTitle: string;
  brandName: string;
  brandLogo?: string;
  applicationStatus: string;
};

function formatCount(n: number | undefined) {
  if (!n) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

const METRIC_COLORS: Record<string, string> = {
  blue: '#3B82F6',
  pink: '#EC4899',
  green: '#10B981',
  amber: '#F59E0B',
  cyan: '#06B6D4',
  purple: '#8B5CF6',
};

const MyInformationDetail: React.FC<Props> = ({onBack, onEditProfile}) => {
  const {profile, user} = useAuth();

  const name = profile?.full_name || 'Creator';
  const handle = profile?.instagram_handle || profile?.username || 'creator';
  const photo = useProfilePhoto();
  const followers = profile?.followers_count || 0;
  const following = profile?.follows_count || 0;
  const posts = profile?.media_count || 0;
  const categories = profile?.categories || [];

  // Web parity (D:/Development/React/RS_Gossips MyInformationDetail.jsx):
  // My Work shows every live link the creator submitted on accepted
  // campaigns — NOT a manually-curated reels list. Pulled from list-campaigns,
  // flattened across c.submissionLinks, filtered to live/completed statuses.
  const [campaignSubmissions, setCampaignSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setSubmissionsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await invokeFn<{campaigns?: any[]}>('list-campaigns', {
          influencerId: user.id,
        });
        if (cancelled) return;
        setCampaignSubmissions(Array.isArray(data?.campaigns) ? data.campaigns : []);
      } catch (e) {
        console.warn('Failed to fetch campaign submissions:', e);
      } finally {
        if (!cancelled) setSubmissionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const submittedLiveLinks = useMemo<LiveSubmission[]>(() => {
    const items: LiveSubmission[] = [];
    for (const c of campaignSubmissions) {
      const isLive =
        c.applicationStatus === 'live_submitted' ||
        c.applicationStatus === 'completed';
      if (!isLive) continue;
      const links = Array.isArray(c.submissionLinks) ? c.submissionLinks : [];
      for (const l of links) {
        if (!l?.url) continue;
        items.push({
          url: l.url,
          type: l.type || 'link',
          label: l.label || 'Live post',
          campaignId: c.id,
          campaignTitle: c.title || 'Campaign',
          brandName: c.brandName || 'Brand',
          brandLogo: c.brandLogo,
          applicationStatus: c.applicationStatus,
        });
      }
    }
    return items;
  }, [campaignSubmissions]);

  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const metrics = [
    {label: 'Engagement', value: profile?.engagement_rate ? `${profile.engagement_rate}%` : '—', color: 'blue'},
    {label: 'Followers', value: formatCount(followers), color: 'purple'},
    {label: 'Avg Likes', value: formatCount(profile?.avg_likes), color: 'pink'},
    {label: 'Avg Comments', value: formatCount(profile?.avg_comments), color: 'green'},
    {label: 'Impressions', value: formatCount(profile?.total_impressions), color: 'amber'},
    {label: 'Reach', value: formatCount(profile?.total_reach), color: 'cyan'},
  ];

  return (
    <View className="flex-1 bg-white">
      {/* Back Button */}
      <View className="px-5 pt-4 pb-2">
        <TouchableOpacity
          onPress={onBack}
          className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center">
          <ChevronLeft size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Card with gradient border */}
        <LinearGradient
          colors={['#9810FA', '#E60076', '#FF6BA1']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={{marginHorizontal: 20, marginTop: 8, borderRadius: 20, padding: 2}}>
        <View
          className="bg-white items-center"
          style={{paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20, borderRadius: 18}}>
          {/* Avatar — bumped bottom margin to 24px so the floating Edit2
              corner badge (which extends ~8px below the avatar's layout
              box via -bottom-2) clears the name properly on iOS instead
              of squeezing into the 16px mb-4 the design was built around. */}
          <View className="relative" style={{marginBottom: 24}}>
            {photo ? (
              <Image
                key={photo}
                source={{uri: photo}}
                className="w-24 h-24 rounded-2xl"
                // elevation isn't on ImageStyle in RN types but works at runtime.
                style={
                  {
                    shadowColor: '#EC4899',
                    shadowOffset: {width: 0, height: 4},
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 6,
                  } as any
                }
              />
            ) : (
              <LinearGradient
                colors={['#FF2D78', '#FF6BA1']}
                style={{width: 96, height: 96, borderRadius: 16, alignItems: 'center', justifyContent: 'center'}}>
                <Text className="text-white text-3xl font-bold">{initials}</Text>
              </LinearGradient>
            )}
            <TouchableOpacity
              onPress={onEditProfile}
              activeOpacity={0.85}
              hitSlop={8}
              className="absolute -bottom-2 -right-2 bg-[#1A1A1A] p-2 rounded-xl"
              style={{borderWidth: 2, borderColor: 'white'}}>
              <Edit2 size={10} color="white" />
            </TouchableOpacity>
          </View>

          {/* Name + Handle */}
          <Text className="text-xl font-extrabold text-[#1A1A1A]">{name}</Text>
          <Text className="text-sm text-gray-400 italic">@{handle}</Text>

          {/* Instagram handle pill */}
          <View className="flex-row items-center mt-2 bg-pink-50 px-3 py-1 rounded-full" style={{gap: 4}}>
            <Instagram size={12} color="#E60076" />
            <Text className="text-[11px] font-medium text-pink-600">@{handle}</Text>
          </View>

          {/* Stats Row */}
          <View className="flex-row w-full mt-5 pt-4 border-t border-gray-100 justify-around">
            <View className="items-center">
              <Text className="text-lg font-black text-[#1A1A1A]">{formatCount(posts)}</Text>
              <Text className="text-[10px] font-bold text-gray-400 uppercase">Posts</Text>
            </View>
            <View className="w-px h-9 bg-gray-100" />
            <View className="items-center">
              <Text className="text-lg font-black text-[#1A1A1A]">{formatCount(followers)}</Text>
              <Text className="text-[10px] font-bold text-gray-400 uppercase">Followers</Text>
            </View>
            <View className="w-px h-9 bg-gray-100" />
            <View className="items-center">
              <Text className="text-lg font-black text-[#1A1A1A]">{formatCount(following)}</Text>
              <Text className="text-[10px] font-bold text-gray-400 uppercase">Following</Text>
            </View>
          </View>

          {/* Edit Profile Button — use a real flex gap instead of an
              ml-2 margin so the icon + label center predictably on iOS
              (where Text carries an implicit lineHeight that throws off
              margin-based horizontal centering). marginTop bumped to 20
              so the button isn't tighter to the stats row than it is to
              the card's bottom edge. */}
          <TouchableOpacity
            className="w-full flex-row items-center justify-center"
            onPress={onEditProfile}
            style={{
              borderRadius: 12,
              height: 44,
              overflow: 'hidden',
              marginTop: 20,
              gap: 8,
            }}>
            <LinearGradient
              colors={['#E60076', '#FF6BA1']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
            />
            <Edit2 size={16} color="white" />
            <Text className="text-white font-bold text-sm">Edit Profile</Text>
          </TouchableOpacity>
        </View>
        </LinearGradient>

        {/* Engagement Metrics */}
        <View className="mx-5 mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <View className="flex-row items-center mb-4" style={{gap: 6}}>
            <Text className="text-lg">√</Text>
            <Text className="text-base font-black text-[#1A1A1A]">Engagement Metrics</Text>
          </View>

          <View className="flex-row flex-wrap" style={{gap: 10}}>
            {metrics.map(m => (
              <View
                key={m.label}
                style={{width: '47%'}}
                className="bg-slate-50 rounded-xl p-3">
                <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {m.label}
                </Text>
                {m.value !== '—' ? (
                  <Text className="text-lg font-black" style={{color: METRIC_COLORS[m.color] || '#1A1A1A'}}>
                    {m.value}
                  </Text>
                ) : (
                  <View className="h-1 w-8 rounded-full mt-2" style={{backgroundColor: METRIC_COLORS[m.color]}} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* My Work — live submission links pulled from list-campaigns.
            Mirrors web (D:/Development/React/RS_Gossips MyInformationDetail.jsx):
            shows one card per submitted live post on an accepted campaign,
            with the brand logo as the backdrop, the deliverable label in
            the top-left, and the status pill (Pending / Approved) top-right. */}
        <View className="mx-5 mt-6 mb-4">
          <View className="flex-row items-center mb-4" style={{gap: 6}}>
            <View className="w-1 h-5 bg-[#E60076] rounded-full" />
            <Text className="text-lg font-black text-[#1A1A1A]">My Work</Text>
            <Text className="text-sm text-gray-400 font-bold">
              {submittedLiveLinks.length}
            </Text>
          </View>

          {submissionsLoading ? (
            <View className="py-10 items-center" style={{gap: 8}}>
              <ActivityIndicator size="small" color="#E60076" />
              <Text className="text-xs font-bold text-gray-400">Loading…</Text>
            </View>
          ) : submittedLiveLinks.length === 0 ? (
            <View className="bg-white border border-dashed border-gray-200 rounded-2xl p-6 items-center">
              <Text className="text-sm font-bold text-gray-500">
                No live submissions yet.
              </Text>
              <Text className="text-[11px] text-gray-400 mt-1 text-center">
                Your approved campaign live links will show up here.
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap" style={{gap: 8}}>
              {submittedLiveLinks.map(sub => (
                <SubmissionCard
                  key={`${sub.campaignId}-${sub.url}`}
                  sub={sub}
                  size={(width - 50) / 2}
                />
              ))}
            </View>
          )}
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* BottomNav is rendered by the parent InfluencerProfile at the
          SafeAreaView level so it actually floats on every subview. */}
    </View>
  );
};

function SubmissionCard({sub, size}: {sub: LiveSubmission; size: number}) {
  const status = SUBMISSION_STATUS_BADGE[sub.applicationStatus];
  const initials = (sub.brandName || '?').charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => Linking.openURL(sub.url).catch(() => {})}
      style={{
        width: size,
        aspectRatio: 3 / 4,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        backgroundColor: '#F1F5F9',
      }}>
      {/* Backdrop — brand logo when present, else gradient + initial. */}
      {sub.brandLogo ? (
        <Image
          source={{uri: sub.brandLogo}}
          style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={['#6366F1', '#9810FA', '#EC4899']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={{position: 'absolute', inset: 0}}>
          <View className="flex-1 items-center justify-center">
            <Text className="text-white text-5xl font-black">{initials}</Text>
          </View>
        </LinearGradient>
      )}

      {/* Type / label badge — top-left */}
      <View
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          backgroundColor: 'rgba(0,0,0,0.6)',
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 999,
        }}>
        <Text className="text-[9px] font-black text-white uppercase tracking-wider">
          {sub.label}
        </Text>
      </View>

      {/* Status pill — top-right */}
      {status ? (
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: status.bg,
          }}>
          <Text
            className="text-[9px] font-black uppercase tracking-wider"
            style={{color: status.fg}}>
            {status.label}
          </Text>
        </View>
      ) : null}

      {/* Brand + campaign overlay — bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 10,
        }}>
        <Text className="text-[10px] font-bold text-white/80" numberOfLines={1}>
          {sub.brandName}
        </Text>
        <Text className="text-[10px] font-black text-white" numberOfLines={1}>
          {sub.campaignTitle}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default MyInformationDetail;
