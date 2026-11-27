import { Pressable, Text } from 'react-native';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`mb-2 mr-2 min-h-11 justify-center rounded-full border px-4 ${
        selected ? 'border-brand bg-brand' : 'border-gray-300 bg-white'
      }`}
      onPress={onPress}>
      <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-gray-800'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
