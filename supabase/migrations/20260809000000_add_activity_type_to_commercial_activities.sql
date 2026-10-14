-- MARIB-TAX-DB-ACTIVITY-TYPE
-- «نوع النشاط» حقل إلزامي في تسجيل المكلف (FR-001 خطوتا 6 و7) ولا يوجد له
-- عمود في masterdata.commercial_activities: العمود الوحيد المتاح كان
-- `public_ref` وهو مرجع **فريد**، فحشر نوع النشاط فيه يجعل أي مكلفين
-- يشتركان في النوع نفسه يتصادمان على قيد التفرّد.
--
-- إضافة غير هادمة: عمود نصي اختياري + فهرس للتصفية حسب النوع.

BEGIN;

ALTER TABLE masterdata.commercial_activities
  ADD COLUMN IF NOT EXISTS activity_type text NULL;

COMMENT ON COLUMN masterdata.commercial_activities.activity_type IS
  'نوع النشاط كما أدخله المكلف عند التسجيل (تجارة تجزئة، خدمات، صناعة...). وصفي وليس مرجعاً فريداً.';

CREATE INDEX IF NOT EXISTS idx_commercial_activities_type
  ON masterdata.commercial_activities (activity_type)
  WHERE activity_type IS NOT NULL;

COMMIT;
