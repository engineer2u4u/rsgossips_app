import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Linking,
  Share,
  Clipboard,
} from 'react-native';
import {
  MapPin,
  Camera,
  Instagram,
  Youtube,
  Pencil,
  Check,
  X as XIcon,
  Share2,
  Copy,
  Loader2,
  ChevronLeft,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import {NEXT_PUBLIC_SUPABASE_URL as SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as SUPABASE_ANON_KEY} from '@env';
import InfluencerLayout from '../layouts/InfluencerLayout';

const formatCount = (n: number | undefined) => {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
};

const SERVICE_LABELS: Record<string, string> = {
  reels: 'Reels',
  stories: 'Stories',
  shorts: 'YouTube Shorts',
  posts: 'Static Posts',
  ugc: 'UGC Videos',
};

export default function InfluencerMediaKit() {
  const {profile, user} = useAuth();
  const navigation = useNavigation();

  const [bio, setBio] = useState(profile?.bio || '');
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(bio);
  const [published, setPublished] = useState(
    !!profile?.media_kit_published,
  );
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);

  const name = profile?.full_name || 'Creator';
  const handle =
    profile?.instagram_handle || profile?.username || 'creator';
  const photo = profile?.profile_photo_url;
  const categories = profile?.categories || [];
  const location = profile?.location || '';
  const followers = profile?.followers_count || 0;
  const following = profile?.follows_count || 0;
  const posts = profile?.media_count || 0;
  const services = profile?.services || [];
  const serviceRates = profile?.service_rates || {};
  const engagementRate = profile?.engagement_rate || 0;
  const demographics = profile?.audience_demographics || ({} as any);
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const primaryCategory =
    categories.slice(0, 2).join(' & ') || 'Creator';

  const shareUrl = `https://recentgossips.com/kit/${handle}`;

  const updateProfile = useCallback(
    async (data: Record<string, any>) => {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/update-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userId: user?.id,
            table: 'influencer_profiles',
            ...data,
          }),
        });
      } catch {}
    },
    [user],
  );

  const handleBioSave = () => {
    setBio(bioDraft.trim());
    setEditingBio(false);
    updateProfile({bio: bioDraft.trim()});
  };

  const handlePublish = async () => {
    if (publishing || published) return;
    setPublishing(true);
    await updateProfile({mediaKitPublished: true});
    setPublished(true);
    setPublishing(false);
  };

  const handleCopyLink = () => {
    Clipboard.setString(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my media kit: ${shareUrl}`,
        url: shareUrl,
      });
    } catch {}
  };

  return (
    <InfluencerLayout>
      <ScrollView className="flex-1 bg-[#F8F7FB]">
        {/* Header Gradient */}
        <LinearGradient
          colors={['#9810FA', '#E60076', '#f472b6']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          className="px-5 py-8 flex-row items-center"
          style={{gap: 16}}>
          <View className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30">
            {photo ? (
              <Image
                source={{uri: photo}}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-white/20 items-center justify-center">
                <Text className="text-white text-2xl font-bold">
                  {initials}
                </Text>
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text
              className="text-2xl font-black text-white"
              numberOfLines={1}>
              {name}
            </Text>
            <View className="flex-row flex-wrap mt-2" style={{gap: 6}}>
              <View className="flex-row items-center bg-white/90 px-3 py-1 rounded-full" style={{gap: 4}}>
                <Camera size={12} color="#64748B" />
                <Text className="text-[10px] font-bold text-slate-700">
                  {primaryCategory}
                </Text>
              </View>
              {location ? (
                <View className="flex-row items-center bg-white/90 px-3 py-1 rounded-full" style={{gap: 4}}>
                  <MapPin size={12} color="#EC4899" />
                  <Text className="text-[10px] font-bold text-slate-700">
                    {location}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </LinearGradient>

        <View className="px-4 py-6" style={{gap: 16}}>
          {/* About Me */}
          <SectionCard title="About Me">
            {editingBio ? (
              <View style={{gap: 8}}>
                <TextInput
                  value={bioDraft}
                  onChangeText={setBioDraft}
                  placeholder="Write something about yourself..."
                  maxLength={500}
                  multiline
                  className="text-sm text-slate-700 bg-white border border-purple-200 rounded-xl p-3"
                  style={{minHeight: 80}}
                />
                <View className="flex-row items-center justify-between">
                  <Text className="text-[10px] text-slate-400">
                    {bioDraft.length}/500
                  </Text>
                  <View className="flex-row" style={{gap: 8}}>
                    <Pressable
                      onPress={() => {
                        setBioDraft(bio);
                        setEditingBio(false);
                      }}
                      className="flex-row items-center px-3 py-1.5 rounded-lg"
                      style={{gap: 4}}>
                      <XIcon size={14} color="#64748B" />
                      <Text className="text-xs font-semibold text-slate-500">
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable onPress={handleBioSave}>
                      <LinearGradient
                        colors={['#9810FA', '#E60076']}
                        className="flex-row items-center px-3 py-1.5 rounded-lg"
                        style={{gap: 4, borderRadius: 8}}>
                        <Check size={14} color="white" />
                        <Text className="text-xs font-bold text-white">
                          Save
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  setBioDraft(bio);
                  setEditingBio(true);
                }}>
                <View className="flex-row items-start">
                  <Text className="text-sm text-slate-600 leading-relaxed flex-1">
                    {bio ||
                      'Passionate content creator helping brands connect with audiences through authentic storytelling.'}
                  </Text>
                  <Pencil
                    size={13}
                    color="#94A3B8"
                    style={{marginLeft: 8}}
                  />
                </View>
              </Pressable>
            )}
          </SectionCard>

          {/* Expertise */}
          <SectionCard title="Expertise">
            <View className="flex-row flex-wrap" style={{gap: 8}}>
              {(categories.length > 0
                ? categories
                : ['Content Creation']
              ).map((cat: string) => (
                <View
                  key={cat}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
                  <Text className="text-xs font-bold text-slate-700">
                    {cat}
                  </Text>
                </View>
              ))}
            </View>
          </SectionCard>

          {/* Services & Rates */}
          {services.length > 0 && (
            <SectionCard title="Services & Rates">
              <View style={{gap: 8}}>
                {services.map((svcId: string) => (
                  <View
                    key={svcId}
                    className="flex-row items-center justify-between py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Text className="text-sm font-semibold text-slate-700">
                      {SERVICE_LABELS[svcId] || svcId}
                    </Text>
                    <Text className="text-sm font-black text-slate-500">
                      {serviceRates[svcId]
                        ? `₹${Number(serviceRates[svcId]).toLocaleString('en-IN')}`
                        : 'On request'}
                    </Text>
                  </View>
                ))}
              </View>
            </SectionCard>
          )}

          {/* Who's Watching (Demographics) */}
          <SectionCard title="Who's Watching">
            <View style={{gap: 16}}>
              {/* Top Cities */}
              <View>
                <Text className="text-xs font-black text-slate-800 uppercase mb-3">Top Cities</Text>
                <View style={{gap: 8}}>
                  {(demographics?.topCities?.length > 0
                    ? demographics.topCities
                    : [{name: location || '—', pct: 0}]
                  ).map((c: any) => (
                    <View key={c.name} className="flex-row items-center" style={{gap: 8}}>
                      <Text className="text-xs font-semibold text-slate-600 w-20" numberOfLines={1}>{c.name}</Text>
                      <View className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <LinearGradient colors={['#8B5CF6', '#EC4899']} start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                          style={{width: `${Math.min(c.pct, 100)}%`, height: '100%', borderRadius: 100}} />
                      </View>
                      <Text className="text-xs font-bold text-slate-500 w-10 text-right">{c.pct}%</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Age + Gender */}
              <View>
                <Text className="text-xs font-black text-slate-800 uppercase mb-3">Age + Gender</Text>
                <View style={{gap: 8}}>
                  {(demographics?.ageRanges?.length > 0
                    ? demographics.ageRanges
                    : [{range: '18-24', pct: 0}, {range: '25-34', pct: 0}, {range: '35-44', pct: 0}, {range: '45+', pct: 0}]
                  ).map((a: any) => (
                    <View key={a.range} className="flex-row items-center" style={{gap: 8}}>
                      <Text className="text-xs font-semibold text-slate-600 w-12">{a.range}</Text>
                      <View className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <LinearGradient colors={['#8B5CF6', '#EC4899']} start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                          style={{width: `${Math.min(a.pct, 100)}%`, height: '100%', borderRadius: 100}} />
                      </View>
                      <Text className="text-xs font-bold text-slate-500 w-10 text-right">{a.pct}%</Text>
                    </View>
                  ))}
                </View>
                {/* Gender breakdown */}
                <View className="flex-row items-center mt-4" style={{gap: 12}}>
                  <View style={{gap: 4}}>
                    <View className="flex-row items-center" style={{gap: 6}}>
                      <View className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <Text className="text-[11px] font-bold text-slate-600">Female {demographics?.gender?.female || 0}%</Text>
                    </View>
                    <View className="flex-row items-center" style={{gap: 6}}>
                      <View className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                      <Text className="text-[11px] font-bold text-slate-600">Male {demographics?.gender?.male || 0}%</Text>
                    </View>
                    {(demographics?.gender?.other || 0) > 0 && (
                      <View className="flex-row items-center" style={{gap: 6}}>
                        <View className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <Text className="text-[11px] font-bold text-slate-600">Other {demographics.gender.other}%</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Top Countries */}
              {demographics?.topCountries?.length > 0 && (
                <View>
                  <Text className="text-xs font-black text-slate-800 uppercase mb-3">Top Countries</Text>
                  <View style={{gap: 8}}>
                    {demographics.topCountries.map((c: any) => (
                      <View key={c.name} className="flex-row items-center" style={{gap: 8}}>
                        <Text className="text-xs font-semibold text-slate-600 w-12" numberOfLines={1}>{c.name}</Text>
                        <View className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <LinearGradient colors={['#8B5CF6', '#EC4899']} start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                            style={{width: `${Math.min(c.pct, 100)}%`, height: '100%', borderRadius: 100}} />
                        </View>
                        <Text className="text-xs font-bold text-slate-500 w-10 text-right">{c.pct}%</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {!demographics?.topCities?.length && (
                <Text className="text-[10px] text-slate-400 italic">Demographics data will appear after Instagram data refresh</Text>
              )}
            </View>
          </SectionCard>

          {/* Open for Collaborations */}
          <SectionCard title="Open for Collaborations">
            <View className="py-2 items-center">
              <Text className="text-sm font-semibold text-slate-700 mb-1">Interested in working together?</Text>
              <Text className="text-xs text-slate-500 text-center">Reach out via Instagram or through the RGossips platform</Text>
            </View>
          </SectionCard>

          {/* Social Media */}
          <SectionCard title="Social Media">
            <View className="flex-row flex-wrap" style={{gap: 8}}>
              <SocialStat icon={<Instagram size={18} color="#EC4899" />} label="Instagram" value={formatCount(followers)} />
              <SocialStat icon={<Youtube size={18} color="#EF4444" />} label="YouTube" value="—" />
              <SocialStat icon={<Instagram size={18} color="#1E293B" />} label="TikTok" value="—" />
              <SocialStat icon={<Youtube size={18} color="#3B82F6" />} label="Facebook" value="—" />
            </View>
          </SectionCard>

          {/* Performance */}
          <SectionCard title="Performance">
            <Text className="text-xl font-black text-slate-900 mb-4">
              The <Text style={{color: '#EC4899'}}>NUMBER</Text> That Matters
            </Text>
            <View className="flex-row flex-wrap" style={{gap: 8}}>
              <View className="flex-1 min-w-[45%] bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reels and Post Views</Text>
                <Text className="text-2xl font-black text-slate-900">
                  {profile?.total_impressions ? formatCount(profile.total_impressions) : formatCount(followers * 2)}
                </Text>
                <Text className="text-[10px] text-slate-400 mt-1">↑ {engagementRate}% / 30 Days</Text>
              </View>
              <View className="flex-1 min-w-[45%] rounded-2xl p-4 overflow-hidden">
                <LinearGradient colors={['#EC4899', '#A855F7']} style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16}} />
                <Text className="text-[10px] font-bold text-white/80 uppercase tracking-wider mb-1">Engagement Rate</Text>
                <Text className="text-2xl font-black text-white">{engagementRate || 0}%</Text>
                <Text className="text-[10px] text-white/70 mt-1">vs 1.9% category avg</Text>
              </View>
              <View className="flex-1 min-w-[45%] bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Non-Follower Reach</Text>
                <Text className="text-2xl font-black text-slate-900">
                  {profile?.total_reach ? Math.round((profile.total_reach / (followers || 1)) * 100) : 62}%
                </Text>
                <Text className="text-[10px] text-slate-400 mt-1">organic discovery</Text>
              </View>
              <View className="flex-1 min-w-[45%] bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Interactions</Text>
                <Text className="text-2xl font-black text-slate-900">
                  {formatCount((profile?.avg_likes || 0) + (profile?.avg_comments || 0))}
                </Text>
                <Text className="text-[10px] text-slate-400 mt-1">avg per post</Text>
              </View>
            </View>
          </SectionCard>

          {/* Footer branding */}
          <View className="flex-row items-center justify-between py-4 border-t border-slate-100">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Generated on RGossips</Text>
            <Text className="text-[10px] font-bold text-slate-300">recentgossips.com</Text>
          </View>

          {/* Publish / Share Card */}
          {published ? (
            <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5" style={{gap: 12}}>
              <Text className="text-sm font-bold text-slate-900">
                Share Your Media Kit
              </Text>
              <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-100 p-3" style={{gap: 8}}>
                <Text
                  className="flex-1 text-xs text-slate-600 font-mono"
                  numberOfLines={1}>
                  {shareUrl}
                </Text>
                <Pressable onPress={handleCopyLink} className="p-2">
                  {copied ? (
                    <Check size={16} color="#16A34A" />
                  ) : (
                    <Copy size={16} color="#94A3B8" />
                  )}
                </Pressable>
              </View>
              <TouchableOpacity onPress={handleShare}>
                <LinearGradient
                  colors={['#9810FA', '#E60076']}
                  style={{borderRadius: 12, height: 44}}
                  className="items-center justify-center flex-row"
                >
                  <Share2 size={16} color="white" />
                  <Text className="text-white font-bold text-sm ml-2">
                    Share
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 items-center" style={{gap: 12}}>
              <View className="w-12 h-12 bg-purple-50 rounded-2xl items-center justify-center">
                <Share2 size={22} color="#9810FA" />
              </View>
              <Text className="text-sm font-bold text-slate-900">
                Publish to Share
              </Text>
              <Text className="text-xs text-slate-500 text-center leading-relaxed">
                Review your media kit, edit your bio, then hit Publish to
                get a shareable link.
              </Text>
              <TouchableOpacity
                onPress={handlePublish}
                disabled={publishing}
                className="w-full">
                <LinearGradient
                  colors={['#9810FA', '#E60076']}
                  style={{
                    borderRadius: 12,
                    height: 44,
                    opacity: publishing ? 0.6 : 1,
                  }}
                  className="items-center justify-center flex-row">
                  {publishing && (
                    <ActivityIndicator
                      size="small"
                      color="white"
                      style={{marginRight: 8}}
                    />
                  )}
                  <Text className="text-white font-bold text-sm">
                    {publishing ? 'Publishing...' : 'Publish Media Kit'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Tips */}
          <LinearGradient
            colors={['#FAF5FF', '#FDF2F8']}
            className="rounded-2xl border border-purple-100 p-5"
            style={{gap: 12, borderRadius: 16}}>
            <Text className="text-sm font-bold text-slate-900">
              Tips to stand out
            </Text>
            {[
              'Keep your Instagram profile up to date',
              'Add your niche categories in profile settings',
              'Share your media kit link in your Instagram bio',
            ].map(tip => (
              <View
                key={tip}
                className="flex-row items-start"
                style={{gap: 8}}>
                <Text className="text-purple-500 mt-0.5">✓</Text>
                <Text className="text-xs text-slate-600 flex-1">
                  {tip}
                </Text>
              </View>
            ))}
          </LinearGradient>
        </View>

        <View className="h-20" />
      </ScrollView>
    </InfluencerLayout>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <View className="flex-row items-center mb-3" style={{gap: 8}}>
        <LinearGradient
          colors={['#9810FA', '#EC4899']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={{width: 20, height: 2, borderRadius: 100}}
        />
        <Text className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function SocialStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View
      className="flex-1 min-w-[45%] flex-row items-center bg-slate-50 border border-slate-100 rounded-xl p-3"
      style={{gap: 12}}>
      <View className="p-2 bg-white rounded-xl border border-slate-100">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-[10px] text-slate-400 font-bold uppercase">
          {label}
        </Text>
      </View>
      <Text className="text-lg font-black text-slate-800">{value}</Text>
    </View>
  );
}
