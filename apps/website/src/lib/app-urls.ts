/**
 * عناوين التطبيقات الشقيقة.
 *
 * كانت مثبَّتة في المصدر كـ`http://localhost:3001` — عنوان جهاز المطوّر —
 * فكل زر «دخول الموظفين» على الموقع المنشور يقود المستخدم إلى جهازه هو،
 * ولا يعمل إطلاقاً. تُقرأ الآن من البيئة، ويبقى localhost تعويضاً للتطوير
 * المحلي وحده.
 *
 * `NEXT_PUBLIC_` لازمة: الروابط تُعرَض في المتصفح.
 */
export const ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';

/** رابط شاشة دخول لوحة التحكم. */
export const ADMIN_LOGIN_URL = `${ADMIN_URL.replace(/\/$/, '')}/login`;
