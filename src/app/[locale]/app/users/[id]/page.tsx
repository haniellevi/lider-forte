import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { UserProfileForm } from "./_components/UserProfileForm";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "pt-BR" | "en", namespace: "UserProfile" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function UserDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale: locale as "pt-BR" | "en", namespace: "UserProfile" });
  
  return (
    <>
      <Breadcrumb 
        pageName={t("title")} 
        items={[
          { label: t("breadcrumb.users"), href: "/app/users" },
          { label: t("breadcrumb.profile"), href: "" }
        ]}
      />
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                {t("sections.personalInfo")}
              </h3>
            </div>
            <div className="p-7">
              <UserProfileForm userId={id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}