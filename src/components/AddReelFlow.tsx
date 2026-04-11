import React from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import {ChevronLeft, Upload, Film, Music, Type} from 'lucide-react-native';

interface AddReelFlowProps {
  onBack: () => void;
}

const PageHeader = ({title, onBack}: {title: string; onBack: () => void}) => (
  <View className="flex-row items-center gap-4 px-6 py-4 bg-white border-b border-slate-100">
    <TouchableOpacity onPress={onBack} className="p-2 rounded-full bg-[#FCE6F1]">
      <ChevronLeft size={20} color="#E60076" />
    </TouchableOpacity>
    <Text className="text-lg font-bold text-slate-800">{title}</Text>
  </View>
);

const AddReelFlow: React.FC<AddReelFlowProps> = ({onBack}) => {
  return (
    <View className="flex-1 bg-slate-50">
      <PageHeader title="Add Reel" onBack={onBack} />

      <ScrollView className="flex-1 px-6 pt-6">
        {/* Upload Area */}
        <TouchableOpacity className="items-center justify-center h-56 border-2 border-dashed border-[#E60076] rounded-2xl bg-[#FCE6F1]/30 mb-6">
          <Upload size={40} color="#E60076" />
          <Text className="text-base font-semibold text-[#E60076] mt-3">
            Upload Video
          </Text>
          <Text className="text-sm text-slate-400 mt-1">
            MP4, MOV up to 60 seconds
          </Text>
        </TouchableOpacity>

        {/* Options */}
        <Text className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Reel Options
        </Text>

        <View className="rounded-2xl overflow-hidden bg-white shadow-sm">
          <TouchableOpacity className="flex-row items-center px-5 py-4 border-b border-slate-50">
            <View className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center mr-4">
              <Film size={18} color="#E60076" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-medium text-slate-700">Choose Cover</Text>
              <Text className="text-xs text-slate-400">Select a thumbnail for your reel</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center px-5 py-4 border-b border-slate-50">
            <View className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center mr-4">
              <Music size={18} color="#E60076" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-medium text-slate-700">Add Music</Text>
              <Text className="text-xs text-slate-400">Browse trending audio</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center px-5 py-4">
            <View className="w-10 h-10 rounded-full bg-[#FCE6F1] items-center justify-center mr-4">
              <Type size={18} color="#E60076" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-medium text-slate-700">Add Caption</Text>
              <Text className="text-xs text-slate-400">Write a description for your reel</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Publish Button */}
        <TouchableOpacity className="items-center justify-center mx-0 mt-8 mb-6 py-4 rounded-xl bg-[#E60076]">
          <Text className="text-white font-bold text-base">Publish Reel</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default AddReelFlow;
