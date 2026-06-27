import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Image} from 'react-native';
import LogoutConfirmDialog from './LogoutConfirmDialog';
import {
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
  Briefcase,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Circle, Defs, LinearGradient as SvgLinearGradient, Stop} from 'react-native-svg';
import {useAuth} from '../context/AuthContext';
import {useNavigation} from '@react-navigation/native';
import {useInfluencerCampaigns} from '../hooks/useInfluencerCampaigns';
import {formatINRCompact} from '../lib/influencer-stats';
import {cacheBustedPhotoUrl} from '../utils/photoUrl';

// Mirrors the web useProfileCompletion hook (CompleteProfileCard.jsx).
// Step 5 (apply to first campaign) auto-completes once step 4 (rate card) is done.
function computeProfileCompletion(profile: any) {
  const hasInstagram = !!profile?.instagram_handle;
  const hasMediaKit = !!profile?.media_kit_published;
  const serviceRates = profile?.service_rates || profile?.serviceRates || {};
  const hasRates = Object.values(serviceRates).some((v: any) => v && Number(v) > 0);
  const completed =
    1 + // step 1: account created
    (hasInstagram ? 1 : 0) +
    (hasMediaKit ? 1 : 0) +
    (hasRates ? 1 : 0) +
    (hasRates ? 1 : 0); // step 5 mirrors step 4
  const total = 5;
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
    hasInstagram,
    hasMediaKit,
    hasRates,
  };
}

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
  const photo = cacheBustedPhotoUrl(profile);
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

  const completion = computeProfileCompletion(profile);
  const openMediaKit = () => navigation.navigate('InfluencerMediaKit' as never);
  const openServiceRequests = () =>
    navigation.navigate('InfluencerServiceOrders' as never);

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
            ) : (
              <LinearGradient
                colors={['#FF2D78', '#FF3B8D', '#FF6BA1']}
                style={{width: 96, height: 96, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#EC4899', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6}}>
                <Text className="text-white text-3xl font-bold">{initials}</Text>
              </LinearGradient>
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

      {/* Media Kit card — shown only after the user has published a kit.
          Mirrors the web /influencer/profile placement (above Stats Grid). */}
      {profile?.media_kit_published && (
        <TouchableOpacity
          onPress={openMediaKit}
          activeOpacity={0.85}
          className="bg-white p-4 rounded-xl border border-gray-100 flex-row items-center"
          style={{
            gap: 12,
            shadowColor: '#19162b',
            shadowOpacity: 0.06,
            shadowRadius: 10,
            shadowOffset: {width: 0, height: 4},
            elevation: 2,
          }}>
          <View className="w-10 h-10 rounded-xl bg-purple-50 items-center justify-center">
            <FileText size={18} color="#8B5CF6" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-[#1A1A1A]">Media Kit</Text>
            <Text className="text-[11px] text-gray-400 font-semibold mt-0.5">
              View or share your published kit
            </Text>
          </View>
          <ChevronRight size={16} color="#CBD5E1" />
        </TouchableOpacity>
      )}

      {/* Profile Completion card — gradient ring + checklist of remaining steps.
          Hidden once 100% complete; otherwise tappable items jump to the
          relevant edit surface. */}
      <ProfileCompletionCard
        completion={completion}
        onOpenInfo={onOpenInfo}
        onOpenMediaKit={openMediaKit}
      />

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

        <View style={{gap: 12}}>
          {/* My Profile Hub Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenInfo}
            className="bg-[#EFECFF] rounded-2xl p-4 flex-row items-center"
            style={{
              gap: 12,
              shadowColor: '#19162b',
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: {width: 0, height: 4},
              elevation: 3,
            }}>
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
          </TouchableOpacity>

          {/* Campaign Analytics Hub Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenAnalytics}
            className="bg-[#F0F9FF] rounded-2xl p-4 flex-row items-center"
            style={{
              gap: 12,
              shadowColor: '#19162b',
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: {width: 0, height: 4},
              elevation: 3,
            }}>
            <LinearGradient
              colors={['#3B82F6', '#60A5FA']}
              style={{width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'}}>
              <BarChart3 size={18} color="white" />
            </LinearGradient>
            <View className="flex-1">
              <Text className="text-sm font-bold text-[#1A1A1A]">Campaign Analytics</Text>
              <Text className="text-[10px] text-gray-400 font-medium">Track performance and campaign insights</Text>
            </View>
            <ChevronRight size={16} color="#CBD5E1" />
          </TouchableOpacity>

          {/* Service Requests Hub Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={openServiceRequests}
            className="bg-[#FEF3F2] rounded-2xl p-4 flex-row items-center"
            style={{
              gap: 12,
              shadowColor: '#19162b',
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: {width: 0, height: 4},
              elevation: 3,
            }}>
            <LinearGradient
              colors={['#F43F5E', '#FB7185']}
              style={{width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'}}>
              <Briefcase size={18} color="white" />
            </LinearGradient>
            <View className="flex-1">
              <Text className="text-sm font-bold text-[#1A1A1A]">Service Requests</Text>
              <Text className="text-[10px] text-gray-400 font-medium">Your quote requests, orders & deliveries</Text>
            </View>
            <ChevronRight size={16} color="#CBD5E1" />
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
          onPress={() => navigation.navigate('InfluencerPricing' as never)}
          className="flex-row items-center justify-center"
          style={{borderRadius: 12, height: 44, overflow: 'hidden'}}>
          <LinearGradient
            colors={['#9810fa', '#e60076']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
          />
          <Crown size={16} color="white" />
          <Text className="text-white text-sm font-bold ml-2">
            {hasPaidPlan ? 'Manage Plan' : 'Upgrade Now'}
          </Text>
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

// Mirrors web's ProfileCompletionCard: gradient ring + heading + 2-col
// checklist of remaining steps. Hidden once 100% complete.
function ProfileCompletionCard({
  completion,
  onOpenInfo,
  onOpenMediaKit,
}: {
  completion: ReturnType<typeof computeProfileCompletion>;
  onOpenInfo: () => void;
  onOpenMediaKit: () => void;
}) {
  const {percent, completed, total, hasInstagram, hasMediaKit, hasRates} =
    completion;
  const isDone = percent === 100;

  const RING_SIZE = 56;
  const RING_STROKE = 5;
  const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const ringOffset = RING_CIRCUMFERENCE - RING_CIRCUMFERENCE * (percent / 100);

  return (
    <View
      className="bg-white rounded-2xl border border-gray-100 p-5"
      style={{
        shadowColor: '#19162b',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 4},
        elevation: 2,
      }}>
      <View className="flex-row items-center" style={{gap: 16}}>
        <View
          style={{width: RING_SIZE, height: RING_SIZE}}
          className="items-center justify-center">
          <Svg
            width={RING_SIZE}
            height={RING_SIZE}
            style={{position: 'absolute', transform: [{rotate: '-90deg'}]}}>
            <Defs>
              <SvgLinearGradient id="completionRing" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#9810fa" />
                <Stop offset="100%" stopColor="#e60076" />
              </SvgLinearGradient>
            </Defs>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke="#F1F5F9"
              strokeWidth={RING_STROKE}
              fill="transparent"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke="url(#completionRing)"
              strokeWidth={RING_STROKE}
              strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </Svg>
          <Text className="text-xs font-black text-slate-800">{percent}%</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-extrabold text-[#1A1A1A]">
            {isDone ? 'Profile complete!' : 'Profile completion'}
          </Text>
          <Text className="text-[11px] font-semibold text-gray-400 mt-0.5">
            {isDone
              ? "You're discoverable to brands."
              : `${completed}/${total} steps done — keep going!`}
          </Text>
        </View>
      </View>

      {!isDone && (
        <View className="flex-row flex-wrap mt-4" style={{gap: 8}}>
          <ChecklistItem done label="Account created" />
          <ChecklistItem done={hasInstagram} label="Instagram connected" onPress={onOpenInfo} />
          <ChecklistItem done={hasMediaKit} label="Media kit published" onPress={onOpenMediaKit} />
          <ChecklistItem done={hasRates} label="Rate card set" onPress={onOpenInfo} />
        </View>
      )}
    </View>
  );
}

// Done items aren't tappable (no edit target). Pending items become buttons
// that jump to the relevant edit surface.
function ChecklistItem({
  done,
  label,
  onPress,
}: {
  done?: boolean;
  label: string;
  onPress?: () => void;
}) {
  const isInteractive = !done && !!onPress;
  const containerStyle = {
    flexBasis: '48%' as const,
    backgroundColor: done ? '#ECFDF5' : '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  };
  const dotStyle = {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: done ? '#10B981' : 'transparent',
    borderWidth: done ? 0 : 2,
    borderColor: '#CBD5E1',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
  const textStyle = {
    color: done ? '#047857' : '#64748B',
    fontSize: 11,
    fontWeight: '700' as const,
    flexShrink: 1,
  };
  const inner = (
    <>
      <View style={dotStyle}>
        {done && <CheckCircle2 size={10} color="#fff" fill="#10B981" />}
      </View>
      <Text style={textStyle} numberOfLines={1}>
        {label}
      </Text>
    </>
  );
  if (isInteractive) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={containerStyle}>
        {inner}
      </TouchableOpacity>
    );
  }
  return <View style={containerStyle}>{inner}</View>;
}

export default DashboardView;
