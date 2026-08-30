import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Blueprint } from '@/components/industry/Blueprint';
import { PageHead } from '@/components/industry/PageHead';
import { OwnerForm } from '@/features/owners/components/OwnerForm';
import { owners } from '@/features/owners/queries/ownerResource';
import type { CreateOwner } from '@svet-monorepo/schemas';

export const Route = createFileRoute('/_app/owner/add')({
  staticData: { breadcrumbTitle: 'Add owner' },
  component: OwnerAddPage,
});

function OwnerAddPage() {
  const navigate = useNavigate();
  const { mutate, isPending } = owners.useCreate();

  function handleSubmit(values: CreateOwner) {
    mutate(values, {
      onSuccess: () => {
        navigate({ to: '/owner' });
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHead kicker="Medical" title="Add owner" />
      <Blueprint className="max-w-xl p-4">
        <OwnerForm
          mode="create"
          onSubmit={handleSubmit}
          isPending={isPending}
        />
      </Blueprint>
    </div>
  );
}
