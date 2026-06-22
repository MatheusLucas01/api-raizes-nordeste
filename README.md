# API Raízes do Nordeste

Sistema de pedidos para a rede de lanchonetes "Raízes do Nordeste" — Projeto Multidisciplinar da UNINTER, trilha Back-End, 2026.

API REST multicanal com autenticação JWT, controle de estoque por unidade, máquina de estados de pedido, processamento de pagamento simulado (mock) e trilha de auditoria.

---

## Stack

- **Linguagem:** TypeScript 5.7
- **Runtime:** Node.js 22
- **Framework:** NestJS 11
- **ORM:** Prisma 7.8 + PostgreSQL
- **Autenticação:** JWT (access + refresh tokens revogáveis) com `passport-jwt`
- **Hash:** bcrypt
- **Validação:** class-validator + class-transformer (mensagens em PT-BR)
- **Documentação:** Swagger/OpenAPI automático em `/docs`

---

## Pré-requisitos

- Node.js 22 ou superior
- npm 10 ou superior
- PostgreSQL 14 ou superior, com banco vazio criado
- Git

---

## Instalação

### 1. Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd api-raizes-nordeste
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo de exemplo e ajuste os valores:

```bash
cp .env.example .env
```

Edite o `.env` preenchendo:

```env
DATABASE_URL="postgresql://USUARIO:SENHA@HOST:PORTA/NOME_BANCO?schema=public"

JWT_SECRET="gere-um-segredo-forte-de-pelo-menos-64-bytes"
JWT_REFRESH_SECRET="gere-outro-segredo-diferente-para-o-refresh"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

PORT=8000
```

Para gerar segredos fortes, rode:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### 4. Criar o schema do banco e aplicar migrations

```bash
npx prisma migrate deploy
```

Em ambiente de desenvolvimento, use:

```bash
npx prisma migrate dev
```

### 5. Popular o banco com dados iniciais (seed)

```bash
npm run seed
```

A seed cria:

- **5 usuários** (um por papel):
  - `admin@raizes.com` / `Admin@123` (ADMIN)
  - `gerente@raizes.com` / `Gerente@123` (MANAGER)
  - `cozinha@raizes.com` / `Cozinha@123` (KITCHEN)
  - `balcao@raizes.com` / `Balcao@123` (ATTENDANT)
  - `cliente@raizes.com` / `Cliente@123` (CLIENT, com 500 pontos de fidelidade)
- **2 unidades** (Recife e Salvador)
- **5 produtos** (Cuscuz com Carne de Sol, Tapioca de Coco, Acarajé, Suco de Cajá, Bolo de Rolo)
- **7 ofertas** (ProductUnit) com preços locais e estoque inicial em cada filial
- **Movimentações** de estoque iniciais (IN) para rastreabilidade

A seed é idempotente — pode ser rodada várias vezes sem duplicar dados.

---

## Como rodar a API

### Modo desenvolvimento (com hot reload)

```bash
npm run start:dev
```

### Modo produção

```bash
npm run build
npm run start:prod
```

A API ficará disponível em `http://localhost:8000`.

---

## Documentação interativa (Swagger)

Com a API em execução, acesse:

```
http://localhost:8000/docs
```

O Swagger UI permite:

- Visualizar todos os endpoints organizados por tag
- Ver os contratos de requisição e resposta com exemplos
- Autenticar via botão "Authorize" (cole o access token sem o prefixo "Bearer")
- Disparar requisições direto da interface

O contrato OpenAPI bruto está em `http://localhost:8000/docs-json`.

---

## Estrutura do repositório

```
api-raizes-nordeste/
├── src/
│   ├── auth/              Módulo de autenticação (login, refresh, guards, decorators)
│   ├── user/              Gestão administrativa de usuários
│   ├── units/             CRUD de filiais
│   ├── products/          CRUD do catálogo global de produtos
│   ├── stock/             Cardápio por unidade (ProductUnit) e movimentações de estoque
│   ├── orders/            Núcleo transacional de pedidos
│   ├── payments/          Processamento de pagamento mock
│   ├── domain/            Regras de negócio puras (DDD-lite)
│   ├── common/            Filtros de exceção e DTOs compartilhados
│   ├── prisma/            PrismaService e PrismaModule
│   └── main.ts            Bootstrap (ValidationPipe global, filtro de erro, Swagger)
├── prisma/
│   ├── schema.prisma      Schema do banco (9 entidades + 5 enums)
│   ├── migrations/        Migrations versionadas
│   └── seed.ts            Script de seed reprodutível
├── docs/
│   ├── postman/           Coleção Postman com 37 cenários de teste
│   └── diagramas/         DER, Casos de Uso, Diagrama de Classes (PNG)
├── .env.example
└── package.json
```

---

## Visão geral dos endpoints

Todas as rotas (exceto `POST /auth/register`, `POST /auth/login` e `POST /auth/refresh`) exigem o header `Authorization: Bearer <access_token>`.

### Autenticação

| Método | Rota | Permissão |
|---|---|---|
| POST | `/auth/register` | Público (cria CLIENT) |
| POST | `/auth/login` | Público |
| POST | `/auth/refresh` | Público (refresh token no body) |
| POST | `/auth/logout` | Autenticado |
| GET | `/auth/me` | Autenticado |

### Usuários (administrativo)

| Método | Rota | Permissão |
|---|---|---|
| POST | `/users` | ADMIN |
| GET | `/users` | ADMIN, MANAGER |
| GET | `/users/:id` | ADMIN, MANAGER |
| DELETE | `/users/:id` | ADMIN |

### Unidades

| Método | Rota | Permissão |
|---|---|---|
| POST | `/units` | ADMIN |
| GET | `/units` | Autenticado |
| GET | `/units/:id` | Autenticado |
| PATCH | `/units/:id` | ADMIN, MANAGER |
| PATCH | `/units/:id/deactivate` | ADMIN |
| PATCH | `/units/:id/activate` | ADMIN |

### Produtos

| Método | Rota | Permissão |
|---|---|---|
| POST | `/products` | ADMIN, MANAGER |
| GET | `/products` | Autenticado |
| GET | `/products/:id` | Autenticado |
| PATCH | `/products/:id` | ADMIN, MANAGER |
| PATCH | `/products/:id/deactivate` | ADMIN, MANAGER |
| PATCH | `/products/:id/activate` | ADMIN, MANAGER |

### Cardápio (ProductUnit)

| Método | Rota | Permissão |
|---|---|---|
| POST | `/units/:unitId/menu` | ADMIN, MANAGER |
| GET | `/units/:unitId/menu` | Autenticado |
| GET | `/units/:unitId/menu/:productId` | Autenticado |
| PATCH | `/units/:unitId/menu/:productId` | ADMIN, MANAGER |
| DELETE | `/units/:unitId/menu/:productId` | ADMIN |

### Movimentações de estoque

| Método | Rota | Permissão |
|---|---|---|
| POST | `/units/:unitId/stock/movements` | ADMIN, MANAGER |
| GET | `/units/:unitId/stock/movements` | ADMIN, MANAGER |

### Pedidos

| Método | Rota | Permissão |
|---|---|---|
| POST | `/pedidos` | Autenticado |
| GET | `/pedidos` | Autenticado (CLIENT vê apenas próprios) |
| GET | `/pedidos/:id` | Autenticado (CLIENT vê apenas próprios) |
| PATCH | `/pedidos/:id/status` | KITCHEN, ATTENDANT, MANAGER, ADMIN |
| POST | `/pedidos/:id/cancel` | Autenticado (CLIENT só cancela próprios em WAITING_PAYMENT) |

### Pagamentos (mock)

| Método | Rota | Permissão |
|---|---|---|
| POST | `/pagamentos/:orderId/process` | Autenticado |
| POST | `/pagamentos/:orderId/retry` | Autenticado |
| GET | `/pagamentos/:orderId` | Autenticado |

---

## Regra do gateway de pagamento mock

O processamento de pagamento é simulado de forma determinística:

- Pagamentos com valor total **menor ou igual a R$ 1.000,00** são **aprovados**.
- Pagamentos com valor total **acima de R$ 1.000,00** são **recusados**.

Em caso de aprovação, dentro da mesma transação:

1. O status do pedido transiciona automaticamente para `IN_PREPARATION`.
2. Uma entrada é registrada em `OrderStatusHistory` (trilha de auditoria).
3. O cliente identificado recebe pontos de fidelidade (1 ponto por R$ 1,00 do total).

Em caso de recusa, o pedido permanece em `WAITING_PAYMENT` e o cliente pode acionar `POST /pagamentos/{orderId}/retry` para criar uma nova tentativa.

---

## Máquina de estados do pedido

```
WAITING_PAYMENT -> IN_PREPARATION | CANCELLED
IN_PREPARATION -> READY | CANCELLED
READY -> DELIVERED | CANCELLED
DELIVERED -> (terminal)
CANCELLED -> (terminal)
```

Transições inválidas (por exemplo, `WAITING_PAYMENT -> DELIVERED`) retornam erro HTTP 409.

---

## Plano de testes (Postman)

A coleção Postman está em `docs/postman/api-raizes-nordeste.postman_collection.json` com 37 cenários organizados em nove pastas:

1. **Setup** — login do admin (preenche `adminAccessToken`)
2. **Auth** — cadastro, login, refresh, me, logout, casos negativos (8 cenários)
3. **Users (Admin)** — acesso restrito por role (1 cenário)
4. **Units** — CRUD com soft delete (4 cenários)
5. **Products** — CRUD com filtros (2 cenários)
6. **Menu** — gestão do cardápio por unidade (3 cenários)
7. **Stock Movements** — entrada e saída com transação atômica (2 cenários)
8. **Orders (Pedidos)** — criação, listagem, transição de status, cancelamento (10 cenários)
9. **Payments (Mock)** — processamento aprovado/recusado, retry, listagem (7 cenários)

Distribuição: **24 cenários positivos + 13 negativos**, superando o mínimo do roteiro (10 cenários, 6 positivos / 4 negativos).

### Como rodar os testes

1. Suba a API: `npm run start:dev`.
2. Garanta que a seed foi rodada: `npm run seed`.
3. Abra o Postman e importe `docs/postman/api-raizes-nordeste.postman_collection.json`.
4. Execute na ordem sugerida:
   - Pasta **Setup** → "Login Admin" (preenche `adminAccessToken`).
   - Pasta **Auth** → T01 (Registro) e T02 (Login) (preenche `accessToken` e `refreshToken`).
   - Demais pastas na ordem listada.
5. Os scripts de teste embarcados em cada requisição validam status codes e payloads automaticamente, e encadeiam variáveis (`unitId`, `productId`, `orderId`, `paidOrderId`, `refusedOrderId`) entre os passos.

Como alternativa, é possível executar a coleção inteira via "Runner" do Postman.

---

## Padrão de erro

Todas as respostas de erro seguem o mesmo formato JSON:

```json
{
  "error": "NOME_DO_ERRO",
  "message": "Mensagem legível em português.",
  "details": [ { "field": "campo", "issue": "problema" } ],
  "timestamp": "2026-06-22T12:00:00.000Z",
  "path": "/rota/que/falhou",
  "requestId": "uuid-v4-de-correlacao"
}
```

Códigos principais:

| HTTP | error |
|---|---|
| 400 | BAD_REQUEST |
| 401 | UNAUTHORIZED |
| 403 | FORBIDDEN |
| 404 | NOT_FOUND |
| 409 | CONFLICT |
| 422 | VALIDATION_ERROR |
| 500 | INTERNAL_ERROR |

---

## Considerações de segurança

- Senhas e refresh tokens são armazenados em hash bcrypt; nunca em texto plano.
- O DTO de resposta exclui explicitamente `passwordHash` e `refreshTokenHash`.
- Logout invalida imediatamente o refresh token armazenado, permitindo revogação ativa.
- Controle de acesso baseado em papéis (RBAC) aplicado em todos os endpoints sensíveis.
- Variáveis sensíveis (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`) ficam no `.env`, que está no `.gitignore`.

---

## LGPD

- O cadastro exige consentimento explícito do titular (`lgpdConsent: true`), validado no DTO.
- A coleta de dados pessoais é minimizada ao necessário para a finalidade do serviço.
- Nenhuma resposta da API ecoa dados sensíveis (senhas, hashes, refresh tokens).
- O histórico de status do pedido (`OrderStatusHistory`) registra o usuário responsável por cada mudança, possibilitando rastreabilidade.

---

## Comandos úteis

```bash
# Compilar TypeScript
npm run build

# Rodar em desenvolvimento (hot reload)
npm run start:dev

# Rodar em produção
npm run start:prod

# Rodar seed do banco
npm run seed

# Aplicar migrations
npx prisma migrate deploy

# Criar nova migration em desenvolvimento
npx prisma migrate dev --name nome_da_migration

# Resetar o banco e reaplicar migrations (CUIDADO: apaga todos os dados)
npx prisma migrate reset --force

# Abrir Prisma Studio (interface visual do banco)
npx prisma studio

# Regenerar o cliente Prisma após mudança no schema
npx prisma generate

# Lint
npm run lint

# Format
npm run format
```

---

## Licença

Trabalho acadêmico desenvolvido como Atividade Prática de Projeto Multidisciplinar — Trilha Back-End — do curso de Análise e Desenvolvimento de Sistemas da UNINTER, primeiro semestre de 2026.
