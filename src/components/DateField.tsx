// Calendar picker for the campaign schedule fields.
//
// These were plain TextInputs with a "YYYY-MM-DD" hint, so creating a
// campaign on a phone meant typing three dates by hand on the numeric
// keyboard and getting the format exactly right.
//
// Built in plain RN rather than pulling in
// @react-native-community/datetimepicker: that is a native module, so it
// would need a pod install and a fresh binary before it worked, and the
// native pickers differ enough between iOS and Android to need two layouts
// anyway. This is one layout, no new dependency, and nothing to rebuild.
//
// Everything is handled as a YYYY-MM-DD string, never a Date. The campaign
// date columns carry no timezone — see the note at the top of
// lib/campaignDates.ts — so going through `new Date()` and `toISOString()`
// lands a day out for anyone east of Greenwich. Strings in this format also
// compare correctly with `<`, which is what the min-date check uses.

import React, {useMemo, useState} from 'react';
import {Modal, Pressable, Text, View} from 'react-native';
import {ChevronLeft, ChevronRight} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

type Props = {
  value: string;
  onChange: (ymd: string) => void;
  placeholder?: string;
  /** Earliest selectable day, YYYY-MM-DD. Days before it are disabled. */
  minimum?: string;
  accessibilityLabel?: string;
};

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Today as YYYY-MM-DD in the device's own calendar, not UTC. */
function todayYmd(): string {
  const n = new Date();
  return ymd(n.getFullYear(), n.getMonth(), n.getDate());
}

function parse(value: string): {y: number; m: number; d: number} | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!m) return null;
  return {y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3])};
}

export default function DateField({
  value,
  onChange,
  placeholder = 'Select a date',
  minimum,
  accessibilityLabel,
}: Props) {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const selected = parse(value);
  const start = selected || parse(todayYmd())!;
  const [cursor, setCursor] = useState({y: start.y, m: start.m});

  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1).getDay();
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells: (number | null)[] = Array(first).fill(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const show = () => {
    // Reopen on the month being edited, not wherever the user last browsed.
    const s = parse(value) || parse(todayYmd())!;
    setCursor({y: s.y, m: s.m});
    setOpen(true);
  };

  const step = (by: number) => {
    const m = cursor.m + by;
    setCursor({
      y: cursor.y + Math.floor(m / 12),
      m: ((m % 12) + 12) % 12,
    });
  };

  const pick = (d: number) => {
    onChange(ymd(cursor.y, cursor.m, d));
    setOpen(false);
  };

  const label = selected
    ? `${selected.d} ${MONTHS[selected.m]} ${selected.y}`
    : placeholder;

  return (
    <>
      <Pressable
        onPress={show}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={{
          height: 48,
          borderRadius: 12,
          backgroundColor: '#f4f5fb',
          paddingHorizontal: 14,
          justifyContent: 'center',
        }}>
        <Text style={{fontSize: 14, color: selected ? '#16224E' : '#cbd5e1'}}>
          {label}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end'}}>
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingTop: 18,
              paddingHorizontal: 18,
              // useSafeAreaInsets, not SafeAreaView: inside a Modal on iOS
              // the native view reports zero insets.
              paddingBottom: 18 + insets.bottom,
            }}>
            {/* Month header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}>
              <Pressable onPress={() => step(-1)} hitSlop={10} style={navBtn}>
                <ChevronLeft size={18} color="#4d4960" />
              </Pressable>
              <Text style={{fontSize: 15, fontWeight: '700', color: '#16224E'}}>
                {MONTHS[cursor.m]} {cursor.y}
              </Text>
              <Pressable onPress={() => step(1)} hitSlop={10} style={navBtn}>
                <ChevronRight size={18} color="#4d4960" />
              </Pressable>
            </View>

            <View style={{flexDirection: 'row'}}>
              {WEEKDAYS.map((w, i) => (
                <View key={i} style={{width: `${100 / 7}%`, alignItems: 'center', paddingBottom: 6}}>
                  <Text style={{fontSize: 10, fontWeight: '700', color: '#9C97B8'}}>{w}</Text>
                </View>
              ))}
            </View>

            <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
              {grid.map((d, i) => {
                if (d === null) {
                  return <View key={i} style={{width: `${100 / 7}%`, height: 42}} />;
                }
                const cell = ymd(cursor.y, cursor.m, d);
                const disabled = !!minimum && cell < minimum;
                const isSelected = cell === value;
                return (
                  <View key={i} style={{width: `${100 / 7}%`, height: 42, padding: 3}}>
                    <Pressable
                      onPress={() => !disabled && pick(d)}
                      disabled={disabled}
                      style={{
                        flex: 1,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? '#5851DB' : 'transparent',
                        opacity: disabled ? 0.3 : 1,
                      }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? '#fff' : '#16224E',
                        }}>
                        {d}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <Pressable
              onPress={() => setOpen(false)}
              style={{
                marginTop: 12,
                height: 44,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{fontSize: 13, fontWeight: '700', color: '#64748b'}}>
                {t('common.cancel')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const navBtn = {
  width: 34,
  height: 34,
  borderRadius: 10,
  backgroundColor: '#f4f5fb',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
