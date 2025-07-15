import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ChurchSetupForm } from "@/components/Forms/ChurchSetupForm";

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
      <Breadcrumb pageName={t("title")} />
      <div className="mx-auto max-w-7xl">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              {t("title")}
            </h3>
          </div>
          <div className="p-7">
            <ChurchSetupForm />
          </div>
        </div>
      </div>
    </>
  );
}