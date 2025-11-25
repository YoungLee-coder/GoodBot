import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getSetting } from "./settings";

export interface SessionData {
  isLoggedIn: boolean;
  username?: string;
}

// 获取 session 密钥，生产环境强制要求 SESSION_SECRET
function getSessionPassword(): string {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }
  if (process.env.NODE_ENV === "production") {
    console.warn("WARNING: SESSION_SECRET not set in production, using fallback");
  }
  return "dev_secret_key_at_least_32_characters_long";
}

export const sessionOptions: SessionOptions = {
  password: getSessionPassword(),
  cookieName: "goodbot_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function isAuthenticated() {
  const session = await getSession();
  return session.isLoggedIn === true;
}

export async function verifyPassword(password: string) {
  const adminPasswordHash = await getSetting("admin_password");
  if (!adminPasswordHash) return false;
  return bcrypt.compare(password, adminPasswordHash);
}
