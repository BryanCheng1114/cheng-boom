import * as jose from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { verifyCustomerSessionToken } from './lib/customerSession';
import { getJwtSecretBytes } from './lib/jwtSecret';

const PUBLIC_PATHS = new Set(['/', '/login', '/forgot-password', '/reset-password']);

async function isValidAdminToken(token?: string) {
  const secret = getJwtSecretBytes();
  if (!token || !secret) return false;
  try {
    await jose.jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const originalPath = request.nextUrl.pathname;
  const localeMatch = originalPath.match(/^\/(en|zh)(?=\/|$)/);
  const localePrefix = localeMatch ? `/${localeMatch[1]}` : '';
  const path = localeMatch ? originalPath.slice(localePrefix.length) || '/' : originalPath;

  if (path === '/admin') return NextResponse.next();

  if (path.startsWith('/admin/')) {
    if (await isValidAdminToken(request.cookies.get('admin_token')?.value)) return NextResponse.next();
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `${localePrefix}/admin` || '/admin';
    loginUrl.search = '';
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set('admin_token', '', { path: '/', maxAge: 0, httpOnly: true, sameSite: 'lax' });
    return response;
  }

  if (PUBLIC_PATHS.has(path)) return NextResponse.next();

  const session = await verifyCustomerSessionToken(request.cookies.get('customer_token')?.value);
  if (session) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = `${localePrefix}/login` || '/login';
  loginUrl.search = '';
  loginUrl.searchParams.set('next', `${originalPath}${request.nextUrl.search}`);
  const response = NextResponse.redirect(loginUrl);
  if (request.cookies.has('customer_token')) {
    response.cookies.set('customer_token', '', { path: '/', maxAge: 0, httpOnly: true, sameSite: 'lax' });
  }
  return response;
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?)$).*)'],
};
