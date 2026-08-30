import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { Blueprint } from '@/components/industry/Blueprint';
import { PageHead } from '@/components/industry/PageHead';
import { owners } from '@/features/owners/queries/ownerResource';
import { PatientForm } from '@/features/patients/components/PatientForm';
import { patients } from '@/features/patients/queries/patientResource';
import type { CreatePatient } from '@svet-monorepo/schemas';

const OWNER_PARAMS = { limit: 100, sortBy: 'name', sortOrder: 'asc' } as const;

export const Route = createFileRoute('/_app/patient/add')({
  staticData: { breadcrumbTitle: 'Add' },
  loader: ({ context: { queryClient } }) =>
    owners.ensureList(queryClient, OWNER_PARAMS),
  component: PatientAddPage,
});

function PatientAddPage() {
  const navigate = useNavigate();
  const { data: ownerPage } = useQuery(owners.listOptions(OWNER_PARAMS));
  const { mutate, isPending } = patients.useCreate();

  function handleSubmit(values: CreatePatient) {
    mutate(values, {
      onSuccess: (patient) => {
        toast.success(`${patient.name} added`);
        navigate({ to: '/patient/$id', params: { id: patient.id } });
      },
      onError: (error) =>
        toast.error(
          error instanceof Error ? error.message : 'Could not add the patient',
        ),
    });
  }

  return (
    <div className="flex h-full max-w-2xl flex-col gap-3.5">
      <PageHead kicker="New patient" title="Add patient" />
      <Blueprint className="flex min-h-0 flex-1 flex-col p-4">
        <PatientForm
          mode="create"
          owners={ownerPage?.data ?? []}
          onSubmit={handleSubmit}
          onCancel={() => navigate({ to: '/patient' })}
          isPending={isPending}
        />
      </Blueprint>
    </div>
  );
}
