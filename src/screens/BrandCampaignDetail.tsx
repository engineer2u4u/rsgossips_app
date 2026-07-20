// Brand-side campaign detail.
//
// Mirrors web app src/app/brands/campaign/[id]/page.js. Loads campaign + its
// applications via brand-campaigns (action="get"), renders the header / stats
// / deliverables / requirements / schedule, and lists each application with
// expandable per-row actions (approve / reject / accept / revision / approve
// & release payment with rating).
//
// Edge functions used:
//   - brand-campaigns       — get, updateStatus
//   - update-application-status — per-application status transitions
//   - RatingModal upserts campaign_ratings (rater_role = "brand")

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Star,
  Users,
  X,
} from 'lucide-react-native';
import {supabase} from '../utils/supabase';
import {useAuth} from '../context/AuthContext';
import {invokeFn} from '../lib/api';
import {useGlobalLoading} from '../context/LoadingContext';
import RatingModal from '../components/RatingModal';

type AppStatus =
  | 'pending'
  | 'approved'
  | 'submitted'
  | 'accepted'
  | 'revision_needed'
  | 'live_submitted'
  | 'payment'
  | 'completed'
  | 'rejected';

type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

type InfluencerProfile = {
  full_name?: string;
  username?: string;
  profile_photo_url?: string;
  followers_count?: number;
  media_count?: number;
  instagram_handle?: string;
  categories?: string[];
  bio?: string;
  engagement_rate?: number;
  email?: string;
  location?: string;
  media_kit_published?: boolean;
};

type Application = {
  id: string;
  campaign_id: string;
  influencer_id: string;
  proposed_rate?: number | null;
  // The creator's "why choose you" note (AI-draftable; stored by apply-campaign)
  pitch?: string | null;
  final_agreed_rate?: number | null;
  status: AppStatus;
  rejection_reason?: string | null;
  submission_links?: {type: string; label: string; url: string}[];
  created_at?: string;
  influencer_profiles?: InfluencerProfile;
};

type Campaign = {
  id: string;
  title: string;
  description?: string;
  bannerImage?: string;
  status: CampaignStatus;
  campaignType?: string;
  categories?: string[];
  budgetTotal?: number;
  budgetPerInfluencer?: number;
  maxInfluencers?: number;
  contentTypesRequired?: string[];
  applicationDeadline?: string;
  campaignEndDate?: string;
  startDate?: string;
  location?: string;
  targetCities?: string[];
  targetInfluencerTier?: string;
  targetFollowerMin?: number;
  targetFollowerMax?: number;
  minEngagementRate?: number;
};

const STATUS_PILL: Record<
  CampaignStatus,
  {bg: string; text: string; label: string}
> = {
  draft: {bg: 'bg-slate-100', text: 'text-slate-600', label: 'DRAFT'},
  active: {bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'ACTIVE'},
  paused: {bg: 'bg-amber-100', text: 'text-amber-700', label: 'PAUSED'},
  completed: {bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'COMPLETED'},
};

const APP_STATUS_PILL: Record<AppStatus, {bg: string; text: string; label: string}> = {
  pending: {bg: 'bg-slate-100', text: 'text-slate-700', label: 'Pending'},
  approved: {bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved'},
  submitted: {bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Submitted'},
  accepted: {bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Accepted'},
  revision_needed: {bg: 'bg-amber-100', text: 'text-amber-700', label: 'Revision'},
  live_submitted: {bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Live'},
  payment: {bg: 'bg-purple-100', text: 'text-purple-700', label: 'Payment'},
  completed: {bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed'},
  rejected: {bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected'},
};

function formatCount(n?: number | null) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (!isFinite(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {day: 'numeric', month: 'short', year: 'numeric'});
}

export default function BrandCampaignDetail() {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {user} = useAuth();
  const {withLoading} = useGlobalLoading();
  const id = route.params?.id;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [ratingsByApp, setRatingsByApp] = useState<Record<string, {target_rating: number}>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id || !id) return;
    setError(null);
    setLoading(true);
    try {
      const data = await invokeFn<{
        campaign?: Campaign;
        applications?: Application[];
      }>('brand-campaigns', {action: 'get', campaignId: id, brandId: user.id});
      setCampaign(data?.campaign || null);
      const apps = data?.applications || [];
      setApplications(apps);

      // Pull existing brand-side ratings for all applications in this campaign
      // (one query — RLS lets the brand read its own rows).
      const appIds = apps.map(a => a.id).filter(Boolean);
      if (appIds.length > 0) {
        const {data: ratings} = await supabase
          .from('campaign_ratings')
          .select('application_id, target_rating')
          .in('application_id', appIds)
          .eq('rater_role', 'brand');
        const map: Record<string, {target_rating: number}> = {};
        for (const r of ratings || []) {
          map[(r as any).application_id] = {target_rating: (r as any).target_rating};
        }
        setRatingsByApp(map);
      } else {
        setRatingsByApp({});
      }
    } catch (err: any) {
      console.warn('brand-campaigns get failed:', err);
      setError(err?.message || t('ScreensBrandCampaignDetail.errorLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, id]);

  useEffect(() => {
    load();
  }, [load]);

  const updateCampaignStatus = async (newStatus: CampaignStatus) => {
    if (!user?.id || !campaign?.id) return;
    await withLoading(
      (async () => {
        try {
          await invokeFn('brand-campaigns', {
            action: 'updateStatus',
            campaignId: campaign.id,
            brandId: user.id,
            status: newStatus,
          });
          setCampaign(prev => (prev ? {...prev, status: newStatus} : prev));
        } catch (err: any) {
          Alert.alert(
            t('ScreensBrandCampaignDetail.alertFailedTitle'),
            err?.message || t('ScreensBrandCampaignDetail.errorUpdateStatus'),
          );
        }
      })(),
      t('ScreensBrandCampaignDetail.updatingStatus', {status: newStatus}),
    );
  };

  const parsedContent = useMemo(() => {
    const out: Record<string, number> = {reels: 0, posts: 0, stories: 0, videos: 0};
    for (const item of campaign?.contentTypesRequired || []) {
      const [k, v] = item.split(':');
      if (k && v && k in out) out[k] = Number(v) || 0;
    }
    return out;
  }, [campaign]);

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color="#5851DB" size="large" />
      </View>
    );
  }

  if (error || !campaign) {
    return (
      <View style={s.centered}>
        <Text style={s.errorText}>
          {error || t('ScreensBrandCampaignDetail.campaignNotFound')}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{marginTop: 16}}>
          <Text style={{color: '#5851DB', fontWeight: '700'}}>
            {t('ScreensBrandCampaignDetail.goBack')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = campaign.status;
  const pill = STATUS_PILL[status];

  return (
    <View style={{flex: 1, backgroundColor: '#F8F9FE'}}>
      {/* Top bar */}
      <View style={s.topbar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={s.backBtn}>
          <ArrowLeft size={22} color="#0f172a" />
        </Pressable>
        <View className={`${pill.bg} px-3 py-1 rounded-full`}>
          <Text className={`text-[11px] font-bold ${pill.text}`}>{pill.label}</Text>
        </View>
        <TouchableOpacity onPress={load} hitSlop={8} style={s.refreshBtn}>
          <RefreshCw size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{padding: 16, gap: 14, paddingBottom: 80}}>
        {/* Banner */}
        {campaign.bannerImage ? (
          <Image
            source={{uri: campaign.bannerImage}}
            style={{width: '100%', aspectRatio: 16 / 9, borderRadius: 16, backgroundColor: '#eee'}}
            resizeMode="cover"
          />
        ) : null}

        {/* Title + actions */}
        <View style={s.card}>
          <View style={{flexDirection: 'row', gap: 6, marginBottom: 6, flexWrap: 'wrap'}}>
            {campaign.campaignType ? (
              <View className="bg-purple-50 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-semibold text-[#5851DB] capitalize">
                  {campaign.campaignType}
                </Text>
              </View>
            ) : null}
            {(campaign.categories || []).slice(0, 3).map(c => (
              <View key={c} className="bg-gray-100 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] font-semibold text-gray-600">{c}</Text>
              </View>
            ))}
          </View>
          <Text style={s.title}>{campaign.title}</Text>
          {campaign.description ? (
            <Text style={s.description}>{campaign.description}</Text>
          ) : null}

          {/* Status actions */}
          <View style={{flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap'}}>
            <StatusActions status={status} onChange={updateCampaignStatus} />
          </View>
        </View>

        {/* Stats grid */}
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
          <StatCard
            label={t('ScreensBrandCampaignDetail.statPerInfluencer')}
            value={
              campaign.budgetPerInfluencer
                ? `₹${campaign.budgetPerInfluencer.toLocaleString('en-IN')}`
                : '—'
            }
          />
          <StatCard
            label={t('ScreensBrandCampaignDetail.statTotalBudget')}
            value={
              campaign.budgetTotal
                ? `₹${campaign.budgetTotal.toLocaleString('en-IN')}`
                : '—'
            }
          />
          <StatCard
            label={t('ScreensBrandCampaignDetail.statSlots')}
            value={`${applications.length}/${campaign.maxInfluencers || '∞'}`}
          />
          <StatCard
            label={t('ScreensBrandCampaignDetail.statDeadline')}
            value={formatDate(campaign.applicationDeadline)}
          />
        </View>

        {/* Deliverables */}
        {(parsedContent.reels ||
          parsedContent.posts ||
          parsedContent.stories ||
          parsedContent.videos) > 0 ? (
          <View style={s.card}>
            <Text style={s.sectionTitle}>
              {t('ScreensBrandCampaignDetail.contentDeliverables')}
            </Text>
            <View style={{flexDirection: 'row', gap: 8, marginTop: 10}}>
              {[
                {key: 'reels', label: t('ScreensBrandCampaignDetail.deliverableReels')},
                {key: 'posts', label: t('ScreensBrandCampaignDetail.deliverablePosts')},
                {key: 'stories', label: t('ScreensBrandCampaignDetail.deliverableStories')},
                {key: 'videos', label: t('ScreensBrandCampaignDetail.deliverableVideos')},
              ].map(d => (
                <View key={d.key} style={s.deliverableCell}>
                  <Text style={s.deliverableCount}>{parsedContent[d.key] || 0}</Text>
                  <Text style={s.deliverableLabel}>{d.label}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Applications */}
        <View style={[s.card, {gap: 10}]}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={s.sectionTitle}>
              {t('ScreensBrandCampaignDetail.applicationsCount', {
                count: applications.length,
              })}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}>
              <Users size={12} color="#94a3b8" />
              <Text style={s.statLabel}>
                {t('ScreensBrandCampaignDetail.pendingCount', {
                  count: applications.filter(a => a.status === 'pending').length,
                })}
              </Text>
            </View>
          </View>

          {applications.length === 0 ? (
            <Text style={{color: '#94a3b8', fontSize: 13, paddingVertical: 12}}>
              {t('ScreensBrandCampaignDetail.noApplications')}
            </Text>
          ) : (
            applications.map(app => (
              <BrandApplicationRow
                key={app.id}
                app={app}
                brandId={user!.id}
                defaultRate={campaign.budgetPerInfluencer}
                rating={ratingsByApp[app.id]}
                onRefresh={load}
                onRated={r => setRatingsByApp(prev => ({...prev, [app.id]: r}))}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ─────────── Status actions row ─────────── */

function StatusActions({
  status,
  onChange,
}: {
  status: CampaignStatus;
  onChange: (s: CampaignStatus) => void;
}) {
  const {t} = useTranslation();
  if (status === 'draft') {
    return (
      <ActionBtn
        label={t('ScreensBrandCampaignDetail.actionActivate')}
        Icon={Play}
        color="#16a34a"
        bg="#dcfce7"
        onPress={() => onChange('active')}
      />
    );
  }
  if (status === 'active') {
    return (
      <>
        <ActionBtn
          label={t('ScreensBrandCampaignDetail.actionPause')}
          Icon={Pause}
          color="#d97706"
          bg="#fef3c7"
          onPress={() => onChange('paused')}
        />
        <ActionBtn
          label={t('ScreensBrandCampaignDetail.actionComplete')}
          Icon={CheckCircle}
          color="#4f46e5"
          bg="#e0e7ff"
          onPress={() => onChange('completed')}
        />
      </>
    );
  }
  if (status === 'paused') {
    return (
      <ActionBtn
        label={t('ScreensBrandCampaignDetail.actionResume')}
        Icon={Play}
        color="#16a34a"
        bg="#dcfce7"
        onPress={() => onChange('active')}
      />
    );
  }
  return null;
}

function ActionBtn({
  label,
  Icon,
  color,
  bg,
  onPress,
}: {
  label: string;
  Icon: any;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: bg,
      }}>
      <Icon size={14} color={color} />
      <Text style={{color, fontWeight: '700', fontSize: 13}}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ─────────── Stat card ─────────── */

function StatCard({label, value}: {label: string; value: string}) {
  return (
    <View style={s.statCard}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

/* ─────────── Per-application row ─────────── */

type RowMode = 'approve' | 'reject' | 'revision' | null;

function BrandApplicationRow({
  app,
  brandId,
  defaultRate,
  rating,
  onRefresh,
  onRated,
}: {
  app: Application;
  brandId: string;
  defaultRate?: number;
  rating?: {target_rating: number};
  onRefresh: () => void;
  onRated?: (r: {target_rating: number}) => void;
}) {
  const {t} = useTranslation();
  const {withLoading} = useGlobalLoading();
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<RowMode>(null);
  const [payAmount, setPayAmount] = useState(
    String(app.proposed_rate ?? defaultRate ?? 0),
  );
  const [reason, setReason] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [revisionIndexes, setRevisionIndexes] = useState<number[]>([]);
  const [showRating, setShowRating] = useState(false);

  const inf = app.influencer_profiles || {};
  const displayName =
    inf.full_name ||
    inf.username ||
    inf.instagram_handle ||
    t('ScreensBrandCampaignDetail.creatorFallback');
  const links = Array.isArray(app.submission_links) ? app.submission_links : [];
  const st = APP_STATUS_PILL[app.status] || APP_STATUS_PILL.pending;

  const hasActions = [
    'pending',
    'approved',
    'submitted',
    'revision_needed',
    'live_submitted',
    'payment',
  ].includes(app.status);

  const updateStatus = async (newStatus: AppStatus, extra: Record<string, any> = {}) => {
    await withLoading(
      (async () => {
        try {
          await invokeFn('update-application-status', {
            applicationId: app.id,
            brandId,
            status: newStatus,
            ...extra,
          });
          setMode(null);
          setReason('');
          setRevisionNote('');
          setRevisionIndexes([]);
          onRefresh();
        } catch (err: any) {
          Alert.alert(
            t('ScreensBrandCampaignDetail.alertFailedTitle'),
            err?.message || t('ScreensBrandCampaignDetail.errorUpdateApplication'),
          );
        }
      })(),
      t('ScreensBrandCampaignDetail.updatingApplication'),
    );
  };

  const handleApprove = () => {
    const rate = parseInt(payAmount || '0', 10);
    if (!rate || rate <= 0) {
      Alert.alert(
        t('ScreensBrandCampaignDetail.alertEnterRateTitle'),
        t('ScreensBrandCampaignDetail.alertEnterRateMessage'),
      );
      return;
    }
    updateStatus('approved', {agreedRate: rate});
  };

  const handleReject = () => {
    updateStatus('rejected', {rejectionReason: reason || undefined});
  };

  const handleRevision = () => {
    if (revisionIndexes.length === 0) {
      Alert.alert(
        t('ScreensBrandCampaignDetail.alertPickDeliverableTitle'),
        t('ScreensBrandCampaignDetail.alertPickDeliverableMessage'),
      );
      return;
    }
    const selectedLabels = revisionIndexes.map(
      i =>
        links[i]?.label ||
        links[i]?.type ||
        t('ScreensBrandCampaignDetail.deliverableN', {index: i + 1}),
    );
    updateStatus('revision_needed', {revisionNote, revisionLinks: selectedLabels});
  };

  const toggleRevisionIndex = (i: number) =>
    setRevisionIndexes(prev => (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]));

  return (
    <View style={s.appRow}>
      {/* Summary */}
      <TouchableOpacity
        onPress={() => hasActions && setExpanded(e => !e)}
        activeOpacity={hasActions ? 0.7 : 1}
        style={s.appSummary}>
        <View style={s.appAvatar}>
          {inf.profile_photo_url ? (
            <Image source={{uri: inf.profile_photo_url}} style={{width: 40, height: 40}} />
          ) : (
            <Text style={{color: 'white', fontWeight: '700'}}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={{flex: 1, minWidth: 0}}>
          <Text style={s.appName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={s.appSub} numberOfLines={1}>
            {inf.instagram_handle ? `@${inf.instagram_handle} · ` : ''}
            {t('ScreensBrandCampaignDetail.followersCount', {
              count: formatCount(inf.followers_count),
            })}
            {app.proposed_rate != null ? (
              <Text style={{color: '#5851DB', fontWeight: '700'}}>
                {`  ·  ₹${Number(app.proposed_rate).toLocaleString('en-IN')}`}
              </Text>
            ) : null}
          </Text>
        </View>
        <View className={`${st.bg} px-2 py-0.5 rounded-full`}>
          <Text className={`text-[10px] font-bold ${st.text}`}>{st.label}</Text>
        </View>
        {rating ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              marginLeft: 6,
              backgroundColor: '#fef3c7',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 999,
            }}>
            <Star size={10} color="#d97706" fill="#d97706" />
            <Text style={{fontSize: 10, fontWeight: '700', color: '#92400e'}}>
              {rating.target_rating}/5
            </Text>
          </View>
        ) : null}
        {hasActions ? (
          <ChevronDown
            size={14}
            color="#94a3b8"
            style={{
              marginLeft: 4,
              transform: [{rotate: expanded ? '180deg' : '0deg'}],
            }}
          />
        ) : null}
      </TouchableOpacity>

      {/* Expanded */}
      {expanded && hasActions ? (
        <View style={{borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e2e8f0', padding: 12, gap: 10}}>
          {/* Creator details */}
          <View style={s.detailsCard}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}>
              <Text style={s.detailsHeader}>
                {t('ScreensBrandCampaignDetail.creatorDetails')}
              </Text>
            </View>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
              <Fact
                label={t('ScreensBrandCampaignDetail.factFollowers')}
                value={formatCount(inf.followers_count)}
              />
              <Fact
                label={t('ScreensBrandCampaignDetail.factEngagement')}
                value={inf.engagement_rate != null ? `${inf.engagement_rate}%` : '—'}
              />
              <Fact
                label={t('ScreensBrandCampaignDetail.factPosts')}
                value={formatCount(inf.media_count)}
              />
              <Fact
                label={t('ScreensBrandCampaignDetail.factLocation')}
                value={inf.location || '—'}
              />
              {app.proposed_rate != null ? (
                <Fact
                  label={t('ScreensBrandCampaignDetail.factProposed')}
                  value={`₹${Number(app.proposed_rate).toLocaleString('en-IN')}`}
                  highlight
                />
              ) : null}
              {app.final_agreed_rate != null ? (
                <Fact
                  label={t('ScreensBrandCampaignDetail.factAgreed')}
                  value={`₹${Number(app.final_agreed_rate).toLocaleString('en-IN')}`}
                  highlight
                />
              ) : null}
            </View>
            {app.pitch ? (
              <View
                style={{
                  marginTop: 8,
                  padding: 8,
                  borderRadius: 10,
                  backgroundColor: 'rgba(88, 81, 219, 0.06)',
                }}>
                <Text style={{fontSize: 10, fontWeight: '800', color: '#5851DB', textTransform: 'uppercase', letterSpacing: 0.5}}>
                  {t('ScreensBrandCampaignDetail.pitchLabel')}
                </Text>
                <Text style={{fontSize: 11, color: '#1e293b', marginTop: 3, lineHeight: 16}}>
                  {app.pitch}
                </Text>
              </View>
            ) : null}
            {inf.bio ? (
              <Text style={{fontSize: 11, color: '#475569', marginTop: 8, lineHeight: 16}}>
                {inf.bio}
              </Text>
            ) : null}
            {app.status === 'rejected' && app.rejection_reason ? (
              <View
                style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: '#fecaca',
                }}>
                <Text style={{fontSize: 10, fontWeight: '700', color: '#b91c1c'}}>
                  {t('ScreensBrandCampaignDetail.rejectionReasonLabel')}
                </Text>
                <Text style={{fontSize: 11, color: '#475569', marginTop: 2}}>
                  {app.rejection_reason}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Submission links */}
          {links.length > 0 ? (
            <View style={{gap: 6}}>
              <Text style={s.detailsHeader}>
                {t('ScreensBrandCampaignDetail.submissions')}
              </Text>
              {links.map((l, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => Linking.openURL(l.url)}
                  style={s.submissionRow}>
                  <ExternalLink size={12} color="#5851DB" />
                  <Text style={{flex: 1, fontSize: 11, fontWeight: '600', color: '#334155'}} numberOfLines={1}>
                    {l.label ||
                      l.type ||
                      t('ScreensBrandCampaignDetail.deliverableN', {index: i + 1})}
                  </Text>
                  <Text style={{fontSize: 9, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase'}}>
                    {l.type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {/* Action buttons */}
          {mode === null ? (
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6}}>
              {app.status === 'pending' ? (
                <>
                  <SmallBtn
                    label={t('ScreensBrandCampaignDetail.btnApprove')}
                    Icon={Check}
                    color="#15803d"
                    bg="#dcfce7"
                    onPress={() => setMode('approve')}
                  />
                  <SmallBtn
                    label={t('ScreensBrandCampaignDetail.btnReject')}
                    Icon={X}
                    color="#b91c1c"
                    bg="#fee2e2"
                    onPress={() => setMode('reject')}
                  />
                </>
              ) : null}
              {app.status === 'approved' ? (
                <>
                  <Text style={s.waitingNote}>
                    {t('ScreensBrandCampaignDetail.waitingSubmission')}
                  </Text>
                  <SmallBtn
                    label={t('ScreensBrandCampaignDetail.btnReject')}
                    Icon={X}
                    color="#b91c1c"
                    bg="#fee2e2"
                    onPress={() => setMode('reject')}
                  />
                </>
              ) : null}
              {app.status === 'submitted' ? (
                <>
                  <SmallBtn
                    label={t('ScreensBrandCampaignDetail.btnAccept')}
                    Icon={Check}
                    color="#15803d"
                    bg="#dcfce7"
                    onPress={() => updateStatus('accepted')}
                  />
                  <SmallBtn
                    label={t('ScreensBrandCampaignDetail.btnRevision')}
                    Icon={RotateCcw}
                    color="#c2410c"
                    bg="#ffedd5"
                    onPress={() => setMode('revision')}
                  />
                  <SmallBtn
                    label={t('ScreensBrandCampaignDetail.btnReject')}
                    Icon={X}
                    color="#b91c1c"
                    bg="#fee2e2"
                    onPress={() => setMode('reject')}
                  />
                </>
              ) : null}
              {app.status === 'revision_needed' ? (
                <Text style={s.waitingNote}>
                  {t('ScreensBrandCampaignDetail.waitingResubmit')}
                </Text>
              ) : null}
              {app.status === 'live_submitted' ? (
                <>
                  <SmallBtn
                    label={t('ScreensBrandCampaignDetail.btnApprovePay')}
                    Icon={Check}
                    color="#15803d"
                    bg="#dcfce7"
                    onPress={() => setShowRating(true)}
                  />
                  <SmallBtn
                    label={t('ScreensBrandCampaignDetail.btnRevision')}
                    Icon={RotateCcw}
                    color="#c2410c"
                    bg="#ffedd5"
                    onPress={() => setMode('revision')}
                  />
                </>
              ) : null}
              {app.status === 'payment' ? (
                <Text style={s.waitingNote}>
                  {t('ScreensBrandCampaignDetail.paymentReleased')}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Approve form */}
          {mode === 'approve' ? (
            <View style={[s.formBox, {borderColor: '#bbf7d0', backgroundColor: '#f0fdf4'}]}>
              <Text style={{fontSize: 10, fontWeight: '700', color: '#15803d', textTransform: 'uppercase'}}>
                {t('ScreensBrandCampaignDetail.agreedRateLabel')}
              </Text>
              <TextInput
                keyboardType="number-pad"
                value={payAmount}
                onChangeText={setPayAmount}
                style={s.formInput}
              />
              <View style={{flexDirection: 'row', gap: 8}}>
                <SmallBtn label={t('ScreensBrandCampaignDetail.btnApprove')} Icon={Check} color="white" bg="#16a34a" onPress={handleApprove} />
                <SmallBtn label={t('ScreensBrandCampaignDetail.btnCancel')} Icon={X} color="#475569" bg="#f1f5f9" onPress={() => setMode(null)} />
              </View>
            </View>
          ) : null}

          {/* Reject form */}
          {mode === 'reject' ? (
            <View style={[s.formBox, {borderColor: '#fecaca', backgroundColor: '#fef2f2'}]}>
              <Text style={{fontSize: 10, fontWeight: '700', color: '#b91c1c', textTransform: 'uppercase'}}>
                {t('ScreensBrandCampaignDetail.reasonOptionalLabel')}
              </Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder={t('ScreensBrandCampaignDetail.reasonPlaceholder')}
                placeholderTextColor="#cbd5e1"
                multiline
                style={[s.formInput, {minHeight: 60, textAlignVertical: 'top'}]}
              />
              <View style={{flexDirection: 'row', gap: 8}}>
                <SmallBtn label={t('ScreensBrandCampaignDetail.btnConfirmReject')} Icon={X} color="white" bg="#dc2626" onPress={handleReject} />
                <SmallBtn label={t('ScreensBrandCampaignDetail.btnCancel')} Icon={X} color="#475569" bg="#f1f5f9" onPress={() => setMode(null)} />
              </View>
            </View>
          ) : null}

          {/* Revision form */}
          {mode === 'revision' ? (
            <View style={[s.formBox, {borderColor: '#fed7aa', backgroundColor: '#fff7ed'}]}>
              <Text style={{fontSize: 10, fontWeight: '700', color: '#c2410c', textTransform: 'uppercase'}}>
                {t('ScreensBrandCampaignDetail.selectDeliverablesToRevise')}
              </Text>
              <View style={{gap: 6}}>
                {links.length === 0 ? (
                  <Text style={{fontSize: 11, color: '#94a3b8', fontStyle: 'italic'}}>
                    {t('ScreensBrandCampaignDetail.noDeliverablesToRevise')}
                  </Text>
                ) : (
                  links.map((item, i) => {
                    const selected = revisionIndexes.includes(i);
                    return (
                      <TouchableOpacity
                        key={i}
                        onPress={() => toggleRevisionIndex(i)}
                        style={[s.checkRow, selected && {borderColor: '#fb923c', backgroundColor: '#ffedd5'}]}>
                        <View style={[s.check, selected && {backgroundColor: '#f97316', borderColor: '#f97316'}]}>
                          {selected ? <Check size={10} color="white" /> : null}
                        </View>
                        <Text style={{fontSize: 11, fontWeight: '600', color: '#475569', flex: 1}} numberOfLines={1}>
                          {item.label ||
                            item.type ||
                            t('ScreensBrandCampaignDetail.deliverableN', {index: i + 1})}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
              <TextInput
                value={revisionNote}
                onChangeText={setRevisionNote}
                placeholder={t('ScreensBrandCampaignDetail.revisionNotePlaceholder')}
                placeholderTextColor="#cbd5e1"
                multiline
                style={[s.formInput, {minHeight: 60, textAlignVertical: 'top'}]}
              />
              <View style={{flexDirection: 'row', gap: 8}}>
                <SmallBtn
                  label={t('ScreensBrandCampaignDetail.btnSendForRevision')}
                  Icon={RotateCcw}
                  color="white"
                  bg="#ea580c"
                  onPress={handleRevision}
                />
                <SmallBtn label={t('ScreensBrandCampaignDetail.btnCancel')} Icon={X} color="#475569" bg="#f1f5f9" onPress={() => setMode(null)} />
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Brand rating modal — single axis */}
      <RatingModal
        visible={showRating}
        onClose={() => setShowRating(false)}
        applicationId={app.id}
        campaignId={app.campaign_id}
        brandId={brandId}
        influencerId={app.influencer_id}
        raterRole="brand"
        title={t('ScreensBrandCampaignDetail.ratingTitle')}
        subtitle={t('ScreensBrandCampaignDetail.ratingSubtitle', {name: displayName})}
        sections={[
          {
            key: 'target_rating',
            label: t('ScreensBrandCampaignDetail.ratingSectionLabel', {name: displayName}),
          },
        ]}
        primaryCta={t('ScreensBrandCampaignDetail.ratingPrimaryCta')}
        secondaryCta={t('ScreensBrandCampaignDetail.ratingSecondaryCta')}
        onSaved={saved =>
          onRated?.({target_rating: saved.target_rating || 0})
        }
        onPrimary={() => updateStatus('payment')}
        onSkip={() => updateStatus('payment')}
      />
    </View>
  );
}

function Fact({label, value, highlight}: {label: string; value: string; highlight?: boolean}) {
  return (
    <View style={{minWidth: '45%', flex: 1}}>
      <Text style={{fontSize: 9, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase'}}>
        {label}
      </Text>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: highlight ? '#5851DB' : '#0f172a',
          marginTop: 2,
        }}>
        {value}
      </Text>
    </View>
  );
}

function SmallBtn({
  label,
  Icon,
  color,
  bg,
  onPress,
}: {
  label: string;
  Icon: any;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: bg,
      }}>
      <Icon size={12} color={color} />
      <Text style={{color, fontSize: 11, fontWeight: '700'}}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: '#F8F9FE',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {color: '#64748b', fontSize: 14, fontWeight: '600', textAlign: 'center'},
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {padding: 4},
  refreshBtn: {padding: 4},
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
  },
  title: {fontSize: 18, fontWeight: '800', color: '#0f172a', lineHeight: 24},
  description: {
    fontSize: 13,
    color: '#475569',
    marginTop: 8,
    lineHeight: 18,
  },
  sectionTitle: {fontSize: 13, fontWeight: '800', color: '#0f172a'},
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  statValue: {fontSize: 14, fontWeight: '800', color: '#0f172a', marginTop: 2},
  deliverableCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#F8F9FE',
    borderRadius: 12,
  },
  deliverableCount: {fontSize: 20, fontWeight: '800', color: '#0f172a'},
  deliverableLabel: {fontSize: 10, fontWeight: '700', color: '#94a3b8', marginTop: 2},
  appRow: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  appSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
  },
  appAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  appName: {fontSize: 13, fontWeight: '700', color: '#0f172a'},
  appSub: {fontSize: 11, color: '#94a3b8', marginTop: 2},
  detailsCard: {
    backgroundColor: '#F8F9FE',
    borderRadius: 12,
    padding: 12,
  },
  detailsHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  submissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#F8F9FE',
    borderRadius: 10,
  },
  waitingNote: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  formBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  formInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  check: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
