import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  MessageCircle,
} from 'lucide-react-native';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigation = {
    platform: [
      { key: 'forBrands', href: '/brands' },
      { key: 'forInfluencers', href: '/influencer' },
      { key: 'howItWorks', href: '/how-it-works' },
      { key: 'pricing', href: '/pricing' },
      { key: 'features', href: '/features' },
    ],
    company: [
      { key: 'aboutUs', href: '/about' },
      { key: 'careers', href: '/careers' },
      { key: 'blog', href: '/blog' },
      { key: 'pressKit', href: '/press' },
      { key: 'contact', href: '/contact' },
    ],
    legal: [
      { key: 'terms', href: '/terms' },
      { key: 'privacy', href: '/privacy' },
      { key: 'cookies', href: '/cookies' },
      { key: 'help', href: '/help' },
      { key: 'support', href: '/support' },
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
    setMessage(t('Footer.thankYou'));

    setLoading(false);
  };

  return (
    <View className="bg-[#0a051a] px-6 py-12">
      {/* Brand */}
      <View className="mb-8">
        <Text className="text-white text-3xl font-bold">RGossips</Text>

        <Text className="text-slate-400 text-sm mt-2">
          {t('Footer.brandDescription')}
        </Text>

        <Text className="text-white mt-4 text-sm font-medium">
          {t('Footer.newsletterPrompt')}
        </Text>

        {/* Newsletter */}
        <View className="flex-row mt-3 gap-2">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('Footer.emailPlaceholder')}
            placeholderTextColor="#9ca3af"
            className="bg-[#1a142c] text-white px-4 py-3 rounded-xl flex-1"
          />

          <Pressable
            onPress={handleSubscribe}
            disabled={loading}
            className="bg-[#6C4DFF] px-5 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold text-sm">
              {t('Footer.subscribe')}
            </Text>
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
        { key: 'platform', links: navigation.platform, group: 'platform' },
        { key: 'company', links: navigation.company, group: 'company' },
        { key: 'legal', links: navigation.legal, group: 'legal' },
      ].map(section => (
        <View key={section.key} className="mb-6">
          <Text className="text-white font-semibold mb-3">
            {t(`Footer.sections.${section.key}`)}
          </Text>

          {section.links.map(link => (
            <Pressable key={link.key}>
              <Text className="text-slate-400 py-1">
                {t(`Footer.nav.${section.group}.${link.key}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}

      {/* Bottom Bar */}
      <View className="border-t border-slate-800 mt-6 pt-4 items-center">
        <Text className="text-slate-500 text-xs">
          {t('Footer.copyright', { year: currentYear })}
        </Text>

        <Text className="text-slate-500 text-xs mt-2 text-center">
          {t('Footer.trustLine')}
        </Text>
      </View>
    </View>
  );
};

export default Footer;
