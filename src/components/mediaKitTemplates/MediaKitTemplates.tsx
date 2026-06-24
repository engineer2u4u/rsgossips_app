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
import {View, Text, Image, ScrollView, Pressable, TextInput, Linking} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Instagram,
  Youtube,
  Facebook,
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
  toServiceLabel,
  formatCount,
  type TemplateProps,
} from './shared';

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
  const p = readProfile(profile);
  const demo = readDemographics(p.demographics, p.location);
  const socials = readSocials(p.followers);

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
        <ClassicCard title="About Me">
          {editingBio && setBioDraft && setEditingBio && onBioSave ? (
            <View style={{gap: 8}}>
              <TextInput
                value={bioDraft}
                onChangeText={setBioDraft}
                placeholder="Write something about yourself..."
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
                    <Text className="text-xs font-semibold text-slate-500">Cancel</Text>
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
                    <Text className="text-xs font-bold text-white">Save</Text>
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

        <ClassicCard title="Expertise">
          <View className="flex-row flex-wrap" style={{gap: 8}}>
            {(p.categories.length > 0 ? p.categories : ['Content Creation']).map(
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

        {p.services.length > 0 && (
          <ClassicCard title="Services & Rates">
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
                      : 'On request'}
                  </Text>
                </View>
              ))}
            </View>
          </ClassicCard>
        )}

        <ClassicCard title="Who's Watching">
          <ClassicDemo demo={demo} hasData={!!p.demographics?.topCities?.length} />
        </ClassicCard>

        <ClassicCard title="Social Media">
          <View className="flex-row flex-wrap" style={{gap: 8}}>
            {socials.map(s => (
              <ClassicSocial key={s.key} label={s.label} value={s.value} />
            ))}
          </View>
        </ClassicCard>

        <ClassicCard title="Performance">
          <Text className="text-xl font-black text-slate-900 mb-4">
            The <Text style={{color: '#EC4899'}}>NUMBER</Text> That Matters
          </Text>
          <View className="flex-row flex-wrap" style={{gap: 8}}>
            <ClassicStat
              label="Accounts Reached"
              value={formatCount(p.totalReach || p.totalImpressions || p.followers * 2)}
              sub="Last 30 days"
            />
            <View
              className="flex-1 min-w-[45%] rounded-2xl p-4 overflow-hidden"
              style={{minHeight: 90}}>
              <LinearGradient
                colors={['#EC4899', '#A855F7']}
                style={{position: 'absolute', inset: 0}}
              />
              <Text className="text-[10px] font-bold text-white/80 uppercase tracking-wider mb-1">
                Engagement Rate
              </Text>
              <Text className="text-2xl font-black text-white">
                {p.engagementRate || 0}%
              </Text>
              <Text className="text-[10px] text-white/70 mt-1">vs 1.9% category avg</Text>
            </View>
            <ClassicStat
              label="Non-Follower Reach"
              value={`${p.nonFollowerReachPct}%`}
              sub="organic discovery"
            />
            <ClassicStat
              label="Interactions"
              value={formatCount(p.avgLikes + p.avgComments)}
              sub="avg per post"
            />
          </View>
        </ClassicCard>

        {p.topReels.length > 0 && (
          <ClassicCard title="Top Content">
            <TopContentGrid reels={p.topReels} />
          </ClassicCard>
        )}

        <View className="flex-row items-center justify-between py-4 border-t border-slate-100">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Generated on RGossips
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
  return (
    <View style={{gap: 16}}>
      <View>
        <Text className="text-xs font-black text-slate-800 uppercase mb-3">
          Top Cities
        </Text>
        <View style={{gap: 8}}>
          {demo.topCities.map(c => (
            <DemoBar key={c.name} label={c.name} pct={c.pct} />
          ))}
        </View>
      </View>
      <View>
        <Text className="text-xs font-black text-slate-800 uppercase mb-3">
          Age + Gender
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
                Female {demo.gender.female}%
              </Text>
            </View>
            <View className="flex-row items-center" style={{gap: 6}}>
              <View className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              <Text className="text-[11px] font-bold text-slate-600">
                Male {demo.gender.male}%
              </Text>
            </View>
            {demo.gender.other > 0 && (
              <View className="flex-row items-center" style={{gap: 6}}>
                <View className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <Text className="text-[11px] font-bold text-slate-600">
                  Other {demo.gender.other}%
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      {demo.topCountries.length > 0 && (
        <View>
          <Text className="text-xs font-black text-slate-800 uppercase mb-3">
            Top Countries
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
          Demographics data will appear after Instagram data refresh
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
  const p = readProfile(profile);
  const demo = readDemographics(p.demographics, p.location);
  const socials = readSocials(p.followers);

  // RN has no backdrop-filter; we use semi-opaque white panels over a
  // gradient base to suggest the same frosted vibe.
  const glassBg = 'rgba(226,239,251,0.55)';
  const glassBorder = 'rgba(255,255,255,0.7)';
  const ink = '#0e2a44';
  const accent = '#1564d6';

  return (
    <LinearGradient
      colors={['#dce9f8', '#bcd6ef', '#a4c7e9']}
      start={{x: 0.2, y: 0}}
      end={{x: 1, y: 1}}
      style={{minHeight: 200}}>
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
            "{p.bio.split('\n')[0].slice(0, 110)}"
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
          <GlassStat n={formatCount(p.followers)} l="Followers" />
          <GlassDivider />
          <GlassStat n={`${p.engagementRate || 0}%`} l="Engagement" />
          <GlassDivider />
          <GlassStat n={formatCount(p.posts)} l="Posts" />
        </View>

        {/* SERVICES */}
        {p.services.length > 0 && (
          <GlassPanel title="Services">
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
                    : 'On request'}
                </Text>
              </View>
            ))}
          </GlassPanel>
        )}

        {/* DEMOGRAPHICS */}
        <GlassPanel title="Audience">
          <GlassSubhead text="Top Cities" />
          {demo.topCities.map(c => (
            <GlassBar key={c.name} label={c.name} pct={c.pct} accent={accent} />
          ))}
          <View style={{height: 10}} />
          <GlassSubhead text="Age" />
          {demo.ageRanges.map(a => (
            <GlassBar key={a.range} label={a.range} pct={a.pct} accent={accent} />
          ))}
          <View style={{height: 6}} />
          <View className="flex-row items-center" style={{gap: 12, marginTop: 8}}>
            <View className="flex-row items-center" style={{gap: 6}}>
              <View style={{width: 10, height: 10, borderRadius: 9, backgroundColor: '#7c3aed'}} />
              <Text style={{color: ink, fontSize: 12, fontWeight: '600'}}>
                F {demo.gender.female}%
              </Text>
            </View>
            <View className="flex-row items-center" style={{gap: 6}}>
              <View style={{width: 10, height: 10, borderRadius: 9, backgroundColor: accent}} />
              <Text style={{color: ink, fontSize: 12, fontWeight: '600'}}>
                M {demo.gender.male}%
              </Text>
            </View>
            {demo.gender.other > 0 && (
              <View className="flex-row items-center" style={{gap: 6}}>
                <View style={{width: 10, height: 10, borderRadius: 9, backgroundColor: '#f59e0b'}} />
                <Text style={{color: ink, fontSize: 12, fontWeight: '600'}}>
                  Other {demo.gender.other}%
                </Text>
              </View>
            )}
          </View>
        </GlassPanel>

        {/* SOCIAL */}
        <GlassPanel title="Social">
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

        {/* CTA */}
        <View
          style={{
            backgroundColor: accent,
            borderRadius: 22,
            padding: 22,
            alignItems: 'center',
          }}>
          <Text style={{color: '#fff', fontSize: 18, fontWeight: '800'}}>
            Let's collaborate
          </Text>
          <Text style={{color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4}}>
            Reach out via @{p.handle} on Instagram
          </Text>
        </View>

        {p.topReels.length > 0 && (
          <GlassPanel title="Top Content">
            <TopContentGrid reels={p.topReels} />
          </GlassPanel>
        )}

        <Text style={{color: '#48657e', fontSize: 11, textAlign: 'center', fontWeight: '500'}}>
          Generated on RGossips
        </Text>
      </View>
    </LinearGradient>
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
  const p = readProfile(profile);
  const demo = readDemographics(p.demographics, p.location);
  const socials = readSocials(p.followers);

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
          The Media Kit
        </Text>
        <Text
          style={{
            color: muted,
            fontFamily: FONTS.SERIF_ITALIC,
            fontSize: 11,
            letterSpacing: 1.5,
          }}>
          Vol. 01 — {p.primaryCategory}
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
            Creator Profile
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
        <NoirStat n={formatCount(p.followers)} l="Followers" line={line} />
        <NoirStat n={`${p.engagementRate || 0}%`} l="Engagement" line={line} />
        <NoirStat n={formatCount(p.posts)} l="Posts" last line={line} />
      </View>

      {/* SERVICES */}
      {p.services.length > 0 && (
        <View>
          <NoirRule line={line} />
          <NoirSubhead text="Services" ink={ink} />
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
                  : 'On request'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* AUDIENCE */}
      <NoirRule line={line} />
      <NoirSubhead text="Audience" ink={ink} />
      <Text
        style={{
          color: muted,
          fontFamily: FONTS.SERIF_ITALIC,
          fontSize: 12,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
        Top Cities
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
        Age
      </Text>
      {demo.ageRanges.map(a => (
        <NoirBar key={a.range} label={a.range} pct={a.pct} ink={ink} line={line} />
      ))}

      {/* SOCIAL */}
      <NoirRule line={line} />
      <NoirSubhead text="Social" ink={ink} />
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
          <NoirSubhead text="Top Content" ink={ink} />
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
        Fin · Recentgossips
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
  const p = readProfile(profile);
  const demo = readDemographics(p.demographics, p.location);
  const socials = readSocials(p.followers);

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
          {lbl('About Me')}
          <Text
            style={{
              color: '#ff5d73',
              fontSize: 19,
              fontWeight: '800',
              lineHeight: 24,
            }}>
            "{p.bio.split('\n')[0].slice(0, 90)}"
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
            Engagement Rate
          </Text>
          <Text style={{color: '#fff', fontSize: 42, fontWeight: '900', letterSpacing: -1}}>
            {p.engagementRate || 0}%
          </Text>
          <Text style={{color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2}}>
            vs 1.9% category avg
          </Text>
        </View>

        {/* Followers + Posts as two side-by-side tiles */}
        <View className="flex-row" style={{gap: 12}}>
          <Tile style={{flex: 1}}>
            {lbl('Followers')}
            <Text style={{color: ink, fontSize: 32, fontWeight: '900', letterSpacing: -1}}>
              {formatCount(p.followers)}
            </Text>
          </Tile>
          <Tile style={{flex: 1}}>
            {lbl('Posts')}
            <Text style={{color: ink, fontSize: 32, fontWeight: '900', letterSpacing: -1}}>
              {formatCount(p.posts)}
            </Text>
          </Tile>
        </View>

        {/* Expertise chips */}
        <Tile>
          {lbl('Expertise')}
          <View className="flex-row flex-wrap" style={{gap: 8}}>
            {(p.categories.length > 0 ? p.categories : ['Content Creation']).map(
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

        {/* Services */}
        {p.services.length > 0 && (
          <Tile>
            {lbl('Services & Rates')}
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
                      : 'On request'}
                  </Text>
                </View>
              ))}
            </View>
          </Tile>
        )}

        {/* Audience */}
        <Tile>
          {lbl("Who's Watching")}
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
          {lbl('Social')}
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
            {lbl('Top Content')}
            <TopContentGrid reels={p.topReels} />
          </Tile>
        )}

        <Text style={{color: muted, fontSize: 11, textAlign: 'center', fontWeight: '700'}}>
          Generated on RGossips
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
  const p = readProfile(profile);
  const demo = readDemographics(p.demographics, p.location);
  const socials = readSocials(p.followers);

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
            About
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
              Followers
            </Text>
          </View>
          <View style={[hardCard(), {flex: 1, backgroundColor: cyan}]}>
            <Text style={{color: ink, fontFamily: FONTS.BLOCK, fontSize: 28}}>
              {p.engagementRate || 0}%
            </Text>
            <Text
              style={{
                color: ink,
                fontSize: 10.5,
                fontFamily: FONTS.MONO_BOLD,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}>
              Engagement
            </Text>
          </View>
          <View style={[hardCard(), {flex: 1, backgroundColor: purple}]}>
            <Text style={{color: '#fff', fontFamily: FONTS.BLOCK, fontSize: 28}}>
              {formatCount(p.posts)}
            </Text>
            <Text
              style={{
                color: '#fff',
                fontSize: 10.5,
                fontFamily: FONTS.MONO_BOLD,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}>
              Posts
            </Text>
          </View>
        </View>

        {/* Expertise */}
        <View style={hardCard()}>
          <Text style={{...inkChip(ink), alignSelf: 'flex-start', marginBottom: 12}}>
            Expertise
          </Text>
          <View className="flex-row flex-wrap" style={{gap: 8}}>
            {(p.categories.length > 0 ? p.categories : ['Content Creation']).map(
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

        {/* Services */}
        {p.services.length > 0 && (
          <View style={hardCard()}>
            <Text style={{...inkChip(ink), alignSelf: 'flex-start', marginBottom: 12}}>
              Services & Rates
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
                    : 'On request'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Audience */}
        <View style={hardCard()}>
          <Text style={{...inkChip(ink), alignSelf: 'flex-start', marginBottom: 12}}>
            Who's Watching
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
            Top Cities
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
            Age
          </Text>
          {demo.ageRanges.map(a => (
            <BrutalBar key={a.range} label={a.range} pct={a.pct} colour={cyan} ink={ink} />
          ))}
        </View>

        {/* Social */}
        <View style={hardCard()}>
          <Text style={{...inkChip(ink), alignSelf: 'flex-start', marginBottom: 12}}>
            Social
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
              Top Content
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
          End ◆ Recentgossips
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
  return (
    <View className="flex-row flex-wrap" style={{gap: 8}}>
      {items.map((reel: any, i: number) => {
        const thumb = reel.thumbnail || reel.thumbnailUrl || reel.mediaUrl;
        return (
          <Pressable
            key={reel.id || i}
            onPress={() => open(reel.permalink)}
            style={{
              width: '48%',
              aspectRatio: 4 / 5,
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
                style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
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
