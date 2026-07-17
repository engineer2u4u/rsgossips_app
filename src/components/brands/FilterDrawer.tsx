// Filter drawer for brand search.
//
// Controlled component — the parent owns the applied filter state. The
// drawer takes a working copy on open, lets the user toggle chips with a
// live "Apply Filters (N)" count (web commit 98ecbf4), then either applies
// or discards.
//
// Filter shape matches web (`src/components/brands/FilterDrawer.jsx`):
//   { Categories[], "Follower Count"[], "Creator Type"[], Location[],
//     "Content Language"[] }
// Gender is displayed on web but not yet wired — we skip it here too so we
// don't ship a filter that does nothing. Content Language IS wired (matches
// against each influencer's `languages` array from list-influencers).

import React, {useEffect, useState} from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Check, SlidersHorizontal, X} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {CONTENT_LANGUAGES} from '../../utils/contentLanguages';

export type FilterValues = Record<string, string[]>;

// Web parity: src/components/brands/FilterDrawer.jsx (filterData export).
export const FILTER_DATA: Record<string, string[]> = {
  Categories: [
    'Beauty & Skincare',
    'Fashion & Lifestyle',
    'Food & Beverage',
    'Health, Fitness & Wellness',
    'Travel & Hospitality',
    'Technology & Gadgets',
    'Parenting & Family',
    'Home & Decor',
    'Finance & Personal Finance',
    'Education & Career',
    'Gaming & Entertainment',
    'Automobile & Mobility',
    'Entrepreneurship & Business',
    'Sustainable & Eco-conscious Living',
    'Pet Care & Animals',
  ],
  'Follower Count': ['0 - 10k', '10k - 50k', '50k - 100k', '100k - 500k', '500k - 1M', '1M+'],
  'Creator Type': ['Mega', 'Macro', 'Micro', 'Nano'],
  Location: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Remote'],
  // Language names are proper nouns — rendered verbatim, never translated.
  'Content Language': CONTENT_LANGUAGES,
};

export const FILTER_GROUPS = Object.keys(FILTER_DATA);

export const EMPTY_FILTERS: FilterValues = Object.fromEntries(
  FILTER_GROUPS.map(k => [k, []]),
);

// Web parity: maps used by matchesFilters in src/app/brands/search/page.js.
export const FOLLOWER_RANGES: Record<string, [number, number]> = {
  '0 - 10k': [0, 10_000],
  '10k - 50k': [10_000, 50_000],
  '50k - 100k': [50_000, 100_000],
  '100k - 500k': [100_000, 500_000],
  '500k - 1M': [500_000, 1_000_000],
  '1M+': [1_000_000, Infinity],
};

export const CREATOR_TYPE_RANGES: Record<string, [number, number]> = {
  Nano: [0, 10_000],
  Micro: [10_000, 100_000],
  Macro: [100_000, 1_000_000],
  Mega: [1_000_000, Infinity],
};

interface Props {
  filters: FilterValues;
  onApply: (next: FilterValues) => void;
  onClear: () => void;
  countForDraft: (draft: FilterValues) => number;
}

export function FilterDrawer({filters, onApply, onClear, countForDraft}: Props) {
  const {t} = useTranslation();
  const [visible, setVisible] = useState(false);
  // Draft = working copy while drawer is open; only committed on Apply.
  const [draft, setDraft] = useState<FilterValues>(filters);
  const [activeGroup, setActiveGroup] = useState<string>(FILTER_GROUPS[0]);

  // Resync draft whenever the drawer (re-)opens.
  useEffect(() => {
    if (visible) {
      setDraft(filters);
      setActiveGroup(FILTER_GROUPS[0]);
    }
  }, [visible, filters]);

  const matchCount = countForDraft(draft);
  const totalActive = Object.values(filters).reduce((n, arr) => n + (arr?.length || 0), 0);

  const toggle = (group: string, option: string) =>
    setDraft(prev => {
      const cur = prev[group] || [];
      const next = cur.includes(option)
        ? cur.filter(o => o !== option)
        : [...cur, option];
      return {...prev, [group]: next};
    });

  const clearAll = () => {
    setDraft(EMPTY_FILTERS);
  };

  const apply = () => {
    onApply(draft);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        className={`flex-row items-center border rounded-full ${
          totalActive > 0
            ? 'border-[#5851DB] bg-purple-50'
            : 'border-gray-200 bg-white'
        }`}
        style={{paddingHorizontal: 12, paddingVertical: 6, gap: 6}}>
        <SlidersHorizontal
          size={12}
          color={totalActive > 0 ? '#5851DB' : '#374151'}
        />
        <Text
          className={`text-[11px] font-semibold ${
            totalActive > 0 ? 'text-[#5851DB]' : 'text-gray-700'
          }`}>
          {totalActive > 0
            ? t('BrandsFilterDrawer.filtersWithCount', {count: totalActive})
            : t('BrandsFilterDrawer.filters')}
        </Text>
      </Pressable>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}>
        <View style={s.scrim}>
          <View style={s.sheet}>
            {/* Header */}
            <View style={s.header}>
              <Text style={s.title}>{t('BrandsFilterDrawer.filters')}</Text>
              <Pressable onPress={() => setVisible(false)} hitSlop={8} style={{padding: 4}}>
                <X size={20} color="#374151" />
              </Pressable>
            </View>

            <View style={{flexDirection: 'row', flex: 1, minHeight: 0}}>
              {/* Group sidebar */}
              <ScrollView
                style={s.sidebar}
                contentContainerStyle={{paddingVertical: 8}}>
                {FILTER_GROUPS.map(group => {
                  const active = activeGroup === group;
                  const count = (draft[group] || []).length;
                  return (
                    <Pressable
                      key={group}
                      onPress={() => setActiveGroup(group)}
                      style={[s.groupItem, active && s.groupItemActive]}>
                      <Text
                        style={[
                          s.groupItemText,
                          active && s.groupItemTextActive,
                        ]}>
                        {group}
                      </Text>
                      {count > 0 ? (
                        <View style={s.groupItemBadge}>
                          <Text style={s.groupItemBadgeText}>{count}</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Options for active group */}
              <ScrollView
                style={{flex: 1}}
                contentContainerStyle={{padding: 12, gap: 8}}>
                {(FILTER_DATA[activeGroup] || []).map(option => {
                  const selected = (draft[activeGroup] || []).includes(option);
                  return (
                    <Pressable
                      key={option}
                      onPress={() => toggle(activeGroup, option)}
                      style={[s.optionRow, selected && s.optionRowSelected]}>
                      <Text
                        style={[
                          s.optionText,
                          selected && {color: '#5851DB', fontWeight: '700'},
                        ]}>
                        {option}
                      </Text>
                      <View style={[s.optionCheck, selected && s.optionCheckOn]}>
                        {selected ? <Check size={12} color="white" /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Footer */}
            <View style={s.footer}>
              <Pressable
                onPress={() => {
                  clearAll();
                  onClear();
                }}
                style={[s.footerBtn, s.footerClear]}>
                <Text style={s.footerClearText}>
                  {t('BrandsFilterDrawer.clearAll')}
                </Text>
              </Pressable>
              <Pressable onPress={apply} style={[s.footerBtn, s.footerApply]}>
                <Text style={s.footerApplyText}>
                  {t('BrandsFilterDrawer.applyFilters', {count: matchCount})}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  scrim: {flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'flex-end'},
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    minHeight: '60%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  title: {fontSize: 17, fontWeight: '800', color: '#0f172a'},
  sidebar: {
    width: 140,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#e2e8f0',
    backgroundColor: '#F8F9FE',
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  groupItemActive: {backgroundColor: 'white'},
  groupItemText: {fontSize: 12, fontWeight: '600', color: '#64748b'},
  groupItemTextActive: {color: '#5851DB', fontWeight: '800'},
  groupItemBadge: {
    backgroundColor: '#5851DB',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  groupItemBadgeText: {color: 'white', fontSize: 10, fontWeight: '800'},
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8F9FE',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionRowSelected: {
    backgroundColor: '#EBE9FE',
    borderColor: '#5851DB',
  },
  optionText: {fontSize: 13, color: '#0f172a'},
  optionCheck: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCheckOn: {backgroundColor: '#5851DB', borderColor: '#5851DB'},
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
  },
  footerBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerClear: {borderWidth: 1, borderColor: '#e2e8f0'},
  footerClearText: {color: '#475569', fontWeight: '700', fontSize: 13},
  footerApply: {backgroundColor: '#5851DB'},
  footerApplyText: {color: 'white', fontWeight: '800', fontSize: 13},
});
