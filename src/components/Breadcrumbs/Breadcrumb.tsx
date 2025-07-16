import {Link} from "@/i18n/navigation";
import { useTranslations } from 'next-intl';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  pageName: string;
  items?: BreadcrumbItem[];
}

const Breadcrumb = ({ pageName, items }: BreadcrumbProps) => {
  const t = useTranslations('Navigation');
  
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-[26px] font-bold leading-[30px] text-dark dark:text-white">
        {pageName}
      </h2>

      <nav>
        <ol className="flex items-center gap-2">
          {items ? (
            items.map((item, index) => (
              <li key={index}>
                {index === items.length - 1 ? (
                  <span className="font-medium text-primary">{item.label}</span>
                ) : (
                  <Link className="font-medium" href={item.href}>
                    {item.label} /
                  </Link>
                )}
              </li>
            ))
          ) : (
            <>
              <li>
                <Link className="font-medium" href="/">
                  {t('dashboard')} /
                </Link>
              </li>
              <li className="font-medium text-primary">{pageName}</li>
            </>
          )}
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
