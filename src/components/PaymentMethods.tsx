// Payment Methods (UPI + bank).
//
// Real CRUD against `public.payment_methods` — RLS keys on auth.uid().
// Mirrors web app src/components/PaymentMethods.jsx (web commit 48f1927):
//   - List methods with primary flagged, sorted is_primary DESC
//   - Add modal (UPI = upi_id; bank = holder/bank/account/IFSC)
//   - "Set Primary" inline button (two-step: clear all, then set target)
//   - Delete by id
//   - First method created auto-flags as primary
//
// Transaction history below is left as mock data — the web has no equivalent
// edge function/table for this yet, and the user explicitly told us to
// focus on settings parity, not invent new backends.

import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
  AlertCircle,
  Building2,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock,
  Plus,
  Smartphone,
  Star,
  Trash2,
  X,
  XCircle,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {supabase} from '../utils/supabase';
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
  label?: string | null;
  is_primary: boolean;
  created_at?: string;
};

// Same fake transaction list as before — kept so the screen isn't empty.
// Replace when there's a real edge function / table for transactions.
const TRANSACTIONS = [
  {id: '1', campaign: 'Summer Fashion Campaign', brand: 'StyleBrand Co.', date: 'Jan 15, 2026', amount: '₹25,000', status: 'Paid', method: 'UPI'},
  {id: '2', campaign: 'Music Festival Promo', brand: 'MusicWave Events', date: 'Jan 10, 2026', amount: '₹30,000', status: 'Pending', method: 'Bank'},
  {id: '3', campaign: 'Eco Products Launch', brand: 'GreenEarth Co.', date: 'Dec 20, 2025', amount: '₹22,500', status: 'Paid', method: 'UPI'},
];

const STATUS_STYLES: Record<string, {bg: string; text: string; icon: typeof CheckCircle; color: string}> = {
  Paid: {bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle, color: '#00BA88'},
  Pending: {bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock, color: '#F59E0B'},
  Processing: {bg: 'bg-blue-50', text: 'text-blue-600', icon: AlertCircle, color: '#3B82F6'},
  Failed: {bg: 'bg-red-50', text: 'text-red-600', icon: XCircle, color: '#EF4444'},
};

const TABS = ['All', 'Paid', 'Pending', 'Processing', 'Failed'];

export default function PaymentMethods({onBack}: Props) {
  const {user} = useAuth();
  const {withLoading} = useGlobalLoading();
  const [activeTab, setActiveTab] = useState('All');
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [bankForm, setBankForm] = useState({name: '', bankName: '', account: '', ifsc: ''});
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredTx = activeTab === 'All' ? TRANSACTIONS : TRANSACTIONS.filter(t => t.status === activeTab);

  const fetchMethods = useCallback(async () => {
    if (!user?.id) return;
    setLoadError(null);
    const {data, error} = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', {ascending: false})
      .order('created_at', {ascending: false});
    if (error) {
      console.warn('payment_methods select failed:', error.message);
      setLoadError(error.message);
      setMethods([]);
    } else {
      setMethods((data || []) as PaymentMethod[]);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const resetForm = () => {
    setUpiId('');
    setBankForm({name: '', bankName: '', account: '', ifsc: ''});
    setFormError(null);
    setAddType('upi');
  };

  const handleAdd = async () => {
    if (!user?.id) return;
    setFormError(null);

    let payload: Partial<PaymentMethod> = {
      user_id: user.id,
      type: addType,
      is_primary: methods.length === 0, // first one auto-primary
    };

    if (addType === 'upi') {
      const trimmed = upiId.trim();
      if (!trimmed || !trimmed.includes('@')) {
        setFormError('Enter a valid UPI ID (e.g. you@bank).');
        return;
      }
      payload = {...payload, upi_id: trimmed};
    } else {
      const {name, bankName, account, ifsc} = bankForm;
      if (!name.trim() || !bankName.trim() || !account.trim() || !ifsc.trim()) {
        setFormError('Fill all four bank fields to continue.');
        return;
      }
      payload = {
        ...payload,
        account_holder_name: name.trim(),
        bank_name: bankName.trim(),
        account_number: account.trim(),
        ifsc: ifsc.trim().toUpperCase(),
      };
    }

    setAdding(true);
    const {error} = await supabase.from('payment_methods').insert(payload);
    setAdding(false);

    if (error) {
      setFormError(error.message);
      return;
    }
    setShowAddModal(false);
    resetForm();
    await fetchMethods();
  };

  const handleSetPrimary = async (id: string) => {
    if (!user?.id) return;
    await withLoading(
      (async () => {
        // Two-step matches web: clear-all, then set target. Atomicity is
        // already best-effort there too.
        await supabase
          .from('payment_methods')
          .update({is_primary: false})
          .eq('user_id', user.id);
        await supabase.from('payment_methods').update({is_primary: true}).eq('id', id);
        await fetchMethods();
      })(),
      'Updating primary…',
    );
  };

  const handleDelete = (m: PaymentMethod) => {
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
                await fetchMethods();
              })(),
              'Removing…',
            ),
        },
      ],
    );
  };

  return (
    <ScrollView className="flex-1 bg-[#F3F4F9]">
      {/* Header */}
      <View className="bg-white px-5 py-4 flex-row items-center border-b border-slate-100" style={{gap: 12}}>
        <Pressable
          onPress={onBack}
          className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center">
          <ChevronLeft size={20} color="#E60076" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-800 flex-1">Payment Methods</Text>
      </View>

      <View className="px-4 py-6" style={{gap: 20}}>
        {/* Earnings Summary (static for now) */}
        <View className="flex-row" style={{gap: 8}}>
          <View className="flex-1 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <Text className="text-[10px] font-bold text-emerald-600 uppercase">Total Earned</Text>
            <Text className="text-2xl font-black text-emerald-700 mt-1">₹77,500</Text>
          </View>
          <View className="flex-1 bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <Text className="text-[10px] font-bold text-amber-600 uppercase">Pending</Text>
            <Text className="text-2xl font-black text-amber-700 mt-1">₹30,000</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-50">
            <Text className="text-sm font-bold text-slate-800">Payment Methods</Text>
            <TouchableOpacity onPress={() => setShowAddModal(true)} className="flex-row items-center" style={{gap: 4}}>
              <Plus size={14} color="#9810FA" />
              <Text className="text-xs font-bold text-purple-600">Add New</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#9810FA" />
            </View>
          ) : loadError ? (
            <View className="px-5 py-6">
              <Text className="text-xs text-red-500 text-center">{loadError}</Text>
            </View>
          ) : methods.length === 0 ? (
            <View className="px-5 py-6">
              <Text className="text-sm text-slate-400 text-center">
                No payment methods yet. Add a UPI ID or bank account to get paid.
              </Text>
            </View>
          ) : (
            methods.map(method => {
              const isUpi = method.type === 'upi';
              const detail = isUpi
                ? method.upi_id
                : `${method.bank_name || 'Bank'} ••••${(method.account_number || '').slice(-4)}`;
              return (
                <View
                  key={method.id}
                  className="flex-row items-center px-5 py-4 border-b border-slate-50"
                  style={{gap: 12}}>
                  <View className="w-10 h-10 bg-purple-50 rounded-xl items-center justify-center">
                    {isUpi ? <Smartphone size={18} color="#9810FA" /> : <Building2 size={18} color="#9810FA" />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-slate-700">
                      {isUpi ? 'UPI' : 'Bank Account'}
                    </Text>
                    <Text className="text-xs text-slate-400" numberOfLines={1}>
                      {detail}
                    </Text>
                  </View>

                  {method.is_primary ? (
                    <View className="bg-purple-100 px-2 py-0.5 rounded-full">
                      <Text className="text-[9px] font-bold text-purple-700">PRIMARY</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleSetPrimary(method.id)}
                      className="px-2 py-1 rounded-full"
                      hitSlop={4}>
                      <Star size={16} color="#9810FA" />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity onPress={() => handleDelete(method)} hitSlop={4} className="px-1">
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* Transaction History (mock, see file header) */}
        <View style={{gap: 12}}>
          <Text className="text-sm font-bold text-slate-800">Transaction History</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{gap: 6}}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full ${
                    activeTab === tab ? 'bg-slate-900' : 'bg-white border border-slate-200'
                  }`}>
                  <Text className={`text-xs font-bold ${activeTab === tab ? 'text-white' : 'text-slate-500'}`}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {filteredTx.map(tx => {
            const s = STATUS_STYLES[tx.status] || STATUS_STYLES.Paid;
            const StatusIcon = s.icon;
            const isExpanded = expandedTx === tx.id;
            return (
              <TouchableOpacity
                key={tx.id}
                onPress={() => setExpandedTx(isExpanded ? null : tx.id)}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <View className="flex-row items-center p-4" style={{gap: 12}}>
                  <View className={`w-10 h-10 ${s.bg} rounded-xl items-center justify-center`}>
                    <StatusIcon size={18} color={s.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-800">{tx.campaign}</Text>
                    <Text className="text-[10px] text-slate-400">
                      {tx.brand} · {tx.date}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-black text-emerald-600">{tx.amount}</Text>
                    <View className={`${s.bg} px-2 py-0.5 rounded-full mt-1`}>
                      <Text className={`text-[9px] font-bold ${s.text}`}>{tx.status}</Text>
                    </View>
                  </View>
                  {isExpanded ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
                </View>
                {isExpanded && (
                  <View className="px-4 pb-4 pt-2 border-t border-slate-50">
                    <View className="flex-row flex-wrap" style={{gap: 8}}>
                      {[
                        ['Campaign', tx.campaign],
                        ['Brand', tx.brand],
                        ['Payment Method', tx.method],
                        ['Date', tx.date],
                      ].map(([k, v]) => (
                        <View key={k} className="flex-1 min-w-[45%]">
                          <Text className="text-[9px] text-slate-400 font-bold uppercase">{k}</Text>
                          <Text className="text-xs font-semibold text-slate-700 mt-0.5">{v}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View className="h-20" />

      {/* Add Payment Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-[32px] p-6" style={{gap: 16}}>
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-slate-800">Add Payment Method</Text>
              <Pressable
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}>
                <X size={20} color="#94A3B8" />
              </Pressable>
            </View>

            <View className="flex-row bg-slate-100 rounded-xl p-1" style={{gap: 4}}>
              <TouchableOpacity
                onPress={() => setAddType('upi')}
                className={`flex-1 py-2.5 rounded-lg items-center ${addType === 'upi' ? 'bg-white shadow-sm' : ''}`}>
                <Text className={`text-xs font-bold ${addType === 'upi' ? 'text-slate-800' : 'text-slate-400'}`}>UPI</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAddType('bank')}
                className={`flex-1 py-2.5 rounded-lg items-center ${addType === 'bank' ? 'bg-white shadow-sm' : ''}`}>
                <Text className={`text-xs font-bold ${addType === 'bank' ? 'text-slate-800' : 'text-slate-400'}`}>
                  Bank Account
                </Text>
              </TouchableOpacity>
            </View>

            {addType === 'upi' ? (
              <View style={{gap: 4}}>
                <Text className="text-xs font-bold text-slate-500">UPI ID</Text>
                <TextInput
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="yourname@bank"
                  autoCapitalize="none"
                  className="h-12 bg-slate-50 rounded-xl px-4 text-sm text-slate-700"
                />
              </View>
            ) : (
              <View style={{gap: 12}}>
                {[
                  {label: 'Account Holder Name', key: 'name', auto: 'words' as const},
                  {label: 'Bank Name', key: 'bankName', auto: 'words' as const},
                  {label: 'Account Number', key: 'account', auto: 'none' as const},
                  {label: 'IFSC Code', key: 'ifsc', auto: 'characters' as const},
                ].map(field => (
                  <View key={field.key} style={{gap: 4}}>
                    <Text className="text-xs font-bold text-slate-500">{field.label}</Text>
                    <TextInput
                      value={(bankForm as any)[field.key]}
                      onChangeText={v => setBankForm(prev => ({...prev, [field.key]: v}))}
                      autoCapitalize={field.auto}
                      className="h-12 bg-slate-50 rounded-xl px-4 text-sm text-slate-700"
                    />
                  </View>
                ))}
              </View>
            )}

            {formError ? (
              <Text className="text-xs text-red-500 -mt-2">{formError}</Text>
            ) : null}

            <View className="flex-row" style={{gap: 8}}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 h-12 rounded-2xl bg-slate-100 items-center justify-center">
                <Text className="text-sm font-bold text-slate-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAdd}
                disabled={adding}
                style={{
                  flex: 1,
                  borderRadius: 16,
                  height: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                <LinearGradient
                  colors={['#9810FA', '#E60076']}
                  style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                />
                {adding ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-sm">Add Method</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}
