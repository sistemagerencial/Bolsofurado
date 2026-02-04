-- Migration: renomear revenues/expenses para português (receitas/despesas)
-- Idempotente: pode ser aplicado múltiplas vezes sem erro

BEGIN;

-- renomeia tabelas (não falha se já renomeadas)
ALTER TABLE IF EXISTS public.revenues RENAME TO receitas;
ALTER TABLE IF EXISTS public.expenses  RENAME TO despesas;

-- renomeia sequences se existirem (não falha se já renomeadas)
ALTER SEQUENCE IF EXISTS public.revenues_id_seq RENAME TO receitas_id_seq;
ALTER SEQUENCE IF EXISTS public.expenses_id_seq  RENAME TO despesas_id_seq;

-- garante que a sequence pertence à coluna id da nova tabela
ALTER SEQUENCE IF EXISTS public.receitas_id_seq OWNED BY public.receitas.id;
ALTER SEQUENCE IF EXISTS public.despesas_id_seq  OWNED BY public.despesas.id;

-- renomeia constraints para nomenclatura consistente (silencioso se não existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expenses_pkey') THEN
    ALTER TABLE IF EXISTS public.despesas RENAME CONSTRAINT expenses_pkey TO despesas_pkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'revenues_pkey') THEN
    ALTER TABLE IF EXISTS public.receitas RENAME CONSTRAINT revenues_pkey TO receitas_pkey;
  END IF;
END$$;

COMMIT;

-- Pós-checks (execução opcional manual):
-- SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
-- SELECT sequence_schema, sequence_name FROM information_schema.sequences WHERE sequence_schema='public' ORDER BY sequence_name;
-- SELECT conname, conrelid::regclass AS table_name, pg_get_constraintdef(oid) FROM pg_constraint WHERE connamespace = 'public'::regnamespace ORDER BY conname;
