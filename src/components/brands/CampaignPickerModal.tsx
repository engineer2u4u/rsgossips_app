// Shared "invite selected creators to a campaign" modal (mobile).
// Web parity: src/components/brands/CampaignPickerModal.jsx. Pass `campaignId`
// to skip the picker (the campaign is already known). Calls brand-campaigns
// `inviteInfluencers` and reports back via onDone(result).

import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {Check, Megaphone, Send, X} from 'lucide-react-native';
import {invokeFn} from '../../lib/api';

type Campaign = {
  id: string;
  title?: string;
  status?: string;
  applicationsTotal?: number;
  bannerImage?: string;
  applicationDeadline?: string;
  endDate?: string;
};

// Invitable if LIVE — active status and not past its end date. A direct brand
// invite is a private channel, not bound by the public application deadline (an
// invited creator can still apply). Ended/completed/paused/draft are excluded.
function isInvitable(c: Campaign) {
  if (c?.status !== 'active') return false;
  if (c.endDate && new Date(c.endDate).getTime() < Date.now()) return false;
  return true;
}

type InviteResult = {
  invited?: number;
  alreadyInvited?: number;
  alreadyResponded?: number;
  skipped?: number;
};

interface Props {
  visible: boolean;
  onClose: () => void;
  brandId?: string;
  influencerIds: string[];
  campaignId?: string | null;
  campaignTitle?: string;
  onDone?: (result: InviteResult) => void;
}

export default function CampaignPickerModal({
  visible,
  onClose,
  brandId,
  influencerIds,
  campaignId = null,
  campaignTitle = '',
  onDone,
}: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<string | null>(campaignId);
  const [sending, setSending] = useState(false);

  const count = influencerIds.length;
  const skipPicker = !!campaignId;

  // Always fetch — even in skip-picker mode (Flow B) — so the pre-bound
  // campaign's real name + banner can be shown.
  useEffect(() => {
    if (!visible) return;
    setPicked(campaignId);
    if (!brandId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await invokeFn<{campaigns?: Campaign[]}>('brand-campaigns', {
          action: 'list',
          brandId,
        });
        if (!cancelled) setCampaigns(data?.campaigns || []);
      } catch {
        if (!cancelled) setCampaigns([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, brandId, campaignId]);

  const invitableCampaigns = campaigns.filter(isInvitable);
  const boundCampaign = campaignId ? campaigns.find(c => c.id === campaignId) : null;

  const send = async () => {
    const target = campaignId || picked;
    if (!target || count === 0) return;
    setSending(true);
    try {
      const data = await invokeFn<InviteResult>('brand-campaigns', {
        action: 'inviteInfluencers',
        brandId,
        campaignId: target,
        influencerIds,
      });
      onDone?.(data || {});
      onClose();
    } catch (err: any) {
      const code = err?.data?.error;
      Alert.alert(
        'Invite',
        code === 'brand_not_verified'
          ? 'Your brand is still under review. You can invite creators once verified.'
          : code === 'campaign_not_active'
            ? 'You can only invite creators to a live (active) campaign.'
            : err?.message || 'Couldn’t send invites. Please try again.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 justify-end bg-black/40">
        <Pressable
          onPress={e => e.stopPropagation?.()}
          className="bg-white rounded-t-3xl"
          style={{maxHeight: '80%'}}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
            <View>
              <Text className="text-sm font-extrabold text-gray-900">Invite to campaign</Text>
              <Text className="text-[11px] text-gray-500 mt-0.5">
                {count} creator{count === 1 ? '' : 's'} selected
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} className="p-1.5 rounded-full">
              <X size={18} color="#6b7280" />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView className="px-4 py-3" style={{maxHeight: 380}}>
            {skipPicker ? (
              <View className="flex-row items-center bg-indigo-50 rounded-2xl p-3" style={{gap: 12}}>
                <View className="w-11 h-11 rounded-xl bg-purple-500 items-center justify-center overflow-hidden">
                  {boundCampaign?.bannerImage ? (
                    <Image
                      source={{uri: boundCampaign.bannerImage}}
                      className="w-full h-full"
                    />
                  ) : (
                    <Megaphone size={16} color="white" />
                  )}
                </View>
                <View style={{flex: 1}}>
                  <Text className="text-[13px] font-bold text-gray-900" numberOfLines={1}>
                    {boundCampaign?.title || campaignTitle || (loading ? 'Loading…' : 'This campaign')}
                  </Text>
                  <Text className="text-[11px] text-gray-500">Selected creators will be invited here.</Text>
                </View>
              </View>
            ) : loading ? (
              <View className="py-10 items-center">
                <ActivityIndicator color="#5851DB" />
              </View>
            ) : invitableCampaigns.length === 0 ? (
              <View className="py-10 items-center px-4">
                <Text className="text-sm font-semibold text-gray-700">No live campaigns</Text>
                <Text className="text-xs text-gray-400 mt-1 text-center">
                  Publish and get a campaign approved (live) before inviting creators to it.
                </Text>
              </View>
            ) : (
              <View style={{gap: 8}}>
                {invitableCampaigns.map(c => {
                  const active = picked === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setPicked(c.id)}
                      className={`flex-row items-center p-3 rounded-2xl border ${
                        active ? 'border-[#5851DB] bg-indigo-50' : 'border-gray-200'
                      }`}
                      style={{gap: 12}}>
                      <View className="w-9 h-9 rounded-xl bg-purple-500 items-center justify-center">
                        <Megaphone size={16} color="white" />
                      </View>
                      <View style={{flex: 1}}>
                        <Text className="text-[13px] font-bold text-gray-900" numberOfLines={1}>
                          {c.title || 'Untitled campaign'}
                        </Text>
                        <Text className="text-[11px] text-gray-500">
                          {c.applicationsTotal || 0} application{(c.applicationsTotal || 0) === 1 ? '' : 's'}
                        </Text>
                      </View>
                      <View
                        className={`w-5 h-5 rounded-full items-center justify-center border ${
                          active ? 'bg-[#5851DB] border-[#5851DB]' : 'border-gray-300'
                        }`}>
                        {active ? <Check size={12} color="white" /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View className="px-5 py-4 border-t border-gray-100">
            <Pressable
              onPress={send}
              disabled={sending || count === 0 || (!campaignId && !picked)}
              className="flex-row items-center justify-center rounded-xl bg-[#5851DB] py-3"
              style={{gap: 8, opacity: sending || count === 0 || (!campaignId && !picked) ? 0.5 : 1}}>
              {sending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Send size={16} color="white" />
              )}
              <Text className="text-white text-sm font-bold">
                {sending ? 'Sending…' : `Send ${count} invite${count === 1 ? '' : 's'}`}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
