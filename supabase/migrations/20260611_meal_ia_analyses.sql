-- Sprint 5: histórico de análises IA de refeições (texto/foto)

CREATE TABLE IF NOT EXISTS public.ia_analises_refeicao (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('texto', 'foto')),
  entrada_texto TEXT,
  imagem_nome TEXT,
  resposta_bruta_json JSONB,
  itens_parseados_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'aprovado'
    CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  refeicao_id BIGINT REFERENCES public.refeicoes (id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ia_analises_refeicao_user_id_idx
  ON public.ia_analises_refeicao (user_id);

CREATE INDEX IF NOT EXISTS ia_analises_refeicao_criado_em_idx
  ON public.ia_analises_refeicao (criado_em DESC);

ALTER TABLE public.ia_analises_refeicao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ia_analises_refeicao_select_own"
  ON public.ia_analises_refeicao FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "ia_analises_refeicao_insert_own"
  ON public.ia_analises_refeicao FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "ia_analises_refeicao_update_own"
  ON public.ia_analises_refeicao FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "ia_analises_refeicao_delete_own"
  ON public.ia_analises_refeicao FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_ia_analises_refeicao_user_id ON public.ia_analises_refeicao;
CREATE TRIGGER set_ia_analises_refeicao_user_id
  BEFORE INSERT ON public.ia_analises_refeicao
  FOR EACH ROW EXECUTE FUNCTION public.set_row_user_id();
