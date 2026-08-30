import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type CreatePatient,
  CreatePatientSchema,
  UpdatePatientSchema,
} from '@svet-monorepo/schemas';

type PatientFormMode = 'create' | 'update';

type OwnerOption = { id: string; name: string };

type PatientFormProps = {
  mode: PatientFormMode;
  owners: OwnerOption[];
  defaultValues?: Partial<CreatePatient>;
  onSubmit: (values: CreatePatient) => void;
  onCancel?: () => void;
  isPending?: boolean;
};

const SEX_OPTIONS = ['Male', 'Female', 'Unknown'];

/**
 * Mirrors `OwnerForm`: "create" requires the identifying fields, "update"
 * makes every field optional. The submitted shape stays `CreatePatient` either
 * way, so the resolver is cast to match `useForm<CreatePatient>`.
 */
export function PatientForm({
  mode,
  owners,
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
}: PatientFormProps) {
  const schema = mode === 'create' ? CreatePatientSchema : UpdatePatientSchema;
  const resolver = zodResolver(schema) as unknown as Resolver<CreatePatient>;

  const form = useForm<CreatePatient>({
    resolver,
    defaultValues: {
      name: '',
      species: '',
      breed: '',
      sex: '',
      color: '',
      dob: null,
      ownerId: '',
      ...defaultValues,
    } as CreatePatient,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-3.5"
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="ownerId"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Owner</FormLabel>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Choose an owner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pet name</FormLabel>
                <FormControl>
                  <Input
                    className="h-9"
                    placeholder="Miko"
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
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sex</FormLabel>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Unknown" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SEX_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="species"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Species</FormLabel>
                <FormControl>
                  <Input
                    className="h-9"
                    placeholder="Cat"
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
            name="breed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Breed</FormLabel>
                <FormControl>
                  <Input
                    className="h-9"
                    placeholder="Domestic shorthair"
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
            name="dob"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of birth</FormLabel>
                <FormControl>
                  <Input
                    className="h-9"
                    type="date"
                    value={toDateInput(field.value)}
                    onChange={(event) =>
                      field.onChange(event.target.value || null)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Colour and markings</FormLabel>
                <FormControl>
                  <Input
                    className="h-9"
                    placeholder="Orange tabby, white chest"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="text-ink-600 flex items-center gap-2 text-[11.5px]">
          <Info className="size-3.5 flex-none" />
          The owner must exist before a patient can be added. Date of birth is
          optional.
        </div>

        <div className="mt-auto flex gap-2 pt-2">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" className="ml-auto" disabled={isPending}>
            {isPending
              ? 'Saving…'
              : mode === 'create'
                ? 'Save patient'
                : 'Update patient'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

/** `<input type="date">` wants `YYYY-MM-DD`; the field may hold a Date. */
function toDateInput(value: unknown): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}
