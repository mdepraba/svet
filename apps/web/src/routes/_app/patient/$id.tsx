import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';

import { Blueprint, Kicker } from '@/components/industry/Blueprint';
import { patients } from '@/features/patients/queries/patientResource';
import { usePatientHistory } from '@/features/records/queries/patientHistory';
import { petAge, shortDate } from '@/lib/format';
import type { PatientRecordHistoryItem } from '@svet-monorepo/schemas';

export const Route = createFileRoute('/_app/patient/$id')({
  staticData: { breadcrumbTitle: 'Patient' },
  loader: ({ context: { queryClient }, params }) =>
    patients.ensureDetail(queryClient, params.id),
  component: PatientDetailPage,
});

function PatientDetailPage() {
  const { id } = Route.useParams();
  const { data: patient } = useQuery(patients.detailOptions(id));
  const { data: history } = usePatientHistory(id);

  if (!patient) return null;

  const records = history ?? [];
  const weights = records
    .filter((record) => record.weight !== null)
    .slice(0, 8)
    .reverse();

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[1fr_300px]">
      <div className="flex min-h-0 flex-col gap-3.5 overflow-auto">
        <div>
          <div className="kicker-accent">
            Patient · {patient.species}
            {patient.breed ? ` · ${patient.breed}` : ''}
          </div>
          <h3 className="mt-0.5 text-[25px]">{patient.name}</h3>
          <div className="text-ink-600 text-[12.5px]">
            <Link to="/owner/$id" params={{ id: patient.ownerId }}>
              {patient.owner.name}
            </Link>
            {' · '}
            {petAge(patient.dob)}
            {patient.sex ? ` · ${patient.sex}` : ''}
            {patient.color ? ` · ${patient.color}` : ''}
          </div>
        </div>

        <Blueprint className="p-3">
          <div className="mb-2 flex items-baseline">
            <Kicker>Medical records</Kicker>
            <span className="text-ink-600 ml-auto text-xs">
              {records.length} {records.length === 1 ? 'record' : 'records'} ·
              newest first
            </span>
          </div>

          {records.length === 0 ? (
            <p className="text-ink-600 m-0 text-[12.5px]">
              This patient has no medical records yet.
            </p>
          ) : (
            <table className="table text-[12.5px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vet</th>
                  <th>Diagnosis</th>
                  <th className="text-right">Temp</th>
                  <th className="text-right">Pulse</th>
                  <th className="text-right">Weight</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="tabular-nums">
                      {shortDate(record.recordedAt)}
                    </td>
                    <td>{record.vetName ?? '—'}</td>
                    <td>
                      {record.diagnosis ?? record.anamnesis ?? (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <td className="text-right tabular-nums">
                      {record.temperature ?? '—'}
                    </td>
                    <td className="text-right tabular-nums">
                      {record.pulse ?? '—'}
                    </td>
                    <td className="text-right tabular-nums">
                      {record.weight ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Blueprint>
      </div>

      <div className="flex min-h-0 flex-col gap-3">
        <Blueprint className="p-3">
          <Kicker className="mb-2">Chart</Kicker>
          <Row label="Species" value={patient.species} />
          <Row label="Breed" value={patient.breed ?? '—'} />
          <Row label="Sex" value={patient.sex ?? '—'} />
          <Row label="Colour" value={patient.color ?? '—'} />
          <Row label="Date of birth" value={shortDate(patient.dob)} />
          <Row label="Age" value={petAge(patient.dob)} />
          <Row
            label="Last visit"
            value={
              patient.lastVisitAt ? shortDate(patient.lastVisitAt) : 'Never'
            }
          />
        </Blueprint>

        {weights.length >= 2 ? (
          <Blueprint className="p-3">
            <Kicker className="mb-2">Weight trend</Kicker>
            <WeightTrend records={weights} />
          </Blueprint>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1 flex justify-between gap-3 text-[13px]">
      <span className="text-ink-600">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function WeightTrend({ records }: { records: PatientRecordHistoryItem[] }) {
  const values = records.map((record) => record.weight as number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // A flat series would divide by zero; give it a nominal band instead.
  const span = max - min || 1;

  const points = values
    .map((value, index) => {
      const x = 14 + (index * 212) / Math.max(values.length - 1, 1);
      const y = 62 - ((value - min) / span) * 44;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <>
      <svg
        viewBox="0 0 240 80"
        className="border-border h-20 w-full border"
        role="img"
        aria-label={`Weight across ${values.length} visits, ${min} to ${max} kilograms`}
      >
        <polyline
          points={points}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
        />
        <text x="8" y="14" fontSize="7" fill="currentColor" opacity=".5">
          {max}
        </text>
        <text x="8" y="74" fontSize="7" fill="currentColor" opacity=".5">
          {min}
        </text>
      </svg>
      <p className="text-ink-600 m-0 mt-1.5 text-[11px]">
        {shortDate(records[0].recordedAt)} →{' '}
        {shortDate(records[records.length - 1].recordedAt)}
      </p>
    </>
  );
}
