/**
 * Seed script: admin user + permission catalogue + office_manager role.
 * Usage: node scripts/seed-admin.mjs   (from apps/api, loads ../../.env)
 * Idempotent: safe to re-run.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';

const envPath = path.resolve(process.cwd(), '../../.env');
const env = fs.readFileSync(envPath, 'utf8');
const get = (k) => {
  const l = env.split(/\r?\n/).find((x) => x.startsWith(k + '='));
  return l ? l.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '') : null;
};

const SUPABASE_URL = get('SUPABASE_URL')?.replace(/\/$/, '');
const SERVICE_ROLE_KEY = get('SUPABASE_SERVICE_ROLE_KEY');
const DATABASE_URL = get('DATABASE_URL');

const ADMIN_PHONE = process.env.SEED_ADMIN_PHONE || '+967777123456';
// دخول الموظفين يتم بالبريد: مزود الهاتف معطّل على المشروع (phone_provider_disabled).
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@marib-tax.gov.ye';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Marib@2026';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'مدير النظام';

const PERMISSION_CODES = [
  'taxpayer.profile.read','taxpayer.profile.update','request.read','request.draft.create',
  'request.draft.edit','request.draft.delete','request.submit','request.completion.provide',
  'request.review','request.completion.request','request.decision.recommend','request.decision.final',
  'request.admin.close','request.archive','balagh.read','balagh.create','balagh.draft.edit',
  'balagh.draft.delete','balagh.submit','balagh.completion.provide','balagh.review',
  'balagh.completion.request','balagh.decision.recommend','balagh.decision.final',
  'balagh.admin.close','balagh.archive','field_visit.schedule','field_visit.result.record',
  'due.register','due.correct','payment.confirm','payment.receipt.upload','notification.read',
  'notification.mark_read','content.publish','content.withdraw','import.preview','import.validate',
  'import.approve','import.commit','import.reject','report.view','report.export','audit.sensitive.view',
  'user.read','user.manage','role.read','role.assign','masterdata.manage',
  'attachment.read','attachment.upload',
];

const uuid = () => crypto.randomUUID();

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !DATABASE_URL) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATABASE_URL must be set in .env');
  }

  const headers = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  // 1. Create (or find) the Supabase Auth user
  let authUserId = null;
  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      phone: ADMIN_PHONE,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      phone_confirm: true,
      email_confirm: true,
      user_metadata: { display_name: ADMIN_NAME },
    }),
  });
  if (createRes.ok) {
    const u = await createRes.json();
    authUserId = u.id;
    console.log('auth user created:', authUserId);
  } else if (createRes.status === 422) {
    for (let page = 1; page <= 20 && !authUserId; page += 1) {
      const list = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=50`, { headers });
      const data = await list.json();
      const users = Array.isArray(data) ? data : data.users ?? [];
      // GoTrue يخزّن الهاتف بلا علامة + بينما ADMIN_PHONE بصيغة E.164 — نوحّد قبل المقارنة.
      const bare = ADMIN_PHONE.replace(/^\+/, '');
      const found = users.find(
        (u) => u.phone === bare || u.phone === ADMIN_PHONE || u.email === ADMIN_EMAIL,
      );
      if (found) authUserId = found.id;
      if (users.length < 50) break;
    }
    console.log('auth user already exists:', authUserId);
    // المستخدم القائم قد يكون بلا بريد (أُنشئ قبل اعتماد الدخول بالبريد) —
    // نُحدّثه ليطابق ما يطبعه هذا السكربت، وإلا لن يستطيع أحد الدخول.
    if (authUserId) {
      const patch = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${authUserId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          email_confirm: true,
          password: ADMIN_PASSWORD,
        }),
      });
      console.log(
        patch.ok
          ? 'auth user updated: email set/confirmed and password reset to the seed value'
          : `auth user update failed: ${patch.status} ${(await patch.text()).slice(0, 160)}`,
      );
    }
  } else {
    throw new Error(`GoTrue create user failed: ${createRes.status} ${(await createRes.text()).slice(0, 200)}`);
  }
  if (!authUserId) throw new Error('Could not resolve auth user id');

  // 2. Database rows
  const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // user profile
  const up = await client.query(
    `insert into identity.user_profiles (id, auth_user_id, display_name, is_active)
     values ($1, $2, $3, true)
     on conflict (auth_user_id) do update set display_name = excluded.display_name
     returning id`,
    [uuid(), authUserId, ADMIN_NAME],
  );
  const userProfileId = up.rows[0].id;
  console.log('user profile:', userProfileId);

  // staff profile
  const sp = await client.query(
    `insert into identity.staff_profiles (id, user_profile_id, staff_code, title, is_active, effective_from)
     values ($1, $2, $3, $4, true, now())
     on conflict (user_profile_id) do update set title = excluded.title
     returning id`,
    [uuid(), userProfileId, 'ADMIN-001', 'مدير النظام'],
  );
  const staffProfileId = sp.rows[0].id;
  console.log('staff profile:', staffProfileId);

  // permissions catalogue
  const permissionIds = {};
  for (const code of PERMISSION_CODES) {
    const resource = code.split('.').slice(0, -1).join('.');
    const action = code.split('.').at(-1);
    const r = await client.query(
      `insert into identity.permissions (id, code, resource, action, name_ar, is_active)
       values ($1, $2, $3, $4, $2, true)
       on conflict (code) do nothing
       returning id`,
      [uuid(), code, resource, action],
    );
    if (r.rows.length > 0) {
      permissionIds[code] = r.rows[0].id;
    } else {
      const existing = await client.query('select id from identity.permissions where code = $1', [code]);
      permissionIds[code] = existing.rows[0].id;
    }
  }
  console.log('permissions seeded:', Object.keys(permissionIds).length);

  // office_manager role (system role with all permissions)
  const roleRes = await client.query(
    `insert into identity.roles (id, code, name_ar, description, is_system, is_active)
     values ($1, 'office_manager', 'مدير النظام', 'صلاحيات كاملة على النظام', true, true)
     on conflict (code) do update set name_ar = excluded.name_ar,
                                      description = excluded.description
     returning id`,
    [uuid()],
  );
  let roleId;
  if (roleRes.rows.length > 0) {
    roleId = roleRes.rows[0].id;
  } else {
    const existing = await client.query(`select id from identity.roles where code = 'office_manager'`);
    roleId = existing.rows[0].id;
  }
  console.log('role office_manager:', roleId);

  // grant all permissions to the role
  for (const code of PERMISSION_CODES) {
    await client.query(
      `insert into identity.role_permissions (role_id, permission_id)
       values ($1, $2) on conflict do nothing`,
      [roleId, permissionIds[code]],
    );
  }

  // assign role to staff (skip if an open assignment exists)
  const existingAssignment = await client.query(
    `select id from identity.staff_role_assignments
     where staff_profile_id = $1 and role_id = $2 and effective_to is null and revoked_at is null`,
    [staffProfileId, roleId],
  );
  if (existingAssignment.rows.length === 0) {
    await client.query(
      `insert into identity.staff_role_assignments (id, staff_profile_id, role_id, effective_from)
       values ($1, $2, $3, now())`,
      [uuid(), staffProfileId, roleId],
    );
    console.log('role assigned to staff');
  } else {
    console.log('role assignment already exists');
  }

  await client.end();
  console.log('\nSEED COMPLETE');
  console.log('login email:   ', ADMIN_EMAIL, '(المسار العامل حالياً)');
  console.log('login phone:   ', ADMIN_PHONE, '(يعمل بعد تفعيل مزود الهاتف في Supabase)');
  console.log('login password:', ADMIN_PASSWORD);
}

main().catch((e) => {
  console.error('SEED FAILED:', e.message);
  process.exit(1);
});
