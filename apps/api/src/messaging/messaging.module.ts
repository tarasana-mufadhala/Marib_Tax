import { Module } from '@nestjs/common';
import { MESSAGING_PROVIDER } from './messaging.contracts.js';
import { MetaMessagingProvider } from './meta-messaging.provider.js';
import { TaxpayerCredentialsService } from './taxpayer-credentials.service.js';
import { CredentialsController } from './credentials.controller.js';
import { DatabaseModule } from '../database/database.module.js';

/**
 * الرسائل الصادرة. المزود خلف رمز حقن، فاستبداله بمزود آخر لا يمس
 * أي مستدعٍ — يكفي تغيير هذا السطر.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [CredentialsController],
  providers: [
    MetaMessagingProvider,
    { provide: MESSAGING_PROVIDER, useExisting: MetaMessagingProvider },
    TaxpayerCredentialsService,
  ],
  exports: [MESSAGING_PROVIDER, TaxpayerCredentialsService],
})
export class MessagingModule {}
