# Modelo Cypress — Arquitetura de Testes API

Arquitetura pronta para testes automatizados de APIs com Cypress (v10+) e Node.js. Fornece:

- Camada HTTP centralizada (`BaseService`) que encapsula `cy.request()` com headers, Bearer token, logs e tratamento de erros.
- `cy.task` para operações de banco (Postgres/MySQL) usando `pg` / `mysql2`.
- Exemplos de Service Objects, fixtures e testes (smoke, contrato, persistência).
- Integração com Mochawesome e opção para Allure.

---

## Índice

- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração de ambiente (.env)](#configuração-de-ambiente-env)
- [Seed / DB tasks (`cy.task`)](#seed--db-tasks-cytask)
- [Execução dos testes](#execução-dos-testes)
- [Relatórios — Mochawesome (recomendado) e Allure (opcional)](#relatórios---mochawesome-recomendado-e-allure-opcional)
- [BaseService — uso e como estender](#baseservice---uso-e-como-estender)
- [Estrutura do repositório](#estrutura-do-repositório)
- [CI / GitHub Actions (exemplo)](#ci--github-actions-exemplo)
- [Checklist antes de abrir PR](#checklist-antes-de-abrir-pr)

---

## Pré-requisitos

- Node.js LTS (16/18/20)
- npm
- Se for validar persistência em DB: Postgres ou MySQL disponíveis (local, container ou serviço CI)
- (Opcional) `psql` para executar `database/seed.sql` localmente

---

## Instalação

1. Copie o arquivo de variáveis de ambiente:

```powershell
Copy-Item .env.example .env
# Edite .env conforme necessário (DB_URL, CYPRESS_baseUrl, CYPRESS_TOKEN)
```

2. Instale dependências:

```powershell
npm install
```

> Em CI prefira `npm ci` quando `package-lock.json` estiver presente.

---

## Configuração de ambiente (.env)

Exemplo mínimo em `.env`:

```text
CYPRESS_baseUrl=http://localhost:3000
DB_URL=postgres://test:test@localhost:5432/testdb
DB_CLIENT=pg
CYPRESS_TOKEN=
```

- `CYPRESS_baseUrl`: url base da API sob teste.
- `DB_URL`: connection string do banco (Postgres/MySQL).
- `DB_CLIENT`: `pg` ou `mysql`.
- `CYPRESS_TOKEN`: token opcional para autenticação Bearer.

No CI, defina essas variáveis como secrets no repositório (Actions → Secrets).

---

## Seed / DB tasks (`cy.task`)

Este template expõe tasks via `setupNodeEvents` em `cypress.config.js`:

- `cy.task('queryDatabase', { query, values })` — executa query e retorna linhas.
- `cy.task('seedDatabase', { sqlPath })` — carrega e executa um arquivo SQL (ex.: `database/seed.sql`).

Opções para semear o DB:

- Manual (local):

```powershell
psql "postgres://test:test@localhost:5432/testdb" -f database/seed.sql
```

- Via Cypress hook (recomendado, idempotência):

```js
// cypress/e2e/tests/setup.spec.js
before(() => {
	cy.task('seedDatabase', { sqlPath: 'database/seed.sql' });
});

after(() => {
	// opcional teardown
	// cy.task('queryDatabase', { query: 'TRUNCATE TABLE users RESTART IDENTITY CASCADE;' });
});
```

---

## Execução dos testes

- Abrir GUI (para desenvolvimento interativo):

```powershell
npm run cypress:open
```

- Rodar headless (CI/local) com Mochawesome:

```powershell
npm run test:mochawesome
# saída em: reports/mochawesome (html + json)
```

- Executar uma spec específica:

```powershell
npx cypress run --spec "cypress/e2e/tests/users/persistence.spec.js"
```

---

## Relatórios — Mochawesome (recomendado) e Allure (opcional)

Mochawesome:
- Dependências: `mochawesome`, `cypress-multi-reporters` (configuradas no template).
- Script de exemplo:

```json
"test:mochawesome": "cypress run --reporter mochawesome --reporter-options reportDir=reports/mochawesome,overwrite=false,html=true,json=true"
```

- Resultado: arquivos HTML/JSON em `reports/mochawesome`.

Allure (opcional):
- Plugin: `@shelex/cypress-allure-plugin` e `allure-commandline`.
- Uso: plugin escreve `allure-results`; gerar relatório com `allure generate` e abrir com `allure open`.
- Trade-off: Allure fornece relatórios ricos, porém exige instalação adicional no runner.

---

## BaseService — uso e como estender

Responsabilidade do `BaseService`:
- Centralizar chamadas HTTP (`cy.request`) com headers (Content-Type, Authorization Bearer), `failOnStatusCode: false`, logs (`cy.log`) e retorno padrão `{ status, body, headers, duration }`.
- Suportar hook opcional de refresh token.

Como estender:
- Crie Service Objects em `cypress/services/<domain>Service.js` que importem `baseService` e exponham métodos por recurso.

Exemplo (trecho):

```js
const { baseService } = require('../support/baseService');
const USERS_PATH = '/api/users';

module.exports = {
	list(params) { /* baseService.get(`${USERS_PATH}${qs}`) */ },
	get(id) { /* ... */ },
	create(payload) { /* ... */ }
};
```

Boas práticas:
- Service Objects não fazem asserts; retornam dados para os specs.

---

## Estrutura do repositório

- `cypress/services/` — Service Objects (ex.: `usersService.js`)
- `cypress/fixtures/` — fixtures JSON
- `cypress/support/` — `baseService.js`, `commands.js`, `e2e.js`
- `cypress/e2e/tests/` — specs organizadas por domínio
- `cypress.config.js` — tasks (`queryDatabase`, `seedDatabase`) e reporters
- `database/seed.sql` — seed de exemplo
- `.github/workflows/pipeline.yaml` — workflow CI
- `reports/` — saída dos relatórios

---

## CI / GitHub Actions (exemplo)

Recomendações essenciais:
- Use o workflow exemplo em `.github/workflows/pipeline.yaml` (template incluso).
- Exponha serviços (Postgres/MySQL) no job e aguarde a saúde do serviço antes de executar os testes.
- Configure Secrets no repositório: `DB_URL`, `DB_CLIENT`, `CYPRESS_baseUrl`, `CYPRESS_TOKEN`.

Exemplo (GH CLI):

```bash
gh secret set DB_URL --body "postgres://user:pass@host:5432/db"
gh secret set CYPRESS_baseUrl --body "https://staging.api"
```

---

## SQL de exemplo (`database/seed.sql`)

```sql
CREATE TABLE IF NOT EXISTS users (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	email VARCHAR(255) UNIQUE NOT NULL,
	created_at TIMESTAMP DEFAULT now()
);

INSERT INTO users (name, email) VALUES ('Alice Example','alice@example.test') ON CONFLICT DO NOTHING;
```

---

## Checklist antes de abrir PR

- [ ] Testes rodam localmente em `cypress:open` e `test:mochawesome`.
- [ ] Seed/teardown garantem idempotência (via `cy.task`).
- [ ] Service Objects ajustados ao ambiente alvo; sem asserts embutidos.
- [ ] Variáveis sensíveis não estão committed (`.env` no `.gitignore`).

---

## Próximos passos opcionais

Se quiser, eu aplico automaticamente uma das opções:

- **A** — adicionar `cypress/e2e/tests/setup.spec.js` que chama `cy.task('seedDatabase', ...)` antes da suíte;
- **B** — integrar validação de contrato com `chai-json-schema` e exemplo de schema;
- **C** — gerar `docker-compose.yml` com API stub + Postgres para testes locais.

# Modelo Cypress — Arquitetura de Testes API

Arquitetura pronta para testes de API com Cypress (v10+) e Node.js. Inclui:

- `BaseService` para encapsular `cy.request()` (auth/headers/logs/erros).
- `cy.task` para operações com banco (Postgres/MySQL) via `pg`/`mysql2`.
- Exemplos de Service Objects, fixtures e testes (smoke, contract, persistence).
- Integração com Mochawesome e suporte para Allure.

---

## Quickstart (local)

1. Copie variáveis de exemplo:

```powershell
Copy-Item .env.example .env
# edite .env conforme necessário (DB_URL, CYPRESS_baseUrl, CYPRESS_TOKEN)
```

2. Instale dependências:

```powershell
npm install
```

> Em CI prefira `npm ci` quando o `package-lock.json` estiver presente.

3. (Opcional) Seed no banco local:

```powershell
# Usando psql (Postgres)
psql "postgres://test:test@localhost:5432/testdb" -f database/seed.sql
```

4. Rodar Cypress (GUI):

```powershell
npm run cypress:open
```

5. Rodar headless e gerar Mochawesome:

```powershell
npm run test:mochawesome
```

6. Rodar com Allure (opcional):

```powershell
npm i -D @shelex/cypress-allure-plugin allure-commandline
npm run test:allure
npm run allure:serve
```

---

## Estrutura do repositório (paths exatos)

- `cypress/services/` — Service Objects (ex.: `usersService.js`)
- `cypress/fixtures/` — massa estática (JSON)
- `cypress/support/` — comandos e `baseService.js`
- `cypress/e2e/tests/` — testes organizados por domínio
- `cypress.config.js` — tasks para DB e configuração do runner
- `.github/workflows/pipeline.yaml` — CI
- `database/seed.sql` — exemplo de seed
- `reports/` — saída dos relatórios

---

## Como adaptar este template para seu projeto

1. Atualize `CYPRESS_baseUrl` no `.env` ou nas variáveis do CI.
2. Ajuste os Service Objects em `cypress/services/*.js` para os endpoints reais.
3. Se necessário, adicione validação de schema (`ajv` ou `chai-json-schema`).
4. Ajuste `database/seed.sql` para seu schema e use `cy.task('seedDatabase', { sqlPath })` para seed idempotente.
5. Para autenticação, use `cy.setAuthToken(token)` nos hooks ou modifique `_buildHeaders` em `cypress/support/baseService.js`.

---

## Exemplo rápido: seed automático em hooks

Adicione um arquivo `cypress/e2e/tests/setup.spec.js` com:

```js
before(() => {
	cy.task('seedDatabase', { sqlPath: 'database/seed.sql' });
});

after(() => {
	// opcional teardown
	// cy.task('queryDatabase', { query: 'TRUNCATE TABLE users RESTART IDENTITY CASCADE;' });
});
```

---

## CI (GitHub Actions)

- Workflow exemplo: `.github/workflows/pipeline.yaml` — executa testes com um serviço Postgres, faz cache de dependências e publica relatórios (`reports/`, `allure-results/`).
- Defina secrets: `DB_URL`, `DB_CLIENT`, `CYPRESS_baseUrl`, `CYPRESS_TOKEN` no repositório.

---

## SQL de exemplo (veja `database/seed.sql`)

```sql
CREATE TABLE IF NOT EXISTS users (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	email VARCHAR(255) UNIQUE NOT NULL,
	created_at TIMESTAMP DEFAULT now()
);

INSERT INTO users (name, email) VALUES ('Alice Example','alice@example.test') ON CONFLICT DO NOTHING;
```

---

## Dicas rápidas

- Mantenha `Service Objects` sem asserts; deixe asserções nos specs.
- Use `cy.task` para operações de DB (seed/clear) para testes idempotentes.
- Para reprodutibilidade em CI, garanta que o `DB_URL` do serviço do runner seja acessível (ex.: `host.docker.internal` se usar containers).

---

Se quiser, eu adiciono automaticamente o `setup.spec.js` que chama `seedDatabase` antes dos testes (opção recomendada). 


Guia passo-a-passo (para um QA conseguir rodar e adaptar o projeto)

1) Preparar o ambiente local

- Requisitos mínimos:
	- Node.js LTS (16/18/20) instalado
	- npm
	- Para testes que usam Postgres: `psql` (opcional) ou um container Postgres

- Copie o arquivo de exemplo de variáveis de ambiente:

```powershell
Copy-Item .env.example .env
# editar .env conforme necessário (DB_URL, CYPRESS_baseUrl, CYPRESS_TOKEN)
```

Observação: o projeto lê `CYPRESS_baseUrl` e `DB_URL` do ambiente. Em CI use secrets de repositório.

2) Instalar dependências

```powershell
npm install
```

Nota: em ambientes CI prefira `npm ci` quando `package-lock.json` estiver presente e atualizado.

3) Preparar o banco de dados (opcional local)

- Opção A — rodar o SQL de seed manualmente (Postgres):

```powershell
# se psql estiver instalado, por exemplo (ajuste host/port/credentials)
psql "postgres://test:test@localhost:5432/testdb" -f database/seed.sql
```

- Opção B — usar `cy.task` dentro dos hooks de teste (recomendado para idempotência):

No seu spec `before()` ou `beforeEach()` chame:

```js
cy.task('seedDatabase', { sqlPath: 'database/seed.sql' });
```

Isto garante que cada execução do teste pode semear dados conforme necessário.

4) Executar testes (modo GUI)

```powershell
npm run cypress:open
```

Use a interface do Cypress para rodar suites ou specs específicas.

5) Executar testes (modo headless + gerar Mochawesome)

```powershell
npm run test:mochawesome
```

Relatórios HTML/JSON serão salvos em `reports/mochawesome`.

6) Executar com Allure (opcional)

Se quiser usar Allure, instale o plugin compatível e atualize `package.json` (ou re-adicione `@shelex/cypress-allure-plugin`):

```powershell
npm i -D @shelex/cypress-allure-plugin allure-commandline
npm run test:allure
npm run allure:serve
```

Nota: Allure pode requerer instalação extra no runner (ou usar imagem Docker com Allure já disponível).

7) Rodando testes apontando para outro ambiente (temporário no PowerShell)

```powershell
$env:CYPRESS_baseUrl='https://staging.api.company.com'
$env:DB_URL='postgres://user:pass@host:5432/db'
npm run test:mochawesome
```

8) Como adaptar o template para seu projeto (passos práticos)

- Endpoints: abra `cypress/services/*Service.js` e ajuste os caminhos base (`USERS_PATH`) para os seus recursos.
- Headers & Auth: se seu projeto tem outro header de auth, edite `cypress/support/baseService.js` (método `_buildHeaders`) ou use `cy.setAuthToken(token)` nos hooks.
- Schemas: para validação de contrato, instale `chai-json-schema` ou `ajv` e importe os schemas em `cypress/e2e/tests/*`.
- DB: modifique `database/seed.sql` para seu schema; use `cy.task('queryDatabase', { query, values })` para checar persistência.
- Test isolation: sempre use `seedDatabase`/`clearDatabase` via `cy.task` em `beforeEach`/`afterEach` para manter idempotência.

Exemplo de hook que semeia antes da suíte global (cypress/e2e/tests/setup.spec.js):

```js
before(() => {
	cy.task('seedDatabase', { sqlPath: 'database/seed.sql' });
});

after(() => {
	// opcional teardown
	// cy.task('queryDatabase', { query: 'TRUNCATE TABLE users RESTART IDENTITY CASCADE;' });
});
```

9) CI (GitHub Actions) — notas práticas

- O workflow `.github/workflows/pipeline.yaml` já inclui um job básico com Postgres service e upload de artefatos.
- Garanta que as variáveis `DB_URL`, `DB_CLIENT` e `CYPRESS_baseUrl` estejam configuradas nos `env` do job (ou Secrets).
- Se usar Allure, permita instalação do `allure-commandline` no runner ou gere e armazene `allure-results` como artefato.

10) Troubleshooting comum

- Erro `npm ci` relacionado a lockfile: rode `npm install` localmente para gerar `package-lock.json`, em CI use `npm ci` com lockfile atualizado.
- Erro de conexão DB: verifique `DB_URL` e se o serviço do DB está acessível do runner (no Docker use host.docker.internal ou configure network no container).
- Versões de Cypress: este template alvo Cypress v10+; ajuste `cypress.config.js` se migrar para outra major.

11) Dicas para validação de contrato (opcional)

- Instalar libs: `npm i -D chai-json-schema ajv`
- Em um spec:

```js
const chai = require('chai');
const chaiJsonSchema = require('chai-json-schema');
chai.use(chaiJsonSchema);

// usar expect(res.body).to.be.jsonSchema(schema)
```

12) Exemplo rápido de como rodar uma única spec

```powershell
npx cypress run --spec "cypress/e2e/tests/users/persistence.spec.js"
```

13) Como re-adicionar Allure plugin (se desejar)

- Re-adicione a dependência com versão compatível, atualize `cypress.config.js` para requerer o writer e configure `allure-commandline` no runner. Se tiver problemas com versões, verifique a página do plugin para a versão compatível com sua versão do Cypress.

14) Checklist rápido antes de abrir um PR de testes

- [ ] Testes rodam localmente em `cypress:open` e `test:mochawesome`.
- [ ] Seed/teardown garantem idempotência.
- [ ] Serviços e paths foram ajustados para o ambiente alvo.
- [ ] Variáveis sensíveis não estão cometidas no repo (`.env` no .gitignore).

Se quiser, eu posso:
- A: adicionar o hook global `before()` que chama `cy.task('seedDatabase', ...)` automaticamente (recomendado),
- B: adicionar validação JSON Schema com `chai-json-schema` e exemplo de schema, ou
- C: criar um `docker-compose.yml` pronto com API stub + Postgres para testes locais.


Como adaptar este template para outro projeto (passos rápidos):

1. Atualize `CYPRESS_baseUrl` no arquivo `.env` ou nas variáveis do CI para apontar para sua API.
2. Ajuste os paths nos Service Objects em `cypress/services/*.js` para os endpoints reais da sua API.
3. Se necessário instale bibliotecas de schema validation (ex.: `ajv`, `chai-json-schema`) e adicione asserções de contrato nos testes.
4. Configure `DB_URL` e `DB_CLIENT` no `.env`/CI; modifique `database/seed.sql` conforme o schema do seu projeto.
5. Use `cy.task('seedDatabase', { sqlPath: 'database/seed.sql' })` em hooks `before`/`beforeEach` para garantir idempotência.
6. Para autenticação, ajuste `cypress/support/baseService.js` ou utilize `cy.setAuthToken(token)` no `before` do teste.

Exemplo de execução local (passo-a-passo):

```
cp .env.example .env
# editar .env conforme necessário (DB_URL, CYPRESS_baseUrl)
npm ci
# (opcional) seed local DB
# psql $DB_URL -f database/seed.sql
npm run cypress:open   # executar manualmente ou
npm run test:mochawesome # executar headless e gerar relatórios
```

SQL de exemplo (veja `database/seed.sql`):

``sql
-- cria tabela users e insere dados de exemplo
CREATE TABLE IF NOT EXISTS users (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	email VARCHAR(255) UNIQUE NOT NULL,
	created_at TIMESTAMP DEFAULT now()
);

INSERT INTO users (name, email) VALUES ('Alice Example','alice@example.test') ON CONFLICT DO NOTHING;
```

Considerações finais:

- Mantenha `Service Objects` livres de asserts (apenas retornam dados); deixe asserções nos testes.
- Prefira `cy.task` para operações pesadas/DB para manter testes rápidos e isolados.
- Para contratos mais rígidos, adicione validação JSON Schema nas spec files.
#   m o d e l o - c y p r e s s 
 
 