// Brand transactions & receipts — every escrow payment the brand made,
// with summary tiles (total spent / in escrow / released) and a receipt
// detail modal per row.
//
// Web parity: src/app/brands/transactions/page.js. Data comes from the
// `brand-campaigns` edge function, action:"transactions" (escrow facts
// live on campaign_applications). Mobile swaps window.print() for a
// react-native Share text summary.

import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {
  CheckCircle2,
  ChevronLeft,
  IndianRupee,
  Lock,
  Receipt,
  Share2,
  X,
} from 'lucide-react-native';
import BrandsLayout from '../layouts/BrandLayout';
import {useAuth} from '../context/AuthContext';
import {invokeFn} from '../lib/api';

interface Transaction {
  id: string;
  campaignId: string;
  campaignTitle: string;
  influencerName: string;
  amountPaise: number;
  orderId: string;
  paymentId: string | null;
  escrowStatus: string | null;
  refunded: boolean;
  fundedAt: string | null;
  releasedAt: string | null;
  applicationStatus: string;
}

const fmtINR = (paise: number) =>
  `₹${(Math.round(paise || 0) / 100).toLocaleString('en-IN')}`;

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

// held → money parked; released_pending / released → paid out to creator;
// refunded overrides everything. Same predicate as the web page.
type StatusKey = 'refunded' | 'inEscrow' | 'released' | 'processing';
const statusKey = (tx: Transaction): StatusKey => {
  if (tx.refunded) return 'refunded';
  if (tx.escrowStatus === 'held') return 'inEscrow';
  if ((tx.escrowStatus || '').startsWith('released')) return 'released';
  return 'processing';
};

const STATUS_STYLES: Record<StatusKey, {bg: string; fg: string}> = {
  inEscrow: {bg: '#eef2ff', fg: '#4f46e5'},
  released: {bg: '#ecfdf5', fg: '#059669'},
  refunded: {bg: '#fffbeb', fg: '#d97706'},
  processing: {bg: '#f3f4f6', fg: '#6b7280'},
};

export default function BrandTransactions() {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const {user, profile} = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<Transaction | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      let cancelled = false;
      (async () => {
        setLoading(true);
        try {
          const data = await invokeFn('brand-campaigns', {
            action: 'transactions',
            brandId: user.id,
          });
          if (cancelled) return;
          setTransactions(
            Array.isArray(data?.transactions) ? data.transactions : [],
          );
        } catch (e) {
          if (!cancelled) setTransactions([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [user?.id]),
  );

  const totals = useMemo(() => {
    let held = 0;
    let released = 0;
    let all = 0;
    for (const tx of transactions) {
      const k = statusKey(tx);
      if (k === 'inEscrow') held += tx.amountPaise;
      if (k === 'released') released += tx.amountPaise;
      all += tx.amountPaise;
    }
    return {held, released, all};
  }, [transactions]);

  const tiles = [
    {
      label: t('ScreensBrandTransactions.summary.totalSpent'),
      value: fmtINR(totals.all),
      icon: <IndianRupee size={16} color="#5851DB" />,
      bg: '#EBE9FE',
    },
    {
      label: t('ScreensBrandTransactions.summary.inEscrow'),
      value: fmtINR(totals.held),
      icon: <Lock size={16} color="#4f46e5" />,
      bg: '#eef2ff',
    },
    {
      label: t('ScreensBrandTransactions.summary.released'),
      value: fmtINR(totals.released),
      icon: <CheckCircle2 size={16} color="#059669" />,
      bg: '#ecfdf5',
    },
  ];

  return (
    <BrandsLayout>
      {/* Header */}
      <View className="bg-white px-5 py-5 flex-row items-center shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-[#EBE9FE] items-center justify-center">
          <ChevronLeft size={24} color="#5851DB" />
        </Pressable>
        <View className="flex-1 ml-4">
          <Text className="text-xl font-bold text-slate-800">
            {t('ScreensBrandTransactions.title')}
          </Text>
          <Text className="text-[11px] text-slate-400 font-semibold mt-0.5">
            {t('ScreensBrandTransactions.subtitle')}
          </Text>
        </View>
      </View>

      <View className="px-5 pt-5" style={{gap: 16, paddingBottom: 32}}>
        {/* Summary tiles */}
        <View style={{flexDirection: 'row', gap: 10}}>
          {tiles.map(tile => (
            <View
              key={tile.label}
              className="flex-1 bg-white rounded-3xl p-4 border border-gray-100/50">
              <View
                style={[st.tileIcon, {backgroundColor: tile.bg}]}>
                {tile.icon}
              </View>
              <Text
                className="text-sm font-extrabold text-gray-900"
                numberOfLines={1}>
                {tile.value}
              </Text>
              <Text className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                {tile.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Transactions list */}
        <View className="bg-white rounded-3xl border border-gray-100/50 overflow-hidden">
          <View className="px-5 py-4 border-b border-gray-50">
            <Text className="text-sm font-extrabold text-gray-900">
              {t('ScreensBrandTransactions.listTitle')}
            </Text>
          </View>

          {loading ? (
            <View className="items-center justify-center py-16">
              <ActivityIndicator size="small" color="#5851DB" />
            </View>
          ) : transactions.length === 0 ? (
            <View className="items-center py-14 px-6">
              <Receipt size={28} color="#d1d5db" />
              <Text className="text-sm font-bold text-gray-500 mt-3">
                {t('ScreensBrandTransactions.empty.title')}
              </Text>
              <Text className="text-xs text-gray-400 mt-1 text-center">
                {t('ScreensBrandTransactions.empty.body')}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('BrandCampaigns' as never)}
                className="mt-4 px-5 py-2.5 rounded-full bg-[#5851DB]">
                <Text className="text-xs font-extrabold text-white">
                  {t('ScreensBrandTransactions.empty.cta')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            transactions.map((tx, i) => {
              const k = statusKey(tx);
              const chip = STATUS_STYLES[k];
              return (
                <TouchableOpacity
                  key={tx.id}
                  onPress={() => setReceipt(tx)}
                  activeOpacity={0.7}
                  className={`px-5 py-4 ${
                    i < transactions.length - 1
                      ? 'border-b border-gray-50'
                      : ''
                  }`}>
                  <View className="flex-row items-center" style={{gap: 10}}>
                    <View className="flex-1" style={{minWidth: 0}}>
                      <Text
                        className="text-[13px] font-bold text-gray-900"
                        numberOfLines={1}>
                        {tx.campaignTitle ||
                          t('ScreensBrandTransactions.row.campaignFallback')}
                      </Text>
                      <Text className="text-[11px] text-gray-400 font-semibold mt-0.5">
                        {t('ScreensBrandTransactions.row.toCreator', {
                          name: tx.influencerName,
                        })}{' '}
                        · {fmtDate(tx.fundedAt)}
                      </Text>
                      <Text
                        className="text-[10px] text-gray-300 mt-0.5"
                        numberOfLines={1}>
                        {tx.orderId}
                      </Text>
                    </View>
                    <View className="items-end" style={{gap: 6}}>
                      <Text className="text-[13px] font-extrabold text-gray-900">
                        {fmtINR(tx.amountPaise)}
                      </Text>
                      <View
                        style={[st.chip, {backgroundColor: chip.bg}]}>
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: '800',
                            color: chip.fg,
                          }}>
                          {t(`ScreensBrandTransactions.status.${k}`)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>

      <ReceiptModal
        tx={receipt}
        profile={profile}
        onClose={() => setReceipt(null)}
      />
    </BrandsLayout>
  );
}

// Receipt detail — the mobile stand-in for the web's printable receipt:
// same fields, with a Share button that sends a text summary.
function ReceiptModal({
  tx,
  profile,
  onClose,
}: {
  tx: Transaction | null;
  profile: any;
  onClose: () => void;
}) {
  const {t} = useTranslation();
  if (!tx) {
    return null;
  }
  const k = statusKey(tx);
  const chip = STATUS_STYLES[k];
  const billedTo =
    profile?.gstin_legal_name || profile?.brand_name || '—';

  const handleShare = () => {
    const lines = [
      t('ScreensBrandTransactions.receipt.shareTitle'),
      '',
      `${t('ScreensBrandTransactions.receipt.receiptNo')}: ${String(tx.id)
        .slice(0, 8)
        .toUpperCase()}`,
      `${t('ScreensBrandTransactions.receipt.date')}: ${fmtDate(tx.fundedAt)}`,
      `${t('ScreensBrandTransactions.receipt.billedTo')}: ${billedTo}`,
      `${t('ScreensBrandTransactions.receipt.campaign')}: ${
        tx.campaignTitle ||
        t('ScreensBrandTransactions.row.campaignFallback')
      }`,
      t('ScreensBrandTransactions.row.toCreator', {name: tx.influencerName}),
      `${t('ScreensBrandTransactions.receipt.paymentRefs')}: ${tx.orderId}${
        tx.paymentId ? ` / ${tx.paymentId}` : ''
      }`,
      `${t('ScreensBrandTransactions.receipt.statusLabel')}: ${t(
        `ScreensBrandTransactions.status.${k}`,
      )}`,
      `${t('ScreensBrandTransactions.receipt.total')}: ${fmtINR(
        tx.amountPaise,
      )}`,
      '',
      'RGossips · RUDE LABS PVT. LTD. · rgossips.com',
    ];
    Share.share({message: lines.join('\n')});
  };

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={st.scrim}>
        <View style={st.sheet}>
          {/* Header */}
          <View style={st.sheetHeader}>
            <Text className="text-sm font-extrabold text-gray-900">
              {t('ScreensBrandTransactions.receipt.title')}
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <TouchableOpacity onPress={handleShare} style={st.shareBtn}>
                <Share2 size={13} color="white" />
                <Text style={{color: 'white', fontSize: 11, fontWeight: '700'}}>
                  {t('ScreensBrandTransactions.receipt.share')}
                </Text>
              </TouchableOpacity>
              <Pressable onPress={onClose} hitSlop={8} style={{padding: 4}}>
                <X size={18} color="#94a3b8" />
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={{padding: 22, gap: 18}}>
            {/* Issuer + receipt no */}
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-base font-extrabold text-gray-900">
                  RGossips
                </Text>
                <Text className="text-[11px] text-gray-500 font-semibold">
                  RUDE LABS PVT. LTD.
                </Text>
                <Text className="text-[10px] text-gray-400">
                  rgossips.com · grievance@rgossips.com
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                  {t('ScreensBrandTransactions.receipt.receiptNo')}
                </Text>
                <Text className="text-[11px] font-bold text-gray-700">
                  {String(tx.id).slice(0, 8).toUpperCase()}
                </Text>
                <Text className="text-[10px] text-gray-400 mt-1">
                  {fmtDate(tx.fundedAt)}
                </Text>
              </View>
            </View>

            {/* Billed to + payment refs */}
            <View className="border-t border-b border-gray-100 py-4" style={{gap: 12}}>
              <View>
                <Text className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
                  {t('ScreensBrandTransactions.receipt.billedTo')}
                </Text>
                <Text className="text-xs font-bold text-gray-900">
                  {billedTo}
                </Text>
                {profile?.gstin ? (
                  <Text className="text-[10px] text-gray-500 mt-0.5">
                    GSTIN: {profile.gstin}
                  </Text>
                ) : null}
                {profile?.gstin_address ? (
                  <Text className="text-[10px] text-gray-400 mt-0.5">
                    {profile.gstin_address}
                  </Text>
                ) : null}
              </View>
              <View>
                <Text className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
                  {t('ScreensBrandTransactions.receipt.paymentRefs')}
                </Text>
                <Text className="text-[10px] text-gray-500">{tx.orderId}</Text>
                {tx.paymentId ? (
                  <Text className="text-[10px] text-gray-500 mt-0.5">
                    {tx.paymentId}
                  </Text>
                ) : null}
                <View
                  className="flex-row items-center mt-1.5"
                  style={{gap: 6}}>
                  <Text className="text-[10px] text-gray-400">Razorpay</Text>
                  <View style={[st.chip, {backgroundColor: chip.bg}]}>
                    <Text
                      style={{fontSize: 9, fontWeight: '800', color: chip.fg}}>
                      {t(`ScreensBrandTransactions.status.${k}`)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Line item + total */}
            <View>
              <View className="flex-row justify-between items-start py-2">
                <View className="flex-1 pr-4">
                  <Text className="text-xs font-bold text-gray-900">
                    {t('ScreensBrandTransactions.receipt.lineItem', {
                      campaign:
                        tx.campaignTitle ||
                        t('ScreensBrandTransactions.row.campaignFallback'),
                    })}
                  </Text>
                  <Text className="text-[10px] text-gray-400 mt-0.5">
                    {t('ScreensBrandTransactions.row.toCreator', {
                      name: tx.influencerName,
                    })}
                  </Text>
                </View>
                <Text className="text-sm font-extrabold text-gray-900">
                  {fmtINR(tx.amountPaise)}
                </Text>
              </View>
              <View
                className="flex-row justify-between items-center pt-3 mt-2"
                style={{borderTopWidth: 2, borderTopColor: '#111827'}}>
                <Text className="text-sm font-extrabold text-gray-900">
                  {t('ScreensBrandTransactions.receipt.total')}
                </Text>
                <Text className="text-lg font-extrabold text-gray-900">
                  {fmtINR(tx.amountPaise)}
                </Text>
              </View>
            </View>

            <Text className="text-[9px] text-gray-400 leading-relaxed">
              {t('ScreensBrandTransactions.receipt.note')}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  tileIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#5851DB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
});
