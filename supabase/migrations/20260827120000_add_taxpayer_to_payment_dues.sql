-- ربط المستحق بالمكلف مباشرةً.
--
-- كان المستحق يُعرَف بأبيه فقط: طلب خدمة أو بلاغ. فمن يريد معرفة ما على
-- مكلف كان عليه المرور بجدولين، والأهم أن المكتب لم يكن يستطيع تسجيل
-- مستحق أصلاً إلا كنتيجة لمعاملة — بينما جلّ المستحقات الضريبية ربطٌ
-- سنوي أو متأخرات تُقيَّد على المكلف ابتداءً بلا طلب منه.
--
-- العمود يُملأ من الأب للسطور القائمة ثم يصير إلزامياً: مستحق بلا مكلف
-- دَينٌ على لا أحد.

-- 1. العمود، مؤقتاً قابلاً للفراغ حتى تكتمل التعبئة.
ALTER TABLE dues.payment_dues
  ADD COLUMN IF NOT EXISTS taxpayer_id uuid NULL;

-- 2. تعبئة السطور القائمة من طلبها أو بلاغها.
UPDATE dues.payment_dues d
SET taxpayer_id = sr.taxpayer_id
FROM requests.service_requests sr
WHERE d.service_request_id = sr.id
  AND d.taxpayer_id IS NULL;

UPDATE dues.payment_dues d
SET taxpayer_id = b.taxpayer_id
FROM balaghat.balaghs b
WHERE d.balagh_id = b.id
  AND d.taxpayer_id IS NULL;

-- 3. المفتاح الأجنبي والإلزام.
--    لو بقي سطر بلا مكلف تفشل الخطوة وتُلغى المهاجرة كاملةً بدل أن تمرّ
--    ببيانات ناقصة.
ALTER TABLE dues.payment_dues
  ALTER COLUMN taxpayer_id SET NOT NULL;

ALTER TABLE dues.payment_dues
  ADD CONSTRAINT payment_dues_taxpayer_id_fkey
  FOREIGN KEY (taxpayer_id)
  REFERENCES registry.taxpayers (id)
  ON UPDATE NO ACTION
  ON DELETE RESTRICT
  NOT DEFERRABLE;

-- 4. الفهرس: «ما على هذا المكلف؟» أكثر استعلام يُطرح على هذا الجدول.
CREATE INDEX IF NOT EXISTS payment_dues_taxpayer_id_idx
  ON dues.payment_dues (taxpayer_id, status_code);

COMMENT ON COLUMN dues.payment_dues.taxpayer_id IS
  'The taxpayer who owes this amount. Always set: a due without a taxpayer is a debt owed by nobody. Independent of service_request_id/balagh_id, which record the transaction that caused it, if any.';
