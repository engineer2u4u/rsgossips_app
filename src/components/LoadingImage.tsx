// An Image that shows a pulsing placeholder until the picture arrives.
//
// Campaign banners, service covers and the home carousels load remote images
// over a mobile connection; until they land the card showed a flat grey
// rectangle, which reads as a broken image rather than a loading one. This
// keeps the same grey block but breathes, so the wait looks deliberate, and
// fades the picture in when it is ready.
//
// Drop-in for <Image source={{uri}}>: same style prop, same resizeMode.

import React, {useEffect, useRef, useState} from 'react';
import {Animated, Image, StyleSheet, View, type ImageProps} from 'react-native';

type Props = Omit<ImageProps, 'source'> & {
  uri?: string | null;
  /** Placeholder colour; defaults to the app's card grey. */
  placeholderColor?: string;
};

export default function LoadingImage({
  uri,
  style,
  placeholderColor = '#eef0f6',
  ...rest
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const pulse = useRef(new Animated.Value(0.45)).current;
  const fade = useRef(new Animated.Value(0)).current;

  // Pulse only while waiting — an animation that runs behind a loaded image
  // is wasted work on every card in a long list.
  useEffect(() => {
    if (loaded) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [loaded, pulse]);

  const onDone = () => {
    setLoaded(true);
    Animated.timing(fade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={style}>
      {/* The placeholder sits behind the image and is removed once it is up,
          so a slow or dead URL never leaves a blank hole. */}
      {!loaded ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {backgroundColor: placeholderColor, opacity: failed ? 1 : pulse},
          ]}
        />
      ) : null}
      {uri ? (
        <Animated.View style={[StyleSheet.absoluteFill, {opacity: fade}]}>
          <Image
            {...rest}
            source={{uri}}
            style={StyleSheet.absoluteFill}
            onLoadEnd={onDone}
            onError={() => {
              // Stop the pulse on a dead URL: a placeholder that pulses
              // forever promises something that is never coming.
              setFailed(true);
              setLoaded(true);
            }}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}
