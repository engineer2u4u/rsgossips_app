import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  Video,
  Smartphone,
  Youtube,
  Image as ImageIcon,
  Clapperboard,
} from 'lucide-react-native';

interface Props {
  onNext: (data: { services: string[]; rateRange: string }) => void;
}

const services = [
  { id: 'reels', label: 'Reels', icon: Video },
  { id: 'stories', label: 'Stories', icon: Smartphone },
  { id: 'shorts', label: 'YouTube Shorts', icon: Youtube },
  { id: 'posts', label: 'Static Posts', icon: ImageIcon },
  { id: 'ugc', label: 'UGC Videos', icon: Clapperboard },
];

const rateRanges = [
  '₹10,000 - ₹50,000',
  '₹50,000 - ₹1,00,000',
  '₹1,00,000 - ₹2,50,000',
  '₹2,50,000 - ₹5,00,000',
  '₹5,00,000 - ₹10,00,000',
  '₹10,00,000+',
];

export default function Preferences({ onNext }: Props) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [rateRange, setRateRange] = useState('');

  const toggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    );
  };

  return (
    <View className="flex-1 px-6 space-y-8">
      {/* HEADER */}
      <View className="items-center space-y-2">
        <Text className="text-2xl font-bold text-slate-900 text-center">
          Collaboration Preferences
        </Text>

        <Text className="text-slate-500 text-sm text-center">
          Tell brands what you offer
        </Text>
      </View>

      {/* SERVICES GRID */}
      <View className="flex-row flex-wrap justify-between">
        {services.map(service => {
          const Icon = service.icon;
          const isSelected = selectedServices.includes(service.id);

          return (
            <ServiceCard
              key={service.id}
              label={service.label}
              Icon={Icon}
              isSelected={isSelected}
              onPress={() => toggleService(service.id)}
            />
          );
        })}
      </View>

      {/* RATE RANGE */}
      <View className="space-y-2">
        <Text className="text-xs font-medium text-slate-500">Rate Range</Text>

        <View className="border border-slate-200 rounded-xl">
          <Picker
            selectedValue={rateRange}
            onValueChange={v => setRateRange(v)}
          >
            <Picker.Item label="Select rate range" value="" />

            {rateRanges.map(range => (
              <Picker.Item key={range} label={range} value={range} />
            ))}
          </Picker>
        </View>
      </View>

      {/* CONTINUE BUTTON */}
      <Pressable
        onPress={() =>
          onNext({
            services: selectedServices,
            rateRange,
          })
        }
        disabled={selectedServices.length === 0 || !rateRange}
        className={`h-[54px] rounded-2xl items-center justify-center ${
          selectedServices.length === 0 || !rateRange
            ? 'bg-slate-200'
            : 'bg-[#9810FA]'
        }`}
      >
        <Text
          className={`text-base font-semibold ${
            selectedServices.length === 0 || !rateRange
              ? 'text-slate-400'
              : 'text-white'
          }`}
        >
          Continue
        </Text>
      </Pressable>
    </View>
  );
}

interface ServiceCardProps {
  label: string;
  Icon: any;
  isSelected: boolean;
  onPress: () => void;
}

function ServiceCard({ label, Icon, isSelected, onPress }: ServiceCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`w-[30%] aspect-square rounded-2xl border-2 items-center justify-center mb-3 ${
        isSelected
          ? 'border-[#6347F9] bg-[#F3EFFF]'
          : 'border-slate-200 bg-white'
      }`}
    >
      <Icon size={24} color={isSelected ? '#6347F9' : '#94A3B8'} />

      <Text
        className={`text-[10px] font-bold text-center mt-2 ${
          isSelected ? 'text-[#6347F9]' : 'text-slate-400'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
