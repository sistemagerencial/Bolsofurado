-- Migration: add deleted_at to profiles and mark inactive non-paid users
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Marca como deleted_at perfis que não estão em plano ativo e cujo último login foi há > 30 dias
-- Utiliza a tabela auth.users para checar last_sign_in_at
UPDATE public.profiles p
SET deleted_at = now()
FROM auth.users u
WHERE p.id = u.id
  AND p.deleted_at IS NULL
  AND (p.subscription_status IS NULL OR p.subscription_status <> 'active')
  AND (u.last_sign_in_at IS NULL OR u.last_sign_in_at < now() - interval '30 days');

COMMIT;
