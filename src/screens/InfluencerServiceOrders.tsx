// Service orders history — every quote request the user has submitted,
// with its current status. Direct Supabase query (RLS lets each user read
// their own rows).
//
// Web parity: src/app/influencer/services/orders/page.js. Same tab set,
// same status pill map.

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ChevronLeft, ChevronRight, Search} from 'lucide-react-native';
import {supabase} from '../utils/supabase';
import {useAuth} from '../context/AuthContext';
import {formatINR} from '../lib/services';

type OrderRow = {
  id: string;
  order_number?: string;
  service_title?: string;
  status: string;
  total_amount?: number;
  quoted_amount?: number;
  advance_pct?: number;
  created_at?: string;
  updated_at?: string;
};

export const STATUS_PILL: Record<string, {label: string; bg: string; text: string}> = {
  pending_quote:      {label: 'Awaiting quote',  bg: 'bg-amber-50',    text: 'text-amber-700'},
  quoted:             {label: 'Quote ready',     bg: 'bg-emerald-50',  text: 'text-emerald-700'},
  counter_offered:    {label: 'Counter sent',    bg: 'bg-orange-50',   text: 'text-orange-700'},
  accepted:           {label: 'Quote accepted',  bg: 'bg-emerald-50',  text: 'text-emerald-700'},
  paid_advance:       {label: 'Advance paid',    bg: 'bg-violet-50',   text: 'text-violet-700'},
  in_progress:        {label: 'In progress',     bg: 'bg-violet-50',   text: 'text-violet-700'},
  draft_ready:        {label: 'Draft ready',     bg: 'bg-amber-50',    text: 'text-amber-700'},
  revision_requested: {label: 'Revision sent',   bg: 'bg-orange-50',   text: 'text-orange-700'},
  paid_final:         {label: 'Final paid',      bg: 'bg-emerald-50',  text: 'text-emerald-700'},
  completed:          {label: 'Completed',       bg: 'bg-blue-50',     text: 'text-blue-700'},
  declined:           {label: 'Declined',        bg: 'bg-gray-100',    text: 'text-gray-500'},
  expired:            {label: 'Expired',         bg: 'bg-gray-100',    text: 'text-gray-500'},
};

const TABS = [
  {id: 'all', label: 'All'},
  {id: 'active', label: 'Active'},
  {id: 'completed', label: 'Completed'},
  {id: 'declined', label: 'Closed'},
] as const;
type Tab = (typeof TABS)[number]['id'];

const ACTIVE_STATUSES = new Set([
  'pending_quote',
  'quoted',
  'counter_offered',
  'accepted',
  'paid_advance',
  'in_progress',
  'draft_ready',
  'revision_requested',
  'paid_final',
]);

export default function InfluencerServiceOrders() {
  const navigation = useNavigation<any>();
  const {user} = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const {data, error} = await supabase
      .from('service_orders')
      .select(
        'id, order_number, service_title, status, total_amount, quoted_amount, advance_pct, created_at, updated_at',
      )
      .eq('user_id', user.id)
      .order('created_at', {ascending: false});
    if (error) console.warn('service_orders select failed:', error.message);
    setOrders((data || []) as OrderRow[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Re-pull on focus so a freshly-submitted quote appears without a manual
  // reload after the quote success screen.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const counts = useMemo(() => {
    const out = {all: orders.length, active: 0, completed: 0, declined: 0};
    for (const o of orders) {
      if (ACTIVE_STATUSES.has(o.status)) out.active += 1;
      else if (o.status === 'completed') out.completed += 1;
      else if (o.status === 'declined' || o.status === 'expired') out.declined += 1;
    }
    return out;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(o => {
      if (tab === 'active' && !ACTIVE_STATUSES.has(o.status)) return false;
      if (tab === 'completed' && o.status !== 'completed') return false;
      if (
        tab === 'declined' &&
        o.status !== 'declined' &&
        o.status !== 'expired'
      )
        return false;
      if (!q) return true;
      return (
        (o.service_title || '').toLowerCase().includes(q) ||
        (o.order_number || '').toLowerCase().includes(q)
      );
    });
  }, [orders, tab, query]);

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
        <View>
          <Text className="text-base font-bold text-slate-800">
            Service Requests
          </Text>
          <Text className="text-[11px] text-slate-400">
            Every brief — quote, in progress or done
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{padding: 16, paddingBottom: 80, gap: 14}}
        showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View className="flex-row items-center bg-white rounded-2xl px-3 h-11 shadow-sm">
          <Search size={18} color="#94A3B8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by service or order number…"
            placeholderTextColor="#cbd5e1"
            className="flex-1 ml-2 text-sm text-slate-700"
          />
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{gap: 6}}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setTab(t.id)}
                className={`flex-row items-center px-3.5 py-2 rounded-full ${
                  active ? 'bg-slate-900' : 'bg-white border border-slate-200'
                }`}
                style={{gap: 6}}>
                <Text
                  className={`text-[12px] font-bold ${
                    active ? 'text-white' : 'text-slate-600'
                  }`}>
                  {t.label}
                </Text>
                <View
                  className={`px-1.5 py-0.5 rounded ${
                    active ? 'bg-white/20' : 'bg-slate-100'
                  }`}>
                  <Text
                    className={`text-[10px] font-black ${
                      active ? 'text-white' : 'text-slate-600'
                    }`}>
                    {counts[t.id] || 0}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* List */}
        {loading ? (
          <View className="py-16 items-center">
            <ActivityIndicator color="#E60076" size="large" />
          </View>
        ) : filtered.length === 0 ? (
          <View className="bg-white rounded-3xl py-12 items-center" style={{gap: 8}}>
            <Text className="text-sm font-bold text-slate-500">
              {orders.length === 0
                ? "You haven't requested any services yet."
                : 'Nothing in this view.'}
            </Text>
            {orders.length === 0 ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('InfluencerServices')}>
                <Text className="text-sm font-bold text-pink-500 underline">
                  Browse services →
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          filtered.map(o => (
            <OrderRowCard
              key={o.id}
              order={o}
              onPress={() =>
                navigation.navigate('InfluencerServiceOrderDetail', {id: o.id})
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function OrderRowCard({
  order,
  onPress,
}: {
  order: OrderRow;
  onPress: () => void;
}) {
  const pill = STATUS_PILL[order.status] || {
    label: order.status,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
  };
  const amount = order.total_amount || order.quoted_amount || 0;
  const date = order.created_at
    ? new Date(order.created_at).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-white rounded-3xl border border-slate-100 p-4 flex-row items-center"
      style={{gap: 12}}>
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center" style={{gap: 6}}>
          {order.order_number ? (
            <Text className="text-[11px] font-mono text-slate-400">
              {order.order_number}
            </Text>
          ) : null}
          <View className={`${pill.bg} px-2 py-0.5 rounded`}>
            <Text
              className={`text-[9px] font-black uppercase tracking-wider ${pill.text}`}>
              {pill.label}
            </Text>
          </View>
        </View>
        <Text
          className="text-sm font-black text-slate-900 mt-1"
          numberOfLines={1}>
          {order.service_title || 'Service order'}
        </Text>
        <Text className="text-[11px] text-slate-400 mt-0.5">{date}</Text>
      </View>
      {amount > 0 ? (
        <Text className="text-base font-black text-slate-900">
          {formatINR(amount)}
        </Text>
      ) : null}
      <ChevronRight size={16} color="#CBD5E1" />
    </TouchableOpacity>
  );
}
