-- MARIB-TAX-DB-OPERATIONAL-TELEMETRY
-- يُصدر كمصدر مُوثّق للجداول الثلاثة التي أُنشئت أثناء عمل التطبيق مباشرةً على القاعدة
-- بلا ملف هجرة: identity.auth_events و content.page_views و content.contact_messages.
-- مكتوب idempotent: لا يفعل شيئاً حيث تكون الجداول موجودة، ويُنشئها كاملة على قاعدة جديدة.
--
-- مصادر التقارير: REP-18 (رموز OTP) و REP-27 (الدخول والأمان) و REP-29 (استخدام الموقع).
-- يُغلق كذلك فجوة أمنية: الجداول الثلاثة كانت الوحيدة في مخططَي identity و content
-- بلا Row Level Security، رغم أن اثنين منها يحملان بيانات شخصية (هواتف، رسائل تواصل).

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. identity.auth_events — سجل أحداث المصادقة (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS identity.auth_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  identifier text NULL,
  channel text NOT NULL DEFAULT 'sms',
  detail text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT auth_events_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_auth_events_type_created
  ON identity.auth_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_identifier_created
  ON identity.auth_events (identifier, created_at DESC);

COMMENT ON TABLE identity.auth_events IS
  'سجل أحداث المصادقة (طلب/تحقق/فشل OTP، دخول ناجح/فاشل، قفل حساب). مصدر REP-18 و REP-27.';
COMMENT ON COLUMN identity.auth_events.event_type IS
  'otp_requested | otp_verified | otp_failed | otp_expired | otp_rate_limited | login_success | login_failed | login_locked | login_blocked';
COMMENT ON COLUMN identity.auth_events.identifier IS
  'رقم الهاتف المستهدف بالحدث. يُعرض مُقنّعاً في التقارير ولا يُسجَّل معه أي رمز أو كلمة مرور.';
COMMENT ON COLUMN identity.auth_events.channel IS 'sms للرموز، password لعمليات الدخول.';

-- ---------------------------------------------------------------------------
-- 2. content.page_views — مشاهدات صفحات الموقع العام
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  page_path text NOT NULL,
  referrer text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT page_views_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_page_views_path_created
  ON content.page_views (page_path, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_created
  ON content.page_views (created_at DESC);

COMMENT ON TABLE content.page_views IS
  'مشاهدات صفحات الموقع العام. مصدر REP-29. لا يُخزَّن IP ولا معرّف زائر — عدّاد صفحات فقط.';

-- ---------------------------------------------------------------------------
-- 3. content.contact_messages — رسائل نموذج «تواصل معنا»
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz NULL,
  read_by_profile_id uuid NULL,
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created
  ON content.contact_messages (status, created_at DESC);

COMMENT ON TABLE content.contact_messages IS
  'رسائل نموذج التواصل في الموقع العام. تحتوي بيانات شخصية — قراءتها مقصورة على الموظفين.';

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
--    الكتابة في الثلاثة تتم من الـ API بدور مالك الجداول (خارج نطاق RLS)،
--    وهذه السياسات تمنع الوصول المباشر عبر PostgREST بمفاتيح anon/authenticated.
-- ---------------------------------------------------------------------------
ALTER TABLE identity.auth_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auth_events_policy ON identity.auth_events;
CREATE POLICY auth_events_policy ON identity.auth_events
  FOR ALL TO authenticated
  USING (identity.has_role('auditor') OR identity.is_manager());

ALTER TABLE content.page_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS page_views_read_policy ON content.page_views;
CREATE POLICY page_views_read_policy ON content.page_views
  FOR SELECT TO authenticated
  USING (identity.is_staff() OR identity.is_manager());

ALTER TABLE content.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS contact_messages_policy ON content.contact_messages;
CREATE POLICY contact_messages_policy ON content.contact_messages
  FOR ALL TO authenticated
  USING (identity.is_staff() OR identity.is_manager());

COMMIT;
