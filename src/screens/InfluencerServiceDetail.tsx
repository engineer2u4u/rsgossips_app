// Service detail. Renders the row from list-services?slug=…, with sections
// for hero, about, what's included, FAQ, and a "Request Quote" CTA that
// kicks off the quote flow (next batch — currently shows a placeholder
// alert noting where it goes).
//
// Web parity: src/app/influencer/services/[id]/page.js.

import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  ChevronLeft,
  Clock,
  Flame,
  Star,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  fetchServiceBySlug,
  formatINR,
  iconForName,
  type ServiceRow,
} from '../lib/services';

export default function InfluencerServiceDetail() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const slug = route.params?.slug;

  const [service, setService] = useState<ServiceRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const data = await fetchServiceBySlug(slug);
      if (!cancelled) {
        setService(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FD'}}>
        <ActivityIndicator color="#E60076" size="large" />
      </View>
    );
  }

  if (!service) {
    return (
      <View
        style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FD', padding: 24, gap: 12}}>
        <Text className="text-base font-bold text-slate-600">Service not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-sm font-bold text-pink-500">← Back to Services</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const Icon = iconForName(service.icon_name);
  const ratingAvg = Number(service.rating_avg || 0);

  return (
    <View className="flex-1" style={{backgroundColor: '#F5F4F8'}}>
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
          {service.title}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{padding: 16, paddingBottom: 120, gap: 14}}
        showsVerticalScrollIndicator={false}>
        {/* Hero */}
        {service.featured_image_url ? (
          <Image
            source={{uri: service.featured_image_url}}
            style={{width: '100%', aspectRatio: 2.4 / 1, borderRadius: 20, backgroundColor: '#f1f5f9'}}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={['#9810FA', '#E60076']}
            style={{aspectRatio: 2.4 / 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center'}}>
            <Icon size={68} color="rgba(255,255,255,0.85)" />
          </LinearGradient>
        )}

        {/* Title + meta */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100" style={{gap: 10}}>
          {service.tag ? (
            <View className="self-start bg-rose-50 px-2 py-1 rounded-md">
              <Text className="text-[10px] font-black uppercase tracking-widest text-rose-600">
                {service.tag}
              </Text>
            </View>
          ) : null}
          <Text className="text-xl font-black text-slate-900 leading-tight">
            {service.title}
          </Text>

          <View className="flex-row flex-wrap items-center" style={{gap: 12, marginTop: 4}}>
            {ratingAvg > 0 ? (
              <View className="flex-row items-center" style={{gap: 4}}>
                <Star size={13} color="#F59E0B" fill="#F59E0B" />
                <Text className="text-[12px] font-black text-slate-700">
                  {ratingAvg.toFixed(1)}{' '}
                  <Text className="text-slate-400 font-bold">
                    ({service.reviews_count || 0} reviews)
                  </Text>
                </Text>
              </View>
            ) : null}
            <View className="bg-emerald-50 px-2 py-1 rounded-md">
              <Text className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                Available Now
              </Text>
            </View>
            {service.quote_sla_hours ? (
              <View className="flex-row items-center" style={{gap: 4}}>
                <Clock size={11} color="#64748b" />
                <Text className="text-[11px] font-bold text-slate-500">
                  {service.quote_sla_hours} hr quote SLA
                </Text>
              </View>
            ) : null}
            {service.booked_this_month ? (
              <View className="flex-row items-center" style={{gap: 4}}>
                <Flame size={11} color="#F97316" />
                <Text className="text-[11px] font-bold text-slate-500">
                  {service.booked_this_month} booked this month
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Gallery */}
        {service.gallery_image_urls && service.gallery_image_urls.length > 0 ? (
          <View className="bg-white rounded-2xl p-4 border border-slate-100">
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Gallery
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8}}>
              {service.gallery_image_urls.map((url, i) => (
                <Image
                  key={`${url}-${i}`}
                  source={{uri: url}}
                  style={{width: 140, height: 100, borderRadius: 12, backgroundColor: '#f1f5f9'}}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* About */}
        {service.description ? (
          <View className="bg-white rounded-2xl p-5 border border-slate-100" style={{gap: 8}}>
            <Text className="text-base font-black text-slate-900">About this service</Text>
            <Text className="text-sm text-slate-600 leading-relaxed">
              {service.description}
            </Text>
          </View>
        ) : null}

        {/* What's included */}
        {service.whats_included && service.whats_included.length > 0 ? (
          <View className="bg-white rounded-2xl p-5 border border-slate-100" style={{gap: 8}}>
            <Text className="text-base font-black text-slate-900">What's included</Text>
            <View style={{gap: 6}}>
              {service.whats_included.map((item, i) => (
                <View
                  key={`${item}-${i}`}
                  className="flex-row items-start"
                  style={{gap: 8}}>
                  <Text className="text-pink-500 font-bold">•</Text>
                  <Text className="text-sm text-slate-700 flex-1" numberOfLines={3}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Deliverables */}
        {service.deliverables && service.deliverables.length > 0 ? (
          <View className="bg-white rounded-2xl p-5 border border-slate-100" style={{gap: 8}}>
            <Text className="text-base font-black text-slate-900">Deliverables</Text>
            <View className="flex-row flex-wrap" style={{gap: 6}}>
              {service.deliverables.map((d, i) => (
                <View
                  key={`${d}-${i}`}
                  className="bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-full">
                  <Text className="text-[11px] font-bold text-purple-700">{d}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* FAQ */}
        {service.faq && service.faq.length > 0 ? (
          <View className="bg-white rounded-2xl p-5 border border-slate-100" style={{gap: 12}}>
            <Text className="text-base font-black text-slate-900">FAQ</Text>
            {service.faq.map((item, i) => (
              <View key={i} style={{gap: 4}}>
                <Text className="text-sm font-bold text-slate-800">
                  {item.q}
                </Text>
                <Text className="text-sm text-slate-600 leading-relaxed">
                  {item.a}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Floating Request Quote CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3"
        style={{paddingBottom: 16}}>
        <View className="flex-row items-center" style={{gap: 12}}>
          <View className="flex-1">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Starts at
            </Text>
            <Text className="text-xl font-black text-pink-600">
              {formatINR(service.price_starting || 0)}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate('InfluencerServiceQuote', {
                slug: service.slug || service.id,
              })
            }>
            <LinearGradient
              colors={['#9810FA', '#E60076']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={{paddingHorizontal: 22, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center'}}>
              <Text className="text-white text-sm font-bold">Request Quote</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
