import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, Image, Pressable, Dimensions } from 'react-native';

interface Props {
  onLoginClick: () => void;
  onSignUpClick: () => void;
}

const slides = [
  {
    title: 'Chat, Negotiate, Close Deals',
    description:
      'Directly connect with brands, negotiate deliverables, and finalize collaborations in minutes.',
    image: require('../assets/login/BrandMessageCard.png'),
  },
  {
    title: 'Find Campaigns That Fit You',
    description:
      'Explore brand deals tailored to your niche, audience, and engagement style.',
    image: require('../assets/login/DiscoverCampaignsCard.png'),
  },
  {
    title: 'Get Paid Securely & On Time',
    description:
      'Track invoices, receive payments, and manage your earnings with transparency.',
    image: require('../assets/login/CreatorWalletCard.png'),
  },
  {
    title: 'Ready to Start?',
    description:
      'Join thousands of creators managing their business efficiently.',
    image: require('../assets/login/TodayCollaborationCard.png'),
  },
];

const { width } = Dimensions.get('window');

export default function OnboardingCarousel({
  onLoginClick,
  onSignUpClick,
}: Props) {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    }
  };

  const skipToLast = () => {
    setCurrent(slides.length - 1);
  };
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-white items-center justify-between">
      {/* TOP IMAGE */}

      <View className="w-full items-center pt-20">
        <Image
          source={slides[current].image}
          resizeMode="contain"
          style={{
            width: width * 0.8,
            height: 320,
          }}
        />
      </View>

      {/* TEXT SECTION */}
      <View className="items-center px-8 pb-12 w-full">
        <View className="mb-6 space-y-2 items-center">
          <Text className="text-[26px] font-bold text-[#0F172A] text-center">
            {slides[current].title}
          </Text>

          <Text className="text-gray-500 text-[15px] text-center px-4">
            {slides[current].description}
          </Text>
        </View>

        {/* PROGRESS BARS */}
        <View className="flex-row gap-2 mb-10">
          {slides.map((_, i) => (
            <View
              key={i}
              className={`h-[6px] rounded-full ${
                current === i ? 'w-8 bg-[#FA288A]' : 'w-4 bg-gray-300'
              }`}
            />
          ))}
        </View>

        {/* BUTTONS */}
        <View className="w-full gap-3">
          {current < slides.length - 1 ? (
            <>
              <Pressable
                onPress={nextSlide}
                className="w-full bg-[#FA288A] h-[58px] rounded-[20px] items-center justify-center"
              >
                <Text className="text-white text-lg font-semibold">Next</Text>
              </Pressable>

              <Pressable
                onPress={skipToLast}
                className="w-full border border-[#FA288A] h-[58px] rounded-[20px] items-center justify-center"
              >
                <Text className="text-[#FA288A] text-lg font-semibold">
                  Skip
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              {/* <Pressable
                onPress={() => navigation.navigate('InfluencerHome' as never)}
                className=" bg-[#9810FA] px-3 py-2 rounded-lg z-50"
              >
                <Text className="text-white text-xs font-bold">
                  Skip to Influencer
                </Text>
              </Pressable> */}
              <Pressable
                onPress={onLoginClick}
                className="w-full bg-[#FA288A] h-[58px] rounded-[20px] items-center justify-center"
              >
                <Text className="text-white text-lg font-semibold">
                  Sign In
                </Text>
              </Pressable>

              <Pressable
                onPress={onSignUpClick}
                className="w-full border border-[#FA288A] h-[58px] rounded-[20px] items-center justify-center"
              >
                <Text className="text-[#FA288A] text-lg font-semibold">
                  Sign Up
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
