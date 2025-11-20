import type { NextAuthConfig } from "next-auth";

/**
 * NextAuth 配置
 * 需求: 6.1, 6.2, 6.3 - 认证和安全措施
 * 
 * CSRF 保护: NextAuth.js v5 默认启用 CSRF 保护
 * - 使用双重提交 Cookie 模式
 * - 自动验证 CSRF token
 * - 保护所有状态改变操作
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnApi = nextUrl.pathname.startsWith("/api/bot") || 
                      nextUrl.pathname.startsWith("/api/messages") || 
                      nextUrl.pathname.startsWith("/api/groups");
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isOnSetup = nextUrl.pathname.startsWith("/setup");
      const isOnInit = nextUrl.pathname.startsWith("/api/init");
      const isOnHome = nextUrl.pathname === "/";
      
      // Allow setup and init endpoints without auth
      if (isOnSetup || isOnInit) {
        return true;
      }
      
      // Redirect home page based on auth status
      if (isOnHome) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        } else {
          return Response.redirect(new URL("/login", nextUrl));
        }
      }
      
      // Protect dashboard and API routes
      if (isOnDashboard || isOnApi) {
        if (isLoggedIn) return true;
        
        // For API routes, return 401 JSON response instead of redirect
        if (isOnApi) {
          return Response.json(
            {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
              },
            },
            { status: 401 }
          );
        }
        
        // For dashboard pages, redirect to login
        const loginUrl = new URL("/login", nextUrl.origin);
        loginUrl.searchParams.set("session", "expired");
        return Response.redirect(loginUrl);
      }
      
      // Redirect logged-in users away from login page
      if (isLoggedIn && isOnLogin) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes
  },
} satisfies NextAuthConfig;
