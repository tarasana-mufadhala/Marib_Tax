-- MARIB-TAX-CONTENT-LIBRARY-TOPIC
-- إضافة محور «نوع الضريبة» لمستندات المكتبة.
--
-- السبب: المكتبة مُصنَّفة حالياً بنوع المستند (قانون/قرار/دليل/نموذج)، وهو
-- تصنيف إداري. لكن المكلف يبحث بنوع الضريبة: «ضريبة الدخل» أو «ضريبة
-- المبيعات» — وهو المحور الذي بُني عليه موقع المصلحة القديم، وحمل 49 من
-- أصل 61 مستنداً. بلا هذا العمود لا يمكن بناء تلك الشاشات.
--
-- العمود اختياري: المستندات العامة (حقوق المكلف مثلاً) لا تخص نوعاً بعينه.

BEGIN;

ALTER TABLE content.library_documents
  ADD COLUMN IF NOT EXISTS topic_code text;

COMMENT ON COLUMN content.library_documents.topic_code IS
  'نوع الضريبة: income_tax | sales_tax | general. فارغ يعني غير مخصَّص.';

CREATE INDEX IF NOT EXISTS idx_library_documents_topic
  ON content.library_documents (topic_code, status);

COMMIT;
