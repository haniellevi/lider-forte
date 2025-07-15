import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TanStackQueryDemo } from "@/components/TanStackQuery/TanStackQueryDemo";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: "TanStack Query Demo",
    description: "Demonstração da integração do TanStack Query com Supabase e Clerk",
  };
}

export default async function TanStackQueryPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold dark:text-white">TanStack Query Demo</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Demonstração da integração do TanStack Query com Supabase e Clerk
        </p>
      </div>
      
      <TanStackQueryDemo />
    </div>
  );
}