'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, LoadingState, InboxIcon, Modal } from '@marib-tax/web-ui';
import { api } from '@/lib/api-client';

interface ServiceRow {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface LegalEntityRow {
  id: string;
  name: string;
  classification: string;
  isActive: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [entities, setEntities] = useState<LegalEntityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [entityName, setEntityName] = useState('');
  const [savingEntity, setSavingEntity] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [svc, ent] = await Promise.all([api.admin.getServices(), api.admin.getLegalEntities()]);
      setServices(svc || []);
      setEntities(ent || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleToggle = async (svc: ServiceRow) => {
    try {
      setTogglingId(svc.id);
      const result = await api.admin.toggleService(svc.id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setServices(services.map((s) => (s.id === svc.id ? { ...s, isActive: !s.isActive } : s)));
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityName.trim()) return;
    try {
      setSavingEntity(true);
      setError(null);
      const result = await api.admin.createLegalEntity({ legal_name: entityName.trim() });
      if (result?.error) {
        setError(result.error);
        return;
      }
      setEntityModalOpen(false);
      setEntityName('');
      await fetchAll();
    } finally {
      setSavingEntity(false);
    }
  };

  if (loading) return <LoadingState message="جاري الاتصال بالسيرفر..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-r-4 border-[var(--usr-gold)] pr-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-[var(--usr-primary-dark)]">إدارة الخدمات والكيانات القانونية</h2>
          <p className="text-xs text-[var(--usr-muted)]">تفعيل وتعطيل الخدمات والبلاغات وإدارة الكيانات القانونية المعتمدة</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <Card className="usr-institutional-card p-6">
        <CardHeader>
          <CardTitle className="text-lg">الخدمات والبلاغات ({services.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {services.length > 0 ? (
            services.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 rounded-lg border border-[var(--usr-border)] p-3">
                <div>
                  <p className="font-bold text-sm text-[var(--usr-primary-dark)]">{s.name}</p>
                  <p className="text-xs text-[var(--usr-muted)]">{s.code}{s.description ? ` — ${s.description}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.isActive ? 'success' : 'outline'}>{s.isActive ? 'مفعّلة' : 'معطّلة'}</Badge>
                  <Button variant="outline" size="sm" disabled={togglingId === s.id} onClick={() => handleToggle(s)}>
                    {togglingId === s.id ? 'جاري التحديث...' : s.isActive ? 'تعطيل مؤقت' : 'تفعيل'}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <InboxIcon className="h-8 w-8 mx-auto text-[var(--usr-muted)]" />
              <p className="mt-2 text-xs text-[var(--usr-muted)]">لا توجد خدمات معرفة بعد — تُضاف الخدمات الخمس والبلاغات الستة من هنا.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="usr-institutional-card p-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">الكيانات القانونية ({entities.length})</CardTitle>
            <Button variant="gold" size="sm" onClick={() => setEntityModalOpen(true)}>+ إضافة كيان قانوني</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {entities.length > 0 ? (
            entities.map((e2) => (
              <div key={e2.id} className="flex items-center justify-between gap-4 rounded-lg border border-[var(--usr-border)] p-3">
                <p className="font-bold text-sm text-[var(--usr-primary-dark)]">{e2.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--usr-muted)]">{e2.classification}</span>
                  <Badge variant={e2.isActive ? 'success' : 'outline'}>{e2.isActive ? 'مفعّل' : 'معطّل'}</Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-xs text-[var(--usr-muted)]">
              لا توجد كيانات قانونية بعد — أضف: فردي، شركة، بنك، مؤسسة، جمعية أو منظمة، وأي كيان آخر يعتمده مدير النظام.
            </p>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={entityModalOpen}
        onClose={() => setEntityModalOpen(false)}
        title="إضافة كيان قانوني جديد"
        description="يظهر الكيان في القائمة المنسدلة لتسجيل المكلفين"
      >
        <form onSubmit={handleCreateEntity} className="space-y-4 text-xs">
          <Input
            label="اسم الكيان القانوني"
            required
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            placeholder="مثال: شركة ذات مسؤولية محدودة"
          />
          <Button variant="gold" size="lg" type="submit" className="w-full font-bold" disabled={savingEntity}>
            {savingEntity ? 'جاري الحفظ...' : 'حفظ الكيان القانوني'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
