import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import DealCard from './DealCard';

const DATA = [
  {
    id: 1,
    img: 'https://images.pexels.com/photos/27127418/pexels-photo-27127418.jpeg',
  },
  {
    id: 2,
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800',
  },
  {
    id: 3,
    img: 'https://images.pexels.com/photos/22922098/pexels-photo-22922098.jpeg',
  },
  {
    id: 4,
    img: 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=800',
  },
];

export default function StackedDeals() {
  const [stack, setStack] = useState(DATA);
  const [autoSwipe, setAutoSwipe] = useState(false);

  const sendToBack = useCallback(() => {
    setStack(prev => {
      const copy = [...prev];
      const first = copy.shift();
      if (first) copy.push(first);
      return copy;
    });

    setAutoSwipe(false);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!autoSwipe) {
        setAutoSwipe(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoSwipe]);

  return (
    <View className="w-full h-[480px] items-center justify-center mt-6">
      {[...stack].reverse().map(card => {
        const positionFromTop = stack.findIndex(c => c.id === card.id);

        return (
          <DealCard
            key={card.id}
            card={card}
            positionFromTop={positionFromTop}
            isTop={positionFromTop === 0}
            onSwipe={sendToBack}
            autoSwipe={autoSwipe}
          />
        );
      })}
    </View>
  );
}
