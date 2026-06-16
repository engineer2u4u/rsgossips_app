// Decision-tree support chat — ported from web's SupportChat.jsx.
//
// Mirrors the same TREE, the same "Request a callback" form (inserts into
// public.support_callbacks), and the same campaign listing flows. Triggered
// from the headphones icon in InfluencerLayout's top bar.

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
import {BRAND_GRADIENT_WARM} from '../theme/brand';

// ── Decision tree (identical to web) ──────────────────────────────────────

type TreeAction = 'callback' | 'list_active' | 'list_for_issue';
type TreeNode = {
  id: string;
  label: string;
  description?: string;
  response?: string;
  link?: {href: string; label: string};
  action?: TreeAction;
  children?: TreeNode[];
};

const TREE: TreeNode = {
  id: 'root',
  label: 'Hi! 👋 What can I help you with today?',
  children: [
    {
      id: 'campaigns',
      label: 'Campaigns',
      children: [
        {id: 'campaign_show_active', label: 'Show my active campaigns', action: 'list_active'},
        {id: 'campaign_issue', label: 'Issue with a campaign', action: 'list_for_issue'},
        {
          id: 'campaign_apply_how',
          label: 'How do I apply to a campaign?',
          response:
            'Browse open campaigns from the Campaigns tab, open one you like, and tap Apply. Brands review applications within a few days.',
          link: {href: 'InfluencerCampaigns', label: 'Open Campaigns'},
        },
        {
          id: 'campaign_missing',
          label: "I can't find a campaign I applied to",
          response:
            "Open Campaigns and switch to the Applied tab — that's where every active application lives. The Completed tab only shows wrapped-up campaigns.",
          link: {href: 'InfluencerCampaigns', label: 'Go to Campaigns'},
        },
        {
          id: 'campaign_submit',
          label: 'How do I submit deliverables / live links?',
          response:
            "Open the campaign detail page; once your application is Approved you'll see a Submit Deliverables button. After the live post goes up, paste the Instagram link there.",
          link: {href: 'InfluencerCampaigns', label: 'Go to Campaigns'},
        },
      ],
    },
    {
      id: 'profile',
      label: 'Profile & Account',
      children: [
        {
          id: 'profile_ig',
          label: 'Update / refresh my Instagram',
          response:
            "Open your Profile, tap the Instagram card, and use Refresh to pull the latest stats. If your token has expired you'll see a reconnect button there.",
          link: {href: 'InfluencerProfile', label: 'Go to Profile'},
        },
        {
          id: 'profile_photo',
          label: 'Change profile photo',
          response:
            "Profile → tap your avatar → upload a new image. We'll auto-crop it to a clean circle.",
          link: {href: 'InfluencerProfile', label: 'Go to Profile'},
        },
        {
          id: 'profile_bio',
          label: 'Edit bio, categories or location',
          response:
            'Profile → My Information lets you edit name, bio, categories and city. Brands use these to match you to campaigns.',
          link: {href: 'InfluencerProfile', label: 'Go to Profile'},
        },
        {
          id: 'profile_reels',
          label: "My reels aren't showing",
          response:
            "Reels sync from your linked Instagram. Profile → Refresh Instagram pulls the latest. If they still don't appear, your IG account may not be a Business/Creator profile.",
          link: {href: 'InfluencerProfile', label: 'Go to Profile'},
        },
      ],
    },
    {
      id: 'services',
      label: 'Services',
      children: [
        {
          id: 'service_browse',
          label: 'How do I browse services?',
          response:
            'Open the Services tab to see everything I offer to brands — reels, photo shoots, story takeovers, ambassadorships, and more. Each card opens a detail page with my rates and turnaround.',
          link: {href: 'InfluencerServices', label: 'Open Services'},
        },
        {
          id: 'service_quote',
          label: 'How does Custom Quote work?',
          response:
            'Pick a service, tap Get Custom Quote, fill in what you need and submit. I review and reply with a personalised quote — once you accept, you pay the advance via Stripe and we move into delivery.',
          link: {href: 'InfluencerServices', label: 'Open Services'},
        },
        {
          id: 'service_order_track',
          label: 'Track an existing order',
          response:
            "Profile → Orders shows every service request you've made. Each order page has the live status, payment breakdown, and any draft deliverables ready for review.",
          link: {href: 'InfluencerServiceOrders', label: 'My Orders'},
        },
        {
          id: 'service_payment',
          label: 'Payment / advance not going through',
          response:
            "Stripe occasionally declines cards on first attempt — try once more, or use a different card / UPI. If it still fails, request a callback and we'll help you wrap it up.",
        },
        {
          id: 'service_revision',
          label: 'Request a revision on a draft',
          response:
            "Open the order from Profile → Orders. While the draft is in review you'll see a Request Revision button — describe what to change and I'll re-deliver.",
          link: {href: 'InfluencerServiceOrders', label: 'My Orders'},
        },
        {id: 'service_callback', label: 'Talk to a human about a service', action: 'callback'},
      ],
    },
    {
      id: 'payments',
      label: 'Payments',
      children: [
        {
          id: 'pay_when',
          label: 'When do I get paid?',
          response:
            'Once the brand approves your live links, the payment moves to Payment Released. Funds typically reflect in your account within 7–10 business days.',
        },
        {
          id: 'pay_late',
          label: "Payment hasn't arrived",
          response:
            "Check the campaign detail page — if it's still on Payment Released after 14 business days, request a callback and we'll chase the brand for you.",
        },
        {
          id: 'pay_bank',
          label: 'Add or update bank details',
          response:
            'Profile → Payment Methods. We use these only for releasing your campaign earnings.',
          link: {href: 'InfluencerProfile', label: 'Go to Profile'},
        },
      ],
    },
    {
      id: 'plans',
      label: 'Plans & Subscription',
      children: [
        {
          id: 'plans_upgrade',
          label: 'Upgrade my plan',
          response:
            'Pick the plan that fits — Pro unlocks 15 applications/month and richer analytics, Elite is unlimited.',
          link: {href: 'InfluencerPricing', label: 'View Plans'},
        },
        {
          id: 'plans_compare',
          label: "What's the difference between plans?",
          response:
            'Open the pricing page for the full feature matrix — applications/month, analytics depth, audience demographics, deal matching priority and support level.',
          link: {href: 'InfluencerPricing', label: 'Compare Plans'},
        },
        {
          id: 'plans_cancel',
          label: 'Cancel my subscription',
          response:
            "Subscriptions can be cancelled directly from Stripe's billing portal. If you can't access it, request a callback and we'll cancel it for you.",
        },
      ],
    },
    {
      id: 'tech',
      label: 'Technical Issues',
      children: [
        {
          id: 'tech_slow',
          label: "App is slow or won't load",
          response:
            'Force-close the app and reopen it. If it persists, log out and back in. Still broken? Request a callback with what you were doing when it happened.',
        },
        {
          id: 'tech_login',
          label: "Can't sign in",
          response:
            "Use the same Instagram account you signed up with. If OTP isn't arriving, double-check the country code — we send to +91 numbers only right now.",
        },
        {
          id: 'tech_ig_token',
          label: 'Instagram says reconnect',
          response:
            'IG tokens expire every 60 days. Profile → Reconnect Instagram refreshes it without losing any data.',
          link: {href: 'InfluencerProfile', label: 'Go to Profile'},
        },
      ],
    },
    {
      id: 'other',
      label: 'Something else',
      children: [{id: 'other_callback', label: 'Request a callback', action: 'callback'}],
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

// Per-campaign issue prompts (mirrors web).
const ISSUE_OPTIONS = (campaign: any): TreeNode[] => {
  const status = campaign.applicationStatus;
  const brand = campaign.brandName || 'the brand';
  return [
    {
      id: 'issue_no_response',
      label: "Brand hasn't responded",
      response:
        status === 'pending'
          ? `Your application is still Pending with ${brand}. If it's been over 5–7 days since you applied, request a callback and we'll nudge them.`
          : `Your application status is "${status}". If you're waiting on something specific, request a callback so we can chase ${brand} for you.`,
    },
    {
      id: 'issue_payment',
      label: 'Payment is delayed',
      response:
        status === 'completed'
          ? `${brand} has marked this campaign Completed. Payment usually reflects within 7–10 business days. If 14+ business days have passed, request a callback.`
          : status === 'payment'
            ? `${brand} has released payment. It typically takes 7–10 business days to land. If it's been longer, request a callback.`
            : `Payments only release after the brand approves your live links. Current status: "${status}". Once it moves to Payment, the 7–10 day clock starts.`,
    },
    {
      id: 'issue_deliverables',
      label: 'Submit / update deliverables',
      response:
        status === 'approved'
          ? `Open the campaign detail page — you'll see a Submit Deliverables button now that ${brand} has approved you.`
          : status === 'revision_needed'
            ? `${brand} has asked for a revision. Open the campaign detail page to see exactly which deliverables need re-uploading.`
            : status === 'accepted'
              ? `Now's the time to post the live content and paste the live links inside the campaign detail page.`
              : `Deliverables can only be submitted from the Approved or Accepted state. Your current status is "${status}".`,
      link: {href: 'InfluencerOfferDetail', label: 'Open this campaign'},
    },
    {
      id: 'issue_rejected',
      label: 'Why was I rejected / removed?',
      response:
        status === 'rejected'
          ? `${brand} declined your application — usually for fit, timing, or audience match. The campaign goes back to Active so you can apply to a different one. Your monthly application cap isn't impacted.`
          : `Your application status is "${status}", not rejected. Take another look at the campaign detail page to see the latest update from ${brand}.`,
      link: {href: 'InfluencerOfferDetail', label: 'Open this campaign'},
    },
    {id: 'issue_callback', label: 'Talk to a human about this', action: 'callback'},
  ];
};

const TIME_OPTIONS = [
  'Today afternoon',
  'Today evening',
  'Tomorrow morning',
  'Tomorrow evening',
  'Anytime',
];

const STATUS_STYLES: Record<string, {bg: string; fg: string}> = {
  pending: {bg: '#FFFBEB', fg: '#92400E'},
  approved: {bg: '#ECFDF5', fg: '#065F46'},
  accepted: {bg: '#ECFDF5', fg: '#065F46'},
  submitted: {bg: '#EFF6FF', fg: '#1E3A8A'},
  live_submitted: {bg: '#ECFEFF', fg: '#155E75'},
  revision_needed: {bg: '#FFF7ED', fg: '#9A3412'},
  payment: {bg: '#FFFBEB', fg: '#92400E'},
  completed: {bg: '#F1F5F9', fg: '#475569'},
  rejected: {bg: '#FEF2F2', fg: '#991B1B'},
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

export default function SupportChatModal({visible, onClose}: Props) {
  const navigation = useNavigation<any>();
  const {user, profile, role} = useAuth() as any;

  const [path, setPath] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [callbackContext, setCallbackContext] = useState('');
  const [campaigns, setCampaigns] = useState<any[] | null>(null);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const greeting = useMemo(() => {
    const name =
      profile?.full_name?.split(' ')[0] || profile?.username || 'there';
    return `Hi ${name}! 👋 What can I help you with today?`;
  }, [profile]);

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
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({animated: true});
    }, 80);
    return () => clearTimeout(t);
  }, [messages, callbackOpen]);

  // ── Lazy campaigns fetch ────────────────────────────────────────────────
  const ensureCampaigns = async (): Promise<any[]> => {
    if (campaigns !== null) return campaigns;
    setCampaignsLoading(true);
    try {
      const data = await invokeFn<{campaigns?: any[]}>('list-campaigns', {
        influencerId: user?.id,
      });
      const list = (data?.campaigns || []).filter((c: any) => c.applicationStatus);
      setCampaigns(list);
      return list;
    } catch (e) {
      console.warn('SupportChat campaigns fetch failed:', e);
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
      {role: 'bot', text: "Tell us how to reach you and we'll call back."},
    ]);
  };

  const handleListActive = async () => {
    setMessages(prev => [
      ...prev,
      {role: 'bot', text: 'Pulling your active campaigns…', typing: true},
    ]);
    const list = await ensureCampaigns();
    const active = list.filter(
      (c: any) =>
        c.applicationStatus &&
        c.applicationStatus !== 'completed' &&
        c.applicationStatus !== 'rejected',
    );
    setMessages(prev => {
      const next = prev.filter(m => !m.typing);
      if (active.length === 0) {
        next.push({
          role: 'bot',
          text: "You don't have any active campaigns right now. Browse open ones from the Campaigns tab.",
          link: {href: 'InfluencerCampaigns', label: 'Open Campaigns'},
          followUp: true,
        });
      } else {
        next.push({
          role: 'bot',
          text: `You have ${active.length} active campaign${active.length === 1 ? '' : 's'}. Tap one to open it.`,
          campaigns: active,
          campaignAction: 'open',
        });
      }
      return next;
    });
  };

  const handleListForIssue = async () => {
    setMessages(prev => [
      ...prev,
      {role: 'bot', text: 'Pulling your campaigns…', typing: true},
    ]);
    const list = await ensureCampaigns();
    setMessages(prev => {
      const next = prev.filter(m => !m.typing);
      if (list.length === 0) {
        next.push({
          role: 'bot',
          text: "You haven't applied to any campaigns yet, so there's nothing to flag here.",
          link: {href: 'InfluencerCampaigns', label: 'Browse Campaigns'},
          followUp: true,
        });
      } else {
        next.push({
          role: 'bot',
          text: "Pick the campaign you're having trouble with:",
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
        text: `Got it — what's going on with "${campaign.title}"?`,
        campaignContext: campaign,
        options: ISSUE_OPTIONS(campaign),
      },
    ]);
  };

  const handlePickIssueOption = (campaign: any, opt: TreeNode) => {
    if (opt.action === 'callback') {
      setMessages(prev => [...prev, {role: 'user', text: opt.label}]);
      openCallback(`${campaign.brandName || ''} · ${campaign.title}`);
      return;
    }
    setMessages(prev => [
      ...prev,
      {role: 'user', text: opt.label},
      {
        role: 'bot',
        text: opt.response || '',
        // Embed campaign id into the link payload so the screen handler can
        // route to the right detail.
        link: opt.link
          ? {...opt.link, href: `${opt.link.href}::${campaign.id}`}
          : undefined,
        followUp: true,
      },
    ]);
  };

  const handlePick = (node: TreeNode) => {
    if (node.action === 'callback') {
      setMessages(prev => [...prev, {role: 'user', text: node.label}]);
      openCallback();
      return;
    }
    if (node.action === 'list_active') {
      setMessages(prev => [...prev, {role: 'user', text: node.label}]);
      handleListActive();
      return;
    }
    if (node.action === 'list_for_issue') {
      setMessages(prev => [...prev, {role: 'user', text: node.label}]);
      handleListForIssue();
      return;
    }

    setMessages(prev => [...prev, {role: 'user', text: node.label}]);

    if (node.children?.length) {
      setPath(p => [...p, node.id]);
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: node.description || 'Pick the closest match:',
          options: node.children,
        },
      ]);
    } else if (node.response) {
      setMessages(prev => [
        ...prev,
        {role: 'bot', text: node.response!, link: node.link, followUp: true},
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
      {role: 'user', text: '← Back'},
      {
        role: 'bot',
        text: parent.id === 'root' ? greeting : 'Pick the closest match:',
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
        text: 'Got it ✓ Our team will call back during the time you picked.',
      },
    ]);
  };

  // Links use route names (e.g. "InfluencerProfile") instead of web hrefs;
  // ISSUE_OPTIONS encodes the campaign id as "InfluencerOfferDetail::<id>".
  const handleLink = (href: string) => {
    onClose?.();
    const [routeName, param] = href.split('::');
    if (routeName === 'InfluencerOfferDetail' && param) {
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
      <View
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
              colors={[...BRAND_GRADIENT_WARM]}
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
                RGossips Support
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
                  Online · usually replies instantly
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
                    {role: 'user', text: 'Request a callback'},
                  ]);
                  openCallback();
                }}
              />
            ))}

            {campaignsLoading ? (
              <View className="flex-row items-center px-2" style={{gap: 8}}>
                <ActivityIndicator size="small" color="#94A3B8" />
                <Text className="text-[11px] text-slate-400">
                  Loading campaigns…
                </Text>
              </View>
            ) : null}

            {callbackOpen ? (
              <CallbackForm
                user={user}
                role={role}
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
                    {role: 'user', text: 'Request a callback'},
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
                  Request a callback
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
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
              colors={['#EC4899', '#F43F5E']}
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
            <Text className="text-[12px] font-bold text-pink-500 mt-2">
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
                    : onLink(`InfluencerOfferDetail::${c.id}`)
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
                      {c.brandName}
                    </Text>
                    <StatusPill status={c.applicationStatus} />
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
                  {opt.label}
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
                Ask another question
              </Text>
            </Pressable>
            <Pressable
              onPress={onRequestCallback}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: '#FDF2F8',
                borderWidth: 1,
                borderColor: '#FBCFE8',
              }}>
              <Text className="text-[11px] font-bold text-pink-600">
                Talk to a human
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function CampaignAvatar({c}: {c: any}) {
  if (c.brandLogo) {
    return (
      <Image
        source={{uri: c.brandLogo}}
        style={{width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9'}}
        resizeMode="cover"
      />
    );
  }
  return (
    <LinearGradient
      colors={['#F472B6', '#A855F7']}
      style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text className="text-white text-[11px] font-black">
        {c.initials || (c.brandName || '?').charAt(0).toUpperCase()}
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
  role,
  profile,
  path,
  context,
  onSubmitted,
  onCancel,
}: {
  user: any;
  role: string;
  profile: any;
  path: string[];
  context: string;
  onSubmitted: () => void;
  onCancel: () => void;
}) {
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
      setError('Please sign in first.');
      return;
    }
    const normalized = normalizePhone(phone);
    const digitsOnly = normalized.replace(/\D/g, '');
    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      setError('Enter a valid phone number with country code.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const {error: dbErr} = await supabase.from('support_callbacks').insert({
        user_id: user.id,
        user_role: role || '',
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
      setError(e.message || 'Failed to submit');
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
            Callback requested
          </Text>
          <Text className="text-[11px] text-emerald-600">
            We'll call {phone} {time.toLowerCase()}.
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
            backgroundColor: '#FDF2F8',
            alignSelf: 'flex-start',
          }}>
          <Text className="text-[10px] font-bold text-pink-700">{context}</Text>
        </View>
      ) : null}

      <View>
        <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">
          Phone
        </Text>
        <TextInput
          value={phone}
          onChangeText={t => setPhone(t.replace(/[^\d+\s-]/g, '').slice(0, 20))}
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
          Include country code (e.g. +91 for India)
        </Text>
      </View>

      <View>
        <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">
          Best time to call
        </Text>
        <View className="flex-row flex-wrap" style={{gap: 6}}>
          {TIME_OPTIONS.map(t => {
            const active = time === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTime(t)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: active ? '#EC4899' : '#E2E8F0',
                  backgroundColor: active ? '#EC4899' : '#fff',
                }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: active ? '#fff' : '#475569',
                  }}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">
          Anything we should know? (optional)
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="What's the issue?"
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
          <Text className="text-sm font-bold text-slate-600">Cancel</Text>
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
          }}>
          <LinearGradient
            colors={['#EC4899', '#F43F5E']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
            }}>
            {submitting ? <ActivityIndicator size="small" color="#fff" /> : null}
            <Text className="text-white text-sm font-bold">
              {submitting ? 'Sending…' : 'Request callback'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
