import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type {
  TaxpayerRepository,
  StoredTaxpayer,
  StoredTaxpayerAccountLink,
} from './taxpayer.repository.js';

@Injectable()
export class TaxpayerKyselyRepository implements TaxpayerRepository {
  // In-memory fallback for local tests and bootstrap
  private readonly memoryTaxpayers = new Map<string, StoredTaxpayer>();
  private readonly memoryLinks = new Map<string, StoredTaxpayerAccountLink>();

  constructor(private readonly dbService: DatabaseService) {}

  async findById(id: string): Promise<StoredTaxpayer | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('registry.taxpayers')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        publicRef: row.public_ref,
        displayName: row.display_name,
        statusCode: row.status_code,
        createdAt: row.created_at,
        createdByProfileId: row.created_by_profile_id,
      };
    }

    return this.memoryTaxpayers.get(id) ?? null;
  }

  async search(query: string): Promise<StoredTaxpayer[]> {
    if (this.dbService.isInitialized) {
      const rows = await this.dbService.db
        .selectFrom('registry.taxpayers')
        .selectAll()
        .where((eb) =>
          eb.or([
            eb('display_name', 'like', `%${query}%`),
            eb('public_ref', '=', query),
          ]),
        )
        .execute();
      return rows.map((row) => ({
        id: row.id,
        publicRef: row.public_ref,
        displayName: row.display_name,
        statusCode: row.status_code,
        createdAt: row.created_at,
        createdByProfileId: row.created_by_profile_id,
      }));
    }

    const lowerQuery = query.toLowerCase();
    return [...this.memoryTaxpayers.values()].filter(
      (t) =>
        t.displayName.toLowerCase().includes(lowerQuery) ||
        (t.publicRef && t.publicRef.toLowerCase() === lowerQuery),
    );
  }

  async findActiveLinkByProfileId(
    userProfileId: string,
  ): Promise<StoredTaxpayerAccountLink | null> {
    if (this.dbService.isInitialized) {
      const row = await this.dbService.db
        .selectFrom('registry.taxpayer_account_links')
        .selectAll()
        .where('user_profile_id', '=', userProfileId)
        .where('active_state_code', '=', 'active')
        .executeTakeFirst();
      if (!row) return null;
      return {
        id: row.id,
        publicRef: row.public_ref,
        userProfileId: row.user_profile_id,
        taxpayerId: row.taxpayer_id,
        relationshipTypeCode: row.relationship_type_code,
        activeStateCode: row.active_state_code,
        verificationStatusCode: row.verification_status_code,
        effectiveFrom: row.effective_from,
        effectiveTo: row.effective_to,
      };
    }

    return (
      [...this.memoryLinks.values()].find(
        (l) =>
          l.userProfileId === userProfileId && l.activeStateCode === 'active',
      ) ?? null
    );
  }

  async createLink(
    link: StoredTaxpayerAccountLink,
    actorProfileId: string,
  ): Promise<StoredTaxpayerAccountLink> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('registry.taxpayer_account_links')
        .values({
          id: link.id,
          public_ref: link.publicRef,
          user_profile_id: link.userProfileId,
          taxpayer_id: link.taxpayerId,
          relationship_type_code: link.relationshipTypeCode,
          active_state_code: link.activeStateCode,
          verification_status_code: link.verificationStatusCode,
          effective_from: link.effectiveFrom,
          effective_to: link.effectiveTo,
          created_by_profile_id: actorProfileId,
        })
        .execute();
      return link;
    }

    this.memoryLinks.set(link.id, link);
    return link;
  }

  async createTaxpayer(taxpayer: StoredTaxpayer): Promise<StoredTaxpayer> {
    if (this.dbService.isInitialized) {
      await this.dbService.db
        .insertInto('registry.taxpayers')
        .values({
          id: taxpayer.id,
          public_ref: taxpayer.publicRef,
          display_name: taxpayer.displayName,
          status_code: taxpayer.statusCode,
          created_by_profile_id: taxpayer.createdByProfileId,
        })
        .execute();
      return taxpayer;
    }

    this.memoryTaxpayers.set(taxpayer.id, taxpayer);
    return taxpayer;
  }
}
