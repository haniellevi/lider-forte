import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ChurchForm from "../_components/ChurchForm";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations("ChurchForm");
  
  const isEdit = id !== "new";
  
  return {
    title: isEdit ? t("meta.editTitle") : t("meta.createTitle"),
    description: isEdit ? t("meta.editDescription") : t("meta.createDescription"),
  };
}

export default async function ChurchFormPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("ChurchForm");
  
  const isEdit = id !== "new";
  const isValidId = isEdit && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  // Validate UUID format for edit mode
  if (isEdit && !isValidId) {
    notFound();
  }
  
  return (
    <>
      <Breadcrumb pageName={isEdit ? t("editTitle") : t("createTitle")} />
      
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-dark dark:text-white">
            {isEdit ? t("editTitle") : t("createTitle")}
          </h1>
          <p className="text-dark-4 dark:text-dark-6">
            {isEdit ? t("editDescription") : t("createDescription")}
          </p>
        </div>

        {/* Form */}
        <div className="rounded-lg bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
          <div className="p-6">
            <ChurchForm churchId={isEdit ? id : undefined} />
          </div>
        </div>
      </div>
    </>
  );
}