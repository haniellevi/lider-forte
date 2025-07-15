import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { CellDetailContent } from "./_components/CellDetailContent";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "pt-BR" | "en", namespace: "Cells" });
  return {
    title: t("detail.meta.title"),
    description: t("detail.meta.description"),
  };
}

export default async function CellDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale: locale as "pt-BR" | "en", namespace: "Cells" });
  
  return (
    <>
      <Breadcrumb 
        pageName={t("detail.title")} 
        items={[
          { name: t("title"), href: "/app/cells" },
          { name: t("detail.breadcrumb") }
        ]}
      />
      <div className="mx-auto max-w-7xl">
        <CellDetailContent cellId={id} />
      </div>
    </>
  );
}