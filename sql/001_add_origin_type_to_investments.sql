-- Migration: add origin_type column to investments
BEGIN;

ALTER TABLE public.investments
  ADD COLUMN IF NOT EXISTS origin_type text;

-- Mark existing rows explicitly as 'aporte' when missing
UPDATE public.investments
  SET origin_type = 'aporte'
  WHERE origin_type IS NULL;

COMMIT;
