-- Histórico de perguntas e respostas do IA Coach

CREATE TABLE IF NOT EXISTS public.ia_analises_coach (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ia_analises_coach_user_id_idx
  ON public.ia_analises_coach (user_id);

CREATE INDEX IF NOT EXISTS ia_analises_coach_criado_em_idx
  ON public.ia_analises_coach (criado_em DESC);

ALTER TABLE public.ia_analises_coach ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ia_analises_coach_select_own"
  ON public.ia_analises_coach FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "ia_analises_coach_insert_own"
  ON public.ia_analises_coach FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "ia_analises_coach_delete_own"
  ON public.ia_analises_coach FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_ia_analises_coach_user_id ON public.ia_analises_coach;
CREATE TRIGGER set_ia_analises_coach_user_id
  BEFORE INSERT ON public.ia_analises_coach
  FOR EACH ROW EXECUTE FUNCTION public.set_row_user_id();
