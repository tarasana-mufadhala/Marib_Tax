-- سجل تغيّر حالة المكلف.
--
-- اعتماد مكلف أو إيقافه قرارٌ إداري له أثر مالي، فلا يجوز أن يُكتب فوق
-- الحالة السابقة بلا أثر: السؤال «من اعتمد هذا المكلف ومتى ولماذا؟» يجب
-- أن يبقى مُجاباً بعد سنوات.
--
-- الجدول للإلحاق فقط: لا تعديل ولا حذف لسطوره، وهو ما تفرضه سياسات RLS
-- أدناه على أدوار التطبيق.

CREATE TABLE registry.taxpayer_status_histories (
  id uuid NOT NULL,
  taxpayer_id uuid NOT NULL,
  from_status_code text NULL,
  to_status_code text NOT NULL,
  reason text NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by_profile_id uuid NOT NULL,
  correlation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT taxpayer_status_histories_pkey
    PRIMARY KEY (id),
  CONSTRAINT taxpayer_status_histories_to_status_not_blank_check
    CHECK (btrim(to_status_code) <> ''),
  -- تسجيل انتقال من حالة إلى نفسها ضجيج لا معلومة.
  CONSTRAINT taxpayer_status_histories_transition_check
    CHECK (from_status_code IS NULL OR from_status_code <> to_status_code),
  CONSTRAINT taxpayer_status_histories_taxpayer_id_fkey
    FOREIGN KEY (taxpayer_id)
    REFERENCES registry.taxpayers (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE,
  CONSTRAINT taxpayer_status_histories_changed_by_fkey
    FOREIGN KEY (changed_by_profile_id)
    REFERENCES identity.user_profiles (id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
    NOT DEFERRABLE
);

CREATE INDEX taxpayer_status_histories_taxpayer_id_idx
  ON registry.taxpayer_status_histories (taxpayer_id, changed_at DESC);

CREATE INDEX taxpayer_status_histories_changed_by_idx
  ON registry.taxpayer_status_histories (changed_by_profile_id);

COMMENT ON TABLE registry.taxpayer_status_histories IS
  'Append-only audit trail of taxpayer status decisions. Rows are never updated or deleted.';
COMMENT ON COLUMN registry.taxpayer_status_histories.reason IS
  'Officer-supplied justification. Required by the API for suspensions and rejections.';
COMMENT ON COLUMN registry.taxpayer_status_histories.changed_by_profile_id IS
  'The staff profile that made the decision. Never nullable: a decision without an author is not auditable.';

ALTER TABLE registry.taxpayer_status_histories ENABLE ROW LEVEL SECURITY;

-- الكتابة تتم من الـ API بدور مالك الجداول (خارج نطاق RLS)؛ هذه السياسة
-- تمنع الوصول المباشر عبر PostgREST بمفاتيح anon/authenticated لغير الموظفين.
-- القراءة فقط: لا سياسة INSERT ولا UPDATE ولا DELETE عمداً، وغياب السياسة
-- يمنع العملية على كل الأدوار الخاضعة لـ RLS — وهو المطلوب لسجل للإلحاق فقط.
DROP POLICY IF EXISTS taxpayer_status_histories_read_policy
  ON registry.taxpayer_status_histories;
CREATE POLICY taxpayer_status_histories_read_policy
  ON registry.taxpayer_status_histories
  FOR SELECT TO authenticated
  USING (identity.is_staff() OR identity.is_manager());
