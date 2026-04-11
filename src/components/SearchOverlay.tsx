import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import {Search, X, Clock} from 'lucide-react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  recentSearches: string[];
};

export const SearchOverlay = ({visible, onClose, recentSearches}: Props) => {
  const [query, setQuery] = useState('');

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/50">
        <View className="flex-1 bg-white mt-12 rounded-t-3xl">
          {/* Search Header */}
          <View className="flex-row items-center gap-3 px-6 py-4 border-b border-slate-100">
            <Search size={20} color="#94A3B8" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search campaigns..."
              placeholderTextColor="#94A3B8"
              autoFocus
              className="flex-1 text-sm text-slate-700"
            />
            <TouchableOpacity onPress={onClose}>
              <X size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Recent Searches */}
          <ScrollView className="px-6 pt-4">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Recent Searches
            </Text>
            {recentSearches.map(term => (
              <TouchableOpacity
                key={term}
                className="flex-row items-center gap-3 py-3">
                <Clock size={14} color="#CBD5E1" />
                <Text className="text-sm text-slate-600">{term}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
