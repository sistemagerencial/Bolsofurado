-- Idempotent RLS migration for `receitas` and `despesas`
-- Creates trigger function to populate user_id from jwt and owner-row policies.
-- SAFE TO COMMIT (no secrets)

-- function: set_user_id()
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_user_id') THEN
        CREATE OR REPLACE FUNCTION public.set_user_id()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            -- prefer explicit claim user_id, fallback to sub
            IF NEW.user_id IS NULL THEN
                NEW.user_id := COALESCE(current_setting('jwt.claims.user_id', true), current_setting('jwt.claims.sub', true))::uuid;
            END IF;
            RETURN NEW;
        END;
        $$;
    END IF;
END$$;

-- create triggers for receitas and despesas if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE event_object_table = 'receitas' AND trigger_name = 'receitas_set_user_id'
    ) THEN
        CREATE TRIGGER receitas_set_user_id
        BEFORE INSERT ON public.receitas
        FOR EACH ROW
        EXECUTE FUNCTION public.set_user_id();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE event_object_table = 'despesas' AND trigger_name = 'despesas_set_user_id'
    ) THEN
        CREATE TRIGGER despesas_set_user_id
        BEFORE INSERT ON public.despesas
        FOR EACH ROW
        EXECUTE FUNCTION public.set_user_id();
    END IF;
END$$;

-- Owner-row RLS policies (idempotent checks)
-- receitas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='receitas' AND policyname = 'auth_manage_receitas'
    ) THEN
        ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
        CREATE POLICY auth_manage_receitas ON public.receitas
            USING (user_id = (current_setting('jwt.claims.sub', true))::uuid)
            WITH CHECK (user_id = (current_setting('jwt.claims.sub', true))::uuid);
    END IF;
END$$;

-- despesas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='despesas' AND policyname = 'auth_manage_despesas'
    ) THEN
        ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
        CREATE POLICY auth_manage_despesas ON public.despesas
            USING (user_id = (current_setting('jwt.claims.sub', true))::uuid)
            WITH CHECK (user_id = (current_setting('jwt.claims.sub', true))::uuid);
    END IF;
END$$;

-- End of migration
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
