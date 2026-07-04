# LeiSimples — Frontend Web

Interface web do LeiSimples construída com Vite + React + TailwindCSS.

## Tecnologias

- **React 18** — biblioteca de interface
- **Vite** — bundler rápido
- **TailwindCSS** — estilização utilitária
- **React Router DOM v6** — roteamento
- **Axios** — requisições HTTP
- **Lucide React** — ícones

## Estrutura

```
src/
├── components/
│   └── layout/
│       ├── Topbar.jsx          # Barra de navegação superior
│       └── PrivateRoute.jsx    # Proteção de rotas por tipo de usuário
├── context/
│   └── AuthContext.jsx         # Gerenciamento de autenticação
├── pages/
│   ├── Landing.jsx             # Página inicial pública
│   ├── Login.jsx               # Login do cidadão
│   ├── Cadastro.jsx            # Cadastro (cidadão ou advogado)
│   ├── cidadao/
│   │   ├── PainelCidadao.jsx   # Painel com casos recentes
│   │   ├── Analise.jsx         # Formulário de análise por IA
│   │   ├── Resultado.jsx       # Resultado da análise da IA
│   │   ├── Advogados.jsx       # Lista de advogados parceiros
│   │   └── Confirmacao.jsx     # Confirmação de solicitação
│   ├── advogado/
│   │   ├── LoginAdvogado.jsx   # Login do advogado
│   │   └── PainelAdvogado.jsx  # Painel com solicitações
│   └── admin/
│       └── PainelAdmin.jsx     # Painel administrativo
├── services/
│   └── api.js                  # Axios + todos os serviços da API
├── App.jsx                     # Roteamento principal
├── main.jsx                    # Entry point
└── index.css                   # Estilos globais + Tailwind
```

## Como rodar

### Pré-requisitos
- Node.js 18+
- Backend rodando em `http://localhost:3001`

### Instalação

```bash
npm install
```

### Variáveis de ambiente

```bash
cp .env.example .env
```

O `.env` padrão já aponta para `http://localhost:3001/api`.

### Desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:5173**

### Build para produção

```bash
npm run build
npm run preview
```

## Fluxos de navegação

### Cidadão
```
/ → /login → /painel → /analisar → /resultado → /advogados → /confirmacao
```

### Advogado
```
/advogado/login → /advogado/painel
```

### Admin
```
/login → /admin/painel
```

## Credenciais de teste

Cadastre um usuário via `POST /api/auth/register` com o backend rodando.

Tipos disponíveis: `cidadao`, `advogado`, `admin`
