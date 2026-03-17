import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  Camera,
  User,
  AtSign,
  MapPin,
  Instagram,
  Youtube,
} from 'lucide-react-native';

interface Props {
  onNext: (data: any) => void;
}

export default function ProfileDetails({ onNext }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    niche: '',
    location: '',
    instagram: '',
    youtube: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    onNext(formData);
  };

  return (
    <ScrollView className="flex-1 px-6">
      {/* HEADER */}
      <View className="items-center space-y-4 mb-6">
        <Text className="text-xl font-bold text-[#6347F9]">
          Set Up Your Creator Profile
        </Text>

        <View className="relative">
          <View className="w-24 h-24 bg-[#F3EFFF] rounded-full items-center justify-center">
            <User size={40} color="#6347F9" />
          </View>

          <Pressable className="absolute bottom-0 right-0 bg-[#9810FA] p-2 rounded-full">
            <Camera size={16} color="white" />
          </Pressable>
        </View>

        <Text className="text-xs text-slate-400 font-medium">Upload Photo</Text>
      </View>

      {/* NAME */}
      <View className="space-y-1 mb-4">
        <Text className="text-xs font-semibold text-slate-500">Full Name</Text>

        <View className="flex-row items-center border border-slate-200 rounded-xl px-3 h-12">
          <User size={18} color="#6347F9" />
          <TextInput
            placeholder="Your name"
            value={formData.name}
            onChangeText={v => handleChange('name', v)}
            className="flex-1 ml-3"
          />
        </View>
      </View>

      {/* USERNAME */}
      <View className="space-y-1 mb-4">
        <Text className="text-xs font-semibold text-slate-500">Username</Text>

        <View className="flex-row items-center border border-slate-200 rounded-xl px-3 h-12">
          <AtSign size={18} color="#6347F9" />
          <TextInput
            placeholder="@yourhandle"
            value={formData.username}
            onChangeText={v => handleChange('username', v)}
            className="flex-1 ml-3"
          />
        </View>
      </View>

      {/* NICHE */}
      <View className="space-y-1 mb-4">
        <Text className="text-xs font-semibold text-slate-500">
          Niche / Category
        </Text>

        <View className="border border-slate-200 rounded-xl">
          <Picker
            selectedValue={formData.niche}
            onValueChange={v => handleChange('niche', v)}
          >
            <Picker.Item label="Select niche" value="" />
            <Picker.Item label="Fitness" value="fitness" />
            <Picker.Item label="Tech" value="tech" />
          </Picker>
        </View>
      </View>

      {/* LOCATION */}
      <View className="space-y-1 mb-4">
        <Text className="text-xs font-semibold text-slate-500">Location</Text>

        <View className="flex-row items-center border border-slate-200 rounded-xl px-3 h-12">
          <MapPin size={18} color="#6347F9" />
          <TextInput
            placeholder="City, Country"
            value={formData.location}
            onChangeText={v => handleChange('location', v)}
            className="flex-1 ml-3"
          />
        </View>
      </View>

      {/* SOCIAL LINKS */}
      <View className="mt-4 mb-6">
        <Text className="text-xs font-bold text-slate-900 mb-2">
          Social Links
        </Text>

        {/* Instagram */}
        <View className="flex-row items-center border border-slate-200 rounded-xl px-3 h-12 mb-3">
          <Instagram size={18} color="#6347F9" />
          <TextInput
            placeholder="@instagram"
            value={formData.instagram}
            onChangeText={v => handleChange('instagram', v)}
            className="flex-1 ml-3"
          />
        </View>

        {/* YouTube */}
        <View className="flex-row items-center border border-slate-200 rounded-xl px-3 h-12">
          <Youtube size={18} color="#6347F9" />
          <TextInput
            placeholder="Channel link"
            value={formData.youtube}
            onChangeText={v => handleChange('youtube', v)}
            className="flex-1 ml-3"
          />
        </View>
      </View>

      {/* BUTTONS */}
      <View className="space-y-3 mb-10">
        <Pressable
          onPress={handleContinue}
          className="h-[54px] rounded-3xl bg-[#9810FA] items-center justify-center"
        >
          <Text className="text-white font-semibold text-base">
            Save & Continue
          </Text>
        </Pressable>

        <Pressable onPress={handleContinue}>
          <Text className="text-center text-sm font-semibold text-[#6347F9]">
            Skip for now
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
