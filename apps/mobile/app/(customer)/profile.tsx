import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileUpdateSchema, type ProfileUpdateData, type ProfileUpdateInput } from '@simple-concepts/shared';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, View } from 'react-native';

import { TextField } from '@/components/admin/text-field';
import { RequireSignIn } from '@/components/require-sign-in';
import { Button } from '@/components/ui/buttons';
import { Card } from '@/components/ui/menu-row';
import { useUpdateProfile } from '@/features/account/use-account';
import { useSessionStore } from '@/features/auth/session-store';
import { errorMessage } from '@/lib/api';
import { strings } from '@/lib/i18n';

const t = strings.profile;

function ProfileForm() {
  const user = useSessionStore((state) => state.user);
  const update = useUpdateProfile();
  const { control, handleSubmit } = useForm<ProfileUpdateInput, unknown, ProfileUpdateData>({
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
    resolver: zodResolver(ProfileUpdateSchema),
  });

  const submit = handleSubmit(async (values) => {
    await update.mutateAsync(values).then(
      () => router.back(),
      () => undefined,
    );
  });

  return (
    <ScrollView contentContainerClassName="p-4" keyboardShouldPersistTaps="handled">
      <Card className="p-4">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <TextField
              autoCapitalize="words"
              autoComplete="name"
              error={fieldState.error?.message}
              label={t.name}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              autoCapitalize="none"
              autoComplete="email"
              error={fieldState.error?.message}
              inputMode="email"
              keyboardType="email-address"
              label={t.email}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              value={field.value}
            />
          )}
        />
        <TextField
          editable={false}
          label={t.phone}
          note={t.phoneNote}
          value={`+91 ${user?.phone ?? ''}`}
        />
        {update.isError ? (
          <Text accessibilityLiveRegion="polite" className="mb-3 text-red-700">
            {errorMessage(update.error)}
          </Text>
        ) : null}
        <View className="mt-1">
          <Button label={t.save} loading={update.isPending} onPress={() => void submit()} />
        </View>
      </Card>
    </ScrollView>
  );
}

export default function ProfileScreen() {
  return (
    <RequireSignIn>
      <ProfileForm />
    </RequireSignIn>
  );
}
