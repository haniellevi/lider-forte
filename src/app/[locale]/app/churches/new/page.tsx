import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ChurchForm from "../_components/ChurchForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ChurchForm");
  
  return {
    title: t("meta.createTitle"),
    description: t("meta.createDescription"),
  };
}

export default async function NewChurchPage() {
  const t = await getTranslations("ChurchForm");
  
  return (
    <>
      <Breadcrumb pageName={t("createTitle")} />
      
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-dark dark:text-white">
            {t("createTitle")}
          </h1>
          <p className="text-dark-4 dark:text-dark-6">
            {t("createDescription")}
          </p>
        </div>

        {/* Form */}
        <div className="rounded-lg bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
          <div className="p-6">
            <ChurchForm />
          </div>
        </div>
      </div>
    </>
  );
}