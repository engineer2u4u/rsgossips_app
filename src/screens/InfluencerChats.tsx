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
  Paperclip,
  Smile,
  Plus,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';

type Contact = {
  id: number;
  name: string;
  lastMsg: string;
  time: string;
  avatar: string;
  unread?: number;
};

type Message = {
  id: number;
  sender: 'me' | 'them';
  text: string;
  time: string;
};

const CONTACTS: Contact[] = [
  {
    id: 1,
    name: 'Alicia Rochefort',
    lastMsg: 'Hey Ronald, we have to attend our daily stand up...',
    time: '09:12',
    avatar: 'https://i.pravatar.cc/150?u=alicia',
    unread: 1,
  },
  {
    id: 2,
    name: 'Jessica Tan',
    lastMsg: "Sure, wait, I'll send you",
    time: '09:10',
    avatar: 'https://i.pravatar.cc/150?u=jessica',
  },
  {
    id: 3,
    name: 'Lolita Xue',
    lastMsg: "It's around 11:00, in the meeting room",
    time: '09:10',
    avatar: 'https://i.pravatar.cc/150?u=lolita',
  },
];

const MOCK_MESSAGES: Message[] = [
  {
    id: 1,
    sender: 'them',
    text: 'Hey Ronald, we have to attend our daily stand up',
    time: '09:10',
  },
  {
    id: 2,
    sender: 'me',
    text: 'Sure, when will daily stand up starts?',
    time: '09:12',
  },
  {
    id: 3,
    sender: 'them',
    text: "It's around 11:00, in the meeting room",
    time: '09:13',
  },
  {
    id: 4,
    sender: 'me',
    text: "Okay Alicia, I'll make sure to attend the daily stand up and make sure everything goes well.",
    time: '09:14',
  },
];

export default function InfluencerChats() {
  const [selectedChat, setSelectedChat] = useState<Contact | null>(null);
  const {width} = useWindowDimensions();
  const navigation = useNavigation();
  const isTablet = width >= 768;

  const showChatList = isTablet || !selectedChat;
  const showChatArea = isTablet || !!selectedChat;

  const renderContact = ({item}: {item: Contact}) => (
    <TouchableOpacity
      onPress={() => setSelectedChat(item)}
      className={`flex-row items-center gap-4 p-4 rounded-2xl mb-1 ${
        selectedChat?.id === item.id ? 'bg-[#FCE6F1]' : ''
      }`}
      activeOpacity={0.7}>
      <View className="relative">
        <Image
          source={{uri: item.avatar}}
          className="h-12 w-12 rounded-full border-2 border-white"
        />
        {item.unread ? (
          <View className="absolute -top-1 -right-1 w-5 h-5 bg-[#E60076] border-2 border-white rounded-full items-center justify-center">
            <Text className="text-white text-[10px] font-bold">
              {item.unread}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-center">
          <Text
            className={`font-bold text-sm ${
              selectedChat?.id === item.id
                ? 'text-[#E60076]'
                : 'text-slate-800'
            }`}>
            {item.name}
          </Text>
          <Text className="text-[10px] text-slate-400 font-medium">
            {item.time}
          </Text>
        </View>
        <Text
          className="text-xs text-slate-500 mt-0.5"
          numberOfLines={1}>
          {item.lastMsg}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({item}: {item: Message}) => {
    const isMe = item.sender === 'me';

    return (
      <View className={`mb-6 ${isMe ? 'items-end' : 'items-start'}`}>
        <View
          className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
            isMe
              ? 'bg-[#E60076] rounded-tr-none'
              : 'bg-white rounded-tl-none border border-slate-100'
          }`}>
          <Text
            className={`text-sm leading-relaxed ${
              isMe ? 'text-white' : 'text-slate-700'
            }`}>
            {item.text}
          </Text>
          <Text
            className={`text-[9px] mt-2 font-medium opacity-70 ${
              isMe ? 'text-white text-right' : 'text-slate-400'
            }`}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1" style={{backgroundColor: '#F5F4F8'}}>
      <View className="flex-1 flex-row">
        {/* Sidebar / Contact List */}
        {showChatList && (
          <View
            className={`${
              isTablet ? 'w-[380px] border-r border-slate-100' : 'flex-1'
            } bg-white`}>
            {/* Header with Back Button */}
            <View className="p-6 gap-4">
              <View className="flex-row items-center gap-4">
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  className="p-2 rounded-full bg-[#FCE6F1]"
                  activeOpacity={0.7}>
                  <ChevronLeft size={24} color="#E60076" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-800">
                  Messages
                </Text>
              </View>

              {/* Search */}
              <View className="flex-row items-center bg-slate-50 rounded-xl px-4 h-12">
                <Search size={16} color="#94A3B8" />
                <TextInput
                  placeholder="Search messages..."
                  placeholderTextColor="#94A3B8"
                  className="flex-1 ml-2 text-sm text-slate-700"
                />
              </View>
            </View>

            {/* Contact List */}
            <FlatList
              data={CONTACTS}
              renderItem={renderContact}
              keyExtractor={item => item.id.toString()}
              className="flex-1 px-4"
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Chat Area */}
        {showChatArea && (
          <View className="flex-1" style={{backgroundColor: '#F5F4F8'}}>
            {selectedChat ? (
              <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}>
                {/* Chat Header */}
                <View className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-slate-100 shadow-sm">
                  <View className="flex-row items-center gap-4">
                    {!isTablet && (
                      <TouchableOpacity
                        onPress={() => setSelectedChat(null)}
                        className="p-2 rounded-full bg-[#FCE6F1]">
                        <ChevronLeft size={20} color="#E60076" />
                      </TouchableOpacity>
                    )}
                    <Image
                      source={{uri: selectedChat.avatar}}
                      className="h-10 w-10 rounded-full border-2 border-[#FCE6F1]"
                    />
                    <View>
                      <Text className="font-bold text-slate-800 text-base">
                        {selectedChat.name}
                      </Text>
                      <View className="flex-row items-center gap-1.5">
                        <View className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                          Active Now
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity className="p-2 rounded-full">
                      <Search size={20} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2 rounded-full">
                      <MoreVertical size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Messages */}
                <FlatList
                  data={MOCK_MESSAGES}
                  renderItem={renderMessage}
                  keyExtractor={item => item.id.toString()}
                  className="flex-1 px-4 py-6"
                  showsVerticalScrollIndicator={false}
                />

                {/* Footer Input */}
                <View className="p-4 bg-white border-t border-slate-100">
                  <View className="flex-row items-end gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    {/* Plus Button */}
                    <TouchableOpacity className="p-1">
                      <View className="bg-[#E60076] rounded-lg p-1.5">
                        <Plus size={16} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>

                    {/* Attachment */}
                    <TouchableOpacity className="p-2">
                      <Paperclip size={22} color="#94A3B8" />
                    </TouchableOpacity>

                    {/* Text Input */}
                    <TextInput
                      placeholder="Type a message..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      className="flex-1 bg-transparent text-sm py-1.5 text-slate-700 max-h-32"
                    />

                    {/* Emoji */}
                    <TouchableOpacity className="p-2">
                      <Smile size={22} color="#94A3B8" />
                    </TouchableOpacity>

                    {/* Send */}
                    <TouchableOpacity className="h-11 w-11 rounded-xl bg-[#E60076] items-center justify-center shadow-lg">
                      <Send size={20} color="#FFFFFF" />
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
                  Select a conversation to start chatting
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
