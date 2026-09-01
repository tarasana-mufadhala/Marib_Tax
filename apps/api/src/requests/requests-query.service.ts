import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export interface ServiceRequestListItem {
  id: string;
  publicRef: string | null;
  taxpayerId: string;
  taxpayerName: string;
  taxpayerRef: string | null;
  serviceTypeCode: string;
  serviceTypeName: string;
  statusCode: string;
  submittedAt: Date | null;
  createdAt: Date;
}

/**
 * Read-only list queries over the requests schema (staff/admin views).
 */
@Injectable()
export class RequestsQueryService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * @param ownerProfileId عند تمريره تقتصر النتيجة على طلبات هذا الملف الشخصي.
   *   المكلف لا يرى إلا طلباته؛ الموظف وحده يستدعيها بلا تقييد.
   */
  async listRequests(
    limit = 50,
    ownerProfileId?: string,
  ): Promise<ServiceRequestListItem[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    let query = this.databaseService.db
      .selectFrom('requests.service_requests')
      .innerJoin(
        'registry.taxpayers',
        'registry.taxpayers.id',
        'requests.service_requests.taxpayer_id',
      )
      .innerJoin(
        'requests.service_types',
        'requests.service_types.id',
        'requests.service_requests.service_type_id',
      )
      .select([
        'requests.service_requests.id as id',
        'requests.service_requests.public_ref as public_ref',
        'requests.service_requests.taxpayer_id as taxpayer_id',
        'registry.taxpayers.display_name as taxpayer_name',
        'registry.taxpayers.public_ref as taxpayer_ref',
        'requests.service_types.code as service_type_code',
        'requests.service_types.name as service_type_name',
        'requests.service_requests.status_code as status_code',
        'requests.service_requests.submitted_at as submitted_at',
        'requests.service_requests.created_at as created_at',
      ])
      .where('requests.service_requests.archived_at', 'is', null);

    if (ownerProfileId !== undefined) {
      query = query.where(
        'requests.service_requests.created_by_profile_id',
        '=',
        ownerProfileId,
      );
    }

    const rows = await query
      .orderBy('requests.service_requests.created_at', 'desc')
      .limit(safeLimit)
      .execute();

    return rows.map((row) => ({
      id: row.id,
      publicRef: row.public_ref,
      taxpayerId: row.taxpayer_id,
      taxpayerName: row.taxpayer_name,
      taxpayerRef: row.taxpayer_ref,
      serviceTypeCode: row.service_type_code,
      serviceTypeName: row.service_type_name,
      statusCode: row.status_code,
      submittedAt: row.submitted_at,
      createdAt: row.created_at,
    }));
  }
}
