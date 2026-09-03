// Brand-side decision-tree support chat — mirrors the mobile influencer
// SupportChatModal's mechanics with the WEB BrandSupportChat.jsx content:
// brand topic tree (My campaigns via brand-campaigns action:"list" +
// per-campaign issues, Payments & escrow, Account & verification,
// Something else → callback), status-aware answers, callback form inserting
// into public.support_callbacks with user_role:"brand".
//
// Accent: the #5851DB → #4A3996 purple family used across brand screens.

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  X,
  Headphones,
  Phone,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../context/AuthContext';
import {supabase} from '../utils/supabase';
import {invokeFn} from '../lib/api';
import {useTranslation} from 'react-i18next';

// Brand accent family (matches web brand surfaces).
const ACCENT = '#5851DB';
const ACCENT_DARK = '#4A3996';
const ACCENT_GRADIENT: readonly [string, string] = [ACCENT, ACCENT_DARK];

// ── Decision tree (brand side — identical shape to web) ───────────────────
//
// `label` / `response` strings here are the stable ENGLISH source of truth —
// `label` is what gets stored in support_callbacks.topic; the UI always
// renders via t(`BrandSupportChatModal.labels.${id}`) etc.

type TreeAction = 'callback' | 'list_for_issue';
type TreeNode = {
  id: string;
  label: string;
  response?: string;
  link?: {href: string};
  action?: TreeAction;
  children?: TreeNode[];
};

const TREE: TreeNode = {
  id: 'root',
  label: 'Hi! 👋 What can I help you with today?',
  children: [
    {
      id: 'my_campaigns',
      label: 'My campaigns',
      action: 'list_for_issue',
    },
    {
      id: 'payments',
      label: 'Payments & escrow',
      children: [
        {
          id: 'pay_escrow_how',
          label: 'How does escrow work?',
          response:
            "Once a creator accepts your offer, you fund the agreed amount into escrow via Razorpay. We hold it safely while the creator delivers; it's only released to them after you approve the live post.",
        },
        {
          id: 'pay_fund_fail',
          label: 'Escrow payment not going through',
          response:
            "Razorpay occasionally declines on the first attempt — retry once, or switch card / UPI / netbanking.",
        },
        {
          id: 'pay_release_how',
          label: 'How do I release payment?',
          response:
            "Open the campaign, review the creator's live links, and approve them.",
          link: {href: 'BrandCampaigns'},
        },
        {
          id: 'pay_refund',
          label: 'Refund for a cancelled campaign',
          response:
            'Escrowed funds for work that never happened are refundable.',
        },
      ],
    },
    {
      id: 'account',
      label: 'Account & verification',
      children: [
        {
          id: 'acct_gstin',
          label: 'Add or update GSTIN',
          response:
            'Open your brand profile and edit the Business Details section.',
          link: {href: 'BrandProfile'},
        },
        {
          id: 'acct_verify',
          label: 'Check my verification status',
          response:
            'Your verification badge and trust score live on your brand profile.',
          link: {href: 'BrandProfile'},
        },
        {
          id: 'acct_edit',
          label: 'Edit my brand profile',
          response:
            'Everything is editable from your brand profile page.',
          link: {href: 'BrandProfile'},
        },
      ],
    },
    {
      id: 'other',
      label: 'Something else',
      children: [
        {id: 'other_callback', label: 'Request a callback', action: 'callback'},
      ],
    },
  ],
};

const findNode = (path: string[]): TreeNode => {
  let cursor: TreeNode = TREE;
  for (const id of path) {
    const next = (cursor.children || []).find(c => c.id === id);
    if (!next) return cursor;
    cursor = next;
  }
  return cursor;
};

const findLabel = (id: string): string => {
  const stack: TreeNode[] = [TREE];
  while (stack.length) {
    const n = stack.pop() as TreeNode;
    if (n.id === id) return n.label;
    if (n.children) stack.push(...n.children);
  }
  return '';
};

// ── Per-campaign issue prompts (mirrors web) ──────────────────────────────
//
// Response text is resolved at click time so it can be status-aware. The
// web ICU select/plural strings are split into distinct keys per branch
// and selected in code (i18next-friendly).

const ISSUE_OPTIONS: TreeNode[] = [
  {id: 'issue_no_apps', label: 'No applications yet'},
  {id: 'issue_review', label: 'How do I review applications?'},
  {id: 'issue_deliverables', label: 'Deliverables not submitted'},
  {id: 'issue_escrow', label: 'How does escrow work?'},
  {id: 'issue_release', label: 'Release payment issue'},
  {id: 'issue_callback', label: 'Talk to a human about this', action: 'callback'},
];

// Issues whose answer deep-links to BrandCampaignDetail::{id}
const ISSUE_LINK_IDS = new Set([
  'issue_no_apps',
  'issue_review',
  'issue_deliverables',
  'issue_release',
]);

// English labels for support_callbacks.topic_path context (stable, untranslated)
const ISSUE_EN_LABEL: Record<string, string> = {
  issue_no_apps: 'No applications yet',
  issue_review: 'How do I review applications?',
  issue_deliverables: 'Deliverables not submitted',
  issue_escrow: 'How does escrow work?',
  issue_release: 'Release payment issue',
  issue_callback: 'Request a callback',
};

// Status-aware answer resolution (replaces web's ICU select/plural).
const issueResponse = (campaign: any, optId: string, t: any): string => {
  const status = campaign.status || '';
  const applications = campaign.applicationsTotal ?? 0;
  switch (optId) {
    case 'issue_no_apps':
      if (status === 'draft') {
        return t('BrandSupportChatModal.issues.noAppsDraft');
      }
      if (status === 'paused') {
        return t('BrandSupportChatModal.issues.noAppsPaused');
      }
      if (status === 'completed') {
        return t('BrandSupportChatModal.issues.noAppsCompleted');
      }
      return t('BrandSupportChatModal.issues.noAppsOther');
    case 'issue_review':
      if (applications === 0) {
        return t('BrandSupportChatModal.issues.reviewZero');
      }
      return t('BrandSupportChatModal.issues.reviewSome', {count: applications});
    case 'issue_deliverables':
      return t('BrandSupportChatModal.issues.deliverables');
    case 'issue_escrow':
      return t('BrandSupportChatModal.issues.escrow');
    case 'issue_release':
      return t('BrandSupportChatModal.issues.release');
    default:
      return '';
  }
};

// `value` is the stable English string stored in the DB
// (support_callbacks.preferred_time); the slug selects the translated label.
const TIME_OPTIONS = [
  'Today afternoon',
  'Today evening',
  'Tomorrow morning',
  'Tomorrow evening',
  'Anytime',
];

const TIME_SLUGS: Record<string, string> = {
  'Today afternoon': 'todayAfternoon',
  'Today evening': 'todayEvening',
  'Tomorrow morning': 'tomorrowMorning',
  'Tomorrow evening': 'tomorrowEvening',
  Anytime: 'anytime',
};

const STATUS_STYLES: Record<string, {bg: string; fg: string}> = {
  draft: {bg: '#F1F5F9', fg: '#475569'},
  active: {bg: '#ECFDF5', fg: '#065F46'},
  paused: {bg: '#FFFBEB', fg: '#92400E'},
  completed: {bg: '#EFF6FF', fg: '#1E3A8A'},
};

// ── Types ─────────────────────────────────────────────────────────────────

type Message = {
  role: 'bot' | 'user';
  text: string;
  options?: TreeNode[];
  link?: {href: string; label: string};
  campaigns?: any[];
  campaignAction?: 'open' | 'issue';
  campaignContext?: any;
  followUp?: boolean;
  typing?: boolean;
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ── Modal ─────────────────────────────────────────────────────────────────

export default function BrandSupportChatModal({visible, onClose}: Props) {
  const navigation = useNavigation<any>();
  const {user, profile} = useAuth() as any;
  const {t} = useTranslation();
  const nodeLabel = (n: TreeNode) => t(`BrandSupportChatModal.labels.${n.id}`);

  const [path, setPath] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [callbackContext, setCallbackContext] = useState('');
  const [campaigns, setCampaigns] = useState<any[] | null>(null);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const greeting = useMemo(() => {
    const name =
      profile?.contact_name?.split(' ')[0] ||
      profile?.brand_name ||
      t('BrandSupportChatModal.fallbackName');
    return t('BrandSupportChatModal.greeting', {name});
  }, [profile, t]);

  // Reset on open
  useEffect(() => {
    if (visible) {
      setPath([]);
      setCallbackOpen(false);
      setCallbackContext('');
      setCampaigns(null);
      setMessages([{role: 'bot', text: greeting, options: TREE.children}]);
    }
  }, [visible, greeting]);

  // Auto-scroll on new messages
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({animated: true});
    }, 80);
    return () => clearTimeout(timer);
  }, [messages, callbackOpen]);

  // ── Lazy campaigns fetch (brand's own, via brand-campaigns edge fn) ─────
  const ensureCampaigns = async (): Promise<any[]> => {
    if (campaigns !== null) return campaigns;
    setCampaignsLoading(true);
    try {
      const data = await invokeFn<{campaigns?: any[]}>('brand-campaigns', {
        action: 'list',
        brandId: user?.id,
      });
      const list = data?.campaigns || [];
      setCampaigns(list);
      return list;
    } catch (e) {
      console.warn('BrandSupportChat campaigns fetch failed:', e);
      setCampaigns([]);
      return [];
    } finally {
      setCampaignsLoading(false);
    }
  };

  // ── Action handlers ─────────────────────────────────────────────────────
  const openCallback = (context = '') => {
    setCallbackContext(context);
    setCallbackOpen(true);
    setMessages(prev => [
      ...prev,
      {role: 'bot', text: t('BrandSupportChatModal.callbackIntro')},
    ]);
  };

  const handleListForIssue = async () => {
    setMessages(prev => [
      ...prev,
      {role: 'bot', text: t('BrandSupportChatModal.campaigns.pullingAll'), typing: true},
    ]);
    const list = await ensureCampaigns();
    setMessages(prev => {
      const next = prev.filter(m => !m.typing);
      if (list.length === 0) {
        next.push({
          role: 'bot',
          text: t('BrandSupportChatModal.campaigns.noneYet'),
          link: {
            href: 'CreateCampaign',
            label: t('BrandSupportChatModal.links.createCampaign'),
          },
          followUp: true,
        });
      } else {
        next.push({
          role: 'bot',
          text: t('BrandSupportChatModal.campaigns.pickCampaign'),
          campaigns: list,
          campaignAction: 'issue',
        });
      }
      return next;
    });
  };

  const handlePickCampaignForIssue = (campaign: any) => {
    setMessages(prev => [
      ...prev,
      {role: 'user', text: campaign.title},
      {
        role: 'bot',
        text: t('BrandSupportChatModal.campaigns.whatsUp', {title: campaign.title}),
        campaignContext: campaign,
        options: ISSUE_OPTIONS,
      },
    ]);
  };

  const handlePickIssueOption = (campaign: any, opt: TreeNode) => {
    if (opt.action === 'callback') {
      setMessages(prev => [...prev, {role: 'user', text: nodeLabel(opt)}]);
      openCallback(
        `${campaign.title} · ${ISSUE_EN_LABEL[opt.id] || ''}`.replace(/ · $/, ''),
      );
      return;
    }
    const link = ISSUE_LINK_IDS.has(opt.id)
      ? {
          // Embed campaign id into the link payload so the screen handler
          // can route to the right detail.
          href: `BrandCampaignDetail::${campaign.id}`,
          label: t('BrandSupportChatModal.links.openThisCampaign'),
        }
      : undefined;
    setMessages(prev => [
      ...prev,
      {role: 'user', text: nodeLabel(opt)},
      {
        role: 'bot',
        text: issueResponse(campaign, opt.id, t),
        link,
        followUp: true,
      },
    ]);
  };

  const handlePick = (node: TreeNode) => {
    if (node.action === 'callback') {
      setMessages(prev => [...prev, {role: 'user', text: nodeLabel(node)}]);
      openCallback();
      return;
    }
    if (node.action === 'list_for_issue') {
      setMessages(prev => [...prev, {role: 'user', text: nodeLabel(node)}]);
      handleListForIssue();
      return;
    }

    setMessages(prev => [...prev, {role: 'user', text: nodeLabel(node)}]);

    if (node.children?.length) {
      setPath(p => [...p, node.id]);
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: t('BrandSupportChatModal.pickClosest'),
          options: node.children,
        },
      ]);
    } else if (node.response) {
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: t(`BrandSupportChatModal.responses.${node.id}`),
          link: node.link
            ? {
                href: node.link.href,
                label: t(`BrandSupportChatModal.linkLabels.${node.id}`),
              }
            : undefined,
          followUp: true,
        },
      ]);
    }
  };

  const handleBack = () => {
    if (path.length === 0) return;
    const newPath = path.slice(0, -1);
    setPath(newPath);
    const parent = findNode(newPath);
    setMessages(prev => [
      ...prev,
      {role: 'user', text: t('BrandSupportChatModal.backLabel')},
      {
        role: 'bot',
        text:
          parent.id === 'root'
            ? greeting
            : t('BrandSupportChatModal.pickClosest'),
        options: parent.children,
      },
    ]);
  };

  const handleStartOver = () => {
    setPath([]);
    setCallbackOpen(false);
    setCallbackContext('');
    setMessages([{role: 'bot', text: greeting, options: TREE.children}]);
  };

  const handleCallbackSubmitted = () => {
    setCallbackOpen(false);
    setCallbackContext('');
    setMessages(prev => [
      ...prev,
      {
        role: 'bot',
        text: t('BrandSupportChatModal.callbackDone'),
      },
    ]);
  };

  // Links use route names (e.g. "BrandProfile"); issue answers encode the
  // campaign id as "BrandCampaignDetail::<id>".
  const handleLink = (href: string) => {
    onClose?.();
    const [routeName, param] = href.split('::');
    if (routeName === 'BrandCampaignDetail' && param) {
      navigation.navigate(routeName, {id: param});
    } else {
      navigation.navigate(routeName);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end'}}>
        <View
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            height: '85%',
            overflow: 'hidden',
          }}>
          {/* Header */}
          <View
            className="flex-row items-center px-5 py-4 border-b border-slate-100"
            style={{gap: 12}}>
            {path.length > 0 && !callbackOpen ? (
              <Pressable
                onPress={handleBack}
                className="w-8 h-8 rounded-full items-center justify-center">
                <ChevronLeft size={18} color="#64748B" />
              </Pressable>
            ) : null}
            <LinearGradient
              colors={[...ACCENT_GRADIENT]}
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Headphones size={18} color="#fff" />
            </LinearGradient>
            <View className="flex-1 min-w-0">
              <Text className="text-sm font-black text-slate-900">
                {t('BrandSupportChatModal.header.title')}
              </Text>
              <View className="flex-row items-center mt-0.5" style={{gap: 6}}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#10B981',
                  }}
                />
                <Text className="text-[11px] font-semibold text-emerald-600">
                  {t('BrandSupportChatModal.header.online')}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full items-center justify-center">
              <X size={18} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={{flex: 1, backgroundColor: '#F8FAFC'}}
            contentContainerStyle={{padding: 16, gap: 12}}
            showsVerticalScrollIndicator={false}>
            {messages.map((m, i) => (
              <Bubble
                key={i}
                message={m}
                onPick={handlePick}
                onLink={handleLink}
                onStartOver={handleStartOver}
                onPickCampaignForIssue={handlePickCampaignForIssue}
                onPickIssueOption={handlePickIssueOption}
                onRequestCallback={() => {
                  setMessages(prev => [
                    ...prev,
                    {role: 'user', text: t('BrandSupportChatModal.requestCallback')},
                  ]);
                  openCallback();
                }}
              />
            ))}

            {campaignsLoading ? (
              <View className="flex-row items-center px-2" style={{gap: 8}}>
                <ActivityIndicator size="small" color="#94A3B8" />
                <Text className="text-[11px] text-slate-400">
                  {t('BrandSupportChatModal.loadingCampaigns')}
                </Text>
              </View>
            ) : null}

            {callbackOpen ? (
              <CallbackForm
                user={user}
                profile={profile}
                path={path}
                context={callbackContext}
                onSubmitted={handleCallbackSubmitted}
                onCancel={() => setCallbackOpen(false)}
              />
            ) : null}
          </ScrollView>

          {/* Sticky footer — always-on callback shortcut */}
          {!callbackOpen ? (
            <View
              className="px-5 py-3 border-t border-slate-100"
              style={{
                paddingBottom: Platform.OS === 'ios' ? 22 : 12,
              }}>
              <Pressable
                onPress={() => {
                  setMessages(prev => [
                    ...prev,
                    {role: 'user', text: t('BrandSupportChatModal.requestCallback')},
                  ]);
                  openCallback();
                }}
                style={{
                  height: 44,
                  borderRadius: 16,
                  backgroundColor: '#0F172A',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}>
                <Phone size={14} color="#fff" />
                <Text className="text-white text-sm font-bold">
                  {t('BrandSupportChatModal.requestCallback')}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function Bubble({
  message,
  onPick,
  onLink,
  onStartOver,
  onRequestCallback,
  onPickCampaignForIssue,
  onPickIssueOption,
}: {
  message: Message;
  onPick: (node: TreeNode) => void;
  onLink: (href: string) => void;
  onStartOver: () => void;
  onRequestCallback: () => void;
  onPickCampaignForIssue: (c: any) => void;
  onPickIssueOption: (c: any, o: TreeNode) => void;
}) {
  const {t} = useTranslation();
  const isBot = message.role === 'bot';

  return (
    <View style={{alignItems: isBot ? 'flex-start' : 'flex-end'}}>
      <View style={{maxWidth: '88%'}}>
        <View
          style={
            isBot
              ? {
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: '#F1F5F9',
                }
              : {
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  overflow: 'hidden',
                }
          }>
          {isBot ? (
            <Text style={{color: '#334155', fontSize: 13, lineHeight: 19}}>
              {message.typing ? '… ' : ''}
              {message.text}
            </Text>
          ) : (
            <LinearGradient
              colors={[...ACCENT_GRADIENT]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 16,
              }}
            />
          )}
          {!isBot ? (
            <Text style={{color: '#fff', fontSize: 13, lineHeight: 19, fontWeight: '600'}}>
              {message.text}
            </Text>
          ) : null}
        </View>

        {message.link && isBot ? (
          <Pressable onPress={() => onLink(message.link!.href)}>
            <Text
              className="text-[12px] font-bold mt-2"
              style={{color: ACCENT}}>
              {message.link.label} →
            </Text>
          </Pressable>
        ) : null}

        {message.campaigns && isBot ? (
          <View style={{marginTop: 10, gap: 8}}>
            {message.campaigns.map((c: any) => (
              <Pressable
                key={c.id}
                onPress={() =>
                  message.campaignAction === 'issue'
                    ? onPickCampaignForIssue(c)
                    : onLink(`BrandCampaignDetail::${c.id}`)
                }
                style={{
                  padding: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  backgroundColor: '#fff',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}>
                <CampaignAvatar c={c} />
                <View style={{flex: 1, minWidth: 0}}>
                  <Text
                    numberOfLines={1}
                    className="text-[12px] font-black text-slate-900">
                    {c.title}
                  </Text>
                  <View
                    className="flex-row items-center mt-0.5"
                    style={{gap: 6}}>
                    <Text
                      numberOfLines={1}
                      className="text-[10px] text-slate-500 flex-shrink"
                      style={{maxWidth: 130}}>
                      {(c.applicationsTotal ?? 0) === 0
                        ? t('BrandSupportChatModal.campaigns.applicationsZero')
                        : t('BrandSupportChatModal.campaigns.applicationsCount', {
                            count: c.applicationsTotal ?? 0,
                          })}
                    </Text>
                    <StatusPill status={c.status} />
                  </View>
                </View>
                <ChevronRight size={14} color="#CBD5E1" />
              </Pressable>
            ))}
          </View>
        ) : null}

        {message.options && isBot ? (
          <View style={{marginTop: 10, gap: 6}}>
            {message.options.map(opt => (
              <Pressable
                key={opt.id}
                onPress={() =>
                  message.campaignContext
                    ? onPickIssueOption(message.campaignContext, opt)
                    : onPick(opt)
                }
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  backgroundColor: '#fff',
                }}>
                <Text className="text-[12px] font-semibold text-slate-700">
                  {t(`BrandSupportChatModal.labels.${opt.id}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {message.followUp && isBot ? (
          <View
            className="flex-row flex-wrap mt-3"
            style={{gap: 6}}>
            <Pressable
              onPress={onStartOver}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}>
              <Text className="text-[11px] font-bold text-slate-500">
                {t('BrandSupportChatModal.askAnother')}
              </Text>
            </Pressable>
            <Pressable
              onPress={onRequestCallback}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: 'rgba(88,81,219,0.06)',
                borderWidth: 1,
                borderColor: 'rgba(88,81,219,0.18)',
              }}>
              <Text className="text-[11px] font-bold" style={{color: ACCENT}}>
                {t('BrandSupportChatModal.talkHuman')}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function CampaignAvatar({c}: {c: any}) {
  if (c.bannerImage) {
    return (
      <Image
        source={{uri: c.bannerImage}}
        style={{width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9'}}
        resizeMode="cover"
      />
    );
  }
  return (
    <LinearGradient
      colors={[...ACCENT_GRADIENT]}
      style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text className="text-white text-[11px] font-black">
        {(c.title || '?').charAt(0).toUpperCase()}
      </Text>
    </LinearGradient>
  );
}

function StatusPill({status}: {status: string}) {
  if (!status) return null;
  const styles = STATUS_STYLES[status] || {bg: '#F1F5F9', fg: '#475569'};
  return (
    <View
      style={{
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
        backgroundColor: styles.bg,
      }}>
      <Text
        style={{
          fontSize: 9,
          fontWeight: '900',
          letterSpacing: 0.6,
          color: styles.fg,
          textTransform: 'uppercase',
        }}>
        {status.replace(/_/g, ' ')}
      </Text>
    </View>
  );
}

function CallbackForm({
  user,
  profile,
  path,
  context,
  onSubmitted,
  onCancel,
}: {
  user: any;
  profile: any;
  path: string[];
  context: string;
  onSubmitted: () => void;
  onCancel: () => void;
}) {
  const {t} = useTranslation();
  // Phones can arrive with or without `+` / country code — keep whatever the
  // caller provides as a default, just strip noise.
  const defaultPhone = (
    profile?.contact_phone ||
    profile?.phone ||
    user?.phone ||
    ''
  )
    .toString()
    .replace(/[^\d+]/g, '');

  const [phone, setPhone] = useState(defaultPhone);
  const [time, setTime] = useState('Today afternoon');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const topicLabel = path.length > 0 ? findLabel(path[0]) : 'General';
  const topicPath = [path.join(' > '), context].filter(Boolean).join(' · ');

  // Normalize to E.164-ish: keep `+` if present, otherwise prepend 91 for
  // anything that looks like a bare 10-digit Indian mobile.
  const normalizePhone = (raw: string) => {
    const trimmed = (raw || '').trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('+')) {
      const digits = trimmed.replace(/[^\d]/g, '');
      return `+${digits}`;
    }
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    return `+${digits}`;
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      setError(t('BrandSupportChatModal.callback.errSignIn'));
      return;
    }
    const normalized = normalizePhone(phone);
    const digitsOnly = normalized.replace(/\D/g, '');
    // E.164 numbers are 8–15 digits including country code.
    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      setError(t('BrandSupportChatModal.callback.errPhone'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const {error: dbErr} = await supabase.from('support_callbacks').insert({
        user_id: user.id,
        user_role: 'brand',
        topic: topicLabel,
        topic_path: topicPath,
        preferred_time: time,
        phone: normalized,
        notes: notes.trim(),
      });
      if (dbErr) throw new Error(dbErr.message);
      setDone(true);
      setTimeout(() => onSubmitted(), 600);
    } catch (e: any) {
      setError(e.message || t('BrandSupportChatModal.callback.errSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View
        style={{
          backgroundColor: '#ECFDF5',
          borderWidth: 1,
          borderColor: '#A7F3D0',
          borderRadius: 16,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}>
        <CheckCircle2 size={20} color="#10B981" />
        <View>
          <Text className="text-sm font-black text-emerald-700">
            {t('BrandSupportChatModal.callback.doneTitle')}
          </Text>
          <Text className="text-[11px] text-emerald-600">
            {t('BrandSupportChatModal.callback.doneMessage', {
              phone,
              time: t(`BrandSupportChatModal.time.${TIME_SLUGS[time]}`).toLowerCase(),
            })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 14,
        gap: 12,
      }}>
      {context ? (
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: 'rgba(88,81,219,0.08)',
            alignSelf: 'flex-start',
          }}>
          <Text className="text-[10px] font-bold" style={{color: ACCENT_DARK}}>
            {context}
          </Text>
        </View>
      ) : null}

      <View>
        <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">
          {t('BrandSupportChatModal.callback.phone')}
        </Text>
        <TextInput
          value={phone}
          onChangeText={val =>
            setPhone(val.replace(/[^\d+\s-]/g, '').slice(0, 20))
          }
          placeholder="+91 98765 43210"
          placeholderTextColor="#cbd5e1"
          keyboardType="phone-pad"
          style={{
            height: 40,
            paddingHorizontal: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            fontSize: 14,
            color: '#0F172A',
          }}
        />
        <Text className="text-[10px] text-slate-400 mt-1">
          {t('BrandSupportChatModal.callback.countryCodeHint')}
        </Text>
      </View>

      <View>
        <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">
          {t('BrandSupportChatModal.callback.bestTime')}
        </Text>
        <View className="flex-row flex-wrap" style={{gap: 6}}>
          {TIME_OPTIONS.map(slot => {
            const active = time === slot;
            return (
              <Pressable
                key={slot}
                onPress={() => setTime(slot)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: active ? ACCENT : '#E2E8F0',
                  backgroundColor: active ? ACCENT : '#fff',
                }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: active ? '#fff' : '#475569',
                  }}>
                  {t(`BrandSupportChatModal.time.${TIME_SLUGS[slot]}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">
          {t('BrandSupportChatModal.callback.notesLabel')}
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder={t('BrandSupportChatModal.callback.notesPlaceholder')}
          placeholderTextColor="#cbd5e1"
          multiline
          numberOfLines={3}
          style={{
            minHeight: 64,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            fontSize: 14,
            color: '#0F172A',
            textAlignVertical: 'top',
          }}
        />
      </View>

      {error ? (
        <Text className="text-xs text-red-500 font-semibold">{error}</Text>
      ) : null}

      <View className="flex-row" style={{gap: 8}}>
        <Pressable
          onPress={onCancel}
          disabled={submitting}
          style={{
            flex: 1,
            height: 40,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: submitting ? 0.5 : 1,
          }}>
          <Text className="text-sm font-bold text-slate-600">
            {t('BrandSupportChatModal.callback.cancel')}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            flex: 1,
            height: 40,
            borderRadius: 12,
            overflow: 'hidden',
            opacity: submitting ? 0.6 : 1,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 6,
          }}>
          <LinearGradient
            colors={[...ACCENT_GRADIENT]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
          />
          {submitting ? <ActivityIndicator size="small" color="#fff" /> : null}
          <Text className="text-white text-sm font-bold">
            {submitting
              ? t('BrandSupportChatModal.callback.sending')
              : t('BrandSupportChatModal.callback.submit')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
