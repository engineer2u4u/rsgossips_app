// The creator's half of the B15 negotiation, ported from the web card in
// src/app/influencer/offers/[id]/page.js (OfferResponseCard).
//
// The brand prices an application (status → offer_sent) and nothing else can
// happen until the creator answers here: accept and the brand may fund
// escrow, or withdraw and the campaign reopens for them. There is no
// counter-offer by design.
//
// Without this card the app could receive an offer and never respond to it,
// which stalled every mobile-side collaboration at "offer sent".

import React, {useState} from 'react';
import {Alert, Pressable, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {CheckCircle2, IndianRupee} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

import {useAuth} from '../context/AuthContext';
import {invokeFn} from '../lib/api';
import {isSubscribed} from '../lib/plans';
import UpgradeRequiredModal, {type UpgradeReason} from './UpgradeRequiredModal';

export default function OfferResponseCard({
  campaign,
  refetch,
}: {
  campaign: any;
  refetch?: () => void;
}) {
  const {t} = useTranslation();
  const navigation = useNavigation<any>();
  const {user, profile} = useAuth();
  const [busy, setBusy] = useState<'accept' | 'withdraw' | null>(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [needsPlan, setNeedsPlan] = useState<UpgradeReason>(null);

  const offer = Number(campaign?.brandOfferedRate || 0);
  const proposed = Number(campaign?.proposedRate || 0);
  const isBarter = String(campaign?.campaignType || '').toLowerCase() === 'barter';

  const respond = async (nextStatus: 'offer_accepted' | 'withdrawn') => {
    if (!user?.id || !campaign?.applicationId) return;
    // Free creators who applied to a paid campaign before the barter-only
    // limit existed still have open applications. Accepting is what commits
    // the brand to paying, so that is where the limit bites — withdrawing is
    // never blocked. update-application-status enforces the same rule; this
    // just says so without the round trip.
    if (nextStatus === 'offer_accepted' && !isSubscribed(profile) && !isBarter) {
      setNeedsPlan('paid_campaign');
      return;
    }
    setBusy(nextStatus === 'offer_accepted' ? 'accept' : 'withdraw');
    try {
      await invokeFn('update-application-status', {
        applicationId: campaign.applicationId,
        influencerId: user.id,
        status: nextStatus,
      });
      refetch?.();
    } catch (err: any) {
      // The server refuses the same case; show the upgrade prompt rather
      // than a raw error if the client check was stale.
      if (err?.data?.error === 'subscription_required') {
        setNeedsPlan('paid_campaign');
        return;
      }
      Alert.alert(
        t('OfferResponseCard.failedTitle'),
        err?.message || t('OfferResponseCard.updateError'),
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <View
      style={{
        padding: 16,
        borderRadius: 20,
        backgroundColor: '#faf5ff',
        borderWidth: 1,
        borderColor: '#e9d5ff',
        gap: 12,
      }}>
      <UpgradeRequiredModal
        reason={needsPlan}
        campaignType={campaign?.campaignType}
        onClose={() => setNeedsPlan(null)}
        onSeePlans={() => {
          setNeedsPlan(null);
          navigation.navigate('InfluencerPricing');
        }}
      />

      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: '#f3e8ff',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <IndianRupee size={16} color="#7e22ce" />
        </View>
        <View style={{flex: 1}}>
          <Text style={{fontSize: 14, fontWeight: '900', color: '#6b21a8'}}>
            {t('OfferResponseCard.offerAmount', {
              amount: offer.toLocaleString('en-IN'),
            })}
          </Text>
          <Text style={{fontSize: 11, color: '#9333ea'}}>
            {proposed > 0 && proposed !== offer
              ? t('OfferResponseCard.counteredNote', {
                  amount: proposed.toLocaleString('en-IN'),
                })
              : t('OfferResponseCard.approvedNote')}
          </Text>
        </View>
      </View>

      <Text style={{fontSize: 11, color: '#7e22ce', lineHeight: 16}}>
        {t('OfferResponseCard.lockItInNote')}
      </Text>

      {!confirmWithdraw ? (
        <View style={{flexDirection: 'row', gap: 8}}>
          <Pressable
            disabled={!!busy}
            onPress={() => respond('offer_accepted')}
            style={{flex: 1, opacity: busy ? 0.6 : 1}}>
            <LinearGradient
              colors={['#9810fa', '#e60076']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={{
                height: 44,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}>
              <CheckCircle2 size={15} color="#fff" />
              <Text style={{color: '#fff', fontSize: 13, fontWeight: '900'}}>
                {busy === 'accept'
                  ? t('OfferResponseCard.accepting')
                  : t('OfferResponseCard.acceptAmount', {
                      amount: offer.toLocaleString('en-IN'),
                    })}
              </Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            disabled={!!busy}
            onPress={() => setConfirmWithdraw(true)}
            style={{
              height: 44,
              paddingHorizontal: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#e9d5ff',
              backgroundColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: busy ? 0.6 : 1,
            }}>
            <Text style={{color: '#7e22ce', fontSize: 13, fontWeight: '700'}}>
              {t('OfferResponseCard.withdraw')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View
          style={{
            padding: 12,
            borderRadius: 12,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: '#fecaca',
            gap: 10,
          }}>
          <Text style={{fontSize: 12, color: '#b91c1c', lineHeight: 17}}>
            {t('OfferResponseCard.withdrawConfirm')}
          </Text>
          <View style={{flexDirection: 'row', gap: 8}}>
            <Pressable
              disabled={!!busy}
              onPress={() => respond('withdrawn')}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 10,
                backgroundColor: '#dc2626',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: busy ? 0.6 : 1,
              }}>
              <Text style={{color: '#fff', fontSize: 12, fontWeight: '900'}}>
                {busy === 'withdraw'
                  ? t('OfferResponseCard.withdrawing')
                  : t('OfferResponseCard.withdrawConfirmCta')}
              </Text>
            </Pressable>
            <Pressable
              disabled={!!busy}
              onPress={() => setConfirmWithdraw(false)}
              style={{
                height: 40,
                paddingHorizontal: 16,
                borderRadius: 10,
                backgroundColor: '#f1f5f9',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{color: '#475569', fontSize: 12, fontWeight: '700'}}>
                {t('OfferResponseCard.keepOffer')}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
