CREATE TABLE IF NOT EXISTS eventos_solicitacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes_atendimento(id) ON DELETE CASCADE,
  ator_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo VARCHAR(50) NOT NULL,
  descricao TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eventos_solicitacoes_solicitacao
  ON eventos_solicitacoes(solicitacao_id, criado_em);

INSERT INTO eventos_solicitacoes (solicitacao_id, ator_id, tipo, descricao, metadata, criado_em)
SELECT s.id,
       s.cidadao_id,
       'solicitacao_criada',
       'Solicitacao de atendimento enviada ao advogado.',
       jsonb_build_object('status', s.status),
       s.criado_em
FROM solicitacoes_atendimento s
WHERE NOT EXISTS (
  SELECT 1
  FROM eventos_solicitacoes e
  WHERE e.solicitacao_id = s.id
    AND e.tipo = 'solicitacao_criada'
);

INSERT INTO eventos_solicitacoes (solicitacao_id, ator_id, tipo, descricao, metadata, criado_em)
SELECT s.id,
       s.advogado_id,
       CASE WHEN s.status = 'aceita' THEN 'solicitacao_aceita' ELSE 'solicitacao_recusada' END,
       CASE
         WHEN s.status = 'aceita' THEN 'Advogado aceitou a solicitacao de atendimento.'
         ELSE 'Advogado recusou a solicitacao de atendimento.'
       END,
       jsonb_build_object('status', s.status),
       COALESCE(s.atualizado_em, s.criado_em)
FROM solicitacoes_atendimento s
WHERE s.status IN ('aceita', 'recusada')
  AND NOT EXISTS (
    SELECT 1
    FROM eventos_solicitacoes e
    WHERE e.solicitacao_id = s.id
      AND e.tipo IN ('solicitacao_aceita', 'solicitacao_recusada')
  );
