import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "./lib/auth";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 允许访问的公开路径
  const publicPaths = ["/login", "/setup", "/api/bot", "/api/auth/login"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // 静态资源和 API 路由（除了 bot webhook）
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 检查是否已初始化
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions
  );

  // 如果访问 setup 页面，允许通过
  if (pathname === "/setup") {
    return response;
  }

  // 如果访问登录页面且已登录，重定向到首页
  if (pathname === "/login" && session.isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 如果未登录且访问受保护页面，重定向到登录页
  if (!session.isLoggedIn && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
