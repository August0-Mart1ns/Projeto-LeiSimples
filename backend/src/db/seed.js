const bcrypt = require('bcryptjs')
const { pool, query } = require('../config/db')

async function upsertUsuario({ nome, email, senha, tipo, telefone, cidade }) {
  const senhaHash = await bcrypt.hash(senha, 10)
  const { rows } = await query(
    `INSERT INTO usuarios (nome, email, senha_hash, tipo, telefone, cidade)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO UPDATE
       SET nome = EXCLUDED.nome,
           senha_hash = EXCLUDED.senha_hash,
           tipo = EXCLUDED.tipo,
           telefone = EXCLUDED.telefone,
           cidade = EXCLUDED.cidade
     RETURNING id`,
    [nome, email, senhaHash, tipo, telefone || null, cidade || null]
  )
  return rows[0].id
}

async function ensurePlano() {
  const existing = await query('SELECT id FROM planos WHERE nome = $1 LIMIT 1', ['Profissional'])
  if (existing.rows[0]) return existing.rows[0].id

  const { rows } = await query(
    `INSERT INTO planos (nome, preco_mensal, limite_solicitacoes_mes, ativo)
     VALUES ('Profissional', 129.90, 30, TRUE)
     RETURNING id`
  )
  return rows[0].id
}

async function upsertAdvogado({ nome, email, senha, telefone, cidade, numeroOab, estadoOab, areas, bio, planoId }) {
  const advogadoId = await upsertUsuario({
    nome,
    email,
    senha,
    tipo: 'advogado',
    telefone,
    cidade
  })

  await query(
    `INSERT INTO advogados
       (id, numero_oab, estado_oab, areas_atuacao, bio, verificado, plano_id, telefone, cidade, uf, status_verificacao)
     VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7, $8, $3, 'aprovado')
     ON CONFLICT (id) DO UPDATE
       SET numero_oab = EXCLUDED.numero_oab,
           estado_oab = EXCLUDED.estado_oab,
           areas_atuacao = EXCLUDED.areas_atuacao,
           bio = EXCLUDED.bio,
           verificado = TRUE,
           plano_id = EXCLUDED.plano_id,
           telefone = EXCLUDED.telefone,
           cidade = EXCLUDED.cidade,
           uf = EXCLUDED.uf,
           status_verificacao = 'aprovado'`,
    [advogadoId, numeroOab, estadoOab, areas, bio, planoId, telefone, cidade]
  )

  return advogadoId
}

async function createDemoCase({ cidadaoId, titulo, descricao, renda, area, status, diasAtras = 1 }) {
  const { rows } = await query(
    `INSERT INTO casos
       (cidadao_id, titulo, descricao_problema, renda_aproximada, area_direito, status, criado_em, atualizado_em)
     VALUES ($1, $2, $3, $4, $5, $6, NOW() - ($7 * INTERVAL '1 day'), NOW() - ($7 * INTERVAL '1 day'))
     RETURNING id`,
    [cidadaoId, titulo, descricao, renda, area, status, diasAtras]
  )

  return rows[0].id
}

async function createDemoAnalysis({ casoId, cidadaoId, area, areaDescricao, resumo, score, direitos, passos, documentos, defensoria, confianca }) {
  await query(
    `INSERT INTO analises_ia
       (caso_id, cidadao_id, tipo, area_direito, resumo, orientacao, score_abusividade,
        direitos, proximos_passos, documentos, indicar_defensoria, confianca, resposta_bruta)
     VALUES ($1, $2, 'problema', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      casoId,
      cidadaoId,
      area,
      resumo,
      'Esta análise inicial ajuda a organizar o caso antes de procurar atendimento jurídico.',
      score,
      direitos,
      passos,
      documentos,
      defensoria,
      confianca,
      {
        area_direito: area,
        area_descricao: areaDescricao,
        resumo,
        score_abusividade: score,
        mensagem_acolhimento: 'Esta análise inicial ajuda a organizar o caso antes de procurar atendimento jurídico.',
        direitos,
        proximos_passos: passos,
        documentos_necessarios: documentos,
        indicar_defensoria: defensoria,
        confianca
      }
    ]
  )
}

async function createDemoDocument({ casoId, cidadaoId, nome, observacao, conteudo }) {
  const conteudoBase64 = Buffer.from(conteudo, 'utf8').toString('base64')
  await query(
    `INSERT INTO documentos_casos
       (caso_id, cidadao_id, nome_original, tipo_mime, tamanho_bytes, conteudo_base64, observacao)
     VALUES ($1, $2, $3, 'text/plain', $4, $5, $6)`,
    [casoId, cidadaoId, nome, Buffer.byteLength(conteudo, 'utf8'), conteudoBase64, observacao]
  )
}

async function createDemoSolicitation({ casoId, cidadaoId, advogadoId, status, mensagem, diasAtras = 1, avaliado = false }) {
  const { rows } = await query(
    `INSERT INTO solicitacoes_atendimento
       (caso_id, cidadao_id, advogado_id, status, mensagem, criado_em, atualizado_em)
     VALUES ($1, $2, $3, $4, $5, NOW() - ($6 * INTERVAL '1 day'), NOW() - ($6 * INTERVAL '1 day'))
     RETURNING id`,
    [casoId, cidadaoId, advogadoId, status, mensagem, diasAtras]
  )
  const solicitacaoId = rows[0].id

  await query(
    `INSERT INTO eventos_solicitacoes (solicitacao_id, ator_id, tipo, descricao, metadata, criado_em)
     VALUES ($1, $2, 'solicitacao_criada', 'Solicitação de atendimento enviada ao advogado.', $3, NOW() - ($4 * INTERVAL '1 day'))`,
    [solicitacaoId, cidadaoId, { advogado_id: advogadoId }, diasAtras]
  )

  if (status === 'aceita' || status === 'recusada') {
    await query(
      `INSERT INTO eventos_solicitacoes (solicitacao_id, ator_id, tipo, descricao, metadata, criado_em)
       VALUES ($1, $2, $3, $4, $5, NOW() - (($6 - 0.5) * INTERVAL '1 day'))`,
      [
        solicitacaoId,
        advogadoId,
        status === 'aceita' ? 'solicitacao_aceita' : 'solicitacao_recusada',
        status === 'aceita'
          ? 'Advogado aceitou a solicitação de atendimento.'
          : 'Advogado recusou a solicitação de atendimento.',
        { status },
        diasAtras
      ]
    )
  }

  if (avaliado && status === 'aceita') {
    await query(
      `INSERT INTO avaliacoes (solicitacao_id, cidadao_id, advogado_id, nota, comentario)
       VALUES ($1, $2, $3, 5, 'Atendimento claro e objetivo. Consegui entender quais documentos separar.')
       ON CONFLICT (solicitacao_id) DO UPDATE
         SET nota = EXCLUDED.nota,
             comentario = EXCLUDED.comentario`,
      [solicitacaoId, cidadaoId, advogadoId]
    )
  }

  return solicitacaoId
}

async function seed() {
  const planoId = await ensurePlano()

  const adminId = await upsertUsuario({
    nome: 'Admin',
    email: 'admin@leisimples.com',
    senha: '123456',
    tipo: 'admin',
    telefone: '(53) 99999-0000',
    cidade: 'Pelotas'
  })

  const cidadaoId = await upsertUsuario({
    nome: 'Ana Clara',
    email: 'cidadao@leisimples.com',
    senha: '123456',
    tipo: 'cidadao',
    telefone: '(53) 99999-1111',
    cidade: 'Pelotas'
  })

  await query(
    `INSERT INTO cidadaos (id, cpf, renda_aproximada)
     VALUES ($1, NULL, '1_a_3_salarios')
     ON CONFLICT (id) DO UPDATE
       SET renda_aproximada = EXCLUDED.renda_aproximada`,
    [cidadaoId]
  )

  const advogadoId = await upsertAdvogado({
    nome: 'Dra. Mariana Costa',
    email: 'advogado@leisimples.com',
    senha: '123456',
    telefone: '(53) 99999-2222',
    cidade: 'Pelotas',
    numeroOab: '123456',
    estadoOab: 'RS',
    areas: ['bancario', 'consumidor'],
    bio: 'Especialista em direito bancário e do consumidor, com foco em contratos, cobranças e consignados.',
    planoId
  })

  const advogadoTrabalhistaId = await upsertAdvogado({
    nome: 'Dr. Lucas Mendes',
    email: 'lucas@leisimples.com',
    senha: '123456',
    telefone: '(53) 99999-3333',
    cidade: 'Pelotas',
    numeroOab: '98221',
    estadoOab: 'RS',
    areas: ['trabalhista', 'consumidor'],
    bio: 'Atua com rescisão, FGTS, horas extras e acordos trabalhistas em linguagem simples.',
    planoId
  })

  await upsertAdvogado({
    nome: 'Dra. Helena Rocha',
    email: 'helena@leisimples.com',
    senha: '123456',
    telefone: '(53) 99999-4444',
    cidade: 'Rio Grande',
    numeroOab: '177443',
    estadoOab: 'RS',
    areas: ['familia', 'idoso'],
    bio: 'Acompanha casos de família, idosos, BPC/LOAS e organização de documentos para atendimento.',
    planoId
  })

  const artigos = [
    {
      titulo: 'Como contestar cobrança indevida',
      slug: 'como-contestar-cobranca-indevida',
      area: 'consumidor',
      resumo: 'Passos iniciais para organizar provas e contestar uma cobrança.',
      conteudo: 'Guarde comprovantes, protocolos e mensagens. Procure registrar uma reclamação formal antes de medidas judiciais.'
    },
    {
      titulo: 'Empréstimo consignado: sinais de abuso',
      slug: 'emprestimo-consignado-sinais-de-abuso',
      area: 'bancario',
      resumo: 'Entenda quando descontos e seguros podem ser questionados.',
      conteudo: 'Confira contrato, extrato e autorizações. Cobranças não autorizadas podem ser contestadas.'
    },
    {
      titulo: 'Quais documentos levar ao advogado',
      slug: 'quais-documentos-levar-ao-advogado',
      area: 'orientacao',
      resumo: 'Uma lista simples para chegar ao atendimento com o caso organizado.',
      conteudo: 'Separe documento pessoal, comprovantes, contratos, mensagens, protocolos e uma linha do tempo dos fatos.'
    },
    {
      titulo: 'Direitos do idoso em linguagem simples',
      slug: 'direitos-do-idoso-em-linguagem-simples',
      area: 'idoso',
      resumo: 'Veja quando procurar ajuda em casos de saúde, benefício ou atendimento negado.',
      conteudo: 'O Estatuto do Idoso protege prioridade, informação clara e acesso a serviços essenciais.'
    }
  ]

  for (const artigo of artigos) {
    await query(
      `INSERT INTO artigos (autor_id, titulo, slug, resumo, conteudo, area_direito, publicado)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       ON CONFLICT (slug) DO UPDATE
         SET titulo = EXCLUDED.titulo,
             resumo = EXCLUDED.resumo,
             conteudo = EXCLUDED.conteudo,
             area_direito = EXCLUDED.area_direito,
             publicado = TRUE,
             atualizado_em = NOW()`,
      [adminId, artigo.titulo, artigo.slug, artigo.resumo, artigo.conteudo, artigo.area]
    )
  }

  await query(
    `DELETE FROM avaliacoes
     WHERE cidadao_id = $1
        OR solicitacao_id IN (
          SELECT s.id
          FROM solicitacoes_atendimento s
          INNER JOIN casos c ON c.id = s.caso_id
          WHERE c.cidadao_id = $1
        )`,
    [cidadaoId]
  )
  await query('DELETE FROM casos WHERE cidadao_id = $1', [cidadaoId])

  const casoBancoId = await createDemoCase({
    cidadaoId,
    titulo: '[Demo] Tarifa bancária não reconhecida',
    descricao: 'O banco está cobrando uma tarifa mensal que eu não reconheço no contrato e não sei quais documentos separar.',
    renda: '1_a_3_salarios',
    area: 'consumidor',
    status: 'em_atendimento',
    diasAtras: 5
  })
  await createDemoAnalysis({
    casoId: casoBancoId,
    cidadaoId,
    area: 'consumidor',
    areaDescricao: 'Direito do consumidor e bancário',
    resumo: 'Pode haver cobrança indevida se a tarifa não estiver prevista ou não tiver sido informada claramente.',
    score: 82,
    direitos: [
      'Receber informações claras sobre tarifas e serviços contratados.',
      'Contestar cobranças não reconhecidas ou não autorizadas.',
      'Solicitar devolução de valores pagos indevidamente quando comprovado.'
    ],
    passos: [
      'Separar contrato, extratos e protocolos de atendimento.',
      'Solicitar explicação formal ao banco.',
      'Procurar atendimento jurídico com os documentos organizados.'
    ],
    documentos: ['Contrato bancário', 'Extratos', 'Prints ou protocolos'],
    defensoria: true,
    confianca: 0.82
  })
  await createDemoDocument({
    casoId: casoBancoId,
    cidadaoId,
    nome: 'extrato-demo.txt',
    observacao: 'Documento de exemplo para mostrar upload/download na apresentação.',
    conteudo: 'Extrato demonstrativo: tarifa não reconhecida no valor de R$ 39,90.'
  })
  await createDemoSolicitation({
    casoId: casoBancoId,
    cidadaoId,
    advogadoId,
    status: 'aceita',
    mensagem: 'Gostaria de ajuda para entender se essa tarifa pode ser contestada.',
    diasAtras: 4,
    avaliado: true
  })

  const casoTrabalhistaId = await createDemoCase({
    cidadaoId,
    titulo: '[Demo] Rescisao com valores duvidosos',
    descricao: 'Fui demitida e acho que minha rescisão veio com valores menores do que o combinado.',
    renda: '1_a_3_salarios',
    area: 'trabalhista',
    status: 'aguardando_advogado',
    diasAtras: 2
  })
  await createDemoAnalysis({
    casoId: casoTrabalhistaId,
    cidadaoId,
    area: 'trabalhista',
    areaDescricao: 'Direito trabalhista',
    resumo: 'O caso pode envolver revisão de verbas rescisórias, FGTS e prazos de pagamento.',
    score: 64,
    direitos: [
      'Receber demonstrativo claro das verbas rescisórias.',
      'Conferir saldo de salário, férias, décimo terceiro e FGTS.',
      'Buscar orientação se houver desconto sem justificativa.'
    ],
    passos: [
      'Separar termo de rescisão e holerites.',
      'Conferir extrato do FGTS.',
      'Levar documentos ao atendimento trabalhista.'
    ],
    documentos: ['Termo de rescisão', 'Holerites', 'Extrato do FGTS'],
    defensoria: true,
    confianca: 0.74
  })
  await createDemoSolicitation({
    casoId: casoTrabalhistaId,
    cidadaoId,
    advogadoId,
    status: 'pendente',
    mensagem: 'Preciso conferir os valores da rescisão antes de assinar qualquer acordo.',
    diasAtras: 1
  })

  const casoProdutoId = await createDemoCase({
    cidadaoId,
    titulo: '[Demo] Produto com defeito',
    descricao: 'Comprei um produto que apresentou defeito em poucos dias e a loja não quis trocar.',
    renda: '3_a_6_salarios',
    area: 'consumidor',
    status: 'resolvido',
    diasAtras: 12
  })
  await createDemoAnalysis({
    casoId: casoProdutoId,
    cidadaoId,
    area: 'consumidor',
    areaDescricao: 'Direito do consumidor',
    resumo: 'O consumidor pode pedir reparo, troca ou devolução conforme o problema e os prazos legais.',
    score: 58,
    direitos: [
      'Registrar reclamação e guardar comprovantes.',
      'Solicitar solução dentro do prazo legal.',
      'Buscar Procon ou atendimento jurídico se a loja negar suporte.'
    ],
    passos: [
      'Guardar nota fiscal e conversas com a loja.',
      'Registrar protocolo de atendimento.',
      'Formalizar pedido de troca ou reparo.'
    ],
    documentos: ['Nota fiscal', 'Fotos do defeito', 'Mensagens com a loja'],
    defensoria: false,
    confianca: 0.69
  })
  await createDemoSolicitation({
    casoId: casoProdutoId,
    cidadaoId,
    advogadoId: advogadoTrabalhistaId,
    status: 'recusada',
    mensagem: 'Caso demonstrativo para compor histórico de atendimento.',
    diasAtras: 10
  })

  console.log('Seed concluido.')
  console.log('Contas de teste: admin@leisimples.com / cidadao@leisimples.com / advogado@leisimples.com')
  console.log('Senha de todas: 123456')
}

seed()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
