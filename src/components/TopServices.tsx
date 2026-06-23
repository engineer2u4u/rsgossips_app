import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {Star} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import {fetchServices, formatINR, iconForName, type ServiceRow} from '../lib/services';
import {BRAND, BRAND_GRADIENT_WARM, CARD_SHADOW} from '../theme/brand';

// Paints any Lucide icon with the brand warm gradient via MaskedView. The
// mask uses the icon's stroke as the alpha channel and overlays the
// LinearGradient as the visible fill, so the strokes pick up the pink →
// magenta ramp instead of a flat color.
function GradientIcon({
  Icon,
  size = 20,
  strokeWidth = 1.8,
}: {
  Icon: React.ComponentType<any>;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <MaskedView
      style={{width: size, height: size}}
      maskElement={
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Icon size={size} strokeWidth={strokeWidth} color="#000" />
        </View>
      }>
      <LinearGradient
        colors={[...BRAND_GRADIENT_WARM]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={{flex: 1}}
      />
    </MaskedView>
  );
}

// Tailwind class strings the web stores in `service.hero_gradient` look like
// "from-pink-500 to-fuchsia-500". RN can't consume those, so we map a small
// set to actual hex colour stops. Any unknown gradient falls through to the
// default purple→pink ramp so we never render a blank tile.
const GRADIENT_MAP: Record<string, [string, string]> = {
  'from-pink-500 to-fuchsia-500': ['#ec4899', '#d946ef'],
  'from-purple-500 to-indigo-500': ['#a855f7', '#6366f1'],
  'from-amber-500 to-orange-500': ['#f59e0b', '#f97316'],
  'from-emerald-500 to-teal-500': ['#10b981', '#14b8a6'],
  'from-rose-500 to-pink-500': ['#f43f5e', '#ec4899'],
  'from-sky-500 to-blue-500': ['#0ea5e9', '#3b82f6'],
  'from-violet-500 to-purple-500': ['#8b5cf6', '#a855f7'],
};

function gradientColors(g?: string): [string, string] {
  if (g && GRADIENT_MAP[g]) return GRADIENT_MAP[g];
  return [...BRAND_GRADIENT_WARM];
}

export default function TopServices() {
  const navigation = useNavigation<any>();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchServices();
      if (cancelled) return;
      setServices(data.slice(0, 7));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openService = (s: ServiceRow) =>
    navigation.navigate('InfluencerServiceDetail', {slug: s.slug, id: s.id});

  if (loading) {
    return (
      <View className="w-full py-12 items-center">
        <ActivityIndicator size="small" color={BRAND.accent} />
      </View>
    );
  }

  if (services.length === 0) return null;

  const featured = services[0];
  const rest = services.slice(1);

  return (
    <View className="w-full py-8 px-4">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-6">
        <View className="flex-1 pr-3">
          <Text className="text-xl font-black text-slate-900 uppercase tracking-tight">
            Top Services
          </Text>
          <Text className="text-xs text-slate-400 font-medium mt-1">
            Professional marketing services to grow your brand
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('InfluencerServices')}>
          <Text className="font-bold text-xs" style={{color: BRAND.accent}}>
            View All ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Featured */}
      <FeaturedCard service={featured} onPress={() => openService(featured)} />

      {/* List */}
      <View className="mt-4" style={{gap: 12}}>
        {rest.map(s => (
          <ServiceRowCard key={s.id} service={s} onPress={() => openService(s)} />
        ))}
      </View>
    </View>
  );
}

function FeaturedCard({service, onPress}: {service: ServiceRow; onPress: () => void}) {
  const Icon = iconForName(service.icon_name);
  const hasImage = !!service.featured_image_url;
  const [g1, g2] = gradientColors(service.hero_gradient);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="border border-slate-200 rounded-[28px] overflow-hidden bg-white"
      style={CARD_SHADOW}>
      <View
        className="w-full items-center justify-center relative"
        style={{aspectRatio: 4 / 3, backgroundColor: '#F1F5F9'}}>
        {hasImage ? (
          <Image
            source={{uri: service.featured_image_url}}
            style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={[g1, g2]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={{position: 'absolute', inset: 0}}
          />
        )}
        <View className="absolute top-4 left-4 flex-row" style={{gap: 6}}>
          <View className="bg-white/90 px-3 py-1 rounded-full flex-row items-center" style={{gap: 4}}>
            <Text className="text-pink-500 text-[10px] font-black">⚡</Text>
            <Text className="text-[10px] font-black text-slate-800">TOP RATED</Text>
          </View>
          {!!service.tag && (
            <View className="bg-slate-900/70 px-3 py-1 rounded-full">
              <Text className="text-white text-[10px] font-black">{service.tag}</Text>
            </View>
          )}
        </View>
        {!hasImage && <Icon size={72} strokeWidth={1.2} color="rgba(255,255,255,0.85)" />}
      </View>

      <View className="p-4">
        <Text className="text-lg font-black text-slate-900 leading-tight mb-2">
          {service.title}
        </Text>
        {!!service.description && (
          <Text
            numberOfLines={3}
            className="text-xs text-slate-500 leading-snug mb-3">
            {service.description}
          </Text>
        )}
        <View className="pt-3 border-t border-slate-100 flex-row items-end justify-between">
          <View>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Starting at
            </Text>
            <Text className="text-2xl font-black text-slate-900 leading-tight">
              {formatINR(service.price_starting)}
            </Text>
            <View className="flex-row items-center mt-1" style={{gap: 4}}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-[11px] font-black text-slate-700">
                {Number(service.rating_avg || 0).toFixed(1)}
                <Text className="text-slate-400 font-bold">
                  {' '}
                  ({service.reviews_count || 0} reviews)
                </Text>
              </Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            style={{
              borderRadius: 16,
              paddingHorizontal: 18,
              paddingVertical: 10,
              overflow: 'hidden',
            }}>
            <LinearGradient
              colors={[...BRAND_GRADIENT_WARM]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
            />
            <Text className="text-white text-[11px] font-black uppercase tracking-wider">
              Get Quote
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ServiceRowCard({service, onPress}: {service: ServiceRow; onPress: () => void}) {
  const Icon = iconForName(service.icon_name);
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="bg-white border border-slate-100 rounded-2xl p-3 flex-row items-center"
      style={[{gap: 12}, CARD_SHADOW]}>
      <View
        className="w-14 h-14 rounded-xl items-center justify-center"
        style={{backgroundColor: '#FFF1F4'}}>
        <GradientIcon Icon={Icon} size={22} strokeWidth={1.8} />
      </View>
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className="text-sm font-black text-slate-900 leading-tight">
          {service.title}
        </Text>
        {!!service.description && (
          <Text
            numberOfLines={1}
            className="text-[11px] text-slate-500 mt-1 leading-snug">
            {service.description}
          </Text>
        )}
        <View className="flex-row items-center mt-1.5" style={{gap: 6}}>
          <View className="flex-row items-center" style={{gap: 3}}>
            <Star size={10} color="#F59E0B" fill="#F59E0B" />
            <Text className="text-[10px] font-black text-slate-700">
              {Number(service.rating_avg || 0).toFixed(1)}
              <Text className="text-slate-400 font-bold">
                {' '}
                ({service.reviews_count || 0})
              </Text>
            </Text>
          </View>
          <View className="bg-emerald-50 px-1.5 py-0.5 rounded">
            <Text className="text-emerald-700 text-[9px] font-black uppercase tracking-wider">
              Available
            </Text>
          </View>
        </View>
      </View>
      <View className="items-end">
        <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          From
        </Text>
        <Text className="text-base font-black text-slate-900 leading-tight">
          {formatINR(service.price_starting)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
