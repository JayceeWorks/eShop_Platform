import { ActivityIndicator, Pressable, Text } from 'react-native';

import { GradientFill } from '@/components/gradient-fill';
import { colors } from '@/constants/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** primary = blue pill, accent = orange pill, outline = navy border, danger = red border, dangerFill = solid red. */
  variant?: 'primary' | 'accent' | 'outline' | 'danger' | 'dangerFill';
  accessibilityLabel?: string;
};

const VARIANT_CLASSES = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  outline: 'border border-brand bg-white',
  danger: 'border border-red-700 bg-white',
  dangerFill: 'bg-red-700',
} as const;

const TEXT_CLASSES = {
  primary: 'text-white',
  accent: 'text-brand',
  outline: 'text-brand',
  danger: 'text-red-700',
  dangerFill: 'text-white',
} as const;

export function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  accessibilityLabel,
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      className={`min-h-12 flex-row items-center justify-center overflow-hidden rounded-full px-5 ${
        VARIANT_CLASSES[variant]
      } ${inactive ? 'opacity-50' : 'active:opacity-80'}`}
      disabled={inactive}
      onPress={onPress}>
      {variant === 'primary' ? <GradientFill name="primary" /> : null}
      {variant === 'accent' ? <GradientFill name="action" /> : null}
      {loading ? (
        <ActivityIndicator
          className="mr-2"
          color={variant === 'dangerFill' || variant === 'primary' ? colors.white : colors.brand}
        />
      ) : null}
      <Text className={`text-base font-semibold ${TEXT_CLASSES[variant]}`}>{label}</Text>
    </Pressable>
  );
}
