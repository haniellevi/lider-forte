import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { DashboardContent } from "./_components/DashboardContent";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "pt-BR" | "en", namespace: "Dashboard" });
  
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "pt-BR" | "en", namespace: "Dashboard" });
  
  return (
    <>
      <Breadcrumb pageName={t("title")} />
      <div className="mx-auto max-w-7xl">
        <DashboardContent />
      </div>
    </>
  );
}