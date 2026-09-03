import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import {X} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

type FilterData = {
  categories: string[];
  platforms: {label: string}[];
  statusOptions: string[];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  filterData: FilterData;
};

export const CampaignFilters = ({visible, onClose, filterData}: Props) => {
  const {t} = useTranslation();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  const toggleItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string,
  ) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-white rounded-t-[40px] max-h-[85%]">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-slate-100">
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#94A3B8" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-slate-800">
              {t('CampaignFilters.title')}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedCategories([]);
                setSelectedPlatforms([]);
                setSelectedStatus([]);
              }}>
              <Text className="text-xs font-bold text-[#E60076]">
                {t('CampaignFilters.reset')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="px-6 py-5" showsVerticalScrollIndicator={false}>
            {/* Categories */}
            <View className="mb-6">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                {t('CampaignFilters.categories')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {filterData.categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() =>
                      toggleItem(selectedCategories, setSelectedCategories, cat)
                    }
                    className={`px-4 py-2 rounded-full ${
                      selectedCategories.includes(cat)
                        ? 'bg-[#E60076]'
                        : 'bg-slate-50'
                    }`}>
                    <Text
                      className={`text-xs font-semibold ${
                        selectedCategories.includes(cat)
                          ? 'text-white'
                          : 'text-slate-500'
                      }`}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Platforms */}
            <View className="mb-6">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                {t('CampaignFilters.platforms')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {filterData.platforms.map(p => (
                  <TouchableOpacity
                    key={p.label}
                    onPress={() =>
                      toggleItem(
                        selectedPlatforms,
                        setSelectedPlatforms,
                        p.label,
                      )
                    }
                    className={`px-4 py-2 rounded-full ${
                      selectedPlatforms.includes(p.label)
                        ? 'bg-[#E60076]'
                        : 'bg-slate-50'
                    }`}>
                    <Text
                      className={`text-xs font-semibold ${
                        selectedPlatforms.includes(p.label)
                          ? 'text-white'
                          : 'text-slate-500'
                      }`}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status */}
            <View className="mb-6">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                {t('CampaignFilters.status')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {filterData.statusOptions.map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() =>
                      toggleItem(selectedStatus, setSelectedStatus, s)
                    }
                    className={`px-4 py-2 rounded-full ${
                      selectedStatus.includes(s)
                        ? 'bg-[#E60076]'
                        : 'bg-slate-50'
                    }`}>
                    <Text
                      className={`text-xs font-semibold ${
                        selectedStatus.includes(s)
                          ? 'text-white'
                          : 'text-slate-500'
                      }`}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="h-4" />
          </ScrollView>

          {/* Apply Button */}
          <View className="px-6 py-4 border-t border-slate-100">
            <TouchableOpacity
              onPress={onClose}
              className="py-4 items-center justify-center rounded-2xl overflow-hidden">
              <LinearGradient
                colors={['#E60076', '#D500F9']}
                style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
              />
              <Text className="text-white font-bold text-sm">
                {t('CampaignFilters.applyFilters')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
