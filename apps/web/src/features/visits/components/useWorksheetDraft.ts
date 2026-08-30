import { useEffect, useMemo, useState } from 'react';
import type {
  SaveWorksheet,
  TreatmentListItem,
  VisitWorksheet,
} from '@svet-monorepo/schemas';

/**
 * A service line in the draft. `ref` is a client-side key: a product can name
 * the service it came from before either row has a database id, which is what
 * lets a whole worksheet be saved in one request.
 */
export type DraftService = {
  ref: string;
  treatmentId: string;
  qty: number;
};

export type DraftProduct = {
  productId: string;
  qty: number;
  /** `ref` of the parent service, or null when added by hand. */
  treatmentRef: string | null;
};

export type DraftRecord = {
  anamnesis: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  temperature: string;
  pulse: string;
  respiration: string;
  weight: string;
};

export type DraftDetail = {
  /** Present when the detail already exists; absent for a just-added patient. */
  id?: string;
  patientId: string;
  vetId: string;
  record: DraftRecord;
  services: DraftService[];
  products: DraftProduct[];
};

let refCounter = 0;
function nextRef(): string {
  refCounter += 1;
  return `svc-${refCounter}`;
}

const EMPTY_RECORD: DraftRecord = {
  anamnesis: '',
  diagnosis: '',
  treatment: '',
  notes: '',
  temperature: '',
  pulse: '',
  respiration: '',
  weight: '',
};

/** `null` and `undefined` both become an empty input, not the string "null". */
function text(value: string | number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

/** An empty input clears the field; anything unparseable is left alone. */
function num(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDraft(visit: VisitWorksheet): DraftDetail[] {
  return visit.visitDetails.map((detail) => {
    const record = detail.medicalRecords[0];

    // Rebuild the client refs from the stored parent ids, so an existing
    // service keeps its products nested under it after a reload.
    const refByAssocId = new Map<string, string>();
    const services = detail.visitTreatmentAssocs.map((line) => {
      const ref = nextRef();
      refByAssocId.set(line.id, ref);
      return { ref, treatmentId: line.treatmentId, qty: line.qty };
    });

    return {
      id: detail.id,
      patientId: detail.patientId,
      vetId: detail.vetId,
      record: record
        ? {
            anamnesis: text(record.anamnesis),
            diagnosis: text(record.diagnosis),
            treatment: text(record.treatment),
            notes: text(record.notes),
            temperature: text(record.temperature),
            pulse: text(record.pulse),
            respiration: text(record.respiration),
            weight: text(record.weight),
          }
        : { ...EMPTY_RECORD },
      services,
      products: detail.visitProductAssocs.map((line) => ({
        productId: line.productId,
        qty: line.qty,
        treatmentRef: line.visitTreatmentAssocId
          ? (refByAssocId.get(line.visitTreatmentAssocId) ?? null)
          : null,
      })),
    };
  });
}

export function toSavePayload(details: DraftDetail[]): SaveWorksheet {
  return {
    visitDetails: details.map((detail) => ({
      ...(detail.id ? { id: detail.id } : {}),
      patientId: detail.patientId,
      vetId: detail.vetId,
      record: {
        anamnesis: detail.record.anamnesis || null,
        diagnosis: detail.record.diagnosis || null,
        treatment: detail.record.treatment || null,
        notes: detail.record.notes || null,
        temperature: num(detail.record.temperature),
        pulse: num(detail.record.pulse) ?? null,
        respiration: num(detail.record.respiration) ?? null,
        weight: num(detail.record.weight),
      },
      treatments: detail.services.map((service) => ({
        ref: service.ref,
        treatmentId: service.treatmentId,
        qty: service.qty,
      })),
      products: detail.products.map((product) => ({
        productId: product.productId,
        qty: product.qty,
        treatmentRef: product.treatmentRef,
      })),
    })),
  };
}

/**
 * Holds the worksheet's editable state. Resets to the server's copy whenever
 * a save returns, so what is on screen is always what was actually stored —
 * including the ids the server minted for newly added rows.
 */
export function useWorksheetDraft(visit: VisitWorksheet) {
  const [details, setDetails] = useState<DraftDetail[]>(() => toDraft(visit));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDetails(toDraft(visit));
    setDirty(false);
  }, [visit]);

  const mutate = (
    index: number,
    update: (detail: DraftDetail) => DraftDetail,
  ) => {
    setDirty(true);
    setDetails((prev) =>
      prev.map((detail, i) => (i === index ? update(detail) : detail)),
    );
  };

  const actions = useMemo(
    () => ({
      setRecordField(index: number, field: keyof DraftRecord, value: string) {
        mutate(index, (detail) => ({
          ...detail,
          record: { ...detail.record, [field]: value },
        }));
      },

      setVet(index: number, vetId: string) {
        mutate(index, (detail) => ({ ...detail, vetId }));
      },

      /**
       * Adding a service also pulls in its default product recipe — that is
       * the point of the recipe, and typing them again is how a vet ends up
       * with a record that does not match what left the shelf.
       */
      addService(index: number, treatment: TreatmentListItem) {
        const ref = nextRef();
        mutate(index, (detail) => ({
          ...detail,
          services: [
            ...detail.services,
            { ref, treatmentId: treatment.id, qty: 1 },
          ],
          products: [
            ...detail.products,
            ...treatment.treatmentProductAssocs.map((line) => ({
              productId: line.productId,
              qty: line.qty,
              treatmentRef: ref,
            })),
          ],
        }));
      },

      removeService(index: number, ref: string) {
        mutate(index, (detail) => ({
          ...detail,
          services: detail.services.filter((service) => service.ref !== ref),
          // The products it brought in go with it; anything added by hand stays.
          products: detail.products.filter(
            (product) => product.treatmentRef !== ref,
          ),
        }));
      },

      setServiceQty(index: number, ref: string, qty: number) {
        mutate(index, (detail) => ({
          ...detail,
          services: detail.services.map((service) =>
            service.ref === ref
              ? { ...service, qty: Math.max(1, qty) }
              : service,
          ),
        }));
      },

      addProduct(
        index: number,
        productId: string,
        treatmentRef: string | null,
      ) {
        mutate(index, (detail) => ({
          ...detail,
          products: [...detail.products, { productId, qty: 1, treatmentRef }],
        }));
      },

      setProductQty(index: number, position: number, qty: number) {
        mutate(index, (detail) => ({
          ...detail,
          products: detail.products.map((product, i) =>
            i === position ? { ...product, qty: Math.max(1, qty) } : product,
          ),
        }));
      },

      removeProduct(index: number, position: number) {
        mutate(index, (detail) => ({
          ...detail,
          products: detail.products.filter((_, i) => i !== position),
        }));
      },

      addPatient(patientId: string, vetId: string) {
        setDirty(true);
        setDetails((prev) => [
          ...prev,
          {
            patientId,
            vetId,
            record: { ...EMPTY_RECORD },
            services: [],
            products: [],
          },
        ]);
      },
    }),
    [],
  );

  return { details, dirty, actions };
}
