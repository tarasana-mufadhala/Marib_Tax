import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** مسارات لا تُحرَس: صفحة الدخول، وداخليات Next، ووكيل الـ API. */
const OPEN_PREFIXES = ['/login', '/_next', '/api'];

/** أي مسار له امتداد ملف هو أصل ساكن (شعار، أيقونة، خط...). */
const FILE_PATTERN = /\.[a-zA-Z0-9]+$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // الحراسة داخل الدالة لا في النطاق وحده: تعبير النطاق المعقّد قد لا
  // يُترجَم كما يُتوقَّع، فيمر الوسيط على ملفات JS ويُسقط ترويسة
  // Content-Type منها — وعندها يرفض المتصفح تنفيذ سكربتات الصفحة كلها.
  if (
    OPEN_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    FILE_PATTERN.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('marib_tax_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // نطاق بسيط يُترجَم بلا لبس؛ التفاصيل تُحسم داخل الدالة أعلاه.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
