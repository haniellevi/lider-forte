import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ChurchesTable from "./_components/ChurchesTable";
import ChurchFilters from "./_components/ChurchFilters";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("ChurchesPage");
  
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function ChurchesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("ChurchesPage");
  
  return (
    <>
      <Breadcrumb pageName={t("title")} />
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-dark dark:text-white">
              {t("title")}
            </h1>
            <p className="text-dark-4 dark:text-dark-6">
              {t("description")}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-4 flex gap-3 sm:mt-0">
            <button className="inline-flex items-center justify-center rounded-md border border-stroke bg-white px-4 py-2.5 text-center text-sm font-medium text-dark hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark/20">
              {t("buttons.export")}
            </button>
            <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-opacity-90">
              {t("buttons.addChurch")}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <ChurchFilters />
        </div>

        {/* Table */}
        <div className="rounded-lg bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
          <ChurchesTable />
        </div>
      </div>
    </>
  );
}