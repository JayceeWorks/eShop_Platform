import { ACCOUNT_NOT_FOUND, OtpCodeSchema, PersonNameSchema, PhoneSchema } from '@simple-concepts/shared';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TextField } from '@/components/admin/text-field';
import { Button } from '@/components/ui/buttons';
import { useRequestOtp, useVerifyOtp } from '@/features/account/use-account';
import { ApiError, errorMessage } from '@/lib/api';
import { strings } from '@/lib/i18n';

const t = strings.auth;
const ONE_SECOND_MS = 1000;

type OtpFormProps = {
  mode: 'signIn' | 'signUp';
  /** Where to go after signing in. */
  next?: string;
  initialPhone?: string;
  /** A code was already sent to initialPhone (coming from sign in), so skip straight to it. */
  codeAlreadySent?: boolean;
  /** Test-mode code passed along from sign in. */
  initialDevCode?: string;
};

function useCountdown() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setTimeout(() => setSeconds((value) => value - 1), ONE_SECOND_MS);
    return () => clearTimeout(timer);
  }, [seconds]);
  return [seconds, setSeconds] as const;
}

export function OtpForm({
  mode,
  next,
  initialPhone = '',
  codeAlreadySent = false,
  initialDevCode,
}: OtpFormProps) {
  const [step, setStep] = useState<'phone' | 'code'>(codeAlreadySent ? 'code' : 'phone');
  const [phone, setPhone] = useState(initialPhone);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | undefined>(initialDevCode);
  const [fieldError, setFieldError] = useState<{ phone?: string; name?: string; code?: string }>(
    {},
  );
  const [resendIn, setResendIn] = useCountdown();
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();
  const normalizedPhone = PhoneSchema.safeParse(phone);
  const accountMissing =
    verifyOtp.error instanceof ApiError && verifyOtp.error.code === ACCOUNT_NOT_FOUND;

  const checkName = () => {
    if (mode !== 'signUp') return true;
    const result = PersonNameSchema.safeParse(name);
    if (!result.success)
      setFieldError((errors) => ({ ...errors, name: result.error.issues[0]?.message }));
    return result.success;
  };

  const sendCode = async () => {
    setFieldError({});
    // Check both fields so every problem shows at once.
    const nameOk = checkName();
    if (!normalizedPhone.success) {
      setFieldError((errors) => ({ ...errors, phone: normalizedPhone.error.issues[0]?.message }));
    }
    if (!normalizedPhone.success || !nameOk) return;
    try {
      const result = await requestOtp.mutateAsync(normalizedPhone.data);
      setDevCode(result.devCode);
      setResendIn(result.resendInSeconds);
      setCode('');
      verifyOtp.reset();
      setStep('code');
    } catch {
      // Shown from requestOtp.error.
    }
  };

  const verify = async () => {
    setFieldError({});
    const codeResult = OtpCodeSchema.safeParse(code);
    if (!codeResult.success) {
      setFieldError({ code: codeResult.error.issues[0]?.message });
      return;
    }
    if (!checkName() || !normalizedPhone.success) return;
    try {
      await verifyOtp.mutateAsync({
        phone: normalizedPhone.data,
        code: codeResult.data,
        ...(mode === 'signUp' ? { name: name.trim() } : {}),
      });
      router.replace((next ?? '/account') as Href);
    } catch {
      // Shown from verifyOtp.error.
    }
  };

  if (step === 'phone') {
    return (
      <View>
        {mode === 'signUp' ? (
          <TextField
            autoCapitalize="words"
            autoComplete="name"
            error={fieldError.name}
            label={t.name}
            onChangeText={setName}
            value={name}
          />
        ) : null}
        <TextField
          autoComplete="tel"
          error={fieldError.phone}
          inputMode="tel"
          keyboardType="phone-pad"
          label={t.phone}
          maxLength={16}
          onChangeText={setPhone}
          onSubmitEditing={() => void sendCode()}
          placeholder={t.phonePlaceholder}
          value={phone}
        />
        {requestOtp.isError ? (
          <Text accessibilityLiveRegion="polite" className="mb-3 text-red-700">
            {errorMessage(requestOtp.error)}
          </Text>
        ) : null}
        <Button label={t.sendCode} loading={requestOtp.isPending} onPress={() => void sendCode()} />
        <Text className="mt-3 text-center text-xs text-gray-500">{t.terms}</Text>
      </View>
    );
  }

  return (
    <View>
      <Text className="mb-1 text-gray-700">
        {t.codeSentTo(normalizedPhone.success ? normalizedPhone.data : phone)}
      </Text>
      <Pressable
        accessibilityRole="button"
        className="mb-3 min-h-11 justify-center self-start"
        onPress={() => {
          verifyOtp.reset();
          setStep('phone');
        }}>
        <Text className="font-semibold text-brand underline">{t.changeNumber}</Text>
      </Pressable>
      {devCode ? (
        <Text className="mb-3 rounded-xl bg-amber-100 p-3 text-amber-900">
          {t.testCode(devCode)}
        </Text>
      ) : null}
      {mode === 'signUp' && codeAlreadySent ? (
        <TextField
          autoCapitalize="words"
          autoComplete="name"
          error={fieldError.name}
          label={t.name}
          onChangeText={setName}
          value={name}
        />
      ) : null}
      <TextField
        autoComplete="one-time-code"
        error={fieldError.code}
        inputMode="numeric"
        keyboardType="number-pad"
        label={t.code}
        maxLength={6}
        onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
        onSubmitEditing={() => void verify()}
        textContentType="oneTimeCode"
        value={code}
      />
      {accountMissing ? (
        <View className="mb-3 rounded-xl bg-brand-tint p-3">
          <Text className="mb-2 text-brand">{t.noAccount}</Text>
          <Button
            label={t.createInstead}
            variant="outline"
            onPress={() =>
              router.replace({
                pathname: '/sign-up',
                params: {
                  phone: normalizedPhone.success ? normalizedPhone.data : phone,
                  codeSent: '1',
                  ...(devCode ? { testCode: devCode } : {}),
                  ...(next ? { next } : {}),
                },
              })
            }
          />
        </View>
      ) : verifyOtp.isError ? (
        <Text accessibilityLiveRegion="polite" className="mb-3 text-red-700">
          {errorMessage(verifyOtp.error)}
        </Text>
      ) : null}
      <Button label={t.verify} loading={verifyOtp.isPending} onPress={() => void verify()} />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: resendIn > 0 || requestOtp.isPending }}
        className="mt-3 min-h-11 items-center justify-center"
        disabled={resendIn > 0 || requestOtp.isPending}
        onPress={() => void sendCode()}>
        <Text className={resendIn > 0 ? 'text-gray-500' : 'font-semibold text-brand underline'}>
          {resendIn > 0 ? t.resendIn(resendIn) : t.resend}
        </Text>
      </Pressable>
      {requestOtp.isError ? (
        <Text accessibilityLiveRegion="polite" className="text-center text-red-700">
          {errorMessage(requestOtp.error)}
        </Text>
      ) : null}
    </View>
  );
}
