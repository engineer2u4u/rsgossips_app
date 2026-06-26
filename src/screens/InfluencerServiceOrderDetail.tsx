// Service order detail (read-only). Shows status banner, quote summary,
// event timeline, and the per-status next-step CTA. The action buttons
// themselves (Stripe pay, draft download/approve, request revision,
// submit review) are stubs in this batch — Phase 4+ ships them once
// @stripe/stripe-react-native is wired in.
//
// Web parity: src/app/influencer/services/orders/[id]/page.js (read-only
// surfaces — STATUS_BANNER, quote breakdown, event log).

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  ExternalLink,
  Mail,
  Send,
  Star,
  X,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import RazorpayCheckout from 'react-native-razorpay';
import {supabase} from '../utils/supabase';
import {formatINR} from '../lib/services';
import {invokeFn, EdgeFunctionError} from '../lib/api';
import {useAuth} from '../context/AuthContext';
import {useGlobalLoading} from '../context/LoadingContext';
import {STATUS_PILL} from './InfluencerServiceOrders';
import GatewayPickerModal from '../components/GatewayPickerModal';

const STATUS_BANNER: Record<
  string,
  {title: string; body: string; colors: [string, string]; Icon: any}
> = {
  pending_quote: {
    title: 'Quote request submitted',
    body: "Our team is reviewing your brief — we'll respond with a quote within the SLA.",
    colors: ['#F59E0B', '#F97316'],
    Icon: Clock,
  },
  quoted: {
    title: 'Your quote is ready!',
    body: 'Review the details below and pay 50% to kick off the project.',
    colors: ['#10B981', '#14B8A6'],
    Icon: Mail,
  },
  counter_offered: {
    title: 'Counter offer sent',
    body: "Awaiting the team's response to your counter offer.",
    colors: ['#F97316', '#F43F5E'],
    Icon: Send,
  },
  accepted: {
    title: 'Quote accepted — pay to start',
    body: 'Pay your advance to begin production.',
    colors: ['#10B981', '#14B8A6'],
    Icon: CheckCircle2,
  },
  paid_advance: {
    title: 'Advance received — work starting',
    body: "We've received your advance. Production begins now.",
    colors: ['#8B5CF6', '#D946EF'],
    Icon: Check,
  },
  in_progress: {
    title: 'Work in progress',
    body: 'Our team is on it. Updates land in this thread.',
    colors: ['#8B5CF6', '#D946EF'],
    Icon: Clock,
  },
  draft_ready: {
    title: 'Your draft is ready for review',
    body: 'Preview the draft and either approve or request a revision.',
    colors: ['#F59E0B', '#F97316'],
    Icon: Mail,
  },
  revision_requested: {
    title: 'Revision in progress',
    body: 'Your notes are with the team — a new draft is on the way.',
    colors: ['#F97316', '#F43F5E'],
    Icon: Clock,
  },
  paid_final: {
    title: 'Final payment received — wrapping up',
    body: 'Your files are being prepared for delivery.',
    colors: ['#10B981', '#14B8A6'],
    Icon: Check,
  },
  completed: {
    title: 'Order completed! Your files are ready',
    body: 'Download your files below and leave a quick review.',
    colors: ['#10B981', '#14B8A6'],
    Icon: CheckCircle2,
  },
  declined: {
    title: 'Request declined',
    body: "This request didn't move forward. You can submit a fresh brief any time.",
    colors: ['#94A3B8', '#64748B'],
    Icon: X,
  },
  expired: {
    title: 'Quote expired',
    body: 'The quote validity window has passed. Submit a fresh brief to start over.',
    colors: ['#94A3B8', '#64748B'],
    Icon: X,
  },
};

type Order = {
  id: string;
  order_number?: string;
  service_title?: string;
  service_slug?: string;
  status: string;
  total_amount?: number;
  quoted_amount?: number;
  counter_amount?: number;
  advance_pct?: number;
  quote_valid_until?: string;
  draft_url?: string;
  final_files?: {label?: string; url: string}[];
  description?: string;
  asset_url?: string;
  scope?: string;
  budget_range?: string;
  desired_delivery_date?: string;
  style_references?: string;
  notes?: string;
  revisions_allowed?: number;
  revisions_used?: number;
  created_at?: string;
  updated_at?: string;
};

interface ServiceReview {
  id?: string;
  order_id?: string;
  user_id?: string;
  overall?: number;
  quality?: number;
  communication?: number;
  on_time_delivery?: number;
  value_for_money?: number;
  text?: string;
  created_at?: string;
}

interface ReviewDraft {
  overall: number;
  quality: number;
  communication: number;
  on_time_delivery: number;
  value_for_money: number;
  text: string;
}

type EventRow = {
  id: string;
  order_id: string;
  event_type?: string;
  notes?: string;
  occurred_at?: string;
};

export default function InfluencerServiceOrderDetail() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = route.params?.id;
  const {user, profile, role} = useAuth();
  const {withLoading} = useGlobalLoading();

  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [payError, setPayError] = useState<string | null>(null);
  const [revisionMode, setRevisionMode] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [revisionError, setRevisionError] = useState<string | null>(null);

  // Counter-offer state.
  const [counterMode, setCounterMode] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  // Reclaim flow — one-click resubmit when the quote expired/declined.
  const [reclaiming, setReclaiming] = useState(false);
  const [counterError, setCounterError] = useState<string | null>(null);

  // Decline state.
  const [declineMode, setDeclineMode] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declineError, setDeclineError] = useState<string | null>(null);

  // Gateway picker state. `pickerPhase` is null when the picker is closed,
  // otherwise it carries which payment phase the user is about to settle.
  // Mirrors the web's GatewayPickerModal flow on the order detail page.
  const [pickerPhase, setPickerPhase] = useState<'advance' | 'final' | null>(null);

  // Review state — myReview is the existing service_reviews row when the
  // user has already submitted feedback. The form lives in reviewDraft.
  const [myReview, setMyReview] = useState<ServiceReview | null>(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft>({
    overall: 5,
    quality: 5,
    communication: 5,
    on_time_delivery: 5,
    value_for_money: 5,
    text: '',
  });

  const refresh = useCallback(async () => {
    if (!id) return;
    const [{data: o}, {data: ev}] = await Promise.all([
      supabase.from('service_orders').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('service_order_events')
        .select('*')
        .eq('order_id', id)
        .order('occurred_at'),
    ]);
    setOrder((o as Order) || null);
    setEvents((ev as EventRow[]) || []);
    setLoading(false);
  }, [id]);

  // After a Stripe Checkout round-trip, poll the order row a few times so the
  // user doesn't have to pull-to-refresh waiting for the webhook to land.
  // 6 × 2s matches web behaviour from the orders detail page.
  const pollForUpdate = useCallback(
    async (currentStatus: string | undefined) => {
      for (let i = 0; i < 6; i++) {
        await new Promise<void>(r => setTimeout(r, 2000));
        const {data} = await supabase
          .from('service_orders')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!data) continue;
        if (data.status !== currentStatus) {
          setOrder(data as Order);
          // Also refresh the timeline since the webhook will have written a
          // payment event.
          const {data: ev} = await supabase
            .from('service_order_events')
            .select('*')
            .eq('order_id', id)
            .order('occurred_at');
          setEvents((ev as EventRow[]) || []);
          return;
        }
      }
      // Final pull after the loop in case the webhook fired exactly on the
      // last tick.
      await refresh();
    },
    [id, refresh],
  );

  const payViaStripe = useCallback(
    async (phase: 'advance' | 'final') => {
      if (!order?.id || !user?.id) return;
      setPayError(null);
      await withLoading(
        (async () => {
          try {
            const data = await invokeFn<{url?: string; error?: string}>(
              'service-payment-checkout',
              {userId: user.id, orderId: order.id, phase},
            );
            if (!data?.url) {
              throw new Error('No checkout URL returned');
            }
            // Open Stripe Checkout in the in-app browser. The same library
            // handles the Instagram OAuth flow, so we know it works on this
            // device. `openAuth` waits for the user to dismiss the browser
            // (either by completing payment or hitting cancel) — we then poll
            // the order row for the webhook-driven status update.
            const previousStatus = order.status;
            try {
              if (await InAppBrowser.isAvailable()) {
                // Use a placeholder return URL — Stripe Checkout's "Return to
                // site" goes through the website's success/cancel URLs and
                // the InAppBrowser will close when the user dismisses it.
                await InAppBrowser.open(data.url, {
                  showTitle: true,
                  enableUrlBarHiding: true,
                  enableDefaultShare: false,
                });
              }
            } catch (browserErr: any) {
              // Some Android variants throw if the browser is already open —
              // fall back to deep linking out to the system browser.
              console.warn('InAppBrowser failed, opening externally:', browserErr);
              await Linking.openURL(data.url);
            }
            await pollForUpdate(previousStatus);
          } catch (err) {
            if (err instanceof EdgeFunctionError) {
              setPayError(err.message);
            } else {
              setPayError((err as Error)?.message || 'Failed to start payment');
            }
          }
        })(),
        phase === 'advance' ? 'Opening Stripe…' : 'Opening Stripe for final payment…',
      );
    },
    [order?.id, order?.status, user?.id, withLoading, pollForUpdate],
  );

  // Razorpay path — mirrors the web's payViaGateway("razorpay", phase).
  // Calls the dedicated `razorpay-service-checkout` edge function (the
  // service-orders sibling of the plan-subscription `razorpay-checkout`),
  // which mints a one-time Razorpay order and returns the key + order_id +
  // amount in paise. We then open Razorpay's native checkout sheet via
  // react-native-razorpay (already linked for plan payments) and poll
  // service_orders for the webhook-driven status flip.
  const payViaRazorpay = useCallback(
    async (phase: 'advance' | 'final') => {
      if (!order?.id || !user?.id) return;
      setPayError(null);
      await withLoading(
        (async () => {
          try {
            const data = await invokeFn<{
              key_id?: string;
              order_id?: string;
              amount_paise?: number;
              currency?: string;
              line_label?: string;
              error?: string;
            }>('razorpay-service-checkout', {
              userId: user.id,
              orderId: order.id,
              phase,
            });
            if (!data?.key_id || !data?.order_id || !data?.amount_paise) {
              throw new Error(
                "Razorpay didn't return a checkout order — please retry.",
              );
            }

            // Same +91-prefix prefill the web flow uses so Razorpay's
            // country-code check on the contact field doesn't error out.
            const phoneDigits = String(
              (user as any)?.phone || profile?.contact_phone || '',
            ).replace(/\D/g, '');
            const prefillContact = phoneDigits
              ? phoneDigits.startsWith('91')
                ? `+${phoneDigits}`
                : `+91${phoneDigits.slice(-10)}`
              : undefined;

            const previousStatus = order.status;
            try {
              await RazorpayCheckout.open({
                key: data.key_id,
                order_id: data.order_id,
                amount: data.amount_paise,
                currency: data.currency || 'INR',
                name: 'RGossips',
                description:
                  data.line_label ||
                  (phase === 'advance' ? 'Service advance' : 'Service final'),
                prefill: {
                  email: (user as any)?.email || profile?.email || '',
                  contact: prefillContact,
                  name: profile?.full_name || profile?.username || '',
                },
                notes: {
                  user_id: String(user.id || ''),
                  order_id: String(order.id),
                  phase,
                },
                theme: {color: '#5851DB'},
              });
              // Sheet resolved → payment captured. The razorpay-webhook
              // handler flips the row's status; poll for the change.
              await pollForUpdate(previousStatus);
            } catch (rzpErr: any) {
              // code 0 / undefined → user dismissed the sheet. Treat as a
              // silent cancel; anything else is a real payment failure.
              if (rzpErr?.code !== 0 && rzpErr?.code !== undefined) {
                throw new Error(
                  rzpErr?.description || 'Razorpay payment failed.',
                );
              }
            }
          } catch (err) {
            if (err instanceof EdgeFunctionError) {
              setPayError(err.message);
            } else {
              setPayError(
                (err as Error)?.message || 'Failed to start Razorpay payment',
              );
            }
          }
        })(),
        phase === 'advance'
          ? 'Opening Razorpay…'
          : 'Opening Razorpay for final payment…',
      );
    },
    [
      order?.id,
      order?.status,
      user,
      profile,
      withLoading,
      pollForUpdate,
    ],
  );

  // Opens the gateway picker bottom-sheet. The actual checkout fires once
  // the user picks Stripe or Razorpay (see handleGatewayPick).
  const openPayPicker = useCallback((phase: 'advance' | 'final') => {
    setPayError(null);
    setPickerPhase(phase);
  }, []);

  const handleGatewayPick = useCallback(
    (gateway: 'stripe' | 'razorpay') => {
      const phase = pickerPhase;
      setPickerPhase(null);
      if (!phase) return;
      if (gateway === 'razorpay') {
        payViaRazorpay(phase);
      } else {
        payViaStripe(phase);
      }
    },
    [pickerPhase, payViaRazorpay, payViaStripe],
  );

  // Submit a revision note to request-revision. Only valid when status =
  // 'draft_ready' and there are revisions left — those guards are enforced
  // by the renderStatusActions branching above, but defended again here.
  const submitRevision = useCallback(async () => {
    if (!order?.id || !user?.id) return;
    setRevisionError(null);
    const note = revisionNote.trim();
    if (note.length < 5) {
      setRevisionError('Please give the team a bit more detail (min 5 chars).');
      return;
    }
    await withLoading(
      (async () => {
        try {
          await invokeFn('request-revision', {
            userId: user.id,
            orderId: order.id,
            note,
          });
          setRevisionMode(false);
          setRevisionNote('');
          await refresh();
        } catch (err) {
          if (err instanceof EdgeFunctionError) {
            setRevisionError(err.message);
          } else {
            setRevisionError(
              (err as Error)?.message || 'Failed to send revision',
            );
          }
        }
      })(),
      'Sending revision…',
    );
  }, [order?.id, user?.id, revisionNote, withLoading, refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Load any existing service_reviews row for this order so the form
  // collapses into a read-only "thank you" once submitted (web parity).
  useEffect(() => {
    if (!id || !user?.id) return;
    let cancelled = false;
    (async () => {
      const {data} = await supabase
        .from('service_reviews')
        .select('*')
        .eq('order_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cancelled) setMyReview((data as ServiceReview) || null);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  // Send a counter-offer via respond-to-quote. Only valid on status='quoted'
  // or 'accepted'. Backend bumps status → 'counter_offered' and stores
  // counter_amount + the message on the order row.
  const submitCounter = useCallback(async () => {
    if (!order?.id || !user?.id) return;
    setCounterError(null);
    const amount = parseInt(counterAmount.replace(/[^\d]/g, ''), 10);
    if (!amount || amount <= 0) {
      setCounterError('Enter a counter amount in ₹.');
      return;
    }
    await withLoading(
      (async () => {
        try {
          await invokeFn('respond-to-quote', {
            userId: user.id,
            orderId: order.id,
            action: 'counter',
            counterAmount: amount,
            counterMessage: counterMessage.trim() || undefined,
          });
          setCounterMode(false);
          setCounterAmount('');
          setCounterMessage('');
          await refresh();
        } catch (err) {
          if (err instanceof EdgeFunctionError) {
            setCounterError(err.message);
          } else {
            setCounterError(
              (err as Error)?.message || 'Failed to send counter-offer',
            );
          }
        }
      })(),
      'Sending counter-offer…',
    );
  }, [
    order?.id,
    user?.id,
    counterAmount,
    counterMessage,
    withLoading,
    refresh,
  ]);

  // Decline the quote outright. Same edge function as counter, different
  // action verb. Backend bumps order → 'declined' (terminal). We
  // optimistically mark the local order as 'declined' the moment the API
  // succeeds so the decline form and the Pay/Counter action row disappear
  // immediately, even if the follow-up refresh() is slow or returns stale
  // rows. refresh() then runs in the background to pick up any other side
  // effects (event log, declined_at timestamps, etc.).
  const submitDecline = useCallback(async () => {
    if (!order?.id || !user?.id) return;
    setDeclineError(null);
    await withLoading(
      (async () => {
        try {
          await invokeFn('respond-to-quote', {
            userId: user.id,
            orderId: order.id,
            action: 'decline',
            declineReason: declineReason.trim() || undefined,
          });
          setOrder(prev => (prev ? {...prev, status: 'declined'} : prev));
          setDeclineMode(false);
          setDeclineReason('');
          await refresh();
        } catch (err) {
          if (err instanceof EdgeFunctionError) {
            setDeclineError(err.message);
          } else {
            setDeclineError(
              (err as Error)?.message || 'Failed to decline quote',
            );
          }
        }
      })(),
      'Declining quote…',
    );
  }, [order?.id, user?.id, declineReason, withLoading, refresh]);

  const submitReview = useCallback(async () => {
    if (!order?.id || !user?.id) return;
    setReviewError(null);
    await withLoading(
      (async () => {
        try {
          await invokeFn('submit-service-review', {
            userId: user.id,
            orderId: order.id,
            ...reviewDraft,
          });
          setMyReview({
            ...reviewDraft,
            order_id: order.id,
            user_id: user.id,
          });
          setReviewMode(false);
          await refresh();
        } catch (err) {
          if (err instanceof EdgeFunctionError) {
            setReviewError(err.message);
          } else {
            setReviewError(
              (err as Error)?.message || 'Failed to submit review',
            );
          }
        }
      })(),
      'Submitting review…',
    );
  }, [order?.id, user?.id, reviewDraft, withLoading, refresh]);

  const validityRemaining = useMemo(() => {
    if (!order?.quote_valid_until) return null;
    const ms = new Date(order.quote_valid_until).getTime() - Date.now();
    if (ms <= 0) return 'Expired';
    const d = Math.floor(ms / 86_400_000);
    const h = Math.floor((ms % 86_400_000) / 3_600_000);
    return `${d}d ${h}h`;
  }, [order?.quote_valid_until]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8F9FD',
        }}>
        <ActivityIndicator color="#E60076" size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8F9FD',
          padding: 24,
          gap: 10,
        }}>
        <Text className="text-base font-bold text-slate-600">Order not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-sm font-bold text-pink-500">← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const banner = STATUS_BANNER[order.status] || STATUS_BANNER.pending_quote;
  const pill = STATUS_PILL[order.status] || {
    label: order.status,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
  };
  const BannerIcon = banner.Icon;
  const total = order.total_amount || 0;
  const advance =
    total > 0 ? Math.round((total * (order.advance_pct || 50)) / 100) : 0;

  // Per-status CTAs. Stripe-driven payments use payViaStripe (real, no SDK
  // — opens Stripe Checkout in the in-app browser). Counter-offer + review +
  // revision are still stubbed until their phases ship.
  const revsLeft =
    (order.revisions_allowed || 0) - (order.revisions_used || 0);

  const statusActions = renderStatusActions(order, {
    onPayAdvance: () => openPayPicker('advance'),
    onPayFinal: () => openPayPicker('final'),
    onCounter: () => {
      setCounterError(null);
      // Seed with the quoted amount so the user can edit a small delta.
      if (!counterAmount && order.quoted_amount) {
        setCounterAmount(String(order.quoted_amount));
      }
      setCounterMode(true);
    },
    onDecline: () => {
      setDeclineError(null);
      setDeclineMode(true);
    },
    onRequestRevision: () => {
      if (revsLeft <= 0) {
        Alert.alert(
          'No revisions left',
          "You've used all your revision rounds. Reach out via support for further changes.",
        );
        return;
      }
      setRevisionError(null);
      setRevisionMode(true);
    },
    onLeaveReview: () => {
      // If the user already submitted, scroll/render the read-only block
      // (the review section below renders unconditionally when myReview is
      // set, so just no-op — the panel is visible).
      if (myReview) return;
      setReviewError(null);
      setReviewMode(true);
    },
    onReclaim: async () => {
      if (!user?.id || !order?.service_slug || reclaiming) return;
      setReclaiming(true);
      try {
        await invokeFn('submit-quote-request', {
          userId: user.id,
          userRole: role || '',
          serviceSlug: order.service_slug,
          description: order.description || '',
          assetUrl: order.asset_url || '',
          desiredDeliveryDate: order.desired_delivery_date || null,
          scope: order.scope || null,
          budgetRange: order.budget_range || null,
          styleReferences: order.style_references || null,
          notes: order.notes || null,
        });
        // Bounce to the orders list so the user lands on the fresh order
        // that was just created instead of staring at the expired one.
        Alert.alert(
          'Quote resubmitted',
          "We've sent a fresh request with the same brief. You'll get a notification the moment the seller replies.",
          [
            {
              text: 'View my orders',
              onPress: () => navigation.navigate('InfluencerServiceOrders'),
            },
          ],
        );
      } catch (e: any) {
        Alert.alert(
          "Couldn't reclaim",
          e?.message || 'Please try again in a moment.',
        );
      } finally {
        setReclaiming(false);
      }
    },
    reclaiming,
    revsLeft,
  });

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{backgroundColor: '#F5F4F8'}}>
      {/* Top bar */}
      <View
        className="bg-white px-5 py-4 flex-row items-center border-b border-slate-100"
        style={{gap: 12}}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center">
          <ChevronLeft size={20} color="#E60076" />
        </TouchableOpacity>
        <View className="flex-1 min-w-0">
          <Text className="text-base font-bold text-slate-800" numberOfLines={1}>
            {order.service_title || 'Service order'}
          </Text>
          {order.order_number ? (
            <Text className="text-[10px] font-mono text-slate-400">
              {order.order_number}
            </Text>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
      <ScrollView
        contentContainerStyle={{padding: 16, paddingBottom: 80, gap: 14}}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Status banner — padding on the outer View, gradient as absolute bg */}
        <View
          className="flex-row items-start"
          style={{borderRadius: 20, padding: 18, gap: 12, overflow: 'hidden'}}>
          <LinearGradient
            colors={banner.colors}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
          />
          <View
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{backgroundColor: 'rgba(255,255,255,0.2)'}}>
            <BannerIcon size={20} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-black text-white">
              {banner.title}
            </Text>
            <Text className="text-xs text-white/85 leading-5 mt-1">
              {banner.body}
            </Text>
          </View>
        </View>

        {/* Status meta — pill + validity */}
        <View className="flex-row" style={{gap: 8}}>
          <View className={`${pill.bg} px-3 py-1.5 rounded-full`}>
            <Text className={`text-[10px] font-black uppercase ${pill.text}`}>
              {pill.label}
            </Text>
          </View>
          {validityRemaining && order.status === 'quoted' ? (
            <View className="bg-white border border-slate-200 px-3 py-1.5 rounded-full flex-row items-center" style={{gap: 4}}>
              <Clock size={11} color="#64748b" />
              <Text className="text-[10px] font-bold text-slate-600">
                Valid for {validityRemaining}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Quote summary */}
        {total > 0 || order.quoted_amount ? (
          <View className="bg-white rounded-2xl border border-slate-100 p-5" style={{gap: 10}}>
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Quote summary
            </Text>
            <View style={{gap: 6}}>
              {order.quoted_amount ? (
                <Row label="Quoted amount" value={formatINR(order.quoted_amount)} />
              ) : null}
              {order.counter_amount ? (
                <Row label="Your counter" value={formatINR(order.counter_amount)} />
              ) : null}
              {total > 0 ? (
                <Row label="Total" value={formatINR(total)} highlight />
              ) : null}
              {advance > 0 ? (
                <Row
                  label={`Advance (${order.advance_pct || 50}%)`}
                  value={formatINR(advance)}
                />
              ) : null}
              {advance > 0 && total > 0 ? (
                <Row
                  label={`On delivery (${100 - (order.advance_pct || 50)}%)`}
                  value={formatINR(total - advance)}
                />
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Brief snapshot — renders every brief field the order row has so
            users see the exact information they submitted, not just a
            subset (description / asset_url / scope / budget / delivery
            date / style_references / notes). */}
        {(order.description ||
          order.scope ||
          order.budget_range ||
          order.desired_delivery_date ||
          order.asset_url ||
          order.style_references ||
          order.notes) ? (
          <View
            className="bg-white rounded-2xl border border-slate-100 p-5"
            style={{gap: 10}}>
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Your brief
            </Text>
            {order.description ? (
              <Text className="text-sm text-slate-700 leading-5">
                {order.description}
              </Text>
            ) : null}
            <View className="flex-row flex-wrap" style={{gap: 6}}>
              {order.scope ? <Chip>{order.scope}</Chip> : null}
              {order.budget_range ? <Chip>{order.budget_range}</Chip> : null}
              {order.desired_delivery_date ? (
                <Chip>Deliver by {order.desired_delivery_date}</Chip>
              ) : null}
            </View>

            {/* Links — `asset_url` is the user's own page they shared, and
                `style_references` is one or more reference links pasted into
                the brief form. Render both as separate rows so neither
                drops out. style_references may be a multi-URL string or a
                comma/newline-separated list — split + render each. */}
            {order.asset_url ? (
              <View style={{gap: 4}}>
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Your page
                </Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(order.asset_url!)}
                  className="flex-row items-center"
                  style={{gap: 6}}>
                  <ExternalLink size={12} color="#5851DB" />
                  <Text
                    className="text-xs font-bold text-[#5851DB] underline flex-1"
                    numberOfLines={1}>
                    {order.asset_url}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {order.style_references ? (
              <View style={{gap: 4}}>
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Reference links
                </Text>
                {order.style_references
                  .split(/[\n,]+/)
                  .map(s => s.trim())
                  .filter(Boolean)
                  .map((ref, i) => {
                    const isUrl = /^https?:\/\//i.test(ref);
                    return isUrl ? (
                      <TouchableOpacity
                        key={`${ref}-${i}`}
                        onPress={() => Linking.openURL(ref)}
                        className="flex-row items-center"
                        style={{gap: 6}}>
                        <ExternalLink size={12} color="#5851DB" />
                        <Text
                          className="text-xs font-bold text-[#5851DB] underline flex-1"
                          numberOfLines={1}>
                          {ref}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text key={`${ref}-${i}`} className="text-xs text-slate-700">
                        {ref}
                      </Text>
                    );
                  })}
              </View>
            ) : null}

            {order.notes ? (
              <View style={{gap: 4}}>
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Additional notes
                </Text>
                <Text className="text-xs text-slate-700 leading-5">
                  {order.notes}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Draft / final downloads */}
        {order.draft_url &&
        ['draft_ready', 'revision_requested', 'paid_final', 'completed'].includes(
          order.status,
        ) ? (
          <View className="bg-white rounded-2xl border border-slate-100 p-5" style={{gap: 8}}>
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Latest draft
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(order.draft_url!)}
              activeOpacity={0.85}
              className="flex-row items-center bg-slate-50 border border-slate-100 rounded-xl p-3"
              style={{gap: 12}}>
              <View className="w-10 h-10 bg-purple-100 rounded-xl items-center justify-center">
                <ExternalLink size={16} color="#5851DB" />
              </View>
              <Text className="text-sm font-bold text-slate-800 flex-1">
                Open draft
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {order.status === 'completed' &&
        Array.isArray(order.final_files) &&
        order.final_files.length > 0 ? (
          <View className="bg-white rounded-2xl border border-slate-100 p-5" style={{gap: 8}}>
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Final files
            </Text>
            <View style={{gap: 6}}>
              {order.final_files.map((f, i) => (
                <TouchableOpacity
                  key={`${f.url}-${i}`}
                  onPress={() => Linking.openURL(f.url)}
                  activeOpacity={0.85}
                  className="flex-row items-center bg-slate-50 border border-slate-100 rounded-xl p-3"
                  style={{gap: 12}}>
                  <View className="w-9 h-9 bg-emerald-100 rounded-xl items-center justify-center">
                    <ExternalLink size={14} color="#10b981" />
                  </View>
                  <Text className="text-sm font-bold text-slate-800 flex-1" numberOfLines={1}>
                    {f.label || `Final file ${i + 1}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* Status action */}
        {statusActions}

        {/* Revision prompt — slides in when the user taps Revision and
            collapses on Cancel / successful submit. */}
        {order.status === 'draft_ready' && revisionMode ? (
          <View className="bg-white rounded-2xl border border-slate-100 p-4" style={{gap: 10}}>
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Request a revision
            </Text>
            <Text className="text-[12px] text-slate-500 leading-5">
              {revsLeft > 0
                ? `Use one of your ${revsLeft} revision${revsLeft === 1 ? '' : 's'} to request changes. No additional payment required.`
                : "You've used all your revision rounds."}
            </Text>
            <TextInput
              value={revisionNote}
              onChangeText={setRevisionNote}
              placeholder="Be specific — which parts need to change?"
              placeholderTextColor="#cbd5e1"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                backgroundColor: '#F8F9FD',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 13,
                color: '#0f172a',
                minHeight: 90,
              }}
            />
            {revisionError ? (
              <Text className="text-[12px] text-red-600 font-semibold">
                {revisionError}
              </Text>
            ) : null}
            <View className="flex-row" style={{gap: 8}}>
              <TouchableOpacity
                onPress={() => {
                  setRevisionMode(false);
                  setRevisionNote('');
                  setRevisionError(null);
                }}
                className="flex-1 py-3 rounded-2xl border border-slate-200 items-center">
                <Text className="text-sm font-black text-slate-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitRevision}
                disabled={revisionNote.trim().length < 5}
                style={{
                  opacity: revisionNote.trim().length < 5 ? 0.5 : 1,
                  flex: 1,
                }}>
                <LinearGradient
                  colors={['#F97316', '#F43F5E']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={{
                    paddingVertical: 12,
                    borderRadius: 14,
                    alignItems: 'center',
                  }}>
                  <Text className="text-white text-sm font-black">
                    Send revision
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Counter-offer form — slides in from the Counter button. */}
        {(order.status === 'quoted' || order.status === 'accepted') &&
        counterMode ? (
          <View
            className="bg-white rounded-2xl border border-slate-100 p-4"
            style={{gap: 10}}>
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Send a counter-offer
            </Text>
            <Text className="text-[12px] text-slate-500 leading-5">
              Propose a new total for this order. The team will review and
              either accept or counter back.
            </Text>
            <View style={{gap: 4}}>
              <Text className="text-[10px] font-bold text-slate-400 uppercase">
                Your counter (₹)
              </Text>
              <TextInput
                value={counterAmount}
                onChangeText={v => setCounterAmount(v.replace(/[^\d]/g, ''))}
                placeholder="e.g. 12000"
                placeholderTextColor="#cbd5e1"
                keyboardType="number-pad"
                style={{
                  backgroundColor: '#F8F9FD',
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: '#0f172a',
                }}
              />
            </View>
            <TextInput
              value={counterMessage}
              onChangeText={setCounterMessage}
              placeholder="Why does this price work better for you? (optional)"
              placeholderTextColor="#cbd5e1"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{
                backgroundColor: '#F8F9FD',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 13,
                color: '#0f172a',
                minHeight: 70,
              }}
            />
            {counterError ? (
              <Text className="text-[12px] text-red-600 font-semibold">
                {counterError}
              </Text>
            ) : null}
            <View className="flex-row" style={{gap: 8}}>
              <TouchableOpacity
                onPress={() => {
                  setCounterMode(false);
                  setCounterError(null);
                }}
                className="flex-1 py-3 rounded-2xl border border-slate-200 items-center">
                <Text className="text-sm font-black text-slate-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitCounter}
                disabled={!counterAmount}
                style={{opacity: !counterAmount ? 0.5 : 1, flex: 1}}>
                <LinearGradient
                  colors={['#F97316', '#F43F5E']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={{
                    paddingVertical: 12,
                    borderRadius: 14,
                    alignItems: 'center',
                  }}>
                  <Text className="text-white text-sm font-black">
                    Send counter
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Decline form — slides in when the user taps "Decline this quote".
            Optional reason textarea, then rose-coloured confirm. */}
        {order.status === 'quoted' && declineMode ? (
          <View
            className="bg-white rounded-2xl border border-slate-100 p-4"
            style={{gap: 10}}>
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Decline this quote
            </Text>
            <Text className="text-[12px] text-slate-500 leading-5">
              The team will be notified and this order will be closed. You can
              submit a fresh brief any time.
            </Text>
            <TextInput
              value={declineReason}
              onChangeText={setDeclineReason}
              placeholder="Optional — short reason"
              placeholderTextColor="#cbd5e1"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{
                backgroundColor: '#F8F9FD',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 13,
                color: '#0f172a',
                minHeight: 70,
              }}
            />
            {declineError ? (
              <Text className="text-[12px] text-red-600 font-semibold">
                {declineError}
              </Text>
            ) : null}
            <View className="flex-row" style={{gap: 8}}>
              <TouchableOpacity
                onPress={() => {
                  setDeclineMode(false);
                  setDeclineReason('');
                  setDeclineError(null);
                }}
                className="flex-1 py-3 rounded-2xl border border-slate-200 items-center">
                <Text className="text-sm font-black text-slate-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitDecline}
                className="flex-1"
                style={{
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                  overflow: 'hidden',
                }}>
                <LinearGradient
                  colors={['#F43F5E', '#E11D48']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                />
                <Text className="text-white text-sm font-black">
                  Confirm decline
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Review block — read-only summary if submitted, form if reviewing. */}
        {order.status === 'completed' && myReview ? (
          <ReviewSummary review={myReview} />
        ) : null}

        {order.status === 'completed' && !myReview && reviewMode ? (
          <ReviewFormCard
            draft={reviewDraft}
            setDraft={setReviewDraft}
            error={reviewError}
            onCancel={() => {
              setReviewMode(false);
              setReviewError(null);
            }}
            onSubmit={submitReview}
          />
        ) : null}

        {payError ? (
          <View className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <Text className="text-[12px] text-red-600 font-semibold">{payError}</Text>
          </View>
        ) : null}

        {/* Event timeline — each event renders as a titled card with the
            notes split into bullet pointers (by newline / pipe / period)
            so a multi-line server note reads as a list instead of a wall. */}
        {events.length > 0 ? (
          <View className="bg-white rounded-2xl border border-slate-100 p-5" style={{gap: 14}}>
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Timeline
            </Text>
            <View style={{gap: 14}}>
              {events.map(ev => {
                const bullets = (ev.notes || '')
                  .split(/[\n|·]+|(?:\. (?=[A-Z]))/)
                  .map(s => s.trim().replace(/\.$/, ''))
                  .filter(Boolean);
                const title = (ev.event_type || 'event')
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, c => c.toUpperCase());
                return (
                  <View
                    key={ev.id}
                    className="flex-row items-start"
                    style={{gap: 12}}>
                    <View className="w-3 h-3 rounded-full bg-pink-500 mt-1.5" />
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-slate-800">
                        {title}
                      </Text>
                      {bullets.length > 0 ? (
                        <View style={{gap: 4, marginTop: 4}}>
                          {bullets.map((b, i) => (
                            <View
                              key={`${ev.id}-${i}`}
                              className="flex-row"
                              style={{gap: 6}}>
                              <Text
                                className="text-[12px] text-pink-500"
                                style={{lineHeight: 18}}>
                                •
                              </Text>
                              <Text
                                className="text-[12px] text-slate-600 flex-1"
                                style={{lineHeight: 18}}>
                                {b}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                      {ev.occurred_at ? (
                        <Text className="text-[10px] text-slate-400 mt-1.5">
                          {new Date(ev.occurred_at).toLocaleString()}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Gateway picker — only rendered while user is choosing Stripe vs
          Razorpay. Picker dismiss => null phase => modal hides. */}
      <GatewayPickerModal
        visible={pickerPhase !== null}
        planLabel={
          pickerPhase === 'advance'
            ? 'service advance'
            : pickerPhase === 'final'
              ? 'final payment'
              : ''
        }
        onCancel={() => setPickerPhase(null)}
        onPick={handleGatewayPick}
      />
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-slate-600">{label}</Text>
      <Text
        className={`text-sm font-bold ${
          highlight ? 'text-pink-600' : 'text-slate-900'
        }`}>
        {value}
      </Text>
    </View>
  );
}

function Chip({children}: {children: React.ReactNode}) {
  return (
    <View className="bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full">
      <Text className="text-[11px] font-bold text-purple-700">{children}</Text>
    </View>
  );
}

interface ActionHandlers {
  onPayAdvance: () => void;
  onPayFinal: () => void;
  onCounter: () => void;
  onDecline: () => void;
  onRequestRevision: () => void;
  onLeaveReview: () => void;
  onReclaim: () => void;
  reclaiming?: boolean;
  revsLeft?: number;
}

function renderStatusActions(order: Order, h: ActionHandlers) {
  if (order.status === 'quoted' || order.status === 'accepted') {
    return (
      <View style={{gap: 10}}>
        <View className="flex-row" style={{gap: 8}}>
          <TouchableOpacity
            onPress={h.onPayAdvance}
            className="flex-1"
            activeOpacity={0.85}
            style={{paddingVertical: 14, borderRadius: 14, alignItems: 'center', overflow: 'hidden'}}>
            <LinearGradient
              colors={['#9810FA', '#E60076']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
            />
            <Text className="text-white text-sm font-black">Pay advance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={h.onCounter}
            className="px-4 py-3 rounded-2xl border border-slate-200 bg-white items-center justify-center">
            <Text className="text-slate-700 text-xs font-black">Counter</Text>
          </TouchableOpacity>
        </View>
        {order.status === 'quoted' ? (
          <TouchableOpacity
            onPress={h.onDecline}
            className="items-center py-1"
            hitSlop={8}>
            <Text className="text-[12px] font-semibold text-slate-400">
              Decline this quote
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
  if (order.status === 'draft_ready') {
    const revisionDisabled = (h.revsLeft ?? 0) <= 0;
    return (
      <View className="flex-row" style={{gap: 8}}>
        <TouchableOpacity
          onPress={h.onPayFinal}
          className="flex-1"
          activeOpacity={0.85}
          style={{paddingVertical: 14, borderRadius: 14, alignItems: 'center', overflow: 'hidden'}}>
          <LinearGradient
            colors={['#10b981', '#14B8A6']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
          />
          <Text className="text-white text-sm font-black">Approve & pay final</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={h.onRequestRevision}
          disabled={revisionDisabled}
          style={{opacity: revisionDisabled ? 0.5 : 1}}
          className="px-4 py-3 rounded-2xl border border-amber-200 bg-amber-50 items-center justify-center">
          <Text className="text-amber-700 text-xs font-black">
            Revision{h.revsLeft != null ? ` (${h.revsLeft})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (order.status === 'completed') {
    return (
      <TouchableOpacity
        onPress={h.onLeaveReview}
        activeOpacity={0.85}
        style={{paddingVertical: 14, borderRadius: 14, alignItems: 'center', overflow: 'hidden'}}>
        <LinearGradient
          colors={['#F59E0B', '#F97316']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
        />
        <Text className="text-white text-sm font-black">Leave a review</Text>
      </TouchableOpacity>
    );
  }
  // Expired or declined: one-click reclaim that resubmits the original
  // brief verbatim via submit-quote-request. Saves the user from re-typing
  // the description / scope / links every time the validity window lapses.
  if (order.status === 'expired' || order.status === 'declined') {
    return (
      <TouchableOpacity
        onPress={h.onReclaim}
        activeOpacity={0.85}
        disabled={h.reclaiming}
        style={{
          paddingVertical: 14,
          borderRadius: 14,
          alignItems: 'center',
          overflow: 'hidden',
          opacity: h.reclaiming ? 0.7 : 1,
        }}>
        <LinearGradient
          colors={['#9810FA', '#E60076']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
        />
        <Text className="text-white text-sm font-black">
          {h.reclaiming ? 'Resubmitting…' : 'Reclaim this quote'}
        </Text>
      </TouchableOpacity>
    );
  }
  return null;
}

/* ─────────── Review components ─────────── */

function StarRow({
  value,
  onChange,
  size = 22,
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: number;
}) {
  return (
    <View style={{flexDirection: 'row', gap: 4}}>
      {[1, 2, 3, 4, 5].map(n => {
        const filled = n <= value;
        const Wrapper: any = onChange ? TouchableOpacity : View;
        return (
          <Wrapper
            key={n}
            onPress={onChange ? () => onChange(n) : undefined}
            hitSlop={4}>
            <Star
              size={size}
              color="#F59E0B"
              fill={filled ? '#F59E0B' : 'transparent'}
            />
          </Wrapper>
        );
      })}
    </View>
  );
}

function SubAxis({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange?: (n: number) => void;
}) {
  return (
    <View style={{gap: 4}}>
      <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </Text>
      <StarRow value={value} onChange={onChange} size={14} />
    </View>
  );
}

function ReviewSummary({review}: {review: ServiceReview}) {
  return (
    <View className="bg-white rounded-2xl border border-slate-100 p-5" style={{gap: 12}}>
      <Text className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
        Review submitted
      </Text>
      <View className="flex-row items-baseline" style={{gap: 8}}>
        <Text className="text-2xl font-black text-slate-900">
          {(review.overall || 0).toFixed(1)}
        </Text>
        <Text className="text-base font-bold text-amber-500">★</Text>
      </View>
      <Text className="text-[12px] text-slate-500">
        Thanks for the feedback — it helps other creators discover the service.
      </Text>
      <View className="flex-row flex-wrap" style={{gap: 12}}>
        <View style={{minWidth: '45%'}}>
          <Text className="text-[10px] font-bold text-slate-400 uppercase">Quality</Text>
          <Text className="text-[13px] font-black text-slate-700 mt-0.5">
            {review.quality ? `${review.quality} ★` : '—'}
          </Text>
        </View>
        <View style={{minWidth: '45%'}}>
          <Text className="text-[10px] font-bold text-slate-400 uppercase">Communication</Text>
          <Text className="text-[13px] font-black text-slate-700 mt-0.5">
            {review.communication ? `${review.communication} ★` : '—'}
          </Text>
        </View>
        <View style={{minWidth: '45%'}}>
          <Text className="text-[10px] font-bold text-slate-400 uppercase">On-time delivery</Text>
          <Text className="text-[13px] font-black text-slate-700 mt-0.5">
            {review.on_time_delivery ? `${review.on_time_delivery} ★` : '—'}
          </Text>
        </View>
        <View style={{minWidth: '45%'}}>
          <Text className="text-[10px] font-bold text-slate-400 uppercase">Value for money</Text>
          <Text className="text-[13px] font-black text-slate-700 mt-0.5">
            {review.value_for_money ? `${review.value_for_money} ★` : '—'}
          </Text>
        </View>
      </View>
      {review.text ? (
        <Text className="text-[12px] text-slate-600 italic">"{review.text}"</Text>
      ) : null}
    </View>
  );
}

function ReviewFormCard({
  draft,
  setDraft,
  error,
  onCancel,
  onSubmit,
}: {
  draft: ReviewDraft;
  setDraft: React.Dispatch<React.SetStateAction<ReviewDraft>>;
  error: string | null;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <View className="bg-white rounded-2xl border border-slate-100 p-5" style={{gap: 12}}>
      <View>
        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Rate your experience
        </Text>
        <Text className="text-[11px] text-pink-500 mt-0.5">
          Help others discover the best RGossips services
        </Text>
      </View>

      <View className="items-center" style={{gap: 6}}>
        <Text className="text-[11px] text-slate-500">
          Tap to rate ({draft.overall} star{draft.overall === 1 ? '' : 's'} selected)
        </Text>
        <StarRow
          value={draft.overall}
          onChange={n => setDraft(d => ({...d, overall: n}))}
          size={28}
        />
      </View>

      <TextInput
        value={draft.text}
        onChangeText={t => setDraft(d => ({...d, text: t}))}
        placeholder="Share your experience… (optional)"
        placeholderTextColor="#cbd5e1"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        style={{
          backgroundColor: '#F8F9FD',
          borderWidth: 1,
          borderColor: '#e2e8f0',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 13,
          color: '#0f172a',
          minHeight: 70,
        }}
      />

      <View className="flex-row flex-wrap" style={{gap: 12}}>
        <View style={{minWidth: '45%', flex: 1}}>
          <SubAxis
            label="Quality"
            value={draft.quality}
            onChange={n => setDraft(d => ({...d, quality: n}))}
          />
        </View>
        <View style={{minWidth: '45%', flex: 1}}>
          <SubAxis
            label="Communication"
            value={draft.communication}
            onChange={n => setDraft(d => ({...d, communication: n}))}
          />
        </View>
        <View style={{minWidth: '45%', flex: 1}}>
          <SubAxis
            label="On-time delivery"
            value={draft.on_time_delivery}
            onChange={n => setDraft(d => ({...d, on_time_delivery: n}))}
          />
        </View>
        <View style={{minWidth: '45%', flex: 1}}>
          <SubAxis
            label="Value for money"
            value={draft.value_for_money}
            onChange={n => setDraft(d => ({...d, value_for_money: n}))}
          />
        </View>
      </View>

      {error ? (
        <Text className="text-[12px] text-red-600 font-semibold">{error}</Text>
      ) : null}

      <View className="flex-row" style={{gap: 8}}>
        <TouchableOpacity
          onPress={onCancel}
          className="flex-1 py-3 rounded-2xl border border-slate-200 items-center">
          <Text className="text-sm font-black text-slate-600">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSubmit}
          className="flex-1"
          style={{
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center',
            overflow: 'hidden',
          }}>
          <LinearGradient
            colors={['#F59E0B', '#F97316']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
          />
          <Text className="text-white text-sm font-black">Submit Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
