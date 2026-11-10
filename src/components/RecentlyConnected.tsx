// Creators who joined most recently.
//
// This used to render four invented people — "Alex Rivera", "Sarah Chen" and
// friends, with pravatar.cc stock portraits — and a Media Kit button with no
// handler, because there was no real creator behind it to open. It shipped
// that way to the App Store.
//
// Port of the web's components/brands/RecentlyConnected.jsx: the newest
// active creators, read straight from influencer_profiles. RLS already
// limits the row to publicly readable columns, so no edge function is
// needed. Nothing is substituted when the query comes back empty — an empty
// marketplace says so.

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Linking, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';

import BrandSectionHeader from './brands/BrandSectionHeader';
import { supabase } from '../utils/supabase';
import {
  ANGLE_96,
  HOME_COLORS,
  VIOLET_BLUE,
  VIOLET_BLUE_LOCATIONS,
} from '../theme/brandHome';

const { width: SCREEN_W } = Dimensions.get('window');
const TILE = (SCREEN_W - 28 - 11) / 2; // 14px padding each side, 11px gap

// The home feed is a teaser — four fills the 2x2 grid. The web lists ten in
// a horizontal scroller; the grid is the established shape on this screen.
const LIMIT = 4;

type Creator = {
  influencer_id: string;
  full_name: string | null;
  username: string | null;
  instagram_handle: string | null;
  profile_photo_url: string | null;
  custom_profile_photo_url: string | null;
  media_kit_published: boolean | null;
};

// An external avatar (Google-hosted and the like) can fail to load. Falling
// back to the initial keeps the tile from showing a broken image — same
// reason the web wraps its <img> in an onError.
function Avatar({ photo, name }: { photo: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <LinearGradient
      colors={['#9B5FC4', '#6A66C9', '#4F79C6']}
      start={ANGLE_96.start}
      end={ANGLE_96.end}
      style={{ width: 54, height: 54, borderRadius: 99, padding: 2.5 }}>
      {photo && !failed ? (
        <Image
          source={{ uri: photo }}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', borderRadius: 99, borderWidth: 2, borderColor: '#fff' }}
        />
      ) : (
        <View
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 99,
            borderWidth: 2,
            borderColor: '#fff',
            backgroundColor: '#6A66C9',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

export const RecentlyConnected = () => {
  const { t } = useTranslation();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('influencer_profiles')
        .select(
          'influencer_id, full_name, username, instagram_handle, profile_photo_url, custom_profile_photo_url, media_kit_published',
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(LIMIT);
      if (cancelled) return;
      // supabase-js resolves a failed read instead of throwing, so an
      // unchecked result would silently leave the section empty.
      if (error) console.warn('RecentlyConnected failed:', error.message);
      setCreators(data || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Same destination and same guard as the directory's InfluencerCard: the
  // kit lives on the web, and only published kits have a page to open.
  const openMediaKit = (handle: string) =>
    Linking.openURL(`https://rgossips.com/kit/${handle}`).catch(() =>
      Alert.alert(
        t('BrandsInfluencerCard.noMediaKitTitle'),
        t('BrandsInfluencerCard.noMediaKitMessage'),
      ),
    );

  if (!loading && creators.length === 0) return null;

  return (
    <View style={{ width: '100%', gap: 11 }}>
      <BrandSectionHeader
        title={t('RecentlyConnected.title')}
        subtitle={t('RecentlyConnected.subtitle')}
      />

      {loading ? (
        <View style={{ paddingVertical: 28, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#6A66C9" />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 11, paddingHorizontal: 14 }}>
          {creators.map(inf => {
            const handle = inf.instagram_handle || inf.username || '';
            const name = inf.full_name || handle || t('BrandsInfluencerCard.creatorFallback');
            const photo = inf.custom_profile_photo_url || inf.profile_photo_url;
            const kitHandle = handle && inf.media_kit_published ? handle : null;
            return (
              <View
                key={inf.influencer_id}
                style={{
                  width: TILE,
                  backgroundColor: HOME_COLORS.card,
                  borderWidth: 1,
                  borderColor: HOME_COLORS.cardBorder,
                  borderRadius: 18,
                  paddingVertical: 15,
                  paddingHorizontal: 12,
                  alignItems: 'center',
                  gap: 9,
                }}>
                <Avatar photo={photo} name={name} />
                <View style={{ width: '100%', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11.5, fontWeight: '600', color: HOME_COLORS.ink }} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={{ fontSize: 9, color: HOME_COLORS.faint, letterSpacing: 0.4 }} numberOfLines={1}>
                    {handle ? `@${handle.toUpperCase()}` : ''}
                  </Text>
                </View>
                {/* Only a published kit gets a button — the web applies the
                    same gate, and a button that opens a 404 is worse than
                    no button. */}
                {kitHandle ? (
                  <Pressable
                    onPress={() => openMediaKit(kitHandle)}
                    style={{
                      width: '100%',
                      height: 32,
                      borderRadius: 9,
                      overflow: 'hidden',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <LinearGradient
                      colors={VIOLET_BLUE}
                      locations={VIOLET_BLUE_LOCATIONS}
                      start={ANGLE_96.start}
                      end={ANGLE_96.end}
                      style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                    />
                    <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '700' }}>
                      {t('RecentlyConnected.mediaKit')}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={{ height: 32 }} />
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};
