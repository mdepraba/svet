import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

import { Blueprint, Kicker } from '@/components/industry/Blueprint';
import { PageHead } from '@/components/industry/PageHead';
import { SegFilter } from '@/components/industry/Toolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { owners } from '@/features/owners/queries/ownerResource';
import { users } from '@/features/staff/queries/staffResource';
import {
  useCreateVisit,
  useCreateVisitDetail,
} from '@/features/visits/queries/visitResource';
import { patients } from '@/features/patients/queries/patientResource';
import { petAge, shortDate } from '@/lib/format';

const OWNER_PARAMS = { limit: 100, sortBy: 'name', sortOrder: 'asc' } as const;
const STAFF_PARAMS = { limit: 100, sortBy: 'name', sortOrder: 'asc' } as const;

const TYPE_OPTIONS = [
  { value: 'MEDIC', label: 'Medical' },
  { value: 'NON_MEDIC', label: 'Non-medical' },
] as const;

function todayKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function nowTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes(),
  ).padStart(2, '0')}`;
}

export const Route = createFileRoute('/_app/visit/register')({
  staticData: { breadcrumbTitle: 'Register' },
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      owners.ensureList(queryClient, OWNER_PARAMS),
      users.ensureList(queryClient, STAFF_PARAMS),
    ]),
  component: RegisterVisitPage,
});

function RegisterVisitPage() {
  const navigate = useNavigate();
  const createVisit = useCreateVisit();
  const createDetail = useCreateVisitDetail();

  const { data: ownerPage } = useQuery(owners.listOptions(OWNER_PARAMS));
  const { data: staffPage } = useQuery(users.listOptions(STAFF_PARAMS));

  const [ownerId, setOwnerId] = useState('');
  const [visitType, setVisitType] = useState<'MEDIC' | 'NON_MEDIC'>('MEDIC');
  const [date, setDate] = useState(todayKey());
  const [time, setTime] = useState(nowTime());
  const [reason, setReason] = useState('');
  /** patientId → the vet attending it. Absent means "not on this visit". */
  const [selected, setSelected] = useState<Record<string, string>>({});

  const staff = staffPage?.data ?? [];
  const ownerList = ownerPage?.data ?? [];
  const owner = ownerList.find((candidate) => candidate.id === ownerId);

  const { data: petPage } = useQuery({
    ...patients.listOptions({ limit: 100, search: owner?.name }),
    enabled: Boolean(owner),
  });
  const pets = (petPage?.data ?? []).filter((pet) => pet.ownerId === ownerId);

  const chosen = Object.entries(selected);
  const isBusy = createVisit.isPending || createDetail.isPending;

  function togglePet(patientId: string) {
    setSelected((prev) => {
      if (prev[patientId]) {
        const rest = { ...prev };
        delete rest[patientId];
        return rest;
      }
      return { ...prev, [patientId]: staff[0]?.id ?? '' };
    });
  }

  /**
   * `immediate` is the "Check up immediately" path: registers at the current
   * time, skipping the date, time and reason the desk would otherwise fill in.
   */
  async function register(immediate: boolean) {
    if (!ownerId) {
      toast.error('Choose an owner first');
      return;
    }
    const registrar = staff[0];
    if (!registrar) {
      toast.error('No staff account to register this visit against');
      return;
    }

    const when = immediate
      ? new Date()
      : new Date(`${date}T${time || '00:00'}`);

    if (Number.isNaN(when.getTime())) {
      toast.error('That date and time could not be read');
      return;
    }

    try {
      const visit = await createVisit.mutateAsync({
        userId: registrar.id,
        ownerId,
        visitType,
        status: immediate ? 'ONGOING' : 'SCHEDULED',
        visitDate: when.toISOString(),
        scheduleAt: immediate ? null : when.toISOString(),
      });

      // Patients are optional at the desk — they can be added on the record.
      await Promise.all(
        chosen
          .filter(([, vetId]) => Boolean(vetId))
          .map(([patientId, vetId]) =>
            createDetail.mutateAsync({
              visitId: visit.id,
              patientId,
              vetId,
            }),
          ),
      );

      toast.success('Visit registered');
      navigate({ to: '/visit/$id', params: { id: visit.id } });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not register this visit',
      );
    }
  }

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[1fr_300px]">
      <div className="flex min-h-0 flex-col gap-3.5 overflow-auto">
        <PageHead kicker="New visit" title="Register visit" />

        <Step number="01" title="Owner">
          <Select value={ownerId} onValueChange={setOwnerId}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Search the owner by name" />
            </SelectTrigger>
            <SelectContent>
              {ownerList.map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>
                  {candidate.name}
                  {candidate.phone ? ` · ${candidate.phone}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {owner ? (
            <div className="border-primary mt-2 border px-3 py-2">
              <div className="font-heading text-[17px]">{owner.name}</div>
              <div className="text-ink-600 text-[11.5px]">
                {[
                  owner.phone,
                  owner.email,
                  `${owner.patients.length} ${owner.patients.length === 1 ? 'pet' : 'pets'} on file`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </div>
          ) : null}
        </Step>

        <Step number="02" title="Patients and attending vet" hint="optional">
          {owner ? (
            pets.length > 0 ? (
              <div className="flex flex-col gap-2">
                {pets.map((pet) => {
                  const isOn = Boolean(selected[pet.id]);
                  return (
                    <div
                      key={pet.id}
                      className={`flex flex-wrap items-center gap-3 border px-3 py-2 ${
                        isOn ? 'border-primary' : 'border-border'
                      }`}
                    >
                      <label className="radio">
                        <input
                          type="checkbox"
                          checked={isOn}
                          onChange={() => togglePet(pet.id)}
                        />
                        <span className="dot" />
                      </label>
                      <div className="min-w-0 flex-1">
                        <div className="font-heading text-base">{pet.name}</div>
                        <div className="text-ink-600 text-[11.5px]">
                          {[
                            pet.species,
                            pet.breed,
                            petAge(pet.dob),
                            pet.lastVisitAt
                              ? `last seen ${shortDate(pet.lastVisitAt)}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </div>
                      {isOn ? (
                        <label className="w-44">
                          <span className="text-ink-700 mb-1 block text-xs">
                            Vet
                          </span>
                          <Select
                            value={selected[pet.id]}
                            onValueChange={(vetId) =>
                              setSelected((prev) => ({
                                ...prev,
                                [pet.id]: vetId,
                              }))
                            }
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue placeholder="Choose a vet" />
                            </SelectTrigger>
                            <SelectContent>
                              {staff.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </label>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-ink-600 border-border m-0 border px-3 py-3 text-[12.5px]">
                No pets on file for this owner yet.
              </p>
            )
          ) : (
            <p className="text-ink-600 border-border m-0 border px-3 py-3 text-[12.5px]">
              Choose an owner to see their pets.
            </p>
          )}
          <p className="text-ink-500 mt-2 text-[11.5px]">
            Leave this empty and register anyway — patients can be picked or
            added on the visit page. Each patient gets its own record and its
            own usage inside this one visit.
          </p>
        </Step>

        <Step number="03" title="Type and time">
          <div className="flex flex-wrap items-end gap-2.5">
            <SegFilter
              name="visit-type"
              value={visitType}
              options={TYPE_OPTIONS}
              onChange={setVisitType}
            />
            <label className="w-[150px]">
              <span className="text-ink-700 mb-1 block text-xs">Date</span>
              <Input
                className="h-9"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <label className="w-[110px]">
              <span className="text-ink-700 mb-1 block text-xs">Time</span>
              <Input
                className="h-9"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </label>
            <label className="min-w-[200px] flex-1">
              <span className="text-ink-700 mb-1 block text-xs">
                Reason given at the desk
              </span>
              <Input
                className="h-9"
                placeholder="Not eating since Wednesday"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
          </div>
        </Step>
      </div>

      <div className="flex min-h-0 flex-col gap-3">
        <Blueprint className="px-3 py-2.5">
          <Kicker className="mb-2">This visit</Kicker>
          <SummaryRow label="Owner" value={owner?.name ?? '—'} />
          <SummaryRow
            label="Patients"
            value={
              chosen.length === 0 ? 'None yet' : `${chosen.length} selected`
            }
          />
          <SummaryRow
            label="Type"
            value={visitType === 'MEDIC' ? 'Medical' : 'Non-medical'}
          />
          <SummaryRow label="When" value={`${date} ${time}`} />
        </Blueprint>

        <div className="mt-auto flex flex-col gap-2">
          <Button
            className="w-full"
            disabled={isBusy || !ownerId}
            onClick={() => register(false)}
          >
            Register
          </Button>
          <p className="text-ink-500 m-0 text-[11px] leading-[1.5]">
            Date and time are required.
          </p>
          <Button
            variant="outline"
            className="w-full"
            disabled={isBusy || !ownerId}
            onClick={() => register(true)}
          >
            Check up immediately
          </Button>
          <p className="text-ink-500 m-0 text-[11px] leading-[1.5]">
            Registers at the current time and opens the record — no date, time
            or reason needed.
          </p>
        </div>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  hint,
  children,
}: {
  number: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="font-heading text-primary w-6 flex-none pt-1 text-[11px] tracking-[0.1em]">
        {number}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-baseline gap-2">
          <Kicker>{title}</Kicker>
          {hint ? (
            <span className="text-ink-500 text-[11px]">{hint}</span>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1 flex justify-between gap-3 text-[13px]">
      <span className="text-ink-600">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
