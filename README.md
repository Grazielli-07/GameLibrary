# GameLibrary API

API REST para cadastro de jogos e gerenciamento de bibliotecas pessoais. Projeto acadêmico desenvolvido com Node.js, Express, PostgreSQL (Neon), Prisma ORM 7.10.0, bcrypt e JWT.

## Requisitos

- Node.js 24 LTS ou Node.js 26.
- Conta e projeto PostgreSQL no Neon.
- Visual Studio Code.

## 1. Instalação

No terminal, dentro da pasta do projeto, execute:

```powershell
npm.cmd install
```

## 2. Configurar o Neon

1. Crie um projeto PostgreSQL no Neon.
2. No painel do projeto, abra **Connect**.
3. Copie a connection string pooled (o host contém `-pooler`) e a direct (sem `-pooler`).
4. Copie o arquivo `.env.example` para um novo arquivo chamado `.env`.
5. Preencha as variáveis:

   - `DATABASE_URL`
   - `DATABASE_URL_UNPOOLED`
   - `JWT_SECRET`
   - `PORT`

6. Não compartilhe o arquivo `.env` nem o envie ao GitHub.

## 3. Gerar o Prisma Client e criar as tabelas

Execute:

```powershell
npx.cmd prisma generate
npx.cmd prisma migrate deploy
```

O arquivo `prisma.config.ts` configura o caminho do schema e a conexão direta utilizada pelo Prisma CLI.

A conexão pooled é utilizada pela API, enquanto a conexão direct é utilizada pelo Prisma nas migrations.

O comando `migrate deploy` aplica as migrations já existentes no projeto.

Durante o desenvolvimento, novas migrations podem ser criadas utilizando:

```powershell
npx.cmd prisma migrate dev --name nome_da_migration
```

## 4. Iniciar a API

Execute:

```powershell
npm.cmd run dev
```

A API estará disponível em:

`http://localhost:3000`

Acesse o endereço pelo navegador. A resposta deverá informar que a GameLibrary API está funcionando.

## 5. Autenticação

O sistema utiliza JWT para autenticação e bcrypt para proteção das senhas.

### Cadastrar usuário

**POST** `/auth/register`

URL:

`http://localhost:3000/auth/register`

Exemplo de JSON:

```json
{
  "name": "Jogador 1",
  "email": "jogador1@email.com",
  "password": "senha12345"
}
```

### Fazer login

**POST** `/auth/login`

URL:

`http://localhost:3000/auth/login`

Exemplo de JSON:

```json
{
  "email": "jogador1@email.com",
  "password": "senha12345"
}
```

Após o login, a API retorna um token JWT.

Copie o campo `token` da resposta. Nas rotas protegidas, configure o cabeçalho:

`Authorization: Bearer SEU_TOKEN`

### Consultar usuário autenticado

**GET** `/auth/me`

URL:

`http://localhost:3000/auth/me`

Retorna os dados do usuário autenticado, sem expor sua senha.

## 6. Rotas da API

Todas as rotas abaixo exigem autenticação JWT, exceto `/auth/register` e `/auth/login`.

### Autenticação

| Método | Rota | Função |
|---|---|---|
| POST | `/auth/register` | Cadastra usuário |
| POST | `/auth/login` | Realiza login |
| GET | `/auth/me` | Consulta usuário autenticado |

### Jogos

| Método | Rota | Função |
|---|---|---|
| GET | `/games` | Lista todos os jogos |
| GET | `/games/:id` | Consulta jogo por ID |
| POST | `/games` | Cadastra jogo |
| PUT | `/games/:id` | Atualiza jogo |
| DELETE | `/games/:id` | Exclui jogo |

### Gêneros

| Método | Rota | Função |
|---|---|---|
| GET | `/genres` | Lista gêneros |
| GET | `/genres/:id` | Consulta gênero por ID |
| POST | `/genres` | Cadastra gênero |
| PUT | `/genres/:id` | Atualiza gênero |
| DELETE | `/genres/:id` | Exclui gênero sem jogos associados |

### Plataformas

| Método | Rota | Função |
|---|---|---|
| GET | `/platforms` | Lista plataformas |
| GET | `/platforms/:id` | Consulta plataforma por ID |
| POST | `/platforms` | Cadastra plataforma |
| PUT | `/platforms/:id` | Atualiza plataforma |
| DELETE | `/platforms/:id` | Exclui plataforma |

### Biblioteca pessoal

| Método | Rota | Função |
|---|---|---|
| GET | `/library` | Lista a biblioteca do usuário |
| POST | `/library/:gameId` | Adiciona jogo à biblioteca |
| DELETE | `/library/:gameId` | Remove jogo da biblioteca |

## 7. Exemplos de utilização

### Cadastrar gênero

**POST** `/genres`

```json
{
  "name": "RPG"
}
```

### Cadastrar plataforma

**POST** `/platforms`

```json
{
  "name": "PC"
}
```

### Cadastrar jogo

**POST** `/games`

```json
{
  "title": "The Witcher 3",
  "description": "RPG de mundo aberto",
  "releaseYear": 2015,
  "genreId": 1,
  "platformIds": [1]
}
```

Os campos `genreId` e `platformIds` devem receber IDs numéricos de gêneros e plataformas previamente cadastrados.

### Adicionar jogo à biblioteca

**POST** `/library/1`

O número `1` representa o ID do jogo.

Não é necessário enviar um corpo JSON. O usuário autenticado será associado automaticamente ao jogo.

### Consultar biblioteca

**GET** `/library`

Retorna os jogos associados ao usuário autenticado, incluindo informações de gênero e plataforma.

### Remover jogo da biblioteca

**DELETE** `/library/1`

Remove o vínculo entre o usuário e o jogo, sem excluir o cadastro geral do jogo.

## 8. Modelagem do banco de dados

O projeto possui seis modelos principais no Prisma:

| Modelo | Descrição |
|---|---|
| `User` | Armazena os usuários e suas credenciais |
| `Game` | Armazena os jogos cadastrados |
| `Genre` | Armazena os gêneros dos jogos |
| `Platform` | Armazena as plataformas disponíveis |
| `UserGame` | Associação N:N entre usuários e jogos |
| `GamePlatform` | Associação N:N entre jogos e plataformas |

### Relacionamentos

- **Genre e Game:** relacionamento 1:N. Um gênero pode estar associado a vários jogos.
- **User e Game:** relacionamento N:N através de `UserGame`. Um usuário pode adicionar vários jogos à sua biblioteca, e um jogo pode estar na biblioteca de vários usuários.
- **Game e Platform:** relacionamento N:N através de `GamePlatform`. Um jogo pode estar disponível em várias plataformas, e uma plataforma pode possuir vários jogos.

As tabelas associativas possuem restrições de unicidade para impedir vínculos duplicados.

O banco também utiliza exclusão em cascata nos relacionamentos configurados com `onDelete: Cascade`.

## 9. Segurança e tratamento de dados

- As senhas são armazenadas utilizando hash bcrypt.
- Os tokens JWT possuem validade de uma hora.
- O middleware verifica o cabeçalho `Authorization: Bearer`.
- As senhas não são retornadas nas respostas da API.
- As rotas de jogos, gêneros, plataformas e biblioteca exigem autenticação.
- Cada usuário pode consultar e modificar apenas os vínculos da própria biblioteca.
- Os jogos, gêneros e plataformas são recursos compartilhados entre os usuários autenticados.
- O arquivo `.env` e a pasta `node_modules` devem permanecer fora do repositório GitHub.
8. Adicionar o jogo à biblioteca em `/library/:gameId`.
9. Consultar `/library` para demonstrar o relacionamento N:N.
10. Consultar `/auth/me` para demonstrar a autenticação do usuário.
11. Remover o jogo da biblioteca e demonstrar que o cadastro geral do jogo permanece.
