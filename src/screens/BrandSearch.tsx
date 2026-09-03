// Brand search — real list-influencers data with client-side filter/sort.
//
// Web parity: src/app/brands/search/page.js. The edge function returns every
// influencer (paginated server-side via commit bbb9b6c) and we filter in
// memory because the dataset is small and the filters change interactively.
//
// The matchesFilters predicate is the same one the FilterDrawer uses for its
// live "Apply Filters (N)" counter — keep them in lockstep.

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {ChevronDown, Search, Send, UserPlus, X} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import BrandsLayout from '../layouts/BrandLayout';
import {TrustSection} from '../components/TrustSection';
import {CategoryFilters} from '../components/brands/CategoryFilters';
import {InfluencerCard, type SearchInfluencer} from '../components/brands/InfluencerCard';
import CampaignPickerModal from '../components/brands/CampaignPickerModal';
import {
  CREATOR_TYPE_RANGES,
  EMPTY_FILTERS,
  FilterDrawer,
  FOLLOWER_RANGES,
  type FilterValues,
} from '../components/brands/FilterDrawer';
import {invokeFn} from '../lib/api';
import {useAuth} from '../context/AuthContext';

type SortMode =
  | null
  | 'Followers (High to Low)'
  | 'Followers (Low to High)'
  | 'Alphabetical';

const SORT_OPTIONS: Exclude<SortMode, null>[] = [
  'Followers (High to Low)',
  'Followers (Low to High)',
  'Alphabetical',
];

// Pure predicate. Mirrors src/app/brands/search/page.js `matchesFilters`.
function matchesFilters(inf: SearchInfluencer, f: FilterValues, q: string) {
  if (q) {
    const haystack = `${inf.full_name || ''} ${inf.username || ''} ${
      inf.instagram_handle || ''
    }`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  const cats = f.Categories || [];
  if (cats.length) {
    const infCats = Array.isArray(inf.categories) ? inf.categories : [];
    if (!cats.some(c => infCats.includes(c))) return false;
  }
  const followerBuckets = f['Follower Count'] || [];
  if (followerBuckets.length) {
    const fc = inf.followers_count || 0;
    const ok = followerBuckets.some(b => {
      const [min, max] = FOLLOWER_RANGES[b] || [0, Infinity];
      return fc >= min && fc < max;
    });
    if (!ok) return false;
  }
  const creatorTypes = f['Creator Type'] || [];
  if (creatorTypes.length) {
    const fc = inf.followers_count || 0;
    const ok = creatorTypes.some(t => {
      const [min, max] = CREATOR_TYPE_RANGES[t] || [0, Infinity];
      return fc >= min && fc < max;
    });
    if (!ok) return false;
  }
  const locations = f.Location || [];
  if (locations.length) {
    if (!inf.city || !locations.includes(inf.city)) return false;
  }
  // Content Language — match against the influencer's `languages` array
  // (list-influencers derives it from content_languages). An influencer
  // matches if they create in at least one of the selected languages.
  const languages = f['Content Language'] || [];
  if (languages.length) {
    const infLangs = Array.isArray(inf.languages) ? inf.languages : [];
    if (!languages.some(l => infLangs.includes(l))) return false;
  }
  return true;
}

export default function BrandSearch({route}: any) {
  const {t} = useTranslation();
  const {user} = useAuth();
  // ?inviteCampaignId — arriving via the campaign "Invite creators" flow (Flow B).
  const inviteCampaignId: string | null = route?.params?.inviteCampaignId || null;
  const [influencers, setInfluencers] = useState<SearchInfluencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortMode>(null);
  const [sortOpen, setSortOpen] = useState(false);

  // ── Selection / invite ──
  const [selectMode, setSelectMode] = useState<boolean>(!!inviteCampaignId);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);

  const toggleSelect = (id: string) =>
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const quickInvite = (id: string) => {
    setSelectMode(true);
    setSelected(new Set([id]));
  };
  const exitSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };
  const onInviteDone = (r: any) => {
    const invited = r?.invited || 0;
    const already = (r?.alreadyInvited || 0) + (r?.alreadyResponded || 0);
    Alert.alert(
      'Invites sent',
      `Invited ${invited} creator${invited === 1 ? '' : 's'}.` +
        (already ? ` ${already} already invited/applied.` : ''),
    );
    setSelected(new Set());
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await invokeFn<{influencers?: SearchInfluencer[]}>(
          'list-influencers',
          {},
        );
        if (cancelled) return;
        setInfluencers(data?.influencers || []);
      } catch (err: any) {
        if (cancelled) return;
        console.warn('list-influencers failed:', err);
        setError(err?.message || t('ScreensBrandSearch.loadError'));
        setInfluencers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    let list = influencers.filter(inf => matchesFilters(inf, filters, q));
    if (sort === 'Followers (High to Low)') {
      list = [...list].sort(
        (a, b) => (b.followers_count || 0) - (a.followers_count || 0),
      );
    } else if (sort === 'Followers (Low to High)') {
      // True low-to-high; only un-enriched invitation stubs (inv_* ids) sink to
      // the bottom, a registered 0-follower creator sorts at the top.
      const key = (r: SearchInfluencer) => {
        const n = r.followers_count || 0;
        if (n > 0) return n;
        return String(r.influencer_id || '').startsWith('inv_')
          ? Number.POSITIVE_INFINITY
          : 0;
      };
      list = [...list].sort((a, b) => key(a) - key(b));
    } else if (sort === 'Alphabetical') {
      list = [...list].sort((a, b) =>
        (a.full_name || a.username || '').localeCompare(
          b.full_name || b.username || '',
        ),
      );
    }
    return list;
  }, [influencers, filters, searchText, sort]);

  const countForDraft = useCallback(
    (draft: FilterValues) => {
      const q = searchText.trim().toLowerCase();
      return influencers.reduce(
        (n, inf) => (matchesFilters(inf, draft, q) ? n + 1 : n),
        0,
      );
    },
    [influencers, searchText],
  );

  return (
    <BrandsLayout>
      {/* Header */}
      <View className="w-full px-6 pt-12 pb-10 rounded-b-[40px] overflow-hidden">
        <LinearGradient
          colors={['#4C75BE', '#4A3996']}
          style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
        />
        <View className="flex-row justify-between items-start mb-6">
          <View>
            <Text className="text-2xl font-bold text-white">
              {t('ScreensBrandSearch.title')}
            </Text>
            <Text className="text-blue-200 text-xs">
              {t('ScreensBrandSearch.subtitle')}
            </Text>
          </View>
          <View className="flex-row items-center" style={{gap: 8}}>
            <Pressable
              onPress={() => (selectMode ? exitSelect() : setSelectMode(true))}
              className="px-3 py-2 bg-white/15 rounded-lg flex-row items-center"
              style={{gap: 6}}>
              <UserPlus size={16} color="white" />
              <Text className="text-white text-[12px] font-bold">
                {selectMode ? 'Done' : 'Select'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3.5 shadow-xl">
          <Search size={20} color="#d1d5db" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={t('ScreensBrandSearch.searchPlaceholder')}
            placeholderTextColor="#d1d5db"
            autoCapitalize="none"
            className="flex-1 ml-2 text-sm text-gray-800"
          />
        </View>
      </View>

      {/* Trust card — hide TrustSection's decorative search bar here; this
          screen already has the real username search in its header above. */}
      <View className="pt-4">
        <TrustSection showSearch={false} />
      </View>

      {/* Category quick filters (toggles Categories[] in filter state) */}
      <CategoryFilters
        value={filters.Categories || []}
        onChange={cats => setFilters(prev => ({...prev, Categories: cats}))}
      />

      {/* Filter row */}
      <View
        className="mb-4 px-4 flex-row items-center"
        style={{gap: 8, flexWrap: 'wrap'}}>
        <FilterDrawer
          filters={filters}
          onApply={setFilters}
          onClear={() => setFilters(EMPTY_FILTERS)}
          countForDraft={countForDraft}
        />

        {/* Sort dropdown — inline popover-ish */}
        <View>
          <Pressable
            onPress={() => setSortOpen(o => !o)}
            className={`flex-row items-center border rounded-full ${
              sort
                ? 'border-[#5851DB] bg-purple-50'
                : 'border-gray-200 bg-white'
            }`}
            style={{paddingHorizontal: 12, paddingVertical: 6, gap: 6}}>
            <Text
              className={`text-[11px] font-semibold ${
                sort ? 'text-[#5851DB]' : 'text-gray-700'
              }`}>
              {sort
                ? t(`ScreensBrandSearch.sortOptions.${sort}`)
                : t('ScreensBrandSearch.sortBy')}
            </Text>
            <ChevronDown
              size={12}
              color={sort ? '#5851DB' : '#374151'}
            />
          </Pressable>
          {sortOpen ? (
            <View
              className="absolute mt-9 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
              style={{
                top: 0,
                zIndex: 50,
                minWidth: 220,
              }}>
              {SORT_OPTIONS.map(opt => {
                const active = sort === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      setSort(active ? null : opt);
                      setSortOpen(false);
                    }}
                    className={`px-4 py-3 ${active ? 'bg-purple-50' : 'bg-white'}`}>
                    <Text
                      className={`text-[12px] ${
                        active ? 'text-[#5851DB] font-bold' : 'text-gray-700'
                      }`}>
                      {t(`ScreensBrandSearch.sortOptions.${opt}`)}
                    </Text>
                  </Pressable>
                );
              })}
              {sort ? (
                <Pressable
                  onPress={() => {
                    setSort(null);
                    setSortOpen(false);
                  }}
                  className="px-4 py-3 border-t border-gray-100">
                  <Text className="text-[12px] text-red-500 font-bold">
                    {t('ScreensBrandSearch.clearSort')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={{flex: 1, alignItems: 'flex-end'}}>
          <Text className="text-[11px] text-gray-400 font-semibold">
            {loading
              ? '…'
              : t('ScreensBrandSearch.resultCount', {count: filtered.length})}
          </Text>
        </View>
      </View>

      {/* Invite action bar — shown while selecting. */}
      {selectMode && selected.size > 0 ? (
        <View
          className="mx-4 mb-3 flex-row items-center bg-[#5851DB] rounded-2xl px-4 py-3"
          style={{gap: 8}}>
          <Pressable onPress={exitSelect} hitSlop={8}>
            <X size={16} color="white" />
          </Pressable>
          <Text className="text-white text-[13px] font-bold" style={{flex: 1}}>
            {selected.size} selected
          </Text>
          <Pressable
            onPress={() => setPickerOpen(true)}
            className="bg-white rounded-full px-4 py-2 flex-row items-center"
            style={{gap: 6}}>
            <Send size={13} color="#5851DB" />
            <Text className="text-[#5851DB] text-[12px] font-extrabold">
              Invite to campaign
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* List */}
      <View className="bg-white">
        {loading ? (
          <View className="py-20 items-center">
            <ActivityIndicator color="#5851DB" />
          </View>
        ) : error ? (
          <View className="px-6 py-12 items-center" style={{gap: 6}}>
            <Text className="text-sm font-semibold text-red-600">
              {error}
            </Text>
            <Text className="text-xs text-gray-400">
              {t('ScreensBrandSearch.errorHint')}
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View className="px-6 py-12 items-center" style={{gap: 6}}>
            <Text className="text-sm font-semibold text-gray-700">
              {t('ScreensBrandSearch.noMatchTitle')}
            </Text>
            <Text className="text-xs text-gray-400 text-center">
              {t('ScreensBrandSearch.noMatchHint')}
            </Text>
          </View>
        ) : (
          filtered.map(inf => (
            <InfluencerCard
              key={inf.influencer_id}
              influencer={inf}
              selectable={selectMode}
              selected={selected.has(inf.influencer_id)}
              onToggleSelect={() => toggleSelect(inf.influencer_id)}
              onQuickInvite={() => quickInvite(inf.influencer_id)}
            />
          ))
        )}
      </View>

      <CampaignPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        brandId={user?.id}
        influencerIds={[...selected]}
        campaignId={inviteCampaignId}
        onDone={onInviteDone}
      />
    </BrandsLayout>
  );
}
