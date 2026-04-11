import React from 'react';
import {View, Text, TouchableOpacity, Linking} from 'react-native';
import {
  CheckCircle2,
  ChevronRight,
  Globe,
  MapPin,
  Briefcase,
  User,
  Phone,
  Mail,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  FileText,
  Lock,
  Bell,
  Settings,
  LogOut,
  ExternalLink,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import BrandsLayout from '../layouts/BrandLayout';

type InfoRowProps = {
  icon: React.ReactNode;
  label: string;
  sub: string;
  last?: boolean;
  isLink?: boolean;
  isVerified?: boolean;
};

type DocDetail = {
  label: string;
  val: string;
};

export default function BrandProfile() {
  return (
    <BrandsLayout>
      {/* Header */}
      <LinearGradient
        colors={['#4C75BE', '#4A3996']}
        className="pt-12 pb-8 px-6 rounded-b-[40px] mb-20">
        <View className="flex-row items-center mb-4">
          <Text className="text-2xl font-bold text-white">My Profile</Text>
        </View>
      </LinearGradient>

      {/* Main Profile Card */}
      <View className="px-6 -mt-4 mb-8">
        <View className="bg-white rounded-[32px] p-6 shadow-sm shadow-black/5">
          {/* Avatar */}
          <View className="items-center -mt-16">
            <View className="relative">
              <LinearGradient
                colors={['#2563EB', '#1D4ED8']}
                className="w-24 h-24 rounded-[28px] items-center justify-center shadow-xl">
                <Text className="text-white text-3xl font-bold">N</Text>
              </LinearGradient>
              <View className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md">
                <View className="bg-blue-600 p-1.5 rounded-full">
                  <Instagram size={12} color="#FFFFFF" />
                </View>
              </View>
            </View>

            <View className="items-center mt-4">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xl font-extrabold text-gray-900">
                  Nike India
                </Text>
                <CheckCircle2 size={18} color="#3B82F6" />
              </View>
              <Text className="text-[11px] text-gray-400 font-semibold mt-1">
                @nikeindia • ID: NK-I30452
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View className="flex-row gap-3 mt-8">
            <StatBox label="Campaigns" value="58" color="text-blue-600" />
            <StatBox label="Rating" value="4.8★" color="text-green-500" />
            <StatBox label="Paid Out" value="₹4.2Cr" color="text-orange-500" />
          </View>
        </View>
      </View>

      {/* Information Sections */}
      <View className="px-6 gap-8 pb-8">
        {/* Brand Info */}
        <Section title="Brand Information">
          <View className="bg-white rounded-3xl overflow-hidden border border-gray-100/50">
            <InfoRow
              icon={<Briefcase size={18} color="#60A5FA" />}
              label="Nike India Pvt. Ltd."
              sub="Brand / Company Name"
            />
            <InfoRow
              icon={<Globe size={18} color="#3B82F6" />}
              label="nikeindia.com"
              sub="Website"
              isLink
            />
            <InfoRow
              icon={<MapPin size={18} color="#93C5FD" />}
              label="Mumbai, Maharashtra"
              sub="Headquarters"
            />
            <InfoRow
              icon={<Briefcase size={18} color="#60A5FA" />}
              label="Sportswear • Fitness • Lifestyle"
              sub="Brand Categories"
              last
            />
          </View>
        </Section>

        {/* Contact Details */}
        <Section title="Contact Details">
          <View className="bg-white rounded-3xl overflow-hidden border border-gray-100/50">
            <InfoRow
              icon={<User size={18} color="#4ADE80" />}
              label="Nishant Mehta"
              sub="Brand Manager"
            />
            <InfoRow
              icon={<Phone size={18} color="#22C55E" />}
              label="+91 91001 10001"
              sub="Business Mobile"
              isVerified
            />
            <InfoRow
              icon={<Mail size={18} color="#F87171" />}
              label="collaboration@nikeindia.com"
              sub="Partnership Email"
              isVerified
              last
            />
          </View>
        </Section>

        {/* Social Media */}
        <Section title="Social Media">
          <View className="flex-row flex-wrap gap-3">
            <SocialCard
              icon={<Instagram size={16} color="#FFFFFF" />}
              iconBg="bg-pink-500"
              label="Instagram"
              handle="@nikeindia"
            />
            <SocialCard
              icon={<Youtube size={16} color="#FFFFFF" />}
              iconBg="bg-red-600"
              label="YouTube"
              handle="@nikeindia"
            />
            <SocialCard
              icon={<Twitter size={16} color="#FFFFFF" />}
              iconBg="bg-black"
              label="X (Twitter)"
              handle="@nikeindia"
            />
            <SocialCard
              icon={<Facebook size={16} color="#FFFFFF" />}
              iconBg="bg-blue-600"
              label="Facebook"
              handle="Nike India"
            />
          </View>
        </Section>

        {/* Docs */}
        <Section title="Tax & Legal Documents">
          <DocCard
            type="GST Registration"
            status="Active"
            id="27AAACN0611Q1Z4"
            details={[
              {label: 'Business Type', val: 'Pvt. Ltd.'},
              {label: 'State Code', val: '27 - Maharashtra'},
              {label: 'Reg. Date', val: '01 Jul 2017'},
              {label: 'Filing Cycle', val: 'Monthly'},
            ]}
          />
        </Section>

        {/* Account & Logout */}
        <Section title="Account">
          <View className="bg-white rounded-3xl overflow-hidden border border-gray-100/50 mb-4">
            <ControlRow
              icon={<Lock size={18} color="#3B82F6" />}
              label="Change Password"
            />
            <ControlRow
              icon={<Bell size={18} color="#60A5FA" />}
              label="Notification Preferences"
            />
            <ControlRow
              icon={<Settings size={18} color="#FB923C" />}
              label="Account Settings"
              last
            />
          </View>
          <TouchableOpacity
            className="w-full bg-white p-5 rounded-3xl flex-row items-center gap-4 border border-gray-100/50 shadow-sm"
            activeOpacity={0.8}>
            <View className="p-2 bg-red-50 rounded-xl">
              <LogOut size={18} color="#EF4444" />
            </View>
            <Text className="text-red-500 font-bold text-sm">Log Out</Text>
          </TouchableOpacity>
        </Section>
      </View>
    </BrandsLayout>
  );
}

/* --- Helper Components --- */

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View className="gap-3">
    <Text className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest px-2">
      {title}
    </Text>
    {children}
  </View>
);

const StatBox = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <View className="flex-1 bg-[#F8F9FE] py-3 px-1 rounded-2xl items-center border border-gray-50">
    <Text className={`text-[13px] font-extrabold ${color}`}>{value}</Text>
    <Text className="text-[8px] text-gray-400 font-bold uppercase mt-0.5 tracking-tight">
      {label}
    </Text>
  </View>
);

const InfoRow = ({icon, label, sub, last, isLink, isVerified}: InfoRowProps) => (
  <TouchableOpacity
    className={`flex-row items-center gap-4 p-5 ${!last ? 'border-b border-gray-50' : ''}`}
    activeOpacity={0.7}
    onPress={isLink ? () => Linking.openURL(`https://${label}`) : undefined}>
    <View className="p-2.5 bg-blue-50 rounded-xl">{icon}</View>
    <View className="flex-1">
      <Text className="text-[11px] font-bold text-gray-900 leading-tight">
        {label}
      </Text>
      <Text className="text-[9px] text-gray-400 font-semibold mt-0.5">
        {sub}
      </Text>
    </View>
    <View className="flex-row items-center gap-2">
      {isVerified && (
        <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
      )}
      {isLink ? (
        <ExternalLink size={14} color="#D1D5DB" />
      ) : (
        <ChevronRight size={16} color="#D1D5DB" />
      )}
    </View>
  </TouchableOpacity>
);

const SocialCard = ({
  icon,
  iconBg,
  label,
  handle,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  handle: string;
}) => (
  <View className="w-[48%] bg-white p-4 rounded-2xl border border-gray-50 flex-row items-center gap-3">
    <View className={`p-2 ${iconBg} rounded-lg`}>{icon}</View>
    <View className="flex-1 overflow-hidden">
      <Text className="text-[8px] text-gray-400 font-extrabold uppercase">
        {label}
      </Text>
      <Text className="text-[10px] font-bold text-gray-900 mt-1" numberOfLines={1}>
        {handle}
      </Text>
    </View>
  </View>
);

const DocCard = ({
  type,
  status,
  id,
  details,
}: {
  type: string;
  status: string;
  id: string;
  details: DocDetail[];
}) => (
  <View className="bg-white rounded-[32px] p-6 border border-gray-100/50 overflow-hidden">
    {/* Left accent bar */}
    <View className="absolute top-0 left-0 w-1.5 h-full bg-orange-400" />

    <View className="flex-row justify-between items-start mb-6">
      <View className="flex-row gap-3">
        <View className="p-2.5 bg-orange-50 rounded-xl">
          <FileText size={20} color="#F97316" />
        </View>
        <View>
          <Text className="text-[11px] font-extrabold text-gray-900">
            {type}
          </Text>
          <Text className="text-[9px] text-gray-400 font-semibold">
            Goods & Services Tax
          </Text>
        </View>
      </View>
      <View className="bg-green-50 px-3 py-1 rounded-lg">
        <Text className="text-[9px] font-bold text-green-500 uppercase tracking-wider">
          {status}
        </Text>
      </View>
    </View>

    <View className="mb-5">
      <Text className="text-[8px] text-gray-400 font-extrabold uppercase mb-1">
        GSTIN Number
      </Text>
      <Text className="text-[13px] font-extrabold text-gray-900 tracking-wider">
        {id}
      </Text>
    </View>

    <View className="flex-row flex-wrap">
      {details.map((d, i) => (
        <View key={i} className="w-1/2 mb-4">
          <Text className="text-[8px] text-gray-400 font-extrabold uppercase mb-0.5">
            {d.label}
          </Text>
          <Text className="text-[10px] font-bold text-gray-900">{d.val}</Text>
        </View>
      ))}
    </View>
  </View>
);

const ControlRow = ({
  icon,
  label,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  last?: boolean;
}) => (
  <TouchableOpacity
    className={`flex-row items-center gap-4 p-5 ${!last ? 'border-b border-gray-50' : ''}`}
    activeOpacity={0.7}>
    <View className="p-2.5 bg-blue-50 rounded-xl">{icon}</View>
    <Text className="flex-1 text-[11px] font-bold text-gray-700">{label}</Text>
    <ChevronRight size={16} color="#D1D5DB" />
  </TouchableOpacity>
);
