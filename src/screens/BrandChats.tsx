import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Search,
  ChevronLeft,
  MoreVertical,
  Send,
  Mic,
  ThumbsUp,
  Play,
  Pause,
  ArrowRight,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

type Contact = {
  id: number;
  name: string;
  campaign: string;
  tagBg: string;
  tagText: string;
  lastMsg: string;
  time: string;
  avatar: string;
  unread?: number;
};

type Message = {
  id: number;
  sender: 'me' | 'them';
  text?: string;
  type?: 'audio';
  duration?: string;
  time: string;
};

const CONTACTS: Contact[] = [
  {
    id: 1,
    name: 'Faisal Shaikh',
    campaign: 'Food Campaign',
    tagBg: 'bg-[#EAE7FF]',
    tagText: 'text-[#4F46E5]',
    lastMsg: 'Hey, I can do this in 2 days',
    time: '3:45 PM',
    avatar: 'https://i.pravatar.cc/150?u=faisal',
    unread: 1,
  },
  {
    id: 2,
    name: 'Sarah Rahman',
    campaign: 'Skincare Launch',
    tagBg: 'bg-[#FCE6F1]',
    tagText: 'text-[#C5006A]',
    lastMsg: 'Let me check the brief again.',
    time: '1:16 PM',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
  },
  {
    id: 3,
    name: 'Arjun Mehta',
    campaign: 'Tech Review',
    tagBg: 'bg-[#E0F7EC]',
    tagText: 'text-[#0D7C4A]',
    lastMsg: "I'll send the draft by tonight",
    time: '12:30 PM',
    avatar: 'https://i.pravatar.cc/150?u=arjun',
  },
  {
    id: 4,
    name: 'Priya Nair',
    campaign: 'Fashion Week',
    tagBg: 'bg-[#FFF3E0]',
    tagText: 'text-[#E65100]',
    lastMsg: 'Can we reschedule the shoot?',
    time: '11:45 AM',
    avatar: 'https://i.pravatar.cc/150?u=priya',
  },
  {
    id: 5,
    name: 'Ravi Kumar',
    campaign: 'Fitness Brand',
    tagBg: 'bg-[#E3F2FD]',
    tagText: 'text-[#1565C0]',
    lastMsg: 'The content is ready for review',
    time: '10:20 AM',
    avatar: 'https://i.pravatar.cc/150?u=ravi',
  },
  {
    id: 6,
    name: 'Meera Joshi',
    campaign: 'Travel Vlog',
    tagBg: 'bg-[#F3E5F5]',
    tagText: 'text-[#7B1FA2]',
    lastMsg: 'Uploaded the final cut!',
    time: 'Yesterday',
    avatar: 'https://i.pravatar.cc/150?u=meera',
  },
];

const MOCK_MESSAGES: Message[] = [
  {
    id: 1,
    sender: 'them',
    text: 'Oh, hello! All perfectly, I will check it and get back to you soon',
    time: '04:45 PM',
  },
  {
    id: 2,
    sender: 'me',
    text: 'Oh, hello! All perfectly, I will check it and get back to you soon',
    time: '04:01 PM',
  },
  {
    id: 3,
    sender: 'them',
    text: 'Oh, hello! All perfectly, I will check it and get back to you soon',
    time: '04:33 PM',
  },
  {
    id: 4,
    sender: 'them',
    type: 'audio',
    duration: '01:24',
    time: '04:33 PM',
  },
  {
    id: 5,
    sender: 'me',
    text: 'Oh, hello! All perfectly, I will check it and get back to you soon',
    time: '04:45 PM',
  },
];

const TABS = ['All', 'Unread', 'Pinned', 'Campaigns'];

// Generate random waveform heights once so they don't re-render
const WAVEFORM_HEIGHTS = Array.from({length: 30}, () =>
  Math.round(Math.random() * 16 + 4),
);

export default function BrandChats() {
  const {t} = useTranslation();
  const [selectedChat, setSelectedChat] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const {width} = useWindowDimensions();
  const isTablet = width >= 768;

  const showChatList = isTablet || !selectedChat;
  const showChatArea = isTablet || !!selectedChat;

  const renderContact = ({item}: {item: Contact}) => (
    <TouchableOpacity
      onPress={() => setSelectedChat(item)}
      className={`flex-row items-center gap-3.5 p-3.5 rounded-2xl mb-1 ${
        selectedChat?.id === item.id ? 'bg-[#F3F1FF]' : ''
      }`}
      activeOpacity={0.7}>
      <View className="relative">
        <Image
          source={{uri: item.avatar}}
          className="h-12 w-12 rounded-full border-2 border-white"
        />
        {item.unread ? (
          <View className="absolute -top-1 -right-1 w-5 h-5 bg-[#4F46E5] border-2 border-white rounded-full items-center justify-center">
            <Text className="text-white text-[10px] font-bold">
              {item.unread}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-center">
          <Text className="font-semibold text-sm text-slate-800">
            {item.name}
          </Text>
          <Text className="text-[11px] text-slate-400 font-medium">
            {item.time}
          </Text>
        </View>
        <View className={`self-start px-2 py-0.5 rounded-full mt-1 ${item.tagBg}`}>
          <Text className={`text-[11px] font-medium ${item.tagText}`}>
            {item.campaign}
          </Text>
        </View>
        <Text className="text-xs text-slate-500 mt-1" numberOfLines={1}>
          {item.lastMsg}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({item}: {item: Message}) => {
    const isMe = item.sender === 'me';

    return (
      <View className={`mb-5 ${isMe ? 'items-end' : 'items-start'}`}>
        <View className={`max-w-[75%] ${item.type === 'audio' ? 'w-[280px]' : ''}`}>
          {item.type === 'audio' ? (
            <View
              className={`p-3.5 rounded-2xl flex-row items-center gap-3 ${
                isMe
                  ? 'bg-[#4F46E5] rounded-tr-sm'
                  : 'bg-white border border-slate-100 rounded-tl-sm'
              }`}>
              <TouchableOpacity
                onPress={() =>
                  setPlayingAudio(playingAudio === item.id ? null : item.id)
                }
                className={`w-9 h-9 rounded-full items-center justify-center ${
                  isMe ? 'bg-white/20' : 'bg-[#F3F1FF]'
                }`}>
                {playingAudio === item.id ? (
                  <Pause
                    size={16}
                    color={isMe ? '#FFFFFF' : '#4F46E5'}
                  />
                ) : (
                  <Play
                    size={16}
                    color={isMe ? '#FFFFFF' : '#4F46E5'}
                  />
                )}
              </TouchableOpacity>
              <View className="flex-1">
                <View
                  className={`flex-row items-center gap-[3px] h-6 ${
                    isMe ? 'opacity-80' : 'opacity-50'
                  }`}>
                  {WAVEFORM_HEIGHTS.map((h, i) => (
                    <View
                      key={i}
                      className={`w-[3px] rounded-full ${
                        isMe ? 'bg-white' : 'bg-slate-400'
                      }`}
                      style={{height: h}}
                    />
                  ))}
                </View>
                <Text
                  className={`text-[10px] mt-1 ${
                    isMe ? 'text-white/60' : 'text-slate-400'
                  }`}>
                  {item.duration}
                </Text>
              </View>
            </View>
          ) : (
            <View
              className={`p-4 rounded-2xl ${
                isMe
                  ? 'bg-[#4F46E5] rounded-tr-sm'
                  : 'bg-white rounded-tl-sm border border-slate-100'
              }`}>
              <Text
                className={`text-sm leading-relaxed ${
                  isMe ? 'text-white' : 'text-slate-700'
                }`}>
                {item.text}
              </Text>
            </View>
          )}
          <Text
            className={`text-[10px] mt-1.5 text-slate-400 ${
              isMe ? 'text-right' : ''
            }`}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 flex-row">
        {/* Sidebar / Contact List */}
        {showChatList && (
          <View className={`${isTablet ? 'w-[380px] border-r border-slate-100' : 'flex-1'}`}>
            {/* Header */}
            <View className="px-6 pt-8 pb-14 rounded-b-[40px] overflow-hidden">
              <LinearGradient
                colors={['#4C75BE', '#4A3996']}
                style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}
              />
              <View className="flex-row justify-between items-start mb-5">
                <View>
                  <Text className="text-2xl font-bold text-white">
                    {t('ScreensBrandChats.messages')}
                  </Text>
                  <Text className="text-white/70 text-xs mt-1">
                    {t('ScreensBrandChats.runningProjects', {count: 6})}
                  </Text>
                </View>
              </View>
            </View>

            {/* Search Bar - overlapping header */}
            <View className="mx-6 -mt-6 flex-row items-center bg-white rounded-full p-2 shadow-lg shadow-gray-200/50 z-10">
              <TextInput
                placeholder={t('ScreensBrandChats.searchPlaceholder')}
                placeholderTextColor="#9CA3AF"
                className="flex-1 pl-4 text-sm text-gray-800"
              />
              <TouchableOpacity className="bg-[#5851DB] p-2.5 rounded-full">
                <ArrowRight size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View className="flex-row items-center gap-3 px-5 py-4 mt-4 border-b border-slate-100">
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 ${
                    activeTab === tab
                      ? 'bg-[#4F46E5] shadow-md'
                      : 'bg-gray-100'
                  }`}>
                  <Text
                    className={`text-sm font-medium ${
                      activeTab === tab ? 'text-white' : 'text-gray-600'
                    }`}>
                    {t(`ScreensBrandChats.tabs.${tab.toLowerCase()}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Contact List */}
            <FlatList
              data={CONTACTS}
              renderItem={renderContact}
              keyExtractor={item => item.id.toString()}
              className="flex-1 px-3"
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Chat Area */}
        {showChatArea && (
          <View className={`flex-1 bg-[#F8F9FD] ${!selectedChat && !isTablet ? 'hidden' : ''}`}>
            {selectedChat ? (
              <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}>
                {/* Chat Header */}
                <View className="bg-white px-6 py-4 flex-row items-center justify-between border-b border-slate-100">
                  <View className="flex-row items-center gap-4">
                    {!isTablet && (
                      <TouchableOpacity
                        onPress={() => setSelectedChat(null)}
                        className="p-2 rounded-full bg-[#EAE7FF]">
                        <ChevronLeft size={20} color="#4F46E5" />
                      </TouchableOpacity>
                    )}
                    <Image
                      source={{uri: selectedChat.avatar}}
                      className="h-10 w-10 rounded-full border-2 border-[#EAE7FF]"
                    />
                    <View>
                      <Text className="font-bold text-slate-800 text-base">
                        {selectedChat.name}
                      </Text>
                      <Text className="text-xs text-slate-400">
                        <Text className="text-slate-500">★</Text>{' '}
                        {t('ScreensBrandChats.regarding')}{' '}
                        <Text className="font-medium text-slate-600">
                          {selectedChat.campaign}
                        </Text>
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <TouchableOpacity className="p-2 rounded-full">
                      <Search size={18} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2 rounded-full">
                      <MoreVertical size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Messages */}
                <FlatList
                  data={MOCK_MESSAGES}
                  renderItem={renderMessage}
                  keyExtractor={item => item.id.toString()}
                  className="flex-1 px-6 py-6"
                  showsVerticalScrollIndicator={false}
                />

                {/* Footer Input */}
                <View className="p-4 bg-white border-t border-slate-100">
                  <View className="flex-row items-end gap-3">
                    <View className="flex-1 flex-row items-end bg-[#F8F9FD] p-2.5 rounded-2xl border border-slate-100">
                      <TextInput
                        placeholder={t('ScreensBrandChats.typeMessage')}
                        placeholderTextColor="#94A3B8"
                        multiline
                        className="flex-1 bg-transparent text-sm py-1.5 text-slate-700 max-h-32"
                      />
                    </View>
                    <TouchableOpacity className="h-11 w-11 rounded-full bg-[#F3F1FF] items-center justify-center">
                      <Mic size={20} color="#4F46E5" />
                    </TouchableOpacity>
                    <TouchableOpacity className="h-11 w-11 rounded-full bg-[#4F46E5] items-center justify-center shadow-lg">
                      <Send size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity className="h-11 w-11 rounded-full bg-[#F3F1FF] items-center justify-center">
                      <ThumbsUp size={20} color="#4F46E5" />
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            ) : (
              <View className="flex-1 items-center justify-center">
                <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
                  <Send size={32} color="#CBD5E1" />
                </View>
                <Text className="font-medium text-slate-300">
                  {t('ScreensBrandChats.selectConversation')}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
