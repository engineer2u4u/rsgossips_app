// Create-campaign form — full RN port of web's CreateCampaignDialog.jsx
// (commit df31bb1). Submits to brand-campaigns action="create" with a
// "draft" or "active" status depending on which button the brand hits.
//
// Scope notes:
//   - Banner / gallery upload is NOT in this batch (web uses a separate
//     `upload-campaign-image` edge function + canvas-based compression).
//     Both URLs submit as empty; the screen can still create a campaign
//     end-to-end and the brand can add images via the web dashboard.
//   - Dates use plain text inputs with a YYYY-MM-DD hint. A native date
//     picker is a one-line swap-in once we add @react-native-community/datetimepicker.
//   - Conditional sections (budget vs barter, product vs service, etc.)
//     mirror the web's `showBudget` / `showProductValue` / `showBarterCompensation`
//     / `isBarter` predicates exactly so the resulting campaign row matches
//     whichever surface created it.

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  ArrowLeft,
  Check,
  ImagePlus,
  Trash2,
  Upload,
  X,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../context/AuthContext';
import {invokeFn} from '../lib/api';
import {useGlobalLoading} from '../context/LoadingContext';
import {pickFromLibrary, pickManyFromLibrary, type PickedImage} from '../lib/image-picker';
import {uploadCampaignImage} from '../lib/image-upload';

const CATEGORIES = [
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
];

const PLATFORMS = ['Instagram'];

const CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Chandigarh',
  'Indore',
  'Bhopal',
  'Kochi',
  'Remote',
];

const LANGUAGES = [
  'Hindi',
  'English',
  'Tamil',
  'Telugu',
  'Marathi',
  'Kannada',
  'Bengali',
  'Gujarati',
  'Punjabi',
  'Malayalam',
];

const GENDERS = ['Male', 'Female', 'Any'];

const USAGE_RIGHTS = [
  {value: 'creator_only', label: "Influencer's page only"},
  {value: 'brand_repost', label: 'Brand can repost'},
  {value: 'paid_ads', label: 'Brand can use in paid ads'},
  {value: 'full_rights', label: 'Full rights transfer'},
];

const PAYMENT_TIMELINES = [
  {value: 'advance', label: 'Advance'},
  {value: 'on_approval', label: 'On content approval'},
  {value: '7_days', label: 'Within 7 days of posting'},
  {value: '30_days', label: 'Within 30 days'},
];

const KEEPUP_DURATIONS = [
  {value: '24h', label: '24 hours (stories)'},
  {value: '7d', label: '7 days'},
  {value: '30d', label: '30 days'},
  {value: 'permanent', label: 'Permanent'},
];

const EXCLUSIVITY_PERIODS = [
  {value: '0', label: 'No exclusivity'},
  {value: '7', label: '7 days'},
  {value: '15', label: '15 days'},
  {value: '30', label: '30 days'},
  {value: '60', label: '60 days'},
  {value: '90', label: '90 days'},
];

const TIER_OPTIONS = [
  {value: 'all', label: 'All Tiers'},
  {value: 'nano', label: 'Nano (1K–10K)'},
  {value: 'micro', label: 'Micro (10K–100K)'},
  {value: 'macro', label: 'Macro (100K–1M)'},
  {value: 'mega', label: 'Mega (1M+)'},
];

// Auto-fill follower ranges when tier is selected. Matches web's TIER_RANGES.
const TIER_RANGES: Record<string, {min: number; max: number}> = {
  nano: {min: 1000, max: 10000},
  micro: {min: 10000, max: 100000},
  macro: {min: 100000, max: 1000000},
  mega: {min: 1000000, max: 10000000},
};

type FormState = {
  title: string;
  description: string;
  campaign_type: 'barter' | 'paid' | 'hybrid';
  offering_type: 'product' | 'service';
  max_influencers: string;
  budget_total: string;
  budget_per_influencer: string;
  product_name: string;
  product_value: string;
  shipping_required: 'no' | 'yes' | 'pickup';
  shipping_timeline_days: string;
  service_location: string;
  barter_compensation: string;
  num_reels: string;
  num_posts: string;
  num_stories: string;
  num_videos: string;
  num_blogs: string;
  target_follower_min: string;
  target_follower_max: string;
  target_influencer_tier: string;
  min_engagement_rate: string;
  content_dos: string;
  content_donts: string;
  required_hashtags: string;
  brand_handles_to_tag: string;
  usage_rights: string;
  keepup_duration: string;
  exclusivity_days: string;
  payment_timeline: string;
  campaign_start_date: string;
  application_deadline: string;
  campaign_end_date: string;
};

const initialForm: FormState = {
  title: '',
  description: '',
  campaign_type: 'barter',
  offering_type: 'product',
  max_influencers: '',
  budget_total: '',
  budget_per_influencer: '',
  product_name: '',
  product_value: '',
  shipping_required: 'no',
  shipping_timeline_days: '',
  service_location: '',
  barter_compensation: '',
  num_reels: '',
  num_posts: '',
  num_stories: '',
  num_videos: '',
  num_blogs: '',
  target_follower_min: '',
  target_follower_max: '',
  target_influencer_tier: 'all',
  min_engagement_rate: '',
  content_dos: '',
  content_donts: '',
  required_hashtags: '',
  brand_handles_to_tag: '',
  usage_rights: 'creator_only',
  keepup_duration: 'permanent',
  exclusivity_days: '0',
  payment_timeline: 'on_approval',
  campaign_start_date: '',
  application_deadline: '',
  campaign_end_date: '',
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function CreateCampaignScreen() {
  const navigation = useNavigation();
  const {user} = useAuth();
  const {withLoading} = useGlobalLoading();

  const [form, setForm] = useState<FormState>(initialForm);
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [allIndia, setAllIndia] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>(['Instagram']);
  const [genders, setGenders] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [banner, setBanner] = useState<PickedImage | null>(null);
  const [gallery, setGallery] = useState<PickedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = useCallback(
    <K extends keyof FormState>(k: K, v: FormState[K]) =>
      setForm(prev => ({...prev, [k]: v})),
    [],
  );

  // Toggle helpers
  const toggleIn = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  const totalDeliverables = useMemo(
    () =>
      (Number(form.num_reels) || 0) +
      (Number(form.num_posts) || 0) +
      (Number(form.num_stories) || 0) +
      (Number(form.num_videos) || 0) +
      (Number(form.num_blogs) || 0),
    [form.num_reels, form.num_posts, form.num_stories, form.num_videos, form.num_blogs],
  );

  // Visibility predicates (mirror web)
  const isBarter = form.campaign_type === 'barter';
  const showBudget = form.campaign_type === 'paid' || form.campaign_type === 'hybrid';
  const showProductValue = form.campaign_type === 'barter' || form.campaign_type === 'hybrid';
  const showBarterCompensation = showProductValue;

  // Auto-fill follower range from tier — web does this in useEffect.
  useEffect(() => {
    const range = TIER_RANGES[form.target_influencer_tier];
    if (range) {
      setForm(prev => ({
        ...prev,
        target_follower_min: String(range.min),
        target_follower_max: String(range.max),
      }));
    } else if (form.target_influencer_tier === 'all') {
      // Don't auto-clear; user might have entered custom bounds.
    }
  }, [form.target_influencer_tier]);

  // Auto-calc budget per influencer.
  useEffect(() => {
    if (!showBudget) return;
    const total = Number(form.budget_total);
    const slots = Number(form.max_influencers);
    if (total > 0 && slots > 0) {
      const per = Math.round(total / slots);
      setForm(prev => ({...prev, budget_per_influencer: String(per)}));
    } else {
      setForm(prev => ({...prev, budget_per_influencer: ''}));
    }
  }, [form.budget_total, form.max_influencers, showBudget]);

  const validate = (): string | null => {
    if (!user?.id) return 'You must be signed in';
    if (!form.title.trim()) return 'Title is required';
    if (!form.campaign_start_date) return 'Start date is required';
    if (!form.application_deadline) return 'Application deadline is required';
    if (!form.campaign_end_date) return 'Campaign end date is required';
    for (const d of [
      form.campaign_start_date,
      form.application_deadline,
      form.campaign_end_date,
    ]) {
      if (!ISO_DATE_RE.test(d)) {
        return `Dates must be in YYYY-MM-DD format (got "${d}")`;
      }
    }
    if (
      new Date(form.application_deadline).getTime() >
      new Date(form.campaign_end_date).getTime()
    ) {
      return 'Application deadline must be on or before the campaign end date';
    }
    if (totalDeliverables < 1) {
      return 'Add at least 1 deliverable (reels, posts, stories, videos or blogs)';
    }
    if (categories.length < 1) return 'Select at least 1 category';
    if (platforms.length < 1) return 'Select at least 1 platform';
    return null;
  };

  const submit = async (publish: boolean) => {
    setError(null);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setSubmitting(true);
    await withLoading(
      (async () => {
        try {
          let bannerUrl = '';
          const galleryUrls: string[] = [];

          if (banner) {
            const res = await uploadCampaignImage(banner, 'banners');
            bannerUrl = res.url;
          }
          for (let i = 0; i < gallery.length; i++) {
            const res = await uploadCampaignImage(gallery[i], 'gallery');
            if (res.url) galleryUrls.push(res.url);
          }

          const payload = {
            action: 'create',
            brandId: user!.id,
            campaign: {
              ...form,
              target_categories: categories,
              target_cities: allIndia ? ['All India'] : cities,
              banner_image_url: bannerUrl,
              gallery_image_urls: galleryUrls,
              status: publish ? 'active' : 'draft',
              platforms,
              target_gender: genders,
              target_languages: languages,
            },
          };
          const data = await invokeFn<{campaignId?: string}>(
            'brand-campaigns',
            payload,
          );
          if (data?.campaignId) {
            Alert.alert(
              publish ? 'Campaign published' : 'Draft saved',
              publish
                ? 'Creators can now see and apply.'
                : 'You can publish it from the campaigns list.',
              [{text: 'OK', onPress: () => navigation.goBack()}],
            );
          }
        } catch (e: any) {
          setError(e?.message || 'Failed to create campaign');
        }
      })(),
      publish ? 'Publishing campaign…' : 'Saving draft…',
    );
    setSubmitting(false);
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: '#F8F9FE'}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Top bar */}
      <View style={s.topbar}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={s.backBtn}>
          <ArrowLeft size={22} color="#0f172a" />
        </Pressable>
        <View>
          <Text style={s.topTitle}>New Campaign</Text>
          <Text style={s.topSub}>
            Saved as draft unless you publish
          </Text>
        </View>
        <View style={{width: 30}} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{padding: 16, gap: 16, paddingBottom: 120}}>
        {error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Basic info */}
        <Section title="Basic info">
          <Field label="Title" required>
            <TextInput
              value={form.title}
              onChangeText={v => update('title', v)}
              placeholder="e.g. Summer Fashion 2026"
              placeholderTextColor="#cbd5e1"
              style={s.input}
            />
          </Field>
          <Field
            label="Description"
            hint="Helps creators understand what you need">
            <TextInput
              value={form.description}
              onChangeText={v => update('description', v)}
              placeholder="Tell creators what you're looking for…"
              placeholderTextColor="#cbd5e1"
              multiline
              numberOfLines={5}
              style={[s.input, {minHeight: 110, textAlignVertical: 'top'}]}
            />
          </Field>
          <View style={s.twoCol}>
            <Field label="Campaign Type" required>
              <Dropdown
                value={form.campaign_type}
                options={[
                  {value: 'barter', label: 'Barter'},
                  {value: 'paid', label: 'Paid'},
                  {value: 'hybrid', label: 'Hybrid'},
                ]}
                onChange={v => update('campaign_type', v as any)}
              />
            </Field>
            <Field label="Slots" hint="Number of creators">
              <TextInput
                value={form.max_influencers}
                onChangeText={v =>
                  update('max_influencers', v.replace(/\D/g, ''))
                }
                placeholder="10"
                placeholderTextColor="#cbd5e1"
                keyboardType="number-pad"
                style={s.input}
              />
            </Field>
          </View>

          {showBudget ? (
            <View style={s.twoCol}>
              <Field label="Budget (Total)">
                <TextInput
                  value={form.budget_total}
                  onChangeText={v => update('budget_total', v.replace(/\D/g, ''))}
                  placeholder="50000"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="number-pad"
                  style={s.input}
                />
              </Field>
              <Field label="Budget / Influencer" hint="Auto-calculated">
                <TextInput
                  value={form.budget_per_influencer}
                  editable={false}
                  placeholder="—"
                  placeholderTextColor="#cbd5e1"
                  style={[s.input, s.inputReadonly]}
                />
              </Field>
            </View>
          ) : null}

          {showProductValue ? (
            <Field
              label="Product value (approx.)"
              hint="Helps creators evaluate the offer">
              <TextInput
                value={form.product_value}
                onChangeText={v => update('product_value', v.replace(/\D/g, ''))}
                placeholder="3500"
                placeholderTextColor="#cbd5e1"
                keyboardType="number-pad"
                style={s.input}
              />
            </Field>
          ) : null}
        </Section>

        {/* Product / Service */}
        <Section title="Product / service">
          <Field label="What are you promoting?" required>
            <View style={s.twoCol}>
              <TogglePill
                label="📦 Product"
                active={form.offering_type === 'product'}
                onPress={() => update('offering_type', 'product')}
              />
              <TogglePill
                label="🛎️ Service / Experience"
                active={form.offering_type === 'service'}
                onPress={() => update('offering_type', 'service')}
              />
            </View>
            <TextInput
              value={form.product_name}
              onChangeText={v => update('product_name', v)}
              placeholder={
                form.offering_type === 'product'
                  ? 'e.g. "Moisturizing cream — 50ml tube"'
                  : 'e.g. "Weekend stay at our Mussoorie resort"'
              }
              placeholderTextColor="#cbd5e1"
              style={[s.input, {marginTop: 8}]}
            />
          </Field>

          {form.offering_type === 'product' ? (
            <View style={s.twoCol}>
              <Field label="Will product be shipped?">
                <Dropdown
                  value={form.shipping_required}
                  options={[
                    {value: 'no', label: 'No'},
                    {value: 'yes', label: 'Yes'},
                    {value: 'pickup', label: 'Pickup required'},
                  ]}
                  onChange={v => update('shipping_required', v as any)}
                />
              </Field>
              {form.shipping_required === 'yes' ? (
                <Field label="Shipping timeline (days)">
                  <TextInput
                    value={form.shipping_timeline_days}
                    onChangeText={v =>
                      update('shipping_timeline_days', v.replace(/\D/g, ''))
                    }
                    placeholder="3"
                    placeholderTextColor="#cbd5e1"
                    keyboardType="number-pad"
                    style={s.input}
                  />
                </Field>
              ) : (
                <View style={{flex: 1}} />
              )}
            </View>
          ) : (
            <Field
              label="Service location"
              hint="Where the influencer experiences the service">
              <TextInput
                value={form.service_location}
                onChangeText={v => update('service_location', v)}
                placeholder='e.g. "Mussoorie, India" or "Online / virtual"'
                placeholderTextColor="#cbd5e1"
                style={s.input}
              />
            </Field>
          )}

          {showBarterCompensation ? (
            <Field label="What does the influencer get? (compensation details)">
              <TextInput
                value={form.barter_compensation}
                onChangeText={v => update('barter_compensation', v)}
                placeholder={
                  form.offering_type === 'product'
                    ? 'e.g. "Full skincare kit worth ₹3,500"'
                    : 'e.g. "Free 2-night stay + meals + spa session"'
                }
                placeholderTextColor="#cbd5e1"
                multiline
                style={[s.input, {minHeight: 60, textAlignVertical: 'top'}]}
              />
            </Field>
          ) : null}
        </Section>

        {/* Banner */}
        <Section title="Banner image">
          {banner ? (
            <View style={s.bannerPreview}>
              <Image source={{uri: banner.uri}} style={s.bannerImage} />
              <TouchableOpacity
                onPress={() => setBanner(null)}
                style={s.bannerRemove}
                hitSlop={8}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={async () => {
                try {
                  const img = await pickFromLibrary();
                  if (img) setBanner(img);
                } catch (e: any) {
                  Alert.alert('Picker error', e?.message || 'Could not open picker.');
                }
              }}
              style={s.uploadBox}>
              <Upload size={22} color="#94a3b8" />
              <Text style={s.uploadHint}>Tap to upload banner</Text>
              <Text style={s.uploadHintSmall}>PNG, JPG up to 10MB</Text>
            </TouchableOpacity>
          )}
        </Section>

        {/* Gallery */}
        <Section
          title="Gallery"
          rightLabel={gallery.length > 0 ? `${gallery.length} image${gallery.length > 1 ? 's' : ''}` : undefined}>
          {gallery.length > 0 ? (
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
              {gallery.map((g, i) => (
                <View key={`${g.uri}-${i}`} style={s.galleryCell}>
                  <Image source={{uri: g.uri}} style={s.galleryImage} />
                  <TouchableOpacity
                    onPress={() => setGallery(prev => prev.filter((_, x) => x !== i))}
                    style={s.galleryRemove}
                    hitSlop={6}>
                    <X size={12} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
          <TouchableOpacity
            onPress={async () => {
              try {
                const imgs = await pickManyFromLibrary(6 - gallery.length);
                if (imgs.length > 0) setGallery(prev => [...prev, ...imgs]);
              } catch (e: any) {
                Alert.alert('Picker error', e?.message || 'Could not open picker.');
              }
            }}
            style={s.uploadStripe}>
            <ImagePlus size={16} color="#5851DB" />
            <Text style={s.uploadStripeText}>Add gallery images</Text>
          </TouchableOpacity>
        </Section>

        {/* Platforms */}
        <Section
          title="Platforms"
          required
          rightLabel={platforms.length > 0 ? `${platforms.length} selected` : undefined}>
          <ChipGroup
            options={PLATFORMS}
            selected={platforms}
            onToggle={v => setPlatforms(p => toggleIn(p, v))}
          />
        </Section>

        {/* Deliverables */}
        <Section
          title="Content deliverables (per creator)"
          required
          rightLabel={`${totalDeliverables} piece${totalDeliverables === 1 ? '' : 's'}`}
          rightHighlight={totalDeliverables > 0}>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
            {[
              {k: 'num_reels' as const, label: 'Reels'},
              {k: 'num_posts' as const, label: 'Posts'},
              {k: 'num_stories' as const, label: 'Stories'},
              {k: 'num_videos' as const, label: 'Videos'},
              {k: 'num_blogs' as const, label: 'Blogs'},
            ].map(d => (
              <View key={d.k} style={s.deliverableCell}>
                <Text style={s.fieldLabel}>{d.label}</Text>
                <TextInput
                  value={form[d.k]}
                  onChangeText={v => update(d.k, v.replace(/\D/g, ''))}
                  placeholder="0"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="number-pad"
                  style={[s.input, {textAlign: 'center'}]}
                />
              </View>
            ))}
          </View>
        </Section>

        {/* Categories */}
        <Section
          title="Categories"
          required
          rightLabel={`${categories.length} of ${CATEGORIES.length}`}
          rightHighlight={categories.length > 0}>
          <ChipGroup
            options={CATEGORIES}
            selected={categories}
            onToggle={v => setCategories(c => toggleIn(c, v))}
          />
        </Section>

        {/* Influencer requirements */}
        <Section title="Influencer requirements">
          <View style={s.twoCol}>
            <Field label="Tier" hint="Auto-fills follower range">
              <Dropdown
                value={form.target_influencer_tier}
                options={TIER_OPTIONS}
                onChange={v => update('target_influencer_tier', v)}
              />
            </Field>
            <Field label="Min. Engagement (%)">
              <TextInput
                value={form.min_engagement_rate}
                onChangeText={v =>
                  update('min_engagement_rate', v.replace(/[^0-9.]/g, ''))
                }
                placeholder="2.5"
                placeholderTextColor="#cbd5e1"
                keyboardType="decimal-pad"
                style={s.input}
              />
            </Field>
          </View>
          <View style={s.twoCol}>
            <Field label="Min. Followers">
              <TextInput
                value={form.target_follower_min}
                onChangeText={v =>
                  update('target_follower_min', v.replace(/\D/g, ''))
                }
                placeholder="1000"
                placeholderTextColor="#cbd5e1"
                keyboardType="number-pad"
                style={s.input}
              />
            </Field>
            <Field label="Max. Followers">
              <TextInput
                value={form.target_follower_max}
                onChangeText={v =>
                  update('target_follower_max', v.replace(/\D/g, ''))
                }
                placeholder="100000"
                placeholderTextColor="#cbd5e1"
                keyboardType="number-pad"
                style={s.input}
              />
            </Field>
          </View>
        </Section>

        {/* Locations */}
        <Section
          title="Locations"
          rightLabel={allIndia ? 'All India' : `${cities.length} selected`}>
          <Pressable
            onPress={() => setAllIndia(v => !v)}
            style={s.checkboxRow}>
            <View style={[s.checkbox, allIndia && s.checkboxOn]}>
              {allIndia ? <Check size={12} color="white" /> : null}
            </View>
            <Text style={{fontSize: 12, fontWeight: '600', color: '#475569'}}>
              Open to all creators across India
            </Text>
          </Pressable>
          {!allIndia ? (
            <ChipGroup
              options={CITIES}
              selected={cities}
              onToggle={v => setCities(c => toggleIn(c, v))}
            />
          ) : null}
        </Section>

        {/* Audience preferences */}
        <Section title="Audience preferences">
          <Field label="Preferred gender">
            <ChipGroup
              options={GENDERS}
              selected={genders}
              onToggle={v => setGenders(g => toggleIn(g, v))}
            />
          </Field>
          <Field label="Preferred languages">
            <ChipGroup
              options={LANGUAGES}
              selected={languages}
              onToggle={v => setLanguages(l => toggleIn(l, v))}
            />
          </Field>
        </Section>

        {/* Content guidelines */}
        <Section title="Content guidelines">
          <Field label="Must include (Do's)" hint="What every creator must show or mention">
            <TextInput
              value={form.content_dos}
              onChangeText={v => update('content_dos', v)}
              placeholder='e.g. "Show product packaging, mention discount code SAVE20"'
              placeholderTextColor="#cbd5e1"
              multiline
              style={[s.input, {minHeight: 60, textAlignVertical: 'top'}]}
            />
          </Field>
          <Field label="Must avoid (Don'ts)" hint="Eliminates 80% of revisions">
            <TextInput
              value={form.content_donts}
              onChangeText={v => update('content_donts', v)}
              placeholder={'e.g. "Don’t show competitor products, no copyrighted music"'}
              placeholderTextColor="#cbd5e1"
              multiline
              style={[s.input, {minHeight: 60, textAlignVertical: 'top'}]}
            />
          </Field>
          <Field label="Required hashtags">
            <TextInput
              value={form.required_hashtags}
              onChangeText={v => update('required_hashtags', v)}
              placeholder="#RGossips #Ad #Paidpartnership"
              placeholderTextColor="#cbd5e1"
              autoCapitalize="none"
              style={s.input}
            />
          </Field>
          <Field label="Brand handle(s) to tag">
            <TextInput
              value={form.brand_handles_to_tag}
              onChangeText={v => update('brand_handles_to_tag', v)}
              placeholder="@yourbrand"
              placeholderTextColor="#cbd5e1"
              autoCapitalize="none"
              style={s.input}
            />
          </Field>
        </Section>

        {/* Terms & rights */}
        <Section title="Terms & rights">
          <Field label="Content usage rights">
            <Dropdown
              value={form.usage_rights}
              options={USAGE_RIGHTS}
              onChange={v => update('usage_rights', v)}
            />
          </Field>
          <Field label="Content keep-up duration">
            <Dropdown
              value={form.keepup_duration}
              options={KEEPUP_DURATIONS}
              onChange={v => update('keepup_duration', v)}
            />
          </Field>
          <Field label="Exclusivity (no competing brands)">
            <Dropdown
              value={form.exclusivity_days}
              options={EXCLUSIVITY_PERIODS}
              onChange={v => update('exclusivity_days', v)}
            />
          </Field>
          {!isBarter ? (
            <Field label="Payment timeline">
              <Dropdown
                value={form.payment_timeline}
                options={PAYMENT_TIMELINES}
                onChange={v => update('payment_timeline', v)}
              />
            </Field>
          ) : null}
        </Section>

        {/* Schedule */}
        <Section title="Schedule">
          <Field label="Start Date" required hint="YYYY-MM-DD">
            <TextInput
              value={form.campaign_start_date}
              onChangeText={v => update('campaign_start_date', v)}
              placeholder="2026-06-01"
              placeholderTextColor="#cbd5e1"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              style={s.input}
            />
          </Field>
          <Field label="Application Deadline" required hint="YYYY-MM-DD">
            <TextInput
              value={form.application_deadline}
              onChangeText={v => update('application_deadline', v)}
              placeholder="2026-06-15"
              placeholderTextColor="#cbd5e1"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              style={s.input}
            />
          </Field>
          <Field label="Campaign End Date" required hint="YYYY-MM-DD">
            <TextInput
              value={form.campaign_end_date}
              onChangeText={v => update('campaign_end_date', v)}
              placeholder="2026-07-15"
              placeholderTextColor="#cbd5e1"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              style={s.input}
            />
          </Field>
          <Text style={s.helperText}>
            Application deadline is the last day to apply. Campaign end date is when all content must be delivered.
          </Text>
        </Section>
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={submitting}
          style={[s.footerBtn, s.footerCancel]}>
          <Text style={s.footerCancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => submit(false)}
          disabled={submitting}
          style={[s.footerBtn, s.footerDraft]}>
          <Text style={s.footerDraftText}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => submit(true)}
          disabled={submitting}
          style={[s.footerBtn, s.footerPublish, {opacity: submitting ? 0.5 : 1}]}>
          <LinearGradient
            colors={['#5851DB', '#4338CA']}
            style={s.publishGradient}>
            <Text style={s.footerPublishText}>Publish</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ─────────── Reusable subcomponents ─────────── */

function Section({
  title,
  required,
  rightLabel,
  rightHighlight,
  children,
}: {
  title: string;
  required?: boolean;
  rightLabel?: string;
  rightHighlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>
          {title}
          {required ? <Text style={{color: '#dc2626'}}> *</Text> : null}
        </Text>
        {rightLabel ? (
          <Text
            style={[
              s.sectionRight,
              rightHighlight && {color: '#5851DB'},
            ]}>
            {rightLabel}
          </Text>
        ) : null}
      </View>
      <View style={{gap: 12}}>{children}</View>
    </View>
  );
}

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
    <View style={{flex: 1, gap: 6}}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Text style={s.fieldLabel}>
          {label}
          {required ? <Text style={{color: '#dc2626'}}> *</Text> : null}
        </Text>
        {hint ? <Text style={s.fieldHint}> · {hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Dropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: {value: string; label: string}[];
  onChange: (v: string) => void;
}) {
  // Inline picker: tap each option in a horizontal scroller. Not a dropdown
  // per se but cleaner than wrestling with a modal Picker on RN.
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{gap: 6, paddingRight: 8}}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[s.dropdownChip, active && s.dropdownChipActive]}>
            <Text
              style={[
                s.dropdownChipText,
                active && s.dropdownChipTextActive,
              ]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6}}>
      {options.map(o => {
        const active = selected.includes(o);
        return (
          <TouchableOpacity
            key={o}
            onPress={() => onToggle(o)}
            style={[s.chip, active && s.chipActive]}>
            {active ? <Check size={12} color="#5851DB" /> : null}
            <Text
              style={[s.chipText, active && {color: '#5851DB'}]}
              numberOfLines={1}>
              {o}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TogglePill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        s.togglePill,
        active && s.togglePillActive,
        {flex: 1},
      ]}>
      <Text
        style={[
          s.togglePillText,
          active && s.togglePillTextActive,
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {padding: 4, width: 30},
  topTitle: {fontSize: 16, fontWeight: '700', color: '#0f172a', textAlign: 'center'},
  topSub: {fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 2},
  section: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {fontSize: 14, fontWeight: '800', color: '#0f172a'},
  sectionRight: {fontSize: 11, fontWeight: '700', color: '#94a3b8'},
  fieldLabel: {fontSize: 11, fontWeight: '700', color: '#475569'},
  fieldHint: {fontSize: 10, color: '#94a3b8'},
  twoCol: {flexDirection: 'row', gap: 12},
  input: {
    backgroundColor: '#F8F9FE',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  inputReadonly: {backgroundColor: '#e2e8f0', color: '#94a3b8'},
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {fontSize: 13, color: '#dc2626'},
  deferredBox: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  deferredText: {fontSize: 12, color: '#92400e', lineHeight: 18},
  uploadBox: {
    height: 140,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8F9FE',
  },
  uploadHint: {fontSize: 12, fontWeight: '700', color: '#64748b'},
  uploadHintSmall: {fontSize: 10, color: '#94a3b8'},
  bannerPreview: {
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  bannerImage: {width: '100%', height: '100%'},
  bannerRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryCell: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  galleryImage: {width: '100%', height: '100%'},
  galleryRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadStripe: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    backgroundColor: '#F8F9FE',
  },
  uploadStripeText: {fontSize: 12, fontWeight: '700', color: '#5851DB'},
  deliverableCell: {flex: 1, minWidth: '18%', gap: 4},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8F9FE',
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipActive: {
    backgroundColor: '#EBE9FE',
    borderColor: '#5851DB',
  },
  chipText: {fontSize: 11, fontWeight: '600', color: '#475569'},
  dropdownChip: {
    backgroundColor: '#F8F9FE',
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dropdownChipActive: {
    backgroundColor: '#EBE9FE',
    borderColor: '#5851DB',
  },
  dropdownChipText: {fontSize: 12, fontWeight: '600', color: '#475569'},
  dropdownChipTextActive: {color: '#5851DB'},
  togglePill: {
    backgroundColor: '#F8F9FE',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  togglePillActive: {
    backgroundColor: '#EBE9FE',
    borderColor: '#5851DB',
  },
  togglePillText: {fontSize: 12, fontWeight: '700', color: '#475569'},
  togglePillTextActive: {color: '#5851DB'},
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  checkboxOn: {backgroundColor: '#5851DB', borderColor: '#5851DB'},
  helperText: {fontSize: 10, color: '#94a3b8', marginTop: 4},
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
  },
  footerBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  footerCancel: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  footerCancelText: {color: '#475569', fontWeight: '700', fontSize: 13},
  footerDraft: {backgroundColor: '#EBE9FE'},
  footerDraftText: {color: '#5851DB', fontWeight: '700', fontSize: 13},
  footerPublish: {},
  publishGradient: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerPublishText: {color: 'white', fontWeight: '800', fontSize: 13},
});
