"use client";

import { Suspense, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { authenticate } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "登录中..." : "登录"}
    </Button>
  );
}

function SessionExpiredAlert() {
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("session") === "expired";

  if (!sessionExpired) return null;

  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <div>
        <p className="font-medium">会话已过期</p>
        <p className="text-xs mt-1">
          您的会话已超时，请重新登录以继续使用
        </p>
      </div>
    </div>
  );
}

function LoginForm() {
  const [errorMessage, dispatch] = useActionState(authenticate, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            GoodBot 管理系统
          </CardTitle>
          <CardDescription className="text-center">
            请登录以访问管理界面
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <SessionExpiredAlert />
          </Suspense>

          <form action={dispatch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱地址</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="admin@example.com"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                密码至少需要 6 个字符
              </p>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            <LoginButton />
          </form>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            <p>会话将在 30 分钟无活动后自动过期</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
