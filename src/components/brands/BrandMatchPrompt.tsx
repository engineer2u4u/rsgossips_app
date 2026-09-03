// Brand-home AI matcher (mobile). Web parity:
// src/components/brands/BrandMatchPrompt.jsx. Reuses the public `landing-match`
// edge fn (which relaxes its rate limit for authenticated callers) to turn a
// free-text brief into real creators, then lets the brand shortlist + invite.
//
// Visual: the navy "AI Matching Engine" hero from the RGossips Explore redesign
// (see theme/brandHome.ts). The match logic is unchanged — only the shell and
// the results styling were reskinned to the navy + violet→blue language.

import React, {useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Check, Send, Sparkles, Users} from 'lucide-react-native';
import {invokeFn} from '../../lib/api';
import {useAuth} from '../../context/AuthContext';
import CampaignPickerModal from './CampaignPickerModal';
import {
  ANGLE_96,
  ANGLE_120,
  HOME_COLORS,
  NAVY_GRADIENT,
  NAVY_LOCATIONS,
  VIOLET_BLUE,
  VIOLET_BLUE_LOCATIONS,
} from '../../theme/brandHome';

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
  // BVLinearGradient has no Fabric support (RN 0.84 new-arch runs it via the
  // interop layer) and won't stretch to the parent width — it sizes to its
  // content, so the navy card rendered wider than the screen and clipped on
  // the right. Pin the card to an explicit width (screen − 28 for the
  // wrapper's 14px side padding) so its text wraps.
  const {width: winW} = useWindowDimensions();
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
  const canRun = !!prompt.trim() && !loading;

  return (
    <View style={{paddingHorizontal: 14}}>
      {/* Navy AI-matching hero */}
      <LinearGradient
        colors={NAVY_GRADIENT}
        locations={NAVY_LOCATIONS}
        start={ANGLE_120.start}
        end={ANGLE_120.end}
        style={{
          width: winW - 28,
          borderRadius: 22,
          padding: 18,
          overflow: 'hidden',
          shadowColor: '#0E183A',
          shadowOpacity: 0.28,
          shadowRadius: 34,
          shadowOffset: {width: 0, height: 16},
          elevation: 10,
        }}>
        {/* top hairline */}
        <LinearGradient
          colors={VIOLET_BLUE}
          locations={VIOLET_BLUE_LOCATIONS}
          start={ANGLE_96.start}
          end={ANGLE_96.end}
          style={{position: 'absolute', top: 0, left: 0, right: 0, height: 3}}
        />

        {/* badge row */}
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 13}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              paddingHorizontal: 11,
              paddingVertical: 6,
              borderRadius: 99,
              backgroundColor: 'rgba(255,255,255,0.14)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.24)',
            }}>
            <View style={{width: 5, height: 5, borderRadius: 99, backgroundColor: '#A8C4FF'}} />
            <Text style={{fontSize: 9.5, fontWeight: '700', letterSpacing: 1.2, color: '#fff'}}>
              AI MATCHING ENGINE
            </Text>
          </View>
          <View style={{flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.18)'}} />
        </View>

        {/* headline */}
        <Text style={{fontSize: 26, lineHeight: 29, fontWeight: '700', letterSpacing: -0.9, color: '#fff'}}>
          Describe your ideal creator.
        </Text>
        <Text style={{fontSize: 26, lineHeight: 30, fontWeight: '700', letterSpacing: -0.9, color: '#C9BEFB'}}>
          We&apos;ll find the match.
        </Text>
        <Text style={{fontSize: 12, lineHeight: 19, color: 'rgba(255,255,255,0.74)', marginTop: 8}}>
          One line — niche, city, budget. We rank verified creators in minutes.
        </Text>

        {/* brief input */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 14,
            paddingLeft: 12,
            paddingRight: 5,
            paddingVertical: 5,
            borderRadius: 14,
            backgroundColor: 'rgba(255,255,255,0.13)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.26)',
          }}>
          <Sparkles size={15} color="rgba(255,255,255,0.75)" />
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            onSubmitEditing={run}
            placeholder="Serum launch, beauty creators in Mumbai…"
            placeholderTextColor="rgba(255,255,255,0.55)"
            style={{flex: 1, color: '#fff', fontSize: 12.5, paddingVertical: 8}}
          />
          {/* Gradient as an absolute background — BVLinearGradient collapses on
              iOS new-arch when it sizes from padding + children ("Match" was
              clipped to "Mat"). */}
          <Pressable
            onPress={run}
            disabled={!canRun}
            style={{
              opacity: canRun ? 1 : 0.6,
              height: 36,
              borderRadius: 10,
              paddingHorizontal: 16,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
            }}>
            <LinearGradient
              colors={VIOLET_BLUE}
              locations={VIOLET_BLUE_LOCATIONS}
              start={ANGLE_96.start}
              end={ANGLE_96.end}
              style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0}}
            />
            {loading ? <ActivityIndicator color="#fff" size="small" /> : null}
            <Text style={{color: '#fff', fontSize: 12, fontWeight: '700'}}>Match</Text>
          </Pressable>
        </View>

        {/* suggestion chips */}
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12}}>
          {CHIPS.map(c => (
            <Pressable
              key={c}
              onPress={() => setPrompt(c)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 99,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
              }}>
              <Text style={{fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.9)'}}>{c}</Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      {error ? (
        <Text style={{marginTop: 12, fontSize: 12, fontWeight: '600', color: '#DC2626'}}>{error}</Text>
      ) : null}
      {toast ? (
        <Text style={{marginTop: 12, fontSize: 12, fontWeight: '600', color: '#059669'}}>{toast}</Text>
      ) : null}

      {/* Ranked results — white cards below the hero */}
      {results.length > 0 ? (
        <View style={{marginTop: 12, gap: 8}}>
          {summary ? (
            <Text style={{fontSize: 12.5, color: HOME_COLORS.muted, fontWeight: '500', marginBottom: 1}}>
              {summary}
            </Text>
          ) : null}
          {results.map(r => {
            const picked = !!shortlist[r.id];
            return (
              <Pressable
                key={r.id}
                onPress={() => toggle(r.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: picked ? '#6EE7B7' : HOME_COLORS.cardBorder,
                  backgroundColor: picked ? '#ECFDF5' : HOME_COLORS.card,
                }}>
                {r.photo ? (
                  <Image source={{uri: r.photo}} style={{width: 44, height: 44, borderRadius: 14, backgroundColor: '#E5E7EB'}} />
                ) : (
                  <LinearGradient
                    colors={['#9B5FC4', '#6A66C9']}
                    style={{width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center'}}>
                    <Text style={{color: '#fff', fontWeight: '700', fontSize: 17}}>
                      {(r.name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
                <View style={{flex: 1, minWidth: 0}}>
                  <Text style={{fontSize: 13, fontWeight: '700', color: HOME_COLORS.ink}} numberOfLines={1}>
                    {r.name}
                  </Text>
                  <Text style={{fontSize: 11, color: HOME_COLORS.muted}} numberOfLines={1}>
                    {[r.category, `${fmt(r.followers)} followers`].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 99,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: picked ? '#10B981' : '#CBD5E1',
                    backgroundColor: picked ? '#10B981' : 'transparent',
                  }}>
                  {picked ? <Check size={13} color="white" /> : <Text style={{color: '#94A3B8', fontSize: 13}}>+</Text>}
                </View>
              </Pressable>
            );
          })}

          {shortlistCount > 0 ? (
            <LinearGradient
              colors={VIOLET_BLUE}
              locations={VIOLET_BLUE_LOCATIONS}
              start={ANGLE_96.start}
              end={ANGLE_96.end}
              style={{marginTop: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12}}>
              <Users size={15} color="white" />
              <Text style={{color: 'white', fontSize: 13, fontWeight: '700', flex: 1}}>
                {shortlistCount} shortlisted
                {invitableIds.length < shortlistCount ? ` · ${invitableIds.length} invitable` : ''}
              </Text>
              <Pressable
                onPress={() => setPickerOpen(true)}
                disabled={invitableIds.length === 0}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 99,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  opacity: invitableIds.length === 0 ? 0.6 : 1,
                }}>
                <Send size={13} color="#6A66C9" />
                <Text style={{color: '#6A66C9', fontSize: 12, fontWeight: '800'}}>Invite to campaign</Text>
              </Pressable>
            </LinearGradient>
          ) : null}
        </View>
      ) : null}

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
