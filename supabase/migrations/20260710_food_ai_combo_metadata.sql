alter table if exists public.alimentos_favoritos
  add column if not exists origem text not null default 'manual'
    check (origem in ('manual', 'ia')),
  add column if not exists componentes_json jsonb;

create index if not exists alimentos_favoritos_origem_idx
  on public.alimentos_favoritos (origem);
