import React from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import {ChevronLeft, Smartphone, Monitor, Tablet, Trash2} from 'lucide-react-native';

interface TrustedDevicesProps {
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

const DeviceCard = ({
  icon,
  name,
  location,
  lastActive,
  isCurrent,
}: {
  icon: React.ReactNode;
  name: string;
  location: string;
  lastActive: string;
  isCurrent?: boolean;
}) => (
  <View className="flex-row items-center px-5 py-4 bg-white border-b border-slate-50">
    <View className="w-12 h-12 rounded-xl bg-[#FCE6F1] items-center justify-center mr-4">
      {icon}
    </View>
    <View className="flex-1">
      <View className="flex-row items-center">
        <Text className="text-base font-medium text-slate-700">{name}</Text>
        {isCurrent && (
          <View className="ml-2 px-2 py-0.5 rounded-full bg-green-100">
            <Text className="text-xs font-semibold text-green-600">Current</Text>
          </View>
        )}
      </View>
      <Text className="text-xs text-slate-400 mt-1">{location}</Text>
      <Text className="text-xs text-slate-400">{lastActive}</Text>
    </View>
    {!isCurrent && (
      <TouchableOpacity className="p-2">
        <Trash2 size={18} color="#ef4444" />
      </TouchableOpacity>
    )}
  </View>
);

const TrustedDevices: React.FC<TrustedDevicesProps> = ({onBack}) => {
  return (
    <View className="flex-1 bg-slate-50">
      <PageHeader title="Trusted Devices" onBack={onBack} />

      <ScrollView className="flex-1">
        <Text className="px-6 pt-6 pb-3 text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Active Sessions
        </Text>

        <View className="mx-4 rounded-2xl overflow-hidden bg-white shadow-sm">
          <DeviceCard
            icon={<Smartphone size={20} color="#E60076" />}
            name="iPhone 15 Pro"
            location="New York, US"
            lastActive="Active now"
            isCurrent
          />
          <DeviceCard
            icon={<Monitor size={20} color="#E60076" />}
            name="Chrome on MacBook Pro"
            location="New York, US"
            lastActive="Last active 2 hours ago"
          />
          <DeviceCard
            icon={<Tablet size={20} color="#E60076" />}
            name="iPad Air"
            location="Boston, US"
            lastActive="Last active 3 days ago"
          />
        </View>

        {/* Remove All Button */}
        <TouchableOpacity className="flex-row items-center justify-center mx-6 mt-8 py-4 rounded-xl border-2 border-red-200 bg-red-50">
          <Trash2 size={18} color="#ef4444" />
          <Text className="text-red-500 font-bold text-base ml-2">
            Remove All Other Devices
          </Text>
        </TouchableOpacity>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
};

export default TrustedDevices;
