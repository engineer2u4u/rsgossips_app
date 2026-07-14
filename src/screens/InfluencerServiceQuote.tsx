// Quote request form for a service. Submits to the `submit-quote-request`
// edge function and lands on a success screen telling the user when to
// expect the response (`quote_sla_hours` from the service row).
//
// Web parity: src/app/influencer/services/[id]/quote/page.js. Same fields
// in the same order, same per-tag scope enums, same URL-only assets policy.

import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {
  CheckCircle2,
  ChevronLeft,
  Info,
  Link as LinkIcon,
  Send,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';
import {invokeFn, EdgeFunctionError} from '../lib/api';
import {
  fetchServiceBySlug,
  formatINR,
  iconForName,
  type ServiceRow,
} from '../lib/services';

// Per-tag scope option sets. Mirrors the web's SCOPE_FOR_TAG map exactly so
// quotes created on either surface end up with comparable scope strings.
const SCOPE_FOR_TAG: Record<
  string,
  {label: string; required: boolean; options: string[]}
> = {
  CONTENT: {
    label: 'Reel duration',
    required: true,
    options: ['15-30 seconds', '30-60 seconds', '60-90 seconds', '90s+'],
  },
  AUDIO: {
    label: 'Episode length',
    required: true,
    options: ['Up to 30 min', '30-60 min', '60-90 min', '90 min+'],
  },
  DESIGN: {
    label: 'Number of designs',
    required: true,
    options: ['1 design', '5-10 designs', '10-20 designs', '20+ designs'],
  },
  WRITING: {
    label: 'Content volume',
    required: true,
    options: ['1-5 pieces', '5-10 pieces', '10-20 pieces', '20+ pieces'],
  },
  STRATEGY: {
    label: 'Scope',
    required: true,
    options: ['Audit only', 'Audit + 30-day roadmap', 'Full quarterly retainer'],
  },
  ADS: {
    label: 'Monthly ad spend',
    required: true,
    options: ['< ₹25K', '₹25K – ₹1L', '₹1L – ₹3L', '₹3L+'],
  },
  MANAGEMENT: {
    label: 'Posting cadence',
    required: true,
    options: ['8 posts / month', '16 posts / month', 'Daily posting'],
  },
  MARKETING: {
    label: 'Campaign size',
    required: true,
    options: ['3 nano creators', '10 micro creators', '25+ creators'],
  },
};

const BUDGET_OPTIONS = [
  'Under ₹3,000',
  '₹3,000 – ₹7,000',
  '₹7,000 – ₹15,000',
  '₹15,000 – ₹50,000',
  '₹50,000+',
];

function defaultDeliveryISO() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Quick-pick chips for the delivery date so users don't have to type
// YYYY-MM-DD by hand. Mirrors the same SLA buckets the brand-side uses.
const DELIVERY_PRESETS: {key: string; days: number}[] = [
  {key: 'in1Week', days: 7},
  {key: 'in2Weeks', days: 14},
  {key: 'in1Month', days: 30},
];

const URL_RE = /^https?:\/\/\S+\.\S+/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function InfluencerServiceQuote() {
  const {t} = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const slug = route.params?.slug;
  const {user, role} = useAuth();

  const [service, setService] = useState<ServiceRow | null>(null);
  const [loadingService, setLoadingService] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoadingService(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const data = await fetchServiceBySlug(slug);
      if (!cancelled) {
        setService(data);
        setLoadingService(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const scopeCfg = useMemo(
    () =>
      (service?.tag && SCOPE_FOR_TAG[service.tag]) || {
        label: 'Scope',
        required: false,
        options: [] as string[],
      },
    [service],
  );

  const [description, setDescription] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(defaultDeliveryISO());
  const [scope, setScope] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [styleRefs, setStyleRefs] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Seed scope to the first option once the service (and therefore scopeCfg)
  // arrives from the DB.
  useEffect(() => {
    if (!scope && scopeCfg.options.length > 0) {
      setScope(scopeCfg.options[0]);
    }
  }, [scopeCfg, scope]);

  if (loadingService) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8F9FD',
        }}>
        <ActivityIndicator color="#E60076" size="large" />
      </View>
    );
  }

  if (!service) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8F9FD',
          padding: 24,
          gap: 10,
        }}>
        <Text className="text-base font-bold text-slate-600">
          {t('ScreensInfluencerServiceQuote.serviceNotFound')}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-sm font-bold text-pink-500">
            {t('ScreensInfluencerServiceQuote.goBack')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const Icon = iconForName(service.icon_name);

  if (done) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#F8F9FD',
          justifyContent: 'center',
          padding: 24,
        }}>
        <View className="bg-white rounded-3xl border border-slate-100 p-8 items-center" style={{gap: 12}}>
          <View className="w-16 h-16 rounded-2xl bg-emerald-100 items-center justify-center">
            <CheckCircle2 size={28} color="#10b981" />
          </View>
          <Text className="text-xl font-black text-slate-900 mt-2 text-center">
            {t('ScreensInfluencerServiceQuote.successTitle')}
          </Text>
          <Text className="text-[13px] text-slate-500 text-center leading-5 mt-1">
            {t('ScreensInfluencerServiceQuote.successBodyBefore')}{' '}
            <Text className="font-bold text-slate-700">
              {t('ScreensInfluencerServiceQuote.successHours', {
                hours: service.quote_sla_hours || 24,
              })}
            </Text>
            {t('ScreensInfluencerServiceQuote.successBodyAfter')}
          </Text>
          <View className="flex-row mt-4" style={{gap: 10}}>
            <TouchableOpacity
              onPress={() =>
                navigation.reset({
                  index: 0,
                  routes: [{name: 'InfluencerServices'}],
                })
              }
              className="px-5 py-3 rounded-2xl border border-slate-200">
              <Text className="text-sm font-black text-slate-700">
                {t('ScreensInfluencerServiceQuote.moreServices')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.reset({
                  index: 0,
                  routes: [{name: 'InfluencerServiceOrders'}],
                })
              }
              style={{
                paddingHorizontal: 22,
                paddingVertical: 12,
                borderRadius: 16,
                overflow: 'hidden',
              }}>
              <LinearGradient
                colors={['#9810FA', '#E60076']}
                style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
              />
              <Text className="text-white text-sm font-black">
                {t('ScreensInfluencerServiceQuote.viewMyOrders')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const handleSubmit = async () => {
    setError('');
    if (!user?.id) {
      setError(t('ScreensInfluencerServiceQuote.errSignIn'));
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      setError(t('ScreensInfluencerServiceQuote.errDescription'));
      return;
    }
    if (!assetUrl.trim() || !URL_RE.test(assetUrl.trim())) {
      setError(t('ScreensInfluencerServiceQuote.errAssetUrl'));
      return;
    }
    if (deliveryDate && !ISO_DATE_RE.test(deliveryDate)) {
      setError(t('ScreensInfluencerServiceQuote.errDeliveryFormat'));
      return;
    }
    if (scopeCfg.required && !scope) {
      setError(
        t('ScreensInfluencerServiceQuote.errSelectScope', {
          scope: scopeCfg.label.toLowerCase(),
        }),
      );
      return;
    }
    setSubmitting(true);
    try {
      await invokeFn('submit-quote-request', {
        userId: user.id,
        userRole: role || '',
        serviceSlug: service.slug,
        description: description.trim(),
        assetUrl: assetUrl.trim(),
        desiredDeliveryDate: deliveryDate || null,
        scope: scope || null,
        budgetRange: budgetRange || null,
        styleReferences: styleRefs.trim() || null,
        notes: notes.trim() || null,
      });
      setDone(true);
    } catch (e) {
      if (e instanceof EdgeFunctionError) {
        setError(e.message);
      } else {
        setError(
          (e as Error)?.message ||
            t('ScreensInfluencerServiceQuote.errSubmitFailed'),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{backgroundColor: '#F5F4F8'}}>
      {/* Top bar */}
      <View
        className="bg-white px-5 py-4 flex-row items-center border-b border-slate-100"
        style={{gap: 12}}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center">
          <ChevronLeft size={20} color="#E60076" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-slate-800 flex-1" numberOfLines={1}>
          {t('ScreensInfluencerServiceQuote.requestQuote')}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
      <ScrollView
        contentContainerStyle={{padding: 16, paddingBottom: 80, gap: 14}}
        keyboardShouldPersistTaps="handled">
        {/* Header card — padding on outer View, gradient is an absolute background fill */}
        <View
          className="flex-row items-center"
          style={{
            padding: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#FECDD3',
            gap: 12,
            overflow: 'hidden',
          }}>
          <LinearGradient
            colors={['#FFF1F2', '#FCE7F3', '#EDE9FE']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
          />
          <View className="w-12 h-12 rounded-xl bg-white items-center justify-center">
            <Icon size={22} color="#E60076" />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-base font-black text-slate-900" numberOfLines={1}>
              {service.title}
            </Text>
            <Text className="text-[11px] text-slate-500 mt-0.5">
              {t('ScreensInfluencerServiceQuote.stepIndicator')}
            </Text>
          </View>
          <View className="bg-slate-900 px-3 py-1.5 rounded-full">
            <Text className="text-[9px] font-black uppercase tracking-widest text-white">
              {t('ScreensInfluencerServiceQuote.quoteBadge')}
            </Text>
          </View>
        </View>

        {/* Form */}
        <View className="bg-white rounded-2xl border border-slate-100 p-5" style={{gap: 18}}>
          <Field
            label={t('ScreensInfluencerServiceQuote.fieldDescriptionLabel')}
            required
            hint={t('ScreensInfluencerServiceQuote.fieldDescriptionHint')}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={t(
                'ScreensInfluencerServiceQuote.fieldDescriptionPlaceholder',
              )}
              placeholderTextColor="#cbd5e1"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={s.input}
            />
          </Field>

          <Field
            label={t('ScreensInfluencerServiceQuote.fieldAssetLabel')}
            required>
            <View className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3" style={{gap: 10}}>
              <View className="flex-row" style={{gap: 10}}>
                <View className="w-9 h-9 rounded-lg bg-pink-50 items-center justify-center">
                  <LinkIcon size={16} color="#E60076" />
                </View>
                <View className="flex-1">
                  <Text className="text-[12px] font-bold text-slate-800">
                    {t('ScreensInfluencerServiceQuote.fieldAssetHeading')}
                  </Text>
                  <Text className="text-[10px] text-slate-500 mt-0.5">
                    {t('ScreensInfluencerServiceQuote.fieldAssetDescription')}
                  </Text>
                </View>
              </View>
              <TextInput
                value={assetUrl}
                onChangeText={setAssetUrl}
                placeholder="https://drive.google.com/folders/…"
                placeholderTextColor="#cbd5e1"
                autoCapitalize="none"
                keyboardType="url"
                style={[s.input, {backgroundColor: 'white'}]}
              />
            </View>
          </Field>

          {/* Desired delivery date — quick-pick chips above the editable input
              so users don't have to hand-type a date. */}
          <Field
            label={t('ScreensInfluencerServiceQuote.fieldDeliveryLabel')}
            hint={t('ScreensInfluencerServiceQuote.fieldDeliveryHint')}>
            <View className="flex-row flex-wrap" style={{gap: 6, marginBottom: 8}}>
              {DELIVERY_PRESETS.map(preset => {
                const presetIso = isoDaysFromNow(preset.days);
                const active = deliveryDate === presetIso;
                return (
                  <Pressable
                    key={preset.key}
                    onPress={() => setDeliveryDate(presetIso)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: active ? '#C4B5FD' : '#E2E8F0',
                      backgroundColor: active ? '#EDE9FE' : '#FFFFFF',
                    }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: active ? '#6D28D9' : '#475569',
                      }}>
                      {t(
                        `ScreensInfluencerServiceQuote.deliveryPresets.${preset.key}`,
                      )}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              value={deliveryDate}
              onChangeText={setDeliveryDate}
              placeholder="2026-06-15"
              placeholderTextColor="#cbd5e1"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              style={s.input}
            />
          </Field>

          {scopeCfg.options.length > 0 ? (
            <Field label={scopeCfg.label} required={scopeCfg.required}>
              <PickerChips
                value={scope}
                options={scopeCfg.options}
                onChange={setScope}
              />
            </Field>
          ) : null}

          {/* Budget */}
          <Field
            label={t('ScreensInfluencerServiceQuote.fieldBudgetLabel')}
            hint={t('ScreensInfluencerServiceQuote.fieldBudgetHint')}>
            <PickerChips
              value={budgetRange}
              options={BUDGET_OPTIONS}
              onChange={v => setBudgetRange(v === budgetRange ? '' : v)}
              allowDeselect
            />
            {service.price_max ? (
              <View
                className="mt-2 bg-rose-50 border border-rose-100 rounded-xl p-2.5 flex-row"
                style={{gap: 6}}>
                <Info size={12} color="#E11D48" />
                <Text className="text-[11px] text-rose-700 flex-1">
                  {t('ScreensInfluencerServiceQuote.typicalRangeBefore')}{' '}
                  <Text className="font-bold">
                    {formatINR(service.price_starting || 0)} – {formatINR(service.price_max)}
                  </Text>
                  {' '}{t('ScreensInfluencerServiceQuote.typicalRangeAfter')}
                </Text>
              </View>
            ) : null}
          </Field>

          <Field
            label={t('ScreensInfluencerServiceQuote.fieldStyleLabel')}
            hint={t('ScreensInfluencerServiceQuote.fieldStyleHint')}>
            <TextInput
              value={styleRefs}
              onChangeText={setStyleRefs}
              placeholder={t(
                'ScreensInfluencerServiceQuote.fieldStylePlaceholder',
              )}
              placeholderTextColor="#cbd5e1"
              autoCapitalize="none"
              style={s.input}
            />
          </Field>

          <Field label={t('ScreensInfluencerServiceQuote.fieldNotesLabel')}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t(
                'ScreensInfluencerServiceQuote.fieldNotesPlaceholder',
              )}
              placeholderTextColor="#cbd5e1"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={[s.input, {minHeight: 80}]}
            />
          </Field>

          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <Text className="text-[12px] text-red-600 font-semibold">{error}</Text>
            </View>
          ) : null}

          {/* Footer actions — stacked: full-width submit, secondary cancel below */}
          <View style={{gap: 10, marginTop: 4}}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                overflow: 'hidden',
                opacity: submitting ? 0.6 : 1,
              }}>
              <LinearGradient
                colors={['#9810FA', '#E60076']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
              />
              {submitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Send size={15} color="white" />
              )}
              <Text
                className="text-white text-sm font-black"
                numberOfLines={1}>
                {submitting
                  ? t('ScreensInfluencerServiceQuote.submitting')
                  : t('ScreensInfluencerServiceQuote.submitRequest')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={submitting}
              className="py-3 rounded-2xl border border-slate-200 items-center"
              style={{opacity: submitting ? 0.5 : 1}}>
              <Text className="text-sm font-black text-slate-700">
                {t('ScreensInfluencerServiceQuote.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─────────── Reusable bits ─────────── */

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={{gap: 6}}>
      <View className="flex-row items-baseline justify-between">
        <Text className="text-[12px] font-black text-slate-800">
          {label}
          {required ? <Text style={{color: '#E11D48'}}> *</Text> : null}
        </Text>
        {hint ? (
          <Text className="text-[10px] text-pink-500 font-semibold">{hint}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function PickerChips({
  value,
  options,
  onChange,
  allowDeselect,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  allowDeselect?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap" style={{gap: 6}}>
      {options.map(opt => {
        const active = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(active && allowDeselect ? '' : opt)}
            className={`px-3 py-2 rounded-xl border ${
              active
                ? 'bg-purple-100 border-purple-300'
                : 'bg-white border-slate-200'
            }`}>
            <Text
              className={`text-[12px] font-bold ${
                active ? 'text-purple-700' : 'text-slate-600'
              }`}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = {
  input: {
    width: '100%' as const,
    backgroundColor: '#F8F9FD',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#0f172a',
    minHeight: 44,
  },
};
