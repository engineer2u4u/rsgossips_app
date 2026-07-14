// Help & Support — mirrors D:/Development/React/RS_Gossips
// src/components/HelpAndSupport.jsx element-for-element:
//   1. Search input over the FAQs
//   2. Contact Us — Live Chat (opens SupportChatModal) + Email Support
//   3. FAQ — 5 groups with collapsible Q/A pairs (same content as web)
//   4. "Still stuck?" CTA card with Open Live Chat button

import React, {useMemo, useState} from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Mail,
  MessageCircle,
  Search,
} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import SupportChatModal from './SupportChatModal';

interface HelpSupportProps {
  onBack: () => void;
}

const SUPPORT_EMAIL = 'grievance@rgossips.com';

// Same FAQ content the web ships. Keep in lock-step with the SupportChat
// decision tree so users see consistent answers either way.
// Text lives in the i18n catalog under HelpAndSupport.faq.<groupKey>; the
// stable keys here are resolved at render via useTranslation.
const FAQ_GROUPS: {
  icon: string;
  key: string;
  itemKeys: string[];
}[] = [
  {
    icon: '🚀',
    key: 'gettingStarted',
    itemKeys: ['completeProfile', 'campaignsWork', 'dealsRequirement'],
  },
  {
    icon: '📸',
    key: 'profileInstagram',
    itemKeys: ['refreshStats', 'reconnect', 'reelsMissing'],
  },
  {
    icon: '💰',
    key: 'payments',
    itemKeys: ['whenPaid', 'addPayment', 'paymentMissing'],
  },
  {
    icon: '📦',
    key: 'servicesOrders',
    itemKeys: ['customQuote', 'trackOrders', 'revision'],
  },
  {
    icon: '🛡️',
    key: 'accountPrivacy',
    itemKeys: ['takeBreak', 'removeDevice', 'notificationPrefs'],
  },
];

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: {width: 0, height: 4},
  elevation: 3,
};

function ContactCard({
  icon,
  title,
  subtitle,
  iconBg,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  iconBg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="flex-row items-center bg-white border border-gray-50"
      style={[
        {gap: 16, padding: 16, borderRadius: 16},
        cardShadow,
      ]}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {icon}
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-sm font-black text-gray-900">{title}</Text>
        <Text
          className="text-[11px] font-bold text-gray-400 mt-0.5"
          numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={18} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

function FAQGroup({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{gap: 10}}>
      <View className="flex-row items-center ml-1" style={{gap: 8}}>
        <Text style={{fontSize: 18}}>{icon}</Text>
        <Text className="text-sm font-black text-gray-800 tracking-tight">
          {title}
        </Text>
      </View>
      <View
        className="bg-white border border-gray-50 overflow-hidden"
        style={[{borderRadius: 16}, cardShadow]}>
        {children}
      </View>
    </View>
  );
}

function FAQItem({
  question,
  answer,
  open,
  onToggle,
  isLast,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  return (
    <View
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#F9FAFB',
      }}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        className="flex-row items-center justify-between"
        style={{padding: 16, gap: 12}}>
        <Text
          className="text-sm font-bold text-gray-700 flex-1"
          style={{paddingRight: 4}}>
          {question}
        </Text>
        {open ? (
          <ChevronDown size={18} color="#EC4899" />
        ) : (
          <ChevronRight size={18} color="#D1D5DB" />
        )}
      </TouchableOpacity>
      {open ? (
        <Text
          className="text-gray-600"
          style={{
            fontSize: 13,
            lineHeight: 20,
            paddingHorizontal: 16,
            paddingBottom: 16,
            marginTop: -4,
          }}>
          {answer}
        </Text>
      ) : null}
    </View>
  );
}

const HelpSupport: React.FC<HelpSupportProps> = ({onBack}) => {
  const {t} = useTranslation();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const resolvedGroups = useMemo(
    () =>
      FAQ_GROUPS.map(g => ({
        icon: g.icon,
        key: g.key,
        title: t(`HelpAndSupport.faq.${g.key}.title`),
        items: g.itemKeys.map(itemKey => ({
          key: itemKey,
          q: t(`HelpAndSupport.faq.${g.key}.items.${itemKey}.q`),
          a: t(`HelpAndSupport.faq.${g.key}.items.${itemKey}.a`),
        })),
      })),
    [t],
  );

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return resolvedGroups;
    return resolvedGroups
      .map(g => ({
        ...g,
        items: g.items.filter(
          it =>
            it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q),
        ),
      }))
      .filter(g => g.items.length > 0);
  }, [query, resolvedGroups]);

  return (
    <View className="flex-1" style={{backgroundColor: '#F9FAFB'}}>
      {/* Header */}
      <View
        className="flex-row items-center bg-white border-b border-gray-50 px-5 py-4"
        style={{gap: 16}}>
        <TouchableOpacity
          onPress={onBack}
          style={{
            padding: 10,
            backgroundColor: '#FDF2F8',
            borderRadius: 12,
          }}>
          <ChevronLeft size={20} color="#EC4899" strokeWidth={3} />
        </TouchableOpacity>
        <Text className="text-xl font-black text-gray-900 tracking-tight">
          {t('HelpAndSupport.header')}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Platform.OS === 'ios' ? 60 : 40,
          gap: 28,
        }}
        showsVerticalScrollIndicator={false}>
        {/* 1. Search */}
        <View
          className="bg-white border border-gray-100"
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              borderRadius: 16,
            },
            cardShadow,
          ]}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('HelpAndSupport.searchPlaceholder')}
            placeholderTextColor="#D1D5DB"
            style={{flex: 1, fontSize: 14, fontWeight: '700', color: '#374151'}}
          />
        </View>

        {/* 2. Contact Us */}
        <View style={{gap: 14}}>
          <Text
            className="font-black text-gray-400 uppercase ml-2"
            style={{fontSize: 11, letterSpacing: 1.5}}>
            {t('HelpAndSupport.contactUs')}
          </Text>
          <View style={{gap: 12}}>
            <ContactCard
              icon={<MessageCircle size={22} color="#fff" />}
              title={t('HelpAndSupport.liveChat')}
              subtitle={t('HelpAndSupport.liveChatSubtitle')}
              iconBg="#3B82F6"
              onPress={() => setChatOpen(true)}
            />
            <ContactCard
              icon={<Mail size={22} color="#fff" />}
              title={t('HelpAndSupport.emailSupport')}
              subtitle={SUPPORT_EMAIL}
              iconBg="#EC4899"
              onPress={() =>
                Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})
              }
            />
          </View>
        </View>

        {/* 3. FAQ */}
        <View style={{gap: 22}}>
          <Text
            className="font-black text-gray-400 uppercase ml-2"
            style={{fontSize: 11, letterSpacing: 1.5}}>
            {t('HelpAndSupport.faqHeading')}
          </Text>

          {filteredGroups.length === 0 ? (
            <View
              className="items-center bg-white border border-gray-50"
              style={[{padding: 32, borderRadius: 16}, cardShadow]}>
              <HelpCircle size={28} color="#E5E7EB" />
              <Text className="text-sm font-bold text-gray-400 mt-3">
                {t('HelpAndSupport.noMatches', {query})}
              </Text>
              <Text className="text-[11px] text-gray-300 mt-1">
                {t('HelpAndSupport.noMatchesHint')}
              </Text>
            </View>
          ) : (
            filteredGroups.map(group => (
              <FAQGroup key={group.key} icon={group.icon} title={group.title}>
                {group.items.map((item, i) => {
                  const id = `${group.key}-${item.key}`;
                  const isLast = i === group.items.length - 1;
                  return (
                    <FAQItem
                      key={id}
                      question={item.q}
                      answer={item.a}
                      open={openId === id}
                      onToggle={() => setOpenId(openId === id ? null : id)}
                      isLast={isLast}
                    />
                  );
                })}
              </FAQGroup>
            ))
          )}
        </View>

        {/* 4. Still stuck CTA */}
        <View
          className="border border-gray-50"
          style={[
            {
              backgroundColor: '#FEF3C7',
              padding: 20,
              borderRadius: 16,
              gap: 18,
            },
            cardShadow,
          ]}>
          <View className="flex-row items-center" style={{gap: 16}}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                backgroundColor: '#9A7238',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <HelpCircle size={28} color="#fff" />
            </View>
            <View className="flex-1" style={{gap: 4}}>
              <Text className="text-base font-black text-gray-900">
                {t('HelpAndSupport.stillStuck')}
              </Text>
              <Text
                className="font-bold text-gray-500"
                style={{fontSize: 11, lineHeight: 16}}>
                {t('HelpAndSupport.stillStuckSubtitle')}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setChatOpen(true)}
            style={{
              backgroundColor: '#9A7238',
              paddingVertical: 14,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text className="text-white text-sm font-black">
              {t('HelpAndSupport.openLiveChat')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SupportChatModal visible={chatOpen} onClose={() => setChatOpen(false)} />
    </View>
  );
};

export {HelpSupport};
export default HelpSupport;
