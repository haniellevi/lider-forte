import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "HomeApp" });
  
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function HomeAppPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "HomeApp" });
  
  return (
    <>
      <Breadcrumb pageName={t("title")} />
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-bold dark:text-white">{t("title")}</h1>
          {t("title")}
        </h1>
        <p className="text-gray-700 dark:text-gray-300">
          {t("pageDescription")}
        </p>
      </div>
    </>
  );
}