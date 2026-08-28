import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { SystemHealthController } from './system-health.controller.js';
import { DuesAdminController } from './dues-admin.controller.js';
import { TaxpayerAdminController } from './taxpayer-admin.controller.js';
import { AccessControlController } from './access-control.controller.js';
import { AttachmentsController } from './attachments.controller.js';
import { ImportsController } from './imports.controller.js';
import { PublicContentController } from './public-content.controller.js';
import { ReportsController } from './reports.controller.js';
import { StorageService } from './storage.service.js';
import { AuthnModule } from '../authn/authn.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { MessagingModule } from '../messaging/messaging.module.js';

@Module({
  imports: [DatabaseModule, MessagingModule, AuthnModule],
  controllers: [AdminController, TaxpayerAdminController, DuesAdminController, SystemHealthController, AccessControlController, AttachmentsController, ImportsController, PublicContentController, ReportsController],
  providers: [StorageService],
  // تستعمله وحدة الخدمات لرفع مرفقات المكلف.
  exports: [StorageService],
})
export class AdminModule {}
