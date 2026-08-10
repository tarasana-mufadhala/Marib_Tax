# USR Design System — نظام الألوان والخطوط والثيمات والبطاقات

حزمة جاهزة لإعادة الاستخدام في تطبيق آخر (React + Tailwind v4 + shadcn).

## الملفات
- `styles.css` — كامل التوكنز (light/dark) + كلاسات المكوّنات `usr-*`
- `card.tsx` — مكوّن البطاقة المستخدم في المنصة

## 1) الخطوط
تحميلها عبر `<link>` في رأس الصفحة (لا تستخدم `@import` لرابط خارجي في Tailwind v4):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Tajawal:wght@500;700;800&display=swap">
```

- نص عام: `Cairo` (--font-sans)
- عناوين: `Tajawal` (--font-display)، مع `letter-spacing: -0.01em`
- اتجاه الصفحة: `html { direction: rtl; }`

## 2) لوحة الألوان (Light)
| التوكن | القيمة | الاستخدام |
|---|---|---|
| `--usr-primary` | `#105B7D` | اللون الأساسي (تركوازي مؤسسي) |
| `--usr-primary-dark` | `#0B4964` | تدرّج/عناوين |
| `--usr-primary-deeper` | `#08384E` | الشريط العلوي والقائمة الجانبية |
| `--usr-primary-soft` | `#E8F2F5` | خلفيات ثانوية |
| `--usr-gold` | `#D99A17` | لون التمييز (accent) |
| `--usr-gold-dark` | `#B87900` | hover للذهبي |
| `--usr-gold-soft` | `#FFF4DA` | خلفية أيقونات |
| `--usr-bg` | `#F7F8FA` | خلفية التطبيق |
| `--usr-card` | `#FFFFFF` | البطاقات |
| `--usr-border` | `#DDE6EA` | الحدود |
| `--usr-text` | `#102333` | النص |
| `--usr-muted` | `#667985` | نص ثانوي |
| حالات | `success #2F855A` · `destructive #C53030` · `warning = gold` |

الوضع الداكن مبني على `oklch` داخل `.dark` (موجود كاملاً في `styles.css`).

## 3) التدرجات والظلال
```css
--gradient-hero: linear-gradient(135deg,#08384E 0%,#0B4964 40%,#105B7D 100%);
--gradient-gold: linear-gradient(90deg,#B87900 0%,#D99A17 50%,#B87900 100%);
--shadow-card: 0 1px 3px rgb(16 35 51/.06), 0 8px 24px rgb(16 35 51/.08);
--shadow-elevated: 0 4px 16px rgb(16 35 51/.1), 0 24px 48px rgb(16 35 51/.12);
--radius: 0.625rem;  /* sm/md/lg/xl/2xl مشتقة منه */
```

## 4) بطاقات العرض
- **البطاقة الأساسية** (`card.tsx`): `rounded-xl border bg-card text-card-foreground shadow-[var(--shadow-card)]`
- `.usr-institutional-card` — بطاقة مؤسسية بحدود متغيّرة عند hover
- `.usr-feature-card-lite` — بطاقة ميزة بشريط ذهبي علوي 3px
- `.usr-auth-card` + `.usr-auth-header` — بطاقة تسجيل الدخول برأس متدرّج
- `.usr-dashboard-header` — رأس لوحة تحكم بتدرّج ناعم
- `.usr-page-header` + `.usr-page-header-icon` — رأس صفحة موحّد
- `.usr-hero-deep` / `.usr-hero-cta` / `.usr-gold-rule` — عناصر الواجهة العامة

## 5) طريقة الاستخدام
1. انسخ `styles.css` إلى `src/styles.css` في المشروع الجديد (Tailwind v4 + `tw-animate-css`).
2. أضف روابط الخطوط في الـ head.
3. انسخ `card.tsx` إلى `src/components/ui/card.tsx`.
4. استخدم التوكنز الدلالية فقط: `bg-background text-foreground bg-primary text-primary-foreground border-border bg-accent ...` ولا تستخدم ألواناً صريحة مثل `text-white`.
