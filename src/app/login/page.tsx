import { Suspense } from "react";
import { getI18n } from "@/i18n/server";
import LoginForm from "./LoginForm";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("auth.loginTitle") };
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
