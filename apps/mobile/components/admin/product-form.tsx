import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import { MAX_PRODUCT_IMAGES, MAX_PRODUCT_SPECS } from '@simple-concepts/shared';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState, type ReactNode } from 'react';
import { Controller, useFieldArray, useForm, type Control, type FieldPath } from 'react-hook-form';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { Chip } from '@/components/chip';
import { GradientFill } from '@/components/gradient-fill';
import { ICON_SIZE, colors } from '@/constants/theme';
import { ProductFormSchema, type ProductFormValues } from '@/features/admin/product-form-values';
import { checkPickedImage, errorMessage, uploadProductImage } from '@/features/admin/use-admin';
import { useCategories } from '@/features/catalog/use-catalog';
import { resolveImageUrl } from '@/lib/image-url';
import { strings } from '@/lib/i18n';

import { TextField } from './text-field';

const THUMB_SIZE = 88;
const PICKER_QUALITY = 0.85;
const t = strings.admin;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mx-3 mt-3 rounded-2xl border border-gray-200 bg-white p-4">
      <Text accessibilityRole="header" className="mb-3 text-lg font-bold text-brand">
        {title}
      </Text>
      {children}
    </View>
  );
}

function FormText({
  control,
  name,
  label,
  ...rest
}: {
  control: Control<ProductFormValues>;
  name: FieldPath<ProductFormValues>;
  label: string;
  note?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'characters' | 'sentences' | 'words';
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          label={label}
          value={String(field.value ?? '')}
          onBlur={field.onBlur}
          onChangeText={field.onChange}
          error={fieldState.error?.message}
          {...rest}
        />
      )}
    />
  );
}

function PhotoPicker({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();

  const pick = async () => {
    setError(undefined);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: PICKER_QUALITY,
    });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    const problem = checkPickedImage(asset);
    if (problem) {
      setError(problem);
      return;
    }
    setUploading(true);
    try {
      onChange([...images, await uploadProductImage(asset)]);
    } catch (uploadError) {
      setError(errorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View>
      <View className="flex-row flex-wrap">
        {images.map((url, index) => (
          <View key={url} className="mb-2 mr-2">
            <Pressable
              accessibilityLabel={t.makeMain(index + 1)}
              accessibilityRole="button"
              disabled={index === 0}
              onPress={() => onChange([url, ...images.filter((_, i) => i !== index)])}>
              <Image
                contentFit="cover"
                source={resolveImageUrl(url)}
                style={{
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  borderRadius: 12,
                }}
              />
            </Pressable>
            {index === 0 ? (
              <Text className="absolute bottom-1 left-1 rounded-full bg-brand px-2 text-xs font-semibold text-white">
                {t.mainPhoto}
              </Text>
            ) : null}
            <Pressable
              accessibilityLabel={t.removePhoto(index + 1)}
              accessibilityRole="button"
              className="absolute -right-2 -top-2 h-8 w-8 items-center justify-center rounded-full bg-white"
              onPress={() => onChange(images.filter((_, i) => i !== index))}>
              <Ionicons name="close-circle" size={ICON_SIZE.medium} color={colors.brand} />
            </Pressable>
          </View>
        ))}
        {images.length < MAX_PRODUCT_IMAGES ? (
          <Pressable
            accessibilityRole="button"
            className="mb-2 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-brand-tint"
            disabled={uploading}
            onPress={pick}
            style={{ width: THUMB_SIZE, height: THUMB_SIZE }}>
            {uploading ? (
              <ActivityIndicator color={colors.brand} />
            ) : (
              <Ionicons name="camera-outline" size={ICON_SIZE.medium} color={colors.brand} />
            )}
            <Text className="mt-1 text-xs font-semibold text-brand">
              {uploading ? t.uploading : t.addPhoto}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="text-sm text-red-700">{error}</Text> : null}
      <Text className="mt-1 text-xs text-gray-500">{t.photoHint}</Text>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View className="min-h-12 flex-row items-center justify-between">
      <Text className="flex-1 text-base text-gray-800">{label}</Text>
      <Switch
        accessibilityLabel={label}
        onValueChange={onChange}
        thumbColor={colors.white}
        trackColor={{ false: colors.border, true: colors.brand }}
        value={value}
      />
    </View>
  );
}

type ProductFormProps = {
  initial: ProductFormValues;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  /** Extra controls under the save button, such as remove/restore. */
  footer?: ReactNode;
};

export function ProductForm({ initial, onSubmit, footer }: ProductFormProps) {
  const categories = useCategories();
  const [serverError, setServerError] = useState<string>();
  const { control, handleSubmit, formState } = useForm<ProductFormValues>({
    defaultValues: initial,
    resolver: zodResolver(ProductFormSchema),
  });
  const specs = useFieldArray({ control, name: 'specs' });

  const categoryOptions = (categories.data ?? []).flatMap((parent) => [
    { id: parent.id, label: parent.name },
    ...parent.children.map((child) => ({
      id: child.id,
      label: `${parent.name} › ${child.name}`,
    })),
  ]);

  const submit = handleSubmit(async (values) => {
    setServerError(undefined);
    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(errorMessage(error));
    }
  });

  return (
    <ScrollView contentContainerClassName="pb-8" keyboardShouldPersistTaps="handled">
      <Section title={t.sections.photos}>
        <Controller
          control={control}
          name="images"
          render={({ field }) => <PhotoPicker images={field.value} onChange={field.onChange} />}
        />
      </Section>

      <Section title={t.sections.details}>
        <FormText control={control} name="name" label={t.fields.name} autoCapitalize="words" />
        <Controller
          control={control}
          name="categoryId"
          render={({ field, fieldState }) => (
            <View className="mb-3">
              <Text className="mb-1 text-sm font-semibold text-gray-700">{t.fields.category}</Text>
              <View className="flex-row flex-wrap">
                {categoryOptions.map(({ id, label }) => (
                  <Chip
                    key={id}
                    label={label}
                    selected={field.value === id}
                    onPress={() => field.onChange(id)}
                  />
                ))}
              </View>
              {fieldState.error ? (
                <Text className="text-sm text-red-700">{fieldState.error.message}</Text>
              ) : null}
            </View>
          )}
        />
        <FormText control={control} name="brand" label={t.fields.brand} />
        <FormText
          control={control}
          name="model"
          label={t.fields.model}
          autoCapitalize="characters"
        />
        <FormText control={control} name="sku" label={t.fields.sku} autoCapitalize="characters" />
      </Section>

      <Section title={t.sections.pricing}>
        <FormText
          control={control}
          name="price"
          label={t.fields.price}
          keyboardType="decimal-pad"
        />
        <FormText control={control} name="mrp" label={t.fields.mrp} keyboardType="decimal-pad" />
        <FormText
          control={control}
          name="costPrice"
          label={t.fields.costPrice}
          keyboardType="decimal-pad"
          note={t.costPriceNote}
        />
        <FormText
          control={control}
          name="stockQty"
          label={t.fields.stockQty}
          keyboardType="number-pad"
        />
      </Section>

      <Section title={t.sections.description}>
        <FormText control={control} name="description" label={t.fields.description} multiline />
      </Section>

      <Section title={t.sections.specs}>
        {specs.fields.map((spec, index) => (
          <View key={spec.id} className="flex-row items-start">
            <View className="mr-2 flex-1">
              <FormText control={control} name={`specs.${index}.key`} label={t.fields.specName} />
            </View>
            <View className="flex-1">
              <FormText
                control={control}
                name={`specs.${index}.value`}
                label={t.fields.specValue}
              />
            </View>
            <Pressable
              accessibilityLabel={t.removeSpec(index + 1)}
              accessibilityRole="button"
              className="ml-1 mt-6 h-12 w-10 items-center justify-center"
              onPress={() => specs.remove(index)}>
              <Ionicons name="trash-outline" size={ICON_SIZE.small} color={colors.muted} />
            </Pressable>
          </View>
        ))}
        {specs.fields.length < MAX_PRODUCT_SPECS ? (
          <Pressable
            accessibilityRole="button"
            className="min-h-11 flex-row items-center"
            onPress={() => specs.append({ key: '', value: '' })}>
            <Ionicons name="add-circle-outline" size={ICON_SIZE.small} color={colors.brand} />
            <Text className="ml-1 font-semibold text-brand">{t.addSpec}</Text>
          </Pressable>
        ) : null}
      </Section>

      <Section title={t.sections.visibility}>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <ToggleRow label={t.fields.isActive} value={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="isFeatured"
          render={({ field }) => (
            <ToggleRow label={t.fields.isFeatured} value={field.value} onChange={field.onChange} />
          )}
        />
      </Section>

      <View className="mx-3 mt-4">
        {serverError || Object.keys(formState.errors).length > 0 ? (
          <Text accessibilityLiveRegion="polite" className="mb-2 text-center text-red-700">
            {serverError ?? t.fixErrors}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: formState.isSubmitting }}
          className="min-h-12 items-center justify-center overflow-hidden rounded-full bg-primary"
          disabled={formState.isSubmitting}
          onPress={() => void submit()}>
          <GradientFill name="primary" />
          <Text className="font-semibold text-white">
            {formState.isSubmitting ? t.saving : t.save}
          </Text>
        </Pressable>
        {footer}
      </View>
    </ScrollView>
  );
}
