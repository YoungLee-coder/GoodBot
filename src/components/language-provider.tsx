"use client";

import { createContext, useContext, useState, ReactNode, useSyncExternalStore } from "react";
import { Locale, getTranslation } from "@/lib/i18n";

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: ReturnType<typeof getTranslation>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 从 localStorage 获取初始语言设置
function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "zh";
  const saved = localStorage.getItem("locale");
  if (saved === "zh" || saved === "en") return saved;
  return "zh";
}

// 用于 SSR 的订阅函数
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): Locale {
  return getStoredLocale();
}

function getServerSnapshot(): Locale {
  return "zh";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const storedLocale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [locale, setLocaleState] = useState<Locale>(storedLocale);
  const [t, setT] = useState(() => getTranslation(storedLocale));

  // 当 storedLocale 变化时同步更新（通过 storage 事件触发）
  if (storedLocale !== locale) {
    setLocaleState(storedLocale);
    setT(getTranslation(storedLocale));
  }



  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setT(getTranslation(newLocale));
    localStorage.setItem("locale", newLocale);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
