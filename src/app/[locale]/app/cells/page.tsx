import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { CellsContent } from "./_components/CellsContent";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "pt-BR" | "en", namespace: "Cells" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function CellsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "pt-BR" | "en", namespace: "Cells" });
  
  return (
    <>
      <Breadcrumb pageName={t("title")} />
      <div className="mx-auto max-w-7xl">
        <CellsContent />
      </div>
    </>
  );
}