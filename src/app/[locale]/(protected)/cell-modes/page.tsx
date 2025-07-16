import { Metadata } from 'next'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { ModeDashboard } from '@/components/cells/mode-dashboard'

interface CellModesPageProps {
  params: {
    locale: string
  }
  searchParams: {
    supervisor_id?: string
    mode?: string
  }
}

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'CellModes.meta' })

  return {
    title: t('title'),
    description: t('description')
  }
}

export default function CellModesPage({
  params: { locale },
  searchParams
}: CellModesPageProps) {
  const t = useTranslations('CellModes')

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      {/* Dashboard */}
      <Suspense 
        fallback={
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        }
      >
        <ModeDashboard
          churchId="mock-church-id" // TODO: Obter da sessão/contexto
          supervisorId={searchParams.supervisor_id}
          userRole="pastor" // TODO: Obter da sessão/contexto
        />
      </Suspense>
    </div>
  )
}