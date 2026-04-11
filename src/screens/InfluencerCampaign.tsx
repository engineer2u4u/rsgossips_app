import React, {useState, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  Search,
  SlidersHorizontal,
  Activity,
  Clock,
  CheckCircle,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {CampaignCard} from '../components/CampaignCard';
import FilterModal from '../components/FilterModal';
import BottomNav from '../components/BottomNav';
import {useAuth} from '../context/AuthContext';
import {calculateCampaignMatchScore} from '../utils/matchScore';
import {NEXT_PUBLIC_SUPABASE_URL as SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as SUPABASE_ANON_KEY} from '@env';

const TABS = ['Active', 'Applied', 'Completed'];

interface CampaignData {
  id: string;
  initials?: string;
  title: string;
  brandName: string;
  status: string;
  tags: string[];
  budget: string;
  deadline?: string;
  daysLeft?: string;
  deliverables: string;
  location: string;
  platforms: string[];
}

const FALLBACK_CAMPAIGNS: CampaignData[] = [
  {
    id: '1',
    initials: 'SB',
    title: 'Summer Collection',
    brandName: 'StyleBrand Co.',
    status: 'Active',
    tags: ['Fashion', 'Lifestyle'],
    budget: '₹25,000 - ₹35,000',
    deadline: 'Jan 30, 2026',
    daysLeft: '10d',
    deliverables: '2 Reels + 2 Stories',
    location: 'Mumbai, India',
    platforms: ['instagram', 'tiktok'],
  },
  {
    id: '2',
    initials: 'MB',
    title: 'Music Fest Promo',
    brandName: 'MusicWave Events',
    status: 'Applied',
    tags: ['Music', 'Events'],
    budget: '₹30,000 - ₹40,000',
    deadline: 'Feb 10, 2026',
    daysLeft: '21d',
    deliverables: '4 Reels + 2 Videos',
    location: 'Pune',
    platforms: ['instagram', 'youtube'],
  },
  {
    id: '3',
    initials: 'GB',
    title: 'Eco-Friendly Campaign',
    brandName: 'GreenEarth Co.',
    status: 'Completed',
    tags: ['Sustainability', 'Lifestyle'],
    budget: '₹20,000 - ₹25,000',
    deadline: 'Jan 15, 2026',
    deliverables: '2 Videos + 1 Reel',
    location: 'Chennai',
    platforms: ['youtube'],
  },
];

export default function InfluencerCampaign() {
  const {profile, user} = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignData[]>(FALLBACK_CAMPAIGNS);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState({min: 0, max: 200000});
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isVerifiedOnly, setIsVerifiedOnly] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/list-campaigns`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({influencerId: user?.id}),
          },
        );
        const data = await res.json();
        if (data?.campaigns?.length) {
          setCampaigns(
            data.campaigns.map((c: any) => ({
              id: c.id,
              initials: c.initials || c.title?.substring(0, 2)?.toUpperCase(),
              title: c.title || 'Campaign',
              brandName: c.brandName || 'Brand',
              status: c.status || 'Active',
              tags: c.tags || [],
              budget: c.budget
                ? typeof c.budget === 'number'
                  ? `₹${c.budget.toLocaleString('en-IN')}`
                  : c.budget
                : '—',
              deadline: c.deadline || '',
              daysLeft: c.daysLeft ? `${c.daysLeft}d` : '',
              deliverables: c.deliverables || '—',
              location: c.location || 'India',
              platforms: c.platforms || ['instagram'],
            })),
          );
        }
      } catch {
        // Keep fallback
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, [user?.id]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesTab = campaign.status === activeTab;
      const matchesSearch =
        campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.brandName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategories.length === 0 ||
        campaign.tags.some(t =>
          selectedCategories.some(c =>
            t.toLowerCase().includes(c.toLowerCase()),
          ),
        );
      const matchesPlatform =
        selectedPlatforms.length === 0 ||
        campaign.platforms.some(p =>
          selectedPlatforms.map(sp => sp.toLowerCase()).includes(p.toLowerCase()),
        );

      return matchesTab && matchesSearch && matchesCategory && matchesPlatform;
    });
  }, [campaigns, activeTab, searchQuery, selectedCategories, selectedPlatforms]);

  const stats = [
    {
      label: 'Active',
      val: campaigns.filter(c => c.status === 'Active').length,
      icon: Activity,
      iconColor: '#00BA88',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Applied',
      val: campaigns.filter(c => c.status === 'Applied').length,
      icon: Clock,
      iconColor: '#3B82F6',
      bg: 'bg-blue-50',
    },
    {
      label: 'Completed',
      val: campaigns.filter(c => c.status === 'Completed').length,
      icon: CheckCircle,
      iconColor: '#10B981',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-2" style={{gap: 16}}>
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-slate-800">
                Campaigns
              </Text>
              <Text className="text-xs text-slate-400 mt-1 font-medium">
                Track and manage collaborations
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsFiltersOpen(true)}
              className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 items-center justify-center">
              <SlidersHorizontal size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-xl px-4 h-11 shadow-sm border border-slate-100">
            <Search size={18} color="#94A3B8" />
            <TextInput
              placeholder="Search campaigns..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-sm text-slate-700"
            />
          </View>

          {/* Stats Grid */}
          <View className="flex-row" style={{gap: 12}}>
            {stats.map(stat => {
              const Icon = stat.icon;
              return (
                <View
                  key={stat.label}
                  className="flex-1 bg-white p-4 rounded-3xl border border-slate-50 items-center">
                  <View
                    className={`w-10 h-10 ${stat.bg} rounded-xl items-center justify-center mb-2`}>
                    <Icon size={20} color={stat.iconColor} />
                  </View>
                  <Text className="text-lg font-black text-slate-800 leading-none">
                    {stat.val}
                  </Text>
                  <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">
                    {stat.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Tab Switcher */}
          <View className="bg-white p-1.5 rounded-2xl flex-row shadow-sm border border-slate-50" style={{gap: 4}}>
            {TABS.map(tab =>
              activeTab === tab ? (
                <LinearGradient
                  key={tab}
                  colors={['#E60076', '#D500F9']}
                  style={{borderRadius: 12, flex: 1}}>
                  <TouchableOpacity
                    onPress={() => setActiveTab(tab)}
                    className="py-2.5 items-center">
                    <Text className="text-xs font-bold text-white">{tab}</Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className="flex-1 py-2.5 rounded-xl items-center">
                  <Text className="text-xs font-bold text-slate-400">
                    {tab}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>

          {/* Campaign Cards */}
          {loading ? (
            <View className="py-20 items-center" style={{gap: 12}}>
              <ActivityIndicator size="large" color="#9810FA" />
              <Text className="text-sm font-bold text-slate-400">
                Loading campaigns...
              </Text>
            </View>
          ) : (
            <View style={{gap: 16}}>
              {filteredCampaigns.map(campaign => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  matchScore={calculateCampaignMatchScore(profile, campaign)}
                />
              ))}

              {filteredCampaigns.length === 0 && (
                <View className="py-20 bg-white rounded-[32px] items-center">
                  <Text className="text-sm font-bold text-slate-400">
                    No {activeTab.toLowerCase()} campaigns found.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View className="h-20" />
      </ScrollView>

      {/* Bottom Nav */}
      <View className="absolute bottom-0 left-0 right-0">
        <BottomNav />
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        budgetRange={budgetRange}
        setBudgetRange={setBudgetRange}
        selectedPlatforms={selectedPlatforms}
        setSelectedPlatforms={setSelectedPlatforms}
        isVerifiedOnly={isVerifiedOnly}
        setIsVerifiedOnly={setIsVerifiedOnly}
      />
    </SafeAreaView>
  );
}
