import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '@/constants/theme';

type TextFieldProps = Omit<TextInputProps, 'className'> & {
  label: string;
  error?: string;
  note?: string;
};

export function TextField({ label, error, note, multiline, ...input }: TextFieldProps) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-sm font-semibold text-gray-700">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        className={`min-h-12 rounded-xl border bg-white px-3 text-base text-gray-900 ${
          error ? 'border-red-600' : 'border-gray-300'
        } ${multiline ? 'min-h-28 py-3' : ''}`}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...input}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" className="mt-1 text-sm text-red-700">
          {error}
        </Text>
      ) : note ? (
        <Text className="mt-1 text-xs text-gray-500">{note}</Text>
      ) : null}
    </View>
  );
}
