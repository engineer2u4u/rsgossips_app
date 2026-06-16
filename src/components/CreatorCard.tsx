import React from 'react';
import { View, Text, Image, Pressable, Linking } from 'react-native';
import { CheckCircle, Link } from 'lucide-react-native';
import { CARD_SHADOW } from '../theme/brand';

interface CreatorCardProps {
  name: string;
  verified?: boolean;
  image: string;
  posts: string | number;
  followers: string | number;
  following: string | number;
  bio: string;
  link: string;
}

export default function CreatorCard({
  name,
  verified,
  image,
  posts,
  followers,
  following,
  bio,
  link,
}: CreatorCardProps) {
  return (
    <View
      className="border border-gray-200 rounded-xl p-6 w-[280px] flex flex-col gap-4 bg-white mb-10"
      style={CARD_SHADOW}>
      {/* Name */}
      <View className="flex-row items-center justify-center">
        <Text className="text-lg font-semibold">{name}</Text>
        {verified && (
          <CheckCircle size={16} color="#3B82F6" style={{ marginLeft: 4 }} />
        )}
      </View>

      {/* Gradient Border Avatar */}
      <View className="items-center">
        <View className="p-2 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-400">
          <View className="bg-white rounded-full">
            <Image source={{ uri: image }} className="w-52 h-52 rounded-full" />
          </View>
        </View>
      </View>

      {/* Stats — empty values are hidden so featured_creators rows (which
          only carry followers_label) don't render blank columns. */}
      <View className="flex-row justify-around text-center mt-1 pb-2">
        {!!posts && (
          <View className="items-center">
            <Text className="font-semibold">{posts}</Text>
            <Text className="text-gray-500 text-xs">posts</Text>
          </View>
        )}

        {!!followers && (
          <View className="items-center">
            <Text className="font-semibold">{followers}</Text>
            <Text className="text-gray-500 text-xs">followers</Text>
          </View>
        )}

        {!!following && (
          <View className="items-center">
            <Text className="font-semibold">{following}</Text>
            <Text className="text-gray-500 text-xs">following</Text>
          </View>
        )}
      </View>

      {/* Bio (optional) */}
      {bio && <Text className="text-sm text-gray-700 text-center">{bio}</Text>}

      {/* Link Button */}
      {/* {link && (
        <Pressable
          onPress={() => Linking.openURL(link)}
          className="flex-row items-center justify-center gap-2 border rounded-full px-4 py-2 mt-2"
        >
          <Link size={16} color="#2563EB" />
          <Text className="text-blue-600 text-sm flex-shrink">{link}</Text>
        </Pressable>
      )} */}
    </View>
  );
}
