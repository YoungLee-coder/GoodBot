import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getSetting } from "./settings";

export interface SessionData {
  isLoggedIn: boolean;
  username?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long_for_security",
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
