import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { MultiplicationWizard } from '@/components/multiplication/MultiplicationWizard'

interface PageProps {
  params: {
    id: string
  }
  searchParams: {
    process?: string
  }
}

export const metadata: Metadata = {
  title: 'Multiplicação de Célula | Lider Forte',
  description: 'Wizard para multiplicação de células'
}

export default async function MultiplyPage({ params, searchParams }: PageProps) {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Verificar se a célula existe e se o usuário tem permissão
  const { data: cell, error: cellError } = await supabase
    .from('cells')
    .select(`
      id,
      name,
      church_id,
      leader_id,
      supervisor_id
    `)
    .eq('id', params.id)
    .single()

  if (cellError || !cell) {
    redirect('/cells')
  }

  // Verificar se o usuário é líder ou supervisor da célula
  const { data: cellMember, error: memberError } = await supabase
    .from('cell_members')
    .select('role')
    .eq('cell_id', params.id)
    .eq('profile_id', user.id)
    .single()

  if (memberError || !cellMember || !['leader', 'supervisor'].includes(cellMember.role)) {
    redirect(`/cells/${params.id}`)
  }

  // Se há um processo específico sendo continuado
  let existingProcess = null
  if (searchParams.process) {
    const { data: process } = await supabase
      .from('multiplication_processes')
      .select('*')
      .eq('id', searchParams.process)
      .eq('source_cell_id', params.id)
      .single()

    existingProcess = process
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Multiplicação de Célula</h1>
        <p className="text-muted-foreground">
          Célula: {cell.name}
        </p>
      </div>

      <MultiplicationWizard 
        cellId={params.id}
        initialProcess={existingProcess}
      />
    </div>
  )
}