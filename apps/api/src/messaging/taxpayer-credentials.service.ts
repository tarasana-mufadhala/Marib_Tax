import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomInt, randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { sql } from 'kysely';
import { DatabaseService } from '../database/database.service.js';
import { DomainException } from '../http/domain-exception.js';
import {
  MESSAGING_PROVIDER,
  type MessagingProvider,
} from './messaging.contracts.js';
import { maskPhone } from './meta-messaging.provider.js';

/** حالة ربط حساب المكلف بالنسبة لبيانات الدخول. */
export const PENDING_CLAIM = 'imported_pending_claim';
export const CLAIMED = 'claimed';

/** لا أكثر من طلب واحد لكل رقم خلال هذه المدة. */
const REQUEST_COOLDOWN_MS = 3 * 60 * 1000;

@Injectable()
export class TaxpayerCredentialsService {
  private readonly logger = new Logger(TaxpayerCredentialsService.name);

  /** آخر طلب لكل رقم — تحديد معدل بسيط لكل نسخة. */
  private readonly lastRequestAt = new Map<string, number>();

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
    @Inject(MESSAGING_PROVIDER)
    private readonly messaging: MessagingProvider,
  ) {}

  /**
   * ينشئ هوية مصادقة للمكلف المستورَد ويربطها بسجله.
   *
   * كلمة المرور هنا عشوائية **لا يعرفها أحد ولا تُخزَّن**: الحساب موجود
   * لكنه غير قابل للاستعمال حتى يطلب المكلف بياناته، فتُولَّد له كلمة
   * جديدة وتُرسل إلى هاتفه. هذا يجنّبنا حفظ كلمة مرور بنص صريح.
   */
  async provisionImportedTaxpayer(params: {
    taxpayerId: string;
    phone: string;
    displayName: string;
  }): Promise<{ created: boolean; reason?: string }> {
    const phone = normalizeYemeniPhone(params.phone);
    if (phone === null) {
      return { created: false, reason: 'رقم هاتف غير صالح' };
    }

    const existingLink = await sql<{ id: string }>`
      select id from registry.taxpayer_account_links
      where taxpayer_id = ${params.taxpayerId}::uuid limit 1
    `.execute(this.db.db);
    if (existingLink.rows[0]) return { created: false, reason: 'الحساب موجود' };

    const existingIdentity = await this.findIdentityByPhone(phone);
    if (existingIdentity !== null) {
      return { created: false, reason: 'يوجد حساب بهذا الرقم' };
    }

    // كلمة مرور أوّلية عشوائية لا تُسجَّل ولا تُعاد — الحساب غير قابل
    // للاستعمال حتى يطلب المكلف بياناته.
    const authUserId = await this.createIdentity(phone, generatePassword(), params.displayName);
    if (authUserId === null) {
      return { created: false, reason: 'تعذّر إنشاء حساب المصادقة' };
    }

    try {
      const userProfileId = randomUUID();
      await this.db.db.transaction().execute(async (trx) => {
        await sql`
          insert into identity.user_profiles
            (id, auth_user_id, display_name, is_active, created_at)
          values (${userProfileId}::uuid, ${authUserId}::uuid,
                  ${params.displayName}, true, now())
        `.execute(trx);

        await sql`
          insert into registry.taxpayer_account_links
            (id, user_profile_id, taxpayer_id, relationship_type_code,
             active_state_code, verification_status_code, effective_from, created_at)
          values (${randomUUID()}::uuid, ${userProfileId}::uuid,
                  ${params.taxpayerId}::uuid, 'owner', 'active',
                  ${PENDING_CLAIM}, now(), now())
        `.execute(trx);
      });
      return { created: true };
    } catch (error) {
      await this.deleteIdentity(authUserId);
      this.logger.error(
        `تعذّر ربط حساب المكلف ${params.taxpayerId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return { created: false, reason: 'تعذّر ربط الحساب' };
    }
  }

  /**
   * يطلب المكلف بيانات دخوله فتُرسل إلى هاتفه المسجَّل.
   *
   * ترتيب العمليات مقصود: تُولَّد كلمة المرور، **ثم تُرسل**، ولا تُثبَّت في
   * مزود الهوية إلا بعد أن يقبلها مزود الرسائل. لو ثُبّتت قبل الإرسال
   * وفشل الإرسال لبقي المكلف محروماً من حسابه بكلمة لا يعرفها أحد.
   */
  async requestCredentials(rawPhone: string): Promise<{ sent: true }> {
    const phone = normalizeYemeniPhone(rawPhone);
    if (phone === null) {
      throw DomainException.badRequest(
        'أدخل رقم هاتف يمني صحيح يبدأ بـ 7 ويتكوّن من 9 أرقام',
        'INVALID_PHONE_NUMBER',
      );
    }

    const last = this.lastRequestAt.get(phone);
    if (last !== undefined && Date.now() - last < REQUEST_COOLDOWN_MS) {
      throw DomainException.conflict(
        'أُرسل طلب قريب لهذا الرقم. انتظر بضع دقائق قبل المحاولة مجدداً',
        'REQUEST_TOO_SOON',
      );
    }

    const account = await this.pendingAccountOf(phone);
    if (account === null) {
      // لا نكشف إن كان الرقم مسجَّلاً أو لا: الرسالة نفسها في الحالتين.
      throw DomainException.notFound(
        'لا توجد بيانات دخول قابلة للإرسال لهذا الرقم. إن كان لديك حساب فاستخدم «نسيت كلمة المرور»',
        'NO_PENDING_CREDENTIALS',
      );
    }

    if (!this.messaging.enabled) {
      throw DomainException.unavailable(
        'خدمة الرسائل غير مُفعّلة بعد. يرجى مراجعة المكتب لاستلام بيانات الدخول',
        'MESSAGING_NOT_CONFIGURED',
      );
    }

    const password = generatePassword();
    const result = await this.messaging.send({
      to: phone,
      channel: 'whatsapp',
      containsSecret: true,
      body:
        `مكتب الضرائب بمحافظة مأرب\n` +
        `بيانات الدخول لتطبيق المكلف:\n` +
        `رقم الهاتف: ${phone}\n` +
        `كلمة المرور: ${password}\n\n` +
        `يرجى تغييرها بعد أول دخول وعدم إطلاع أحد عليها.`,
    });

    if (!result.accepted) {
      throw DomainException.unavailable(
        result.reason ?? 'تعذّر إرسال بيانات الدخول، حاول لاحقاً',
        'CREDENTIALS_DELIVERY_FAILED',
      );
    }

    const updated = await this.setIdentityPassword(account.authUserId, password);
    if (!updated) {
      // الرسالة وصلت لكن التثبيت فشل: نُبلّغ بصدق بدل ترك المكلف يجرّب كلمة لا تعمل.
      this.logger.error(
        `أُرسلت بيانات الدخول إلى ${maskPhone(phone)} لكن تعذّر تثبيت كلمة المرور`,
      );
      throw DomainException.unavailable(
        'تعذّر إكمال العملية. يرجى طلب بيانات الدخول مجدداً بعد قليل',
        'CREDENTIALS_ACTIVATION_FAILED',
      );
    }

    await sql`
      update registry.taxpayer_account_links
      set verification_status_code = ${CLAIMED}, updated_at = now()
      where id = ${account.linkId}::uuid
    `.execute(this.db.db);

    this.lastRequestAt.set(phone, Date.now());
    this.logger.log(`أُرسلت بيانات الدخول إلى ${maskPhone(phone)}`);
    return { sent: true };
  }

  // ---- أدوات داخلية ----

  /** حساب مستورَد لم تُسلَّم بياناته بعد، مطابقاً بهاتف المكلف. */
  private async pendingAccountOf(
    phone: string,
  ): Promise<{ linkId: string; authUserId: string } | null> {
    // جهات الاتصال تُخزَّن بالصيغة التي أُدخلت بها (محلية `7XXXXXXXX` من
    // ملفات الاستيراد، أو E.164 من التطبيق)، فالمقارنة تكون على آخر تسع
    // خانات — وهي الجزء المميِّز للرقم اليمني مهما اختلفت البادئة.
    const subscriber = subscriberDigits(phone);
    const result = await sql<{ link_id: string; auth_user_id: string }>`
      select tal.id as link_id, up.auth_user_id
      from registry.taxpayer_contacts tc
      join registry.taxpayer_account_links tal on tal.taxpayer_id = tc.taxpayer_id
      join identity.user_profiles up on up.id = tal.user_profile_id
      where tc.contact_type_code = 'phone'
        and tc.is_active
        and right(regexp_replace(tc.contact_value, '\\D', '', 'g'), 9) = ${subscriber}
        and tal.active_state_code = 'active'
        and tal.verification_status_code = ${PENDING_CLAIM}
        and up.is_active
      limit 1
    `.execute(this.db.db);

    const row = result.rows[0];
    return row ? { linkId: row.link_id, authUserId: row.auth_user_id } : null;
  }

  private supabase(): { url: string; key: string } | null {
    const url = (this.config.get<string>('SUPABASE_URL') ?? '').replace(/\/$/, '');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    return url && key ? { url, key } : null;
  }

  private async findIdentityByPhone(phone: string): Promise<string | null> {
    const supabase = this.supabase();
    if (supabase === null) return null;
    const subscriber = subscriberDigits(phone);

    for (let page = 1; page <= 20; page += 1) {
      const res = await fetch(
        `${supabase.url}/auth/v1/admin/users?page=${page}&per_page=50`,
        {
          headers: {
            apikey: supabase.key,
            Authorization: `Bearer ${supabase.key}`,
          },
        },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as
        | { users?: { id: string; phone?: string }[] }
        | { id: string; phone?: string }[];
      const users = Array.isArray(data) ? data : (data.users ?? []);
      const found = users.find(
        (user) => subscriberDigits(user.phone ?? '') === subscriber,
      );
      if (found) return found.id;
      if (users.length < 50) return null;
    }
    return null;
  }

  private async createIdentity(
    phone: string,
    password: string,
    displayName: string,
  ): Promise<string | null> {
    const supabase = this.supabase();
    if (supabase === null) return null;
    try {
      const res = await fetch(`${supabase.url}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          apikey: supabase.key,
          Authorization: `Bearer ${supabase.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          password,
          phone_confirm: true,
          user_metadata: { display_name: displayName },
        }),
      });
      if (!res.ok) {
        this.logger.error(
          `تعذّر إنشاء هوية للمكلف ${maskPhone(phone)}: HTTP ${res.status}`,
        );
        return null;
      }
      return ((await res.json()) as { id?: string }).id ?? null;
    } catch (error) {
      this.logger.error(
        `تعذّر الاتصال بمزود الهوية لإنشاء حساب ${maskPhone(phone)}`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  private async setIdentityPassword(
    authUserId: string,
    password: string,
  ): Promise<boolean> {
    const supabase = this.supabase();
    if (supabase === null) return false;
    try {
      const res = await fetch(`${supabase.url}/auth/v1/admin/users/${authUserId}`, {
        method: 'PUT',
        headers: {
          apikey: supabase.key,
          Authorization: `Bearer ${supabase.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private async deleteIdentity(authUserId: string): Promise<void> {
    const supabase = this.supabase();
    if (supabase === null) return;
    try {
      await fetch(`${supabase.url}/auth/v1/admin/users/${authUserId}`, {
        method: 'DELETE',
        headers: {
          apikey: supabase.key,
          Authorization: `Bearer ${supabase.key}`,
        },
      });
    } catch {
      // تنظيف best-effort.
    }
  }
}

/**
 * كلمة مرور عشوائية تستوفي شرط الخادم (حرف كبير وصغير ورقم ورمز خاص).
 *
 * تُبنى بـ `randomInt` من `node:crypto` لا `Math.random`: الثانية ليست
 * عشوائية تشفيرياً ويمكن التنبؤ بمخرجاتها.
 */
export function generatePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '@#$%&*!?';
  const all = upper + lower + digits + symbols;

  const pick = (set: string) => set[randomInt(set.length)]!;
  const characters = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (characters.length < 12) characters.push(pick(all));

  // خلط Fisher–Yates حتى لا يكون موضع كل صنف ثابتاً.
  for (let i = characters.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [characters[i], characters[j]] = [characters[j]!, characters[i]!];
  }
  return characters.join('');
}

/** يوحّد رقم الهاتف اليمني إلى صيغة E.164، أو null إن كان غير صالح. */
export function normalizeYemeniPhone(input: string): string | null {
  const cleaned = (input ?? '').replace(/[\s()-]/g, '');
  if (/^\+9677\d{8}$/.test(cleaned)) return cleaned;
  if (/^9677\d{8}$/.test(cleaned)) return `+${cleaned}`;
  if (/^009677\d{8}$/.test(cleaned)) return `+${cleaned.slice(2)}`;
  if (/^7\d{8}$/.test(cleaned)) return `+967${cleaned}`;
  return null;
}

/**
 * آخر تسع خانات من الرقم — الجزء المميِّز للمشترك اليمني.
 *
 * الأرقام تُخزَّن بصيغ مختلفة حسب مصدرها: ملفات الاستيراد تحمل الصيغة
 * المحلية `7XXXXXXXX`، والتطبيق يرسل E.164، وGoTrue يخزّن بلا علامة +.
 * المقارنة على هذا الجزء وحده تُوحّدها كلها.
 */
export function subscriberDigits(phone: string): string {
  return (phone ?? '').replace(/\D/g, '').slice(-9);
}
