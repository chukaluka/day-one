import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/theme';

export function ProgressBar({ progress }: { progress: number }) {
  const theme = useTheme();
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(value, {
      toValue: Math.max(0, Math.min(100, progress)),
      useNativeDriver: false,
      damping: 18,
      stiffness: 90,
    }).start();
  }, [progress, value]);

  const width = value.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={{ height: 9, borderRadius: 20, backgroundColor: theme.border, overflow: 'hidden' }}>
      <Animated.View style={{ height: '100%', width, overflow: 'hidden', borderRadius: 20 }}>
        <LinearGradient
          colors={['#7547F5', '#B36AF0', '#F27B9A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}
