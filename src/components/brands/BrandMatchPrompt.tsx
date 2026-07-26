// Brand-home AI matcher (mobile). Web parity:
// src/components/brands/BrandMatchPrompt.jsx. Reuses the public `landing-match`
// edge fn (which relaxes its rate limit for authenticated callers) to turn a
// free-text brief into real creators, then lets the brand shortlist + invite.

import React, {useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import {Check, Search, Send, Sparkles, Users} from 'lucide-react-native';
import {invokeFn} from '../../lib/api';
import {useAuth} from '../../context/AuthContext';
import CampaignPickerModal from './CampaignPickerModal';

type MatchRow = {
  id: string;
  name?: string;
  handle?: string;
  category?: string;
  city?: string;
  photo?: string;
  followers?: number;
  fit?: number;
};

function fmt(n?: number) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return Math.round(num / 1_000) + 'K';
  return String(num);
}

const CHIPS = [
  'Beauty creators in Mumbai, 50K+',
  'Tech reviewers for an unboxing',
  'Fitness micro-creators for barter',
];

export default function BrandMatchPrompt() {
  const {user} = useAuth();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchRow[]>([]);
  const [summary, setSummary] = useState('');
  const [shortlist, setShortlist] = useState<Record<string, boolean>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const run = async () => {
    const text = prompt.trim();
    if (!text || loading) return;
    setLoading(true);
    setError('');
    try {
      const data = await invokeFn<{influencers?: MatchRow[]; summary?: string; error?: string}>(
        'landing-match',
        {prompt: text},
      );
      setResults(Array.isArray(data?.influencers) ? data.influencers : []);
      setSummary(data?.summary || '');
      setShortlist({});
    } catch (err: any) {
      const code = err?.data?.error;
      setError(
        code === 'rate_limited'
          ? "You've hit the search limit for now. Try again later."
          : 'Couldn’t run the match right now. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => setShortlist(prev => ({...prev, [id]: !prev[id]}));
  const invitableIds = Object.keys(shortlist).filter(
    id => shortlist[id] && !String(id).startsWith('inv_'),
  );
  const shortlistCount = Object.values(shortlist).filter(Boolean).length;

  return (
    <View className="w-full">
      <View className="rounded-3xl border border-indigo-100 bg-indigo-50/40 p-4">
        <View className="flex-row items-center mb-2" style={{gap: 6}}>
          <Sparkles size={15} color="#5851DB" />
          <Text className="text-[11px] font-extrabold tracking-widest text-[#5851DB]">
            AI MATCHING ENGINE
          </Text>
        </View>
        <Text className="text-lg font-extrabold text-gray-900">Describe your ideal creator</Text>
        <Text className="text-[12px] text-gray-500 mt-1">
          Tell us what you need and we&apos;ll surface real creators you can invite.
        </Text>

        <View className="flex-row items-center bg-white rounded-xl border border-gray-200 px-3 mt-4">
          <Search size={16} color="#9ca3af" />
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            onSubmitEditing={run}
            placeholder="e.g. beauty creators in Mumbai…"
            placeholderTextColor="#9ca3af"
            className="flex-1 ml-2 text-sm text-gray-800 py-3"
          />
        </View>
        <Pressable
          onPress={run}
          disabled={loading || !prompt.trim()}
          className="mt-2 flex-row items-center justify-center rounded-xl bg-[#5851DB] py-3"
          style={{gap: 8, opacity: loading || !prompt.trim() ? 0.5 : 1}}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Sparkles size={16} color="white" />
          )}
          <Text className="text-white text-sm font-bold">Find creators</Text>
        </Pressable>

        <View className="flex-row flex-wrap mt-3" style={{gap: 8}}>
          {CHIPS.map(c => (
            <Pressable
              key={c}
              onPress={() => setPrompt(c)}
              className="border border-gray-200 rounded-full px-3 py-1.5">
              <Text className="text-[11px] font-semibold text-gray-600">{c}</Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text className="mt-3 text-[12px] font-semibold text-red-600">{error}</Text> : null}
        {toast ? (
          <Text className="mt-3 text-[12px] font-semibold text-emerald-600">{toast}</Text>
        ) : null}

        {results.length > 0 ? (
          <View className="mt-4" style={{gap: 8}}>
            {summary ? (
              <Text className="text-[12.5px] text-gray-600 font-medium mb-1">{summary}</Text>
            ) : null}
            {results.map(r => {
              const picked = !!shortlist[r.id];
              return (
                <Pressable
                  key={r.id}
                  onPress={() => toggle(r.id)}
                  className={`flex-row items-center p-3 rounded-2xl border ${
                    picked ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white'
                  }`}
                  style={{gap: 12}}>
                  {r.photo ? (
                    <Image source={{uri: r.photo}} className="w-10 h-10 rounded-full bg-gray-200" />
                  ) : (
                    <View className="w-10 h-10 rounded-full bg-purple-500 items-center justify-center">
                      <Text className="text-white font-bold">
                        {(r.name || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={{flex: 1}}>
                    <Text className="text-[13px] font-bold text-gray-900" numberOfLines={1}>
                      {r.name}
                    </Text>
                    <Text className="text-[11px] text-gray-500" numberOfLines={1}>
                      {[r.category, `${fmt(r.followers)} followers`].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-full items-center justify-center border ${
                      picked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                    }`}>
                    {picked ? (
                      <Check size={13} color="white" />
                    ) : (
                      <Text className="text-gray-400 text-[13px]">+</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}

            {shortlistCount > 0 ? (
              <View
                className="mt-1 flex-row items-center bg-[#5851DB] rounded-2xl px-4 py-3"
                style={{gap: 8}}>
                <Users size={15} color="white" />
                <Text className="text-white text-[13px] font-bold" style={{flex: 1}}>
                  {shortlistCount} shortlisted
                  {invitableIds.length < shortlistCount
                    ? ` · ${invitableIds.length} invitable`
                    : ''}
                </Text>
                <Pressable
                  onPress={() => setPickerOpen(true)}
                  disabled={invitableIds.length === 0}
                  className="bg-white rounded-full px-4 py-2 flex-row items-center"
                  style={{gap: 6, opacity: invitableIds.length === 0 ? 0.6 : 1}}>
                  <Send size={13} color="#5851DB" />
                  <Text className="text-[#5851DB] text-[12px] font-extrabold">
                    Invite to campaign
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <CampaignPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        brandId={user?.id}
        influencerIds={invitableIds}
        onDone={result => {
          const invited = result?.invited || 0;
          setToast(`Invited ${invited} creator${invited === 1 ? '' : 's'} to your campaign.`);
          setShortlist({});
          setTimeout(() => setToast(''), 4000);
        }}
      />
    </View>
  );
}
