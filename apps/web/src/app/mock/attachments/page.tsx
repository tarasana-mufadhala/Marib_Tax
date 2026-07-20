import {
  attachmentClassificationLabels,
  attachmentDocumentCategoryLabels,
  attachmentFilterOptions,
  filterMockAttachments,
} from '../../../lib/attachments-mock';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const value = (input: string | string[] | undefined) =>
  typeof input === 'string' ? input : undefined;

export default async function AttachmentsMockPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const filters = {
    ownerType: value(query.ownerType),
    documentCategoryCode: value(query.documentCategoryCode),
    classification: value(query.classification),
    from: value(query.from),
    to: value(query.to),
  };
  const attachments = filterMockAttachments(filters);

  return (
    <main className="shell attachments-shell">
      <header className="hero attachments-hero">
        <p className="eyebrow">مساحة عمل تجريبية · بيانات محلية فقط</p>
        <h1>إدارة المرفقات</h1>
        <p className="lead">
          مراجعة بيانات المرفقات وسياقها وإصداراتها دون اتصال بواجهات API أو
          خدمة تخزين.
        </p>
      </header>

      <section className="attachment-stats" aria-label="ملخص المرفقات">
        <div>
          <strong>{attachments.length}</strong>
          <span>نتائج ظاهرة</span>
        </div>
        <div>
          <strong>
            {attachments.filter((item) => item.archiveState === 'مؤرشف').length}
          </strong>
          <span>مؤرشفة</span>
        </div>
        <div>
          <strong>
            {attachments.filter((item) => item.availability !== 'متاح').length}
          </strong>
          <span>تحتاج متابعة</span>
        </div>
      </section>

      <form className="attachment-filters" aria-label="مرشحات المرفقات">
        <FilterSelect
          name="ownerType"
          label="نوع المالك"
          options={attachmentFilterOptions.ownerTypes}
          current={filters.ownerType}
        />
        <FilterSelect
          name="documentCategoryCode"
          label="فئة الوثيقة"
          options={attachmentFilterOptions.documentCategories}
          current={filters.documentCategoryCode}
          labels={attachmentDocumentCategoryLabels}
        />
        <FilterSelect
          name="classification"
          label="التصنيف"
          options={attachmentFilterOptions.classifications}
          current={filters.classification}
          labels={attachmentClassificationLabels}
        />
        <label>
          من تاريخ
          <input type="date" name="from" defaultValue={filters.from} />
        </label>
        <label>
          إلى تاريخ
          <input type="date" name="to" defaultValue={filters.to} />
        </label>
        <button type="submit" className="primary-action">
          تطبيق المرشحات
        </button>
        <a href="/mock/attachments" className="secondary-action">
          إعادة الضبط
        </a>
      </form>

      <div className="attachment-table-wrap">
        <table className="attachment-table">
          <thead>
            <tr>
              <th>المرفق</th>
              <th>المالك والسياق</th>
              <th>الفئة</th>
              <th>التصنيف</th>
              <th>آخر تحديث</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {attachments.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.filename}</strong>
                  <small>
                    {item.id} · {item.mimeType} · {item.sizeLabel}
                  </small>
                </td>
                <td>
                  <span className="owner-type">{item.ownerType}</span>
                  <small>{item.ownerLabel}</small>
                </td>
                <td>
                  {attachmentDocumentCategoryLabels[item.documentCategoryCode]}
                </td>
                <td>
                  <span
                    className={`classification classification-${item.classification.replace(' ', '-')}`}
                  >
                    {attachmentClassificationLabels[item.classification]}
                  </span>
                </td>
                <td>{item.updatedAt}</td>
                <td>
                  <span className="archive-state">{item.archiveState}</span>
                  {item.availability !== 'متاح' && (
                    <small className="availability-warning">
                      {item.availability}
                    </small>
                  )}
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      disabled={item.availability !== 'متاح'}
                    >
                      طلب مراجعة/تنزيل
                    </button>
                    <button type="button">نسخة مصححة</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {attachments.length === 0 && (
          <div className="empty-state">
            <h2>لا توجد مرفقات مطابقة</h2>
            <p>غيّر المرشحات أو نطاق التاريخ لعرض نتائج أخرى.</p>
          </div>
        )}
      </div>

      <section className="versions-panel" aria-labelledby="versions-title">
        <div>
          <p className="eyebrow">سجل غير قابل للاستبدال</p>
          <h2 id="versions-title">محفوظات الإصدارات</h2>
        </div>
        {attachments[0] ? (
          <>
            <h3>{attachments[0].filename}</h3>
            <ol>
              {attachments[0].versions.map((version) => (
                <li key={version.version}>
                  <span className="version-number">
                    الإصدار {version.version}
                  </span>
                  <strong>{version.filename}</strong>
                  <small>
                    {version.createdAt} · {version.createdBy}
                  </small>
                  <p>{version.note}</p>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p>اختر نتيجة لعرض إصداراتها.</p>
        )}
      </section>
      <aside className="mock-boundary">
        <strong>حدود العرض:</strong> الأزرار تمثيلية فقط، ولا تنشئ روابط عامة أو
        تطلب ملفات حقيقية. ظهور بيانات المرفق لا يمنح صلاحية تنزيله.
      </aside>
    </main>
  );
}

function FilterSelect({
  name,
  label,
  options,
  current,
  labels,
}: {
  name: string;
  label: string;
  options: readonly string[];
  current?: string;
  labels?: Readonly<Record<string, string>>;
}) {
  return (
    <label>
      {label}
      <select name={name} defaultValue={current ?? (labels ? 'all' : 'الكل')}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option === 'all' ? 'الكل' : (labels?.[option] ?? option)}
          </option>
        ))}
      </select>
    </label>
  );
}
