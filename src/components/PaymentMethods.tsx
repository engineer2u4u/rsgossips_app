// Payments — UPI + bank CRUD, real-data Credit + Subscription history.
//
// Mirrors D:/Development/React/RS_Gossips src/components/PaymentMethods.jsx
// element-for-element:
//   1. Pending-earnings banner (when payout_status === 'pending_creator_info')
//   2. Payment Methods card — list with Verified/Pending/Failed chip,
//      Set Primary, delete; Add New opens the UPI/Bank modal
//   3. Credit History card — campaign earnings rows from campaign_applications
//   4. Subscription History card — invoices via subscription-history edge fn
//
// The static "Earnings Summary" tiles and the mock transactions+tabs were
// removed; web doesn't have them.

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronLeft,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  IndianRupee,
  Loader,
  Plus,
  Receipt,
  Smartphone,
  Trash2,
  Wallet,
  X,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {supabase} from '../utils/supabase';
import {invokeFn} from '../lib/api';
import {useAuth} from '../context/AuthContext';
import {useGlobalLoading} from '../context/LoadingContext';

interface Props {
  onBack: () => void;
}

type PaymentMethod = {
  id: string;
  user_id: string;
  type: 'upi' | 'bank';
  upi_id?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc?: string | null;
  account_holder_name?: string | null;
  is_primary: boolean;
  validation_status?: 'pending' | 'success' | 'failed';
  validation_failure_reason?: string | null;
};

type Earning = {
  id: string;
  escrow_amount: number | null;
  payout_status:
    | 'pending_creator_info'
    | 'scheduled'
    | 'processing'
    | 'processed'
    | 'failed'
    | 'reversed';
  payout_release_at?: string | null;
  payout_processed_at?: string | null;
  payout_utr?: string | null;
  payout_method?: string | null;
  campaigns?: {
    title?: string;
    brand_profiles?: {
      brand_name?: string;
      gstin_trade_name?: string;
      logo_url?: string;
    };
  };
};

type Invoice = {
  id: string;
  gateway: 'razorpay' | 'stripe';
  amount: number;
  currency: string;
  status: string;
  number?: string;
  paid_at?: number;
  created_at?: number;
  next_charge_at?: number;
  subscription_status?: string;
  plan?: string;
  cycle?: string;
  pdf_url?: string;
  hosted_url?: string;
};

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: {width: 0, height: 4},
  elevation: 3,
};

function formatINR(amountMinor: number | null | undefined) {
  if (amountMinor == null) return '—';
  const rupees = Math.round(amountMinor / 100);
  return '₹' + rupees.toLocaleString('en-IN');
}

function formatDate(input: number | string | null | undefined): string {
  if (!input) return '—';
  const d =
    typeof input === 'number' ? new Date(input * 1000) : new Date(input);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ValidationChip({
  status,
}: {
  status?: 'pending' | 'success' | 'failed';
}) {
  if (status === 'success') {
    return (
      <Chip bg="#D1FAE5" fg="#047857" label="Verified" />
    );
  }
  if (status === 'failed') {
    return (
      <Chip bg="#FEE2E2" fg="#B91C1C" label="Verify failed" />
    );
  }
  return <Chip bg="#FEF3C7" fg="#92400E" label="Verifying…" />;
}

function Chip({bg, fg, label}: {bg: string; fg: string; label: string}) {
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: bg,
      }}>
      <Text
        className="font-black uppercase"
        style={{fontSize: 8, letterSpacing: 0.6, color: fg}}>
        {label}
      </Text>
    </View>
  );
}

const EARNING_STATUS_STYLE: Record<
  Earning['payout_status'],
  {label: string; bg: string; fg: string}
> = {
  pending_creator_info: {
    label: 'Add payout details to receive',
    bg: '#FEF3C7',
    fg: '#92400E',
  },
  scheduled: {label: 'Scheduled', bg: '#E0E7FF', fg: '#3730A3'},
  processing: {label: 'Processing', bg: '#DBEAFE', fg: '#1E40AF'},
  processed: {label: 'Paid', bg: '#D1FAE5', fg: '#047857'},
  failed: {label: 'Failed', bg: '#FEE2E2', fg: '#B91C1C'},
  reversed: {label: 'Reversed', bg: '#FEE2E2', fg: '#B91C1C'},
};

const INVOICE_STATUS_STYLE: Record<string, {bg: string; fg: string}> = {
  paid: {bg: '#D1FAE5', fg: '#047857'},
  open: {bg: '#FEF3C7', fg: '#92400E'},
  draft: {bg: '#F3F4F6', fg: '#6B7280'},
  issued: {bg: '#FEF3C7', fg: '#92400E'},
  partially_paid: {bg: '#FEF3C7', fg: '#92400E'},
  expired: {bg: '#F3F4F6', fg: '#6B7280'},
  cancelled: {bg: '#FFE4E6', fg: '#9F1239'},
  canceled: {bg: '#FFE4E6', fg: '#9F1239'},
  void: {bg: '#F3F4F6', fg: '#6B7280'},
  uncollectible: {bg: '#FFE4E6', fg: '#9F1239'},
  failed: {bg: '#FFE4E6', fg: '#9F1239'},
};

export default function PaymentMethods({onBack}: Props) {
  const {user} = useAuth();
  const {withLoading} = useGlobalLoading();

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);

  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(true);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);

  const fetchMethods = useCallback(async () => {
    if (!user?.id) return;
    setMethodsLoading(true);
    const {data, error} = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', {ascending: false})
      .order('created_at', {ascending: false});
    if (error) console.warn('payment_methods read failed:', error.message);
    setMethods((data || []) as PaymentMethod[]);
    setMethodsLoading(false);
  }, [user?.id]);

  const fetchEarnings = useCallback(async () => {
    if (!user?.id) return;
    setEarningsLoading(true);
    const {data, error} = await supabase
      .from('campaign_applications')
      .select(
        'id, escrow_amount, payout_status, payout_release_at, payout_processed_at, payout_utr, payout_method, campaigns(title, brand_id, brand_profiles:brand_id(brand_name, gstin_trade_name, logo_url))',
      )
      .eq('influencer_id', user.id)
      .not('payout_status', 'is', null)
      .order('payout_release_at', {ascending: false})
      .limit(50);
    if (error) console.warn('earnings read failed:', error.message);
    setEarnings((data || []) as unknown as Earning[]);
    setEarningsLoading(false);
  }, [user?.id]);

  const fetchInvoices = useCallback(async () => {
    if (!user?.id) return;
    setInvoicesLoading(true);
    try {
      const {data, error} = await supabase.functions.invoke('subscription-history', {
        body: {userId: user.id},
      });
      if (error) throw new Error(error.message);
      setInvoices(Array.isArray(data?.invoices) ? data.invoices : []);
    } catch (e: any) {
      console.warn('subscription-history fetch failed:', e?.message);
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMethods();
    fetchEarnings();
    fetchInvoices();
  }, [fetchMethods, fetchEarnings, fetchInvoices]);

  const pendingEarnings = useMemo(
    () => earnings.filter(e => e.payout_status === 'pending_creator_info'),
    [earnings],
  );
  const pendingTotalInr = useMemo(
    () =>
      pendingEarnings.reduce(
        (sum, e) => sum + Math.round((e.escrow_amount || 0) / 100),
        0,
      ),
    [pendingEarnings],
  );

  const setPrimary = async (id: string) => {
    if (!user?.id) return;
    await withLoading(
      (async () => {
        await supabase
          .from('payment_methods')
          .update({is_primary: false})
          .eq('user_id', user.id);
        await supabase
          .from('payment_methods')
          .update({is_primary: true, updated_at: new Date().toISOString()})
          .eq('id', id);
        await fetchMethods();
      })(),
      'Updating primary…',
    );
  };

  const removeMethod = (m: PaymentMethod) =>
    Alert.alert(
      'Remove payment method?',
      m.type === 'upi'
        ? `Remove ${m.upi_id}?`
        : `Remove ${m.bank_name} •••• ${(m.account_number || '').slice(-4)}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            withLoading(
              (async () => {
                await supabase.from('payment_methods').delete().eq('id', m.id);
                setMethods(prev => prev.filter(x => x.id !== m.id));
              })(),
              'Removing…',
            ),
        },
      ],
    );

  return (
    <View className="flex-1" style={{backgroundColor: '#F9FAFB'}}>
      <View
        className="flex-row items-center bg-white border-b border-slate-100 px-5 py-4"
        style={{gap: 12}}>
        <Pressable
          onPress={onBack}
          className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center">
          <ChevronLeft size={20} color="#E60076" />
        </Pressable>
        <Text className="text-lg font-black text-slate-900 tracking-tight">
          Payments
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          gap: 20,
          paddingBottom: Platform.OS === 'ios' ? 100 : 80,
        }}
        showsVerticalScrollIndicator={false}>
        {/* 1. Pending earnings banner */}
        {pendingEarnings.length > 0 ? (
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#FDE68A',
              backgroundColor: '#FFFBEB',
              gap: 12,
            }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: '#FEF3C7',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <AlertTriangle size={18} color="#D97706" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-black" style={{color: '#78350F'}}>
                ₹{pendingTotalInr.toLocaleString('en-IN')} is waiting for you
              </Text>
              <Text className="text-[11px] font-bold" style={{color: '#92400E'}}>
                Add a UPI ID or bank account to receive your campaign earnings.
              </Text>
            </View>
            <Plus size={16} color="#92400E" />
          </TouchableOpacity>
        ) : null}

        {/* 2. Payment Methods */}
        <View
          className="bg-white border border-gray-100"
          style={[{borderRadius: 16, overflow: 'hidden'}, cardShadow]}>
          <View
            className="flex-row items-center justify-between px-5 pt-5 pb-3"
            style={{gap: 12}}>
            <View className="flex-row items-center" style={{gap: 8}}>
              <Wallet size={18} color="#F97316" />
              <Text className="font-black text-gray-900 text-base">
                Payment Methods
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: '#E9D5FF',
              }}>
              <Plus size={12} color="#7C3AED" />
              <Text
                className="font-black"
                style={{fontSize: 10, color: '#7C3AED'}}>
                Add New
              </Text>
            </TouchableOpacity>
          </View>

          <View className="px-5 pb-5" style={{gap: 12}}>
            {methodsLoading ? (
              <View className="py-6 items-center">
                <ActivityIndicator color="#EC4899" />
              </View>
            ) : methods.length === 0 ? (
              <View className="py-8 items-center">
                <CreditCard size={32} color="#E5E7EB" />
                <Text className="text-sm font-bold text-gray-400 mt-3">
                  No payment methods added
                </Text>
                <Text className="text-xs text-gray-300 mt-1">
                  Add a UPI ID or bank account to receive payments
                </Text>
              </View>
            ) : (
              methods.map(m => {
                const isUpi = m.type === 'upi';
                const detail = isUpi
                  ? m.upi_id || 'UPI'
                  : `${m.bank_name || 'Bank'} ••••${(m.account_number || '').slice(-4)}`;
                return (
                  <View
                    key={m.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: m.is_primary ? '#E9D5FF' : '#F3F4F6',
                      backgroundColor: m.is_primary
                        ? 'rgba(245,243,255,0.6)'
                        : '#F9FAFB',
                      gap: 12,
                    }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: m.is_primary ? '#EDE9FE' : '#F3F4F6',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      {isUpi ? (
                        <Smartphone size={20} color={m.is_primary ? '#7C3AED' : '#6B7280'} />
                      ) : (
                        <Building2 size={20} color={m.is_primary ? '#7C3AED' : '#6B7280'} />
                      )}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center flex-wrap" style={{gap: 6}}>
                        <Text className="text-sm font-black text-gray-800">
                          {isUpi ? 'UPI' : 'Bank Account'}
                        </Text>
                        {m.is_primary ? (
                          <Chip bg="#EDE9FE" fg="#6D28D9" label="Primary" />
                        ) : null}
                        <ValidationChip status={m.validation_status} />
                      </View>
                      <Text
                        className="text-xs font-bold text-gray-400 mt-0.5"
                        numberOfLines={1}>
                        {detail}
                      </Text>
                    </View>
                    <View className="flex-row items-center" style={{gap: 8}}>
                      {!m.is_primary ? (
                        <TouchableOpacity
                          onPress={() => setPrimary(m.id)}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: '#E9D5FF',
                          }}>
                          <Text
                            className="font-black"
                            style={{fontSize: 9, color: '#7C3AED'}}>
                            Set Primary
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity
                        onPress={() => removeMethod(m)}
                        hitSlop={6}
                        style={{padding: 6}}>
                        <Trash2 size={14} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* 3. Credit History (campaign earnings) */}
        <View
          className="bg-white border border-gray-100"
          style={[{borderRadius: 16, padding: 20}, cardShadow]}>
          <View className="flex-row items-center mb-4" style={{gap: 8}}>
            <CreditCard size={18} color="#EC4899" />
            <Text className="font-black text-gray-900 text-base">
              Credit History
            </Text>
          </View>
          {earningsLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#EC4899" />
            </View>
          ) : earnings.length === 0 ? (
            <View
              className="py-10 items-center"
              style={{
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: '#E5E7EB',
                borderRadius: 12,
              }}>
              <IndianRupee size={28} color="#E5E7EB" />
              <Text className="text-sm font-bold text-gray-400 mt-3">
                No payouts yet
              </Text>
              <Text
                className="text-[11px] text-gray-300 mt-1 px-6 text-center">
                Once your campaign earnings are released they'll show up here.
              </Text>
            </View>
          ) : (
            earnings.map(e => <EarningRow key={e.id} earning={e} />)
          )}
        </View>

        {/* 4. Subscription History (invoices) */}
        <View
          className="bg-white border border-gray-100"
          style={[{borderRadius: 16, padding: 20}, cardShadow]}>
          <View
            className="flex-row items-center justify-between mb-4"
            style={{gap: 12}}>
            <View className="flex-row items-center" style={{gap: 8}}>
              <Receipt size={18} color="#6366F1" />
              <Text className="font-black text-gray-900 text-base">
                Subscription History
              </Text>
            </View>
            <TouchableOpacity
              onPress={fetchInvoices}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: '#E0E7FF',
              }}>
              <Text
                className="font-black"
                style={{fontSize: 10, color: '#4F46E5'}}>
                Refresh
              </Text>
            </TouchableOpacity>
          </View>
          {invoicesLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#6366F1" />
            </View>
          ) : invoices.length === 0 ? (
            <View
              className="py-10 items-center"
              style={{
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: '#E5E7EB',
                borderRadius: 12,
              }}>
              <Receipt size={28} color="#E5E7EB" />
              <Text className="text-sm font-bold text-gray-400 mt-3">
                No subscription invoices yet
              </Text>
              <Text
                className="text-[11px] text-gray-300 mt-1 px-6 text-center">
                Invoices for plan upgrades and renewals will show up here once
                you've made a payment.
              </Text>
            </View>
          ) : (
            invoices.map(inv => (
              <InvoiceRow key={`${inv.gateway}-${inv.id}`} inv={inv} />
            ))
          )}
        </View>
      </ScrollView>

      <AddPaymentModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaved={() => {
          setShowAddModal(false);
          fetchMethods();
          fetchEarnings();
        }}
        isFirstMethod={methods.length === 0}
      />
    </View>
  );
}

function EarningRow({earning}: {earning: Earning}) {
  const status = EARNING_STATUS_STYLE[earning.payout_status];
  const brand = earning.campaigns?.brand_profiles || {};
  const brandName = brand.brand_name || brand.gstin_trade_name || 'Brand';
  const campaignTitle = earning.campaigns?.title || 'Campaign';
  const amountInr = Math.round((earning.escrow_amount || 0) / 100);

  const subtitleDate =
    earning.payout_status === 'processed' && earning.payout_processed_at
      ? `Paid on ${formatDate(earning.payout_processed_at)}`
      : earning.payout_release_at
        ? earning.payout_status === 'scheduled'
          ? `Arriving by ${formatDate(earning.payout_release_at)}`
          : formatDate(earning.payout_release_at)
        : '';

  return (
    <View
      className="flex-row items-center"
      style={{
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
      }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: '#F9FAFB',
          borderWidth: 1,
          borderColor: '#F3F4F6',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text className="font-black" style={{fontSize: 10, color: '#9CA3AF'}}>
          {brandName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center flex-wrap" style={{gap: 6}}>
          <Text
            className="text-sm font-black text-gray-800"
            numberOfLines={1}
            style={{maxWidth: 140}}>
            {campaignTitle}
          </Text>
          <Chip bg={status.bg} fg={status.fg} label={status.label} />
        </View>
        <Text
          className="text-[11px] font-bold text-gray-400 mt-0.5"
          numberOfLines={1}>
          {brandName}
          {subtitleDate ? ` · ${subtitleDate}` : ''}
        </Text>
      </View>
      <Text className="text-sm font-black text-gray-900">
        ₹{amountInr.toLocaleString('en-IN')}
      </Text>
    </View>
  );
}

function InvoiceRow({inv}: {inv: Invoice}) {
  const planLabel = inv.plan
    ? inv.plan.charAt(0).toUpperCase() + inv.plan.slice(1)
    : 'Subscription';
  const cycleLabel =
    inv.cycle === 'annual' || inv.cycle === 'yearly'
      ? 'Annual'
      : inv.cycle === 'monthly'
        ? 'Monthly'
        : '';
  const downloadUrl = inv.pdf_url || inv.hosted_url;
  const isPdf = !!inv.pdf_url;
  const statusKey = String(inv.status || '').toLowerCase();
  const statusStyle =
    INVOICE_STATUS_STYLE[statusKey] || {bg: '#F3F4F6', fg: '#6B7280'};
  const subActive = inv.subscription_status === 'active';

  return (
    <View
      className="flex-row items-center"
      style={{
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
      }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: '#F9FAFB',
          borderWidth: 1,
          borderColor: '#F3F4F6',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text
          className="font-black uppercase"
          style={{
            fontSize: 9,
            letterSpacing: 0.6,
            color: inv.gateway === 'razorpay' ? '#0c2451' : '#635BFF',
          }}>
          {inv.gateway === 'razorpay' ? 'RZP' : 'STRP'}
        </Text>
      </View>
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center flex-wrap" style={{gap: 6}}>
          <Text
            className="text-sm font-black text-gray-800"
            numberOfLines={1}
            style={{maxWidth: 130}}>
            {planLabel}
            {cycleLabel ? ` · ${cycleLabel}` : ''}
          </Text>
          <Chip
            bg={subActive ? '#D1FAE5' : '#F3F4F6'}
            fg={subActive ? '#047857' : '#6B7280'}
            label={subActive ? 'Active' : 'Cancelled'}
          />
          {statusKey && statusKey !== 'paid' ? (
            <Chip bg={statusStyle.bg} fg={statusStyle.fg} label={statusKey} />
          ) : null}
        </View>
        <Text
          className="text-[11px] font-bold text-gray-400 mt-0.5"
          numberOfLines={1}>
          {formatDate(inv.paid_at || inv.created_at)}
          {inv.number ? ` · ${inv.number}` : ''}
        </Text>
      </View>
      <Text className="text-sm font-black text-gray-900">
        {formatINR(inv.amount)}
      </Text>
      {downloadUrl ? (
        <TouchableOpacity
          onPress={() => Linking.openURL(downloadUrl).catch(() => {})}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: '#E0E7FF',
          }}>
          {isPdf ? (
            <Download size={11} color="#4F46E5" />
          ) : (
            <ExternalLink size={11} color="#4F46E5" />
          )}
          <Text className="font-black" style={{fontSize: 10, color: '#4F46E5'}}>
            {isPdf ? 'PDF' : 'Invoice'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function AddPaymentModal({
  visible,
  onClose,
  onSaved,
  isFirstMethod,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  isFirstMethod: boolean;
}) {
  const {user} = useAuth();
  const [type, setType] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [holderName, setHolderName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setType('upi');
    setUpiId('');
    setBankName('');
    setAccountNumber('');
    setIfsc('');
    setHolderName('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!user?.id || saving) return;
    const trimmedUpi = upiId.trim();
    if (type === 'upi') {
      if (!trimmedUpi.includes('@')) {
        setError('Enter a valid UPI ID (e.g. you@bank).');
        return;
      }
    } else if (
      !holderName.trim() ||
      !bankName.trim() ||
      accountNumber.trim().length < 6 ||
      ifsc.trim().length < 6
    ) {
      setError('Fill in every field to add the bank account.');
      return;
    }
    setSaving(true);
    setError('');
    // Route through the same edge function the web uses (see
    // supabase/functions/register-payout-method). It:
    //   1) creates/reuses a RazorpayX Contact for this user,
    //   2) registers the UPI/bank as a Fund Account,
    //   3) runs a name-match validation,
    //   4) inserts payment_methods with all required NOT NULL columns.
    // Bypassing it with a direct `insert` used to silently fail whenever
    // an NOT NULL column (like validation_status) or an RLS check was
    // missing — the user saw a no-op button.
    const payload =
      type === 'upi'
        ? {type: 'upi', upi_id: trimmedUpi, label: 'UPI'}
        : {
            type: 'bank',
            bank_name: bankName.trim(),
            account_number: accountNumber.trim(),
            ifsc: ifsc.trim().toUpperCase(),
            account_holder_name: holderName.trim(),
            label: 'Bank Account',
          };
    try {
      await invokeFn('register-payout-method', payload);
      reset();
      onSaved();
    } catch (e: any) {
      setError(
        e?.message ||
          'Could not save this payment method. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/40 justify-end">
        <View
          className="bg-white"
          style={{
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '85%',
          }}>
          <View
            className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100"
            style={{gap: 12}}>
            <Text className="text-base font-black text-gray-900">
              Add Payment Method
            </Text>
            <Pressable
              onPress={() => {
                reset();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
              <X size={16} color="#9CA3AF" />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{padding: 24, gap: 20}}
            keyboardShouldPersistTaps="handled">
            <View className="flex-row" style={{gap: 12}}>
              {[
                {key: 'upi' as const, label: 'UPI', icon: Smartphone},
                {key: 'bank' as const, label: 'Bank Account', icon: Building2},
              ].map(opt => {
                const Icon = opt.icon;
                const active = type === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setType(opt.key)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      gap: 8,
                      padding: 20,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: active ? '#9810FA' : '#F3F4F6',
                      backgroundColor: active ? '#FAF5FF' : '#fff',
                    }}>
                    <Icon size={24} color={active ? '#7C3AED' : '#9CA3AF'} />
                    <Text
                      className="font-black"
                      style={{fontSize: 12, color: active ? '#7C3AED' : '#9CA3AF'}}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {type === 'upi' ? (
              <View style={{gap: 8}}>
                <Text
                  className="font-black text-gray-400 uppercase ml-1"
                  style={{fontSize: 10}}>
                  UPI ID
                </Text>
                <TextInput
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="yourname@upi"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    padding: 16,
                    backgroundColor: '#F9FAFB',
                    borderWidth: 1,
                    borderColor: '#F3F4F6',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#374151',
                  }}
                />
                <Text
                  className="font-bold text-gray-400"
                  style={{fontSize: 10}}>
                  Enter your UPI ID linked to Google Pay, PhonePe, Paytm, etc.
                </Text>
              </View>
            ) : (
              <View style={{gap: 16}}>
                {(
                  [
                    {label: 'Account Holder Name', value: holderName, set: setHolderName, ph: 'Full name as per bank', auto: 'words' as const},
                    {label: 'Bank Name', value: bankName, set: setBankName, ph: 'e.g. HDFC Bank', auto: 'words' as const},
                    {label: 'Account Number', value: accountNumber, set: (v: string) => setAccountNumber(v.replace(/\D/g, '').slice(0, 20)), ph: 'Enter account number', auto: 'none' as const, keyboard: 'numeric' as const},
                    {label: 'IFSC Code', value: ifsc, set: (v: string) => setIfsc(v.toUpperCase().slice(0, 11)), ph: 'e.g. HDFC0001234', auto: 'characters' as const},
                  ] as const
                ).map(f => (
                  <View key={f.label} style={{gap: 8}}>
                    <Text
                      className="font-black text-gray-400 uppercase ml-1"
                      style={{fontSize: 10}}>
                      {f.label}
                    </Text>
                    <TextInput
                      value={f.value}
                      onChangeText={f.set}
                      placeholder={f.ph}
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize={f.auto}
                      keyboardType={(f as any).keyboard || 'default'}
                      style={{
                        padding: 16,
                        backgroundColor: '#F9FAFB',
                        borderWidth: 1,
                        borderColor: '#F3F4F6',
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: '700',
                        color: '#374151',
                      }}
                    />
                  </View>
                ))}
              </View>
            )}

            {error ? (
              <Text className="text-xs font-bold" style={{color: '#E11D48'}}>
                {error}
              </Text>
            ) : null}
          </ScrollView>

          <View
            className="flex-row border-t border-gray-100 px-6 py-4 bg-white"
            style={{gap: 12}}>
            <TouchableOpacity
              onPress={() => {
                reset();
                onClose();
              }}
              disabled={saving}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text className="font-black text-sm text-gray-600">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={saving}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                overflow: 'hidden',
                opacity: saving ? 0.6 : 1,
              }}>
              <LinearGradient
                colors={['#9810FA', '#E60076']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}>
                {saving ? <Loader size={14} color="#fff" /> : null}
                <Text className="text-white font-black text-sm">
                  {saving ? 'Saving…' : 'Add Method'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
