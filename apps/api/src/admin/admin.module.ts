import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AttachmentsController } from './attachments.controller.js';
import { ImportsController } from './imports.controller.js';
import { PublicContentController } from './public-content.controller.js';
import { ReportsController } from './reports.controller.js';
import { StorageService } from './storage.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminController, AttachmentsController, ImportsController, PublicContentController, ReportsController],
  providers: [StorageService],
  // تستعمله وحدة الخدمات لرفع مرفقات المكلف.
  exports: [StorageService],
})
export class AdminModule {}
