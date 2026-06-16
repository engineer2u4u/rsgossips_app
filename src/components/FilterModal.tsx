import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  TextInput,
} from 'react-native';
import {ChevronLeft} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

// Canonical category list — same 15 used on the web's FilterModal.jsx so
// brand/campaign filters share the same vocabulary across platforms.
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

const PLATFORMS = ['Instagram', 'YouTube', 'TikTok', 'Twitter'];

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  budgetRange: {min: number; max: number};
  setBudgetRange: (range: {min: number; max: number}) => void;
  /** Default max for the "no cap" check on Reset. Brands uses 10000, Campaigns 200000. */
  budgetMaxDefault?: number;
  /** Platforms is web-deprecated; only render when both ends are provided. */
  selectedPlatforms?: string[];
  setSelectedPlatforms?: React.Dispatch<React.SetStateAction<string[]>>;
  isVerifiedOnly: boolean;
  setIsVerifiedOnly: (val: boolean) => void;
  /** Optional brand-name picker (used by Campaigns; brands list is derived
   *  from whatever campaigns the screen has loaded). */
  brands?: string[];
  selectedBrands?: string[];
  setSelectedBrands?: React.Dispatch<React.SetStateAction<string[]>>;
};

export default function FilterModal({
  visible,
  onClose,
  selectedCategories,
  setSelectedCategories,
  budgetRange,
  setBudgetRange,
  budgetMaxDefault = 10000,
  selectedPlatforms,
  setSelectedPlatforms,
  isVerifiedOnly,
  setIsVerifiedOnly,
  brands,
  selectedBrands,
  setSelectedBrands,
}: FilterModalProps) {
  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
    );
  };

  const togglePlatform = (p: string) => {
    if (!setSelectedPlatforms) return;
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p],
    );
  };

  const toggleBrand = (name: string) => {
    if (!setSelectedBrands) return;
    setSelectedBrands(prev =>
      prev.includes(name) ? prev.filter(b => b !== name) : [...prev, name],
    );
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setBudgetRange({min: 0, max: budgetMaxDefault});
    if (setSelectedPlatforms) setSelectedPlatforms([]);
    if (setSelectedBrands) setSelectedBrands([]);
    setIsVerifiedOnly(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-[40px] max-h-[88%]">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-slate-100">
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-pink-50 items-center justify-center">
              <ChevronLeft size={24} color="#E60076" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-slate-800">Filters</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text className="text-xs font-bold text-slate-400">Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            className="px-6 py-5"
            showsVerticalScrollIndicator={false}>
            {/* Categories */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-bold text-slate-800">
                  Category
                </Text>
                {selectedCategories.length > 0 && (
                  <Text className="text-[10px] font-bold text-[#E60076]">
                    {selectedCategories.length} selected
                  </Text>
                )}
              </View>
              <View className="flex-row flex-wrap" style={{gap: 8}}>
                <TouchableOpacity
                  onPress={() => setSelectedCategories([])}
                  className={`px-4 py-2.5 rounded-2xl border ${
                    selectedCategories.length === 0
                      ? 'bg-[#E60076] border-[#E60076]'
                      : 'border-slate-100 bg-white'
                  }`}>
                  <Text
                    className={`text-xs font-bold ${
                      selectedCategories.length === 0
                        ? 'text-white'
                        : 'text-slate-600'
                    }`}>
                    All
                  </Text>
                </TouchableOpacity>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => toggleCategory(cat)}
                    className={`px-4 py-2.5 rounded-2xl border ${
                      selectedCategories.includes(cat)
                        ? 'bg-[#E60076] border-[#E60076]'
                        : 'border-slate-100 bg-white'
                    }`}>
                    <Text
                      className={`text-xs font-bold ${
                        selectedCategories.includes(cat)
                          ? 'text-white'
                          : 'text-slate-600'
                      }`}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Budget Range */}
            <View className="mb-6">
              <Text className="text-sm font-bold text-slate-800 mb-3">
                Budget Range
              </Text>
              <View className="flex-row items-center" style={{gap: 16}}>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                    Min (₹)
                  </Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={String(budgetRange.min)}
                    onChangeText={v =>
                      setBudgetRange({...budgetRange, min: parseInt(v) || 0})
                    }
                    className="h-12 bg-slate-50 rounded-xl px-4 font-bold text-slate-700"
                  />
                </View>
                <Text className="text-slate-300 pt-5">—</Text>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                    Max (₹)
                  </Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={String(budgetRange.max)}
                    onChangeText={v =>
                      setBudgetRange({
                        ...budgetRange,
                        max: parseInt(v) || budgetMaxDefault,
                      })
                    }
                    className="h-12 bg-slate-50 rounded-xl px-4 font-bold text-slate-700"
                  />
                </View>
              </View>
            </View>

            {/* Brand picker — Campaigns only; renders only when the caller
                passes the derived `brands` list + state hooks. */}
            {brands && brands.length > 0 && setSelectedBrands && (
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-sm font-bold text-slate-800">Brand</Text>
                  {selectedBrands && selectedBrands.length > 0 && (
                    <TouchableOpacity onPress={() => setSelectedBrands([])}>
                      <Text className="text-[11px] font-bold text-slate-400">
                        Clear
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View
                  style={{maxHeight: 200}}
                  className="border border-slate-100 rounded-2xl p-2">
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="flex-row flex-wrap" style={{gap: 6}}>
                      {brands.map(name => {
                        const active = selectedBrands?.includes(name) || false;
                        return (
                          <TouchableOpacity
                            key={name}
                            onPress={() => toggleBrand(name)}
                            className={`px-3 py-1.5 rounded-xl border ${
                              active
                                ? 'bg-[#E60076] border-[#E60076]'
                                : 'border-slate-100 bg-white'
                            }`}>
                            <Text
                              className={`text-[11px] font-bold ${
                                active ? 'text-white' : 'text-slate-600'
                              }`}>
                              {name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Platforms — only render when caller provides state. Web
                dropped this from the canonical filter; keep optional for
                screens that still want it. */}
            {selectedPlatforms && setSelectedPlatforms && (
              <View className="mb-6">
                <Text className="text-sm font-bold text-slate-800 mb-3">
                  Platform
                </Text>
                <View className="flex-row flex-wrap" style={{gap: 8}}>
                  {PLATFORMS.map(p => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => togglePlatform(p)}
                      className={`flex-row items-center px-4 py-2.5 rounded-2xl border ${
                        selectedPlatforms.includes(p)
                          ? 'bg-[#E60076] border-[#E60076]'
                          : 'border-slate-100 bg-white'
                      }`}>
                      <Text
                        className={`text-xs font-bold ${
                          selectedPlatforms.includes(p)
                            ? 'text-white'
                            : 'text-slate-600'
                        }`}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Verified Only */}
            <View className="mb-6 flex-row items-center justify-between bg-slate-50 p-4 rounded-2xl">
              <View>
                <Text className="text-sm font-bold text-slate-800">
                  Verified Only
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  4.7+ rating brands
                </Text>
              </View>
              <Switch
                value={isVerifiedOnly}
                onValueChange={setIsVerifiedOnly}
                trackColor={{false: '#E2E8F0', true: '#FCE6F1'}}
                thumbColor={isVerifiedOnly ? '#E60076' : '#CBD5E1'}
              />
            </View>

            <View className="h-4" />
          </ScrollView>

          {/* Footer Buttons */}
          <View
            className="px-6 py-4 border-t border-slate-100 flex-row"
            style={{gap: 12}}>
            <TouchableOpacity
              onPress={handleReset}
              className="flex-1 h-14 rounded-2xl bg-slate-50 items-center justify-center">
              <Text className="text-sm font-bold text-slate-700">Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} className="flex-1">
              <LinearGradient
                colors={['#9810FA', '#E60076']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={{borderRadius: 16, height: 56}}
                className="items-center justify-center">
                <Text className="text-white font-bold text-sm">
                  Apply Filters
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
