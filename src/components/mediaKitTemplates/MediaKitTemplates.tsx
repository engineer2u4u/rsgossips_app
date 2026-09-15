// Five mobile media-kit templates ported from the web's
// src/components/mediaKitTemplates/ folder. Each template renders the same
// shape of profile data with a distinctly different layout / chrome — so
// picking a template in the picker actually changes the preview, not just
// the colour palette.
//
// Mobile constraints vs the web port:
// - No backdrop-filter blur (no expo-blur installed); Glass Blue uses
//   semi-transparent panels instead of a real frost.
// - No radial-gradient (LinearGradient only); decorative blooms in
//   Glass Blue / Bento Sunset are approximated with extra overlay shapes.
// - No bundled serif / mono / Archivo Black fonts; we lean on weight +
//   tracking + uppercase to suggest the editorial / brutalist vibes.

import React from 'react';
import {useTranslation} from 'react-i18next';
import {
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  Linking,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Instagram,
  MapPin,
  Camera,
  Pencil,
  Check,
  X as XIcon,
  ExternalLink,
  Heart,
  MessageCircle,
} from 'lucide-react-native';
import {
  readProfile,
  readDemographics,
  readSocials,
  readInsights,
  readHeadlineStats,
  toServiceLabel,
  formatCount,
  type InsightItem,
  type NormalisedInsights,
  type TemplateProps,
} from './shared';
import {truncateText} from '../../lib/text';

// Custom font families bundled via assets/fonts/ and registered through
// react-native.config.js + react-native-asset. fontFamily on RN must match
// either the file basename (Android) or the PostScript name (iOS) — for
// these Google Fonts both line up with the filename stems below. Run
// `npx react-native-asset` again after adding/removing TTFs.
const FONTS = {
  SERIF_BOLD: 'Cardo-Bold',
  SERIF_ITALIC: 'Cardo-Italic',
  SERIF: 'Cardo-Regular',
  BLOCK: 'ArchivoBlack-Regular',
  MONO: 'SpaceMono-Regular',
  MONO_BOLD: 'SpaceMono-Bold',
} as const;

// ─────────────────────────────────────────────────────────────────────────
// CLASSIC — purple→pink gradient hero, white section cards, slate stats.
// Mirrors web's TemplateClassic.jsx + supports inline bio editing.
// ─────────────────────────────────────────────────────────────────────────
export function TemplateClassic({
  profile,
  editingBio,
  bioDraft = '',
  setBioDraft,
  setEditingBio,
  onBioSave,
}: TemplateProps) {
  const {t} = useTranslation();
  const p = readProfile(profile);
  const demo = readDemographics(p.demographics, p.location);
  const socials = readSocials(p.followers);
  const ins = readInsights(profile);
  // Reel views · Viewers · Posts · Likes — see readHeadlineStats.
  const hs = readHeadlineStats(profile);
  const last30 = t('MediaKitInsights.headline.last30', {days: ins.days});

  return (
    <View>
      {/* HERO — padding/layout on the wrapper View so iOS sizes the row
          against the touchable bounds, not against the gradient view's
          intrinsic baseline. Gradient is an absolute background fill. */}
      <View
        className="px-5 py-8 flex-row items-center"
        style={{gap: 16, overflow: 'hidden'}}>
        <LinearGradient
          colors={['#9810FA', '#E60076', '#f472b6']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
        />
        <View
          className="w-24 h-24 rounded-full overflow-hidden"
          style={{borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)'}}>
          {p.photo ? (
            <Image source={{uri: p.photo}} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="w-full h-full bg-white/20 items-center justify-center">
              <Text className="text-white text-2xl font-bold">{p.initials}</Text>
            </View>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-2xl font-black text-white" numberOfLines={1}>
            {p.name}
          </Text>
          <View className="flex-row flex-wrap mt-2" style={{gap: 6}}>
            <View
              className="flex-row items-center bg-white/90 px-3 py-1 rounded-full"
              style={{gap: 4, flexShrink: 1, maxWidth: '100%'}}>
              <Camera size={12} color="#64748B" />
              <Text
                className="text-[10px] font-bold text-slate-700"
                style={{flexShrink: 1}}>
                {p.primaryCategory}
              </Text>
            </View>
            {!!p.location && (
              <View
                className="flex-row items-center bg-white/90 px-3 py-1 rounded-full"
                style={{gap: 4, flexShrink: 1, maxWidth: '100%'}}>
                <MapPin size={12} color="#EC4899" />
                <Text
                  className="text-[10px] font-bold text-slate-700"
                  style={{flexShrink: 1}}>
                  {p.location}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View className="px-4 py-6" style={{gap: 16}}>
        {/* ABOUT — only template with inline bio edit */}
        <ClassicCard title={t('MediaKitTemplatesMediaKitTemplates.aboutMe')}>
          {editingBio && setBioDraft && setEditingBio && onBioSave ? (
            <View style={{gap: 8}}>
              <TextInput
                value={bioDraft}
                onChangeText={setBioDraft}
                placeholder={t('MediaKitTemplatesMediaKitTemplates.bioPlaceholder')}
                maxLength={500}
                multiline
                className="text-sm text-slate-700 bg-white border border-purple-200 rounded-xl p-3"
                style={{minHeight: 80}}
              />
              <View className="flex-row items-center justify-between">
                <Text className="text-[10px] text-slate-400">{bioDraft.length}/500</Text>
                <View className="flex-row" style={{gap: 8}}>
                  <Pressable
                    onPress={() => setEditingBio(false)}
                    className="flex-row items-center px-3 py-1.5 rounded-lg"
                    style={{gap: 4}}>
                    <XIcon size={14} color="#64748B" />
                    <Text className="text-xs font-semibold text-slate-500">
                      {t('MediaKitTemplatesMediaKitTemplates.cancel')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={onBioSave}
                    className="flex-row items-center px-3 py-1.5"
                    style={{gap: 4, borderRadius: 8, overflow: 'hidden'}}>
                    <LinearGradient
                      colors={['#9810FA', '#E60076']}
                      style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                    />
                    <Check size={14} color="white" />
                    <Text className="text-xs font-bold text-white">
                      {t('MediaKitTemplatesMediaKitTemplates.save')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={
                setBioDraft && setEditingBio
                  ? () => {
                      setBioDraft(p.bio);
                      setEditingBio(true);
                    }
                  : undefined
              }>
              <View className="flex-row items-start">
                <Text className="text-sm text-slate-600 leading-relaxed flex-1">
                  {p.bio}
                </Text>
                {!!setEditingBio && (
                  <Pencil size={13} color="#94A3B8" style={{marginLeft: 8}} />
                )}
              </View>
            </Pressable>
          )}
        </ClassicCard>

        <ClassicCard title={t('MediaKitTemplatesMediaKitTemplates.expertise')}>
          <View className="flex-row flex-wrap" style={{gap: 8}}>
            {(p.categories.length > 0
              ? p.categories
              : [t('MediaKitTemplatesMediaKitTemplates.contentCreation')]
            ).map(
              (cat: string) => (
                <View
                  key={cat}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
                  <Text className="text-xs font-bold text-slate-700">{cat}</Text>
                </View>
              ),
            )}
          </View>
        </ClassicCard>

        {p.languages.length > 0 && (
          <ClassicCard title={t('MediaKitTemplatesMediaKitTemplates.languages')}>
            <View className="flex-row flex-wrap" style={{gap: 8}}>
              {p.languages.map((lang: string) => (
                <View
                  key={lang}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
                  <Text className="text-xs font-bold text-slate-700">{lang}</Text>
                </View>
              ))}
            </View>
          </ClassicCard>
        )}

        {p.services.length > 0 && (
          <ClassicCard title={t('MediaKitTemplatesMediaKitTemplates.servicesRates')}>
            <View style={{gap: 8}}>
              {p.services.map((svcId: string) => (
                <View
                  key={svcId}
                  className="flex-row items-center justify-between py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Text className="text-sm font-semibold text-slate-700">
                    {toServiceLabel(svcId)}
                  </Text>
                  <Text className="text-sm font-black text-slate-500">
                    {p.serviceRates[svcId]
                      ? `₹${Number(p.serviceRates[svcId]).toLocaleString('en-IN')}`
                      : t('MediaKitTemplatesMediaKitTemplates.onRequest')}
                  </Text>
                </View>
              ))}
            </View>
          </ClassicCard>
        )}

        <ClassicCard title={t('MediaKitTemplatesMediaKitTemplates.whosWatching')}>
          <ClassicDemo demo={demo} hasData={!!p.demographics?.topCities?.length} />
        </ClassicCard>

        <ClassicCard title={t('MediaKitTemplatesMediaKitTemplates.socialMedia')}>
          <View className="flex-row flex-wrap" style={{gap: 8}}>
            {socials.map(s => (
              <ClassicSocial key={s.key} label={s.label} value={s.value} />
            ))}
          </View>
        </ClassicCard>

        <ClassicCard title={t('MediaKitTemplatesMediaKitTemplates.performance')}>
          <Text className="text-xl font-black text-slate-900 mb-4">
            {t('MediaKitTemplatesMediaKitTemplates.perfTitlePrefix')}
            <Text style={{color: '#EC4899'}}>
              {t('MediaKitTemplatesMediaKitTemplates.perfTitleHighlight')}
            </Text>
            {t('MediaKitTemplatesMediaKitTemplates.perfTitleSuffix')}
          </Text>
          <View className="flex-row flex-wrap" style={{gap: 8}}>
            <ClassicStat
              label={t('MediaKitInsights.headline.viewers')}
              value={hs.viewers.display}
              sub={last30}
            />
            <View
              className="flex-1 min-w-[45%] rounded-2xl p-4 overflow-hidden"
              style={{minHeight: 90}}>
              <LinearGradient
                colors={['#EC4899', '#A855F7']}
                style={{position: 'absolute', inset: 0}}
              />
              <Text className="text-[10px] font-bold text-white/80 uppercase tracking-wider mb-1">
                {t('MediaKitInsights.headline.reelViews')}
              </Text>
              <Text className="text-2xl font-black text-white" numberOfLines={1} adjustsFontSizeToFit>
                {hs.reelViews.display}
              </Text>
              <Text className="text-[10px] text-white/70 mt-1">{last30}</Text>
            </View>
            <ClassicStat
              label={t('MediaKitInsights.headline.posts')}
              value={hs.posts.display}
              sub={t('MediaKitInsights.headline.postsSub')}
            />
            <ClassicStat
              label={t('MediaKitInsights.headline.likes')}
              value={hs.likes.display}
              sub={last30}
            />
          </View>
          <ClassicInsights ins={ins} />
        </ClassicCard>

        {p.topReels.length > 0 && (
          <ClassicCard title={t('MediaKitTemplatesMediaKitTemplates.topContent')}>
            <TopContentGrid reels={p.topReels} />
          </ClassicCard>
        )}

        <View className="flex-row items-center justify-between py-4 border-t border-slate-100">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t('MediaKitTemplatesMediaKitTemplates.generatedOn')}
          </Text>
          <Text className="text-[10px] font-bold text-slate-300">recentgossips.com</Text>
        </View>
      </View>
    </View>
  );
}

function ClassicCard({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <View className="flex-row items-center mb-3" style={{gap: 8}}>
        <LinearGradient
          colors={['#9810FA', '#EC4899']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={{width: 20, height: 2, borderRadius: 100}}
        />
        <Text className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function ClassicSocial({label, value}: {label: string; value: string}) {
  return (
    <View
      className="flex-1 min-w-[45%] flex-row items-center bg-slate-50 border border-slate-100 rounded-xl p-3"
      style={{gap: 12}}>
      <View className="p-2 bg-white rounded-xl border border-slate-100">
        <Instagram size={18} color="#EC4899" />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] text-slate-400 font-bold uppercase">{label}</Text>
      </View>
      <Text className="text-lg font-black text-slate-800">{value}</Text>
    </View>
  );
}

function ClassicStat({label, value, sub}: {label: string; value: string; sub: string}) {
  return (
    <View
      className="flex-1 min-w-[45%] bg-slate-50 border border-slate-200 rounded-2xl p-4"
      style={{minHeight: 90}}>
      <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </Text>
      <Text className="text-2xl font-black text-slate-900">{value}</Text>
      <Text className="text-[10px] text-slate-400 mt-1">{sub}</Text>
    </View>
  );
}

function ClassicDemo({
  demo,
  hasData,
}: {
  demo: ReturnType<typeof readDemographics>;
  hasData: boolean;
}) {
  const {t} = useTranslation();
  return (
    <View style={{gap: 16}}>
      <View>
        <Text className="text-xs font-black text-slate-800 uppercase mb-3">
          {t('MediaKitTemplatesMediaKitTemplates.topCities')}
        </Text>
        <View style={{gap: 8}}>
          {demo.topCities.map(c => (
            <DemoBar key={c.name} label={c.name} pct={c.pct} />
          ))}
        </View>
      </View>
      <View>
        <Text className="text-xs font-black text-slate-800 uppercase mb-3">
          {t('MediaKitTemplatesMediaKitTemplates.ageGender')}
        </Text>
        <View style={{gap: 8}}>
          {demo.ageRanges.map(a => (
            <DemoBar key={a.range} label={a.range} pct={a.pct} short />
          ))}
        </View>
        <View className="flex-row items-center mt-4" style={{gap: 12}}>
          <View style={{gap: 4}}>
            <View className="flex-row items-center" style={{gap: 6}}>
              <View className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <Text className="text-[11px] font-bold text-slate-600">
                {t('MediaKitTemplatesMediaKitTemplates.genderFemale', {
                  pct: demo.gender.female,
                })}
              </Text>
            </View>
            <View className="flex-row items-center" style={{gap: 6}}>
              <View className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              <Text className="text-[11px] font-bold text-slate-600">
                {t('MediaKitTemplatesMediaKitTemplates.genderMale', {
                  pct: demo.gender.male,
                })}
              </Text>
            </View>
            {demo.gender.other > 0 && (
              <View className="flex-row items-center" style={{gap: 6}}>
                <View className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <Text className="text-[11px] font-bold text-slate-600">
                  {t('MediaKitTemplatesMediaKitTemplates.genderOther', {
                    pct: demo.gender.other,
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      {demo.topCountries.length > 0 && (
        <View>
          <Text className="text-xs font-black text-slate-800 uppercase mb-3">
            {t('MediaKitTemplatesMediaKitTemplates.topCountries')}
          </Text>
          <View style={{gap: 8}}>
            {demo.topCountries.map(c => (
              <DemoBar key={c.name} label={c.name} pct={c.pct} short />
            ))}
          </View>
        </View>
      )}
      {!hasData && (
        <Text className="text-[10px] text-slate-400 italic">
          {t('MediaKitTemplatesMediaKitTemplates.demoEmpty')}
        </Text>
      )}
    </View>
  );
}

function DemoBar({label, pct, short}: {label: string; pct: number; short?: boolean}) {
  return (
    <View className="flex-row items-center" style={{gap: 8}}>
      <Text
        className="text-xs font-semibold text-slate-600"
        style={{width: short ? 50 : 80}}
        numberOfLines={1}>
        {label}
      </Text>
      <View className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={{width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 100}}
        />
      </View>
      <Text
        numberOfLines={1}
        className="text-xs font-bold text-slate-500 text-right"
        style={{width: 40}}>
        {pct}%
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// GLASS BLUE — editorial frosted layout. Soft blue gradient backdrop with
// stacked translucent panels. Read-only (bio edits stay in Classic).
// ─────────────────────────────────────────────────────────────────────────
export function TemplateGlassBlue({profile}: TemplateProps) {
  const {t} = useTranslation();
  const p = readProfile(profile);
  const demo = readDemographics(p.demographics, p.location);
  const socials = readSocials(p.followers);
  const ins = readInsights(profile);
  // Reel views · Viewers · Posts · Likes — see readHeadlineStats.
  const hs = readHeadlineStats(profile);

  // RN has no backdrop-filter; we use semi-opaque white panels over a
  // gradient base to suggest the same frosted vibe.
  const glassBg = 'rgba(226,239,251,0.55)';
  const glassBorder = 'rgba(255,255,255,0.7)';
  const ink = '#0e2a44';
  const accent = '#1564d6';

  return (
    // Wrapping View carries the size; the gradient is an absolute background.
    // BVLinearGradient has no Fabric support on RN 0.84 and a gradient that
    // sizes itself from its children mis-sizes through the interop layer
    // (same fix as the Classic hero above).
    <View style={{minHeight: 200, overflow: 'hidden'}}>
      <LinearGradient
        colors={['#dce9f8', '#bcd6ef', '#a4c7e9']}
        start={{x: 0.2, y: 0}}
        end={{x: 1, y: 1}}
        style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
      />
      <View className="px-4 py-7" style={{gap: 14}}>
        {/* HEADER */}
        <View
          style={{
            backgroundColor: glassBg,
            borderWidth: 1,
            borderColor: glassBorder,
            borderRadius: 22,
            padding: 22,
          }}>
          <Text style={{color: ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.5}}>
            {p.name}
          </Text>
          <Text style={{color: accent, fontWeight: '600', marginTop: 4}}>@{p.handle}</Text>
          <Text style={{color: ink, fontWeight: '500', marginTop: 10, lineHeight: 20}}>
            "{truncateText(p.bio.split('\n')[0], 110)}"
          </Text>
          <Text style={{color: '#48657e', fontSize: 13, fontWeight: '500', marginTop: 4}}>
            {p.primaryCategory}
            {p.location ? ` · ${p.location}` : ''}
          </Text>
          <View className="flex-row flex-wrap mt-3" style={{gap: 6}}>
            {p.categories.slice(0, 6).map((cat: string) => (
              <View
                key={cat}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.55)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.7)',
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                }}>
                <Text style={{color: ink, fontSize: 12, fontWeight: '600'}}>{cat}</Text>
              </View>
            ))}
          </View>
          {p.languages.length > 0 && (
            <>
              <View style={{height: 12}} />
              <GlassSubhead
                text={t('MediaKitTemplatesMediaKitTemplates.languages')}
              />
              <View className="flex-row flex-wrap" style={{gap: 6}}>
                {p.languages.map((lang: string) => (
                  <View
                    key={lang}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.55)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.7)',
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                    }}>
                    <Text style={{color: ink, fontSize: 12, fontWeight: '600'}}>
                      {lang}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* HEADLINE STATS — three columns split by vertical rules */}
        <View
          style={{
            backgroundColor: glassBg,
            borderWidth: 1,
            borderColor: glassBorder,
            borderRadius: 22,
            paddingVertical: 18,
            flexDirection: 'row',
          }}>
          <GlassStat
            n={formatCount(p.followers)}
            l={t('MediaKitTemplatesMediaKitTemplates.followers')}
          />
          <GlassDivider />
          <GlassStat
            n={hs.reelViews.display}
            l={t('MediaKitInsights.headline.reelViews')}
          />
          <GlassDivider />
          <GlassStat
            n={hs.posts.display}
            l={t('MediaKitInsights.headline.posts')}
          />
        </View>
        <View
          style={{
            backgroundColor: glassBg,
            borderWidth: 1,
            borderColor: glassBorder,
            borderRadius: 22,
            paddingVertical: 18,
            flexDirection: 'row',
          }}>
          <GlassStat
            n={hs.viewers.display}
            l={t('MediaKitInsights.headline.viewers')}
          />
          <GlassDivider />
          <GlassStat
            n={hs.likes.display}
            l={t('MediaKitInsights.headline.likes')}
          />
        </View>

        {/* LAST 30 DAYS — Instagram account totals */}
        <GlassInsights ins={ins} />

        {/* SERVICES */}
        {p.services.length > 0 && (
          <GlassPanel title={t('MediaKitTemplatesMediaKitTemplates.services')}>
            {p.services.map((sv: string, i: number) => (
              <View
                key={sv}
                className="flex-row items-center justify-between"
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: i === p.services.length - 1 ? 0 : 1,
                  borderColor: 'rgba(14,42,68,0.1)',
                }}>
                <Text style={{color: ink, fontWeight: '600', fontSize: 14}}>
                  {toServiceLabel(sv)}
                </Text>
                <Text style={{color: ink, fontWeight: '800', fontSize: 14}}>
                  {p.serviceRates[sv]
                    ? `₹${Number(p.serviceRates[sv]).toLocaleString('en-IN')}`
                    : t('MediaKitTemplatesMediaKitTemplates.onRequest')}
                </Text>
              </View>
            ))}
          </GlassPanel>
        )}

        {/* DEMOGRAPHICS */}
        <GlassPanel title={t('MediaKitTemplatesMediaKitTemplates.audience')}>
          <GlassSubhead text={t('MediaKitTemplatesMediaKitTemplates.topCities')} />
          {demo.topCities.map(c => (
            <GlassBar key={c.name} label={c.name} pct={c.pct} accent={accent} />
          ))}
          <View style={{height: 10}} />
          <GlassSubhead text={t('MediaKitTemplatesMediaKitTemplates.age')} />
          {demo.ageRanges.map(a => (
            <GlassBar key={a.range} label={a.range} pct={a.pct} accent={accent} />
          ))}
          <View style={{height: 6}} />
          <View className="flex-row items-center" style={{gap: 12, marginTop: 8}}>
            <View className="flex-row items-center" style={{gap: 6}}>
              <View style={{width: 10, height: 10, borderRadius: 9, backgroundColor: '#7c3aed'}} />
              <Text style={{color: ink, fontSize: 12, fontWeight: '600'}}>
                {t('MediaKitTemplatesMediaKitTemplates.glassGenderFemale', {
                  pct: demo.gender.female,
                })}
              </Text>
            </View>
            <View className="flex-row items-center" style={{gap: 6}}>
              <View style={{width: 10, height: 10, borderRadius: 9, backgroundColor: accent}} />
              <Text style={{color: ink, fontSize: 12, fontWeight: '600'}}>
                {t('MediaKitTemplatesMediaKitTemplates.glassGenderMale', {
                  pct: demo.gender.male,
                })}
              </Text>
            </View>
            {demo.gender.other > 0 && (
              <View className="flex-row items-center" style={{gap: 6}}>
                <View style={{width: 10, height: 10, borderRadius: 9, backgroundColor: '#f59e0b'}} />
                <Text style={{color: ink, fontSize: 12, fontWeight: '600'}}>
                  {t('MediaKitTemplatesMediaKitTemplates.glassGenderOther', {
                    pct: demo.gender.other,
                  })}
                </Text>
              </View>
            )}
          </View>
        </GlassPanel>

        {/* SOCIAL */}
        <GlassPanel title={t('MediaKitTemplatesMediaKitTemplates.social')}>
          {socials.map(s => (
            <View
              key={s.key}
              className="flex-row items-center justify-between"
              style={{paddingVertical: 10}}>
              <Text style={{color: ink, fontSize: 13, fontWeight: '600'}}>{s.label}</Text>
              <Text style={{color: accent, fontSize: 14, fontWeight: '800'}}>{s.value}</Text>
            </View>
          ))}
        </GlassPanel>

        {p.topReels.length > 0 && (
          <GlassPanel title={t('MediaKitTemplatesMediaKitTemplates.topContent')}>
            <TopContentGrid reels={p.topReels} />
          </GlassPanel>
        )}

        <Text style={{color: '#48657e', fontSize: 11, textAlign: 'center', fontWeight: '500'}}>
          {t('MediaKitTemplatesMediaKitTemplates.generatedOn')}
        </Text>
      </View>
    </View>
  );
}

function GlassPanel({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View
      style={{
        backgroundColor: 'rgba(226,239,251,0.55)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.7)',
        borderRadius: 22,
        padding: 18,
      }}>
      <Text
        style={{
          color: '#74909f',
          fontSize: 10.5,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginBottom: 10,
        }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function GlassStat({n, l}: {n: string; l: string}) {
  return (
    <View style={{flex: 1, alignItems: 'center'}}>
      <Text style={{color: '#0e2a44', fontSize: 22, fontWeight: '800', letterSpacing: -0.5}}>
        {n}
      </Text>
      <Text style={{color: '#74909f', fontSize: 11, fontWeight: '600', marginTop: 2}}>
        {l}
      </Text>
    </View>
  );
}

function GlassDivider() {
  return (
    <View style={{width: 1, backgroundColor: 'rgba(14,42,68,0.12)', marginVertical: 6}} />
  );
}

function GlassSubhead({text}: {text: string}) {
  return (
    <Text
      style={{
        color: '#48657e',
        fontSize: 10.5,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 8,
      }}>
      {text}
    </Text>
  );
}

function GlassBar({
  label,
  pct,
  accent,
}: {
  label: string;
  pct: number;
  accent: string;
}) {
  return (
    <View className="flex-row items-center" style={{gap: 8, marginBottom: 6}}>
      <Text
        numberOfLines={1}
        style={{color: '#0e2a44', fontSize: 12, fontWeight: '600', width: 70}}>
        {label}
      </Text>
      <View
        className="flex-1"
        style={{height: 6, backgroundColor: 'rgba(14,42,68,0.1)', borderRadius: 999}}>
        <View
          style={{
            width: `${Math.min(pct, 100)}%`,
            height: '100%',
            backgroundColor: accent,
            borderRadius: 999,
          }}
        />
      </View>
      <Text
        numberOfLines={1}
        style={{color: '#48657e', fontSize: 11, fontWeight: '700', width: 40, textAlign: 'right'}}>
        {pct}%
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EDITORIAL NOIR — paper background, serif-evoking display type, hard-ink
// rules and offset shadows. Read-only.
// ─────────────────────────────────────────────────────────────────────────
export function TemplateEditorialNoir({profile}: TemplateProps) {
  const {t} = useTranslation();
  const p = readProfile(profile);
  const demo = readDemographics(p.demographics, p.location);
  const socials = readSocials(p.followers);
  const ins = readInsights(profile);
  // Reel views · Viewers · Posts · Likes — see readHeadlineStats.
  const hs = readHeadlineStats(profile);

  const paper = '#f4efe6';
  const ink = '#16130f';
  const muted = '#8a7d6d';
  const line = '#ddd2c0';
  const accent = '#E94560';

  return (
    <View style={{backgroundColor: paper, paddingHorizontal: 18, paddingVertical: 22}}>
      {/* Masthead */}
      <View
        className="flex-row items-end justify-between flex-wrap"
        style={{borderBottomWidth: 3, borderColor: ink, paddingBottom: 8}}>
        <Text
          style={{
            color: ink,
            fontFamily: FONTS.SERIF_BOLD,
            fontSize: 12,
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}>
          {t('MediaKitTemplatesMediaKitTemplates.theMediaKit')}
        </Text>
        <Text
          style={{
            color: muted,
            fontFamily: FONTS.SERIF_ITALIC,
            fontSize: 11,
            letterSpacing: 1.5,
          }}>
          {t('MediaKitTemplatesMediaKitTemplates.volLabel', {
            category: p.primaryCategory,
          })}
        </Text>
      </View>
      <View style={{borderTopWidth: 1, borderColor: ink, marginTop: 6, marginBottom: 22}} />

      {/* HERO */}
      <View className="flex-row" style={{gap: 16, marginBottom: 14}}>
        <View
          style={{
            width: 110,
            height: 140,
            backgroundColor: '#cdbfa9',
            shadowColor: ink,
            shadowOffset: {width: 6, height: 6},
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 0,
          }}>
          {p.photo ? (
            <Image source={{uri: p.photo}} style={{width: '100%', height: '100%'}} />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Text style={{color: '#fff', fontSize: 30, fontWeight: '900'}}>
                {p.initials}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-1">
          <Text
            style={{
              color: accent,
              fontSize: 10.5,
              letterSpacing: 2.5,
              textTransform: 'uppercase',
              fontWeight: '700',
              marginBottom: 6,
            }}>
            {t('MediaKitTemplatesMediaKitTemplates.creatorProfile')}
          </Text>
          <Text
            // lineHeight bumped above fontSize so the top of ascenders
            // (capitals + accented glyphs) isn't clipped by the parent's
            // bounds. adjustsFontSizeToFit shrinks long single-word
            // surnames so they don't overflow the flex-1 column.
            adjustsFontSizeToFit
            numberOfLines={2}
            minimumFontScale={0.65}
            style={{
              color: ink,
              fontFamily: FONTS.SERIF_BOLD,
              fontSize: 38,
              lineHeight: 46,
              letterSpacing: -1.2,
            }}>
            {p.name.split(' ')[0]}
            {p.name.includes(' ') ? '\n' : ''}
            {p.name.split(' ').slice(1).join(' ')}
          </Text>
          <Text
            style={{
              color: '#43392f',
              fontFamily: FONTS.SERIF_ITALIC,
              fontSize: 16,
              marginTop: 10,
            }}>
            {p.primaryCategory}{' '}
            <Text style={{color: accent, fontFamily: FONTS.SERIF_BOLD}}>
              — {p.location || '—'}
            </Text>
          </Text>
        </View>
      </View>

      {/* BIO */}
      <NoirRule line={line} />
      <Text
        style={{
          color: ink,
          fontFamily: FONTS.SERIF,
          fontSize: 16,
          lineHeight: 24,
        }}>
        {p.bio}
      </Text>

      {/* STATS — three columns separated by ink rules */}
      <NoirRule line={line} />
      <View className="flex-row" style={{paddingVertical: 8}}>
        <NoirStat
          n={formatCount(p.followers)}
          l={t('MediaKitTemplatesMediaKitTemplates.followers')}
          line={line}
        />
        <NoirStat
          n={hs.reelViews.display}
          l={t('MediaKitInsights.headline.reelViews')}
          line={line}
        />
        <NoirStat
          n={hs.posts.display}
          l={t('MediaKitInsights.headline.posts')}
          last
          line={line}
        />
      </View>
      <NoirRule line={line} />
      <View className="flex-row" style={{paddingVertical: 8}}>
        <NoirStat
          n={hs.viewers.display}
          l={t('MediaKitInsights.headline.viewers')}
          line={line}
        />
        <NoirStat
          n={hs.likes.display}
          l={t('MediaKitInsights.headline.likes')}
          last
          line={line}
        />
      </View>

      {/* LAST 30 DAYS — Instagram account totals */}
      <NoirInsights ins={ins} ink={ink} muted={muted} line={line} />

      {/* LANGUAGES */}
      {p.languages.length > 0 && (
        <View>
          <NoirRule line={line} />
          <NoirSubhead
            text={t('MediaKitTemplatesMediaKitTemplates.languages')}
            ink={ink}
          />
          <Text
            style={{
              color: ink,
              fontFamily: FONTS.SERIF,
              fontSize: 16,
              lineHeight: 24,
            }}>
            {p.languages.join(' · ')}
          </Text>
        </View>
      )}

      {/* SERVICES */}
      {p.services.length > 0 && (
        <View>
          <NoirRule line={line} />
          <NoirSubhead
            text={t('MediaKitTemplatesMediaKitTemplates.services')}
            ink={ink}
          />
          {p.services.map((sv: string) => (
            <View
              key={sv}
              className="flex-row justify-between items-baseline"
              style={{paddingVertical: 12, borderBottomWidth: 1, borderColor: line}}>
              <Text
                style={{color: ink, fontFamily: FONTS.SERIF, fontSize: 16}}>
                {toServiceLabel(sv)}
              </Text>
              <Text
                style={{color: ink, fontFamily: FONTS.SERIF_BOLD, fontSize: 16}}>
                {p.serviceRates[sv]
                  ? `₹${Number(p.serviceRates[sv]).toLocaleString('en-IN')}`
                  : t('MediaKitTemplatesMediaKitTemplates.onRequest')}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* AUDIENCE */}
      <NoirRule line={line} />
      <NoirSubhead
        text={t('MediaKitTemplatesMediaKitTemplates.audience')}
        ink={ink}
      />
      <Text
        style={{
          color: muted,
          fontFamily: FONTS.SERIF_ITALIC,
          fontSize: 12,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
        {t('MediaKitTemplatesMediaKitTemplates.topCities')}
      </Text>
      {demo.topCities.map(c => (
        <NoirBar key={c.name} label={c.name} pct={c.pct} ink={ink} line={line} />
      ))}
      <Text
        style={{
          color: muted,
          fontFamily: FONTS.SERIF_ITALIC,
          fontSize: 12,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginTop: 10,
          marginBottom: 6,
        }}>
        {t('MediaKitTemplatesMediaKitTemplates.age')}
      </Text>
      {demo.ageRanges.map(a => (
        <NoirBar key={a.range} label={a.range} pct={a.pct} ink={ink} line={line} />
      ))}

      {/* SOCIAL */}
      <NoirRule line={line} />
      <NoirSubhead
        text={t('MediaKitTemplatesMediaKitTemplates.social')}
        ink={ink}
      />
      {socials.map(s => (
        <View
          key={s.key}
          className="flex-row justify-between items-baseline"
          style={{paddingVertical: 10, borderBottomWidth: 1, borderColor: line}}>
          <Text style={{color: ink, fontFamily: FONTS.SERIF, fontSize: 15}}>
            {s.label}
          </Text>
          <Text style={{color: ink, fontFamily: FONTS.SERIF_BOLD, fontSize: 16}}>
            {s.value}
          </Text>
        </View>
      ))}

      {p.topReels.length > 0 && (
        <>
          <NoirRule line={line} />
          <NoirSubhead
            text={t('MediaKitTemplatesMediaKitTemplates.topContent')}
            ink={ink}
          />
          <TopContentGrid reels={p.topReels} />
        </>
      )}

      <NoirRule line={line} />
      <Text
        style={{
          color: muted,
          fontFamily: FONTS.SERIF_ITALIC,
          fontSize: 12,
          letterSpacing: 3,
          textTransform: 'uppercase',
          textAlign: 'center',
        }}>
        {t('MediaKitTemplatesMediaKitTemplates.fin')}
      </Text>
    </View>
  );
}

function NoirRule({line}: {line: string}) {
  return <View style={{borderBottomWidth: 1, borderColor: line, marginVertical: 16}} />;
}

function NoirSubhead({text, ink}: {text: string; ink: string}) {
  return (
    <Text
      style={{
        color: ink,
        fontFamily: FONTS.SERIF_BOLD,
        fontSize: 15,
        letterSpacing: 4,
        textTransform: 'uppercase',
        marginBottom: 10,
      }}>
      {text}
    </Text>
  );
}

function NoirStat({
  n,
  l,
  line,
  last,
}: {
  n: string;
  l: string;
  line: string;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 12,
        borderRightWidth: last ? 0 : 1,
        borderColor: line,
      }}>
      <Text
        style={{
          color: '#16130f',
          fontFamily: FONTS.SERIF_BOLD,
          fontSize: 26,
          letterSpacing: -0.8,
        }}>
        {n}
      </Text>
      <Text
        style={{
          color: '#8a7d6d',
          fontFamily: FONTS.SERIF_ITALIC,
          fontSize: 12,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginTop: 2,
        }}>
        {l}
      </Text>
    </View>
  );
}

function NoirBar({
  label,
  pct,
  ink,
  line,
}: {
  label: string;
  pct: number;
  ink: string;
  line: string;
}) {
  return (
    <View className="flex-row items-center" style={{gap: 8, marginBottom: 6}}>
      <Text style={{color: ink, fontWeight: '500', fontSize: 13, width: 70}} numberOfLines={1}>
        {label}
      </Text>
      <View
        className="flex-1"
        style={{height: 4, backgroundColor: line, borderRadius: 2}}>
        <View
          style={{
            width: `${Math.min(pct, 100)}%`,
            height: '100%',
            backgroundColor: ink,
            borderRadius: 2,
          }}
        />
      </View>
      <Text
        numberOfLines={1}
        style={{color: ink, fontSize: 12, fontWeight: '800', width: 40, textAlign: 'right'}}>
        {pct}%
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// BENTO SUNSET — cream background with bento-grid white tiles + a sunset
// gradient running through the hero and engagement tile.
// ─────────────────────────────────────────────────────────────────────────
export function TemplateBentoSunset({profile}: TemplateProps) {
  const {t} = useTranslation();
  const p = readProfile(profile);
  const demo = readDemographics(p.demographics, p.location);
  const socials = readSocials(p.followers);
  const ins = readInsights(profile);
  // Reel views · Viewers · Posts · Likes — see readHeadlineStats.
  const hs = readHeadlineStats(profile);
  const last30 = t('MediaKitInsights.headline.last30', {days: ins.days});

  const cream = '#fbf3ec';
  const ink = '#2b1d18';
  const muted = '#9b857a';
  const sunset = ['#ff9a56', '#ff5d73', '#c850c0'] as [string, string, string];

  const Tile = ({children, style}: {children: React.ReactNode; style?: any}) => (
    <View
      style={[
        {
          backgroundColor: '#fff',
          borderRadius: 26,
          padding: 18,
          shadowColor: '#c85078',
          shadowOpacity: 0.18,
          shadowRadius: 20,
          shadowOffset: {width: 0, height: 10},
          elevation: 3,
        },
        style,
      ]}>
      {children}
    </View>
  );

  const lbl = (text: string) => (
    <Text
      style={{
        color: muted,
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        fontWeight: '800',
        marginBottom: 10,
      }}>
      {text}
    </Text>
  );

  return (
    <View style={{backgroundColor: cream, paddingHorizontal: 14, paddingVertical: 18}}>
      <View style={{gap: 12}}>
        {/* HERO */}
        <View
          style={{
            borderRadius: 30,
            padding: 22,
            overflow: 'hidden',
          }}>
          <LinearGradient
            colors={sunset}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={{position: 'absolute', inset: 0}}
          />
          <View
            style={{
              position: 'absolute',
              top: -80,
              right: -40,
              width: 200,
              height: 200,
              borderRadius: 200,
              backgroundColor: 'rgba(255,255,255,0.18)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: -60,
              right: 80,
              width: 140,
              height: 140,
              borderRadius: 140,
              backgroundColor: 'rgba(255,255,255,0.12)',
            }}
          />
          <View className="flex-row items-center" style={{gap: 14}}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 22,
                borderWidth: 4,
                borderColor: 'rgba(255,255,255,0.6)',
                backgroundColor: 'rgba(255,255,255,0.25)',
                overflow: 'hidden',
              }}>
              {p.photo ? (
                <Image source={{uri: p.photo}} style={{width: '100%', height: '100%'}} />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <Text style={{color: '#fff', fontWeight: '800', fontSize: 26}}>
                    {p.initials}
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text
                style={{
                  color: '#fff',
                  fontSize: 30,
                  fontWeight: '900',
                  letterSpacing: -0.7,
                  lineHeight: 32,
                }}>
                {p.name}
              </Text>
              <View className="flex-row flex-wrap mt-2" style={{gap: 6}}>
                <View
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.28)',
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 999,
                  }}>
                  <Text style={{color: '#fff', fontSize: 12, fontWeight: '700'}}>
                    ✦ {p.primaryCategory}
                  </Text>
                </View>
                {!!p.location && (
                  <View
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.28)',
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 999,
                    }}>
                    <Text style={{color: '#fff', fontSize: 12, fontWeight: '700'}}>
                      📍 {p.location}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* About */}
        <Tile>
          {lbl(t('MediaKitTemplatesMediaKitTemplates.aboutMe'))}
          <Text
            style={{
              color: '#ff5d73',
              fontSize: 19,
              fontWeight: '800',
              lineHeight: 24,
            }}>
            "{truncateText(p.bio.split('\n')[0], 90)}"
          </Text>
        </Tile>

        {/* Engagement tile w/ sunset gradient */}
        <View style={{borderRadius: 26, overflow: 'hidden', padding: 22}}>
          <LinearGradient
            colors={sunset}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={{position: 'absolute', inset: 0}}
          />
          <Text
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              fontWeight: '800',
              marginBottom: 6,
            }}>
            {t('MediaKitInsights.headline.reelViews')}
          </Text>
          <Text
            style={{color: '#fff', fontSize: 42, fontWeight: '900', letterSpacing: -1}}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {hs.reelViews.display}
          </Text>
          <Text style={{color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2}}>
            {last30}
          </Text>
        </View>

        {/* Followers + Posts as two side-by-side tiles */}
        <View className="flex-row" style={{gap: 12}}>
          <Tile style={{flex: 1}}>
            {lbl(t('MediaKitTemplatesMediaKitTemplates.followers'))}
            <Text style={{color: ink, fontSize: 32, fontWeight: '900', letterSpacing: -1}}>
              {formatCount(p.followers)}
            </Text>
          </Tile>
          <Tile style={{flex: 1}}>
            {lbl(t('MediaKitInsights.headline.posts'))}
            <Text style={{color: ink, fontSize: 32, fontWeight: '900', letterSpacing: -1}}>
              {hs.posts.display}
            </Text>
          </Tile>
        </View>
        <View className="flex-row" style={{gap: 12}}>
          <Tile style={{flex: 1}}>
            {lbl(t('MediaKitInsights.headline.viewers'))}
            <Text
              style={{color: ink, fontSize: 32, fontWeight: '900', letterSpacing: -1}}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {hs.viewers.display}
            </Text>
          </Tile>
          <Tile style={{flex: 1}}>
            {lbl(t('MediaKitInsights.headline.likes'))}
            <Text
              style={{color: ink, fontSize: 32, fontWeight: '900', letterSpacing: -1}}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {hs.likes.display}
            </Text>
          </Tile>
        </View>

        {/* LAST 30 DAYS — Instagram account totals */}
        <BentoInsights ins={ins} ink={ink} muted={muted} sunset={sunset} />

        {/* Expertise chips */}
        <Tile>
          {lbl(t('MediaKitTemplatesMediaKitTemplates.expertise'))}
          <View className="flex-row flex-wrap" style={{gap: 8}}>
            {(p.categories.length > 0
              ? p.categories
              : [t('MediaKitTemplatesMediaKitTemplates.contentCreation')]
            ).map(
              (cat: string) => (
                <View
                  key={cat}
                  style={{
                    backgroundColor: '#faf4ef',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                  }}>
                  <Text style={{color: ink, fontSize: 12, fontWeight: '700'}}>
                    {cat}
                  </Text>
                </View>
              ),
            )}
          </View>
        </Tile>

        {/* Languages */}
        {p.languages.length > 0 && (
          <Tile>
            {lbl(t('MediaKitTemplatesMediaKitTemplates.languages'))}
            <View className="flex-row flex-wrap" style={{gap: 8}}>
              {p.languages.map((lang: string) => (
                <View
                  key={lang}
                  style={{
                    backgroundColor: '#faf4ef',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                  }}>
                  <Text style={{color: ink, fontSize: 12, fontWeight: '700'}}>
                    {lang}
                  </Text>
                </View>
              ))}
            </View>
          </Tile>
        )}

        {/* Services */}
        {p.services.length > 0 && (
          <Tile>
            {lbl(t('MediaKitTemplatesMediaKitTemplates.servicesRates'))}
            <View style={{gap: 8}}>
              {p.services.map((sv: string) => (
                <View
                  key={sv}
                  className="flex-row items-center justify-between"
                  style={{
                    backgroundColor: '#faf4ef',
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}>
                  <Text style={{color: ink, fontWeight: '600', fontSize: 14}}>
                    {toServiceLabel(sv)}
                  </Text>
                  <Text style={{color: '#ff5d73', fontWeight: '800', fontSize: 14}}>
                    {p.serviceRates[sv]
                      ? `₹${Number(p.serviceRates[sv]).toLocaleString('en-IN')}`
                      : t('MediaKitTemplatesMediaKitTemplates.onRequest')}
                  </Text>
                </View>
              ))}
            </View>
          </Tile>
        )}

        {/* Audience */}
        <Tile>
          {lbl(t('MediaKitTemplatesMediaKitTemplates.whosWatching'))}
          {demo.topCities.map(c => (
            <BentoBar key={c.name} label={c.name} pct={c.pct} />
          ))}
          <View style={{height: 8}} />
          {demo.ageRanges.map(a => (
            <BentoBar key={a.range} label={a.range} pct={a.pct} />
          ))}
        </Tile>

        {/* Social */}
        <Tile>
          {lbl(t('MediaKitTemplatesMediaKitTemplates.social'))}
          {socials.map(s => (
            <View
              key={s.key}
              className="flex-row items-center justify-between"
              style={{paddingVertical: 8}}>
              <Text style={{color: ink, fontWeight: '600', fontSize: 13}}>
                {s.label}
              </Text>
              <Text style={{color: '#ff5d73', fontWeight: '800', fontSize: 14}}>
                {s.value}
              </Text>
            </View>
          ))}
        </Tile>

        {/* Top Content — sits in its own Tile so the bento rhythm stays
            consistent across the column. */}
        {p.topReels.length > 0 && (
          <Tile>
            {lbl(t('MediaKitTemplatesMediaKitTemplates.topContent'))}
            <TopContentGrid reels={p.topReels} />
          </Tile>
        )}

        <Text style={{color: muted, fontSize: 11, textAlign: 'center', fontWeight: '700'}}>
          {t('MediaKitTemplatesMediaKitTemplates.generatedOn')}
        </Text>
      </View>
    </View>
  );
}

function BentoBar({label, pct}: {label: string; pct: number}) {
  return (
    <View className="flex-row items-center" style={{gap: 8, marginBottom: 6}}>
      <Text
        numberOfLines={1}
        style={{color: '#2b1d18', fontSize: 12, fontWeight: '600', width: 70}}>
        {label}
      </Text>
      <View
        className="flex-1"
        style={{height: 6, backgroundColor: '#fbe3d4', borderRadius: 999}}>
        <LinearGradient
          colors={['#ff9a56', '#c850c0']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={{
            width: `${Math.min(pct, 100)}%`,
            height: '100%',
            borderRadius: 999,
          }}
        />
      </View>
      <Text
        numberOfLines={1}
        style={{color: '#9b857a', fontSize: 11, fontWeight: '800', width: 40, textAlign: 'right'}}>
        {pct}%
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// NEO BRUTALIST — loud hot-pink hero, hard black borders, offset shadows,
// uppercase Archivo Black-style display, mono-typed chips.
// ─────────────────────────────────────────────────────────────────────────
export function TemplateNeoBrutalist({profile}: TemplateProps) {
  const {t} = useTranslation();
  const p = readProfile(profile);
  const demo = readDemographics(p.demographics, p.location);
  const socials = readSocials(p.followers);
  const ins = readInsights(profile);
  // Reel views · Viewers · Posts · Likes — see readHeadlineStats.
  const hs = readHeadlineStats(profile);

  const ink = '#0f0f0f';
  const pink = '#E94560';
  const yellow = '#ffd23f';
  const purple = '#7F47CD';
  const cyan = '#3ad6c5';
  const bgPaper = '#f5f0e8';

  const hardCard = (extra?: any) => ({
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: ink,
    shadowColor: ink,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: {width: 6, height: 6},
    elevation: 0,
    padding: 18,
    ...extra,
  });

  const inkChip = (bg: string, color: string = '#fff') => ({
    backgroundColor: bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    color,
    fontFamily: FONTS.MONO_BOLD,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  });

  return (
    <View style={{backgroundColor: bgPaper, paddingHorizontal: 14, paddingVertical: 22}}>
      <View style={{gap: 16}}>
        {/* HERO */}
        <View
          style={{
            backgroundColor: pink,
            borderWidth: 3,
            borderColor: ink,
            shadowColor: ink,
            shadowOpacity: 1,
            shadowRadius: 0,
            shadowOffset: {width: 10, height: 10},
            elevation: 0,
            padding: 18,
            flexDirection: 'row',
            gap: 14,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderWidth: 3,
              borderColor: ink,
              backgroundColor: yellow,
              shadowColor: ink,
              shadowOpacity: 1,
              shadowRadius: 0,
              shadowOffset: {width: 6, height: 6},
              elevation: 0,
              overflow: 'hidden',
            }}>
            {p.photo ? (
              <Image source={{uri: p.photo}} style={{width: '100%', height: '100%'}} />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Text style={{color: ink, fontFamily: FONTS.BLOCK, fontSize: 26}}>
                  {p.initials}
                </Text>
              </View>
            )}
          </View>
          <View className="flex-1" style={{minWidth: 0}}>
            <Text
              style={{
                color: ink,
                fontFamily: FONTS.BLOCK,
                fontSize: 32,
                lineHeight: 32,
                textTransform: 'uppercase',
                letterSpacing: -0.8,
              }}>
              {p.name.split(' ')[0]}
              {'\n'}
              {p.name.split(' ').slice(1).join(' ')}
            </Text>
            <View className="flex-row flex-wrap mt-3" style={{gap: 6}}>
              <Text style={inkChip(yellow, ink)}>✦ {p.primaryCategory}</Text>
              {!!p.location && <Text style={inkChip(ink)}>◉ {p.location}</Text>}
            </View>
          </View>
        </View>

        {/* About */}
        <View style={hardCard()}>
          <Text style={{...inkChip(ink), alignSelf: 'flex-start', marginBottom: 12}}>
            {t('MediaKitTemplatesMediaKitTemplates.about')}
          </Text>
          <Text
            style={{
              color: ink,
              fontSize: 15.5,
              fontWeight: '600',
              lineHeight: 23,
            }}>
            {p.bio}
          </Text>
        </View>

        {/* Stat row */}
        <View className="flex-row" style={{gap: 10}}>
          <View style={[hardCard(), {flex: 1, backgroundColor: yellow}]}>
            <Text style={{color: ink, fontFamily: FONTS.BLOCK, fontSize: 28}}>
              {formatCount(p.followers)}
            </Text>
            <Text
              style={{
                color: ink,
                fontSize: 10.5,
                fontFamily: FONTS.MONO_BOLD,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}>
              {t('MediaKitTemplatesMediaKitTemplates.followers')}
            </Text>
          </View>
          <View style={[hardCard(), {flex: 1, backgroundColor: cyan}]}>
            <Text
              style={{color: ink, fontFamily: FONTS.BLOCK, fontSize: 28}}
              numberOfLines={1}
              adjustsFontSizeToFit>
              {hs.reelViews.display}
            </Text>
            <Text
              style={{
                color: ink,
                fontSize: 10.5,
                fontFamily: FONTS.MONO_BOLD,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
              numberOfLines={1}>
              {t('MediaKitInsights.headline.reelViews')}
            </Text>
          </View>
          <View style={[hardCard(), {flex: 1, backgroundColor: purple}]}>
            <Text style={{color: '#fff', fontFamily: FONTS.BLOCK, fontSize: 28}} numberOfLines={1} adjustsFontSizeToFit>
              {hs.posts.display}
            </Text>
            <Text
              style={{
                color: '#fff',
                fontSize: 10.5,
                fontFamily: FONTS.MONO_BOLD,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}>
              {t('MediaKitInsights.headline.posts')}
            </Text>
          </View>
        </View>
        <View className="flex-row" style={{gap: 10}}>
          <View style={[hardCard(), {flex: 1, backgroundColor: pink}]}>
            <Text style={{color: '#fff', fontFamily: FONTS.BLOCK, fontSize: 28}} numberOfLines={1} adjustsFontSizeToFit>
              {hs.viewers.display}
            </Text>
            <Text
              style={{
                color: '#fff',
                fontSize: 10.5,
                fontFamily: FONTS.MONO_BOLD,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}>
              {t('MediaKitInsights.headline.viewers')}
            </Text>
          </View>
          <View style={[hardCard(), {flex: 1, backgroundColor: yellow}]}>
            <Text style={{color: ink, fontFamily: FONTS.BLOCK, fontSize: 28}} numberOfLines={1} adjustsFontSizeToFit>
              {hs.likes.display}
            </Text>
            <Text
              style={{
                color: ink,
                fontSize: 10.5,
                fontFamily: FONTS.MONO_BOLD,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}>
              {t('MediaKitInsights.headline.likes')}
            </Text>
          </View>
        </View>

        {/* LAST 30 DAYS — Instagram account totals */}
        <BrutalInsights
          ins={ins}
          ink={ink}
          palette={[yellow, cyan, purple, pink]}
        />

        {/* Expertise */}
        <View style={hardCard()}>
          <Text style={{...inkChip(ink), alignSelf: 'flex-start', marginBottom: 12}}>
            {t('MediaKitTemplatesMediaKitTemplates.expertise')}
          </Text>
          <View className="flex-row flex-wrap" style={{gap: 8}}>
            {(p.categories.length > 0
              ? p.categories
              : [t('MediaKitTemplatesMediaKitTemplates.contentCreation')]
            ).map(
              (cat: string) => (
                <View
                  key={cat}
                  style={{
                    backgroundColor: yellow,
                    borderWidth: 2,
                    borderColor: ink,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}>
                  <Text
                    style={{
                      color: ink,
                      fontFamily: FONTS.MONO_BOLD,
                      fontSize: 11,
                      textTransform: 'uppercase',
                    }}>
                    {cat}
                  </Text>
                </View>
              ),
            )}
          </View>
        </View>

        {/* Languages */}
        {p.languages.length > 0 && (
          <View style={hardCard()}>
            <Text style={{...inkChip(ink), alignSelf: 'flex-start', marginBottom: 12}}>
              {t('MediaKitTemplatesMediaKitTemplates.languages')}
            </Text>
            <View className="flex-row flex-wrap" style={{gap: 8}}>
              {p.languages.map((lang: string) => (
                <View
                  key={lang}
                  style={{
                    backgroundColor: yellow,
                    borderWidth: 2,
                    borderColor: ink,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}>
                  <Text
                    style={{
                      color: ink,
                      fontFamily: FONTS.MONO_BOLD,
                      fontSize: 11,
                      textTransform: 'uppercase',
                    }}>
                    {lang}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Services */}
        {p.services.length > 0 && (
          <View style={hardCard()}>
            <Text style={{...inkChip(ink), alignSelf: 'flex-start', marginBottom: 12}}>
              {t('MediaKitTemplatesMediaKitTemplates.servicesRates')}
            </Text>
            {p.services.map((sv: string, i: number) => (
              <View
                key={sv}
                className="flex-row justify-between items-center"
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: i === p.services.length - 1 ? 0 : 2,
                  borderColor: ink,
                  borderStyle: 'dashed',
                }}>
                <Text
                  style={{
                    color: ink,
                    fontFamily: FONTS.MONO_BOLD,
                    fontSize: 13,
                  }}>
                  {toServiceLabel(sv)}
                </Text>
                <Text
                  style={{
                    color: pink,
                    fontFamily: FONTS.BLOCK,
                    fontSize: 15,
                  }}>
                  {p.serviceRates[sv]
                    ? `₹${Number(p.serviceRates[sv]).toLocaleString('en-IN')}`
                    : t('MediaKitTemplatesMediaKitTemplates.onRequest')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Audience */}
        <View style={hardCard()}>
          <Text style={{...inkChip(ink), alignSelf: 'flex-start', marginBottom: 12}}>
            {t('MediaKitTemplatesMediaKitTemplates.whosWatching')}
          </Text>
          <Text
            style={{
              color: ink,
              fontFamily: FONTS.MONO_BOLD,
              fontSize: 11.5,
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>
            {t('MediaKitTemplatesMediaKitTemplates.topCities')}
          </Text>
          {demo.topCities.map(c => (
            <BrutalBar key={c.name} label={c.name} pct={c.pct} colour={pink} ink={ink} />
          ))}
          <Text
            style={{
              color: ink,
              fontFamily: FONTS.MONO_BOLD,
              fontSize: 11.5,
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginTop: 10,
              marginBottom: 6,
            }}>
            {t('MediaKitTemplatesMediaKitTemplates.age')}
          </Text>
          {demo.ageRanges.map(a => (
            <BrutalBar key={a.range} label={a.range} pct={a.pct} colour={cyan} ink={ink} />
          ))}
        </View>

        {/* Social */}
        <View style={hardCard()}>
          <Text style={{...inkChip(ink), alignSelf: 'flex-start', marginBottom: 12}}>
            {t('MediaKitTemplatesMediaKitTemplates.social')}
          </Text>
          {socials.map((s, i) => (
            <View
              key={s.key}
              className="flex-row items-center"
              style={{
                gap: 10,
                paddingVertical: 10,
                borderBottomWidth: i === socials.length - 1 ? 0 : 2,
                borderColor: ink,
              }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: ink,
                }}>
                <Text style={{color: '#fff', fontFamily: FONTS.BLOCK, fontSize: 16}}>
                  {s.label.charAt(0)}
                </Text>
              </View>
              <Text
                style={{
                  color: ink,
                  fontFamily: FONTS.MONO_BOLD,
                  fontSize: 13,
                  flex: 1,
                }}>
                {s.label}
              </Text>
              <Text style={{color: ink, fontFamily: FONTS.BLOCK, fontSize: 18}}>
                {s.value}
              </Text>
            </View>
          ))}
        </View>

        {p.topReels.length > 0 && (
          <View style={hardCard()}>
            <Text style={{...inkChip(ink), alignSelf: 'flex-start', marginBottom: 12}}>
              {t('MediaKitTemplatesMediaKitTemplates.topContent')}
            </Text>
            <TopContentGrid reels={p.topReels} />
          </View>
        )}

        <Text
          style={{
            color: ink,
            fontFamily: FONTS.MONO_BOLD,
            fontSize: 12,
            textAlign: 'center',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
          {t('MediaKitTemplatesMediaKitTemplates.endBrutal')}
        </Text>
      </View>
    </View>
  );
}

function BrutalBar({
  label,
  pct,
  colour,
  ink,
}: {
  label: string;
  pct: number;
  colour: string;
  ink: string;
}) {
  return (
    <View className="flex-row items-center" style={{gap: 8, marginBottom: 6}}>
      <Text
        numberOfLines={1}
        style={{color: ink, fontFamily: FONTS.MONO_BOLD, fontSize: 12, width: 70}}>
        {label}
      </Text>
      <View
        className="flex-1"
        style={{
          height: 10,
          backgroundColor: '#fff',
          borderWidth: 2,
          borderColor: ink,
        }}>
        <View
          style={{
            width: `${Math.min(pct, 100)}%`,
            height: '100%',
            backgroundColor: colour,
          }}
        />
      </View>
      <Text
        numberOfLines={1}
        style={{
          color: ink,
          fontFamily: FONTS.MONO_BOLD,
          fontSize: 12,
          width: 40,
          textAlign: 'right',
        }}>
        {pct}%
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// LAST 30 DAYS — Instagram account totals, one block per template.
// Layout is shared (InsightGrid), styling is each template's own.
// ─────────────────────────────────────────────────────────────────────────

// Below this grid width the cells go two-up; above it, three-up.
const INSIGHT_TWO_COL_BELOW = 380;

// Cell widths are computed in points rather than `width: '48%' + gap`,
// which overflows the row once the gap is added. The grid's own measured
// width wins once laid out; before that the window width minus the
// template's horizontal inset is the estimate, so the first frame is close.
// A short trailing row stretches to fill, so a lone last cell isn't orphaned.
function useInsightGrid(inset: number, gap: number, count: number) {
  const {width: windowW} = useWindowDimensions();
  const [measured, setMeasured] = React.useState(0);
  const contentW = Math.max(0, measured > 0 ? measured : windowW - inset);
  const cols = contentW < INSIGHT_TWO_COL_BELOW ? 2 : 3;
  const cellW = Math.floor((contentW - gap * (cols - 1)) / cols);
  const trailing = count % cols;
  const trailingW =
    trailing > 0 ? Math.floor((contentW - gap * (trailing - 1)) / trailing) : cellW;
  const widthAt = (i: number) =>
    trailing > 0 && i >= count - trailing ? trailingW : cellW;
  const onLayout = (e: LayoutChangeEvent) => {
    // floor, never round: a width rounded up by half a point wraps the row.
    const w = Math.floor(e.nativeEvent.layout.width);
    setMeasured(prev => (prev === w ? prev : w));
  };
  return {widthAt, onLayout};
}

function InsightGrid({
  ins,
  inset,
  gap,
  renderCell,
}: {
  ins: NormalisedInsights;
  inset: number;
  gap: number;
  renderCell: (item: InsightItem, index: number, width: number) => React.ReactNode;
}) {
  const {widthAt, onLayout} = useInsightGrid(inset, gap, ins.items.length);
  return (
    <View onLayout={onLayout} style={{flexDirection: 'row', flexWrap: 'wrap', gap}}>
      {ins.items.map((item, i) => renderCell(item, i, widthAt(i)))}
    </View>
  );
}

function InsightStaleNote({
  ins,
  boxStyle,
  textStyle,
}: {
  ins: NormalisedInsights;
  boxStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const {t} = useTranslation();
  if (!ins.stale) return null;
  return (
    <View style={boxStyle}>
      <Text style={textStyle}>
        {ins.updatedLabel
          ? t('MediaKitInsights.stale', {date: ins.updatedLabel})
          : t('MediaKitInsights.staleNoDate')}
      </Text>
    </View>
  );
}

const insightLabelKey = (item: InsightItem) => `MediaKitInsights.labels.${item.key}`;

// CLASSIC — sits inside the Performance card under the existing stats,
// cells are ClassicStat tiles with the lead cell in the pink gradient.
function ClassicInsights({ins}: {ins: NormalisedInsights}) {
  const {t} = useTranslation();
  const note = (
    <InsightStaleNote
      ins={ins}
      boxStyle={{
        marginTop: 12,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 8,
      }}
      textStyle={{color: '#B45309', fontSize: 11, fontWeight: '600'}}
    />
  );
  if (!ins.hasData) return note;
  return (
    <View
      style={{marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: '#F1F5F9'}}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          columnGap: 8,
          rowGap: 2,
          marginBottom: 12,
        }}>
        <Text className="text-xs font-black text-slate-800 uppercase">
          {t('MediaKitInsights.title', {days: ins.days})}
        </Text>
        {!!ins.rangeLabel && (
          <Text className="text-[10px] font-bold text-slate-400">{ins.rangeLabel}</Text>
        )}
      </View>
      <InsightGrid
        ins={ins}
        inset={74}
        gap={8}
        renderCell={(item, i, width) => {
          const lead = i === 0;
          return (
            <View
              key={item.key}
              className={
                lead
                  ? 'rounded-2xl overflow-hidden'
                  : 'bg-slate-50 border border-slate-200 rounded-2xl'
              }
              style={{width, padding: 14}}>
              {lead && (
                <LinearGradient
                  colors={['#EC4899', '#A855F7']}
                  style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                />
              )}
              <Text
                numberOfLines={1}
                className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  lead ? 'text-white/80' : 'text-slate-400'
                }`}>
                {t(insightLabelKey(item))}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                className={`text-2xl font-black ${lead ? 'text-white' : 'text-slate-900'}`}>
                {item.display}
              </Text>
            </View>
          );
        }}
      />
      {note}
      <Text className="text-[10px] text-slate-400 mt-3">{t('MediaKitInsights.source')}</Text>
    </View>
  );
}

// GLASS BLUE — its own frosted panel under the headline stats; cells are
// lighter glass chips with GlassStat typography.
function GlassInsights({ins}: {ins: NormalisedInsights}) {
  const {t} = useTranslation();
  const note = (
    <InsightStaleNote
      ins={ins}
      boxStyle={{
        marginTop: ins.hasData ? 12 : 0,
        backgroundColor: 'rgba(245,158,11,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.35)',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 9,
      }}
      textStyle={{color: '#92400e', fontSize: 11.5, fontWeight: '600'}}
    />
  );
  if (!ins.hasData) return note;
  return (
    <View
      style={{
        backgroundColor: 'rgba(226,239,251,0.55)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.7)',
        borderRadius: 22,
        padding: 18,
      }}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          columnGap: 8,
          rowGap: 2,
          marginBottom: 10,
        }}>
        <Text
          style={{
            color: '#74909f',
            fontSize: 10.5,
            fontWeight: '700',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}>
          {t('MediaKitInsights.title', {days: ins.days})}
        </Text>
        {!!ins.rangeLabel && (
          <Text style={{color: '#48657e', fontSize: 11, fontWeight: '600'}}>
            {ins.rangeLabel}
          </Text>
        )}
      </View>
      <InsightGrid
        ins={ins}
        inset={70}
        gap={8}
        renderCell={(item, _i, width) => (
          <View
            key={item.key}
            style={{
              width,
              backgroundColor: 'rgba(255,255,255,0.5)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.75)',
              borderRadius: 16,
              paddingVertical: 12,
              paddingHorizontal: 10,
            }}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              style={{
                color: '#0e2a44',
                fontSize: 22,
                fontWeight: '800',
                letterSpacing: -0.5,
                textAlign: 'center',
              }}>
              {item.display}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                color: '#74909f',
                fontSize: 11,
                fontWeight: '600',
                marginTop: 2,
                textAlign: 'center',
              }}>
              {t(insightLabelKey(item))}
            </Text>
          </View>
        )}
      />
      {note}
      <Text style={{color: '#48657e', fontSize: 11, fontWeight: '500', marginTop: 10}}>
        {t('MediaKitInsights.source')}
      </Text>
    </View>
  );
}

// EDITORIAL NOIR — a ruled section under the stats row: serif subhead,
// italic dateline, cells topped with an ink rule like newspaper columns.
function NoirInsights({
  ins,
  ink,
  muted,
  line,
}: {
  ins: NormalisedInsights;
  ink: string;
  muted: string;
  line: string;
}) {
  const {t} = useTranslation();
  const note = (
    <InsightStaleNote
      ins={ins}
      boxStyle={{
        marginTop: ins.hasData ? 14 : 8,
        borderLeftWidth: 3,
        borderColor: '#d97706',
        paddingLeft: 10,
        paddingVertical: 2,
      }}
      textStyle={{color: '#9a5b13', fontFamily: FONTS.SERIF_ITALIC, fontSize: 13}}
    />
  );
  if (!ins.hasData) return note;
  return (
    <View>
      <NoirRule line={line} />
      <NoirSubhead text={t('MediaKitInsights.title', {days: ins.days})} ink={ink} />
      {!!ins.rangeLabel && (
        <Text
          style={{
            color: muted,
            fontFamily: FONTS.SERIF_ITALIC,
            fontSize: 13,
            marginTop: -4,
            marginBottom: 12,
          }}>
          {ins.rangeLabel}
        </Text>
      )}
      <InsightGrid
        ins={ins}
        inset={36}
        gap={14}
        renderCell={(item, _i, width) => (
          <View
            key={item.key}
            style={{width, borderTopWidth: 2, borderColor: ink, paddingTop: 6}}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              style={{
                color: ink,
                fontFamily: FONTS.SERIF_BOLD,
                fontSize: 26,
                lineHeight: 34,
                letterSpacing: -0.8,
              }}>
              {item.display}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                color: muted,
                fontFamily: FONTS.SERIF_ITALIC,
                fontSize: 12,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}>
              {t(insightLabelKey(item))}
            </Text>
          </View>
        )}
      />
      {note}
      <Text
        style={{
          color: muted,
          fontFamily: FONTS.SERIF_ITALIC,
          fontSize: 12,
          marginTop: 12,
        }}>
        {t('MediaKitInsights.source')}
      </Text>
    </View>
  );
}

// BENTO SUNSET — a white tile of cream mini-tiles; the lead cell carries
// the sunset gradient like the engagement tile above it.
function BentoInsights({
  ins,
  ink,
  muted,
  sunset,
}: {
  ins: NormalisedInsights;
  ink: string;
  muted: string;
  sunset: [string, string, string];
}) {
  const {t} = useTranslation();
  const note = (
    <InsightStaleNote
      ins={ins}
      boxStyle={{
        marginTop: ins.hasData ? 12 : 0,
        backgroundColor: '#fff1dc',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 9,
      }}
      textStyle={{color: '#b45309', fontSize: 12, fontWeight: '700'}}
    />
  );
  if (!ins.hasData) return note;
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 26,
        padding: 18,
        shadowColor: '#c85078',
        shadowOpacity: 0.18,
        shadowRadius: 20,
        shadowOffset: {width: 0, height: 10},
        elevation: 3,
      }}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          columnGap: 8,
          rowGap: 2,
          marginBottom: 10,
        }}>
        <Text
          style={{
            color: muted,
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            fontWeight: '800',
          }}>
          {t('MediaKitInsights.title', {days: ins.days})}
        </Text>
        {!!ins.rangeLabel && (
          <Text style={{color: '#ff5d73', fontSize: 11, fontWeight: '700'}}>
            {ins.rangeLabel}
          </Text>
        )}
      </View>
      <InsightGrid
        ins={ins}
        inset={64}
        gap={8}
        renderCell={(item, i, width) => {
          const lead = i === 0;
          return (
            <View
              key={item.key}
              style={{
                width,
                borderRadius: 18,
                padding: 14,
                overflow: 'hidden',
                backgroundColor: lead ? undefined : '#faf4ef',
              }}>
              {lead && (
                <LinearGradient
                  colors={sunset}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
                />
              )}
              <Text
                numberOfLines={1}
                style={{
                  color: lead ? 'rgba(255,255,255,0.85)' : muted,
                  fontSize: 10.5,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  fontWeight: '800',
                  marginBottom: 4,
                }}>
                {t(insightLabelKey(item))}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                style={{
                  color: lead ? '#fff' : ink,
                  fontSize: 26,
                  fontWeight: '900',
                  letterSpacing: -0.8,
                }}>
                {item.display}
              </Text>
            </View>
          );
        }}
      />
      {note}
      <Text style={{color: muted, fontSize: 11, fontWeight: '700', marginTop: 12}}>
        {t('MediaKitInsights.source')}
      </Text>
    </View>
  );
}

// NEO BRUTALIST — a hard card with an ink chip header; cells are bordered
// blocks cycling the template's loud palette with small offset shadows.
function BrutalInsights({
  ins,
  ink,
  palette,
}: {
  ins: NormalisedInsights;
  ink: string;
  palette: string[];
}) {
  const {t} = useTranslation();
  const note = (
    <InsightStaleNote
      ins={ins}
      boxStyle={{
        marginTop: ins.hasData ? 14 : 0,
        backgroundColor: '#fff3c4',
        borderWidth: 2,
        borderColor: ink,
        paddingHorizontal: 10,
        paddingVertical: 8,
      }}
      textStyle={{color: ink, fontFamily: FONTS.MONO_BOLD, fontSize: 11}}
    />
  );
  if (!ins.hasData) return note;
  // Pink and purple are dark enough to need white type.
  const darkBg = new Set([palette[2], palette[3]]);
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderWidth: 3,
        borderColor: ink,
        shadowColor: ink,
        shadowOpacity: 1,
        shadowRadius: 0,
        shadowOffset: {width: 6, height: 6},
        elevation: 0,
        padding: 18,
      }}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
        }}>
        <Text
          style={{
            backgroundColor: ink,
            color: '#fff',
            paddingHorizontal: 10,
            paddingVertical: 4,
            fontSize: 11,
            fontFamily: FONTS.MONO_BOLD,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}>
          {t('MediaKitInsights.title', {days: ins.days})}
        </Text>
        {!!ins.rangeLabel && (
          <Text style={{color: ink, fontFamily: FONTS.MONO_BOLD, fontSize: 11}}>
            {ins.rangeLabel}
          </Text>
        )}
      </View>
      <InsightGrid
        ins={ins}
        inset={70}
        gap={10}
        renderCell={(item, i, width) => {
          const bg = palette[i % palette.length];
          const fg = darkBg.has(bg) ? '#fff' : ink;
          return (
            <View
              key={item.key}
              style={{
                width,
                backgroundColor: bg,
                borderWidth: 2,
                borderColor: ink,
                shadowColor: ink,
                shadowOpacity: 1,
                shadowRadius: 0,
                shadowOffset: {width: 3, height: 3},
                elevation: 0,
                paddingHorizontal: 10,
                paddingVertical: 10,
              }}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                style={{color: fg, fontFamily: FONTS.BLOCK, fontSize: 22}}>
                {item.display}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  color: fg,
                  fontSize: 10,
                  fontFamily: FONTS.MONO_BOLD,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                {t(insightLabelKey(item))}
              </Text>
            </View>
          );
        }}
      />
      {note}
      <Text
        style={{
          color: ink,
          fontFamily: FONTS.MONO,
          fontSize: 10.5,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginTop: 14,
        }}>
        {t('MediaKitInsights.source')}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Wrapper — picks the right template by id. Single source of truth so the
// Shared 2-col reel grid used by every template's "Top Content" section.
// Tapping a tile opens the Instagram permalink in the system browser.
// Variant prop lets each template tint the meta-row icons to match its
// palette without forking the grid layout.
// ─────────────────────────────────────────────────────────────────────────
type TopContentVariant = 'default' | 'light';
function TopContentGrid({
  reels,
  variant = 'default',
}: {
  reels: any[];
  variant?: TopContentVariant;
}) {
  const open = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };
  // Limit to 6 — keeps the grid balanced (3 rows of 2) and matches the
  // typical reel count surfaced by the AddReelFlow on web parity.
  const items = reels.slice(0, 6);
  const meta = variant === 'light' ? '#fff' : '#fff';
  // Tile size is measured rather than expressed as `width: '48%' +
  // aspectRatio`: a percentage width inside a flex-wrap row doesn't reliably
  // resolve a height from aspectRatio, so tiles collapsed to each image's
  // intrinsic size and the grid came out ragged. Measuring the row gives
  // every tile identical pixel dimensions and a definite box for the image
  // to cover — portrait, landscape and undersized thumbs all fill the frame.
  const GAP = 8;
  const [rowWidth, setRowWidth] = React.useState(0);
  const tileW = rowWidth > 0 ? (rowWidth - GAP) / 2 : 0;
  const tileH = tileW * (5 / 4);
  return (
    <View
      className="flex-row flex-wrap"
      style={{gap: GAP}}
      onLayout={e => setRowWidth(e.nativeEvent.layout.width)}>
      {tileW === 0
        ? null
        : items.map((reel: any, i: number) => {
        const thumb = reel.thumbnail || reel.thumbnailUrl || reel.mediaUrl;
        return (
          <Pressable
            key={reel.id || i}
            onPress={() => open(reel.permalink)}
            style={{
              width: tileW,
              height: tileH,
              borderRadius: 12,
              overflow: 'hidden',
              backgroundColor: '#0f172a',
            }}>
            {thumb ? (
              <Image
                source={{uri: thumb}}
                style={{width: '100%', height: '100%'}}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={['#EDE9FE', '#FCE7F3']}
                style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center'}}>
                <Instagram size={28} color="#C4B5FD" />
              </LinearGradient>
            )}
            {/* Meta overlay — likes / comments / external-link hint */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={{position: 'absolute', left: 0, right: 0, bottom: 0, padding: 8}}>
              {!!reel.caption && (
                <Text
                  numberOfLines={2}
                  style={{color: '#fff', fontSize: 9, fontWeight: '600', marginBottom: 4}}>
                  {reel.caption}
                </Text>
              )}
              <View className="flex-row items-center" style={{gap: 8}}>
                <View className="flex-row items-center" style={{gap: 3}}>
                  <Heart size={9} color={meta} fill={meta} />
                  <Text style={{color: meta, fontSize: 9, fontWeight: '700'}}>
                    {formatCount(reel.likes || 0)}
                  </Text>
                </View>
                <View className="flex-row items-center" style={{gap: 3}}>
                  <MessageCircle size={9} color={meta} />
                  <Text style={{color: meta, fontSize: 9, fontWeight: '700'}}>
                    {formatCount(reel.comments || 0)}
                  </Text>
                </View>
                <ExternalLink size={9} color="rgba(255,255,255,0.55)" style={{marginLeft: 'auto'}} />
              </View>
            </LinearGradient>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// preview screen never has to switch on the template id itself.
// ─────────────────────────────────────────────────────────────────────────
export default function MediaKitPreview({
  templateId,
  ...rest
}: {templateId: string} & TemplateProps) {
  switch (templateId) {
    case 'glass_blue':
      return <TemplateGlassBlue {...rest} />;
    case 'editorial_noir':
      return <TemplateEditorialNoir {...rest} />;
    case 'bento_sunset':
      return <TemplateBentoSunset {...rest} />;
    case 'neo_brutalist':
      return <TemplateNeoBrutalist {...rest} />;
    case 'classic':
    default:
      return <TemplateClassic {...rest} />;
  }
}
