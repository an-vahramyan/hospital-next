import { getI18n } from "@/i18n/server";
import RegisterForm from "./RegisterForm";

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t("auth.registerTitle") };
}

export default function RegisterPage() {
  return <RegisterForm />;
}
