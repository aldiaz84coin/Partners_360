const WARNING_MONTHS = 6;

export type LegalDocKey = "agreement" | "sla" | "nda" | "mou";

export const LEGAL_DOC_LABEL: Record<LegalDocKey, string> = {
  agreement: "Acuerdo",
  sla: "SLA",
  nda: "NDA",
  mou: "MOU",
};

export type PartnerLegalFields = {
  agreementEndDate: Date | null;
  slaStatus: string;
  slaEndDate: Date | null;
  ndaStatus: string;
  ndaEndDate: Date | null;
  mouStatus: string;
  mouEndDate: Date | null;
};

export type ExpiringDoc = { key: LegalDocKey; label: string; endDate: Date; expired: boolean };

/** Documents whose end date has already passed, or falls within the next 6 months. */
export function getExpiringLegalDocs(partner: PartnerLegalFields, referenceDate = new Date()): ExpiringDoc[] {
  const threshold = new Date(referenceDate);
  threshold.setMonth(threshold.getMonth() + WARNING_MONTHS);

  const docs: ExpiringDoc[] = [];
  function check(key: LegalDocKey, endDate: Date | null, applicable: boolean) {
    if (!applicable || !endDate) return;
    if (endDate <= threshold) {
      docs.push({ key, label: LEGAL_DOC_LABEL[key], endDate, expired: endDate < referenceDate });
    }
  }

  check("agreement", partner.agreementEndDate, true);
  check("sla", partner.slaEndDate, partner.slaStatus === "SI");
  check("nda", partner.ndaEndDate, partner.ndaStatus === "SI");
  check("mou", partner.mouEndDate, partner.mouStatus === "SI");

  return docs.sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
}
