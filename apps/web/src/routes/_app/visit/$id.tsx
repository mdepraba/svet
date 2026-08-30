import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { VisitWorksheet } from '@/features/visits/components/VisitWorksheet';
import { visitDetailOptions } from '@/features/visits/queries/visitResource';

export const Route = createFileRoute('/_app/visit/$id')({
  staticData: { breadcrumbTitle: 'Record' },
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(visitDetailOptions(params.id)),
  component: VisitRecordPage,
});

function VisitRecordPage() {
  const { id } = Route.useParams();
  const { data: visit } = useQuery(visitDetailOptions(id));

  if (!visit) return null;

  return <VisitWorksheet visit={visit} />;
}
