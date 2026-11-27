import { zodResolver } from '@hookform/resolvers/zod';
import { AdminLoginSchema, type AdminLoginInput } from '@simple-concepts/shared';
import { Redirect, router, type Href } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { TextField } from '@/components/admin/text-field';
import { GradientFill } from '@/components/gradient-fill';
import { useSessionStore } from '@/features/auth/session-store';
import { errorMessage, useAdminLogin } from '@/features/admin/use-admin';
import { strings } from '@/lib/i18n';

const t = strings.admin;
// Typed routes don't list the URL of an index screen inside a group folder, so name it directly.
const ADMIN_HOME = '/admin' as Href;

export default function AdminLoginScreen() {
  const user = useSessionStore((state) => state.user);
  const login = useAdminLogin();
  const { control, handleSubmit } = useForm<AdminLoginInput>({
    defaultValues: { identifier: '', password: '' },
    resolver: zodResolver(AdminLoginSchema),
  });

  if (user?.role === 'ADMIN') return <Redirect href={ADMIN_HOME} />;

  const submit = handleSubmit(async (values) => {
    await login.mutateAsync(values).then(
      () => router.replace(ADMIN_HOME),
      () => undefined,
    );
  });

  return (
    <ScrollView contentContainerClassName="p-4" keyboardShouldPersistTaps="handled">
      <View className="rounded-2xl border border-gray-200 bg-white p-5">
        <Text accessibilityRole="header" className="text-2xl font-bold text-brand">
          {t.title}
        </Text>
        <Text className="mb-5 mt-1 text-gray-600">{t.loginBody}</Text>
        <Controller
          control={control}
          name="identifier"
          render={({ field, fieldState }) => (
            <TextField
              autoCapitalize="none"
              autoComplete="username"
              error={fieldState.error ? t.identifier : undefined}
              label={t.identifier}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              autoCapitalize="none"
              autoComplete="current-password"
              error={fieldState.error?.message}
              label={t.password}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              onSubmitEditing={() => void submit()}
              secureTextEntry
              value={field.value}
            />
          )}
        />
        {login.isError ? (
          <Text accessibilityLiveRegion="polite" className="mb-3 text-red-700">
            {errorMessage(login.error)}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          className="min-h-12 items-center justify-center overflow-hidden rounded-full bg-primary"
          disabled={login.isPending}
          onPress={() => void submit()}>
          <GradientFill name="primary" />
          <Text className="font-semibold text-white">{login.isPending ? '…' : t.logIn}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
