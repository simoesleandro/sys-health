-- Sprint 2: metas nutricionais e suplementos por utilizador

CREATE TABLE IF NOT EXISTS public.metas_usuario (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  tmb_kcal NUMERIC(8, 1) NOT NULL DEFAULT 1863,
  protein_g NUMERIC(8, 1) NOT NULL DEFAULT 190,
  carbs_g NUMERIC(8, 1) NOT NULL DEFAULT 180,
  fats_g NUMERIC(8, 1) NOT NULL DEFAULT 65,
  water_l NUMERIC(6, 2) NOT NULL DEFAULT 3.5,
  pai INTEGER NOT NULL DEFAULT 100,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.suplementos_config (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  preset_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  marca TEXT NOT NULL DEFAULT '',
  dose TEXT NOT NULL DEFAULT '',
  cor_tema TEXT NOT NULL DEFAULT 'cyan',
  label TEXT NOT NULL,
  descricao TEXT NOT NULL,
  calorias NUMERIC(8, 2) NOT NULL DEFAULT 0,
  proteinas NUMERIC(8, 2) NOT NULL DEFAULT 0,
  carboidratos NUMERIC(8, 2) NOT NULL DEFAULT 0,
  gorduras NUMERIC(8, 2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (user_id, preset_id)
);

CREATE INDEX IF NOT EXISTS suplementos_config_user_id_idx
  ON public.suplementos_config (user_id, sort_order);

ALTER TABLE public.metas_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suplementos_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS metas_usuario_select_own ON public.metas_usuario;
DROP POLICY IF EXISTS metas_usuario_insert_own ON public.metas_usuario;
DROP POLICY IF EXISTS metas_usuario_update_own ON public.metas_usuario;
DROP POLICY IF EXISTS metas_usuario_delete_own ON public.metas_usuario;

CREATE POLICY metas_usuario_select_own
  ON public.metas_usuario FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY metas_usuario_insert_own
  ON public.metas_usuario FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY metas_usuario_update_own
  ON public.metas_usuario FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY metas_usuario_delete_own
  ON public.metas_usuario FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS suplementos_config_select_own ON public.suplementos_config;
DROP POLICY IF EXISTS suplementos_config_insert_own ON public.suplementos_config;
DROP POLICY IF EXISTS suplementos_config_update_own ON public.suplementos_config;
DROP POLICY IF EXISTS suplementos_config_delete_own ON public.suplementos_config;

CREATE POLICY suplementos_config_select_own
  ON public.suplementos_config FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY suplementos_config_insert_own
  ON public.suplementos_config FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY suplementos_config_update_own
  ON public.suplementos_config FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY suplementos_config_delete_own
  ON public.suplementos_config FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.metas_usuario TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suplementos_config TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.suplementos_config_id_seq TO authenticated;
