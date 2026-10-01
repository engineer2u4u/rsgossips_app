import React, {useState} from 'react';
import {View, Text, TextInput, Pressable, Linking, ActivityIndicator} from 'react-native';
import {supabase} from '../utils/supabase';
import {
  fulfilmentState,
  CREATOR_STAGE_LABEL,
  type FulfilmentRow,
  type ShippingMode,
} from '../lib/barterFulfilment';

// The creator's side of a barter delivery: where it's going, where it is, and
// whether it arrived.
//
// Everything here is derived from the application row at render time
// (lib/barterFulfilment.ts) — including the "you haven't told us whether it
// arrived" prompt. No reminder job, no push, no polling: the prompt appears
// because the creator opened the screen and the expected date has passed.
//
// Writes go straight to the table under the creator's own RLS policy
// (applications_creator_self_rw, migration 035). Migration 076's trigger is
// what makes that safe — it rejects any write to the brand's tracking fields
// and any address change after dispatch. This UI hides both; the database is
// the boundary.

const TONE: Record<string, {bg: string; border: string; text: string}> = {
  awaiting_address: {bg: '#FFFBEB', border: '#FDE68A', text: '#B45309'},
  ready_to_ship: {bg: '#F8FAFC', border: '#E2E8F0', text: '#475569'},
  shipped: {bg: '#FAF5FF', border: '#E9D5FF', text: '#7E22CE'},
  received: {bg: '#ECFDF5', border: '#A7F3D0', text: '#047857'},
  not_received: {bg: '#FFF1F2', border: '#FECDD3', text: '#BE123C'},
};

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'}) : '';

export function DeliveryCard({
  applicationId,
  fulfilment,
  shippingMode,
  onChanged,
}: {
  applicationId: string;
  fulfilment: FulfilmentRow | null | undefined;
  shippingMode: ShippingMode;
  onChanged?: () => void;
}) {
  const [address, setAddress] = useState(fulfilment?.shipping_address || '');
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!fulfilment || shippingMode === 'no') return null;
  const s = fulfilmentState(fulfilment, shippingMode);
  if (s.stage === 'not_applicable') return null;
  const tone = TONE[s.stage] || TONE.ready_to_ship;

  const saveAddress = async () => {
    if (address.trim().length < 15) {
      setError('Add a complete address — building, area, city, PIN code and a phone number.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const {error: err} = await supabase
        .from('campaign_applications')
        .update({
          shipping_address: address.trim(),
          shipping_address_updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);
      if (err) {
        // The trigger raises once it has shipped — say that plainly rather
        // than surfacing a database string.
        throw new Error(
          /shipped/i.test(err.message)
            ? 'Your parcel is on its way, so the address cannot be changed now.'
            : err.message,
        );
      }
      setEditing(false);
      onChanged?.();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not save that. Please try again.';
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const answerReceipt = async (received: boolean) => {
    setBusy(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const {error: err} = await supabase
        .from('campaign_applications')
        .update({
          product_received: received,
          product_received_at: now,
          product_feedback: feedback.trim() || null,
          product_feedback_at: feedback.trim() ? now : null,
        })
        .eq('id', applicationId);
      if (err) throw new Error(err.message);
      onChanged?.();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not save that. Please try again.';
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const label = {fontSize: 10, fontWeight: '700' as const, color: '#64748B', letterSpacing: 0.5};
  const input = {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#334155',
  };

  return (
    <View style={{borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff', overflow: 'hidden'}}>
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
        <Text style={{fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1}}>Your product delivery</Text>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: tone.bg,
            borderWidth: 1,
            borderColor: tone.border,
          }}>
          <Text style={{fontSize: 11, fontWeight: '700', color: tone.text}}>{CREATOR_STAGE_LABEL[s.stage]}</Text>
        </View>
      </View>

      <View style={{padding: 14, gap: 14}}>
        {/* The derived reminder — true whenever they look and the date has
            passed with no answer from them. Nothing sends this. */}
        {s.receiptOverdue ? (
          <View style={{padding: 12, borderRadius: 12, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A'}}>
            <Text style={{fontSize: 12, color: '#92400E', lineHeight: 18}}>
              {s.daysOverdue > 0
                ? `Your product was due ${s.daysOverdue} day${s.daysOverdue === 1 ? '' : 's'} ago and you haven't told us whether it arrived. Let us know below — if it's missing we'll chase the brand.`
                : 'Your product was due to arrive today. Let us know below whether it turned up.'}
            </Text>
          </View>
        ) : null}

        {shippingMode === 'pickup' ? (
          <Text style={{fontSize: 12, color: '#475569', lineHeight: 18}}>
            You collect this one yourself — the pickup address and timings are in the campaign brief above.
          </Text>
        ) : (
          <View style={{gap: 6}}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
              <Text style={label}>DELIVERY ADDRESS</Text>
              {s.canEditAddress && !editing ? (
                <Pressable onPress={() => setEditing(true)} accessibilityRole="button">
                  <Text style={{fontSize: 11, fontWeight: '700', color: '#9810FA'}}>
                    {fulfilment.shipping_address ? 'Change' : 'Add'}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {editing ? (
              <View style={{gap: 8}}>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  numberOfLines={5}
                  maxLength={600}
                  textAlignVertical="top"
                  placeholder={'Name\nFlat / house number, building, street\nArea and a nearby landmark\nCity, State, PIN code\nPhone number for the delivery partner'}
                  placeholderTextColor="#94A3B8"
                  style={{...input, minHeight: 110}}
                />
                <View style={{flexDirection: 'row', gap: 8}}>
                  <Pressable
                    onPress={saveAddress}
                    disabled={busy}
                    style={{
                      backgroundColor: '#9810FA',
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 12,
                      opacity: busy ? 0.6 : 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                    {busy ? <ActivityIndicator size="small" color="#fff" /> : null}
                    <Text style={{color: '#fff', fontSize: 12, fontWeight: '700'}}>Save address</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setEditing(false);
                      setAddress(fulfilment.shipping_address || '');
                      setError('');
                    }}
                    disabled={busy}
                    style={{paddingHorizontal: 14, paddingVertical: 10}}>
                    <Text style={{color: '#64748B', fontSize: 12, fontWeight: '700'}}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : fulfilment.shipping_address ? (
              <Text style={{fontSize: 12, color: '#475569', lineHeight: 18}}>{fulfilment.shipping_address}</Text>
            ) : (
              <Text style={{fontSize: 12, color: '#B45309', lineHeight: 18}}>
                We don't have a delivery address for you yet. Add one so the brand can send your product.
              </Text>
            )}

            {!s.canEditAddress && fulfilment.shipping_address ? (
              <Text style={{fontSize: 10, color: '#94A3B8'}}>
                Your parcel is on its way, so the address can't be changed now. Reply to our email if something is wrong.
              </Text>
            ) : null}
          </View>
        )}

        {fulfilment.shipping_tracking_url ? (
          <View style={{paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 4}}>
            <Pressable
              onPress={() => Linking.openURL(fulfilment.shipping_tracking_url!).catch(() => {})}
              accessibilityRole="link">
              <Text style={{fontSize: 12, fontWeight: '700', color: '#9810FA'}}>Track your delivery</Text>
            </Pressable>
            <Text style={{fontSize: 11, color: '#94A3B8'}}>
              Dispatched {fmt(fulfilment.shipping_tracking_added_at)}
              {fulfilment.shipping_carrier ? ` via ${fulfilment.shipping_carrier}` : ''}
              {s.expectedAt ? ` · expected by ${fmt(s.expectedAt)}` : ''}
            </Text>
          </View>
        ) : null}

        {s.canConfirmReceipt ? (
          <View style={{paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 10}}>
            <Text style={{fontSize: 12, fontWeight: '700', color: '#1E293B'}}>Has your product arrived?</Text>
            <TextInput
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={3}
              maxLength={800}
              textAlignVertical="top"
              placeholder="Anything you want to tell us or the brand about the product or the delivery (optional)"
              placeholderTextColor="#94A3B8"
              style={{...input, minHeight: 72}}
            />
            <View style={{flexDirection: 'row', gap: 8, flexWrap: 'wrap'}}>
              <Pressable
                onPress={() => answerReceipt(true)}
                disabled={busy}
                style={{
                  backgroundColor: '#10B981',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  opacity: busy ? 0.6 : 1,
                }}>
                <Text style={{color: '#fff', fontSize: 12, fontWeight: '700'}}>Yes, it arrived</Text>
              </Pressable>
              <Pressable
                onPress={() => answerReceipt(false)}
                disabled={busy}
                style={{
                  backgroundColor: '#FFF1F2',
                  borderWidth: 1,
                  borderColor: '#FECDD3',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  opacity: busy ? 0.6 : 1,
                }}>
                <Text style={{color: '#BE123C', fontSize: 12, fontWeight: '700'}}>No, it hasn't</Text>
              </Pressable>
            </View>
            <Text style={{fontSize: 10, color: '#94A3B8'}}>
              Your note is shared with the brand along with your answer.
            </Text>
          </View>
        ) : null}

        {fulfilment.product_received !== null && fulfilment.product_received !== undefined ? (
          <View style={{paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 6}}>
            <Text style={{fontSize: 12, color: '#475569'}}>
              {fulfilment.product_received
                ? `You confirmed this arrived on ${fmt(fulfilment.product_received_at)}.`
                : `You reported this as not received on ${fmt(fulfilment.product_received_at)}. We're on it.`}
            </Text>
            {fulfilment.product_feedback ? (
              <Text
                style={{
                  fontSize: 12,
                  color: '#64748B',
                  fontStyle: 'italic',
                  backgroundColor: '#F8FAFC',
                  borderRadius: 10,
                  padding: 10,
                }}>
                {fulfilment.product_feedback}
              </Text>
            ) : null}
          </View>
        ) : null}

        {error ? <Text style={{fontSize: 12, color: '#E11D48'}}>{error}</Text> : null}
      </View>
    </View>
  );
}
