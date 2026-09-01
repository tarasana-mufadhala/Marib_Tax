import { describe, expect, it } from 'vitest';
import {
  availableServices,
  createServiceRequestSchema,
  isDocumentMandatory,
  missingRequiredDocuments,
  serviceCatalog,
  type ServiceCode,
} from '../src/service-requests.js';

const ALL_CODES: ServiceCode[] = ['FR-101', 'FR-102', 'FR-103', 'FR-104', 'FR-105'];

/** كل مستندات الخدمة، لاختبار الحالة المستوفاة. */
const allDocumentsOf = (code: ServiceCode): string[] =>
  serviceCatalog[code].documents.map((d) => d.code);

describe('كتالوج الخدمات — مطابقة القسم 4.3', () => {
  it('الخدمات الخمس معرَّفة بعناوينها', () => {
    expect(Object.keys(serviceCatalog).sort()).toEqual(ALL_CODES);
    expect(serviceCatalog['FR-101'].title).toBe('فتح ملف ضريبي');
    expect(serviceCatalog['FR-105'].title).toBe('شهادة الضريبة العامة على المبيعات');
  });

  it('لكل خدمة مستندات وملاحظة قبول', () => {
    for (const code of ALL_CODES) {
      expect(serviceCatalog[code].documents.length).toBeGreaterThan(0);
      expect(serviceCatalog[code].acceptanceNote).not.toBe('');
    }
  });

  it('FR-102 مقصورة على من لا يملك رقماً ضريبياً', () => {
    expect(serviceCatalog['FR-102'].availability).toBe('without_tax_number_only');
    const withNumber = availableServices(true).map((s) => s.code);
    const withoutNumber = availableServices(false).map((s) => s.code);

    expect(withNumber).not.toContain('FR-102');
    expect(withoutNumber).toContain('FR-102');
    expect(withNumber).toHaveLength(4);
    expect(withoutNumber).toHaveLength(5);
  });
});

describe('isDocumentMandatory — الشروط المشروطة', () => {
  const context = { isCompany: false, identityDocumentType: null };

  it('المستند الإلزامي دائماً إلزامي', () => {
    const doc = serviceCatalog['FR-104'].documents.find(
      (d) => d.code === 'previous_commercial_register',
    )!;
    expect(isDocumentMandatory(doc, context)).toBe(true);
  });

  it('المستند الاختياري لا يُلزم في أي سياق', () => {
    const lease = serviceCatalog['FR-101'].documents.find(
      (d) => d.code === 'lease_contract',
    )!;
    expect(isDocumentMandatory(lease, context)).toBe(false);
    expect(isDocumentMandatory(lease, { isCompany: true, identityDocumentType: 'passport' })).toBe(false);
  });

  it('مستندات الشركات تُلزم للشركات وحدها', () => {
    const articles = serviceCatalog['FR-102'].documents.find(
      (d) => d.code === 'articles_of_association',
    )!;
    expect(isDocumentMandatory(articles, { isCompany: false })).toBe(false);
    expect(isDocumentMandatory(articles, { isCompany: true })).toBe(true);
  });

  it('الهوية والجواز بديلان: يُلزم المختار وحده', () => {
    const idFront = serviceCatalog['FR-101'].documents.find(
      (d) => d.code === 'national_id_front',
    )!;
    const passport = serviceCatalog['FR-101'].documents.find(
      (d) => d.code === 'passport',
    )!;

    const withId = { isCompany: false, identityDocumentType: 'national_id' as const };
    expect(isDocumentMandatory(idFront, withId)).toBe(true);
    expect(isDocumentMandatory(passport, withId)).toBe(false);

    const withPassport = { isCompany: false, identityDocumentType: 'passport' as const };
    expect(isDocumentMandatory(idFront, withPassport)).toBe(false);
    expect(isDocumentMandatory(passport, withPassport)).toBe(true);
  });
});

describe('missingRequiredDocuments — قاعدة القبول', () => {
  it('FR-101 لا يُقبل دون هوية وسجل تجاري', () => {
    const missing = missingRequiredDocuments(
      'FR-101',
      { isCompany: false, identityDocumentType: 'national_id' },
      [],
    );
    const codes = missing.map((d) => d.code);

    expect(codes).toContain('national_id_front');
    expect(codes).toContain('national_id_back');
    expect(codes).toContain('commercial_register');
    // عقد الإيجار اختياري فلا يُعد ناقصاً
    expect(codes).not.toContain('lease_contract');
    // الجواز غير مطلوب لأن المختار هو البطاقة
    expect(codes).not.toContain('passport');
  });

  it('FR-101 يُقبل بالجواز بدل البطاقة', () => {
    const missing = missingRequiredDocuments(
      'FR-101',
      { isCompany: false, identityDocumentType: 'passport' },
      ['passport', 'commercial_register'],
    );
    expect(missing).toEqual([]);
  });

  it('FR-102 لفرد يُقبل دون مستندات الشركات', () => {
    const missing = missingRequiredDocuments('FR-102', { isCompany: false }, [
      'trade_name_registration',
      'practice_license',
      'insurance_card',
    ]);
    expect(missing).toEqual([]);
  });

  it('FR-102 لشركة لا يُقبل دون النظام الأساسي وعقد التأسيس وهويات الشركاء', () => {
    const missing = missingRequiredDocuments('FR-102', { isCompany: true }, [
      'trade_name_registration',
      'practice_license',
      'insurance_card',
    ]);
    const codes = missing.map((d) => d.code);

    expect(codes).toEqual([
      'articles_of_association',
      'incorporation_contract',
      'partner_identities',
    ]);
  });

  it('FR-104 يشترط السجلين السابق والجديد معاً', () => {
    const missing = missingRequiredDocuments('FR-104', { isCompany: false }, [
      'previous_commercial_register',
    ]);
    const codes = missing.map((d) => d.code);

    expect(codes).toContain('new_commercial_register');
    expect(codes).not.toContain('previous_commercial_register');
    // آخر موقف ضريبي «إن وُجد» ⇒ لا يُعد ناقصاً
    expect(codes).not.toContain('last_tax_position');
  });

  it('استيفاء كل المستندات يعطي قائمة فارغة لكل خدمة', () => {
    for (const code of ALL_CODES) {
      const missing = missingRequiredDocuments(
        code,
        { isCompany: true, identityDocumentType: 'national_id' },
        allDocumentsOf(code),
      );
      expect(missing, `${code} يجب أن يكون مستوفياً`).toEqual([]);
    }
  });

  it('المستندات الزائدة لا تُبطل الطلب', () => {
    const missing = missingRequiredDocuments('FR-102', { isCompany: false }, [
      'trade_name_registration',
      'practice_license',
      'insurance_card',
      'some_unrelated_file',
    ]);
    expect(missing).toEqual([]);
  });
});

describe('createServiceRequestSchema — مطابقة النموذج لرمز الخدمة', () => {
  const fr101 = {
    serviceCode: 'FR-101',
    schemaVersion: '1.0.0',
    form: {
      identityDocumentType: 'national_id',
      activityName: 'بقالة النور',
      commercialRegisterNumber: 'CR-1234',
      district: 'الوادي',
      street: 'الشارع العام',
      premisesOwnership: 'rented',
      startedAt: '2026-01-01T00:00:00.000Z',
    },
  };

  it('نموذج مطابق يُقبل', () => {
    expect(createServiceRequestSchema.safeParse(fr101).success).toBe(true);
  });

  it('نموذج خدمة أخرى تحت رمز مختلف يُرفض', () => {
    const mismatched = { ...fr101, serviceCode: 'FR-104' };
    expect(createServiceRequestSchema.safeParse(mismatched).success).toBe(false);
  });

  it('حقل إلزامي ناقص يُرفض', () => {
    const { activityName: _removed, ...rest } = fr101.form;
    const result = createServiceRequestSchema.safeParse({ ...fr101, form: rest });
    expect(result.success).toBe(false);
  });

  it('حقل زائد يُرفض (strict)', () => {
    const result = createServiceRequestSchema.safeParse({
      ...fr101,
      form: { ...fr101.form, unexpected: 'x' },
    });
    expect(result.success).toBe(false);
  });

  it('رمز خدمة غير معروف يُرفض', () => {
    const result = createServiceRequestSchema.safeParse({ ...fr101, serviceCode: 'FR-999' });
    expect(result.success).toBe(false);
  });

  it('نوع هوية غير معروف يُرفض', () => {
    const result = createServiceRequestSchema.safeParse({
      ...fr101,
      form: { ...fr101.form, identityDocumentType: 'driver_license' },
    });
    expect(result.success).toBe(false);
  });
});
