CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('cidadao', 'advogado', 'admin')),
  telefone VARCHAR(20),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cidadaos (
  id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  cpf VARCHAR(14) UNIQUE,
  data_nascimento DATE,
  renda_aproximada VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS planos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(50) NOT NULL,
  preco_mensal NUMERIC(10, 2) NOT NULL,
  limite_solicitacoes_mes INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS advogados (
  id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  numero_oab VARCHAR(20) NOT NULL,
  estado_oab CHAR(2) NOT NULL,
  areas_atuacao TEXT[],
  bio TEXT,
  verificado BOOLEAN DEFAULT FALSE,
  plano_id UUID REFERENCES planos(id)
);

CREATE TABLE IF NOT EXISTS casos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cidadao_id UUID NOT NULL REFERENCES cidadaos(id) ON DELETE CASCADE,
  descricao_problema TEXT NOT NULL,
  area_direito VARCHAR(50),
  status VARCHAR(30) DEFAULT 'aberto',
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analises_ia (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  direitos_explicados TEXT,
  proximos_passos TEXT,
  score_abusividade INTEGER DEFAULT 0,
  gerado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS solicitacoes_atendimento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caso_id UUID NOT NULL REFERENCES casos(id) ON DELETE CASCADE,
  advogado_id UUID NOT NULL REFERENCES advogados(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pendente',
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes_atendimento(id),
  cidadao_id UUID NOT NULL REFERENCES cidadaos(id),
  advogado_id UUID NOT NULL REFERENCES advogados(id),
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artigos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  conteudo TEXT NOT NULL,
  area_direito VARCHAR(50),
  publicado BOOLEAN DEFAULT FALSE,
  criado_em TIMESTAMP DEFAULT NOW()
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cidade VARCHAR(120);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT NOW();
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_token_expira_em TIMESTAMP;

ALTER TABLE advogados ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
ALTER TABLE advogados ADD COLUMN IF NOT EXISTS cidade VARCHAR(120);
ALTER TABLE advogados ADD COLUMN IF NOT EXISTS uf CHAR(2);
ALTER TABLE advogados ADD COLUMN IF NOT EXISTS status_verificacao VARCHAR(20) DEFAULT 'pendente';

UPDATE advogados
SET status_verificacao = CASE WHEN verificado THEN 'aprovado' ELSE COALESCE(status_verificacao, 'pendente') END
WHERE status_verificacao IS NULL OR verificado = TRUE;

ALTER TABLE casos ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE casos ADD COLUMN IF NOT EXISTS renda_aproximada VARCHAR(50);
ALTER TABLE casos DROP CONSTRAINT IF EXISTS casos_status_check;
ALTER TABLE casos ADD CONSTRAINT casos_status_check
  CHECK (status IN ('aberto', 'em_analise', 'aguardando_advogado', 'em_atendimento', 'resolvido', 'encerrado'));

ALTER TABLE analises_ia ADD COLUMN IF NOT EXISTS cidadao_id UUID;
ALTER TABLE analises_ia ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'problema';
ALTER TABLE analises_ia ADD COLUMN IF NOT EXISTS area_direito VARCHAR(50);
ALTER TABLE analises_ia ADD COLUMN IF NOT EXISTS resumo TEXT;
ALTER TABLE analises_ia ADD COLUMN IF NOT EXISTS orientacao TEXT;
ALTER TABLE analises_ia ADD COLUMN IF NOT EXISTS direitos TEXT[] DEFAULT '{}';
ALTER TABLE analises_ia ADD COLUMN IF NOT EXISTS documentos TEXT[] DEFAULT '{}';
ALTER TABLE analises_ia ADD COLUMN IF NOT EXISTS indicar_defensoria BOOLEAN DEFAULT FALSE;
ALTER TABLE analises_ia ADD COLUMN IF NOT EXISTS confianca NUMERIC(4, 2);
ALTER TABLE analises_ia ADD COLUMN IF NOT EXISTS resposta_bruta JSONB DEFAULT '{}';
ALTER TABLE analises_ia ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'analises_ia'
      AND column_name = 'proximos_passos'
      AND data_type <> 'ARRAY'
  ) THEN
    ALTER TABLE analises_ia
    ALTER COLUMN proximos_passos TYPE TEXT[]
    USING CASE
      WHEN proximos_passos IS NULL THEN '{}'::TEXT[]
      ELSE ARRAY[proximos_passos]
    END;
  END IF;
END $$;

UPDATE analises_ia
SET criado_em = COALESCE(criado_em, gerado_em),
    direitos = CASE
      WHEN direitos_explicados IS NOT NULL AND (direitos IS NULL OR direitos = '{}') THEN ARRAY[direitos_explicados]
      ELSE direitos
    END
WHERE criado_em IS NULL OR direitos_explicados IS NOT NULL;

ALTER TABLE solicitacoes_atendimento ADD COLUMN IF NOT EXISTS cidadao_id UUID;
ALTER TABLE solicitacoes_atendimento ADD COLUMN IF NOT EXISTS mensagem TEXT;
ALTER TABLE solicitacoes_atendimento ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT NOW();
UPDATE solicitacoes_atendimento s
SET cidadao_id = c.cidadao_id
FROM casos c
WHERE s.caso_id = c.id AND s.cidadao_id IS NULL;

ALTER TABLE solicitacoes_atendimento DROP CONSTRAINT IF EXISTS solicitacoes_atendimento_status_check;
ALTER TABLE solicitacoes_atendimento ADD CONSTRAINT solicitacoes_atendimento_status_check
  CHECK (status IN ('pendente', 'aceita', 'recusada', 'cancelada'));

ALTER TABLE artigos ADD COLUMN IF NOT EXISTS autor_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE artigos ADD COLUMN IF NOT EXISTS resumo TEXT;
ALTER TABLE artigos ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_casos_cidadao ON casos(cidadao_id);
CREATE INDEX IF NOT EXISTS idx_casos_status ON casos(status);
CREATE INDEX IF NOT EXISTS idx_advogados_status ON advogados(status_verificacao);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_advogado ON solicitacoes_atendimento(advogado_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_cidadao ON solicitacoes_atendimento(cidadao_id);
CREATE INDEX IF NOT EXISTS idx_artigos_slug ON artigos(slug);
CREATE INDEX IF NOT EXISTS idx_artigos_area ON artigos(area_direito);
