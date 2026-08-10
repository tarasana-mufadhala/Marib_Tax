export interface StoredPaymentDue {
  id: string;
  publicRef: string | null;
  serviceRequestId: string | null;
  balaghId: string | null;
  amount: number;
  currencyCode: string;
  statusCode: string; // pending, paid, cancelled
  assessedAt: Date | null;
  createdAt: Date;
  createdByProfileId: string | null;
  updatedAt: Date | null;
  updatedByProfileId: string | null;
  correlationId: string | null;
  archivedAt: Date | null;
}

export interface StoredDueBasisDocumentReference {
  id: string;
  paymentDueId: string;
  documentReference: string | null;
  attachmentId: string | null;
  basisTypeCode: string;
  createdAt: Date;
  createdByProfileId: string | null;
}

export interface StoredDueCorrection {
  id: string;
  paymentDueId: string;
  priorAmount: number;
  newAmount: number;
  currencyCode: string;
  reason: string;
  correctedAt: Date;
  correctedByStaffProfileId: string;
}

export interface StoredPaymentReceipt {
  id: string;
  publicRef: string | null;
  paymentDueId: string;
  amount: number;
  currencyCode: string;
  acceptanceStatusCode: string; // pending, approved, rejected
  receivedAt: Date | null;
  replacesReceiptId: string | null;
  createdAt: Date;
  createdByProfileId: string | null;
  updatedAt: Date | null;
  updatedByProfileId: string | null;
}

export interface StoredPaymentConfirmation {
  id: string;
  paymentReceiptId: string;
  confirmedAt: Date;
  confirmedByStaffProfileId: string;
  notes: string | null;
}

export interface StoredFinancialCorrection {
  id: string;
  paymentDueId: string;
  correctionType: string;
  amount: number;
  currencyCode: string;
  notes: string | null;
  createdAt: Date;
}

export const DUES_PAYMENTS_REPOSITORY = Symbol('DUES_PAYMENTS_REPOSITORY');

export interface DuesPaymentsRepository {
  findDueById(id: string): Promise<StoredPaymentDue | null>;
  findDuesByRequestId(serviceRequestId: string): Promise<StoredPaymentDue[]>;
  createDue(due: StoredPaymentDue): Promise<StoredPaymentDue>;
  updateDue(
    id: string,
    updates: Partial<StoredPaymentDue>,
  ): Promise<StoredPaymentDue>;

  createBasisReference(
    ref: StoredDueBasisDocumentReference,
  ): Promise<StoredDueBasisDocumentReference>;
  listBasisReferencesForDue(
    paymentDueId: string,
  ): Promise<StoredDueBasisDocumentReference[]>;

  createCorrection(
    correction: StoredDueCorrection,
  ): Promise<StoredDueCorrection>;
  listCorrectionsForDue(paymentDueId: string): Promise<StoredDueCorrection[]>;

  findReceiptById(id: string): Promise<StoredPaymentReceipt | null>;
  listReceiptsForDue(paymentDueId: string): Promise<StoredPaymentReceipt[]>;
  createReceipt(receipt: StoredPaymentReceipt): Promise<StoredPaymentReceipt>;
  updateReceipt(
    id: string,
    updates: Partial<StoredPaymentReceipt>,
  ): Promise<StoredPaymentReceipt>;

  createConfirmation(
    conf: StoredPaymentConfirmation,
  ): Promise<StoredPaymentConfirmation>;

  createFinancialCorrection(
    correction: StoredFinancialCorrection,
  ): Promise<StoredFinancialCorrection>;
}
