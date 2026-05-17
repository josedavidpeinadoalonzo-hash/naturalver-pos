import React, { useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { useColors } from '@/hooks/use-colors';

interface WeeklyChartProps {
  data: { day: string; amount: number }[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const colors = useColors();
  const maxAmount = Math.max(...data.map(d => d.amount), 1);
  const chartHeight = 120;

  return (
    <View className="bg-surface rounded-[32px] p-6 border border-border/40 shadow-sm">
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-xl font-black text-foreground tracking-tighter">Ventas Semanales</Text>
          <Text className="text-[10px] font-black text-muted uppercase tracking-widest">Rendimiento Últimos 7 Días</Text>
        </View>
        <View className="bg-primary/10 px-3 py-1 rounded-full">
          <Text className="text-[10px] font-black text-primary uppercase">USD</Text>
        </View>
      </View>

      <View className="flex-row justify-between items-end h-[120px] px-2">
        {data.map((item, index) => (
          <Bar 
            key={index} 
            item={item} 
            maxAmount={maxAmount} 
            height={chartHeight} 
            color={index === data.length - 1 ? '#10B981' : '#3B82F6'} 
            index={index}
          />
        ))}
      </View>
    </View>
  );
}

function Bar({ item, maxAmount, height, color, index }: { item: any; maxAmount: number; height: number; color: string; index: number }) {
  const barHeight = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    barHeight.value = withDelay(index * 100, withTiming((item.amount / maxAmount) * height, { duration: 800 }));
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 800 }));
  }, [item.amount, maxAmount]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: barHeight.value,
    opacity: opacity.value,
  }));

  return (
    <View className="items-center flex-1">
      <View className="w-full items-center justify-end" style={{ height }}>
        <Animated.View 
          style={[
            { 
              width: 14, 
              backgroundColor: color, 
              borderRadius: 7,
              marginBottom: 8 
            }, 
            animatedStyle
          ]} 
        />
      </View>
      <Text className="text-[8px] font-black text-muted uppercase">{item.day}</Text>
      <Text className="text-[7px] font-bold text-foreground mt-0.5">${item.amount.toFixed(0)}</Text>
    </View>
  );
}
