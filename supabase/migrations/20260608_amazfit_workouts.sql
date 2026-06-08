-- Treinos detalhados Zepp/Amazfit (sport/run/history.json)
CREATE TABLE IF NOT EXISTS public.amazfit_workouts (
  track_id TEXT PRIMARY KEY,
  data_hora TIMESTAMPTZ NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Corrida',
  distancia_km NUMERIC(8, 2) NOT NULL DEFAULT 0,
  duracao_minutos INTEGER NOT NULL DEFAULT 0,
  fc_media NUMERIC(6, 1),
  calorias NUMERIC(8, 1),
  pace_segundos_por_km NUMERIC(8, 2),
  sport_type INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS amazfit_workouts_data_hora_idx
  ON public.amazfit_workouts (data_hora DESC);
