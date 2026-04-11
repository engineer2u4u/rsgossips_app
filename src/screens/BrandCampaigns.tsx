import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Search,
  SlidersHorizontal,
  ArrowRight,
  Plus,
  X,
  Calendar,
  ChevronDown,
  Upload,
  ArrowUpRight,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import BrandsLayout from '../layouts/BrandLayout';
import {CampaignCard} from '../components/brands/CampaignCard';
import {FeaturedCampaign} from '../components/brands/FeaturedCampaign';

const TABS = ['Live', 'My Posts', 'Applied', 'Missed'];

export default function BrandCampaigns() {
  const [activeTab, setActiveTab] = useState('Live');

  return (
    <BrandsLayout>
      {/* Header Section */}
      <View className="relative mb-16">
        <LinearGradient
          colors={['#4C75BE', '#4A3996']}
          className="px-6 pt-12 pb-16 rounded-b-[40px]">
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-2xl font-bold text-white">Campaign</Text>
              <Text className="text-purple-100 text-xs">
                Discover new opportunities
              </Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity className="p-2 bg-white/10 rounded-full">
                <Search size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity className="p-2 bg-white/10 rounded-full">
                <SlidersHorizontal size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Search + Tabs overlay */}
        <View className="absolute left-6 right-6 -bottom-12">
          {/* Search Bar */}
          <View className="flex-row items-center bg-white rounded-3xl p-2 shadow-md shadow-gray-200 mb-4">
            <TextInput
              placeholder="Enter Campaign Name........"
              placeholderTextColor="#D1D5DB"
              className="flex-1 pl-4 text-sm text-gray-800"
            />
            <LinearGradient
              colors={['#5851DB', '#4338CA']}
              className="rounded-full">
              <TouchableOpacity className="p-2.5">
                <ArrowRight size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="gap-3">
            {TABS.map(tab =>
              activeTab === tab ? (
                <LinearGradient
                  key={tab}
                  colors={['#5851DB', '#4338CA']}
                  className="rounded-full shadow-lg shadow-purple-100">
                  <TouchableOpacity
                    onPress={() => setActiveTab(tab)}
                    className="px-6 py-2 flex-row items-center gap-2">
                    {tab === 'Live' && (
                      <View className="w-2 h-2 bg-red-500 rounded-full" />
                    )}
                    <Text className="text-xs font-semibold text-white">
                      {tab}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              ) : (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className="px-6 py-2 rounded-full bg-white flex-row items-center gap-2">
                  <Text className="text-xs font-semibold text-gray-400">
                    {tab}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </ScrollView>
        </View>
      </View>

      {activeTab === 'Live' ? (
        <View>
          {/* Featured Campaign */}
          <View className="px-6 mt-4">
            <FeaturedCampaign />
          </View>

          <View className="px-6 mt-8 pb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-bold text-gray-900">
                Recent Campaigns
              </Text>
              <TouchableOpacity>
                <Text className="text-[10px] text-[#5851DB] font-bold">
                  See all
                </Text>
              </TouchableOpacity>
            </View>
            <View className="gap-4">
              <CampaignCard />
              <CampaignCard />
              <CampaignCard />
              <CampaignCard />
              <CampaignCard />
              <CampaignCard />
            </View>
          </View>
        </View>
      ) : activeTab === 'My Posts' ? (
        <View className="items-center justify-center pt-20 px-10">
          <Image
            source={{uri: 'https://via.placeholder.com/160x160?text=Empty'}}
            className="w-40 h-40 opacity-80 mb-6"
          />
          <Text className="text-lg font-bold text-gray-900 mb-2 text-center">
            You haven't posted yet
          </Text>
          <Text className="text-xs text-gray-400 leading-5 text-center">
            Post your requirements to connect creators and boost your campaign
            in ease.
          </Text>
          <CreateCampaignButton label="Post a Request" />
        </View>
      ) : null}

      {/* Floating FAB */}
      <View className="absolute bottom-24 right-6 z-50">
        <CreateCampaignButton label="Post Request" showIcon />
      </View>
    </BrandsLayout>
  );
}

/* Campaign Form Modal */
const CampaignFormModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/40 justify-end">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="bg-white rounded-t-[40px] max-h-[92%]">
            {/* Header */}
            <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-100">
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-gray-900">
                Create Campaign Request
              </Text>
              <View className="w-6" />
            </View>

            {/* Form */}
            <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
              <View className="gap-6">
                {/* Title */}
                <View>
                  <Text className="text-xs font-bold text-gray-900 mb-2">
                    Title <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    placeholder="Enter campaign title"
                    placeholderTextColor="#D1D5DB"
                    className="w-full bg-[#F8F9FE] p-4 rounded-2xl text-sm"
                  />
                </View>

                {/* Description */}
                <View>
                  <Text className="text-xs font-bold text-gray-900 mb-2">
                    Description <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    placeholder="Describe what you're looking for..."
                    placeholderTextColor="#D1D5DB"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="w-full bg-[#F8F9FE] p-4 rounded-2xl text-sm min-h-[100px]"
                  />
                </View>

                {/* Category */}
                <View>
                  <Text className="text-xs font-bold text-gray-900 mb-2">
                    Category
                  </Text>
                  <TouchableOpacity className="w-full bg-[#F8F9FE] p-4 rounded-2xl flex-row items-center justify-between">
                    <Text className="text-sm text-gray-400">
                      Select Category
                    </Text>
                    <ChevronDown size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* Budget & Deadline */}
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                      Budget{' '}
                      <Text className="text-[10px] normal-case">
                        (Optional)
                      </Text>
                    </Text>
                    <TextInput
                      placeholder="Set Budget"
                      placeholderTextColor="#D1D5DB"
                      className="w-full bg-[#F8F9FE] p-4 rounded-2xl text-sm"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                      Deadline{' '}
                      <Text className="text-[10px] normal-case">
                        (Optional)
                      </Text>
                    </Text>
                    <TouchableOpacity className="w-full bg-[#F8F9FE] p-4 rounded-2xl flex-row items-center justify-between">
                      <Text className="text-sm text-gray-400">
                        Pick a date
                      </Text>
                      <Calendar size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Attachments */}
                <View>
                  <Text className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                    Attachments{' '}
                    <Text className="text-[10px] normal-case">(Optional)</Text>
                  </Text>
                  <TouchableOpacity className="w-full border-2 border-dashed border-gray-100 rounded-[32px] p-10 items-center justify-center gap-3 bg-white">
                    <View className="p-3 bg-[#F8F9FE] rounded-full">
                      <Upload size={24} color="#9CA3AF" />
                    </View>
                    <Text className="text-xs font-bold text-gray-900">
                      Tap to upload
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="h-4" />
            </ScrollView>

            {/* Footer Buttons */}
            <View className="p-6 flex-row gap-4 border-t border-gray-100">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 py-4 rounded-2xl border border-gray-100 items-center">
                <Text className="font-bold text-gray-900">Cancel</Text>
              </TouchableOpacity>
              <LinearGradient
                colors={['#5851DB', '#4338CA']}
                className="flex-1 rounded-2xl">
                <TouchableOpacity className="py-4 items-center">
                  <Text className="font-bold text-white">Submit Request</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

/* Reusable button that opens the campaign form modal */
const CreateCampaignButton = ({
  label,
  showIcon,
}: {
  label: string;
  showIcon?: boolean;
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <LinearGradient
        colors={['#5851DB', '#4338CA']}
        className={`rounded-2xl shadow-lg shadow-purple-200 ${showIcon ? '' : 'mt-8'}`}>
        <TouchableOpacity
          onPress={() => setVisible(true)}
          className="px-6 py-3 flex-row items-center gap-2"
          activeOpacity={0.8}>
          {showIcon && <Plus size={20} color="#FFFFFF" />}
          <Text className="text-white font-bold text-sm">{label}</Text>
          {!showIcon && <ArrowUpRight size={18} color="#FFFFFF" />}
        </TouchableOpacity>
      </LinearGradient>
      <CampaignFormModal visible={visible} onClose={() => setVisible(false)} />
    </>
  );
};
