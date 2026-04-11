import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import {
  Search,
  Plus,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

import BrandsLayout from '../layouts/BrandLayout';
import { TrustSection } from '../components/TrustSection';
import { CategoryFilters } from '../components/brands/CategoryFilters';
import { InfluencerCard } from '../components/brands/InfluencerCard';
import { FilterDrawer } from '../components/brands/FilterDrawer';

const influencers = [
  {
    name: 'Kapil Sharma',
    category: 'Acting, Professional: TV, OTT',
    instagram: '45.6M',
    youtube: '39.8K',
    imageUrl: 'https://i.pravatar.cc/150?u=kapil',
  },
  {
    name: 'Faisal Shaikh',
    category: 'Entertainment',
    instagram: '34M',
    youtube: '3.91M',
    imageUrl: 'https://i.pravatar.cc/150?u=faisal',
  },
  {
    name: 'Vaibhav Siinty',
    category: 'Business & Startups',
    instagram: '18M',
    youtube: null,
    imageUrl: 'https://i.pravatar.cc/150?u=siinty',
  },
  {
    name: 'Nidhi Mohan Kamal',
    category: 'Health',
    instagram: '400K',
    youtube: '20K',
    imageUrl: 'https://i.pravatar.cc/150?u=nidhi',
  },
];

const FilterBar = () => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
  >
    <FilterDrawer />

    <Pressable className="flex-row items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full">
      <Text className="text-[11px] font-semibold text-gray-700">Sort by</Text>
      <ChevronDown size={12} color="#374151" />
    </Pressable>

    <Pressable className="flex-row items-center gap-1.5 px-3 py-1.5 border border-pink-200 bg-pink-50 rounded-full">
      <Text className="text-[11px] font-semibold text-pink-600">Instagram</Text>
      <ChevronDown size={12} color="#db2777" />
    </Pressable>

    <Pressable className="flex-row items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full">
      <Text className="text-[11px] font-semibold text-gray-700">Category</Text>
      <ChevronDown size={12} color="#374151" />
    </Pressable>
  </ScrollView>
);

const BrandSearch = () => {
  return (
    <BrandsLayout>
      {/* ── Header with Gradient ── */}
      <LinearGradient
        colors={['#4C75BE', '#4A3996']}
        className="w-full px-6 pt-12 pb-10 rounded-b-[40px]"
      >
        <View className="flex-row justify-between items-start mb-6">
          <View>
            <Text className="text-2xl font-bold text-white">Search</Text>
            <Text className="text-blue-200 text-xs">
              The influencer directory
            </Text>
          </View>

          <View className="flex-row gap-2">
            <Pressable className="p-2 bg-white/10 rounded-lg">
              <SlidersHorizontal size={18} color="white" />
            </Pressable>
            <Pressable className="p-2 bg-white/10 rounded-lg">
              <Plus size={18} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3.5 shadow-xl">
          <Search size={20} color="#d1d5db" />
          <TextInput
            placeholder='Enter Creator by "Username"'
            placeholderTextColor="#d1d5db"
            className="flex-1 ml-2 text-sm text-gray-800"
          />
          <Pressable className="bg-blue-600 p-1.5 rounded-full ml-2">
            <Plus size={16} color="white" />
          </Pressable>
        </View>
      </LinearGradient>

      {/* ── Trust Section ── */}
      <View className="pt-4">
        <TrustSection />
      </View>

      {/* ── Category Filters ── */}
      <CategoryFilters />

      {/* ── Filter Bar ── */}
      <View className="mb-4">
        <FilterBar />
      </View>

      {/* ── Influencer List ── */}
      <View className="bg-white">
        {influencers.map((inf, i) => (
          <InfluencerCard key={i} {...inf} />
        ))}
      </View>
    </BrandsLayout>
  );
};

export default BrandSearch;
