import { router } from 'expo-router';

import { ProductForm } from '@/components/admin/product-form';
import { EMPTY_PRODUCT_FORM, toProductInput } from '@/features/admin/product-form-values';
import { useSaveProduct } from '@/features/admin/use-admin';

export default function NewProductScreen() {
  const save = useSaveProduct();

  return (
    <ProductForm
      initial={EMPTY_PRODUCT_FORM}
      onSubmit={async (values) => {
        await save.mutateAsync(toProductInput(values));
        router.back();
      }}
    />
  );
}
