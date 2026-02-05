-- Habilita RLS e cria políticas para `receitas` e `despesas`
-- Idempotente: pode ser aplicado repetidas vezes

BEGIN;

-- Apenas proceda se as tabelas existirem
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='receitas') THEN
    -- habilita RLS
    ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;

    -- remove políticas antigas (se existirem) para permitir recriação
    DROP POLICY IF EXISTS anon_select_receitas ON public.receitas;
    DROP POLICY IF EXISTS auth_manage_receitas ON public.receitas;

    -- (removed public anon SELECT policy to make table private)

    -- política: usuários autenticados podem fazer CRUD apenas nas suas próprias linhas
    CREATE POLICY auth_manage_receitas ON public.receitas
      FOR ALL
      TO authenticated
      USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
      WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='despesas') THEN
    ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS anon_select_despesas ON public.despesas;
    DROP POLICY IF EXISTS auth_manage_despesas ON public.despesas;

    -- (removed public anon SELECT policy to make table private)

    CREATE POLICY auth_manage_despesas ON public.despesas
      FOR ALL
      TO authenticated
      USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
      WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
  END IF;
END$$;

COMMIT;

-- Observações:
-- - Este arquivo assume que as colunas `user_id` existem nas tabelas e armazenam o UUID do usuário (auth.uid()).
-- - Se quiser tornar as tabelas privadas (sem leitura pública), remova as políticas `anon_select_*`.
-- - Aplique no editor SQL do Supabase ou via psql: copie/cole o conteúdo e execute.
