CREATE TABLE IF NOT EXISTS documentos_casos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  cidadao_id UUID NOT NULL REFERENCES cidadaos(id) ON DELETE CASCADE,
  nome_original VARCHAR(180) NOT NULL,
  tipo_mime VARCHAR(120) NOT NULL,
  tamanho_bytes INTEGER NOT NULL CHECK (tamanho_bytes >= 1 AND tamanho_bytes <= 5242880),
  conteudo_base64 TEXT,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documentos_casos_caso
  ON documentos_casos(caso_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_documentos_casos_cidadao
  ON documentos_casos(cidadao_id);
