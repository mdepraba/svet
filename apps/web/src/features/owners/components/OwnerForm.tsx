import { zodResolver } from '@hookform/resolvers/zod';
import { type Resolver, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  type CreateOwner,
  CreateOwnerSchema,
  UpdateOwnerSchema,
} from '@svet-monorepo/schemas';

type OwnerFormMode = 'create' | 'update';

type OwnerFormProps = {
  mode: OwnerFormMode;
  defaultValues?: Partial<CreateOwner>;
  onSubmit: (values: CreateOwner) => void;
  isPending?: boolean;
};

const emptyDefaults: CreateOwner = {
  name: '',
  email: '',
  phone: '',
  address: '',
};

export function OwnerForm({
  mode,
  defaultValues,
  onSubmit,
  isPending,
}: OwnerFormProps) {
  // "create" mode requires name, "update" mode makes every field optional (partial).
  // The submitted value shape stays CreateOwner either way — only the validation
  // strictness changes — so the resolver is cast explicitly to match useForm<CreateOwner>.
  const schema = mode === 'create' ? CreateOwnerSchema : UpdateOwnerSchema;
  const resolver = zodResolver(schema) as unknown as Resolver<CreateOwner>;

  const form = useForm<CreateOwner>({
    resolver,
    defaultValues: {
      ...emptyDefaults,
      ...defaultValues,
    },
  });

  function handleSubmit(values: CreateOwner) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Owner name"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="owner@email.com"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input
                  placeholder="08xxxxxxxxxx"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="Address"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending
            ? 'Saving...'
            : mode === 'create'
              ? 'Add Owner'
              : 'Update Owner'}
        </Button>
      </form>
    </Form>
  );
}
