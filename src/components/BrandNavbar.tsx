import React from 'react';
import { View, Text, TextInput, Image, TouchableOpacity } from 'react-native';
import { Search, Zap, ChevronDown } from 'lucide-react-native';

export function BrandNavbar() {
  return (
    <View
      style={{
        height: 72,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
      }}
    >
      {/* Left */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: 'black',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>#</Text>
        </View>

        <Text style={{ fontWeight: '600', color: '#1f2937' }}>RGossips</Text>
      </View>

      {/* Search */}
      <View
        style={{
          flex: 1,
          marginHorizontal: 16,
          backgroundColor: '#f3f4f6',
          borderRadius: 10,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          height: 40,
        }}
      >
        <Search size={16} color="#9ca3af" />

        <TextInput
          placeholder="Search creators, campaigns..."
          placeholderTextColor="#9ca3af"
          style={{
            flex: 1,
            marginLeft: 8,
            fontSize: 14,
          }}
        />
      </View>

      {/* Right */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {/* Trust Score */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#111827',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            gap: 4,
          }}
        >
          <Zap size={14} color="white" />
          <Text style={{ color: 'white', fontSize: 12 }}>Trust: 10%</Text>
        </View>

        {/* Invite Button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#16a34a',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>Invite ₹2500 +</Text>
        </TouchableOpacity>

        {/* Avatar */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
            }}
          />

          <ChevronDown size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
