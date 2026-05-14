# Instalação com NPM (Windows, Mac e Linux)

Se o `pnpm` não funciona no seu terminal, siga estes passos para usar **npm** em vez disso.

## 🚀 Passo 1: Preparação

Abra o terminal (CMD, PowerShell ou Terminal) na pasta do projeto:

```bash
cd onboarding-portal-v2
```

## 🧹 Passo 2: Limpar Instalação Anterior

Se já tentou instalar antes, limpe os ficheiros antigos:

```bash
# Windows (PowerShell)
Remove-Item -Recurse -Force node_modules
Remove-Item pnpm-lock.yaml

# Mac/Linux
rm -rf node_modules pnpm-lock.yaml
```

## 📦 Passo 3: Instalar Dependências

Execute o comando de instalação:

```bash
npm install --legacy-peer-deps
```

**Nota:** A flag `--legacy-peer-deps` é necessária para resolver conflitos de dependências.

Aguarde até ver a mensagem: `added XXX packages`

## ▶️ Passo 4: Executar o Projeto

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Deverá ver algo como:
```
> onboarding-portal-v2@1.0.0 dev
> cross-env NODE_ENV=development tsx watch server/_core/index.ts

Server running on http://localhost:3000/
```

Abra o navegador em: **http://localhost:3000**

## 📝 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Iniciar servidor (desenvolvimento) |
| `npm run build` | Compilar para produção |
| `npm start` | Iniciar servidor (produção) |
| `npm test` | Executar testes |
| `npm run check` | Verificar tipos TypeScript |
| `npm run format` | Formatar código |

## ⚙️ Configuração de Ambiente

Crie um ficheiro `.env` na raiz do projeto com as variáveis de ambiente:

```env
DATABASE_URL=mysql://user:password@localhost:3306/onboarding
JWT_SECRET=seu_secret_super_seguro_aqui
VITE_APP_ID=seu_app_id_aqui
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
OWNER_OPEN_ID=seu_owner_id
OWNER_NAME=seu_nome
```

## 🐛 Resolução de Problemas

### Erro: "npm: command not found"
- Instale Node.js em https://nodejs.org/
- Reinicie o terminal após a instalação

### Erro: "EACCES: permission denied"
- No Mac/Linux, tente: `sudo npm install --legacy-peer-deps`

### Erro: "Cannot find module"
- Limpe e reinstale: `rm -rf node_modules && npm install --legacy-peer-deps`

### Porta 3000 já em uso
- Altere a porta no `server/_core/index.ts` ou encerre o processo que usa a porta

## ✅ Pronto!

O projeto deve estar funcionando! Aceda a **http://localhost:3000** no seu navegador.

Para mais informações, consulte o ficheiro `README.md` ou `todo.md`.
