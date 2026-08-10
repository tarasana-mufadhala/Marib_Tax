import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string | null {
    return this.config.get<string>('SUPABASE_URL') ?? null;
  }

  private get serviceKey(): string | null {
    return this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? null;
  }

  get enabled(): boolean {
    return !!(this.baseUrl && this.serviceKey);
  }

  async upload(
    bucket: string,
    path: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<boolean> {
    if (!this.enabled) return false;
    try {
      const res = await fetch(`${this.baseUrl}/storage/v1/object/${bucket}/${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.serviceKey}`,
          apikey: this.serviceKey as string,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: new Uint8Array(buffer),
      });
      if (!res.ok) {
        // بلا هذا السطر يُبتلع سبب الفشل ويصل المستخدم «الخدمة غير متاحة» فقط.
        this.logger.error(
          `فشل رفع ${bucket}/${path}: ${res.status} ${(await res.text()).slice(0, 200)}`,
        );
      }
      return res.ok;
    } catch (error) {
      this.logger.error(
        `تعذّر الاتصال بالتخزين لرفع ${bucket}/${path}`,
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }

  async download(
    bucket: string,
    path: string,
  ): Promise<{ buffer: Buffer; contentType: string } | null> {
    if (!this.enabled) return null;
    try {
      const res = await fetch(
        `${this.baseUrl}/storage/v1/object/authenticated/${bucket}/${path}`,
        {
          headers: {
            Authorization: `Bearer ${this.serviceKey}`,
            apikey: this.serviceKey as string,
          },
        },
      );
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType: res.headers.get('content-type') ?? 'application/octet-stream',
      };
    } catch {
      return null;
    }
  }
}
