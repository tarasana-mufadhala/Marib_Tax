import { Controller, Get } from '@nestjs/common';
import type { HealthResponse, ReadinessResponse } from '@marib-tax/contracts';

@Controller()
export class HealthController {
  @Get('health')
  getHealth(): HealthResponse {
    return { status: 'ok', service: 'marib-tax-api', version: 'v1' };
  }

  @Get('ready')
  getReadiness(): ReadinessResponse {
    return { status: 'ready', service: 'marib-tax-api', version: 'v1' };
  }
}
