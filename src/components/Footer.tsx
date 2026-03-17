import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Linking } from 'react-native';

import {
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  MessageCircle,
} from 'lucide-react-native';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigation = {
    platform: [
      { name: 'For Brands', href: '/brands' },
      { name: 'For Influencers', href: '/influencer' },
      { name: 'How It Works', href: '/how-it-works' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Features', href: '/features' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Blog', href: '/blog' },
      { name: 'Press Kit', href: '/press' },
      { name: 'Contact', href: '/contact' },
    ],
    legal: [
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Help Center', href: '/help' },
      { name: 'Support', href: '/support' },
    ],
    social: [
      { Icon: Instagram, href: 'https://www.instagram.com/rgossips_/' },
      { Icon: Linkedin, href: 'https://linkedin.com' },
      { Icon: Twitter, href: 'https://twitter.com' },
      { Icon: Youtube, href: 'https://youtube.com' },
      {
        Icon: MessageCircle,
        href: 'https://whatsapp.com/channel/0029VbBjpbKLo4hdMsZKc146',
      },
    ],
  };

  const handleSubscribe = async () => {
    if (!email) return;

    setLoading(true);
    setMessage('Thank You');

    setLoading(false);
  };

  return (
    <View className="bg-[#0a051a] px-6 py-12">
      {/* Brand */}
      <View className="mb-8">
        <Text className="text-white text-3xl font-bold">RGossips</Text>

        <Text className="text-slate-400 text-sm mt-2">
          The all-in-one influencer campaign platform connecting brands with
          verified creators globally.
        </Text>

        <Text className="text-white mt-4 text-sm font-medium">
          Get influencer marketing tips — weekly in your inbox
        </Text>

        {/* Newsletter */}
        <View className="flex-row mt-3 gap-2">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#9ca3af"
            className="bg-[#1a142c] text-white px-4 py-3 rounded-xl flex-1"
          />

          <Pressable
            onPress={handleSubscribe}
            disabled={loading}
            className="bg-[#6C4DFF] px-5 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold text-sm">Subscribe</Text>
          </Pressable>
        </View>

        {message ? (
          <Text className="text-[#6C4DFF] mt-2">{message}</Text>
        ) : null}

        {/* Social */}
        <View className="flex-row mt-4 gap-3">
          {navigation.social.map((social, i) => {
            const Icon = social.Icon;

            return (
              <Pressable
                key={i}
                onPress={() => Linking.openURL(social.href)}
                className="w-10 h-10 rounded-full bg-[#1a142c] items-center justify-center"
              >
                <Icon size={18} color="#cbd5f5" />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Link Sections */}
      {[
        { title: 'Platform', links: navigation.platform },
        { title: 'Company', links: navigation.company },
        { title: 'Legal & Support', links: navigation.legal },
      ].map(section => (
        <View key={section.title} className="mb-6">
          <Text className="text-white font-semibold mb-3">{section.title}</Text>

          {section.links.map(link => (
            <Pressable key={link.name}>
              <Text className="text-slate-400 py-1">{link.name}</Text>
            </Pressable>
          ))}
        </View>
      ))}

      {/* Bottom Bar */}
      <View className="border-t border-slate-800 mt-6 pt-4 items-center">
        <Text className="text-slate-500 text-xs">
          © {currentYear} RGossips. All rights reserved.
        </Text>

        <Text className="text-slate-500 text-xs mt-2 text-center">
          Trusted by 5,000+ brands • 200,000+ Influencers • ISO 27001 Certified
        </Text>
      </View>
    </View>
  );
};

export default Footer;
