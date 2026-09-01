import { expect, test } from '@playwright/test';

test.describe('Arabic public foundation', () => {
  test('renders the public portal in Arabic RTL without horizontal overflow', async ({
    page,
  }) => {
    const response = await page.goto('/');

    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'مكتب الضرائب بمحافظة مأرب',
      }),
    ).toBeVisible();
    await expect(
      page.getByText('الخدمات التشغيلية وتسجيل الدخول غير مفعّلة'),
    ).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});

test.describe('fail-closed admin access', () => {
  test('redirects an anonymous visitor away from the admin route', async ({
    page,
  }) => {
    await page.goto('/admin');

    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: 'لوحة تحكم المسؤول' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'مكتب الضرائب بمحافظة مأرب',
      }),
    ).toBeVisible();
  });

  test('ignores forged role headers, bearer tokens, and cookies', async ({
    context,
    page,
  }) => {
    await context.setExtraHTTPHeaders({
      authorization: 'Bearer forged-test-token',
      'x-user-role': 'admin',
    });
    await context.addCookies([
      {
        name: 'role',
        value: 'admin',
        url: 'http://127.0.0.1:3100',
      },
    ]);

    await page.goto('/admin');

    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: 'لوحة تحكم المسؤول' }),
    ).toHaveCount(0);
  });
});

test.describe('local mock workspaces', () => {
  test('renders masked registry and owned masterdata views', async ({
    page,
  }) => {
    await page.goto('/mock/registry');
    await expect(
      page.getByRole('heading', { level: 1, name: 'ملف المكلف' }),
    ).toBeVisible();
    await expect(page.getByText('الرقم الضريبي (مقنّع):')).toBeVisible();

    await page.goto('/mock/masterdata');
    await expect(
      page.getByRole('heading', { level: 1, name: 'الأنشطة والعقارات' }),
    ).toBeVisible();
    await expect(page.getByText('الملكية الحالية:')).toBeVisible();
  });

  test('filters attachment rows and keeps unauthorized download disabled', async ({
    page,
  }) => {
    await page.goto('/mock/attachments');
    await page.getByLabel('التصنيف').selectOption({ label: 'شديد الحساسية' });
    await page.getByRole('button', { name: 'تطبيق المرشحات' }).click();

    await expect(page).toHaveURL(/classification=highly_sensitive/);
    await expect(page.getByText('نتائج ظاهرة').locator('..')).toContainText(
      '1',
    );
    await expect(page.getByText('كشف-الحساب.xlsx').first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'طلب مراجعة/تنزيل' }),
    ).toBeDisabled();
    await expect(page.getByText('السجل-التجاري.pdf').first()).toHaveCount(0);
  });
});
