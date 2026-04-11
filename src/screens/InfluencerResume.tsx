import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import {
  ChevronLeft,
  Download,
  Share2,
  RefreshCw,
  Edit3,
  ExternalLink,
  Zap,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import {NEXT_PUBLIC_SUPABASE_URL as SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as SUPABASE_ANON_KEY} from '@env';

function formatCount(n: number | undefined) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export default function InfluencerResume() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {profile, user} = useAuth();
  const resumeId = route.params?.id;

  const [influencer, setInfluencer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const isOwner = user?.id === resumeId || !resumeId;

  useEffect(() => {
    const fetchProfile = async () => {
      const targetId = resumeId || user?.id;
      if (!targetId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/check-profile`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({userId: targetId}),
          },
        );
        const data = await res.json();
        if (data?.profile) {
          setInfluencer(data.profile);
        }
      } catch {}
      setLoading(false);
    };
    fetchProfile();
  }, [resumeId, user?.id]);

  const handleDownload = () => {
    if (influencer?.resume_pdf_url) {
      Linking.openURL(influencer.resume_pdf_url);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
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
          regenerateResume: true,
        }),
      });
    } catch {}
    setRegenerating(false);
  };

  const data = influencer || profile;
  const name = data?.full_name || 'Creator';
  const handle = data?.instagram_handle || data?.username || 'creator';
  const photo = data?.profile_photo_url;
  const followers = data?.followers_count || 0;
  const engagement = data?.engagement_rate || 0;
  const categories = data?.categories || [];
  const services = data?.services || [];
  const serviceRates = data?.service_rates || {};
  const bio = data?.bio || '';
  const demographics = data?.audience_demographics || ({} as any);

  const SERVICE_LABELS: Record<string, string> = {
    reels: 'Reels',
    stories: 'Stories',
    shorts: 'YouTube Shorts',
    posts: 'Static Posts',
    ugc: 'UGC Videos',
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#0b0b0f] items-center justify-center" style={{gap: 12}}>
        <ActivityIndicator size="large" color="#9810FA" />
        <Text className="text-sm font-bold text-gray-500">
          Loading resume...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0b0b0f]">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-5 pt-14 pb-6 flex-row items-center justify-between">
          <Pressable
            onPress={() => navigation.goBack()}
            className="p-2 rounded-full bg-white/10">
            <ChevronLeft size={20} color="white" />
          </Pressable>
          <TouchableOpacity
            onPress={handleDownload}
            className="flex-row items-center bg-white px-5 py-3 rounded-xl"
            style={{gap: 8}}>
            <Download size={18} color="#000" />
            <Text className="text-sm font-bold text-black">Download PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View className="px-5 mb-8">
          <Text className="text-3xl font-bold text-white tracking-tight">
            Media Kit / Resume
          </Text>
          <Text className="text-gray-400 mt-2">
            AI-Powered insights for {name}
          </Text>
        </View>

        {/* Resume Card */}
        <View className="mx-4 bg-[#1a1a20] rounded-2xl border border-white/5 overflow-hidden">
          {/* Profile Header */}
          <LinearGradient
            colors={['#9810FA', '#E60076', '#f472b6']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            className="p-6 flex-row items-center"
            style={{gap: 16}}>
            {photo ? (
              <Image
                source={{uri: photo}}
                className="w-20 h-20 rounded-full"
                style={{borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)'}}
              />
            ) : (
              <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center">
                <Text className="text-white text-2xl font-bold">
                  {name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-2xl font-black text-white">{name}</Text>
              <Text className="text-white/70 text-sm mt-1">@{handle}</Text>
              {categories.length > 0 && (
                <View className="flex-row flex-wrap mt-2" style={{gap: 6}}>
                  {categories.slice(0, 2).map((cat: string) => (
                    <View key={cat} className="bg-white/20 px-3 py-1 rounded-full">
                      <Text className="text-[10px] font-bold text-white">{cat}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Stats Grid */}
          <View className="p-5" style={{gap: 16}}>
            <View className="flex-row" style={{gap: 8}}>
              <View className="flex-1 bg-white/5 rounded-xl p-4 items-center">
                <Text className="text-xs text-gray-500">Followers</Text>
                <Text className="text-xl font-bold text-white">{formatCount(followers)}</Text>
              </View>
              <View className="flex-1 bg-white/5 rounded-xl p-4 items-center">
                <Text className="text-xs text-gray-500">Engagement</Text>
                <Text className="text-xl font-bold text-white">{engagement}%</Text>
              </View>
              <View className="flex-1 bg-white/5 rounded-xl p-4 items-center">
                <Text className="text-xs text-gray-500">Posts</Text>
                <Text className="text-xl font-bold text-white">{formatCount(data?.media_count)}</Text>
              </View>
            </View>

            {/* Bio */}
            {bio ? (
              <View className="bg-white/5 rounded-xl p-4">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About</Text>
                <Text className="text-sm text-gray-300 leading-relaxed">{bio}</Text>
              </View>
            ) : null}

            {/* Services & Rates */}
            {services.length > 0 && (
              <View className="bg-white/5 rounded-xl p-4" style={{gap: 8}}>
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">Services & Rates</Text>
                {services.map((svc: string) => (
                  <View key={svc} className="flex-row items-center justify-between py-2 border-b border-white/5">
                    <Text className="text-sm text-gray-300">{SERVICE_LABELS[svc] || svc}</Text>
                    <Text className="text-sm font-bold text-white">
                      {serviceRates[svc] ? `₹${Number(serviceRates[svc]).toLocaleString('en-IN')}` : 'On request'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Demographics */}
            {demographics?.topCities?.length > 0 && (
              <View className="bg-white/5 rounded-xl p-4" style={{gap: 8}}>
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top Audience Cities</Text>
                {demographics.topCities.slice(0, 5).map((c: any) => (
                  <View key={c.name} className="flex-row items-center" style={{gap: 8}}>
                    <Text className="text-xs text-gray-400 w-20">{c.name}</Text>
                    <View className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <LinearGradient
                        colors={['#8B5CF6', '#EC4899']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 0}}
                        style={{width: `${Math.min(c.pct, 100)}%`, height: '100%', borderRadius: 100}}
                      />
                    </View>
                    <Text className="text-xs font-bold text-gray-500 w-10 text-right">{c.pct}%</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <View className="bg-white/5 rounded-xl p-4" style={{gap: 8}}>
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expertise</Text>
                <View className="flex-row flex-wrap" style={{gap: 6}}>
                  {categories.map((cat: string) => (
                    <View key={cat} className="bg-purple-500/20 px-3 py-1.5 rounded-full">
                      <Text className="text-xs font-bold text-purple-300">{cat}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Sidebar Controls */}
        <View className="px-4 mt-6" style={{gap: 12}}>
          {/* Creator Snapshot */}
          <View className="bg-[#16161d] border border-white/10 rounded-2xl p-6">
            <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
              Creator Snapshot
            </Text>
            <View className="flex-row" style={{gap: 12}}>
              <View className="flex-1 bg-white/5 rounded-xl p-3 items-center">
                <Text className="text-xs text-gray-500">Reach</Text>
                <Text className="text-xl font-bold text-white">{formatCount(followers)}</Text>
              </View>
              <View className="flex-1 bg-white/5 rounded-xl p-3 items-center">
                <Text className="text-xs text-gray-500">Engagement</Text>
                <Text className="text-xl font-bold text-white">{engagement}%</Text>
              </View>
            </View>
          </View>

          {/* Owner Controls or Hire CTA */}
          {isOwner ? (
            <View className="bg-[#16161d] border border-white/10 rounded-2xl p-6" style={{gap: 12}}>
              <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Manage Resume
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('InfluencerProfile' as never)}
                className="flex-row items-center bg-white/10 rounded-xl p-4"
                style={{gap: 12}}>
                <Edit3 size={18} color="#A78BFA" />
                <View className="flex-1">
                  <Text className="text-sm font-bold text-white">Edit Profile</Text>
                  <Text className="text-xs text-gray-500">Update your info to refresh resume</Text>
                </View>
                <ExternalLink size={14} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRegenerate}
                disabled={regenerating}
                className="flex-row items-center bg-white/10 rounded-xl p-4"
                style={{gap: 12, opacity: regenerating ? 0.5 : 1}}>
                <RefreshCw size={18} color="#A78BFA" />
                <View className="flex-1">
                  <Text className="text-sm font-bold text-white">
                    {regenerating ? 'Regenerating...' : 'Regenerate Resume'}
                  </Text>
                  <Text className="text-xs text-gray-500">1 generation per month</Text>
                </View>
                {regenerating && <ActivityIndicator size="small" color="#A78BFA" />}
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6" style={{gap: 12}}>
              <View className="flex-row items-center" style={{gap: 8}}>
                <Zap size={18} color="#818CF8" />
                <Text className="text-lg font-bold text-indigo-400">
                  Hire this Creator
                </Text>
              </View>
              <Text className="text-sm text-gray-400">
                Contact {name} directly for your next campaign.
              </Text>
              <TouchableOpacity className="w-full py-3 bg-indigo-500 rounded-xl items-center">
                <Text className="text-white font-bold text-sm">
                  Send Collaboration Inquiry
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
