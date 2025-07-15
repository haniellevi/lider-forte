import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import * as Icons from "@/components/Layouts/sidebar/icons";
import { NavigationData } from '@/components/Layouts/sidebar/types';

export function useNavigation(): NavigationData {
  const t = useTranslations('Navigation');

  // Memoize the navigation data to prevent unnecessary re-renders
  // when translations haven't actually changed
  return useMemo(() => [
    {
      label: t('backend'),
      items: [
        {
          title: t('dashboard'),
          icon: Icons.HomeIcon,
          items: [
            {
              title: t('ecommerce'),
              url: '/app/dashboard',
            },
          ],
        },
      ],
    },
  ], [t]);
}