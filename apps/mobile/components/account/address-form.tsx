import { zodResolver } from '@hookform/resolvers/zod';
import {
  AddressInputSchema,
  type AddressData,
  type AddressDto,
  type AddressInput,
} from '@simple-concepts/shared';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { TextField } from '@/components/admin/text-field';
import { Button } from '@/components/ui/buttons';
import { ICON_SIZE, colors } from '@/constants/theme';
import { useSessionStore } from '@/features/auth/session-store';
import { strings } from '@/lib/i18n';

const t = strings.addresses;

type TextFieldName = Exclude<keyof AddressInput, 'isDefault'>;

const FIELDS: {
  name: TextFieldName;
  autoComplete?: 'name' | 'tel' | 'street-address' | 'postal-code';
  numeric?: boolean;
  maxLength?: number;
}[] = [
  { name: 'name', autoComplete: 'name' },
  { name: 'phone', autoComplete: 'tel', numeric: true, maxLength: 16 },
  { name: 'street', autoComplete: 'street-address' },
  { name: 'area' },
  { name: 'city' },
  { name: 'state' },
  { name: 'pinCode', autoComplete: 'postal-code', numeric: true, maxLength: 6 },
];

// The shop is in Tamil Nadu, so most deliveries start with this state filled in.
const DEFAULT_STATE = 'Tamil Nadu';

type AddressFormProps = {
  address?: AddressDto;
  saving: boolean;
  error?: string;
  onSave: (values: AddressData) => void;
};

export function AddressForm({ address, saving, error, onSave }: AddressFormProps) {
  const user = useSessionStore((state) => state.user);
  const { control, handleSubmit } = useForm<AddressInput, unknown, AddressData>({
    defaultValues: address ?? {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      street: '',
      area: '',
      city: '',
      state: DEFAULT_STATE,
      pinCode: '',
      isDefault: false,
    },
    resolver: zodResolver(AddressInputSchema),
  });

  return (
    <View>
      {FIELDS.map(({ name, autoComplete, numeric, maxLength }) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field, fieldState }) => (
            <TextField
              autoCapitalize={numeric ? 'none' : 'words'}
              autoComplete={autoComplete}
              error={fieldState.error?.message}
              keyboardType={numeric ? 'number-pad' : 'default'}
              label={t.fields[name]}
              maxLength={maxLength}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              value={field.value}
            />
          )}
        />
      ))}
      {address?.isDefault ? null : (
        <Controller
          control={control}
          name="isDefault"
          render={({ field }) => (
            <Pressable
              accessibilityLabel={t.makeDefault}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!field.value }}
              className="mb-3 min-h-12 flex-row items-center"
              onPress={() => field.onChange(!field.value)}>
              <Ionicons
                color={colors.brand}
                name={field.value ? 'checkbox' : 'square-outline'}
                size={ICON_SIZE.medium}
              />
              <Text className="ml-2 text-gray-900">{t.makeDefault}</Text>
            </Pressable>
          )}
        />
      )}
      {error ? (
        <Text accessibilityLiveRegion="polite" className="mb-3 text-red-700">
          {error}
        </Text>
      ) : null}
      <Button label={t.save} loading={saving} onPress={() => void handleSubmit(onSave)()} />
    </View>
  );
}
