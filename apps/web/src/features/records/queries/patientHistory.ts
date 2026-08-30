import { useQuery } from '@tanstack/react-query';
import {
  type PatientRecordHistoryItem,
  PatientRecordHistorySchema,
} from '@svet-monorepo/schemas';

import { apiFetch } from '@/lib/api';

export const patientHistoryKeys = {
  all: ['patient-history'] as const,
  forPatient: (patientId: string) => ['patient-history', patientId] as const,
};

export async function getPatientHistory(
  patientId: string,
): Promise<PatientRecordHistoryItem[]> {
  const response = await apiFetch<PatientRecordHistoryItem[]>(
    `/medical-record/patient/${patientId}`,
  );
  return PatientRecordHistorySchema.parse(response);
}

export const patientHistoryOptions = (patientId: string) => ({
  queryKey: patientHistoryKeys.forPatient(patientId),
  queryFn: () => getPatientHistory(patientId),
});

/** The visit worksheet's right rail, and the patient chart's record list. */
export function usePatientHistory(patientId: string | undefined) {
  return useQuery({
    ...patientHistoryOptions(patientId ?? ''),
    enabled: Boolean(patientId),
  });
}
