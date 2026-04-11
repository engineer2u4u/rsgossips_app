import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { SlidersHorizontal, X } from 'lucide-react-native';

const FILTER_OPTIONS = [
  { label: 'Followers', options: ['< 10K', '10K - 100K', '100K - 1M', '1M+'] },
  {
    label: 'Platform',
    options: ['Instagram', 'YouTube', 'Twitter', 'LinkedIn'],
  },
  {
    label: 'Location',
    options: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'],
  },
  {
    label: 'Price Range',
    options: ['< ₹5K', '₹5K - ₹25K', '₹25K - ₹1L', '₹1L+'],
  },
];

export const FilterDrawer = () => {
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  const toggleOption = (group: string, option: string) => {
    setSelected(prev => {
      const current = prev[group] || [];
      if (current.includes(option)) {
        return { ...prev, [group]: current.filter(o => o !== option) };
      }
      return { ...prev, [group]: [...current, option] };
    });
  };

  const isSelected = (group: string, option: string) =>
    (selected[group] || []).includes(option);

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        className="flex-row items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full"
      >
        <SlidersHorizontal size={12} color="#374151" />
        <Text className="text-[11px] font-semibold text-gray-700">Filters</Text>
      </Pressable>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[75%] pb-8">
            {/* Header */}
            <View className="flex-row justify-between items-center px-6 pt-6 pb-4 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-900">Filters</Text>
              <Pressable onPress={() => setVisible(false)} className="p-1">
                <X size={20} color="#374151" />
              </Pressable>
            </View>

            <ScrollView
              className="px-6 pt-4"
              showsVerticalScrollIndicator={false}
            >
              {FILTER_OPTIONS.map(group => (
                <View key={group.label} className="mb-6">
                  <Text className="text-sm font-bold text-gray-800 mb-3">
                    {group.label}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {group.options.map(option => (
                      <Pressable
                        key={option}
                        onPress={() => toggleOption(group.label, option)}
                        className={`px-4 py-2 rounded-2xl w-24 mx-auto text-center border ${
                          isSelected(group.label, option)
                            ? 'bg-[#4C75BE] border-[#4C75BE]'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            isSelected(group.label, option)
                              ? 'text-white'
                              : 'text-gray-600'
                          }`}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Apply Button */}
            <View className="px-6 pt-4">
              <Pressable
                onPress={() => setVisible(false)}
                className="bg-[#4C75BE] py-3.5 rounded-2xl items-center"
              >
                <Text className="text-white font-bold text-sm">
                  Apply Filters
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
