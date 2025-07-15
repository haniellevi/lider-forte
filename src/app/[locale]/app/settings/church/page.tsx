import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ChurchSettingsContent } from "./_components/ChurchSettingsContent";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "pt-BR" | "en", namespace: "ChurchSettings" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function ChurchSettingsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "pt-BR" | "en", namespace: "ChurchSettings" });
  
  return (
    <>
      <Breadcrumb 
        pageName={t("title")} 
        items={[
          { name: t("breadcrumb.settings"), href: "/app/settings" },
          { name: t("breadcrumb.church") }
        ]}
      />
      <div className="mx-auto max-w-7xl">
        <ChurchSettingsContent />
      </div>
    </>
  );
}