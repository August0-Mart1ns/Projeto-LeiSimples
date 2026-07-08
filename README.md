# LeiSimples

Projeto completo da plataforma LeiSimples, separado por aplicação. Cada parte tem suas próprias dependências, scripts e lockfile.

## Estrutura

```text
backend/      API Node.js + Express + PostgreSQL
frontend/     Web React + Vite + TailwindCSS
ia-service/   Microsserviço Python + Flask + OpenRouter/OpenAI SDK
mobile/       App Expo + React Native
```

## Como rodar localmente

1. Copie os arquivos de ambiente:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
copy mobile\.env.example mobile\.env
copy ia-service\.env.example ia-service\.env
```

2. Suba o banco PostgreSQL:

```bash
docker compose up -d postgres
```

> O Docker Desktop precisa estar aberto para esse comando funcionar no Windows.

3. Instale as dependências de cada app:

```bash
npm install --prefix backend
npm install --prefix frontend
npm install --prefix mobile
```

4. Rode as migrations:

```bash
npm run db:migrate
```

5. Popule dados iniciais de desenvolvimento:

```bash
npm run db:seed
```

6. Rode cada parte em um terminal:

```bash
npm run dev:backend
npm run dev:frontend
npm run dev:mobile
```

7. Para o serviço de IA:

```bash
cd ia-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
flask --app app run --host 0.0.0.0 --port 5001
```

## URLs locais

- Frontend: `http://localhost:5174`
- Backend: `http://localhost:3001/api`
- IA: `http://localhost:5001/health`
- PostgreSQL: `localhost:5432`

Em desenvolvimento, o reset de senha ainda retorna o token na resposta. Em produção, configure `RESEND_API_KEY`, `EMAIL_FROM` e `APP_URL` para envio real por e-mail.
O backend também usa `AI_TIMEOUT_MS` para limitar chamadas ao microsserviço de IA e cair no fallback quando o serviço estiver indisponível. Para IA real, configure `OPENROUTER_API_KEY` no `ia-service/.env`.

## Modo apresentação

Para preparar a demo do sabado:

```bash
npm run demo:up
npm run demo:reset-db
npm run demo:check
npm run demo:web
```

O roteiro completo está em [`docs/ROTEIRO_DEMO_SABADO.md`](docs/ROTEIRO_DEMO_SABADO.md).

## Qualidade

```bash
npm run lint:backend
npm run lint:frontend
npm --prefix mobile run lint
npm run test:backend
npm run build:frontend
```

Para validar o microsserviço de IA:

```bash
ia-service\.venv\Scripts\python -m py_compile ia-service\app.py
```
## Contas de teste

Todas usam a senha `123456`.

- Admin: `admin@leisimples.com`
- Cidadao: `cidadao@leisimples.com`
- Advogado: `advogado@leisimples.com`

## Rotas principais

- `/api/auth`: cadastro, login, usuário logado, perfil e reset de senha.
- `/api/casos`: criacao, listagem, detalhe, status, documentos e encerramento de casos.
- `/api/ia`: análise de texto livre, contratos e consulta de análises salvas.
- `/api/advogados`: listagem, perfil, solicitações e avaliações.
- `/api/solicitações`: detalhe, linha do tempo, aceitar e recusar solicitações.
- `/api/avaliacoes`: avaliação de advogado e listagem pública.
- `/api/artigos`: artigos públicos e administração.
- `/api/admin`: usuários, verificação de advogado, métricas e moderação.
