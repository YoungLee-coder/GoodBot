import { NextResponse } from "next/server";
import { isAuthenticated } from "./auth";

/**
 * 统一的 API 错误响应
 */
export function apiError(message: string, status: number = 500) {
    return NextResponse.json({ error: message }, { status });
}

/**
 * 统一的 API 成功响应
 */
export function apiSuccess<T>(data: T) {
    return NextResponse.json(data);
}

/**
 * 检查认证状态，未认证返回 401 错误
 * @returns null 如果已认证，否则返回 401 响应
 */
export async function requireAuth() {
    if (!await isAuthenticated()) {
        return apiError("Unauthorized", 401);
    }
    return null;
}
