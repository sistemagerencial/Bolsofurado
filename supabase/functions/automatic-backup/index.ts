import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BackupData {
  user_id: string;
  created_at: string;
  expenses: any[];
  revenues: any[];
  investments: any[];
  budgets: any[];
  categories: any[];
  patrimonios: any[];
  trades: any[];
  calculator_projects: any[];
  calculator_services: any[];
  profile: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validação de autenticação melhorada
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Header de autorização ausente ou inválido')
      return new Response(
        JSON.stringify({ error: 'Token de autorização necessário' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      console.error('Token vazio')
      return new Response(
        JSON.stringify({ error: 'Token de autorização inválido' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Verificar usuário com tratamento de erro melhorado
    let user;
    try {
      const { data, error } = await supabaseClient.auth.getUser(token)
      
      if (error) {
        console.error('Erro ao verificar usuário:', error)
        return new Response(
          JSON.stringify({ error: 'Token inválido ou expirado' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401 
          }
        )
      }

      user = data.user
      if (!user) {
        console.error('Usuário não encontrado')
        return new Response(
          JSON.stringify({ error: 'Usuário não autenticado' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401 
          }
        )
      }

      console.log(`Usuário autenticado: ${user.id}`)
    } catch (authError) {
      console.error('Erro na autenticação:', authError)
      return new Response(
        JSON.stringify({ error: 'Falha na autenticação' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Garantir que o bucket existe
    await ensureBucketExists(supabaseClient)

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    if (req.method === 'POST') {
      if (action === 'create') {
        // Criar backup manual
        const backup = await createUserBackup(supabaseClient, user.id)
        return new Response(
          JSON.stringify({ success: true, backup }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      } else if (action === 'restore') {
        // Restaurar backup
        const { backup_id } = await req.json()
        await restoreUserBackup(supabaseClient, user.id, backup_id)
        return new Response(
          JSON.stringify({ success: true, message: 'Backup restaurado com sucesso' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      } else if (action === 'auto') {
        // Backup automático (executado via cron)
        const users = await getAllActiveUsers(supabaseClient)
        const results = []
        
        for (const userRecord of users) {
          try {
            const backup = await createUserBackup(supabaseClient, userRecord.id)
            results.push({ user_id: userRecord.id, success: true, backup_id: backup.id })
          } catch (error) {
            console.error(`Erro no backup do usuário ${userRecord.id}:`, error)
            results.push({ user_id: userRecord.id, success: false, error: error.message })
          }
        }
        
        return new Response(
          JSON.stringify({ success: true, results }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }
    } else if (req.method === 'GET') {
      if (action === 'list') {
        // Listar backups do usuário
        try {
          const { data: backups, error } = await supabaseClient
            .storage
            .from('backups')
            .list(`user_${user.id}`, {
              limit: 50,
              sortBy: { column: 'created_at', order: 'desc' }
            })

          // Se a pasta não existir, retornar lista vazia
          if (error) {
            console.log('Erro ao listar backups ou pasta não existe:', error.message)
            
            // Criar pasta do usuário se não existir
            try {
              await supabaseClient
                .storage
                .from('backups')
                .upload(`user_${user.id}/.keep`, new Blob(['']))
            } catch (createError) {
              console.log('Erro ao criar pasta do usuário:', createError)
            }

            return new Response(
              JSON.stringify({ success: true, backups: [] }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200 
              }
            )
          }

          const backupList = backups?.filter(file => file.name.endsWith('.json')).map(file => ({
            id: file.name.replace('.json', ''),
            name: file.name,
            created_at: file.created_at,
            updated_at: file.updated_at,
            size: file.metadata?.size || 0
          })) || []

          console.log(`Encontrados ${backupList.length} backups para o usuário ${user.id}`)

          return new Response(
            JSON.stringify({ success: true, backups: backupList }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          )
        } catch (error) {
          console.error('Erro ao listar backups:', error)
          // Em caso de erro, retornar lista vazia em vez de erro
          return new Response(
            JSON.stringify({ success: true, backups: [] }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          )
        }
      } else if (action === 'download') {
        // Download de backup específico
        const backup_id = url.searchParams.get('backup_id')
        if (!backup_id) {
          return new Response(
            JSON.stringify({ error: 'backup_id é obrigatório' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          )
        }

        try {
          const { data, error } = await supabaseClient
            .storage
            .from('backups')
            .download(`user_${user.id}/${backup_id}.json`)

          if (error) {
            console.error('Erro ao baixar backup:', error)
            return new Response(
              JSON.stringify({ error: 'Backup não encontrado' }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404 
              }
            )
          }

          return new Response(data, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Content-Disposition': `attachment; filename="backup_${backup_id}.json"`
            }
          })
        } catch (error) {
          console.error('Erro no download:', error)
          return new Response(
            JSON.stringify({ error: 'Erro ao baixar backup' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          )
        }
      }
    } else if (req.method === 'DELETE') {
      // Deletar backup
      const backup_id = url.searchParams.get('backup_id')
      if (!backup_id) {
        return new Response(
          JSON.stringify({ error: 'backup_id é obrigatório' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      try {
        const { error } = await supabaseClient
          .storage
          .from('backups')
          .remove([`user_${user.id}/${backup_id}.json`])

        if (error) {
          console.error('Erro ao deletar backup:', error)
          return new Response(
            JSON.stringify({ error: 'Erro ao deletar backup' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          )
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Backup deletado com sucesso' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      } catch (error) {
        console.error('Erro ao deletar backup:', error)
        return new Response(
          JSON.stringify({ error: 'Erro interno do servidor' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    )

  } catch (error) {
    console.error('Erro geral no backup:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function ensureBucketExists(supabaseClient: any) {
  try {
    // Verificar se o bucket existe
    const { data: buckets, error: listError } = await supabaseClient
      .storage
      .listBuckets()

    if (listError) {
      console.error('Erro ao listar buckets:', listError)
      return
    }

    const backupBucket = buckets?.find((bucket: any) => bucket.name === 'backups')
    
    if (!backupBucket) {
      // Criar bucket se não existir
      const { data, error: createError } = await supabaseClient
        .storage
        .createBucket('backups', {
          public: false,
          allowedMimeTypes: ['application/json'],
          fileSizeLimit: 50 * 1024 * 1024 // 50MB
        })

      if (createError) {
        console.error('Erro ao criar bucket:', createError)
      } else {
        console.log('Bucket "backups" criado com sucesso')
      }
    }
  } catch (error) {
    console.error('Erro ao verificar/criar bucket:', error)
  }
}

async function createUserBackup(supabaseClient: any, userId: string): Promise<any> {
  console.log(`Criando backup para usuário: ${userId}`)

  try {
    // Coletar todos os dados do usuário
    const [
      expensesData,
      revenuesData,
      investmentsData,
      budgetsData,
      categoriesData,
      patrimoniosData,
      tradesData,
      calculatorProjectsData,
      calculatorServicesData,
      profileData
    ] = await Promise.all([
      supabaseClient.from('expenses').select('*').eq('user_id', userId),
      supabaseClient.from('revenues').select('*').eq('user_id', userId),
      supabaseClient.from('investments').select('*').eq('user_id', userId),
      supabaseClient.from('budgets').select('*').eq('user_id', userId),
      supabaseClient.from('categories').select('*').eq('user_id', userId),
      supabaseClient.from('patrimonios').select('*').eq('user_id', userId),
      supabaseClient.from('trades').select('*').eq('user_id', userId),
      supabaseClient.from('calculator_projects').select('*').eq('user_id', userId),
      supabaseClient.from('calculator_services').select('*').eq('user_id', userId),
      supabaseClient.from('profiles').select('*').eq('id', userId).maybeSingle()
    ])

    // Verificar erros críticos (apenas para tabelas que devem existir)
    const criticalErrors = [
      expensesData.error,
      revenuesData.error,
      profileData.error
    ].filter(Boolean)

    if (criticalErrors.length > 0) {
      throw new Error(`Erros críticos ao coletar dados: ${criticalErrors.map(e => e.message).join(', ')}`)
    }

    const backupData: BackupData = {
      user_id: userId,
      created_at: new Date().toISOString(),
      expenses: expensesData.data || [],
      revenues: revenuesData.data || [],
      investments: investmentsData.data || [],
      budgets: budgetsData.data || [],
      categories: categoriesData.data || [],
      patrimonios: patrimoniosData.data || [],
      trades: tradesData.data || [],
      calculator_projects: calculatorProjectsData.data || [],
      calculator_services: calculatorServicesData.data || [],
      profile: profileData.data || {}
    }

    // Criar nome único do arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0]
    const backupId = `backup_${timestamp}`
    const fileName = `user_${userId}/${backupId}.json`

    // Salvar no Supabase Storage
    const { data, error } = await supabaseClient
      .storage
      .from('backups')
      .upload(fileName, JSON.stringify(backupData, null, 2), {
        contentType: 'application/json',
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`Erro ao salvar backup: ${error.message}`)
    }

    console.log(`Backup criado com sucesso: ${fileName}`)
    
    const totalRecords = backupData.expenses.length + 
                        backupData.revenues.length + 
                        backupData.investments.length + 
                        backupData.budgets.length + 
                        backupData.categories.length + 
                        backupData.patrimonios.length + 
                        backupData.trades.length + 
                        backupData.calculator_projects.length + 
                        backupData.calculator_services.length

    return {
      id: backupId,
      path: data.path,
      created_at: backupData.created_at,
      size: JSON.stringify(backupData).length,
      records_count: {
        expenses: backupData.expenses.length,
        revenues: backupData.revenues.length,
        investments: backupData.investments.length,
        budgets: backupData.budgets.length,
        categories: backupData.categories.length,
        patrimonios: backupData.patrimonios.length,
        trades: tradesData.length,
        calculator_projects: backupData.calculator_projects.length,
        calculator_services: backupData.calculator_services.length,
        total: totalRecords
      }
    }
  } catch (error) {
    console.error('Erro detalhado no backup:', error)
    throw new Error(`Falha ao criar backup: ${error.message}`)
  }
}

async function restoreUserBackup(supabaseClient: any, userId: string, backupId: string) {
  console.log(`Restaurando backup ${backupId} para usuário: ${userId}`)

  // Baixar arquivo de backup
  const { data: backupFile, error: downloadError } = await supabaseClient
    .storage
    .from('backups')
    .download(`user_${userId}/${backupId}.json`)

  if (downloadError) {
    throw new Error(`Erro ao baixar backup: ${downloadError.message}`)
  }

  const backupText = await backupFile.text()
  const backupData: BackupData = JSON.parse(backupText)

  // Verificar se o backup pertence ao usuário correto
  if (backupData.user_id !== userId) {
    throw new Error('Backup não pertence ao usuário atual')
  }

  // Iniciar transação - deletar dados existentes e inserir novos
  const tables = [
    'expenses',
    'revenues', 
    'investments',
    'budgets',
    'categories',
    'patrimonios',
    'trades',
    'calculator_projects',
    'calculator_services'
  ]

  // Deletar dados existentes
  for (const table of tables) {
    const { error } = await supabaseClient
      .from(table)
      .delete()
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Erro ao limpar tabela ${table}: ${error.message}`)
    }
  }

  // Inserir dados do backup (se houver dados)
  for (const table of tables) {
    const tableData = backupData[table as keyof BackupData] as any[]
    
    if (tableData && tableData.length > 0) {
      // Remover campos de sistema que podem causar conflito
      const cleanData = tableData.map(record => {
        const { created_at, updated_at, ...cleanRecord } = record
        return cleanRecord
      })

      const { error } = await supabaseClient
        .from(table)
        .insert(cleanData)

      if (error) {
        throw new Error(`Erro ao restaurar tabela ${table}: ${error.message}`)
      }
    }
  }

  // Atualizar perfil (apenas dados relevantes, não sobrescrever tudo)
  if (backupData.profile) {
    const { id, created_at, updated_at, last_sign_in_at, email_confirmed_at, ...profileUpdates } = backupData.profile
    
    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await supabaseClient
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId)

      if (error) {
        throw new Error(`Erro ao restaurar perfil: ${error.message}`)
      }
    }
  }

  console.log(`Backup ${backupId} restaurado com sucesso`)
}

async function getAllActiveUsers(supabaseClient: any) {
  // Buscar usuários que fizeram login nos últimos 30 dias
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('id')
    .gte('last_sign_in_at', thirtyDaysAgo.toISOString())

  if (error) {
    throw new Error(`Erro ao buscar usuários ativos: ${error.message}`)
  }

  return data || []
}