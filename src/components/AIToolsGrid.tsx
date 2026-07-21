import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Clipboard,
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
import Animated, {FadeInUp} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';

import {
  Type,
  Hash,
  FileText,
  BarChart3,
  Zap,
  ClipboardCheck,
  Sparkles,
  X,
  Copy,
  Check,
  RotateCw,
} from 'lucide-react-native';
import {CARD_SHADOW} from '../theme/brand';
import {useAuth} from '../context/AuthContext';
import {supabase} from '../utils/supabase';
import {invokeFn} from '../lib/api';
import {useAiTool} from '../hooks/useAiTool';
import {getAiUsageStatus} from '../lib/plans';
import {AiMarkdown, parseAiRates} from './AiMarkdown';

const BRAND_PURPLE = '#9810FA';

interface ToolSpec {
  key: string;
  /** The real `ai-generate` tool id this tile invokes. */
  tool: string;
  icon: React.ComponentType<{size?: number; color?: string}>;
  color: string;
  tint: string; // nativewind classes for the tile background/border
}

// Maps each tile to a real `ai-generate` tool (mirror of the web AiToolsGrid).
const tools: ToolSpec[] = [
  {
    key: 'captions',
    tool: 'caption',
    icon: Type,
    color: '#f97316',
    tint: 'bg-orange-50 border border-orange-100',
  },
  {
    key: 'scripts',
    tool: 'script',
    icon: FileText,
    color: '#f59e0b',
    tint: 'bg-amber-50 border border-amber-100',
  },
  {
    key: 'hookIdeas',
    tool: 'hooks',
    icon: Zap,
    color: '#f43f5e',
    tint: 'bg-rose-50 border border-rose-100',
  },
  {
    key: 'hashtags',
    tool: 'hashtags',
    icon: Hash,
    color: '#3b82f6',
    tint: 'bg-sky-50 border border-sky-100',
  },
  {
    key: 'rateCard',
    tool: 'rate_card',
    icon: BarChart3,
    color: '#10b981',
    tint: 'bg-emerald-50 border border-emerald-100',
  },
  {
    key: 'briefHelper',
    tool: 'brief_checklist',
    icon: ClipboardCheck,
    color: '#6366f1',
    tint: 'bg-indigo-50 border border-indigo-100',
  },
];

export default function AiToolsGrid() {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {user, profile} = useAuth();
  const [open, setOpen] = useState<ToolSpec | null>(null);
  const [usedThisMonth, setUsedThisMonth] = useState(0);

  // Monthly usage for the quota meter; refetch whenever a tool modal closes.
  const fetchUsage = useCallback(async () => {
    if (!user?.id) return;
    const period = new Date().toISOString().slice(0, 7);
    const {data} = await supabase
      .from('ai_generation_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('period', period);
    setUsedThisMonth(
      ((data as {count?: number}[] | null) || []).reduce(
        (s, r) => s + (r.count || 0),
        0,
      ),
    );
  }, [user?.id]);

  useEffect(() => {
    if (!open) fetchUsage();
  }, [fetchUsage, open]);

  const usage = getAiUsageStatus(profile, usedThisMonth);
  const pct =
    usage.unlimited || !usage.limit
      ? 0
      : Math.min(100, Math.round((usage.used / usage.limit) * 100));
  const exhausted = !usage.unlimited && usage.remaining <= 0;

  const goToPricing = () => navigation.navigate('InfluencerPricing' as never);

  return (
    <View className="w-full">
      <View
        style={[
          {
            backgroundColor: '#ffffff',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: 'rgba(25,22,43,0.06)',
            padding: 20,
          },
          CARD_SHADOW,
        ]}>
        {/* HEADER */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <Sparkles size={18} color="#a855f7" />
            <Text className="text-xl font-bold text-slate-900 ml-2">
              {t('AIToolsGrid.header')}
            </Text>
          </View>
          <View className="bg-purple-50 px-2.5 py-1 rounded-full">
            <Text
              className="text-[10px] font-black text-purple-600"
              style={{textTransform: 'capitalize', letterSpacing: 0.8}}>
              {usage.plan}
            </Text>
          </View>
        </View>

        {/* AI usage meter */}
        <View className="mb-5">
          {usage.unlimited ? (
            <View className="flex-row items-center">
              <Sparkles size={13} color="#059669" />
              <Text className="text-xs font-bold text-emerald-600 ml-1.5">
                {t('AIToolsGrid.unlimited')}
              </Text>
            </View>
          ) : (
            <>
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="text-[11px] font-semibold text-slate-500">
                  {t('AIToolsGrid.usageLabel')}
                </Text>
                <Text
                  className={`text-[11px] font-bold ${
                    exhausted ? 'text-rose-500' : 'text-slate-700'
                  }`}>
                  {t('AIToolsGrid.usedOfLimit', {
                    used: usage.used,
                    limit: usage.limit,
                  })}
                </Text>
              </View>
              <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(pct, usage.used > 0 ? 4 : 0)}%`,
                    backgroundColor: exhausted
                      ? '#fb7185'
                      : pct >= 80
                        ? '#fbbf24'
                        : BRAND_PURPLE,
                  }}
                />
              </View>
              {(exhausted || pct >= 80) && (
                <View className="flex-row items-center justify-between mt-1.5">
                  <Text className="text-[10px] text-slate-400 flex-1 mr-2">
                    {exhausted
                      ? t('AIToolsGrid.limitBody')
                      : t('AIToolsGrid.leftThisMonth', {
                          count: usage.remaining,
                        })}
                  </Text>
                  <TouchableOpacity onPress={goToPricing}>
                    <Text
                      className="text-[10px] font-black"
                      style={{color: BRAND_PURPLE}}>
                      {t('AIToolsGrid.upgradeCta')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* GRID */}
        <View className="flex-row flex-wrap justify-between">
          {tools.map((tool, index) => {
            const Icon = tool.icon;

            return (
              <Animated.View
                key={tool.key}
                entering={FadeInUp.delay(index * 80)}
                className="w-[48%] mb-4">
                <Pressable
                  onPress={() => setOpen(tool)}
                  className={`p-5 rounded-3xl items-center ${tool.tint}`}>
                  <View className="p-3 rounded-2xl bg-white shadow-sm mb-3">
                    <Icon size={20} color={tool.color} />
                  </View>

                  <Text className="font-semibold text-slate-800 text-sm">
                    {t(`AIToolsGrid.tools.${tool.key}.title`)}
                  </Text>

                  <Text className="text-[10px] font-bold uppercase mt-1 text-slate-400">
                    {t('AIToolsGrid.generate')}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {open && (
        <ToolModal
          spec={open}
          onClose={() => setOpen(null)}
          onUpgrade={() => {
            setOpen(null);
            goToPricing();
          }}
        />
      )}
    </View>
  );
}

function ToolModal({
  spec,
  onClose,
  onUpgrade,
}: {
  spec: ToolSpec;
  onClose: () => void;
  onUpgrade: () => void;
}) {
  const {t} = useTranslation();
  const {user, profile, refreshProfile} = useAuth();
  const {generate, loading, result, remaining, error, limitReached} =
    useAiTool();
  const [ctx, setCtx] = useState('');
  const [copied, setCopied] = useState(false);
  const [savingRates, setSavingRates] = useState(false);
  const [ratesSaved, setRatesSaved] = useState(false);

  const Icon = spec.icon;

  // Rate card replies end with a machine-readable RATES_JSON line — strip it
  // from the display and surface it as a one-click "Update my pricing" action.
  const isRateCard = spec.key === 'rateCard';
  const {rates: aiRates, cleanText} = isRateCard
    ? parseAiRates(result)
    : {rates: null, cleanText: result || ''};

  const run = () => {
    setRatesSaved(false);
    generate({
      tool: spec.tool,
      inputs: ctx.trim() ? {context: ctx.trim()} : {},
    });
  };

  const copy = () => {
    if (!cleanText) return;
    Clipboard.setString(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const applyRates = async () => {
    if (!aiRates || !user?.id || savingRates) return;
    setSavingRates(true);
    try {
      // Merge over existing rates so services the AI didn't price keep theirs.
      await invokeFn('update-profile', {
        userId: user.id,
        table: 'influencer_profiles',
        serviceRates: {...(profile?.service_rates || {}), ...aiRates},
      });
      setRatesSaved(true);
      await refreshProfile();
    } catch (e) {
      console.error('Failed to apply AI rates:', e);
    } finally {
      setSavingRates(false);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
          <Pressable
            className="bg-white rounded-t-[32px] max-h-[80%]"
            onPress={e => e.stopPropagation()}>
            {/* Header */}
            <View className="flex-row items-center justify-between p-5 border-b border-slate-100">
              <View className="flex-row items-center">
                <Icon size={20} color={spec.color} />
                <Text className="text-base font-black text-slate-900 ml-2.5">
                  {t(`AIToolsGrid.tools.${spec.key}.title`)}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} className="p-2">
                <X size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="p-5"
              // The sheet is capped at max-h-80%; without flexShrink the
              // ScrollView sizes to its content and simply overflows once a
              // generated response lands, so it never scrolls. Shrinking it
              // inside the capped parent is what makes scrolling kick in.
              style={{flexShrink: 1}}
              contentContainerStyle={{paddingBottom: 8}}
              keyboardShouldPersistTaps="handled">
              {limitReached ? (
                <View className="items-center py-6">
                  <Text className="text-sm font-bold text-slate-900 text-center">
                    {t('AIToolsGrid.limitTitle')}
                  </Text>
                  <Text className="text-xs text-slate-500 text-center leading-5 mt-3">
                    {t('AIToolsGrid.limitBody')}
                  </Text>
                  <TouchableOpacity
                    onPress={onUpgrade}
                    className="mt-4 px-6 py-2.5 rounded-full"
                    style={{backgroundColor: BRAND_PURPLE}}>
                    <Text className="text-white text-sm font-black">
                      {t('AIToolsGrid.upgradeCta')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TextInput
                    value={ctx}
                    onChangeText={setCtx}
                    placeholder={t(`AIToolsGrid.placeholders.${spec.key}`)}
                    placeholderTextColor="#94a3b8"
                    multiline
                    textAlignVertical="top"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700"
                    style={{minHeight: 76, maxHeight: 140}}
                  />
                  {!!result && (
                    <View className="rounded-2xl border border-slate-100 bg-slate-50 p-4 mt-4">
                      <AiMarkdown text={cleanText} selectable />
                      {isRateCard && aiRates && (
                        <TouchableOpacity
                          onPress={applyRates}
                          disabled={savingRates || ratesSaved}
                          className={`flex-row items-center justify-center py-2.5 rounded-xl mt-3 ${
                            ratesSaved
                              ? 'bg-emerald-50 border border-emerald-200'
                              : ''
                          }`}
                          style={
                            ratesSaved
                              ? undefined
                              : {backgroundColor: BRAND_PURPLE}
                          }>
                          {savingRates ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : ratesSaved ? (
                            <Check size={15} color="#059669" />
                          ) : (
                            <BarChart3 size={15} color="#ffffff" />
                          )}
                          <Text
                            className={`text-sm font-black ml-2 ${
                              ratesSaved ? 'text-emerald-600' : 'text-white'
                            }`}>
                            {savingRates
                              ? t('AIToolsGrid.updatingPricing')
                              : ratesSaved
                                ? t('AIToolsGrid.pricingUpdated')
                                : t('AIToolsGrid.updatePricing')}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  {!!error && (
                    <Text className="text-xs font-semibold text-red-500 mt-3">
                      {error}
                    </Text>
                  )}
                </>
              )}
            </ScrollView>

            {!limitReached && (
              <View className="p-5 border-t border-slate-100">
                <View className="flex-row items-center">
                  {!!result && (
                    <TouchableOpacity
                      onPress={copy}
                      className="flex-row items-center px-4 py-3 rounded-xl border border-slate-200 mr-3">
                      {copied ? (
                        <Check size={15} color="#10b981" />
                      ) : (
                        <Copy size={15} color="#475569" />
                      )}
                      <Text className="text-sm font-black text-slate-600 ml-1.5">
                        {copied
                          ? t('AIToolsGrid.copied')
                          : t('AIToolsGrid.copy')}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={run}
                    disabled={loading}
                    className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
                    style={{
                      backgroundColor: BRAND_PURPLE,
                      opacity: loading ? 0.6 : 1,
                    }}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : result ? (
                      <RotateCw size={15} color="#ffffff" />
                    ) : (
                      <Sparkles size={15} color="#ffffff" />
                    )}
                    <Text className="text-white text-sm font-black ml-2">
                      {loading
                        ? t('AIToolsGrid.generating')
                        : result
                          ? t('AIToolsGrid.regenerate')
                          : t('AIToolsGrid.generate')}
                    </Text>
                  </TouchableOpacity>
                </View>
                {typeof remaining === 'number' && (
                  <Text className="text-[10px] text-center text-slate-400 mt-2">
                    {t('AIToolsGrid.leftThisMonth', {count: remaining})}
                  </Text>
                )}
              </View>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
