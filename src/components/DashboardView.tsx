import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Image} from 'react-native';
import LogoutConfirmDialog from './LogoutConfirmDialog';
import {
  Edit2,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  BarChart3,
  FileText,
  Bell,
  Lock,
  LogOut,
  ChevronRight,
  HelpCircle,
  Clock,
  Award,
  Crown,
  Zap,
  Hourglass,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../context/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {useInfluencerCampaigns} from '../hooks/useInfluencerCampaigns';
import {formatINRCompact} from '../lib/influencer-stats';

interface DashboardViewProps {
  onNotificationClick: () => void;
  onPrivacyClick: () => void;
  onOpenAnalytics: () => void;
  onOpenInfo: () => void;
  onhelpSupportClick: () => void;
  onPaymentsClick?: () => void;
}

function formatCount(n: number | undefined) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

const TRIAL_DAYS = 30;

const DashboardView: React.FC<DashboardViewProps> = ({
  onNotificationClick,
  onPrivacyClick,
  onOpenAnalytics,
  onOpenInfo,
  onhelpSupportClick,
  onPaymentsClick,
}) => {
  const {profile, signOut} = useAuth();
  const navigation = useNavigation();
  const [showLogout, setShowLogout] = useState(false);
  const {stats: campaignStats} = useInfluencerCampaigns();

  const name = profile?.full_name || 'Creator';
  const handle = profile?.instagram_handle || profile?.username || '';
  const photo = profile?.profile_photo_url;
  const categories = profile?.categories || [];
  const followers = profile?.followers_count || 0;
  const following = profile?.follows_count || 0;
  const posts = profile?.media_count || 0;

  const currentPlan = profile?.subscription_plan || 'free';
  const hasPaidPlan = currentPlan !== 'free';
  const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
  const elapsed = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, TRIAL_DAYS - elapsed);
  const trialProgress = Math.min(100, Math.round((elapsed / TRIAL_DAYS) * 100));
  const expired = daysLeft === 0;

  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const planLabel = hasPaidPlan
    ? currentPlan.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    : expired ? 'Free' : 'Starter Trial';

  const requestLogout = () => setShowLogout(true);
  const confirmLogout = async () => {
    await signOut();
    setShowLogout(false);
    navigation.navigate('Login' as never);
  };

  return (
    <View className="flex-1 px-5 pt-6" style={{gap: 20}}>
      {/* Page Header */}
      <View className="px-1">
        <Text className="text-2xl font-black text-[#1A1A1A]">Profile</Text>
        <Text className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
          Manage your creator account
        </Text>
      </View>

      {/* Identity Card */}
      <View className="bg-white p-6 rounded-xl shadow-sm border border-white">
        <View className="items-center">
          {/* Avatar */}
          <View className="relative mb-4">
            {photo ? (
              <View className="relative">
                <Image
                  source={{uri: photo}}
                  className="w-24 h-24 rounded-xl"
                  // `elevation` isn't on ImageStyle in RN types — but works
                  // at runtime since the underlying view handles the cast.
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
                <TouchableOpacity
                  onPress={onOpenInfo}
                  className="absolute -bottom-1 -right-1 bg-[#1A1A1A] p-2 rounded-xl"
                  style={{borderWidth: 2, borderColor: 'white'}}>
                  <Edit2 size={12} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="relative">
                <LinearGradient
                  colors={['#FF2D78', '#FF3B8D', '#FF6BA1']}
                  style={{width: 96, height: 96, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#EC4899', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6}}>
                  <Text className="text-white text-3xl font-bold">{initials}</Text>
                </LinearGradient>
                <TouchableOpacity
                  onPress={onOpenInfo}
                  className="absolute -bottom-1 -right-1 bg-[#1A1A1A] p-2 rounded-xl"
                  style={{borderWidth: 2, borderColor: 'white'}}>
                  <Edit2 size={12} color="white" />
                </TouchableOpacity>
              </View>
            )}
            <View className="absolute -top-1 -right-1 w-5 h-5 bg-[#22C55E] rounded-full" style={{borderWidth: 3.5, borderColor: 'white'}} />
          </View>

          {/* Name + Handle */}
          <View className="items-center" style={{gap: 4}}>
            <View className="flex-row items-center" style={{gap: 6}}>
              <Text className="text-xl font-extrabold text-[#1A1A1A]">{name}</Text>
              <View className="bg-[#3B82F6] rounded-full p-0.5">
                <CheckCircle2 size={12} color="white" />
              </View>
            </View>
            {handle ? (
              <Text className="text-sm text-gray-400 font-medium italic">@{handle}</Text>
            ) : null}
          </View>

          {/* Categories */}
          <View className="flex-row flex-wrap justify-center mt-3" style={{gap: 6}}>
            {(categories.length > 0 ? categories : ['Creator']).map((cat: string) => (
              <View key={cat} className="bg-[#F3F4F9] px-4 py-1.5 rounded-full">
                <Text className="text-[10px] font-bold text-[#374151]">{cat}</Text>
              </View>
            ))}
          </View>

          {/* Stats */}
          <View className="w-full mt-6 pt-5 border-t border-gray-100 flex-row justify-around items-center px-2">
            <View className="items-center">
              <Text className="font-black text-[#1A1A1A] text-base">{formatCount(posts)}</Text>
              <Text className="text-[10px] font-bold text-gray-400 uppercase">Posts</Text>
            </View>
            <View className="w-px h-9 bg-gray-100" />
            <View className="items-center">
              <Text className="font-black text-[#1A1A1A] text-base">{formatCount(followers)}</Text>
              <Text className="text-[10px] font-bold text-gray-400 uppercase">Followers</Text>
            </View>
            <View className="w-px h-9 bg-gray-100" />
            <View className="items-center">
              <Text className="font-black text-[#1A1A1A] text-base">{formatCount(following)}</Text>
              <Text className="text-[10px] font-bold text-gray-400 uppercase">Following</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats Grid 2x2 — real data from useInfluencerCampaigns */}
      <View className="flex-row flex-wrap" style={{gap: 12}}>
        <StatCard
          icon={CreditCard}
          title="Total Earnings"
          value={formatINRCompact(campaignStats.totalEarnings)}
          change=""
          color="#10B981"
          bg="#FFFBF5"
        />
        <StatCard
          icon={Clock}
          title="Active Campaigns"
          value={String(campaignStats.activeCount)}
          change=""
          color="#3B82F6"
          bg="#F0F9FF"
        />
        <StatCard
          icon={Award}
          title="Completed"
          value={String(campaignStats.completedCount)}
          change=""
          color="#10B981"
          bg="#F0FDF4"
        />
        <StatCard
          icon={Hourglass}
          title="Expected Earnings"
          value={formatINRCompact(campaignStats.expectedEarnings)}
          change=""
          color="#8B5CF6"
          bg="#FAF5FF"
        />
      </View>

      {/* Creator Hub */}
      <View style={{gap: 12}}>
        <View className="flex-row items-center px-1" style={{gap: 6}}>
          <Text className="text-[#8B5CF6] text-xl">✦</Text>
          <Text className="font-black text-[#2D2D2D] text-lg">Creator Hub</Text>
        </View>

        <View className="p-4 rounded-xl border border-pink-50 bg-white/50 shadow-sm" style={{gap: 12}}>
          {/* My Profile Hub Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenInfo}
            className="bg-[#EFECFF] rounded-2xl p-4">
            <View className="flex-row items-center" style={{gap: 12}}>
              <LinearGradient
                colors={['#8B5CF6', '#6366F1']}
                style={{width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'}}>
                <FileText size={18} color="white" />
              </LinearGradient>
              <View className="flex-1">
                <Text className="text-sm font-bold text-[#1A1A1A]">My Profile</Text>
                <Text className="text-[10px] text-gray-400 font-medium">View, edit and manage your profile</Text>
              </View>
              <ChevronRight size={16} color="#CBD5E1" />
            </View>
            <View className="mt-4">
              <View className="flex-row justify-between items-center mb-1.5 px-1">
                <Text className="text-[9px] font-black text-gray-400 uppercase">Profile Complete</Text>
                <Text className="text-[10px] font-black text-[#10B981]">80%</Text>
              </View>
              <View className="w-full h-2 bg-white/60 rounded-full overflow-hidden" style={{borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)'}}>
                <View className="h-full bg-[#10B981] rounded-full" style={{width: '80%'}} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Analytics Hub Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenAnalytics}
            className="bg-[#F0F9FF] rounded-2xl p-4">
            <View className="flex-row items-center" style={{gap: 12}}>
              <LinearGradient
                colors={['#3B82F6', '#60A5FA']}
                style={{width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'}}>
                <BarChart3 size={18} color="white" />
              </LinearGradient>
              <View className="flex-1">
                <Text className="text-sm font-bold text-[#1A1A1A]">Analytics</Text>
                <Text className="text-[10px] text-gray-400 font-medium">Track performance and campaign insights</Text>
              </View>
              <ChevronRight size={16} color="#CBD5E1" />
            </View>
            <View className="mt-4 bg-white/60 p-3 rounded-xl flex-row items-end justify-between" style={{borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)'}}>
              <View>
                <Text className="text-[8px] text-gray-400 font-black uppercase">Last 7 Days</Text>
                <Text className="text-sm font-black text-gray-800">+2.4K</Text>
              </View>
              <View className="flex-row items-end h-8" style={{gap: 3}}>
                {[30, 50, 40, 70, 55, 90, 80].map((h, i) => (
                  <View key={i} className="w-1 bg-[#3B82F6] rounded-full" style={{height: `${h}%`}} />
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings */}
      <View style={{gap: 8}}>
        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
          Settings
        </Text>
        <View className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-50">
          <SettingsItem icon={Bell} title="Notifications" sub="Manage alerts and updates" color="#8B5CF6" onPress={onNotificationClick} />
          <SettingsItem icon={Lock} title="Privacy & Security" sub="Control your data and access" color="#10B981" onPress={onPrivacyClick} />
          {onPaymentsClick && (
            <SettingsItem icon={CreditCard} title="Payment Methods" sub="Manage payout accounts" color="#F97316" onPress={onPaymentsClick} />
          )}
        </View>
      </View>

      {/* Plan Card */}
      <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-5" style={{gap: 12}}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center" style={{gap: 12}}>
            <View className="w-10 h-10 bg-purple-100 rounded-xl items-center justify-center">
              <Crown size={20} color="#9333EA" />
            </View>
            <View>
              <Text className="font-bold text-sm text-[#1A1A1A]">{planLabel}</Text>
              <Text className="text-[10px] text-gray-400 font-medium">
                {hasPaidPlan ? 'Active subscription' : expired ? 'Trial expired' : `${daysLeft} days left`}
              </Text>
            </View>
          </View>
          {hasPaidPlan && (
            <View className="bg-green-50 px-2.5 py-1 rounded-full">
              <Text className="text-[9px] font-black text-green-600 uppercase tracking-wider">Active</Text>
            </View>
          )}
        </View>

        {!hasPaidPlan && (
          <View>
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-row items-center" style={{gap: 6}}>
                <Zap size={12} color={expired ? '#F87171' : '#9333EA'} fill={expired ? '#F87171' : '#9333EA'} />
                <Text className="text-[10px] font-bold text-gray-400 uppercase">
                  {expired ? 'Expired' : 'Trial Progress'}
                </Text>
              </View>
              <Text className={`text-[10px] font-black ${expired ? 'text-red-400' : 'text-purple-600'}`}>
                {daysLeft}/{TRIAL_DAYS} days
              </Text>
            </View>
            <View className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <LinearGradient
                colors={expired ? ['#F87171', '#F87171'] : ['#9810fa', '#e60076']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={{width: `${trialProgress}%`, height: '100%', borderRadius: 100}}
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('InfluencerPricing' as never)}>
          <LinearGradient
            colors={['#9810fa', '#e60076']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={{borderRadius: 12, height: 44}}
            className="flex-row items-center justify-center">
            <Crown size={16} color="white" />
            <Text className="text-white text-sm font-bold ml-2">
              {hasPaidPlan ? 'Manage Plan' : 'Upgrade Now'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Support */}
      <View style={{gap: 12}}>
        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
          Support
        </Text>
        <TouchableOpacity
          onPress={onhelpSupportClick}
          className="bg-white p-5 rounded-xl shadow-sm border border-slate-50 flex-row items-center"
          style={{gap: 14}}>
          <View className="w-12 h-12 bg-[#6366F1] rounded-xl items-center justify-center">
            <HelpCircle size={24} color="white" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-sm text-[#1A1A1A]">Help & Support</Text>
            <Text className="text-[11px] text-gray-400 font-medium">FAQs and contact us</Text>
          </View>
          <ChevronRight size={18} color="#CBD5E1" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={requestLogout}
          className="w-full py-4 bg-white rounded-xl flex-row items-center justify-center"
          style={{borderWidth: 2, borderColor: '#FFF1F2', gap: 8}}>
          <LogOut size={18} color="#FF2D78" />
          <Text className="text-[#FF2D78] font-black text-sm">Log Out</Text>
        </TouchableOpacity>

        <Text className="text-center text-[10px] font-bold text-gray-300 mb-4">
          Recentgossips • Made for creators
        </Text>
      </View>

      <View className="h-20" />

      <LogoutConfirmDialog
        visible={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={confirmLogout}
      />
    </View>
  );
};

function StatCard({icon: Icon, title, value, change, color, bg}: {
  icon: any; title: string; value: string; change: string; color: string; bg: string;
}) {
  return (
    <View style={{width: '48%', backgroundColor: bg}} className="p-4 rounded-xl border border-white shadow-sm">
      <View className="w-10 h-10 bg-white/80 rounded-xl items-center justify-center mb-3">
        <Icon size={20} color={color} />
      </View>
      <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{title}</Text>
      <View className="flex-row items-baseline mt-1" style={{gap: 6}}>
        <Text className="text-xl font-black text-[#1A1A1A]">{value}</Text>
        {change ? (
          <Text className="text-[10px] font-bold" style={{color}}>{change}</Text>
        ) : null}
      </View>
    </View>
  );
}

const SettingsItem = ({icon: Icon, title, sub, color, onPress}: {
  icon: any; title: string; sub: string; color: string; onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center p-5 border-b border-gray-50"
    style={{gap: 14}}>
    <View className="w-10 h-10 rounded-xl items-center justify-center" style={{backgroundColor: color}}>
      <Icon size={20} color="white" />
    </View>
    <View className="flex-1">
      <Text className="font-bold text-sm text-[#1A1A1A]">{title}</Text>
      <Text className="text-[11px] text-gray-400 font-medium">{sub}</Text>
    </View>
    <ChevronRight size={18} color="#CBD5E1" />
  </TouchableOpacity>
);

export default DashboardView;
