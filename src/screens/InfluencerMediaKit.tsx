import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Linking,
  Share,
  Clipboard,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  MapPin,
  Camera,
  Instagram,
  Youtube,
  Pencil,
  Check,
  X as XIcon,
  Share2,
  Copy,
  Loader2,
  ChevronLeft,
  Crown,
  Lock,
  LayoutTemplate,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {openManagePlan} from '../lib/manage-plan';
import {useAuth} from '../context/AuthContext';
import {invokeFn} from '../lib/api';
import {useProfilePhoto} from '../utils/photoUrl';
import InfluencerLayout from '../layouts/InfluencerLayout';
import {
  MEDIA_KIT_TEMPLATES,
  profileCanUseMediaKitTemplate,
  getProfileTemplateChangeUsage,
  getEffectivePlan,
  type MediaKitTemplate,
} from '../lib/plans';
import MediaKitPreview from '../components/mediaKitTemplates/MediaKitTemplates';
import {useAiTool} from '../hooks/useAiTool';
import {AiMarkdown} from '../components/AiMarkdown';

// Public media-kit pages live on the web at `rgossips.com/kit/[id]`. Slug
// resolution mirrors the web (`username → instagram_handle → user.id`) so
// the link the mobile app copies is the same one the web app shares.
const KIT_SHARE_ORIGIN = 'https://rgossips.com';

const formatCount = (n: number | undefined) => {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
};

const SERVICE_LABELS: Record<string, string> = {
  reels: 'Reels',
  stories: 'Stories',
  shorts: 'YouTube Shorts',
  posts: 'Static Posts',
  ugc: 'UGC Videos',
};

export default function InfluencerMediaKit() {
  const {t} = useTranslation();
  const {profile, user, refreshProfile} = useAuth();

  const [bio, setBio] = useState(profile?.bio || '');
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(bio);
  const [published, setPublished] = useState(
    !!profile?.media_kit_published,
  );
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Template state — `savedTemplate` is what's stored on the profile and
  // applied to the public shareable page; `previewTemplate` is the local
  // selection the creator is considering before pressing "Use this template".
  // Server enforces the plan + change-cap on save and we surface its reason
  // via `templateError`.
  const savedTemplate: string = profile?.media_kit_template || 'classic';
  const [previewTemplate, setPreviewTemplate] = useState<string>(savedTemplate);
  const [savingTemplate, setSavingTemplate] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string>('');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  useEffect(() => {
    // Re-sync local preview when the profile refreshes (e.g. after save).
    setPreviewTemplate(savedTemplate);
  }, [savedTemplate]);

  // Drives every templated chrome on the page — hero gradient, accent
  // chips, divider rules. Falls back to Classic if the saved template id
  // is somehow out of sync with MEDIA_KIT_TEMPLATES (older row, removed
  // template, etc.).
  const activeTemplate = useMemo<MediaKitTemplate>(
    () =>
      MEDIA_KIT_TEMPLATES.find(t => t.id === previewTemplate) ||
      MEDIA_KIT_TEMPLATES[0],
    [previewTemplate],
  );

  const name = profile?.full_name || 'Creator';
  const handle =
    profile?.instagram_handle || profile?.username || 'creator';
  const photo = useProfilePhoto();
  const categories = profile?.categories || [];
  const location = profile?.location || '';
  const followers = profile?.followers_count || 0;
  const following = profile?.follows_count || 0;
  const posts = profile?.media_count || 0;
  const services = profile?.services || [];
  const serviceRates = profile?.service_rates || {};
  const engagementRate = profile?.engagement_rate || 0;
  const demographics = profile?.audience_demographics || ({} as any);
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const primaryCategory =
    categories.slice(0, 2).join(' & ') || 'Creator';

  // Match web's slug fallback chain exactly: username → instagram_handle → user.id.
  // Without this the link 404s for creators who never set a username.
  const kitSlug =
    profile?.username || profile?.instagram_handle || user?.id || '';
  const shareUrl = `${KIT_SHARE_ORIGIN}/kit/${kitSlug}`;

  const updateProfile = useCallback(
    async (data: Record<string, any>) => {
      try {
        await invokeFn('update-profile', {
          userId: user?.id,
          table: 'influencer_profiles',
          ...data,
        });
      } catch {
        // Best-effort — autosave failures are silent so the user can keep
        // editing. Manual save buttons surface errors elsewhere.
      }
    },
    [user],
  );

  const handleBioSave = () => {
    setBio(bioDraft.trim());
    setEditingBio(false);
    updateProfile({bio: bioDraft.trim()});
  };

  // "Use as my bio" from the AI Media Kit Writer — applies the extracted Bio
  // section to local state + the profile, then refreshes the AuthContext
  // profile so every other surface sees the new bio.
  const handleAiBioSave = useCallback(
    async (newBio: string) => {
      setBio(newBio);
      setBioDraft(newBio);
      await updateProfile({bio: newBio});
      await refreshProfile();
    },
    [updateProfile, refreshProfile],
  );

  const handlePublish = async () => {
    if (publishing || published) return;
    setPublishing(true);
    await updateProfile({mediaKitPublished: true});
    setPublished(true);
    setPublishing(false);
  };

  const handleCopyLink = () => {
    Clipboard.setString(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      // iOS treats `message` and `url` as separate components and
      // concatenates them — passing the URL in both produced the same
      // link twice in the share sheet. Send the description in `message`
      // and the URL via `url` so iOS attaches it cleanly. Android ignores
      // `url` and only uses `message`, so we keep the URL inline there.
      await Share.share(
        Platform.OS === 'ios'
          ? {message: t('ScreensInfluencerMediaKit.shareMessage'), url: shareUrl}
          : {
              message: t('ScreensInfluencerMediaKit.shareMessageWithUrl', {
                url: shareUrl,
              }),
            },
      );
    } catch {}
  };

  // Persists the chosen template to the profile. The edge function enforces
  // the plan unlock AND the lifetime change cap on its side — both come
  // back as { error: "…" } which we surface inline rather than letting it
  // fail silently.
  const handleTemplateSave = useCallback(
    async (templateId: string) => {
      if (!user?.id) return;
      setSavingTemplate(templateId);
      setTemplateError('');
      try {
        const data = await invokeFn<{success?: boolean; error?: string}>(
          'update-profile',
          {
            userId: user.id,
            table: 'influencer_profiles',
            mediaKitTemplate: templateId,
          },
        );
        if (data?.error) {
          setTemplateError(data.error);
        }
      } catch (err: any) {
        // invokeFn throws on { error } responses — pull the message out
        // so plan / cap rejections still reach the user.
        setTemplateError(
          err?.message || t('ScreensInfluencerMediaKit.saveError'),
        );
      } finally {
        setSavingTemplate(null);
      }
    },
    [user?.id],
  );

  return (
    <InfluencerLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
      <ScrollView className="flex-1" style={{backgroundColor: '#F5F4F8'}} keyboardShouldPersistTaps="handled">
        {/* Template selector lives ABOVE the preview so it's always
            visible while the user explores layouts. */}
        <View className="px-4 pt-6 pb-3" style={{gap: 8}}>
          {/* Template selector — single card-shaped button that opens a
              modal. The modal hosts the full picker (preview tiles,
              plan locks, change-cap, save CTA). */}
          <TemplateSelectorButton
            profile={profile}
            activeTemplate={activeTemplate}
            savedTemplate={savedTemplate}
            onOpen={() => {
              setTemplateError('');
              setTemplateModalOpen(true);
            }}
            onUpgrade={openManagePlan}
          />

        </View>

        {/* Templated preview - picks one of 5 layouts based on previewTemplate. */}
        <MediaKitPreview
          templateId={previewTemplate}
          profile={{...profile, bio}}
          editingBio={editingBio}
          bioDraft={bioDraft}
          setBioDraft={setBioDraft}
          setEditingBio={setEditingBio}
          onBioSave={handleBioSave}
        />

        <View className="px-4 py-6" style={{gap: 16}}>

          {/* AI Media Kit Writer — mirror of the web AiMediaKitCard */}
          <AiMediaKitCard
            onUseBio={handleAiBioSave}
            onUpgrade={openManagePlan}
          />

          {/* Publish / Share Card */}
          {published ? (
            <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5" style={{gap: 12}}>
              <Text className="text-sm font-bold text-slate-900">
                {t('ScreensInfluencerMediaKit.shareYourMediaKit')}
              </Text>
              <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-100 p-3" style={{gap: 8}}>
                <Text
                  className="flex-1 text-xs text-slate-600 font-mono"
                  numberOfLines={1}>
                  {shareUrl}
                </Text>
                <Pressable onPress={handleCopyLink} className="p-2">
                  {copied ? (
                    <Check size={16} color="#16A34A" />
                  ) : (
                    <Copy size={16} color="#94A3B8" />
                  )}
                </Pressable>
              </View>
              <TouchableOpacity
                onPress={handleShare}
                className="items-center justify-center flex-row"
                style={{borderRadius: 12, height: 44, overflow: 'hidden'}}
              >
                <LinearGradient
                  colors={['#9810FA', '#E60076']}
                  style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                />
                <Share2 size={16} color="white" />
                <Text className="text-white font-bold text-sm ml-2">
                  {t('ScreensInfluencerMediaKit.share')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 items-center" style={{gap: 12}}>
              <View className="w-12 h-12 bg-purple-50 rounded-2xl items-center justify-center">
                <Share2 size={22} color="#9810FA" />
              </View>
              <Text className="text-sm font-bold text-slate-900">
                {t('ScreensInfluencerMediaKit.publishToShare')}
              </Text>
              <Text className="text-xs text-slate-500 text-center leading-relaxed">
                {t('ScreensInfluencerMediaKit.publishDescription')}
              </Text>
              <TouchableOpacity
                onPress={handlePublish}
                disabled={publishing}
                className="w-full items-center justify-center flex-row"
                style={{
                  borderRadius: 12,
                  height: 44,
                  overflow: 'hidden',
                  opacity: publishing ? 0.6 : 1,
                }}>
                <LinearGradient
                  colors={['#9810FA', '#E60076']}
                  style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                />
                {publishing && (
                  <ActivityIndicator
                    size="small"
                    color="white"
                    style={{marginRight: 8}}
                  />
                )}
                <Text className="text-white font-bold text-sm">
                  {publishing
                    ? t('ScreensInfluencerMediaKit.publishing')
                    : t('ScreensInfluencerMediaKit.publishMediaKit')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tips — padding + border on the wrapping View, gradient as an
              absolute background. BVLinearGradient has no Fabric support on
              RN 0.84 and a gradient that sizes itself from padding + children
              mis-sizes through the interop layer, so drive the size from a
              plain View. */}
          <View
            className="rounded-2xl border border-purple-100 p-5"
            style={{gap: 12, borderRadius: 16, overflow: 'hidden'}}>
            <LinearGradient
              colors={['#FAF5FF', '#FDF2F8']}
              style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
            />
            <Text className="text-sm font-bold text-slate-900">
              {t('ScreensInfluencerMediaKit.tipsTitle')}
            </Text>
            {[
              t('ScreensInfluencerMediaKit.tips.keepInstagram'),
              t('ScreensInfluencerMediaKit.tips.addCategories'),
              t('ScreensInfluencerMediaKit.tips.shareLink'),
            ].map(tip => (
              <View
                key={tip}
                className="flex-row items-start"
                style={{gap: 8}}>
                <Text className="text-purple-500 mt-0.5">✓</Text>
                <Text className="text-xs text-slate-600 flex-1">
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Template picker modal — same UX as before, just promoted off the
          main scroll so the page above is the live preview the user is
          choosing for. Closes on save and on backdrop tap. */}
      <Modal
        visible={templateModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setTemplateModalOpen(false)}>
        <Pressable
          onPress={() => setTemplateModalOpen(false)}
          className="flex-1 justify-end"
          style={{backgroundColor: 'rgba(0,0,0,0.55)'}}>
          {/* Stop taps inside the sheet from dismissing the modal */}
          <Pressable
            onPress={() => {}}
            className="bg-white rounded-t-[28px] px-5 pt-3 pb-6"
            style={{maxHeight: '85%'}}>
            {/* Drag handle */}
            <View className="items-center pb-2">
              <View className="w-10 h-1 rounded-full bg-slate-200" />
            </View>

            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center" style={{gap: 8}}>
                <LayoutTemplate size={18} color={activeTemplate.accent} />
                <Text className="text-base font-bold text-slate-900">
                  {t('ScreensInfluencerMediaKit.chooseTemplate')}
                </Text>
              </View>
              <Pressable
                onPress={() => setTemplateModalOpen(false)}
                hitSlop={10}>
                <XIcon size={20} color="#94A3B8" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TemplatePicker
                profile={profile}
                previewTemplate={previewTemplate}
                savedTemplate={savedTemplate}
                savingTemplate={savingTemplate}
                templateError={templateError}
                onPreview={(id: string) => {
                  setTemplateError('');
                  setPreviewTemplate(id);
                }}
                onSave={async (id: string) => {
                  await handleTemplateSave(id);
                  setTemplateModalOpen(false);
                }}
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </InfluencerLayout>
  );
}

// AI Media Kit v2 — mirror of the web AiMediaKitCard. Turns the stat sheet
// into a sales page: a positioning line, a bio in the creator's voice, and a
// plain-language audience narrative from their demographics (tool:
// media_kit). Only the Bio section can be applied to the profile in one
// click; the rest is copy-and-paste media-kit copy.
function AiMediaKitCard({
  onUseBio,
  onUpgrade,
}: {
  onUseBio: (bio: string) => void;
  onUpgrade: () => void;
}) {
  const {t} = useTranslation();
  const {generate, loading, result, error, remaining, limitReached} =
    useAiTool();
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  const run = () => generate({tool: 'media_kit', inputs: {}});

  const copy = () => {
    if (!result) return;
    Clipboard.setString(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // The media_kit prompt returns three labelled sections (**Positioning**,
  // **Bio**, **Audience**). Only the Bio section becomes the profile bio —
  // positioning + audience narrative are media-kit copy, and the bio field
  // is capped at 500 chars. Prefer the explicit label; fall back to the
  // middle block for any older unlabelled generation. (Extraction logic is
  // a byte-for-byte port of the web version.)
  const useBio = () => {
    if (!result) return;
    const labelled = result.match(
      /\*\*\s*Bio\s*\*\*:?\s*\n?([\s\S]*?)(?=\n\s*\*\*|$)/i,
    );
    let bioBlock: string;
    if (labelled) {
      bioBlock = labelled[1].trim();
    } else {
      const blocks = result
        .split(/\n\s*\n/)
        .map(b => b.trim())
        .filter(Boolean);
      bioBlock = blocks.length >= 2 ? blocks[1] : result.trim();
    }
    // Strip markdown markers (the bio is stored as plain text) and cap at
    // 500 chars (matches the editor + server guard).
    const plain = bioBlock
      .replace(/\*\*|__|^#+\s*/gm, '')
      .replace(/^[-*•]\s+/gm, '');
    onUseBio(plain.slice(0, 500));
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <View
      className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5"
      style={{gap: 12}}>
      <View className="flex-row items-center" style={{gap: 8}}>
        <View
          className="items-center justify-center"
          style={{width: 32, height: 32, borderRadius: 12, overflow: 'hidden'}}>
          <LinearGradient
            colors={['#9810FA', '#E60076']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
          />
          <Sparkles size={15} color="white" />
        </View>
        <Text className="text-sm font-bold text-slate-900 flex-1">
          {t('ScreensInfluencerMediaKit.ai.title')}
        </Text>
      </View>
      <Text className="text-[11px] text-slate-500 leading-relaxed">
        {t('ScreensInfluencerMediaKit.ai.subtitle')}
      </Text>

      {!limitReached && (
        <TouchableOpacity
          onPress={run}
          disabled={loading}
          className="w-full items-center justify-center flex-row"
          style={{
            borderRadius: 12,
            height: 42,
            overflow: 'hidden',
            opacity: loading ? 0.6 : 1,
            gap: 8,
          }}>
          <LinearGradient
            colors={['#9810FA', '#E60076']}
            style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
          />
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Sparkles size={14} color="white" />
          )}
          <Text className="text-white font-bold text-xs">
            {loading
              ? t('ScreensInfluencerMediaKit.ai.writing')
              : result
                ? t('ScreensInfluencerMediaKit.ai.regenerate')
                : t('ScreensInfluencerMediaKit.ai.generate')}
          </Text>
        </TouchableOpacity>
      )}

      {!!limitReached && (
        <View className="bg-slate-50 rounded-xl p-3 items-center" style={{gap: 8}}>
          <Text className="text-[11px] text-slate-600 text-center">
            {t('ScreensInfluencerMediaKit.ai.limit')}
          </Text>
          <TouchableOpacity
            onPress={onUpgrade}
            className="items-center justify-center px-3"
            style={{height: 32, borderRadius: 8, backgroundColor: '#9810FA'}}>
            <Text className="text-white text-[11px] font-bold">
              {t('ScreensInfluencerMediaKit.ai.upgrade')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!!error && !limitReached && (
        <Text className="text-[11px] text-rose-500">{error}</Text>
      )}

      {!!result && (
        <View
          className="rounded-xl p-3 border border-purple-50"
          style={{gap: 8, backgroundColor: 'rgba(152,16,250,0.04)'}}>
          <AiMarkdown text={result} textStyle={{fontSize: 12, lineHeight: 18}} />
          <View className="flex-row items-center" style={{gap: 8}}>
            <TouchableOpacity
              onPress={useBio}
              className="flex-1 items-center justify-center"
              style={{height: 32, borderRadius: 8, backgroundColor: '#9810FA'}}>
              <Text className="text-white text-[11px] font-bold">
                {applied
                  ? t('ScreensInfluencerMediaKit.ai.applied')
                  : t('ScreensInfluencerMediaKit.ai.useBio')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={copy}
              className="flex-row items-center justify-center px-3 border border-slate-200"
              style={{height: 32, borderRadius: 8, gap: 4}}>
              {copied ? (
                <Check size={12} color="#16A34A" />
              ) : (
                <Copy size={12} color="#64748B" />
              )}
              <Text className="text-[11px] font-bold text-slate-500">
                {copied
                  ? t('ScreensInfluencerMediaKit.ai.copied')
                  : t('ScreensInfluencerMediaKit.ai.copy')}
              </Text>
            </TouchableOpacity>
          </View>
          <Text className="text-[10px] text-slate-400 leading-snug">
            {t('ScreensInfluencerMediaKit.ai.bioHint')}
          </Text>
          {typeof remaining === 'number' && Number.isFinite(remaining) && (
            <Text className="text-[10px] text-slate-400">
              {t('ScreensInfluencerMediaKit.ai.remaining', {count: remaining})}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// Card-shaped button that summarises the active template and opens the
// modal picker on tap. Lives in the main scroll so the preview hero above
// it is always the layout the creator's link will render.
function TemplateSelectorButton({
  profile,
  activeTemplate,
  savedTemplate,
  onOpen,
  onUpgrade,
}: {
  profile: any;
  activeTemplate: MediaKitTemplate;
  savedTemplate: string;
  onOpen: () => void;
  onUpgrade: () => void;
}) {
  const {t} = useTranslation();
  const isLive = activeTemplate.id === savedTemplate;

  // Compute the same plan / cap state TemplatePicker used to compute. The
  // upgrade CTA used to live inside the modal picker; the user wanted it
  // surfaced out here so it's visible whether or not the sheet is open.
  const canUseActive = profileCanUseMediaKitTemplate(
    profile,
    activeTemplate.id,
  );
  const usage = getProfileTemplateChangeUsage(profile);
  const isUnlimited = !isFinite(usage.limit);
  const isCapped = !isUnlimited && usage.remaining <= 0;
  const anyLocked = MEDIA_KIT_TEMPLATES.some(
    (t: MediaKitTemplate) => !profileCanUseMediaKitTemplate(profile, t.id),
  );

  // Priority: contextual (active template is locked) → capped → general.
  // If none apply, there's nothing to upgrade for, so the row hides.
  let upgradeLabel: string | null = null;
  if (!canUseActive) {
    upgradeLabel = t('ScreensInfluencerMediaKit.upgradeToUse', {
      plan: activeTemplate.minPlan,
      template: activeTemplate.label,
    });
  } else if (isCapped) {
    upgradeLabel = t('ScreensInfluencerMediaKit.upgradeUnlimitedSwitches');
  } else if (anyLocked) {
    upgradeLabel = t('ScreensInfluencerMediaKit.upgradeUnlockMore');
  }

  return (
    <View style={{gap: 8}}>
      <Pressable
        onPress={onOpen}
        className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex-row items-center"
        style={{gap: 12}}>
        <LinearGradient
          colors={activeTemplate.previewColors}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#f1f5f9',
          }}
        />
        <View className="flex-1">
          <View className="flex-row items-center" style={{gap: 6}}>
            <Text
              className="text-[10px] font-black uppercase tracking-widest"
              style={{color: activeTemplate.accent}}>
              {t('ScreensInfluencerMediaKit.templateLabel')}
            </Text>
            {isLive && (
              <View className="bg-emerald-50 px-1.5 py-0.5 rounded-full">
                <Text className="text-[9px] font-black text-emerald-600 tracking-widest uppercase">
                  {t('ScreensInfluencerMediaKit.live')}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-sm font-bold text-slate-900 mt-0.5" numberOfLines={1}>
            {activeTemplate.label}
          </Text>
          <Text className="text-[11px] text-slate-400" numberOfLines={1}>
            {t('ScreensInfluencerMediaKit.selectorSubtitle')}
          </Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </Pressable>

      {/* Upgrade CTAs — used to sit inside the picker modal; moved out
          here so they're visible alongside the selector card. */}
      {upgradeLabel && (
        <Pressable
          onPress={onUpgrade}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: '#fffbeb',
            borderWidth: 1,
            borderColor: '#fde68a',
          }}>
          <Crown size={12} color="#b45309" />
          <Text className="text-[12px] font-bold text-amber-800">
            {upgradeLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function SectionCard({
  title,
  accent = '#E60076',
  children,
}: {
  title: string;
  /** Falls back to the Classic accent so callers can omit it. */
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <View className="flex-row items-center mb-3" style={{gap: 8}}>
        <View
          style={{width: 20, height: 2, borderRadius: 100, backgroundColor: accent}}
        />
        <Text className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function SocialStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View
      className="flex-1 min-w-[45%] flex-row items-center bg-slate-50 border border-slate-100 rounded-xl p-3"
      style={{gap: 12}}>
      <View className="p-2 bg-white rounded-xl border border-slate-100">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-[10px] text-slate-400 font-bold uppercase">
          {label}
        </Text>
      </View>
      <Text className="text-lg font-black text-slate-800">{value}</Text>
    </View>
  );
}

// Inline mirror of the web sidebar's TemplatePicker — five templates with
// plan-locks, lifetime change cap, and a save CTA that routes plan-locked
// templates to an Upgrade prompt instead of attempting a save.
function TemplatePicker({
  profile,
  previewTemplate,
  savedTemplate,
  savingTemplate,
  templateError,
  onPreview,
  onSave,
}: {
  profile: any;
  previewTemplate: string;
  savedTemplate: string;
  savingTemplate: string | null;
  templateError: string;
  onPreview: (id: string) => void;
  onSave: (id: string) => void;
}) {
  const {t} = useTranslation();
  const effectivePlan = getEffectivePlan(profile);
  const hasUnsavedPreview = previewTemplate !== savedTemplate;
  const previewMeta = MEDIA_KIT_TEMPLATES.find(
    (t: MediaKitTemplate) => t.id === previewTemplate,
  );
  const canUsePreview = profileCanUseMediaKitTemplate(profile, previewTemplate);
  const usage = getProfileTemplateChangeUsage(profile);
  const isUnlimited = !isFinite(usage.limit);
  const isCapped = !isUnlimited && usage.remaining <= 0;
  const previewIsLive = previewTemplate === savedTemplate;

  return (
    <View
      className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
      style={{gap: 12}}>
      <View className="flex-row items-center">
        <LayoutTemplate size={16} color="#9810FA" />
        <Text className="text-sm font-bold text-slate-900 ml-2">
          {t('ScreensInfluencerMediaKit.templates')}
        </Text>
        <View className="flex-1" />
        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {effectivePlan}
        </Text>
      </View>
      <Text className="text-[11px] text-slate-500 leading-snug">
        {t('ScreensInfluencerMediaKit.pickerSubtitle')}
      </Text>

      <View style={{gap: 8}}>
        {MEDIA_KIT_TEMPLATES.map((tpl: MediaKitTemplate) => {
          const locked = !profileCanUseMediaKitTemplate(profile, tpl.id);
          const isSaved = savedTemplate === tpl.id;
          const isPreviewing = previewTemplate === tpl.id;
          return (
            <Pressable
              key={tpl.id}
              onPress={() => {
                // Locked templates can't be previewed — the user can only
                // try a layout their plan unlocks. The lock badge below
                // shows why; the upgrade pill outside the modal carries
                // the upgrade CTA.
                if (locked) return;
                onPreview(tpl.id);
              }}
              disabled={locked}
              className="rounded-xl border p-2.5 flex-row items-center"
              style={{
                gap: 12,
                borderColor: isPreviewing ? '#c084fc' : '#f1f5f9',
                backgroundColor: isPreviewing ? 'rgba(168,85,247,0.05)' : '#fff',
                // Mute locked tiles so the disabled state reads visually
                // before the user even tries to tap.
                opacity: locked ? 0.55 : 1,
              }}>
              <LinearGradient
                colors={tpl.previewColors}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#f1f5f9',
                }}
              />
              <View className="flex-1">
                <View className="flex-row items-center" style={{gap: 6}}>
                  <Text
                    className="text-xs font-bold text-slate-800"
                    numberOfLines={1}>
                    {tpl.label}
                  </Text>
                  {isSaved && (
                    <View className="bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      <Text className="text-[9px] font-black text-emerald-600 tracking-widest uppercase">
                        {t('ScreensInfluencerMediaKit.live')}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  className="text-[10px] text-slate-400"
                  numberOfLines={1}>
                  {tpl.description}
                </Text>
              </View>
              {locked ? (
                <View
                  className="flex-row items-center bg-amber-50 px-2 py-1 rounded-full"
                  style={{gap: 4}}>
                  <Lock size={9} color="#d97706" />
                  <Text className="text-[9px] font-black uppercase tracking-wider text-amber-700">
                    {tpl.minPlan}
                  </Text>
                </View>
              ) : isPreviewing ? (
                <Check size={14} color="#9810FA" />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* Action row — Save when the template is available, an info line
          when it's plan-locked. The upgrade CTAs themselves now live on
          the TemplateSelectorButton outside this modal so they're visible
          without having to scroll inside a sheet. */}
      {hasUnsavedPreview && !canUsePreview && (
        <View
          className="rounded-xl px-3 py-2.5 items-center"
          style={{
            backgroundColor: 'rgba(245,158,11,0.08)',
            borderWidth: 1,
            borderColor: 'rgba(245,158,11,0.25)',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
          }}>
          <Lock size={11} color="#b45309" />
          <Text className="text-[11px] font-bold text-amber-800">
            {t('ScreensInfluencerMediaKit.templateNeedsPlan', {
              template: previewMeta?.label,
              plan: previewMeta?.minPlan,
            })}
          </Text>
        </View>
      )}
      {hasUnsavedPreview && canUsePreview && (
        <Pressable
          onPress={() => onSave(previewTemplate)}
          disabled={
            savingTemplate === previewTemplate || (isCapped && !previewIsLive)
          }
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 10,
            borderRadius: 12,
            overflow: 'hidden',
            opacity:
              savingTemplate === previewTemplate ||
              (isCapped && !previewIsLive)
                ? 0.6
                : 1,
          }}>
          <LinearGradient
            colors={['#9810FA', '#E60076']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
          />
          {savingTemplate === previewTemplate && (
            <Loader2 size={14} color="#fff" />
          )}
          <Text className="text-white text-xs font-bold">
            {savingTemplate === previewTemplate
              ? t('ScreensInfluencerMediaKit.saving')
              : t('ScreensInfluencerMediaKit.useTemplate', {
                  template:
                    previewMeta?.label ||
                    t('ScreensInfluencerMediaKit.thisTemplate'),
                })}
          </Text>
        </Pressable>
      )}
      {!hasUnsavedPreview && (
        <Text className="text-[10px] text-slate-400 text-center">
          {t('ScreensInfluencerMediaKit.isLiveTemplate', {
            template: previewMeta?.label,
          })}
        </Text>
      )}

      {!!templateError && (
        <View className="bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
          <Text className="text-[11px] text-rose-600 font-bold leading-snug">
            {templateError}
          </Text>
        </View>
      )}

      {/* Lifetime change-cap usage line. Starter (cap = 0) hides — the
          upgrade CTAs above cover that case already. */}
      {!isUnlimited && usage.limit > 0 && (
        <View
          className="rounded-lg px-3 py-2 border"
          style={{
            borderColor: isCapped ? '#fecdd3' : '#f1f5f9',
            backgroundColor: isCapped ? '#fff1f2' : '#f8fafc',
          }}>
          <Text
            className="text-[11px] font-bold leading-snug"
            style={{color: isCapped ? '#e11d48' : '#475569'}}>
            {isCapped
              ? t('ScreensInfluencerMediaKit.capUsedAll', {
                  count: usage.limit,
                })
              : t('ScreensInfluencerMediaKit.capRemaining', {
                  count: usage.limit,
                  remaining: usage.remaining,
                  plan: effectivePlan,
                })}
          </Text>
        </View>
      )}
      {isUnlimited && effectivePlan === 'elite' && (
        <Text className="text-[10px] text-emerald-600 font-bold text-center">
          {t('ScreensInfluencerMediaKit.unlimitedSwitches')}
        </Text>
      )}
    </View>
  );
}
