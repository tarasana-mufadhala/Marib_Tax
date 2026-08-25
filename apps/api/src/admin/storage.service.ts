import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request as httpsRequest } from 'node:https';
import { URL } from 'node:url';

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
      // fetch() المدمج يفرض مهلة ترويسات ثابتة (300 ثانية) لا يمكن تجاوزها،
      // فيسقط رفع ملف كبير على وصلة بطيئة — وهو الحال هنا: مستندات ممسوحة
      // بعشرات الميغابايت على سرعة رفع منخفضة. نستعمل node:https بمهلة أوسع.
      const res = await this.putObject(
        `${this.baseUrl}/storage/v1/object/${bucket}/${path}`,
        buffer,
        contentType,
      );
      if (!res.ok) {
        // بلا هذا السطر يُبتلع سبب الفشل ويصل المستخدم «الخدمة غير متاحة» فقط.
        this.logger.error(
          `فشل رفع ${bucket}/${path}: ${res.status} ${res.body.slice(0, 200)}`,
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

  /**
   * رفع كائن عبر node:https بمهلة تناسب الوصلات البطيئة.
   *
   * الجسم يُرسل دفعة واحدة لأن الحجم معروف مسبقاً؛ ما يهم هنا هو المهلة
   * لا التدفق.
   */
  private putObject(
    url: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<{ ok: boolean; status: number; body: string }> {
    const target = new URL(url);
    // خمس عشرة دقيقة: تكفي 50 ميغابايت على وصلة بطيئة، وتقطع ما علِق فعلاً.
    const timeoutMs = 15 * 60 * 1000;

    return new Promise((resolve, reject) => {
      const req = httpsRequest(
        {
          protocol: target.protocol,
          hostname: target.hostname,
          port: target.port || 443,
          path: target.pathname + target.search,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.serviceKey}`,
            apikey: this.serviceKey as string,
            'Content-Type': contentType,
            'x-upsert': 'true',
            'Content-Length': buffer.length,
          },
          timeout: timeoutMs,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => {
            const status = res.statusCode ?? 0;
            resolve({
              ok: status >= 200 && status < 300,
              status,
              body: Buffer.concat(chunks).toString('utf8'),
            });
          });
        },
      );

      req.on('timeout', () => {
        req.destroy(new Error(`انتهت مهلة الرفع بعد ${timeoutMs / 60000} دقيقة`));
      });
      req.on('error', reject);
      req.end(buffer);
    });
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
