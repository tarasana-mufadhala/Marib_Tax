import type { BalaghResponse, BalaghType } from '@marib-tax/contracts';

export interface StoredBalagh extends BalaghResponse {
  ownerActorId: string;
}

export interface BalaghListItem {
  id: string;
  publicRef: string | null;
  balaghType: BalaghType;
  status: string;
  createdAt: string;
  submittedAt: string | null;
}

export interface BalaghRepository {
  create(balagh: StoredBalagh): Promise<void>;
  findById(id: string): Promise<StoredBalagh | null>;
  save(balagh: StoredBalagh): Promise<void>;
  /** بلاغات مالكٍ بعينه؛ بلا معرّف مالك تُعاد بلاغات الجميع (للموظفين فقط). */
  list(ownerActorId: string | undefined, limit: number): Promise<BalaghListItem[]>;
}

export const BALAGH_REPOSITORY = Symbol('BALAGH_REPOSITORY');
