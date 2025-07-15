import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ReportsContent } from "./_components/ReportsContent";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "pt-BR" | "en", namespace: "Reports" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function ReportsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "pt-BR" | "en", namespace: "Reports" });
  
  return (
    <>
      <Breadcrumb 
        pageName={t("title")} 
      />
      <div className="mx-auto max-w-7xl">
        <ReportsContent />
      </div>
    </>
  );
}