import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getI18n } from "@/i18n/server";
import { I18nProvider } from "@/i18n/I18nProvider";
import { AuthProvider, type AuthUser } from "@/context/AuthContext";
import { getSessionUser } from "@/lib/auth";
import { getMe } from "@/lib/services/auth.service";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: t("brand.name"), template: `%s · ${t("brand.name")}` },
    description: t("home.heroSubtitle"),
    icons: { icon: "/favicon.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0e7490" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1419" },
  ],
};

async function loadUser(): Promise<AuthUser | null> {
  const session = await getSessionUser();
  if (!session) return null;
  try {
    const u = await getMe(session.id);
    return { id: u.id, email: u.email, role: u.role as AuthUser["role"], firstName: u.firstName, lastName: u.lastName, phone: u.phone, language: u.language };
  } catch {
    return null;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang } = await getI18n();
  const user = await loadUser();
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Armenian:wght@400;500;600;700;800;900&family=Noto+Sans:wght@400;500;600;700;800;900&display=swap"
        />
      </head>
      <body>
        <I18nProvider lang={lang}>
          <AuthProvider initialUser={user}>
            <Header />
            <main>{children}</main>
            <Footer />
            <ChatbotWidget />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
