import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Instagram,
  Youtube,
  Smartphone,
  CheckCircle,
  CheckCircle2,
  Clock,
  Star,
  Users,
  TrendingUp,
  Calendar,
  MapPin,
  Wallet,
  Gift,
  ShieldCheck,
  Share2,
  Heart,
  Eye,
  BarChart3,
  Bookmark,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import ApplyCampaignForm from '../components/ApplyCampaignForm';
import BottomNav from '../components/BottomNav';
import {
  NEXT_PUBLIC_SUPABASE_URL as SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as SUPABASE_ANON_KEY,
} from '@env';

function PlatformIcon({platform, size = 20}: {platform: string; size?: number}) {
  switch (platform) {
    case 'instagram': return <Instagram size={size} color="#EC4899" />;
    case 'youtube': return <Youtube size={size} color="#EF4444" />;
    case 'tiktok': return <Smartphone size={size} color="#1E293B" />;
    default: return null;
  }
}

function ReqIcon({type}: {type: string}) {
  switch (type) {
    case 'users': return <Users size={16} color="#10B981" />;
    case 'trending': return <TrendingUp size={16} color="#10B981" />;
    case 'star': return <Star size={16} color="#10B981" />;
    default: return <CheckCircle size={16} color="#10B981" />;
  }
}

export default function InfluencerOfferDetail() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {user} = useAuth();
  const campaignId = route.params?.id;

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [refetchFlag, setRefetchFlag] = useState(0);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId) return setLoading(false);
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/list-campaigns`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({influencerId: user?.id}),
        });
        const data = await res.json();
        const found = data?.campaigns?.find((c: any) => c.id === campaignId);
        if (found) {
          const brandCampaigns = data.campaigns.filter((c: any) => c.brandName === found.brandName);
          const activeBrand = brandCampaigns.filter((c: any) => c.status === 'Active').length;
          setCampaign({
            ...found,
            heroImg: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80',
            about: found.description || 'No description available for this campaign.',
            slots: found.maxInfluencers || 0,
            requirements: [
              {icon: 'users', label: `Min Followers: ${found.tags?.length > 0 ? '1K+' : 'Any'}`, sub: 'Minimum requirement'},
              {icon: 'trending', label: `Category: ${found.tags?.[0] || 'Any'}`, sub: 'Target niche'},
              {icon: 'star', label: `Location: ${found.location}`, sub: 'Target region'},
            ],
            payments: [{type: 'base', label: 'Base Payment', val: found.budget, sub: 'Per influencer'}],
            brandStats: {campaigns: brandCampaigns.length, success: `${activeBrand} active`, response: '24h'},
            deliverableIcons: found.deliverables
              ? found.deliverables.split(' + ').map((d: string) => {
                  const parts = d.split(':');
                  return {platform: 'instagram', count: parts[1] || '1', label: parts[0] || d};
                })
              : [],
          });
        }
      } catch {}
      setLoading(false);
    };
    fetchCampaign();
  }, [campaignId, user?.id, refetchFlag]);

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center" style={{gap: 12}}>
        <ActivityIndicator size="large" color="#9810FA" />
        <Text className="text-sm font-bold text-slate-400">Loading campaign...</Text>
      </View>
    );
  }

  if (!campaign) {
    return (
      <View className="flex-1 bg-white items-center justify-center" style={{gap: 12}}>
        <Text className="text-lg font-bold text-slate-600">Campaign not found</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text className="text-sm text-purple-500 font-bold">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const isActive = campaign.status === 'Active';
  const isApplied = campaign.status === 'Applied';
  const isCompleted = campaign.status === 'Completed';
  const hasApplied = !!campaign.applicationStatus;

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View className="relative h-56">
          <Image source={{uri: campaign.heroImg}} className="w-full h-full" resizeMode="cover" />
          <View className="absolute inset-0" style={{backgroundColor: 'rgba(0,0,0,0.3)'}} />

          {/* Top buttons */}
          <View className="absolute top-4 left-4 right-4 flex-row justify-between">
            <Pressable onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              <ChevronLeft size={20} color="white" />
            </Pressable>
            <View className="flex-row" style={{gap: 8}}>
              {isCompleted && (
                <View className="bg-emerald-500 px-3 py-1.5 rounded-full">
                  <Text className="text-white text-[10px] font-bold">Completed</Text>
                </View>
              )}
              <Pressable className="w-9 h-9 rounded-full bg-white/20 items-center justify-center">
                <Share2 size={16} color="white" />
              </Pressable>
              <Pressable className="w-9 h-9 rounded-full bg-white/20 items-center justify-center">
                <Heart size={16} color="white" />
              </Pressable>
            </View>
          </View>

          {/* Brand badge */}
          <LinearGradient
            colors={['#3B82F6', '#6366F1']}
            className="absolute bottom-4 left-4 w-14 h-14 rounded-2xl items-center justify-center"
            style={{borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)'}}>
            <Text className="text-white text-xl font-bold">
              {campaign.initials || campaign.title?.substring(0, 2)?.toUpperCase()}
            </Text>
          </LinearGradient>
        </View>

        <View className="px-5 py-5" style={{gap: 20}}>
          {/* Title */}
          <View>
            <Text className="text-xl font-black text-slate-900 mb-1">{campaign.title}</Text>
            <View className="flex-row items-center" style={{gap: 4}}>
              <Text className="text-sm text-slate-400 font-medium">{campaign.brandName}</Text>
              <CheckCircle2 size={14} color="#3B82F6" />
            </View>
          </View>

          {/* Budget / Deadline / Slots pills */}
          <View className="flex-row flex-wrap" style={{gap: 8}}>
            <View className="flex-row items-center bg-emerald-50 px-4 py-2.5 rounded-2xl" style={{gap: 8}}>
              <View className="w-8 h-8 bg-emerald-500 rounded-xl items-center justify-center">
                <Text className="text-white text-xs font-bold">₹</Text>
              </View>
              <View>
                <Text className="text-xs font-black text-slate-800">{campaign.budget}</Text>
                <Text className="text-[9px] text-slate-400">Budget</Text>
              </View>
            </View>
            {campaign.deadline && (
              <View className="flex-row items-center bg-red-50 px-4 py-2.5 rounded-2xl" style={{gap: 8}}>
                <View className="w-8 h-8 bg-red-100 rounded-xl items-center justify-center">
                  <Calendar size={14} color="#EF4444" />
                </View>
                <View>
                  <Text className="text-xs font-black text-slate-800">{campaign.deadline}</Text>
                  <Text className="text-[9px] text-red-400">{campaign.daysLeft} left</Text>
                </View>
              </View>
            )}
            {campaign.slots > 0 && (
              <View className="flex-row items-center bg-purple-50 px-4 py-2.5 rounded-2xl" style={{gap: 8}}>
                <View className="w-8 h-8 bg-purple-100 rounded-xl items-center justify-center">
                  <Users size={14} color="#9810FA" />
                </View>
                <View>
                  <Text className="text-xs font-black text-slate-800">{campaign.slots} slots</Text>
                  <Text className="text-[9px] text-slate-400">Available</Text>
                </View>
              </View>
            )}
          </View>

          {/* Content Deliverables */}
          {campaign.deliverableIcons?.length > 0 && (
            <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <Text className="text-base font-bold text-slate-800 mb-4">Content Deliverables</Text>
              <View className="flex-row" style={{gap: 10}}>
                {campaign.deliverableIcons.map((d: any, i: number) => (
                  <View key={i} className="flex-1 items-center bg-slate-50 rounded-2xl p-4" style={{gap: 6}}>
                    <View className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm">
                      <PlatformIcon platform={d.platform} />
                    </View>
                    <Text className="text-2xl font-black text-slate-800">{d.count}</Text>
                    <Text className="text-[10px] font-bold text-slate-400">{d.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* About Campaign */}
          <View style={{gap: 8}}>
            <Text className="text-base font-bold text-slate-800">About Campaign</Text>
            <Text className="text-sm text-slate-500 leading-relaxed">{campaign.about}</Text>
          </View>

          {/* Requirements */}
          {campaign.requirements && (
            <View style={{gap: 8}}>
              <Text className="text-base font-bold text-slate-800">Requirements</Text>
              <View style={{gap: 8}}>
                {campaign.requirements.map((req: any, i: number) => (
                  <View key={i} className="flex-row items-center bg-white p-3.5 rounded-2xl border border-slate-50 shadow-sm" style={{gap: 12}}>
                    <View className="w-9 h-9 bg-emerald-50 rounded-xl items-center justify-center">
                      <ReqIcon type={req.icon} />
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-slate-800">{req.label}</Text>
                      <Text className="text-[11px] text-slate-400">{req.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Payment & Benefits */}
          {campaign.payments && (
            <View style={{gap: 8}}>
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-bold text-slate-800">Payment & Benefits</Text>
                <View className="flex-row items-center bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100" style={{gap: 4}}>
                  <ShieldCheck size={12} color="#10B981" />
                  <Text className="text-[10px] font-bold text-emerald-500 uppercase">Verified</Text>
                </View>
              </View>
              <View style={{gap: 8}}>
                {campaign.payments.map((p: any, i: number) => (
                  <View key={i} className={`flex-row items-center p-4 rounded-2xl border shadow-sm ${p.type === 'product' ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-50'}`} style={{gap: 12}}>
                    <View className={`w-10 h-10 rounded-xl items-center justify-center ${p.type === 'base' ? 'bg-emerald-50' : p.type === 'bonus' ? 'bg-pink-50' : 'bg-purple-50'}`}>
                      {p.type === 'base' ? <Wallet size={18} color="#10B981" /> : p.type === 'bonus' ? <TrendingUp size={18} color="#EC4899" /> : <Gift size={18} color="#9810FA" />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] font-bold text-slate-400 uppercase">{p.label}</Text>
                      <Text className="text-sm font-black text-slate-800">{p.val}</Text>
                    </View>
                  </View>
                ))}
                {/* Exclusive banner */}
                <LinearGradient
                  colors={['#34D399', '#10B981']}
                  className="rounded-2xl p-4 flex-row items-center"
                  style={{gap: 12, borderRadius: 16}}>
                  <Gift size={20} color="white" />
                  <View>
                    <Text className="text-sm font-bold text-white">Exclusive Event/Rights</Text>
                    <Text className="text-[10px] text-emerald-100">Brand gets content + licensing for 6 months</Text>
                  </View>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* About Brand */}
          <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm" style={{gap: 12}}>
            <Text className="text-sm font-bold text-slate-800">About Brand</Text>
            <View className="flex-row items-center" style={{gap: 12}}>
              <LinearGradient
                colors={['#3B82F6', '#6366F1']}
                style={{width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center'}}>
                <Text className="text-white text-sm font-bold">{campaign.initials || 'B'}</Text>
              </LinearGradient>
              <View>
                <View className="flex-row items-center" style={{gap: 4}}>
                  <Text className="text-sm font-bold text-slate-800">{campaign.brandName}</Text>
                  <CheckCircle2 size={12} color="#3B82F6" />
                </View>
                <Text className="text-[10px] text-slate-400 mt-0.5">{campaign.tags?.join(', ') || 'Brand'}</Text>
              </View>
            </View>
            {campaign.brandStats && (
              <View className="flex-row" style={{gap: 8}}>
                {[
                  {val: campaign.brandStats.campaigns, label: 'Campaigns'},
                  {val: campaign.brandStats.success, label: 'Success'},
                  {val: campaign.brandStats.response, label: 'Response'},
                ].map((s, i) => (
                  <View key={i} className="flex-1 bg-slate-50 rounded-xl p-2 items-center">
                    <Text className="text-xs font-black text-slate-800">{s.val}</Text>
                    <Text className="text-[8px] font-bold text-slate-400 uppercase">{s.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Applied: Application Timeline */}
          {isApplied && campaign.timeline && (
            <View className="bg-blue-50 rounded-2xl p-5 border border-blue-100" style={{gap: 12}}>
              <View className="flex-row items-center" style={{gap: 12}}>
                <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center">
                  <Clock size={18} color="white" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-slate-800">Application Submitted</Text>
                  <Text className="text-xs font-bold text-blue-600">Pending Review</Text>
                </View>
              </View>
              {campaign.timeline.map((step: any, i: number) => (
                <View key={i} className="flex-row items-center ml-2" style={{gap: 12}}>
                  <View className={`w-6 h-6 rounded-full items-center justify-center ${step.done ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                    {step.done ? <CheckCircle size={14} color="white" /> : <View className="w-2 h-2 bg-slate-300 rounded-full" />}
                  </View>
                  <View>
                    <Text className={`text-sm font-bold ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</Text>
                    <Text className="text-[10px] text-slate-400">{step.date}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Completed: Performance + Payment */}
          {isCompleted && campaign.performance && (
            <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm" style={{gap: 12}}>
              <View className="flex-row items-center" style={{gap: 8}}>
                <View className="w-7 h-7 bg-purple-500 rounded-lg items-center justify-center">
                  <BarChart3 size={14} color="white" />
                </View>
                <Text className="font-bold text-slate-900">Performance Highlights</Text>
              </View>
              <View className="flex-row flex-wrap" style={{gap: 8}}>
                {[
                  {icon: Eye, label: 'Total Views', val: campaign.performance.totalViews, bg: 'bg-orange-50', color: '#F97316'},
                  {icon: Heart, label: 'Engagement', val: campaign.performance.engagement, bg: 'bg-emerald-50', color: '#10B981'},
                  {icon: Users, label: 'Reach', val: campaign.performance.reach, bg: 'bg-blue-50', color: '#3B82F6'},
                  {icon: Bookmark, label: 'Saves', val: campaign.performance.saves, bg: 'bg-amber-50', color: '#F59E0B'},
                ].map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <View key={i} className={`flex-1 min-w-[45%] ${m.bg} rounded-xl p-3`}>
                      <View className="flex-row items-center mb-1" style={{gap: 4}}>
                        <Icon size={12} color={m.color} />
                        <Text className="text-[9px] font-bold text-slate-400 uppercase">{m.label}</Text>
                      </View>
                      <Text className="text-lg font-black text-slate-900">{m.val}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {isCompleted && campaign.paymentAmount && (
            <View className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex-row items-center justify-between">
              <View className="flex-row items-center" style={{gap: 12}}>
                <View className="w-9 h-9 bg-emerald-500 rounded-full items-center justify-center">
                  <CheckCircle size={18} color="white" />
                </View>
                <View>
                  <Text className="text-[10px] font-bold text-slate-400 uppercase">Payment Status</Text>
                  <Text className="text-sm font-black text-emerald-600">{campaign.paymentStatus}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-[10px] font-bold text-slate-400 uppercase">Earnings</Text>
                <Text className="text-xl font-black text-slate-900">{campaign.paymentAmount}</Text>
              </View>
            </View>
          )}

          {/* Brand Feedback (completed) */}
          {isCompleted && campaign.brandFeedback && (
            <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm" style={{gap: 12}}>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-slate-800">Brand Feedback</Text>
                <View className="flex-row" style={{gap: 2}}>
                  {[...Array(campaign.brandFeedback.rating || 5)].map((_: any, i: number) => (
                    <Star key={i} size={12} color="#FBBF24" fill="#FBBF24" />
                  ))}
                </View>
              </View>
              <Text className="text-xs text-slate-500 italic leading-relaxed">{campaign.brandFeedback.text}</Text>
            </View>
          )}
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Mobile floating action bar — above bottom nav */}
      {isActive && !hasApplied && (
        <View className="absolute bottom-16 left-0 right-0 p-4 bg-white/95 border-t border-slate-100">
          <TouchableOpacity activeOpacity={0.9} onPress={() => setShowApplyForm(true)}>
            <LinearGradient
              colors={['#9810FA', '#E60076']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={{borderRadius: 16, height: 48}}
              className="flex-row items-center justify-center">
              <Text className="text-white font-bold text-sm">Apply for Campaign</Text>
              <ChevronRight size={16} color="white" style={{marginLeft: 4}} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Nav */}
      <View className="absolute bottom-0 left-0 right-0">
        <BottomNav />
      </View>

      {/* Apply Form Modal */}
      <ApplyCampaignForm
        visible={showApplyForm}
        onClose={() => setShowApplyForm(false)}
        campaignData={campaign}
        onSubmitSuccess={() => {
          setShowApplyForm(false);
          setRefetchFlag(f => f + 1);
        }}
      />
    </View>
  );
}
