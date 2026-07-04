CREATE TABLE IF NOT EXISTS moderacoes_casos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caso_id UUID NOT NULL,
  admin_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  motivo TEXT,
  caso_snapshot JSONB,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderacoes_casos_caso ON moderacoes_casos(caso_id);
CREATE INDEX IF NOT EXISTS idx_moderacoes_casos_admin ON moderacoes_casos(admin_id);
