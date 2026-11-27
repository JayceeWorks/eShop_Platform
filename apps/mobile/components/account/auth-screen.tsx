import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { GradientFill } from '@/components/gradient-fill';
import { ICON_SIZE, colors } from '@/constants/theme';
import { strings } from '@/lib/i18n';

import { OtpForm } from './otp-form';

const t = strings.auth;

type AuthParams = { next?: string; phone?: string; codeSent?: string; testCode?: string };

/** Sign in and sign up share this layout; only the title, the name field and the link differ. */
export function AuthScreen({ mode }: { mode: 'signIn' | 'signUp' }) {
  const { next, phone, codeSent, testCode } = useLocalSearchParams<AuthParams>();
  const isSignUp = mode === 'signUp';

  return (
    <ScrollView contentContainerClassName="p-4" keyboardShouldPersistTaps="handled">
      <View className="mb-4 overflow-hidden rounded-2xl p-5">
        <GradientFill name="card" />
        <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-accent">
          <Ionicons
            color={colors.brand}
            name={isSignUp ? 'person-add-outline' : 'shield-checkmark-outline'}
            size={ICON_SIZE.medium}
          />
        </View>
        <Text accessibilityRole="header" className="text-2xl font-bold text-white">
          {isSignUp ? t.signUpTitle : t.signInTitle}
        </Text>
        <Text className="mt-1 text-white/90">{isSignUp ? t.signUpBody : t.signInBody}</Text>
      </View>

      <View className="rounded-2xl border border-gray-200 bg-white p-5">
        <OtpForm
          codeAlreadySent={codeSent === '1' && !!phone}
          initialDevCode={testCode}
          initialPhone={phone}
          mode={mode}
          next={next}
        />
      </View>

      <Pressable
        accessibilityRole="link"
        className="mt-4 min-h-11 items-center justify-center"
        onPress={() =>
          router.replace({
            pathname: isSignUp ? '/sign-in' : '/sign-up',
            params: next ? { next } : {},
          })
        }>
        <Text className="font-semibold text-brand underline">
          {isSignUp ? t.haveAccount : t.newHere}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
