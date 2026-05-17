import React from 'react';
import { Pressable, Text, ActivityIndicator, TextInput, View, PressableProps, TextInputProps, TextStyle, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/use-colors';

// --- BOTÓN PROFESIONAL ---
interface ButtonProps extends PressableProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  fullWidth?: boolean;
  textStyle?: TextStyle;
}

export const Button = ({ title, loading, variant = 'primary', icon, iconColor, fullWidth = true, textStyle, ...props }: ButtonProps) => {
  const colors = useColors();
  
  const getBgColor = () => {
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.surface;
      case 'outline': return 'transparent';
      case 'danger': return '#EF4444';
      case 'success': return '#25D366';
      default: return colors.primary;
    }
  };

  const handlePress = (e: any) => {
    if (Platform.OS !== 'web') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(err) {}
    }
    if (props.onPress) props.onPress(e);
  };

  const defaultIconColor = variant === 'secondary' || variant === 'outline' ? colors.foreground : 'white';

  return (
    <Pressable
      {...props}
      onPress={handlePress}
      disabled={loading || props.disabled}
      className={`${fullWidth ? 'w-full' : ''} flex-row items-center justify-center gap-2 rounded-xl active:opacity-80`}
      style={({ pressed }) => [
        {
          backgroundColor: getBgColor(),
          padding: variant === 'outline' ? 14 : 16,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.border,
          opacity: (pressed || loading || props.disabled) ? 0.7 : 1,
        },
        props.style as any,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.primary : 'white'} />
      ) : (
        <>
          {icon && <MaterialIcons name={icon} size={20} color={iconColor || defaultIconColor} />}
          {title ? (
            <Text 
              className="font-bold text-base"
              style={[{ 
                color: variant === 'secondary' || variant === 'outline' ? colors.foreground : 'white', 
              }, textStyle]}
            >
              {title}
            </Text>
          ) : null}
        </>
      )}
    </Pressable>
  );
};

// --- INPUT DE PRECIO ---
interface PriceInputProps extends TextInputProps {
  label?: string;
  currency?: string;
}

export const PriceInput = ({ label, currency, ...props }: PriceInputProps) => {
  const colors = useColors();
  
  const handleChangeText = (text: string) => {
    let val = text;
    if ((props.keyboardType === 'decimal-pad' || props.keyboardType === 'numeric') && /^0\d/.test(text)) {
      val = text.replace(/^0+/, '');
    }
    if (props.onChangeText) props.onChangeText(val);
  };

  return (
    <View className="gap-1 mb-3">
      {label ? <Text className="text-[10px] font-bold text-muted uppercase px-1">{label} {currency && `(${currency})`}</Text> : null}
      <View 
        className="bg-surface rounded-xl border border-border flex-row items-center px-3"
        style={{ height: props.multiline ? 'auto' : 54 }}
      >
        {currency === '$' && <Text className="text-muted mr-1 font-bold">$</Text>}
        <TextInput
          {...props}
          onChangeText={handleChangeText}
          placeholderTextColor={colors.muted}
          className="flex-1 font-bold text-foreground py-2"
          style={[{ fontSize: 15 }, props.style]}
          keyboardType={props.keyboardType || 'default'}
        />
      </View>
    </View>
  );
};

// --- TARJETA BASE ---
interface CardProps {
  children: React.ReactNode;
  style?: any;
  accentColor?: string;
  onPress?: () => void;
  variant?: 'elevated' | 'glass' | 'flat';
}

export const Card = ({ children, style, accentColor, onPress, variant = 'elevated' }: CardProps) => {
  const colors = useColors();
  const Container = onPress ? Pressable : View;

  const handlePress = () => {
    if (onPress) {
      if (Platform.OS !== 'web') {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch(err) {}
      }
      onPress();
    }
  };

  return (
    <Container 
      onPress={onPress ? handlePress : undefined}
      className={`rounded-[28px] overflow-hidden ${variant === 'glass' ? 'bg-surface/60' : 'bg-surface'} border border-border/40`}
      style={({ pressed }: any) => [
        {
          elevation: variant === 'elevated' ? 4 : 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          borderLeftWidth: accentColor ? 6 : 1,
          borderLeftColor: accentColor || colors.border,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }]
        },
        style
      ]}
    >
      <View className="p-5">{children}</View>
    </Container>
  );
};

// --- WIDGET DE ESTADÍSTICA (PREMIUM) ---
interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  onPress?: () => void;
  style?: any;
}

export const StatCard = ({ label, value, subValue, icon, color, onPress, style }: StatCardProps) => {
  return (
    <Card onPress={onPress} accentColor={color} style={[{ flex: 1, padding: 0 }, style]}>
      <View className="flex-row items-center justify-between mb-2">
        <View className="p-2 rounded-xl" style={{ backgroundColor: color + '20' }}>
          <MaterialIcons name={icon} size={20} color={color} />
        </View>
        <Text className="text-[10px] font-black text-muted uppercase tracking-tighter">{label}</Text>
      </View>
      <Text className="text-2xl font-black text-foreground tracking-tight">{value}</Text>
      {subValue && <Text className="text-[11px] font-bold text-muted mt-1">{subValue}</Text>}
    </Card>
  );
};

