import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import {
  ChevronLeft,
  Smartphone,
  Building2,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

interface Props {
  onBack: () => void;
}

const METHODS = [
  {
    id: '1',
    type: 'upi',
    label: 'UPI',
    detail: 'creator@okicici',
    primary: true,
  },
  {
    id: '2',
    type: 'bank',
    label: 'Bank Account',
    detail: 'HDFC ••••4521',
    primary: false,
  },
];

const TRANSACTIONS = [
  {
    id: '1',
    campaign: 'Summer Fashion Campaign',
    brand: 'StyleBrand Co.',
    date: 'Jan 15, 2026',
    amount: '₹25,000',
    status: 'Paid',
    method: 'UPI',
  },
  {
    id: '2',
    campaign: 'Music Festival Promo',
    brand: 'MusicWave Events',
    date: 'Jan 10, 2026',
    amount: '₹30,000',
    status: 'Pending',
    method: 'Bank',
  },
  {
    id: '3',
    campaign: 'Eco Products Launch',
    brand: 'GreenEarth Co.',
    date: 'Dec 20, 2025',
    amount: '₹22,500',
    status: 'Paid',
    method: 'UPI',
  },
];

const STATUS_STYLES: Record<
  string,
  {bg: string; text: string; icon: typeof CheckCircle; color: string}
> = {
  Paid: {bg: 'bg-emerald-50', text: 'text-emerald-600', icon: CheckCircle, color: '#00BA88'},
  Pending: {bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock, color: '#F59E0B'},
  Processing: {bg: 'bg-blue-50', text: 'text-blue-600', icon: AlertCircle, color: '#3B82F6'},
  Failed: {bg: 'bg-red-50', text: 'text-red-600', icon: XCircle, color: '#EF4444'},
};

const TABS = ['All', 'Paid', 'Pending', 'Processing', 'Failed'];

export default function PaymentMethods({onBack}: Props) {
  const [activeTab, setActiveTab] = useState('All');
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [bankForm, setBankForm] = useState({
    name: '',
    bankName: '',
    account: '',
    ifsc: '',
  });

  const filteredTx =
    activeTab === 'All'
      ? TRANSACTIONS
      : TRANSACTIONS.filter(t => t.status === activeTab);

  return (
    <ScrollView className="flex-1 bg-[#F3F4F9]">
      {/* Header */}
      <View className="bg-white px-5 py-4 flex-row items-center border-b border-slate-100" style={{gap: 12}}>
        <Pressable
          onPress={onBack}
          className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center">
          <ChevronLeft size={20} color="#E60076" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-800 flex-1">
          Payment Methods
        </Text>
      </View>

      <View className="px-4 py-6" style={{gap: 20}}>
        {/* Earnings Summary */}
        <View className="flex-row" style={{gap: 8}}>
          <View className="flex-1 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <Text className="text-[10px] font-bold text-emerald-600 uppercase">
              Total Earned
            </Text>
            <Text className="text-2xl font-black text-emerald-700 mt-1">
              ₹77,500
            </Text>
          </View>
          <View className="flex-1 bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <Text className="text-[10px] font-bold text-amber-600 uppercase">
              Pending
            </Text>
            <Text className="text-2xl font-black text-amber-700 mt-1">
              ₹30,000
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-50">
            <Text className="text-sm font-bold text-slate-800">
              Payment Methods
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              className="flex-row items-center"
              style={{gap: 4}}>
              <Plus size={14} color="#9810FA" />
              <Text className="text-xs font-bold text-purple-600">
                Add New
              </Text>
            </TouchableOpacity>
          </View>

          {METHODS.map(method => (
            <View
              key={method.id}
              className="flex-row items-center px-5 py-4 border-b border-slate-50"
              style={{gap: 12}}>
              <View className="w-10 h-10 bg-purple-50 rounded-xl items-center justify-center">
                {method.type === 'upi' ? (
                  <Smartphone size={18} color="#9810FA" />
                ) : (
                  <Building2 size={18} color="#9810FA" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-700">
                  {method.label}
                </Text>
                <Text className="text-xs text-slate-400">{method.detail}</Text>
              </View>
              {method.primary && (
                <View className="bg-purple-100 px-2 py-0.5 rounded-full">
                  <Text className="text-[9px] font-bold text-purple-700">
                    PRIMARY
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Transaction History */}
        <View style={{gap: 12}}>
          <Text className="text-sm font-bold text-slate-800">
            Transaction History
          </Text>

          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{gap: 6}}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full ${
                    activeTab === tab ? 'bg-slate-900' : 'bg-white border border-slate-200'
                  }`}>
                  <Text
                    className={`text-xs font-bold ${
                      activeTab === tab ? 'text-white' : 'text-slate-500'
                    }`}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Transaction Items */}
          {filteredTx.map(tx => {
            const s = STATUS_STYLES[tx.status] || STATUS_STYLES.Paid;
            const StatusIcon = s.icon;
            const isExpanded = expandedTx === tx.id;

            return (
              <TouchableOpacity
                key={tx.id}
                onPress={() =>
                  setExpandedTx(isExpanded ? null : tx.id)
                }
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <View className="flex-row items-center p-4" style={{gap: 12}}>
                  <View className={`w-10 h-10 ${s.bg} rounded-xl items-center justify-center`}>
                    <StatusIcon size={18} color={s.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-800">
                      {tx.campaign}
                    </Text>
                    <Text className="text-[10px] text-slate-400">
                      {tx.brand} · {tx.date}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-black text-emerald-600">
                      {tx.amount}
                    </Text>
                    <View className={`${s.bg} px-2 py-0.5 rounded-full mt-1`}>
                      <Text className={`text-[9px] font-bold ${s.text}`}>
                        {tx.status}
                      </Text>
                    </View>
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={14} color="#94A3B8" />
                  ) : (
                    <ChevronDown size={14} color="#94A3B8" />
                  )}
                </View>

                {isExpanded && (
                  <View className="px-4 pb-4 pt-2 border-t border-slate-50">
                    <View className="flex-row flex-wrap" style={{gap: 8}}>
                      <View className="flex-1 min-w-[45%]">
                        <Text className="text-[9px] text-slate-400 font-bold uppercase">
                          Campaign
                        </Text>
                        <Text className="text-xs font-semibold text-slate-700 mt-0.5">
                          {tx.campaign}
                        </Text>
                      </View>
                      <View className="flex-1 min-w-[45%]">
                        <Text className="text-[9px] text-slate-400 font-bold uppercase">
                          Brand
                        </Text>
                        <Text className="text-xs font-semibold text-slate-700 mt-0.5">
                          {tx.brand}
                        </Text>
                      </View>
                      <View className="flex-1 min-w-[45%]">
                        <Text className="text-[9px] text-slate-400 font-bold uppercase">
                          Payment Method
                        </Text>
                        <Text className="text-xs font-semibold text-slate-700 mt-0.5">
                          {tx.method}
                        </Text>
                      </View>
                      <View className="flex-1 min-w-[45%]">
                        <Text className="text-[9px] text-slate-400 font-bold uppercase">
                          Date
                        </Text>
                        <Text className="text-xs font-semibold text-slate-700 mt-0.5">
                          {tx.date}
                        </Text>
                      </View>
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
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-[32px] p-6" style={{gap: 16}}>
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-slate-800">
                Add Payment Method
              </Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <X size={20} color="#94A3B8" />
              </Pressable>
            </View>

            {/* Type Toggle */}
            <View className="flex-row bg-slate-100 rounded-xl p-1" style={{gap: 4}}>
              <TouchableOpacity
                onPress={() => setAddType('upi')}
                className={`flex-1 py-2.5 rounded-lg items-center ${
                  addType === 'upi' ? 'bg-white shadow-sm' : ''
                }`}>
                <Text
                  className={`text-xs font-bold ${
                    addType === 'upi' ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                  UPI
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAddType('bank')}
                className={`flex-1 py-2.5 rounded-lg items-center ${
                  addType === 'bank' ? 'bg-white shadow-sm' : ''
                }`}>
                <Text
                  className={`text-xs font-bold ${
                    addType === 'bank' ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                  Bank Account
                </Text>
              </TouchableOpacity>
            </View>

            {addType === 'upi' ? (
              <View style={{gap: 4}}>
                <Text className="text-xs font-bold text-slate-500">
                  UPI ID
                </Text>
                <TextInput
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="yourname@bank"
                  className="h-12 bg-slate-50 rounded-xl px-4 text-sm text-slate-700"
                />
              </View>
            ) : (
              <View style={{gap: 12}}>
                {[
                  {label: 'Account Holder Name', key: 'name'},
                  {label: 'Bank Name', key: 'bankName'},
                  {label: 'Account Number', key: 'account'},
                  {label: 'IFSC Code', key: 'ifsc'},
                ].map(field => (
                  <View key={field.key} style={{gap: 4}}>
                    <Text className="text-xs font-bold text-slate-500">
                      {field.label}
                    </Text>
                    <TextInput
                      value={(bankForm as any)[field.key]}
                      onChangeText={v =>
                        setBankForm(prev => ({
                          ...prev,
                          [field.key]: v,
                        }))
                      }
                      className="h-12 bg-slate-50 rounded-xl px-4 text-sm text-slate-700"
                    />
                  </View>
                ))}
              </View>
            )}

            <View className="flex-row" style={{gap: 8}}>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                className="flex-1 h-12 rounded-2xl bg-slate-100 items-center justify-center">
                <Text className="text-sm font-bold text-slate-600">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                className="flex-1">
                <LinearGradient
                  colors={['#9810FA', '#E60076']}
                  style={{borderRadius: 16, height: 48}}
                  className="items-center justify-center">
                  <Text className="text-white font-bold text-sm">
                    Add Method
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
