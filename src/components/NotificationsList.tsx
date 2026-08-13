// Shared notifications list — same component drives both the brand and
// influencer notification screens. Reads from the `notifications` edge
// function, marks rows read on tap (and offers a bulk "Mark all read"),
// and parses optional JSON bodies of the form `{text, link}` so future
// in-app deep links work once we have a router map for them.
//
// Web parity: src/app/brands/notifications/page.js and the equivalent
// influencer file. The same icon / background colour map is used on both
// sides because the notification `type` enum is global.

import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {
  Bell,
  CheckCircle,
  IndianRupee,
  RotateCcw,
  Upload,
  UserPlus,
  XCircle,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../context/AuthContext';
import {invokeFn} from '../lib/api';
import {openManagePlan} from '../lib/manage-plan';

type TFunc = (key: string, opts?: any) => string;

export type NotificationRow = {
  id?: string;
  user_id?: string;
  type?: string;
  title?: string;
  body?: string;
  is_read?: boolean;
  created_at?: string;
};

type IconBundle = {Icon: any; color: string; bg: string};

const TYPE_STYLES: Record<string, IconBundle> = {
  welcome: {Icon: UserPlus, color: '#a855f7', bg: '#FAF5FF'},
  new_application: {Icon: UserPlus, color: '#3b82f6', bg: '#EFF6FF'},
  deliverables_submitted: {Icon: Upload, color: '#6366f1', bg: '#EEF2FF'},
  live_submitted: {Icon: Upload, color: '#06b6d4', bg: '#ECFEFF'},
  app_completed: {Icon: CheckCircle, color: '#10b981', bg: '#ECFDF5'},
  app_accepted: {Icon: CheckCircle, color: '#10b981', bg: '#ECFDF5'},
  app_approved: {Icon: CheckCircle, color: '#3b82f6', bg: '#EFF6FF'},
  app_rejected: {Icon: XCircle, color: '#ef4444', bg: '#FEF2F2'},
  app_revision_needed: {Icon: RotateCcw, color: '#f97316', bg: '#FFF7ED'},
  app_payment: {Icon: IndianRupee, color: '#f59e0b', bg: '#FFFBEB'},
  campaign_invite: {Icon: UserPlus, color: '#5851DB', bg: '#EEF2FF'},
};

function parseBody(body: string | undefined): {
  text: string;
  link: string | null;
  // Optional structured payload — most notification rows include either a
  // campaign_id or an application_id so we can deep-link straight to the
  // relevant detail page without parsing the link string.
  campaignId: string | null;
  applicationId: string | null;
} {
  if (!body) {
    return {text: '', link: null, campaignId: null, applicationId: null};
  }
  try {
    const data = JSON.parse(body);
    return {
      text: data?.text || body,
      link: data?.link || null,
      campaignId: data?.campaign_id || data?.campaignId || null,
      applicationId: data?.application_id || data?.applicationId || null,
    };
  } catch {
    return {text: body, link: null, campaignId: null, applicationId: null};
  }
}

// Translate a web-style href (`/influencer/offers/abc`, `/influencer/campaigns`,
// etc.) into a React-Navigation navigate({name, params}) tuple. Returns null
// if the link doesn't map to a known mobile route — in that case the row
// just marks itself read with no nav side-effect.
function routeFromLink(
  link: string | null,
): {name: string; params?: any} | null {
  if (!link) return null;
  // Strip a leading "/" so the path starts at the segment.
  const cleaned = link.replace(/^\/+/, '');
  // /influencer/offers/<id>  or  /brands/campaigns/<id>
  const offerMatch = cleaned.match(/^influencer\/offers\/([^/?#]+)/i);
  if (offerMatch) return {name: 'InfluencerOfferDetail', params: {id: offerMatch[1]}};
  if (/^influencer\/campaigns/i.test(cleaned)) return {name: 'InfluencerCampaigns'};
  if (/^influencer\/profile/i.test(cleaned)) return {name: 'InfluencerProfile'};
  if (/^influencer\/services\/orders/i.test(cleaned))
    return {name: 'InfluencerServiceOrders'};
  if (/^influencer\/services/i.test(cleaned)) return {name: 'InfluencerServices'};
  // Plans live on the web (no in-app pricing screen). Sentinel handled in
  // handleTap by opening the browser rather than navigating in-app.
  if (/^influencer\/pricing/i.test(cleaned)) return {name: 'ManagePlanWeb'};
  if (/^influencer\/media-kit/i.test(cleaned))
    return {name: 'InfluencerMediaKit'};
  if (/^influencer$/i.test(cleaned) || /^influencer\/?$/.test(cleaned))
    return {name: 'InfluencerHome'};
  return null;
}

// Fallback router used when the body has no `link` string but we still
// know the type — most notification types have an obvious target page.
function routeFromType(
  type: string | undefined,
  campaignId: string | null,
): {name: string; params?: any} | null {
  if (!type) return null;
  // Anything tied to a specific campaign opens that campaign's detail page
  // when we have the id.
  const offerTypes = [
    'new_application',
    'app_approved',
    'app_rejected',
    'app_accepted',
    'app_completed',
    'app_revision_needed',
    'deliverables_submitted',
    'live_submitted',
    'app_payment',
  ];
  if (offerTypes.includes(type) || type === 'campaign_invite') {
    return campaignId
      ? {name: 'InfluencerOfferDetail', params: {id: campaignId}}
      : {name: 'InfluencerCampaigns'};
  }
  if (type === 'welcome') return {name: 'InfluencerHome'};
  return null;
}

function relativeTime(iso: string | undefined, t: TFunc): string {
  if (!iso) return '';
  const date = new Date(iso).getTime();
  if (!isFinite(date)) return '';
  const diff = Date.now() - date;
  const min = Math.floor(diff / 60_000);
  const hr = Math.floor(diff / 3_600_000);
  const day = Math.floor(diff / 86_400_000);
  if (min < 1) return t('NotificationsList.justNow');
  if (min < 60) return t('NotificationsList.minutesAgo', {count: min});
  if (hr < 24) return t('NotificationsList.hoursAgo', {count: hr});
  if (day < 7) return t('NotificationsList.daysAgo', {count: day});
  return new Date(iso).toLocaleDateString(undefined, {day: 'numeric', month: 'short'});
}

interface Props {
  // Theme — controls the back-button + brand accent colour. Brand side uses
  // indigo, influencer side keeps the existing pink.
  accentColor?: string;
  // Optional message rendered when the list is empty.
  emptyHint?: string;
}

export function NotificationsList({
  accentColor = '#E60076',
  emptyHint,
}: Props) {
  const {t} = useTranslation();
  const {user} = useAuth();
  const navigation = useNavigation<any>();
  const resolvedEmptyHint =
    emptyHint ?? t('NotificationsList.emptyHint');
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setError(null);
    try {
      const data = await invokeFn<{notifications?: NotificationRow[]}>(
        'notifications',
        {action: 'list', userId: user.id},
      );
      setItems(data?.notifications || []);
    } catch (err: any) {
      console.warn('notifications/list failed:', err);
      setError(err?.message || t('NotificationsList.loadError'));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (ids: string[] | 'all') => {
    if (!user?.id) return;
    // Optimistic update so the dot disappears instantly. NOTE: the notifications
    // edge fn markRead matches on created_at (not id), so we key on created_at
    // here and in the tap handler — passing id silently no-ops server-side.
    setItems(prev =>
      prev.map(n =>
        ids === 'all' || (n.created_at && ids.includes(n.created_at)) ? {...n, is_read: true} : n,
      ),
    );
    try {
      await invokeFn('notifications', {
        action: 'markRead',
        userId: user.id,
        notificationIds: ids,
      });
    } catch (err) {
      // Silent — the next refresh will reconcile if the write failed.
      console.warn('notifications/markRead failed:', err);
    }
  };

  const unread = items.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator color={accentColor} />
        <Text style={s.loadingText}>{t('NotificationsList.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.emptyWrap}>
        <Text style={[s.emptyTitle, {color: '#dc2626'}]}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{padding: 16, paddingBottom: 40, gap: 10}}>
      {unread > 0 ? (
        <View style={s.headerRow}>
          <Text style={s.unreadCount}>
            {t('NotificationsList.unreadCount', {count: unread})}
          </Text>
          <Pressable onPress={() => markRead('all')} hitSlop={6}>
            <Text style={[s.markAll, {color: accentColor}]}>
              {t('NotificationsList.markAllRead')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {items.length === 0 ? (
        <View style={s.emptyWrap}>
          <Bell size={36} color="#cbd5e1" />
          <Text style={s.emptyTitle}>{t('NotificationsList.emptyTitle')}</Text>
          <Text style={s.emptyHint}>{resolvedEmptyHint}</Text>
        </View>
      ) : (
        items.map((item, i) => {
          const style = TYPE_STYLES[item.type || ''] || {
            Icon: Bell,
            color: '#64748b',
            bg: '#F1F5F9',
          };
          const {Icon} = style;
          const {text, link, campaignId} = parseBody(item.body);
          const isUnread = !item.is_read;
          // Resolve the destination once per render. Body link wins; type +
          // campaign-id fallback covers older notifications that don't carry
          // an explicit link string.
          const dest =
            routeFromLink(link) || routeFromType(item.type, campaignId);
          const handleTap = () => {
            if (item.created_at) markRead([item.created_at]);
            if (!dest) return;
            if (dest.name === 'ManagePlanWeb') {
              openManagePlan();
              return;
            }
            try {
              navigation.navigate(dest.name, dest.params);
            } catch {
              // Route not registered (e.g. brand-side stack) — silent.
            }
          };
          return (
            <Animated.View
              key={`${item.id || i}-${item.created_at}`}
              entering={FadeInDown.delay(Math.min(i, 8) * 40)}>
              <Pressable
                onPress={handleTap}
                style={[
                  s.row,
                  isUnread ? s.rowUnread : s.rowRead,
                ]}>
                <View style={[s.iconWrap, {backgroundColor: style.bg}]}>
                  <Icon size={20} color={style.color} />
                </View>
                <View style={{flex: 1, gap: 4}}>
                  <View style={s.titleRow}>
                    <Text
                      style={[
                        s.title,
                        isUnread ? {color: '#0f172a'} : {color: '#64748b'},
                      ]}
                      numberOfLines={2}>
                      {item.title || t('NotificationsList.notificationFallback')}
                    </Text>
                    <Text style={s.time}>{relativeTime(item.created_at, t)}</Text>
                  </View>
                  {text ? (
                    <Text style={s.body} numberOfLines={3}>
                      {text}
                    </Text>
                  ) : null}
                </View>
                {isUnread ? (
                  <View
                    style={[s.unreadDot, {backgroundColor: accentColor}]}
                  />
                ) : null}
              </Pressable>
            </Animated.View>
          );
        })
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  loadingWrap: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60},
  loadingText: {fontSize: 13, color: '#94a3b8', fontWeight: '600'},
  emptyWrap: {alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 6},
  emptyTitle: {fontSize: 14, fontWeight: '800', color: '#475569'},
  emptyHint: {fontSize: 11, color: '#94a3b8', textAlign: 'center'},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  unreadCount: {fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase'},
  markAll: {fontSize: 11, fontWeight: '800', textTransform: 'uppercase'},
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  rowUnread: {
    backgroundColor: 'white',
    borderColor: '#e2e8f0',
  },
  rowRead: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderColor: 'transparent',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6},
  title: {fontSize: 13, fontWeight: '800', flex: 1, lineHeight: 18},
  time: {fontSize: 9, fontWeight: '700', color: '#94a3b8'},
  body: {fontSize: 11, color: '#64748b', lineHeight: 16},
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
